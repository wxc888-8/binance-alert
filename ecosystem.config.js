module.exports = {
  apps: [
    {
      name: 'binance-alert-web',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'binance-alert-worker',
      script: 'npm',
      args: 'run worker',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
