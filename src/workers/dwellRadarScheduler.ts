/**
 * ==============================================================================
 * منظومة كَرِيمَة للرقابة الشاملة والشفافية الرقمية (Kareema Platform)
 * خادم الاستشعار الآلي: رادار كشف التوقف المشبوه ومكافحة الاحتكار
 * File: src/workers/dwellRadarScheduler.ts
 * ==============================================================================
 */

import cron, { ScheduledTask } from 'node-cron';
import { Pool, PoolConfig, PoolClient } from 'pg';
import tls from 'tls';
import fs from 'fs';

/**
 * خيارات تهيئة خدمة جدولة الرادار
 */
export interface RadarSchedulerOptions {
  cronExpression?: string;     // التعبير الزمني للجدولة (الافتراضي: '*/15 * * * *' كل 15 دقيقة)
  hoursThreshold?: number;     // عتبة ساعات التوقف المشبوه غير المرخص (الافتراضي: 4 ساعات)
  radiusMeters?: number;       // محيط الأمان المكاني بالمتر حول منشآت التخزين المرخصة (الافتراضي: 200 متر)
  runImmediately?: boolean;     // تنفيذ فحص أولي فوري عند إقلاع الخدمة
  poolConfig?: PoolConfig;     // إعدادات مخصصة لمجمع الاتصال
}

/**
 * بنية سجل التوقف المشبوه المرصود عبر دالة detect_unauthorized_dwells
 */
export interface DetectedDwellResult {
  passport_id?: string;
  truck_plate?: string;
  driver_name?: string;
  commodity_id?: string;
  quantity_tons?: number;
  dwell_duration_hours?: number;
  dwell_location_name?: string;
  latitude?: number;
  longitude?: number;
  risk_level?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  detected_at?: string;
  [key: string]: unknown;
}

/**
 * بناء إعدادات مجمع الاتصال الآمن بـ PostgreSQL مع تشفير SSL/TLS متقدم
 */
export function buildSecurePgPoolConfig(customConfig?: PoolConfig): PoolConfig {
  const isProduction = process.env.NODE_ENV === 'production';
  const sslRequired = process.env.DATABASE_SSL === 'true' || isProduction;

  let sslOptions: tls.ConnectionOptions | boolean | undefined = undefined;

  if (sslRequired) {
    let caCertificate: string | undefined = undefined;

    if (process.env.PG_SSL_CA_CERT) {
      if (process.env.PG_SSL_CA_CERT.trim().startsWith('-----BEGIN CERTIFICATE-----')) {
        caCertificate = process.env.PG_SSL_CA_CERT;
      } else if (fs.existsSync(process.env.PG_SSL_CA_CERT)) {
        try {
          caCertificate = fs.readFileSync(process.env.PG_SSL_CA_CERT, 'utf-8');
        } catch (e) {
          console.warn('[Radar Daemon SSL] تعذر قراءة ملف شهادة CA المعين:', e);
        }
      }
    }

    sslOptions = {
      rejectUnauthorized: process.env.PG_SSL_REJECT_UNAUTHORIZED === 'true',
      minVersion: 'TLSv1.2',
      ca: caCertificate,
    };
  }

  return {
    connectionString: process.env.DATABASE_URL,
    host: process.env.PGHOST || 'localhost',
    port: Number(process.env.PGPORT) || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'postgres',
    database: process.env.PGDATABASE || 'kareema_db',
    max: Number(process.env.PG_POOL_MAX) || 10,               // الحد الأقصى للاتصالات المتزامنة
    idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS) || 30000, // مهلة إغلاق الاتصالات الخاملة
    connectionTimeoutMillis: Number(process.env.PG_CONN_TIMEOUT_MS) || 8000, // مهلة الاتصال القصوى
    ssl: sslOptions,
    ...customConfig,
  };
}

/**
 * وحدة الجدولة والرادار الأوتوماتيكي (DwellRadarScheduler)
 */
export class DwellRadarScheduler {
  private readonly pool: Pool;
  private task: ScheduledTask | null = null;
  private isProcessing: boolean = false;
  private readonly cronExpression: string;
  private readonly hoursThreshold: number;
  private readonly radiusMeters: number;

  constructor(options: RadarSchedulerOptions = {}) {
    // التوقيت الافتراضي: كل 15 دقيقة دقيقة بصيغة cron القياسية
    this.cronExpression = options.cronExpression || '*/15 * * * *';
    this.hoursThreshold = options.hoursThreshold ?? 4.0;
    this.radiusMeters = options.radiusMeters ?? 200.0;

    // تهيئة مجمع الاتصالات الدائم (Persistent Pool) مع تشفير SSL/TLS
    const poolConfig = buildSecurePgPoolConfig(options.poolConfig);
    this.pool = new Pool(poolConfig);

    // تسجيل ومعالجة أحداث مجمع الاتصال
    this.pool.on('error', (err: Error) => {
      console.error(`[Radar Daemon Pool Error] [${new Date().toISOString()}] خطأ غير متوقع في مجمع الاتصال:`, err);
    });

    this.pool.on('connect', () => {
      if (process.env.DEBUG_RADAR === 'true') {
        console.log(`[Radar Daemon Pool] [${new Date().toISOString()}] تم فتح اتصال مشفر جديد بقاعدة البيانات.`);
      }
    });
  }

  /**
   * تنفيذ فحص الرادار اللحظي واستدعاء دالة detect_unauthorized_dwells
   */
  public async executeRadarScan(): Promise<DetectedDwellResult[]> {
    // حماية ضد التداخل في حال استغرقت الدورة السابقة وقتاً أطول من فاصل الجدولة
    if (this.isProcessing) {
      console.warn(
        `[Radar Daemon] [${new Date().toISOString()}] ⚠️ تخطي الدورة الحالية: الفحص السابق ما زال قيد التشغيل في قاعدة البيانات.`
      );
      return [];
    }

    this.isProcessing = true;
    const startTime = Date.now();
    const timestampStr = new Date().toISOString();

    console.log(
      `\n[Radar Daemon] [${timestampStr}] 🔍 بدء دورة المسح المكاني: SELECT * FROM detect_unauthorized_dwells(${this.hoursThreshold}, ${this.radiusMeters});`
    );

    let client: PoolClient | null = null;
    try {
      // سحب اتصال من المجمع الدائم
      client = await this.pool.connect();

      // استدعاء دالة قاعدة البيانات المكانية
      const querySql = `SELECT * FROM detect_unauthorized_dwells($1, $2);`;
      const queryResult = await client.query(querySql, [this.hoursThreshold, this.radiusMeters]);

      const elapsedMs = Date.now() - startTime;
      const detectedCount = queryResult.rowCount ?? queryResult.rows.length;

      if (detectedCount > 0) {
        console.warn(
          `[Radar Daemon ALERT] 🚨 رُصدت (${detectedCount}) حالة توقف مشبوهة / شبهة احتكار خلال ${elapsedMs}ms:`
        );
        console.table(queryResult.rows);
      } else {
        console.log(
          `[Radar Daemon OK] ✅ اكتمل المسح بنجاح خلال ${elapsedMs}ms: لم يُرصد أي توقف غير مصرح به في شبكة الإمداد.`
        );
      }

      return queryResult.rows as DetectedDwellResult[];
    } catch (err: any) {
      const elapsedMs = Date.now() - startTime;
      console.error(
        `[Radar Daemon ERROR] ❌ فشل تنفيذ فحص الرادار بعد ${elapsedMs}ms:`,
        err?.message || err
      );
      return [];
    } finally {
      // إعادة الاتصال للمجمع فوراً
      if (client) {
        client.release();
      }
      this.isProcessing = false;
    }
  }

  /**
   * تشغيل خادم الجدولة الأوتوماتيكي باستخدام node-cron
   */
  public async start(runImmediately: boolean = false): Promise<void> {
    console.log('==============================================================================');
    console.log('  منظومة كَرِيمَة: تشغيل رادار كشف التوقف المشبوه (Dwell Radar Cron Worker)');
    console.log(`  - النمط الزمني (Cron Expression): "${this.cronExpression}" (كل 15 دقيقة)`);
    console.log(`  - عتبة ساعات التوقف (Threshold): ${this.hoursThreshold} ساعات`);
    console.log(`  - محيط الأمان المكاني: ${this.radiusMeters} متر`);
    console.log(`  - وضع التشفير (SSL/TLS): ${this.pool.options.ssl ? 'مُفعّل (Secure TLS)' : 'محلي (Plain)'}`);
    console.log('==============================================================================');

    // تنفيذ فحص استباقي عند بدء التشغيل إذا طُلب ذلك
    if (runImmediately) {
      console.log('[Radar Daemon] تشغيل فحص أولي فوري عند الإقلاع...');
      await this.executeRadarScan();
    }

    // جدولة المهمة الدورية كل 15 دقيقة دون حظر حلقة الأحداث (Non-blocking)
    this.task = cron.schedule(this.cronExpression, async () => {
      try {
        await this.executeRadarScan();
      } catch (cronErr) {
        console.error(`[Radar Daemon Cron Error] [${new Date().toISOString()}] خطأ غير متوقع في دورة الجدولة:`, cronErr);
      }
    });

    console.log('[Radar Daemon] تم تثبيت المهمة المجدولة بنجاح وجاري العمل في الخلفية.');
  }

  /**
   * إيقاف خدمة الجدولة وتفريغ مجمع الاتصالات بأمان (Graceful Shutdown)
   */
  public async stop(): Promise<void> {
    console.log('[Radar Daemon] إيقاف مهمة الجدولة وإغلاق اتصالات مجمع قاعدة البيانات بأمان...');

    if (this.task) {
      this.task.stop();
      this.task = null;
    }

    try {
      await this.pool.end();
      console.log('[Radar Daemon] تم إغلاق مجمع اتصالات قاعدة البيانات (pgPool) بأمان.');
    } catch (poolErr) {
      console.error('[Radar Daemon] خطأ أثناء تفريغ مجمع الاتصالات:', poolErr);
    }
  }

  /**
   * استرجاع كائن مجمع الاتصالات المباشر
   */
  public getPool(): Pool {
    return this.pool;
  }
}

// تصدير نسخة عامة ومفردة (Singleton Factory) للاستخدام المباشر
export const defaultRadarScheduler = new DwellRadarScheduler();

// تشغيل ذاتي مستقل في حال تم استدعاء الملف مباشرة عبر الأمر: tsx src/workers/dwellRadarScheduler.ts
if (
  process.argv[1]?.endsWith('dwellRadarScheduler.ts') ||
  process.argv[1]?.endsWith('dwellRadarScheduler.js')
) {
  const scheduler = new DwellRadarScheduler({
    runImmediately: true,
  });

  scheduler.start(true).catch((err) => {
    console.error('[Radar Daemon FATAL] تعذر إطلاق خدمة الجدولة:', err);
    process.exit(1);
  });

  // معالجة إشارات الإنهاء النظيف للنظام (Graceful Termination)
  const shutdown = async (signal: string) => {
    console.log(`\n[Radar Daemon] استلام إشارة الإنهاء (${signal}). جاري الإغلاق النظيف...`);
    await scheduler.stop();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}
