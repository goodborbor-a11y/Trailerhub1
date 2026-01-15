# 🚀 VPS Deployment Guide - Movie Trailers App

**Complete beginner-friendly guide to deploy your Movie Trailers site on a VPS**

## ⚠️ IMPORTANT: Frontend Migration Required

**Your frontend currently uses Supabase**, but your backend is ready for self-hosted deployment. You have two options:

### Option A: Migrate Frontend to Custom API (Recommended for VPS)
- Replace Supabase calls with the custom API client (`src/lib/api.ts`)
- This is required for full VPS deployment
- See migration steps below

### Option B: Keep Using Supabase (Easier but requires Supabase account)
- Keep frontend as-is
- Only deploy backend to VPS
- Point frontend to Supabase (hosted service)

**This guide assumes Option A** - migrating to self-hosted backend.

---

## 📋 What You'll Need

1. **VPS Server** (Recommended specs):
   - **Minimum**: 2GB RAM, 20GB storage, 1 CPU core
   - **Recommended**: 4GB RAM, 40GB storage, 2 CPU cores
   - **OS**: Ubuntu 22.04 LTS or Debian 11+ (most VPS providers offer this)
   - **Popular VPS Providers**: DigitalOcean, Linode, Vultr, Hetzner, AWS Lightsail

2. **Domain Name** (Optional but recommended):
   - You can use your VPS IP address, but a domain looks professional
   - Popular registrars: Namecheap, Cloudflare, Google Domains

3. **Basic Terminal Knowledge**:
   - You'll need to run commands in a terminal/SSH client
   - Windows: Use PowerShell or PuTTY
   - Mac/Linux: Use built-in Terminal

---

## 🎯 Quick Start (Docker Method - Easiest!)

This is the **easiest method** - everything runs in containers. Perfect for beginners!

### Step 1: Connect to Your VPS

1. **Get your VPS details** from your provider:
   - IP Address (e.g., `123.45.67.89`)
   - Root password or SSH key

2. **Connect via SSH**:
   ```bash
   # Windows (PowerShell) or Mac/Linux (Terminal)
   ssh root@YOUR_VPS_IP
   # Or if you have a username:
   ssh username@YOUR_VPS_IP
   ```

3. **Update your server**:
   ```bash
   apt update && apt upgrade -y
   ```

### Step 2: Install Docker & Docker Compose

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version
```

### Step 3: Upload Your Project Files

**Option A: Using Git (Recommended)**
```bash
# Install Git
apt install git -y

# Clone your project (if you have it on GitHub/GitLab)
git clone YOUR_REPO_URL
cd trailerhub  # or whatever your project folder is called
```

**Option B: Using SCP (File Transfer)**
```bash
# On your LOCAL computer (not VPS), run:
# Windows PowerShell:
scp -r C:\trailerhub\* root@YOUR_VPS_IP:/root/trailerhub/

# Mac/Linux:
scp -r ~/trailerhub/* root@YOUR_VPS_IP:/root/trailerhub/
```

Then on your VPS:
```bash
cd /root/trailerhub
```

### Step 4: Create Environment File

Create a `.env` file in your project root:

```bash
nano .env
```

Paste this content (adjust the values):

```env
# Database Configuration
POSTGRES_USER=movieapp
POSTGRES_PASSWORD=CHANGE_THIS_TO_A_STRONG_PASSWORD
POSTGRES_DB=movietrailers

# JWT Secret (generate a random string - at least 32 characters)
JWT_SECRET=YOUR_SUPER_SECRET_JWT_KEY_CHANGE_THIS_MIN_32_CHARACTERS_LONG

# Frontend URL (your domain or IP)
FRONTEND_URL=http://YOUR_DOMAIN_OR_IP

# Optional: TMDB API Key (if you use TMDB features)
TMDB_API_KEY=your_tmdb_api_key_here

# Node Environment
NODE_ENV=production
```

**Save and exit**: Press `Ctrl+X`, then `Y`, then `Enter`

**Generate a secure JWT secret**:
```bash
openssl rand -base64 32
```
Copy the output and use it as your `JWT_SECRET`.

### Step 5: Build and Start Everything

```bash
# Build the frontend and start all services
docker compose up -d --build

# Check if everything is running
docker compose ps

# View logs (to see if there are any errors)
docker compose logs -f
```

**Wait 1-2 minutes** for everything to start. You should see:
- ✅ `movietrailers-db` (PostgreSQL)
- ✅ `movietrailers-api` (Backend API)

### Step 6: Set Up Nginx (Reverse Proxy)

Install Nginx:
```bash
apt install nginx -y
```

Create Nginx configuration:
```bash
nano /etc/nginx/sites-available/movietrailers
```

Paste this (replace `YOUR_DOMAIN_OR_IP` with your actual domain or IP):

```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;

    # Frontend static files (we'll serve from Docker volume later)
    root /var/www/movietrailers;
    index index.html;

    # API proxy
    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Auth endpoints
    location /auth/ {
        proxy_pass http://localhost:3001/auth/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Movies, watchlist, ratings endpoints
    location ~ ^/(movies|watchlist|ratings|categories|upload|health)/ {
        proxy_pass http://localhost:3001$request_uri;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Uploaded files
    location /uploads/ {
        alias /var/www/uploads/;
        expires 30d;
    }

    # SPA routing - serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Enable the site:
```bash
ln -s /etc/nginx/sites-available/movietrailers /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t  # Test configuration
systemctl reload nginx
```

### Step 7: Copy Frontend Files

The Docker build creates the frontend, but we need to serve it via Nginx:

```bash
# Create directory
mkdir -p /var/www/movietrailers

# Copy built files from Docker container
docker cp movietrailers-api:/app/dist/. /var/www/movietrailers/

# Set permissions
chown -R www-data:www-data /var/www/movietrailers
```

**Note**: After rebuilding, you'll need to copy files again. We'll automate this later.

### Step 8: Set Up SSL (HTTPS) - Optional but Recommended

Install Certbot:
```bash
apt install certbot python3-certbot-nginx -y
```

Get SSL certificate:
```bash
# If you have a domain:
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow the prompts:
# - Enter your email
# - Agree to terms
# - Choose whether to redirect HTTP to HTTPS (recommended: Yes)
```

**If you don't have a domain**, you can skip SSL for now, but your site will only work on HTTP.

### Step 9: Update Frontend Environment Variable

The frontend needs to know where the API is. We need to rebuild with the correct API URL:

1. **Create a `.env` file in the project root** (if not already created):
```bash
nano .env
```

Add this line:
```env
VITE_API_URL=http://YOUR_DOMAIN_OR_IP
# Or if using HTTPS:
VITE_API_URL=https://YOUR_DOMAIN_OR_IP
```

2. **Rebuild the frontend**:
```bash
# Stop containers
docker compose down

# Rebuild with new environment variable
docker compose up -d --build

# Copy frontend files again
docker cp movietrailers-api:/app/dist/. /var/www/movietrailers/
```

### Step 10: Test Your Site!

1. **Open your browser** and go to:
   - `http://YOUR_VPS_IP` (if no domain)
   - `https://yourdomain.com` (if you set up SSL)

2. **Check the API**:
   - Visit: `http://YOUR_VPS_IP/api/health`
   - Should return: `{"status":"healthy","database":"connected"}`

3. **Test the frontend**:
   - Try signing up a new user
   - Browse movies
   - Add to watchlist

---

## 🔧 Troubleshooting

### Problem: Can't connect to the site

**Check if services are running**:
```bash
docker compose ps
```

**Check logs**:
```bash
docker compose logs backend
docker compose logs postgres
```

**Check Nginx**:
```bash
systemctl status nginx
nginx -t
```

### Problem: Database connection errors

**Check database is running**:
```bash
docker compose logs postgres
```

**Test database connection**:
```bash
docker exec -it movietrailers-db psql -U movieapp -d movietrailers -c "SELECT 1;"
```

### Problem: Frontend shows "Network error" or can't connect to API

1. **Check API is running**:
   ```bash
   curl http://localhost:3001/health
   ```

2. **Check environment variables**:
   ```bash
   docker compose exec backend env | grep VITE_API_URL
   ```

3. **Check Nginx proxy**:
   ```bash
   curl http://localhost/api/health
   ```

### Problem: 502 Bad Gateway

This usually means Nginx can't reach the backend:

```bash
# Check if backend is running
docker compose ps backend

# Check backend logs
docker compose logs backend

# Test backend directly
curl http://localhost:3001/health
```

### Problem: Files not uploading

**Check uploads directory permissions**:
```bash
docker compose exec backend ls -la /var/www/uploads
```

**Fix permissions**:
```bash
docker compose exec backend chmod 777 /var/www/uploads
```

---

## 🔄 Updating Your Site

When you make changes to your code:

1. **Upload new files** to your VPS (via Git pull or SCP)

2. **Rebuild and restart**:
   ```bash
   cd /root/trailerhub  # or wherever your project is
   docker compose down
   docker compose up -d --build
   docker cp movietrailers-api:/app/dist/. /var/www/movietrailers/
   ```

3. **Clear browser cache** and test

---

## 🔒 Security Checklist

Before going live, make sure:

- [ ] Changed default database password
- [ ] Set a strong JWT_SECRET (32+ characters)
- [ ] Set up SSL/HTTPS (if using domain)
- [ ] Firewall configured (only allow ports 80, 443, 22)
- [ ] Regular backups set up
- [ ] Updated all default passwords

**Set up firewall**:
```bash
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw enable
```

---

## 📊 Monitoring & Maintenance

### View Logs
```bash
# All services
docker compose logs -f

# Just backend
docker compose logs -f backend

# Just database
docker compose logs -f postgres
```

### Restart Services
```bash
docker compose restart
# Or restart specific service:
docker compose restart backend
```

### Backup Database
```bash
# Create backup
docker compose exec postgres pg_dump -U movieapp movietrailers > backup_$(date +%Y%m%d).sql

# Restore backup
docker compose exec -T postgres psql -U movieapp movietrailers < backup_20240101.sql
```

### Check Resource Usage
```bash
docker stats
```

---

## 🎉 You're Done!

Your Movie Trailers site should now be live! 

**Next Steps**:
1. Create your first admin user (you'll need to do this via database or add an admin creation endpoint)
2. Add movies through the admin panel
3. Share your site with the world!

**Need Help?**
- Check the logs: `docker compose logs -f`
- Review this guide again
- Check the main `DEPLOYMENT.md` for more advanced options

---

## 📝 Quick Reference Commands

```bash
# Start everything
docker compose up -d

# Stop everything
docker compose down

# View logs
docker compose logs -f

# Rebuild after changes
docker compose up -d --build

# Restart a service
docker compose restart backend

# Access database
docker compose exec postgres psql -U movieapp -d movietrailers

# Copy frontend files
docker cp movietrailers-api:/app/dist/. /var/www/movietrailers/

# Check status
docker compose ps
```

---

**Good luck with your deployment! 🚀**

