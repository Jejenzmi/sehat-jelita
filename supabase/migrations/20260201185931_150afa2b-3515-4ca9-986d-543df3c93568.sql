-- Add new roles to the enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'keuangan';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'gizi';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'icu';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'bedah';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'rehabilitasi';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'mcu';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'forensik';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'cssd';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'manajemen';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'bank_darah';