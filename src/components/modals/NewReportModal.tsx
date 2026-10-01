import React, { useState } from 'react';
import { Commodity, CitizenReport } from '../../types';
import { 
  X, 
  Camera, 
  MapPin, 
  Upload, 
  AlertTriangle, 
  CheckCircle, 
  DollarSign, 
  Sparkles,
  ShieldAlert
} from 'lucide-react';

interface NewReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  commodities: Commodity[];
  initialCommodity?: Commodity;
  onSubmitReport: (report: Partial<CitizenReport>) => void;
}

export const NewReportModal: React.FC<NewReportModalProps> = ({
  isOpen,
  onClose,
  commodities,
  initialCommodity,
  onSubmitReport,
}) => {
  if (!isOpen) return null;

  const [selectedCommodityId, setSelectedCommodityId] = useState<string>(
    initialCommodity?.id || commodities[0].id
  );
  const [storeName, setStoreName] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [wilaya, setWilaya] = useState('الجزائر العاصمة');
  const [baladiya, setBaladiya] = useState('سيدي امحمد');
  const [observedPrice, setObservedPrice] = useState<number>(0);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [gpsSimulated, setGpsSimulated] = useState<[number, number]>([36.753, 3.058]);
  const [isLocating, setIsLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const selectedCommodity = commodities.find((c) => c.id === selectedCommodityId) || commodities[0];
  const ceilingPrice = selectedCommodity.officialCeilingPrice;
  const inflationDelta = observedPrice > 0 ? observedPrice - ceilingPrice : 0;
  const inflationDeltaPct = ceilingPrice > 0 && observedPrice > 0 ? ((inflationDelta / ceilingPrice) * 100).toFixed(1) : '0';

  const handleSimulateGPS = () => {
    setIsLocating(true);
    setTimeout(() => {
      // Simulate real-time coordinates in Algiers / Blida / Oran
      const lat = 36.75 + (Math.random() - 0.5) * 0.04;
      const lng = 3.05 + (Math.random() - 0.5) * 0.04;
      setGpsSimulated([Number(lat.toFixed(4)), Number(lng.toFixed(4))]);
      setIsLocating(false);
    }, 700);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setReceiptImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName || observedPrice <= 0) return;

    setSubmitting(true);
    setTimeout(() => {
      const ticketNumber = `KRM-TKT-2026-${Math.floor(10000 + Math.random() * 90000)}`;
      const deltaNumber = Number(inflationDeltaPct);

      onSubmitReport({
        ticketNumber,
        commodityId: selectedCommodity.id,
        commodityNameAr: selectedCommodity.nameAr,
        observedPrice,
        ceilingPrice,
        inflationDeltaPct: deltaNumber,
        storeName,
        storeAddress: storeAddress || 'شارع الاستقلال، وسط المدينة',
        wilaya,
        baladiya,
        coordinates: gpsSimulated,
        receiptImageUrl: receiptImage || 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=400&q=80',
        reporterBadge: `مواطن يقظ #${Math.floor(1000 + Math.random() * 9000)}`,
        status: deltaNumber > 25 ? 'inspector_dispatched' : 'triaged',
        createdAt: 'الآن',
        slaMinutesRemaining: deltaNumber > 25 ? 60 : 180,
      });

      setSubmitting(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                إيداع بلاغ فوري عن مضاربة أو غلاء غير قانوني
              </h3>
              <p className="text-xs text-slate-400">
                منظومة كَرِيمَة للرقابة الشعبية وتوجيه فرق قمع الغش (قانون 21-15)
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

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Commodity & Ceiling display */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-bold block mb-1">المادة الفلاحية المعنية:</label>
              <select
                value={selectedCommodityId}
                onChange={(e) => setSelectedCommodityId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium"
              >
                {commodities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.nameAr}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex flex-col justify-center">
              <span className="text-slate-400 text-[11px]">السعر المسقف قانوناً:</span>
              <span className="text-emerald-400 font-mono font-extrabold text-lg">
                {ceilingPrice} دج/{selectedCommodity.unit}
              </span>
            </div>
          </div>

          {/* Observed Price and Inflation Delta */}
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-2">
            <label className="text-slate-300 font-bold block">السعر المعروض للبيع بالتجزئة (دج):</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                required
                min={1}
                placeholder="أدخل السعر المكتوب على اليافطة..."
                value={observedPrice || ''}
                onChange={(e) => setObservedPrice(Number(e.target.value))}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold text-sm"
              />
              <span className="text-slate-400 font-semibold">دج/{selectedCommodity.unit}</span>
            </div>

            {observedPrice > 0 && (
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-400">فارق السعر عن السقف:</span>
                <span className={`font-mono font-bold text-xs ${
                  inflationDelta > 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}>
                  {inflationDelta > 0 ? `+${inflationDelta} دج (+${inflationDeltaPct}%) خرق` : 'ممتثل'}
                </span>
              </div>
            )}
          </div>

          {/* Store Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-medium block mb-1">اسم المحل أو التاجر:</label>
              <input
                type="text"
                required
                placeholder="مثال: خضار البركة أو ملحمة السلام"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">العنوان أو الحي:</label>
              <input
                type="text"
                placeholder="شارع الأمير عبد القادر، السوق الشعبي"
                value={storeAddress}
                onChange={(e) => setStoreAddress(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
              />
            </div>
          </div>

          {/* Wilaya & Baladiya */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-medium block mb-1">الولاية:</label>
              <input
                type="text"
                value={wilaya}
                onChange={(e) => setWilaya(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="text-slate-300 font-medium block mb-1">البلدية:</label>
              <input
                type="text"
                value={baladiya}
                onChange={(e) => setBaladiya(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
              />
            </div>
          </div>

          {/* GPS Coordinates Simulation */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="font-bold text-slate-200">إحداثيات GPS المكانية (PostGIS ST_MakePoint)</div>
                <div className="text-[11px] font-mono text-slate-400">
                  {gpsSimulated[0]}, {gpsSimulated[1]} (دقة عالية)
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSimulateGPS}
              disabled={isLocating}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono transition-colors"
            >
              {isLocating ? 'تحديد الموقع...' : 'تحديث GPS'}
            </button>
          </div>

          {/* Photo / Receipt Attachment */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-medium block">
              صورة لافتة السعر أو وصل الشراء (دليل إثبات):
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 cursor-pointer transition-colors">
                <Camera className="w-4 h-4 text-cyan-400" />
                <span>التقاط صورة / رفع ملف</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>

              {receiptImage && (
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-[11px]">
                  <CheckCircle className="w-4 h-4" />
                  <span>تم إرفاق الصورة وتشفير البصمة</span>
                </div>
              )}
            </div>
          </div>

          {/* Submit CTA */}
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
            >
              إلغاء
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold shadow-lg shadow-rose-950/50 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>{submitting ? 'جاري الإرسال والتوجيه...' : 'إرسال البلاغ وتوليد تذكرة الرقابة'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
