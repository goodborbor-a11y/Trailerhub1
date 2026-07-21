#!/usr/bin/env bash
# Forced-command entrypoint for TrailerHub's GitHub Actions deployment key.
set -euo pipefail
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

readonly REPO_DIR=/root/trailerhub_repo
readonly APP_DIR=/root/trailerhub
readonly LOCK_FILE=/run/lock/trailerhub-deploy.lock

exec 9>"$LOCK_FILE"
flock -n 9 || { echo "A TrailerHub deployment is already running."; exit 1; }

release_dir=$(mktemp -d /tmp/trailerhub-release.XXXXXX)
trap 'rm -rf "$release_dir"' EXIT

echo "==> Fetching origin/main"
git -C "$REPO_DIR" fetch origin main
git -C "$REPO_DIR" reset --hard origin/main
git -C "$REPO_DIR" archive origin/main | tar -x -C "$release_dir"

echo "==> Updating application source"
# Production configuration and all mutable data remain owned by the VPS.
rsync -a \
  --exclude='.env' \
  --exclude='docker-compose.yml' \
  --exclude='dist/' \
  --exclude='server/data/' \
  --exclude='uploads/' \
  "$release_dir/" "$APP_DIR/"

cd "$APP_DIR"
echo "==> Building the backend image"
docker compose build backend

echo "==> Recreating only the backend"
docker compose up -d --no-deps backend

echo "==> Waiting for health check"
healthy=false
for attempt in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:3001/health >/dev/null; then
    healthy=true
    break
  fi
  sleep 2
done
if [ "$healthy" != true ]; then
  docker compose logs --tail=100 backend
  echo "Backend failed its post-deploy health check."
  exit 1
fi

echo "==> Validating and reloading Nginx"
docker exec movietrailers-nginx nginx -t
docker exec movietrailers-nginx nginx -s reload

echo "==> Deployment complete"
