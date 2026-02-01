
-- Add menu access templates for HRD role
INSERT INTO menu_access_templates (role, menu_path, can_view, can_create, can_edit, can_delete) VALUES
('hrd', '/', true, false, false, false),
('hrd', '/sdm', true, true, true, true),
('hrd', '/laporan', true, false, false, false),
('hrd', '/pengaturan', true, false, true, false)
ON CONFLICT (role, menu_path) DO UPDATE SET
  can_view = EXCLUDED.can_view,
  can_create = EXCLUDED.can_create,
  can_edit = EXCLUDED.can_edit,
  can_delete = EXCLUDED.can_delete;

-- Add menu access templates for Procurement role
INSERT INTO menu_access_templates (role, menu_path, can_view, can_create, can_edit, can_delete) VALUES
('procurement', '/', true, false, false, false),
('procurement', '/inventory', true, true, true, true),
('procurement', '/penunjang', true, true, true, false),
('procurement', '/laporan', true, false, false, false)
ON CONFLICT (role, menu_path) DO UPDATE SET
  can_view = EXCLUDED.can_view,
  can_create = EXCLUDED.can_create,
  can_edit = EXCLUDED.can_edit,
  can_delete = EXCLUDED.can_delete;

-- Add demo accounts for HRD and Procurement
INSERT INTO demo_accounts (email, role, full_name, description) VALUES
('hrd@simrs.com', 'hrd', 'Staff HRD', 'Mengelola SDM, absensi, payroll, dan pelatihan'),
('procurement@simrs.com', 'procurement', 'Staff Procurement', 'Mengelola pengadaan, inventory, dan vendor')
ON CONFLICT (email) DO UPDATE SET
  role = EXCLUDED.role,
  full_name = EXCLUDED.full_name,
  description = EXCLUDED.description;

-- Sync to menu_access table
INSERT INTO menu_access (role, menu_path, can_view, can_create, can_edit, can_delete)
SELECT role, menu_path, can_view, can_create, can_edit, can_delete 
FROM menu_access_templates 
WHERE role IN ('hrd', 'procurement')
ON CONFLICT (role, menu_path) DO UPDATE SET
  can_view = EXCLUDED.can_view,
  can_create = EXCLUDED.can_create,
  can_edit = EXCLUDED.can_edit,
  can_delete = EXCLUDED.can_delete;
