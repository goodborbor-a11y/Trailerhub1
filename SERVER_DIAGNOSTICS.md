# Server Diagnostics Commands

Run these commands on the server to check for errors and diagnose issues:

## 1. Check Backend Error Logs

```bash
# Recent backend errors
docker compose logs backend --tail 100 | grep -i error

# All backend logs (last 50 lines)
docker compose logs backend --tail 50

# Backend logs with timestamps
docker compose logs backend --tail 100 --timestamps

# Check for specific error patterns
docker compose logs backend --tail 200 | grep -i "error\|exception\|failed\|404\|500"
```

## 2. Check Nginx Error Logs

```bash
# Nginx error log
tail -50 /var/log/nginx/error.log

# Nginx access log (check for 404s, 500s)
tail -100 /var/log/nginx/access.log | grep -E "404|500|403"

# Check Nginx configuration
nginx -t

# Check Nginx status
systemctl status nginx
```

## 3. Check Docker Container Status

```bash
# Container status
docker compose ps

# Container resource usage
docker stats --no-stream

# Check if containers are healthy
docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
```

## 4. Check Frontend Build Files

```bash
# Verify frontend files are deployed
ls -lah /var/www/movietrailers/ | head -20

# Check if index.html exists
test -f /var/www/movietrailers/index.html && echo "index.html exists" || echo "index.html missing"

# Check asset files
ls -lah /var/www/movietrailers/assets/ | head -10

# Check file permissions
ls -la /var/www/movietrailers/ | head -10
```

## 5. Test API Endpoints

```bash
# Test backend health (from server)
curl -s http://localhost:3001/health || echo "Backend not responding"

# Test API endpoint through Nginx
curl -H "Accept: application/json" https://trailershub.org/api/movies?limit=1

# Test admin endpoint (should return auth error, not 404)
curl -H "Accept: application/json" https://trailershub.org/api/admin/stats
```

## 6. Check System Resources

```bash
# Disk space
df -h

# Memory usage
free -h

# CPU usage
top -bn1 | head -20
```

## 7. Check Network Connectivity

```bash
# Test if backend is accessible
curl -v http://localhost:3001/health

# Test if Nginx can reach backend
curl -v http://127.0.0.1:3001/health
```

## 8. Browser Console Diagnostics

Open browser DevTools (F12) and check:

1. **Console tab**: Look for errors related to:
   - `[TrailerModal]` logs
   - YouTube iframe errors
   - Network errors (404, 500)
   - CORS errors

2. **Network tab**: Check for:
   - Failed requests (red entries)
   - YouTube embed URLs returning 404
   - API requests returning HTML instead of JSON

3. **Elements tab**: Inspect the modal overlay:
   - Check z-index values
   - Check if loading overlay is visible when it shouldn't be
   - Check iframe visibility and opacity

## 9. Video Modal Specific Diagnostics

In browser console, run:

```javascript
// Check if modal is mounted
document.querySelector('[role="dialog"]')

// Check iframe state
const iframe = document.querySelector('iframe[title*="trailer"]');
console.log('Iframe:', iframe);
console.log('Iframe src:', iframe?.src);
console.log('Iframe loaded:', iframe?.complete);

// Check overlay visibility
const loadingOverlay = document.querySelector('.bg-black\\/50');
console.log('Loading overlay:', loadingOverlay);
console.log('Loading overlay visible:', loadingOverlay?.offsetParent !== null);
```

## 10. Check Recent Changes

```bash
# Check when files were last modified
find /var/www/movietrailers -type f -mtime -1 -ls

# Check Docker image build time
docker images trailerhub-backend:latest --format "{{.CreatedAt}}"
```

