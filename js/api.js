/* ============================================================
   API — komunikasi ke Google Apps Script via fetch()
   ------------------------------------------------------------
   INSTANT UX (gas-instant-ux):
   • Stale-While-Revalidate: data baca disimpan di memori + localStorage.
     Halaman langsung tampil dari cache (0 ms), lalu data disegarkan di
     latar belakang. Bila berubah, halaman diperbarui otomatis.
   • Deduplikasi: permintaan identik yang sedang berjalan tidak dikirim ulang.
   • Prefetch batch: beberapa data diambil dalam SATU request (1x RTT).
   • Invalidasi: setiap aksi tulis menghapus cache yang terkait.
   POST WAJIB Content-Type text/plain (GAS tidak menjawab preflight CORS).
   ============================================================ */
(function () {
  const store = {
    get(k) { try { return localStorage.getItem(k) || sessionStorage.getItem(k); } catch (e) { return null; } },
    set(k, v, persist) {
      try { (persist ? localStorage : sessionStorage).setItem(k, v); (persist ? sessionStorage : localStorage).removeItem(k); } catch (e) { }
    },
    del(k) { try { localStorage.removeItem(k); sessionStorage.removeItem(k); } catch (e) { } }
  };

  // ---- Action baca yang di-cache → berapa detik dianggap "masih segar" (tanpa revalidasi)
  const READ = {
    me: 30, dashKaryawan: 20, dashHRD: 20, dashSuperadmin: 30, getAbsenToday: 10, myAbsensi: 30, myIzin: 20,
    myKPI: 60, mySlip: 120, mySP: 60, listNotif: 15, listIzin: 15, listAbsensi: 20, listKaryawan: 60, listKPI: 60,
    listGaji: 60, listBPJS: 120, listSP: 60, chatThreads: 10, chatMessages: 5, listBeritaAdmin: 60,
    getSettingsAdmin: 120, listAkun: 60
  };
  // Data sangat sensitif: hanya di memori (tidak ditulis ke penyimpanan perangkat)
  // (slip milik sendiri boleh tersimpan di perangkat pemiliknya; dihapus saat Keluar)
  const MEMORY_ONLY = { listGaji: 1, listBPJS: 1 };
  // Action yang bukan baca-cache tetapi juga tidak mengubah data → tidak meng-invalidate apa pun
  const NEUTRAL = { poll: 1, ping: 1, login: 1, batch: 1, getFotoAbsen: 1, getLampiran: 1, previewSlip: 1, previewSP: 1, laporanData: 1, getPublicInfo: 1, getBerita: 1, getBeritaDetail: 1 };
  // Aksi tulis → cache yang perlu dihapus (default: semua)
  const INVALIDATE = {
    readNotif: ['listNotif'],
    sendChat: ['chatMessages', 'chatThreads', 'dashKaryawan'],
    changePassword: [],
    downloadSlip: ['listGaji'],
    downloadSP: ['mySP', 'listSP'],
    saveLaporanPdf: [],
    saveNilaiKinerja: ['listKPI', 'myKPI', 'dashHRD', 'dashKaryawan'],
    snapshotKPI: [],
    submitAbsen: ['myAbsensi', 'listAbsensi', 'dashHRD', 'myKPI', 'listKPI', 'dashSuperadmin'],
    approveIzin: ['listIzin', 'dashHRD', 'dashSuperadmin', 'listKPI'],
    submitIzin: ['myIzin', 'listIzin', 'dashKaryawan', 'dashHRD', 'dashSuperadmin'],
    cancelIzin: ['myIzin', 'listIzin', 'dashKaryawan', 'dashHRD', 'dashSuperadmin'],
    saveKaryawan: ['listKaryawan', 'listBPJS', 'listKPI', 'dashHRD', 'chatThreads', 'listAkun', 'dashSuperadmin', 'me'],
    deleteKaryawan: ['listKaryawan', 'listBPJS', 'listKPI', 'dashHRD', 'chatThreads', 'listAkun', 'dashSuperadmin'],
    resetPassword: [],
    saveBPJS: ['listBPJS'],
    saveGaji: ['listGaji', 'mySlip', 'dashKaryawan'],
    deleteGaji: ['listGaji', 'mySlip', 'dashKaryawan'],
    createSP: ['listSP', 'mySP', 'dashHRD', 'dashKaryawan'],
    saveBerita: ['listBeritaAdmin'],
    deleteBerita: ['listBeritaAdmin'],
    saveSettings: ['getSettingsAdmin', 'getAbsenToday', 'dashKaryawan', 'myKPI', 'listKPI', 'dashHRD'],
    uploadLogo: ['getSettingsAdmin'],
    saveLokasi: ['getSettingsAdmin', 'getAbsenToday'],
    deleteLokasi: ['getSettingsAdmin', 'getAbsenToday'],
    saveAkun: ['listAkun', 'listKaryawan', 'dashSuperadmin', 'listKPI', 'listBPJS', 'chatThreads'],
    setStatusAkun: ['listAkun', 'listKaryawan', 'dashSuperadmin'],
    deleteAkun: ['listAkun', 'listKaryawan', 'dashSuperadmin', 'listKPI', 'listBPJS', 'dashHRD', 'chatThreads']
  };
  // Action yang aman diulang otomatis bila server Apps Script sedang gangguan sesaat
  const RETRY_SAFE = Object.assign({ login: 1, batch: 1, poll: 1, ping: 1, me: 1, getFotoAbsen: 1, getLampiran: 1, previewSlip: 1, previewSP: 1, laporanData: 1 }, READ);

  const mem = new Map();          // key → { d, t }
  const inflight = {};            // key → Promise<out>
  const listeners = [];
  let uid = '';
  const PFX = 'absenku_c:';

  function stable(o) {
    if (o === null || typeof o !== 'object') return JSON.stringify(o === undefined ? null : o);
    if (Array.isArray(o)) return '[' + o.map(stable).join(',') + ']';
    return '{' + Object.keys(o).sort().map(k => JSON.stringify(k) + ':' + stable(o[k])).join(',') + '}';
  }
  const keyOf = (action, data) => action + '|' + stable(data || {});
  const actionOf = key => key.slice(0, key.indexOf('|'));
  const pkey = key => PFX + uid + ':' + key;

  function getEntry(key) {
    if (mem.has(key)) return mem.get(key);
    if (!uid || MEMORY_ONLY[actionOf(key)]) return null;
    try {
      const raw = localStorage.getItem(pkey(key));
      if (raw) { const e = JSON.parse(raw); mem.set(key, e); return e; }
    } catch (e) { }
    return null;
  }
  function putEntry(key, data) {
    const e = { d: data, t: Date.now() };
    mem.set(key, e);
    if (!uid || MEMORY_ONLY[actionOf(key)]) return e;
    try { localStorage.setItem(pkey(key), JSON.stringify(e)); }
    catch (err) { clearPersistent(); try { localStorage.setItem(pkey(key), JSON.stringify(e)); } catch (e2) { } }
    return e;
  }
  function persistentKeys() {
    const out = [];
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.indexOf(PFX) === 0) out.push(k); } } catch (e) { }
    return out;
  }
  function clearPersistent() { persistentKeys().forEach(k => { try { localStorage.removeItem(k); } catch (e) { } }); }

  /** Hapus cache: 'all' atau daftar nama action. */
  function invalidate(list) {
    const all = list === 'all';
    const hit = key => all || list.indexOf(actionOf(key)) > -1;
    Array.from(mem.keys()).forEach(k => { if (hit(k)) mem.delete(k); });
    const mine = PFX + uid + ':';
    persistentKeys().forEach(k => { if (k.indexOf(mine) === 0 && hit(k.slice(mine.length))) { try { localStorage.removeItem(k); } catch (e) { } } });
  }
  function emit(action, data, key) { listeners.forEach(fn => { try { fn(action, data, key); } catch (e) { console.warn(e); } }); }

  function url() {
    const u = (window.APP_CONFIG && window.APP_CONFIG.GAS_URL) || '';
    if (!u || u.indexOf('GANTI_DENGAN') > -1) throw new Error('GAS_URL belum diisi di js/config.js');
    return u;
  }
  async function parse(res) {
    const text = await res.text();
    try { return JSON.parse(text); } catch (e) {
      throw new Error('Respons server tidak valid. Pastikan Web App di-deploy dengan akses "Anyone".');
    }
  }

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  /** Gangguan sesaat khas Apps Script (server bangun, error HTML tanpa CORS, sibuk) → layak dicoba ulang. */
  function transient(err) { return !!err && (err.transient || err.code === 'BUSY'); }

  /** Satu kali percobaan POST ke GAS. */
  async function sendOnce(action, data, opts, token) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), opts.timeout || (action === 'login' ? 30000 : 60000));
    let res;
    try {
      res = await fetch(url(), {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: action, token: token, data: data || {} }),
        signal: ctrl.signal, redirect: 'follow'
      });
    } catch (e) {
      throw Object.assign(new Error(e.name === 'AbortError' ? 'Server terlalu lama merespons. Periksa koneksi internet Anda.' : 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.'),
        { transient: true, network: true });
    } finally { clearTimeout(timer); }
    if (res.status >= 500) throw Object.assign(new Error('Server sedang sibuk. Mencoba lagi…'), { transient: true });
    try { return await parse(res); } catch (e) { e.transient = true; throw e; }
  }

  /**
   * Kirim request dengan coba ulang otomatis (maks 3x, jeda 0,8 s → 2 s) untuk gangguan sesaat.
   * Aksi tulis hanya diulang bila server jelas belum memprosesnya (balasan error server, bukan putus koneksi).
   */
  async function send(action, data, opts) {
    opts = opts || {};
    const token = API.token();                 // token yang dipakai request ini
    const safe = !!RETRY_SAFE[action];
    const maxTry = opts.retry !== undefined ? opts.retry + 1 : (action === 'login' ? 4 : 3);
    let out, lastErr;
    for (let i = 0; i < maxTry; i++) {
      try {
        out = await sendOnce(action, data, opts, token);
        if (!out.success && out.code === 'BUSY' && i < maxTry - 1) { await sleep(900 * (i + 1)); continue; }
        lastErr = null; break;
      } catch (e) {
        lastErr = e;
        const bolehUlang = transient(e) && (safe || !e.network);
        if (!bolehUlang || i === maxTry - 1) break;
        if (opts.onRetry) opts.onRetry(i + 1);
        await sleep([800, 2000, 3500][i] || 3500);
      }
    }
    if (lastErr) throw lastErr;
    if (!out.success) {
      // Sesi berakhir: hanya keluarkan pengguna bila token yang ditolak = token yang sedang aktif.
      // (Mencegah balasan request lama menendang sesi baru tepat setelah login ulang.)
      if (out.code === 'AUTH' && action !== 'login' && token && token === API.token()) {
        API.clear();
        if (window.App) window.App.onSessionExpired(out.message);
      }
      throw Object.assign(new Error(out.message || 'Terjadi kesalahan'), { code: out.code });
    }
    out.data = out.data === undefined ? null : out.data;
    return out;
  }

  function stamp(action, data) {
    // Untuk menghitung selisih jam server dengan benar meskipun data diambil dari cache
    if (action === 'getAbsenToday' && data && typeof data === 'object') data._at = Date.now();
    return data;
  }

  /** Ambil data baca dari server (dengan deduplikasi), simpan ke cache. */
  function fetchRead(action, data, key, opts) {
    if (inflight[key]) return inflight[key];
    const old = getEntry(key);
    const p = send(action, data, opts).then(out => {
      stamp(action, out.data);
      putEntry(key, out.data);
      if (old && JSON.stringify(old.d) !== JSON.stringify(out.data)) emit(action, out.data, key);
      return out;
    }).finally(() => { delete inflight[key]; });
    inflight[key] = p;
    return p;
  }

  const API = {
    store,
    token() { return store.get('absenku_token'); },
    setToken(t, persist) { store.set('absenku_token', t, persist); },
    setUser(u) {
      uid = u ? u.id : '';
      try { if (u) localStorage.setItem('absenku_user', JSON.stringify(u)); else localStorage.removeItem('absenku_user'); } catch (e) { }
    },
    cachedUser() { try { return JSON.parse(localStorage.getItem('absenku_user') || 'null'); } catch (e) { return null; } },
    clear() { store.del('absenku_token'); mem.clear(); clearPersistent(); API.setUser(null); },
    invalidate,
    /** Daftarkan listener: dipanggil saat data cache diperbarui dari server dan isinya berubah. */
    onFresh(fn) { listeners.push(fn); },
    /** Apakah data untuk action ini sudah ada di cache (untuk prefetch / skeleton). */
    has(action, data) { return !!getEntry(keyOf(action, data)); },
    /** Ubah isi cache secara lokal (optimistic update). fn(dataLama) → dataBaru */
    patch(action, data, fn) {
      const key = keyOf(action, data), e = getEntry(key);
      if (!e) return;
      try { const nd = fn(JSON.parse(JSON.stringify(e.d))); if (nd !== undefined) putEntry(key, nd); } catch (err) { console.warn(err); }
    },

    /** GET untuk endpoint publik (tanpa login) */
    async get(action, params) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 30000);
      try {
        const q = new URLSearchParams(Object.assign({ action: action }, params || {}));
        const res = await fetch(url() + '?' + q.toString(), { signal: ctrl.signal });
        const out = await parse(res);
        if (!out.success) throw Object.assign(new Error(out.message || 'Gagal memuat data'), { code: out.code });
        return out.data;
      } finally { clearTimeout(timer); }
    },

    /** GET publik dengan cache: kembalikan cache seketika, lalu onUpdate(dataBaru) bila berubah. */
    getSWR(action, params, onUpdate) {
      const k = 'absenku_pub:' + keyOf(action, params);
      let cached = null;
      try { cached = JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { }
      const fresh = API.get(action, params).then(d => {
        try { localStorage.setItem(k, JSON.stringify(d)); } catch (e) { }
        if (cached && JSON.stringify(cached) !== JSON.stringify(d) && onUpdate) onUpdate(d);
        return d;
      });
      if (cached) { fresh.catch(() => { }); return Promise.resolve(cached); }
      return fresh;
    },

    /** Bangunkan server Apps Script (cold start) tanpa menunggu hasilnya. */
    warm() { try { fetch(url() + '?action=ping', { mode: 'cors' }).catch(() => { }); } catch (e) { } },

    /**
     * Panggilan utama.
     * - Action baca: kembalikan dari cache bila ada (0 ms) + revalidasi di latar belakang bila sudah basi.
     *   opts.fresh = true → paksa ambil dari server.
     * - Action tulis: kirim ke server, lalu hapus cache yang terkait.
     */
    async call(action, data, opts) {
      data = data || {}; opts = opts || {};
      if (API._track) API._track(action);
      if (READ[action]) {
        const key = keyOf(action, data);
        if (!opts.fresh) {
          const e = getEntry(key);
          if (e) {
            if (Date.now() - e.t > READ[action] * 1000) fetchRead(action, data, key, opts).catch(() => { });
            return opts.full ? { success: true, data: e.d, message: '' } : e.d;
          }
        }
        const out = await fetchRead(action, data, key, opts);
        return opts.full ? out : out.data;
      }
      const out = await send(action, data, opts);
      if (!NEUTRAL[action]) {
        invalidate(INVALIDATE[action] || 'all');
        if (API.onWrite) setTimeout(() => API.onWrite(action), 50);   // isi ulang cache di latar belakang
      }
      return opts.full ? out : out.data;
    },

    /** Isi cache dengan hasil yang sudah diterima (mis. data awal dari respons login). */
    seed(items) {
      (items || []).forEach(it => {
        if (!it || !it.result || !it.result.success || !READ[it.action]) return;
        putEntry(keyOf(it.action, it.data || {}), stamp(it.action, it.result.data));
      });
    },

    /**
     * Prefetch beberapa data sekaligus dalam SATU request batch.
     * calls = [[action, data], ...]. Yang sudah segar di cache dilewati.
     */
    prefetch(calls) {
      if (!API.token()) return Promise.resolve();
      const todo = calls.map(c => [c[0], c[1] || {}]).filter(([a, d]) => {
        if (!READ[a]) return false;
        const k = keyOf(a, d), e = getEntry(k);
        return !inflight[k] && (!e || Date.now() - e.t > READ[a] * 1000);
      }).slice(0, 12);
      if (!todo.length) return Promise.resolve();
      if (todo.length === 1) return fetchRead(todo[0][0], todo[0][1], keyOf(todo[0][0], todo[0][1])).catch(() => { });
      const p = send('batch', { calls: todo.map(([a, d]) => ({ action: a, data: d })) }).then(out => out.data);
      todo.forEach(([a, d], i) => {
        const k = keyOf(a, d), old = getEntry(k);
        inflight[k] = p.then(res => {
          const r = res && res[i];
          if (!r || !r.success) throw Object.assign(new Error((r && r.message) || 'Gagal memuat data'), { code: r && r.code });
          stamp(a, r.data);
          putEntry(k, r.data);
          if (old && JSON.stringify(old.d) !== JSON.stringify(r.data)) emit(a, r.data, k);
          return { success: true, data: r.data, message: '' };
        }).finally(() => { delete inflight[k]; });
        inflight[k].catch(() => { });
      });
      return p.catch(() => { });
    }
  };
  // Pulihkan identitas cache dari sesi sebelumnya
  const cu = API.cachedUser(); if (cu && API.token()) uid = cu.id;
  window.API = API;
})();
