
-- =====================================================
-- MODUL AKUNTANSI / KEUANGAN RUMAH SAKIT
-- =====================================================

-- 1. CHART OF ACCOUNTS (Daftar Akun)
CREATE TABLE public.chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_code VARCHAR(20) UNIQUE NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_type VARCHAR(50) NOT NULL CHECK (account_type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
    account_category VARCHAR(100),
    parent_account_id UUID REFERENCES public.chart_of_accounts(id),
    level INTEGER DEFAULT 1,
    is_header BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    normal_balance VARCHAR(10) CHECK (normal_balance IN ('debit', 'credit')),
    description TEXT,
    opening_balance DECIMAL(18,2) DEFAULT 0,
    current_balance DECIMAL(18,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. FISCAL PERIODS (Periode Akuntansi)
CREATE TABLE public.fiscal_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    fiscal_year INTEGER NOT NULL,
    period_number INTEGER NOT NULL,
    is_closed BOOLEAN DEFAULT false,
    closed_at TIMESTAMPTZ,
    closed_by UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. JOURNAL ENTRIES (Jurnal Umum)
CREATE TABLE public.journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_number VARCHAR(50) UNIQUE NOT NULL,
    entry_date DATE NOT NULL,
    description TEXT NOT NULL,
    reference_type VARCHAR(50), -- 'billing', 'payroll', 'manual', 'adjustment', 'closing'
    reference_id UUID,
    reference_number VARCHAR(100),
    fiscal_period_id UUID REFERENCES public.fiscal_periods(id),
    total_debit DECIMAL(18,2) NOT NULL DEFAULT 0,
    total_credit DECIMAL(18,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'voided')),
    posted_at TIMESTAMPTZ,
    posted_by UUID,
    voided_at TIMESTAMPTZ,
    voided_by UUID,
    void_reason TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. JOURNAL ENTRY LINES (Detail Jurnal)
CREATE TABLE public.journal_entry_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_entry_id UUID REFERENCES public.journal_entries(id) ON DELETE CASCADE NOT NULL,
    account_id UUID REFERENCES public.chart_of_accounts(id) NOT NULL,
    description TEXT,
    debit_amount DECIMAL(18,2) DEFAULT 0,
    credit_amount DECIMAL(18,2) DEFAULT 0,
    line_number INTEGER NOT NULL,
    department_id UUID REFERENCES public.departments(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. GENERAL LEDGER (Buku Besar - Cached/Materialized)
CREATE TABLE public.general_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES public.chart_of_accounts(id) NOT NULL,
    fiscal_period_id UUID REFERENCES public.fiscal_periods(id),
    period_year INTEGER NOT NULL,
    period_month INTEGER NOT NULL,
    opening_balance DECIMAL(18,2) DEFAULT 0,
    total_debit DECIMAL(18,2) DEFAULT 0,
    total_credit DECIMAL(18,2) DEFAULT 0,
    closing_balance DECIMAL(18,2) DEFAULT 0,
    transaction_count INTEGER DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT now(),
    UNIQUE(account_id, period_year, period_month)
);

-- 6. CASH FLOW CATEGORIES (Kategori Arus Kas)
CREATE TABLE public.cash_flow_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_name VARCHAR(100) NOT NULL,
    category_type VARCHAR(50) NOT NULL CHECK (category_type IN ('operating', 'investing', 'financing')),
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true
);

-- 7. ACCOUNT CASH FLOW MAPPING (Mapping Akun ke Arus Kas)
CREATE TABLE public.account_cash_flow_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES public.chart_of_accounts(id) NOT NULL,
    cash_flow_category_id UUID REFERENCES public.cash_flow_categories(id) NOT NULL,
    is_cash_account BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(account_id)
);

-- 8. BUDGET (Anggaran)
CREATE TABLE public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES public.chart_of_accounts(id) NOT NULL,
    fiscal_year INTEGER NOT NULL,
    period_month INTEGER NOT NULL,
    budget_amount DECIMAL(18,2) DEFAULT 0,
    actual_amount DECIMAL(18,2) DEFAULT 0,
    variance DECIMAL(18,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(account_id, fiscal_year, period_month)
);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Generate Journal Number
CREATE OR REPLACE FUNCTION public.generate_journal_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_number TEXT;
    date_part TEXT;
    sequence_part TEXT;
BEGIN
    date_part := TO_CHAR(NOW(), 'YYYYMM');
    SELECT LPAD((COALESCE(MAX(SUBSTRING(journal_number FROM 11)::INTEGER), 0) + 1)::TEXT, 5, '0')
    INTO sequence_part
    FROM public.journal_entries
    WHERE journal_number LIKE 'JV-' || date_part || '-%';
    
    new_number := 'JV-' || date_part || '-' || sequence_part;
    RETURN new_number;
END;
$$;

-- Update Account Balance after Journal Posting
CREATE OR REPLACE FUNCTION public.update_account_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_account_id UUID;
    v_debit DECIMAL(18,2);
    v_credit DECIMAL(18,2);
    v_normal_balance VARCHAR(10);
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'posted' THEN
        -- Update balances for all accounts in this journal
        FOR v_account_id, v_debit, v_credit IN 
            SELECT account_id, SUM(debit_amount), SUM(credit_amount)
            FROM journal_entry_lines
            WHERE journal_entry_id = NEW.id
            GROUP BY account_id
        LOOP
            SELECT normal_balance INTO v_normal_balance 
            FROM chart_of_accounts WHERE id = v_account_id;
            
            UPDATE chart_of_accounts 
            SET current_balance = CASE 
                WHEN v_normal_balance = 'debit' THEN current_balance + v_debit - v_credit
                ELSE current_balance + v_credit - v_debit
            END,
            updated_at = now()
            WHERE id = v_account_id;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_account_balance
    AFTER INSERT OR UPDATE ON public.journal_entries
    FOR EACH ROW
    EXECUTE FUNCTION public.update_account_balance();

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_coa_account_type ON public.chart_of_accounts(account_type);
CREATE INDEX idx_coa_parent ON public.chart_of_accounts(parent_account_id);
CREATE INDEX idx_journal_entry_date ON public.journal_entries(entry_date);
CREATE INDEX idx_journal_status ON public.journal_entries(status);
CREATE INDEX idx_journal_reference ON public.journal_entries(reference_type, reference_id);
CREATE INDEX idx_journal_lines_account ON public.journal_entry_lines(account_id);
CREATE INDEX idx_general_ledger_period ON public.general_ledger(period_year, period_month);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiscal_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entry_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.general_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_flow_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_cash_flow_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users (admin/kasir can manage)
CREATE POLICY "Authenticated users can view COA" ON public.chart_of_accounts
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage COA" ON public.chart_of_accounts
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'kasir'))
    );

CREATE POLICY "Authenticated users can view fiscal periods" ON public.fiscal_periods
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage fiscal periods" ON public.fiscal_periods
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Authenticated users can view journals" ON public.journal_entries
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/Kasir can manage journals" ON public.journal_entries
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'kasir'))
    );

CREATE POLICY "Authenticated users can view journal lines" ON public.journal_entry_lines
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/Kasir can manage journal lines" ON public.journal_entry_lines
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'kasir'))
    );

CREATE POLICY "Authenticated users can view general ledger" ON public.general_ledger
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "System can manage general ledger" ON public.general_ledger
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Authenticated users can view cash flow categories" ON public.cash_flow_categories
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage cash flow categories" ON public.cash_flow_categories
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Authenticated users can view cash flow mapping" ON public.account_cash_flow_mapping
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage cash flow mapping" ON public.account_cash_flow_mapping
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Authenticated users can view budgets" ON public.budgets
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage budgets" ON public.budgets
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
    );

-- =====================================================
-- SEED DATA: Chart of Accounts (Standar Rumah Sakit)
-- =====================================================
INSERT INTO public.chart_of_accounts (account_code, account_name, account_type, account_category, level, is_header, normal_balance, description) VALUES
-- ASET (1xxx)
('1000', 'ASET', 'asset', 'Aset', 1, true, 'debit', 'Kelompok Aset'),
('1100', 'Aset Lancar', 'asset', 'Aset Lancar', 2, true, 'debit', 'Aset Lancar'),
('1101', 'Kas', 'asset', 'Aset Lancar', 3, false, 'debit', 'Kas di Tangan'),
('1102', 'Kas di Bank - BCA', 'asset', 'Aset Lancar', 3, false, 'debit', 'Rekening Bank BCA'),
('1103', 'Kas di Bank - Mandiri', 'asset', 'Aset Lancar', 3, false, 'debit', 'Rekening Bank Mandiri'),
('1110', 'Piutang Usaha', 'asset', 'Aset Lancar', 3, false, 'debit', 'Piutang dari Pasien'),
('1111', 'Piutang BPJS', 'asset', 'Aset Lancar', 3, false, 'debit', 'Piutang Klaim BPJS'),
('1112', 'Piutang Asuransi', 'asset', 'Aset Lancar', 3, false, 'debit', 'Piutang Klaim Asuransi'),
('1120', 'Persediaan Obat', 'asset', 'Aset Lancar', 3, false, 'debit', 'Persediaan Obat-obatan'),
('1121', 'Persediaan Alkes', 'asset', 'Aset Lancar', 3, false, 'debit', 'Persediaan Alat Kesehatan'),
('1122', 'Persediaan BHP', 'asset', 'Aset Lancar', 3, false, 'debit', 'Bahan Habis Pakai'),
('1130', 'Biaya Dibayar Dimuka', 'asset', 'Aset Lancar', 3, false, 'debit', 'Prepaid Expenses'),
('1200', 'Aset Tetap', 'asset', 'Aset Tetap', 2, true, 'debit', 'Aset Tetap'),
('1201', 'Tanah', 'asset', 'Aset Tetap', 3, false, 'debit', 'Tanah'),
('1202', 'Bangunan', 'asset', 'Aset Tetap', 3, false, 'debit', 'Gedung dan Bangunan'),
('1203', 'Akumulasi Penyusutan Bangunan', 'asset', 'Aset Tetap', 3, false, 'credit', 'Akumulasi Depresiasi Bangunan'),
('1210', 'Peralatan Medis', 'asset', 'Aset Tetap', 3, false, 'debit', 'Peralatan Medis'),
('1211', 'Akumulasi Penyusutan Peralatan Medis', 'asset', 'Aset Tetap', 3, false, 'credit', 'Akumulasi Depresiasi Peralatan'),
('1220', 'Kendaraan', 'asset', 'Aset Tetap', 3, false, 'debit', 'Kendaraan Operasional'),
('1221', 'Akumulasi Penyusutan Kendaraan', 'asset', 'Aset Tetap', 3, false, 'credit', 'Akumulasi Depresiasi Kendaraan'),
('1230', 'Inventaris Kantor', 'asset', 'Aset Tetap', 3, false, 'debit', 'Peralatan Kantor'),
('1231', 'Akumulasi Penyusutan Inventaris', 'asset', 'Aset Tetap', 3, false, 'credit', 'Akumulasi Depresiasi Inventaris'),

-- LIABILITAS (2xxx)
('2000', 'LIABILITAS', 'liability', 'Liabilitas', 1, true, 'credit', 'Kelompok Kewajiban'),
('2100', 'Liabilitas Jangka Pendek', 'liability', 'Liabilitas Lancar', 2, true, 'credit', 'Kewajiban Jangka Pendek'),
('2101', 'Hutang Usaha', 'liability', 'Liabilitas Lancar', 3, false, 'credit', 'Hutang ke Supplier'),
('2102', 'Hutang Gaji', 'liability', 'Liabilitas Lancar', 3, false, 'credit', 'Gaji yang Masih Harus Dibayar'),
('2103', 'Hutang Pajak', 'liability', 'Liabilitas Lancar', 3, false, 'credit', 'Pajak yang Masih Harus Dibayar'),
('2104', 'Hutang BPJS Ketenagakerjaan', 'liability', 'Liabilitas Lancar', 3, false, 'credit', 'Hutang BPJS TK'),
('2105', 'Hutang BPJS Kesehatan', 'liability', 'Liabilitas Lancar', 3, false, 'credit', 'Hutang BPJS Kes'),
('2110', 'Pendapatan Diterima Dimuka', 'liability', 'Liabilitas Lancar', 3, false, 'credit', 'Unearned Revenue'),
('2200', 'Liabilitas Jangka Panjang', 'liability', 'Liabilitas Jangka Panjang', 2, true, 'credit', 'Kewajiban Jangka Panjang'),
('2201', 'Hutang Bank', 'liability', 'Liabilitas Jangka Panjang', 3, false, 'credit', 'Pinjaman Bank'),

-- EKUITAS (3xxx)
('3000', 'EKUITAS', 'equity', 'Ekuitas', 1, true, 'credit', 'Kelompok Modal'),
('3100', 'Modal Disetor', 'equity', 'Modal', 2, false, 'credit', 'Modal Awal'),
('3200', 'Laba Ditahan', 'equity', 'Laba Ditahan', 2, false, 'credit', 'Retained Earnings'),
('3300', 'Laba Tahun Berjalan', 'equity', 'Laba Tahun Berjalan', 2, false, 'credit', 'Current Year Earnings'),

-- PENDAPATAN (4xxx)
('4000', 'PENDAPATAN', 'revenue', 'Pendapatan', 1, true, 'credit', 'Kelompok Pendapatan'),
('4100', 'Pendapatan Rawat Jalan', 'revenue', 'Pendapatan Operasional', 2, true, 'credit', 'Pendapatan Rawat Jalan'),
('4101', 'Pendapatan Konsultasi Dokter', 'revenue', 'Pendapatan Operasional', 3, false, 'credit', 'Jasa Dokter'),
('4102', 'Pendapatan Tindakan Medis', 'revenue', 'Pendapatan Operasional', 3, false, 'credit', 'Tindakan Poliklinik'),
('4200', 'Pendapatan Rawat Inap', 'revenue', 'Pendapatan Operasional', 2, true, 'credit', 'Pendapatan Rawat Inap'),
('4201', 'Pendapatan Kamar', 'revenue', 'Pendapatan Operasional', 3, false, 'credit', 'Sewa Kamar Rawat Inap'),
('4202', 'Pendapatan Asuhan Keperawatan', 'revenue', 'Pendapatan Operasional', 3, false, 'credit', 'Jasa Perawat'),
('4300', 'Pendapatan IGD', 'revenue', 'Pendapatan Operasional', 2, false, 'credit', 'Pendapatan Unit Gawat Darurat'),
('4400', 'Pendapatan Laboratorium', 'revenue', 'Pendapatan Penunjang', 2, false, 'credit', 'Pemeriksaan Lab'),
('4500', 'Pendapatan Radiologi', 'revenue', 'Pendapatan Penunjang', 2, false, 'credit', 'Pemeriksaan Radiologi'),
('4600', 'Pendapatan Farmasi', 'revenue', 'Pendapatan Penunjang', 2, false, 'credit', 'Penjualan Obat'),
('4700', 'Pendapatan Operasi', 'revenue', 'Pendapatan Operasional', 2, false, 'credit', 'Pendapatan Kamar Operasi'),
('4800', 'Pendapatan MCU', 'revenue', 'Pendapatan Operasional', 2, false, 'credit', 'Medical Check Up'),
('4900', 'Pendapatan Lain-lain', 'revenue', 'Pendapatan Lain-lain', 2, false, 'credit', 'Pendapatan Non-Operasional'),

-- BEBAN (5xxx)
('5000', 'BEBAN', 'expense', 'Beban', 1, true, 'debit', 'Kelompok Beban'),
('5100', 'Beban Gaji & Tunjangan', 'expense', 'Beban Operasional', 2, true, 'debit', 'Beban Personalia'),
('5101', 'Gaji Pokok', 'expense', 'Beban Operasional', 3, false, 'debit', 'Gaji Karyawan'),
('5102', 'Tunjangan Jabatan', 'expense', 'Beban Operasional', 3, false, 'debit', 'Tunjangan Struktural'),
('5103', 'Tunjangan Transport', 'expense', 'Beban Operasional', 3, false, 'debit', 'Tunjangan Transportasi'),
('5104', 'Tunjangan Makan', 'expense', 'Beban Operasional', 3, false, 'debit', 'Uang Makan'),
('5105', 'Lembur', 'expense', 'Beban Operasional', 3, false, 'debit', 'Upah Lembur'),
('5106', 'BPJS Perusahaan', 'expense', 'Beban Operasional', 3, false, 'debit', 'Kontribusi BPJS Perusahaan'),
('5107', 'Jasa Medis Dokter', 'expense', 'Beban Operasional', 3, false, 'debit', 'Fee Dokter'),
('5200', 'Beban Obat & BHP', 'expense', 'Beban Langsung', 2, true, 'debit', 'Beban Farmasi'),
('5201', 'HPP Obat', 'expense', 'Beban Langsung', 3, false, 'debit', 'Harga Pokok Obat'),
('5202', 'HPP Alat Kesehatan', 'expense', 'Beban Langsung', 3, false, 'debit', 'Harga Pokok Alkes'),
('5203', 'Bahan Habis Pakai', 'expense', 'Beban Langsung', 3, false, 'debit', 'BHP Medis'),
('5300', 'Beban Operasional', 'expense', 'Beban Operasional', 2, true, 'debit', 'Beban Operasional Umum'),
('5301', 'Beban Listrik', 'expense', 'Beban Operasional', 3, false, 'debit', 'Tagihan PLN'),
('5302', 'Beban Air', 'expense', 'Beban Operasional', 3, false, 'debit', 'Tagihan PDAM'),
('5303', 'Beban Telepon & Internet', 'expense', 'Beban Operasional', 3, false, 'debit', 'Komunikasi'),
('5304', 'Beban Kebersihan', 'expense', 'Beban Operasional', 3, false, 'debit', 'Cleaning Service'),
('5305', 'Beban Keamanan', 'expense', 'Beban Operasional', 3, false, 'debit', 'Security'),
('5306', 'Beban Pemeliharaan', 'expense', 'Beban Operasional', 3, false, 'debit', 'Maintenance'),
('5307', 'Beban ATK', 'expense', 'Beban Operasional', 3, false, 'debit', 'Alat Tulis Kantor'),
('5400', 'Beban Penyusutan', 'expense', 'Beban Non-Kas', 2, true, 'debit', 'Depresiasi'),
('5401', 'Penyusutan Bangunan', 'expense', 'Beban Non-Kas', 3, false, 'debit', 'Depresiasi Gedung'),
('5402', 'Penyusutan Peralatan Medis', 'expense', 'Beban Non-Kas', 3, false, 'debit', 'Depresiasi Alat Medis'),
('5403', 'Penyusutan Kendaraan', 'expense', 'Beban Non-Kas', 3, false, 'debit', 'Depresiasi Kendaraan'),
('5404', 'Penyusutan Inventaris', 'expense', 'Beban Non-Kas', 3, false, 'debit', 'Depresiasi Inventaris'),
('5500', 'Beban Lain-lain', 'expense', 'Beban Lain-lain', 2, false, 'debit', 'Beban Non-Operasional'),
('5501', 'Beban Bunga', 'expense', 'Beban Lain-lain', 3, false, 'debit', 'Interest Expense'),
('5502', 'Beban Administrasi Bank', 'expense', 'Beban Lain-lain', 3, false, 'debit', 'Biaya Admin Bank');

-- Seed Cash Flow Categories
INSERT INTO public.cash_flow_categories (category_name, category_type, display_order) VALUES
('Penerimaan dari Pasien', 'operating', 1),
('Penerimaan dari BPJS/Asuransi', 'operating', 2),
('Pembayaran ke Supplier', 'operating', 3),
('Pembayaran Gaji Karyawan', 'operating', 4),
('Pembayaran Pajak', 'operating', 5),
('Pembayaran Beban Operasional', 'operating', 6),
('Pembelian Aset Tetap', 'investing', 10),
('Penjualan Aset Tetap', 'investing', 11),
('Penerimaan Pinjaman Bank', 'financing', 20),
('Pembayaran Pinjaman Bank', 'financing', 21),
('Setoran Modal', 'financing', 22),
('Pembagian Dividen', 'financing', 23);

-- Seed Current Fiscal Period
INSERT INTO public.fiscal_periods (period_name, start_date, end_date, fiscal_year, period_number) VALUES
('Januari 2026', '2026-01-01', '2026-01-31', 2026, 1),
('Februari 2026', '2026-02-01', '2026-02-28', 2026, 2),
('Maret 2026', '2026-03-01', '2026-03-31', 2026, 3),
('April 2026', '2026-04-01', '2026-04-30', 2026, 4),
('Mei 2026', '2026-05-01', '2026-05-31', 2026, 5),
('Juni 2026', '2026-06-01', '2026-06-30', 2026, 6),
('Juli 2026', '2026-07-01', '2026-07-31', 2026, 7),
('Agustus 2026', '2026-08-01', '2026-08-31', 2026, 8),
('September 2026', '2026-09-01', '2026-09-30', 2026, 9),
('Oktober 2026', '2026-10-01', '2026-10-31', 2026, 10),
('November 2026', '2026-11-01', '2026-11-30', 2026, 11),
('Desember 2026', '2026-12-01', '2026-12-31', 2026, 12);
