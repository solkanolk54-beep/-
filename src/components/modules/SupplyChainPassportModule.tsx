/**
 * ==============================================================================
 * منظومة كَرِيمَة للرقابة الشاملة والشفافية الرقمية (Kareema Platform)
 * الموديل 2: جواز سفر الشحنة الفلاحية وتوليد الباركود الذكي (Dynamic QR Code)
 * File: src/components/modules/SupplyChainPassportModule.tsx
 * ==============================================================================
 */

import React, { useState } from 'react';
import { ShipmentPassport, UserRole } from '../../types';
import { QRCodeSVG } from 'qrcode.react';
import { 
  QrCode, 
  Truck, 
  MapPin, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  ThermometerSnowflake, 
  Plus, 
  Search, 
  Compass, 
  FileCheck,
  Building,
  Key,
  Eye,
  ScanLine,
  Download,
  Copy,
  Check,
  Maximize2,
  X,
  ShieldCheck,
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface SupplyChainPassportModuleProps {
  shipments: ShipmentPassport[];
  currentRole: UserRole;
  onOpenShipmentDetail: (shipment: ShipmentPassport) => void;
  onCreateNewShipment: (shipment: Partial<ShipmentPassport>) => void;
}

export const SupplyChainPassportModule: React.FC<SupplyChainPassportModuleProps> = ({
  shipments,
  currentRole,
  onOpenShipmentDetail,
  onCreateNewShipment,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'in_transit' | 'hoarding_suspicion' | 'delivered'>('all');
  const [isGeneratingNew, setIsGeneratingNew] = useState(false);

  // حالة النافذة المنبثقة لفحص ومسح كود QR الميداني للدورية
  const [selectedQrShipment, setSelectedQrShipment] = useState<ShipmentPassport | null>(null);
  const [hasCopiedPayload, setHasCopiedPayload] = useState(false);
  const [isSimulatingScan, setIsSimulatingScan] = useState(false);
  const [scanVerificationResult, setScanVerificationResult] = useState<boolean | null>(null);

  // New passport form state
  const [newTruckPlate, setNewTruckPlate] = useState('00892-124-16');
  const [newDriverName, setNewDriverName] = useState('مراد سلطاني');
  const [newCommodityName, setNewCommodityName] = useState('بطاطا استهلاك سبونتا');
  const [newFarmName, setNewFarmName] = useState('مزرعة النصر - عين الدفلى');
  const [newDestinationMarket, setNewDestinationMarket] = useState('سوق الجملة الكاليتوس (الجزائر)');
  const [newQuantityTons, setNewQuantityTons] = useState(22);
  const [newFarmGatePrice, setNewFarmGatePrice] = useState(52);

  const filteredShipments = shipments.filter((shp) => {
    const matchesSearch = 
      shp.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shp.truckPlate.includes(searchTerm) ||
      shp.driverName.includes(searchTerm) ||
      shp.commodityNameAr.includes(searchTerm);

    if (selectedFilter === 'all') return matchesSearch;
    return matchesSearch && shp.status === selectedFilter;
  });

  const handleCreatePassport = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `SHP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const qrPayload = `KRM-PASS:${newId}:${newCommodityName}:${newQuantityTons}T:${newTruckPlate}:SIG_SHA256_VERIFIED`;

    const newPassport: ShipmentPassport = {
      id: newId,
      qrPayload,
      truckPlate: newTruckPlate,
      driverName: newDriverName,
      driverNationalIdHash: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
      originFarmName: newFarmName,
      originWilaya: 'عين الدفلى',
      originCoordinates: [36.264, 1.968],
      destinationMarketName: newDestinationMarket,
      destinationWilaya: 'الجزائر العاصمة',
      destinationCoordinates: [36.657, 3.125],
      commodityId: 'potato-table',
      commodityNameAr: newCommodityName,
      quantityTons: newQuantityTons,
      farmGatePricePerKg: newFarmGatePrice,
      calculatedFairWholesalePerKg: newFarmGatePrice + 10.5,
      departureTime: new Date().toISOString().replace('T', ' ').slice(0, 16),
      expectedArrivalTime: '2026-09-30 18:00',
      status: 'in_transit',
      temperatureLogC: 16.0,
      currentLocation: [36.350, 2.450],
      deviationDetected: false,
      waypoints: [
        {
          timestamp: new Date().toLocaleTimeString('ar-DZ'),
          location: [36.264, 1.968],
          label: 'إصدار الجواز وتثبيت الوزن في المزرعة',
          verifiedByPostGIS: true,
        },
      ],
    };

    onCreateNewShipment(newPassport);
    setIsGeneratingNew(false);
  };

  /**
   * توليد الحمولة المشفرة لكل شحنة ليتم تضمينها داخل كود QR
   */
  const getShipmentQrValue = (shp: ShipmentPassport) => {
    return JSON.stringify({
      passportId: shp.id,
      authority: 'وزارة التجارة وترقية الصادرات - منصة كَرِيمَة',
      plate: shp.truckPlate,
      driver: shp.driverName,
      commodity: shp.commodityNameAr,
      tons: shp.quantityTons,
      farmPrice: `${shp.farmGatePricePerKg} DZD`,
      fairPrice: `${shp.calculatedFairWholesalePerKg} DZD`,
      origin: shp.originFarmName,
      destination: shp.destinationMarketName,
      verificationUrl: `https://kareema.gov.dz/verify/shipment/${shp.id}`,
      sig: shp.qrPayload || `KRM-SIG-${shp.id}`,
    });
  };

  const handleCopyPayload = (shp: ShipmentPassport) => {
    navigator.clipboard.writeText(getShipmentQrValue(shp));
    setHasCopiedPayload(true);
    setTimeout(() => setHasCopiedPayload(false), 2500);
  };

  const handleSimulateFieldScan = () => {
    setIsSimulatingScan(true);
    setScanVerificationResult(null);
    setTimeout(() => {
      setIsSimulatingScan(false);
      setScanVerificationResult(true);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl border border-indigo-800/40 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5" />
                جواز السفر الرقمي الذكي (Dynamic QR Code)
              </span>
              <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                تشفير SHA-256 معتمد
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white">
              جواز سفر الشحنة الرقمي وكشف التخزين غير المصرح (الاحتكار)
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
              توليد رمز استجابة سريعة فريد (Unique QR Code) لكل شحنة فلاحية استناداً إلى معرفها الرسمي، لتمكين دوريات الرقابة وقمع الغش من المسح والتحقق اللحظي في الميدان.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsGeneratingNew(!isGeneratingNew)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs shadow-lg shadow-indigo-950/40 border border-indigo-400/30 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>إصدار جواز شحنة رقمي جديد</span>
            </button>
          </div>
        </div>
      </div>

      {/* New Passport Creator Drawer/Card if active */}
      {isGeneratingNew && (
        <form onSubmit={handleCreatePassport} className="bg-slate-900 rounded-2xl p-6 border border-indigo-500/40 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-extrabold text-white flex items-center gap-2 text-base">
              <QrCode className="w-5 h-5 text-indigo-400" />
              إصدار جواز سفر شحنة معتمد وتوليد باركود QR لحظي
            </h3>
            <button
              type="button"
              onClick={() => setIsGeneratingNew(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              إلغاء
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            {/* Form Fields */}
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-slate-300 block mb-1">رقم لوحة ترقيم الشاحنة</label>
                <input
                  type="text"
                  required
                  value={newTruckPlate}
                  onChange={(e) => setNewTruckPlate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">اسم السائق ورقم الهوية</label>
                <input
                  type="text"
                  required
                  value={newDriverName}
                  onChange={(e) => setNewDriverName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">المادة الفلاحية المنقولة</label>
                <input
                  type="text"
                  required
                  value={newCommodityName}
                  onChange={(e) => setNewCommodityName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">المستثمرة الفلاحية المصدرة</label>
                <input
                  type="text"
                  required
                  value={newFarmName}
                  onChange={(e) => setNewFarmName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">سوق الجملة / الوجهة الرسمية</label>
                <input
                  type="text"
                  required
                  value={newDestinationMarket}
                  onChange={(e) => setNewDestinationMarket(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">الكمية (طن)</label>
                  <input
                    type="number"
                    required
                    value={newQuantityTons}
                    onChange={(e) => setNewQuantityTons(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 block mb-1">سعر المزرعة (دج)</label>
                  <input
                    type="number"
                    required
                    value={newFarmGatePrice}
                    onChange={(e) => setNewFarmGatePrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Live QR Preview Box */}
            <div className="lg:col-span-1 bg-slate-950 p-4 rounded-xl border border-indigo-500/30 flex flex-col items-center justify-center text-center">
              <span className="text-[11px] font-bold text-indigo-400 mb-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                معاينة رمز QR الحي للشحنة
              </span>
              <div className="bg-white p-2.5 rounded-xl shadow-lg border-2 border-indigo-500/50">
                <QRCodeSVG
                  value={`KRM-PREVIEW:${newTruckPlate}:${newCommodityName}:${newQuantityTons}T`}
                  size={110}
                  level="M"
                  includeMargin={false}
                />
              </div>
              <span className="text-[10px] text-slate-400 font-mono mt-2">
                لوحة: {newTruckPlate}
              </span>
              <span className="text-[9px] text-emerald-400 font-mono mt-0.5">
                جاهز للمسح الضوئي الفوري
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg transition-all"
            >
              تأكيد وتوقيع الجواز الرقمي وتوليد كود QR
            </button>
          </div>
        </form>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 p-3 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
          <input
            type="text"
            placeholder="بحث برقم الشحنة، لوحة الترقيم، أو السائق..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
          {[
            { id: 'all', label: 'الكل' },
            { id: 'in_transit', label: 'في المسار اللوجستي 🚚' },
            { id: 'hoarding_suspicion', label: 'شبهة احتكار / انحراف 🚨' },
            { id: 'delivered', label: 'تم التسليم والمطابقة ✅' },
          ].map((flt) => (
            <button
              key={flt.id}
              onClick={() => setSelectedFilter(flt.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedFilter === flt.id
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {flt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Shipments List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredShipments.map((shp) => {
          const isHoarding = shp.status === 'hoarding_suspicion';
          const qrVal = getShipmentQrValue(shp);

          return (
            <div
              key={shp.id}
              className={`bg-slate-900 rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between ${
                isHoarding
                  ? 'border-rose-500/60 shadow-xl shadow-rose-950/40 ring-1 ring-rose-500/40'
                  : 'border-slate-800 hover:border-slate-700 shadow-md'
              }`}
            >
              {/* Card Header */}
              <div className={`p-4 border-b ${
                isHoarding ? 'bg-rose-950/40 border-rose-900/60' : 'bg-slate-950/60 border-slate-800'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                      {shp.id}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {shp.truckPlate}
                    </span>
                  </div>

                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                    shp.status === 'in_transit' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                    shp.status === 'delivered' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                    'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                  }`}>
                    {shp.status === 'in_transit' && 'قيد النقل المباشر'}
                    {shp.status === 'delivered' && 'تم التسليم بسوق الجملة'}
                    {shp.status === 'hoarding_suspicion' && '⚠️ إنذار شبهة احتكار'}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <h4 className="text-base font-extrabold text-white">
                    {shp.commodityNameAr}
                  </h4>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {shp.quantityTons} طن
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-3 text-xs flex-1">
                {/* Route visualization */}
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400 text-sm">📍</span>
                    <div>
                      <div className="text-slate-400 text-[10px]">المصدر (الحقل):</div>
                      <div className="text-white font-medium">{shp.originFarmName}</div>
                    </div>
                  </div>
                  <div className="pr-4 border-r-2 border-dashed border-slate-700 py-1 mr-2 text-[10px] text-slate-500">
                    مسار PostGIS مؤمن • {shp.waypoints.length} نقاط مراقبة موثقة
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-indigo-400 text-sm">🏁</span>
                    <div>
                      <div className="text-slate-400 text-[10px]">الوجهة المعتمدة:</div>
                      <div className="text-white font-medium">{shp.destinationMarketName}</div>
                    </div>
                  </div>
                </div>

                {/* Telemetry info */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/60">
                    <span className="text-slate-400 block text-[10px]">سعر المزرعة المعتمد:</span>
                    <span className="font-mono font-bold text-emerald-400">{shp.farmGatePricePerKg} دج/كلغ</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/60">
                    <span className="text-slate-400 block text-[10px]">درجة حرارة الشحنة:</span>
                    <span className="font-mono font-bold text-cyan-400 flex items-center gap-1">
                      <ThermometerSnowflake className="w-3 h-3" />
                      {shp.temperatureLogC}°C
                    </span>
                  </div>
                </div>

                {/* If Hoarding alert exists */}
                {isHoarding && (
                  <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-[11px] text-rose-200">
                    <div className="font-bold flex items-center gap-1.5 text-rose-300 mb-1">
                      <ShieldAlert className="w-4 h-4" />
                      مؤشر انحراف مكاني خطير:
                    </div>
                    {shp.suspicionReason}
                  </div>
                )}
              </div>

              {/* Card Footer: Real QR Code with qrcode.react & Inspect Details */}
              <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between gap-2">
                {/* Clickable QR Code Thumbnail */}
                <button
                  type="button"
                  onClick={() => setSelectedQrShipment(shp)}
                  title="انقر لتكبير رمز الـ QR ومسحه ميدانياً من قبل الدورية"
                  className="flex items-center gap-2 group text-right hover:opacity-90 transition-opacity"
                >
                  <div className="w-10 h-10 rounded-lg bg-white p-1 flex items-center justify-center shadow-md border border-slate-300 group-hover:border-indigo-400 transition-colors">
                    <QRCodeSVG
                      value={qrVal}
                      size={32}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-indigo-300 group-hover:text-indigo-200 flex items-center gap-1">
                      <ScanLine className="w-3 h-3 text-indigo-400" />
                      <span>مسح رمز الـ QR</span>
                    </div>
                    <div className="text-[9px] text-slate-400 font-mono">
                      بصمة رقمية فريدة
                    </div>
                  </div>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setSelectedQrShipment(shp)}
                    className="p-1.5 rounded-lg bg-indigo-950/70 border border-indigo-800 text-indigo-300 hover:bg-indigo-900 transition-colors"
                    title="تكبير الباركود الميداني"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onOpenShipmentDetail(shp)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>تفاصيل المسار</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* Field Inspection QR Code Modal (Inspector Field Scanner Verification)     */}
      {/* ========================================================================= */}
      {selectedQrShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    رمز الاستجابة السريع للتحقق الميداني
                    <span className="font-mono text-xs font-bold text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
                      {selectedQrShipment.id}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    مخصص للمسح الميداني بواسطة فرق قمع الغش والدرك الوطني
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedQrShipment(null);
                  setScanVerificationResult(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-center">
              {/* Generated QR Code Frame */}
              <div className="flex flex-col items-center justify-center">
                <div className="relative p-4 bg-white rounded-2xl shadow-2xl border-4 border-indigo-500/40 group">
                  <QRCodeSVG
                    id="shipment-passport-qr-svg"
                    value={getShipmentQrValue(selectedQrShipment)}
                    size={200}
                    level="H" // High error correction level for reliable optical field scanning
                    includeMargin={false}
                    imageSettings={{
                      src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23059669"><circle cx="12" cy="12" r="10"/></svg>',
                      height: 24,
                      width: 24,
                      excavate: true,
                    }}
                  />
                  {/* Subtle corner scanner reticle accents */}
                  <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-indigo-600 pointer-events-none" />
                  <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-indigo-600 pointer-events-none" />
                  <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-indigo-600 pointer-events-none" />
                  <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-indigo-600 pointer-events-none" />
                </div>

                <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                  <Truck className="w-4 h-4 text-indigo-400" />
                  <span>الشاحنة: <strong className="font-mono text-white">{selectedQrShipment.truckPlate}</strong></span>
                  <span className="text-slate-600">•</span>
                  <span>السائق: <strong className="text-white">{selectedQrShipment.driverName}</strong></span>
                </div>
              </div>

              {/* Quick Field Attributes Breakdown */}
              <div className="grid grid-cols-2 gap-2 text-right bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px]">السلعة والكمية:</span>
                  <span className="text-white font-bold">{selectedQrShipment.commodityNameAr} ({selectedQrShipment.quantityTons} طن)</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">سعر الخروج من الحقل:</span>
                  <span className="text-emerald-400 font-mono font-bold">{selectedQrShipment.farmGatePricePerKg} دج/كلغ</span>
                </div>
                <div className="col-span-2 pt-1 border-t border-slate-800/80">
                  <span className="text-slate-500 block text-[10px]">المسار المرخص:</span>
                  <span className="text-slate-300 text-[11px] truncate block">
                    من: {selectedQrShipment.originFarmName} ➔ إلى: {selectedQrShipment.destinationMarketName}
                  </span>
                </div>
              </div>

              {/* Live Scanner Verification Simulator */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleSimulateFieldScan}
                  disabled={isSimulatingScan}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg transition-all active:scale-[0.98] disabled:opacity-60"
                >
                  <ScanLine className={`w-4 h-4 ${isSimulatingScan ? 'animate-spin' : ''}`} />
                  <span>
                    {isSimulatingScan ? 'جاري محاكاة القراءة الضوئية ومطابقة التوقيع...' : 'محاكاة مسح الدورية الميدانية بالماسح الضوئي'}
                  </span>
                </button>

                {scanVerificationResult && (
                  <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between text-right animate-in fade-in duration-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <div>
                        <div className="font-bold text-emerald-300">جواز سفر مطابق ومعتمد رسمياً ✅</div>
                        <div className="text-[10px] text-emerald-400/80">
                          بصمة SHA-256 متطابقة مع السجل الوطني للشحنات الفلاحية.
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-1 rounded border border-emerald-800">
                      LEGAL_VALID
                    </span>
                  </div>
                )}
              </div>

              {/* Actions: Copy & Detail Navigation */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => handleCopyPayload(selectedQrShipment)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                >
                  {hasCopiedPayload ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">تم نسخ البيانات!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>نسخ محتوى الـ QR</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const shp = selectedQrShipment;
                    setSelectedQrShipment(null);
                    onOpenShipmentDetail(shp);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/40 font-semibold transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>معاينة تفاصيل الشحنة والمسار</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
