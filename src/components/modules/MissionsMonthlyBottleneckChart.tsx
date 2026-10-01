import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { 
  BarChart3, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  Clock, 
  Layers, 
  Info,
  Calendar,
  Sparkles,
  Zap,
  ArrowRight,
  Filter
} from 'lucide-react';
import { InspectionMission, CitizenReport, AuditLogEntry } from '../../types';

interface MissionsMonthlyBottleneckChartProps {
  missions: InspectionMission[];
  reports: CitizenReport[];
  auditLogs: AuditLogEntry[];
}

interface MonthlyDataPoint {
  monthKey: string;
  monthName: string;
  year: number;
  completedMissions: number;
  pendingViolations: number;
  bottleneckRatePct: number;
  criticalPending: number;
  avgResolutionDays: number;
  bottleneckCause: string;
  bottleneckSeverity: 'normal' | 'moderate' | 'critical';
}

export const MissionsMonthlyBottleneckChart: React.FC<MissionsMonthlyBottleneckChartProps> = ({
  missions,
  reports,
  auditLogs,
}) => {
  const [timeframe, setTimeframe] = useState<'6months' | 'fullYear'>('6months');
  const [selectedWilaya, setSelectedWilaya] = useState<string>('all');
  const [selectedMonthDetail, setSelectedMonthDetail] = useState<MonthlyDataPoint | null>(null);

  // حساب وتجميع البيانات الشهرية للمهام المكتملة مقابل المخالفات العالقة
  const monthlyData: MonthlyDataPoint[] = useMemo(() => {
    // Current live metrics for September 2026
    const liveCompleted = missions.filter((m) => m.status === 'completed').length;
    const livePendingViolations = reports.filter(
      (r) => r.status === 'pending' || r.status === 'triaged' || r.status === 'inspector_dispatched'
    ).length;
    const liveCriticalPending = reports.filter(
      (r) => (r.status === 'pending' || r.status === 'triaged' || r.status === 'inspector_dispatched') && r.inflationDeltaPct >= 40
    ).length;

    // Wilaya adjustment factor
    const wilayaFactor = selectedWilaya === 'all' ? 1 : 0.35;

    const baseMonths: Omit<MonthlyDataPoint, 'bottleneckRatePct'>[] = [
      {
        monthKey: '2026-01',
        monthName: 'جانفي',
        year: 2026,
        completedMissions: Math.round(38 * wilayaFactor),
        pendingViolations: Math.round(14 * wilayaFactor),
        criticalPending: Math.round(4 * wilayaFactor),
        avgResolutionDays: 1.4,
        bottleneckCause: 'استقرار سلاسل الإمداد ومعدل بلاغات اعتيادي في المواد الغذائية',
        bottleneckSeverity: 'normal',
      },
      {
        monthKey: '2026-02',
        monthName: 'فيفري',
        year: 2026,
        completedMissions: Math.round(42 * wilayaFactor),
        pendingViolations: Math.round(18 * wilayaFactor),
        criticalPending: Math.round(5 * wilayaFactor),
        avgResolutionDays: 1.6,
        bottleneckCause: 'بداية التحضير لموسم رمضان وزيادة تخزين بعض التجار',
        bottleneckSeverity: 'normal',
      },
      {
        monthKey: '2026-03',
        monthName: 'مارس',
        year: 2026,
        completedMissions: Math.round(58 * wilayaFactor),
        pendingViolations: Math.round(34 * wilayaFactor),
        criticalPending: Math.round(12 * wilayaFactor),
        avgResolutionDays: 2.3,
        bottleneckCause: 'ذروة الطلب الاستهلاكي قبيل الشهر الفضيل وتضاعف البلاغات',
        bottleneckSeverity: 'moderate',
      },
      {
        monthKey: '2026-04',
        monthName: 'أفريل',
        year: 2026,
        completedMissions: Math.round(74 * wilayaFactor),
        pendingViolations: Math.round(62 * wilayaFactor),
        criticalPending: Math.round(26 * wilayaFactor),
        avgResolutionDays: 3.2,
        bottleneckCause: 'اختناق ملحوظ: ضغط مضاربة في مادة اللحوم الحمراء الطازجة وتجاوز سقف 2500 د.ج',
        bottleneckSeverity: 'critical',
      },
      {
        monthKey: '2026-05',
        monthName: 'ماي',
        year: 2026,
        completedMissions: Math.round(68 * wilayaFactor),
        pendingViolations: Math.round(41 * wilayaFactor),
        criticalPending: Math.round(14 * wilayaFactor),
        avgResolutionDays: 2.1,
        bottleneckCause: 'تحسن وتيرة المعالجة بفضل إطلاق خطة الدوريات المشتركة المستعجلة',
        bottleneckSeverity: 'moderate',
      },
      {
        monthKey: '2026-06',
        monthName: 'جوان',
        year: 2026,
        completedMissions: Math.round(61 * wilayaFactor),
        pendingViolations: Math.round(33 * wilayaFactor),
        criticalPending: Math.round(11 * wilayaFactor),
        avgResolutionDays: 1.9,
        bottleneckCause: 'انتقال الفائض الرقابي نحو أسواق الجملة للخضر والفواكه الموسمية',
        bottleneckSeverity: 'normal',
      },
      {
        monthKey: '2026-07',
        monthName: 'جويلية',
        year: 2026,
        completedMissions: Math.round(52 * wilayaFactor),
        pendingViolations: Math.round(49 * wilayaFactor),
        criticalPending: Math.round(19 * wilayaFactor),
        avgResolutionDays: 2.8,
        bottleneckCause: 'اختناق صيفي: نقص التغطية الميدانية في ولايات الساحل مع توافد المصطافين',
        bottleneckSeverity: 'critical',
      },
      {
        monthKey: '2026-08',
        monthName: 'أوت',
        year: 2026,
        completedMissions: Math.round(66 * wilayaFactor),
        pendingViolations: Math.round(38 * wilayaFactor),
        criticalPending: Math.round(13 * wilayaFactor),
        avgResolutionDays: 2.0,
        bottleneckCause: 'تفعيل نظام المسارات الأمثل TSP لتقليص زمن وصول الدوريات',
        bottleneckSeverity: 'moderate',
      },
      {
        monthKey: '2026-09',
        monthName: 'سبتمبر (الحالي)',
        year: 2026,
        completedMissions: Math.max(1, Math.round((liveCompleted * 10 + 45) * wilayaFactor)),
        pendingViolations: Math.max(1, Math.round((livePendingViolations * 3 + 12) * wilayaFactor)),
        criticalPending: Math.max(1, Math.round((liveCriticalPending * 2 + 5) * wilayaFactor)),
        avgResolutionDays: 1.5,
        bottleneckCause: 'توازن تشغيلي مع الدخول الاجتماعي، ومراقبة صارمة لأسعار البطاطا واللحوم المستوردة',
        bottleneckSeverity: 'normal',
      },
    ];

    const dataWithRates = baseMonths.map((m) => {
      // Bottleneck pressure index = (Pending / Completed) * 100
      const rate = m.completedMissions > 0 
        ? Math.round((m.pendingViolations / m.completedMissions) * 100) 
        : 100;
      return {
        ...m,
        bottleneckRatePct: rate,
      };
    });

    return timeframe === '6months' ? dataWithRates.slice(-6) : dataWithRates;
  }, [missions, reports, timeframe, selectedWilaya]);

  // المؤشرات التلخيصية للاختناق
  const stats = useMemo(() => {
    const totalCompleted = monthlyData.reduce((acc, curr) => acc + curr.completedMissions, 0);
    const totalPending = monthlyData.reduce((acc, curr) => acc + curr.pendingViolations, 0);
    const avgBottleneckRate = Math.round(
      monthlyData.reduce((acc, curr) => acc + curr.bottleneckRatePct, 0) / (monthlyData.length || 1)
    );

    // Month with worst bottleneck
    const peakBottleneckMonth = [...monthlyData].sort(
      (a, b) => b.bottleneckRatePct - a.bottleneckRatePct
    )[0];

    const clearanceRate = Math.round((totalCompleted / (totalCompleted + totalPending || 1)) * 100);

    return {
      totalCompleted,
      totalPending,
      avgBottleneckRate,
      peakBottleneckMonth,
      clearanceRate,
    };
  }, [monthlyData]);

  return (
    <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/90 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-rose-400" />
              <span>تحليل كفاءة الإنجاز ومعالجة الاختناقات التشغيلية</span>
            </span>
            <span className="text-xs text-slate-400 font-mono">Recharts Bottleneck Telemetry</span>
          </div>
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            مقارنة شهرية: المهام التفتيشية المنجزة مقابل المخالفات العالقة
          </h3>
          <p className="text-xs text-slate-400 max-w-2xl mt-1">
            رصد الفجوة الزمنية بين سرعة استجابة فرق الرقابة الميدانية ومعدل تراكم تذاكر المخالفات، لتحديد نقاط الاختناق في الموارد البشرية واللوجستية.
          </p>
        </div>

        {/* Filters & Timeframe Toggle */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Wilaya Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 mr-1" />
            <select
              value={selectedWilaya}
              onChange={(e) => setSelectedWilaya(e.target.value)}
              className="bg-transparent text-slate-200 text-xs font-bold focus:outline-hidden py-1 px-1"
            >
              <option value="all" className="bg-slate-900 text-white">كافة الولايات</option>
              <option value="algiers" className="bg-slate-900 text-white">الجزائر العاصمة</option>
              <option value="oran" className="bg-slate-900 text-white">وهران</option>
              <option value="constantine" className="bg-slate-900 text-white">قسنطينة</option>
              <option value="blida" className="bg-slate-900 text-white">البليدة</option>
            </select>
          </div>

          {/* Timeframe Selector */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => setTimeframe('6months')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeframe === '6months'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              آخر 6 أشهر
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('fullYear')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeframe === 'fullYear'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              سنة 2026 كاملة (9 أشهر)
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards: Operational Bottleneck Insights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Completed */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>إجمالي المهام المنجزة</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {stats.totalCompleted}
            <span className="text-xs font-sans text-slate-400 mr-1.5 font-normal">دورية مغلقة</span>
          </div>
          <div className="text-[11px] text-emerald-400/80 mt-1 flex items-center gap-1 font-medium">
            <span>معدل التصفية: </span>
            <strong className="font-mono">{stats.clearanceRate}%</strong>
          </div>
        </div>

        {/* Total Pending Backlog */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>المخالفات العالقة المتراكمة</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono">
            {stats.totalPending}
            <span className="text-xs font-sans text-slate-400 mr-1.5 font-normal">تذكرة قيد المعالجة</span>
          </div>
          <div className="text-[11px] text-rose-400/80 mt-1 flex items-center gap-1 font-medium">
            <span>فجوة التشغيل: </span>
            <strong className="font-mono">-{stats.totalPending} بلاغ</strong>
          </div>
        </div>

        {/* Average Bottleneck Rate */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>متوسط مؤشر ضغط التراكم</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300 font-mono">
            {stats.avgBottleneckRate}%
            <span className="text-xs font-sans text-slate-400 mr-1.5 font-normal">نسبة العوالق</span>
          </div>
          <div className="text-[11px] text-amber-300/80 mt-1 flex items-center gap-1 font-medium">
            <span>الحالة العامة: </span>
            <strong className={stats.avgBottleneckRate > 60 ? 'text-rose-400' : 'text-emerald-400'}>
              {stats.avgBottleneckRate > 60 ? 'ضغط تشغيلي مرتفع' : 'تحت السيطرة الميدانية'}
            </strong>
          </div>
        </div>

        {/* Peak Bottleneck Period */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>أعلى شهر في الاختناق</span>
            <Zap className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-lg font-black text-white flex items-center gap-1.5 truncate">
            <span>{stats.peakBottleneckMonth?.monthName}</span>
            <span className="text-xs text-rose-400 font-mono font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
              +{stats.peakBottleneckMonth?.bottleneckRatePct}% ضغط
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 truncate" title={stats.peakBottleneckMonth?.bottleneckCause}>
            {stats.peakBottleneckMonth?.bottleneckCause}
          </div>
        </div>
      </div>

      {/* Main Recharts Composed Chart */}
      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-200">
              رسم بياني مركب: حجم التدخل الميداني المكتمل مقابل تراكم المخالفات
            </span>
          </div>

          {/* Chart Legend Badges */}
          <div className="flex items-center gap-4 text-xs font-bold flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-emerald-500 inline-block shadow-xs"></span>
              <span className="text-slate-300">مهام مكتملة</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-rose-500 inline-block shadow-xs"></span>
              <span className="text-slate-300">مخالفات عالقة</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-amber-400 inline-block"></span>
              <span className="text-amber-400 font-mono">مؤشر الاختناق %</span>
            </div>
          </div>
        </div>

        {/* Recharts Container */}
        <div className="w-full h-80 pt-2" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={monthlyData}
              margin={{ top: 15, right: 25, left: 0, bottom: 25 }}
              onClick={(state: any) => {
                if (state && state.activePayload && state.activePayload.length > 0) {
                  setSelectedMonthDetail(state.activePayload[0].payload as MonthlyDataPoint);
                }
              }}
            >
              <defs>
                <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#059669" stopOpacity={0.7} />
                </linearGradient>
                <linearGradient id="pendingGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#be123c" stopOpacity={0.7} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />

              <XAxis
                dataKey="monthName"
                tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                axisLine={{ stroke: '#334155' }}
                tickLine={{ stroke: '#334155' }}
              />

              {/* Left Y Axis for volume counts */}
              <YAxis
                yAxisId="left"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={{ stroke: '#334155' }}
                tickLine={{ stroke: '#334155' }}
                label={{
                  value: 'العدد (تذاكر / مهام)',
                  angle: -90,
                  position: 'insideLeft',
                  fill: '#64748b',
                  fontSize: 10,
                  style: { textAnchor: 'middle' },
                }}
              />

              {/* Right Y Axis for Bottleneck Rate Percentage */}
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 120]}
                tick={{ fill: '#fbbf24', fontSize: 11, fontWeight: 700 }}
                axisLine={{ stroke: '#334155' }}
                tickLine={{ stroke: '#334155' }}
                unit="%"
                label={{
                  value: 'مؤشر الاختناق %',
                  angle: 90,
                  position: 'insideRight',
                  fill: '#fbbf24',
                  fontSize: 10,
                  style: { textAnchor: 'middle' },
                }}
              />

              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const data = payload[0].payload as MonthlyDataPoint;
                  return (
                    <div 
                      className="bg-slate-900/95 border border-slate-700/80 rounded-xl p-3.5 shadow-2xl backdrop-blur-md text-xs space-y-2.5 min-w-[240px]" 
                      dir="rtl"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="font-extrabold text-white text-sm">
                          {data.monthName} {data.year}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          data.bottleneckSeverity === 'critical'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : data.bottleneckSeverity === 'moderate'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {data.bottleneckSeverity === 'critical' ? 'اختناق حرج' : data.bottleneckSeverity === 'moderate' ? 'ضغط متوسط' : 'توازن جيد'}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-slate-300">
                            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500"></span>
                            <span>المهام المكتملة:</span>
                          </span>
                          <strong className="text-emerald-400 font-mono">{data.completedMissions} دورية</strong>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-slate-300">
                            <span className="w-2.5 h-2.5 rounded-xs bg-rose-500"></span>
                            <span>المخالفات العالقة:</span>
                          </span>
                          <strong className="text-rose-400 font-mono">{data.pendingViolations} بلاغ</strong>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                          <span className="flex items-center gap-1.5 text-amber-300">
                            <span className="w-2.5 h-1 bg-amber-400"></span>
                            <span>مؤشر الاختناق النسبي:</span>
                          </span>
                          <strong className="text-amber-300 font-mono font-bold">%{data.bottleneckRatePct}</strong>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>متوسط زمن الحل الميداني:</span>
                          <span className="font-mono text-slate-200">{data.avgResolutionDays} يوم</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-300 leading-relaxed bg-slate-950/60 p-2 rounded-lg">
                        <strong className="text-rose-400 block mb-0.5">التشخيص الميداني:</strong>
                        {data.bottleneckCause}
                      </div>
                    </div>
                  );
                }}
              />

              {/* Bar 1: Completed Missions */}
              <Bar
                yAxisId="left"
                dataKey="completedMissions"
                name="المهام المكتملة"
                fill="url(#completedGradient)"
                radius={[6, 6, 0, 0]}
                barSize={24}
              />

              {/* Bar 2: Pending Violations */}
              <Bar
                yAxisId="left"
                dataKey="pendingViolations"
                name="المخالفات العالقة"
                fill="url(#pendingGradient)"
                radius={[6, 6, 0, 0]}
                barSize={24}
              />

              {/* Line: Bottleneck Pressure Rate */}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="bottleneckRatePct"
                name="مؤشر الاختناق %"
                stroke="#fbbf24"
                strokeWidth={3}
                dot={{ fill: '#fbbf24', stroke: '#0f172a', strokeWidth: 2, r: 4 }}
                activeDot={{ fill: '#f59e0b', stroke: '#ffffff', strokeWidth: 2, r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <p className="text-[11px] text-slate-500 text-center">
          💡 انقر على أي شهر أو عمود لمعاينة التشخيص التشغيلي وتوصيات التدخل الميداني الموصى بها.
        </p>
      </div>

      {/* Interactive Month Diagnostic Drawer / Card (shown when clicking or defaulting to peak month) */}
      {(() => {
        const detailMonth = selectedMonthDetail || stats.peakBottleneckMonth;
        if (!detailMonth) return null;

        return (
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  تشخيص الاختناق: {detailMonth.monthName} {detailMonth.year}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  ضغط المتأخرات: {detailMonth.bottleneckRatePct}% • زمن الاستجابة: {detailMonth.avgResolutionDays} يوم
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {detailMonth.bottleneckCause}
              </p>
              <div className="text-[11px] text-slate-400 flex items-center gap-3 pt-1">
                <span>مهام مغلقة: <strong className="text-emerald-400 font-mono">{detailMonth.completedMissions}</strong></span>
                <span>بلاغات عالقة: <strong className="text-rose-400 font-mono">{detailMonth.pendingViolations}</strong></span>
                <span>حالات ذات خطورة قصوى: <strong className="text-amber-400 font-mono">{detailMonth.criticalPending}</strong></span>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <div className="px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs text-slate-200 font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-rose-400" />
                <span>إعادة توزيع 4 دوريات للمناطق المزدحمة</span>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
