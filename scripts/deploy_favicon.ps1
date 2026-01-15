$VPS_IP = "62.171.149.223"
$DEST = "/root/trailerhub"

Write-Host "Uploading index.html..."
scp index.html root@${VPS_IP}:${DEST}/index.html

Write-Host "Uploading robots.txt..."
scp public/robots.txt root@${VPS_IP}:${DEST}/public/robots.txt

Write-Host "Uploading favicon.jpg (just in case)..."
scp public/favicon.jpg root@${VPS_IP}:${DEST}/public/favicon.jpg

Write-Host "Files uploaded. Now please SSH into the server and rebuild using:"
Write-Host "ssh root@${VPS_IP}"
Write-Host "cd ${DEST}"
Write-Host "docker compose down"
Write-Host "docker compose build --no-cache backend"
Write-Host "docker compose up -d"
