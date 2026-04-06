-- ============================================================
-- Migration: Phase 2 — RBAC, Billing Rules, Auth Tokens, PII
-- ============================================================

-- ============================================================
-- 1. REFRESH TOKENS (DB-backed rotation)
-- ============================================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        VARCHAR(255) NOT NULL,
  token_hash     VARCHAR(64)  NOT NULL UNIQUE,  -- SHA-256 hex of raw token
  expires_at     TIMESTAMP    NOT NULL,
  created_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
  revoked_at     TIMESTAMP,
  revoked_reason VARCHAR(50),
  user_agent     TEXT,
  ip_address     VARCHAR(45),
  CONSTRAINT chk_refresh_expires CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user    ON refresh_tokens (user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash    ON refresh_tokens (token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_active  ON refresh_tokens (user_id)
  WHERE revoked_at IS NULL;

-- ============================================================
-- 2. BILLING RULES (Rule engine for tariffs, discounts, taxes)
-- ============================================================
CREATE TABLE IF NOT EXISTS billing_rules (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name     VARCHAR(200) NOT NULL,
  rule_type     VARCHAR(20)  NOT NULL,       -- tariff | discount | tax
  payment_type  VARCHAR(20),                  -- bpjs | cash | insurance | corporate | NULL = all
  visit_type    VARCHAR(20),                  -- outpatient | inpatient | emergency | NULL = all
  department_id UUID         REFERENCES departments(id) ON DELETE SET NULL,
  item_type     VARCHAR(100),                 -- konsultasi | lab | radiologi | obat | tindakan | kamar | NULL = all
  amount        DECIMAL(15,2) NOT NULL DEFAULT 0,
  amount_type   VARCHAR(10)   NOT NULL DEFAULT 'fixed',  -- fixed | percent
  priority      INT           NOT NULL DEFAULT 10,        -- higher = applied first
  is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
  description   TEXT,
  created_by    VARCHAR(255),
  created_at    TIMESTAMP     NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_rules_active
  ON billing_rules (is_active, rule_type, payment_type, visit_type);

-- Seed default tariff rules (consultations, lab base rates)
INSERT INTO billing_rules (rule_name, rule_type, payment_type, item_type, amount, amount_type, priority, description)
VALUES
  -- BPJS discounts (100% covered — billed at Rp 0 after rules)
  ('BPJS Konsultasi Umum',     'tariff',   'bpjs', 'konsultasi', 50000,   'fixed',   1, 'Tarif dasar konsultasi BPJS'),
  ('BPJS Lab Dasar',           'tariff',   'bpjs', 'lab',        75000,   'fixed',   1, 'Tarif dasar lab BPJS'),
  ('BPJS Radiologi Dasar',     'tariff',   'bpjs', 'radiologi',  200000,  'fixed',   1, 'Tarif dasar radiologi BPJS'),
  -- Umum/Cash tariffs
  ('Umum Konsultasi Umum',     'tariff',   'cash', 'konsultasi', 150000,  'fixed',   1, 'Tarif konsultasi umum'),
  ('Umum Konsultasi Spesialis','tariff',   'cash', 'konsultasi', 250000,  'fixed',   2, 'Tarif konsultasi spesialis'),
  ('Umum Lab Darah Lengkap',   'tariff',   'cash', 'lab',        175000,  'fixed',   1, 'Tarif lab darah lengkap'),
  ('Umum Radiologi X-Ray',     'tariff',   'cash', 'radiologi',  350000,  'fixed',   1, 'Tarif X-Ray umum'),
  ('Umum Kamar Kelas 1',       'tariff',   'cash', 'kamar',      500000,  'fixed',   1, 'Tarif kamar kelas 1/hari'),
  ('Umum Kamar Kelas 2',       'tariff',   'cash', 'kamar',      350000,  'fixed',   2, 'Tarif kamar kelas 2/hari'),
  ('Umum Kamar Kelas 3',       'tariff',   'cash', 'kamar',      200000,  'fixed',   3, 'Tarif kamar kelas 3/hari'),
  -- Taxes
  ('PPN Farmasi',              'tax',      'cash', 'obat',       11,      'percent', 99, 'PPN 11% untuk obat non-generik'),
  -- Discounts
  ('Diskon Lansia 10%',        'discount', 'cash', NULL,         10,      'percent', 50, 'Diskon 10% untuk pasien ≥ 60 tahun'),
  ('Diskon Corporate 15%',     'discount', 'corporate', NULL,    15,      'percent', 50, 'Diskon karyawan perusahaan mitra')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 3. PII ENCRYPTION — Hash columns on patients for search
-- ============================================================
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS nik_hash        VARCHAR(64),
  ADD COLUMN IF NOT EXISTS mobile_phone_hash VARCHAR(64),
  ADD COLUMN IF NOT EXISTS email_hash      VARCHAR(64);

CREATE INDEX IF NOT EXISTS idx_patients_nik_hash
  ON patients (nik_hash) WHERE nik_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_patients_phone_hash
  ON patients (mobile_phone_hash) WHERE mobile_phone_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_patients_email_hash
  ON patients (email_hash) WHERE email_hash IS NOT NULL;

-- ============================================================
-- 4. MENU ACCESS — Seed default permissions for all roles
-- ============================================================
-- Wipe existing blank rules before seeding
DELETE FROM menu_access WHERE can_view = false AND can_create = false AND can_edit = false AND can_delete = false;

-- Helper macro: INSERT OR IGNORE for each role + menu_path combination
INSERT INTO menu_access (role, menu_path, can_view, can_create, can_edit, can_delete) VALUES
-- ADMIN — full access to everything (admin bypass in middleware anyway)
('admin','dashboard',     true,true,true,true),
('admin','pendaftaran',   true,true,true,true),
('admin','pasien',        true,true,true,true),
('admin','antrian',       true,true,true,true),
('admin','rawat_jalan',   true,true,true,true),
('admin','igd',           true,true,true,true),
('admin','rekam_medis',   true,true,true,true),
('admin','laboratorium',  true,true,true,true),
('admin','radiologi',     true,true,true,true),
('admin','farmasi',       true,true,true,true),
('admin','kasir',         true,true,true,true),
('admin','bpjs',          true,true,true,true),
('admin','rawat_inap',    true,true,true,true),
('admin','kamar_operasi', true,true,true,true),
('admin','icu',           true,true,true,true),
('admin','hemodialisa',   true,true,true,true),
('admin','bank_darah',    true,true,true,true),
('admin','gizi',          true,true,true,true),
('admin','rehabilitasi',  true,true,true,true),
('admin','mcu',           true,true,true,true),
('admin','inventory',     true,true,true,true),
('admin','sdm',           true,true,true,true),
('admin','akuntansi',     true,true,true,true),
('admin','laporan',       true,true,true,true),
('admin','pengaturan',    true,true,true,true),
('admin','manajemen_user',true,true,true,true),
('admin','mutu',          true,true,true,true),
('admin','telemedicine',  true,true,true,true),
('admin','smart_display', true,true,true,true),
-- DOKTER
('dokter','dashboard',    true,false,false,false),
('dokter','pasien',       true,false,true,false),
('dokter','antrian',      true,false,false,false),
('dokter','rawat_jalan',  true,true,true,false),
('dokter','igd',          true,true,true,false),
('dokter','rekam_medis',  true,true,true,false),
('dokter','laboratorium', true,true,false,false),
('dokter','radiologi',    true,true,false,false),
('dokter','farmasi',      true,true,false,false),
('dokter','rawat_inap',   true,true,true,false),
('dokter','kamar_operasi',true,true,true,false),
('dokter','icu',          true,true,true,false),
('dokter','hemodialisa',  true,false,false,false),
('dokter','bank_darah',   true,true,false,false),
('dokter','gizi',         true,false,false,false),
('dokter','rehabilitasi', true,true,false,false),
('dokter','mcu',          true,true,true,false),
('dokter','telemedicine', true,true,true,false),
('dokter','mutu',         true,false,false,false),
-- PERAWAT
('perawat','dashboard',   true,false,false,false),
('perawat','pasien',      true,false,false,false),
('perawat','antrian',     true,true,true,false),
('perawat','rawat_jalan', true,false,true,false),
('perawat','rawat_inap',  true,true,true,false),
('perawat','igd',         true,true,true,false),
('perawat','rekam_medis', true,true,true,false),
('perawat','laboratorium',true,true,false,false),
('perawat','farmasi',     true,false,false,false),
('perawat','icu',         true,true,true,false),
-- FARMASI
('farmasi','dashboard',   true,false,false,false),
('farmasi','farmasi',     true,true,true,false),
('farmasi','inventory',   true,true,true,false),
('farmasi','pasien',      true,false,false,false),
('farmasi','laporan',     true,false,false,false),
-- LABORATORIUM
('laboratorium','dashboard',    true,false,false,false),
('laboratorium','laboratorium', true,true,true,false),
('laboratorium','pasien',       true,false,false,false),
('laboratorium','laporan',      true,false,false,false),
-- RADIOLOGI
('radiologi','dashboard',   true,false,false,false),
('radiologi','radiologi',   true,true,true,false),
('radiologi','pasien',      true,false,false,false),
('radiologi','laporan',     true,false,false,false),
-- PENDAFTARAN
('pendaftaran','dashboard',   true,false,false,false),
('pendaftaran','pendaftaran', true,true,true,false),
('pendaftaran','pasien',      true,true,true,false),
('pendaftaran','antrian',     true,true,true,false),
('pendaftaran','rawat_jalan', true,false,false,false),
('pendaftaran','bpjs',        true,true,false,false),
-- KASIR
('kasir','dashboard',  true,false,false,false),
('kasir','kasir',      true,true,true,false),
('kasir','laporan',    true,false,false,false),
('kasir','bpjs',       true,false,false,false),
-- KEUANGAN
('keuangan','dashboard', true,false,false,false),
('keuangan','akuntansi', true,true,true,false),
('keuangan','kasir',     true,false,false,false),
('keuangan','laporan',   true,true,false,false),
('keuangan','bpjs',      true,true,false,false),
-- MANAJEMEN
('manajemen','dashboard',  true,false,false,false),
('manajemen','laporan',    true,false,false,false),
('manajemen','mutu',       true,false,false,false),
('manajemen','sdm',        true,false,false,false),
('manajemen','akuntansi',  true,false,false,false),
('manajemen','inventory',  true,false,false,false),
-- HRD
('hrd','dashboard', true,false,false,false),
('hrd','sdm',       true,true,true,false),
('hrd','laporan',   true,false,false,false),
-- REKAM_MEDIS
('rekam_medis','dashboard',   true,false,false,false),
('rekam_medis','rekam_medis', true,true,true,false),
('rekam_medis','pasien',      true,true,true,false),
('rekam_medis','laporan',     true,false,false,false),
-- BEDAH
('bedah','dashboard',     true,false,false,false),
('bedah','kamar_operasi', true,true,true,false),
('bedah','rawat_inap',    true,false,false,false),
('bedah','rekam_medis',   true,true,true,false),
-- ICU
('icu','dashboard',   true,false,false,false),
('icu','icu',         true,true,true,false),
('icu','rawat_inap',  true,false,false,false),
('icu','rekam_medis', true,true,true,false),
-- HEMODIALISA
('hemodialisa','dashboard',  true,false,false,false),
('hemodialisa','hemodialisa',true,true,true,false),
('hemodialisa','pasien',     true,false,false,false),
-- GIZI
('gizi','dashboard', true,false,false,false),
('gizi','gizi',      true,true,true,false),
('gizi','pasien',    true,false,false,false),
-- REHABILITASI
('rehabilitasi','dashboard',   true,false,false,false),
('rehabilitasi','rehabilitasi',true,true,true,false),
('rehabilitasi','pasien',      true,false,false,false),
-- FORENSIK
('forensik','dashboard', true,false,false,false),
('forensik','forensik',  true,true,true,false),
-- PROCUREMENT
('procurement','dashboard', true,false,false,false),
('procurement','inventory', true,true,true,false),
('procurement','laporan',   true,false,false,false),
-- IT
('it','dashboard',     true,false,false,false),
('it','pengaturan',    true,true,true,true),
('it','manajemen_user',true,true,true,true),
('it','smart_display', true,true,true,false),
-- GUEST — no access
('guest','dashboard',  false,false,false,false)
ON CONFLICT (role, menu_path) DO UPDATE SET
  can_view   = EXCLUDED.can_view,
  can_create = EXCLUDED.can_create,
  can_edit   = EXCLUDED.can_edit,
  can_delete = EXCLUDED.can_delete;
