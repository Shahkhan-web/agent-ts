module.exports = {
  apps: [{
    name: 'SAI',
    script: 'dist/app.js',
    instances: 1,
    autorestart: true,
    watch: true,
    max_memory_restart: '1536M',
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000 // Example to set a port variable; adjust if your app uses a different port.
    },
    error_file: './logs/err.log', // Log standard error outputs to this file.
    out_file: './logs/out.log',  // Log standard output to this file.
    log_date_format: 'YYYY-MM-DD HH:mm:ss' // Format logs with timestamp.
  }]
};
