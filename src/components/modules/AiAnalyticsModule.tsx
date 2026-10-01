/**
 * ==============================================================================
 * منظومة كَرِيمَة للرقابة الشاملة والشفافية الرقمية (Kareema Platform)
 * الموديل 5: محرك الذكاء الاصطناعي ولوحة القيادة التنفيذية (Executive Dashboard)
 * File: src/components/modules/AiAnalyticsModule.tsx
 * ==============================================================================
 */

import React, { useState, useMemo } from 'react';
import { AnomalyAlert, Commodity, CitizenReport } from '../../types';
import { analyzePriceAnomaly, AnomalyAnalysisResult } from '../../services/aiAnomalyService';
import { HistoricalPriceTrendChart } from './HistoricalPriceTrendChart';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  ShieldCheck, 
  Activity, 
  Sparkles, 
  Calendar, 
  Radio, 
  Cpu,
  Layers,
  ChevronRight,
  Flame,
  LayoutDashboard,
  BarChart3,
  Scale,
  Building2,
  FileSpreadsheet,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Filter
} from 'lucide-react';

interface AiAnalyticsModuleProps {
  anomalies: AnomalyAlert[];
  commodities: Commodity[];
  reports?: CitizenReport[];
}

// نموذج بيانات المخالفات الشهرية
interface MonthlyViolationData {
  month: string;
  totalViolations: number;
  illicitSpeculation: number;
  courtReferrals: number;
  resolvedComplaints: number;
}

// نموذج بيانات المخالفات حسب الولاية
interface WilayaViolationData {
  wilaya: string;
  priceGouging: number;
  unauthorizedHoarding: number;
  total: number;
  complianceRate: number;
}

export const AiAnalyticsModule: React.FC<AiAnalyticsModuleProps> = ({
  anomalies,
  commodities,
  reports = [],
}) => {
  // التبديل بين لوحة القيادة التنفيذية ومختبر الذكاء الاصطناعي
  const [activeTab, setActiveTab] = useState<'executive' | 'ai_diagnostics'>('executive');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'2026_full' | 'last_6_months' | 'q3_2026'>('2026_full');

  // مختبر فحص الذكاء الاصطناعي
  const [selectedCommodityId, setSelectedCommodityId] = useState<string>(commodities[0].id);
  const [testObservedPrice, setTestObservedPrice] = useState<number>(commodities[0].currentMarketAvgPrice);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnomalyAnalysisResult | null>(null);

  const currentCommodity = commodities.find((c) => c.id === selectedCommodityId) || commodities[0];

  // 1. بيانات السلسلة الزمنية الشهرية لمخالفات الأسعار (Monthly Price Violations Trend)
  const monthlyViolationsData: MonthlyViolationData[] = useMemo(() => [
    { month: 'جانفي 2026', totalViolations: 450, illicitSpeculation: 120, courtReferrals: 45, resolvedComplaints: 380 },
    { month: 'فيفري 2026', totalViolations: 510, illicitSpeculation: 145, courtReferrals: 62, resolvedComplaints: 430 },
    { month: 'مارس 2026', totalViolations: 680, illicitSpeculation: 210, courtReferrals: 98, resolvedComplaints: 560 }, // ذروة موسمية
    { month: 'أفريل 2026', totalViolations: 590, illicitSpeculation: 175, courtReferrals: 75, resolvedComplaints: 495 },
    { month: 'ماي 2026', totalViolations: 430, illicitSpeculation: 110, courtReferrals: 42, resolvedComplaints: 390 },
    { month: 'جوان 2026', totalViolations: 380, illicitSpeculation: 95, courtReferrals: 38, resolvedComplaints: 350 },
    { month: 'جويلية 2026', totalViolations: 340, illicitSpeculation: 80, courtReferrals: 29, resolvedComplaints: 310 },
    { month: 'أوت 2026', totalViolations: 395, illicitSpeculation: 105, courtReferrals: 36, resolvedComplaints: 365 },
    { month: 'سبتمبر 2026', totalViolations: 310, illicitSpeculation: 68, courtReferrals: 22, resolvedComplaints: 290 }, // انخفاض بفضل منصة كريمة
    { month: 'أكتوبر 2026 (توقع)', totalViolations: 260, illicitSpeculation: 45, courtReferrals: 15, resolvedComplaints: 250 },
  ], []);

  // 2. بيانات المخالفات حسب الولايات (Violations by Wilaya)
  const wilayaViolationsData: WilayaViolationData[] = useMemo(() => [
    { wilaya: 'الجزائر العاصمة', priceGouging: 142, unauthorizedHoarding: 38, total: 180, complianceRate: 88 },
    { wilaya: 'وهران', priceGouging: 98, unauthorizedHoarding: 29, total: 127, complianceRate: 91 },
    { wilaya: 'سطيف', priceGouging: 84, unauthorizedHoarding: 32, total: 116, complianceRate: 86 },
    { wilaya: 'قسنطينة', priceGouging: 76, unauthorizedHoarding: 21, total: 97, complianceRate: 92 },
    { wilaya: 'البليدة', priceGouging: 62, unauthorizedHoarding: 45, total: 107, complianceRate: 84 }, // تمركز مخازن التبريد
    { wilaya: 'باتنة', priceGouging: 55, unauthorizedHoarding: 18, total: 73, complianceRate: 93 },
    { wilaya: 'عين الدفلى', priceGouging: 48, unauthorizedHoarding: 39, total: 87, complianceRate: 85 }, // أحواض إنتاج البطاطا
    { wilaya: 'عنابة', priceGouging: 52, unauthorizedHoarding: 14, total: 66, complianceRate: 94 },
    { wilaya: 'تلمسان', priceGouging: 44, unauthorizedHoarding: 16, total: 60, complianceRate: 95 },
    { wilaya: 'بسكرة', priceGouging: 38, unauthorizedHoarding: 22, total: 60, complianceRate: 93 },
  ], []);

  // حساب مؤشرات الأداء التنفيذية العليا (Executive KPI Aggregates)
  const executiveMetrics = useMemo(() => {
    const totalViolationsSum = monthlyViolationsData.reduce((acc, curr) => acc + curr.totalViolations, 0);
    const totalSpeculationSum = monthlyViolationsData.reduce((acc, curr) => acc + curr.illicitSpeculation, 0);
    const totalCourtReferrals = monthlyViolationsData.reduce((acc, curr) => acc + curr.courtReferrals, 0);
    const avgCompliance = Math.round(
      wilayaViolationsData.reduce((acc, curr) => acc + curr.complianceRate, 0) / wilayaViolationsData.length
    );

    return {
      totalViolationsSum,
      totalSpeculationSum,
      totalCourtReferrals,
      avgCompliance,
      totalFinesEstimatedDzd: (totalViolationsSum * 175000) / 1000000, // بملايين الدنانير
    };
  }, [monthlyViolationsData, wilayaViolationsData]);

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
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1.5">
                <LayoutDashboard className="w-3.5 h-3.5" />
                الموديل رقم 5: لوحة القيادة التنفيذية ومحرك الاستشعار الذكي
              </span>
              <span className="text-xs text-slate-400 font-mono">Executive Intelligence &amp; AI Anomaly Engine</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white">
              لوحة القيادة التنفيذية ورادار التنبؤ بالاحتكار والأسعار
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
              رؤى إحصائية عليا لصناع القرار في وزارة التجارة والفلاحة: تحليل اتجاهات المخالفات الشهرية، وتوزيع الخروقات حسب الولايات وفق مقتضيات القانون رقم 21-15.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-950/80 p-3 rounded-xl border border-purple-900/60 text-center">
              <div className="text-[11px] text-purple-300 flex items-center justify-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>دقة النماذج التنبؤية</span>
              </div>
              <div className="text-2xl font-black text-purple-400 font-mono mt-0.5">94.8%</div>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="mt-6 flex items-center gap-2 border-t border-purple-900/40 pt-4">
          <button
            onClick={() => setActiveTab('executive')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'executive'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40 border border-purple-400/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>لوحة القيادة التنفيذية للوزارة (Executive Dashboard)</span>
          </button>

          <button
            onClick={() => setActiveTab('ai_diagnostics')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'ai_diagnostics'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40 border border-purple-400/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Brain className="w-4 h-4" />
            <span>رادار الاستشعار والتشخيص الفوري (Gemini 2.5 Flash)</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: EXECUTIVE DASHBOARD (Recharts Line & Bar Visualizations)            */}
      {/* ========================================================================= */}
      {activeTab === 'executive' && (
        <div className="space-y-6">
          {/* Executive KPI Metric Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">إجمالي مخالفات الأسعار (2026)</span>
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Scale className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-white font-mono">{executiveMetrics.totalViolationsSum.toLocaleString()}</span>
                <span className="text-xs text-emerald-400 font-semibold flex items-center">
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  -28% مقارنة بـ 2025
                </span>
              </div>
              <div className="mt-1 text-[11px] text-slate-500">تمت معاينتها من قبل فرق الرقابة وقمع الغش</div>
            </div>

            <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">شبهات المضاربة غير المشروعة</span>
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-rose-400 font-mono">{executiveMetrics.totalSpeculationSum.toLocaleString()}</span>
                <span className="text-xs text-rose-300 font-semibold font-mono">
                  {Math.round((executiveMetrics.totalSpeculationSum / executiveMetrics.totalViolationsSum) * 100)}% من الإجمالي
                </span>
              </div>
              <div className="mt-1 text-[11px] text-slate-500">موصوفة تحت طائلة القانون 21-15</div>
            </div>

            <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">الإحالات للنيابة القضائية</span>
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Building2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-amber-400 font-mono">{executiveMetrics.totalCourtReferrals.toLocaleString()}</span>
                <span className="text-xs text-emerald-400 font-semibold">محاضر جنائية نافذة</span>
              </div>
              <div className="mt-1 text-[11px] text-slate-500">إحالة فورية بموجب المادة 4 من قانون المضاربة</div>
            </div>

            <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">معدل الامتثال الوطني للأسعار</span>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-400 font-mono">{executiveMetrics.avgCompliance}%</span>
                <span className="text-xs text-emerald-300 font-semibold">استقرار ملحوظ</span>
              </div>
              <div className="mt-1 text-[11px] text-slate-500">معدل التزام نقاط البيع بالأسعار المسقفة</div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Chart 1: Trend line of Monthly Price Violations */}
            <div className="lg:col-span-7 bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-lg space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                    المسار الزمني لمخالفات الأسعار الشهرية (Monthly Price Violations Trend)
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    تطور حجم المخالفات المسجلة شهرياً مع مقارنة قضايا المضاربة والإحالة القضائية
                  </p>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
                  <span className="px-2 py-0.5 text-purple-300 font-mono font-bold">2026 YTD</span>
                </div>
              </div>

              {/* Recharts LineChart */}
              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyViolationsData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis 
                      dataKey="month" 
                      stroke="#64748b" 
                      fontSize={10} 
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="#64748b" 
                      fontSize={10} 
                      tickLine={false} 
                      domain={[0, 'dataMax + 80']}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-slate-950/95 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1.5 text-right font-sans">
                              <div className="font-bold text-white border-b border-slate-800 pb-1">{label}</div>
                              <div className="text-purple-400 flex items-center justify-between gap-4">
                                <span>إجمالي المخالفات:</span>
                                <strong className="font-mono">{payload[0]?.value} محضر</strong>
                              </div>
                              <div className="text-rose-400 flex items-center justify-between gap-4">
                                <span>مضاربة غير مشروعة:</span>
                                <strong className="font-mono">{payload[1]?.value} قضية</strong>
                              </div>
                              <div className="text-amber-400 flex items-center justify-between gap-4">
                                <span>إحالات للنيابة:</span>
                                <strong className="font-mono">{payload[2]?.value} إرسالية</strong>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend 
                      verticalAlign="top" 
                      height={36} 
                      iconType="circle"
                      formatter={(val) => <span className="text-slate-300 text-xs px-1">{val}</span>}
                    />
                    <Line
                      name="إجمالي المخالفات"
                      type="monotone"
                      dataKey="totalViolations"
                      stroke="#a855f7"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#a855f7', stroke: '#1e1b4b', strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      name="مضاربة غير مشروعة (قانون 21-15)"
                      type="monotone"
                      dataKey="illicitSpeculation"
                      stroke="#f43f5e"
                      strokeWidth={2.5}
                      strokeDasharray="4 4"
                      dot={{ r: 3, fill: '#f43f5e' }}
                    />
                    <Line
                      name="إحالات للنيابة القضائية"
                      type="monotone"
                      dataKey="courtReferrals"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#f59e0b' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-purple-300">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <strong>الاستنتاج التحليلي:</strong> انخفاض ملموس بنسبة 54% في المخالفات من ذروة مارس حتى سبتمبر بفضل تفعيل جواز السفر الرقمي وتتبع PostGIS.
                </span>
              </div>
            </div>

            {/* Chart 2: Violations by Wilaya Bar Chart */}
            <div className="lg:col-span-5 bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-indigo-400" />
                    المخالفات حسب الولايات (Violations by Wilaya)
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    مقارنة التجاوز السعري بالتجزئة مقابل التخزين المشبوه بمخازن التبريد
                  </p>
                </div>
              </div>

              {/* Recharts BarChart */}
              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={wilayaViolationsData} margin={{ top: 10, right: 10, left: -15, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis 
                      dataKey="wilaya" 
                      stroke="#64748b" 
                      fontSize={9} 
                      angle={-35} 
                      textAnchor="end" 
                      interval={0}
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="#64748b" 
                      fontSize={10} 
                      tickLine={false}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-slate-950/95 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1 text-right font-sans">
                              <div className="font-bold text-white border-b border-slate-800 pb-1">{label}</div>
                              <div className="text-indigo-400 flex items-center justify-between gap-3">
                                <span>تجاوز سعري (تجزئة):</span>
                                <strong className="font-mono">{payload[0]?.value} محضر</strong>
                              </div>
                              <div className="text-rose-400 flex items-center justify-between gap-3">
                                <span>احتكار غرف تبريد:</span>
                                <strong className="font-mono">{payload[1]?.value} مخالفة</strong>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend 
                      verticalAlign="top" 
                      height={36} 
                      iconType="rect"
                      formatter={(val) => <span className="text-slate-300 text-xs px-1">{val}</span>}
                    />
                    <Bar name="تجاوز سعري وفوترة" dataKey="priceGouging" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar name="احتكار غرف التبريد" dataKey="unauthorizedHoarding" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-[11px] text-slate-400">
                <span className="text-amber-300 font-bold">ملاحظة أمنية:</span> ولايات البليدة وعين الدفلى تسجل النسبة الأعلى في شبهات احتكار مخازن التبريد، مما يستوجب تكثيف دوريات الاستشعار المكاني (PostGIS Dwell Radar).
              </div>
            </div>
          </div>

          {/* Strategic Action Directives for Administrators */}
          <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-lg space-y-3">
            <h4 className="font-extrabold text-white text-sm flex items-center gap-2 border-b border-slate-800 pb-3">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              توجيهات التدخل الاستراتيجي للقيادة العليا (Executive Strategic Directives)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-purple-900/40 space-y-1.5">
                <div className="font-bold text-purple-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                  إعادة توجيه فرق التفتيش:
                </div>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  تحويل 30% من دوريات المراقبة من أسواق الجملة المستقرة إلى شبكات التجزئة غير النظامية بولايات الجزائر العاصمة ووهران وسطيف.
                </p>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-rose-900/40 space-y-1.5">
                <div className="font-bold text-rose-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                  تفعيل المادة 13 من قانون 21-15:
                </div>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  التنسيق الفوري مع ولاة الجمهورية لمصادرة المخزونات غير المصرح بها في غرف التبريد وتفريغها مباشرة عبر نقاط بيع الدواوين العمومية.
                </p>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-emerald-900/40 space-y-1.5">
                <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  جواز سفر الشحنات الإلزامي:
                </div>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  تعميم إبراز رمز QR الرقمي للشاحنات الناقلة للبطاطا واللحوم بنسبة 100% بنقاط المراقبة التابعة للدرك والأمن الوطني.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: AI ANOMALY RADAR & DIAGNOSTIC LAB                                  */}
      {/* ========================================================================= */}
      {activeTab === 'ai_diagnostics' && (
        <div className="space-y-6">
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
      )}
    </div>
  );
};
