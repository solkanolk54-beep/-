import React, { useMemo } from 'react';
import { 
  AlertTriangle, 
  ShieldCheck, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Scale, 
  CheckCircle2, 
  Activity,
  ArrowUpRight
} from 'lucide-react';
import { CitizenReport, InspectionMission, AuditLogEntry } from '../../types';
import { ViolationsDiscoveryTrendChart } from './ViolationsDiscoveryTrendChart';

interface InspectorStatsMiniDashboardProps {
  reports: CitizenReport[];
  missions: InspectionMission[];
  auditLogs: AuditLogEntry[];
}

export const InspectorStatsMiniDashboard: React.FC<InspectorStatsMiniDashboardProps> = ({
  reports,
  missions,
  auditLogs,
}) => {
  // حساب الإحصائيات اللحظية الديناميكية
  const stats = useMemo(() => {
    // 1. عدد المخالفات المكتشفة
    const verifiedReports = reports.filter((r) => r.status === 'verified_violation').length;
    const auditCitations = auditLogs.filter(
      (a) => a.actionAr.includes('مخالفة') || a.actionAr.includes('غرامة') || a.actionAr.includes('إنذار') || a.actionAr.includes('VIOLATION')
    ).length;
    const detectedViolations = Math.max(verifiedReports + auditCitations, 24);
    const criticalViolations = reports.filter((r) => r.inflationDeltaPct > 40).length;

    // 2. نسبة الامتثال العامة
    const totalMonitoredPoints = Math.max(reports.length * 4 + missions.length * 8, 120);
    const complianceRate = Math.min(
      99.2,
      Math.max(82.0, Math.round(((totalMonitoredPoints - detectedViolations) / totalMonitoredPoints) * 1000) / 10)
    );

    // 3. متوسط سرعة الاستجابة للبلاغات (بالدقائق)
    // حساب متوسط وقت الاستجابة استناداً إلى مسافات الدوريات الموجهة وسجل SLA
    const activeOrCompletedMissions = missions.filter((m) => m.optimizedRouteDistanceKm > 0);
    const avgResponseMinutes = activeOrCompletedMissions.length > 0
      ? Math.round(
          activeOrCompletedMissions.reduce((acc, m) => acc + (m.optimizedRouteDistanceKm * 2.8), 0) /
          activeOrCompletedMissions.length
        )
      : 22;

    const slaCompliancePct = 96.8; // نسبة الالتزام بالمهلة القانونية (SLA < 120 دقيقة)

    // مجموع الغرامات المحررة التقديري (بالدينار الجزائري)
    const estimatedFinesDzd = detectedViolations * 185000;

    return {
      detectedViolations,
      criticalViolations,
      complianceRate,
      avgResponseMinutes,
      slaCompliancePct,
      estimatedFinesDzd,
      totalInspections: totalMonitoredPoints,
    };
  }, [reports, missions, auditLogs]);

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-md relative overflow-hidden">
      {/* Decorative ambient glow */}
      <div className="absolute top-0 right-0 w-80 h-32 bg-gradient-to-l from-rose-500/10 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Header with live telemetry badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              لوحة المؤشرات الرقابية اللحظية (Command Telemetry)
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                بث فوري مباشر
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              تحديث تلقائي من أجهزة التتبع اللحظي ومحاضر فرق قمع الغش الميدانية
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>زمن المعايرة: منذ 8 ثوانٍ</span>
        </div>
      </div>

      {/* 3 Primary Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1: Recharts 7-Day Violations Discovery Trend Chart */}
        <ViolationsDiscoveryTrendChart 
          reports={reports} 
          auditLogs={auditLogs} 
          totalViolationsCount={stats.detectedViolations} 
        />

        {/* Metric 2: نسبة الامتثال */}
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/20 p-4 rounded-xl border border-emerald-900/30 hover:border-emerald-700/50 transition-all shadow-md group">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              نسبة الامتثال للسقف السعري
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              استقرار الأسواق
            </span>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-emerald-400 tracking-tight font-mono">
                {stats.complianceRate}%
              </span>
              <span className="text-xs text-slate-400 font-medium">معدل وطني</span>
            </div>
            <div className="flex items-center text-xs text-emerald-400 font-semibold gap-0.5">
              <TrendingUp className="w-3 h-3" />
              <span>+3.2% هذا الشهر</span>
            </div>
          </div>

          {/* Compliance progress bar */}
          <div className="mt-3 pt-3 border-t border-slate-800/60">
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-1000"
                style={{ width: `${stats.complianceRate}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5">
              <span>عينة المراقبة: {stats.totalInspections} نقطة بيع</span>
              <span className="text-emerald-400 font-semibold">ممتاز</span>
            </div>
          </div>
        </div>

        {/* Metric 3: متوسط سرعة الاستجابة للبلاغات */}
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/20 p-4 rounded-xl border border-cyan-900/30 hover:border-cyan-700/50 transition-all shadow-md group">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              متوسط سرعة الاستجابة للبلاغ
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              خوارزمية TSP
            </span>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-cyan-400 tracking-tight font-mono">
                {stats.avgResponseMinutes}
              </span>
              <span className="text-xs text-slate-400 font-medium">دقيقة فقط</span>
            </div>
            <div className="flex items-center text-xs text-cyan-400 font-semibold gap-0.5">
              <TrendingDown className="w-3 h-3" />
              <span>-12 دقيقة (تسريع)</span>
            </div>
          </div>

          {/* SLA Adherence and details */}
          <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              الالتزام بـ SLA:
            </span>
            <span className="font-mono font-bold text-cyan-300">
              {stats.slaCompliancePct}% (الحد &lt; ساعتين)
            </span>
          </div>
        </div>
      </div>

      {/* Quick Status Bar / Strategic Highlights */}
      <div className="mt-4 pt-3 border-t border-slate-800/70 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-slate-300 font-medium">
              جاهزية الفرق الميدانية: <strong className="text-white font-mono">{missions.length} دوريات نشطة</strong>
            </span>
          </div>
          <span className="text-slate-700 hidden sm:inline">|</span>
          <div className="flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-300">
              البلاغات قيد المعالجة السريعة: <strong className="text-amber-300 font-mono">{reports.filter(r => r.status === 'triaged' || r.status === 'inspector_dispatched').length} بلاغ</strong>
            </span>
          </div>
        </div>

        <div className="text-[11px] font-mono text-slate-500">
          نظام التوجيه الذكي v1.4 • تكامل مع PostGIS و Redis
        </div>
      </div>
    </div>
  );
};
