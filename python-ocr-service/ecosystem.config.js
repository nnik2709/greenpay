/**
 * PM2 Ecosystem Configuration for GreenPay OCR Service
 *
 * This file configures the Python OCR microservice to run with PM2 process manager.
 *
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 logs greenpay-ocr
 *   pm2 restart greenpay-ocr
 *   pm2 stop greenpay-ocr
 *   pm2 delete greenpay-ocr
 */

module.exports = {
  apps: [{
    // Application name
    name: 'greenpay-ocr',

    // Python virtual environment uvicorn
    script: 'venv/bin/uvicorn',

    // FastAPI application and configuration
    args: 'app.main:app --host 127.0.0.1 --port 5000 --workers 4',

    // Working directory
    cwd: '/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/python-ocr-service',

    // Interpreter (use system Python, not Node.js)
    interpreter: 'none',

    // Environment variables
    env: {
      OCR_HOST: '127.0.0.1',
      OCR_PORT: '5000',
      OCR_WORKERS: '4',          // 4 workers for 8-core server
      OCR_USE_GPU: 'false',      // Set to 'true' if GPU available
      LOG_LEVEL: 'INFO',
      CORS_ENABLED: 'false'      // Only Node.js backend can access
    },

    // Auto-restart configuration
    autorestart: true,
    watch: false,                  // Don't restart on file changes (production)
    max_restarts: 10,              // Max restarts within min_uptime window
    min_uptime: '10s',             // Consider app stable after 10 seconds

    // Memory management
    max_memory_restart: '1G',      // Restart if exceeds 1GB (plenty of headroom on 31GB server)

    // Logging
    error_file: '/var/log/greenpay-ocr-error.log',
    out_file: '/var/log/greenpay-ocr-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,

    // Process management
    kill_timeout: 5000,            // 5 seconds to gracefully shutdown
    listen_timeout: 10000,         // 10 seconds to start listening

    // Restart delay
    restart_delay: 2000,           // Wait 2 seconds between restarts

    // Clustering (already using uvicorn workers, so instances=1)
    instances: 1,
    exec_mode: 'fork'
  }]
};
