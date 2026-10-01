-- ============================================================================
-- منظومة كَرِيمَة للرقابة الشاملة والشفافية الرقمية (Kareema Platform)
-- PostgreSQL 16 + PostGIS 3.4 + pgcrypto Core DDL Specification
-- Modules: shipments, price_reports, and violations with Cryptographic Audit
-- ============================================================================

-- 1. تفعيل الملحقات المكانية والتشفيرية
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. الأنواع والقوائم المحددة (Custom Enumerated Types)
DO $$ BEGIN
    CREATE TYPE shipment_status_enum AS ENUM (
        'registered', 'dispatched', 'in_transit', 'hoarding_suspicion', 'delivered', 'inspected'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE report_status_enum AS ENUM (
        'pending', 'triaged', 'inspector_dispatched', 'verified_violation', 'dismissed'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE priority_level_enum AS ENUM ('critical', 'high', 'medium', 'low');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE violator_role_enum AS ENUM (
        'retailer', 'wholesaler', 'transporter', 'cold_storage_operator', 'intermediary'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE violation_legal_status_enum AS ENUM (
        'citation_issued', 'pending_fine_payment', 'referred_to_public_prosecutor', 'seizure_finalized'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ----------------------------------------------------------------------------
-- 3. جدول شحنات الإمداد الفلاحي وجواز السفر الرقمي (shipments)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    passport_qr_code VARCHAR(255) UNIQUE NOT NULL,
    truck_plate VARCHAR(50) NOT NULL,
    driver_name VARCHAR(150) NOT NULL,
    driver_nid_hash VARCHAR(64) NOT NULL, -- SHA-256 hash of National ID for privacy
    farm_id UUID NOT NULL,
    destination_market_id UUID NOT NULL,
    commodity_id VARCHAR(50) NOT NULL,
    quantity_tons NUMERIC(10, 2) NOT NULL CHECK (quantity_tons > 0),
    farm_gate_unit_price NUMERIC(10, 2) NOT NULL CHECK (farm_gate_unit_price > 0),
    fair_wholesale_price NUMERIC(10, 2) NOT NULL CHECK (fair_wholesale_price >= farm_gate_unit_price),
    status shipment_status_enum DEFAULT 'registered',
    requires_cold_chain BOOLEAN DEFAULT FALSE,
    current_temperature_c NUMERIC(4, 1),
    departure_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    estimated_arrival TIMESTAMP WITH TIME ZONE,
    actual_arrival TIMESTAMP WITH TIME ZONE,
    
    -- PostGIS Spatial Fields
    current_location GEOGRAPHY(POINT, 4326),
    planned_route GEOMETRY(LINESTRING, 4326),
    deviation_detected BOOLEAN DEFAULT FALSE,
    suspicion_reason TEXT,
    
    -- pgcrypto Cryptographic Audit & Integrity Ledger Fields
    payload_raw_signature TEXT NOT NULL,
    previous_block_hash VARCHAR(64) NOT NULL DEFAULT '0000000000000000000000000000000000000000000000000000000000000000',
    current_block_hash VARCHAR(64) NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Spatial and Performance Indices for shipments
CREATE INDEX IF NOT EXISTS idx_shipments_current_location_gist ON shipments USING GIST(current_location);
CREATE INDEX IF NOT EXISTS idx_shipments_planned_route_gist ON shipments USING GIST(planned_route);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_truck_plate ON shipments(truck_plate);
CREATE INDEX IF NOT EXISTS idx_shipments_block_hash ON shipments(current_block_hash);

-- ----------------------------------------------------------------------------
-- 4. جدول بلاغات المواطنين والرقابة الشعبية (price_reports)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS price_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number VARCHAR(60) UNIQUE NOT NULL,
    reporter_user_id VARCHAR(100) NOT NULL,
    product_id VARCHAR(50) NOT NULL,
    observed_price NUMERIC(10, 2) NOT NULL CHECK (observed_price > 0),
    ceiling_price NUMERIC(10, 2) NOT NULL CHECK (ceiling_price > 0),
    
    -- Generated Column: Automatic Inflation/Gouging Percentage
    inflation_delta_pct NUMERIC(6, 2) GENERATED ALWAYS AS (
        ((observed_price - ceiling_price) / ceiling_price) * 100.00
    ) STORED,
    
    store_name VARCHAR(200) NOT NULL,
    store_address TEXT,
    wilaya VARCHAR(100) NOT NULL,
    baladiya VARCHAR(100) NOT NULL,
    
    -- PostGIS Spatial Location of Retail Store
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    
    receipt_image_url TEXT,
    receipt_image_sha256 VARCHAR(64), -- pgcrypto SHA-256 checksum of invoice/receipt proof
    status report_status_enum DEFAULT 'pending',
    priority priority_level_enum DEFAULT 'medium',
    sla_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- pgcrypto Cryptographic Chained Ledger Fields
    report_tamper_hash VARCHAR(64) NOT NULL,
    audit_chain_previous_hash VARCHAR(64) NOT NULL DEFAULT '0000000000000000000000000000000000000000000000000000000000000000',
    audit_chain_current_hash VARCHAR(64) NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Spatial and Query Indices for price_reports
CREATE INDEX IF NOT EXISTS idx_price_reports_location_gist ON price_reports USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_price_reports_wilaya_baladiya ON price_reports(wilaya, baladiya);
CREATE INDEX IF NOT EXISTS idx_price_reports_status_priority ON price_reports(status, priority);
CREATE INDEX IF NOT EXISTS idx_price_reports_sla_deadline ON price_reports(sla_deadline);

-- ----------------------------------------------------------------------------
-- 5. جدول محاضر المخالفات والتغريم وقمع الغش (violations)
-- طبقاً لأحكام القانون رقم 21-15 المتعلق بمكافحة المضاربة غير المشروعة
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS violations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    citation_number VARCHAR(60) UNIQUE NOT NULL, -- Official Citation Code: DZ-CIT-2026-XXXXX
    price_report_id UUID REFERENCES price_reports(id) ON DELETE SET NULL,
    shipment_id UUID REFERENCES shipments(id) ON DELETE SET NULL,
    inspector_id VARCHAR(100) NOT NULL,
    badge_number VARCHAR(50) NOT NULL,
    
    violator_role violator_role_enum NOT NULL,
    violator_name VARCHAR(200) NOT NULL,
    commercial_registry_number VARCHAR(100),
    store_or_facility_name VARCHAR(200) NOT NULL,
    wilaya VARCHAR(100) NOT NULL,
    baladiya VARCHAR(100) NOT NULL,
    
    -- PostGIS Spatial Location of Inspection / Seizure
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    
    law_article_reference VARCHAR(150) NOT NULL DEFAULT 'Law 21-15 Art. 3 & 4 (Illicit Speculation & Hoarding)',
    fine_amount_dzd NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (fine_amount_dzd >= 0),
    goods_seized_tons NUMERIC(10, 2) DEFAULT 0.00 CHECK (goods_seized_tons >= 0),
    closure_duration_days INT DEFAULT 0 CHECK (closure_duration_days >= 0),
    seizure_inventory_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    legal_status violation_legal_status_enum DEFAULT 'citation_issued',
    court_file_reference VARCHAR(100),
    
    -- pgcrypto Digital Signing & Tamper-Proof Audit Fields
    evidence_bundle_hash VARCHAR(64) NOT NULL, -- SHA-256 of combined photos, invoices, and GPS fix
    inspector_digital_signature TEXT NOT NULL,  -- Cryptographic signature generated by inspector key
    previous_block_hash VARCHAR(64) NOT NULL,
    current_block_hash VARCHAR(64) NOT NULL,
    
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Spatial and Audit Indices for violations
CREATE INDEX IF NOT EXISTS idx_violations_location_gist ON violations USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_violations_inspector_badge ON violations(badge_number);
CREATE INDEX IF NOT EXISTS idx_violations_legal_status ON violations(legal_status);
CREATE INDEX IF NOT EXISTS idx_violations_block_hash ON violations(current_block_hash);

-- ----------------------------------------------------------------------------
-- 6. دوال ومحفزات التشفير التلقائي (pgcrypto Automatic Ledger Triggers)
-- ----------------------------------------------------------------------------

-- دالة التجزئة التلقائية لجدول الشحنات
CREATE OR REPLACE FUNCTION trg_calculate_shipment_crypto_hash()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    NEW.current_block_hash := encode(
        digest(
            concat(
                NEW.id,
                NEW.passport_qr_code,
                NEW.truck_plate,
                NEW.quantity_tons,
                NEW.farm_gate_unit_price,
                NEW.status,
                NEW.previous_block_hash,
                NEW.updated_at
            ),
            'sha256'
        ),
        'hex'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_shipments_crypto_hasher ON shipments;
CREATE TRIGGER trg_shipments_crypto_hasher
BEFORE INSERT OR UPDATE ON shipments
FOR EACH ROW
EXECUTE FUNCTION trg_calculate_shipment_crypto_hash();

-- دالة التجزئة التلقائية لجدول بلاغات المواطنين
CREATE OR REPLACE FUNCTION trg_calculate_price_report_crypto_hash()
RETURNS TRIGGER AS $$
BEGIN
    NEW.report_tamper_hash := encode(
        digest(
            concat(
                NEW.ticket_number,
                NEW.product_id,
                NEW.observed_price,
                NEW.ceiling_price,
                ST_AsText(NEW.location),
                COALESCE(NEW.receipt_image_sha256, 'NO_IMAGE')
            ),
            'sha256'
        ),
        'hex'
    );
    NEW.audit_chain_current_hash := encode(
        digest(
            concat(
                NEW.ticket_number,
                NEW.report_tamper_hash,
                NEW.audit_chain_previous_hash,
                NEW.created_at
            ),
            'sha256'
        ),
        'hex'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_price_reports_crypto_hasher ON price_reports;
CREATE TRIGGER trg_price_reports_crypto_hasher
BEFORE INSERT OR UPDATE ON price_reports
FOR EACH ROW
EXECUTE FUNCTION trg_calculate_price_report_crypto_hash();

-- دالة التجزئة التلقائية لجدول محاضر المخالفات
CREATE OR REPLACE FUNCTION trg_calculate_violation_crypto_hash()
RETURNS TRIGGER AS $$
BEGIN
    NEW.current_block_hash := encode(
        digest(
            concat(
                NEW.citation_number,
                NEW.inspector_id,
                NEW.badge_number,
                NEW.fine_amount_dzd,
                NEW.goods_seized_tons,
                NEW.evidence_bundle_hash,
                NEW.previous_block_hash,
                NEW.issued_at
            ),
            'sha256'
        ),
        'hex'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_violations_crypto_hasher ON violations;
CREATE TRIGGER trg_violations_crypto_hasher
BEFORE INSERT OR UPDATE ON violations
FOR EACH ROW
EXECUTE FUNCTION trg_calculate_violation_crypto_hash();

-- ----------------------------------------------------------------------------
-- 7. جدول غرف التبريد المرخصة رسمياً (licensed_cold_storages)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS licensed_cold_storages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    license_number VARCHAR(100) UNIQUE NOT NULL,
    facility_name VARCHAR(200) NOT NULL,
    owner_entity VARCHAR(150) NOT NULL,
    wilaya VARCHAR(100) NOT NULL,
    baladiya VARCHAR(100) NOT NULL,
    facility_geom GEOMETRY(POLYGON, 4326) NOT NULL,
    centroid GEOGRAPHY(POINT, 4326) GENERATED ALWAYS AS (
        ST_Centroid(facility_geom::geometry)::geography
    ) STORED,
    allowed_capacity_tons NUMERIC(10, 2) NOT NULL,
    is_operational BOOLEAN DEFAULT TRUE,
    approved_commodities TEXT[] NOT NULL DEFAULT ARRAY['potato', 'meat', 'dates', 'apples', 'onions'],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_licensed_cold_storages_geom ON licensed_cold_storages USING GIST(facility_geom);
CREATE INDEX IF NOT EXISTS idx_licensed_cold_storages_centroid ON licensed_cold_storages USING GIST(centroid);

-- ----------------------------------------------------------------------------
-- 8. جدول نقاط التتبع اللحظي للشحنات (shipment_waypoints)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shipment_waypoints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    coordinate GEOGRAPHY(POINT, 4326) NOT NULL,
    speed_kmh NUMERIC(5, 2) DEFAULT 0.00,
    heading_degrees NUMERIC(5, 2),
    is_geofence_compliant BOOLEAN DEFAULT TRUE,
    dwell_time_minutes INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_shipment_waypoints_coord_gist ON shipment_waypoints USING GIST(coordinate);
CREATE INDEX IF NOT EXISTS idx_shipment_waypoints_shipment_time ON shipment_waypoints(shipment_id, recorded_at DESC);

-- ----------------------------------------------------------------------------
-- 9. دالة كشف التوقف غير المصرح وشبهات الاحتكار (detect_unauthorized_dwells)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION detect_unauthorized_dwells(
    p_max_dwell_hours INT DEFAULT 4,
    p_unlicensed_buffer_meters DOUBLE PRECISION DEFAULT 200.0
)
RETURNS TABLE (
    shipment_id UUID,
    truck_plate VARCHAR,
    driver_name VARCHAR,
    detected_dwell_hours DOUBLE PRECISION,
    unregistered_location GEOGRAPHY,
    nearest_licensed_facility VARCHAR,
    distance_to_nearest_meters DOUBLE PRECISION,
    action_taken VARCHAR
) AS $$
DECLARE
    v_rec RECORD;
    v_alert_payload JSONB;
BEGIN
    FOR v_rec IN
        WITH static_dwells AS (
            SELECT 
                w.shipment_id,
                s.truck_plate,
                s.driver_name,
                s.commodity_id,
                s.quantity_tons,
                COUNT(w.id) AS waypoint_count,
                MIN(w.recorded_at) AS dwell_start,
                MAX(w.recorded_at) AS dwell_end,
                ROUND(EXTRACT(EPOCH FROM (MAX(w.recorded_at) - MIN(w.recorded_at))) / 3600.0, 2) AS dwell_hours,
                -- حساب النقطة المركزية لتجمع نقاط التوقف
                ST_Centroid(ST_Collect(w.coordinate::geometry))::geography AS dwell_centroid
            FROM shipment_waypoints w
            JOIN shipments s ON s.id = w.shipment_id
            WHERE s.status IN ('registered', 'dispatched', 'in_transit')
              AND w.recorded_at >= NOW() - INTERVAL '48 hours'
              AND (w.speed_kmh <= 3.0 OR w.speed_kmh IS NULL)
            GROUP BY w.shipment_id, s.truck_plate, s.driver_name, s.commodity_id, s.quantity_tons
            HAVING EXTRACT(EPOCH FROM (MAX(w.recorded_at) - MIN(w.recorded_at))) / 3600.0 >= p_max_dwell_hours
        ),
        unlicensed_violations AS (
            SELECT 
                sd.*,
                -- إيجاد أقرب غرفة تبريد مرخصة لحساب المسافة الفاصلة
                (
                    SELECT lcs.facility_name 
                    FROM licensed_cold_storages lcs 
                    ORDER BY sd.dwell_centroid <-> lcs.centroid 
                    LIMIT 1
                ) AS nearest_facility_name,
                (
                    SELECT ST_Distance(sd.dwell_centroid, lcs.centroid)
                    FROM licensed_cold_storages lcs 
                    ORDER BY sd.dwell_centroid <-> lcs.centroid 
                    LIMIT 1
                ) AS dist_to_facility_meters
            FROM static_dwells sd
            WHERE NOT EXISTS (
                -- شرط الاستبعاد: أن لا يكون التوقف داخل أو بمحيط الأمان لأي منشأة مرخصة
                SELECT 1 
                FROM licensed_cold_storages lcs
                WHERE ST_DWithin(sd.dwell_centroid, lcs.centroid, p_unlicensed_buffer_meters)
                   OR ST_Intersects(sd.dwell_centroid::geometry, lcs.facility_geom)
            )
        )
        SELECT * FROM unlicensed_violations
    LOOP
        -- 1. تحديث حالة الشحنة آلياً إلى شبهة احتكار
        UPDATE shipments
        SET 
            status = 'hoarding_suspicion',
            deviation_detected = TRUE,
            suspicion_reason = FORMAT(
                'توقف غير مبرر لمدة %s ساعة في منطقة تخزين غير مرخصة (إحداثيات: %s). تبعد %s م عن أقرب منشأة قانونية.',
                v_rec.dwell_hours,
                ST_AsText(v_rec.dwell_centroid),
                ROUND(v_rec.dist_to_facility_meters::numeric, 1)
            ),
            updated_at = NOW()
        WHERE id = v_rec.shipment_id;

        -- 2. إدراج الواقعة في سجل التدقيق الرقمي المشفر عبر pgcrypto
        INSERT INTO violations (
            citation_number,
            shipment_id,
            inspector_id,
            badge_number,
            violator_role,
            violator_name,
            store_or_facility_name,
            wilaya,
            baladiya,
            location,
            law_article_reference,
            goods_seized_tons,
            evidence_bundle_hash,
            inspector_digital_signature,
            previous_block_hash
        ) VALUES (
            CONCAT('DZ-HOARD-', TO_CHAR(NOW(), 'YYYYMMDD'), '-', SUBSTRING(v_rec.shipment_id::text FROM 1 FOR 6)),
            v_rec.shipment_id,
            'SYSTEM_POSTGIS_RADAR',
            'AUTONOMOUS_GEOFENCE',
            'transporter',
            v_rec.driver_name,
            FORMAT('مركبة ترقيم %s (مستودع غير مرخص)', v_rec.truck_plate),
            'تحديد آلي',
            'تحديد آلي',
            v_rec.dwell_centroid,
            'Law 21-15 Art. 3 & 4 (Illicit Hoarding and Withholding Goods)',
            v_rec.quantity_tons,
            encode(digest(concat(v_rec.shipment_id, v_rec.truck_plate, v_rec.dwell_hours, NOW()), 'sha256'), 'hex'),
            'SYSTEM_CRYPTO_AUTONOMOUS_STAMP',
            '0000000000000000000000000000000000000000000000000000000000000000'
        );

        -- 3. إطلاق إشعار فوري لفرق قمع الغش والتفتيش الميداني
        v_alert_payload := jsonb_build_object(
            'event', 'CRITICAL_HOARDING_GEOFENCE_BREACH',
            'shipmentId', v_rec.shipment_id,
            'truckPlate', v_rec.truck_plate,
            'commodityId', v_rec.commodity_id,
            'quantityTons', v_rec.quantity_tons,
            'dwellHours', v_rec.dwell_hours,
            'location', ST_AsGeoJSON(v_rec.dwell_centroid)::jsonb,
            'nearestLicensedFacility', v_rec.nearest_facility_name,
            'distanceMeters', v_rec.dist_to_facility_meters,
            'timestamp', NOW()
        );
        PERFORM pg_notify('trade_enforcement_alerts', v_alert_payload::text);

        -- 4. إرجاع السجل المُكتشف
        shipment_id := v_rec.shipment_id;
        truck_plate := v_rec.truck_plate;
        driver_name := v_rec.driver_name;
        detected_dwell_hours := v_rec.dwell_hours;
        unregistered_location := v_rec.dwell_centroid;
        nearest_licensed_facility := v_rec.nearest_facility_name;
        distance_to_nearest_meters := v_rec.dist_to_facility_meters;
        action_taken := 'STATUS_UPDATED_TO_HOARDING_SUSPICION_AND_DISPATCH_EMITTED';
        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
