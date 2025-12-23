#!/usr/bin/env bash
set -euo pipefail

BASE="${1:-http://127.0.0.1:3000}"

PAYLOAD=$'birth_datetime: 1990-01-24 01:39\nas_of_date: 2025-12-22\ntz_offset: -05:00\nlat: 36.585\nlon: -79.395\n'

post_raw() {
  local path="$1"
  # Print status code on the first line, then body after a blank separator line.
  curl -sS -i -X POST "${BASE}${path}" \
    -H "Content-Type: text/plain" \
    --data-binary "${PAYLOAD}"
}

extract_status() {
  # Reads full HTTP response from stdin, prints status code (e.g. 200)
  awk 'BEGIN{code=""} /^HTTP\/[0-9.]+/ {code=$2} END{print code}'
}

extract_body() {
  sed -n '/^\r\{0,1\}$/,$p' | sed '1d'
}

py_extract_json() {
python3 - <<'PY'
import json, sys
raw = sys.stdin.read()
d = json.loads(raw)

def g(*keys, default=None):
  cur=d
  for k in keys:
    if cur is None: return default
    if isinstance(cur, dict) and k in cur:
      cur=cur[k]
    else:
      return default
  return cur

def ok(v): return "OK" if v else "FAIL"

print("ok:", ok(g("ok") is True))

sumry = g("derived","summary")
if isinstance(sumry, dict):
  print("summary.ascYearLabel:", sumry.get("ascYearLabel"))
  print("summary.lunationLabel:", sumry.get("lunationLabel"))
  n = sumry.get("natal", {}) or {}
  a = sumry.get("asOf", {}) or {}
  print("summary.natal.asc:", n.get("asc"), n.get("ascSign"))
  print("summary.natal.mc:", n.get("mc"), n.get("mcSign"))
  print("summary.asOf.sun:", a.get("sun"), a.get("sunSign"))
else:
  print("summary:", "MISSING")

# wrapper shapes
if "ascYear" in d:
  ay = g("ascYear") or {}
  print("ascYear.season/modality:", ay.get("season"), ay.get("modality"))

if "lunation" in d:
  ln = g("lunation") or {}
  print("lunation.phase:", ln.get("phase"), "sep:", ln.get("separation"))

# bodies sanity (core only)
nb = g("natal","bodies", default={})
ab = g("asOf","bodies", default={})
if isinstance(nb, dict) and nb:
  keys = ["sun","moon","mercury","venus","mars","jupiter","saturn","uranus","neptune","pluto","chiron","northNode","southNode"]
  present = [k for k in keys if isinstance(nb.get(k), dict) and isinstance(nb.get(k,{}).get("lon"), (int,float))]
  print("natal bodies:", ",".join(present))
if isinstance(ab, dict) and ab:
  keys = ["sun","moon","mercury","venus","mars"]
  present = [k for k in keys if isinstance(ab.get(k), dict) and isinstance(ab.get(k,{}).get("lon"), (int,float))]
  print("asOf bodies:", ",".join(present))
PY
}

check_route() {
  local path="$1"
  echo "-- ${path} --"

  local full
  full="$(post_raw "${path}")" || {
    echo "curl FAILED for ${path}"
    return 1
  }

  local status body
  status="$(printf "%s" "$full" | extract_status)"
  body="$(printf "%s" "$full" | extract_body)"

  echo "http_status: ${status:-unknown}"

  if [[ -z "${body}" ]]; then
    echo "ERROR: empty body from ${path}"
    echo "---- raw headers (first 30 lines) ----"
    printf "%s" "$full" | head -n 30
    return 1
  fi

  # Only parse JSON if it starts with '{'
  if [[ "${body:0:1}" != "{" ]]; then
    echo "ERROR: non-JSON body from ${path} (showing first 300 chars):"
    echo "${body:0:300}"
    return 1
  fi

  printf "%s" "$body" | py_extract_json
  echo
}

echo "== URA Health Check =="
echo "Base: ${BASE}"
echo

check_route "/api/core"
check_route "/api/asc-year"
check_route "/api/lunation"

echo "DONE ✅"
