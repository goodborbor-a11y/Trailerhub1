#!/bin/bash
# TMDB Auto-Import cron wrapper
#
# Cron setup (run daily at 3 AM):
#   0 3 * * * /root/trailerhub/scripts/tmdb-auto-import.sh >> /var/log/tmdb-auto-import.log 2>&1
#
# Manual run:
#   bash /root/trailerhub/scripts/tmdb-auto-import.sh
#
# Override defaults via env:
#   IMPORT_DRY_RUN=true bash /root/trailerhub/scripts/tmdb-auto-import.sh
#   IMPORT_DAYS=14 IMPORT_PAGES=5 bash /root/trailerhub/scripts/tmdb-auto-import.sh

set -e

PROJECT_DIR="/root/trailerhub"

echo "=========================================="
echo "  TMDB Auto-Import — $(date)"
echo "=========================================="

cd "$PROJECT_DIR/server"

export DATABASE_URL="postgresql://movieapp:Qscvpknb2765ln078UIDE@localhost:5432/movietrailers"
export TMDB_API_KEY="$(grep TMDB_API_KEY "$PROJECT_DIR/.env" | cut -d'"' -f2)"
export PATH="/usr/local/bin:/usr/bin:$PATH"

# Defaults (override via IMPORT_DAYS, IMPORT_PAGES, IMPORT_DRY_RUN, IMPORT_FUTURE_WINDOW env vars)
export IMPORT_DAYS="${IMPORT_DAYS:-7}"
export IMPORT_PAGES="${IMPORT_PAGES:-3}"

node -e "require('ts-node').register(); require('./src/tmdb-auto-import.ts')"

echo "Done at $(date)"
