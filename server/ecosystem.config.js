// ===========================================
// PM2 Ecosystem Configuration
// ===========================================
// Usage:
//   pm2 start ecosystem.config.js
//   pm2 reload ecosystem.config.js
//   pm2 logs movietrailers-api
//   pm2 monit
// ===========================================

module.exports = {
  apps: [
    {
      name: 'movietrailers-api',
      script: './src/index.js',
      cwd: '/var/www/movietrailers/server',
      instances: 'max', // Use all CPU cores
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      
      // Environment variables
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      
      // Logging
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/var/log/pm2/movietrailers-error.log',
      out_file: '/var/log/pm2/movietrailers-out.log',
      merge_logs: true,
      
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      
      // Restart policy
      exp_backoff_restart_delay: 100,
      max_restarts: 10,
      min_uptime: '10s',
    },
  ],

  // Deployment configuration (optional)
  deploy: {
    production: {
      user: 'deploy',
      host: ['your-server-ip'],
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/movietrailers.git',
      path: '/var/www/movietrailers',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
    },
  },
};
