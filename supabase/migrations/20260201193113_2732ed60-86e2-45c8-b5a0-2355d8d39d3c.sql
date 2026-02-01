-- Hapus template lama untuk role yang perlu diupdate (bukan admin)
DELETE FROM menu_access_templates WHERE role NOT IN ('admin');

-- ===============================================
-- DOKTER - Akses pelayanan medis dan rekam medis
-- ===============================================
INSERT INTO menu_access_templates (role, menu_path, can_view, can_create, can_edit, can_delete) VALUES
('dokter', '/', true, false, false, false),
('dokter', '/pendaftaran', true, false, false, false),
('dokter', '/pasien', true, false, false, false),
('dokter', '/antrian', true, false, false, false),
('dokter', '/jadwal-dokter', true, true, true, false),
('dokter', '/rawat-jalan', true, true, true, false),
('dokter', '/rawat-inap', true, true, true, false),
('dokter', '/igd', true, true, true, false),
('dokter', '/kamar-operasi', true, true, true, false),
('dokter', '/icu', true, true, true, false),
('dokter', '/telemedicine', true, true, true, false),
('dokter', '/rekam-medis', true, true, true, false),
('dokter', '/laboratorium', true, false, false, false),
('dokter', '/radiologi', true, false, false, false);

-- ===============================================
-- PERAWAT - Asuhan keperawatan dan monitoring
-- ===============================================
INSERT INTO menu_access_templates (role, menu_path, can_view, can_create, can_edit, can_delete) VALUES
('perawat', '/', true, false, false, false),
('perawat', '/antrian', true, false, false, false),
('perawat', '/pasien', true, false, false, false),
('perawat', '/rawat-jalan', true, true, true, false),
('perawat', '/rawat-inap', true, true, true, false),
('perawat', '/igd', true, true, true, false),
('perawat', '/icu', true, true, true, false),
('perawat', '/rekam-medis', true, true, false, false);

-- ===============================================
-- KASIR - Pembayaran dan billing
-- ===============================================
INSERT INTO menu_access_templates (role, menu_path, can_view, can_create, can_edit, can_delete) VALUES
('kasir', '/', true, false, false, false),
('kasir', '/antrian', true, false, false, false),
('kasir', '/pasien', true, false, false, false),
('kasir', '/billing', true, true, true, false),
('kasir', '/bpjs', true, true, false, false),
('kasir', '/asuransi', true, true, false, false),
('kasir', '/laporan', true, false, false, false);

-- ===============================================
-- FARMASI - Apotek dan obat
-- ===============================================
INSERT INTO menu_access_templates (role, menu_path, can_view, can_create, can_edit, can_delete) VALUES
('farmasi', '/', true, false, false, false),
('farmasi', '/farmasi', true, true, true, true),
('farmasi', '/inventory', true, true, true, false),
('farmasi', '/pasien', true, false, false, false),
('farmasi', '/laporan', true, false, false, false);

-- ===============================================
-- LABORATORIUM - Pemeriksaan lab
-- ===============================================
INSERT INTO menu_access_templates (role, menu_path, can_view, can_create, can_edit, can_delete) VALUES
('laboratorium', '/', true, false, false, false),
('laboratorium', '/laboratorium', true, true, true, true),
('laboratorium', '/pasien', true, false, false, false),
('laboratorium', '/laporan', true, false, false, false);

-- ===============================================
-- RADIOLOGI - Pemeriksaan radiologi
-- ===============================================
INSERT INTO menu_access_templates (role, menu_path, can_view, can_create, can_edit, can_delete) VALUES
('radiologi', '/', true, false, false, false),
('radiologi', '/radiologi', true, true, true, true),
('radiologi', '/pasien', true, false, false, false),
('radiologi', '/laporan', true, false, false, false);

-- ===============================================
-- PENDAFTARAN - Registrasi pasien
-- ===============================================
INSERT INTO menu_access_templates (role, menu_path, can_view, can_create, can_edit, can_delete) VALUES
('pendaftaran', '/', true, false, false, false),
('pendaftaran', '/pendaftaran', true, true, true, false),
('pendaftaran', '/pasien', true, true, true, false),
('pendaftaran', '/antrian', true, true, true, false),
('pendaftaran', '/jadwal-dokter', true, true, true, false),
('pendaftaran', '/bpjs', true, true, false, false),
('pendaftaran', '/asuransi', true, true, false, false);

-- ===============================================
-- KEUANGAN - Akuntansi dan laporan keuangan
-- ===============================================
INSERT INTO menu_access_templates (role, menu_path, can_view, can_create, can_edit, can_delete) VALUES
('keuangan', '/', true, false, false, false),
('keuangan', '/billing', true, true, true, true),
('keuangan', '/akuntansi', true, true, true, true),
('keuangan', '/laporan', true, true, false, false),
('keuangan', '/bpjs', true, true, true, false),
('keuangan', '/asuransi', true, true, true, false);

-- ===============================================
-- MANAJEMEN - Dashboard eksekutif dan laporan
-- ===============================================
INSERT INTO menu_access_templates (role, menu_path, can_view, can_create, can_edit, can_delete) VALUES
('manajemen', '/', true, false, false, false),
('manajemen', '/dashboard-executive', true, false, false, false),
('manajemen', '/laporan', true, true, false, false),
('manajemen', '/sdm', true, true, true, false),
('manajemen', '/mutu', true, true, true, false),
('manajemen', '/pengaturan', true, true, true, false);

-- ===============================================
-- GIZI - Pelayanan gizi dan diet
-- ===============================================
INSERT INTO menu_access_templates (role, menu_path, can_view, can_create, can_edit, can_delete) VALUES
('gizi', '/', true, false, false, false),
('gizi', '/gizi', true, true, true, true),
('gizi', '/rawat-inap', true, false, false, false),
('gizi', '/pasien', true, false, false, false);

-- ===============================================
-- ICU - Intensive Care Unit
-- ===============================================
INSERT INTO menu_access_templates (role, menu_path, can_view, can_create, can_edit, can_delete) VALUES
('icu', '/', true, false, false, false),
('icu', '/icu', true, true, true, true),
('icu', '/rawat-inap', true, true, true, false),
('icu', '/pasien', true, false, false, false),
('icu', '/rekam-medis', true, true, true, false);

-- ===============================================
-- BEDAH - Kamar operasi
-- ===============================================
INSERT INTO menu_access_templates (role, menu_path, can_view, can_create, can_edit, can_delete) VALUES
('bedah', '/', true, false, false, false),
('bedah', '/kamar-operasi', true, true, true, true),
('bedah', '/rawat-inap', true, true, false, false),
('bedah', '/pasien', true, false, false, false),
('bedah', '/rekam-medis', true, true, true, false);

-- ===============================================
-- REHABILITASI - Fisioterapi dan rehab medik
-- ===============================================
INSERT INTO menu_access_templates (role, menu_path, can_view, can_create, can_edit, can_delete) VALUES
('rehabilitasi', '/', true, false, false, false),
('rehabilitasi', '/rehabilitasi', true, true, true, true),
('rehabilitasi', '/pasien', true, false, false, false),
('rehabilitasi', '/rawat-jalan', true, false, false, false);

-- ===============================================
-- MCU - Medical Check Up
-- ===============================================
INSERT INTO menu_access_templates (role, menu_path, can_view, can_create, can_edit, can_delete) VALUES
('mcu', '/', true, false, false, false),
('mcu', '/mcu', true, true, true, true),
('mcu', '/pasien', true, true, true, false),
('mcu', '/laboratorium', true, false, false, false),
('mcu', '/radiologi', true, false, false, false),
('mcu', '/laporan', true, false, false, false);

-- ===============================================
-- FORENSIK - Kedokteran forensik
-- ===============================================
INSERT INTO menu_access_templates (role, menu_path, can_view, can_create, can_edit, can_delete) VALUES
('forensik', '/', true, false, false, false),
('forensik', '/forensik', true, true, true, true),
('forensik', '/pasien', true, false, false, false);

-- ===============================================
-- CSSD - Sterilisasi dan laundry
-- ===============================================
INSERT INTO menu_access_templates (role, menu_path, can_view, can_create, can_edit, can_delete) VALUES
('cssd', '/', true, false, false, false),
('cssd', '/penunjang', true, true, true, true),
('cssd', '/inventory', true, true, true, false);

-- ===============================================
-- BANK_DARAH - Unit transfusi darah
-- ===============================================
INSERT INTO menu_access_templates (role, menu_path, can_view, can_create, can_edit, can_delete) VALUES
('bank_darah', '/', true, false, false, false),
('bank_darah', '/bank-darah', true, true, true, true),
('bank_darah', '/pasien', true, false, false, false),
('bank_darah', '/rawat-inap', true, false, false, false),
('bank_darah', '/laporan', true, false, false, false);

-- ===============================================
-- HEMODIALISA (tambahan role jika belum ada)
-- ===============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'hemodialisa' AND enumtypid = 'public.app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'hemodialisa';
  END IF;
END
$$;