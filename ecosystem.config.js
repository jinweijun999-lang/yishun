module.exports = {
  apps: [{
    name: 'yishun-nextjs',
    script: 'node_modules/.bin/next',
    args: 'start -p 3001',
    cwd: '/home/yishun/yishun',
    env: {
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/fortune_app',
      AUTH_SECRET: 'fortune-app-secret-key-2024-secure-random',
      YISHUN_ANALYTICS_FILE: '/home/yishun/logs/yishun-analytics.jsonl'
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    error_file: '/home/yishun/logs/pm2-error.log',
    out_file: '/home/yishun/logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    restart_delay: 4000
  }]
};
