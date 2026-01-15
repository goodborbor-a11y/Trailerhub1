#!/bin/bash
# ===========================================
# Portainer Installation Script
# ===========================================
# Run this on your VPS after SSH login
# ===========================================

echo "🚀 Starting Portainer Installation..."
echo ""

# Step 1: Update system
echo "📦 Step 1: Updating system packages..."
apt update && apt upgrade -y

# Step 2: Install Docker
echo ""
echo "🐳 Step 2: Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh

# Step 3: Install Docker Compose
echo ""
echo "📦 Step 3: Installing Docker Compose..."
apt install docker-compose-plugin -y

# Step 4: Verify installation
echo ""
echo "✅ Step 4: Verifying Docker installation..."
docker --version
docker compose version

# Step 5: Create Portainer volume
echo ""
echo "💾 Step 5: Creating Portainer data volume..."
docker volume create portainer_data

# Step 6: Install Portainer
echo ""
echo "🎯 Step 6: Installing Portainer..."
docker run -d -p 8000:8000 -p 9443:9443 \
  --name portainer \
  --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest

# Step 7: Check status
echo ""
echo "🔍 Step 7: Checking Portainer status..."
sleep 3
docker ps | grep portainer

echo ""
echo "=========================================="
echo "✅ Portainer Installation Complete!"
echo "=========================================="
echo ""
echo "🌐 Access Portainer at:"
echo "   https://62.171.149.223:9443"
echo ""
echo "📝 Next steps:"
echo "   1. Open the URL above in your browser"
echo "   2. Accept the security warning (self-signed certificate)"
echo "   3. Create your admin account"
echo "   4. Start managing Docker!"
echo ""
echo "=========================================="

