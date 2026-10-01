import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CitizenReport } from '../../types';
import { 
  MapPin, 
  Layers, 
  Maximize2, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle, 
  Crosshair, 
  Navigation,
  Info
} from 'lucide-react';

interface CitizenReportsLeafletMapProps {
  reports: CitizenReport[];
  selectedReport?: CitizenReport | null;
  onSelectReport?: (report: CitizenReport) => void;
}

export const CitizenReportsLeafletMap: React.FC<CitizenReportsLeafletMapProps> = ({
  reports,
  selectedReport,
  onSelectReport,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const onSelectReportRef = useRef(onSelectReport);
  const lastReportsSignatureRef = useRef<string>('');

  useEffect(() => {
    onSelectReportRef.current = onSelectReport;
  }, [onSelectReport]);

  const [activeFilter, setActiveFilter] = useState<'all' | 'critical' | 'dispatched'>('all');
  const [selectedPin, setSelectedPin] = useState<CitizenReport | null>(null);
  const [mapCenterCoords, setMapCenterCoords] = useState<{ lat: number; lng: number }>({
    lat: 36.5,
    lng: 3.1,
  });

  // تصفية البلاغات حسب المعيار المختار في الخريطة مع الذاكرة المؤقتة (useMemo)
  const displayedReports = useMemo(() => {
    return reports.filter((rep) => {
      if (activeFilter === 'critical') return rep.inflationDeltaPct >= 40 || rep.status === 'verified_violation';
      if (activeFilter === 'dispatched') return rep.status === 'inspector_dispatched';
      return true;
    });
  }, [reports, activeFilter]);

  const reportsSignature = useMemo(() => {
    return displayedReports.map((r) => `${r.id}_${r.status}_${r.observedPrice}`).join('|');
  }, [displayedReports]);

  // تهيئة خريطة Leaflet
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // مركز الجزائر الشمالية (خط عرض 36.2، خط طول 3.2 تقريباً)
    const map = L.map(mapContainerRef.current, {
      center: [36.25, 3.25],
      zoom: 7,
      minZoom: 5,
      maxZoom: 18,
      zoomControl: false,
    });

    // إضافة أزرار التكبير في الزاوية العلوية اليمنى
    L.control.zoom({ position: 'topright' }).addTo(map);

    // طبقة الخرائط الداكنة عالية الجودة (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap contributors',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    // مجموعة طبقات العلامات
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    // استماع لحركة الخريطة لتحديث الإحداثيات عند توقف الحركة فقط (moveend) لمنع الحلقات اللانهائية
    map.on('moveend', () => {
      const center = map.getCenter();
      const newLat = Math.round(center.lat * 1000) / 1000;
      const newLng = Math.round(center.lng * 1000) / 1000;
      setMapCenterCoords((prev) => {
        if (prev.lat === newLat && prev.lng === newLng) return prev;
        return { lat: newLat, lng: newLng };
      });
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // تحديث نقاط البلاغات على الخريطة عند تغير البيانات أو الفلتر
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    const bounds: L.LatLngBounds = L.latLngBounds([]);

    displayedReports.forEach((rep) => {
      const [lat, lng] = rep.coordinates;
      if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) return;

      bounds.extend([lat, lng]);

      // تحديد أسلوب الأيقونة حسب خطورة المخالفة
      const isCritical = rep.inflationDeltaPct >= 40 || rep.status === 'verified_violation';
      const isDispatched = rep.status === 'inspector_dispatched';

      const pinColor = isCritical ? '#f43f5e' : isDispatched ? '#38bdf8' : '#fbbf24';
      const pulseHtml = isCritical
        ? `<span class="absolute -inset-1.5 rounded-full bg-rose-500/40 animate-ping"></span>`
        : '';

      const customIcon = L.divIcon({
        className: 'custom-leaflet-pin',
        html: `
          <div class="relative flex items-center justify-center cursor-pointer group" style="width: 38px; height: 38px;">
            ${pulseHtml}
            <div style="background-color: ${pinColor}; box-shadow: 0 0 12px ${pinColor}88;"
                 class="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-lg transition-transform group-hover:scale-125">
              ${rep.commodityId.includes('meat') ? '🥩' : rep.commodityId.includes('sardine') ? '🐟' : rep.commodityId.includes('potato') ? '🥔' : '🍅'}
            </div>
            <div class="absolute -bottom-1 w-2 h-2 rotate-45 border-r border-b border-white" style="background-color: ${pinColor};"></div>
          </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 36],
        popupAnchor: [0, -36],
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      // محتوى النافذة المنبثقة الغني
      const popupContent = `
        <div style="direction: rtl; font-family: 'Segoe UI', Tahoma, sans-serif; min-width: 220px;" class="p-1 text-slate-900">
          <div style="font-weight: 800; font-size: 13px; color: #0f172a; margin-bottom: 4px;">
            ${rep.storeName}
          </div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">
            ولاية ${rep.wilaya} • بلدية ${rep.baladiya}
          </div>
          <div style="background-color: #f1f5f9; padding: 6px 8px; border-radius: 6px; margin-bottom: 6px; font-size: 11px;">
            <div><strong>المادة:</strong> ${rep.commodityNameAr}</div>
            <div><strong>السعر المعروض:</strong> <span style="color: #e11d48; font-weight: bold;">${rep.observedPrice} د.ج</span></div>
            <div><strong>السقف القانوني:</strong> <span style="color: #16a34a; font-weight: bold;">${rep.ceilingPrice} د.ج</span></div>
            <div><strong>فارق التجاوز:</strong> <span style="color: #dc2626; font-weight: bold;">+${rep.inflationDeltaPct}%</span></div>
          </div>
          <div style="font-size: 10px; color: #475569; margin-bottom: 4px;">
            <strong>رقم التذكرة:</strong> ${rep.ticketNumber}
          </div>
          <div style="font-size: 10px; color: #0284c7;">
            GPS Fix: ${lat.toFixed(4)}, ${lng.toFixed(4)}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        className: 'kareema-leaflet-popup',
      });

      marker.on('click', () => {
        setSelectedPin(rep);
        onSelectReportRef.current?.(rep);
      });

      markersLayer.addLayer(marker);
    });

    // تركيز الكاميرا التلقائي فقط عند تغير معطيات التقارير الفعلية
    if (bounds.isValid() && displayedReports.length > 0 && lastReportsSignatureRef.current !== reportsSignature) {
      lastReportsSignatureRef.current = reportsSignature;
      map.fitBounds(bounds, {
        padding: [45, 45],
        maxZoom: 12,
      });
    }
  }, [displayedReports, reportsSignature]);

  // دالة التقريب إلى ولاية معينة
  const zoomToWilaya = (coords: [number, number], zoomLevel: number = 11) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(coords, zoomLevel, {
        duration: 1.2,
      });
    }
  };

  return (
    <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <MapPin className="w-4 h-4 animate-bounce" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              الخريطة التفاعلية الحية لبلاغات المواطنين (PostGIS &amp; Leaflet Map)
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {displayedReports.length} بلاغ معروض
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              تحديد مكاني دقيق لنقاط البيع المخالفة للسقف المقنن استناداً إلى إحداثيات GPS المرفقة بالبلاغ
            </p>
          </div>
        </div>

        {/* Quick Filter Badges */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              activeFilter === 'all'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            الكل ({reports.length})
          </button>
          <button
            onClick={() => setActiveFilter('critical')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
              activeFilter === 'critical'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-rose-400 hover:text-rose-300'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            حرجة &gt; 40%
          </button>
          <button
            onClick={() => setActiveFilter('dispatched')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
              activeFilter === 'dispatched'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-cyan-400 hover:text-cyan-300'
            }`}
          >
            <ShieldAlert className="w-3 h-3" />
            دوريات موجهة
          </button>
        </div>
      </div>

      {/* Wilaya Jump Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-[11px] text-slate-500 flex items-center gap-1 flex-shrink-0">
          <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
          الانتقال المباشر:
        </span>

        {[
          { name: 'الجزائر العاصمة', coords: [36.772, 3.058] as [number, number] },
          { name: 'وهران', coords: [35.696, -0.633] as [number, number] },
          { name: 'البليدة', coords: [36.495, 2.856] as [number, number] },
          { name: 'قسنطينة', coords: [36.321, 6.634] as [number, number] },
          { name: 'كامل التراب الوطني', coords: [36.25, 3.25] as [number, number], zoom: 6 },
        ].map((w, idx) => (
          <button
            key={idx}
            onClick={() => zoomToWilaya(w.coords, w.zoom || 11)}
            className="flex-shrink-0 px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[11px] transition-colors"
          >
            {w.name}
          </button>
        ))}
      </div>

      {/* Map Container */}
      <div className="relative rounded-xl overflow-hidden border border-slate-800 shadow-inner bg-slate-950">
        <div 
          ref={mapContainerRef} 
          className="w-full h-80 z-0" 
          style={{ minHeight: '320px' }}
        />

        {/* Live GPS Coordinate Overlay Bar */}
        <div className="absolute bottom-2 left-2 z-[400] bg-slate-900/90 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-slate-800 text-[10px] text-slate-400 font-mono flex items-center gap-2 shadow-lg">
          <Navigation className="w-3 h-3 text-emerald-400 animate-spin" />
          <span>PostGIS WGS-84: {mapCenterCoords.lat}° N, {mapCenterCoords.lng}° E</span>
        </div>

        {/* Map Legend Overlay */}
        <div className="absolute top-2 left-2 z-[400] bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1 shadow-lg">
          <div className="flex items-center gap-1.5 font-bold text-white mb-1">
            <Layers className="w-3 h-3 text-cyan-400" />
            <span>دليل العلامات المكانية:</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px]">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50"></span>
            <span>مخالفة حرجة (&gt; 40% تجاوز أو مثبتة)</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px]">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span>شبهة سعرية قيد التدقيق</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px]">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
            <span>دورية تفتيش في طريقها للمحل</span>
          </div>
        </div>
      </div>

      {/* Selected Pin Details Footer Card */}
      {selectedPin && (
        <div className="p-3 bg-slate-950 rounded-xl border border-emerald-500/40 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-lg flex-shrink-0">
              {selectedPin.commodityId.includes('meat') ? '🥩' : selectedPin.commodityId.includes('sardine') ? '🐟' : selectedPin.commodityId.includes('potato') ? '🥔' : '🍅'}
            </div>
            <div>
              <div className="font-extrabold text-white text-sm flex items-center gap-2">
                {selectedPin.storeName}
                <span className="text-xs text-slate-400 font-normal">
                  ({selectedPin.baladiya}، {selectedPin.wilaya})
                </span>
              </div>
              <div className="flex items-center gap-3 text-slate-400 text-[11px] mt-0.5">
                <span>المادة: <strong className="text-slate-200">{selectedPin.commodityNameAr}</strong></span>
                <span>السعر: <strong className="text-rose-400 font-mono">{selectedPin.observedPrice} د.ج</strong></span>
                <span>السقف: <strong className="text-emerald-400 font-mono">{selectedPin.ceilingPrice} د.ج</strong></span>
                <span className="font-mono font-bold text-rose-400">+{selectedPin.inflationDeltaPct}% خرق</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-1 rounded border border-slate-800">
              {selectedPin.ticketNumber}
            </span>
            <button
              onClick={() => {
                if (onSelectReport) onSelectReport(selectedPin);
              }}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-md"
            >
              فحص التذكرة
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
