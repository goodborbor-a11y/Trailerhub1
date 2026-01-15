# Find Your Docker Project Location

Run these commands on your server to find where your Docker project actually is:

```bash
# 1. Check running Docker containers and their working directories
docker ps

# 2. Inspect the backend container to see where it's running from
docker inspect movietrailers-api | grep -i "workdir\|source\|mount" -A 5

# 3. Check all Docker containers
docker ps -a

# 4. Search for docker-compose.yml in common locations
find /root -name "docker-compose.yml" 2>/dev/null
find /home -name "docker-compose.yml" 2>/dev/null
find /opt -name "docker-compose.yml" 2>/dev/null

# 5. Check where Docker volumes are mounted
docker volume ls

# 6. Check if containers are using bind mounts
docker inspect movietrailers-api | grep -A 10 "Mounts"
```

