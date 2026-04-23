# YiShun 监控系统部署文档

> 更新时间: 2026-04-23
> 部署环境: 34.102.18.91

---

## 📋 概述

本监控架构采用 Prometheus + Grafana + Loki 的开源组合，提供完整的指标监控、日志收集和可视化告警能力。

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Prometheus │───▶│  AlertManager│───▶│  飞书Webhook │
└─────────────┘    └─────────────┘    └─────────────┘
      │                                       
      ▼                                        
┌─────────────┐    ┌─────────────┐
│   Grafana   │◀───│    Loki     │
│  (Dashboard)│    │  (Logs)     │
└─────────────┘    └─────────────┘
```

---

## 🗂️ 目录结构

```
yishun-app/monitoring/
├── docker-compose.yml          # 主配置文件
├── prometheus/
│   ├── prometheus.yml          # Prometheus 采集配置
│   └── rules/
│       └── alerting.yml        # 告警规则
├── alertmanager/
│   └── alertmanager.yml        # AlertManager 配置
├── grafana/
│   ├── provisioning/
│   │   ├── datasources/
│   │   │   └── datasources.yml # 数据源配置
│   │   └── dashboards/
│   │       └── dashboards.yml   # 仪表盘配置
│   └── dashboards/
│       └── yishun-api.json     # YiShun API 监控面板
├── loki/
│   └── loki.yml                # Loki 配置
├── promtail/
│   └── promtail.yml            # 日志收集代理配置
└── backup.sh                   # 数据库备份脚本
```

---

## 🚀 快速部署

### 1. 上传配置到服务器

```bash
scp -r ~/Downloads/A股策略交易/yishun-app/monitoring yishun@34.102.18.91:/opt/yishun/
```

### 2. SSH 到服务器

```bash
ssh -i ~/.ssh/id_rsa_local yishun@34.102.18.91
```

### 3. 创建必要目录

```bash
mkdir -p /opt/yishun/monitoring/promtail/positions
```

### 4. 配置飞书 WebHook

编辑 `alertmanager/alertmanager.yml`，将 `YOUR_WEBHOOK_ID` 替换为真实飞书机器人 WebHook 地址：

```
https://open.feishu.cn/open-apis/bot/v2/hook/xxxxxx-xxxx-xxxx
```

获取方式：飞书群 → 设置 → 群机器人 → 添加机器人 → Incoming WebHook

### 5. 启动监控栈

```bash
cd /opt/yishun/monitoring

# 设置 Grafana 密码（可选）
export GRAFANA_PASSWORD=your_secure_password

# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f prometheus
```

### 6. 验证部署

| 服务 | 地址 | 默认账号 |
|------|------|---------|
| Prometheus | http://34.102.18.91:9090 | - |
| Grafana | http://34.102.18.91:3000 | admin / admin123 |
| AlertManager | http://34.102.18.91:9093 | - |
| Loki | http://34.102.18.91:3100 | - |

---

## ⚙️ 服务详情

### Prometheus (指标收集)

- **端口**: 9090
- **数据保留**: 15天
- **采集间隔**: 30秒 (API)
- **告警规则**: `/prometheus/rules/alerting.yml`

**API 服务监控指标** (需要应用暴露 `/metrics` 端点):

```python
# FastAPI 示例 - 添加 metrics 端点
from fastapi import FastAPI
from prometheus_fastapi_instrumentator import Instrumentator

app = FastAPI()
Instrumentator().instrument(app).expose(app, endpoint="/metrics")
```

### Grafana (可视化)

- **端口**: 3000
- **默认账号**: admin / admin123
- **数据源**: Prometheus + Loki
- **仪表盘**: `yishun-api.json` (自动导入)

**登录后操作**:
1. 进入 Configuration → Data Sources 确认 Prometheus/Loki 已连接
2. 进入 Dashboards → Manage 查看 YiShun API 监控面板

### AlertManager (告警)

- **端口**: 9093
- **告警渠道**: 飞书 WebHook
- **重复间隔**: 12小时

### Loki + Promtail (日志)

- **Loki 端口**: 3100
- **Promtail 端口**: 9080
- **日志路径**: `/var/log/**/*.log`

**在 Grafana 中查看日志**:
1. Explore → 选择 Loki 数据源
2. 使用 LogQL 查询: `{host="yishun-server"}`

---

## 🚨 告警规则

| 告警名称 | 条件 | 持续时间 | 级别 |
|---------|------|---------|------|
| HighCPUUsage | CPU > 80% | 5分钟 | ⚠️ Warning |
| HighAPIErrorRate | 5xx错误率 > 1% | 3分钟 | 🔴 Critical |
| ServiceDown | 服务无响应 | 1分钟 | 🔴 Critical |
| HighMemoryUsage | 内存 > 512MB | 5分钟 | ⚠️ Warning |

---

## 🔄 备份恢复

### 自动备份 (Crontab)

```bash
# 每天凌晨 3:00 执行备份
0 3 * * * /opt/yishun/monitoring/backup.sh >> /var/log/yishun-backup.log 2>&1
```

### 手动备份

```bash
cd /opt/yishun/monitoring
./backup.sh
```

### 恢复数据

```bash
# PostgreSQL 恢复
gunzip < backup_file.sql.gz | PGPASSWORD=xxx psql -h localhost -U yishun -d yishun_db
```

### 环境变量配置

创建 `/opt/yishun/monitoring/.env`:

```env
DB_NAME=yishun_db
DB_HOST=localhost
DB_PORT=5432
DB_USER=yishun
DB_PASSWORD=your_password

GRAFANA_PASSWORD=your_secure_password

# S3/OSS 备份配置
S3_BUCKET=yishun-backups
S3_ENDPOINT=https://s3.xxx.com
S3_ACCESS_KEY=your_access_key
S3_SECRET_KEY=your_secret_key
```

---

## 🔧 常用运维命令

```bash
# 查看所有服务状态
docker-compose ps

# 查看日志
docker-compose logs -f [service_name]
# 例如: docker-compose logs -f prometheus

# 重启服务
docker-compose restart [service_name]

# 更新配置后重载
docker-compose exec prometheus kill -HUP 1

# 停止所有服务
docker-compose down

# 完全重建
docker-compose down -v && docker-compose up -d
```

---

## 📊 监控指标说明

YiShun API 需要暴露以下 Prometheus metrics (通过 `/metrics` 端点):

| 指标名 | 类型 | 说明 |
|--------|------|------|
| `http_requests_total` | Counter | HTTP 请求总数 (带 status 标签) |
| `http_request_duration_seconds` | Histogram | 请求延迟分布 |
| `process_cpu_seconds_total` | Counter | CPU 使用时间 |
| `process_resident_memory_bytes` | Gauge | 内存使用量 |
| `up` | Gauge | 服务健康状态 (1=正常, 0=宕机) |

---

## 🆘 故障排查

### 服务启动失败

```bash
# 查看详细日志
docker-compose logs [service_name]

# 检查端口占用
netstat -tlnp | grep -E '9090|3000|3100|9093'
```

### Prometheus 无法采集 API 指标

```bash
# 测试 API 是否暴露 metrics
curl http://34.102.18.91:8000/metrics

# 在 Prometheus UI 检查 targets 状态
# http://34.102.18.91:9090/targets
```

### 飞书告警未收到

1. 确认 WebHook 地址正确
2. 测试 WebHook: `curl -X POST "YOUR_WEBHOOK_URL" -d '{"msg_type":"text","content":{"text":"test"}}'`
3. 检查 AlertManager 日志: `docker-compose logs alertmanager`

---

## 📞 联系方式

- 服务器: 34.102.18.91
- 运维: yishun 用户
- SSH Key: `~/.ssh/id_rsa_local`
