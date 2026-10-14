# 📱 Panduan Membuat APK Absenku dengan PWABuilder — Aman & Bebas Malware

Hasil akhir: aplikasi **Absenku** yang dipasang di HP Android seperti aplikasi biasa — ikon sendiri di layar utama, layar penuh tanpa bilah alamat, kamera & GPS berfungsi.

---

## Cara kerjanya (penting dipahami dulu)

PWABuilder (alat resmi buatan Microsoft, *open source*) membungkus situs Absenku menjadi APK jenis **TWA (Trusted Web Activity)**:

- APK-nya **kecil (±1–3 MB)** dan **hanya berisi pembungkus** — tampilan & data tetap diambil dari `https://kavanah-kep.github.io/absenku/` melalui mesin Chrome di HP.
- **Update otomatis:** setiap kali Anda `git push` frontend atau memperbarui `Kode.gs`, aplikasi di semua HP langsung ikut terbarui. **Tidak perlu membagikan APK baru**, kecuali mengganti ikon/nama/warna aplikasi.
- **Keamanan:** APK tidak membawa kode asing; semua halaman tunduk pada Content-Security-Policy Absenku (hanya skrip dari situs ini + 3 CDN tepercaya, data hanya ke Google Apps Script).

### Yang akan Anda siapkan

| # | Bahan | Asal |
|---|---|---|
| 1 | Frontend Absenku versi baru (ikon, manifest, screenshot, halaman offline, CSP) | `absenku-frontend.zip` |
| 2 | Repo baru **`kavanah-kep.github.io`** berisi `assetlinks.json` | `kavanah-kep.github.io.zip` |
| 3 | Paket APK + kunci penandatangan | dibuat di pwabuilder.com |

Waktu yang dibutuhkan: ±30–45 menit.

---

## TAHAP 1 — Upload frontend versi baru

1. Ekstrak `absenku-frontend.zip`.
2. **Salin `GAS_URL` dari `js/config.js` lama Anda** ke `js/config.js` yang baru.
3. Timpa isi folder `D:\BELAJAR WEBB\ABSENKU\absenku-frontend` dengan isi ZIP baru (termasuk folder baru `icons\` dan `screenshots\`, berkas `offline.html` dan `.gitignore`).
4. Dari folder itu, jalankan:
   ```powershell
   git add .
   git commit -m "Siap PWABuilder: ikon, manifest, CSP, offline"
   git push
   ```
5. Tunggu 1–2 menit, lalu buka di browser — keduanya harus tampil:
   - `https://kavanah-kep.github.io/absenku/manifest.webmanifest` → teks JSON
   - `https://kavanah-kep.github.io/absenku/icons/icon-512.png` → ikon sidik jari biru

> `.gitignore` baru adalah **pengaman**: berkas kunci (`*.keystore`), APK, dan ZIP tidak akan bisa ikut ter-upload ke GitHub walau tidak sengaja tersimpan di folder ini.

---

## TAHAP 2 — Buat repo `kavanah-kep.github.io` (untuk verifikasi Android)

Android memeriksa berkas `https://kavanah-kep.github.io/.well-known/assetlinks.json` — di **akar domain**, bukan di `/absenku/`. Karena itu perlu satu repo khusus. Repo ini tidak mengubah alamat Absenku sama sekali.

1. Di github.com: **+** → **New repository**
   - Repository name: **`kavanah-kep.github.io`** (harus persis sama dengan username Anda + `.github.io`)
   - **Public**, jangan centang README → **Create repository**
   > Jika repo dengan nama itu **sudah ada**, cukup tambahkan folder `.well-known` dan berkas `.nojekyll` ke repo tersebut.
2. Ekstrak `kavanah-kep.github.io.zip` ke misalnya `D:\BELAJAR WEBB\ABSENKU\kavanah-kep.github.io`.
3. Buka PowerShell **di folder itu**, cek isinya:
   ```powershell
   dir -Force
   ```
   Harus terlihat: `.well-known`, `.nojekyll`, `index.html`, `README.md`.
4. Push:
   ```powershell
   git init
   git add .
   git commit -m "Digital Asset Links untuk APK Absenku"
   git branch -M main
   git remote add origin https://github.com/kavanah-kep/kavanah-kep.github.io.git
   git push -u origin main
   ```
5. Cek **Settings → Pages**: Source *Deploy from a branch*, Branch **main / (root)**, **Enforce HTTPS** ✅.

`assetlinks.json` saat ini masih berisi teks contoh — akan diisi di Tahap 5.

---

## TAHAP 3 — Periksa di PWABuilder

1. Buka **https://www.pwabuilder.com** — ketik sendiri alamatnya.
   > ⚠️ **Gunakan HANYA pwabuilder.com.** Situs/aplikasi "web to APK" lain yang tidak jelas sering menyisipkan iklan, pelacak, atau malware ke APK. PWABuilder dikelola Microsoft dan kodenya terbuka di GitHub.
2. Masukkan URL: `https://kavanah-kep.github.io/absenku/` → **Start**.
3. Tunggu laporan (*report card*). Yang wajib hijau:
   - **Manifest** — nama, ikon 192/512, ikon *maskable*, screenshot, warna ✅
   - **Service Worker** — terdeteksi, mendukung offline ✅
   - **Security** — HTTPS ✅

   Saran opsional seperti *related applications*, *IARC rating*, *widgets*, *share target*, *protocol handlers* **boleh diabaikan**.

---

## TAHAP 4 — Buat paket Android

1. Klik **Package For Stores** → pada kartu **Android** klik **Generate Package**.
2. Buka **All Settings / Options** dan isi seperti ini (nama kolom di situs bisa sedikit berbeda):

| Kolom | Isi | Catatan |
|---|---|---|
| Package ID | **`io.github.kavanahkep.absenku`** | ⚠️ Jangan pernah diubah setelah APK dibagikan |
| App name | `Absenku` | |
| Launcher name | `Absenku` | Nama di bawah ikon HP |
| App version | `1.0.0` | |
| App version code | `1` | Naikkan (2, 3, …) setiap membuat APK baru |
| Host | `kavanah-kep.github.io` | Terisi otomatis |
| Start URL | `/absenku/?source=pwa#/app/dashboard` | Terisi otomatis dari manifest |
| Theme / Nav color | `#1E3A8A` | Terisi otomatis |
| Background color | `#F1F5F9` | |
| Display mode | **Standalone** | |
| Orientation | **Portrait** | |
| Notification delegation | **Matikan (OFF)** | Absenku memakai notifikasi di dalam aplikasi — izin ini tidak dibutuhkan |
| Location delegation | **Nyalakan (ON)** | Agar izin GPS untuk absen muncul sebagai izin Android |
| Google Play billing | **OFF** | |
| Include source code | OFF | |
| **Signing key** | **Create new** | Lihat di bawah |

3. **Signing key → Create new**, isi:
   - Key alias: `absenku`
   - Nama & organisasi: nama Anda / perusahaan, Country: `ID`
   - **Password**: buat yang kuat (≥ 12 karakter, campuran huruf, angka, simbol). **Catat** — dibutuhkan setiap kali membuat APK versi baru.
4. Klik **Download**. Anda menerima ZIP berisi kurang lebih:
   - `Absenku.apk` — untuk dipasang langsung di HP
   - `Absenku.aab` — untuk Google Play (opsional)
   - `signing.keystore` — **KUNCI RAHASIA**
   - `signing-key-info.txt` — password & sidik jari kunci
   - `assetlinks.json` — untuk Tahap 5

### 🔐 WAJIB: amankan kunci penandatangan

`signing.keystore` + password ibarat **stempel resmi** perusahaan:

- **Hilang** → Anda tidak bisa lagi menerbitkan update APK dengan nama yang sama; semua karyawan harus menghapus dan memasang ulang.
- **Bocor** → orang lain bisa membuat APK palsu yang Android anggap "update resmi" Absenku.

Lakukan sekarang:
1. Pindahkan ZIP hasil PWABuilder ke folder **di luar** folder git, misalnya `D:\ABSENKU-RAHASIA\`.
2. Buat **2 cadangan**: flashdisk khusus + penyimpanan cloud pribadi (sebaiknya ZIP berpassword).
3. **Jangan** kirim `signing.keystore` / `signing-key-info.txt` lewat WhatsApp/email, dan **jangan** taruh di folder `absenku-frontend` atau `kavanah-kep.github.io`.

---

## TAHAP 5 — Pasang `assetlinks.json` yang asli

1. Buka `assetlinks.json` dari ZIP PWABuilder dengan Notepad, salin **seluruh** isinya.
2. Buka `D:\BELAJAR WEBB\ABSENKU\kavanah-kep.github.io\.well-known\assetlinks.json`, hapus isinya, tempel, simpan.
3. Pastikan `package_name` = `io.github.kavanahkep.absenku` dan ada sidik jari panjang (format `AB:CD:12:…`, 32 pasang).
4. Push:
   ```powershell
   git add .
   git commit -m "assetlinks.json asli dari PWABuilder"
   git push
   ```
5. Tunggu 1–2 menit, buka `https://kavanah-kep.github.io/.well-known/assetlinks.json` → harus tampil JSON dengan sidik jari Anda.

> Berkas ini **aman dipublikasikan**: hanya berisi nama paket dan sidik jari *publik* sertifikat, bukan kunci rahasia.

---

## TAHAP 6 — Pastikan APK bebas malware (sebelum dibagikan)

**a. Catat sidik jari APK.** Di PowerShell, di folder APK:
```powershell
Get-FileHash .\Absenku.apk -Algorithm SHA256
```
Simpan nilai `Hash` — ini "KTP" APK Anda.

**b. Pindai di VirusTotal.** Buka **https://www.virustotal.com** → **File** → unggah `Absenku.apk`.
- Hasil yang diharapkan: **0 deteksi** dari ±70 antivirus.
- Jika ada 1–2 deteksi *generic/heuristic* dari antivirus kecil, umumnya *false positive* pada APK baru — pindai ulang 1–2 hari kemudian. Jika antivirus besar (Google, Kaspersky, ESET, Bitdefender, Microsoft) mendeteksi sesuatu: **jangan bagikan**, buat ulang APK dari pwabuilder.com.

**c. Periksa izin APK** (VirusTotal → tab **Details** → *Permissions*).
- ✅ Wajar: internet, status jaringan, lokasi (karena *location delegation*), dan izin teknis pembungkus Chrome.
- ❌ **Tidak boleh ada**: SMS, kontak, log panggilan, mikrofon latar, *accessibility service*, *install packages*, *device admin*, *read external storage* tanpa alasan.

**d. Cocokkan sertifikat.** Di VirusTotal tab **Details** → *Certificate*, nilai **SHA-256** sertifikat harus **sama** dengan sidik jari di `signing-key-info.txt` dan `assetlinks.json`. Ini bukti APK ditandatangani dengan kunci Anda sendiri.

**e. Bagikan lewat satu saluran resmi saja**, misalnya folder Google Drive perusahaan dengan akses terbatas. Umumkan SHA-256 dari langkah (a) di grup resmi agar karyawan bisa memastikan APK yang mereka terima asli.

---

## TAHAP 7 — Pasang di HP karyawan

1. Unduh `Absenku.apk` dari saluran resmi → ketuk untuk membuka.
2. Android meminta izin **"Instal aplikasi tidak dikenal"** untuk Chrome/File Manager → **izinkan sementara** → instal → **matikan lagi** izin itu setelah selesai (Setelan → Aplikasi → Akses khusus → Instal aplikasi tidak dikenal).
3. **Google Play Protect** mungkin menampilkan "Aplikasi belum pernah dipindai / pengembang tidak dikenal" → pilih **Pindai aplikasi** → setelah dinyatakan aman, **Instal**. ⚠️ **Jangan pernah mematikan Play Protect.**
4. Buka **Absenku** → login → izinkan **Lokasi** dan **Kamera** saat diminta.
5. Cek: **tidak ada bilah alamat** di atas layar → verifikasi `assetlinks.json` berhasil. ✅

---

## TAHAP 8 — Aturan baru Android di Indonesia (wajib dibaca)

Sejak **30 September 2026**, Indonesia termasuk empat negara pertama (bersama Brasil, Singapura, Thailand) yang memberlakukan **verifikasi pengembang Android**:

- **Tahap pertama** ini berlaku untuk aplikasi yang dipasang dari **toko aplikasi resmi** (Google Play dan toko bawaan HP seperti Samsung, OPPO, vivo, Xiaomi, HONOR, Transsion) di HP Android bersertifikat.
- Pemasangan APK **langsung dari berkas** (cara Tahap 7) **belum disebut dibatasi** di tahap ini, dan Google menyediakan "alur lanjutan" bagi pengguna yang tetap ingin memasang aplikasi dari pengembang belum terverifikasi.
- Google merencanakan **perluasan global pada 2027** — jadi sebaiknya Absenku didaftarkan sekarang agar tidak tiba-tiba tidak bisa dipasang di HP karyawan baru.

**Pilih salah satu jalur pendaftaran:**

| Jalur | Cocok untuk | Keterangan |
|---|---|---|
| **A. Akun distribusi terbatas** (Android Developer Console) | ≤ 20 HP | Gratis, tanpa KTP. Daftarkan nama paket `io.github.kavanahkep.absenku` + sidik jari SHA-256 dari `signing-key-info.txt`. |
| **B. Pengembang terverifikasi** (Android Developer Console) | > 20 HP, tetap dibagikan sebagai APK | Verifikasi identitas/organisasi. Biaya (jika ada) tertera di konsol. |
| **C. Google Play — aplikasi privat / uji tertutup** ⭐ | Jangka panjang, paling praktis | Unggah `Absenku.aab`, batasi hanya untuk email karyawan. Otomatis terdaftar, Play Protect percaya penuh, karyawan memasang dari Play Store. Butuh akun Play Console (biaya pendaftaran sekali bayar — cek di Play Console). |

> **Jika memilih jalur C:** Google Play akan menandatangani ulang aplikasi (*Play App Signing*). Salin **SHA-256 kunci penandatanganan aplikasi** dari Play Console → *Test and release → App integrity*, lalu **tambahkan** sebagai sidik jari kedua di `assetlinks.json` (pisahkan dengan koma di dalam `sha256_cert_fingerprints`). Tanpa langkah ini, versi Play akan menampilkan bilah alamat.

---

## TAHAP 9 — Update aplikasi di kemudian hari

| Perubahan | Yang perlu dilakukan |
|---|---|
| Fitur/tampilan/data (frontend atau `Kode.gs`) | Cukup `git push` / deploy Apps Script seperti biasa. **Tidak perlu APK baru.** |
| Ganti ikon, nama aplikasi, warna, atau orientasi | Buat APK baru di PWABuilder: **Signing key → Use mine / Upload existing** → unggah `signing.keystore` yang sama + password, dan **naikkan Version code** (2, 3, …). Pasang di atas versi lama — data login tetap. |

⚠️ Jika APK baru ditandatangani dengan kunci **berbeda**, Android menolak memperbaruinya ("Aplikasi tidak terpasang — konflik paket").

---

## Troubleshooting

| Gejala | Penyebab & solusi |
|---|---|
| PWABuilder: "Manifest not found" / ikon merah | Tahap 1 belum ter-push atau cache. Buka URL manifest di browser untuk memastikan, lalu ulangi pemeriksaan di PWABuilder |
| Aplikasi menampilkan **bilah alamat** di atas | `assetlinks.json` belum benar: cek URL `.well-known` tampil, `package_name` sama persis, sidik jari sama dengan kunci APK. Setelah diperbaiki, hapus lalu pasang ulang APK |
| `.well-known/assetlinks.json` → 404 | Berkas `.nojekyll` tidak ikut ter-push, atau nama repo bukan persis `kavanah-kep.github.io` |
| "Aplikasi tidak terpasang" saat update | APK baru ditandatangani kunci berbeda / version code tidak dinaikkan |
| Play Protect memblokir instalasi | Pilih **Pindai aplikasi**. Untuk jangka panjang, daftarkan aplikasi (Tahap 8) |
| Absen: lokasi tidak terbaca | Izinkan **Lokasi** untuk Absenku (Setelan → Aplikasi → Absenku → Izin), nyalakan GPS |
| Kamera selfie tidak terbuka | Izinkan **Kamera** untuk Absenku / Chrome; pastikan Chrome di HP versi terbaru |
| Layar "Tidak ada koneksi internet" | Halaman offline Absenku — nyalakan data/Wi-Fi lalu ketuk **Coba lagi** |

---

## Ringkasan keamanan

- ✅ Dibuat hanya di **pwabuilder.com** (resmi, open source)
- ✅ Izin minimal (tanpa notifikasi, SMS, kontak), *location delegation* untuk absen
- ✅ Content-Security-Policy ketat di aplikasi web
- ✅ Kunci penandatangan disimpan offline + 2 cadangan, tidak pernah masuk GitHub (`.gitignore`)
- ✅ Dipindai VirusTotal (0 deteksi) + sertifikat dicocokkan sebelum dibagikan
- ✅ Dibagikan lewat satu saluran resmi + SHA-256 diumumkan
- ✅ Play Protect tetap aktif di semua HP
- ✅ Didaftarkan sesuai aturan verifikasi pengembang Android (Tahap 8)
