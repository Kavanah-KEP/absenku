/* ============================================================
   API — komunikasi ke Google Apps Script via fetch()
   POST WAJIB memakai Content-Type text/plain agar tidak memicu
   CORS preflight (GAS tidak menjawab OPTIONS).
   ============================================================ */
(function () {
  const store = {
    get(k) { try { return localStorage.getItem(k) || sessionStorage.getItem(k); } catch (e) { return null; } },
    set(k, v, persist) {
      try { (persist ? localStorage : sessionStorage).setItem(k, v); (persist ? sessionStorage : localStorage).removeItem(k); } catch (e) { }
    },
    del(k) { try { localStorage.removeItem(k); sessionStorage.removeItem(k); } catch (e) { } }
  };

  function url() {
    const u = (window.APP_CONFIG && window.APP_CONFIG.GAS_URL) || '';
    if (!u || u.indexOf('GANTI_DENGAN') > -1) throw new Error('GAS_URL belum diisi di js/config.js');
    return u;
  }

  async function withTimeout(promise, ms, ctrl) {
    const t = setTimeout(() => ctrl.abort(), ms);
    try { return await promise; } finally { clearTimeout(t); }
  }

  async function parse(res) {
    const text = await res.text();
    try { return JSON.parse(text); } catch (e) {
      // GAS mengembalikan halaman HTML bila deployment salah / akses bukan "Anyone"
      throw new Error('Respons server tidak valid. Pastikan Web App di-deploy dengan akses "Anyone".');
    }
  }

  const API = {
    store,
    token() { return store.get('absenku_token'); },
    setToken(t, persist) { store.set('absenku_token', t, persist); },
    clear() { store.del('absenku_token'); store.del('absenku_user'); },

    /** GET untuk endpoint publik (tanpa login) */
    async get(action, params) {
      const ctrl = new AbortController();
      const q = new URLSearchParams(Object.assign({ action: action }, params || {}));
      const res = await withTimeout(fetch(url() + '?' + q.toString(), { signal: ctrl.signal }), 30000, ctrl);
      const out = await parse(res);
      if (!out.success) throw Object.assign(new Error(out.message || 'Gagal memuat data'), { code: out.code });
      return out.data;
    },

    /** POST untuk semua aksi — token sesi dikirim di body, bukan di URL */
    async call(action, data, opts) {
      opts = opts || {};
      const ctrl = new AbortController();
      let res;
      try {
        res = await withTimeout(fetch(url(), {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: action, token: API.token(), data: data || {} }),
          signal: ctrl.signal,
          redirect: 'follow'
        }), opts.timeout || 90000, ctrl);
      } catch (e) {
        throw new Error(e.name === 'AbortError' ? 'Waktu permintaan habis. Periksa koneksi internet Anda.' : 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
      }
      const out = await parse(res);
      if (!out.success) {
        if (out.code === 'AUTH' && action !== 'login') {
          API.clear();
          if (window.App) window.App.onSessionExpired(out.message);
        }
        throw Object.assign(new Error(out.message || 'Terjadi kesalahan'), { code: out.code });
      }
      out.data = out.data === undefined ? null : out.data;
      return opts.full ? out : out.data;
    }
  };
  window.API = API;
})();
