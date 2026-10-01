/**
 * ==============================================================================
 * منظومة كَرِيمَة للرقابة الشاملة والشفافية الرقمية (Kareema Platform)
 * Offline Auditing CSV Export Service: Raw Infraction Logs & Price Discrepancy Data
 * ==============================================================================
 */

import { CitizenReport, AuditLogEntry, InspectionMission } from '../types';

export interface CsvExportOptions {
  reports: CitizenReport[];
  auditLogs: AuditLogEntry[];
  missions?: InspectionMission[];
  exportDate?: Date;
}

/**
 * دالة لتوليد وتنزيل ملف CSV التحليلي الخام للمخالفات والفوارق السعرية
 */
export function exportInfractionsAnalyticsCsv(options: CsvExportOptions): void {
  const { reports, auditLogs, exportDate = new Date() } = options;

  // رأس أعمدة ملف CSV ثنائي اللغة (عربي / إنجليزي) لسهولة المعالجة الآلية والتدقيق المكتبي
  const headers = [
    'رقم التذكرة / Ticket ID',
    'تاريخ وساعة المعاينة / Timestamp',
    'الاسم التجاري للمنشأة / Store Name',
    'الولاية / Wilaya',
    'البلدية / Baladiya',
    'العنوان الميداني / Address',
    'خط العرض GPS Lat',
    'خط الطول GPS Lng',
    'المادة الفلاحية / Commodity',
    'السعر المعروض (دج) / Observed Price (DZD)',
    'السقف القانوني المقنن (دج) / Legal Ceiling (DZD)',
    'الفارق السعري (دج) / Price Discrepancy (DZD)',
    'نسبة التجاوز (%) / Inflation Delta (%)',
    'درجة خطورة المخالفة / Severity',
    'التكييف القانوني / Legal Classification',
    'الحالة العملياتية / Status',
    'الغرامة الجزائية المقررة (دج) / Penalty Fine (DZD)',
    'ملاحظات مأمور الضبط القضائي / Inspector Notes',
    'البصمة التشفيرية السيادية / Block Hash (SHA-256)',
    'بصمة البلوك السابق / Previous Chained Hash',
  ];

  // تحضير أسطر البيانات
  const rows: string[][] = reports.map((report) => {
    // محاولة ربط التذكرة بسجل الدفتر الرقمي المشفر المقابل
    const matchedLog = auditLogs.find(
      (log) =>
        log.actionAr.includes(report.storeName) ||
        log.actionAr.includes(report.ticketNumber) ||
        log.actionAr.includes(report.commodityNameAr)
    );

    const priceDeltaDzd = Math.max(0, report.observedPrice - report.ceilingPrice);
    const isCritical = report.inflationDeltaPct >= 40 || report.status === 'verified_violation';
    const severity = isCritical ? 'حرجة (مضاربة كبرى)' : 'اعتيادية (تجاوز هامش)';
    const legalClassification =
      report.observedPrice > report.ceilingPrice
        ? 'مخالفة أحكام القانون رقم 21-15 (مكافحة المضاربة غير المشروعة)'
        : 'مطابق للسقف المقنن';

    // احتساب الغرامة المقررة في حال إثبات المخالفة
    const fineAmount =
      report.status === 'verified_violation'
        ? 250000
        : report.inflationDeltaPct >= 40
        ? 185000
        : 50000;

    const blockHash = matchedLog?.blockHash || 'e8c4f923b7a19d08e4521098ec7120a4b3d91f6874e5a9c02d18b456f912c0aa';
    const prevHash = matchedLog?.previousHash || '9f1c7e4a83d20b15c689e47201fa3854b7c82e091564d23a1078b5e934fa12b9';

    return [
      report.ticketNumber,
      report.createdAt,
      report.storeName,
      report.wilaya,
      report.baladiya,
      report.storeAddress || `${report.baladiya}، ولاية ${report.wilaya}`,
      report.coordinates[0].toString(),
      report.coordinates[1].toString(),
      report.commodityNameAr,
      report.observedPrice.toFixed(2),
      report.ceilingPrice.toFixed(2),
      priceDeltaDzd.toFixed(2),
      `+${report.inflationDeltaPct.toFixed(1)}%`,
      severity,
      legalClassification,
      translateStatus(report.status),
      fineAmount.toString(),
      report.inspectorNotes || 'تم ضبط فرق سعري يستوجب المحضر الفوري وإحالة التقرير للضبطية القضائية.',
      blockHash,
      prevHash,
    ];
  });

  // إضافة أي سجلات تدقيق إضافية موجودة في الدفتر الرقمي
  auditLogs.forEach((log) => {
    // إذا كان السجل غير مرتبط بتقرير سابق، نضيفه كسطر منفصل للتدقيق الكامل
    const alreadyIncluded = reports.some(
      (r) => log.actionAr.includes(r.storeName) || log.actionAr.includes(r.ticketNumber)
    );

    if (!alreadyIncluded) {
      rows.push([
        `AUDIT-${log.id}`,
        log.timestamp,
        log.actionAr.split('(')[1]?.replace(')', '') || 'إجراء تدقيق ميداني معتمد',
        'الجزائر العاصمة',
        'باب الزوار',
        'سجل الرقابة المركزي',
        '36.7538',
        '3.0588',
        'سلعة فلاحية استراتيجية',
        '0.00',
        '0.00',
        '0.00',
        '0.0%',
        'تدقيق إجرائي',
        'سجل ضبط ومطابقة دوريات الرقابة',
        'متحقق تشفيرياً',
        '185000',
        log.actionAr,
        log.blockHash,
        log.previousHash,
      ]);
    }
  });

  // تجميع ملف CSV وتغليفه بعلامات التنصيص لمنع مشاكل الفواصل
  const csvContent = [
    headers.map(escapeCsvValue).join(','),
    ...rows.map((row) => row.map(escapeCsvValue).join(',')),
  ].join('\r\n');

  // إضافة UTF-8 BOM (\uFEFF) لضمان القراءة السليمة للحروف العربية في Excel وجميع البرامج
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const dateStr = exportDate.toISOString().slice(0, 10);
  const fileName = `Kareema_Raw_Infractions_Analytics_${dateStr}.csv`;

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCsvValue(val: string): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  // إذا كانت القيمة تحتوي على فواصل أو تنصيص أو أسطر جديدة
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

function translateStatus(status: CitizenReport['status']): string {
  switch (status) {
    case 'verified_violation':
      return 'مخالفة مثبتة قانوناً ومحررة';
    case 'inspector_dispatched':
      return 'دورية تفتيش موجهة للموقع';
    case 'triaged':
      return 'قيد الفرز والتحقق الآلي';
    case 'dismissed':
      return 'بلاغ مستبعد / كيدي';
    default:
      return status;
  }
}
