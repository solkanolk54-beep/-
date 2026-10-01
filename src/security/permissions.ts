/**
 * ==============================================================================
 * منظومة كَرِيمَة للرقابة الشاملة والشفافية الرقمية (Kareema Platform)
 * نظام إدارة الصلاحيات والأمان المبني على الأدوار (Role-Based Access Control - RBAC)
 * File: src/security/permissions.ts
 * ==============================================================================
 */

import { UserRole } from '../types';

export type AppRole = 
  | 'citizen'      // مواطن مراقب
  | 'farmer'       // منتج فلاحي
  | 'transporter'  // ناقل لوجستي
  | 'wholesaler'   // وكيل جملة
  | 'retailer'     // تاجر تجزئة
  | 'inspector'    // مفتش قمع الغش
  | 'admin';       // إدارة المنظومة

export type AppPermission =
  // 1. صلاحيات عامة وللمواطنين
  | 'READ_PUBLIC_PRICES'
  | 'SUBMIT_CITIZEN_REPORT'
  | 'VIEW_LEAFLET_MAP'
  
  // 2. صلاحيات المنتج الفلاحي
  | 'MANAGE_FARM_OUTPUT'
  | 'CALCULATE_FARM_GATE'
  | 'ISSUE_QR_PASSPORT'
  
  // 3. صلاحيات الناقل اللوجستي
  | 'TRACK_COLD_CHAIN'
  | 'EXECUTE_GEOFENCE_RADAR'
  | 'UPDATE_TRUCK_TELEMETRY'
  
  // 4. صلاحيات وكيل الجملة
  | 'MANAGE_WHOLESALE_MARGIN'
  | 'CONFIRM_UNLOAD_MANIFEST'
  
  // 5. صلاحيات تاجر التجزئة
  | 'REGISTER_RETAIL_PRICE'
  | 'AUDIT_STORE_CEILING'
  
  // 6. صلاحيات الضبطية القضائية وقمع الغش (قانون 21-15)
  | 'EXECUTE_TSP_OPTIMIZER'
  | 'EXECUTE_AI_RADAR'
  | 'DISPATCH_INSPECTION_PATROL'
  | 'ISSUE_LEGAL_VIOLATION_PV'
  | 'SEIZE_COMMODITY_STOCKS'
  
  // 7. صلاحيات المركزية الوزارية وإدارة المنظومة
  | 'VIEW_CRYPTO_AUDIT_LEDGER'
  | 'MANAGE_SYSTEM_USERS'
  | 'OVERRIDE_PRICE_CEILINGS'
  | 'AUDIT_PGCRYPTO_BLOCKS';

/**
 * مصفوفة الصلاحيات الممنوحة لكل دور في المنظومة
 */
export const ROLE_PERMISSIONS: Record<AppRole, AppPermission[]> = {
  citizen: [
    'READ_PUBLIC_PRICES',
    'SUBMIT_CITIZEN_REPORT',
    'VIEW_LEAFLET_MAP',
  ],

  farmer: [
    'READ_PUBLIC_PRICES',
    'SUBMIT_CITIZEN_REPORT',
    'VIEW_LEAFLET_MAP',
    'MANAGE_FARM_OUTPUT',
    'CALCULATE_FARM_GATE',
    'ISSUE_QR_PASSPORT',
  ],

  transporter: [
    'READ_PUBLIC_PRICES',
    'VIEW_LEAFLET_MAP',
    'TRACK_COLD_CHAIN',
    'EXECUTE_GEOFENCE_RADAR',
    'UPDATE_TRUCK_TELEMETRY',
  ],

  wholesaler: [
    'READ_PUBLIC_PRICES',
    'VIEW_LEAFLET_MAP',
    'MANAGE_WHOLESALE_MARGIN',
    'CONFIRM_UNLOAD_MANIFEST',
  ],

  retailer: [
    'READ_PUBLIC_PRICES',
    'VIEW_LEAFLET_MAP',
    'REGISTER_RETAIL_PRICE',
    'AUDIT_STORE_CEILING',
  ],

  inspector: [
    'READ_PUBLIC_PRICES',
    'SUBMIT_CITIZEN_REPORT',
    'VIEW_LEAFLET_MAP',
    'TRACK_COLD_CHAIN',
    'EXECUTE_GEOFENCE_RADAR',
    'EXECUTE_TSP_OPTIMIZER',
    'EXECUTE_AI_RADAR',
    'DISPATCH_INSPECTION_PATROL',
    'ISSUE_LEGAL_VIOLATION_PV',
    'SEIZE_COMMODITY_STOCKS',
  ],

  admin: [
    'READ_PUBLIC_PRICES',
    'SUBMIT_CITIZEN_REPORT',
    'VIEW_LEAFLET_MAP',
    'MANAGE_FARM_OUTPUT',
    'CALCULATE_FARM_GATE',
    'ISSUE_QR_PASSPORT',
    'TRACK_COLD_CHAIN',
    'EXECUTE_GEOFENCE_RADAR',
    'UPDATE_TRUCK_TELEMETRY',
    'MANAGE_WHOLESALE_MARGIN',
    'CONFIRM_UNLOAD_MANIFEST',
    'REGISTER_RETAIL_PRICE',
    'AUDIT_STORE_CEILING',
    'EXECUTE_TSP_OPTIMIZER',
    'EXECUTE_AI_RADAR',
    'DISPATCH_INSPECTION_PATROL',
    'ISSUE_LEGAL_VIOLATION_PV',
    'SEIZE_COMMODITY_STOCKS',
    'VIEW_CRYPTO_AUDIT_LEDGER',
    'MANAGE_SYSTEM_USERS',
    'OVERRIDE_PRICE_CEILINGS',
    'AUDIT_PGCRYPTO_BLOCKS',
  ],
};

/**
 * دالة تطبيع الأدوار بين الواجهات والأنظمة الخلفية
 */
export function normalizeAppRole(role: string): AppRole {
  if (role === 'producer') return 'farmer';
  if (role === 'logistics') return 'transporter';
  if (role in ROLE_PERMISSIONS) return role as AppRole;
  return 'citizen';
}

/**
 * التحقق من امتلاك الدور لصلاحية معينة
 */
export function hasPermission(role: string, permission: AppPermission): boolean {
  const normalized = normalizeAppRole(role);
  const permissions = ROLE_PERMISSIONS[normalized] || [];
  return permissions.includes(permission);
}

/**
 * التحقق من امتلاك الدور لأي صلاحية من قائمة صلاحيات
 */
export function hasAnyPermission(role: string, permissions: AppPermission[]): boolean {
  const normalized = normalizeAppRole(role);
  const rolePerms = ROLE_PERMISSIONS[normalized] || [];
  return permissions.some((p) => rolePerms.includes(p));
}

/**
 * التحقق من أن الدور الحالي ضمن الأدوار المصرح لها بالوصول
 */
export function isRoleAllowed(currentRole: string, allowedRoles: (AppRole | string)[]): boolean {
  const normalizedCurrent = normalizeAppRole(currentRole);
  const normalizedAllowed = allowedRoles.map(normalizeAppRole);
  return normalizedAllowed.includes(normalizedCurrent);
}

/**
 * بطاقة الهوية الرقمية ومستوى الثقة الأمنية لكل دور
 */
export interface RoleSecurityProfile {
  role: AppRole;
  labelAr: string;
  securityClearance: 'PUBLIC' | 'CONFIDENTIAL' | 'RESTRICTED' | 'SECRET' | 'TOP_SECRET';
  requiresSwornOath: boolean; // هل يتطلب أداء اليمين القانونية (للضبطية القضائية)
  tokenScope: string;
}

export const ROLE_SECURITY_PROFILES: Record<AppRole, RoleSecurityProfile> = {
  citizen: {
    role: 'citizen',
    labelAr: 'مواطن مراقب',
    securityClearance: 'PUBLIC',
    requiresSwornOath: false,
    tokenScope: 'kareema:public:read',
  },
  farmer: {
    role: 'farmer',
    labelAr: 'منتج فلاحي معتمد',
    securityClearance: 'CONFIDENTIAL',
    requiresSwornOath: false,
    tokenScope: 'kareema:producer:write',
  },
  transporter: {
    role: 'transporter',
    labelAr: 'ناقل لوجستي مرخص',
    securityClearance: 'CONFIDENTIAL',
    requiresSwornOath: false,
    tokenScope: 'kareema:logistics:telemetry',
  },
  wholesaler: {
    role: 'wholesaler',
    labelAr: 'وكيل جملة معتمد',
    securityClearance: 'CONFIDENTIAL',
    requiresSwornOath: false,
    tokenScope: 'kareema:wholesale:trade',
  },
  retailer: {
    role: 'retailer',
    labelAr: 'تاجر تجزئة مسجل',
    securityClearance: 'CONFIDENTIAL',
    requiresSwornOath: false,
    tokenScope: 'kareema:retail:pricing',
  },
  inspector: {
    role: 'inspector',
    labelAr: 'مفتش قمع الغش والضبطية القضائية',
    securityClearance: 'SECRET',
    requiresSwornOath: true,
    tokenScope: 'kareema:enforcement:legal',
  },
  admin: {
    role: 'admin',
    labelAr: 'إدارة المنظومة المركزية',
    securityClearance: 'TOP_SECRET',
    requiresSwornOath: true,
    tokenScope: 'kareema:admin:all',
  },
};
