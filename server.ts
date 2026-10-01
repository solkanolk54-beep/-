/**
 * ==============================================================================
 * منظومة كَرِيمَة للرقابة الشاملة والشفافية الرقمية (Kareema Platform)
 * خادم Express وتطبيق الويب المتكامل (Full-Stack Express & Vite Server)
 * File: server.ts
 * ==============================================================================
 */

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import radarRoutes from './src/routes/radarRoutes';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  // Body parser
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // CORS & Security headers for internal API
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    next();
  });

  // 1. Healthcheck endpoints
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'healthy', platform: 'kareema-platform', timestamp: new Date().toISOString() });
  });

  app.get('/api/v1/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'healthy', version: 'v1', geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash' });
  });

  // 2. Mount Radar AI endpoints
  app.use('/api/v1/radar', radarRoutes);

  // 3. Vite middleware (Dev) vs Static Assets (Production)
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  // 4. Global Error Handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[Server Uncaught Error]', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'حدث خطأ غير متوقع في الخادم.',
        details: isProduction ? undefined : err?.message,
      },
    });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Kareema Server] Running on http://0.0.0.0:${PORT} (env: ${process.env.NODE_ENV || 'development'})`);
    console.log(`[Kareema Server] Endpoint active: POST http://0.0.0.0:${PORT}/api/v1/radar/analyze-spike`);
  });
}

startServer().catch((err) => {
  console.error('[Kareema Server] Failed to start:', err);
  process.exit(1);
});
