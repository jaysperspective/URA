#!/usr/bin/env bash
set -euo pipefail

BASE="${1:-http://127.0.0.1:3000}"

PAYLOAD=$'birth_datetime: 1990-01-24 01:39\nas_of_date: 2025-12-22\ntz_offset: -05:00\nlat: 36.585\nlon: -79.395\n'

py_extract_json() {
  python3 -c '
import json, sys
raw = sys.stdin.read().strip()
if not raw:
    print("ERROR: empty JSON body")
    sys.exit(1)

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

# summary exists only on /api/core
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
    # only warn if this looks like a core payload
    if isinstance(g("derived"), dict):
        print("summary:", "MISSING (core regression?)")


if "ascYear" in d:
    ay = g("ascYear") or {}
    print("ascYear.season/modality:", ay.get("season"), ay.get("modality"))

if "lunation" in d:
    ln = g("lunation") or {}
    print("lunation.phase:", ln.get("phase"), "sep:", ln.get("separation"))

nb = g("natal","bodies", default={})
ab = g("asOf","bodies", default={})
if isinstance(nb, dict) and nb:
    keys = ["sun","moon","mercury","venus","mars","jupiter","saturn","uranus","neptune","pluto","chiron","northNode","southNode"]
    present = [k for k in keys if isinstance(nb.get(k), dict) and isinstance((nb.get(k) or {}).get("lon"), (int,float))]
    print("natal bodies:", ",".join(present))
if isinstance(ab, dict) and ab:
    keys = ["sun","moon","mercury","venus","mars"]
    present = [k for k in keys if isinstance(ab.get(k), dict) and isinstance((ab.get(k) or {}).get("lon"), (int,float))]
    print("asOf bodies:", ",".join(present))
'
}


check_route() {
  local path="$1"
  echo "-- ${path} --"

  local tmpdir hdr body code ct
  tmpdir="$(mktemp -d)"
  hdr="${tmpdir}/hdr.txt"
  body="${tmpdir}/body.txt"

  # -D writes headers to file; body goes to file
  # -w prints status code only
  code="$(curl -sS -D "${hdr}" -o "${body}" -w "%{http_code}" \
    -X POST "${BASE}${path}" \
    -H "Content-Type: text/plain" \
    --data-binary "${PAYLOAD}" || true)"

  echo "http_status: ${code:-unknown}"

  if [[ -z "${code}" || "${code}" == "000" ]]; then
    echo "ERROR: curl failed (status 000). Check server/port."
    echo "---- curl headers ----"
    cat "${hdr}" 2>/dev/null || true
    rm -rf "${tmpdir}"
    return 1
  fi

  # Content-Type from headers (if present)
  ct="$(grep -i '^content-type:' "${hdr}" | tail -n 1 | tr -d '\r' | cut -d':' -f2- | xargs || true)"
  if [[ -n "${ct}" ]]; then
    echo "content_type: ${ct}"
  fi

  if [[ ! -s "${body}" ]]; then
    echo "ERROR: empty body from ${path}"
    echo "---- raw headers (first 40 lines) ----"
    head -n 40 "${hdr}" | sed 's/\r$//'
    rm -rf "${tmpdir}"
    return 1
  fi

  # If response isn't JSON, show a snippet
  local first
  first="$(head -c 1 "${body}" || true)"
  if [[ "${first}" != "{" ]]; then
    echo "ERROR: non-JSON body from ${path} (first 400 chars):"
    head -c 400 "${body}" || true
    rm -rf "${tmpdir}"
    return 1
  fi

  cat "${body}" | py_extract_json
  echo

  rm -rf "${tmpdir}"
}

echo "== URA Health Check =="
echo "Base: ${BASE}"
echo

check_route "/api/core"
check_route "/api/asc-year"
check_route "/api/lunation"

echo "DONE ✅"
