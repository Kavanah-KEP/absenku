# 📋 Panduan Instalasi — Absenku

Absenku terdiri dari **dua bagian** yang dipasang terpisah:

| Bagian | Isi | Dipasang di |
|---|---|---|
| **Backend** | `Kode.gs` + `appsscript.json` | Google Apps Script (akun Google Anda) |
| **Frontend** | Folder `absenku-frontend` (hasil ekstrak ZIP) | GitHub Pages |

Urutannya wajib: **backend dulu** (untuk mendapatkan URL `/exec`), **baru frontend**.

---

## BAGIAN A — Backend (Google Apps Script)

### A1. Buat proyek Apps Script
1. Buka **https://script.google.com** → klik **Proyek baru**.
2. Klik judul "Proyek tanpa judul" di kiri atas → ganti menjadi **Absenku API**.

### A2. Tempel kode
1. Di panel kiri, klik file **Code.gs** → hapus semua isinya → tempel **seluruh isi `Kode.gs`**.
   (Boleh ganti nama file menjadi `Kode` lewat ikon ⋮ → Rename.)
2. Klik ⚙️ **Project Settings** (ikon roda gigi di kiri) → centang **"Show 'appsscript.json' manifest file in editor"**.
3. Kembali ke **Editor** (ikon `< >`), buka file **appsscript.json** → ganti seluruh isinya dengan isi `appsscript.json` dari paket ini.
   > Ini mengatur zona waktu **Asia/Jakarta**. Jika perusahaan Anda di WITA/WIT, ganti menjadi `Asia/Makassar` atau `Asia/Jayapura`.
4. Tekan **Ctrl+S** (simpan).

### A3. Jalankan `setupAppEnvironment()` — HANYA SEKALI
1. Di toolbar atas, pilih fungsi **setupAppEnvironment** dari dropdown → klik **▶ Run**.
2. Muncul "Authorization required" → **Review permissions** → pilih akun Google Anda.
3. Jika muncul *"Google hasn't verified this app"* → klik **Advanced** → **Go to Absenku API (unsafe)** → **Allow**.
   > Ini normal untuk skrip buatan sendiri. Skrip hanya mengakses Drive & Sheets milik Anda.
4. Buka **Execution log** (di bawah). Pastikan muncul **✅ SETUP SELESAI!** beserta daftar akun contoh.
5. Cek Google Drive Anda: ada folder **📁 Absenku_Files** berisi spreadsheet **🗃️ Database — Absenku** dan folder `Foto_Absensi`, `Dokumen_Karyawan`, `Surat_Peringatan`, `Slip_Gaji`, `Laporan_PDF`, `Branding`, `Gambar_Berita`.

> ⚠️ Menjalankannya lagi **aman** — skrip mendeteksi setup yang sudah ada dan tidak membuat duplikat. Untuk mengecek status kapan saja, jalankan fungsi `cekSetup`.

### A4. Deploy sebagai Web App
1. Klik **Deploy** (kanan atas) → **New deployment**.
2. Klik ikon ⚙️ di samping "Select type" → pilih **Web app**.
3. Isi:
   - **Description:** `Absenku v1`
   - **Execute as:** **Me** (email Anda)
   - **Who has access:** **Anyone**
4. Klik **Deploy** → salin **Web app URL** (berakhiran `/exec`). Simpan di Notepad.

> **Kenapa "Anyone"?** Frontend di GitHub Pages memanggil backend lewat `fetch()`, dan browser tidak membawa login Google ke domain lain. Keamanan dijaga oleh **login internal Absenku** (token sesi + password ter-hash): semua data karyawan, gaji, BPJS, dan SP hanya bisa diakses setelah login, dan backend memeriksa role serta kepemilikan data di setiap permintaan.

**Uji cepat:** buka URL `/exec` tadi di browser dengan tambahan `?action=ping` di belakangnya. Harus tampil teks JSON `{"success":true,...}`.

### A5. Pasang "penjaga server tetap hangat" (sekali saja — sangat disarankan)
Apps Script "tertidur" bila lama tidak dipakai, sehingga permintaan pertama (misalnya absen jam 07.30) bisa lambat 3–5 detik.
1. Di editor, pilih fungsi **pasangTriggerKeepWarm** → **▶ Run** → izinkan bila diminta.
2. Log harus menampilkan **✅ Trigger keepWarm terpasang (setiap 5 menit)**.
   > Trigger ini juga mengisi cache data utama, sehingga semua pengguna mendapat respons lebih cepat.

---

## BAGIAN B — Frontend (GitHub Pages)

### B1. Siapkan folder
1. Ekstrak **absenku-frontend.zip**. Hasilnya folder **`absenku-frontend`** berisi:
   ```
   absenku-frontend/        ← FOLDER INI yang nanti di-git init
   ├── index.html           ← harus langsung terlihat di sini
   ├── README.md
   ├── PANDUAN-INSTALASI.md
   ├── sw.js                ← penyimpan tampilan di HP (wajib ikut di-push)
   ├── manifest.webmanifest
   ├── css/style.css
   └── js/ (config.js, api.js, ui.js, app.js, pages-*.js)
   ```
2. Buka **`js/config.js`** dengan Notepad/VS Code → ganti `GAS_URL` dengan URL `/exec` dari langkah A4:
   ```js
   GAS_URL: 'https://script.google.com/macros/s/AKfycb.../exec',
   ```
   Simpan.

### B2. Install Git (sekali seumur komputer)
- **Windows:** unduh dari https://git-scm.com/download/win → install dengan pilihan default → buka **PowerShell**.
- **Mac:** buka Terminal, ketik `git --version` (macOS menawarkan instalasi otomatis).

Cek: `git --version` → harus tampil nomor versi.

Lalu atur identitas (sekali saja):
```bash
git config --global user.name "Nama Anda"
git config --global user.email "email-akun-github@anda.com"
```

### B3. Buat repository di GitHub
1. Daftar/login di https://github.com (username Anda akan menjadi bagian alamat situs: `username.github.io`).
2. Klik **+** → **New repository** → nama misalnya `absenku` → pilih **Public** → **JANGAN** centang README/.gitignore/license → **Create repository**.

### B4. Masuk ke folder yang BENAR
Buka folder **`absenku-frontend`** di File Explorer → klik address bar → ketik `powershell` → Enter.

Periksa isinya:
```powershell
dir
```
✅ Harus terlihat **`index.html`**, folder **`css`** dan **`js`**.
❌ Jika yang terlihat justru satu folder `absenku-frontend`, Anda satu level terlalu tinggi → ketik `cd absenku-frontend` dulu.

> Ini langkah paling penting. Jika `git init` dijalankan di folder yang salah, situs akan **404** tanpa pesan error apa pun.

### B5. Kirim ke GitHub (jalankan satu per satu)
```bash
git init
git add .
git commit -m "Upload pertama Absenku"
git branch -M main
git remote add origin https://github.com/USERNAME/absenku.git
git push -u origin main
```
(Ganti `USERNAME` dengan username GitHub Anda. Perhatikan **titik** di `git add .`)

Saat `git push` meminta login:
- **Username:** username GitHub
- **Password:** **Personal Access Token**, bukan password akun (lihat di bawah).
- Saat menempel token, **layar tetap kosong** — itu normal. Klik kanan untuk paste, lalu Enter.

**Membuat token:** buka https://github.com/settings/tokens → **Generate new token (classic)** → Note: `absenku` → Expiration: 90 days → centang **repo** → **Generate token** → salin `ghp_...` (hanya tampil sekali).

Sukses bila muncul `Writing objects: 100%` dan `* [new branch] main -> main`.

> Kesulitan dengan terminal? Alternatif visual: **GitHub Desktop** (https://desktop.github.com) → *Add Local Repository* → pilih folder `absenku-frontend` → *Publish repository* (hilangkan centang "Keep this code private").

### B6. Aktifkan GitHub Pages
Di halaman repo: **Settings** → **Pages** (menu kiri):
| Kolom | Nilai |
|---|---|
| Source | Deploy from a branch |
| Branch | **main** · **/ (root)** → Save |
| Enforce HTTPS | ✅ **wajib dicentang** |

Tunggu 1–2 menit → refresh → muncul **"Your site is live at https://USERNAME.github.io/absenku/"**.

> **HTTPS wajib** — tanpa HTTPS, browser HP memblokir akses kamera dan GPS sehingga absensi tidak bisa dipakai.

---

## BAGIAN C — Uji Coba

1. Buka `https://USERNAME.github.io/absenku/` → halaman **Portal Berita** tampil dengan 3 berita contoh.
2. Klik **Masuk** → login dengan akun contoh:

| Role | Username | Kata sandi |
|---|---|---|
| Superadmin | `superadmin` | `Admin#2026` |
| HRD | `hrd` | `Hrd#2026` |
| Admin HRD | `adminhrd` | `AdminHrd#2026` |
| Karyawan | `budi`, `rian` (WFO), `ahmad` (WFH) | `Karyawan#2026` |

3. **Segera** lakukan (login sebagai `hrd`):
   - **Pengaturan → Lokasi Kantor** → edit "Kantor Pusat" → klik peta / "Gunakan lokasi saya" di kantor Anda → atur radius (50–150 m) → Simpan.
   - **Pengaturan → Branding** → unggah logo, ganti nama perusahaan & alamat.
   - **Pengaturan → Jam Kerja** → sesuaikan jam masuk/pulang dan toleransi.
4. Dari HP, login sebagai `budi` → **Absen** → izinkan lokasi → **Ambil Selfie** → **Gunakan Foto** → **Konfirmasi Absen Masuk**.
5. Cek spreadsheet: baris baru di sheet **Absensi**, foto di Drive `Foto_Absensi/tahun/bulan/nama`.
6. Ganti kata sandi semua akun contoh (menu **Profil**), atau nonaktifkan akun contoh yang tidak dipakai (**Akun & Akses**, login `superadmin`).

---

## BAGIAN D — Memperbarui Aplikasi

**Frontend berubah** (misal edit `config.js`) — dari folder `absenku-frontend`:
```bash
git add .
git commit -m "Update"
git push
```
Tunggu 1–2 menit, lalu **Ctrl+Shift+R** (hard refresh) di browser.

**Backend berubah** (edit `Kode.gs`) — agar URL `/exec` **tetap sama**:
**Deploy → Manage deployments → ✏️ (Edit) → Version: New version → Deploy.**
> Jangan pakai "New deployment" lagi — itu menghasilkan URL baru dan frontend harus diubah.

**Catatan service worker:** setelah push, HP yang sudah pernah membuka aplikasi akan memakai versi baru pada **pembukaan berikutnya** (pembukaan pertama masih versi lama dari cache, lalu diperbarui diam-diam). Jika ingin memaksa semua perangkat langsung memuat ulang total, ubah `VERSION` di `sw.js` (misal `absenku-v3`) sebelum push.

---

## BAGIAN E — Upgrade dari versi sebelumnya (Instant UX)

Jika Anda sudah memasang versi pertama:
1. **Backend:** buka Apps Script → ganti seluruh isi `Kode.gs` dengan versi baru → Ctrl+S → **Deploy → Manage deployments → ✏️ → Version: New version → Deploy** (URL `/exec` tetap sama, tidak perlu mengubah `config.js`).
2. Jalankan **pasangTriggerKeepWarm** sekali (Bagian A5). **Jangan** jalankan `setupAppEnvironment` lagi.
3. **Frontend:** ekstrak ZIP baru, **salin `GAS_URL` dari `js/config.js` lama Anda** ke `js/config.js` baru, lalu timpa isi folder `absenku-frontend` Anda dengan isi ZIP baru dan push:
   ```bash
   git add .
   git commit -m "Upgrade instant UX"
   git push
   ```

### Apa yang membuat aplikasi terasa instan
| Teknik | Efek |
|---|---|
| Cache data di perangkat (stale-while-revalidate) | Pindah menu ±20 ms; data diperbarui diam-diam di belakang |
| Prefetch per role + data awal ikut di respons login | Dashboard, absensi, izin, KPI, slip sudah siap sebelum diklik |
| Prefetch saat jari menyentuh menu | Halaman yang belum pernah dibuka pun dimuat lebih awal |
| Optimistic UI | Setujui/tolak, kirim chat, batal izin, tandai notifikasi, hapus → langsung berubah |
| Pustaka grafik/peta/PDF dimuat saat dibutuhkan + service worker | Pembukaan ulang di HP ±0,1 detik |
| CacheService untuk semua tabel + batch request + keepWarm | Respons server lebih cepat & stabil di jam sibuk |

> Data gaji, slip, dan BPJS **hanya** disimpan di memori (tidak ditulis ke penyimpanan HP), dan semua cache dihapus saat **Keluar**. Di HP yang dipakai bersama, biasakan menekan Keluar.

---

## BAGIAN F — Upgrade versi 3 (login andal, akun HRD, jadwal per hari)

1. **Backend:** ganti seluruh isi `Kode.gs` → Ctrl+S → **Deploy → Manage deployments → ✏️ → Version: New version → Deploy** (URL tetap sama).
2. **Frontend:** ekstrak ZIP baru, salin `GAS_URL` dari `config.js` lama ke `js/config.js` baru, timpa folder `absenku-frontend`, lalu:
   ```bash
   git add .
   git commit -m "Upgrade v3"
   git push
   ```
3. Di HP/laptop: tutup aplikasi lalu buka lagi (service worker memuat versi baru).
4. Login sebagai HRD → **Pengaturan → Jam Kerja** → klik **"+ Sabtu 08–13"** (atau atur jam Sabtu sendiri) → **Simpan Jadwal & Kebijakan**.

### Yang baru di versi 3
| Fitur | Keterangan |
|---|---|
| Login andal | Bila server Apps Script tersendat, aplikasi otomatis mencoba lagi (maks 4x) dan menampilkan status "Menghubungkan ke server…". Balasan sesi lama tidak lagi bisa mengeluarkan sesi baru. |
| Semua menu siap sebelum diklik | Setelah login, data semua menu sesuai role disiapkan bertahap di latar belakang. |
| HRD kelola akun | HRD & Admin HRD membuka **Akun & Akses**: tambah, ubah role, reset sandi, nonaktifkan, dan **hapus akun** semua karyawan **kecuali Superadmin**. Tombol hapus juga ada di **Data Karyawan** (ikon tempat sampah). |
| Hapus akun karyawan berhenti | Wajib mengetik username untuk konfirmasi. Akun langsung keluar dari semua perangkat, username bisa dipakai lagi. **Riwayat absensi, izin, gaji, KPI & SP tetap tersimpan**; data karyawan menjadi Nonaktif. |
| KPI tanpa owner | Pemilik akun Superadmin (owner) tidak masuk KPI Karyawan, laporan KPI, maupun rata-rata KPI tim. Menu "KPI Saya" disembunyikan untuk Superadmin. |
| Jadwal per hari | Setiap hari bisa libur atau punya jam sendiri. Status terlambat, pulang awal, durasi cuti, dan hari kerja KPI mengikuti jadwal hari tersebut. |

---

## Troubleshooting

| Gejala | Penyebab & solusi |
|---|---|
| Halaman "Konfigurasi belum lengkap" | `GAS_URL` di `js/config.js` belum diisi → isi, lalu push ulang |
| "Respons server tidak valid" | Web App tidak di-deploy dengan akses **Anyone**, atau URL bukan yang berakhiran `/exec` |
| "Backend belum di-setup" | `setupAppEnvironment()` belum dijalankan (A3) |
| Situs 404 | `index.html` tidak di root repo → lihat B4; di Settings → Pages pastikan branch `main` / `(root)` |
| Tampilan tanpa warna/berantakan | File CSS/JS tidak di folder `css/` & `js/` — jangan upload lewat tombol "Upload files" di web GitHub, gunakan terminal |
| Kamera/GPS tidak jalan | Pastikan situs dibuka lewat **https://** dan izin Lokasi/Kamera untuk situs diizinkan di browser |
| "Di luar radius" padahal di kantor | Titik kantor kurang tepat atau radius terlalu kecil → perbarui di Pengaturan → Lokasi Kantor |
| Perubahan backend tidak berlaku | Belum membuat **New version** di Manage deployments (Bagian D) |
| Login lama di pagi hari | Pastikan trigger **keepWarm** terpasang (Bagian A5). Aplikasi tetap mencoba ulang otomatis — tunggu hingga selesai, jangan tutup halaman |
| Server "sibuk" saat jam absen pagi | Kuota GAS: jumlah eksekusi serentak terbatas (±30). Minta karyawan mengulang beberapa detik kemudian; untuk >300 karyawan pertimbangkan membagi jam masuk |
| Tampilan versi lama setelah push | Service worker: tutup lalu buka lagi aplikasinya (versi baru aktif pada pembukaan berikutnya), atau **Ctrl+Shift+R** / Incognito |
| Data terasa belum terbaru | Tunggu sebentar — data disegarkan otomatis; di halaman daftar akan muncul tombol **"Ada data terbaru · Muat ulang"** |

---

## Catatan Teknis

- **Kamera:** absen memakai `<input capture="user">` sehingga aplikasi kamera bawaan HP terbuka dalam mode depan (sesuai PRD). Pada sebagian browser lama, pilihan galeri masih bisa muncul — karena itu waktu **selalu dari server** dan GPS dicatat saat konfirmasi, dan HRD dapat meninjau foto di **Rekap Absensi**.
- **KPI:** Skor disiplin = 50% % tepat waktu + 50% kehadiran efektif, dikurangi 2 poin per hari izin di atas 2 hari/bulan. Skor akhir = 60% disiplin + 40% nilai kinerja HRD (jika diisi). Tombol **Simpan Rekap ke Sheet** di KPI Karyawan menyimpan hasilnya ke sheet `KPI`.
- **Arsip data:** bila sheet `Absensi` atau `Chat` sudah puluhan ribu baris, pindahkan baris tahun lalu ke spreadsheet arsip agar aplikasi tetap cepat.
- **Pemeliharaan opsional:** pasang trigger harian untuk fungsi `bersihkanSesiKedaluwarsa` (Triggers → Add Trigger → Time-driven → Day timer).
- **Peta** memakai OpenStreetMap; grafik memakai Chart.js; PDF laporan memakai html2pdf.js (semua dari CDN — butuh internet).
