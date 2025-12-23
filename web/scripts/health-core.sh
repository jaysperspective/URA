#!/usr/bin/env bash
set -euo pipefail

BASE="${1:-http://127.0.0.1:3000}"

PAYLOAD=$'birth_datetime: 1990-01-24 01:39\nas_of_date: 2025-12-22\ntz_offset: -05:00\nlat: 36.585\nlon: -79.395\n'

post() {
  local path="$1"
  curl -sS -X POST "${BASE}${path}" \
    -H "Content-Type: text/plain" \
    --data-binary "${PAYLOAD}"
}

py_extract() {
python3 - <<'PY'
import json, sys
d=json.load(sys.stdin)

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

# core summary (if present)
sumry = g("derived","summary")
if isinstance(sumry, dict):
  print("summary.ascYearLabel:", sumry.get("ascYearLabel"))
  print("summary.lunationLabel:", sumry.get("lunationLabel"))
  print("summary.natal.asc:", sumry.get("natal",{}).get("asc"), sumry.get("natal",{}).get("ascSign"))
  print("summary.asOf.sun:", sumry.get("asOf",{}).get("sun"), sumry.get("asOf",{}).get("sunSign"))
else:
  print("summary:", "MISSING")

# minimal key checks for each route shape
if "ascYear" in d:
  ay = g("ascYear") or {}
  print("ascYear.season/modality:", ay.get("season"), ay.get("modality"))
if "lunation" in d:
  ln = g("lunation") or {}
  print("lunation.phase:", ln.get("phase"), "sep:", ln.get("separation"))

# check a few bodies exist if present
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

echo "== URA Health Check =="
echo "Base: ${BASE}"
echo

echo "-- /api/core --"
post "/api/core" | py_extract
echo

echo "-- /api/asc-year (wrapper) --"
post "/api/asc-year" | py_extract
echo

echo "-- /api/lunation (wrapper) --"
post "/api/lunation" | py_extract
echo

echo "DONE ✅"
