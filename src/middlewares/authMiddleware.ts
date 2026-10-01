/**
 * ==============================================================================
 * منظومة كَرِيمَة للرقابة الشاملة والشفافية الرقمية (Kareema Platform)
 * وسيط التحقق الأمني من الأدوار والصلاحيات (RBAC Express Guard Middleware)
 * File: src/middlewares/authMiddleware.ts
 * ==============================================================================
 */

import { Request, Response, NextFunction } from 'express';
import { normalizeAppRole, isRoleAllowed, AppRole } from '../security/permissions';

export interface AuthenticatedUser {
  role: AppRole;
  token?: string;
  badgeNumber?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * وسيط التحقق من الصلاحيات المبنية على الأدوار للواجهات الخلفية
 * @param allowedRoles قائمة الأدوار المسموح لها باستدعاء مسار الـ API
 */
export function checkRole(allowedRoles: (AppRole | string)[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // استخراج الدور من الترويسة x-user-role أو من ترويسة التفويض Authorization
    const roleHeader = (req.headers['x-user-role'] as string) || '';
    const authHeader = (req.headers['authorization'] as string) || '';

    let userRole = roleHeader;

    // دعم استخراج الدور من Bearer Token المحاكى أو المشفر
    if (!userRole && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      if (token.includes('inspector') || token.includes('INSPECTOR')) {
        userRole = 'inspector';
      } else if (token.includes('admin') || token.includes('ADMIN')) {
        userRole = 'admin';
      } else {
        userRole = 'citizen';
      }
    }

    // إذا لم يتم تمرير أي دور في الترويسة، يتم التعيين الافتراضي إلى 'citizen'
    if (!userRole) {
      userRole = 'citizen';
    }

    const normalizedRole = normalizeAppRole(userRole);

    // التحقق من تطابق الدور مع الأدوار المسموح لها
    if (!isRoleAllowed(normalizedRole, allowedRoles)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN_ROLE_ACCESS',
          message: 'غير مصرح بالوصول: هذا المسار البرمجي محمي ومخصص حصرياً لجهات الرقابة المعتمدة بموجب القانون 21-15.',
          requiredRoles: allowedRoles,
          currentRole: normalizedRole,
          timestamp: new Date().toISOString(),
          securityPolicy: 'RBAC-ZERO-TRUST-V1',
        },
      });
      return;
    }

    // إرفاق بيانات المستخدم المصادق في كائن الطلب Request
    req.user = {
      role: normalizedRole,
      badgeNumber: req.headers['x-badge-number'] as string || undefined,
    };

    next();
  };
}
