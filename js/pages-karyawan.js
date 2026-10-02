/* ============================================================
   HALAMAN KARYAWAN (bisa diakses semua role)
   dashboard · absensi · izin · kpi · slip · sp-saya · chat · profil
   ============================================================ */
(function () {
  const { icon, esc, fmt, initials, badge, toast, busy, empty, loading } = UI;
  const JENIS = ['Izin', 'Sakit', 'Cuti Tahunan', 'Cuti Khusus', 'Dinas Luar', 'Lembur'];

  function head(title, sub, right) {
    return '<div class="page-head"><div><h1>' + esc(title) + '</h1>' + (sub ? '<p>' + esc(sub) + '</p>' : '') + '</div>' + (right || '') + '</div>';
  }
  function dateChip() { return '<span class="date-chip">' + icon('calendar') + esc(fmt.tglPanjang(new Date())) + '</span>'; }
  window.PageKit = { head, dateChip };

  // ============================================================
  // DASHBOARD (bercabang sesuai role)
  // ============================================================
  Pages.register('dashboard', {
    autoRefresh: true,
    title: 'Dashboard', roles: 'ALL',
    async render(el, q, alive) {
      if (App.isSA()) return window.HRView.superadmin(el, alive);
      if (App.isHR()) return window.HRView.dashboard(el, alive);
      return dashKaryawan(el, alive);
    }
  });

  async function dashKaryawan(el, alive) {
    const d = await API.call('dashKaryawan');
    if (!alive()) return;
    const a = d.absen_hari_ini, k = d.kpi, kp = d.kpi_sebelumnya;
    const delta = k.skor_akhir !== null && kp.skor_akhir !== null ? Math.round((k.skor_akhir - kp.skor_akhir) * 10) / 10 : null;
    const cutiPct = d.cuti.kuota ? Math.max(0, d.cuti.sisa) / d.cuti.kuota * 100 : 0;

    let absenCard;
    if (a) {
      absenCard = '<div class="stat-top"><span class="stat-label">Absen Hari Ini</span><span class="stat-ico">' + icon('finger', 'ico-lg') + '</span></div>' +
        '<div style="font-size:20px;font-weight:700">Hadir ' + esc(a.status) + '</div><div class="muted">Masuk pukul ' + esc(fmt.jam(a.jam_masuk)) + ' WIB' + (a.jam_pulang ? ' · Pulang ' + esc(fmt.jam(a.jam_pulang)) : '') + '</div>' +
        '<div class="stat-foot" style="border-top:1px solid rgba(255,255,255,.12);padding-top:12px;justify-content:space-between"><span style="color:#6EE7B7">' + icon('checkc', 'ico-sm') + ' Terverifikasi ' + (a.mode === 'WFH' ? 'WFH' : 'GPS') + '</span><span class="muted xs bold">' + esc(a.lokasi_masuk) + '</span></div>';
    } else {
      absenCard = '<div class="stat-top"><span class="stat-label">Absen Hari Ini</span><span class="stat-ico">' + icon('finger', 'ico-lg') + '</span></div>' +
        '<div style="font-size:20px;font-weight:700">Belum Absen</div><div class="muted">Jam masuk ' + esc(d.jam_masuk) + ' WIB · Mode ' + esc(d.mode_kerja) + '</div>' +
        '<div class="stat-foot" style="border-top:1px solid rgba(255,255,255,.12);padding-top:12px"><a href="#/app/absensi" style="color:#fff" class="bold">Absen sekarang ' + icon('arrowr', 'ico-sm') + '</a></div>';
    }

    const cta = !a
      ? { eyebrow: 'Attendance Check-in', h: 'Siap memulai hari kerja?', p: 'Catat kehadiran dengan selfie kamera depan dan verifikasi GPS otomatis.', btn: 'Absen Sekarang' }
      : !a.jam_pulang ? { eyebrow: 'Attendance Check-out', h: 'Sudah selesai bekerja?', p: 'Jangan lupa absen pulang agar jam kerja Anda tercatat lengkap.', btn: 'Absen Pulang' }
        : { eyebrow: 'Selesai', h: 'Absensi hari ini lengkap', p: 'Terima kasih atas kerja keras Anda hari ini. Sampai jumpa besok!', btn: 'Lihat Riwayat' };

    const riwayat = d.riwayat.length ? '<div class="table-wrap"><table class="table"><thead><tr><th>Tanggal</th><th>Masuk</th><th>Pulang</th><th>Status</th><th class="right hide-m">Lokasi</th></tr></thead><tbody>' +
      d.riwayat.map(r => '<tr><td class="nowrap">' + esc(fmt.tglHari(r.tanggal)) + '</td><td class="bold" style="color:var(--' + (r.status === 'Terlambat' ? 'warning' : 'success') + ')">' + esc(fmt.jam(r.jam_masuk)) + '</td><td>' + esc(fmt.jam(r.jam_pulang)) + '</td><td>' + badge(r.status) + '</td><td class="right hide-m">' + esc(r.lokasi_masuk) + '</td></tr>').join('') +
      '</tbody></table></div>' : empty('clock', 'Belum ada absensi bulan ini.');

    el.innerHTML = PageKit.head('Dashboard Karyawan', 'Selamat datang kembali! Berikut ringkasan kehadiran, cuti, dan informasi HR Anda hari ini.', PageKit.dateChip()) +
      (d.sp_aktif.length ? '<div class="alert red mb">' + icon('alert') + '<div><b>Anda memiliki ' + d.sp_aktif.length + ' Surat Peringatan aktif</b> (' + d.sp_aktif.map(s => esc(s.jenis)).join(', ') + ', berlaku s/d ' + esc(fmt.tgl(d.sp_aktif[0].berlaku_sampai)) + '). <a href="#/app/sp-saya">Lihat surat</a></div></div>' : '') +
      '<div class="stack">' +
      '<div class="grid g-4">' +
      '<div class="card stat dark">' + absenCard + '</div>' +
      '<div class="card stat"><div class="stat-top"><span class="stat-label">Sisa Cuti</span><span class="stat-ico">' + icon('calcheck') + '</span></div>' +
      '<div class="stat-value">' + d.cuti.sisa + ' <small>Hari</small></div><div class="muted small">Kuota tahunan ' + d.cuti.kuota + ' hari · terpakai ' + d.cuti.terpakai + '</div>' +
      '<div class="progress mt-sm"><span style="width:' + cutiPct + '%"></span></div></div>' +
      '<div class="card stat"><div class="stat-top"><span class="stat-label">Skor KPI</span><span class="stat-ico cyan">' + icon('trend') + '</span></div>' +
      '<div class="stat-value">' + (k.skor_akhir === null ? '–' : fmt.num(k.skor_akhir)) + (delta !== null ? ' <small class="' + (delta >= 0 ? 'up' : 'down') + '">' + (delta >= 0 ? '↑ +' : '↓ ') + fmt.num(delta) + '</small>' : '') + '</div>' +
      '<div class="muted small">Periode ' + esc(fmt.periode(d.periode)) + '</div>' +
      '<div class="stat-foot" style="justify-content:space-between"><span class="muted">Tepat waktu ' + fmt.num(k.pct_tepat) + '%</span><a href="#/app/kpi">Detail</a></div></div>' +
      '<div class="card stat"><div class="stat-top"><span class="stat-label">Izin Bulan Ini</span><span class="stat-ico" style="background:var(--surface-3);color:var(--text)">' + icon('clock') + '</span></div>' +
      '<div class="stat-value">' + d.izin_bulan_ini.hari + ' <small>Hari</small></div>' +
      (d.izin_bulan_ini.terakhir ? '<div class="muted small">Terakhir: ' + esc(d.izin_bulan_ini.terakhir.jenis) + ' ' + badge(d.izin_bulan_ini.terakhir.status) + '</div>' : '<div class="muted small">Belum ada pengajuan</div>') +
      '<div class="stat-foot" style="justify-content:space-between;border-top:1px solid var(--border);padding-top:12px"><span class="muted">Slip terakhir</span>' +
      (d.slip_terakhir ? '<a href="#/app/slip">' + esc(fmt.periode(d.slip_terakhir.periode)) + '</a>' : '<span class="muted">–</span>') + '</div></div>' +
      '</div>' +
      '<div class="grid g-2">' +
      '<div class="cta blue"><div><span class="eyebrow">' + esc(cta.eyebrow) + '</span><h3>' + esc(cta.h) + '</h3><p>' + esc(cta.p) + '</p></div>' +
      '<a class="btn white" href="#/app/absensi">' + icon('finger') + ' ' + esc(cta.btn) + '</a></div>' +
      '<div class="cta outline"><div><span class="eyebrow">Time Off & Permit</span><h3>Perlu izin atau cuti?</h3><p class="muted">Ajukan izin, sakit, cuti, dinas luar, atau lembur dengan mudah.</p></div>' +
      '<a class="btn ghost lg" href="#/app/izin" style="border-color:var(--interactive);color:var(--interactive)">' + icon('calendar') + ' Ajukan Izin</a></div>' +
      '</div>' +
      '<div class="grid g-main-r">' +
      '<div class="card"><div class="card-head"><h3>Riwayat Absensi Terbaru</h3><a href="#/app/absensi" class="small bold">Lihat semua ' + icon('arrowr', 'ico-sm') + '</a></div>' + riwayat + '</div>' +
      '<div class="card"><div class="card-head"><div><h3>Kalender ' + esc(fmt.bulan[+d.periode.slice(5) - 1]) + '</h3><div class="sub">Ringkasan status kehadiran</div></div><span class="bold" style="color:var(--interactive)">' + d.periode.slice(0, 4) + '</span></div>' +
      UI.calendar(d.periode, d.kalender) +
      '<div class="legend mt" style="border-top:1px solid var(--border);padding-top:14px"><span><i style="background:var(--success)"></i>Hadir</span><span><i style="background:var(--warning)"></i>Terlambat</span><span><i style="background:var(--interactive)"></i>Cuti/Izin</span></div></div>' +
      '</div>' +
      '<div class="card"><div class="row between wrap"><div class="person" style="flex:1"><span class="avatar lg">' + icon('message') + '</span><div style="min-width:0">' +
      (d.chat_terakhir ? '<div class="row gap-sm wrap"><b>' + esc(d.chat_terakhir.pengirim) + '</b>' + badge(d.chat_terakhir.dari === 'HRD' ? 'Tim HRD' : 'Anda', 'blue') + '<span class="xs muted">' + esc(fmt.ago(d.chat_terakhir.timestamp)) + '</span></div><div class="muted clamp2">' + esc(d.chat_terakhir.pesan) + '</div>'
        : '<b>Chat dengan HRD</b><div class="muted">Ada pertanyaan seputar administrasi, BPJS, atau gaji? Tanyakan langsung.</div>') +
      '</div></div><a class="btn soft lg" href="#/app/chat">' + icon('message') + ' Buka Chat</a></div></div>' +
      '</div>';
  }

  // ============================================================
  // ABSENSI — kamera depan (capture="user") + GPS + geofence
  // ============================================================
  function haversine(a, b, c, d) {
    const R = 6371000, t = Math.PI / 180, x = (c - a) * t, y = (d - b) * t;
    const h = Math.sin(x / 2) ** 2 + Math.cos(a * t) * Math.cos(c * t) * Math.sin(y / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  Pages.register('absensi', {
    title: 'Absensi', roles: 'ALL',
    async render(el, q, alive) {
      const d = await API.call('getAbsenToday');
      if (!alive()) return;
      const offset = new Date(d.server_time).getTime() - (d._at || Date.now());
      const a = d.absen;
      const tipe = !a ? 'masuk' : !a.jam_pulang ? 'pulang' : 'selesai';
      const wfh = d.mode_kerja === 'WFH';
      const st = { foto: null, fotoOk: false, pos: null, near: null, inRadius: false, sending: false };

      const statusBadge = !a ? '<span class="badge blue">' + icon('clock', 'ico-sm') + ' Belum Absen Masuk</span>'
        : !a.jam_pulang ? '<span class="badge ' + (a.status === 'Terlambat' ? 'amber' : 'green') + '">' + icon('checkc', 'ico-sm') + ' Masuk ' + esc(fmt.jam(a.jam_masuk)) + ' · ' + esc(a.status) + '</span>'
          : '<span class="badge green">' + icon('checkc', 'ico-sm') + ' Absensi Lengkap</span>';

      el.innerHTML = PageKit.head('Absensi', wfh ? 'Mode kerja Anda: WFH — lokasi tetap dicatat, tanpa batas radius kantor.' : 'Mode kerja Anda: WFO — absen hanya dapat dilakukan di dalam radius kantor.') +
        '<div class="stack">' +
        '<div class="card" style="background:var(--surface-2)"><div class="row between wrap">' +
        '<div><div class="stat-label" style="font-size:12px;font-weight:700;letter-spacing:.08em;color:var(--muted)">WAKTU SERVER LIVE</div><div class="clock tabular" data-clock>--:--:--</div><div class="muted" style="font-size:18px">' + esc(fmt.tglPanjang(d.tanggal)) + '</div></div>' +
        '<div style="text-align:right"><div class="mb" style="margin-bottom:6px">Status Kehadiran</div>' + statusBadge + '</div></div></div>' +
        (tipe === 'selesai' ? '<div class="card">' + empty('checkc', 'Anda sudah absen masuk (' + fmt.jam(a.jam_masuk) + ') dan pulang (' + fmt.jam(a.jam_pulang) + ') hari ini. Terima kasih!') + '</div>' :
          '<div class="grid g-main-r">' +
          // --- Kartu kamera
          '<div class="card"><div class="card-head"><div class="card-title-ico">' + icon('camera', 'ico-lg') + '<h3>Verifikasi Wajah</h3></div><span class="muted small">Kamera Depan</span></div>' +
          '<div class="selfie-frame" data-frame><div class="selfie-placeholder"><div class="ring">' + icon('face') + '</div><b style="font-size:18px;color:var(--text)">Ambil selfie untuk absen ' + tipe + '</b><span>Posisikan wajah Anda di tengah bingkai</span></div></div>' +
          '<input type="file" accept="image/*" capture="user" class="sr-only" data-cam aria-label="Ambil selfie">' +
          '<div class="mt" data-cam-actions><button class="btn lg block" data-take>' + icon('selfie') + ' Ambil Selfie</button></div>' +
          '<p class="xs muted mt-sm" style="text-align:center">Aplikasi kamera bawaan HP akan terbuka dalam mode kamera depan.</p></div>' +
          // --- Kartu lokasi
          '<div class="card" style="display:flex;flex-direction:column;gap:18px"><div class="card-title-ico">' + icon('pin', 'ico-lg') + '<h3>Lokasi Absensi</h3></div>' +
          '<div class="geo-box" data-geo><div class="row between"><span>Status Geofence</span><span class="badge">' + '<span class="spinner sm"></span> Mencari GPS…</span></div></div>' +
          '<div class="map" data-map></div>' +
          '<div class="geo-box"><dl class="kv"><dt>Shift Kerja</dt><dd>Reguler (' + esc(d.jam_masuk) + ' – ' + esc(d.jam_pulang) + ')</dd><dt>Toleransi</dt><dd>' + d.toleransi + ' menit</dd><dt>Metode</dt><dd>Selfie + ' + (wfh ? 'GPS (WFH)' : 'GPS Geofence') + '</dd></dl></div>' +
          '<div style="margin-top:auto"><button class="btn lg block dark" data-submit disabled style="height:60px;border-radius:99px;font-size:17px">' + icon('checkc', 'ico-lg') + ' Konfirmasi Absen ' + (tipe === 'masuk' ? 'Masuk' : 'Pulang') + '</button>' +
          '<p class="small muted mt-sm" style="text-align:center" data-hint>Ambil selfie dan tunggu lokasi GPS terbaca.</p></div></div>' +
          '</div>') +
        '<div class="card"><div class="card-head"><h3>Riwayat Absensi Saya</h3><input type="month" class="input" style="width:auto" data-bulan value="' + UI.periodeNow() + '"></div><div data-riwayat>' + loading() + '</div></div>' +
        '</div>';

      // Jam server live
      const clock = el.querySelector('[data-clock]');
      const tick = () => {
        const n = new Date(Date.now() + offset);
        const s = n.toLocaleTimeString('en-GB', { timeZone: 'Asia/Jakarta', hour12: false });
        clock.textContent = s;
      };
      tick(); const ti = setInterval(tick, 1000); App.onLeave(() => clearInterval(ti));

      // Riwayat
      const loadRiwayat = async () => {
        const box = el.querySelector('[data-riwayat]');
        box.innerHTML = loading();
        try {
          const r = await API.call('myAbsensi', { periode: el.querySelector('[data-bulan]').value });
          box.innerHTML = r.list.length ? '<div class="table-wrap"><table class="table"><thead><tr><th>Tanggal</th><th>Masuk</th><th>Pulang</th><th>Status</th><th>Mode</th><th class="hide-m">Lokasi</th><th class="right">Foto</th></tr></thead><tbody>' +
            r.list.map(x => '<tr><td class="nowrap">' + esc(fmt.tglHari(x.tanggal)) + '</td><td class="bold">' + esc(fmt.jam(x.jam_masuk)) + (x.terlambat_menit > 0 ? '<div class="xs warn">+' + x.terlambat_menit + ' mnt</div>' : '') + '</td><td>' + esc(fmt.jam(x.jam_pulang)) + '</td><td>' + badge(x.status) + '</td><td>' + badge(x.mode) + '</td><td class="hide-m">' + esc(x.lokasi_masuk) + '</td>' +
              '<td class="right">' + (x.ada_foto_masuk ? '<button class="icon-btn" data-foto="' + esc(x.id) + '" title="Lihat foto">' + icon('image', 'ico-sm') + '</button>' : '<span class="muted">–</span>') + '</td></tr>').join('') + '</tbody></table></div>'
            : empty('clock', 'Tidak ada data absensi pada periode ini.');
        } catch (e) { box.innerHTML = empty('alert', e.message); }
      };
      el.querySelector('[data-bulan]').onchange = loadRiwayat;
      el.querySelector('[data-riwayat]').addEventListener('click', async e => {
        const b = e.target.closest('[data-foto]'); if (!b) return;
        busy(b, true);
        try { UI.viewFile(await API.call('getFotoAbsen', { id: b.dataset.foto, tipe: 'masuk' }), 'Foto absen masuk'); } catch (err) { toast(err.message, 'error'); }
        busy(b, false);
      });
      loadRiwayat();
      if (tipe === 'selesai') return;

      // ---- Kamera
      const cam = el.querySelector('[data-cam]'), frame = el.querySelector('[data-frame]'), act = el.querySelector('[data-cam-actions]');
      const drawCam = () => {
        if (!st.foto) {
          act.innerHTML = '<button class="btn lg block" data-take>' + icon('selfie') + ' Ambil Selfie</button>';
        } else if (!st.fotoOk) {
          act.innerHTML = '<div class="grid g-2" style="gap:10px"><button class="btn lg ghost" data-take>' + icon('refresh') + ' Foto Ulang</button><button class="btn lg success" data-use>' + icon('check') + ' Gunakan Foto</button></div>';
        } else {
          act.innerHTML = '<button class="btn lg block ghost" data-take>' + icon('refresh') + ' Foto Ulang</button>';
        }
        act.querySelector('[data-take]').onclick = () => { cam.value = ''; cam.click(); };
        const use = act.querySelector('[data-use]');
        if (use) use.onclick = () => { st.fotoOk = true; frame.querySelector('.selfie-badge').textContent = '✓ Foto siap dikirim'; drawCam(); refresh(); };
      };
      cam.onchange = async () => {
        const f = cam.files[0]; if (!f) return;
        try {
          st.foto = await UI.fileToDataUrl(f, window.APP_CONFIG.FOTO_MAX_PX || 720, 0.72);
          st.fotoOk = false;
          frame.innerHTML = '<img src="' + st.foto + '" alt="Pratinjau selfie"><span class="selfie-badge">Pratinjau — periksa wajah terlihat jelas</span>';
          drawCam(); refresh();
        } catch (e) { toast(e.message, 'error'); }
      };
      drawCam();

      // ---- Peta
      let map = null, meMarker = null, meCircle = null;
      const mapEl = el.querySelector('[data-map]');
      const buildMap = () => {
        if (!mapEl.isConnected) return;
        mapEl.innerHTML = '';
        const first = d.lokasi[0];
        map = L.map(mapEl, { zoomControl: true, attributionControl: true }).setView(first ? [first.lat, first.lng] : [-2.5, 118], first ? 16 : 5);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);
        const col = UI.cssVar('--interactive') || '#2563EB';
        d.lokasi.forEach(l => {
          L.circle([l.lat, l.lng], { radius: l.radius, color: col, weight: 2, fillOpacity: .12 }).addTo(map).bindTooltip(l.nama);
          L.circleMarker([l.lat, l.lng], { radius: 5, color: col, fillOpacity: 1 }).addTo(map);
        });
        App.onLeave(() => { try { map.remove(); } catch (e) { } });
        setTimeout(() => map.invalidateSize(), 200);
        if (st.pos) drawMe();
      };
      mapEl.innerHTML = '<div class="empty small"><span class="spinner sm"></span>Memuat peta…</div>';
      // Peta dimuat setelah jam, kamera & GPS sudah siap — absen tidak perlu menunggu peta
      UI.need('leaflet').then(buildMap).catch(() => { if (mapEl.isConnected) mapEl.innerHTML = '<div class="empty">' + icon('pin') + 'Peta tidak dapat dimuat. Absen tetap bisa dilakukan.</div>'; });

      // ---- GPS
      const geo = el.querySelector('[data-geo]');
      const onPos = p => {
        st.pos = { lat: p.coords.latitude, lng: p.coords.longitude, acc: Math.round(p.coords.accuracy) };
        let best = null;
        d.lokasi.forEach(l => { const dist = haversine(st.pos.lat, st.pos.lng, l.lat, l.lng); if (!best || dist - l.radius < best.dist - best.l.radius) best = { l, dist }; });
        st.near = best; st.inRadius = !!best && best.dist <= best.l.radius;
        const accLbl = st.pos.acc <= 20 ? 'Tinggi' : st.pos.acc <= 60 ? 'Sedang' : 'Rendah';
        let status, place;
        if (wfh) { status = '<span class="badge cyan"><span class="dot"></span>Mode WFH</span>'; place = '<b>Lokasi kerja jarak jauh</b><div class="muted small">' + st.pos.lat.toFixed(5) + ', ' + st.pos.lng.toFixed(5) + '</div>'; }
        else if (!best) { status = '<span class="badge red">Lokasi kantor belum diatur</span>'; place = '<span class="muted">Hubungi HRD untuk mengatur titik kantor.</span>'; }
        else {
          status = st.inRadius ? '<span class="badge green"><span class="dot"></span>Dalam Radius Kantor</span>' : '<span class="badge red"><span class="dot"></span>Di Luar Radius</span>';
          place = '<div class="row" style="align-items:flex-start">' + icon('building', 'ico-lg') + '<div><b style="font-size:16px">' + esc(best.l.nama) + '</b><div class="muted small">' + esc(best.l.alamat || '') + '</div>' +
            '<div class="small" style="color:var(--' + (st.inRadius ? 'interactive' : 'danger') + ')">Jarak ' + Math.round(best.dist) + ' m (batas ' + best.l.radius + ' m)</div></div></div>';
        }
        geo.innerHTML = '<div class="row between mb">' + '<span>Status Geofence</span>' + status + '</div>' + place +
          '<div class="small mt-sm" style="color:var(--interactive)">' + icon('nav', 'ico-sm') + ' Akurasi GPS: ' + st.pos.acc + ' meter (' + accLbl + ')</div>';
        drawMe();
        refresh();
      };
      function drawMe() {
        if (map && st.pos) {
          const best = st.near;
          const ll = [st.pos.lat, st.pos.lng];
          if (!meMarker) {
            meMarker = L.circleMarker(ll, { radius: 8, color: '#fff', weight: 3, fillColor: '#DC2626', fillOpacity: 1 }).addTo(map).bindTooltip('Posisi Anda');
            meCircle = L.circle(ll, { radius: st.pos.acc, color: '#DC2626', weight: 1, fillOpacity: .08 }).addTo(map);
            const pts = [ll].concat(best ? [[best.l.lat, best.l.lng]] : []);
            map.fitBounds(L.latLngBounds(pts).pad(0.6), { maxZoom: 17 });
          } else { meMarker.setLatLng(ll); meCircle.setLatLng(ll).setRadius(st.pos.acc); }
        }
      }
      const onErr = e => {
        const msg = e.code === 1 ? 'Izin lokasi ditolak. Aktifkan izin lokasi untuk situs ini di pengaturan browser.' : e.code === 3 ? 'GPS terlalu lama merespons. Pastikan GPS aktif dan coba di area terbuka.' : 'Lokasi tidak dapat dibaca. Aktifkan GPS HP Anda.';
        geo.innerHTML = '<div class="alert red">' + icon('alert') + '<div>' + esc(msg) + '<div class="mt-sm"><button class="btn sm ghost" data-retry>' + icon('refresh', 'ico-sm') + ' Coba lagi</button></div></div></div>';
        geo.querySelector('[data-retry]').onclick = startGps;
        refresh();
      };
      let watchId = null;
      function startGps() {
        if (!navigator.geolocation) return onErr({ code: 2 });
        if (watchId !== null) navigator.geolocation.clearWatch(watchId);
        watchId = navigator.geolocation.watchPosition(onPos, onErr, { enableHighAccuracy: true, maximumAge: 5000, timeout: 25000 });
      }
      startGps();
      App.onLeave(() => { if (watchId !== null) navigator.geolocation.clearWatch(watchId); });

      // ---- Tombol konfirmasi
      const btn = el.querySelector('[data-submit]'), hint = el.querySelector('[data-hint]');
      function refresh() {
        let msg = '', ok = false;
        if (!st.foto) msg = 'Langkah 1: ambil selfie dengan kamera depan.';
        else if (!st.fotoOk) msg = 'Periksa foto, lalu tekan "Gunakan Foto".';
        else if (!st.pos) msg = 'Menunggu lokasi GPS…';
        else if (!wfh && !st.near) msg = 'Lokasi kantor belum diatur HRD.';
        else if (!wfh && !st.inRadius) msg = 'Anda berada di luar radius kantor. Mendekatlah ke area kantor.';
        else { ok = true; msg = 'Pastikan wajah terlihat jelas dan lokasi sudah sesuai.'; }
        btn.disabled = !ok || st.sending; hint.textContent = msg;
      }
      btn.onclick = async () => {
        if (btn.disabled) return;
        st.sending = true; busy(btn, true, 'Mengirim absen…');
        try {
          const r = await API.call('submitAbsen', { tipe: tipe, lat: st.pos.lat, lng: st.pos.lng, akurasi: st.pos.acc, foto: st.foto }, { full: true });
          toast(r.message, r.data && r.data.status === 'Terlambat' && tipe === 'masuk' ? 'warning' : 'success');
          API.patch('getAbsenToday', {}, x => { x.absen = r.data; return x; });
          API.patch('dashKaryawan', {}, x => { x.absen_hari_ini = r.data; return x; });
          App.route();
        } catch (e) { toast(e.message, 'error'); st.sending = false; busy(btn, false); refresh(); }
      };
      refresh();
    }
  });

  // ============================================================
  // IZIN, CUTI & LEMBUR
  // ============================================================
  function workdaysClient(a, b) {
    const x = UI.pd(a), y = UI.pd(b); if (!x || !y || y < x) return 0;
    let n = 0; for (let d = new Date(x); d <= y; d.setDate(d.getDate() + 1)) { const w = d.getDay(); if (w !== 0 && w !== 6) n++; }
    return n;
  }

  Pages.register('izin', {
    title: 'Izin, Cuti & Lembur', roles: 'ALL',
    async render(el, q, alive) {
      const d = await API.call('myIzin');
      if (!alive()) return;
      const pending = d.list.filter(i => i.status === 'Menunggu').length;
      const today = UI.isoDate();
      el.innerHTML = PageKit.head('Izin, Cuti & Lembur', 'Ajukan izin, sakit, cuti, dinas luar, atau lembur dan pantau status persetujuannya.') +
        '<div class="stack"><div class="grid g-3">' +
        '<div class="card stat" style="min-height:0"><div class="stat-top"><span class="stat-label">Sisa Cuti Tahunan</span><span class="stat-ico">' + icon('calcheck') + '</span></div><div class="stat-value">' + d.cuti.sisa + ' <small>dari ' + d.cuti.kuota + ' hari</small></div><div class="progress"><span style="width:' + (d.cuti.kuota ? d.cuti.sisa / d.cuti.kuota * 100 : 0) + '%"></span></div></div>' +
        '<div class="card stat" style="min-height:0"><div class="stat-top"><span class="stat-label">Cuti Terpakai</span><span class="stat-ico cyan">' + icon('calendar') + '</span></div><div class="stat-value">' + d.cuti.terpakai + ' <small>hari</small></div><div class="muted small">Termasuk yang masih menunggu persetujuan</div></div>' +
        '<div class="card stat" style="min-height:0"><div class="stat-top"><span class="stat-label">Menunggu Persetujuan</span><span class="stat-ico amber">' + icon('clock') + '</span></div><div class="stat-value">' + pending + ' <small>pengajuan</small></div><div class="muted small">Anda akan mendapat notifikasi saat diproses</div></div>' +
        '</div><div class="grid g-main-r" style="grid-template-columns:minmax(0,1fr) minmax(0,1.3fr)">' +
        '<form class="card" data-form novalidate><div class="card-head"><h3>Form Pengajuan</h3></div><div class="form-grid">' +
        '<div class="field full"><label>Jenis Pengajuan</label><select class="select" name="jenis">' + UI.options(JENIS) + '</select></div>' +
        '<div class="field" data-f="mulai"><label data-lbl-mulai>Tanggal Mulai</label><input class="input" type="date" name="tanggal_mulai" value="' + today + '" required></div>' +
        '<div class="field" data-f="selesai"><label>Tanggal Selesai</label><input class="input" type="date" name="tanggal_selesai" value="' + today + '"></div>' +
        '<div class="field hidden" data-f="jam"><label>Jumlah Jam Lembur</label><input class="input" type="number" min="1" max="12" step="0.5" name="jam_lembur" value="2"></div>' +
        '<div class="field full"><div class="alert" style="padding:10px 12px" data-durasi></div></div>' +
        '<div class="field full"><label>Alasan / Keterangan</label><textarea class="textarea" name="alasan" placeholder="Jelaskan alasan pengajuan Anda" required></textarea></div>' +
        '<div class="field full"><label>Dokumen Pendukung <span class="muted" data-wajib>(opsional)</span></label><input class="input" type="file" accept="image/*,application/pdf" data-file style="padding:8px">' +
        '<span class="hint">JPG, PNG, atau PDF — maks 8 MB. Contoh: surat keterangan dokter.</span></div>' +
        '</div><div class="form-actions mt"><button class="btn lg" type="submit">' + icon('send') + ' Kirim Pengajuan</button></div></form>' +
        '<div class="card"><div class="card-head"><h3>Riwayat Pengajuan</h3></div><div data-list></div></div>' +
        '</div></div>';

      const form = el.querySelector('[data-form]');
      const upd = () => {
        const j = form.jenis.value, lembur = j === 'Lembur';
        form.querySelector('[data-f=selesai]').classList.toggle('hidden', lembur);
        form.querySelector('[data-f=jam]').classList.toggle('hidden', !lembur);
        form.querySelector('[data-lbl-mulai]').textContent = lembur ? 'Tanggal Lembur' : 'Tanggal Mulai';
        form.querySelector('[data-wajib]').textContent = j === 'Sakit' ? '(wajib — surat dokter)' : '(opsional)';
        form.querySelector('[data-wajib]').style.color = j === 'Sakit' ? 'var(--danger)' : '';
        if (form.tanggal_selesai.value < form.tanggal_mulai.value) form.tanggal_selesai.value = form.tanggal_mulai.value;
        const dur = lembur ? (form.jam_lembur.value || 0) + ' jam lembur' : workdaysClient(form.tanggal_mulai.value, form.tanggal_selesai.value) + ' hari kerja';
        form.querySelector('[data-durasi]').innerHTML = icon('info', 'ico-sm') + '<span>Durasi: <b>' + esc(dur) + '</b>' + (j === 'Cuti Tahunan' ? ' · sisa cuti ' + d.cuti.sisa + ' hari' : '') + '</span>';
      };
      form.addEventListener('change', upd); form.addEventListener('input', upd); upd();
      form.onsubmit = async e => {
        e.preventDefault();
        const data = UI.formData(form);
        if (data.alasan.length < 5) return toast('Alasan minimal 5 karakter.', 'warning');
        const btn = form.querySelector('[type=submit]');
        busy(btn, true, 'Mengirim…');
        try {
          const f = form.querySelector('[data-file]').files[0];
          if (f) { data.lampiran = await UI.fileToDataUrl(f, 1600, 0.85); data.lampiran_nama = f.name; }
          const r = await API.call('submitIzin', data, { full: true });
          toast(r.message); App.route();
        } catch (err) { toast(err.message, 'error'); busy(btn, false); }
      };

      const list = el.querySelector('[data-list]');
      list.innerHTML = d.list.length ? '<div class="table-wrap"><table class="table"><thead><tr><th>Jenis</th><th>Tanggal</th><th>Durasi</th><th>Status</th><th class="right">Aksi</th></tr></thead><tbody>' +
        d.list.map(i => '<tr><td>' + badge(i.jenis) + '<div class="xs muted mt-sm clamp2" style="max-width:220px">' + esc(i.alasan) + '</div></td><td class="nowrap">' + esc(fmt.rentang(i.tanggal_mulai, i.tanggal_selesai)) + '</td><td class="nowrap">' + i.durasi + ' ' + esc(i.satuan) + '</td>' +
          '<td>' + badge(i.status) + (i.catatan_approver ? '<div class="xs muted mt-sm">“' + esc(i.catatan_approver) + '” — ' + esc(i.approver) + '</div>' : (i.approver ? '<div class="xs muted mt-sm">oleh ' + esc(i.approver) + '</div>' : '')) + '</td>' +
          '<td><div class="actions">' + (i.ada_lampiran ? '<button class="icon-btn" data-lamp="' + esc(i.id) + '" title="Lihat lampiran">' + icon('file', 'ico-sm') + '</button>' : '') +
          (i.status === 'Menunggu' ? '<button class="icon-btn no" data-cancel="' + esc(i.id) + '" title="Batalkan">' + icon('x', 'ico-sm') + '</button>' : '') + '</div></td></tr>').join('') +
        '</tbody></table></div>' : empty('calendar', 'Belum ada pengajuan.');
      list.addEventListener('click', async e => {
        const l = e.target.closest('[data-lamp]'), c = e.target.closest('[data-cancel]');
        if (l) { busy(l, true); try { UI.viewFile(await API.call('getLampiran', { id: l.dataset.lamp }), 'Lampiran'); } catch (err) { toast(err.message, 'error'); } busy(l, false); }
        if (c && await UI.confirm('Batalkan pengajuan ini?', { danger: true, ok: 'Batalkan' })) {
          // Optimistic UI: status berubah seketika, server menyusul
          const tr = c.closest('tr'); const cell = tr && tr.children[3];
          if (cell) cell.innerHTML = badge('Dibatalkan'); c.remove();
          toast('Pengajuan dibatalkan.');
          API.call('cancelIzin', { id: c.dataset.cancel }).catch(err => { toast(err.message, 'error'); App.route(); });
        }
      });
    }
  });

  // ============================================================
  // KPI SAYA
  // ============================================================
  Pages.register('kpi', {
    autoRefresh: true,
    title: 'KPI Saya', roles: 'ALL',
    async render(el, q, alive) {
      const periode = q.p || UI.periodeNow();
      const d = await API.call('myKPI', { periode });
      if (!alive()) return;
      const k = d.kpi;
      const warna = k.skor_akhir === null ? 'var(--muted)' : k.skor_akhir >= 90 ? 'var(--success)' : k.skor_akhir >= 75 ? 'var(--interactive)' : k.skor_akhir >= 60 ? 'var(--warning)' : 'var(--danger)';
      const predikat = k.skor_akhir === null ? 'Belum ada data' : k.skor_akhir >= 90 ? 'Sangat Baik' : k.skor_akhir >= 80 ? 'Baik' : k.skor_akhir >= 70 ? 'Cukup' : 'Perlu Perbaikan';
      const mini = (lbl, val, sub, ic, cls) => '<div class="card stat" style="min-height:0"><div class="stat-top"><span class="stat-label">' + lbl + '</span><span class="stat-ico ' + (cls || '') + '">' + icon(ic) + '</span></div><div class="stat-value" style="font-size:28px">' + val + '</div><div class="muted small">' + sub + '</div></div>';
      el.innerHTML = PageKit.head('KPI Saya', 'Skor dihitung otomatis dari ketepatan waktu absen dan jumlah izin setiap bulan.', '<input type="month" class="input" style="width:auto" data-p value="' + esc(periode) + '">') +
        '<div class="stack"><div class="grid g-main-r" style="grid-template-columns:minmax(0,1fr) minmax(0,2fr)">' +
        '<div class="card" style="text-align:center"><div class="card-head" style="justify-content:center"><h3>Skor Akhir · ' + esc(fmt.periode(periode)) + '</h3></div>' + UI.ring(k.skor_akhir, 'dari 100', warna) +
        '<div class="mt"><span class="badge" style="background:' + warna + ';color:#fff">' + esc(predikat) + '</span></div>' +
        '<dl class="kv mt" style="text-align:left"><dt>Skor disiplin</dt><dd>' + fmt.num(k.skor_disiplin) + '</dd><dt>Nilai kinerja (HRD)</dt><dd>' + fmt.num(k.nilai_kinerja) + '</dd></dl>' +
        (k.catatan ? '<div class="alert mt" style="text-align:left">' + icon('message') + '<div><b>Catatan HRD</b><div>' + esc(k.catatan) + '</div></div></div>' : '') + '</div>' +
        '<div class="grid g-3" style="align-content:start">' +
        mini('Kehadiran', fmt.num(k.pct_hadir) + '%', k.hadir + ' dari ' + k.hari_kerja + ' hari kerja', 'usercheck', 'green') +
        mini('Tepat Waktu', fmt.num(k.pct_tepat) + '%', k.tepat_waktu + ' kali tepat waktu', 'clock') +
        mini('Terlambat', k.terlambat, 'kali bulan ini', 'alert', 'amber') +
        mini('Izin / Cuti', k.izin, 'hari disetujui', 'calendar', 'cyan') +
        mini('Tanpa Keterangan', k.alpha, 'hari kerja', 'xc', 'red') +
        mini('Pengajuan', k.jumlah_pengajuan, 'izin/cuti disetujui', 'file') +
        '</div></div>' +
        '<div class="grid g-main"><div class="card"><div class="card-head"><div><h3>Tren Skor 6 Bulan</h3><div class="sub">Perkembangan skor KPI akhir Anda</div></div></div><div class="chart-box"><canvas data-tren></canvas></div></div>' +
        '<div class="card"><div class="card-head"><h3>Cara Penilaian</h3></div><ul style="margin:0;padding-left:18px;display:grid;gap:8px" class="small">' +
        '<li><b>Skor disiplin</b> = 50% persentase tepat waktu + 50% kehadiran efektif (hadir + izin disetujui).</li>' +
        '<li>Pengurangan 2 poin untuk setiap hari izin di atas 2 hari per bulan.</li>' +
        '<li><b>Skor akhir</b> = 60% skor disiplin + 40% nilai kinerja dari HRD (jika sudah diisi).</li>' +
        '<li>Hari ini baru dihitung setelah Anda absen.</li></ul></div></div></div>';
      el.querySelector('[data-p]').onchange = e => App.go('#/app/kpi?p=' + e.target.value);
      const labels = d.tren.map(t => fmt.bln[+t.periode.slice(5) - 1] + ' ' + t.periode.slice(2, 4));
      UI.chart(el.querySelector('[data-tren]'), {
        type: 'line',
        data: { labels, datasets: [{ label: 'Skor KPI', data: d.tren.map(t => t.skor), borderColor: UI.cssVar('--interactive'), backgroundColor: 'transparent', tension: .35, pointRadius: 5, pointBackgroundColor: UI.cssVar('--interactive'), spanGaps: true }] },
        options: { maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { min: 0, max: 100, grid: { color: UI.cssVar('--border') } }, x: { grid: { display: false } } } }
      });
    }
  });

  // ============================================================
  // SLIP GAJI SAYA
  // ============================================================
  async function previewSlip(id, title) {
    const m = UI.modal({ title: title || 'Pratinjau Slip Gaji', size: 'lg', body: loading('Menyiapkan pratinjau…'),
      foot: '<button class="btn ghost" data-close>Tutup</button><button class="btn" data-dl disabled>' + icon('download', 'ico-sm') + ' Unduh PDF</button>' });
    try {
      const p = await API.call('previewSlip', { id });
      const body = m.$('.modal-body');
      body.innerHTML = '<iframe class="doc-frame" sandbox title="Slip gaji"></iframe>';
      body.querySelector('iframe').srcdoc = p.html;
      const dl = m.$('[data-dl]'); dl.disabled = false;
      dl.onclick = async () => {
        busy(dl, true, 'Membuat PDF…');
        try { const f = await API.call('downloadSlip', { id }); UI.downloadB64(f.base64, f.mime, f.nama); toast('Slip gaji diunduh.'); } catch (e) { toast(e.message, 'error'); }
        busy(dl, false);
      };
    } catch (e) { m.$('.modal-body').innerHTML = empty('alert', e.message); }
  }
  window.PageKit.previewSlip = previewSlip;

  Pages.register('slip', {
    autoRefresh: true,
    title: 'Slip Gaji', roles: 'ALL',
    async render(el, q, alive) {
      const list = await API.call('mySlip');
      if (!alive()) return;
      el.innerHTML = PageKit.head('Slip Gaji Saya', 'Hanya slip gaji milik Anda yang ditampilkan. Data bersifat rahasia.') +
        (list.length ? '<div class="grid g-3">' + list.map(g => '<div class="card"><div class="row between"><span class="badge blue">' + esc(fmt.periode(g.periode)) + '</span><span class="stat-ico" style="width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:var(--info-soft);color:var(--interactive)">' + icon('wallet') + '</span></div>' +
          '<div class="muted small mt">Gaji bersih (take home pay)</div><div style="font-size:26px;font-weight:700;letter-spacing:-.02em" class="tabular">' + esc(fmt.rp(g.gaji_bersih)) + '</div>' +
          '<dl class="kv mt small"><dt>Pendapatan</dt><dd>' + esc(fmt.rp(g.total_pendapatan)) + '</dd><dt>Potongan</dt><dd style="color:var(--danger)">' + esc(fmt.rp(g.total_potongan)) + '</dd></dl>' +
          '<div class="grid g-2 mt" style="gap:8px"><button class="btn ghost" data-view="' + esc(g.id) + '">' + icon('eye', 'ico-sm') + ' Lihat</button><button class="btn" data-dl="' + esc(g.id) + '">' + icon('download', 'ico-sm') + ' PDF</button></div></div>').join('') + '</div>'
          : '<div class="card">' + empty('wallet', 'Belum ada slip gaji yang diterbitkan untuk Anda.') + '</div>');
      el.addEventListener('click', async e => {
        const v = e.target.closest('[data-view]'), dl = e.target.closest('[data-dl]');
        if (v) previewSlip(v.dataset.view);
        if (dl) { busy(dl, true); try { const f = await API.call('downloadSlip', { id: dl.dataset.dl }); UI.downloadB64(f.base64, f.mime, f.nama); } catch (err) { toast(err.message, 'error'); } busy(dl, false); }
      });
    }
  });

  // ============================================================
  // SURAT PERINGATAN SAYA
  // ============================================================
  Pages.register('sp-saya', {
    autoRefresh: true,
    title: 'Surat Peringatan', roles: 'ALL',
    async render(el, q, alive) {
      const list = await API.call('mySP');
      if (!alive()) return;
      el.innerHTML = PageKit.head('Surat Peringatan Saya', 'Surat peringatan resmi yang diterbitkan HRD untuk Anda.') +
        '<div class="card">' + (list.length ? '<div class="table-wrap"><table class="table"><thead><tr><th>Jenis</th><th>Nomor Surat</th><th>Tanggal</th><th>Berlaku s/d</th><th>Status</th><th class="right">Surat</th></tr></thead><tbody>' +
          list.map(s => '<tr><td>' + badge(s.jenis) + '</td><td class="nowrap">' + esc(s.nomor_surat) + '<div class="xs muted clamp2" style="max-width:320px">' + esc(s.alasan) + '</div></td><td class="nowrap">' + esc(fmt.tgl(s.tanggal)) + '</td><td class="nowrap">' + esc(fmt.tgl(s.berlaku_sampai)) + '</td>' +
            '<td>' + (s.aktif ? badge('Aktif', 'red') : badge('Kedaluwarsa', '')) + '</td><td class="right"><button class="btn sm" data-sp="' + esc(s.id) + '">' + icon('file', 'ico-sm') + ' Buka</button></td></tr>').join('') +
          '</tbody></table></div>' : empty('checkc', 'Anda tidak memiliki surat peringatan. Pertahankan!')) + '</div>';
      el.addEventListener('click', async e => {
        const b = e.target.closest('[data-sp]'); if (!b) return;
        busy(b, true);
        try { const f = await API.call('downloadSP', { id: b.dataset.sp }); UI.viewFile(f, 'Surat Peringatan'); App.refreshCounts(); } catch (err) { toast(err.message, 'error'); }
        busy(b, false);
      });
    }
  });

  // ============================================================
  // CHAT (karyawan: 1 percakapan dengan HRD · HR: kotak masuk)
  // ============================================================
  function renderMsgs(box, msgs, meSide) {
    let lastDay = '';
    box.innerHTML = msgs.length ? msgs.map(m => {
      const day = String(m.timestamp).slice(0, 10);
      const sep = day !== lastDay ? '<div class="chat-day">' + esc(fmt.tglHari(day)) + '</div>' : '';
      lastDay = day;
      const me = m.dari === meSide;
      return sep + '<div class="bubble ' + (me ? 'me' : 'them') + '">' + (!me && meSide === 'KARYAWAN' ? '<div class="xs bold" style="color:var(--interactive)">' + esc(m.pengirim) + '</div>' : '') + esc(m.pesan) +
        '<div class="meta">' + (m.pending ? '⏳ ' : '') + esc(String(m.timestamp).slice(11, 16)) + (me && meSide === 'HRD' ? ' · ' + esc(m.pengirim) : '') + '</div></div>';
    }).join('') : '<div class="empty" style="margin:auto">' + icon('message') + '<div>Belum ada pesan. Mulai percakapan!</div></div>';
    box.scrollTop = box.scrollHeight;
  }

  function chatPane(container, opt) {
    // opt: { karyawan_id?, side: 'KARYAWAN'|'HRD', title, sub, onBack }
    container.innerHTML = '<div class="chat-head">' + (opt.onBack ? '<button class="icon-btn" data-back aria-label="Kembali">' + icon('chevl', 'ico-sm') + '</button>' : '') +
      '<span class="avatar">' + (opt.side === 'KARYAWAN' ? icon('users', 'ico-sm') : esc(initials(opt.title))) + '</span><div style="min-width:0"><b>' + esc(opt.title) + '</b><div class="xs muted">' + esc(opt.sub || '') + '</div></div></div>' +
      '<div class="chat-msgs">' + loading() + '</div>' +
      '<form class="chat-input"><textarea class="textarea" rows="1" placeholder="Tulis pesan…" aria-label="Pesan"></textarea><button class="btn" type="submit" aria-label="Kirim">' + icon('send') + '</button></form>';
    const box = container.querySelector('.chat-msgs'), form = container.querySelector('form'), ta = form.querySelector('textarea');
    if (opt.onBack) container.querySelector('[data-back]').onclick = opt.onBack;
    let sig = '', stopped = false, first = true, msgs = [];
    const load = async () => {
      try {
        const d = await API.call('chatMessages', opt.karyawan_id ? { karyawan_id: opt.karyawan_id } : {}, { fresh: !first });
        first = false;
        if (stopped) return;
        msgs = d.pesan;
        const s = d.pesan.length + ':' + (d.pesan.length ? d.pesan[d.pesan.length - 1].id : '');
        if (s !== sig) { sig = s; renderMsgs(box, d.pesan, opt.side); }
      } catch (e) { if (!sig) box.innerHTML = empty('alert', e.message); }
    };
    load();
    const t = setInterval(() => { if (document.visibilityState === 'visible') load(); }, window.APP_CONFIG.CHAT_POLL_MS || 6000);
    const stop = () => { stopped = true; clearInterval(t); };
    App.onLeave(stop);
    ta.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && window.innerWidth > 768) { e.preventDefault(); form.requestSubmit(); } });
    form.onsubmit = async e => {
      e.preventDefault();
      const pesan = ta.value.trim(); if (!pesan) return;
      // Optimistic UI: gelembung pesan langsung muncul, dikirim di latar belakang
      ta.value = ''; ta.focus();
      const now = new Date(), pad = n => String(n).padStart(2, '0');
      const ts = UI.isoDate(now) + ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
      const temp = { id: 'tmp' + Date.now(), dari: opt.side, pengirim: App.state.user.nama, pesan: pesan, timestamp: ts, pending: true };
      msgs = msgs.concat([temp]);
      renderMsgs(box, msgs, opt.side);
      try {
        await API.call('sendChat', Object.assign({ pesan }, opt.karyawan_id ? { karyawan_id: opt.karyawan_id } : {}));
        sig = ''; load(); if (opt.onSent) opt.onSent();
      } catch (err) {
        toast('Pesan gagal terkirim: ' + err.message, 'error');
        msgs = msgs.filter(m => m !== temp); renderMsgs(box, msgs, opt.side); ta.value = pesan;
      }
    };
    return { stop, reload: load };
  }

  Pages.register('chat', {
    title: 'Chat', roles: 'ALL',
    async render(el, q, alive) {
      if (!App.isHR()) {
        el.innerHTML = PageKit.head('Chat dengan HRD', 'Tanyakan seputar administrasi, BPJS, gaji, atau kebijakan perusahaan.') + '<div class="card flush"><div class="chat single"><div class="chat-pane" data-pane></div></div></div>';
        chatPane(el.querySelector('[data-pane]'), { side: 'KARYAWAN', title: 'Tim HRD', sub: 'Biasanya membalas pada jam kerja', onSent: App.refreshCounts });
        setTimeout(App.refreshCounts, 1500);
        return;
      }
      // ---- HR: kotak masuk
      const data = await API.call('chatThreads');
      if (!alive()) return;
      el.innerHTML = PageKit.head('Chat Karyawan', 'Percakapan dua arah dengan seluruh karyawan.', '<button class="btn" data-new>' + icon('plus', 'ico-sm') + ' Percakapan Baru</button>') +
        '<div class="card flush"><div class="chat" data-chat><div class="chat-list" data-list></div><div class="chat-pane" data-pane><div class="empty" style="margin:auto">' + icon('message') + '<div>Pilih percakapan di sebelah kiri.</div></div></div></div></div>';
      const chat = el.querySelector('[data-chat]'), list = el.querySelector('[data-list]'), pane = el.querySelector('[data-pane]');
      let active = q.k || null, cur = null;
      const drawList = () => {
        list.innerHTML = data.threads.length ? data.threads.map(t => '<div class="chat-thread' + (t.karyawan_id === active ? ' active' : '') + '" data-k="' + esc(t.karyawan_id) + '"><span class="avatar">' + esc(initials(t.nama)) + '</span>' +
          '<div style="min-width:0;flex:1"><div class="row between"><b class="clamp2">' + esc(t.nama) + '</b><span class="xs muted nowrap">' + esc(fmt.ago(t.waktu)) + '</span></div><div class="row between"><div class="last">' + esc(t.terakhir) + '</div>' +
          (t.belum_dibaca ? '<span class="pill-count">' + t.belum_dibaca + '</span>' : '') + '</div></div></div>').join('') : empty('message', 'Belum ada percakapan.');
      };
      const open = (kid) => {
        active = kid;
        if (cur) cur.stop();
        const t = data.threads.find(x => x.karyawan_id === kid) || data.kontak.find(x => x.karyawan_id === kid) || { nama: kid };
        const th = data.threads.find(x => x.karyawan_id === kid); if (th) th.belum_dibaca = 0;
        drawList();
        chat.classList.add('show-pane');
        cur = chatPane(pane, { karyawan_id: kid, side: 'HRD', title: t.nama, sub: t.jabatan || '', onBack: () => chat.classList.remove('show-pane'), onSent: refreshThreads });
        setTimeout(App.refreshCounts, 1200);
      };
      const refreshThreads = async () => {
        try { const d = await API.call('chatThreads'); data.threads = d.threads; data.kontak = d.kontak; drawList(); } catch (e) { }
      };
      list.addEventListener('click', e => { const t = e.target.closest('[data-k]'); if (t) open(t.dataset.k); });
      el.querySelector('[data-new]').onclick = () => {
        const m = UI.modal({ title: 'Percakapan Baru', size: 'sm', body: '<div class="field"><label>Pilih karyawan</label><select class="select" data-sel>' + UI.options(data.kontak.map(k => ({ v: k.karyawan_id, l: k.nama + (k.jabatan ? ' — ' + k.jabatan : '') }))) + '</select></div>',
          foot: '<button class="btn ghost" data-close>Batal</button><button class="btn" data-ok>Mulai</button>' });
        m.$('[data-ok]').onclick = () => { const v = m.$('[data-sel]').value; m.close(); if (v) open(v); };
      };
      drawList();
      if (active) open(active);
      const ti = setInterval(() => { if (document.visibilityState === 'visible') refreshThreads(); }, 20000);
      App.onLeave(() => clearInterval(ti));
    }
  });

  // ============================================================
  // PROFIL
  // ============================================================
  Pages.register('profil', {
    title: 'Profil', roles: 'ALL',
    async render(el) {
      const u = App.state.user;
      el.innerHTML = PageKit.head('Profil Saya', 'Informasi akun dan keamanan.') +
        '<div class="grid g-2"><div class="card"><div class="row"><span class="avatar lg">' + esc(initials(u.nama)) + '</span><div><h3>' + esc(u.nama) + '</h3><div class="muted">' + esc(u.jabatan || '-') + '</div></div></div>' +
        '<dl class="kv mt"><dt>Username</dt><dd>@' + esc(u.username) + '</dd><dt>Email</dt><dd>' + esc(u.email || '-') + '</dd><dt>Role</dt><dd>' + badge(u.role) + '</dd><dt>Departemen</dt><dd>' + esc(u.departemen || '-') + '</dd><dt>Mode kerja</dt><dd>' + badge(u.mode_kerja) + '</dd></dl>' +
        '<button class="btn ghost block mt" data-logout style="color:var(--danger)">' + icon('logout', 'ico-sm') + ' Keluar dari aplikasi</button></div>' +
        '<form class="card" data-pw><div class="card-head"><div class="card-title-ico">' + icon('key', 'ico-lg') + '<h3>Ubah Kata Sandi</h3></div></div>' +
        '<div class="stack" style="gap:14px"><div class="field"><label>Kata sandi lama</label><input class="input" type="password" name="lama" autocomplete="current-password" required></div>' +
        '<div class="field"><label>Kata sandi baru</label><input class="input" type="password" name="baru" autocomplete="new-password" minlength="8" required><span class="hint">Minimal 8 karakter. Gunakan kombinasi huruf, angka, dan simbol.</span></div>' +
        '<div class="field"><label>Ulangi kata sandi baru</label><input class="input" type="password" name="ulang" autocomplete="new-password" required></div>' +
        '<button class="btn" type="submit">' + icon('save', 'ico-sm') + ' Simpan Kata Sandi</button></div></form></div>';
      el.querySelector('[data-logout]').onclick = App.logout;
      const f = el.querySelector('[data-pw]');
      f.onsubmit = async e => {
        e.preventDefault();
        const d = UI.formData(f);
        if (d.baru.length < 8) return toast('Kata sandi baru minimal 8 karakter.', 'warning');
        if (d.baru !== d.ulang) return toast('Ulangan kata sandi tidak sama.', 'warning');
        const b = f.querySelector('[type=submit]'); busy(b, true);
        try { const r = await API.call('changePassword', d, { full: true }); toast(r.message); f.reset(); } catch (err) { toast(err.message, 'error'); }
        busy(b, false);
      };
    }
  });
})();
