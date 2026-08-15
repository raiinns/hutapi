-- ==============================================================================
-- 💸 HutaPi (Hutang Piutang App) - Complete Supabase Database Script
-- ==============================================================================
-- Deskripsi: Script DDL & DML lengkap untuk inisialisasi database Supabase
-- Fitur: Tabel, Constraints, Indexing, RLS (Row Level Security), Trigger Sync, & Views
-- Cara Pakai: 
-- 1. Buka Dashboard Supabase (https://supabase.com/dashboard)
-- 2. Pilih Project Anda -> Buka menu "SQL Editor" -> Click "New query"
-- 3. Paste seluruh isi script ini, lalu tekan tombol "Run" (atau Ctrl + Enter).
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EKSPLISIT SKEMA PUBLIC & EKSTENSI
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 2. PEMBUATAN TABEL KUNCI
-- ------------------------------------------------------------------------------

-- Tabel 2.1: Contacts (Buku Kontak / Debit & Kredit)
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    nama TEXT NOT NULL,
    nomor_hp TEXT,
    catatan TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Tabel 2.2: Transaksi (Catatan Hutang / Piutang)
CREATE TABLE IF NOT EXISTS public.transaksi (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    waktu TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    nama_contact TEXT NOT NULL,
    jenis TEXT NOT NULL CHECK (jenis IN ('hutang', 'piutang')),
    kategori TEXT NOT NULL,
    sumber_dana TEXT NOT NULL,
    nominal NUMERIC(15, 2) NOT NULL CHECK (nominal >= 0),
    catatan TEXT,
    status TEXT NOT NULL DEFAULT 'belum_lunas' CHECK (status IN ('belum_lunas', 'dicicil', 'lunas')),
    waktu_lunas TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Tabel 2.3: Pembayaran Cicilan (Log Cicilan / Pembayaran Bertahap)
CREATE TABLE IF NOT EXISTS public.pembayaran_cicilan (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    transaksi_id UUID NOT NULL REFERENCES public.transaksi(id) ON DELETE CASCADE,
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    waktu TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    nominal NUMERIC(15, 2) NOT NULL CHECK (nominal > 0),
    sumber_dana TEXT NOT NULL,
    catatan TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Tabel 2.4: Custom Sumber Dana
CREATE TABLE IF NOT EXISTS public.custom_sumber_dana (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    nama TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_user_sumber_dana UNIQUE (user_id, nama)
);

-- Tabel 2.5: Custom Kategori
CREATE TABLE IF NOT EXISTS public.custom_kategori (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    nama TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_user_kategori UNIQUE (user_id, nama)
);

-- ------------------------------------------------------------------------------
-- 3. PERFORMANSI & OPTIMASI (INDEXES)
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON public.contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON public.contacts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transaksi_user_id ON public.transaksi(user_id);
CREATE INDEX IF NOT EXISTS idx_transaksi_contact_id ON public.transaksi(contact_id);
CREATE INDEX IF NOT EXISTS idx_transaksi_status ON public.transaksi(status);
CREATE INDEX IF NOT EXISTS idx_transaksi_jenis ON public.transaksi(jenis);
CREATE INDEX IF NOT EXISTS idx_transaksi_waktu ON public.transaksi(waktu DESC);

CREATE INDEX IF NOT EXISTS idx_pembayaran_cicilan_transaksi_id ON public.pembayaran_cicilan(transaksi_id);
CREATE INDEX IF NOT EXISTS idx_pembayaran_cicilan_user_id ON public.pembayaran_cicilan(user_id);
CREATE INDEX IF NOT EXISTS idx_pembayaran_cicilan_waktu ON public.pembayaran_cicilan(waktu DESC);

CREATE INDEX IF NOT EXISTS idx_custom_sumber_user ON public.custom_sumber_dana(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_kategori_user ON public.custom_kategori(user_id);

-- ------------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
-- Mengaktifkan RLS di seluruh tabel
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaksi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pembayaran_cicilan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_sumber_dana ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_kategori ENABLE ROW LEVEL SECURITY;

-- Policy Contacts
DROP POLICY IF EXISTS "Users can perform all actions on their own contacts" ON public.contacts;
CREATE POLICY "Users can perform all actions on their own contacts" 
    ON public.contacts FOR ALL 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

-- Policy Transaksi
DROP POLICY IF EXISTS "Users can perform all actions on their own transaksi" ON public.transaksi;
CREATE POLICY "Users can perform all actions on their own transaksi" 
    ON public.transaksi FOR ALL 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

-- Policy Pembayaran Cicilan
DROP POLICY IF EXISTS "Users can perform all actions on their own cicilan" ON public.pembayaran_cicilan;
CREATE POLICY "Users can perform all actions on their own cicilan" 
    ON public.pembayaran_cicilan FOR ALL 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

-- Policy Custom Sumber Dana
DROP POLICY IF EXISTS "Users can perform all actions on their own custom sumber dana" ON public.custom_sumber_dana;
CREATE POLICY "Users can perform all actions on their own custom sumber dana" 
    ON public.custom_sumber_dana FOR ALL 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

-- Policy Custom Kategori
DROP POLICY IF EXISTS "Users can perform all actions on their own custom kategori" ON public.custom_kategori;
CREATE POLICY "Users can perform all actions on their own custom kategori" 
    ON public.custom_kategori FOR ALL 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 5. AUTOMATION TRIGGERS & FUNCTIONS
-- ------------------------------------------------------------------------------

-- Trigger 5.1: Otomatis perbarui updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_contacts ON public.contacts;
CREATE TRIGGER set_updated_at_contacts
    BEFORE UPDATE ON public.contacts
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_transaksi ON public.transaksi;
CREATE TRIGGER set_updated_at_transaksi
    BEFORE UPDATE ON public.transaksi
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger 5.2: Sinkronisasi nama_contact di transaksi jika nama di contacts diubah
CREATE OR REPLACE FUNCTION public.sync_contact_name_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.nama IS DISTINCT FROM NEW.nama THEN
        UPDATE public.transaksi
        SET nama_contact = NEW.nama
        WHERE contact_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_contact_name ON public.contacts;
CREATE TRIGGER sync_contact_name
    AFTER UPDATE ON public.contacts
    FOR EACH ROW EXECUTE FUNCTION public.sync_contact_name_change();

-- Trigger 5.3: Otomatis set waktu_lunas saat status berubah jadi 'lunas'
CREATE OR REPLACE FUNCTION public.handle_waktu_lunas()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'lunas' AND (OLD.status IS NULL OR OLD.status != 'lunas') THEN
        IF NEW.waktu_lunas IS NULL THEN
            NEW.waktu_lunas = timezone('utc'::text, now());
        END IF;
    ELSIF NEW.status IN ('belum_lunas', 'dicicil') THEN
        NEW.waktu_lunas = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_waktu_lunas ON public.transaksi;
CREATE TRIGGER auto_waktu_lunas
    BEFORE INSERT OR UPDATE ON public.transaksi
    FOR EACH ROW EXECUTE FUNCTION public.handle_waktu_lunas();

-- Trigger 5.4: Sinkronisasi Otomatis Status Transaksi saat Pembayaran Cicilan Ditambah/Dihapus
CREATE OR REPLACE FUNCTION public.sync_transaksi_cicilan_status()
RETURNS TRIGGER AS $$
DECLARE
    target_tx_id UUID;
    tx_nominal NUMERIC;
    total_paid NUMERIC;
BEGIN
    IF TG_OP = 'DELETE' THEN
        target_tx_id := OLD.transaksi_id;
    ELSE
        target_tx_id := NEW.transaksi_id;
    END IF;

    -- Ambil nominal pokok transaksi
    SELECT nominal INTO tx_nominal FROM public.transaksi WHERE id = target_tx_id;
    IF tx_nominal IS NULL THEN
        RETURN NULL;
    END IF;

    -- Hitung akumulasi cicilan yang sudah masuk
    SELECT COALESCE(SUM(nominal), 0) INTO total_paid 
    FROM public.pembayaran_cicilan 
    WHERE transaksi_id = target_tx_id;

    -- Tentukan status otomatis
    IF total_paid >= tx_nominal AND tx_nominal > 0 THEN
        UPDATE public.transaksi 
        SET status = 'lunas',
            waktu_lunas = COALESCE(waktu_lunas, timezone('utc'::text, now()))
        WHERE id = target_tx_id;
    ELSIF total_paid > 0 THEN
        UPDATE public.transaksi 
        SET status = 'dicicil',
            waktu_lunas = NULL
        WHERE id = target_tx_id;
    ELSE
        UPDATE public.transaksi 
        SET status = 'belum_lunas',
            waktu_lunas = NULL
        WHERE id = target_tx_id;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_transaksi_cicilan_status ON public.pembayaran_cicilan;
CREATE TRIGGER trg_sync_transaksi_cicilan_status
    AFTER INSERT OR UPDATE OR DELETE ON public.pembayaran_cicilan
    FOR EACH ROW EXECUTE FUNCTION public.sync_transaksi_cicilan_status();

-- ------------------------------------------------------------------------------
-- 6. VIEWS & HELPER RPC (OPTIONAL FOR ANALYTICS)
-- ------------------------------------------------------------------------------

-- View Ringkasan Per Kontak dengan Cicilan
CREATE OR REPLACE VIEW public.v_summary_per_contact AS
WITH cicilan_agg AS (
    SELECT transaksi_id, SUM(nominal) AS total_dibayar
    FROM public.pembayaran_cicilan
    GROUP BY transaksi_id
),
tx_calc AS (
    SELECT 
        t.user_id,
        t.contact_id,
        t.jenis,
        t.status,
        t.nominal,
        COALESCE(c.total_dibayar, 0) AS total_dibayar,
        GREATEST(t.nominal - COALESCE(c.total_dibayar, 0), 0) AS sisa_nominal
    FROM public.transaksi t
    LEFT JOIN cicilan_agg c ON t.id = c.transaksi_id
)
SELECT 
    ct.user_id,
    ct.id AS contact_id,
    ct.nama,
    ct.nomor_hp,
    COALESCE(SUM(CASE WHEN tx.jenis = 'piutang' AND tx.status != 'lunas' THEN tx.sisa_nominal ELSE 0 END), 0) AS total_piutang_aktif,
    COALESCE(SUM(CASE WHEN tx.jenis = 'hutang' AND tx.status != 'lunas' THEN tx.sisa_nominal ELSE 0 END), 0) AS total_hutang_aktif,
    COALESCE(SUM(CASE WHEN tx.jenis = 'piutang' AND tx.status != 'lunas' THEN tx.sisa_nominal ELSE 0 END), 0) -
    COALESCE(SUM(CASE WHEN tx.jenis = 'hutang' AND tx.status != 'lunas' THEN tx.sisa_nominal ELSE 0 END), 0) AS net_balance
FROM public.contacts ct
LEFT JOIN tx_calc tx ON ct.id = tx.contact_id
GROUP BY ct.user_id, ct.id, ct.nama, ct.nomor_hp;

-- Grant permissions pada public schema untuk authenticated user
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ==============================================================================
-- SCRIPT SELESAI
-- ==============================================================================

