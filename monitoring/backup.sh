#!/bin/bash
# YiShun 数据库备份脚本
# 每日定时执行，备份到本地 + S3/OSS

set -e

BACKUP_DIR="/opt/yishun/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="${DB_NAME:-yishun_db}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-yishun}"

# S3/OSS 配置
S3_BUCKET="${S3_BUCKET:-}"
S3_ENDPOINT="${S3_ENDPOINT:-}"
S3_ACCESS_KEY="${S3_ACCESS_KEY:-}"
S3_SECRET_KEY="${S3_SECRET_KEY:-}"

mkdir -p "${BACKUP_DIR}"

echo "[$(date)] 开始备份数据库 ${DB_NAME}..."

# PostgreSQL 备份 (如果是 PostgreSQL)
if command -v pg_dump &> /dev/null; then
    BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${DATE}.sql.gz"
    PGPASSWORD="${DB_PASSWORD}" pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" | gzip > "${BACKUP_FILE}"
    echo "[$(date)] PostgreSQL 备份完成: ${BACKUP_FILE}"
elif command -v mysqldump &> /dev/null; then
    # MySQL 备份
    BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${DATE}.sql.gz"
    mysqldump -h "${DB_HOST}" -P "${DB_PORT}" -u "${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" | gzip > "${BACKUP_FILE}"
    echo "[$(date)] MySQL 备份完成: ${BACKUP_FILE}"
else
    echo "[$(date)] 未找到数据库客户端，跳过数据库备份"
    exit 0
fi

# 计算备份大小
BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo "[$(date)] 备份文件大小: ${BACKUP_SIZE}"

# 上传到 S3/OSS
if [[ -n "${S3_BUCKET}" && -n "${S3_ACCESS_KEY}" ]]; then
    echo "[$(date)] 正在上传到 S3/OSS..."
    if command -v aws &> /dev/null; then
        aws s3 cp "${BACKUP_FILE}" "s3://${S3_BUCKET}/yishun-backups/${DATE}/" \
            --endpoint-url "${S3_ENDPOINT}" \
            --access-key "${S3_ACCESS_KEY}" \
            --secret-key "${S3_SECRET_KEY}"
    elif command -v mc &> /dev/null; then
        mc cp "${BACKUP_FILE}" "minio/yishun-backups/${DATE}/"
    else
        echo "[$(date)] 未找到 aws 或 mc 客户端，跳过 S3 上传"
    fi
fi

# 清理 30 天前的本地备份
find "${BACKUP_DIR}" -name "${DB_NAME}_*.sql.gz" -mtime +30 -delete
echo "[$(date)] 备份完成，30天前的旧备份已清理"

# 输出备份列表
echo "[$(date)] 当前备份列表:"
ls -lh "${BACKUP_DIR}" | tail -5
