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

---

## BAGIAN B — Frontend (GitHub Pages)

### B1. Siapkan folder
1. Ekstrak **absenku-frontend.zip**. Hasilnya folder **`absenku-frontend`** berisi:
   ```
   absenku-frontend/        ← FOLDER INI yang nanti di-git init
   ├── index.html           ← harus langsung terlihat di sini
   ├── README.md
   ├── PANDUAN-INSTALASI.md
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
| Server "sibuk" saat jam absen pagi | Kuota GAS: jumlah eksekusi serentak terbatas (±30). Minta karyawan mengulang beberapa detik kemudian; untuk >300 karyawan pertimbangkan membagi jam masuk |
| Tampilan versi lama setelah push | Cache browser → **Ctrl+Shift+R** atau jendela Incognito |

---

## Catatan Teknis

- **Kamera:** absen memakai `<input capture="user">` sehingga aplikasi kamera bawaan HP terbuka dalam mode depan (sesuai PRD). Pada sebagian browser lama, pilihan galeri masih bisa muncul — karena itu waktu **selalu dari server** dan GPS dicatat saat konfirmasi, dan HRD dapat meninjau foto di **Rekap Absensi**.
- **KPI:** Skor disiplin = 50% % tepat waktu + 50% kehadiran efektif, dikurangi 2 poin per hari izin di atas 2 hari/bulan. Skor akhir = 60% disiplin + 40% nilai kinerja HRD (jika diisi). Tombol **Simpan Rekap ke Sheet** di KPI Karyawan menyimpan hasilnya ke sheet `KPI`.
- **Arsip data:** bila sheet `Absensi` atau `Chat` sudah puluhan ribu baris, pindahkan baris tahun lalu ke spreadsheet arsip agar aplikasi tetap cepat.
- **Pemeliharaan opsional:** pasang trigger harian untuk fungsi `bersihkanSesiKedaluwarsa` (Triggers → Add Trigger → Time-driven → Day timer).
- **Peta** memakai OpenStreetMap; grafik memakai Chart.js; PDF laporan memakai html2pdf.js (semua dari CDN — butuh internet).
