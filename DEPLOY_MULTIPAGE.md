# Deploy Multi-Page Update

## Step 1: Upload Files to Server

Run these commands from your local machine (PowerShell in `C:\trailerhub`):

```powershell
# Upload new page files
scp src\pages\Movies.tsx root@62.171.149.223:/root/trailerhub/src/pages/
scp src\pages\Upcoming.tsx root@62.171.149.223:/root/trailerhub/src/pages/
scp src\pages\Trending.tsx root@62.171.149.223:/root/trailerhub/src/pages/
scp src\pages\Categories.tsx root@62.171.149.223:/root/trailerhub/src/pages/

# Upload updated files
scp src\pages\Index.tsx root@62.171.149.223:/root/trailerhub/src/pages/
scp src\App.tsx root@62.171.149.223:/root/trailerhub/src/
scp src\components\Header.tsx root@62.171.149.223:/root/trailerhub/src/components/
```

## Step 2: Rebuild and Restart on Server

SSH into your server and run:

```bash
cd /root/trailerhub
docker compose down
docker compose build --no-cache backend
docker compose up -d
sleep 5
docker compose logs backend --tail 30
```

## Quick One-Liner (if you prefer)

On server:
```bash
cd /root/trailerhub && docker compose down && docker compose build --no-cache backend && docker compose up -d && sleep 5 && docker compose logs backend --tail 30
```

