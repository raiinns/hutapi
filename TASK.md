# TASK — Recreation Specification for Hutapi

Dokumen ini adalah panduan untuk membuat ulang **Hutapi**, sebuah aplikasi web pencatat hutang dan piutang personal. Gunakan project yang ada sebagai referensi untuk memahami produk, data, dan behavior-nya, bukan sebagai template visual yang harus dikloning.

---

## 1. Prinsip Utama Recreation

Hasil recreation **tidak wajib** dan **tidak diharapkan** menyalin tampilan project asli.

Agent bebas menentukan:

- tema visual;
- design system;
- layout desktop dan mobile;
- warna dan tipografi;
- library komponen;
- pola navigasi;
- bentuk card, tabel, modal, drawer, atau halaman detail;
- pendekatan UX yang dianggap lebih baik.

Yang wajib dipertahankan adalah:

- tujuan produk;
- makna data;
- perspektif hutang dan piutang;
- fitur inti;
- alur pengguna utama;
- kalkulasi keuangan;
- persistensi dan isolasi data per pengguna;
- behavior transaksi dan pelunasan.

Jangan membuat keputusan visual hanya karena project referensi menggunakan suatu warna, ukuran, layout, atau library tertentu.

---

# 2. Gambaran Umum Project

## 2.1 Tujuan utama

Hutapi membantu pengguna mencatat hubungan hutang-piutang dengan orang lain secara personal. Aplikasi berfungsi sebagai buku besar sederhana untuk menjawab pertanyaan berikut:

- Berapa total uang yang masih harus saya bayar?
- Berapa total uang yang masih harus saya terima?
- Siapa yang berhutang kepada saya?
- Kepada siapa saya berhutang?
- Transaksi mana yang belum lunas?
- Dari sumber dana mana transaksi tersebut berasal?
- Bagaimana riwayat transaksi saya dengan kontak tertentu?

## 2.2 Masalah yang diselesaikan

Pencatatan hutang informal sering tersebar di chat, catatan manual, atau hanya mengandalkan ingatan. Akibatnya pengguna sulit mengetahui nominal aktif, status pelunasan, tanggal transaksi, dan hubungan saldo dengan setiap orang.

Hutapi menyelesaikan masalah tersebut dengan:

1. menyimpan transaksi dalam data terstruktur;
2. mengaitkan setiap transaksi dengan kontak;
3. membedakan hutang dan piutang dari perspektif pengguna;
4. melacak status lunas atau belum lunas;
5. menghitung ringkasan secara otomatis;
6. menyediakan riwayat per kontak;
7. menyimpan data secara privat per akun.

## 2.3 Target pengguna

Target utama adalah individu yang perlu mencatat pinjam-meminjam uang atau transaksi informal dengan:

- teman;
- keluarga;
- pelanggan;
- rekan kerja;
- partner usaha kecil;
- pihak lain yang memiliki hubungan hutang-piutang langsung.

Aplikasi bukan sistem akuntansi perusahaan, invoicing kompleks, atau ledger double-entry penuh.

## 2.4 Cara penggunaan secara umum

1. Pengguna masuk ke akun.
2. Pengguna membuat atau memilih kontak.
3. Pengguna mencatat transaksi sebagai hutang atau piutang.
4. Aplikasi menampilkan ringkasan transaksi yang belum lunas.
5. Transaksi dikelompokkan berdasarkan kontak.
6. Pengguna membuka riwayat kontak untuk melihat detail.
7. Saat transaksi selesai, pengguna mengubah status menjadi lunas.
8. Ringkasan dan saldo diperbarui otomatis.

---

# 3. Terminologi dan Perspektif Data

Perspektif berikut wajib konsisten di seluruh aplikasi:

- **Piutang**: kontak/orang lain berhutang kepada pengguna. Uang diharapkan diterima pengguna.
- **Hutang**: pengguna berhutang kepada kontak/orang lain. Uang perlu dibayar pengguna.
- **Belum lunas**: transaksi masih memengaruhi saldo aktif.
- **Lunas**: transaksi menjadi bagian riwayat, tetapi tidak lagi memengaruhi saldo aktif.

Gunakan penjelasan eksplisit jika diperlukan, misalnya:

- “Budi berhutang kepada Anda” untuk piutang;
- “Anda berhutang kepada Budi” untuk hutang.

Jangan hanya mengandalkan warna atau tanda positif/negatif untuk menjelaskan arah transaksi.

---

# 4. Fitur dan Fungsi Utama

## 4.1 Fitur inti

### A. Autentikasi dan privasi pengguna

Aplikasi harus memiliki autentikasi berbasis akun.

Behavior wajib:

- pengguna yang belum terautentikasi tidak dapat melihat data aplikasi;
- pengguna dapat login menggunakan email dan password;
- session dipulihkan saat halaman dimuat ulang;
- perubahan status autentikasi langsung memperbarui tampilan;
- pengguna dapat logout;
- data setiap pengguna harus terisolasi dari pengguna lain;
- query data hanya aktif setelah identitas user diketahui;
- query key/cache harus terikat pada `userId` atau dibersihkan ketika akun berubah;
- logout harus membersihkan cache data privat agar data akun sebelumnya tidak sempat tampil.

Registrasi email/password tersedia pada logika referensi, tetapi switch registrasi pada UI saat ini tidak aktif. Untuk recreation:

- login dan logout adalah fitur wajib;
- registrasi mandiri boleh disediakan dan direkomendasikan jika aplikasi akan digunakan tanpa provisioning akun manual;
- jika registrasi tidak disediakan, dokumentasikan bagaimana akun dibuat.

### B. Manajemen kontak

Setiap transaksi terhubung ke sebuah kontak.

Data kontak minimum:

- ID unik;
- nama, wajib;
- nomor HP, opsional;
- catatan, opsional;
- waktu dibuat;
- ID pemilik/user.

Operasi wajib:

- melihat daftar kontak;
- menambah kontak;
- mengedit nama, nomor HP, dan catatan;
- menghapus kontak dengan konfirmasi;
- menampilkan kondisi kosong jika belum ada kontak.

Behavior penting:

- nama kontak yang diubah harus ikut tersinkronisasi pada transaksi jika nama juga disimpan secara denormalisasi di record transaksi;
- aplikasi referensi memungkinkan membuat kontak baru langsung dari form transaksi;
- penghapusan kontak harus memiliki aturan yang eksplisit terhadap transaksi terkait.

**Catatan konflik referensi:** skema SQL di project memakai foreign key `ON DELETE CASCADE`, sehingga menghapus kontak juga menghapus transaksinya. Teks konfirmasi pada salah satu UI lama menyatakan sebaliknya. Recreation tidak boleh mempertahankan kontradiksi ini. Pilih salah satu kebijakan berikut dan komunikasikan dengan jelas:

1. **Cascade delete**: transaksi kontak ikut dihapus, dengan konfirmasi yang menjelaskan dampaknya; atau
2. **Restrict/archive**: kontak tidak dapat dihapus selama masih memiliki transaksi, atau kontak diarsipkan.

Jika ingin setara dengan skema database referensi, gunakan cascade delete.

### C. Manajemen transaksi

Data transaksi minimum:

- ID unik;
- ID pemilik/user;
- waktu dibuat;
- ID kontak;
- nama kontak snapshot/denormalisasi jika diperlukan;
- jenis: `hutang` atau `piutang`;
- kategori;
- sumber dana;
- nominal;
- catatan opsional;
- status: `belum_lunas` atau `lunas`;
- waktu pelunasan opsional.

Operasi wajib:

- menambah transaksi;
- melihat transaksi melalui pengelompokan kontak dan riwayat detail;
- mengedit transaksi;
- menghapus transaksi dengan konfirmasi;
- mengubah status pelunasan.

Saat menambah transaksi:

1. pengguna memilih `hutang` atau `piutang`;
2. pengguna memilih kontak atau membuat kontak baru;
3. pengguna memasukkan nominal positif;
4. pengguna memilih kategori;
5. pengguna memilih sumber dana;
6. pengguna dapat menambahkan catatan;
7. transaksi baru otomatis berstatus `belum_lunas`;
8. waktu transaksi otomatis menggunakan waktu saat penyimpanan.

Saat mengedit transaksi, pengguna minimal dapat mengubah:

- jenis transaksi;
- kategori;
- sumber dana;
- nominal;
- catatan;
- status pelunasan.

Pada UI referensi, kontak transaksi bersifat read-only ketika edit. Recreation boleh mengizinkan perubahan kontak asalkan relasi dan nama snapshot tetap konsisten.

### D. Pelunasan

Behavior pelunasan wajib:

- ketika status berubah dari `belum_lunas` menjadi `lunas`, isi `waktu_lunas` dengan waktu saat perubahan;
- `waktu_lunas` hanya berubah pada transisi status tersebut, bukan ketika transaksi lunas diedit tanpa mengubah status;
- ketika transaksi yang sudah lunas dibuka kembali menjadi `belum_lunas`, kosongkan `waktu_lunas`;
- transaksi lunas tetap dapat dilihat dalam riwayat;
- transaksi lunas tidak dihitung dalam saldo aktif dashboard;
- status dan waktu pelunasan harus tetap tersimpan setelah reload.

### E. Dashboard dan ringkasan keuangan

Dashboard harus menghitung data dari transaksi yang berstatus `belum_lunas`.

Ringkasan minimum:

1. **Total piutang aktif**
   - jumlah semua transaksi `piutang` yang `belum_lunas`;
2. **Total hutang aktif**
   - jumlah semua transaksi `hutang` yang `belum_lunas`;
3. **Posisi bersih**
   - `totalPiutangAktif - totalHutangAktif`;
   - positif berarti nilai yang akan diterima lebih besar;
   - negatif berarti nilai yang perlu dibayar lebih besar;
4. **Posisi bersih per sumber dana**
   - dikelompokkan berdasarkan `sumberDana`;
   - gunakan konvensi yang sama dengan posisi bersih global: `piutang - hutang` untuk transaksi belum lunas;
   - hasil positif berarti transaksi terkait sumber tersebut lebih banyak berupa nilai yang akan diterima;
   - hasil negatif berarti transaksi terkait sumber tersebut lebih banyak berupa kewajiban yang perlu dibayar;
   - sumber dana adalah atribut transaksi, bukan pihak kreditur, sehingga copy UI tidak boleh menyiratkan bahwa pengguna berhutang “kepada sumber dana”.

Kontrak kalkulasi recreation:

```ts
totalPiutangAktif = sum(
  transaksi where jenis === 'piutang' and status === 'belum_lunas'
)

totalHutangAktif = sum(
  transaksi where jenis === 'hutang' and status === 'belum_lunas'
)

posisiBersih = totalPiutangAktif - totalHutangAktif

posisiPerSumber[sumber] += jenis === 'piutang' ? nominal : -nominal
```

### F. Pengelompokan saldo per kontak

Daftar utama transaksi dikelompokkan berdasarkan kontak, bukan hanya berupa flat table.

Untuk setiap kontak, hitung:

- total hutang belum lunas;
- total piutang belum lunas;
- total hutang lunas;
- total piutang lunas;
- jumlah seluruh transaksi.

Behavior:

- hanya kontak yang memiliki transaksi yang muncul pada daftar saldo/riwayat di dashboard;
- kontak tanpa transaksi tetap muncul pada halaman manajemen kontak;
- memilih satu kontak membuka riwayat lengkap kontak tersebut;
- jika tidak ada hutang maupun piutang aktif, kontak dapat ditandai “semua lunas”.

### G. Pencarian dan filter kontak transaksi

Pada daftar saldo per kontak, pengguna dapat:

- mencari nama kontak, case-insensitive, menggunakan partial match;
- memfilter berdasarkan status:
  - semua;
  - memiliki transaksi belum lunas;
  - memiliki transaksi lunas;
- memfilter berdasarkan jenis:
  - semua;
  - memiliki hutang;
  - memiliki piutang;
- menggabungkan pencarian, filter status, dan filter jenis;
- mereset filter.

Filter menentukan kontak mana yang tampil berdasarkan keberadaan transaksi yang sesuai. Jika beberapa filter aktif bersamaan, seluruh predicate harus dipenuhi oleh transaksi yang sama. Contoh: filter `hutang + belum_lunas` tidak boleh meloloskan kontak yang hanya memiliki hutang lunas dan piutang belum lunas. Agent boleh memilih untuk memfilter isi transaksi secara langsung jika hasilnya lebih mudah dipahami, selama behavior dijelaskan dan tetap menyediakan kemampuan yang setara.

### H. Riwayat transaksi per kontak

Saat kontak dipilih, tampilkan:

- identitas kontak;
- total saldo belum lunas;
- penjelasan siapa berhutang kepada siapa;
- total bersih jika disediakan;
- daftar transaksi kontak;
- status setiap transaksi;
- nominal;
- jenis;
- kategori;
- sumber dana;
- tanggal/waktu;
- catatan jika ada;
- waktu pelunasan jika transaksi sudah lunas;
- aksi edit transaksi.

Kontrol riwayat minimum:

- filter status: semua, belum lunas, lunas;
- sorting berdasarkan waktu;
- sorting berdasarkan nominal;
- ascending dan descending;
- empty state, loading state, dan error state.

Gunakan satu konvensi posisi bersih yang konsisten:

```ts
posisiKontakAktif = totalPiutangBelumLunas - totalHutangBelumLunas
```

Interpretasi:

- `> 0`: kontak berhutang kepada pengguna;
- `< 0`: pengguna berhutang kepada kontak;
- `=== 0`: tidak ada saldo bersih aktif.

Agregat saldo, total tab, dan jumlah status harus dihitung dari seluruh transaksi kontak. Filter status hanya membatasi baris riwayat yang ditampilkan dan tidak boleh mengubah angka agregat utama. Transaksi lunas tidak boleh ikut membentuk “saldo” atau “posisi bersih aktif”. Jika selisih seluruh transaksi termasuk yang lunas ingin ditampilkan, beri label eksplisit seperti “selisih historis”, bukan “saldo”.

### I. Kategori transaksi

Kategori default referensi:

- Uang Tunai;
- Token Listrik;
- Pulsa;
- Paket Data.

Behavior:

- kategori default selalu tersedia;
- pengguna dapat menambahkan kategori custom;
- kategori custom disimpan per pengguna;
- kategori custom dapat dihapus;
- kategori default tidak dapat dihapus melalui UI;
- kategori custom digabungkan dengan kategori default tanpa menduplikasi item default.

Nama kategori boleh berbeda pada recreation, tetapi kemampuan default + custom wajib tetap tersedia.

### J. Sumber dana

Sumber dana default referensi:

- Cash;
- DANA;
- BRI;
- GoPay;
- SeaBank;
- ShopeePay;
- MitraBukalapak.

Behavior sama seperti kategori:

- sumber default selalu tersedia;
- pengguna dapat menambah sumber custom;
- data custom disimpan per pengguna;
- item custom dapat dihapus;
- item default tidak dapat dihapus;
- seluruh opsi tersedia pada form tambah dan edit transaksi;
- jika item custom yang sudah dipakai transaksi lama dihapus dari daftar pilihan, nilai historis pada transaksi lama harus tetap dapat ditampilkan dan tidak boleh diubah diam-diam.

## 4.2 Fitur tambahan

Fitur berikut berguna tetapi bukan inti domain:

- tombol cepat `000` pada input nominal, yang mengalikan nilai saat ini dengan 1.000;
- dark mode mengikuti preferensi sistem;
- toast untuk feedback autentikasi;
- modal, drawer, atau bottom sheet responsif;
- badge jumlah kontak;
- cache query client;
- format ID transaksi singkat untuk display;
- animasi transisi ringan.

Agent boleh mengganti atau menghilangkan fitur tambahan jika alur inti tetap nyaman dan setara. Manajemen kategori dan sumber dana custom bukan fitur tambahan; keduanya termasuk requirement fungsional recreation.

---

# 5. User Flow

## 5.1 Membuka aplikasi

1. Aplikasi memeriksa session autentikasi yang tersimpan.
2. Jika session tidak ada, tampilkan login.
3. Jika session ada, buka aplikasi dan muat data milik pengguna.
4. Dengarkan perubahan auth agar login/logout langsung tercermin.
5. Sebaiknya tampilkan auth-loading state agar halaman login tidak berkedip saat session sedang dipulihkan.

## 5.2 Login

1. Pengguna memasukkan email dan password.
2. Kedua input wajib diisi.
3. Password mengikuti batas minimum provider, pada referensi minimal 6 karakter.
4. Aplikasi mengirim kredensial ke provider auth.
5. Jika berhasil, session aktif dan dashboard terbuka.
6. Jika gagal, tampilkan pesan error yang dapat dipahami.

## 5.3 Menambah kontak

1. Pengguna membuka halaman kontak atau memilih opsi tambah kontak dari form transaksi.
2. Pengguna mengisi nama wajib.
3. Nomor HP dan catatan bersifat opsional.
4. Data disimpan untuk user aktif.
5. Daftar kontak diperbarui tanpa reload penuh.

## 5.4 Menambah transaksi

1. Pengguna membuka form transaksi.
2. Memilih arah transaksi:
   - piutang = mereka berhutang;
   - hutang = saya berhutang.
3. Memilih kontak yang sudah ada atau membuat kontak baru.
4. Memasukkan nominal lebih dari nol.
5. Memilih kategori dan sumber dana.
6. Menambahkan catatan jika perlu.
7. Menyimpan transaksi.
8. Sistem persistensi menambahkan waktu sekarang dan status `belum_lunas`. Implementasi referensi membuat timestamp di browser, tetapi recreation disarankan membuatnya di backend/database agar tepercaya dan konsisten.
9. Dashboard, posisi per sumber dana, dan daftar per kontak diperbarui.

## 5.5 Melihat riwayat kontak

1. Pengguna mencari atau memfilter kontak pada dashboard.
2. Pengguna memilih kontak.
3. Aplikasi mengambil atau menampilkan transaksi kontak.
4. Pengguna dapat memfilter status dan mengubah sorting.
5. Pengguna dapat membuka edit transaksi dari daftar tersebut.

## 5.6 Melunasi transaksi

1. Pengguna membuka transaksi.
2. Mengubah status menjadi `lunas`.
3. Aplikasi menyimpan waktu pelunasan.
4. Transaksi tetap ada dalam riwayat.
5. Transaksi hilang dari total saldo aktif.
6. Jika status dikembalikan menjadi `belum_lunas`, waktu pelunasan dihapus dan saldo aktif dihitung kembali.

## 5.7 Mengelola kategori dan sumber dana

1. Pengguna membuka pengelolaan kategori atau sumber dana dari form transaksi atau halaman pengaturan alternatif.
2. Pengguna menambah nama custom yang tidak kosong.
3. Opsi baru langsung tersedia pada form.
4. Pengguna dapat menghapus item custom.
5. Item default tidak dapat dihapus.

## 5.8 Logout

1. Pengguna memilih logout.
2. Session provider dihapus.
3. Data privat tidak lagi ditampilkan.
4. Aplikasi kembali ke halaman login.
5. Cache data pengguna sebaiknya dibersihkan agar data akun sebelumnya tidak muncul sesaat jika akun lain login pada perangkat yang sama.

---

# 6. Logika dan Behavior

## 6.1 Validasi input

### Kontak

- nama wajib;
- nama harus di-trim;
- nomor HP opsional;
- catatan opsional;
- nama kosong tidak boleh disimpan.

### Transaksi

- kontak wajib ada;
- jenis hanya `hutang` atau `piutang`;
- nominal wajib numerik dan lebih dari nol;
- kategori wajib;
- sumber dana wajib;
- status hanya `belum_lunas` atau `lunas`;
- catatan opsional;
- nominal disimpan sebagai angka, bukan string berformat.

### Kategori dan sumber custom

- nama harus di-trim;
- nama kosong tidak boleh disimpan;
- disarankan mencegah duplikasi case-insensitive;
- item default tidak boleh terhapus.

## 6.2 Format nominal

- tampilkan mata uang dalam format Indonesia/IDR;
- tidak memerlukan angka desimal;
- input boleh menampilkan pemisah ribuan, tetapi nilai yang disimpan harus berupa angka mentah;
- recreation harus menghindari ambiguitas antara separator `.` dan `,`.

Contoh format:

```text
Rp1.000.000
```

## 6.3 Waktu dan zona waktu

- timestamp disimpan sebagai ISO/UTC;
- tampilan referensi menggunakan locale `id-ID`;
- waktu ditampilkan dalam zona `Asia/Jakarta`/WIB;
- `waktu` dibuat saat transaksi disimpan;
- `waktu_lunas` dibuat saat status menjadi lunas.

Teknologi format boleh diganti, tetapi hasil harus konsisten dan tidak bergantung pada timezone browser secara tidak sengaja.

## 6.4 Mapping data

Database referensi memakai `snake_case`, sedangkan domain frontend memakai `camelCase`.

Contoh:

| Database | Domain frontend |
|---|---|
| `user_id` | `userId` jika diekspos |
| `nomor_hp` | `nomorHp` |
| `created_at` | `createdAt` |
| `contact_id` | `contactId` |
| `nama_contact` | `namaContact` |
| `sumber_dana` | `sumberDana` |
| `waktu_lunas` | `waktuLunas` |

Mapping ini bukan requirement teknis. Agent boleh memakai satu naming convention selama konsisten.

## 6.5 State management

Project referensi membagi state menjadi:

### Server state

Dikelola dengan TanStack React Query:

- daftar kontak;
- daftar transaksi;
- kategori custom;
- sumber dana custom;
- riwayat kontak.

Setelah mutation benar-benar berhasil, query terkait di-invalidasi agar data dimuat ulang. Form tidak boleh ditutup atau di-reset sebelum mutation sukses; selama mutation pending, submit harus dinonaktifkan untuk mencegah duplikasi.

### Local UI state

Dikelola dengan state komponen:

- halaman aktif;
- modal terbuka/tertutup;
- target transaksi yang diedit;
- kontak yang dipilih;
- nilai form;
- filter dan sorting;
- expansion daftar sumber dana.

Agent boleh menggunakan state manager atau arsitektur lain. Yang penting, server state dan local interaction state tetap konsisten.

## 6.6 Cache dan sinkronisasi

Rekomendasi query key recreation:

- `['contacts', userId]`;
- `['transaksi', userId]`;
- `['customs', userId]`;
- `['contact-history', userId, contactId, filterStatus, sortBy, sortOrder]`.

Nama key bebas, tetapi identitas user wajib menjadi bagian scope cache jika cache dapat bertahan ketika akun berubah.

Mutation wajib menyegarkan data yang terdampak:

- tambah/edit/hapus kontak → refresh kontak;
- rename/hapus kontak → refresh transaksi dan seluruh riwayat yang menyimpan snapshot nama kontak;
- tambah/edit/hapus transaksi → refresh transaksi dan seluruh agregat/riwayat kontak yang relevan;
- tambah/hapus kategori atau sumber → refresh konfigurasi custom;
- logout/pergantian akun → hapus atau isolasi seluruh cache milik akun sebelumnya.

Implementasi referensi belum menginvalidasi semua prefix cache riwayat setelah mutation. Recreation wajib memastikan daftar dan agregat tidak stale.

## 6.7 Loading, error, dan empty state

Minimal sediakan:

- loading saat auth diperiksa;
- loading saat data utama dimuat;
- error login yang jelas;
- error saat query atau mutation gagal;
- empty state untuk kontak;
- empty state untuk transaksi;
- empty state untuk hasil filter;
- disabled/loading state pada tombol submit untuk mencegah double submit.

Project referensi belum konsisten pada semua mutation state. Recreation boleh dan disarankan memperbaikinya.

## 6.8 Behavior yang tidak perlu dikloning sebagai bug

Agent tidak diwajibkan mempertahankan kekurangan implementasi referensi berikut:

- field opsional yang sulit dikosongkan karena payload update hanya mengirim nilai truthy;
- kemungkinan kategori/sumber custom duplikat;
- cache riwayat kontak yang dapat tertinggal setelah mutation;
- kilatan halaman login sebelum session selesai diperiksa;
- pesan hapus kontak yang bertentangan dengan `ON DELETE CASCADE`;
- registrasi yang memiliki logic tetapi tombolnya disembunyikan;
- tidak adanya pagination;
- error mutation yang belum selalu ditampilkan;
- query utama yang belum memiliki loading/error UI lengkap.

Perbaikan terhadap poin di atas diperbolehkan selama tujuan dan behavior domain tetap sama.

---

# 7. Struktur Data dan Database

## 7.1 Entitas minimum

### User

Disediakan oleh auth provider.

### Contact

```ts
interface Contact {
  id: string
  userId: string
  nama: string
  nomorHp?: string | null
  catatan?: string | null
  createdAt: string
}
```

### Transaksi

```ts
type JenisTransaksi = 'hutang' | 'piutang'
type StatusPelunasan = 'belum_lunas' | 'lunas'

interface Transaksi {
  id: string
  userId: string
  waktu: string
  contactId: string
  namaContact: string
  jenis: JenisTransaksi
  kategori: string
  sumberDana: string
  nominal: number
  catatan?: string | null
  status: StatusPelunasan
  waktuLunas?: string | null
}
```

### CustomSumberDana

```ts
interface CustomSumberDana {
  id: string
  userId: string
  nama: string
}
```

### CustomKategori

```ts
interface CustomKategori {
  id: string
  userId: string
  nama: string
}
```

## 7.2 Skema Supabase referensi

Project tidak memiliki migration file terpisah; skema terdokumentasi di README. Struktur minimum:

```sql
CREATE TABLE public.contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL DEFAULT auth.uid(),
  nama TEXT NOT NULL,
  nomor_hp TEXT,
  catatan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE public.transaksi (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL DEFAULT auth.uid(),
  waktu TIMESTAMPTZ NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
  nama_contact TEXT NOT NULL,
  jenis TEXT NOT NULL,
  kategori TEXT NOT NULL,
  sumber_dana TEXT NOT NULL,
  nominal NUMERIC NOT NULL,
  catatan TEXT,
  status TEXT NOT NULL,
  waktu_lunas TIMESTAMPTZ
);

CREATE TABLE public.custom_sumber_dana (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL DEFAULT auth.uid(),
  nama TEXT NOT NULL
);

CREATE TABLE public.custom_kategori (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL DEFAULT auth.uid(),
  nama TEXT NOT NULL
);
```

Untuk recreation baru, disarankan menambahkan:

- check constraint `jenis IN ('hutang', 'piutang')`;
- check constraint `status IN ('belum_lunas', 'lunas')`;
- check constraint `nominal > 0`;
- simpan nominal IDR sebagai integer dengan precision/range yang jelas jika nilai pecahan tidak didukung;
- constraint konsistensi status dan timestamp, misalnya status `lunas` wajib memiliki `waktu_lunas`;
- index pada `user_id`, `contact_id`, `waktu`, dan `status`;
- unique constraint kategori/sumber per user jika sesuai;
- foreign key atau trigger yang memastikan `contact_id` dan `transaksi.user_id` dimiliki user yang sama;
- `ON DELETE CASCADE` dari data user ke `auth.users` jika lifecycle penghapusan akun membutuhkannya;
- trigger atau transaction untuk menjaga `nama_contact` tetap sinkron, atau hilangkan denormalisasi tersebut dan gunakan join.

## 7.3 Keamanan dan Row Level Security

Jika menggunakan Supabase, RLS wajib aktif pada semua tabel milik pengguna.

Setiap operasi SELECT, INSERT, UPDATE, dan DELETE harus dibatasi dengan `auth.uid() = user_id`. Gunakan `USING` dan `WITH CHECK` yang sesuai. Kepemilikan transaksi saja belum cukup: backend juga harus memastikan kontak yang direferensikan dimiliki user yang sama, misalnya melalui composite foreign key `(contact_id, user_id)` atau trigger validasi ownership.

Contoh tujuan policy:

```sql
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaksi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_sumber_dana ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_kategori ENABLE ROW LEVEL SECURITY;
```

Jangan pernah menggunakan service-role key di frontend. Client hanya boleh menerima public/anon key.

Agent boleh menggunakan backend selain Supabase, tetapi wajib menyediakan isolasi data dan autentikasi yang setara.

---

# 8. Struktur Teknis Referensi

## 8.1 Teknologi

Implementasi saat ini menggunakan:

- TypeScript;
- React;
- Vite;
- Supabase Auth dan Database;
- TanStack React Query untuk server-state/query cache;
- Tailwind CSS;
- Lucide React untuk icon;
- `@blinkdotnew/ui` untuk provider UI dan toaster;
- `Intl.NumberFormat` serta `Intl.DateTimeFormat` untuk format locale.

Versi atau library tersebut tidak wajib dipertahankan kecuali Supabase ingin digunakan kembali.

## 8.2 Struktur folder referensi

```text
src/
├── App.tsx
├── main.tsx
├── components/
│   ├── Auth.tsx
│   ├── SummaryCards.tsx
│   ├── TransaksiForm.tsx
│   ├── TransaksiTable.tsx
│   ├── ContactHistoryModal.tsx
│   └── EditModal.tsx
├── pages/
│   ├── Dashboard.tsx
│   └── Contacts.tsx
├── hooks/
│   ├── useSupabase.ts
│   ├── useSupabaseStore.ts
│   └── useContactHistory.ts
├── lib/
│   └── supabase.ts
├── types/
│   └── index.ts
└── utils/
    └── format.ts
```

Daftar tersebut hanya menunjukkan file yang aktif dalam alur aplikasi. File starter/template yang tidak digunakan tidak perlu direcreate.

Tanggung jawab saat ini:

- `App.tsx`: auth gate, navigasi, wiring data dan mutation;
- `Dashboard.tsx`: komposisi ringkasan, daftar kontak-transaksi, modal tambah/edit;
- `Contacts.tsx`: CRUD kontak;
- `useSupabase.ts`: query dan mutation langsung ke Supabase;
- `useSupabaseStore.ts`: facade data serta kalkulasi agregat;
- `useContactHistory.ts`: query/filter/sort riwayat kontak;
- `types/index.ts`: domain model;
- `utils/format.ts`: format IDR, WIB, dan helper nominal.

## 8.3 Arsitektur aplikasi

Project adalah Single Page Application.

- Tidak menggunakan router untuk dua halaman utama; halaman aktif disimpan sebagai local state.
- Auth menjadi render gate sebelum aplikasi utama, tetapi implementasi referensi belum sepenuhnya mencegah query berjalan sebelum session pulih. Recreation harus menjadikan auth sebagai data-fetch gate juga.
- Record pengguna berasal dari Supabase; opsi default kategori/sumber dan agregasi keuangan dibentuk di frontend.
- RLS menjadi lapisan utama isolasi data.
- Data utama dimuat sebagai query client cache.
- Agregasi dashboard dilakukan di frontend.
- Riwayat kontak di-query terpisah berdasarkan kontak, status, dan sorting.
- Tidak ada realtime subscription database.
- Tidak ada pagination pada implementasi saat ini.

Agent boleh memakai router, server components, REST API, GraphQL, state machine, atau arsitektur lain selama behavior tetap setara.

## 8.4 Environment variable

Jika tetap menggunakan Supabase + Vite:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
```

Pada framework lain, nama variable boleh berubah. Pastikan hanya public client key yang terekspos ke browser.

## 8.5 Bagian wajib dan bagian yang boleh diganti

### Wajib secara fungsional

- autentikasi dan logout;
- isolasi data per pengguna;
- CRUD kontak;
- CRUD transaksi;
- jenis hutang/piutang;
- status pelunasan dan timestamp;
- kategori dan sumber dana;
- agregasi dashboard;
- pengelompokan per kontak;
- pencarian dan filter;
- riwayat kontak;
- persistensi setelah reload;
- validasi nominal dan input wajib.

### Boleh diganti

- React, Vite, TanStack Query, Tailwind, dan Supabase;
- struktur folder;
- bentuk API;
- state management;
- query strategy;
- database engine;
- format navigasi;
- modal versus halaman detail;
- seluruh keputusan UI dan UX;
- nama komponen;
- strategi responsive;
- library icon dan toast.

---

# 9. Requirement untuk Recreation

## 9.1 Functional requirements

Recreation dianggap berhasil jika:

1. pengguna dapat login dan logout;
2. data satu pengguna tidak dapat diakses pengguna lain;
3. pengguna dapat membuat, mengedit, dan menghapus kontak;
4. pengguna dapat membuat transaksi hutang dan piutang;
5. transaksi wajib terhubung ke kontak;
6. transaksi baru otomatis berstatus belum lunas;
7. pengguna dapat mengedit dan menghapus transaksi;
8. pengguna dapat menandai transaksi sebagai lunas;
9. waktu pelunasan disimpan dan dibersihkan jika transaksi dibuka kembali;
10. transaksi lunas tidak memengaruhi total aktif;
11. dashboard menghitung hutang, piutang, dan posisi bersih dengan benar;
12. posisi bersih dapat dikelompokkan per sumber dana;
13. transaksi dikelompokkan atau dapat ditelusuri per kontak;
14. pengguna dapat mencari kontak pada data transaksi;
15. pengguna dapat memfilter status dan jenis;
16. riwayat kontak dapat difilter dan diurutkan;
17. pengguna dapat mengelola kategori dan sumber dana custom;
18. data bertahan setelah reload dan login ulang;
19. nominal diformat sebagai IDR;
20. timestamp ditampilkan secara konsisten dalam locale Indonesia/WIB.

## 9.2 Acceptance criteria

### Autentikasi

- [ ] Pengguna tanpa session hanya melihat auth flow.
- [ ] Login valid membuka aplikasi.
- [ ] Login gagal menampilkan error.
- [ ] Reload mempertahankan session yang masih valid.
- [ ] Logout menghapus session dan cache data privat.
- [ ] Akun A tidak dapat membaca atau memodifikasi data akun B.

### Kontak

- [ ] Nama kontak wajib dan tidak menerima string kosong.
- [ ] Nomor HP dan catatan dapat diisi, diedit, dan dikosongkan kembali.
- [ ] Kontak baru langsung tersedia pada form transaksi.
- [ ] Rename kontak tidak menghasilkan nama lama yang inkonsisten pada transaksi.
- [ ] Penghapusan kontak meminta konfirmasi dan menjelaskan dampaknya terhadap transaksi.

### Transaksi

- [ ] Jenis transaksi hanya hutang atau piutang.
- [ ] Arah hutang/piutang konsisten dari perspektif pengguna.
- [ ] Kontak wajib dipilih atau dibuat.
- [ ] Nominal harus lebih dari nol.
- [ ] Kategori dan sumber dana wajib tersedia.
- [ ] Transaksi baru memiliki waktu pembuatan dan status belum lunas.
- [ ] Edit dapat mengubah jenis, nominal, kategori, sumber, catatan, dan status.
- [ ] Catatan opsional dapat benar-benar dikosongkan.
- [ ] Hapus transaksi memerlukan konfirmasi.

### Pelunasan

- [ ] Menandai lunas menyimpan waktu pelunasan.
- [ ] Mengedit transaksi yang sudah lunas tanpa mengubah status tidak mengganti waktu pelunasan.
- [ ] Membuka kembali transaksi menghapus waktu pelunasan.
- [ ] Status bertahan setelah reload.
- [ ] Transaksi lunas tetap ada di riwayat.
- [ ] Transaksi lunas tidak masuk saldo aktif.

### Kalkulasi

Gunakan dataset uji berikut:

```text
Piutang belum lunas: 100.000
Piutang belum lunas: 50.000
Hutang belum lunas: 40.000
Hutang lunas: 25.000
```

Hasil yang diharapkan:

- [ ] Total piutang aktif = 150.000.
- [ ] Total hutang aktif = 40.000.
- [ ] Posisi bersih = +110.000 bagi pengguna.
- [ ] Hutang lunas 25.000 tidak masuk ringkasan aktif.
- [ ] Riwayat tetap menampilkan keempat transaksi ketika filter “semua”.

### Pengelompokan dan pencarian

- [ ] Semua transaksi kontak yang sama dapat ditemukan dalam satu riwayat.
- [ ] Search nama bersifat case-insensitive dan mendukung partial match.
- [ ] Filter hutang hanya menghasilkan kontak/transaksi dengan hutang.
- [ ] Filter piutang hanya menghasilkan kontak/transaksi dengan piutang.
- [ ] Filter lunas dan belum lunas bekerja sesuai status.
- [ ] Kombinasi filter status dan jenis dipenuhi oleh transaksi yang sama.
- [ ] Filter riwayat hanya mengubah baris yang tampil, bukan agregat saldo atau total count seluruh transaksi kontak tersebut.
- [ ] Filter dapat direset.
- [ ] Sorting tanggal ascending/descending bekerja.
- [ ] Sorting nominal ascending/descending bekerja.

### Kategori dan sumber dana

- [ ] Opsi default tersedia untuk pengguna baru.
- [ ] Pengguna dapat menambah opsi custom.
- [ ] Opsi custom tersedia pada form tambah dan edit transaksi tanpa reload penuh.
- [ ] Item custom dapat dihapus.
- [ ] Menghapus item custom tidak merusak tampilan atau nilai historis transaksi yang sudah menggunakannya.
- [ ] Item default terlindungi dari penghapusan.
- [ ] Nilai kosong dan duplikat ditolak atau ditangani secara aman.

### Reliability

- [ ] Loading state tersedia untuk operasi asynchronous utama.
- [ ] Error query dan mutation tidak gagal diam-diam.
- [ ] Form menunggu mutation sukses sebelum ditutup atau di-reset.
- [ ] Submit berulang tidak membuat record duplikat.
- [ ] Cache/list/agregat diperbarui setelah setiap mutation relevan.
- [ ] Cache diisolasi per user dan dibersihkan saat logout atau pergantian akun.
- [ ] Empty state tersedia untuk data kosong dan hasil filter kosong.
- [ ] Build production berhasil.
- [ ] Type-check atau validasi statis project berhasil.

---

# 10. Skenario Verifikasi End-to-End

Gunakan skenario berikut untuk menguji recreation:

1. Buat atau provision akun A sesuai metode autentikasi yang didokumentasikan, lalu login.
2. Tambahkan kontak “Budi”.
3. Tambahkan piutang Budi sebesar Rp100.000 dari sumber Cash.
4. Pastikan dashboard menunjukkan piutang aktif Rp100.000.
5. Tambahkan hutang kepada Budi sebesar Rp25.000.
6. Pastikan riwayat Budi memuat dua transaksi.
7. Pastikan posisi bersih terhadap Budi menunjukkan Budi masih berhutang Rp75.000 kepada pengguna.
8. Tandai piutang Rp100.000 sebagai lunas.
9. Pastikan piutang tersebut hilang dari total aktif tetapi tetap ada di riwayat.
10. Karena hutang Rp25.000 masih aktif, pastikan posisi aktif kini menunjukkan pengguna berhutang Rp25.000 kepada Budi.
11. Pastikan waktu pelunasan piutang tercatat.
12. Edit catatan piutang yang sudah lunas tanpa mengubah status dan pastikan waktu pelunasannya tidak berubah.
13. Ubah kembali menjadi belum lunas dan pastikan waktu pelunasan kosong.
14. Tambahkan kategori custom dan sumber dana custom.
15. Buat transaksi memakai kedua opsi custom tersebut.
16. Pastikan opsi custom juga tersedia ketika transaksi diedit.
17. Reload halaman dan pastikan seluruh data masih tersedia.
18. Logout.
19. Buat atau provision akun B, lalu login sebagai akun B.
20. Pastikan akun B tidak dapat melihat kontak atau transaksi akun A.

---

# 11. Non-Goals

Recreation tidak harus menjadi:

- salinan pixel-perfect;
- aplikasi dengan layout yang sama;
- aplikasi dengan warna dan typography yang sama;
- implementasi berbasis React atau Supabase;
- sistem akuntansi double-entry;
- aplikasi invoicing;
- sistem pembayaran;
- aplikasi multi-currency;
- sistem organisasi/team;
- aplikasi dengan realtime collaboration.

Fitur non-goal boleh ditambahkan jika tidak mengganggu fitur inti, tetapi jangan menambah kompleksitas yang tidak diperlukan sebelum acceptance criteria utama terpenuhi.

---

# 12. Definition of Done

Project recreation selesai ketika:

- seluruh functional requirements terpenuhi;
- seluruh acceptance criteria penting lulus;
- security isolation telah diuji dengan minimal dua akun;
- kalkulasi hutang/piutang telah diuji dengan data deterministik;
- alur tambah → edit → lunas → buka kembali → hapus berfungsi;
- data tetap konsisten setelah reload;
- error dan loading state tersedia;
- build dan pemeriksaan statis lulus;
- dokumentasi setup database dan environment tersedia;
- keputusan penghapusan kontak terdokumentasi;
- hasil akhir memiliki desain yang orisinal dan tidak terikat pada tampilan project referensi.
