# Run Diagnostics on Server

## Step 1: SSH into the Server

From your Windows PowerShell or Command Prompt:

```powershell
ssh root@62.171.149.223
```

Enter your password when prompted.

## Step 2: Once Connected, Run These Commands

After you're logged into the server, run these commands one by one:

### Quick Diagnostic (Copy All at Once)

```bash
cd /root/trailerhub

echo "============================================"
echo "COMPREHENSIVE SERVER DIAGNOSTICS"
echo "============================================"
echo ""

echo "1. BACKEND LOGS"
docker compose logs backend --tail 100 | grep -iE "error|exception|failed" || echo "No errors found"
echo ""

echo "2. NGINX ERRORS"
tail -50 /var/log/nginx/error.log | tail -10
echo ""

echo "3. CONTAINER STATUS"
docker compose ps
echo ""

echo "4. FRONTEND FILES"
test -f /var/www/movietrailers/index.html && echo "✓ index.html exists" || echo "✗ index.html missing"
ls -lah /var/www/movietrailers/assets/ | head -5
echo ""

echo "5. API HEALTH"
curl -s http://localhost:3001/health && echo "✓ Backend healthy" || echo "✗ Backend down"
echo ""

echo "6. SYSTEM RESOURCES"
df -h | grep -E "Filesystem|/dev/"
free -h | grep -E "Mem|Swap"
echo ""

echo "============================================"
echo "DIAGNOSTICS COMPLETE"
echo "============================================"
```

## Or Run Commands Individually

### 1. Check Backend Errors
```bash
cd /root/trailerhub
docker compose logs backend --tail 100 | grep -i error
```

### 2. Check Nginx Errors
```bash
tail -50 /var/log/nginx/error.log
```

### 3. Check Container Status
```bash
cd /root/trailerhub
docker compose ps
```

### 4. Check Frontend Files
```bash
ls -lah /var/www/movietrailers/ | head -20
test -f /var/www/movietrailers/index.html && echo "index.html exists" || echo "index.html missing"
```

### 5. Test API
```bash
curl -s http://localhost:3001/health
curl -H "Accept: application/json" https://trailershub.org/api/movies?limit=1
```

### 6. Check System Resources
```bash
df -h
free -h
```

## Alternative: Run Commands via SSH in One Line

From Windows PowerShell, you can run commands directly via SSH:

```powershell
ssh root@62.171.149.223 "cd /root/trailerhub && docker compose logs backend --tail 100 | grep -i error"
```

```powershell
ssh root@62.171.149.223 "tail -50 /var/log/nginx/error.log"
```

```powershell
ssh root@62.171.149.223 "cd /root/trailerhub && docker compose ps"
```

```powershell
ssh root@62.171.149.223 "ls -lah /var/www/movietrailers/ | head -10"
```

```powershell
ssh root@62.171.149.223 "curl -s http://localhost:3001/health"
```

