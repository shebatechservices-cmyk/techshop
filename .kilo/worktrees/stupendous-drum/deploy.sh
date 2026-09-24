#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
PKG=/tmp/opencode/pack
DOMAIN=sheba-technology.vercel.app

echo "== 1/5 Build =="
npm run build

echo "== 2/5 Commit & push (triggers Render auto-deploy) =="
if ! git diff --quiet HEAD; then
  git add -A
  git commit -m "deploy: $(date +%Y-%m-%dT%H:%M)"
  git push origin main
else
  echo "no local changes to commit; pushing anyway"
  git push origin main
fi

echo "== 3/5 Waiting for Render rebuild (~60s) =="
sleep 60
HASH=$(curl -s https://sheba-technology.onrender.com/ | grep -oE 'index-[A-Za-z0-9_-]+\.js' | head -1 || true)
echo "Render serving: ${HASH:-unknown}"
curl -s -o /dev/null -w "render /api: %{http_code}\n" https://sheba-technology.onrender.com/api

echo "== 4/5 Vercel deploy =="
rm -rf "$PKG"
mkdir -p "$PKG/frontend"
cp -a dist/assets dist/favicon.ico dist/favicon.svg "$PKG/frontend/"
cp dist/index.html vercel.json "$PKG/frontend/"
OUT=$(cd "$PKG" && npx vercel deploy --prod --yes 2>&1)
DEP=$(printf '%s' "$OUT" | grep -oiE 'https://sheba-technology-[a-z0-9]+-13-749a\.vercel\.app' | head -1 || true)
echo "Deployment: ${DEP:-NOT FOUND (see output below)}"
printf '%s\n' "$OUT" | tail -3

if [ -z "${DEP:-}" ]; then
  echo "!! Could not parse deployment URL - alias NOT updated"
  exit 1
fi

echo "== 5/5 Alias + verify =="
(cd "$PKG" && npx vercel alias set "$DEP" "$DOMAIN")
sleep 10
curl -s https://$DOMAIN/ | grep -oE 'index-[A-Za-z0-9_-]+\.js' | head -1 | sed 's/^/vercel serving: /'
curl -s -o /dev/null -w "vercel /api: %{http_code}\n" https://$DOMAIN/api

echo "== DONE =="