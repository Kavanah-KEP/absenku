/* ============================================================
   APP — router, layout, sesi, landing publik & login
   ============================================================ */
(function () {
  const { icon, esc, fmt, initials, toast, busy, loading } = UI;
  const ALL = ['KARYAWAN', 'ADMIN_HRD', 'HRD', 'SUPERADMIN'], HR = ['ADMIN_HRD', 'HRD', 'SUPERADMIN'], SA = ['SUPERADMIN'];

  // ---- Registri halaman (diisi oleh pages-*.js)
  const registry = {};
  window.Pages = { register(route, def) { registry[route] = def; } };

  const MENU = [
    { group: 'Menu Saya', items: [
      { r: 'dashboard', t: 'Dashboard', i: 'home', roles: ALL },
      { r: 'absensi', t: 'Absensi', i: 'clock', roles: ALL },
      { r: 'izin', t: 'Izin, Cuti & Lembur', i: 'calendar', roles: ALL },
      { r: 'kpi', t: 'KPI Saya', i: 'trend', roles: ALL },
      { r: 'slip', t: 'Slip Gaji', i: 'wallet', roles: ALL },
      { r: 'sp-saya', t: 'Surat Peringatan', i: 'file', roles: ALL },
      { r: 'chat', t: 'Chat HRD', i: 'message', roles: ['KARYAWAN'], badge: 'chat' }
    ] },
    { group: 'HR Management', roles: HR, items: [
      { r: 'persetujuan', t: 'Persetujuan', i: 'calcheck', badge: 'pending' },
      { r: 'rekap-absensi', t: 'Rekap Absensi', i: 'list' },
      { r: 'karyawan', t: 'Data Karyawan', i: 'users' },
      { r: 'kpi-karyawan', t: 'KPI Karyawan', i: 'chart' },
      { r: 'gaji', t: 'Gaji & Slip', i: 'wallet' },
      { r: 'bpjs', t: 'BPJS', i: 'heart' },
      { r: 'sp', t: 'Surat Peringatan', i: 'alert' },
      { r: 'chat', t: 'Chat Karyawan', i: 'message', badge: 'chat' },
      { r: 'berita', t: 'Kelola Berita', i: 'news' },
      { r: 'laporan', t: 'Laporan', i: 'printer' }
    ] },
    { group: 'Sistem', items: [
      { r: 'akun', t: 'Akun & Akses', i: 'shield', roles: SA },
      { r: 'pengaturan', t: 'Pengaturan', i: 'settings', roles: HR },
      { r: 'profil', t: 'Profil Saya', i: 'user', roles: ALL }
    ] }
  ];

  const App = {
    state: { info: null, user: null, counts: { notif: 0, chat: 0, pending: 0 } },
    cleanups: [],
    isHR() { return App.state.user && HR.indexOf(App.state.user.role) > -1; },
    isSA() { return App.state.user && App.state.user.role === 'SUPERADMIN'; },
    go(hash) { if (location.hash === hash) App.route(); else location.hash = hash; },
    onLeave(fn) { App.cleanups.push(fn); },
    onSessionExpired(msg) {
      if (App._expiring) return; App._expiring = true;
      App.state.user = null; stopPoll();
      toast(msg || 'Sesi berakhir, silakan login ulang.', 'warning');
      setTimeout(() => { App._expiring = false; }, 1500);
      location.hash = '#/login';
    }
  };
  window.App = App;

  // ============================================================
  // INSTANT UX — prefetch & pembaruan otomatis
  // ============================================================
  const today = () => UI.isoDate(), per = () => UI.periodeNow();
  const IZIN_PENDING = { status: 'Menunggu', jenis: 'Semua' };
  /** Data yang dibutuhkan tiap halaman → diambil saat jari menyentuh menu (sebelum klik selesai). */
  const ROUTE_DATA = {
    dashboard: () => App.isSA() ? [['dashSuperadmin'], ['dashHRD']] : App.isHR() ? [['dashHRD']] : [['dashKaryawan']],
    absensi: () => [['getAbsenToday'], ['myAbsensi', { periode: per() }]],
    izin: () => [['myIzin']],
    kpi: () => [['myKPI', { periode: per() }]],
    slip: () => [['mySlip']],
    'sp-saya': () => [['mySP']],
    chat: () => App.isHR() ? [['chatThreads']] : [['chatMessages']],
    persetujuan: () => [['listIzin', IZIN_PENDING]],
    'rekap-absensi': () => [['listKaryawan'], ['listAbsensi', { dari: today(), sampai: today(), karyawan_id: '' }]],
    karyawan: () => [['listKaryawan']],
    'kpi-karyawan': () => [['listKPI', { periode: per() }]],
    gaji: () => [['listKaryawan'], ['listGaji', { periode: '' }]],
    bpjs: () => [['listBPJS']],
    sp: () => [['listKaryawan'], ['listSP']],
    berita: () => [['listBeritaAdmin']],
    pengaturan: () => [['getSettingsAdmin']],
    akun: () => [['listAkun']]
  };
  /** Paket awal per role — satu request batch setelah login / saat aplikasi dibuka. */
  function bootPrefetch() {
    const r = App.state.user && App.state.user.role;
    if (!r) return Promise.resolve();
    const calls = [['me'], ['getAbsenToday'], ['listNotif']];
    if (r === 'KARYAWAN') calls.push(['dashKaryawan'], ['myIzin'], ['myKPI', { periode: per() }], ['mySP'], ['myAbsensi', { periode: per() }], ['mySlip'], ['chatMessages']);
    else {
      if (r === 'SUPERADMIN') calls.push(['dashSuperadmin'], ['listAkun']);
      calls.push(['dashHRD'], ['listIzin', IZIN_PENDING], ['listKaryawan'], ['myIzin'], ['chatThreads']);
    }
    return API.prefetch(calls);
  }
  App.prefetchRoute = function (route) {
    const f = ROUTE_DATA[route];
    if (f && App.state.user) { try { API.prefetch(f()); } catch (e) { } }
  };
  // Prefetch ketika pointer/jari menyentuh tautan menu
  ['pointerdown', 'mouseover', 'touchstart'].forEach(ev => document.addEventListener(ev, e => {
    const a = e.target.closest && e.target.closest('a[href^="#/app/"]');
    if (!a || a._pf) return;
    a._pf = true; setTimeout(() => { a._pf = false; }, 4000);
    App.prefetchRoute(a.getAttribute('href').replace('#/app/', '').split('?')[0]);
  }, { passive: true }));

  // Lacak action yang dipakai halaman aktif → bila datanya berubah di server, perbarui tampilan
  let pageActions = new Set(), freshTimer = null, freshPending = false;
  API._track = a => pageActions.add(a);
  API.onFresh((action, data) => {
    if (action === 'me' && data && data.user) {
      const roleChanged = App.state.user && App.state.user.role !== data.user.role;
      App.state.user = data.user; App.state.counts = data.counts || App.state.counts; API.setUser(data.user); updateCounts();
      if (roleChanged) { const sh = document.querySelector('.shell'); if (sh) sh.remove(); App.route(); }
      return;
    }
    if (!pageActions.has(action)) return;
    clearTimeout(freshTimer);
    freshTimer = setTimeout(applyFresh, 250);
  });
  function applyFresh() {
    const { parts, query } = parseHash();
    if (parts[0] !== 'app') return;
    const def = registry[parts[1] || 'dashboard'];
    if (!def) return;
    const busyUI = document.querySelector('.modal-back, .dropdown') ||
      (document.activeElement && document.activeElement.closest && document.activeElement.closest('#page') && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName));
    if (def.autoRefresh && !busyUI) { const y = window.scrollY; renderApp(parts[1] || 'dashboard', query, { soft: true }).then(() => window.scrollTo(0, y)); return; }
    showFreshPill();
  }
  function showFreshPill() {
    if (document.querySelector('.fresh-pill')) return;
    const b = document.createElement('button');
    b.className = 'fresh-pill'; b.innerHTML = icon('refresh', 'ico-sm') + ' Ada data terbaru · Muat ulang';
    b.onclick = () => { b.remove(); App.route(); };
    document.body.appendChild(b);
  }

  // ============================================================
  // Info publik & tema
  // ============================================================
  function cachedInfo() { try { return JSON.parse(API.store.get('absenku_info') || 'null'); } catch (e) { return null; } }
  function setInfo(info) {
    if (!info) return;
    App.state.info = info;
    try { localStorage.setItem('absenku_info', JSON.stringify(info)); } catch (e) { }
    UI.applyTheme(info.theme, info.font);
    document.title = info.app_name || 'Absenku';
    if (info.logo_url) {
      let l = document.querySelector('link[rel=icon]');
      if (!l) { l = document.createElement('link'); l.rel = 'icon'; document.head.appendChild(l); }
      l.href = info.logo_url;
    }
    const bn = document.querySelectorAll('[data-brand-name]'); bn.forEach(e => e.textContent = info.app_name);
    document.querySelectorAll('[data-brand-logo]').forEach(e => e.innerHTML = logoHtml());
    const foot = document.getElementById('kontak');
    if (foot) { foot.outerHTML = pubFoot(); bindScroll(document.getElementById('app')); }
  }
  App.setInfo = setInfo;
  function logoHtml() {
    const i = App.state.info || {};
    return i.logo_url ? '<img src="' + esc(i.logo_url) + '" alt="Logo" onerror="this.style.display=\'none\'">' : icon('finger');
  }
  App.logoHtml = logoHtml;
  async function refreshInfo() {
    try { setInfo(await API.get('getPublicInfo')); } catch (e) { console.warn(e); }
  }

  // ============================================================
  // Router
  // ============================================================
  function parseHash() {
    const h = location.hash.replace(/^#\/?/, '');
    const [path, qs] = h.split('?');
    const parts = path.split('/').filter(Boolean);
    return { parts, query: Object.fromEntries(new URLSearchParams(qs || '')) };
  }

  async function route() {
    App.cleanups.forEach(f => { try { f(); } catch (e) { } });
    App.cleanups = [];
    UI.destroyCharts();
    document.querySelectorAll('.modal-back').forEach(m => m.remove());
    document.body.style.overflow = '';
    const { parts, query } = parseHash();

    if (!parts.length) return renderLanding();
    if (parts[0] === 'berita' && parts[1]) return renderArticle(parts[1]);
    if (parts[0] === 'login') {
      if (API.token() && App.state.user) return App.go('#/app/dashboard');
      return renderLogin();
    }
    if (parts[0] === 'app') {
      if (!API.token()) return App.go('#/login');
      if (!App.state.user) {
        const cu = API.cachedUser();
        if (cu) {
          // Buka seketika dengan profil tersimpan; verifikasi sesi & data terbaru di latar belakang (1 batch)
          App.state.user = cu; API.setUser(cu);
          startPoll();
          bootPrefetch();
        } else {
          document.getElementById('app').innerHTML = '<div class="boot"><div class="spinner"></div></div>';
          try {
            const me = await API.call('me', {}, { fresh: true });
            App.state.user = me.user; App.state.counts = me.counts; API.setUser(me.user);
            startPoll();
            bootPrefetch();
          } catch (e) { if (e.code !== 'AUTH') { toast(e.message, 'error'); } return App.go('#/login'); }
        }
        idlePreloadLibs();
      }
      return renderApp(parts[1] || 'dashboard', query);
    }
    App.go('#/');
  }
  App.route = route;

  // ============================================================
  // Layout aplikasi (sidebar + topbar)
  // ============================================================
  function visibleMenu() {
    const role = App.state.user.role;
    return MENU.filter(g => !g.roles || g.roles.indexOf(role) > -1).map(g => ({
      group: g.group, items: g.items.filter(it => (!it.roles || it.roles.indexOf(role) > -1))
    })).filter(g => g.items.length);
  }

  function ensureShell() {
    let shell = document.querySelector('.shell');
    if (shell) return shell;
    const u = App.state.user, info = App.state.info || {};
    const root = document.getElementById('app');
    root.innerHTML =
      '<div class="shell">' +
      '<aside class="sidebar" aria-label="Navigasi utama">' +
      '<a class="brand" href="#/app/dashboard"><span class="brand-logo" data-brand-logo>' + logoHtml() + '</span><span class="brand-name" data-brand-name>' + esc(info.app_name || 'Absenku') + '</span></a>' +
      '<nav id="nav"></nav>' +
      '<div class="sidebar-foot"><div class="sidebar-user"><span class="avatar">' + esc(initials(u.nama)) + '</span><div style="min-width:0"><div class="nm">' + esc(u.nama) + '</div><div class="rl">' + esc(UI.ROLE_LABEL[u.role]) + (u.jabatan ? ' · ' + esc(u.jabatan) : '') + '</div></div></div></div>' +
      '</aside><div class="scrim" data-scrim></div>' +
      '<div class="main">' +
      '<header class="topbar"><div class="topbar-title"><button class="icon-btn hamburger" data-menu aria-label="Buka menu">' + icon('menu') + '</button><h2>Halo, ' + esc(u.nama) + '</h2></div>' +
      '<div class="topbar-actions">' +
      '<div class="bell" style="position:relative"><button class="icon-btn" data-bell aria-label="Notifikasi" style="border:0;background:none;width:40px;height:40px">' + icon('bell', 'ico-lg') + '</button><span class="pill-count hidden" data-count="notif"></span></div>' +
      '<div style="position:relative"><button class="avatar-btn" data-avatar aria-label="Menu akun">' + esc(initials(u.nama)) + '</button></div>' +
      '</div></header>' +
      '<main class="content" id="page"></main></div>' +
      '<nav class="bottom-nav" aria-label="Navigasi cepat">' +
      '<a href="#/app/dashboard" data-bn="dashboard">' + icon('home') + 'Beranda</a>' +
      '<a href="#/app/izin" data-bn="izin">' + icon('calendar') + 'Izin</a>' +
      '<a href="#/app/absensi" data-bn="absensi"><span class="fab">' + icon('finger', 'ico-lg') + '</span>Absen</a>' +
      '<a href="#/app/chat" data-bn="chat">' + icon('message') + 'Chat<span class="pill-count hidden" data-count="chat"></span></a>' +
      '<button data-menu>' + icon('grid') + 'Menu</button>' +
      '</nav></div>';
    shell = root.querySelector('.shell');
    shell.querySelectorAll('[data-menu]').forEach(b => b.onclick = () => shell.classList.toggle('nav-open'));
    shell.querySelector('[data-scrim]').onclick = () => shell.classList.remove('nav-open');
    shell.querySelector('[data-bell]').onclick = e => { e.stopPropagation(); toggleNotif(e.currentTarget.parentNode); };
    shell.querySelector('[data-avatar]').onclick = e => { e.stopPropagation(); toggleUserMenu(e.currentTarget.parentNode); };
    const tb = shell.querySelector('.topbar');
    window.addEventListener('scroll', () => tb.classList.toggle('scrolled', window.scrollY > 4), { passive: true });
    return shell;
  }

  function renderNav(active) {
    const nav = document.getElementById('nav');
    if (!nav) return;
    nav.innerHTML = visibleMenu().map(g => '<div class="nav-group"><div class="nav-group-title">' + esc(g.group) + '</div>' +
      g.items.map(it => '<a class="nav-link' + (it.r === active ? ' active' : '') + '" href="#/app/' + it.r + '">' + icon(it.i) + '<span>' + esc(it.t) + '</span>' +
        (it.badge ? '<span class="pill-count hidden" data-count="' + it.badge + '"></span>' : '') + '</a>').join('') + '</div>').join('') +
      '<div class="nav-group"><a class="nav-link" href="#/" target="_self">' + icon('news') + '<span>Portal Berita</span></a>' +
      '<a class="nav-link" href="javascript:void(0)" data-logout>' + icon('logout') + '<span>Keluar</span></a></div>';
    nav.querySelector('[data-logout]').onclick = logout;
    document.querySelectorAll('[data-bn]').forEach(a => a.classList.toggle('active', a.dataset.bn === active));
    updateCounts();
  }

  function updateCounts() {
    const c = App.state.counts || {};
    document.querySelectorAll('[data-count]').forEach(el => {
      const n = c[el.dataset.count] || 0;
      el.textContent = n > 99 ? '99+' : n;
      el.classList.toggle('hidden', !n);
    });
  }
  App.updateCounts = updateCounts;
  App.refreshCounts = async function () {
    try { App.state.counts = await API.call('poll'); updateCounts(); } catch (e) { }
  };

  async function renderApp(page, query, opt) {
    opt = opt || {};
    document.querySelectorAll('.fresh-pill').forEach(b => b.remove());
    const def = registry[page];
    const shell = ensureShell();
    shell.classList.remove('nav-open');
    renderNav(page);
    // Wadah halaman selalu diganti baru agar event listener halaman lama tidak menumpuk
    const old = document.getElementById('page');
    const el = old.cloneNode(false);
    old.replaceWith(el);
    if (!def) { el.innerHTML = UI.empty('alert', 'Halaman tidak ditemukan.'); return; }
    App.prefetchRoute(page);
    const roles = def.roles === 'HR' ? HR : def.roles === 'SA' ? SA : ALL;
    if (roles.indexOf(App.state.user.role) < 0) { el.innerHTML = UI.empty('lock', 'Anda tidak memiliki akses ke halaman ini.'); return; }
    document.title = (def.title ? def.title + ' · ' : '') + ((App.state.info || {}).app_name || 'Absenku');
    if (opt.soft) {
      // Pembaruan senyap: render ke wadah tersembunyi lalu tukar, agar tidak berkedip
      el.style.minHeight = old.offsetHeight + 'px';
    } else window.scrollTo(0, 0);
    const token = (App._renderSeq = (App._renderSeq || 0) + 1);
    pageActions = new Set();
    // Skeleton hanya muncul bila data belum ada di cache (render > 150 ms)
    const skel = opt.soft ? null : setTimeout(() => { if (token === App._renderSeq && !el.firstChild) el.innerHTML = UI.skeleton(); }, 150);
    if (opt.soft) el.innerHTML = old.innerHTML;
    try {
      await def.render(el, query, () => token === App._renderSeq);
      clearTimeout(skel);
      el.style.minHeight = '';
    } catch (e) {
      clearTimeout(skel);
      if (token !== App._renderSeq) return;
      console.error(e);
      if (e.code === 'AUTH') return;
      el.innerHTML = '<div class="card">' + UI.empty('alert', e.message || 'Gagal memuat halaman.', '<button class="btn ghost" onclick="App.route()">' + icon('refresh', 'ico-sm') + ' Coba lagi</button>') + '</div>';
    }
  }

  // ---- Dropdown notifikasi
  function closeDropdowns() { document.querySelectorAll('.dropdown').forEach(d => d.remove()); }
  document.addEventListener('click', e => { if (!e.target.closest('.dropdown')) closeDropdowns(); });

  async function toggleNotif(anchor) {
    if (anchor.querySelector('.dropdown')) return closeDropdowns();
    closeDropdowns();
    const dd = document.createElement('div');
    dd.className = 'dropdown';
    dd.innerHTML = '<div class="dropdown-head"><b>Notifikasi</b><button class="btn sm ghost" data-all>Tandai semua dibaca</button></div><div class="dropdown-list">' + loading('Memuat…') + '</div>';
    anchor.appendChild(dd);
    dd.addEventListener('click', e => e.stopPropagation());
    try {
      const list = await API.call('listNotif');
      const box = dd.querySelector('.dropdown-list');
      const color = { sukses: 'green', bahaya: 'red', izin: 'amber', info: 'blue' };
      box.innerHTML = list.length ? list.map(n => '<div class="notif-item' + (n.dibaca ? '' : ' unread') + '" data-id="' + esc(n.id) + '" data-link="' + esc(n.link) + '">' +
        '<span class="stat-ico" style="width:36px;height:36px;border-radius:10px;display:grid;place-items:center;flex:none;background:var(--' + ({ green: 'success', red: 'danger', amber: 'warning', blue: 'info' }[color[n.tipe] || 'blue']) + '-soft);color:var(--' + ({ green: 'success', red: 'danger', amber: 'warning', blue: 'interactive' }[color[n.tipe] || 'blue']) + ')">' + icon(n.tipe === 'bahaya' ? 'alert' : n.tipe === 'sukses' ? 'checkc' : n.tipe === 'izin' ? 'calendar' : 'bell', 'ico-sm') + '</span>' +
        '<div style="min-width:0"><div class="t">' + esc(n.judul) + '</div><div class="p">' + esc(n.pesan) + '</div><div class="xs muted">' + esc(fmt.ago(n.timestamp)) + '</div></div></div>').join('')
        : UI.empty('bell', 'Belum ada notifikasi.');
      box.querySelectorAll('.notif-item').forEach(it => it.onclick = async () => {
        closeDropdowns();
        if (it.classList.contains('unread')) {
          // Optimistic UI: kurangi badge seketika, sinkron di latar belakang
          App.state.counts.notif = Math.max(0, (App.state.counts.notif || 0) - 1); updateCounts();
          API.patch('listNotif', {}, l => l.map(n => n.id === it.dataset.id ? Object.assign(n, { dibaca: true }) : n));
          API.call('readNotif', { id: it.dataset.id }).catch(() => App.refreshCounts());
        }
        if (it.dataset.link) App.go(it.dataset.link);
      });
      dd.querySelector('[data-all]').onclick = () => {
        // Optimistic UI
        box.querySelectorAll('.unread').forEach(x => x.classList.remove('unread'));
        App.state.counts.notif = 0; updateCounts();
        API.patch('listNotif', {}, l => l.map(n => Object.assign(n, { dibaca: true })));
        API.call('readNotif', { id: 'all' }).catch(() => App.refreshCounts());
      };
    } catch (e) { dd.querySelector('.dropdown-list').innerHTML = UI.empty('alert', e.message); }
  }

  function toggleUserMenu(anchor) {
    if (anchor.querySelector('.dropdown')) return closeDropdowns();
    closeDropdowns();
    const u = App.state.user;
    const dd = document.createElement('div');
    dd.className = 'dropdown'; dd.style.width = '260px';
    dd.innerHTML = '<div class="dropdown-head"><div><b>' + esc(u.nama) + '</b><div class="xs muted">@' + esc(u.username) + ' · ' + esc(UI.ROLE_LABEL[u.role]) + '</div></div></div>' +
      '<button class="menu-item" data-go="#/app/profil">' + icon('user', 'ico-sm') + ' Profil & kata sandi</button>' +
      (App.isHR() ? '<button class="menu-item" data-go="#/app/pengaturan">' + icon('settings', 'ico-sm') + ' Pengaturan</button>' : '') +
      '<button class="menu-item" data-logout style="color:var(--danger)">' + icon('logout', 'ico-sm') + ' Keluar</button>';
    anchor.appendChild(dd);
    dd.querySelectorAll('[data-go]').forEach(b => b.onclick = () => { closeDropdowns(); App.go(b.dataset.go); });
    dd.querySelector('[data-logout]').onclick = logout;
  }

  async function logout() {
    closeDropdowns();
    const ok = await UI.confirm('Keluar dari aplikasi?', { ok: 'Keluar' });
    if (!ok) return;
    API.call('logout').catch(() => { });
    API.clear(); App.state.user = null; stopPoll();
    location.hash = '#/login';
  }
  App.logout = logout;

  // ---- Polling notifikasi
  let pollTimer = null;
  function startPoll() {
    stopPoll();
    pollTimer = setInterval(() => { if (document.visibilityState === 'visible' && App.state.user) App.refreshCounts(); }, (window.APP_CONFIG.POLL_MS || 60000));
    updateCounts();
  }
  function stopPoll() { if (pollTimer) clearInterval(pollTimer); pollTimer = null; }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && App.state.user) App.refreshCounts(); });

  // ============================================================
  // Halaman publik: navbar + footer
  // ============================================================
  function pubNav(active) {
    const info = App.state.info || {};
    const logged = !!API.token();
    return '<header class="pub-nav"><div class="in">' +
      '<a class="brand" href="#/"><span class="brand-logo" data-brand-logo>' + logoHtml() + '</span><span class="brand-name" data-brand-name>' + esc(info.app_name || 'Absenku') + '</span></a>' +
      '<nav class="pub-links"><a href="#/" class="hide-m' + (active === 'home' ? ' active' : '') + '">Beranda</a><a href="#/" data-scroll="berita" class="hide-m">Berita</a><a href="#/" data-scroll="kontak" class="hide-m">Kontak</a>' +
      '<a class="btn sm" href="' + (logged ? '#/app/dashboard' : '#/login') + '">' + icon(logged ? 'home' : 'user', 'ico-sm') + (logged ? ' Dashboard' : ' Masuk') + '</a></nav></div></header>';
  }
  function pubFoot() {
    const i = App.state.info || {};
    return '<footer class="pub-foot" id="kontak"><div class="in">' +
      '<div><a class="brand" href="#/" style="padding:0 0 12px"><span class="brand-logo" style="width:36px;height:36px" data-brand-logo>' + logoHtml() + '</span><span class="brand-name" data-brand-name style="font-size:18px">' + esc(i.app_name || 'Absenku') + '</span></a>' +
      '<p style="max-width:360px">' + esc(i.tagline || '') + '</p></div>' +
      '<div><h4>Tautan Cepat</h4><a href="#/">Beranda Utama</a><a href="#/" data-scroll="berita">Berita & Artikel</a><a href="#/login">Masuk Karyawan</a></div>' +
      '<div><h4>Hubungi Kami</h4><p>' + esc(i.perusahaan || '') + '<br>' + esc(i.alamat || '') + '</p><p class="mt-sm">' + icon('mail', 'ico-sm') + ' ' + esc(i.email || '') + '<br>' + icon('phone', 'ico-sm') + ' ' + esc(i.telepon || '') + '</p></div>' +
      '</div><div class="copy">© ' + new Date().getFullYear() + ' ' + esc(i.perusahaan || i.app_name || '') + '. Seluruh hak cipta dilindungi.</div></footer>';
  }
  function bindScroll(root) {
    root.querySelectorAll('[data-scroll]').forEach(a => a.onclick = e => {
      e.preventDefault();
      const t = document.getElementById(a.dataset.scroll);
      if (t) t.scrollIntoView({ behavior: 'smooth' });
    });
  }
  function newsImg(b, extra) {
    return '<div class="news-img" ' + (b.gambar_url ? 'style="background-image:url(\'' + esc(b.gambar_url) + '\')"' : '') + (extra || '') + '>' + (b.gambar_url ? '' : icon('news')) + '</div>';
  }

  // ============================================================
  // Landing (publik) — berita & informasi kantor
  // ============================================================
  async function renderLanding() {
    API.warm();
    const root = document.getElementById('app');
    const info = App.state.info || {};
    root.innerHTML = pubNav('home') +
      '<section class="hero"><span class="eyebrow">Portal Berita & Informasi</span><h1>Selamat Datang di <span data-brand-name>' + esc(info.app_name || 'Absenku') + '</span></h1>' +
      '<p data-tagline>' + esc(info.tagline || '') + '</p>' +
      '<div class="row wrap"><a class="btn lg white" href="' + (API.token() ? '#/app/dashboard' : '#/login') + '">' + icon('finger') + ' Masuk & Absen</a>' +
      '<a class="btn lg glass" href="#/" data-scroll="berita">' + icon('news') + ' Baca Berita</a></div></section>' +
      '<div id="berita"></div>' + pubFoot();
    bindScroll(root);
    const box = root.querySelector('#berita');
    box.innerHTML = '<div class="section">' + loading('Memuat berita…') + '</div>';
    try {
      const d = await API.getSWR('getBerita', {}, nd => { if (!location.hash.replace(/^#\/?/, '')) renderLanding(); });
      setInfo(d.info);
      const tg = root.querySelector('[data-tagline]'); if (tg) tg.textContent = d.info.tagline || '';
      const list = d.berita;
      if (!list.length) { box.innerHTML = '<div class="section"><div class="card">' + UI.empty('news', 'Belum ada berita yang diterbitkan.') + '</div></div>'; return; }
      const feat = list.find(b => b.unggulan) || list[0];
      const rest = list.filter(b => b !== feat);
      const cats = ['Semua'].concat(Array.from(new Set(rest.map(b => b.kategori).filter(Boolean))));
      let cat = 'Semua', shown = 6;
      box.innerHTML =
        '<div class="section"><div class="section-title"><h2>Berita Utama</h2><span class="muted small">Terbaru & terhangat</span></div>' +
        '<article class="card news-feat" data-open="' + esc(feat.id) + '">' + newsImg(feat) +
        '<div class="body"><div class="row"><span class="badge cyan">' + esc(feat.kategori) + '</span><span class="muted small">' + esc(fmt.tgl(feat.tanggal)) + '</span></div>' +
        '<h3>' + esc(feat.judul) + '</h3><p class="muted clamp3">' + esc(feat.ringkasan) + '</p>' +
        '<div class="row between" style="margin-top:auto;padding-top:14px;border-top:1px solid var(--border)"><div class="person"><span class="avatar" style="width:32px;height:32px;font-size:11px">' + esc(initials(feat.penulis)) + '</span><span class="small">' + esc(feat.penulis) + '</span></div>' +
        '<a href="#/berita/' + esc(feat.id) + '" class="small bold">Baca selengkapnya ' + icon('arrowr', 'ico-sm') + '</a></div></div></article></div>' +
        (rest.length ? '<div class="section"><div class="section-title"><h2>Berita & Artikel Lainnya</h2><div class="chips" data-chips></div></div><div class="news-grid" data-grid></div>' +
          '<div class="row" style="justify-content:center;margin-top:28px"><button class="btn dark" data-more>Muat Berita Lainnya ' + icon('chevd', 'ico-sm') + '</button></div></div>' : '');
      const draw = () => {
        const f = rest.filter(b => cat === 'Semua' || b.kategori === cat);
        const chips = box.querySelector('[data-chips]'), grid = box.querySelector('[data-grid]'), more = box.querySelector('[data-more]');
        if (!grid) return;
        chips.innerHTML = cats.map(c => '<button class="chip' + (c === cat ? ' active' : '') + '" data-cat="' + esc(c) + '">' + esc(c) + '</button>').join('');
        grid.innerHTML = f.slice(0, shown).map(b => '<article class="card news-card" data-open="' + esc(b.id) + '">' + newsImg(b) +
          '<div class="body"><div class="row between"><span class="badge cyan">' + esc(b.kategori) + '</span><span class="xs muted">' + esc(fmt.tgl(b.tanggal)) + '</span></div>' +
          '<h4 class="clamp2">' + esc(b.judul) + '</h4><p class="muted small clamp3">' + esc(b.ringkasan) + '</p>' +
          '<div class="foot"><span>Oleh ' + esc(b.penulis) + '</span><a href="#/berita/' + esc(b.id) + '">Selengkapnya →</a></div></div></article>').join('') || UI.empty('news', 'Tidak ada berita pada kategori ini.');
        more.classList.toggle('hidden', f.length <= shown);
        chips.querySelectorAll('[data-cat]').forEach(c => c.onclick = () => { cat = c.dataset.cat; shown = 6; draw(); });
      };
      draw();
      const more = box.querySelector('[data-more]'); if (more) more.onclick = () => { shown += 6; draw(); };
      box.addEventListener('click', e => { const c = e.target.closest('[data-open]'); if (c && !e.target.closest('a')) App.go('#/berita/' + c.dataset.open); });
    } catch (e) {
      box.innerHTML = '<div class="section"><div class="card">' + UI.empty('alert', e.message, '<button class="btn ghost" onclick="App.route()">Coba lagi</button>') + '</div></div>';
    }
  }

  async function renderArticle(id) {
    const root = document.getElementById('app');
    root.innerHTML = pubNav() + '<div class="article" id="art">' + loading() + '</div>' + pubFoot();
    bindScroll(root);
    window.scrollTo(0, 0);
    try {
      const b = await API.get('getBeritaDetail', { id });
      document.title = b.judul;
      root.querySelector('#art').innerHTML = '<a href="#/" class="small">' + icon('arrowl', 'ico-sm') + ' Kembali ke beranda</a>' +
        '<div class="row mt"><span class="badge cyan">' + esc(b.kategori) + '</span><span class="muted small">' + esc(fmt.tglPanjang(b.tanggal)) + ' · Oleh ' + esc(b.penulis) + '</span></div>' +
        '<h1>' + esc(b.judul) + '</h1>' + (b.gambar_url ? '<div class="news-img cover" style="background-image:url(\'' + esc(b.gambar_url) + '\')"></div>' : '') +
        '<p class="muted" style="font-size:17px;margin-bottom:18px">' + esc(b.ringkasan) + '</p><div class="isi">' + esc(b.isi) + '</div>';
    } catch (e) { root.querySelector('#art').innerHTML = '<div class="card">' + UI.empty('alert', e.message, '<a class="btn ghost" href="#/">Kembali</a>') + '</div>'; }
  }

  // ============================================================
  // Login
  // ============================================================
  function renderLogin() {
    API.warm();   // bangunkan server selagi pengguna mengetik
    const info = App.state.info || {};
    const root = document.getElementById('app');
    root.innerHTML = '<div class="login-page"><div class="login-card">' +
      '<div class="login-side"><a class="brand" href="#/"><span class="brand-logo" data-brand-logo>' + logoHtml() + '</span><span class="brand-name" data-brand-name>' + esc(info.app_name || 'Absenku') + '</span></a>' +
      '<div class="mid"><span class="eyebrow"><span class="badge" style="background:var(--accent);width:8px;height:8px;padding:0;margin-right:8px;vertical-align:middle"></span>Enterprise Attendance System</span>' +
      '<h2>Satu sistem untuk kehadiran & produktivitas.</h2><p>Kelola kehadiran karyawan, cuti, dan laporan operasional harian dengan efisien dan akurat secara real-time.</p></div>' +
      '<div class="foot"><span>© ' + new Date().getFullYear() + ' ' + esc(info.perusahaan || '') + '</span><span>' + icon('shield', 'ico-sm') + ' Login aman & terenkripsi</span></div></div>' +
      '<form class="login-form" novalidate>' +
      '<a href="#/" class="small">' + icon('arrowl', 'ico-sm') + ' Kembali ke portal berita</a>' +
      '<div><h1>Selamat Datang Kembali</h1><p class="muted mt-sm">Silakan masukkan kredensial akun karyawan Anda untuk masuk.</p></div>' +
      '<div class="field"><label for="lg-user">Username atau Email</label><div class="input-group">' + icon('portal', 'lead') + '<input id="lg-user" class="input" name="username" autocomplete="username" placeholder="nama.karyawan atau email@perusahaan.co.id" required></div></div>' +
      '<div class="field"><div class="row between"><label for="lg-pass">Kata Sandi</label><a href="javascript:void(0)" class="small" data-lupa>Lupa kata sandi?</a></div>' +
      '<div class="input-group">' + icon('lock', 'lead') + '<input id="lg-pass" class="input" name="password" type="password" autocomplete="current-password" placeholder="••••••••" required style="padding-right:44px">' +
      '<button type="button" class="trail" data-eye aria-label="Tampilkan kata sandi">' + icon('eye') + '</button></div></div>' +
      '<label class="check"><input type="checkbox" name="remember"> Ingat perangkat ini (30 hari)</label>' +
      '<button class="btn lg block" type="submit">Masuk ' + icon('arrowr', 'ico-sm') + '</button>' +
      '<hr style="border:0;border-top:1px solid var(--border);margin:6px 0">' +
      '<p class="muted small" style="text-align:center">Mengalami kendala saat masuk? Hubungi <a href="mailto:' + esc(info.email || '') + '">Tim HRD</a>.</p>' +
      '</form></div></div>';
    const form = root.querySelector('form');
    const pass = form.querySelector('#lg-pass');
    form.querySelector('[data-eye]').onclick = e => {
      const show = pass.type === 'password';
      pass.type = show ? 'text' : 'password';
      e.currentTarget.innerHTML = icon(show ? 'eyeoff' : 'eye');
      e.currentTarget.setAttribute('aria-label', show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi');
    };
    form.querySelector('[data-lupa]').onclick = () => UI.modal({ title: 'Lupa kata sandi', size: 'sm',
      body: '<p>Demi keamanan, kata sandi hanya dapat direset oleh HRD (untuk karyawan) atau Superadmin (untuk akun HRD).</p><p class="mt-sm muted">Hubungi: ' + esc(info.email || 'bagian HRD') + '</p>',
      foot: '<button class="btn" data-close>Mengerti</button>' });
    form.onsubmit = async e => {
      e.preventDefault();
      const d = UI.formData(form);
      if (!d.username || !d.password) return toast('Username dan kata sandi wajib diisi.', 'warning');
      const btn = form.querySelector('[type=submit]');
      busy(btn, true, 'Memeriksa…');
      try {
        const r = await API.call('login', Object.assign({ prefetch: true }, d));
        API.setToken(r.token, !!d.remember);
        API.setUser(r.user);
        API.seed(r.prefetch);    // dashboard & halaman utama langsung siap dari respons login
        App.state.user = r.user; App.state.counts = { notif: 0, chat: 0, pending: 0 };
        startPoll();
        bootPrefetch();          // 1 request batch: profil, dashboard, absen hari ini, dst.
        idlePreloadLibs();
        toast('Selamat datang, ' + r.user.nama + '!');
        App.go('#/app/dashboard');
      } catch (err) { toast(err.message, 'error'); busy(btn, false); pass.select(); }
    };
    if (window.innerWidth > 768) form.querySelector('#lg-user').focus();
  }

  // ============================================================
  // Start
  // ============================================================
  async function start() {
    const c = cachedInfo();
    if (c) setInfo(c); else UI.applyTheme('korporat', 'Plus Jakarta Sans');
    if (!window.APP_CONFIG || String(window.APP_CONFIG.GAS_URL).indexOf('GANTI_DENGAN') > -1) {
      document.getElementById('app').innerHTML = '<div class="login-page"><div class="card" style="max-width:520px">' +
        '<h2 class="mb">Konfigurasi belum lengkap</h2><p>Buka berkas <b>js/config.js</b> lalu isi <code>GAS_URL</code> dengan URL Web App Google Apps Script Anda (berakhiran <code>/exec</code>).</p></div></div>';
      return;
    }
    window.addEventListener('hashchange', route);
    if (!API.token()) refreshInfo(); else setTimeout(refreshInfo, 3000);
    route();
  }
  // Error async yang tidak tertangkap → tampilkan sebagai toast (sesi habis ditangani terpisah)
  window.addEventListener('unhandledrejection', e => {
    const err = e.reason || {};
    e.preventDefault();
    if (err.code === 'AUTH') return;
    toast(err.message || 'Terjadi kesalahan tak terduga.', 'error');
  });
  /** Muat pustaka grafik & peta saat perangkat menganggur, agar halaman berikutnya instan. */
  function idlePreloadLibs() {
    const go = () => { UI.need('chart').catch(() => { }); if (!App.isHR() || App.isSA()) UI.need('leaflet').catch(() => { }); };
    if ('requestIdleCallback' in window) requestIdleCallback(() => setTimeout(go, 1500), { timeout: 6000 }); else setTimeout(go, 3000);
  }
  // Service worker: tampilan aplikasi tersimpan di perangkat → dibuka ulang tanpa unduh
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => { }));
  }
  document.addEventListener('DOMContentLoaded', start);
})();
