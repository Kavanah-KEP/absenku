/* ============================================================
   KONFIGURASI FRONTEND — satu-satunya file yang WAJIB diedit
   ============================================================
   Tempel URL Web App Google Apps Script (berakhiran /exec) di bawah.
   Cara mendapatkannya: Apps Script → Deploy → New deployment → Web app
   → Execute as: Me, Who has access: Anyone → Deploy → salin URL.
   ============================================================ */
window.APP_CONFIG = {
  GAS_URL: 'https://script.google.com/macros/s/AKfycbxlgetaA0VUoZOvdSy2v75vV6A5sj2uGiyvNLXNt0SU23xBuH0Z-E6INm2DoYgCABXr/exec',

  // Interval cek notifikasi & pesan baru (milidetik)
  POLL_MS: 60000,
  // Interval refresh chat saat halaman chat terbuka (milidetik)
  CHAT_POLL_MS: 6000,
  // Batas lebar foto selfie sebelum dikirim (dikompres agar hemat kuota)
  FOTO_MAX_PX: 900
};
