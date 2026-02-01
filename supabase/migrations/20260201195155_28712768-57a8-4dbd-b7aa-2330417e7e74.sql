
-- Add HRD and Procurement roles to app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'hrd';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'procurement';
