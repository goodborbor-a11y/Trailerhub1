# 🚀 Quick Deployment Guide

**Welcome!** This guide will help you deploy your Movie Trailers site to a VPS.

## 📚 Documentation

- **👉 [VPS_DEPLOYMENT_GUIDE.md](./VPS_DEPLOYMENT_GUIDE.md)** - Complete step-by-step guide (START HERE!)
- **📖 [DEPLOYMENT.md](./DEPLOYMENT.md)** - Advanced deployment options and manual setup

## ⚡ Quick Start (3 Steps)

### 1. Get a VPS
- Recommended: **DigitalOcean**, **Linode**, or **Vultr**
- Minimum: 2GB RAM, 20GB storage
- OS: Ubuntu 22.04 LTS

### 2. Connect & Setup
```bash
# Connect to your VPS
ssh root@YOUR_VPS_IP

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh
apt install docker-compose-plugin -y
```

### 3. Deploy
```bash
# Upload your project files (via Git or SCP)
git clone YOUR_REPO_URL
cd trailerhub

# Create .env file (copy from .env.example and fill in values)
cp .env.example .env
nano .env  # Edit with your values

# Deploy!
docker compose up -d --build
```

**That's it!** Your site should be running. See [VPS_DEPLOYMENT_GUIDE.md](./VPS_DEPLOYMENT_GUIDE.md) for complete instructions including Nginx setup and SSL.

## 🔑 Required Environment Variables

Create a `.env` file with these variables:

```env
POSTGRES_USER=movieapp
POSTGRES_PASSWORD=your_strong_password_here
POSTGRES_DB=movietrailers
JWT_SECRET=your_32_character_secret_here
FRONTEND_URL=http://your-domain-or-ip
VITE_API_URL=http://your-domain-or-ip
NODE_ENV=production
```

## 🆘 Need Help?

1. Check the logs: `docker compose logs -f`
2. Read the full guide: [VPS_DEPLOYMENT_GUIDE.md](./VPS_DEPLOYMENT_GUIDE.md)
3. Check troubleshooting section in the guide

## 📦 What's Included

- ✅ React frontend (Vite + TypeScript)
- ✅ Express.js backend API
- ✅ PostgreSQL database
- ✅ Docker Compose setup
- ✅ Nginx configuration
- ✅ Authentication system
- ✅ File upload support

---

**Ready to deploy?** Open [VPS_DEPLOYMENT_GUIDE.md](./VPS_DEPLOYMENT_GUIDE.md) and follow the steps! 🎬

