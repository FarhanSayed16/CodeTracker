module.exports = {
  apps: [
    {
      name: 'codetrack-api',
      script: './dist/server.js',
      // SQLite does not support multi-writer cluster mode safely
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
