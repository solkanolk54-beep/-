import React, { useState, useMemo } from 'react';
import { Commodity } from '../../types';
import { calculateFairPrice } from '../../services/fairPriceCalculator';
import { 
  Calculator, 
  TrendingUp, 
  AlertOctagon, 
  CheckCircle2, 
  HelpCircle, 
  Truck, 
  Sliders, 
  DollarSign, 
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Percent
} from 'lucide-react';

interface FarmToForkModuleProps {
  commodities: Commodity[];
  selectedCommodityId: string;
  onSelectCommodity: (id: string) => void;
  onOpenReportForCommodity: (commodity: Commodity) => void;
}

export const FarmToForkModule: React.FC<FarmToForkModuleProps> = ({
  commodities,
  selectedCommodityId,
  onSelectCommodity,
  onOpenReportForCommodity,
}) => {
  const currentCommodity = useMemo(() => {
    return commodities.find((c) => c.id === selectedCommodityId) || commodities[0];
  }, [commodities, selectedCommodityId]);

  // Interactive simulation parameters
  const [farmGatePrice, setFarmGatePrice] = useState<number>(currentCommodity.baseFarmGateCost);
  const [distanceKm, setDistanceKm] = useState<number>(220); // Average Wilaya to Algiers/Oran transit
  const [dieselPrice, setDieselPrice] = useState<number>(29.0);
  const [coldChain, setColdChain] = useState<boolean>(currentCommodity.category === 'meat' || currentCommodity.category === 'fish');
  const [wholesaleMarginPct, setWholesaleMarginPct] = useState<number>(currentCommodity.maxWholesaleMarginPct);
  const [retailMarginPct, setRetailMarginPct] = useState<number>(currentCommodity.maxRetailMarginPct);
  const [observedMarketPrice, setObservedMarketPrice] = useState<number>(currentCommodity.currentMarketAvgPrice);

  // Sync state when selected commodity changes
  const handleCommodityChange = (comm: Commodity) => {
    onSelectCommodity(comm.id);
    setFarmGatePrice(comm.baseFarmGateCost);
    setWholesaleMarginPct(comm.maxWholesaleMarginPct);
    setRetailMarginPct(comm.maxRetailMarginPct);
    setColdChain(comm.category === 'meat' || comm.category === 'fish');
    setObservedMarketPrice(comm.currentMarketAvgPrice);
  };

  // Perform fair price calculation
  const calculation = useMemo(() => {
    return calculateFairPrice({
      farmGatePrice,
      distanceKm,
      dieselPricePerLiter: dieselPrice,
      requiresColdChain: coldChain,
      wholesaleMarginPct,
      retailMarginPct,
    });
  }, [farmGatePrice, distanceKm, dieselPrice, coldChain, wholesaleMarginPct, retailMarginPct]);

  const evaluation = calculation.statusAgainstObserved(observedMarketPrice);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-6 rounded-2xl border border-emerald-800/40 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                الموديل رقم 1: سلسلة القيمة المفتوحة
              </span>
              <span className="text-xs text-slate-400 font-mono">Algorithm v2.4 (Farm-to-Fork)</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white">
              محرك احتساب السعر العادل وتفكيك هوامش الأرباح
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
              تتبع تكلفة الإنتاج الفلاحي (المدخلات والأسمدة والطاقة)، تكاليف النقل المبرر، وسقف هوامش الجملة والتجزئة لكشف التضخم المصطنع والمضاربة غير المشروعة.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-center">
              <div className="text-xs text-slate-400">السعر العادل المسقف</div>
              <div className="text-2xl font-black text-emerald-400 font-mono">
                {calculation.fairRetailCeiling} <span className="text-sm font-sans">دج/{currentCommodity.unit}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Commodity Selector Ribbon */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {commodities.map((comm) => {
          const isSelected = comm.id === currentCommodity.id;
          return (
            <button
              key={comm.id}
              onClick={() => handleCommodityChange(comm)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm font-bold transition-all whitespace-nowrap ${
                isSelected
                  ? 'bg-emerald-600/30 text-emerald-200 border-emerald-500/60 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500'
                  : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-850 hover:border-slate-700'
              }`}
            >
              <span className="text-lg">{comm.icon}</span>
              <span>{comm.nameAr}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                comm.status === 'fair' ? 'bg-emerald-500/20 text-emerald-400' :
                comm.status === 'warning' ? 'bg-amber-500/20 text-amber-300' :
                'bg-rose-500/20 text-rose-400 animate-pulse'
              }`}>
                {comm.currentMarketAvgPrice} دج
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Grid: Parameters Simulator & Visual Value-Chain Waterfall */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Simulation Sliders */}
        <div className="lg:col-span-5 bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-lg space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-extrabold text-white flex items-center gap-2 text-base">
              <Sliders className="w-5 h-5 text-emerald-400" />
              محددات التكلفة واللوجستيك (محاكاة لحظية)
            </h3>
            <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded font-mono">
              PostGIS Geo-Route
            </span>
          </div>

          {/* 1. Farm-Gate Price */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-slate-300 flex items-center gap-1.5">
                🌾 سعر الخروج من المزرعة (Farm-Gate)
              </span>
              <span className="text-emerald-400 font-mono font-bold text-sm">
                {farmGatePrice} دج/{currentCommodity.unit}
              </span>
            </div>
            <input
              type="range"
              min={Math.max(10, Math.floor(currentCommodity.baseFarmGateCost * 0.4))}
              max={Math.floor(currentCommodity.baseFarmGateCost * 2.5)}
              step={1}
              value={farmGatePrice}
              onChange={(e) => setFarmGatePrice(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            {/* Breakdown of farm inputs */}
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 text-[11px] text-slate-400 grid grid-cols-2 gap-1.5">
              <div>🌱 البذور والشتلات: {currentCommodity.telemetryInputs.seedAndSeedlingsCost} دج</div>
              <div>🧪 الأسمدة والمعالجة: {currentCommodity.telemetryInputs.fertilizerAndChemicals} دج</div>
              <div>⚡ الطاقة والري: {currentCommodity.telemetryInputs.irrigationAndEnergy} دج</div>
              <div>👨‍🌾 اليد العاملة والجني: {currentCommodity.telemetryInputs.laborAndHarvesting} دج</div>
            </div>
          </div>

          {/* 2. Transit Distance (km) */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-cyan-400" />
                مسافة النقل من الحقل إلى سوق الجملة
              </span>
              <span className="text-cyan-400 font-mono font-bold text-sm">
                {distanceKm} كم
              </span>
            </div>
            <input
              type="range"
              min={20}
              max={950}
              step={10}
              value={distanceKm}
              onChange={(e) => setDistanceKm(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span>20 كم (نقل محلي)</span>
              <span>450 كم (الجنوب إلى الشمال)</span>
              <span>950 كم</span>
            </div>
          </div>

          {/* 3. Cold chain toggle & Diesel Price */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <label className="text-xs text-slate-300 font-medium block mb-1">
                سعر المازوت (دج/لتر)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={dieselPrice}
                  onChange={(e) => setDieselPrice(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                />
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
              <span className="text-xs text-slate-300 font-medium">سلسلة التبريد (Cold Chain)</span>
              <label className="flex items-center gap-2 cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={coldChain}
                  onChange={(e) => setColdChain(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="text-xs text-slate-400">تطبيق معامل التبريد (+40%)</span>
              </label>
            </div>
          </div>

          {/* 4. Margin Caps Regulation */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>هامش الجملة:</span>
                <span className="text-indigo-400 font-bold font-mono">{wholesaleMarginPct}%</span>
              </div>
              <input
                type="range"
                min={4}
                max={15}
                step={0.5}
                value={wholesaleMarginPct}
                onChange={(e) => setWholesaleMarginPct(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>سقف هامش التجزئة:</span>
                <span className="text-teal-400 font-bold font-mono">{retailMarginPct}%</span>
              </div>
              <input
                type="range"
                min={8}
                max={30}
                step={1}
                value={retailMarginPct}
                onChange={(e) => setRetailMarginPct(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
              />
            </div>
          </div>

          {/* 5. Observed retail shelf price tester */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
            <label className="text-xs font-semibold text-slate-200 block">
              السعر المرصود في متاجر التجزئة (للمعاينة والمقارنة):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={observedMarketPrice}
                onChange={(e) => setObservedMarketPrice(Number(e.target.value))}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono font-bold"
              />
              <span className="text-xs text-slate-400 font-semibold">دج/{currentCommodity.unit}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Waterfall Calculation & Compliance Badge */}
        <div className="lg:col-span-7 space-y-6">
          {/* Status Verdict Card */}
          <div className={`p-5 rounded-2xl border transition-all ${
            evaluation.status === 'fair'
              ? 'bg-emerald-950/40 border-emerald-500/40 shadow-lg shadow-emerald-950/30'
              : evaluation.status === 'warning'
              ? 'bg-amber-950/40 border-amber-500/40 shadow-lg shadow-amber-950/30'
              : 'bg-rose-950/50 border-rose-500/50 shadow-xl shadow-rose-950/50'
          }`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className={`p-3 rounded-xl ${
                  evaluation.status === 'fair' ? 'bg-emerald-500/20 text-emerald-400' :
                  evaluation.status === 'warning' ? 'bg-amber-500/20 text-amber-300' :
                  'bg-rose-500/20 text-rose-400'
                }`}>
                  {evaluation.status === 'fair' && <CheckCircle2 className="w-7 h-7" />}
                  {evaluation.status === 'warning' && <AlertOctagon className="w-7 h-7" />}
                  {evaluation.status === 'gouging' && <ShieldAlert className="w-7 h-7 animate-pulse" />}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      evaluation.status === 'fair' ? 'bg-emerald-500/20 text-emerald-300' :
                      evaluation.status === 'warning' ? 'bg-amber-500/20 text-amber-200' :
                      'bg-rose-500/20 text-rose-200'
                    }`}>
                      {evaluation.status === 'fair' ? '🟢 حالة ممتثلة' :
                       evaluation.status === 'warning' ? '🟡 إنذار هامش زائد' :
                       '🔴 خرق جسيم لقانون المضاربة'}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      الفارق: {evaluation.deltaPct > 0 ? `+${evaluation.deltaPct}%` : `${evaluation.deltaPct}%`}
                    </span>
                  </div>

                  <h4 className="text-lg font-extrabold text-white mt-1">
                    {evaluation.labelAr}
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {evaluation.descriptionAr}
                  </p>

                  {evaluation.excessAmountDzd > 0 && (
                    <div className="mt-2 text-xs font-mono text-rose-300 bg-rose-950/60 px-2.5 py-1 rounded inline-block border border-rose-800/60">
                      مبلغ الزيادة الاحتكارية غير المبررة: +{evaluation.excessAmountDzd} دج لكل {currentCommodity.unit}
                    </div>
                  )}
                </div>
              </div>

              {evaluation.status !== 'fair' && (
                <button
                  onClick={() => onOpenReportForCommodity(currentCommodity)}
                  className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg transition-all whitespace-nowrap active:scale-95"
                >
                  تحرير تذكرة تفتيش
                </button>
              )}
            </div>
          </div>

          {/* Detailed Value-Chain Waterfall Breakdown */}
          <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-lg space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center justify-between">
              <span>تفكيك السلسلة خطوة بخطوة (Value Chain Step Breakdown)</span>
              <span className="text-xs font-mono text-slate-400">دينار جزائري / {currentCommodity.unit}</span>
            </h4>

            <div className="space-y-3">
              {/* Step 1: Farm Gate */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">سعر خروج المزرعة (المنتج الفلاحي)</div>
                    <div className="text-[11px] text-slate-400">يشمل البذور، السقي، الأسمدة وهامش ربح المزارع</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold font-mono text-emerald-400">{calculation.farmGatePrice} دج</div>
                  <div className="text-[10px] text-slate-500">
                    {((calculation.farmGatePrice / calculation.fairRetailCeiling) * 100).toFixed(0)}% من السعر النهائي
                  </div>
                </div>
              </div>

              {/* Step 2: Transport & Cold Storage */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">تكلفة النقل واللوجستيك المبررة ({distanceKm} كم)</div>
                    <div className="text-[11px] text-slate-400">
                      نقل مبرد: {coldChain ? 'نعم (×1.4)' : 'عادي'} + صناديق التعبئة ({calculation.packagingCostPerKg} دج)
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold font-mono text-cyan-400">
                    +{(calculation.logisticsCostPerKg + calculation.packagingCostPerKg).toFixed(2)} دج
                  </div>
                  <div className="text-[10px] text-slate-500">نقل + تغليف قانوني</div>
                </div>
              </div>

              {/* Step 3: Wholesale Hub Ceiling */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                    3
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">سعر سقف سوق الجملة المعتمد</div>
                    <div className="text-[11px] text-slate-400">هامش ربح تاجر الجملة الأقصى ({wholesaleMarginPct}%)</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold font-mono text-indigo-400">
                    {calculation.fairWholesaleCeiling} دج
                  </div>
                  <div className="text-[10px] text-slate-500">+{calculation.wholesaleMarginAmount} دج هامش جملة</div>
                </div>
              </div>

              {/* Step 4: Final Fair Retail Ceiling */}
              <div className="bg-gradient-to-r from-emerald-950/60 to-slate-950 p-4 rounded-xl border border-emerald-500/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-sm">
                    4
                  </div>
                  <div>
                    <div className="text-sm font-black text-white">السعر العادل الأقصى للمستهلك (سقف التجزئة)</div>
                    <div className="text-[11px] text-slate-300">أقصى هامش ربح تجزئة مرخص ({retailMarginPct}%)</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-black font-mono text-emerald-400">
                    {calculation.fairRetailCeiling} دج
                  </div>
                  <div className="text-[10px] text-slate-400">+{calculation.retailMarginAmount} دج هامش تجزئة</div>
                </div>
              </div>
            </div>

            {/* Official Legal Notice */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 flex items-start gap-2">
              <span className="text-amber-400 text-sm">⚖️</span>
              <span>
                <strong>سند تنظيمي:</strong> تخضع هذه المعادلة للمرسوم التنفيذي المحدد لكيفيات تطبيق أسعار البيع وهوامش الربح القصوى للمواد واسعة الاستهلاك، وأحكام القانون رقم 21-15 المتعلق بمكافحة المضاربة غير المشروعة.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
