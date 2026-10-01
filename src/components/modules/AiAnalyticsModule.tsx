import React, { useState } from 'react';
import { AnomalyAlert, Commodity } from '../../types';
import { analyzePriceAnomaly, AnomalyAnalysisResult } from '../../services/aiAnomalyService';
import { HistoricalPriceTrendChart } from './HistoricalPriceTrendChart';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  ShieldCheck, 
  Activity, 
  Sparkles, 
  Calendar, 
  PieChart, 
  Radio, 
  Cpu,
  Layers,
  ChevronRight,
  Flame
} from 'lucide-react';

interface AiAnalyticsModuleProps {
  anomalies: AnomalyAlert[];
  commodities: Commodity[];
}

export const AiAnalyticsModule: React.FC<AiAnalyticsModuleProps> = ({
  anomalies,
  commodities,
}) => {
  const [selectedCommodityId, setSelectedCommodityId] = useState<string>(commodities[0].id);
  const [testObservedPrice, setTestObservedPrice] = useState<number>(commodities[0].currentMarketAvgPrice);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnomalyAnalysisResult | null>(null);

  const currentCommodity = commodities.find((c) => c.id === selectedCommodityId) || commodities[0];

  const handleRunAiDiagnostics = async () => {
    setAnalyzing(true);
    try {
      const result = await analyzePriceAnomaly({
        commodityName: currentCommodity.nameAr,
        farmGatePrice: currentCommodity.baseFarmGateCost,
        observedRetailPrice: testObservedPrice,
        officialCeiling: currentCommodity.officialCeilingPrice,
        wilaya: 'الجزائر العاصمة',
        coldChainRequired: currentCommodity.category === 'meat' || currentCommodity.category === 'fish',
        transitKm: 250,
      });
      setAnalysisResult(result);
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 p-6 rounded-2xl border border-purple-800/40 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                الموديل رقم 5: محرك الذكاء الاصطناعي وكشف الشذوذ
              </span>
              <span className="text-xs text-slate-400 font-mono">Gemini &amp; Predictive ML Models</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white">
              رادار التنبؤ بالمضاربة وعجز المحاصيل الزراعية
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
              تحليل خوارزمي متقدم لبيانات العرض والطلب، استشعار الارتفاعات المفاجئة (Price Spikes Anomaly Detection)، والتنبؤ بمواسم الشح في الإنتاج الفلاحي قبل حدوثها.
            </p>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-purple-900/60 text-center">
            <div className="text-[11px] text-purple-300 flex items-center justify-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>دقة نماذج التنبؤ</span>
            </div>
            <div className="text-2xl font-black text-purple-400 font-mono mt-0.5">94.8%</div>
          </div>
        </div>
      </div>

      {/* Historical Trend Comparison Chart: Last 30 Days */}
      <HistoricalPriceTrendChart commodities={commodities} />

      {/* Grid: Live Anomaly Alerts & Interactive AI Diagnostic Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Real-time Anomaly Alerts */}
        <div className="lg:col-span-6 bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
              <Radio className="w-4 h-4 text-purple-400 animate-pulse" />
              الإنذارات المبكرة النشطة (رادار المضاربة اللحظي)
            </h3>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
              Z-Score &gt; 2.5
            </span>
          </div>

          <div className="space-y-3">
            {anomalies.map((ano) => (
              <div
                key={ano.id}
                className="bg-slate-950 p-4 rounded-xl border border-purple-900/40 hover:border-purple-600/60 transition-all space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{ano.commodityNameAr}</span>
                    <span className="text-slate-400 text-[11px]">({ano.wilaya})</span>
                  </div>

                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    ano.severity === 'critical' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                    'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    درجة الثقة: {ano.confidencePct}%
                  </span>
                </div>

                <p className="text-slate-300 text-xs leading-relaxed">
                  {ano.descriptionAr}
                </p>

                <div className="bg-purple-950/40 p-2.5 rounded-lg border border-purple-900/50 text-[11px] text-purple-200">
                  <strong className="text-purple-300">التوصية الاستباقية للوزارة:</strong> {ano.recommendedActionAr}
                </div>
              </div>
            ))}
          </div>

          {/* Seasonal Yield Forecast Box */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
            <h4 className="font-bold text-white flex items-center gap-2 text-xs">
              <Calendar className="w-4 h-4 text-emerald-400" />
              توقعات وفرة المحاصيل للأشهر الثلاثة القادمة (Yield Forecast)
            </h4>
            <div className="space-y-1.5 text-slate-400 text-[11px]">
              <div className="flex justify-between">
                <span>🥔 بطاطا الاستهلاك (جني واد سوف ومعسكر):</span>
                <span className="text-emerald-400 font-bold font-mono">+12% وفرة متوقعة (استقرار سعري)</span>
              </div>
              <div className="flex justify-between">
                <span>🍅 طماطم حقلية وصناعية:</span>
                <span className="text-amber-400 font-bold font-mono">انخفاض موسمي طفيف (-5%)</span>
              </div>
              <div className="flex justify-between">
                <span>🥩 اللحوم الحمراء المحلية:</span>
                <span className="text-rose-400 font-bold font-mono">ضغط في الأعلاف يستوجب تفريغ المخزون</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive AI Diagnostic Workbench */}
        <div className="lg:col-span-6 bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-lg space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-extrabold text-white text-base flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" />
              مختبر الفحص الذكي للأسعار والشبهات (AI Diagnostic)
            </h3>
            <span className="text-xs font-mono text-purple-300 bg-purple-950 px-2 py-0.5 rounded border border-purple-800">
              Gemini 2.5 Flash
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-300 block mb-1">اختر المادة الفلاحية للاختبار:</label>
              <select
                value={selectedCommodityId}
                onChange={(e) => {
                  const comm = commodities.find((c) => c.id === e.target.value);
                  if (comm) {
                    setSelectedCommodityId(comm.id);
                    setTestObservedPrice(comm.currentMarketAvgPrice);
                    setAnalysisResult(null);
                  }
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              >
                {commodities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.nameAr} - السقف المعتمد: {c.officialCeilingPrice} دج
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1">السعر المعروض للبيع بالتجزئة (دج/كلغ):</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={testObservedPrice}
                  onChange={(e) => setTestObservedPrice(Number(e.target.value))}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold"
                />
                <button
                  onClick={handleRunAiDiagnostics}
                  disabled={analyzing}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {analyzing ? (
                    <span className="flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 animate-spin" />
                      جاري التحليل...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      تشخيص الذكاء الاصطناعي
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* AI Output Result Box */}
          {analysisResult ? (
            <div className={`p-4 rounded-xl border space-y-3 ${
              analysisResult.verdict === 'CRITICAL_GOUGING'
                ? 'bg-rose-950/40 border-rose-500/50'
                : analysisResult.verdict === 'INVESTIGATION_RECOMMENDED'
                ? 'bg-amber-950/40 border-amber-500/50'
                : 'bg-emerald-950/40 border-emerald-500/50'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                  analysisResult.verdict === 'CRITICAL_GOUGING' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                  analysisResult.verdict === 'INVESTIGATION_RECOMMENDED' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                  'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                  الحكم: {analysisResult.verdict}
                </span>

                <span className="text-xs font-mono text-slate-300">
                  مؤشر الخطر: <strong className="text-white">{analysisResult.riskScore}/100</strong>
                </span>
              </div>

              <p className="text-xs text-white leading-relaxed">
                {analysisResult.summaryAr}
              </p>

              <div>
                <div className="text-[11px] font-bold text-slate-300 mb-1">العوامل المؤثرة المكتشفة:</div>
                <ul className="list-disc list-inside text-[11px] text-slate-400 space-y-0.5">
                  {analysisResult.contributingFactorsAr.map((factor, i) => (
                    <li key={i}>{factor}</li>
                  ))}
                </ul>
              </div>

              <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-300">
                <strong className="text-emerald-400">الإجراء الردعي الموصى به:</strong> {analysisResult.recommendedEnforcementActionAr}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-950 rounded-xl border border-slate-800/80">
              اضغط على زر &quot;تشخيص الذكاء الاصطناعي&quot; لتوليد تقرير استقصائي شامل يوضح أسباب الفجوة السعرية وهوامش الوساطة.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
