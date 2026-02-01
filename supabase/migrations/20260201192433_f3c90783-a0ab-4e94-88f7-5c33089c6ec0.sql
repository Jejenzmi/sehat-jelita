-- Create users for each role in the system
-- Password for all accounts: simrs2024

-- Note: We'll use a function to create users and assign roles
-- This needs to be done via edge function or manually since auth.users is managed by Supabase Auth

-- Instead, we'll create a seed_users table to track which demo users should exist
-- The actual user creation will need to be done through the Supabase Auth API

CREATE TABLE IF NOT EXISTS public.demo_accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE NOT NULL,
    role public.app_role NOT NULL,
    full_name text NOT NULL,
    description text,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.demo_accounts ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read demo accounts (for documentation purposes)
CREATE POLICY "Demo accounts are viewable by authenticated users"
ON public.demo_accounts FOR SELECT TO authenticated USING (true);

-- Insert demo account references
INSERT INTO public.demo_accounts (email, role, full_name, description) VALUES
('admin@simrs.com', 'admin', 'Administrator Sistem', 'Akses penuh ke semua modul'),
('dokter@simrs.com', 'dokter', 'Dr. Ahmad Pratama', 'Dokter umum/spesialis'),
('perawat@simrs.com', 'perawat', 'Siti Nurhaliza', 'Perawat ruangan'),
('kasir@simrs.com', 'kasir', 'Budi Santoso', 'Kasir/billing'),
('farmasi@simrs.com', 'farmasi', 'Apt. Dewi Lestari', 'Apoteker farmasi'),
('laboratorium@simrs.com', 'laboratorium', 'Analis Rudi', 'Analis laboratorium'),
('radiologi@simrs.com', 'radiologi', 'Radiografer Andi', 'Radiografer'),
('pendaftaran@simrs.com', 'pendaftaran', 'Rina Wijaya', 'Staff pendaftaran'),
('keuangan@simrs.com', 'keuangan', 'Hendra Kusuma', 'Staff keuangan/akuntansi'),
('gizi@simrs.com', 'gizi', 'Ahli Gizi Maya', 'Ahli gizi'),
('icu@simrs.com', 'icu', 'Perawat ICU Dian', 'Perawat ICU'),
('bedah@simrs.com', 'bedah', 'Dr. Bedah Surya', 'Tim kamar operasi'),
('rehabilitasi@simrs.com', 'rehabilitasi', 'Fisioterapis Yoga', 'Fisioterapis rehabilitasi'),
('mcu@simrs.com', 'mcu', 'Koordinator MCU Linda', 'Koordinator Medical Check Up'),
('forensik@simrs.com', 'forensik', 'Dr. Forensik Eko', 'Dokter forensik'),
('cssd@simrs.com', 'cssd', 'Staff CSSD Ratna', 'Staff sterilisasi'),
('manajemen@simrs.com', 'manajemen', 'Direktur RS Joko', 'Manajemen eksekutif'),
('bank_darah@simrs.com', 'bank_darah', 'Staff UTD Sari', 'Staff bank darah')
ON CONFLICT (email) DO NOTHING;