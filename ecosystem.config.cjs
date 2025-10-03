module.exports = {
  apps: [{
    name: 'png-green-fees',
    script: 'serve',
    args: '-s /var/www/png-green-fees/dist -l 3000',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
