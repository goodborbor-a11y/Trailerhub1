$VPS_IP = "62.171.149.223"
$DEST = "/var/www/movietrailers"

Write-Host "1. Uploading modified backend logic (Errors will now be thrown)..."
scp server/src/index.ts root@${VPS_IP}:${DEST}/server/src/index.ts

Write-Host "2. Fixing server-side permissions (Granting ownership to nodejs user)..."
# We fix ownership of the entire data directory so the nodejs user (UID 1001) can write to it
ssh root@${VPS_IP} "chown -R 1001:1001 ${DEST}/server/data"

Write-Host "3. Rebuilding Backend to apply changes..."
ssh root@${VPS_IP} "cd ${DEST} && docker compose down && docker compose build --no-cache backend && docker compose up -d"

Write-Host "============================================="
Write-Host "DONE! Comments should now persist correctly."
Write-Host "If you see a Red Error Toast in the UI, that means saving failed (which is better than silent failure)."
Write-Host "But with the permission fix, it should just WORK."
Write-Host "============================================="
