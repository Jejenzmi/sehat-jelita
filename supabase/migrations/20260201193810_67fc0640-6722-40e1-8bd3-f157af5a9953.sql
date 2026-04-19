-- Hapus semua template yang sudah ada dan buat ulang dengan akses yang lebih ketat
DELETE FROM menu_access_templates;

-- ADMIN - Full access ke semua menu
INSERT INTO menu_access_templates (role, menu_path, can_view, can_create, can_edit, can_delete) VALUES
('admin', '/', true, true, true, true),
('admin', '/dashboard-executive', true, true, true, true),
('admin', '/pendaftaran', true, true, true, true),
('admin', '/pasien', true, true, true, true),
('admin', '/antrian', true, true, true, true),
('admin', '/jadwal-dokter', true, true, true, true),
('admin', '/rawat-jalan', true, true, true, true),
('admin', '/rawat-inap', true, true, true, true),
('admin', '/igd', true, true, true, true),
('admin', '/kamar-operasi', true, true, true, true),
('admin', '/icu', true, true, true, true),
('admin', '/telemedicine', true, true, true, true),
('admin', '/rekam-medis', true, true, true, true),
('admin', '/farmasi', true, true, true, true),
('admin', '/laboratorium', true, true, true, true),
('admin', '/radiologi', true, true, true, true),
('admin', '/hemodialisa', true, true, true, true),
('admin', '/bank-darah', true, true, true, true),
('admin', '/gizi', true, true, true, true),
('admin', '/rehabilitasi', true, true, true, true),
('admin', '/mcu', true, true, true, true),
('admin', '/forensik', true, true, true, true),
('admin', '/billing', true, true, true, true),
('admin', '/akuntansi', true, true, true, true),
('admin', '/bpjs', true, true, true, true),
('admin', '/asuransi', true, true, true, true),
('admin', '/satu-sehat', true, true, true, true),
('admin', '/inventory', true, true, true, true),
('admin', '/penunjang', true, true, true, true),
('admin', '/mutu', true, true, true, true),
('admin', '/sdm', true, true, true, true),
('admin', '/laporan', true, true, true, true),
('admin', '/master-data', true, true, true, true),
('admin', '/manajemen-user', true, true, true, true),
('admin', '/pengaturan', true, true, true, true);

-- DOKTER - Hanya pelayanan medis, TIDAK bisa pendaftaran/billing/pasien
INSERT INTO menu_access_templates (role, menu_path, can_view, can_create, can_edit, can_delete) VALUES
('dokter', '/', true, false, false, false),
('dokter', '/rawat-jalan', true, true, true, false),
('dokter', '/rawat-inap', true, true, true, false),
('dokter', '/igd', true, true, true, false),
('dokter', '/kamar-operasi', true, true, true, false),
('dokter', '/icu', true, true, true, false),
('dokter', '/telemedicine', true, true, true, false),
('dokter', '/rekam-medis', true, true, true, false),
('dokter', '/laboratorium', true, false, false, false),
('dokter', '/radiologi', true, false, false, false),
('dokter', '/jadwal-dokter', true, true, true, false);

-- PERAWAT - Support dokter di unit rawat
INSERT INTO menu_access_templates (role, menu_path, can_view, can_create, can_edit, can_delete) VALUES
('perawat', '/', true, false, false, false),
('perawat', '/rawat-jalan', true, true, true, false),
('perawat', '/rawat-inap', true, true, true, false),
('perawat', '/igd', true, true, true, false),
('perawat', '/icu', true, true, true, false),
('perawat', '/rekam-medis', true, true, false, false),
('perawat', '/antrian', true, false, false, false);

-- KASIR - Hanya billing dan pembayaran
INSERT INTO menu_access_templates (role, menu_path, can_view, can_create, can_edit, can_delete) VALUES
('kasir', '/', true, false, false, false),
('kasir', '/billing', true, true, true, false),
('kasir', '/antrian', true, false, false, false);

-- PENDAFTARAN - Registrasi pasien dan antrian
INSERT INTO menu_access_templates (role, menu_path, can_view, can_create, can_edit, can_delete) VALUES
('pendaftaran', '/', true, false, false, false),
('pendaftaran', '/pendaftaran', true, true, true, false),
('pendaftaran', '/pasien', true, true, true, false),
('pendaftaran', '/antrian', true, true, true, false),
('pendaftaran', '/jadwal-dokter', true, false, false, false);

-- FARMASI - Apotek dan obat
INSERT INTO menu_access_templates (role, menu_path, can_view, can_create, can_edit, can_delete) VALUES
('farmasi', '/', true, false, false, false),
('farmasi', '/farmasi', true, true, true, false),
('farmasi', '/inventory', true, true, true, false);

-- LABORATORIUM - Lab tests
INSERT INTO menu_access_templates (role, menu_path, can_view, can_create, can_edit, can_delete) VALUES
('laboratorium', '/', true, false, false, false),
('laboratorium', '/laboratorium', true, true, true, false);

-- RADIOLOGI - Imaging
INSERT INTO menu_access_templates (role, menu_path, can_view, can_create, can_edit, can_delete) VALUES
('radiologi', '/', true, false, false, false),
('radiologi', '/radiologi', true, true, true, false);

-- KEUANGAN - Finance & Accounting
INSERT INTO menu_access_templates (role, menu_path, can_view, can_create, can_edit, can_delete) VALUES
('keuangan', '/', true, false, false, false),
('keuangan', '/billing', true, true, true, false),
('keuangan', '/akuntansi', true, true, true, false),
('keuangan', '/bpjs', true, true, true, false),
('keuangan', '/asuransi', true, true, true, false),
('keuangan', '/laporan', true, false, false, false);

-- GIZI - Nutrition
INSERT INTO menu_access_templates (role, menu_path, can_view, can_create, can_edit, can_delete) VALUES
('gizi', '/', true, false, false, false),
('gizi', '/gizi', true, true, true, false);

-- ICU - Intensive Care
INSERT INTO menu_access_templates (role, menu_path, can_view, can_create, can_edit, can_delete) VALUES
('icu', '/', true, false, false, false),
('icu', '/icu', true, true, true, false),
('icu', '/rekam-medis', true, true, false, false);

-- BEDAH - Surgery
INSERT INTO menu_access_templates (role, menu_path, can_view, can_create, can_edit, can_delete) VALUES
('bedah', '/', true, false, false, false),
('bedah', '/kamar-operasi', true, true, true, false),
('bedah', '/rekam-medis', true, true, false, false);

-- REHABILITASI - Rehabilitation
INSERT INTO menu_access_templates (role, menu_path, can_view, can_create, can_edit, can_delete) VALUES
('rehabilitasi', '/', true, false, false, false),
('rehabilitasi', '/rehabilitasi', true, true, true, false);

-- MCU - Medical Check Up
INSERT INTO menu_access_templates (role, menu_path, can_view, can_create, can_edit, can_delete) VALUES
('mcu', '/', true, false, false, false),
('mcu', '/mcu', true, true, true, false),
('mcu', '/laboratorium', true, false, false, false),
('mcu', '/radiologi', true, false, false, false);

-- FORENSIK - Forensic
INSERT INTO menu_access_templates (role, menu_path, can_view, can_create, can_edit, can_delete) VALUES
('forensik', '/', true, false, false, false),
('forensik', '/forensik', true, true, true, false);

-- CSSD - Sterilization
INSERT INTO menu_access_templates (role, menu_path, can_view, can_create, can_edit, can_delete) VALUES
('cssd', '/', true, false, false, false),
('cssd', '/penunjang', true, true, true, false);

-- MANAJEMEN - Executive & HR
INSERT INTO menu_access_templates (role, menu_path, can_view, can_create, can_edit, can_delete) VALUES
('manajemen', '/', true, false, false, false),
('manajemen', '/dashboard-executive', true, true, true, false),
('manajemen', '/sdm', true, true, true, false),
('manajemen', '/mutu', true, true, true, false),
('manajemen', '/laporan', true, false, false, false);

-- BANK_DARAH - Blood Bank
INSERT INTO menu_access_templates (role, menu_path, can_view, can_create, can_edit, can_delete) VALUES
('bank_darah', '/', true, false, false, false),
('bank_darah', '/bank-darah', true, true, true, false);

-- HEMODIALISA - Dialysis (jika ada)
INSERT INTO menu_access_templates (role, menu_path, can_view, can_create, can_edit, can_delete) VALUES
('hemodialisa', '/', true, false, false, false),
('hemodialisa', '/hemodialisa', true, true, true, false)
ON CONFLICT DO NOTHING;