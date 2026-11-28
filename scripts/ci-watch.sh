#!/usr/bin/env bash
# Streams a GitHub Actions run's progress, one line per event, for an agent's
# live monitor (see "Working agreements" in AGENTS.md): a 0-100% bar, the step
# in progress, an ETA, every step that does not succeed, and the conclusion.
#
# The estimate comes from the median duration of each step over the workflow's
# last successful runs, so it improves as the history grows. Jobs run in
# parallel, so the ETA is that of the slowest job still running.
#
# Usage: scripts/ci-watch.sh <run-id | branch> [interval-seconds]
# With a branch, it watches that branch's latest run of the workflow named in
# $CI_WORKFLOW (default "CI", the one that validates, builds and tests).
set -euo pipefail

target=${1:?usage: ci-watch.sh <run-id | branch> [interval-seconds]}
interval=${2:-20}
history_runs=8

if [[ $target =~ ^[0-9]+$ ]]; then
  run=$target
else
  run=""
  for _ in $(seq 30); do
    run=$(gh run list --branch "$target" --workflow "${CI_WORKFLOW:-CI}" --limit 1 --json databaseId -q '.[0].databaseId' 2>/dev/null || true)
    [[ -n $run ]] && break
    sleep 10
  done
  [[ -n $run ]] || { echo "No run found for $target"; exit 1; }
fi

workflow=$(gh run view "$run" --json workflowName -q .workflowName)

# Median seconds per "job › step" and for the whole run, from recent successful runs.
baseline=$(
  for id in $(gh run list --workflow "$workflow" --status success --limit "$history_runs" --json databaseId -q '.[].databaseId'); do
    gh run view "$id" --json jobs,createdAt,updatedAt 2>/dev/null || true
  done | jq -s '
    def secs($a; $b): (($b | fromdateiso8601) - ($a | fromdateiso8601));
    def median: sort | if length == 0 then null else .[length / 2 | floor] end;
    {
      total: (map(secs(.createdAt; .updatedAt)) | median),
      steps: (
        [.[] | .jobs[] | .name as $job | .steps[]?
          | select(.conclusion == "success" and .startedAt != null and .completedAt != null)
          | {key: "\($job) › \(.name)", value: secs(.startedAt; .completedAt)}]
        | group_by(.key) | map({key: .[0].key, value: (map(.value) | median)}) | from_entries
      )
    }'
)

bar() {
  local percent=$1 width=20 filled out="" i
  filled=$((percent * width / 100))
  for ((i = 0; i < width; i++)); do
    if ((i < filled)); then out+="█"; else out+="░"; fi
  done
  printf '[%s] %3d%%' "$out" "$percent"
}

clock() { printf '%dm%02ds' $(($1 / 60)) $(($1 % 60)); }

echo "$workflow run $run: watching (estimate from the last $history_runs green runs, median $(clock "$(jq -r '.total // 0 | floor' <<<"$baseline")"))"

reported=""
last_line=""
last_emit=0
while true; do
  state=$(gh run view "$run" --json status,conclusion,createdAt,jobs 2>/dev/null || true)
  if [[ -z $state ]]; then sleep "$interval"; continue; fi

  now=$(date +%s)
  # Jobs run in parallel (the end-to-end shards), so the run ends with its
  # slowest job: each job's remaining time is the median of its steps still to
  # run, and the run's is the largest. A job with no history (renamed or new)
  # falls back to the run's median total.
  read -r percent remaining current < <(jq -r --argjson base "$baseline" --argjson now "$now" '
    ($base.total // 1) as $total
    | ($now - (.createdAt | fromdateiso8601)) as $elapsed
    | [.jobs[]
        # The API can briefly report a finished job as queued; one whose steps all ran is done.
        | select(.status != "completed" and ((.steps | length) == 0 or any(.steps[]; .status != "completed")))
        | .name as $job
        | [.steps[]? | . + {key: "\($job) › \(.name)"}] as $steps
        | ($steps | map(select(.status != "completed")) ) as $left
        | ($left | map($base.steps[.key]) | map(select(. != null))) as $known
        | {
            name: $job,
            step: ($left | map(select(.status == "in_progress")) | first | .name // "queued"),
            remaining: (
              # A job with no steps yet, queued after others finished, is a short
              # final one (the ci-ok gate): a few seconds, not a whole run.
              if ($steps | length) == 0 and $elapsed > 60 then 15
              elif ($steps | length) == 0 or ($known | length) == 0 then [$total - $elapsed, 0] | max
              else ($left | map(
                ($base.steps[.key] // 0) as $median
                | if .status == "in_progress" then [$median - ($now - (.startedAt | fromdateiso8601)), 0] | max else $median end
              ) | add // 0)
              end
            )
          }
      ] as $jobs
    | ($jobs | max_by(.remaining)) as $slowest
    | (($slowest.remaining // 0) | floor) as $remaining
    | (if $remaining + $elapsed > 0 then ($elapsed / ($elapsed + $remaining) * 100) | floor else 0 end | [., 99] | min) as $percent
    | (if ($jobs | length) > 1 then " (+\(($jobs | length) - 1) more)" else "" end) as $more
    | "\($percent) \($remaining) \(if $slowest then "\($slowest.name) › \($slowest.step)\($more)" else "queued" end)"
  ' <<<"$state")

  # Steps that did not succeed are reported as they happen.
  failed=$(jq -r '.jobs[] | .name as $job | .steps[]? | select(.status == "completed" and (.conclusion | IN("success", "skipped") | not)) | "✗ \($job) › \(.name): \(.conclusion)"' <<<"$state")
  while IFS= read -r line; do
    [[ -z $line || $reported == *"$line"* ]] && continue
    echo "$line"
    reported+="$line"$'\n'
  done <<<"$failed"

  if [[ $(jq -r .status <<<"$state") == completed ]]; then
    conclusion=$(jq -r .conclusion <<<"$state")
    [[ $conclusion == success ]] && echo "$(bar 100) done: success" || echo "done: $conclusion"
    break
  fi

  # A progress line when the step changes, and at most once a minute otherwise.
  line="$(bar "$percent") ▶ $current · ETA ~$(clock "$remaining") ($(date -d "@$((now + remaining))" +%H:%M))"
  if [[ ${line%%·*} != "${last_line%%·*}" ]] || ((now - last_emit >= 60)); then
    echo "$line"
    last_line=$line
    last_emit=$now
  fi
  sleep "$interval"
done
