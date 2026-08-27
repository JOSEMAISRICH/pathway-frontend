#!/usr/bin/env bash
# Smoke test PathWay (requiere Express :3000 y Next :5500).
# Uso: bash scripts/smoke-flow.sh

set -e
BASE="${BASE_URL:-http://localhost:5500}"
COOKIE="/tmp/pw_smoke_cookies.txt"
EMAIL="smoke-$(date +%s)@test.local"
PASS="SmokeTest123!"
PHONE="+34600999888"

echo "→ Base: $BASE"
rm -f "$COOKIE"

echo "→ Registro agencia…"
curl -sf -c "$COOKIE" -b "$COOKIE" -X POST "$BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Smoke Test\",\"email\":\"$EMAIL\",\"password\":\"$PASS\"}" >/dev/null

echo "→ Login…"
curl -sf -c "$COOKIE" -b "$COOKIE" -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}" >/dev/null

echo "→ Crear expediente…"
CASE_JSON=$(curl -sf -b "$COOKIE" -X POST "$BASE/api/cases" \
  -H "Content-Type: application/json" \
  -d "{\"clientName\":\"Cliente Smoke\",\"clientEmail\":\"cliente@test.local\",\"clientPhone\":\"$PHONE\"}")
CASE_ID=$(echo "$CASE_JSON" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const j=JSON.parse(d);console.log(j.case?.id||j.id)})")
TOKEN=$(echo "$CASE_JSON" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const j=JSON.parse(d);console.log(j.case?.magicToken||j.magicToken||'')})")
DOCS=$(echo "$CASE_JSON" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const j=JSON.parse(d);console.log((j.case?.documents||[]).length)})")

echo "   caseId=$CASE_ID token=${TOKEN:0:8}… docs=$DOCS"

if [ "$DOCS" -lt 3 ]; then
  echo "⚠ Esperaba ≥3 documentos, got $DOCS"
fi

echo "→ GET magic portal…"
MAGIC=$(curl -sf "$BASE/api/magic/$TOKEN")
PROGRESS=$(echo "$MAGIC" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).case.progress))")
echo "   progress=$PROGRESS"

echo "→ GET case detail…"
curl -sf -b "$COOKIE" "$BASE/api/cases/$CASE_ID" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const c=JSON.parse(d).case;console.log('   magicExpiresAt=',c.magicExpiresAt,'progress=',c.progress)})"

echo "✅ Smoke OK — portal: $BASE/portal/$TOKEN"
echo "   dashboard: $BASE/dashboard/cases/$CASE_ID"
