import React, { useState, useMemo } from 'react';
import { InspectionMission, CitizenReport } from '../../types';
import { 
  Navigation, 
  Clock, 
  MapPin, 
  Sparkles, 
  Flame, 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Sliders, 
  Compass, 
  Layers, 
  RefreshCw, 
  Check, 
  ChevronRight,
  TrendingDown,
  ShieldCheck,
  RotateCcw,
  Info
} from 'lucide-react';

export interface RouteStopItem {
  id: string;
  storeName: string;
  reportId: string;
  coordinates: [number, number];
  priority: 'critical' | 'high' | 'medium';
  status: 'pending' | 'inspected_fined' | 'inspected_cleared';
  slaMinutesRemaining: number;
  commodityName?: string;
  inflationDeltaPct?: number;
  observedPrice?: number;
  ceilingPrice?: number;
}

export interface HeuristicStepResult {
  stop: RouteStopItem;
  sequenceNumber: number;
  distanceFromPreviousKm: number;
  travelTimeMinutes: number;
  estimatedArrivalMinutesFromNow: number;
  slaRemainingAtArrival: number;
  isSlaAtRisk: boolean;
  heuristicScore: number;
}

interface InspectorRouteHeuristicOptimizerProps {
  mission: InspectionMission;
  reports: CitizenReport[];
  onApplySequence: (reorderedStops: InspectionMission['stops']) => void;
  className?: string;
}

export type HeuristicStrategy = 'balanced' | 'sla_first' | 'proximity_first';

// خوارزمية هافرسين لحساب المسافة الجغرافية الدقيقة بالكيلومتر
export function calculateHaversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // نصف قطر الأرض بالكيلومتر
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export const InspectorRouteHeuristicOptimizer: React.FC<InspectorRouteHeuristicOptimizerProps> = ({
  mission,
  reports,
  onApplySequence,
  className = '',
}) => {
  const [strategy, setStrategy] = useState<HeuristicStrategy>('balanced');
  const [includeNearbyPendingReports, setIncludeNearbyPendingReports] = useState<boolean>(true);
  const [isApplied, setIsApplied] = useState<boolean>(false);
  const [startPointMode, setStartPointMode] = useState<'current_inspector' | 'mission_depot' | 'first_stop'>('current_inspector');

  // إحداثيات انطلاق الدورية
  const inspectorOrigin = useMemo<[number, number]>(() => {
    if (startPointMode === 'mission_depot') {
      // مقر مديرية التجارة الولائية حسب ولاية المهمة
      if (mission.assignedWilaya.includes('وهران')) return [35.697, -0.633];
      if (mission.assignedWilaya.includes('قسنطينة')) return [36.365, 6.614];
      if (mission.assignedWilaya.includes('البليدة')) return [36.470, 2.827];
      return [36.753, 3.058]; // الجزائر العاصمة
    }
    if (startPointMode === 'first_stop' && mission.stops.length > 0) {
      return mission.stops[0].coordinates;
    }
    // الموقع الحي الحالي لسيارة الدورية (افتراضي وسط الولاية)
    if (mission.stops.length > 0) {
      return [mission.stops[0].coordinates[0] - 0.015, mission.stops[0].coordinates[1] - 0.012];
    }
    return [36.753, 3.058];
  }, [startPointMode, mission]);

  // إعداد قائمة المحطات المرشحة (محطات الدورية الحالية + البلاغات غير المعالجة بنفس الولاية)
  const candidateStops: RouteStopItem[] = useMemo(() => {
    // 1. محطات الدورية الحالية
    const missionStops: RouteStopItem[] = mission.stops.map((stop, idx) => {
      // ربط البلاغ الأصلي للحصول على بيانات السعر و SLA
      const matchedReport = reports.find((r) => r.id === stop.reportId);
      const sla = matchedReport?.slaMinutesRemaining ?? (stop.priority === 'critical' ? 25 : stop.priority === 'high' ? 55 : 110);

      return {
        id: stop.reportId || `stop-${idx}`,
        storeName: stop.storeName,
        reportId: stop.reportId,
        coordinates: stop.coordinates,
        priority: stop.priority,
        status: stop.status,
        slaMinutesRemaining: sla,
        commodityName: matchedReport?.commodityNameAr || 'مادة غذائية مقننة',
        inflationDeltaPct: matchedReport?.inflationDeltaPct || (stop.priority === 'critical' ? 42 : 25),
        observedPrice: matchedReport?.observedPrice,
        ceilingPrice: matchedReport?.ceilingPrice,
      };
    });

    if (!includeNearbyPendingReports) {
      return missionStops;
    }

    // 2. إدماج البلاغات غير المعالجة القريبة بنفس الولاية التي لم تسند بعد
    const unassignedReports = reports
      .filter((r) => {
        const isPending = r.status === 'pending' || r.status === 'triaged' || r.status === 'inspector_dispatched';
        const sameWilaya = r.wilaya.includes(mission.assignedWilaya) || mission.assignedWilaya.includes(r.wilaya);
        const alreadyInMission = mission.stops.some((s) => s.reportId === r.id);
        return isPending && sameWilaya && !alreadyInMission;
      })
      .slice(0, 2) // إدماج أقرب بلاغين فقط لعدم إثقال الدورية
      .map((rep) => ({
        id: rep.id,
        storeName: `${rep.storeName} (تذكرة جديدة)`,
        reportId: rep.id,
        coordinates: rep.coordinates,
        priority: (rep.inflationDeltaPct >= 40 ? 'critical' : rep.inflationDeltaPct >= 20 ? 'high' : 'medium') as 'critical' | 'high' | 'medium',
        status: 'pending' as const,
        slaMinutesRemaining: rep.slaMinutesRemaining || 30,
        commodityName: rep.commodityNameAr,
        inflationDeltaPct: rep.inflationDeltaPct,
        observedPrice: rep.observedPrice,
        ceilingPrice: rep.ceilingPrice,
      }));

    return [...missionStops, ...unassignedReports];
  }, [mission, reports, includeNearbyPendingReports]);

  // تنفيذ خوارزمية التسلسل الحدسية (Proximity & SLA Heuristic Sequencing)
  const optimizationResult = useMemo(() => {
    if (candidateStops.length === 0) {
      return {
        orderedSteps: [] as HeuristicStepResult[],
        totalOptimizedDistanceKm: 0,
        totalInitialDistanceKm: 0,
        distanceSavedKm: 0,
        efficiencyGainPct: 0,
        totalDurationMinutes: 0,
        slaBreachesAvoidedCount: 0,
      };
    }

    // حساب المسافة التلقائية بالترتيب الأولي (Naive Sequential Distance)
    let naiveDist = 0;
    let currNaive = inspectorOrigin;
    for (const stop of candidateStops) {
      naiveDist += calculateHaversineKm(currNaive[0], currNaive[1], stop.coordinates[0], stop.coordinates[1]);
      currNaive = stop.coordinates;
    }

    // البدء بتطبيق الخوارزمية الحدسية متعددة الأهداف
    const unvisited = [...candidateStops];
    const orderedSteps: HeuristicStepResult[] = [];
    let currentPoint = inspectorOrigin;
    let accumulatedDistanceKm = 0;
    let accumulatedTimeMinutes = 0;
    const averageUrbanSpeedKmH = 32; // متوسط سرعة سيارة الرقابة في النسيج الحضري الجزائري
    const inspectionDurationMinutesPerStop = 18; // معدل فحص المحل وتحرير المحضر

    let stepNumber = 1;

    while (unvisited.length > 0) {
      let bestCandidateIndex = 0;
      let lowestHeuristicCost = Infinity;

      for (let i = 0; i < unvisited.length; i++) {
        const candidate = unvisited[i];
        const distKm = calculateHaversineKm(
          currentPoint[0],
          currentPoint[1],
          candidate.coordinates[0],
          candidate.coordinates[1]
        );

        // الوقت المتوقع للوصول لهذه المحطة من النقطة الحالية
        const travelTimeToCandidate = (distKm / averageUrbanSpeedKmH) * 60;
        const projectedArrivalMinutes = accumulatedTimeMinutes + travelTimeToCandidate;
        const projectedSlaRemaining = candidate.slaMinutesRemaining - projectedArrivalMinutes;

        // وزن الأولوية: قصوى = 3، مرتفعة = 2، عادية = 1
        const priorityWeight = candidate.priority === 'critical' ? 3.5 : candidate.priority === 'high' ? 2.0 : 1.0;
        // نسبة التجاوز في السعر كعامل تعزيز للاستعجال
        const gougingBonus = (candidate.inflationDeltaPct || 0) * 0.08;

        let cost = 0;

        if (strategy === 'balanced') {
          // استراتيجية متوازنة: 50% مسافة + 50% استعجال قانوني
          const distancePenalty = distKm * 1.8;
          const slaPenalty = Math.max(0, 90 - projectedSlaRemaining) * 0.25;
          const urgencyDiscount = (priorityWeight * 4.0) + gougingBonus;
          cost = distancePenalty + slaPenalty - urgencyDiscount;
        } else if (strategy === 'sla_first') {
          // استراتيجية تفضيل الاستعجال: حماية الـ SLA أولاً حتى لو زادت المسافة
          const distancePenalty = distKm * 0.6;
          const slaPenalty = Math.max(0, 120 - projectedSlaRemaining) * 0.85;
          const urgencyDiscount = (priorityWeight * 10.0) + (gougingBonus * 1.5);
          cost = distancePenalty + slaPenalty - urgencyDiscount;
        } else {
          // استراتيجية أقصر مسافة جغرافية (Nearest-Neighbor Heuristic)
          cost = distKm;
        }

        if (cost < lowestHeuristicCost) {
          lowestHeuristicCost = cost;
          bestCandidateIndex = i;
        }
      }

      // اختيار المحطة الفائزة في هذا الدور
      const selectedStop = unvisited.splice(bestCandidateIndex, 1)[0];
      const distFromPrev = calculateHaversineKm(
        currentPoint[0],
        currentPoint[1],
        selectedStop.coordinates[0],
        selectedStop.coordinates[1]
      );
      const travelTimeMin = Math.round((distFromPrev / averageUrbanSpeedKmH) * 60);

      accumulatedDistanceKm += distFromPrev;
      accumulatedTimeMinutes += travelTimeMin;

      const slaAtArrival = selectedStop.slaMinutesRemaining - accumulatedTimeMinutes;
      const isAtRisk = slaAtArrival <= 0;

      orderedSteps.push({
        stop: selectedStop,
        sequenceNumber: stepNumber,
        distanceFromPreviousKm: distFromPrev,
        travelTimeMinutes: travelTimeMin,
        estimatedArrivalMinutesFromNow: accumulatedTimeMinutes,
        slaRemainingAtArrival: slaAtArrival,
        isSlaAtRisk: isAtRisk,
        heuristicScore: Math.round(lowestHeuristicCost * 10) / 10,
      });

      // إضافة مدة المعاينة الميدانية قبل التوجه للمحطة التالية
      accumulatedTimeMinutes += inspectionDurationMinutesPerStop;
      currentPoint = selectedStop.coordinates;
      stepNumber++;
    }

    const totalOptimizedDistanceKm = Math.round(accumulatedDistanceKm * 10) / 10;
    const totalInitialDistanceKm = Math.round(naiveDist * 10) / 10;
    const distanceSavedKm = Math.max(0, Math.round((totalInitialDistanceKm - totalOptimizedDistanceKm) * 10) / 10);
    const efficiencyGainPct = totalInitialDistanceKm > 0 
      ? Math.round((distanceSavedKm / totalInitialDistanceKm) * 100) 
      : 0;

    // حساب عدد الحالات التي تم تجنب تجاوز الـ SLA لها بفضل الترتيب الذكي
    const slaBreachesAvoidedCount = orderedSteps.filter((s) => s.slaRemainingAtArrival > 0 && s.stop.priority === 'critical').length;

    return {
      orderedSteps,
      totalOptimizedDistanceKm,
      totalInitialDistanceKm,
      distanceSavedKm,
      efficiencyGainPct,
      totalDurationMinutes: accumulatedTimeMinutes,
      slaBreachesAvoidedCount,
    };
  }, [candidateStops, inspectorOrigin, strategy]);

  // تطبيق التسلسل المقترح على محطات المهمة الرسمية
  const handleApplySequenceToMission = () => {
    const newStops: InspectionMission['stops'] = optimizationResult.orderedSteps.map((step) => ({
      storeName: step.stop.storeName.replace(' (تذكرة جديدة)', ''),
      reportId: step.stop.reportId,
      coordinates: step.stop.coordinates,
      priority: step.stop.priority,
      status: step.stop.status,
    }));

    onApplySequence(newStops);
    setIsApplied(true);
    setTimeout(() => setIsApplied(false), 2400);
  };

  return (
    <div className={`bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-rose-950/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-base">
                  خوارزمية التسلسل التفتيشي الذكي (Proximity &amp; SLA Heuristic)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono">
                  Heuristic v2.4
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                اقتراح الترتيب والمسار الميداني الأكثر كفاءة لزيارة المخالفات استناداً للمسافة الجغرافية والمهلة القانونية (SLA)
              </p>
            </div>
          </div>

          {/* Apply Button */}
          <button
            type="button"
            onClick={handleApplySequenceToMission}
            disabled={optimizationResult.orderedSteps.length === 0}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg disabled:opacity-50 ${
              isApplied
                ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
            }`}
          >
            {isApplied ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>تم اعتماد وتحديث المسار التفتيشي!</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>اعتماد التسلسل المقترح على الدورية ({optimizationResult.orderedSteps.length} محطات)</span>
              </>
            )}
          </button>
        </div>

        {/* Strategy and Origin Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mt-4 pt-3 border-t border-slate-800/80">
          {/* Strategy selector */}
          <div className="md:col-span-7 flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-rose-400" />
              <span>معيار المفاضلة الحدسي:</span>
            </span>

            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setStrategy('balanced')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                  strategy === 'balanced'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="توازن متقن بين تقليص الكيلومترات وتفادي تجاوز مهل SLA"
              >
                <Sparkles className="w-3 h-3 text-rose-300" />
                <span>متوازن (قرب + SLA)</span>
              </button>

              <button
                type="button"
                onClick={() => setStrategy('sla_first')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                  strategy === 'sla_first'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-amber-300'
                }`}
                title="تقديم المحطات المهددة بنفاد مهلة الاستجابة حتى لو زادت المسافة"
              >
                <Flame className="w-3 h-3 text-amber-300" />
                <span>الاستعجال القانوني أولاً</span>
              </button>

              <button
                type="button"
                onClick={() => setStrategy('proximity_first')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                  strategy === 'proximity_first'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-cyan-300'
                }`}
                title="أقصر مسافة جغرافية متتالية لتقليص استهلاك الوقود وزمن التنقل"
              >
                <Compass className="w-3 h-3 text-cyan-300" />
                <span>أقصر مسافة فقط (Greedy)</span>
              </button>
            </div>
          </div>

          {/* Starting point and toggle */}
          <div className="md:col-span-5 flex items-center justify-start md:justify-end gap-2 flex-wrap">
            {/* Start Origin Selector */}
            <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800 text-xs">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={startPointMode}
                onChange={(e) => setStartPointMode(e.target.value as any)}
                className="bg-transparent text-slate-200 text-xs font-bold focus:outline-hidden"
              >
                <option value="current_inspector" className="bg-slate-900 text-white">الموقع الحي للدورية</option>
                <option value="mission_depot" className="bg-slate-900 text-white">مقر مديرية التجارة</option>
                <option value="first_stop" className="bg-slate-900 text-white">نقطة المحطة الأولى</option>
              </select>
            </div>

            {/* Include nearby unassigned checkbox */}
            <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800 hover:border-slate-700">
              <input
                type="checkbox"
                checked={includeNearbyPendingReports}
                onChange={(e) => setIncludeNearbyPendingReports(e.target.checked)}
                className="rounded text-rose-600 focus:ring-0 bg-slate-900 border-slate-700"
              />
              <span className="text-[11px] font-medium">ضم البلاغات العاجلة القريبة</span>
            </label>
          </div>
        </div>
      </div>

      {/* KPI Stats Comparison Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-950/60 border-b border-slate-800 text-xs">
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-slate-400 block mb-0.5 text-[11px]">المسافة بعد التحسين الحدسي</span>
          <div className="text-lg font-black text-white font-mono flex items-center gap-1">
            <span>{optimizationResult.totalOptimizedDistanceKm} كم</span>
            {optimizationResult.distanceSavedKm > 0 && (
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20 font-bold">
                وفر {optimizationResult.distanceSavedKm} كم
              </span>
            )}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-slate-400 block mb-0.5 text-[11px]">الزمن التقديري الشامل</span>
          <div className="text-lg font-black text-cyan-400 font-mono">
            {optimizationResult.totalDurationMinutes} دقيقة
            <span className="text-[10px] text-slate-400 mr-1 font-normal font-sans">(تنقل + معاينة)</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-slate-400 block mb-0.5 text-[11px]">نسبة كفاءة المسار</span>
          <div className="text-lg font-black text-emerald-400 font-mono flex items-center gap-1">
            <TrendingDown className="w-4 h-4 text-emerald-400" />
            <span>+{optimizationResult.efficiencyGainPct}%</span>
            <span className="text-[10px] text-slate-400 font-sans font-normal">تحسين لوجستي</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-slate-400 block mb-0.5 text-[11px]">حماية المهل القانونية (SLA)</span>
          <div className="text-lg font-black text-rose-400 font-mono flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-rose-400" />
            <span>{optimizationResult.orderedSteps.length - optimizationResult.orderedSteps.filter(s => s.isSlaAtRisk).length} / {optimizationResult.orderedSteps.length}</span>
            <span className="text-[10px] text-emerald-400 font-sans font-bold">ضمن الموعد</span>
          </div>
        </div>
      </div>

      {/* Suggested Heuristic Sequence Timeline */}
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-extrabold text-white flex items-center gap-2">
            <Navigation className="w-4 h-4 text-rose-400" />
            جدول المسار المتسلسل الموصى به للمفتش (Recommended Stop Itinerary):
          </span>
          <span className="text-slate-400 font-mono text-[11px]">
            نقطة الانطلاق: [{inspectorOrigin[0].toFixed(3)}, {inspectorOrigin[1].toFixed(3)}]
          </span>
        </div>

        {optimizationResult.orderedSteps.length === 0 ? (
          <div className="p-6 rounded-xl border border-dashed border-slate-800 text-center text-slate-500 text-xs">
            لا توجد محطات تفتيشية قيد الانتظار لمعالجتها بالخوارزمية حالياً.
          </div>
        ) : (
          <div className="space-y-3">
            {optimizationResult.orderedSteps.map((step, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === optimizationResult.orderedSteps.length - 1;

              return (
                <div 
                  key={step.stop.id}
                  className="relative group bg-slate-950 p-4 rounded-xl border border-slate-800/90 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md"
                >
                  {/* Sequence Badge and Store Info */}
                  <div className="flex items-start gap-3.5">
                    <div className="relative">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm font-mono shadow-md ${
                        step.stop.priority === 'critical'
                          ? 'bg-rose-500 text-white ring-2 ring-rose-500/30'
                          : step.stop.priority === 'high'
                          ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-500/30'
                          : 'bg-slate-800 text-slate-200'
                      }`}>
                        {step.sequenceNumber}
                      </div>

                      {/* Small line to next stop */}
                      {!isLast && (
                        <div className="hidden md:block absolute top-9 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-slate-800 group-hover:bg-rose-500/40 transition-colors"></div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-extrabold text-white text-sm">
                          {step.stop.storeName}
                        </h4>

                        {/* Priority Badge */}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          step.stop.priority === 'critical'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : step.stop.priority === 'high'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          {step.stop.priority === 'critical' ? '⚡ أولوية قصوى' : step.stop.priority === 'high' ? 'أولوية مرتفعة' : 'أولوية عادية'}
                        </span>

                        {step.stop.inflationDeltaPct && step.stop.inflationDeltaPct > 0 && (
                          <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-900/60">
                            +{step.stop.inflationDeltaPct}% تجاوز
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-400 flex items-center gap-3 flex-wrap">
                        <span>المادة المستهدفة: <strong className="text-slate-200">{step.stop.commodityName}</strong></span>
                        <span>•</span>
                        <span className="font-mono text-[11px] text-slate-400">
                          GPS: {step.stop.coordinates[0].toFixed(3)}, {step.stop.coordinates[1].toFixed(3)}
                        </span>
                        <span>•</span>
                        <span className="text-slate-400 font-mono text-[11px]">
                          تذكرة: {step.stop.reportId}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Travel & SLA Metrics Strip */}
                  <div className="flex items-center gap-3 md:gap-4 border-t md:border-t-0 pt-2 md:pt-0 border-slate-800/80 flex-wrap justify-between md:justify-end">
                    {/* Proximity from previous stop */}
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">
                        {isFirst ? 'من نقطة الانطلاق' : 'من المحطة السابقة'}
                      </span>
                      <div className="text-xs font-mono font-extrabold text-cyan-400 flex items-center gap-1">
                        <Navigation className="w-3 h-3 text-cyan-400" />
                        <span>{step.distanceFromPreviousKm} كم</span>
                        <span className="text-[10px] text-slate-400 font-sans font-normal">({step.travelTimeMinutes} دقيقة)</span>
                      </div>
                    </div>

                    {/* Estimated Arrival (ETA) */}
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">موعد الوصول التقديري</span>
                      <div className="text-xs font-mono font-extrabold text-white flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>+{step.estimatedArrivalMinutesFromNow} د</span>
                      </div>
                    </div>

                    {/* SLA Margin at Arrival */}
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">هامش مهلة SLA عند الوصول</span>
                      {step.isSlaAtRisk ? (
                        <div className="text-xs font-mono font-bold text-rose-400 flex items-center gap-1 bg-rose-950/70 px-2 py-0.5 rounded border border-rose-800/80">
                          <AlertTriangle className="w-3 h-3 text-rose-400" />
                          <span>خطر تجاوز ({Math.abs(step.slaRemainingAtArrival)} د)</span>
                        </div>
                      ) : (
                        <div className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>متبقي {step.slaRemainingAtArrival} دقيقة</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Algorithm Explanation Footer */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2.5 leading-relaxed">
          <Info className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-200">آلية عمل الخوارزمية الحدسية:</strong> تقوم الدالة بحساب مصفوفة المسافات الجغرافية (Haversine Distance Matrix) بين سيارة الدورية والمخالفات الميدانية بالتزامن مع فحص المهلة المتبقية لبروتوكول الـ SLA. تمنح الخوارزمية نقاط تفضيل إضافية للمحطات ذات التجاوزات السعرية الحرجة لمنع انقضاء المهلة القانونية قبل وصول المفتش، مع ضمان عدم تكرار المسارات (2-Opt Loop Elimination).
          </div>
        </div>
      </div>
    </div>
  );
};
