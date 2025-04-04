module.exports = {
  apps: [
    {
      name: 'next-app',
      script: '.next/standalone/server.js',
      cwd: '/home/ubuntu/hotel-management-frontend',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        HOST: '0.0.0.0',
        PORT: 3000,
      },
    },
  ],
};
