# Absenku — Frontend

Sistem manajemen kehadiran & HRD terintegrasi. Frontend statis (HTML/CSS/JS vanilla) untuk GitHub Pages; backend Google Apps Script sebagai REST API (JSON).

## Struktur

```
index.html            Kerangka halaman + pustaka CDN (Chart.js, Leaflet, html2pdf)
css/style.css         Design system + 5 tema warna (PRD 7.2)
js/config.js          ⚠️ ISI GAS_URL DI SINI
js/api.js             fetch() ke GAS (POST text/plain, token sesi)
js/ui.js              Ikon, format, modal, toast, grafik, kalender
js/app.js             Router, layout, notifikasi, landing berita, login
js/pages-karyawan.js  Dashboard, Absensi, Izin/Cuti/Lembur, KPI, Slip, SP, Chat, Profil
js/pages-hrd.js       Dashboard HR/Superadmin, Persetujuan, Rekap, Karyawan, KPI, Gaji, BPJS, SP, Berita, Laporan
js/pages-admin.js     Pengaturan (branding, tema, jam kerja, lokasi) & Akun (Superadmin)
```

## Fitur per role

| Fitur | Karyawan | Admin HRD / HRD | Superadmin |
|---|:-:|:-:|:-:|
| Absen selfie kamera depan + GPS geofence (WFO/WFH) | ✅ | ✅ | ✅ |
| Izin, sakit, cuti, dinas, lembur + lampiran | ✅ | ✅ | ✅ |
| KPI pribadi, slip gaji PDF pribadi, SP pribadi, chat HRD | ✅ | ✅ | ✅ |
| Persetujuan, rekap absensi + foto, data karyawan, KPI tim | | ✅ | ✅ |
| Gaji & slip, BPJS, Surat Peringatan PDF, berita, laporan PDF | | ✅ | ✅ |
| Pengaturan logo, nama, tema, font, jam kerja, lokasi | | ✅ | ✅ |
| Kelola akun HRD/Admin HRD (tambah/nonaktifkan) | | | ✅ |

Panduan lengkap: **PANDUAN-INSTALASI.md**.
