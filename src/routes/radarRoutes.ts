/**
 * ==============================================================================
 * منظومة كَرِيمَة للرقابة الشاملة والشفافية الرقمية (Kareema Platform)
 * مسارات الرادار الذكي للتحليل الفوري (Radar API Routes)
 * File: src/routes/radarRoutes.ts
 * ==============================================================================
 */

import { Router } from 'express';
import { analyzeSpikeHandler } from '../controllers/radarSpikeController';
import { checkRole } from '../middlewares/authMiddleware';

const router = Router();

/**
 * @route   POST /api/v1/radar/analyze-spike
 * @desc    تحليل فوري للانحراف السعري ودمج مؤشر Z-Score مع ذكاء Gemini 2.5 Flash وفق قانون مكافحة المضاربة 21-15
 * @access  Internal / Protected (Inspection & Operations Room - Requires inspector or admin role)
 */
router.post('/analyze-spike', checkRole(['inspector', 'admin']), analyzeSpikeHandler);

export default router;
