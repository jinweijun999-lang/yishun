#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/home/yishun/backups
mkdir -p "$BACKUP_DIR"

sudo docker exec yishun_db_1 pg_dump -U postgres fortune_app | gzip > "$BACKUP_DIR/fortune_app_$DATE.sql.gz"

# Keep last 7 backups
cd "$BACKUP_DIR" && ls -t | tail -n +8 | xargs -r rm

echo "Backup: fortune_app_$DATE.sql.gz" 
