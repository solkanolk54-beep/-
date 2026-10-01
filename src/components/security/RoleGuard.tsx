/**
 * ==============================================================================
 * منظومة كَرِيمَة للرقابة الشاملة والشفافية الرقمية (Kareema Platform)
 * مكون حماية العرض وتفويض الصلاحيات (RoleGuard High-Order Security Component)
 * File: src/components/security/RoleGuard.tsx
 * ==============================================================================
 */

import React from 'react';
import { 
  AppRole, 
  AppPermission, 
  isRoleAllowed, 
  hasPermission, 
  ROLE_SECURITY_PROFILES, 
  normalizeAppRole 
} from '../../security/permissions';
import { ShieldAlert, Lock, AlertTriangle, KeyRound } from 'lucide-react';

export interface RoleGuardProps {
  /**
   * قائمة الأدوار المسموح لها بالوصول وعرض المحتوى المحمي
   */
  allowedRoles: (AppRole | string)[];

  /**
   * الدور الحالي للمستخدم المسجل أو النشط في الجلسة
   */
  currentRole: string;

  /**
   * صلاحية دقيقة اختيارية مطلوبة للمحتوى
   */
  requiredPermission?: AppPermission;

  /**
   * المحتوى المحمي الحساس الذي سيتم عرضه فقط في حال توافر الصلاحية
   */
  children: React.ReactNode;

  /**
   * واجهة بديلة مخصصة عند حظر الوصول (اختياري)
   */
  fallback?: React.ReactNode;

  /**
   * إخفاء تام بدون رسالة (Quiet mode)
   */
  silent?: boolean;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  allowedRoles,
  currentRole,
  requiredPermission,
  children,
  fallback,
  silent = false,
}) => {
  const normalizedCurrent = normalizeAppRole(currentRole);
  const isAllowed = isRoleAllowed(normalizedCurrent, allowedRoles);
  const hasRequiredPerm = requiredPermission ? hasPermission(normalizedCurrent, requiredPermission) : true;

  // 1. إذا كان المستخدم يملك الدور والصلاحية المسموحة: يتم عرض المحتوى
  if (isAllowed && hasRequiredPerm) {
    return <>{children}</>;
  }

  // 2. إذا تم تفعيل الوضع الصامت: إخفاء تام من شجرة الـ DOM
  if (silent) {
    return null;
  }

  // 3. إذا تم توفير مكون بديل مخصص:
  if (fallback) {
    return <>{fallback}</>;
  }

  // 4. عرض رسالة التنبيه الأمني السيادي الرسمية (403 Forbidden Shield)
  const currentProfile = ROLE_SECURITY_PROFILES[normalizedCurrent];
  const requiredRolesLabels = allowedRoles
    .map((r) => ROLE_SECURITY_PROFILES[normalizeAppRole(r)]?.labelAr || r)
    .join(' أو ');

  return (
    <div 
      role="alert"
      aria-live="assertive"
      className="w-full max-w-full rounded-2xl bg-gradient-to-br from-rose-950/60 via-slate-950 to-slate-950 border border-rose-800/80 p-6 shadow-2xl text-right animate-in fade-in zoom-in-95 duration-200"
      dir="rtl"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-rose-900/40 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0 ring-2 ring-rose-500/20 shadow-lg shadow-rose-950/80">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-800">
                HTTP 403 FORBIDDEN
              </span>
              <span className="text-xs text-rose-400 font-mono">
                بروتوكول الأمان RBAC-POL-2026
              </span>
            </div>
            <h3 className="text-base font-black text-white mt-1">
              غير مصرح بالوصول لهذا القسم الإداري / الميداني
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
          <Lock className="w-3.5 h-3.5 text-rose-400" />
          <span>المستوى المطلوب: RESTRICTED</span>
        </div>
      </div>

      <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
        <p>
          لقد حاولت الوصول إلى وحدة تشغيلية محمية تتطلب اعتماداً رسمياً. صفة الحساب الحالية: {' '}
          <strong className="text-white font-bold font-mono">
            [{currentProfile?.labelAr || currentRole}]
          </strong>.
        </p>

        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1.5 font-mono text-[11px]">
          <div className="flex justify-between text-slate-400">
            <span>الأدوار المسموح لها حصرياً بالتشغيل:</span>
            <span className="text-amber-400 font-bold">{requiredRolesLabels}</span>
          </div>
          {requiredPermission && (
            <div className="flex justify-between text-slate-400">
              <span>الصلاحية الإلزامية المطلوبة:</span>
              <span className="text-rose-400 font-bold">{requiredPermission}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-400">
            <span>بروتوكول التفويض الأمني:</span>
            <span className="text-emerald-400">Zero-Trust Role Enforcement</span>
          </div>
        </div>

        <p className="text-[11px] text-slate-400">
          * يخضع هذا المسار للرقابة الآلية وسجل التدقيق المشفر بموجب مقتضيات قانون مكافحة المضاربة غير المشروعة رقم 21-15. للترقية إلى حساب مفتش معتمد أو مسؤول وزاري، يرجى التبديل من شريط الأدوار أو تقديم بطاقة التفويض الرقمية.
        </p>
      </div>
    </div>
  );
};
