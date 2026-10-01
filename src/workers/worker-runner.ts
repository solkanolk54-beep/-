/**
 * ==============================================================================
 * منظومة كَرِيمَة للرقابة الشاملة والشفافية الرقمية (Kareema Platform)
 * Standalone Daemon Worker Entrypoint for Inspector Dispatch & TSP Optimizer
 * ==============================================================================
 */

import { InspectorDispatchWorker } from './inspectorRouteOptimizer';

async function bootstrapWorker() {
  console.log('[Worker Process] Initializing Kareema Dispatch Daemon...');
  console.log(`[Worker Process] PID: ${process.pid} | Node: ${process.version} | Env: ${process.env.NODE_ENV || 'production'}`);

  const worker = new InspectorDispatchWorker();

  // Start the background worker consumer
  await worker.start();

  // Graceful shutdown handling
  const shutdown = async (signal: string) => {
    console.log(`[Worker Process] Received ${signal}. Initiating graceful termination...`);
    try {
      await worker.stop();
      console.log('[Worker Process] Graceful exit complete.');
      process.exit(0);
    } catch (err) {
      console.error('[Worker Process] Error during shutdown:', err);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('uncaughtException', (err) => {
    console.error('[Worker Process FATAL] Uncaught Exception:', err);
  });

  process.on('unhandledRejection', (reason) => {
    console.error('[Worker Process FATAL] Unhandled Rejection:', reason);
  });
}

bootstrapWorker().catch((err) => {
  console.error('[Worker Process] Bootstrap failed:', err);
  process.exit(1);
});
