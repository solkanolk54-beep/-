import React from 'react';
import { ShipmentPassport } from '../../types';
import { QRCodeSVG } from 'qrcode.react';
import { 
  X, 
  QrCode, 
  Truck, 
  MapPin, 
  ShieldCheck, 
  ThermometerSnowflake, 
  AlertTriangle, 
  Calendar, 
  FileCheck2,
  CheckCircle2,
  Lock
} from 'lucide-react';

interface PassportDetailModalProps {
  shipment: ShipmentPassport | null;
  onClose: () => void;
  onVerifyShipment?: (shipmentId: string) => void;
}

export const PassportDetailModal: React.FC<PassportDetailModalProps> = ({
  shipment,
  onClose,
  onVerifyShipment,
}) => {
  if (!shipment) return null;

  const isHoarding = shipment.status === 'hoarding_suspicion';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between ${
          isHoarding ? 'bg-rose-950/60 border-rose-900/60' : 'bg-slate-950 border-slate-800'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">
                  جواز سفر الشحنة الفلاحية الرقمي
                </h3>
                <span className="font-mono text-xs font-bold text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
                  {shipment.id}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                شهادة المصدر والتتبع اللوجستي المعتمدة من وزارة الفلاحة والتجارة
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-xs">
          {/* Top QR & Quick Specs */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center bg-slate-950 p-4 rounded-xl border border-slate-800">
            {/* SVG QR Code */}
            <div className="sm:col-span-4 flex flex-col items-center justify-center">
              <div className="bg-white p-2.5 rounded-xl shadow-lg border border-slate-200">
                <QRCodeSVG
                  value={shipment.qrPayload || `KRM-PASS:${shipment.id}`}
                  size={150}
                  level="H"
                  includeMargin={false}
                />
              </div>
              <span className="text-[10px] text-slate-400 font-mono mt-1.5 flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-400" />
                تشفير ديناميكي ضد التزوير
              </span>
            </div>

            {/* Quick Specs */}
            <div className="sm:col-span-8 space-y-2">
              <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">المادة المنقولة:</span>
                <span className="text-white font-bold text-sm">{shipment.commodityNameAr}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">الحمولة الإجمالية:</span>
                <span className="text-emerald-400 font-mono font-bold">{shipment.quantityTons} طن</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">لوحة الترقيم والسائق:</span>
                <span className="text-white font-mono">{shipment.truckPlate} ({shipment.driverName})</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">سعر المزرعة المعتمد:</span>
                <span className="text-emerald-400 font-mono font-bold">{shipment.farmGatePricePerKg} دج/كلغ</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">درجة حرارة الشاحنة:</span>
                <span className="text-cyan-400 font-mono font-bold flex items-center gap-1">
                  <ThermometerSnowflake className="w-3.5 h-3.5" />
                  {shipment.temperatureLogC}°C
                </span>
              </div>
            </div>
          </div>

          {/* Hoarding Alert Banner if present */}
          {isHoarding && (
            <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-700 text-rose-200 space-y-1">
              <div className="flex items-center gap-2 font-bold text-rose-300">
                <AlertTriangle className="w-4 h-4 animate-bounce" />
                <span>إنذار احتكار وانحراف مكاني (PostGIS Geofence Violation)</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                {shipment.suspicionReason}
              </p>
            </div>
          )}

          {/* Waypoints Audit Log */}
          <div className="space-y-2">
            <h4 className="font-bold text-white flex items-center gap-2 text-xs">
              <MapPin className="w-4 h-4 text-emerald-400" />
              سجل نقاط العبور الجغرافية والمحطات المصادق عليها:
            </h4>
            <div className="space-y-2">
              {shipment.waypoints.map((wp, i) => (
                <div
                  key={i}
                  className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-mono text-[10px]">
                      {i + 1}
                    </span>
                    <div>
                      <div className="font-medium text-white">{wp.label}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {wp.location[0]}, {wp.location[1]} • {wp.timestamp}
                      </div>
                    </div>
                  </div>

                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                    wp.verifiedByPostGIS ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {wp.verifiedByPostGIS ? 'مؤكد مكانياً' : 'انحراف غير مصرح'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Inspector Action Footer */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <div className="text-[11px] text-slate-400">
              حالة الجواز: <strong className="text-white font-mono">{shipment.status}</strong>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
              >
                إغلاق
              </button>

              {onVerifyShipment && shipment.status !== 'delivered' && (
                <button
                  onClick={() => {
                    onVerifyShipment(shipment.id);
                    onClose();
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تأشير ومطابقة الشحنة كلياً</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
