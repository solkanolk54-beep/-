import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { AlertTriangle, TrendingUp, ShieldAlert, Calendar } from 'lucide-react';
import { CitizenReport, AuditLogEntry } from '../../types';

interface ViolationsDiscoveryTrendChartProps {
  reports: CitizenReport[];
  auditLogs: AuditLogEntry[];
  totalViolationsCount?: number;
}

interface DailyViolationTrend {
  dayName: string;
  dateStr: string;
  violations: number;
  critical: number;
  finesDzd: number;
}

export const ViolationsDiscoveryTrendChart: React.FC<ViolationsDiscoveryTrendChartProps> = ({
  reports,
  auditLogs,
  totalViolationsCount = 38,
}) => {
  const [viewMode, setViewMode] = useState<'all' | 'critical'>('all');

  // حساب بيانات اتجاه اكتشاف المخالفات لآخر 7 أيام
  const trendData: DailyViolationTrend[] = useMemo(() => {
    // 7 days ending today (2026-09-30)
    const daysMeta = [
      { dayName: 'الخميس', dateStr: '24 سبتمبر', baseV: 4, baseC: 1 },
      { dayName: 'الجمعة', dateStr: '25 سبتمبر', baseV: 6, baseC: 2 },
      { dayName: 'السبت', dateStr: '26 سبتمبر', baseV: 5, baseC: 2 },
      { dayName: 'الأحد', dateStr: '27 سبتمبر', baseV: 8, baseC: 4 }, // حملة أسواق الجملة
      { dayName: 'الإثنين', dateStr: '28 سبتمبر', baseV: 7, baseC: 3 },
      { dayName: 'الثلاثاء', dateStr: '29 سبتمبر', baseV: 9, baseC: 5 }, // ذروة التفتيش
      { dayName: 'اليوم', dateStr: '30 سبتمبر', baseV: Math.max(5, reports.filter(r => r.status === 'verified_violation').length + 2), baseC: Math.max(2, reports.filter(r => r.inflationDeltaPct > 40).length) },
    ];

    return daysMeta.map((d) => ({
      dayName: d.dayName,
      dateStr: d.dateStr,
      violations: d.baseV,
      critical: d.baseC,
      finesDzd: d.baseV * 185000,
    }));
  }, [reports, auditLogs]);

  // إحصائيات الأسبوع
  const totalWeeklyViolations = useMemo(
    () => trendData.reduce((acc, curr) => acc + curr.violations, 0),
    [trendData]
  );
  const totalWeeklyCritical = useMemo(
    () => trendData.reduce((acc, curr) => acc + curr.critical, 0),
    [trendData]
  );
  const dailyAverage = (totalWeeklyViolations / 7).toFixed(1);

  return (
    <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950/20 p-4 rounded-xl border border-rose-900/30 hover:border-rose-700/50 transition-all shadow-md flex flex-col justify-between h-full">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <div className="p-1 rounded-md bg-rose-500/20 text-rose-400">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">
                اكتشاف المخالفات (آخر 7 أيام)
              </span>
              <span className="text-[10px] text-slate-400">
                منحنى بياني تفاعلي • Recharts
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setViewMode(viewMode === 'all' ? 'critical' : 'all')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                viewMode === 'critical'
                  ? 'bg-rose-600 text-white border-rose-500'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/30 hover:bg-rose-500/30'
              }`}
              title="التبديل بين إجمالي المخالفات والمخالفات الحرجة"
            >
              {viewMode === 'critical' ? 'الحرجة فقط' : 'كل المخالفات'}
            </button>
          </div>
        </div>

        {/* Counter Summary */}
        <div className="flex items-baseline justify-between mb-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-white tracking-tight font-mono">
              {viewMode === 'critical' ? totalWeeklyCritical : totalWeeklyViolations}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {viewMode === 'critical' ? 'مخالفة حرجة' : 'مخالفة محررة'}
            </span>
          </div>

          <div className="flex items-center text-[11px] text-rose-400 font-semibold gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>معدل {dailyAverage}/يوم</span>
          </div>
        </div>
      </div>

      {/* Recharts Area Visualization */}
      <div className="w-full h-28 my-1" style={{ minHeight: '110px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trendData} margin={{ top: 5, right: 2, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="roseGradientViolations" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="roseGradientCritical" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fb7185" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#fb7185" stopOpacity={0.05} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />

            <XAxis
              dataKey="dayName"
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />

            <YAxis
              stroke="#64748b"
              fontSize={9}
              tickLine={false}
              axisLine={false}
              domain={[0, 'dataMax + 2']}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as DailyViolationTrend;
                  return (
                    <div className="bg-slate-950/95 border border-rose-900/60 p-2 rounded-lg shadow-xl text-right text-xs z-50">
                      <div className="font-bold text-white flex items-center justify-between gap-2 border-b border-slate-800 pb-1 mb-1">
                        <span>{data.dayName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{data.dateStr}</span>
                      </div>
                      <div className="text-rose-400 font-semibold text-[11px]">
                        إجمالي المخالفات: <strong className="text-white font-mono">{data.violations}</strong>
                      </div>
                      <div className="text-amber-400 text-[10px]">
                        مخالفات حرجة: <strong className="text-white font-mono">{data.critical}</strong>
                      </div>
                      <div className="text-slate-400 text-[10px] mt-0.5 font-mono">
                        الغرامات: {data.finesDzd.toLocaleString()} د.ج
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            {viewMode === 'all' && (
              <Area
                type="monotone"
                dataKey="violations"
                stroke="#f43f5e"
                strokeWidth={2.5}
                fill="url(#roseGradientViolations)"
                dot={{ r: 3, fill: '#f43f5e', stroke: '#0f172a', strokeWidth: 1.5 }}
                activeDot={{ r: 5, fill: '#ffffff', stroke: '#f43f5e', strokeWidth: 2 }}
              />
            )}

            <Area
              type="monotone"
              dataKey="critical"
              stroke="#fb7185"
              strokeWidth={viewMode === 'critical' ? 2.5 : 1.5}
              strokeDasharray={viewMode === 'critical' ? undefined : '3 3'}
              fill={viewMode === 'critical' ? 'url(#roseGradientCritical)' : 'none'}
              dot={{ r: 2.5, fill: '#fb7185', stroke: '#0f172a' }}
              activeDot={{ r: 4, fill: '#ffffff', stroke: '#fb7185', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer details */}
      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 mt-1">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3 text-slate-500" />
          <span>ذروة الأسبوع:</span>
          <strong className="text-rose-300 font-bold">الثلاثاء (9)</strong>
        </span>
        <span className="font-mono text-amber-300 text-[10px]">
          {(totalWeeklyViolations * 185000).toLocaleString()} د.ج
        </span>
      </div>
    </div>
  );
};
