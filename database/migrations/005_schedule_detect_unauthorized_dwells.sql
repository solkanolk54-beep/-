-- ==============================================================================
-- منظومة كَرِيمَة للرقابة الشاملة والشفافية الرقمية (Kareema Platform)
-- ملف ترحيل قاعدة البيانات: تفعيل وجدولة رادار كشف التوقف المشبوه والاحتكار
-- Migration: 005_schedule_detect_unauthorized_dwells.sql
-- ==============================================================================

-- 1. تفعيل ملحق الجدولة الدورية pg_cron بأمان إن لم يكن مفعلاً
-- ملاحظة: يتطلب هذا الملحق إضافة pg_cron إلى shared_preload_libraries في postgresql.conf
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. إزالة أي جدولة سابقة بنفس الاسم تجنباً للتكرار أو تعارض المهام (Idempotent Execution)
DO $$
DECLARE
    v_job_id BIGINT;
BEGIN
    SELECT jobid INTO v_job_id 
    FROM cron.job 
    WHERE jobname = 'detect-unauthorized-hoarding-job';

    IF v_job_id IS NOT NULL THEN
        PERFORM cron.unschedule(v_job_id);
        RAISE NOTICE 'تم إلغاء الجدولة السابقة للمهمة (Job ID: %) بنجاح.', v_job_id;
    END IF;
END $$;

-- 3. تسجيل وجدولة المهمة الدورية لتعمل كل 15 دقيقة
-- المعاملات: عتبة التوقف 4 ساعات، ومحيط الأمان الجغرافي 200 متر
SELECT cron.schedule(
    'detect-unauthorized-hoarding-job',
    '*/15 * * * *',
    $$SELECT * FROM detect_unauthorized_dwells(4, 200.0);$$
);

-- 4. التحقق والتأكد من تسجيل المهمة في جدول cron.job
SELECT 
    jobid,
    jobname,
    schedule,
    command,
    active
FROM cron.job
WHERE jobname = 'detect-unauthorized-hoarding-job';

-- ==============================================================================
-- ملحق التكوين المطلوب في ملف postgresql.conf (Production Configuration):
-- ------------------------------------------------------------------------------
-- # 1. تحميل المكتبة مسبقاً عند إقلاع الخادم:
-- shared_preload_libraries = 'pg_cron'
--
-- # 2. تحديد قاعدة البيانات المستهدفة لتنفيذ المهام وجدولتها:
-- cron.database_name = 'kareema_db'
--
-- # 3. ضبط النطاق الزمني الرسمي للجزائر (اختياري ودقيق):
-- cron.timezone = 'Africa/Algiers'
--
-- # 4. التحكم في عدد العمال المتزامنين للجدولة:
-- cron.max_running_jobs = 5
--
-- بعد تعديل postgresql.conf، يجب إعادة تشغيل خادم PostgreSQL:
-- sudo systemctl restart postgresql
-- ==============================================================================
