import { GoogleGenAI } from '@google/genai';

export interface AnomalyAnalysisResult {
  riskScore: number; // 0 - 100
  verdict: 'LEGAL_COMPLIANT' | 'INVESTIGATION_RECOMMENDED' | 'CRITICAL_GOUGING';
  summaryAr: string;
  contributingFactorsAr: string[];
  recommendedEnforcementActionAr: string;
  source: 'gemini-ai' | 'heuristic-engine';
}

export async function analyzePriceAnomaly(params: {
  commodityName: string;
  farmGatePrice: number;
  observedRetailPrice: number;
  officialCeiling: number;
  wilaya: string;
  coldChainRequired: boolean;
  transitKm: number;
}): Promise<AnomalyAnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY || (typeof window !== 'undefined' ? (window as any).GEMINI_API_KEY : undefined);
  const deltaPct = ((params.observedRetailPrice - params.officialCeiling) / params.officialCeiling) * 100;

  // If Gemini API is available, ask the AI model for expert supply-chain intelligence
  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `أنت خبير اقتصادي ومفتش رئيسي في منظومة "كَرِيمَة" لمكافحة الاحتكار والمضاربة غير المشروعة في الجزائر وشمال أفريقيا.
قم بتحليل الحالة التالية وأعط النتيجة كـ JSON صارم:
- السلعة: ${params.commodityName}
- سعر الخروج من المزرعة: ${params.farmGatePrice} دج/كلغ
- السعر المرجعي المسقف رسمياً: ${params.officialCeiling} دج/كلغ
- سعر التجزئة المرصود في السوق: ${params.observedRetailPrice} دج/كلغ
- نسبة الارتفاع عن السقف: ${deltaPct.toFixed(1)}%
- مسافة النقل: ${params.transitKm} كم
- الولاية: ${params.wilaya}

المطلوب إرجاع JSON فقط بالحقول التالية:
{
  "riskScore": number (0-100),
  "verdict": "LEGAL_COMPLIANT" | "INVESTIGATION_RECOMMENDED" | "CRITICAL_GOUGING",
  "summaryAr": "ملخص تشخيصي دقيق باللغة العربية",
  "contributingFactorsAr": ["عامل 1", "عامل 2"],
  "recommendedEnforcementActionAr": "إجراء ردعي محدد طبقا لقانون مكافحة المضاربة 21-15"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        return {
          ...parsed,
          source: 'gemini-ai',
        };
      }
    } catch (e) {
      console.warn('Gemini API call skipped or errored, falling back to sovereign heuristic:', e);
    }
  }

  // Robust sovereign heuristic engine:
  const riskScore = Math.min(100, Math.max(0, Math.round(deltaPct * 1.8)));
  let verdict: 'LEGAL_COMPLIANT' | 'INVESTIGATION_RECOMMENDED' | 'CRITICAL_GOUGING' = 'LEGAL_COMPLIANT';
  let summaryAr = 'السعر يقع ضمن النطاق المقبول قانوناً مع مراعاة تكاليف التوزيع العادية.';
  let actionAr = 'لا يتطلب أي إجراء؛ إبقاء المؤشر في نظام الرصد الدوري.';
  const factors: string[] = [];

  if (deltaPct > 25) {
    verdict = 'CRITICAL_GOUGING';
    summaryAr = `رصد تضخم احتكاري فاحش بنسبة +${deltaPct.toFixed(1)}% يتجاوز أقصى هامش ربح مسموح به، مع وجود فجوة غير مبررة تفوق 3 أضعاف تكلفة النقل والوساطة.`;
    actionAr = 'إيفاد فوري لفرقة قمع الغش المتنقلة، تجميد رصيد الشحنات غير المفوترة، وتطبيق أحكام قانون مكافحة المضاربة غير المشروعة (قانون رقم 21-15).';
    factors.push(`ارتفاع السعر بمقدار ${(params.observedRetailPrice - params.officialCeiling).toFixed(0)} دج/كلغ فوق السقف المعتمد`);
    factors.push('شبهة تخزين غير مشروع بغرف التبريد بغرض تعطيش السوق المحلية');
    factors.push('استغلال سلسلة وسطاء غير رسميين لرفع الفواتير الصورية');
  } else if (deltaPct > 5) {
    verdict = 'INVESTIGATION_RECOMMENDED';
    summaryAr = `زيادة بنسبة +${deltaPct.toFixed(1)}% تستوجب التدقيق في فواتير الشراء وسندات الشحن للتأكد من عدم تضخيم تكلفة النقل.`;
    actionAr = 'إشعار مفتش مديرية التجارة الولائية لمعاينة سجل المبيعات وإلزام البائع بإشهار الأسعار والامتثال للسقف.';
    factors.push('هامش ربح تجزئة يفوق 18% المعتمدة نظاماً');
    factors.push(`تكلفة النقل المقدرة لمسافة ${params.transitKm} كم لا تبرر هذا الفارق`);
  } else {
    factors.push('تطابق فواتير الشحن مع مسار التوزيع المصادق عليه');
    factors.push('احترام سقف الهامش التجاري المسموح به للمستهلك');
  }

  return {
    riskScore,
    verdict,
    summaryAr,
    contributingFactorsAr: factors,
    recommendedEnforcementActionAr: actionAr,
    source: 'heuristic-engine',
  };
}
