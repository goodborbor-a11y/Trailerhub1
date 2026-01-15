$VPS_IP = "62.171.149.223"
$DEST = "/root/trailerhub"

Write-Host "Uploading updated files..."
scp server/src/index.ts root@${VPS_IP}:${DEST}/server/src/index.ts
scp src/components/GenreFilter.tsx root@${VPS_IP}:${DEST}/src/components/GenreFilter.tsx
scp src/pages/Index.tsx root@${VPS_IP}:${DEST}/src/pages/Index.tsx
scp src/hooks/useMovies.tsx root@${VPS_IP}:${DEST}/src/hooks/useMovies.tsx
scp src/data/movies.ts root@${VPS_IP}:${DEST}/src/data/movies.ts

Write-Host "Files uploaded successfully."
Write-Host "========================================"
Write-Host "To apply changes, run these/commands on VPS:"
Write-Host "ssh root@${VPS_IP}"
Write-Host "cd ${DEST}"
Write-Host "docker compose down"
Write-Host "docker compose build --no-cache backend"
Write-Host "docker compose up -d"
Write-Host "========================================"
