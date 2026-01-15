#!/bin/bash
# ===========================================
# VPS Deployment Helper Script
# ===========================================
# This script helps automate VPS deployment
# Usage: ./scripts/vps-deploy.sh
# ===========================================

set -e

echo "🎬 Movie Trailers VPS Deployment Helper"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found!${NC}"
    echo -e "${BLUE}Creating .env from .env.example...${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${GREEN}✓ Created .env file${NC}"
        echo -e "${YELLOW}⚠️  Please edit .env and fill in your values before continuing!${NC}"
        echo ""
        read -p "Press Enter after you've edited .env..."
    else
        echo -e "${RED}✗ .env.example not found. Please create .env manually.${NC}"
        exit 1
    fi
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker is not installed!${NC}"
    echo -e "${YELLOW}Installing Docker...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    echo -e "${GREEN}✓ Docker installed${NC}"
fi

# Check if Docker Compose is installed
if ! command -v docker compose &> /dev/null; then
    echo -e "${YELLOW}Installing Docker Compose...${NC}"
    apt install docker-compose-plugin -y
    echo -e "${GREEN}✓ Docker Compose installed${NC}"
fi

echo ""
echo -e "${BLUE}Step 1: Building and starting containers...${NC}"
docker compose down 2>/dev/null || true
docker compose up -d --build

echo ""
echo -e "${BLUE}Step 2: Waiting for services to be ready...${NC}"
sleep 10

# Check if services are running
if docker compose ps | grep -q "Up"; then
    echo -e "${GREEN}✓ Services are running${NC}"
else
    echo -e "${RED}✗ Some services failed to start${NC}"
    echo -e "${YELLOW}Check logs with: docker compose logs${NC}"
    exit 1
fi

# Check database health
echo ""
echo -e "${BLUE}Step 3: Checking database connection...${NC}"
if docker compose exec -T postgres pg_isready -U movieapp > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Database is ready${NC}"
else
    echo -e "${YELLOW}⚠️  Database might still be initializing...${NC}"
fi

# Check API health
echo ""
echo -e "${BLUE}Step 4: Checking API health...${NC}"
sleep 5
if curl -s http://localhost:3001/health > /dev/null; then
    echo -e "${GREEN}✓ API is responding${NC}"
else
    echo -e "${YELLOW}⚠️  API might still be starting...${NC}"
fi

# Setup Nginx
echo ""
echo -e "${BLUE}Step 5: Setting up Nginx...${NC}"

if ! command -v nginx &> /dev/null; then
    echo -e "${YELLOW}Installing Nginx...${NC}"
    apt install nginx -y
fi

# Create uploads directory
mkdir -p /var/www/uploads
chown -R www-data:www-data /var/www/uploads

# Copy frontend files
echo ""
echo -e "${BLUE}Step 6: Copying frontend files...${NC}"
mkdir -p /var/www/movietrailers

# Wait a bit more for build to complete
sleep 5

if docker compose ps | grep -q "movietrailers-api"; then
    docker cp movietrailers-api:/app/dist/. /var/www/movietrailers/ 2>/dev/null || {
        echo -e "${YELLOW}⚠️  Frontend files not ready yet. Run this later:${NC}"
        echo -e "${BLUE}   docker cp movietrailers-api:/app/dist/. /var/www/movietrailers/${NC}"
    }
    chown -R www-data:www-data /var/www/movietrailers
    echo -e "${GREEN}✓ Frontend files copied${NC}"
fi

echo ""
echo -e "${GREEN}======================================"
echo "🎉 Deployment Complete!"
echo "======================================"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Configure Nginx (see VPS_DEPLOYMENT_GUIDE.md)"
echo "2. Set up SSL certificate (if using domain)"
echo "3. Test your site: http://YOUR_VPS_IP"
echo ""
echo -e "${BLUE}Useful commands:${NC}"
echo "  docker compose logs -f    # View logs"
echo "  docker compose ps          # Check status"
echo "  docker compose restart     # Restart services"
echo ""
echo -e "${GREEN}======================================"

