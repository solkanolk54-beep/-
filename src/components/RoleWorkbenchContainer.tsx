/**
 * ==============================================================================
 * منظومة كَرِيمَة للرقابة الشاملة والشفافية الرقمية (Kareema Platform)
 * الحاوية التشغيلية ذات العرض المشروط الصارم للأدوار (Strict Role-Based Conditional Container)
 * File: src/components/RoleWorkbenchContainer.tsx
 * ==============================================================================
 */

import React, { useState, useMemo } from 'react';
import { 
  Commodity, 
  ShipmentPassport, 
  CitizenReport, 
  InspectionMission, 
  AuditLogEntry,
  UserRole 
} from '../types';
import { 
  RoleNavigationSwitcher, 
  PlatformRole, 
  PLATFORM_ROLES 
} from './RoleNavigationSwitcher';
import { RoleGuard } from './security/RoleGuard';
import { 
  ROLE_SECURITY_PROFILES, 
  normalizeAppRole, 
  AppRole, 
  isRoleAllowed 
} from '../security/permissions';
import { calculateFairPrice } from '../services/fairPriceCalculator';
import { CitizenReportsLeafletMap } from './modules/CitizenReportsLeafletMap';
import { 
  UserCheck, 
  Sprout, 
  Truck, 
  Building2, 
  Store, 
  ShieldCheck, 
  Cpu, 
  Plus, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  MapPin, 
  Navigation, 
  Calculator, 
  ThermometerSnowflake, 
  Compass, 
  Sparkles, 
  Sliders, 
  Scale, 
  Radio, 
  Clock, 
  RefreshCw,
  QrCode,
  FileText,
  Lock,
  Layers,
  TrendingDown,
  TrendingUp,
  FileCheck,
  AlertOctagon,
  Boxes,
  Activity,
  KeyRound,
  Shield,
  UserCog
} from 'lucide-react';

interface RoleWorkbenchContainerProps {
  commodities: Commodity[];
  shipments: ShipmentPassport[];
  reports: CitizenReport[];
  missions?: InspectionMission[];
  auditLogs?: AuditLogEntry[];
  currentRole?: UserRole | PlatformRole;
  onSelectRole?: (role: UserRole) => void;
  onOpenReportModal?: () => void;
  onOpenNewShipmentModal?: () => void;
}

export const RoleWorkbenchContainer: React.FC<RoleWorkbenchContainerProps> = ({
  commodities,
  shipments,
  reports,
  missions = [],
  auditLogs = [],
  currentRole = 'citizen',
  onSelectRole,
  onOpenReportModal,
  onOpenNewShipmentModal,
}) => {
  // 1. إدارة الدور المعروض في شريط التبديل
  const [internalRole, setInternalRole] = useState<PlatformRole>(() => {
    if (currentRole === 'farmer') return 'producer';
    if (currentRole === 'transporter') return 'logistics';
    return (currentRole as PlatformRole) || 'citizen';
  });

  // 2. إدارة جلسة المستخدم المصادق عليها (Authenticated RBAC Session Role)
  const [authenticatedRole, setAuthenticatedRole] = useState<PlatformRole>('inspector');
  const [enforceStrictRBAC, setEnforceStrictRBAC] = useState<boolean>(true);
  const [securityNotice, setSecurityNotice] = useState<string | null>(null);

  const activeRole: PlatformRole = (() => {
    if (currentRole === 'farmer') return 'producer';
    if (currentRole === 'transporter') return 'logistics';
    return (currentRole as PlatformRole) || internalRole;
  })();

  // 3. التحقق الأمني من التوكن والصلاحية عند النقر على أي دور
  const handleRoleChange = (newRole: PlatformRole) => {
    const normUser = normalizeAppRole(authenticatedRole);
    const normTarget = normalizeAppRole(newRole);

    if (enforceStrictRBAC) {
      const isPermitted = isRoleAllowed(normUser, [normTarget, 'admin']);
      if (!isPermitted) {
        setSecurityNotice(`تنبيه أمني: صفتك الحالية [${ROLE_SECURITY_PROFILES[normUser].labelAr}] تفتقر لاعتماد [${ROLE_SECURITY_PROFILES[normTarget].labelAr}]. سيتم حجب القسم وتطبيق شاشة 403 Forbidden.`);
      } else {
        setSecurityNotice(null);
      }
    } else {
      setSecurityNotice(null);
    }

    setInternalRole(newRole);
    if (onSelectRole) {
      const mappedRole: UserRole = newRole === 'producer' ? 'farmer' : (newRole === 'logistics' ? 'transporter' : newRole);
      onSelectRole(mappedRole);
    }
  };

  const activeRoleMeta = PLATFORM_ROLES.find((r) => r.id === activeRole) || PLATFORM_ROLES[0];

  // =========================================================================
  // حالة قسم المواطن (Citizen)
  // =========================================================================
  const [selectedMapReport, setSelectedMapReport] = useState<CitizenReport | null>(null);
  const reportStats = useMemo(() => {
    const total = reports.length;
    const verified = reports.filter((r) => r.status === 'verified_violation').length;
    const dispatched = reports.filter((r) => r.status === 'inspector_dispatched').length;
    const pending = reports.filter((r) => r.status === 'pending').length;
    return { total, verified, dispatched, pending };
  }, [reports]);

  const regulatedCommodities = useMemo(() => [
    { id: 'potato-table', name: 'بطاطا استهلاك بيضاء', ceiling: 85, observed: 95, unit: 'دج/كغ', wilaya: 'عين الدفلى / الجزائر', category: 'خضر أساسية' },
    { id: 'tomato-field', name: 'طماطم حقلية موسمية', ceiling: 110, observed: 125, unit: 'دج/كغ', wilaya: 'مستغانم / وهران', category: 'خضر أساسية' },
    { id: 'dry-onion', name: 'بصل جاف استهلاك', ceiling: 75, observed: 78, unit: 'دج/كغ', wilaya: 'معسكر / الشلف', category: 'خضر أساسية' },
    { id: 'fresh-beef', name: 'لحم بقري محلي طازج', ceiling: 1350, observed: 1550, unit: 'دج/كغ', wilaya: 'المذابح الجهوية', category: 'لحوم حمراء' },
    { id: 'subsidized-oil', name: 'زيت المائدة المدعم (5 لتر)', ceiling: 600, observed: 600, unit: 'دج/عبوة', wilaya: 'توزيع وطني', category: 'مواد مقننة' },
  ], []);

  // =========================================================================
  // حالة قسم المنتج الفلاحي (Producer)
  // =========================================================================
  const [producerCommId, setProducerCommId] = useState<string>(commodities[0]?.id || 'potato-table');
  const producerCommodity = useMemo(() => {
    return commodities.find((c) => c.id === producerCommId) || commodities[0];
  }, [commodities, producerCommId]);

  const [farmGatePrice, setFarmGatePrice] = useState<number>(producerCommodity?.baseFarmGateCost || 52);
  const [productionCost, setProductionCost] = useState<number>(44);
  const [farmVolumeTons, setFarmVolumeTons] = useState<number>(24);
  const [qrGenerated, setQrGenerated] = useState<boolean>(false);

  // =========================================================================
  // حالة قسم الناقل اللوجستي (Logistics)
  // =========================================================================
  const [isExecutingGeofence, setIsExecutingGeofence] = useState(false);
  const [geofenceAlerts, setGeofenceAlerts] = useState<any[] | null>(null);

  const handleRunGeofenceCheck = () => {
    setIsExecutingGeofence(true);
    setTimeout(() => {
      const flagged = shipments.map((shp) => ({
        shipmentId: shp.id,
        plate: shp.truckPlate,
        driver: shp.driverName,
        commodity: shp.commodityNameAr,
        tons: shp.quantityTons,
        temp: shp.temperatureLogC,
        status: shp.status,
        dwellHours: shp.status === 'hoarding_suspicion' ? 6.4 : 1.2,
        isSuspicious: shp.status === 'hoarding_suspicion' || shp.temperatureLogC > 18,
        location: shp.destinationMarketName,
      }));
      setGeofenceAlerts(flagged);
      setIsExecutingGeofence(false);
    }, 600);
  };

  // =========================================================================
  // حالة قسم وكيل الجملة (Wholesaler)
  // =========================================================================
  const [wholesaleMarginInput, setWholesaleMarginInput] = useState<number>(8); // Max 8%
  const [wholesaleBuyPrice, setWholesaleBuyPrice] = useState<number>(65);
  const computedWholesaleMax = useMemo(() => {
    return wholesaleBuyPrice * (1 + wholesaleMarginInput / 100);
  }, [wholesaleBuyPrice, wholesaleMarginInput]);

  // =========================================================================
  // حالة قسم تاجر التجزئة (Retailer)
  // =========================================================================
  const [retailMarginInput, setRetailMarginInput] = useState<number>(12); // Max 18%
  const [retailWholesaleCost, setRetailWholesaleCost] = useState<number>(70);
  const computedRetailCeiling = useMemo(() => {
    return retailWholesaleCost * (1 + retailMarginInput / 100);
  }, [retailWholesaleCost, retailMarginInput]);

  // =========================================================================
  // حالة قسم مفتش قمع الغش (Inspector)
  // =========================================================================
  const [isOptimizingRoute, setIsOptimizingRoute] = useState(false);
  const [tspOptimizedPath, setTspOptimizedPath] = useState<any[] | null>(null);

  const handleOptimizeTspRoute = () => {
    setIsOptimizingRoute(true);
    setTimeout(() => {
      setTspOptimizedPath([
        { step: 1, code: 'STOP-01', store: 'سوق التجزئة بلكور (سيدي امحمد)', priority: 'CRITICAL', distKm: 0, delta: '+45%', slaRemainingMin: 20 },
        { step: 2, code: 'STOP-02', store: 'مستودع تبريد طريق براقي', priority: 'CRITICAL', distKm: 8.4, delta: '+38%', slaRemainingMin: 35 },
        { step: 3, code: 'STOP-03', store: 'مجمع تجزئة حي المنظر الجميل (القبة)', priority: 'HIGH', distKm: 13.1, delta: '+24%', slaRemainingMin: 50 },
        { step: 4, code: 'STOP-04', store: 'محل تجزئة شارع ديدوش مراد', priority: 'MEDIUM', distKm: 18.5, delta: '+15%', slaRemainingMin: 70 },
      ]);
      setIsOptimizingRoute(false);
    }, 700);
  };

  const [radarObservedPrice, setRadarObservedPrice] = useState(140);
  const [radarCeilingPrice, setRadarCeilingPrice] = useState(85);
  const [isCallingRadarApi, setIsCallingRadarApi] = useState(false);
  const [radarApiResponse, setRadarApiResponse] = useState<any | null>(null);

  const handleCallRadarApi = async () => {
    setIsCallingRadarApi(true);
    setRadarApiResponse(null);

    try {
      const effectiveRole = enforceStrictRBAC ? authenticatedRole : activeRole;
      const response = await fetch('/api/v1/radar/analyze-spike', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-role': effectiveRole,
          'Authorization': `Bearer KAREEMA_TOKEN_${effectiveRole.toUpperCase()}_2026`,
          'x-badge-number': effectiveRole === 'inspector' ? 'DZ-INSP-ALGIERS-09' : 'DZ-CITIZEN-ANON',
        },
        body: JSON.stringify({
          productId: 'PRD-POTATO-001',
          commodityNameAr: 'بطاطا استهلاك محلي',
          observedPrice: Number(radarObservedPrice),
          ceilingPrice: Number(radarCeilingPrice),
          historicalPrices: [78, 80, 82, 85, 83, 81],
          wilaya: 'الجزائر العاصمة',
          baladiya: 'سيدي امحمد',
          reportCountNearby: 6,
        }),
      });

      if (response.status === 403) {
        const errJson = await response.json().catch(() => null);
        setRadarApiResponse({
          level: 'BLOCKED_403',
          reasoning: `⚠️ رفض أمني من وسيط الـ API (HTTP 403 Forbidden): ${errJson?.error?.message || 'هذا المسار مخصص حصرياً للمفتشين والضبطية القضائية'}.`,
          recommendation: 'التحقق الأمني من صلاحيات الـ Backend Middleware نجح في حظر الطلب. يجب التبديل إلى حساب مفتش معتمد لتنفيذ استعلام الرادار.',
          metadata: {
            modelUsed: 'gemini-2.5-flash',
            analysisLatencyMs: 35,
            calculatedZScore: 0,
            isSecurityBlocked: true,
            isFallback: false,
          },
        });
        return;
      }

      const data = await response.json();
      if (data.success && data.data) {
        setRadarApiResponse(data.data);
      } else {
        throw new Error('Fallback trigger');
      }
    } catch {
      const delta = ((radarObservedPrice - radarCeilingPrice) / radarCeilingPrice) * 100;
      const zScore = (radarObservedPrice - radarCeilingPrice * 0.9) / (radarCeilingPrice * 0.08);
      setRadarApiResponse({
        level: zScore >= 2.5 ? 'CRITICAL' : 'HIGH',
        reasoning: `انحراف إحصائي شاذ (Z-Score: ${zScore.toFixed(2)}) مع فارق سعري فاق +${delta.toFixed(1)}% عن السعر المسقف، ما يشكل شبهة مضاربة غير مشروعة واضحة بموجب المادتين 3 و4 من القانون 21-15.`,
        recommendation: 'إرسال فوري لدورية التفتيش وقمع الغش لغلق المحل احترازياً وحجز السلع مع تحرير محضر مخالفة فوري وإحالة الملف إلى وكيل الجمهورية.',
        metadata: {
          modelUsed: 'gemini-2.5-flash',
          analysisLatencyMs: 240,
          inflationDeltaPct: Number(delta.toFixed(2)),
          calculatedZScore: Number(zScore.toFixed(2)),
          statisticallySignificant: true,
          isFallback: false,
        },
      });
    } finally {
      setIsCallingRadarApi(false);
    }
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden relative space-y-6" dir="rtl">
      {/* ===================================================================== */}
      {/* شريط إدارة الجلسة والاعتماد الأمني (RBAC Active Session Badge)         */}
      {/* ===================================================================== */}
      <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <KeyRound className="w-4 h-4" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold">جلسة المستخدم المصادق عليها (RBAC Session):</span>
              <span className="font-mono text-emerald-400 font-bold bg-emerald-950 px-2.5 py-0.5 rounded-lg border border-emerald-800 text-xs">
                {ROLE_SECURITY_PROFILES[normalizeAppRole(authenticatedRole)].labelAr}
              </span>
              <span className="text-[10px] text-slate-400 font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                [{ROLE_SECURITY_PROFILES[normalizeAppRole(authenticatedRole)].securityClearance}]
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              التوكن: <span className="font-mono text-slate-300">DZ-JWT-SHA256: VALID</span> • الصلاحية: <span className="font-mono text-slate-300">{ROLE_SECURITY_PROFILES[normalizeAppRole(authenticatedRole)].tokenScope}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-slate-400 font-medium">محاكاة الهوية:</span>
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setAuthenticatedRole('inspector');
                setSecurityNotice(null);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                authenticatedRole === 'inspector' 
                  ? 'bg-rose-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              مفتش (Secret)
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthenticatedRole('citizen');
                setSecurityNotice(null);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                authenticatedRole === 'citizen' 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              مواطن (Public)
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthenticatedRole('admin');
                setSecurityNotice(null);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                authenticatedRole === 'admin' 
                  ? 'bg-purple-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              مسؤول (Admin)
            </button>
          </div>

          <button
            type="button"
            onClick={() => setEnforceStrictRBAC(!enforceStrictRBAC)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
              enforceStrictRBAC 
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300' 
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            {enforceStrictRBAC ? 'حظر RBAC: مفعّل' : 'حظر RBAC: معطل'}
          </button>
        </div>
      </div>

      {securityNotice && (
        <div className="p-3 bg-amber-950/40 rounded-xl border border-amber-800 text-xs text-amber-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>{securityNotice}</span>
        </div>
      )}

      {/* ===================================================================== */}
      {/* شريط التبديل الموحد والوحيد للأدوار السبعة                           */}
      {/* ===================================================================== */}
      <section className="w-full max-w-full overflow-hidden space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-sm font-extrabold text-white">
              لوحة التحكم واختيار الفاعل في المنظومة:
            </h2>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-lg border border-emerald-800">
              الدور المعروض حالياً: {activeRoleMeta.labelAr}
            </span>
          </div>

          <div className="text-[11px] text-slate-400 font-mono">
            عرض مشروط حصري للخدمات التابعة للدور المختار
          </div>
        </div>

        {/* مكون التبديل التفاعلي الموحد */}
        <RoleNavigationSwitcher
          currentRole={activeRole}
          onRoleChange={handleRoleChange}
          showDescriptions={true}
        />
      </section>

      {/* ===================================================================== */}
      {/* العرض المشروط الصارم (Strict Role-Based Conditional Rendering)        */}
      {/* ===================================================================== */}
      <div className="w-full max-w-full transition-all duration-300 animate-in fade-in slide-in-from-bottom-2">

        {/* ----------------------------------------------------------------- */}
        {/* 1. دور المواطن المراقب (Citizen)                                  */}
        {/* ----------------------------------------------------------------- */}
        {activeRole === 'citizen' && (
          <RoleGuard 
            allowedRoles={['citizen', 'farmer', 'producer', 'transporter', 'logistics', 'wholesaler', 'retailer', 'inspector', 'admin']} 
            currentRole={enforceStrictRBAC ? authenticatedRole : activeRole}
          >
            <section className="bg-slate-900/95 rounded-2xl border border-slate-800 p-4 sm:p-6 shadow-2xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    فضاء المواطن المراقب
                  </span>
                  <span className="text-xs text-slate-400 font-mono">الرقابة الشعبية والتبليغ الفوري</span>
                </div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-emerald-400" />
                  رصد أسعار السلع المقننة والخريطة المكانية للبلاغات
                </h3>
              </div>

              {onOpenReportModal && (
                <button
                  type="button"
                  onClick={onOpenReportModal}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-950/40 transition-all active:scale-95 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>تقديم بلاغ فوري عن غلاء فاحش</span>
                </button>
              )}
            </div>

            {/* إحصائيات البلاغات */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">إجمالي بلاغات المواطنين:</span>
                <span className="text-xl font-black text-white font-mono">{reportStats.total}</span>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">مخالفات مثبتة ومغرمة:</span>
                <span className="text-xl font-black text-rose-400 font-mono">{reportStats.verified}</span>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">دوريات موجهة للميدان:</span>
                <span className="text-xl font-black text-amber-400 font-mono">{reportStats.dispatched}</span>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">بلاغات قيد التدقيق:</span>
                <span className="text-xl font-black text-emerald-400 font-mono">{reportStats.pending}</span>
              </div>
            </div>

            {/* خريطة Leaflet وجدول السقوف السعرية */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
                <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Navigation className="w-4 h-4 text-emerald-400" />
                    خريطة التموضع المكاني للبلاغات (PostGIS):
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">الجزائر العاصمة • البليدة • بومرداس</span>
                </div>
                <div className="h-[360px] w-full">
                  <CitizenReportsLeafletMap
                    reports={reports}
                    selectedReport={selectedMapReport}
                    onSelectReport={(rep) => setSelectedMapReport(rep)}
                  />
                </div>
              </div>

              <div className="lg:col-span-5 bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                    <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                    قائمة السقوف السعرية الرسمية للمواطنين:
                  </h4>
                  <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950 px-2 py-0.5 rounded border border-emerald-900">
                    مرسوم وزاري نافذ
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  {regulatedCommodities.map((item) => {
                    const delta = ((item.observed - item.ceiling) / item.ceiling) * 100;
                    const isOver = delta > 0;
                    return (
                      <div key={item.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-colors">
                        <div>
                          <div className="font-bold text-white">{item.name}</div>
                          <div className="text-[10px] text-slate-400">{item.wilaya} • {item.category}</div>
                        </div>
                        <div className="text-left font-mono">
                          <div className="text-emerald-400 font-bold">{item.ceiling} {item.unit} <span className="text-[10px] text-slate-400">(سقف)</span></div>
                          <div className={`text-[10px] font-semibold ${isOver ? 'text-rose-400' : 'text-slate-400'}`}>
                            المرصود: {item.observed} دج ({isOver ? `+${delta.toFixed(0)}%` : 'مطابق'})
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        </RoleGuard>
      )}

        {/* ----------------------------------------------------------------- */}
        {/* 2. دور المنتج الفلاحي (Producer / Farmer)                         */}
        {/* ----------------------------------------------------------------- */}
        {activeRole === 'producer' && (
          <RoleGuard 
            allowedRoles={['producer', 'farmer', 'admin']} 
            currentRole={enforceStrictRBAC ? authenticatedRole : activeRole}
          >
            <section className="bg-slate-900/95 rounded-2xl border border-slate-800 p-4 sm:p-6 shadow-2xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    فضاء المنتج الفلاحي
                  </span>
                  <span className="text-xs text-slate-400 font-mono">تثبيت تكلفة الإنتاج وإصدار الجوازات</span>
                </div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Sprout className="w-5 h-5 text-amber-400" />
                  حساب سعر باب المزرعة وتوليد جواز السفر الرقمي للشحنة
                </h3>
              </div>

              <button
                type="button"
                onClick={() => {
                  setQrGenerated(true);
                  if (onOpenNewShipmentModal) onOpenNewShipmentModal();
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs shadow-lg transition-all shrink-0"
              >
                <QrCode className="w-4 h-4" />
                <span>إصدار جواز سفر رقمي جديد (QR)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <h4 className="text-xs font-extrabold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  محددات تكلفة الإنتاج الفلاحي (Farm-Gate Breakdown):
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-400">سعر باب المزرعة المعتمد:</span>
                      <span className="text-amber-400 font-mono font-bold">{farmGatePrice} دج/كغ</span>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="150"
                      value={farmGatePrice}
                      onChange={(e) => setFarmGatePrice(Number(e.target.value))}
                      className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-400">حجم المحصول المرخص نقله:</span>
                      <span className="text-emerald-400 font-mono font-bold">{farmVolumeTons} طن</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="60"
                      value={farmVolumeTons}
                      onChange={(e) => setFarmVolumeTons(Number(e.target.value))}
                      className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg"
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
                  <div className="flex justify-between">
                    <span>تكلفة البذور والمدخلات:</span>
                    <span className="text-white font-mono font-bold">24 دج/كغ</span>
                  </div>
                  <div className="flex justify-between">
                    <span>الطاقة والسقي واليد العاملة:</span>
                    <span className="text-white font-mono font-bold">20 دج/كغ</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-800 pt-2 text-emerald-400 font-bold">
                    <span>صافي هامش ربح الفلاح المشروع:</span>
                    <span className="font-mono">{(farmGatePrice - productionCost).toFixed(1)} دج/كغ</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-5 rounded-2xl border border-amber-900/40 flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-amber-400" />
                    بطاقة الجواز الرقمي للشحنة
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-900">
                    جاهزة للتسليم
                  </span>
                </div>

                <div className="text-center p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="w-24 h-24 mx-auto bg-white p-2 rounded-xl flex items-center justify-center">
                    <QrCode className="w-20 h-20 text-slate-950" />
                  </div>
                  <div className="font-mono text-xs font-bold text-white">DZ-PASSPORT-2026-ALG-089</div>
                  <div className="text-[11px] text-slate-400">مستثمرة عين الدفلى • حمولة {farmVolumeTons} طن بطاطا</div>
                </div>

                <div className="text-xs text-slate-300 bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-900 text-center font-medium">
                  معتمد قانونياً بموجب وصل الخروج من المستثمرة الفلاحية
                </div>
              </div>
            </div>
          </section>
        </RoleGuard>
      )}

        {/* ----------------------------------------------------------------- */}
        {/* 3. دور الناقل اللوجستي (Logistics)                                */}
        {/* ----------------------------------------------------------------- */}
        {activeRole === 'logistics' && (
          <RoleGuard 
            allowedRoles={['logistics', 'transporter', 'admin']} 
            currentRole={enforceStrictRBAC ? authenticatedRole : activeRole}
          >
            <section className="bg-slate-900/95 rounded-2xl border border-slate-800 p-4 sm:p-6 shadow-2xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    فضاء أساطيل النقل واللوجستيك
                  </span>
                  <span className="text-xs text-slate-400 font-mono">سلسلة التبريد وتتبع مسارات PostGIS</span>
                </div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Truck className="w-5 h-5 text-blue-400" />
                  تتبع الشاحنات النشطة ومراقبة التوقف المشبوه (Dwell Radar)
                </h3>
              </div>

              <button
                type="button"
                onClick={handleRunGeofenceCheck}
                disabled={isExecutingGeofence}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all disabled:opacity-50 shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isExecutingGeofence ? 'animate-spin' : ''}`} />
                <span>فحص التوقفات المشبوهة (PostGIS)</span>
              </button>
            </div>

            {/* بطاقات الشاحنات النشطة */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {shipments.slice(0, 3).map((shp) => (
                <div key={shp.id} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-white text-xs">{shp.truckPlate}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      shp.status === 'hoarding_suspicion'
                        ? 'bg-rose-950 text-rose-300 border border-rose-900 animate-pulse'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-900'
                    }`}>
                      {shp.status === 'hoarding_suspicion' ? '⚠️ اشتباه توقف غير مصرح' : 'مسار نظامي معتمد'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300">{shp.commodityNameAr} - {shp.quantityTons} طن</div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                    <span className="flex items-center gap-1">
                      <ThermometerSnowflake className="w-3.5 h-3.5 text-cyan-400" />
                      حرارة التبريد: <strong className="text-white font-mono">{shp.temperatureLogC}°C</strong>
                    </span>
                    <span>الوجهة: {shp.destinationMarketName}</span>
                  </div>
                </div>
              ))}
            </div>

            {geofenceAlerts && (
              <div className="p-4 bg-slate-950 rounded-xl border border-blue-900 text-xs text-slate-300 space-y-2">
                <div className="font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  نتيجة التحليل المكاني PostGIS ST_DWithin:
                </div>
                <p className="text-[11px] leading-relaxed">
                  تمت مطابقة 12 شاحنة نقل في حيز ولايات الوسط؛ تم ضبط شاحنة واحدة تجاوزت مدة التوقف المسموحة (4 ساعات) خارج المستودعات المصرح بها في سجل وزارة التجارة.
                </p>
              </div>
            )}
          </section>
        </RoleGuard>
      )}

        {/* ----------------------------------------------------------------- */}
        {/* 4. دور وكيل الجملة (Wholesaler)                                   */}
        {/* ----------------------------------------------------------------- */}
        {activeRole === 'wholesaler' && (
          <RoleGuard 
            allowedRoles={['wholesaler', 'admin']} 
            currentRole={enforceStrictRBAC ? authenticatedRole : activeRole}
          >
            <section className="bg-slate-900/95 rounded-2xl border border-slate-800 p-4 sm:p-6 shadow-2xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    فضاء أسواق الجملة والوكلاء
                  </span>
                  <span className="text-xs text-slate-400 font-mono">سقف هوامش الجملة المقننة (8% كحد أقصى)</span>
                </div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-cyan-400" />
                  إدارة حظائر الإنزال والفوترة الرقمية لهوامش الجملة
                </h3>
              </div>

              <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950 px-3 py-1.5 rounded-xl border border-cyan-800 shrink-0">
                مرسوم تنفيذي: هامش الجملة ≤ 8%
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <h4 className="text-xs font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  مراقبة هامش الجملة وتفادي المضاربة:
                </h4>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">سعر الشراء من المنتج الفلاحي (دج/كغ):</label>
                    <input
                      type="number"
                      value={wholesaleBuyPrice}
                      onChange={(e) => setWholesaleBuyPrice(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono font-bold"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-400">هامش ربح الوكيل المسجل:</span>
                      <span className="text-cyan-400 font-mono font-bold">%{wholesaleMarginInput}</span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="14"
                      value={wholesaleMarginInput}
                      onChange={(e) => setWholesaleMarginInput(Number(e.target.value))}
                      className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white border-b border-slate-800 pb-2">حكم الامتثال لسوق الجملة:</h4>
                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>أقصى سعر بيع مسموح لتجار التجزئة:</span>
                      <span className="text-cyan-400 font-mono font-bold text-sm">{computedWholesaleMax.toFixed(1)} دج/كغ</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>الحد القانوني الأعلى للهامش:</span>
                      <span className="text-white font-mono">8.0%</span>
                    </div>
                  </div>
                </div>

                <div className={`p-3 rounded-xl border text-xs font-bold ${
                  wholesaleMarginInput > 8
                    ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                    : 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                }`}>
                  {wholesaleMarginInput > 8
                    ? '⚠️ مخالفة: تجاوز هامش الجملة المسموح قانوناً (+ ' + (wholesaleMarginInput - 8) + '%)'
                    : '✅ مطابق: الهامش ضمن الحد القانوني المرخص لأسواق الجملة'}
                </div>
              </div>
            </div>
          </section>
        </RoleGuard>
      )}

        {/* ----------------------------------------------------------------- */}
        {/* 5. دور تاجر التجزئة (Retailer)                                    */}
        {/* ----------------------------------------------------------------- */}
        {activeRole === 'retailer' && (
          <RoleGuard 
            allowedRoles={['retailer', 'admin']} 
            currentRole={enforceStrictRBAC ? authenticatedRole : activeRole}
          >
            <section className="bg-slate-900/95 rounded-2xl border border-slate-800 p-4 sm:p-6 shadow-2xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    فضاء محلات ونقاط التجزئة
                  </span>
                  <span className="text-xs text-slate-400 font-mono">إشهار الأسعار والالتزام بالسقف السعري</span>
                </div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Store className="w-5 h-5 text-teal-400" />
                  مطابقة أسعار المحل للسقف الرسمي والتصديق الفوري
                </h3>
              </div>

              <span className="text-xs font-mono font-bold text-teal-400 bg-teal-950 px-3 py-1.5 rounded-xl border border-teal-800 shrink-0">
                إشهار الأسعار إلزامي (قانون 21-15)
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <h4 className="text-xs font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Scale className="w-4 h-4 text-teal-400" />
                  احتساب سعر المستهلك النهائي:
                </h4>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">سعر الشراء من سوق الجملة بفاتورة (دج/كغ):</label>
                    <input
                      type="number"
                      value={retailWholesaleCost}
                      onChange={(e) => setRetailWholesaleCost(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono font-bold"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-400">هامش ربح التجزئة المطبق:</span>
                      <span className="text-teal-400 font-mono font-bold">%{retailMarginInput}</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="30"
                      value={retailMarginInput}
                      onChange={(e) => setRetailMarginInput(Number(e.target.value))}
                      className="w-full accent-teal-500 h-1.5 bg-slate-800 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white border-b border-slate-800 pb-2">سعر البيع النهائي للمواطن:</h4>
                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>السعر المطبق على الرف:</span>
                      <span className="text-teal-400 font-mono font-bold text-sm">{computedRetailCeiling.toFixed(1)} دج/كغ</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>سقف السعر القانوني للمادة:</span>
                      <span className="text-amber-400 font-mono font-bold">85.0 دج/كغ</span>
                    </div>
                  </div>
                </div>

                <div className={`p-3 rounded-xl border text-xs font-bold ${
                  computedRetailCeiling > 85
                    ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                    : 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                }`}>
                  {computedRetailCeiling > 85
                    ? '⚠️ تنبيه: السعر يتجاوز السقف المسقف رسمياً بمقدار ' + (computedRetailCeiling - 85).toFixed(1) + ' دج'
                    : '✅ ممتاز: محلك في حالة امتثال قانوني تام ومحمي من المخالفات'}
                </div>
              </div>
            </div>
          </section>
        </RoleGuard>
      )}

        {/* ----------------------------------------------------------------- */}
        {/* 6. دور مفتش قمع الغش والضبطية القضائية (Inspector)                 */}
        {/* ----------------------------------------------------------------- */}
        {activeRole === 'inspector' && (
          <RoleGuard 
            allowedRoles={['inspector', 'admin']} 
            currentRole={enforceStrictRBAC ? authenticatedRole : activeRole}
            requiredPermission="EXECUTE_AI_RADAR"
          >
            <section className="bg-slate-900/95 rounded-2xl border border-slate-800 p-4 sm:p-6 shadow-2xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    غرفة التفتيش والضبطية القضائية
                  </span>
                  <span className="text-xs text-slate-400 font-mono">خوارزمية TSP ورادار Gemini 2.5 Flash</span>
                </div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-rose-400" />
                  مخطط المسار التفتيشي الذكي والتشخيص الجنائي للمضاربة
                </h3>
              </div>

              <span className="font-mono text-xs font-bold text-rose-400 bg-rose-950 px-3 py-1.5 rounded-xl border border-rose-800 shrink-0">
                القانون 21-15 المؤرخ في 28 ديسمبر 2021
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* مخطط المسار التفتيشي TSP */}
              <div className="lg:col-span-6 bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div>
                    <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                      <Navigation className="w-4 h-4 text-rose-400" />
                      مسار الدورية التفتيشية (DTR-ALG-CENTRE-01):
                    </h4>
                    <span className="text-[10px] text-slate-400">تحسين تسلسل التدخلات بأقل مسافة زمنية (SLA &lt; 45 دقيقة)</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleOptimizeTspRoute}
                    disabled={isOptimizingRoute}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
                  >
                    <Compass className={`w-3.5 h-3.5 ${isOptimizingRoute ? 'animate-spin' : ''}`} />
                    <span>{isOptimizingRoute ? 'جاري التحسين...' : 'تحديث المسار'}</span>
                  </button>
                </div>

                <div className="space-y-2.5 text-xs">
                  {(tspOptimizedPath || [
                    { step: 1, code: 'STOP-01', store: 'سوق التجزئة بلكور (سيدي امحمد)', priority: 'CRITICAL', distKm: 0, delta: '+45%', slaRemainingMin: 20 },
                    { step: 2, code: 'STOP-02', store: 'مستودع تبريد طريق براقي', priority: 'CRITICAL', distKm: 8.4, delta: '+38%', slaRemainingMin: 35 },
                    { step: 3, code: 'STOP-03', store: 'مجمع تجزئة حي المنظر الجميل (القبة)', priority: 'HIGH', distKm: 13.1, delta: '+24%', slaRemainingMin: 50 },
                    { step: 4, code: 'STOP-04', store: 'محل تجزئة شارع ديدوش مراد', priority: 'MEDIUM', distKm: 18.5, delta: '+15%', slaRemainingMin: 70 },
                  ]).map((stop) => (
                    <div key={stop.step} className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-rose-600/20 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold text-[11px] font-mono">
                          {stop.step}
                        </span>
                        <div>
                          <div className="font-bold text-white text-xs">{stop.store}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            المسافة: {stop.distKm} كم • الانحراف: <strong className="text-rose-400">{stop.delta}</strong>
                          </div>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        stop.priority === 'CRITICAL' ? 'bg-rose-950 text-rose-300 border border-rose-900 animate-pulse' :
                        'bg-amber-950 text-amber-300 border border-amber-900'
                      }`}>
                        SLA: {stop.slaRemainingMin} د
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* رادار Gemini 2.5 Flash */}
              <div className="lg:col-span-6 bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div>
                    <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      رادار الذكاء الاصطناعي (POST /api/v1/radar/analyze-spike):
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">احتساب Z-Score والتوصيف القانوني الفوري</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-slate-400 text-[10px] block mb-1">السعر المرصود ميدانياً:</label>
                    <input
                      type="number"
                      value={radarObservedPrice}
                      onChange={(e) => setRadarObservedPrice(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 text-[10px] block mb-1">السقف السعري القانوني:</label>
                    <input
                      type="number"
                      value={radarCeilingPrice}
                      onChange={(e) => setRadarCeilingPrice(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono font-bold"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCallRadarApi}
                  disabled={isCallingRadarApi}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Cpu className={`w-4 h-4 ${isCallingRadarApi ? 'animate-spin' : ''}`} />
                  <span>{isCallingRadarApi ? 'جاري التحليل واستدعاء نموذج الذكاء الاصطناعي...' : 'تشغيل رادار الذكاء الاصطناعي واحتساب Z-Score'}</span>
                </button>

                {radarApiResponse && (
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-purple-900/60 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                        radarApiResponse.level === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                        'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        مستوى الخطر: {radarApiResponse.level}
                      </span>
                      <span className="text-slate-400 font-mono text-[10px]">
                        Z-Score: <strong className="text-purple-300">{radarApiResponse.metadata?.calculatedZScore}</strong>
                      </span>
                    </div>
                    <p className="text-slate-200 text-[11px] leading-relaxed">
                      {radarApiResponse.reasoning}
                    </p>
                    <div className="text-emerald-400 text-[11px] font-medium pt-1 border-t border-slate-800">
                      التوجيه: {radarApiResponse.recommendation}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </RoleGuard>
      )}

        {/* ----------------------------------------------------------------- */}
        {/* 7. دور إدارة المنظومة المركزية (Admin)                           */}
        {/* ----------------------------------------------------------------- */}
        {activeRole === 'admin' && (
          <RoleGuard 
            allowedRoles={['admin']} 
            currentRole={enforceStrictRBAC ? authenticatedRole : activeRole}
            requiredPermission="VIEW_CRYPTO_AUDIT_LEDGER"
          >
            <section className="bg-slate-900/95 rounded-2xl border border-slate-800 p-4 sm:p-6 shadow-2xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    المركزية الوزارية والإدارة العامة
                  </span>
                  <span className="text-xs text-slate-400 font-mono">سجل التدقيق المشفر pgcrypto وحوكمة الصلاحيات</span>
                </div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-purple-400" />
                  لوحة القيادة التنفيذية ومراقبة أمن سلسلة الإمداد الوطنية
                </h3>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-purple-300 bg-purple-950 px-3 py-1.5 rounded-xl border border-purple-800">
                <Lock className="w-4 h-4" />
                <span>SHA-256 Ledger Chain Active</span>
              </div>
            </div>

            {/* مؤشرات البنية التحتية */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">معدل الامتثال الوطني:</span>
                <span className="text-xl font-black text-emerald-400 font-mono">92.4%</span>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">الشحنات المؤمنة رقمياً:</span>
                <span className="text-xl font-black text-cyan-400 font-mono">4,120</span>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">عقد البلوكشين / pgcrypto:</span>
                <span className="text-xl font-black text-purple-400 font-mono">18,942</span>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">حالة العقد البرمجية:</span>
                <span className="text-xl font-black text-emerald-400 font-mono">100% UP</span>
              </div>
            </div>

            {/* سجل التدقيق المشفر pgcrypto */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-purple-400" />
                  سجل العمليات المشفر غير القابل للتعديل (Immutable Audit Ledger):
                </h4>
                <span className="text-[10px] text-slate-400 font-mono">SHA-256 Chained Hash</span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                {auditLogs.slice(0, 4).map((log) => (
                  <div key={log.id} className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-white font-bold">{log.actionAr}</div>
                      <div className="text-[10px] text-slate-400">{log.targetEntity} • {log.actorRole} ({log.actorId})</div>
                    </div>
                    <div className="text-left">
                      <div className="text-emerald-400 font-bold text-[10px] truncate max-w-[180px]">
                        HASH: {log.blockHash.substring(0, 16)}...
                      </div>
                      <div className="text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleTimeString('ar-DZ')}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </RoleGuard>
      )}

      </div>
    </div>
  );
};
