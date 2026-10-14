#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

LIVE_DOMAIN="https://sdb.shebatechnologybd.com"
RENDER_URL="https://sheba-technology.onrender.com"

echo "== 1/3 Build Frontend =="
npm run build

echo "== 2/3 Commit & push (triggers Render auto-deploy) =="
if ! git diff --quiet HEAD; then
  git add -A
  git commit -m "deploy: $(date +%Y-%m-%dT%H:%M)"
  git push origin main
else
  echo "No uncommitted git changes. Pushing existing commits..."
  git push origin main
fi

echo "== 3/3 Verifying Live Deployment =="
echo "Waiting 30s for Render to initiate deployment..."
sleep 30

echo "Checking Render API status..."
curl -s -o /dev/null -w "Render /api HTTP status: %{http_code}\n" "$RENDER_URL/api" || true

echo "Checking Cloudflare Live Domain ($LIVE_DOMAIN)..."
curl -s -o /dev/null -w "Live Domain HTTP status: %{http_code}\n" "$LIVE_DOMAIN" || true

echo "== DONE (Render & Cloudflare Deployment Triggered) =="