# 💸 HutaPi (Hutang Piutang App)

HutaPi adalah aplikasi pengelola hutang dan piutang berbasis web.

---

## 🚀 Fitur Utama

- **🔐 Autentikasi Aman:** Dilengkapi dengan sistem otentikasi login/registrasi _seamless_ dan privat milik Anda sendiri, memanfaatkan ketangguhan Supabase Auth.
- **📊 Ringkasan Dasbor Dinamis:** Menyajikan ringkasan visual (*Summary Cards*) terkait jumlah Net Total Hutang, Total Piutang, hingga alokasi uang Anda ke dalam bentuk yang sangat interaktif dan responsif sekilas pandang.
- **👥 Contact Grouping (Buku Besar Personal):** Melacak catatan pinjam-meminjam uang Anda digabung berdasarkan kontak (teman/klien). Anda bisa langsung melihat *Net Balance* (siapa berhutang padamu, atau sebaliknya) per kontak dengan rincian *pop-up modal* gaya buku ledger.
- **💳 Manajemen Transaksi Komprehensif:** 
  - Catat *Hutang* maupun *Piutang*.
  - Masukkan catatan khusus.
  - Tambah & kelompokkan *kategori transaksi* serta *sumber dana* (misal: Cash, DANA, GoPay, BCA, dll).
  - Tinjau dan atur status _Lunas_ dan _Belum Lunas_ (termasuk tag waktu pelunasan kapan diselesaikan).
- **⚡ Pencarian & Filter Cepat:** Temukan data kontak spesifik Anda atau filter catatan Anda (*Berdasarkan Jenis Pinjaman/Status/Tanggal*) secara tajam, berkat implementasi kalkulasi _Real-time_ memori (*Zero-latency search*).
- **📱 Mobile-First UI/UX:** Tampilan dan animasi antarmukanya dirancang sangat bersahabat secara *mobile* (layar ponsel). Beragam aspek seperti _Floating Button (+)_ dan gesekan kanvas *BottomSheet* (_dvh units_) siap bekerja di semua peramban smartphone masa kini agar Anda bisa mengelola dana pinjaman sambil lalu.

---

## 🛠️ Tech Stack

- **Language:** TypeScript
- **Framework:** React 18, Vite 
- **Styling:** Tailwind CSS, Tailwind Animate
- **Icons:** Lucide-React
- **Database & Backend:** Supabase
---

## 💻 Instalasi

### 1. Kloning Repositori
```bash
git clone https://github.com/USERNAME_ANDA/HutaPi.git
cd HutaPi
```

### 2. Instalasi Dependensi
```bash
npm install
```

### 3. Pengaturan Database Supabase (SQL Editor)
Agar aplikasi ini dapat menyimpan data secara *cloud*, Anda harus mendaftarkan skema tabel di _dashboard_ Supabase:
1. Buka project Supabase Anda > **SQL Editor** > **New Query**.
2. Buka file [`supabase_schema.sql`](file:///d:/Development/Web/HutaPi/HutapiNewUI/supabase_schema.sql) yang tersedia di repositori ini, *copy-paste* seluruh isinya ke Supabase SQL Editor, lalu jalankan (**Run** / `Ctrl + Enter`).

```sql
-- Buat Tabel 'contacts'
CREATE TABLE public.contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL DEFAULT auth.uid(),
    nama TEXT NOT NULL,
    nomor_hp TEXT,
    catatan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Buat Tabel 'transaksi'
CREATE TABLE public.transaksi (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL DEFAULT auth.uid(),
    waktu TIMESTAMP WITH TIME ZONE NOT NULL,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
    nama_contact TEXT NOT NULL,
    jenis TEXT NOT NULL,
    kategori TEXT NOT NULL,
    sumber_dana TEXT NOT NULL,
    nominal NUMERIC NOT NULL,
    catatan TEXT,
    status TEXT NOT NULL,
    waktu_lunas TIMESTAMP WITH TIME ZONE
);

-- Buat Tabel 'custom_sumber_dana'
CREATE TABLE public.custom_sumber_dana (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL DEFAULT auth.uid(),
    nama TEXT NOT NULL
);

-- Buat Tabel 'custom_kategori'
CREATE TABLE public.custom_kategori (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL DEFAULT auth.uid(),
    nama TEXT NOT NULL
);

-- Mengaktifkan Row Level Security (RLS)
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaksi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_sumber_dana ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_kategori ENABLE ROW LEVEL SECURITY;

-- Membuat Peraturan Akses Terproteksi (Policies)
CREATE POLICY "Akses mandiri Contacts" ON public.contacts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Akses mandiri Transaksi" ON public.transaksi FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Akses mandiri Sumber Dana" ON public.custom_sumber_dana FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Akses mandiri Kategori" ON public.custom_kategori FOR ALL USING (auth.uid() = user_id);
```

### 4. Pengaturan Konfigurasi Env (.env.local)
Buka folder utama aplikasi, duplikat atau buat sebuah *file* bernamakan `.env.local` lalu isi dengan kunci akses dari Dashboard proyek Supabase Anda:
```env
VITE_SUPABASE_URL=https://[YOUR_PROJECT_ID].supabase.co
VITE_SUPABASE_ANON_KEY=[YOUR_ANON_KEY]
```
*(Ingat: Skema SQL Tabel dan Policies harus sudah disetup terlebih dahulu di SQL Editor dashboard Anda).*

### 4. Jalankan
Mulai aplikasi _live_ untuk diuji secara lokal:
```bash
npm run dev
```

Aplikasi bisa Anda buka pada port `http://localhost:5173/`
