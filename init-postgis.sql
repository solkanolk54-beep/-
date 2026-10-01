-- ============================================================================
-- منظومة كَرِيمَة للرقابة الشاملة والشفافية الرقمية
-- Kareema: Sovereign Smart Supply Chain & Fair Price Monitoring System
-- PostgreSQL 16 + PostGIS 3.4 + pgcrypto Initialization Script
-- ============================================================================

-- 1. تفعيل ملحقات المعالجة المكانية، التوليد العشوائي، والتشفير الدفتري
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- التأكد من جاهزية دالة digest() لتشفير بصمات سجلات التدقيق (SHA-256)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'digest'
    ) THEN
        RAISE EXCEPTION 'pgcrypto extension failed to load digest() function';
    END IF;
    RAISE NOTICE 'PostGIS 3.4, uuid-ossp, and pgcrypto extensions successfully initialized.';
END $$;
