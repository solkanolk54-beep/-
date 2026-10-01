/**
 * ==============================================================================
 * منظومة كَرِيمَة للرقابة الشاملة والشفافية الرقمية (Kareema Platform)
 * مكون شريط التبديل بين أدوار المنظومة (Role/Actor Navigation Switcher)
 * File: src/components/RoleNavigationSwitcher.tsx
 * ==============================================================================
 */

import React, { useRef, useEffect } from 'react';
import { 
  UserCheck, 
  Sprout, 
  Truck, 
  Building2, 
  Store, 
  ShieldCheck, 
  Cpu,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

/**
 * الأنواع المعتمدة للأدوار الفاعلة في المنظومة السيادية
 */
export type PlatformRole = 
  | 'citizen'      // 1. مواطن مراقب
  | 'producer'     // 2. منتج فلاحي
  | 'logistics'    // 3. ناقل لوجستي
  | 'wholesaler'   // 4. وكيل جملة
  | 'retailer'     // 5. تاجر تجزئة
  | 'inspector'    // 6. مفتش قمع الغش
  | 'admin';       // 7. إدارة المنظومة

/**
 * بنية بيانات الميتاداتا التعريفية لكل دور في المنظومة
 */
export interface RoleDefinition {
  id: PlatformRole;
  labelAr: string;
  badgeLabelAr: string;
  descriptionAr: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  badgeCount?: number;
}

/**
 * مصفوفة الأدوار الرسمية بالترتيب المطلوب
 */
export const PLATFORM_ROLES: RoleDefinition[] = [
  {
    id: 'citizen',
    labelAr: 'مواطن مراقب',
    badgeLabelAr: 'الرقابة الشعبية',
    descriptionAr: 'رصد الأسعار الميدانية، مطابقة السعر المسقف، وتقديم البلاغات الموثقة',
    icon: UserCheck,
    accentColor: 'from-emerald-500 to-teal-600',
    badgeCount: 24,
  },
  {
    id: 'producer',
    labelAr: 'منتج فلاحي',
    badgeLabelAr: 'المستثمرات الفلاحية',
    descriptionAr: 'تثبيت تكاليف الإنتاج، سعر باب المزرعة، وإصدار جوازات السفر للشحنات',
    icon: Sprout,
    accentColor: 'from-amber-500 to-orange-600',
  },
  {
    id: 'logistics',
    labelAr: 'ناقل لوجستي',
    badgeLabelAr: 'أساطيل النقل',
    descriptionAr: 'تتبع مسارات PostGIS، التوقيع الجغرافي للشاحنات، ومراقبة التبريد',
    icon: Truck,
    accentColor: 'from-blue-500 to-indigo-600',
    badgeCount: 18,
  },
  {
    id: 'wholesaler',
    labelAr: 'وكيل جملة',
    badgeLabelAr: 'أسواق الجملة',
    descriptionAr: 'إدارة مخازن الإنزال، الفوترة الرقمية، وتحديد هوامش الربح المقننة',
    icon: Building2,
    accentColor: 'from-cyan-500 to-blue-600',
  },
  {
    id: 'retailer',
    labelAr: 'تاجر تجزئة',
    badgeLabelAr: 'نقاط البيع',
    descriptionAr: 'إشهار الأسعار الرسمية، استلام السلع، وإثبات الالتزام بالسقف السعري',
    icon: Store,
    accentColor: 'from-teal-500 to-emerald-700',
  },
  {
    id: 'inspector',
    labelAr: 'مفتش قمع الغش',
    badgeLabelAr: 'الضبطية القضائية',
    descriptionAr: 'توجيه الدوريات الميدانية، تحرير محاضر المخالفات، وتطبيق قانون 21-15',
    icon: ShieldCheck,
    accentColor: 'from-rose-500 to-red-600',
    badgeCount: 7,
  },
  {
    id: 'admin',
    labelAr: 'إدارة المنظومة',
    badgeLabelAr: 'المركزية الوزارية',
    descriptionAr: 'لوحة القيادة التنفيذية، تدقيق سلسلة الكتل pgcrypto، وحوكمة الصلاحيات',
    icon: Cpu,
    accentColor: 'from-purple-500 to-indigo-700',
  },
];

/**
 * خصائص واجهة المكون (Props)
 */
export interface RoleNavigationSwitcherProps {
  currentRole: PlatformRole | string;
  onRoleChange: (role: PlatformRole) => void;
  className?: string;
  showDescriptions?: boolean;
}

/**
 * مكون شريط التبديل التفاعلي بين أدوار المنظومة
 */
export const RoleNavigationSwitcher: React.FC<RoleNavigationSwitcherProps> = ({
  currentRole,
  onRoleChange,
  className = '',
  showDescriptions = false,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // تطبيع معرف الدور للتوافق مع التسميات القديمة (مثل farmer و transporter)
  const normalizedCurrentRole: PlatformRole = (() => {
    if (currentRole === 'farmer') return 'producer';
    if (currentRole === 'transporter') return 'logistics';
    return currentRole as PlatformRole;
  })();

  // تمرير سلس محصور فقط داخل حاوية الأزرار وتفادي استدعاء scrollIntoView المسبب لإنزياح الصفحة في RTL
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const activeBtn = container.querySelector<HTMLElement>('[data-active="true"]');
    if (activeBtn) {
      // حساب التمرير الداخلي المحصور فقط على عنصر الحاوية
      const btnLeft = activeBtn.offsetLeft;
      const btnWidth = activeBtn.offsetWidth;
      const containerWidth = container.clientWidth;
      const targetScroll = btnLeft - (containerWidth / 2) + (btnWidth / 2);

      container.scrollTo({
        left: targetScroll,
        behavior: 'smooth',
      });
    }
  }, [normalizedCurrentRole]);

  // دعم أزرار التمرير اليدوي للشاشات الضيقة داخلياً فقط
  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollOffset = direction === 'left' ? -200 : 200;
      scrollContainerRef.current.scrollBy({ left: scrollOffset, behavior: 'smooth' });
    }
  };

  return (
    <div className={`relative w-full max-w-full overflow-hidden ${className}`} dir="rtl">
      {/* إطار شريط التنقل المتجاوب المحكوم العرض */}
      <div className="relative flex items-center bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800/80 shadow-2xl backdrop-blur-xl w-full max-w-full">
        
        {/* زر التمرير إلى اليمين (للاتجاه العربي RTL) */}
        <button
          type="button"
          onClick={() => scroll('right')}
          className="hidden md:flex items-center justify-center w-7 h-7 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-all shrink-0 flex-shrink-0 ml-1 active:scale-95"
          title="تمرير لليمين"
          aria-label="تمرير لليمين"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* الحاوية القابلة للتمرير الأفقي داخلياً فقط دون التأثير على الصفحة */}
        <div 
          ref={scrollContainerRef}
          role="tablist"
          aria-label="أدوار منظومة كَرِيمَة"
          className="flex items-center gap-1.5 w-full max-w-full overflow-x-auto overscroll-x-contain touch-pan-x py-1 px-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {PLATFORM_ROLES.map((role) => {
            const Icon = role.icon;
            const isActive = normalizedCurrentRole === role.id;

            return (
              <button
                key={role.id}
                role="tab"
                aria-selected={isActive}
                data-active={isActive}
                type="button"
                onClick={() => {
                  // تشغيل المعالج وإلغاء مشكلة الأزرار الميتة
                  onRoleChange(role.id);
                }}
                className={`group relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 select-none outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 shrink-0 flex-shrink-0 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 border border-emerald-400/40 ring-1 ring-emerald-400/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/90 border border-transparent hover:border-slate-800'
                }`}
              >
                {/* الأيقونة الرمزية للدور */}
                <span className={`flex items-center justify-center w-5 h-5 rounded-lg transition-transform duration-200 ${
                  isActive 
                    ? 'text-white scale-110' 
                    : 'text-slate-400 group-hover:text-emerald-400 group-hover:scale-105'
                }`}>
                  <Icon className="w-4 h-4" />
                </span>

                {/* الاسم الرسمي للدور باللغة العربية */}
                <span className="tracking-wide">
                  {role.labelAr}
                </span>

                {/* شارة العداد أو التنبيهات إن وجدت */}
                {role.badgeCount !== undefined && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono transition-colors ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-200'
                  }`}>
                    {role.badgeCount}
                  </span>
                )}

                {/* نقطة الإضاءة النبضية للدور النشط */}
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-300 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {/* زر التمرير إلى اليسار (للاتجاه العربي RTL) */}
        <button
          type="button"
          onClick={() => scroll('left')}
          className="hidden md:flex items-center justify-center w-7 h-7 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-all shrink-0 mr-1 active:scale-95"
          title="تمرير لليسار"
          aria-label="تمرير لليسار"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* شريط الوصف التفصيلي للدور المختار حالياً (اختياري) */}
      {showDescriptions && (
        <div className="mt-2.5 px-4 py-2 rounded-xl bg-slate-900/60 border border-slate-800/60 text-xs text-slate-400 flex items-center justify-between animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-white font-bold">
              {PLATFORM_ROLES.find(r => r.id === normalizedCurrentRole)?.labelAr}:
            </span>
            <span className="text-slate-300">
              {PLATFORM_ROLES.find(r => r.id === normalizedCurrentRole)?.descriptionAr}
            </span>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-900/50">
            {PLATFORM_ROLES.find(r => r.id === normalizedCurrentRole)?.badgeLabelAr}
          </span>
        </div>
      )}
    </div>
  );
};
