/* ============================================================
   Service Worker — Absenku
   Menyimpan tampilan aplikasi (HTML/CSS/JS, font, pustaka grafik & peta)
   di perangkat sehingga dibuka ulang di HP tanpa mengunduh lagi.
   • Berkas aplikasi: tampil dari cache, diperbarui di latar belakang
     (versi baru aktif pada pembukaan berikutnya).
   • Data dari Google Apps Script TIDAK PERNAH di-cache di sini.
   Naikkan VERSION bila ingin memaksa semua perangkat memuat ulang total.
   ============================================================ */
const VERSION = 'absenku-v3';
const SHELL = [
  './', 'index.html', 'css/style.css', 'manifest.webmanifest',
  'js/config.js', 'js/api.js', 'js/ui.js', 'js/app.js',
  'js/pages-karyawan.js', 'js/pages-hrd.js', 'js/pages-admin.js'
];
const CDN = ['cdn.jsdelivr.net', 'unpkg.com', 'cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];
const NEVER = ['script.google.com', 'script.googleusercontent.com', 'googleusercontent.com', 'tile.openstreetmap.org'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (NEVER.some(h => url.hostname.endsWith(h))) return;           // data & peta: selalu jaringan
  const sameOrigin = url.origin === self.location.origin;
  if (!sameOrigin && !CDN.some(h => url.hostname.endsWith(h))) return;

  // Stale-while-revalidate: jawab dari cache seketika, perbarui cache di latar belakang
  e.respondWith(caches.open(VERSION).then(async cache => {
    const key = sameOrigin && req.mode === 'navigate' ? 'index.html' : req;
    const cached = await cache.match(key, { ignoreSearch: sameOrigin });
    const network = fetch(req).then(res => {
      if (res && (res.ok || res.type === 'opaque')) cache.put(key, res.clone());
      return res;
    }).catch(() => cached);
    return cached || network;
  }));
});
