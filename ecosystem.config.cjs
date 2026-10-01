/**
 * ==============================================================================
 * منظومة كَرِيمَة للرقابة الشاملة والشفافية الرقمية (Kareema Platform)
 * PM2 Enterprise Process Manager Cluster Configuration
 * ==============================================================================
 */

module.exports = {
  apps: [
    // 1. خادم واجهة التطبيقات الأساسي (HTTP API Cluster)
    {
      name: 'kareema-api',
      script: './node_modules/tsx/dist/cli.mjs',
      args: 'server.ts',
      instances: 'max', // تشغيل نمط العنقود بعدد أنوية المعالج (Cluster Mode)
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '1G',
      autorestart: true,
      restart_delay: 2000,
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      merge_logs: true,
      time: true,
    },

    // 2. خادم معالجة المهام الخلفية المستقل (Standalone Daemon TSP Worker)
    // تشغيل كعملية معزولة (Fork Mode) لمنع تجميد خادم API أثناء معالجة خوارزميات TSP الثقيلة
    {
      name: 'kareema-tsp-worker',
      script: './node_modules/tsx/dist/cli.mjs',
      args: 'src/workers/worker-runner.ts',
      instances: 1, // عملية مستقلة واحدة مخصصة لطابور الرقابة (Fork Mode)
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '512M',
      autorestart: true,
      restart_delay: 3000,
      exp_backoff_restart_delay: 100,
      env: {
        NODE_ENV: 'development',
        WORKER_TYPE: 'DISPATCH_OPTIMIZER',
      },
      env_production: {
        NODE_ENV: 'production',
        WORKER_TYPE: 'DISPATCH_OPTIMIZER',
      },
      error_file: './logs/worker-error.log',
      out_file: './logs/worker-out.log',
      merge_logs: true,
      time: true,
    },
  ],
};
