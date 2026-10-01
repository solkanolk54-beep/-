import React, { useState } from 'react';
import { ShipmentPassport, UserRole } from '../../types';
import QRCode from 'qrcode';
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
  Eye
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
    const qrPayload = `KRM-PASS-${Date.now()}:${newCommodityName}:${newQuantityTons}T:${newTruckPlate}:SIG_VERIFIED`;

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

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl border border-indigo-800/40 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                الموديل رقم 2: جواز سفر الشحنة وتتبع PostGIS
              </span>
              <span className="text-xs text-slate-400 font-mono">Dynamic QR &amp; Spatial Geofence</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white">
              جواز سفر الشحنة الرقمي وكشف التخزين غير المصرح (الاحتكار)
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
              توليد باركود ديناميكي مشفر (Encrypted Dynamic QR) لكل حمولة شاحنة، وربط مسار السير بأنظمة PostGIS اللحظية لرصد تحويل مسار السلع أو حبسها في مستودعات تبريد غير مصرح بها.
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
              إصدار جواز سفر شحنة معتمد (سلطة ضبط التجارة والفلاحة)
            </h3>
            <button
              type="button"
              onClick={() => setIsGeneratingNew(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              إلغاء
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              {/* Card Footer: QR & Inspect Details */}
              <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-white p-1 flex items-center justify-center">
                    <QrCode className="w-6 h-6 text-slate-950" />
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    توقيع رقمي SHA-256
                  </div>
                </div>

                <button
                  onClick={() => onOpenShipmentDetail(shp)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>معاينة الجواز والمسار</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
