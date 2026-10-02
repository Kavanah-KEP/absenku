/* ============================================================
   UI — ikon, format, toast, modal, grafik, kalender, berkas
   ============================================================ */
(function () {
  const P = {
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    portal: '<rect x="3" y="6" width="18" height="15" rx="2"/><path d="M9 3h6v4H9z"/><circle cx="9" cy="13" r="2"/><path d="M6 18c.4-1.5 1.6-2.3 3-2.3s2.6.8 3 2.3M15 12h3M15 15h3"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
    calcheck: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M9 15.5l2 2 4-4"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.5 3.3-5.5 6.5-5.5s5.9 2 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20c-.4-2.6-1.9-4.4-4-5.1"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c.8-4 4-6.5 8-6.5s7.2 2.5 8 6.5"/>',
    usercheck: '<circle cx="10" cy="8" r="4"/><path d="M3 21c.7-4 3.6-6.5 7-6.5 1.4 0 2.7.4 3.8 1.1M15 18l2 2 4-4"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    trend: '<path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    wallet: '<path d="M3 7a2 2 0 0 1 2-2h13v4"/><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M16 13.5h2"/>',
    file: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h6"/>',
    alert: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/>',
    message: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 21 12z"/>',
    news: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10M7 12h10M7 16h6"/>',
    settings: '<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
    shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
    logout: '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h11"/>',
    bell: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10 20a2 2 0 0 0 4 0"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.5"/>',
    selfie: '<rect x="6" y="2" width="12" height="20" rx="2.5"/><circle cx="12" cy="10" r="2.6"/><path d="M8.5 16c.7-1.4 2-2.2 3.5-2.2s2.8.8 3.5 2.2M11 5h2"/>',
    pin: '<path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>',
    check: '<path d="m5 12 5 5 9-10"/>',
    checkc: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    xc: '<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6M15 9l-6 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    eyeoff: '<path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7c1.6 0 3-.4 4.3-1M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
    download: '<path d="M12 4v11M7 10l5 5 5-5M4 20h16"/>',
    upload: '<path d="M12 20V9M7 14l5-5 5 5M4 4h16"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-14.9-4M4 4v4h4M4 13a8 8 0 0 0 14.9 4M20 20v-4h-4"/>',
    send: '<path d="M21 3 10 14M21 3l-7 18-4-7-7-4z"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    grid: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>',
    chevl: '<path d="m15 6-6 6 6 6"/>',
    chevr: '<path d="m9 6 6 6-6 6"/>',
    chevd: '<path d="m6 9 6 6 6-6"/>',
    arrowr: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    arrowl: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    building: '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1M10 21v-3h4v3"/>',
    finger: '<path d="M7 11a5 5 0 0 1 10 0v2M12 11v4a6 6 0 0 1-1.5 4M4.5 9a8 8 0 0 1 15 0M9 21c1-1.5 1-3 1-5v-5a2 2 0 0 1 4 0M17 17c-.3 1.5-.8 2.7-1.5 3.7"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3M15 8l2 2"/>',
    printer: '<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>',
    nav: '<path d="M3 11 21 3l-8 18-2-8z"/>',
    face: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5c1 1.2 2.1 1.8 3.5 1.8s2.5-.6 3.5-1.8M9 9.5h.01M15 9.5h.01"/><path d="M5 8c2-.2 4-1.4 5-3.3 1.3 1.9 5 3.3 9 3.3"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3 12h18"/>',
    palette: '<circle cx="12" cy="12" r="9"/><circle cx="8" cy="10" r="1.2"/><circle cx="12" cy="7.5" r="1.2"/><circle cx="16" cy="10" r="1.2"/><path d="M12 21a2.5 2.5 0 0 1 0-5h1.5a2 2 0 0 0 2-2"/>',
    crosshair: '<circle cx="12" cy="12" r="7"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
    heart: '<path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 0 0-7.1 7.1L12 21l8.8-8.3a5 5 0 0 0 0-7.1z"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    phone: '<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2"/>',
    save: '<path d="M5 3h11l4 4v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a1 1 0 0 1 1-1z"/><path d="M8 3v5h7M7 21v-7h10v7"/>'
  };

  const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const BLN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  function esc(s) {
    return String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function icon(name, cls) {
    return '<svg class="ico ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (P[name] || P.info) + '</svg>';
  }
  function pd(s) { const m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; }
  function isoDate(d) { d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function periodeNow() { return isoDate().slice(0, 7); }

  const fmt = {
    tgl(s) { const d = pd(s); return d ? d.getDate() + ' ' + BLN[d.getMonth()] + ' ' + d.getFullYear() : (s || '-'); },
    tglPendek(s) { const d = pd(s); return d ? d.getDate() + ' ' + BLN[d.getMonth()] : (s || '-'); },
    tglHari(s) { const d = pd(s); return d ? HARI[d.getDay()] + ', ' + d.getDate() + ' ' + BLN[d.getMonth()] : (s || '-'); },
    tglPanjang(d) { d = d instanceof Date ? d : pd(d); return d ? HARI[d.getDay()] + ', ' + d.getDate() + ' ' + BULAN[d.getMonth()] + ' ' + d.getFullYear() : '-'; },
    rentang(a, b) {
      if (!b || a === b) return fmt.tgl(a);
      const x = pd(a), y = pd(b);
      if (x && y && x.getMonth() === y.getMonth() && x.getFullYear() === y.getFullYear()) return x.getDate() + ' – ' + fmt.tgl(b);
      return fmt.tglPendek(a) + ' – ' + fmt.tgl(b);
    },
    jam(s) { return s ? String(s).slice(0, 5) : '-'; },
    periode(p) { const m = String(p || '').match(/^(\d{4})-(\d{2})/); return m ? BULAN[+m[2] - 1] + ' ' + m[1] : (p || '-'); },
    rp(n) { n = Math.round(Number(n) || 0); return (n < 0 ? '-Rp ' : 'Rp ') + Math.abs(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.'); },
    num(n, d) { if (n === null || n === undefined || n === '') return '-'; return Number(n).toLocaleString('id-ID', { maximumFractionDigits: d === undefined ? 1 : d }); },
    ago(ts) {
      if (!ts) return '';
      const t = new Date(String(ts).replace(' ', 'T')).getTime();
      const s = Math.round((Date.now() - t) / 1000);
      if (isNaN(s)) return ts;
      if (s < 60) return 'baru saja';
      if (s < 3600) return Math.floor(s / 60) + ' menit lalu';
      if (s < 86400) return Math.floor(s / 3600) + ' jam lalu';
      if (s < 604800) return Math.floor(s / 86400) + ' hari lalu';
      return fmt.tgl(ts);
    },
    bulan: BULAN, bln: BLN, hari: HARI
  };

  function initials(n) { return String(n || '?').trim().split(/\s+/).slice(0, 2).map(x => x[0]).join('').toUpperCase(); }

  const BADGE = {
    'Tepat Waktu': 'green', 'Terlambat': 'amber', 'Menunggu': 'amber', 'Disetujui': 'green', 'Ditolak': 'red', 'Dibatalkan': '',
    'Aktif': 'green', 'Nonaktif': 'red', 'WFO': 'blue', 'WFH': 'cyan', 'Terkirim': 'blue', 'Dibaca': 'green', 'Publish': 'green', 'Draft': '',
    'SP1': 'amber', 'SP2': 'red', 'SP3': 'dark', 'Belum Terdaftar': 'amber', 'Tidak Aktif': 'red',
    'Cuti Tahunan': 'blue', 'Cuti Khusus': 'blue', 'Izin': 'cyan', 'Sakit': 'cyan', 'Dinas Luar': '', 'Lembur': 'amber',
    'SUPERADMIN': 'dark', 'HRD': 'blue', 'ADMIN_HRD': 'cyan', 'KARYAWAN': ''
  };
  const ROLE_LABEL = { SUPERADMIN: 'Superadmin', HRD: 'HRD', ADMIN_HRD: 'Admin HRD', KARYAWAN: 'Karyawan' };
  function badge(txt, cls) {
    const c = cls !== undefined ? cls : (BADGE[txt] !== undefined ? BADGE[txt] : '');
    const label = ROLE_LABEL[txt] || (txt === 'Menunggu' ? 'Menunggu Persetujuan' : txt);
    return '<span class="badge ' + c + '">' + esc(label) + '</span>';
  }

  // ---- Toast
  function toast(msg, type) {
    type = type || 'success';
    let wrap = document.querySelector('.toast-wrap');
    if (!wrap) { wrap = document.createElement('div'); wrap.className = 'toast-wrap'; document.body.appendChild(wrap); }
    const t = document.createElement('div');
    t.className = 'toast ' + type;
    t.setAttribute('role', type === 'error' ? 'alert' : 'status');
    t.innerHTML = icon({ success: 'checkc', error: 'xc', warning: 'alert', info: 'info' }[type] || 'info') + '<div>' + esc(msg) + '</div>';
    wrap.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; setTimeout(() => t.remove(), 300); }, type === 'error' ? 6000 : 3800);
  }

  // ---- Modal
  function modal(o) {
    const back = document.createElement('div');
    back.className = 'modal-back';
    back.innerHTML = '<div class="modal ' + (o.size || '') + '" role="dialog" aria-modal="true">' +
      '<div class="modal-head"><h3>' + esc(o.title || '') + '</h3><button class="icon-btn" data-close aria-label="Tutup">' + icon('x', 'ico-sm') + '</button></div>' +
      '<div class="modal-body">' + (o.body || '') + '</div>' + (o.foot ? '<div class="modal-foot">' + o.foot + '</div>' : '') + '</div>';
    document.body.appendChild(back);
    document.body.style.overflow = 'hidden';
    let closed = false;
    const close = (v) => {
      if (closed) return; closed = true;
      back.remove();
      if (!document.querySelector('.modal-back')) document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
      if (o.onClose) o.onClose(v);
    };
    const onKey = e => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    back.addEventListener('click', e => { if (e.target === back && !o.sticky) close(); if (e.target.closest('[data-close]')) close(); });
    const first = back.querySelector('input:not([type=hidden]),select,textarea');
    if (first && window.innerWidth > 768) setTimeout(() => first.focus(), 50);
    return { el: back, $: s => back.querySelector(s), $$: s => back.querySelectorAll(s), close };
  }

  function confirm(msg, o) {
    o = o || {};
    return new Promise(res => {
      let val = false;
      const m = modal({
        title: o.title || 'Konfirmasi', size: 'sm', body: '<p>' + esc(msg) + '</p>',
        foot: '<button class="btn ghost" data-close>Batal</button><button class="btn ' + (o.danger ? 'danger' : '') + '" data-ok>' + esc(o.ok || 'Ya, lanjutkan') + '</button>',
        onClose: () => res(val)
      });
      m.$('[data-ok]').onclick = () => { val = true; m.close(); };
    });
  }

  function prompt(o) {
    return new Promise(res => {
      let val = null;
      const m = modal({
        title: o.title, size: 'sm',
        body: (o.message ? '<p class="mb">' + esc(o.message) + '</p>' : '') + '<div class="field"><label>' + esc(o.label || '') + '</label>' +
          (o.textarea ? '<textarea class="textarea" data-in placeholder="' + esc(o.placeholder || '') + '">' + esc(o.value || '') + '</textarea>'
            : '<input class="input" data-in type="' + (o.type || 'text') + '" value="' + esc(o.value || '') + '" placeholder="' + esc(o.placeholder || '') + '">') + '</div>',
        foot: '<button class="btn ghost" data-close>Batal</button><button class="btn ' + (o.danger ? 'danger' : '') + '" data-ok>' + esc(o.ok || 'Simpan') + '</button>',
        onClose: () => res(val)
      });
      m.$('[data-ok]').onclick = () => { val = m.$('[data-in]').value; if (o.required && !val.trim()) { toast('Wajib diisi', 'warning'); return; } m.close(); };
    });
  }

  function busy(btn, on, text) {
    if (!btn) return;
    if (on) { btn._html = btn.innerHTML; btn.disabled = true; btn.innerHTML = '<span class="spinner sm"></span>' + (text ? ' ' + esc(text) : ''); }
    else { btn.disabled = false; if (btn._html) btn.innerHTML = btn._html; }
  }

  function empty(ic, text, extra) {
    return '<div class="empty">' + icon(ic || 'list') + '<div>' + esc(text) + '</div>' + (extra || '') + '</div>';
  }
  function loading(text) { return '<div class="page-loading"><div class="spinner"></div><div>' + esc(text || 'Memuat data…') + '</div></div>'; }

  function formData(form) {
    const o = {};
    form.querySelectorAll('[name]').forEach(el => {
      if (el.type === 'checkbox') o[el.name] = el.checked;
      else if (el.type === 'file') return;
      else o[el.name] = el.value.trim();
    });
    return o;
  }

  // ---- Berkas
  function readDataUrl(file) {
    return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(new Error('Gagal membaca berkas')); r.readAsDataURL(file); });
  }
  /** Gambar dikompres (maxPx, JPEG) — berkas lain dibaca apa adanya (maks 8 MB). */
  async function fileToDataUrl(file, maxPx, quality, keepPng) {
    if (!file) return null;
    if (!/^image\//.test(file.type)) {
      if (file.size > 8 * 1024 * 1024) throw new Error('Ukuran berkas maksimal 8 MB.');
      return readDataUrl(file);
    }
    const src = await readDataUrl(file);
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('Gambar tidak dapat dibaca')); i.src = src; });
    const scale = Math.min(1, (maxPx || 1280) / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
    const ctx = c.getContext('2d');
    if (!keepPng) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); }
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return keepPng && file.type === 'image/png' ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', quality || 0.82);
  }
  function b64ToBlob(b64, mime) {
    const bin = atob(b64); const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
  }
  function downloadB64(b64, mime, name) {
    const url = URL.createObjectURL(b64ToBlob(b64, mime));
    const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }
  /** Tampilkan berkas (gambar/PDF) dari backend di modal. */
  function viewFile(f, title) {
    const isImg = /^image\//.test(f.mime);
    const src = 'data:' + f.mime + ';base64,' + f.base64;
    let body;
    if (isImg) body = '<img src="' + src + '" alt="" style="max-height:70vh;margin:0 auto;border-radius:12px">';
    else if (f.mime === 'application/pdf') body = '<iframe class="doc-frame" src="' + URL.createObjectURL(b64ToBlob(f.base64, f.mime)) + '"></iframe>';
    else body = '<p>Pratinjau tidak tersedia untuk jenis berkas ini.</p>';
    const m = modal({ title: title || f.nama, size: 'lg', body: body, foot: '<button class="btn ghost" data-close>Tutup</button><button class="btn" data-dl>' + icon('download', 'ico-sm') + ' Unduh</button>' });
    m.$('[data-dl]').onclick = () => downloadB64(f.base64, f.mime, f.nama);
  }

  // ---- Grafik (Chart.js)
  let charts = [];
  function cssVar(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
  // ---- Pustaka pihak ketiga dimuat SAAT DIBUTUHKAN (lazy) — hemat ±1 MB di setiap pembukaan HP
  const LIBS = {
    chart: { js: ['https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.js'], ok: () => window.Chart },
    leaflet: { css: ['https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'], js: ['https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'], ok: () => window.L },
    html2pdf: { js: ['https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'], ok: () => window.html2pdf }
  };
  const libPromises = {};
  function need(name) {
    const lib = LIBS[name];
    if (lib.ok()) return Promise.resolve();
    if (libPromises[name]) return libPromises[name];
    (lib.css || []).forEach(href => { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; l.crossOrigin = ''; document.head.appendChild(l); });
    libPromises[name] = Promise.all(lib.js.map(src => new Promise((res, rej) => {
      const sc = document.createElement('script'); sc.src = src; sc.async = true; sc.crossOrigin = '';
      sc.onload = res; sc.onerror = () => rej(new Error('Gagal memuat ' + name)); document.head.appendChild(sc);
    }))).then(() => { if (!lib.ok()) throw new Error('Gagal memuat ' + name); })
      .catch(e => { delete libPromises[name]; throw e; });
    return libPromises[name];
  }

  function chart(canvas, cfg) {
    if (!canvas) return null;
    const create = () => {
      if (!canvas.isConnected) return null;          // halaman sudah berpindah
      Chart.defaults.font.family = cssVar('--font') || 'sans-serif';
      Chart.defaults.color = cssVar('--muted');
      Chart.defaults.borderColor = cssVar('--border');
      const c = new Chart(canvas, cfg);
      charts.push(c);
      return c;
    };
    if (window.Chart) return create();
    need('chart').then(create).catch(() => {
      const box = canvas.parentNode;
      if (box && canvas.isConnected) { box.style.height = 'auto'; box.innerHTML = '<div class="empty small">' + icon('chart') + '<div>Grafik tidak dapat dimuat (periksa koneksi internet).</div></div>'; }
    });
    return null;
  }

  /** Kerangka halaman (skeleton) — terasa lebih cepat daripada spinner. */
  function skeleton() {
    const b = (h, w) => '<div class="skeleton" style="height:' + h + 'px;width:' + (w || '100%') + '"></div>';
    return '<div class="skel-page">' + b(30, '42%') + b(14, '64%') +
      '<div class="grid g-4 keep2 mt">' + [1, 2, 3, 4].map(() => '<div class="card">' + b(12, '50%') + '<div style="height:14px"></div>' + b(30, '40%') + '</div>').join('') + '</div>' +
      '<div class="card mt">' + b(16, '30%') + '<div style="height:16px"></div>' + [1, 2, 3, 4, 5].map(() => b(14) + '<div style="height:14px"></div>').join('') + '</div></div>';
  }

  function destroyCharts() { charts.forEach(c => { try { c.destroy(); } catch (e) { } }); charts = []; }

  // ---- Kalender bulanan
  function calendar(periode, marks, o) {
    o = o || {};
    const y = +periode.slice(0, 4), m = +periode.slice(5, 7) - 1;
    const first = new Date(y, m, 1), start = (first.getDay() + 6) % 7;   // Senin = kolom pertama
    const days = new Date(y, m + 1, 0).getDate(), prevDays = new Date(y, m, 0).getDate();
    const today = isoDate();
    let h = '<div class="cal"><div class="cal-grid">' + ['Sn', 'Sl', 'Rb', 'Km', 'Jm', 'Sb', 'Mg'].map(d => '<div class="cal-dow">' + d + '</div>').join('');
    for (let i = 0; i < start; i++) h += '<div class="cal-day out">' + (prevDays - start + 1 + i) + '</div>';
    for (let d = 1; d <= days; d++) {
      const ds = periode + '-' + String(d).padStart(2, '0');
      const cls = (marks && marks[ds]) || '';
      h += '<div class="cal-day ' + cls + (ds === today ? ' today' : '') + '" title="' + ds + '">' + d + '</div>';
    }
    const tail = (7 - (start + days) % 7) % 7;
    for (let i = 1; i <= tail; i++) h += '<div class="cal-day out">' + i + '</div>';
    return h + '</div></div>';
  }

  // ---- Cincin progres (SVG)
  function ring(val, label, color) {
    const v = Math.max(0, Math.min(100, Number(val) || 0)), r = 70, c = 2 * Math.PI * r;
    return '<div class="ring-wrap"><svg viewBox="0 0 180 180"><circle cx="90" cy="90" r="' + r + '" stroke="var(--surface-3)" stroke-width="16" fill="none"/>' +
      '<circle cx="90" cy="90" r="' + r + '" stroke="' + (color || 'var(--interactive)') + '" stroke-width="16" fill="none" stroke-linecap="round" stroke-dasharray="' + c + '" stroke-dashoffset="' + (c * (1 - v / 100)) + '" style="transition:stroke-dashoffset .8s"/></svg>' +
      '<div class="ring-val"><b>' + (val === null || val === undefined ? '–' : fmt.num(val)) + '</b><span class="muted small">' + esc(label || '') + '</span></div></div>';
  }

  // ---- Font & tema
  const FONT_URL = {
    'Poppins': 'Poppins:wght@400;500;600;700;800', 'Inter': 'Inter:wght@400;500;600;700;800',
    'Plus Jakarta Sans': 'Plus+Jakarta+Sans:wght@400;500;600;700;800', 'Manrope': 'Manrope:wght@400;500;600;700;800',
    'Sora': 'Sora:wght@400;500;600;700;800'
  };
  const loadedFonts = {};
  function loadFont(name) {
    if (!FONT_URL[name] || loadedFonts[name]) return;
    loadedFonts[name] = true;
    const l = document.createElement('link'); l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=' + FONT_URL[name] + '&display=swap';
    document.head.appendChild(l);
  }
  function applyTheme(theme, font) {
    document.documentElement.setAttribute('data-theme', theme || 'korporat');
    if (font) { loadFont(font); document.documentElement.style.setProperty('--font', "'" + font + "', system-ui, -apple-system, 'Segoe UI', sans-serif"); }
    const meta = document.querySelector('meta[name=theme-color]');
    if (meta) meta.content = cssVar('--sidebar-bg') || '#1E3A8A';
  }

  function debounce(fn, ms) { let t; return function () { const a = arguments; clearTimeout(t); t = setTimeout(() => fn.apply(this, a), ms || 250); }; }
  function options(list, sel) { return list.map(x => { const v = typeof x === 'object' ? x.v : x, l = typeof x === 'object' ? x.l : x; return '<option value="' + esc(v) + '"' + (String(v) === String(sel) ? ' selected' : '') + '>' + esc(l) + '</option>'; }).join(''); }

  window.UI = { need, skeleton, icon, esc, fmt, initials, badge, toast, modal, confirm, prompt, busy, empty, loading, formData, fileToDataUrl, readDataUrl,
    downloadB64, b64ToBlob, viewFile, chart, destroyCharts, cssVar, calendar, ring, loadFont, applyTheme, debounce, options, isoDate, periodeNow, pd, ROLE_LABEL };
})();
