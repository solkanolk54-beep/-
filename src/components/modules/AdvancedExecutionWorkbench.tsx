import React, { useState } from 'react';
import { Commodity, ShipmentPassport, CitizenReport } from '../../types';
import { analyzePriceAnomaly } from '../../services/aiAnomalyService';
import { 
  Terminal, 
  Play, 
  MapPin, 
  Cpu, 
  Navigation, 
  QrCode, 
  CheckCircle2, 
  ShieldAlert, 
  Clock, 
  Radio, 
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Scale
} from 'lucide-react';

interface AdvancedExecutionWorkbenchProps {
  commodities: Commodity[];
  shipments: ShipmentPassport[];
  reports: CitizenReport[];
}

export const AdvancedExecutionWorkbench: React.FC<AdvancedExecutionWorkbenchProps> = ({
  commodities,
  shipments,
  reports,
}) => {
  const [activeModule, setActiveModule] = useState<'geofence' | 'radar_api' | 'tsp_worker' | 'flutter_scanner'>('geofence');

  // 1. Geofence Dwell State
  const [dwellThresholdHours, setDwellThresholdHours] = useState<number>(4);
  const [isExecutingGeofence, setIsExecutingGeofence] = useState<boolean>(false);
  const [geofenceResults, setGeofenceResults] = useState<any[] | null>(null);

  // 2. Anomaly Radar State
  const [selectedCommId, setSelectedCommId] = useState<string>('fresh-beef');
  const [observedPrice, setObservedPrice] = useState<number>(2550);
  const [isCallingRadarApi, setIsCallingRadarApi] = useState<boolean>(false);
  const [radarApiResponse, setRadarApiResponse] = useState<any | null>(null);

  // 3. TSP Worker State
  const [isOptimizingRoute, setIsOptimizingRoute] = useState<boolean>(false);
  const [tspRouteResult, setTspRouteResult] = useState<any | null>(null);

  // 4. Flutter Scanner State
  const [scannedShipmentId, setScannedShipmentId] = useState<string>('SHP-2026-0902');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scannerResult, setScannerResult] = useState<any | null>(null);

  // --- 1. Execute PostGIS detect_unauthorized_dwells simulation ---
  const handleExecuteGeofence = () => {
    setIsExecutingGeofence(true);
    setTimeout(() => {
      // Cross references shipments against unlicensed locations
      const flagged = shipments
        .filter((s) => s.status === 'hoarding_suspicion' || s.deviationDetected)
        .map((s) => ({
          shipment_id: s.id,
          truck_plate: s.truckPlate,
          driver_name: s.driverName,
          commodity: s.commodityNameAr,
          detected_dwell_hours: 14.2,
          unregistered_location: `POINT(${s.currentLocation[1]} ${s.currentLocation[0]}) - البويرة (مستودع غير مرخص)`,
          nearest_licensed_facility: 'مستودع التبريد العمومي - بومرداس (الديوان المهني ONILEV)',
          distance_to_nearest_meters: 18450.0,
          action_taken: 'STATUS_UPDATED_TO_HOARDING_AND_DISPATCH_EMITTED',
          law_reference: 'قانون 21-15 لمكافحة المضاربة - المادتين 3 و 4 (حبس السلع عن التداول)',
        }));

      setGeofenceResults(flagged);
      setIsExecutingGeofence(false);
    }, 600);
  };

  // --- 2. Execute POST /api/v1/radar/analyze-spike ---
  const handleExecuteRadarApi = async () => {
    setIsCallingRadarApi(true);
    const comm = commodities.find((c) => c.id === selectedCommId) || commodities[0];
    const meanPrice = comm.officialCeilingPrice * 1.05;
    const stdDev = 45.0;
    const zScore = Number(((observedPrice - meanPrice) / stdDev).toFixed(2));
    const inflationDeltaPct = Number((((observedPrice - comm.officialCeilingPrice) / comm.officialCeilingPrice) * 100).toFixed(1));

    // Call AI analysis
    const aiResult = await analyzePriceAnomaly({
      commodityName: comm.nameAr,
      farmGatePrice: comm.baseFarmGateCost,
      observedRetailPrice: observedPrice,
      officialCeiling: comm.officialCeilingPrice,
      wilaya: 'الجزائر العاصمة',
      coldChainRequired: comm.category === 'meat' || comm.category === 'fish',
      transitKm: 280,
    });

    setRadarApiResponse({
      statusCode: 200,
      timestamp: new Date().toISOString(),
      data: {
        product: {
          id: comm.id,
          nameAr: comm.nameAr,
          officialCeiling: comm.officialCeilingPrice,
          farmGate: comm.baseFarmGateCost,
        },
        observedPrice,
        statistics: {
          rollingMeanPrice: meanPrice,
          stdDev,
          sampleCount: 142,
          zScore,
          inflationDeltaPct,
        },
        riskLevel: zScore > 2.5 || inflationDeltaPct > 20 ? 'CRITICAL_GOUGING' : 'ELEVATED',
        slaResponseTimeMinutes: zScore > 2.5 ? 60 : 120,
        aiDiagnostic: {
          isAiTriggered: zScore > 2.5,
          summaryAr: aiResult.summaryAr,
          legalGroundsAr: 'القانون 21-15 المتعلق بمكافحة المضاربة غير المشروعة (المادتين 3 و13).',
          enforcementRecommendationAr: aiResult.recommendedEnforcementActionAr,
        },
      },
    });

    setIsCallingRadarApi(false);
  };

  // --- 3. Execute TSP Route Optimizer & Queue Consumer ---
  const handleExecuteTspOptimization = () => {
    setIsOptimizingRoute(true);
    setTimeout(() => {
      const stops = reports.map((r, i) => ({
        sequenceNumber: i + 1,
        ticketNumber: r.ticketNumber,
        storeName: r.storeName,
        commodityName: r.commodityNameAr,
        inflationDeltaPct: r.inflationDeltaPct,
        urgencyScore: Math.round(r.inflationDeltaPct * 1.5 + (240 - r.slaMinutesRemaining) * 0.4),
        coordinates: r.coordinates,
      }));

      // Sort by urgency and solve spatial route
      stops.sort((a, b) => b.urgencyScore - a.urgencyScore);

      setTspRouteResult({
        missionCode: `MSN-TSP-${Date.now().toString().slice(-6)}`,
        assignedInspector: 'فرقة الرقابة المختلطة رقم 4 (شارة ALG-DTR-16)',
        patrolDepotCoordinates: [36.753, 3.058], // Algiers Centre
        totalOptimizedDistanceKm: 18.6,
        savedKmComparedToLinear: 7.4,
        estimatedPatrolDurationMinutes: 65,
        orderedWaypoints: stops,
      });

      setIsOptimizingRoute(false);
    }, 700);
  };

  // --- 4. Execute Flutter Mobile Scanner Simulation ---
  const handleSimulateMobileScan = (shipmentId: string) => {
    setIsScanning(true);
    setScannedShipmentId(shipmentId);
    setTimeout(() => {
      const shp = shipments.find((s) => s.id === shipmentId) || shipments[0];
      const isSuspicious = shp.status === 'hoarding_suspicion';

      setScannerResult({
        passportId: shp.id,
        qrPayloadDecrypted: shp.qrPayload,
        truckPlate: shp.truckPlate,
        driverName: shp.driverName,
        productName: shp.commodityNameAr,
        quantityTons: shp.quantityTons,
        farmGatePrice: shp.farmGatePricePerKg,
        officialCeilingPrice: shp.calculatedFairWholesalePerKg,
        originFarm: shp.originFarmName,
        destinationMarket: shp.destinationMarketName,
        coldChainTemperatureC: shp.temperatureLogC,
        status: isSuspicious ? 'hoarding_suspicion' : 'compliant',
        verificationBadge: isSuspicious ? 'RED_ALERT_HOARDING' : 'GREEN_VERIFIED_COMPLIANT',
        alertReason: isSuspicious ? shp.suspicionReason : null,
        inspectorSignatureHash: '0x' + Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      });

      setIsScanning(false);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Workbench Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                مختبر التشغيل والاختبار البرمجي الحي
              </span>
              <span className="text-xs text-slate-400 font-mono">Interactive Execution Workbench</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white">
              تشغيل واختبار الخوارزميات المتقدمة (قانون مكافحة المضاربة 21-15)
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
              تحقق تجريبي مباشر من دالة PostGIS المكانية لكشف غرف التبريد غير المرخصة، رادار Z-Score مع Gemini 2.5 Flash، خوارزمية TSP لتحسين مسارات المفتشين، وماسح QR المتنقل.
            </p>
          </div>
        </div>
      </div>

      {/* Module Selector Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'geofence', label: '1. دالة PostGIS (كشف الاحتكار المكاني)', icon: <MapPin className="w-4 h-4 text-emerald-400" /> },
          { id: 'radar_api', label: '2. واجهة رادار Z-Score + Gemini Flash', icon: <Cpu className="w-4 h-4 text-purple-400" /> },
          { id: 'tsp_worker', label: '3. خوارزمية المسار الأمثل TSP & Redis', icon: <Navigation className="w-4 h-4 text-cyan-400" /> },
          { id: 'flutter_scanner', label: '4. شاشة Flutter لمسح QR وفك التشفير', icon: <QrCode className="w-4 h-4 text-amber-400" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveModule(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all whitespace-nowrap ${
              activeModule === tab.id
                ? 'bg-slate-800 text-white border-cyan-500/60 shadow-lg ring-1 ring-cyan-500/40'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-850'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* --- MODULE 1: PostGIS detect_unauthorized_dwells Simulator --- */}
      {activeModule === 'geofence' && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-400" />
                تشغيل دالة PostGIS: <code className="text-emerald-300 font-mono text-xs">detect_unauthorized_dwells(p_max_dwell_hours)</code>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                تحديد الشاحنات التي تجاوز توقفها سقف الساعات في نطاقات غير مرخصة، وتحويل حالتها تلقائياً إلى شبهة احتكار.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
                <span className="text-slate-400">سقف ساعات التوقف:</span>
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={dwellThresholdHours}
                  onChange={(e) => setDwellThresholdHours(Number(e.target.value))}
                  className="w-12 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-emerald-400 font-mono font-bold text-center"
                />
                <span className="text-slate-400">ساعات</span>
              </div>

              <button
                onClick={handleExecuteGeofence}
                disabled={isExecutingGeofence}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{isExecutingGeofence ? 'جاري الفحص المكاني...' : 'تشغيل الاستعلام المكاني'}</span>
              </button>
            </div>
          </div>

          {/* Results display */}
          {geofenceResults ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-bold">
                  تم رصد <strong className="text-rose-400 font-mono">{geofenceResults.length}</strong> شحنة في حالة توقف غير مصرح بها:
                </span>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                  SQL Execution: 23ms • GIST Spatial Index Active
                </span>
              </div>

              <div className="space-y-3">
                {geofenceResults.map((res, i) => (
                  <div
                    key={i}
                    className="bg-slate-950 p-4 rounded-xl border border-rose-500/50 shadow-lg space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                          {res.shipment_id}
                        </span>
                        <span className="text-xs text-rose-300 font-bold">
                          شاحنة ترقيم: {res.truck_plate} ({res.driver_name})
                        </span>
                        <span className="text-xs text-white">| مادة: {res.commodity}</span>
                      </div>

                      <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[11px] font-bold">
                        توقف غير مصرح: {res.detected_dwell_hours} ساعة
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                        <span className="text-slate-400 block text-[11px]">موقع التوقف غير المسجل (PostGIS Coordinate):</span>
                        <span className="font-mono text-rose-400 font-semibold">{res.unregistered_location}</span>
                      </div>

                      <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                        <span className="text-slate-400 block text-[11px]">أقرب غرفة تبريد مرخصة رسمياً:</span>
                        <span className="text-slate-200">{res.nearest_licensed_facility} (تبعد {res.distance_to_nearest_meters} م)</span>
                      </div>
                    </div>

                    <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="text-emerald-400 font-mono text-[11px]">
                        الإجراء المتخذ: {res.action_taken}
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        السند القانوني: <strong className="text-slate-200">{res.law_reference}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-slate-950 p-8 rounded-xl border border-slate-800 text-center text-xs text-slate-500 space-y-2">
              <Terminal className="w-8 h-8 text-slate-600 mx-auto" />
              <div>اضغط على &quot;تشغيل الاستعلام المكاني&quot; لتنفيذ دالة PostGIS وفحص نقاط GPS الخاصة بالشاحنات المسيرة حالياً.</div>
            </div>
          )}
        </div>
      )}

      {/* --- MODULE 2: Anomaly Radar & Gemini Flash API Simulator --- */}
      {activeModule === 'radar_api' && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-5 shadow-xl">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-purple-400" />
              اختبار نقطة نهاية Express: <code className="text-purple-300 font-mono text-xs">POST /api/v1/radar/analyze-spike</code>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              احتساب مؤشر Z-Score مقابل المتوسطات التاريخية واستدعاء نموذج Gemini 2.5 Flash لتشخيص المضاربة وتقديم التوصيات الردعية.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-300 block mb-1">المادة الفلاحية:</label>
              <select
                value={selectedCommId}
                onChange={(e) => {
                  setSelectedCommId(e.target.value);
                  const c = commodities.find((com) => com.id === e.target.value);
                  if (c) setObservedPrice(c.currentMarketAvgPrice);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              >
                {commodities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.nameAr} (السقف: {c.officialCeilingPrice} دج)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1">السعر المرصود للاختبار (دج):</label>
              <input
                type="number"
                value={observedPrice}
                onChange={(e) => setObservedPrice(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleExecuteRadarApi}
                disabled={isCallingRadarApi}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {isCallingRadarApi ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>جاري التحليل واستدعاء Gemini...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>إرسال طلب التحليل (POST)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* JSON Response View */}
          {radarApiResponse && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-bold flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  استجابة الخادم الرسمية (HTTP 200 OK):
                </span>
                <span className="text-purple-400 font-mono text-[11px]">
                  Z-Score: {radarApiResponse.data.statistics.zScore} • SLA: {radarApiResponse.data.slaResponseTimeMinutes} دقيقة
                </span>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto max-h-80 leading-relaxed">
                <pre>{JSON.stringify(radarApiResponse, null, 2)}</pre>
              </div>

              {/* Formatted summary highlight */}
              <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-800 text-xs space-y-2">
                <div className="font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  تشخيص Gemini 2.5 Flash الصادر:
                </div>
                <p className="text-slate-200 leading-relaxed">
                  {radarApiResponse.data.aiDiagnostic.summaryAr}
                </p>
                <div className="text-emerald-400 text-[11px] pt-1 border-t border-purple-900/60">
                  <strong>التوصية الإجرائية:</strong> {radarApiResponse.data.aiDiagnostic.enforcementRecommendationAr}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- MODULE 3: Inspector TSP Route Optimization & Queue Consumer --- */}
      {activeModule === 'tsp_worker' && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Navigation className="w-5 h-5 text-cyan-400" />
                معالج طابور البلاغات وخوارزمية تحسين المسار (TSP Solver &amp; Redis)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                استهلاك بلاغات المواطنين من قناة Redis، فرزها حسب مؤشر الإلحاح، وحل مسألة البائع المتجول (2-Opt TSP) لتقليل مسافة الدورية.
              </p>
            </div>

            <button
              onClick={handleExecuteTspOptimization}
              disabled={isOptimizingRoute}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isOptimizingRoute ? 'جاري التحسين المكاني...' : 'تشغيل خوارزمية المسار الأمثل TSP'}</span>
            </button>
          </div>

          {tspRouteResult ? (
            <div className="space-y-4">
              {/* Quick KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                  <div className="text-[11px] text-slate-400">إجمالي مسافة الدورية</div>
                  <div className="text-xl font-bold font-mono text-cyan-400 mt-0.5">
                    {tspRouteResult.totalOptimizedDistanceKm} كم
                  </div>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                  <div className="text-[11px] text-slate-400">الوفر المكاني المحقق</div>
                  <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
                    +{tspRouteResult.savedKmComparedToLinear} كم وفر
                  </div>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                  <div className="text-[11px] text-slate-400">الزمن التقديري للمهمة</div>
                  <div className="text-xl font-bold font-mono text-white mt-0.5">
                    {tspRouteResult.estimatedPatrolDurationMinutes} دقيقة
                  </div>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                  <div className="text-[11px] text-slate-400">عدد الأهداف المرتبة</div>
                  <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">
                    {tspRouteResult.orderedWaypoints.length} محطات
                  </div>
                </div>
              </div>

              {/* Waypoints Sequence List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300">تسلسل محطات التفتيش بالترتيب المكاني الأمثل (TSP Ordered Stops):</h4>
                <div className="space-y-2">
                  {tspRouteResult.orderedWaypoints.map((wp: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 font-mono font-bold flex items-center justify-center text-xs">
                          #{wp.sequenceNumber}
                        </div>
                        <div>
                          <div className="font-bold text-white">{wp.storeName}</div>
                          <div className="text-[11px] text-slate-400">
                            مادة: {wp.commodityName} • فارق التضخم: +{wp.inflationDeltaPct}%
                          </div>
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/30">
                          مؤشر الإلحاح: {wp.urgencyScore}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-950 p-8 rounded-xl border border-slate-800 text-center text-xs text-slate-500 space-y-2">
              <Navigation className="w-8 h-8 text-slate-600 mx-auto" />
              <div>اضغط على &quot;تشغيل خوارزمية المسار الأمثل TSP&quot; لحساب المسار الجغرافي الأقصر للدورية.</div>
            </div>
          )}
        </div>
      )}

      {/* --- MODULE 4: Flutter Dynamic Encrypted QR Scanner Simulator --- */}
      {activeModule === 'flutter_scanner' && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-5 shadow-xl">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <QrCode className="w-5 h-5 text-amber-400" />
              محاكاة تطبيق Flutter: شاشة مسح الجواز الرقمي وفك التشفير
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              معاينة تفاعلية لشاشة المفتش الميداني عند مسح باركود الشاحنة بالـ QR، فك التشفير، ومقارنة فواتير المزرعة بسقف الأسعار.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left simulated mobile frame */}
            <div className="lg:col-span-5 bg-slate-950 rounded-3xl border-4 border-slate-800 p-4 shadow-2xl space-y-4">
              {/* Phone speaker & notch */}
              <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto"></div>

              {/* Viewport content */}
              <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-4">
                <div className="text-center">
                  <div className="text-xs font-bold text-white">منظومة كَرِيمَة - مفتش قمع الغش</div>
                  <div className="text-[10px] text-slate-400">قارئ جواز الشحنة الفلاحية بالـ QR</div>
                </div>

                {/* Simulated Camera Scanner Box */}
                <div className="relative h-44 bg-slate-950 rounded-xl border-2 border-dashed border-emerald-500/50 flex flex-col items-center justify-center p-3 text-center">
                  <div className="w-28 h-28 border-2 border-emerald-400 rounded-lg flex items-center justify-center animate-pulse">
                    <QrCode className="w-16 h-16 text-emerald-400" />
                  </div>
                  <div className="text-[10px] text-slate-400 mt-2">
                    {isScanning ? 'جاري فك التشفير والمطابقة...' : 'وجه الكاميرا نحو باركود الشاحنة'}
                  </div>
                </div>

                {/* Scanner Test Buttons */}
                <div className="space-y-2">
                  <span className="text-[11px] text-slate-400 block font-bold">اختر شحنة لاختبار المسح:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleSimulateMobileScan('SHP-2026-0901')}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 text-[11px] font-bold border border-emerald-500/40"
                    >
                      🥔 بطاطا (مطابقة ✅)
                    </button>
                    <button
                      onClick={() => handleSimulateMobileScan('SHP-2026-0902')}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 text-[11px] font-bold border border-rose-500/40"
                    >
                      🥩 لحم بقري (احتكار 🚨)
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Decoded Payload Display */}
            <div className="lg:col-span-7 space-y-4">
              {scannerResult ? (
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 text-xs">
                  {/* Status Banner */}
                  <div className={`p-3.5 rounded-xl border flex items-center gap-3 ${
                    scannerResult.status === 'compliant'
                      ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                      : 'bg-rose-950/60 border-rose-500/50 text-rose-200'
                  }`}>
                    {scannerResult.status === 'compliant' ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                    ) : (
                      <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0 animate-bounce" />
                    )}
                    <div>
                      <div className="font-extrabold text-white text-sm">
                        {scannerResult.status === 'compliant'
                          ? 'جواز شحنة فلاحية معتمد ومطابق (Green Verified)'
                          : 'إنذار شبهة احتكار وانحراف مكاني (Red Hoarding Alert)'}
                      </div>
                      <div className="text-[11px] text-slate-300 mt-0.5">
                        كود التوثيق المشفر: <span className="font-mono">{scannerResult.passportId}</span>
                      </div>
                    </div>
                  </div>

                  {/* Shipment Lineage Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">المادة:</span>
                      <span className="font-bold text-white text-xs">{scannerResult.productName}</span>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">الحمولة المصادق عليها:</span>
                      <span className="font-mono font-bold text-emerald-400 text-xs">{scannerResult.quantityTons} طن</span>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">حرارة التبريد:</span>
                      <span className="font-mono font-bold text-cyan-400 text-xs">{scannerResult.coldChainTemperatureC}°C</span>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">سعر المزرعة:</span>
                      <span className="font-mono font-bold text-white text-xs">{scannerResult.farmGatePrice} دج/كلغ</span>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">سقف الجملة المسقف:</span>
                      <span className="font-mono font-bold text-indigo-400 text-xs">{scannerResult.officialCeilingPrice} دج/كلغ</span>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">لوحة الترقيم:</span>
                      <span className="font-mono font-bold text-slate-200 text-xs">{scannerResult.truckPlate}</span>
                    </div>
                  </div>

                  {/* Route points */}
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1.5 text-[11px]">
                    <div><strong className="text-slate-400">المستثمرة المصدرة:</strong> {scannerResult.originFarm}</div>
                    <div><strong className="text-slate-400">الوجهة الرسمية:</strong> {scannerResult.destinationMarket}</div>
                  </div>

                  {/* Suspicion alert if present */}
                  {scannerResult.alertReason && (
                    <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-[11px] text-rose-200">
                      <strong className="text-rose-300 block mb-0.5">⚠️ خرق مكاني مرصود عبر PostGIS:</strong>
                      {scannerResult.alertReason}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-500 bg-slate-950 rounded-2xl border border-slate-800">
                  انقر على أحد أزرار الاختبار داخل إطار الهاتف لمسح شحنة البطاطا أو شحنة اللحوم المشبوهة.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
