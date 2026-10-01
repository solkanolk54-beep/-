import React, { useState } from 'react';
import { ARCHITECTURE_DELIVERABLES, DeliverableItem } from '../../data/deliverablesData';
import { 
  FileCode, 
  Copy, 
  Check, 
  Layers, 
  Database, 
  Terminal, 
  Smartphone, 
  Box, 
  MapPin,
  Cpu,
  Navigation,
  QrCode,
  ShieldAlert
} from 'lucide-react';

export const ArchitectureDeliverablesView: React.FC = () => {
  const [selectedItem, setSelectedItem] = useState<DeliverableItem>(ARCHITECTURE_DELIVERABLES[0]);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (selectedItem.codeSnippet) {
      navigator.clipboard.writeText(selectedItem.codeSnippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'geofence': return <MapPin className="w-4 h-4 text-emerald-400" />;
      case 'radar_api': return <Cpu className="w-4 h-4 text-purple-400" />;
      case 'queue_tsp': return <Navigation className="w-4 h-4 text-cyan-400" />;
      case 'flutter_scanner': return <QrCode className="w-4 h-4 text-amber-400" />;
      case 'flutter_build': return <Smartphone className="w-4 h-4 text-emerald-400" />;
      case 'architecture': return <Layers className="w-4 h-4 text-cyan-400" />;
      case 'database': return <Database className="w-4 h-4 text-emerald-400" />;
      case 'docker': return <Box className="w-4 h-4 text-blue-400" />;
      default: return <FileCode className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                المخرجات الهندسية والملفات التنفيذية
              </span>
              <span className="text-xs text-slate-400 font-mono">Production-Ready Architecture</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white">
              المواصفات البرمجية، جداول PostGIS، وملفات Docker و Flutter
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
              توثيق هندسي متكامل ومخططات قابلة للنسخ والتشغيل المباشر في بيئة الإنتاج السحابية (Enterprise Grade).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 shadow-lg transition-all"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'تم النسخ إلى الحافظة' : 'نسخ الشيفرة المحددة'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Container: Sidebar of Deliverables & Code Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Navigation: Deliverables items */}
        <div className="lg:col-span-4 space-y-2">
          {ARCHITECTURE_DELIVERABLES.map((item) => {
            const isSelected = selectedItem.id === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`w-full text-right p-4 rounded-xl border transition-all flex items-start gap-3 ${
                  isSelected
                    ? 'bg-slate-850 border-cyan-500/60 shadow-lg ring-1 ring-cyan-500/40 text-white'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 mt-0.5">
                  {getCategoryIcon(item.category)}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold leading-tight">
                    {item.titleAr}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-1">
                    {item.fileName}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Code Display Canvas */}
        <div className="lg:col-span-8 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col">
          {/* Header bar of code viewer */}
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
              <span className="text-xs font-mono font-bold text-slate-300 mr-2">
                {selectedItem.fileName}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-400 uppercase">
                {selectedItem.language}
              </span>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Description of current deliverable */}
          <div className="p-4 bg-slate-900/60 border-b border-slate-800 text-xs text-slate-300 leading-relaxed">
            {selectedItem.descriptionAr}
          </div>

          {/* Syntax Code Body */}
          <div className="p-4 overflow-x-auto flex-1 font-mono text-xs text-slate-300 bg-slate-950/90 leading-relaxed max-h-[580px] scrollbar-thin">
            <pre className="whitespace-pre font-mono text-[11.5px]">
              <code>{selectedItem.codeSnippet}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
