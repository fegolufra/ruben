#!/bin/bash
DATE=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_DIR="/app/backups"
mkdir -p "$BACKUP_DIR"
cp /app/data/SistemaPOS/sistema_pos.db "$BACKUP_DIR/sistema_pos_$DATE.db" 2>/dev/null || cp SistemaPOS/sistema_pos.db "$BACKUP_DIR/sistema_pos_$DATE.db" 2>/dev/null || cp sistema_pos.db "$BACKUP_DIR/sistema_pos_$DATE.db" 2>/dev/null
cd /app
git add backups/sistema_pos_$DATE.db 2>/dev/null
git commit -m "Auto backup $DATE" 2>/dev/null || true
git push origin main 2>/dev/null || true
find "$BACKUP_DIR" -name "sistema_pos_*.db" -mtime +30 -delete 2>/dev/null
echo "Backup $DATE completed"
