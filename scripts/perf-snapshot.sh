#!/usr/bin/env bash
# Prints the transfer weight of a few representative pages, so a performance
# change can be compared before and after with the same numbers
# (docs/architecture/performance.md).
#
# Per page: time to first byte, HTML size (raw and brotli), the RSC payload
# inlined in the HTML, the JS and CSS the page references (brotli, summed per
# page), and how many resources it preloads. A preview URL works as well as
# production, as long as it is not behind Vercel authentication.
#
# Usage: scripts/perf-snapshot.sh [base-url] [locale]
#   scripts/perf-snapshot.sh                       # https://v1cferr.dev, en-us
#   scripts/perf-snapshot.sh https://<preview>.vercel.app
set -euo pipefail

base=${1:-https://v1cferr.dev}
base=${base%/}
locale=${2:-en-us}
routes=("" /about /setup /weblog /weblog/how-this-site-is-built /projects/portfolio-weblog)

work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

# Brotli size of one URL, cached per URL so shared chunks are fetched once.
declare -A asset_size
brotli_size() {
  local url=$1
  if [[ -z ${asset_size[$url]:-} ]]; then
    asset_size[$url]=$(curl -s -H 'accept-encoding: br' "$url" | wc -c)
  fi
  echo "${asset_size[$url]}"
}

printf '%-36s %7s %9s %8s %9s %8s %7s %8s\n' route ttfb html-raw html-br rsc-raw js-br css-br preloads
for route in "${routes[@]}"; do
  url="$base/$locale$route"
  ttfb=$(curl -s -o "$work/page.br" -w '%{time_starttransfer}' -H 'accept-encoding: br' "$url")
  curl -s --compressed -o "$work/page.html" "$url"
  html_br=$(wc -c <"$work/page.br")
  html_raw=$(wc -c <"$work/page.html")

  read -r rsc preloads < <(python3 -I - "$work/page.html" <<'PY'
import re, sys
html = open(sys.argv[1], encoding="utf-8").read()
rsc = sum(len(m) for m in re.findall(r"<script>self\.__next_f\.push\((.*?)\)</script>", html, re.S))
preloads = len(re.findall(r'<link[^>]*rel="preload"', html))
print(rsc, preloads)
PY
)

  js=0 css=0
  while read -r asset; do
    size=$(brotli_size "$base$asset")
    if [[ $asset == *.css ]]; then css=$((css + size)); else js=$((js + size)); fi
  done < <(grep -oE '/_next/static/[^"]+\.(js|css)' "$work/page.html" | sort -u)

  kb() { awk -v b="$1" 'BEGIN { printf "%.0fK", b / 1024 }'; }
  printf '%-36s %6.0fms %9s %8s %9s %8s %7s %8s\n' "/$locale$route" "$(awk -v t="$ttfb" 'BEGIN { print t * 1000 }')" \
    "$(kb "$html_raw")" "$(kb "$html_br")" "$(kb "$rsc")" "$(kb "$js")" "$(kb "$css")" "$preloads"
done
