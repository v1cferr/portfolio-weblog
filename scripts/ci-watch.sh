#!/usr/bin/env bash
# Streams a GitHub Actions run's progress, one line per event, for an agent's
# live monitor (see "Working agreements" in AGENTS.md): a 0-100% bar, the step
# in progress, an ETA, every step that does not succeed, and the conclusion.
#
# The estimate comes from the median duration of each step over the workflow's
# last successful runs, so it improves as the history grows.
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
  read -r percent remaining current < <(jq -r --argjson base "$baseline" --argjson now "$now" '
    ($base.total // 1) as $total
    | ($now - (.createdAt | fromdateiso8601)) as $elapsed
    | [.jobs[] | .name as $job | .steps[]? | . + {key: "\($job) › \(.name)"}] as $steps
    | ($steps | map(select(.status == "completed") | ($base.steps[.key] // 0)) | add // 0) as $done
    | ($steps | map(select(.status == "in_progress")) | first) as $running
    | (if $running then [($base.steps[$running.key] // 0), ($now - ($running.startedAt | fromdateiso8601))] | min else 0 end) as $partial
    | ([($base.steps | to_entries | map(.value) | add // 1), 1] | max) as $sum
    | ((($done + $partial) / $sum * 100) | floor | [., 99] | min) as $by_steps
    | (($elapsed / $total * 100) | floor | [., 99] | min) as $by_time
    | ([$by_steps, $by_time] | max) as $percent
    | ([$total - $elapsed, 0] | max | floor) as $remaining
    | "\($percent) \($remaining) \($running.key // "queued")"
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
