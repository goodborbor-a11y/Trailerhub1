# Deployment Commands for Your Server

## Correct Commands (Docker Compose V2)

Your server uses Docker Compose V2, which uses `docker compose` (with space) instead of `docker-compose` (with hyphen).

## Step-by-Step Deployment

```bash
# 1. Navigate to project directory
cd /var/www/movietrailers

# 2. Stop the containers
docker compose down

# 3. Rebuild the backend (this compiles TypeScript and builds frontend)
docker compose build --no-cache backend

# 4. Start everything back up
docker compose up -d

# 5. Wait a few seconds for services to start
sleep 5

# 6. Check status
docker compose ps

# 7. Check logs for any errors
docker compose logs backend --tail 50
```

## Quick One-Liner

```bash
cd /var/www/movietrailers && docker compose down && docker compose build --no-cache backend && docker compose up -d && sleep 5 && docker compose logs backend --tail 30
```

## Verify Deployment

```bash
# Check container status
docker compose ps

# Test health endpoint
curl http://localhost:3001/health

# View logs
docker compose logs -f backend
```

## Troubleshooting

```bash
# Restart containers
docker compose restart backend

# View all logs
docker compose logs

# Check if containers are running
docker ps
```

