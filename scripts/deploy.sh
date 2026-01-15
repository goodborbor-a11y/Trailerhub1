#!/bin/bash
# ===========================================
# Deployment Script for Movie Trailers App
# ===========================================
# Usage: ./scripts/deploy.sh
# ===========================================

set -e  # Exit on error

echo "🎬 Movie Trailers Deployment Script"
echo "===================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/var/www/movietrailers"
UPLOADS_DIR="/var/www/uploads"
LOG_DIR="/var/log/pm2"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root or with sudo${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Installing system dependencies...${NC}"
apt-get update
apt-get install -y curl git nginx postgresql postgresql-contrib

# Install Node.js 20
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Installing Node.js 20...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

# Install PM2 globally
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}Installing PM2...${NC}"
    npm install -g pm2
fi

echo -e "${GREEN}✓ System dependencies installed${NC}"

echo -e "${YELLOW}Step 2: Setting up directories...${NC}"
mkdir -p $APP_DIR
mkdir -p $UPLOADS_DIR
mkdir -p $LOG_DIR
chown -R www-data:www-data $UPLOADS_DIR
chmod 755 $UPLOADS_DIR

echo -e "${GREEN}✓ Directories created${NC}"

echo -e "${YELLOW}Step 3: Setting up PostgreSQL...${NC}"
# Start PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Check if database exists
if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw movietrailers; then
    echo -e "${YELLOW}Database 'movietrailers' already exists${NC}"
else
    echo "Creating database and user..."
    sudo -u postgres psql <<EOF
CREATE USER movieapp WITH PASSWORD 'changeme_in_production';
CREATE DATABASE movietrailers OWNER movieapp;
GRANT ALL PRIVILEGES ON DATABASE movietrailers TO movieapp;
EOF
    echo -e "${GREEN}✓ Database created${NC}"
fi

echo -e "${YELLOW}Step 4: Copying application files...${NC}"
# Assuming files are in current directory
if [ -d "./dist" ]; then
    cp -r ./dist/* $APP_DIR/
fi
if [ -d "./server" ]; then
    cp -r ./server $APP_DIR/
fi

echo -e "${GREEN}✓ Files copied${NC}"

echo -e "${YELLOW}Step 5: Installing backend dependencies...${NC}"
cd $APP_DIR/server
npm install --production

echo -e "${GREEN}✓ Dependencies installed${NC}"

echo -e "${YELLOW}Step 6: Running database migrations...${NC}"
if [ -f "../database/schema.sql" ]; then
    PGPASSWORD=changeme_in_production psql -U movieapp -d movietrailers -f ../database/schema.sql
    echo -e "${GREEN}✓ Schema applied${NC}"
fi

if [ -f "../database/seed-data.sql" ]; then
    PGPASSWORD=changeme_in_production psql -U movieapp -d movietrailers -f ../database/seed-data.sql
    echo -e "${GREEN}✓ Seed data imported${NC}"
fi

echo -e "${YELLOW}Step 7: Configuring Nginx...${NC}"
if [ -f "./nginx/movietrailers.conf" ]; then
    cp ./nginx/movietrailers.conf /etc/nginx/sites-available/movietrailers
    ln -sf /etc/nginx/sites-available/movietrailers /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    nginx -t && systemctl reload nginx
    echo -e "${GREEN}✓ Nginx configured${NC}"
fi

echo -e "${YELLOW}Step 8: Starting application with PM2...${NC}"
cd $APP_DIR/server
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

echo -e "${GREEN}✓ Application started${NC}"

echo ""
echo -e "${GREEN}===================================="
echo "🎉 Deployment Complete!"
echo "===================================="
echo ""
echo "Next steps:"
echo "1. Update .env with your production values"
echo "2. Update nginx config with your domain"
echo "3. Set up SSL with: certbot --nginx -d yourdomain.com"
echo "4. Restart services: pm2 reload all && systemctl reload nginx"
echo ""
echo "Useful commands:"
echo "  pm2 logs          - View application logs"
echo "  pm2 monit         - Monitor application"
echo "  pm2 reload all    - Reload application"
echo "====================================${NC}"
