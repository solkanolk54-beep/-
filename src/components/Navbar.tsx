import React from 'react';
import { UserRole } from '../types';
import { 
  ShieldCheck, 
  MapPin, 
  Cpu, 
  AlertTriangle, 
  PlusCircle, 
  Building2, 
  Truck, 
  Store, 
  UserCheck, 
  FileText
} from 'lucide-react';

interface NavbarProps {
  currentRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenReportModal: () => void;
  lang: 'ar' | 'en';
  onToggleLang: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onSelectRole,
  activeTab,
  onSelectTab,
  onOpenReportModal,
  lang,
  onToggleLang,
}) => {
  const roleLabels: Record<UserRole, { labelAr: string; icon: React.ReactNode; color: string }> = {
    citizen: { labelAr: 'مواطن مراقب', icon: <UserCheck className="w-4 h-4" />, color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' },
    farmer: { labelAr: 'منتج فلاحي', icon: <span className="text-sm">🌾</span>, color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
    transporter: { labelAr: 'ناقل لوجستي', icon: <Truck className="w-4 h-4" />, color: 'bg-blue-500/20 text-blue-400 border-blue-500/40' },
    wholesaler: { labelAr: 'وكيل جملة', icon: <Building2 className="w-4 h-4" />, color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' },
    retailer: { labelAr: 'تاجر تجزئة', icon: <Store className="w-4 h-4" />, color: 'bg-teal-500/20 text-teal-300 border-teal-500/40' },
    inspector: { labelAr: 'مفتش قمع الغش', icon: <ShieldCheck className="w-4 h-4" />, color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
    admin: { labelAr: 'إدارة المنظومة', icon: <Cpu className="w-4 h-4" />, color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
  };

  const navTabs = [
    { id: 'execution-workbench', labelAr: 'مختبر التشغيل البرمجي (4 Modules)', labelEn: 'Execution Workbench', icon: '⚡' },
    { id: 'farm-to-fork', labelAr: 'سلسلة القيمة والسعر العادل', labelEn: 'Farm-to-Fork Engine', icon: '🌾' },
    { id: 'passport-trace', labelAr: 'جواز الشحنة والتتبع (QR)', labelEn: 'Supply Chain Passport', icon: '📦' },
    { id: 'citizen-reporting', labelAr: 'الرقابة الشعبية والأسواق', labelEn: 'Citizen Reports & Map', icon: '👥' },
    { id: 'inspector-tasking', labelAr: 'غرفة التفتيش والتدقيق', labelEn: 'Inspection Tasking & Ledger', icon: '🛡️' },
    { id: 'ai-analytics', labelAr: 'رادار كشف الشذوذ (AI)', labelEn: 'AI Anomaly Radar', icon: '🧠' },
    { id: 'architecture-docs', labelAr: 'المعمارية والأكواد (DDL)', labelEn: 'Architecture & DDLs', icon: '📋' },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 shadow-xl backdrop-blur-md bg-opacity-95">
      {/* Top sovereign indicator bar */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 px-4 py-1.5 border-b border-emerald-900/40 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            الجمهورية الجزائرية الديمقراطية الشعبية - وزارة الفلاحة والتجارة
          </span>
          <span className="hidden md:inline text-slate-600">|</span>
          <span className="hidden md:flex items-center gap-1 text-slate-400">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            PostGIS 3.4 &amp; Redis 7 Active
          </span>
        </div>
        
        <div className="flex items-center gap-4 text-xs">
          <div className="hidden lg:flex items-center gap-2">
            <span className="text-slate-400">معدل الامتثال الوطني:</span>
            <span className="text-emerald-400 font-bold font-mono">92.4%</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">الشحنات النشطة:</span>
            <span className="text-cyan-400 font-bold font-mono">4,120</span>
          </div>

          <button
            onClick={onToggleLang}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-mono text-[11px] transition-colors"
          >
            {lang === 'ar' ? 'English' : 'عربي (RTL)'}
          </button>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center shadow-lg shadow-emerald-900/30 border border-emerald-400/30 ring-2 ring-emerald-500/20">
            <span className="text-2xl font-bold">🌾</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                منظومة كَرِيمَة
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
                  للرقابة والشفافية
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              المنصة السيادية للشفافية السعرية، تتبع سلاسل الإمداد ومكافحة المضاربة
            </p>
          </div>
        </div>

        {/* Center: Role Switcher Simulation */}
        <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 hidden xl:inline px-2">الدور الحالي:</span>
          <div className="flex items-center gap-1 overflow-x-auto max-w-[340px] sm:max-w-none">
            {(Object.keys(roleLabels) as UserRole[]).map((role) => {
              const info = roleLabels[role];
              const isSelected = currentRole === role;
              return (
                <button
                  key={role}
                  onClick={() => onSelectRole(role)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    isSelected
                      ? `${info.color} border shadow-sm`
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {info.icon}
                  <span>{info.labelAr}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right CTA: Citizen quick report button */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenReportModal}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-950/50 transition-all border border-rose-400/30 active:scale-95"
          >
            <AlertTriangle className="w-4 h-4 animate-bounce" />
            <span>تبليغ فوري عن مضاربة</span>
          </button>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="border-t border-slate-800/80 bg-slate-950/60 px-4">
        <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto scrollbar-none py-1">
          {navTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{lang === 'ar' ? tab.labelAr : tab.labelEn}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
