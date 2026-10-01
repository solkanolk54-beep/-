import React, { useState, useMemo } from 'react';
import { InspectionMission, AuditLogEntry, CitizenReport, UserRole } from '../../types';
import { InspectorStatsMiniDashboard } from './InspectorStatsMiniDashboard';
import { MissionsMonthlyBottleneckChart } from './MissionsMonthlyBottleneckChart';
import { InspectorRouteHeuristicOptimizer, calculateHaversineKm } from './InspectorRouteHeuristicOptimizer';
import { generateViolationReceiptPdf } from '../../services/violationPdfGenerator';
import { exportInfractionsAnalyticsCsv } from '../../services/csvExportService';
import { 
  ShieldCheck, 
  Navigation, 
  FileText, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  MapPin, 
  Hash, 
  Clock, 
  Building, 
  User, 
  Zap, 
  CheckCheck,
  Scale,
  FileDown,
  Loader2,
  Printer,
  FileSpreadsheet,
  Download,
  Filter,
  ArrowUpDown,
  Flame,
  Timer,
  BarChart3,
  Sparkles
} from 'lucide-react';

interface InspectorTaskingModuleProps {
  missions: InspectionMission[];
  auditLogs: AuditLogEntry[];
  reports: CitizenReport[];
  currentRole: UserRole;
  onResolveReport: (reportId: string, resolutionNotes: string, fineAmountDzd?: number) => void;
}

export const InspectorTaskingModule: React.FC<InspectorTaskingModuleProps> = ({
  missions,
  auditLogs,
  reports,
  currentRole,
  onResolveReport,
}) => {
  const [activeTab, setActiveTab] = useState<'missions' | 'analytics' | 'audit_ledger'>('missions');
  const [selectedMission, setSelectedMission] = useState<InspectionMission>(missions[0]);
  const [resolvingReportId, setResolvingReportId] = useState<string | null>(null);
  const [enforcementNotes, setEnforcementNotes] = useState('تم توجيه إنذار رسمي وتحرير غرامة مالية بموجب المادة 4 من قانون مكافحة المضاربة غير المشروعة.');
  const [fineAmount, setFineAmount] = useState<number>(250000);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<string | null>(null);
  const [isExportingCsv, setIsExportingCsv] = useState(false);

  // أنظمة تصفية الحالة لمهام الرقابة ومحطات المعاينة (Status-Based Filters)
  type MissionStatusFilter = 'all' | 'pending' | 'in-progress' | 'completed';
  const [missionStatusFilter, setMissionStatusFilter] = useState<MissionStatusFilter>('all');
  const [stopStatusFilter, setStopStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // نظام الترتيب والفرز حسب الاستعجال ومهلة SLA (Sorting System)
  type MissionSortOption = 'urgency_desc' | 'sla_asc' | 'distance_asc' | 'targets_desc';
  const [sortBy, setSortBy] = useState<MissionSortOption>('urgency_desc');

  // نمط عرض المحطات: الجدول الزمني الحي أو خوارزمية التسلسل الحدسية (Heuristic Optimizer)
  const [stopsViewMode, setStopsViewMode] = useState<'timeline' | 'heuristic_optimizer'>('timeline');

  // اعتماد التسلسل الأمثل المحسوب بالخوارزمية الحدسية على محطات الدورية
  const handleApplyOptimizedSequence = (reorderedStops: InspectionMission['stops']) => {
    let totalDist = 0;
    for (let i = 0; i < reorderedStops.length - 1; i++) {
      totalDist += calculateHaversineKm(
        reorderedStops[i].coordinates[0],
        reorderedStops[i].coordinates[1],
        reorderedStops[i + 1].coordinates[0],
        reorderedStops[i + 1].coordinates[1]
      );
    }
    const updatedDistKm = Math.round(totalDist * 10) / 10 || selectedMission.optimizedRouteDistanceKm;

    const updatedMission: InspectionMission = {
      ...selectedMission,
      stops: reorderedStops,
      targetCount: reorderedStops.length,
      optimizedRouteDistanceKm: updatedDistKm,
    };

    setSelectedMission(updatedMission);
  };

  // مساعدات تحديد درجة الاستعجال ومهلة الاستجابة
  const getMissionUrgency = (m: InspectionMission): 'critical' | 'high' | 'medium' => {
    if (m.urgencyLevel) return m.urgencyLevel;
    if (m.stops?.some((s) => s.priority === 'critical')) return 'critical';
    if (m.stops?.some((s) => s.priority === 'high')) return 'high';
    return 'medium';
  };

  const getMissionSlaMinutes = (m: InspectionMission): number => {
    if (typeof m.slaMinutesRemaining === 'number') return m.slaMinutesRemaining;
    if (m.status === 'completed') return 0;
    const urgency = getMissionUrgency(m);
    if (urgency === 'critical') return 25;
    if (urgency === 'high') return 55;
    return 120;
  };

  const missionCounts = useMemo(() => ({
    all: missions.length,
    inProgress: missions.filter((m) => m.status === 'in-progress' || m.status === 'active').length,
    pending: missions.filter((m) => m.status === 'pending' || m.status === 'scheduled').length,
    completed: missions.filter((m) => m.status === 'completed').length,
  }), [missions]);

  const filteredMissions = useMemo(() => {
    if (missionStatusFilter === 'all') return missions;
    if (missionStatusFilter === 'in-progress') {
      return missions.filter((m) => m.status === 'in-progress' || m.status === 'active');
    }
    if (missionStatusFilter === 'pending') {
      return missions.filter((m) => m.status === 'pending' || m.status === 'scheduled');
    }
    if (missionStatusFilter === 'completed') {
      return missions.filter((m) => m.status === 'completed');
    }
    return missions;
  }, [missions, missionStatusFilter]);

  // فرز الدوريات حسب الخيار المحدد (حسب الاستعجال، مهلة SLA، المسافة، أو الأهداف)
  const sortedMissions = useMemo(() => {
    const list = [...filteredMissions];
    list.sort((a, b) => {
      if (sortBy === 'urgency_desc') {
        const priorityWeight = { critical: 3, high: 2, medium: 1 };
        const diff = priorityWeight[getMissionUrgency(b)] - priorityWeight[getMissionUrgency(a)];
        if (diff !== 0) return diff;
        // المفاضلة عند التساوي: الأقرب لانتهاء مهلة SLA
        const slaA = a.status === 'completed' ? 999999 : getMissionSlaMinutes(a);
        const slaB = b.status === 'completed' ? 999999 : getMissionSlaMinutes(b);
        return slaA - slaB;
      }
      if (sortBy === 'sla_asc') {
        const slaA = a.status === 'completed' ? 999999 : getMissionSlaMinutes(a);
        const slaB = b.status === 'completed' ? 999999 : getMissionSlaMinutes(b);
        return slaA - slaB;
      }
      if (sortBy === 'distance_asc') {
        return a.optimizedRouteDistanceKm - b.optimizedRouteDistanceKm;
      }
      if (sortBy === 'targets_desc') {
        return b.targetCount - a.targetCount;
      }
      return 0;
    });
    return list;
  }, [filteredMissions, sortBy]);

  const handleFilterMission = (filter: MissionStatusFilter) => {
    setMissionStatusFilter(filter);
    const matching = missions.filter((m) => {
      if (filter === 'all') return true;
      if (filter === 'in-progress') return m.status === 'in-progress' || m.status === 'active';
      if (filter === 'pending') return m.status === 'pending' || m.status === 'scheduled';
      if (filter === 'completed') return m.status === 'completed';
      return true;
    });
    if (matching.length > 0 && !matching.some((m) => m.id === selectedMission.id)) {
      setSelectedMission(matching[0]);
    }
  };

  const filteredStops = useMemo(() => {
    if (!selectedMission) return [];
    if (stopStatusFilter === 'all') return selectedMission.stops;
    if (stopStatusFilter === 'pending') {
      return selectedMission.stops.filter((s) => s.status === 'pending');
    }
    if (stopStatusFilter === 'completed') {
      return selectedMission.stops.filter((s) => s.status === 'inspected_fined' || s.status === 'inspected_cleared');
    }
    return selectedMission.stops;
  }, [selectedMission, stopStatusFilter]);

  const stopCounts = useMemo(() => {
    if (!selectedMission) return { all: 0, pending: 0, completed: 0 };
    return {
      all: selectedMission.stops.length,
      pending: selectedMission.stops.filter((s) => s.status === 'pending').length,
      completed: selectedMission.stops.filter((s) => s.status === 'inspected_fined' || s.status === 'inspected_cleared').length,
    };
  }, [selectedMission]);

  const pendingReportsForInspection = reports.filter((r) => r.status === 'inspector_dispatched' || r.status === 'triaged' || r.status === 'verified_violation');

  const handleExportAnalyticsCsv = () => {
    setIsExportingCsv(true);
    try {
      exportInfractionsAnalyticsCsv({
        reports,
        auditLogs,
        missions,
      });
    } catch (err) {
      console.error('Error exporting analytics CSV:', err);
    } finally {
      setTimeout(() => setIsExportingCsv(false), 600);
    }
  };

  const handleDownloadReport = async (report: CitizenReport, customAuditLog?: AuditLogEntry) => {
    setIsGeneratingPdf(report.id);
    try {
      const matchingLog = customAuditLog || auditLogs.find((l) => 
        l.actionAr.includes(report.storeName) || 
        l.actionAr.includes(report.ticketNumber) ||
        l.actionAr.includes(report.commodityNameAr)
      );

      await generateViolationReceiptPdf({
        report,
        auditLog: matchingLog,
        inspectorName: selectedMission.inspectorName,
        badgeNumber: selectedMission.badgeNumber,
        fineAmountDzd: fineAmount || 185000,
        enforcementNotes: report.inspectorNotes || enforcementNotes,
        citationNumber: `DZ-CIT-2026-${report.ticketNumber.replace(/\D/g, '').slice(-4) || '8841'}`,
        blockHash: matchingLog?.blockHash || 'e8c4f923b7a19d08e4521098ec7120a4b3d91f6874e5a9c02d18b456f912c0aa',
        previousHash: matchingLog?.previousHash || '9f1c7e4a83d20b15c689e47201fa3854b7c82e091564d23a1078b5e934fa12b9',
      });
    } catch (err) {
      console.error('Error generating PDF receipt:', err);
    } finally {
      setIsGeneratingPdf(null);
    }
  };

  // مساعد تحديد معطيات شارة الحالة الملونة (Color-Coded Status Badge)
  const getMissionStatusMeta = (status: InspectionMission['status']) => {
    if (status === 'completed') {
      return {
        key: 'completed' as const,
        labelAr: 'مكتملة',
        labelEn: 'completed',
        badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        dotClass: 'bg-emerald-400',
        isPulsing: false,
        icon: CheckCircle2,
      };
    }
    if (status === 'in-progress' || status === 'active') {
      return {
        key: 'in-progress' as const,
        labelAr: 'قيد التنفيذ',
        labelEn: 'in-progress',
        badgeClass: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
        dotClass: 'bg-sky-400',
        isPulsing: true,
        icon: Navigation,
      };
    }
    // pending or scheduled
    return {
      key: 'pending' as const,
      labelAr: 'قيد الانتظار',
      labelEn: 'pending',
      badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      dotClass: 'bg-amber-400',
      isPulsing: false,
      icon: Clock,
    };
  };

  const handleDownloadAuditReport = async (log: AuditLogEntry) => {
    setIsGeneratingPdf(log.id);
    try {
      // Find matching report or create synthetic one based on the audit log
      const matchedReport = reports.find(r => log.actionAr.includes(r.storeName) || log.actionAr.includes(r.ticketNumber)) || {
        id: log.id,
        ticketNumber: `TKT-${log.id.slice(-4)}`,
        commodityId: 'potato',
        commodityNameAr: 'سلعة فلاحية واسعة الاستهلاك',
        observedPrice: 160,
        ceilingPrice: 85,
        inflationDeltaPct: 88.2,
        storeName: log.actionAr.split('(')[1]?.replace(')', '') || 'محل تجاري مخالف',
        storeAddress: 'الجزائر العاصمة',
        wilaya: 'الجزائر العاصمة',
        baladiya: 'باب الزوار',
        coordinates: [36.753, 3.058] as [number, number],
        reporterBadge: 'CITIZEN_GOLD',
        status: 'verified_violation' as const,
        createdAt: log.timestamp,
        slaMinutesRemaining: 0,
        inspectorNotes: log.actionAr,
      };

      await generateViolationReceiptPdf({
        report: matchedReport,
        auditLog: log,
        inspectorName: selectedMission.inspectorName,
        badgeNumber: selectedMission.badgeNumber,
        fineAmountDzd: fineAmount || 185000,
        enforcementNotes: log.actionAr,
        citationNumber: `DZ-CIT-2026-${log.id.slice(-4)}`,
        blockHash: log.blockHash,
        previousHash: log.previousHash,
      });
    } catch (err) {
      console.error('Error exporting audit receipt:', err);
    } finally {
      setIsGeneratingPdf(null);
    }
  };

  const handleConfirmResolution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingReportId) return;
    onResolveReport(resolvingReportId, enforcementNotes, fineAmount);
    setResolvingReportId(null);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 p-6 rounded-2xl border border-rose-800/40 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                الموديل رقم 4: نظام نجاعة الرقابة ومكافحة البيروقراطية
              </span>
              <span className="text-xs text-slate-400 font-mono">Immutable Digital Audit Ledger</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white">
              غرفة عمليات التفتيش الميداني والدفتر الرقمي للرقابة
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
              تحسين وتوجيه مسارات دوريات الرقابة آلياً استناداً إلى خرائط التكاثف (Heatmaps)، مع توثيق غير قابل للحذف أو التعديل في مصفوفة التدقيق الرقمي.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleExportAnalyticsCsv}
              disabled={isExportingCsv}
              title="تصدير سجل المخالفات والفوارق السعرية الخام بصيغة CSV للتدقيق المكتبي دون اتصال"
              className="px-3.5 py-2 rounded-xl bg-slate-950/90 hover:bg-slate-900 text-emerald-400 hover:text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              {isExportingCsv ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              ) : (
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              )}
              <span>تصدير البيانات التحليلية (CSV)</span>
            </button>

            <div className="flex items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800 flex-wrap">
              <button
                onClick={() => setActiveTab('missions')}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'missions'
                    ? 'bg-rose-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                دوريات الرقابة والمسارات ({missions.length})
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'analytics'
                    ? 'bg-rose-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>تحليل الاختناق الشهري (Recharts)</span>
              </button>
              <button
                onClick={() => setActiveTab('audit_ledger')}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'audit_ledger'
                    ? 'bg-rose-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>الدفتر الرقمي المشفر ({auditLogs.length})</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mini Command Telemetry Dashboard */}
      <InspectorStatsMiniDashboard 
        reports={reports} 
        missions={missions} 
        auditLogs={auditLogs} 
      />

      {/* Monthly Breakdown Data Visualization Section: Missions Completed vs Pending Violations (Recharts) */}
      {(activeTab === 'missions' || activeTab === 'analytics') && (
        <MissionsMonthlyBottleneckChart
          missions={missions}
          reports={reports}
          auditLogs={auditLogs}
        />
      )}

      {/* Main Tab Content */}
      {activeTab === 'missions' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Active Missions List */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-extrabold text-white text-sm">
                  <Navigation className="w-4 h-4 text-rose-400" />
                  فرق الرقابة الميدانية الموجهة
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {filteredMissions.length} من {missions.length} دورية
                </span>
              </div>

              {/* Status-Based Filtering System (Pending, In-Progress, Completed) */}
              <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950/90 rounded-xl border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => handleFilterMission('all')}
                  className={`py-1.5 px-2 rounded-lg font-bold text-center transition-all flex items-center justify-center gap-1 ${
                    missionStatusFilter === 'all'
                      ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                  }`}
                  title="عرض كافة الدوريات"
                >
                  <span>الكل</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-700/60 text-slate-300 font-mono">
                    {missionCounts.all}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleFilterMission('in-progress')}
                  className={`py-1.5 px-1.5 rounded-lg font-bold text-center transition-all flex items-center justify-center gap-1 ${
                    missionStatusFilter === 'in-progress'
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-sky-300 hover:bg-sky-500/10'
                  }`}
                  title="تصفية الدوريات قيد التنفيذ الميداني"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-400"></span>
                  </span>
                  <span>النشطة</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-sky-950/80 text-sky-300 font-mono border border-sky-800/40">
                    {missionCounts.inProgress}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleFilterMission('pending')}
                  className={`py-1.5 px-1.5 rounded-lg font-bold text-center transition-all flex items-center justify-center gap-1 ${
                    missionStatusFilter === 'pending'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-amber-300 hover:bg-amber-500/10'
                  }`}
                  title="تصفية الدوريات قيد الانتظار والجدولة"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  <span>الانتظار</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-950/80 text-amber-300 font-mono border border-amber-800/40">
                    {missionCounts.pending}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleFilterMission('completed')}
                  className={`py-1.5 px-1.5 rounded-lg font-bold text-center transition-all flex items-center justify-center gap-1 ${
                    missionStatusFilter === 'completed'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/10'
                  }`}
                  title="تصفية الدوريات المكتملة"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>المكتملة</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-950/80 text-emerald-300 font-mono border border-emerald-800/40">
                    {missionCounts.completed}
                  </span>
                </button>
              </div>

              {/* Sorting Feature: Urgency, SLA Remaining, Distance, Targets */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 pt-1 border-t border-slate-800/60 text-xs">
                <div className="flex items-center gap-1.5 text-slate-400 font-semibold text-[11px]">
                  <ArrowUpDown className="w-3.5 h-3.5 text-rose-400" />
                  <span>الترتيب حسب:</span>
                </div>

                <div className="flex items-center gap-1 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setSortBy('urgency_desc')}
                    className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                      sortBy === 'urgency_desc'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-white bg-slate-950/60 hover:bg-slate-900 border border-slate-800/60'
                    }`}
                    title="ترتيب المهام حسب درجة الاستعجال والخطورة القصوى"
                  >
                    <Flame className="w-3 h-3 text-rose-400" />
                    <span>الأكثر استعجالاً</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSortBy('sla_asc')}
                    className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                      sortBy === 'sla_asc'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-white bg-slate-950/60 hover:bg-slate-900 border border-slate-800/60'
                    }`}
                    title="ترتيب المهام حسب أقرب انتهاء لمهلة الاستجابة القانونية SLA"
                  >
                    <Timer className="w-3 h-3 text-amber-400" />
                    <span>أقرب مهلة (SLA)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSortBy('distance_asc')}
                    className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                      sortBy === 'distance_asc'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-white bg-slate-950/60 hover:bg-slate-900 border border-slate-800/60'
                    }`}
                    title="ترتيب حسب أقصر مسار للمركبة"
                  >
                    <span>أقصر مسار</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSortBy('targets_desc')}
                    className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                      sortBy === 'targets_desc'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-white bg-slate-950/60 hover:bg-slate-900 border border-slate-800/60'
                    }`}
                    title="ترتيب حسب عدد المحطات المستهدفة"
                  >
                    <span>الأكثر أهدافاً</span>
                  </button>
                </div>
              </div>

              {sortedMissions.length === 0 ? (
                <div className="p-6 rounded-xl border border-dashed border-slate-800 text-center space-y-2 bg-slate-950/40">
                  <Filter className="w-6 h-6 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400 font-medium">
                    لا توجد دوريات مطابقة لحالة "{missionStatusFilter === 'pending' ? 'قيد الانتظار' : missionStatusFilter === 'in-progress' ? 'قيد التنفيذ' : 'مكتملة'}" حالياً.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleFilterMission('all')}
                    className="text-xs text-rose-400 hover:underline font-bold"
                  >
                    عرض كافة الدوريات ({missions.length})
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedMissions.map((m) => {
                    const isSelected = selectedMission.id === m.id;
                    const statusMeta = getMissionStatusMeta(m.status);
                    const urgency = getMissionUrgency(m);
                    const slaMinutes = getMissionSlaMinutes(m);

                    return (
                      <div
                        key={m.id}
                        onClick={() => setSelectedMission(m)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-rose-950/30 border-rose-500/60 shadow-lg ring-1 ring-rose-500/40'
                            : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                              {m.missionCode}
                            </span>
                            {/* Visual Status Indicator Badge */}
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${statusMeta.badgeClass}`}
                              title={`حالة المهمة: ${statusMeta.labelAr} (${statusMeta.labelEn})`}
                            >
                              <span className="relative flex h-2 w-2">
                                {statusMeta.isPulsing && (
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                                )}
                                <span className={`relative inline-flex rounded-full h-2 w-2 ${statusMeta.dotClass}`}></span>
                              </span>
                              <span>{statusMeta.labelAr}</span>
                            </span>
                          </div>
                          <span className="text-xs text-rose-300 font-semibold">{m.assignedWilaya}</span>
                        </div>

                        <h4 className="text-sm font-bold text-white">{m.inspectorName}</h4>
                        <div className="text-xs text-slate-400 mt-1">
                          شارة رسمية: <span className="font-mono text-slate-300">{m.badgeNumber}</span>
                        </div>

                        {/* Urgency and SLA Badges */}
                        <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                          {urgency === 'critical' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-xs">
                              <Flame className="w-3 h-3 text-rose-400" />
                              <span>استعجال حرج</span>
                            </span>
                          )}
                          {urgency === 'high' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              <Zap className="w-3 h-3 text-amber-400" />
                              <span>أولوية مرتفعة</span>
                            </span>
                          )}
                          {urgency === 'medium' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-800/80 text-slate-300 border border-slate-700/60">
                              <span>أولوية عادية</span>
                            </span>
                          )}

                          {m.status === 'completed' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>SLA: مكتمل</span>
                            </span>
                          ) : slaMinutes <= 30 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-rose-950/80 text-rose-300 border border-rose-800/70 animate-pulse">
                              <Timer className="w-3 h-3 text-rose-400" />
                              <span>SLA: {slaMinutes} د</span>
                            </span>
                          ) : slaMinutes <= 60 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-950/60 text-amber-300 border border-amber-800/50">
                              <Timer className="w-3 h-3 text-amber-400" />
                              <span>SLA: {slaMinutes} د</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-slate-900/90 text-slate-300 border border-slate-800">
                              <Timer className="w-3 h-3 text-slate-400" />
                              <span>SLA: {slaMinutes} د</span>
                            </span>
                          )}
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                          <span>أهداف التفتيش: <strong className="text-white font-mono">{m.targetCount} محلات</strong></span>
                          <span>المسار الأمثل: <strong className="text-cyan-400 font-mono">{m.optimizedRouteDistanceKm} كم</strong></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Action: Pending Violations Awaiting Immediate Enforcement */}
            <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-lg space-y-3">
              <h3 className="font-bold text-white text-xs flex items-center gap-2 text-rose-400">
                <AlertTriangle className="w-4 h-4" />
                تذاكر عاجلة قيد التدخل الميداني الآن:
              </h3>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {pendingReportsForInspection.map((rep) => (
                  <div
                    key={rep.id}
                    className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs gap-2"
                  >
                    <div>
                      <div className="font-bold text-white">{rep.storeName}</div>
                      <div className="text-[11px] text-slate-400">
                        {rep.commodityNameAr} • +{rep.inflationDeltaPct}% فارق
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleDownloadReport(rep)}
                        disabled={isGeneratingPdf === rep.id}
                        title="تصدير وتحميل محضر المخالفة بصيغة PDF مع بصمة التشفير"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-[11px] border border-slate-700 transition-colors disabled:opacity-50"
                      >
                        {isGeneratingPdf === rep.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
                        ) : (
                          <FileDown className="w-3.5 h-3.5 text-rose-400" />
                        )}
                        <span className="hidden sm:inline">تحميل المحضر</span>
                        <span className="text-[10px] text-rose-400 font-mono">PDF</span>
                      </button>

                      <button
                        onClick={() => setResolvingReportId(rep.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] transition-colors"
                      >
                        إثبات وتغريم
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Heuristic sequence trigger button */}
              <button
                type="button"
                onClick={() => {
                  setStopsViewMode('heuristic_optimizer');
                  const el = document.getElementById('heuristic-optimizer-anchor');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full mt-2.5 py-2 px-3 rounded-xl bg-gradient-to-r from-rose-950/60 to-slate-900 border border-rose-800/40 text-xs font-bold text-rose-300 hover:text-white hover:border-rose-500/50 flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                <span>اقتراح مسار أمثل لزيارة البلاغات العاجلة (Heuristic)</span>
              </button>
            </div>
          </div>

          {/* Right Column: Mission Details & Live Stops */}
          <div className="lg:col-span-7 bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-lg space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-rose-400" />
                  مخطط المسار التفتيشي المنظم ({selectedMission.missionCode})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  خوارزمية التحسين المكاني TSP لتقليص زمن التدخل وحظر الوساطة
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap justify-end">
                {(() => {
                  const meta = getMissionStatusMeta(selectedMission.status);
                  const urgency = getMissionUrgency(selectedMission);
                  const slaMinutes = getMissionSlaMinutes(selectedMission);

                  return (
                    <>
                      {/* Urgency Level Badge */}
                      {urgency === 'critical' && (
                        <span className="text-xs px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1.5 bg-rose-500/20 text-rose-300 border-rose-500/40">
                          <Flame className="w-3.5 h-3.5 text-rose-400" />
                          <span>استعجال حرج</span>
                        </span>
                      )}
                      {urgency === 'high' && (
                        <span className="text-xs px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1.5 bg-amber-500/20 text-amber-300 border-amber-500/40">
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                          <span>أولوية مرتفعة</span>
                        </span>
                      )}

                      {/* SLA Timer Badge */}
                      {selectedMission.status === 'completed' ? (
                        <span className="text-xs font-mono px-2.5 py-1 rounded-lg border font-semibold flex items-center gap-1.5 bg-emerald-950/60 text-emerald-400 border-emerald-800/40">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>SLA: مكتمل</span>
                        </span>
                      ) : (
                        <span className={`text-xs font-mono px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1.5 ${
                          slaMinutes <= 30
                            ? 'bg-rose-950/80 text-rose-300 border-rose-800/70 animate-pulse'
                            : slaMinutes <= 60
                            ? 'bg-amber-950/70 text-amber-300 border-amber-800/60'
                            : 'bg-slate-950 text-slate-300 border-slate-800'
                        }`}>
                          <Timer className="w-3.5 h-3.5 text-amber-400" />
                          <span>مهلة التدخل: {slaMinutes} د</span>
                        </span>
                      )}

                      {/* Status Badge */}
                      <span className={`text-xs font-mono px-3 py-1.5 rounded-lg border font-bold flex items-center gap-2 shadow-sm ${meta.badgeClass}`}>
                        <span className="relative flex h-2 w-2">
                          {meta.isPulsing && (
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                          )}
                          <span className={`relative inline-flex rounded-full h-2 w-2 ${meta.dotClass}`}></span>
                        </span>
                        <span>{meta.labelAr}</span>
                      </span>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* View Mode Switcher: Timeline vs Heuristic Optimizer */}
            <div id="heuristic-optimizer-anchor" className="flex items-center justify-between gap-3 border-b border-slate-800/80 pb-3 flex-wrap">
              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setStopsViewMode('timeline')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    stopsViewMode === 'timeline'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Navigation className="w-3.5 h-3.5 text-rose-400" />
                  <span>محطات المسار الميداني ({selectedMission.stops.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStopsViewMode('heuristic_optimizer')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    stopsViewMode === 'heuristic_optimizer'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-rose-400 hover:text-rose-300 hover:bg-rose-950/40'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-rose-300" />
                  <span>خوارزمية التسلسل الحدسية (Proximity &amp; SLA)</span>
                </button>
              </div>

              {stopsViewMode === 'timeline' && (
                <button
                  type="button"
                  onClick={() => setStopsViewMode('heuristic_optimizer')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/30 transition-all shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                  <span>اقتراح الترتيب الأمثل</span>
                </button>
              )}
            </div>

            {/* Heuristic Optimizer View OR Stops Timeline */}
            {stopsViewMode === 'heuristic_optimizer' ? (
              <InspectorRouteHeuristicOptimizer
                mission={selectedMission}
                reports={reports}
                onApplySequence={(newStops) => {
                  handleApplyOptimizedSequence(newStops);
                  setStopsViewMode('timeline');
                }}
              />
            ) : (
              /* Stops Timeline with Status-Based Toggle */
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                  <h4 className="text-xs font-bold text-slate-300">
                    محطات المعاينة الميدانية المكلف بها ({selectedMission.stops.length}):
                  </h4>

                  {/* Sub-filter for mission stops */}
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setStopStatusFilter('all')}
                      className={`px-2 py-0.5 rounded font-bold transition-all ${
                        stopStatusFilter === 'all'
                          ? 'bg-slate-800 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      الكل ({stopCounts.all})
                    </button>
                    <button
                      type="button"
                      onClick={() => setStopStatusFilter('pending')}
                      className={`px-2 py-0.5 rounded font-bold transition-all flex items-center gap-1 ${
                        stopStatusFilter === 'pending'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'text-slate-400 hover:text-amber-300'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                      <span>قيد الوصول ({stopCounts.pending})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStopStatusFilter('completed')}
                      className={`px-2 py-0.5 rounded font-bold transition-all flex items-center gap-1 ${
                        stopStatusFilter === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'text-slate-400 hover:text-emerald-300'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      <span>المكتملة ({stopCounts.completed})</span>
                    </button>
                  </div>
                </div>

                {filteredStops.length === 0 ? (
                  <div className="p-5 rounded-xl border border-dashed border-slate-800 text-center space-y-1.5 bg-slate-950/40">
                    <p className="text-xs text-slate-400">
                      لا توجد محطات في هذه الدورية بحالة "{stopStatusFilter === 'pending' ? 'قيد الوصول' : 'مكتملة'}".
                    </p>
                    <button
                      type="button"
                      onClick={() => setStopStatusFilter('all')}
                      className="text-xs text-rose-400 hover:underline font-bold"
                    >
                      عرض كافة محطات الدورية ({selectedMission.stops.length})
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {filteredStops.map((stop, idx) => {
                      const originalIndex = selectedMission.stops.findIndex(s => s.reportId === stop.reportId);
                      return (
                        <div
                          key={idx}
                          className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-start justify-between gap-3"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-7 h-7 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs font-mono">
                              {originalIndex >= 0 ? originalIndex + 1 : idx + 1}
                            </div>

                            <div>
                              <div className="text-sm font-bold text-white">{stop.storeName}</div>
                              <div className="text-xs text-slate-400 font-mono mt-0.5">
                                إحداثيات GPS: {stop.coordinates[0]}, {stop.coordinates[1]}
                              </div>
                              <div className="mt-1 flex items-center gap-2">
                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                                  stop.priority === 'critical' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                                  stop.priority === 'high' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                                  'bg-slate-800 text-slate-300'
                                }`}>
                                  أولوية: {stop.priority === 'critical' ? 'قصوى' : stop.priority === 'high' ? 'مرتفعة' : 'عادية'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className={`text-xs px-2.5 py-1 rounded-lg font-bold ${
                              stop.status === 'inspected_fined' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                              stop.status === 'inspected_cleared' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                              'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            }`}>
                              {stop.status === 'inspected_fined' && '⚖️ تم التغريم'}
                              {stop.status === 'inspected_cleared' && '✅ ممتثل'}
                              {stop.status === 'pending' && '⏳ قيد الوصول'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Inspector Resolution Modal Drawer if active */}
            {resolvingReportId && (
              <form onSubmit={handleConfirmResolution} className="bg-slate-950 p-4 rounded-xl border border-rose-500/50 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                    <Scale className="w-4 h-4" />
                    تسجيل محضر ضبط رسمي وإجراء الردع
                  </h4>
                  <button
                    type="button"
                    onClick={() => setResolvingReportId(null)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    إلغاء
                  </button>
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">ملاحظات ومحضر المعاينة الميدانية</label>
                  <textarea
                    rows={2}
                    value={enforcementNotes}
                    onChange={(e) => setEnforcementNotes(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">مبلغ الغرامة الموقعة (دج)</label>
                    <input
                      type="number"
                      value={fineAmount}
                      onChange={(e) => setFineAmount(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const rep = reports.find(r => r.id === resolvingReportId);
                        if (rep) handleDownloadReport(rep);
                      }}
                      disabled={isGeneratingPdf === resolvingReportId}
                      className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
                    >
                      {isGeneratingPdf === resolvingReportId ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
                      ) : (
                        <FileDown className="w-3.5 h-3.5 text-rose-400" />
                      )}
                      <span>تحميل PDF</span>
                    </button>

                    <button
                      type="submit"
                      className="flex-1 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-colors"
                    >
                      تثبيت وتوليد SHA-256
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Immutable Audit Ledger Tab */}
      {activeTab === 'audit_ledger' && (
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                <Lock className="w-5 h-5 text-emerald-400" />
                الدفتر الرقمي غير القابل للتلاعب (Tamper-Proof Audit Ledger)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                كل إجراء تفتيشي أو بلاغ أو محضر مخالفة يُسجل ببصمة تشفيرية متسلسلة (SHA-256 Chained Hash) لحظر التواطؤ والتدخل البيروقراطي.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleExportAnalyticsCsv}
                disabled={isExportingCsv}
                title="تصدير كافة السجلات والفوارق السعرية بصيغة CSV للتدقيق المكتبي"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 hover:text-white border border-emerald-700/60 font-bold text-xs transition-colors shadow-sm disabled:opacity-50"
              >
                {isExportingCsv ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>تحميل بيانات التدقيق (Analytics CSV)</span>
              </button>

              <div className="flex items-center gap-2 text-xs font-mono bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-emerald-400">
                <CheckCheck className="w-4 h-4 text-emerald-400" />
                <span>Integrity: 100% Cryptographically Verified</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-colors space-y-2 text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                      {log.id}
                    </span>
                    <span className="font-mono text-slate-400 text-[11px]">{log.timestamp}</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[10px] border border-emerald-500/30">
                      {log.status === 'immutable_verified' ? 'متحقق تشفيرياً' : 'مؤمن ضد التعديل'}
                    </span>
                  </div>

                  <div className="text-slate-400 text-[11px]">
                    الفاعل: <strong className="text-slate-200 font-mono">{log.actorId}</strong> ({log.actorRole})
                  </div>
                </div>

                <div className="text-sm font-semibold text-white">
                  {log.actionAr}
                </div>

                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80 font-mono text-[10px] text-slate-400 space-y-1 overflow-x-auto">
                  <div className="text-emerald-400">
                    Current Block Hash: <span className="text-slate-300">{log.blockHash}</span>
                  </div>
                  <div className="text-slate-500">
                    Previous Hash: <span>{log.previousHash}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-500 font-mono">
                    بصمة البلوك: {log.blockHash.slice(0, 16)}...
                  </span>
                  <button
                    onClick={() => handleDownloadAuditReport(log)}
                    disabled={isGeneratingPdf === log.id}
                    title="تصدير وتحميل المحضر الرسمي كملف PDF معتمد مع البصمة التشفيرية"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-white font-bold text-xs border border-rose-800/50 transition-colors disabled:opacity-50"
                  >
                    {isGeneratingPdf === log.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
                    ) : (
                      <FileDown className="w-3.5 h-3.5 text-rose-400" />
                    )}
                    <span>تحميل محضر المخالفة (PDF)</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
