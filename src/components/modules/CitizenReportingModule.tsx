import React, { useState, useMemo } from 'react';
import { CitizenReport, Commodity } from '../../types';
import { CitizenReportsLeafletMap } from './CitizenReportsLeafletMap';
import { 
  Users, 
  MapPin, 
  Camera, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  ShieldAlert, 
  Search, 
  Filter, 
  PlusCircle,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Image as ImageIcon
} from 'lucide-react';

interface CitizenReportingModuleProps {
  reports: CitizenReport[];
  commodities: Commodity[];
  onOpenReportModal: () => void;
  onSelectReportToInspect?: (report: CitizenReport) => void;
}

export const CitizenReportingModule: React.FC<CitizenReportingModuleProps> = ({
  reports,
  commodities,
  onOpenReportModal,
  onSelectReportToInspect,
}) => {
  const [selectedWilaya, setSelectedWilaya] = useState<string>('الكل');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const wilayas = ['الكل', 'الجزائر العاصمة', 'وهران', 'البليدة', 'قسنطينة', 'سطيف', 'بسكرة', 'مستغانم'];

  const filteredReports = useMemo(() => {
    return reports.filter((rep) => {
      const matchesWilaya = selectedWilaya === 'الكل' || rep.wilaya.includes(selectedWilaya);
      const matchesSearch = 
        rep.storeName.includes(searchTerm) ||
        rep.commodityNameAr.includes(searchTerm) ||
        rep.ticketNumber.includes(searchTerm) ||
        rep.baladiya.includes(searchTerm);

      return matchesWilaya && matchesSearch;
    });
  }, [reports, selectedWilaya, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-6 rounded-2xl border border-emerald-800/40 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                الموديل رقم 3: الرقابة الشعبية والتبليغ الفوري
              </span>
              <span className="text-xs text-slate-400 font-mono">Crowdsourced Intelligence &amp; SLA Tracking</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white">
              لوحة الرقابة الشعبية ورصد الأسعار بالبلديات والولايات
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
              تمكين المواطنين من توثيق الأسعار المرتفعة، إرفاق صور اليافطات والوصولات، وتوجيه التذاكر آلياً لفرق التفتيش وقمع الغش وفق اتفاقية مستوى الخدمة (SLA).
            </p>
          </div>

          <button
            onClick={onOpenReportModal}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-extrabold text-sm shadow-xl shadow-rose-950/50 transition-all border border-rose-400/40 active:scale-95"
          >
            <Camera className="w-5 h-5 animate-pulse" />
            <span>إيداع بلاغ فوري بضغطة زر (One-Tap Report)</span>
          </button>
        </div>
      </div>

      {/* Interactive Map & Market Intelligence Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interactive Leaflet GPS Map */}
        <div className="lg:col-span-7">
          <CitizenReportsLeafletMap 
            reports={filteredReports} 
            onSelectReport={onSelectReportToInspect}
          />
        </div>

        {/* Staple Foods Price Ceilings Summary */}
        <div className="lg:col-span-5 bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              قائمة الأسعار المرجعية المسقفة للمواطنين
            </h3>
            <span className="text-[10px] text-slate-400">تحديث اليوم</span>
          </div>

          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
            {commodities.map((c) => {
              const delta = c.currentMarketAvgPrice - c.officialCeilingPrice;
              const deltaPct = ((delta / c.officialCeilingPrice) * 100).toFixed(1);
              return (
                <div
                  key={c.id}
                  className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{c.icon}</span>
                    <div>
                      <div className="font-bold text-white">{c.nameAr}</div>
                      <div className="text-[11px] text-slate-400">
                        سعر المزرعة: {c.baseFarmGateCost} دج
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono font-bold text-slate-200">
                      السقف: <span className="text-emerald-400">{c.officialCeilingPrice} دج</span>
                    </div>
                    <div className="text-[10px] font-mono">
                      السوق: {c.currentMarketAvgPrice} دج{' '}
                      <span className={delta > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                        ({delta > 0 ? `+${deltaPct}%` : 'ممتثل'})
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Citizen Reports Stream & Ticket SLA Queue */}
      <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-lg space-y-4">
        {/* Search & Filter Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <h3 className="font-extrabold text-white text-base">
              سجل بلاغات المواطنين اللحظية وتتبع التذاكر
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-mono font-bold">
              {filteredReports.length} بلاغ
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Wilaya Filter */}
            <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-300">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>الولاية:</span>
              <select
                value={selectedWilaya}
                onChange={(e) => setSelectedWilaya(e.target.value)}
                className="bg-transparent text-emerald-400 font-bold focus:outline-none cursor-pointer"
              >
                {wilayas.map((w) => (
                  <option key={w} value={w} className="bg-slate-900 text-white">
                    {w}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
              <input
                type="text"
                placeholder="بحث برقم التذكرة أو المحل..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-8 pl-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Reports List */}
        <div className="space-y-3">
          {filteredReports.map((report) => {
            const isHighDelta = report.inflationDeltaPct > 30;
            return (
              <div
                key={report.id}
                className={`p-4 rounded-xl border transition-all ${
                  isHighDelta
                    ? 'bg-slate-950/90 border-rose-500/40 hover:border-rose-500'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl ${
                      report.status === 'verified_violation' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                      report.status === 'inspector_dispatched' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    }`}>
                      {report.status === 'verified_violation' ? <ShieldAlert className="w-5 h-5" /> :
                       report.status === 'inspector_dispatched' ? <Clock className="w-5 h-5 animate-spin" /> :
                       <CheckCircle className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                          {report.ticketNumber}
                        </span>
                        <span className="text-xs text-slate-400">
                          {report.wilaya} • {report.baladiya}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {report.createdAt}
                        </span>
                      </div>

                      <h4 className="text-sm font-extrabold text-white mt-1 flex items-center gap-2">
                        <span>{report.storeName}</span>
                        <span className="text-xs font-normal text-slate-400">({report.storeAddress})</span>
                      </h4>

                      <div className="flex items-center gap-3 mt-1 text-xs">
                        <span className="text-slate-300 font-bold">{report.commodityNameAr}:</span>
                        <span className="font-mono text-rose-400 font-bold">
                          المعروض: {report.observedPrice} دج
                        </span>
                        <span className="text-slate-500 font-mono">
                          (السقف: {report.ceilingPrice} دج)
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono font-bold text-[11px] border border-rose-500/30">
                          +{report.inflationDeltaPct}% مضاربة
                        </span>
                      </div>

                      {report.inspectorNotes && (
                        <div className="mt-2 text-xs bg-slate-900/80 p-2 rounded-lg border border-slate-800 text-slate-300">
                          <strong className="text-emerald-400">تقرير المفتش الميداني:</strong> {report.inspectorNotes}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex md:flex-col items-center md:items-end justify-between gap-2 border-t md:border-t-0 pt-2 md:pt-0 border-slate-800">
                    <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold whitespace-nowrap ${
                      report.status === 'verified_violation' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                      report.status === 'inspector_dispatched' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse' :
                      'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}>
                      {report.status === 'verified_violation' && '⚖️ تم تحرير محضر رسمي وغرامة'}
                      {report.status === 'inspector_dispatched' && '🚨 فرقة التفتيش في الموقع'}
                      {report.status === 'triaged' && '⏳ قيد الفرز وتوجيه الدورية'}
                      {report.status === 'pending' && '📥 بلاغ مسجل بالدفتر'}
                    </span>

                    {report.slaMinutesRemaining > 0 && report.status !== 'verified_violation' && (
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
                        مهلة SLA المتبقية: {report.slaMinutesRemaining} دقيقة
                      </span>
                    )}

                    {report.receiptImageUrl && (
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                        صورة الوصل مرفقة
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
