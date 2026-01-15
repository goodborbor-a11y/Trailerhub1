# 🚨 CRITICAL DEPLOYMENT REMINDER

## ⚠️ IMPORTANT: After Every Docker Rebuild

**ALWAYS copy the new build from the container to Nginx directory:**

```bash
docker cp movietrailers-api:/app/dist/. /var/www/movietrailers/
chown -R www-data:www-data /var/www/movietrailers/
```

## Why This Is Needed

- Docker builds the frontend inside the container at `/app/dist/`
- Nginx serves files from `/var/www/movietrailers/`
- **These are separate locations!**
- After rebuilding, the new build is only in the container
- You MUST copy it to the Nginx directory for changes to appear

## Full Deployment Workflow

1. **Upload changed files to server:**
   ```bash
   scp src/pages/SomePage.tsx root@YOUR_SERVER:/root/trailerhub/src/pages/
   scp src/App.tsx root@YOUR_SERVER:/root/trailerhub/src/
   # ... etc
   ```

2. **Rebuild Docker:**
   ```bash
   cd /root/trailerhub
   docker compose down
   docker compose build --no-cache backend
   docker compose up -d
   ```

3. **⚠️ CRITICAL STEP - Copy to Nginx:**
   ```bash
   docker cp movietrailers-api:/app/dist/. /var/www/movietrailers/
   chown -R www-data:www-data /var/www/movietrailers/
   ```

4. **Verify routes are in served files (optional):**
   ```bash
   grep -o 'path:"/your-route"' /var/www/movietrailers/assets/*.js
   ```

5. **Test the website** - Hard refresh browser (Ctrl+F5)

## Quick Reference

**One-liner for steps 2-3:**
```bash
cd /root/trailerhub && docker compose down && docker compose build --no-cache backend && docker compose up -d && docker cp movietrailers-api:/app/dist/. /var/www/movietrailers/ && chown -R www-data:www-data /var/www/movietrailers/
```

---

**Remember: No copy = No changes visible on website!** 🚨

