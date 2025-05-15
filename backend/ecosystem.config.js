module.exports = {
  apps: [{
    name: 'management-system',
    script: 'app.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 5150
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5150
    },
    error_file: './log/err.log',
    out_file: './log/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    log_rotate: {
      max_size: '1G',
      retain: 10,
      compress: true,
      dateFormat: 'YYYY-MM-DD'
    }
  }]
}; 