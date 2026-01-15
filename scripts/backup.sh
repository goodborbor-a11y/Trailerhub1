#!/bin/bash
# ===========================================
# Backup Script for Movie Trailers App
# ===========================================
# Usage: ./scripts/backup.sh
# Add to crontab for automatic backups:
# 0 2 * * * /var/www/movietrailers/scripts/backup.sh
# ===========================================

set -e

# Configuration
BACKUP_DIR="/var/backups/movietrailers"
DB_NAME="movietrailers"
DB_USER="movieapp"
UPLOADS_DIR="/var/www/uploads"
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

# Timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🎬 Starting backup at $(date)"

# Database backup
echo "Backing up database..."
PGPASSWORD="${DB_PASSWORD:-changeme}" pg_dump -U $DB_USER -h localhost $DB_NAME | gzip > "$BACKUP_DIR/db_${TIMESTAMP}.sql.gz"
echo "✓ Database backed up"

# Uploads backup
if [ -d "$UPLOADS_DIR" ]; then
    echo "Backing up uploads..."
    tar -czf "$BACKUP_DIR/uploads_${TIMESTAMP}.tar.gz" -C $(dirname $UPLOADS_DIR) $(basename $UPLOADS_DIR)
    echo "✓ Uploads backed up"
fi

# Clean old backups
echo "Cleaning old backups..."
find $BACKUP_DIR -name "*.gz" -mtime +$RETENTION_DAYS -delete
echo "✓ Old backups cleaned"

echo "✅ Backup completed at $(date)"
echo "Backup files:"
ls -lh $BACKUP_DIR/*_${TIMESTAMP}*
