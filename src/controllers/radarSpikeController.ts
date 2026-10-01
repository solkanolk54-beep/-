/**
 * ==============================================================================
 * منظومة كَرِيمَة للرقابة الشاملة والشفافية الرقمية (Kareema Platform)
 * وحدة الرادار الذكي: تحليل الانحرافات واحتساب مؤشر Z-Score عبر Gemini 2.5 Flash
 * File: src/controllers/radarSpikeController.ts
 * ==============================================================================
 */

import { Request, Response, NextFunction } from 'express';
import { GoogleGenAI, Type } from '@google/genai';

/**
 * مستويات الخطورة المعتمدة في منظومة الرادار وقمع الغش
 */
export type SpikeRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/**
 * بنية بيانات الطلب (Request Payload) لنقطة النهاية POST /api/v1/radar/analyze-spike
 */
export interface AnalyzeSpikeRequestBody {
  productId: string;
  observedPrice: number;
  ceilingPrice: number;
  wilaya?: string;
  baladiya?: string;
  commodityNameAr?: string;
  merchantName?: string;
  
  // معطيات إحصائية اختيارية لاحتساب أو تغذية مؤشر Z-Score
  zScore?: number;
  historicalPrices?: number[];
  historicalMean?: number;
  historicalStdDev?: number;
  reportCountNearby?: number;
}

/**
 * بنية بيانات الرد التشخيصي الهيكلي (Diagnostic Structured Response)
 */
export interface AnalyzeSpikeResponse {
  level: SpikeRiskLevel;
  reasoning: string;
  recommendation: string;
  metadata?: {
    modelUsed: string;
    analysisLatencyMs: number;
    inflationDeltaPct: number;
    calculatedZScore: number;
    statisticallySignificant: boolean;
    isFallback: boolean;
  };
}

/**
 * مهلة الاستجابة القصوى (Timeout) بالميلي ثانية لحماية Express Event Loop
 */
const GEMINI_REQUEST_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS) || 9000;

/**
 * النموذج المعتمد للتحليل الفوري
 */
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

/**
 * تهيئة عميل Google GenAI الخادمي الآمن
 */
function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('مفتاح GEMINI_API_KEY غير مهيأ في متغيرات بيئة الخادم (process.env.GEMINI_API_KEY).');
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * دالة احتساب مؤشر Z-Score الإحصائي:
 * Z = (X - μ) / σ
 * - إذا تم توفير مصفوفة الأسعار التاريخية (historicalPrices)، يُحسب المتوسط والانحراف المعياري الفعليان.
 * - إذا تم توفير historicalMean و historicalStdDev، يُطبق القانون مباشرة.
 * - إذا تم تمرير zScore مسبقاً، يتم اعتماده مع التحقق.
 * - كمعيار مرجعي افتراضي للمواد المقننة: μ تمثل السعر العادل (90% من السقف)، و σ تمثل التذبذب المسموح (8% من السقف).
 */
export function calculateZScore(params: {
  observedPrice: number;
  ceilingPrice: number;
  explicitZScore?: number;
  historicalPrices?: number[];
  historicalMean?: number;
  historicalStdDev?: number;
}): { zScore: number; mean: number; stdDev: number; method: string } {
  // 1. إذا تم تمرير Z-Score صراحة
  if (typeof params.explicitZScore === 'number' && !isNaN(params.explicitZScore)) {
    return {
      zScore: Number(params.explicitZScore.toFixed(2)),
      mean: params.historicalMean || params.ceilingPrice * 0.90,
      stdDev: params.historicalStdDev || params.ceilingPrice * 0.08,
      method: 'explicit_provided',
    };
  }

  // 2. إذا تم تمرير مصفوفة أسعار تاريخية
  if (Array.isArray(params.historicalPrices) && params.historicalPrices.length >= 2) {
    const validPrices = params.historicalPrices.filter((p) => typeof p === 'number' && !isNaN(p) && p > 0);
    if (validPrices.length >= 2) {
      const n = validPrices.length;
      const mean = validPrices.reduce((sum, p) => sum + p, 0) / n;
      const variance = validPrices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / (n - 1);
      const stdDev = Math.sqrt(variance) || 1.0;
      const z = (params.observedPrice - mean) / stdDev;
      return {
        zScore: Number(z.toFixed(2)),
        mean: Number(mean.toFixed(2)),
        stdDev: Number(stdDev.toFixed(2)),
        method: 'historical_sample_variance',
      };
    }
  }

  // 3. إذا تم تمرير المتوسط والانحراف المعياري
  if (
    typeof params.historicalMean === 'number' &&
    typeof params.historicalStdDev === 'number' &&
    params.historicalStdDev > 0
  ) {
    const z = (params.observedPrice - params.historicalMean) / params.historicalStdDev;
    return {
      zScore: Number(z.toFixed(2)),
      mean: params.historicalMean,
      stdDev: params.historicalStdDev,
      method: 'historical_distribution_params',
    };
  }

  // 4. الاحتساب المعياري المرجعي (Benchmark Distribution)
  const baselineMean = params.ceilingPrice * 0.90;
  const baselineStdDev = Math.max(1.0, params.ceilingPrice * 0.08);
  const benchmarkZ = (params.observedPrice - baselineMean) / baselineStdDev;

  return {
    zScore: Number(benchmarkZ.toFixed(2)),
    mean: Number(baselineMean.toFixed(2)),
    stdDev: Number(baselineStdDev.toFixed(2)),
    method: 'regulated_commodity_benchmark',
  };
}

/**
 * التحقق الصارم من مدخلات الطلب
 */
function validateAnalyzeSpikeBody(body: any): { 
  valid: boolean; 
  error?: string; 
  data?: {
    productId: string;
    observedPrice: number;
    ceilingPrice: number;
    wilaya: string;
    baladiya: string;
    commodityNameAr?: string;
    merchantName?: string;
    zScore: number;
    reportCountNearby?: number;
  } 
} {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'جسم الطلب (Request Body) فارغ أو غير صالح.' };
  }

  const { productId, observedPrice, ceilingPrice, wilaya, baladiya } = body;

  if (!productId || typeof productId !== 'string' || productId.trim() === '') {
    return { valid: false, error: 'حقل productId مطلوب ويجب أن يكون نصاً غير فارغ.' };
  }

  if (typeof observedPrice !== 'number' || isNaN(observedPrice) || observedPrice <= 0) {
    return { valid: false, error: 'حقل observedPrice مطلوب ويجب أن يكون رقماً موجباً أكبر من الصفر.' };
  }

  if (typeof ceilingPrice !== 'number' || isNaN(ceilingPrice) || ceilingPrice <= 0) {
    return { valid: false, error: 'حقل ceilingPrice مطلوب ويجب أن يكون رقماً موجباً أكبر من الصفر.' };
  }

  // احتساب Z-Score إحصائياً إذا لم يتم إرساله
  const zScoreComputation = calculateZScore({
    observedPrice: Number(observedPrice),
    ceilingPrice: Number(ceilingPrice),
    explicitZScore: typeof body.zScore === 'number' ? body.zScore : undefined,
    historicalPrices: Array.isArray(body.historicalPrices) ? body.historicalPrices : undefined,
    historicalMean: typeof body.historicalMean === 'number' ? body.historicalMean : undefined,
    historicalStdDev: typeof body.historicalStdDev === 'number' ? body.historicalStdDev : undefined,
  });

  return {
    valid: true,
    data: {
      productId: String(productId).trim(),
      observedPrice: Number(observedPrice),
      ceilingPrice: Number(ceilingPrice),
      wilaya: wilaya ? String(wilaya).trim() : 'الجزائر العاصمة',
      baladiya: baladiya ? String(baladiya).trim() : 'سيدي امحمد',
      commodityNameAr: body.commodityNameAr ? String(body.commodityNameAr).trim() : undefined,
      merchantName: body.merchantName ? String(body.merchantName).trim() : undefined,
      zScore: zScoreComputation.zScore,
      reportCountNearby: typeof body.reportCountNearby === 'number' ? body.reportCountNearby : undefined,
    },
  };
}

/**
 * محرك الاحتياط الاستدلالي (Heuristic Fallback Engine)
 * يُفعّل في حال انقطاع الشبكة أو نفاد مهلة الـ Timeout لضمان استمرارية عمل الرادار
 */
function computeHeuristicSpikeFallback(
  data: {
    productId: string;
    observedPrice: number;
    ceilingPrice: number;
    wilaya: string;
    baladiya: string;
    zScore: number;
  },
  deltaPct: number,
  startTime: number
): AnalyzeSpikeResponse {
  let level: SpikeRiskLevel = 'LOW';
  let reasoning = '';
  let recommendation = '';

  if (data.zScore >= 3.0 || deltaPct >= 35) {
    level = 'CRITICAL';
    reasoning = `انحراف إحصائي شاذ وحاد (Z-Score: ${data.zScore.toFixed(2)}) مع ارتفاع سعري بنسبة +${deltaPct.toFixed(1)}% عن السعر المسقف ببلدية ${data.baladiya}، ما يشكل شبهة مضاربة غير مشروعة واضحة بموجب المادتين 3 و4 من القانون 21-15.`;
    recommendation = `إرسال فوري لدورية التفتيش وقمع الغش لغلق المحل احترازياً وحجز السلع مع تحرير محضر مخالفة فوري وإحالة الملف إلى وكيل الجمهورية.`;
  } else if (data.zScore >= 2.0 || deltaPct >= 20) {
    level = 'HIGH';
    reasoning = `ارتفاع سعري ملحوظ بنسبة +${deltaPct.toFixed(1)}% يتجاوز عتبة الأمان الإحصائي (Z-Score: ${data.zScore.toFixed(2)}) في النسيج التجاري لبلدية ${data.baladiya} (${data.wilaya}) دون تبرير لوجستي مثبت.`;
    recommendation = `توجيه فرقة مراقبة خلال مهلة SLA لا تتجاوز 45 دقيقة للتحقق من فواتير الشراء وهوامش الربح المقننة وتوجيه إعذار رسمي بالتسوية.`;
  } else if (data.zScore >= 1.2 || deltaPct >= 10) {
    level = 'MEDIUM';
    reasoning = `تذبذب سعري نسبي بنسبة +${deltaPct.toFixed(1)}% (Z-Score: ${data.zScore.toFixed(2)}) قد يعود لتقلبات طفيفة في سلاسل التوزيع بـ ${data.baladiya}.`;
    recommendation = `إدراج نقطة البيع ضمن جدول المراقبة الدورية لليوم الموالي ومتابعة مسار التزود من أسواق الجملة.`;
  } else {
    level = 'LOW';
    reasoning = `السعر المرصود متوافق أو مقارب للسعر المرجعي (فارق +${deltaPct.toFixed(1)}%، Z-Score: ${data.zScore.toFixed(2)}) وضمن الهوامش الطبيعية المقبولة.`;
    recommendation = `حفظ التنبيه دون إجراء ردعي ميداني مع استمرار المراقبة الآلية لنقاط البيع المجاورة.`;
  }

  return {
    level,
    reasoning,
    recommendation,
    metadata: {
      modelUsed: 'heuristic-rule-engine-fallback',
      analysisLatencyMs: Date.now() - startTime,
      inflationDeltaPct: Number(deltaPct.toFixed(2)),
      calculatedZScore: data.zScore,
      statisticallySignificant: data.zScore >= 2.0,
      isFallback: true,
    },
  };
}

/**
 * معالج نقطة النهاية (Controller Handler): POST /api/v1/radar/analyze-spike
 */
export async function analyzeSpikeHandler(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const startTime = Date.now();

  try {
    // 1. التحقق من صحة المدخلات واحتساب مؤشر Z-Score
    const validation = validateAnalyzeSpikeBody(req.body);
    if (!validation.valid || !validation.data) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST_PAYLOAD',
          message: validation.error || 'مدخلات الطلب غير مقبولة.',
        },
      });
      return;
    }

    const payload = validation.data;
    const deltaPct = ((payload.observedPrice - payload.ceilingPrice) / payload.ceilingPrice) * 100;
    const isStatSignificant = Math.abs(payload.zScore) >= 2.0;

    // 2. صياغة الموجه المحكم (Prompt) المعتمد على التشريع الجزائري لمكافحة المضاربة 21-15
    const prompt = `أنت الخبير الجنائي والاقتصادي الأول في منظومة "كَرِيمَة" الوطنية لمكافحة الاحتكار والمضاربة غير المشروعة في الجمهورية الجزائرية.

مهمتك: تحليل انحراف سعري ميداني مشبوه وتحديد مستوى الخطر وتوصية التدخل الميداني لفرق قمع الغش طبقاً للتشريع الجزائري الساري (خاصة القانون رقم 21-15 المؤرخ في 28 ديسمبر 2021 المتعلق بمكافحة المضاربة غير المشروعة، والمواد 3، 4، 12، 13).

بيانات التنبيه المرصود:
- معرف السلعة: ${payload.productId} ${payload.commodityNameAr ? `(${payload.commodityNameAr})` : ''}
- السعر المرصود ميدانياً: ${payload.observedPrice} دج
- السعر المسقف / المرجعي قانوناً: ${payload.ceilingPrice} دج
- نسبة الانحراف السعري: +${deltaPct.toFixed(1)}% عن السقف
- مؤشر Z-Score الإحصائي المحسوب: ${payload.zScore.toFixed(2)} (${isStatSignificant ? 'شذوذ إحصائي مؤكد فاق الانحرافين المعياريين' : 'ضمن التذبذب الإحصائي المحدود'})
- الموقع الجغرافي: بلدية ${payload.baladiya}، ولاية ${payload.wilaya}
${payload.merchantName ? `- التاجر / المحل: ${payload.merchantName}` : ''}
${typeof payload.reportCountNearby === 'number' ? `- بلاغات المواطنين المجاورة المتطابقة: ${payload.reportCountNearby} بلاغات` : ''}

قواعد التقييم الإلزامية:
1. تصنيف "level" يكون حصراً واحداً من:
   - "CRITICAL": في حال تجاوز Z-Score لـ 2.5 أو نسبة انحراف تتجاوز 30% للمواد واسعة الاستهلاك، مع شبهة تخزين أو تعطيل سلاسل الإمداد بموجب المادة 3 من قانون 21-15.
   - "HIGH": في حال انحراف إحصائي ملموس (Z-Score بين 1.8 و 2.5) أو تجاوز سعري بين 15% و 30% يستوجب مداهمة تفتيشية سريعة.
   - "MEDIUM": في حال شبهة تجاوز طفيف أو اضطراب موضعي محدود يتطلب تحققاً روتينياً.
   - "LOW": في حال عدم وجود مضاربة واضحة وكون الانحراف ناتجاً عن فوارق نقل عادية.
2. صياغة "reasoning": ملخص قانوني واقتصادي دقيق في جملتين إلى 3 جمل باللغة العربية يوضح العلاقة بين مؤشر Z-Score وفارق السعر وواقع السوق المحلي.
3. صياغة "recommendation": توصية إجرائية قاطعة ومحددة لفرقة الرقابة الميدانية (مثل: تحرير محضر مخالفة، غلق إداري، تدقيق فواتير المصدر، الحجز والمصادرة، أو استمرار الرقابة العادية).

أخرج النتيجة كـ JSON صارم مطابق للمخطط المطلوب دون أي نصوص أو شروحات خارج الكائن.`;

    // 3. استدعاء Gemini 2.5 Flash مع حماية المهلة القصوى (Timeout Guard)
    let aiResponse: AnalyzeSpikeResponse | null = null;

    try {
      const ai = getGenAIClient();

      // سباق زمني لإلغاء الطلب بعد انقضاء المهلة وحماية الـ Event Loop
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`GEMINI_TIMEOUT: تجاوزت المعالجة المهلة المحددة (${GEMINI_REQUEST_TIMEOUT_MS}ms)`)),
          GEMINI_REQUEST_TIMEOUT_MS
        )
      );

      const generatePromise = ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          temperature: 0.1,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              level: {
                type: Type.STRING,
                enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
                description: 'مستوى الخطورة التشخيصي طبقاً لمؤشر Z-Score وقانون 21-15',
              },
              reasoning: {
                type: Type.STRING,
                description: 'التعليل الاقتصادي والقانوني للشذوذ السعري باللغة العربية',
              },
              recommendation: {
                type: Type.STRING,
                description: 'التوجيه الإجرائي الفوري لدورية التفتيش الميدانية',
              },
            },
            required: ['level', 'reasoning', 'recommendation'],
          },
        },
      });

      const response = await Promise.race([generatePromise, timeoutPromise]);

      if (response && response.text) {
        const parsed = JSON.parse(response.text);
        const validLevels: SpikeRiskLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
        const validatedLevel: SpikeRiskLevel = validLevels.includes(parsed.level) ? parsed.level : 'MEDIUM';

        aiResponse = {
          level: validatedLevel,
          reasoning: parsed.reasoning || 'تم رصد شذوذ سعري غير مبرر قانونياً.',
          recommendation: parsed.recommendation || 'إيفاد دورية تفتيش للتحقق الميداني من الفواتير والأسعار المقننة.',
          metadata: {
            modelUsed: GEMINI_MODEL,
            analysisLatencyMs: Date.now() - startTime,
            inflationDeltaPct: Number(deltaPct.toFixed(2)),
            calculatedZScore: payload.zScore,
            statisticallySignificant: isStatSignificant,
            isFallback: false,
          },
        };
      }
    } catch (aiError: any) {
      console.warn(
        `[Radar Spike Controller] تعذر استجابة نموذج Gemini أو حدث تجاوز للمهلة (${aiError?.message || aiError}). تفعيل محرك الاحتياط الاستدلالي (Heuristic Fallback)...`
      );
      aiResponse = computeHeuristicSpikeFallback(payload, deltaPct, startTime);
    }

    if (!aiResponse) {
      aiResponse = computeHeuristicSpikeFallback(payload, deltaPct, startTime);
    }

    // 4. إرجاع النتيجة الهيكلية
    res.status(200).json({
      success: true,
      data: aiResponse,
    });
  } catch (err: any) {
    console.error('[Radar Spike Controller Fatal Error] خطأ غير متوقع أثناء معالجة الطلب:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'حدث خطأ داخلي في الخادم أثناء تحليل الانحراف السعري.',
        details: process.env.NODE_ENV === 'development' ? err?.message : undefined,
      },
    });
  }
}
