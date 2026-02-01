-- Add menu access templates for new roles
-- Keuangan role
INSERT INTO menu_access_templates (role, menu_path, can_view, can_create, can_edit, can_delete) VALUES
('keuangan', '/', true, false, false, false),
('keuangan', '/billing', true, true, true, true),
('keuangan', '/akuntansi', true, true, true, true),
('keuangan', '/laporan', true, true, false, false),
('keuangan', '/bpjs', true, true, true, false),
('keuangan', '/asuransi', true, true, true, false);

-- Gizi role
INSERT INTO menu_access_templates (role, menu_path, can_view, can_create, can_edit, can_delete) VALUES
('gizi', '/', true, false, false, false),
('gizi', '/gizi', true, true, true, true),
('gizi', '/rawat-inap', true, false, false, false);

-- ICU role
INSERT INTO menu_access_templates (role, menu_path, can_view, can_create, can_edit, can_delete) VALUES
('icu', '/', true, false, false, false),
('icu', '/icu', true, true, true, true),
('icu', '/rawat-inap', true, true, true, false);

-- Bedah role
INSERT INTO menu_access_templates (role, menu_path, can_view, can_create, can_edit, can_delete) VALUES
('bedah', '/', true, false, false, false),
('bedah', '/kamar-operasi', true, true, true, true),
('bedah', '/rawat-inap', true, false, false, false);

-- Rehabilitasi role
INSERT INTO menu_access_templates (role, menu_path, can_view, can_create, can_edit, can_delete) VALUES
('rehabilitasi', '/', true, false, false, false),
('rehabilitasi', '/rehabilitasi', true, true, true, true);

-- MCU role
INSERT INTO menu_access_templates (role, menu_path, can_view, can_create, can_edit, can_delete) VALUES
('mcu', '/', true, false, false, false),
('mcu', '/mcu', true, true, true, true);

-- Forensik role
INSERT INTO menu_access_templates (role, menu_path, can_view, can_create, can_edit, can_delete) VALUES
('forensik', '/', true, false, false, false),
('forensik', '/forensik', true, true, true, true);

-- CSSD role
INSERT INTO menu_access_templates (role, menu_path, can_view, can_create, can_edit, can_delete) VALUES
('cssd', '/', true, false, false, false),
('cssd', '/penunjang', true, true, true, true);

-- Manajemen role
INSERT INTO menu_access_templates (role, menu_path, can_view, can_create, can_edit, can_delete) VALUES
('manajemen', '/', true, false, false, false),
('manajemen', '/dashboard-executive', true, false, false, false),
('manajemen', '/laporan', true, true, false, false),
('manajemen', '/sdm', true, true, true, false),
('manajemen', '/mutu', true, true, true, false);

-- Bank Darah role
INSERT INTO menu_access_templates (role, menu_path, can_view, can_create, can_edit, can_delete) VALUES
('bank_darah', '/', true, false, false, false),
('bank_darah', '/bank-darah', true, true, true, true);

-- Add missing menus to admin
INSERT INTO menu_access_templates (role, menu_path, can_view, can_create, can_edit, can_delete) VALUES
('admin', '/akuntansi', true, true, true, true),
('admin', '/icu', true, true, true, true),
('admin', '/kamar-operasi', true, true, true, true),
('admin', '/hemodialisa', true, true, true, true),
('admin', '/bank-darah', true, true, true, true),
('admin', '/gizi', true, true, true, true),
('admin', '/rehabilitasi', true, true, true, true),
('admin', '/mcu', true, true, true, true),
('admin', '/forensik', true, true, true, true),
('admin', '/penunjang', true, true, true, true),
('admin', '/mutu', true, true, true, true),
('admin', '/telemedicine', true, true, true, true),
('admin', '/antrian', true, true, true, true),
('admin', '/jadwal-dokter', true, true, true, true),
('admin', '/dashboard-executive', true, true, true, true),
('admin', '/asuransi', true, true, true, true)
ON CONFLICT DO NOTHING;