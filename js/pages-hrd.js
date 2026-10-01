/* ============================================================
   HALAMAN HR MANAGEMENT (Admin HRD, HRD, Superadmin)
   dashboard HR · superadmin · persetujuan · rekap-absensi · karyawan
   kpi-karyawan · gaji · bpjs · sp · berita · laporan
   ============================================================ */
(function () {
  const { icon, esc, fmt, initials, badge, toast, busy, empty, loading } = UI;
  const head = (...a) => PageKit.head(...a);
  const person = (nama, sub) => '<div class="person"><span class="avatar">' + esc(initials(nama)) + '</span><div style="min-width:0"><div class="nm">' + esc(nama) + '</div>' + (sub ? '<div class="jb">' + esc(sub) + '</div>' : '') + '</div></div>';
  let karyawanCache = null;
  async function daftarKaryawan(force) {
    if (!karyawanCache || force) karyawanCache = await API.call('listKaryawan');
    return karyawanCache;
  }
  const optKaryawan = (list, sel, all) => (all ? '<option value="">' + esc(all) + '</option>' : '') +
    list.filter(k => k.status !== 'Nonaktif').map(k => '<option value="' + esc(k.id) + '"' + (k.id === sel ? ' selected' : '') + '>' + esc(k.nama) + (k.jabatan ? ' — ' + esc(k.jabatan) : '') + '</option>').join('');

  // ---- Dialog persetujuan izin (dipakai dashboard & halaman persetujuan)
  function approveDialog(i, keputusan, done) {
    const setuju = keputusan === 'Disetujui';
    const m = UI.modal({
      title: (setuju ? 'Setujui ' : 'Tolak ') + 'Pengajuan', size: 'sm',
      body: '<div class="geo-box mb">' + person(i.nama, i.jabatan) + '<dl class="kv mt small"><dt>Jenis</dt><dd>' + esc(i.jenis) + '</dd><dt>Tanggal</dt><dd>' + esc(fmt.rentang(i.tanggal_mulai, i.tanggal_selesai)) + '</dd><dt>Durasi</dt><dd>' + i.durasi + ' ' + esc(i.satuan) + '</dd></dl>' +
        '<p class="small mt-sm muted">“' + esc(i.alasan) + '”</p></div>' +
        '<div class="field"><label>Catatan untuk karyawan ' + (setuju ? '(opsional)' : '(disarankan)') + '</label><textarea class="textarea" data-cat placeholder="' + (setuju ? 'Contoh: Disetujui, semoga lekas sembuh.' : 'Contoh: Mohon ajukan ulang dengan dokumen pendukung.') + '"></textarea></div>',
      foot: '<button class="btn ghost" data-close>Batal</button><button class="btn ' + (setuju ? 'success' : 'danger') + '" data-ok>' + icon(setuju ? 'check' : 'x', 'ico-sm') + ' ' + (setuju ? 'Setujui' : 'Tolak') + '</button>'
    });
    m.$('[data-ok]').onclick = async () => {
      const b = m.$('[data-ok]'); busy(b, true);
      try {
        const r = await API.call('approveIzin', { id: i.id, keputusan, catatan: m.$('[data-cat]').value }, { full: true });
        toast(r.message); m.close(); App.refreshCounts(); done && done();
      } catch (e) { toast(e.message, 'error'); busy(b, false); }
    };
  }

  // ============================================================
  // DASHBOARD HR
  // ============================================================
  async function dashboard(el, alive, embedded) {
    const d = await API.call('dashHRD');
    if (!alive()) return;
    const k = d.komposisi;
    const sel = d.sp_selisih;
    const kal = {};
    Object.keys(d.kalender).forEach(t => kal[t] = d.kalender[t] > 1 ? 'leave' : 'leave2');
    const html = (embedded ? '' : head('Dashboard HR', 'Ringkasan kehadiran seluruh karyawan dan pengajuan yang perlu ditindaklanjuti.', '<div class="row wrap">' + PageKit.dateChip() + '<a class="btn" href="#/app/absensi">' + icon('finger', 'ico-sm') + ' Absen Saya</a></div>')) +
      '<div class="stack">' +
      '<div class="grid g-4 keep2">' +
      '<div class="card stat dark"><div class="stat-top"><span class="stat-label">Total Karyawan</span><span class="stat-ico">' + icon('users') + '</span></div><div class="stat-value">' + fmt.num(d.total_karyawan, 0) + '</div>' +
      '<div class="stat-foot" style="color:#6EE7B7">' + icon('trend', 'ico-sm') + (d.karyawan_baru > 0 ? '+' + d.karyawan_baru + ' karyawan baru bulan ini' : 'Karyawan aktif') + '</div></div>' +
      '<div class="card stat"><div class="stat-top"><span class="stat-label">Hadir Hari Ini</span><span class="stat-ico green">' + icon('usercheck') + '</span></div><div class="stat-value">' + fmt.num(d.hadir_hari_ini, 0) + '</div>' +
      '<div class="stat-foot up">' + icon('checkc', 'ico-sm') + fmt.num(d.pct_hadir) + '% tingkat kehadiran' + (d.terlambat_hari_ini ? ' · <span class="warn">' + d.terlambat_hari_ini + ' terlambat</span>' : '') + '</div></div>' +
      '<a class="card stat" href="#/app/persetujuan" style="color:inherit;text-decoration:none"><div class="stat-top"><span class="stat-label">Pengajuan Pending</span><span class="stat-ico amber">' + icon('calcheck') + '</span></div><div class="stat-value">' + d.pending + '</div>' +
      '<div class="stat-foot ' + (d.pending ? 'warn' : 'up') + '">' + icon(d.pending ? 'clock' : 'checkc', 'ico-sm') + (d.pending ? 'Perlu tindakan segera' : 'Semua pengajuan sudah diproses') + '</div></a>' +
      '<a class="card stat" href="#/app/sp" style="color:inherit;text-decoration:none"><div class="stat-top"><span class="stat-label">SP Bulan Ini</span><span class="stat-ico red">' + icon('alert') + '</span></div><div class="stat-value">' + d.sp_bulan_ini + '</div>' +
      '<div class="stat-foot ' + (sel > 0 ? 'down' : 'up') + '">' + (sel === 0 ? 'Sama dengan bulan lalu' : (sel > 0 ? '▲ +' : '▼ ') + sel + ' dari bulan lalu') + '</div></a>' +
      '</div>' +
      '<div class="grid g-main">' +
      '<div class="card"><div class="card-head"><div><h3>Kehadiran Mingguan</h3><div class="sub">Statistik kehadiran karyawan Senin – Jumat</div></div><span class="badge">Minggu Ini</span></div><div class="chart-box"><canvas data-week></canvas></div></div>' +
      '<div class="card"><div class="card-head"><div><h3>Komposisi Hari Ini</h3><div class="sub">Distribusi status kehadiran</div></div></div><div class="chart-box sm"><canvas data-donut></canvas></div>' +
      '<div class="legend mt" style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' +
      '<span><i style="background:' + colors().navy + '"></i>Hadir (' + k.hadir + ')</span><span><i style="background:' + colors().blue + '"></i>Izin (' + k.izin + ')</span>' +
      '<span><i style="background:' + colors().teal + '"></i>Cuti (' + k.cuti + ')</span><span><i style="background:' + colors().red + '"></i>Belum hadir (' + k.belum + ')</span></div></div>' +
      '</div>' +
      '<div class="grid g-main">' +
      '<div class="card"><div class="card-head"><div><h3>Pengajuan Terbaru</h3><div class="sub">Daftar izin & cuti yang membutuhkan persetujuan</div></div><a href="#/app/persetujuan" class="bold">Lihat Semua</a></div>' +
      (d.pengajuan_terbaru.length ? '<div class="table-wrap"><table class="table"><thead><tr><th>Karyawan</th><th>Tipe</th><th>Tanggal</th><th>Durasi</th><th class="right">Aksi</th></tr></thead><tbody>' +
        d.pengajuan_terbaru.map((i, n) => '<tr><td>' + person(i.nama, i.jabatan) + '</td><td>' + badge(i.jenis) + '</td><td class="nowrap">' + esc(fmt.rentang(i.tanggal_mulai, i.tanggal_selesai)) + '</td><td class="nowrap">' + i.durasi + ' ' + esc(i.satuan) + '</td>' +
          '<td><div class="actions"><button class="icon-btn ok" data-ap="' + n + '" data-k="Disetujui" title="Setujui">' + icon('check', 'ico-sm') + '</button><button class="icon-btn no" data-ap="' + n + '" data-k="Ditolak" title="Tolak">' + icon('x', 'ico-sm') + '</button></div></td></tr>').join('') +
        '</tbody></table></div>' : empty('checkc', 'Tidak ada pengajuan yang menunggu. Kerja bagus!')) + '</div>' +
      '<div class="card"><div class="card-head"><h3>' + esc(fmt.periode(d.tanggal.slice(0, 7))) + '</h3></div>' + UI.calendar(d.tanggal.slice(0, 7), kal) +
      '<div style="border-top:1px solid var(--border);margin-top:16px;padding-top:14px"><b>Jadwal Cuti & Izin Mendatang</b>' +
      (d.cuti_mendatang.length ? d.cuti_mendatang.map(c => '<div class="row between small mt-sm"><span class="muted">' + esc(c.nama) + ' (' + esc(c.jenis) + ')</span><span class="bold" style="color:var(--interactive)">' + esc(fmt.tglPendek(c.tanggal_mulai)) + '</span></div>').join('') : '<div class="muted small mt-sm">Tidak ada jadwal.</div>') +
      '</div></div></div>' +
      '<div class="grid g-main">' +
      '<div class="card"><div class="card-head"><div><h3>KPI Tim Bulan Ini</h3><div class="sub">Rata-rata skor: <b>' + fmt.num(d.rata_kpi) + '</b> · 5 karyawan teratas</div></div><a href="#/app/kpi-karyawan" class="bold">Detail KPI</a></div>' +
      (d.top_kpi.length ? '<div class="chart-box sm"><canvas data-kpi></canvas></div>' : empty('chart', 'Belum ada data KPI bulan ini.')) + '</div>' +
      '<div class="card"><div class="card-head"><h3>Akses Cepat</h3></div><div class="grid g-2" style="gap:10px">' +
      [['sp', 'alert', 'Surat Peringatan'], ['gaji', 'wallet', 'Gaji & Slip'], ['karyawan', 'users', 'Data Karyawan'], ['rekap-absensi', 'list', 'Rekap Absensi'], ['laporan', 'printer', 'Laporan PDF'], ['berita', 'news', 'Berita']]
        .map(x => '<a class="btn ghost" style="height:auto;min-height:56px;justify-content:flex-start;white-space:normal;text-align:left;line-height:1.25;padding:10px 14px" href="#/app/' + x[0] + '">' + icon(x[1]) + esc(x[2]) + '</a>').join('') + '</div></div>' +
      '</div></div>';
    el.innerHTML = embedded ? el.innerHTML + html : html;

    el.querySelectorAll('[data-ap]').forEach(b => b.onclick = () => approveDialog(d.pengajuan_terbaru[+b.dataset.ap], b.dataset.k, () => App.route()));
    const c = colors();
    UI.chart(el.querySelector('[data-week]'), {
      type: 'bar',
      data: {
        labels: d.mingguan.map(w => w.label),
        datasets: [
          { label: 'Hadir', data: d.mingguan.map(w => w.lewat ? w.hadir : null), backgroundColor: c.navy, borderRadius: 8, grouped: false, order: 1, barPercentage: .85 },
          { label: 'Total karyawan', data: d.mingguan.map(w => w.total), backgroundColor: c.track, borderRadius: 8, grouped: false, order: 2, barPercentage: .85 }
        ]
      },
      options: { maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { afterBody: (it) => { const w = d.mingguan[it[0].dataIndex]; return w.lewat ? 'Terlambat: ' + w.terlambat : 'Belum berlangsung'; } } } },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: c.grid } }, x: { grid: { display: false } } } }
    });
    UI.chart(el.querySelector('[data-donut]'), {
      type: 'doughnut',
      data: { labels: ['Hadir', 'Izin', 'Cuti', 'Belum hadir'], datasets: [{ data: [k.hadir, k.izin, k.cuti, k.belum], backgroundColor: [c.navy, c.blue, c.teal, c.red], borderWidth: 0 }] },
      options: { maintainAspectRatio: false, cutout: '76%', plugins: { legend: { display: false } } },
      plugins: [centerText(fmt.num(d.total_karyawan, 0), 'Total')]
    });
    if (d.top_kpi.length) UI.chart(el.querySelector('[data-kpi]'), {
      type: 'bar',
      data: { labels: d.top_kpi.map(x => x.nama), datasets: [{ data: d.top_kpi.map(x => x.skor), backgroundColor: c.blue, borderRadius: 6, barThickness: 18 }] },
      options: { indexAxis: 'y', maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { min: 0, max: 100, grid: { color: c.grid } }, y: { grid: { display: false } } } }
    });
  }

  function colors() {
    const dark = document.documentElement.getAttribute('data-theme') === 'gelap';
    return {
      navy: UI.cssVar('--primary') || '#1E3A8A', blue: UI.cssVar('--interactive') || '#2563EB', teal: dark ? '#14B8A6' : '#0F766E',
      red: dark ? '#F87171' : '#B91C1C', track: dark ? 'rgba(255,255,255,.08)' : '#CBD5E1', grid: UI.cssVar('--border'), accent: UI.cssVar('--accent'), amber: '#F59E0B'
    };
  }
  function centerText(big, small) {
    return { id: 'center', afterDraw(ch) {
      const { ctx, chartArea: a } = ch; const x = (a.left + a.right) / 2, y = (a.top + a.bottom) / 2;
      ctx.save(); ctx.textAlign = 'center'; ctx.fillStyle = UI.cssVar('--text');
      ctx.font = '700 28px ' + UI.cssVar('--font'); ctx.fillText(big, x, y + 4);
      ctx.fillStyle = UI.cssVar('--muted'); ctx.font = '500 13px ' + UI.cssVar('--font'); ctx.fillText(small, x, y + 24); ctx.restore();
    } };
  }

  // ============================================================
  // DASHBOARD SUPERADMIN
  // ============================================================
  async function superadmin(el, alive) {
    const d = await API.call('dashSuperadmin');
    if (!alive()) return;
    const r = d.per_role;
    const box = (role, ic, cls) => { const x = r[role] || { aktif: 0, nonaktif: 0 };
      return '<div class="card stat" style="min-height:0"><div class="stat-top"><span class="stat-label">' + esc(UI.ROLE_LABEL[role]) + '</span><span class="stat-ico ' + cls + '">' + icon(ic) + '</span></div><div class="stat-value">' + x.aktif + ' <small>aktif</small></div><div class="muted small">' + x.nonaktif + ' nonaktif</div></div>'; };
    el.innerHTML = head('Dashboard Superadmin', 'Kontrol akun HRD/Admin HRD serta ringkasan operasional perusahaan.', '<div class="row wrap">' + PageKit.dateChip() + '<a class="btn" href="#/app/akun">' + icon('shield', 'ico-sm') + ' Kelola Akun</a></div>') +
      '<div class="stack"><div class="grid g-4 keep2">' + box('SUPERADMIN', 'shield', '') + box('HRD', 'briefcase', 'cyan') + box('ADMIN_HRD', 'users', 'amber') + box('KARYAWAN', 'user', 'green') + '</div>' +
      '<div class="card"><div class="card-head"><div><h3>Akun HRD & Admin HRD</h3><div class="sub">Nonaktifkan akun staf HRD yang sudah tidak bekerja agar aksesnya langsung dicabut.</div></div><a class="btn ghost sm" href="#/app/akun">Semua akun</a></div>' +
      '<div class="table-wrap"><table class="table"><thead><tr><th>Nama</th><th>Role</th><th>Status</th><th class="hide-m">Login terakhir</th><th class="right">Aksi</th></tr></thead><tbody>' +
      d.staf.map(s => '<tr><td>' + person(s.nama, '@' + s.username) + '</td><td>' + badge(s.role) + '</td><td>' + badge(s.status) + '</td><td class="hide-m small muted">' + esc(s.last_login ? fmt.ago(s.last_login) : 'Belum pernah') + '</td>' +
        '<td class="right">' + (s.id === App.state.user.id ? '<span class="xs muted">Akun Anda</span>' : '<button class="btn sm ' + (s.status === 'Aktif' ? 'ghost' : 'success') + '" data-st="' + esc(s.id) + '" data-to="' + (s.status === 'Aktif' ? 'Nonaktif' : 'Aktif') + '">' + (s.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan') + '</button>') + '</td></tr>').join('') +
      '</tbody></table></div></div>' +
      '<div class="page-head" style="margin:8px 0 0"><div><h1 style="font-size:22px">Ringkasan Operasional HR</h1></div></div><div data-hr></div></div>';
    el.querySelectorAll('[data-st]').forEach(b => b.onclick = async () => {
      const to = b.dataset.to;
      if (!await UI.confirm(to === 'Nonaktif' ? 'Nonaktifkan akun ini? Pengguna akan langsung keluar dan tidak bisa login.' : 'Aktifkan kembali akun ini?', { danger: to === 'Nonaktif', ok: to === 'Nonaktif' ? 'Nonaktifkan' : 'Aktifkan' })) return;
      try { const x = await API.call('setStatusAkun', { id: b.dataset.st, status: to }, { full: true }); toast(x.message); App.route(); } catch (e) { toast(e.message, 'error'); }
    });
    await dashboard(el.querySelector('[data-hr]'), alive, true);
  }

  window.HRView = { dashboard, superadmin, approveDialog, colors, centerText, daftarKaryawan };

  // ============================================================
  // PERSETUJUAN IZIN / CUTI / LEMBUR
  // ============================================================
  Pages.register('persetujuan', {
    title: 'Persetujuan', roles: 'HR',
    async render(el, q, alive) {
      let status = q.s || 'Menunggu', jenis = 'Semua', cari = '';
      el.innerHTML = head('Persetujuan Izin, Cuti & Lembur', 'Setujui atau tolak pengajuan karyawan. Karyawan akan menerima notifikasi otomatis.') +
        '<div class="card"><div class="row between wrap mb"><div class="tabs" data-tabs>' + ['Menunggu', 'Disetujui', 'Ditolak', 'Semua'].map(s => '<button class="tab' + (s === status ? ' active' : '') + '" data-s="' + s + '">' + s + '</button>').join('') + '</div>' +
        '<div class="row wrap"><select class="select" style="width:auto" data-jenis>' + UI.options(['Semua', 'Izin', 'Sakit', 'Cuti Tahunan', 'Cuti Khusus', 'Dinas Luar', 'Lembur']) + '</select>' +
        '<div class="input-group" style="width:220px">' + icon('search', 'lead') + '<input class="input" placeholder="Cari nama…" data-cari></div></div></div><div data-list>' + loading() + '</div></div>';
      const box = el.querySelector('[data-list]');
      let rows = [];
      const draw = () => {
        const f = rows.filter(i => !cari || i.nama.toLowerCase().includes(cari));
        box.innerHTML = f.length ? '<div class="table-wrap"><table class="table"><thead><tr><th>Karyawan</th><th>Jenis</th><th>Tanggal</th><th>Durasi</th><th>Alasan</th><th>Status</th><th class="right">Aksi</th></tr></thead><tbody>' +
          f.map(i => '<tr><td>' + person(i.nama, i.jabatan) + '</td><td>' + badge(i.jenis) + '</td><td class="nowrap">' + esc(fmt.rentang(i.tanggal_mulai, i.tanggal_selesai)) + '<div class="xs muted">diajukan ' + esc(fmt.ago(i.created_at)) + '</div></td><td class="nowrap">' + i.durasi + ' ' + esc(i.satuan) + '</td>' +
            '<td><div class="small clamp2" style="max-width:260px">' + esc(i.alasan) + '</div>' + (i.ada_lampiran ? '<button class="btn sm soft mt-sm" data-lamp="' + esc(i.id) + '">' + icon('file', 'ico-sm') + ' Lampiran</button>' : '') + '</td>' +
            '<td>' + badge(i.status) + (i.approver ? '<div class="xs muted mt-sm">' + esc(i.approver) + (i.catatan_approver ? ': “' + esc(i.catatan_approver) + '”' : '') + '</div>' : '') + '</td>' +
            '<td><div class="actions">' + (i.status === 'Menunggu' ? '<button class="icon-btn ok" data-ap="' + esc(i.id) + '" data-k="Disetujui" title="Setujui">' + icon('check', 'ico-sm') + '</button><button class="icon-btn no" data-ap="' + esc(i.id) + '" data-k="Ditolak" title="Tolak">' + icon('x', 'ico-sm') + '</button>' : '') + '</div></td></tr>').join('') +
          '</tbody></table></div>' : empty('checkc', status === 'Menunggu' ? 'Tidak ada pengajuan yang menunggu.' : 'Tidak ada data.');
      };
      const load = async () => {
        box.innerHTML = loading();
        try { rows = await API.call('listIzin', { status, jenis }); if (alive()) draw(); } catch (e) { box.innerHTML = empty('alert', e.message); }
      };
      el.querySelector('[data-tabs]').onclick = e => { const t = e.target.closest('[data-s]'); if (!t) return; status = t.dataset.s; el.querySelectorAll('[data-s]').forEach(x => x.classList.toggle('active', x === t)); load(); };
      el.querySelector('[data-jenis]').onchange = e => { jenis = e.target.value; load(); };
      el.querySelector('[data-cari]').oninput = UI.debounce(e => { cari = e.target.value.toLowerCase(); draw(); }, 200);
      box.addEventListener('click', async e => {
        const a = e.target.closest('[data-ap]'), l = e.target.closest('[data-lamp]');
        if (a) approveDialog(rows.find(x => x.id === a.dataset.ap), a.dataset.k, load);
        if (l) { busy(l, true); try { UI.viewFile(await API.call('getLampiran', { id: l.dataset.lamp }), 'Lampiran pengajuan'); } catch (err) { toast(err.message, 'error'); } busy(l, false); }
      });
      load();
    }
  });

  // ============================================================
  // REKAP ABSENSI (seluruh karyawan) + lihat foto selfie
  // ============================================================
  Pages.register('rekap-absensi', {
    title: 'Rekap Absensi', roles: 'HR',
    async render(el, q, alive) {
      const list = await daftarKaryawan();
      if (!alive()) return;
      const t = UI.isoDate();
      el.innerHTML = head('Rekap Absensi', 'Pantau absensi seluruh karyawan, tinjau foto selfie dan titik lokasi GPS.') +
        '<div class="card"><form class="row wrap mb" data-f style="align-items:flex-end">' +
        '<div class="field"><label>Dari</label><input class="input" type="date" name="dari" value="' + t + '"></div>' +
        '<div class="field"><label>Sampai</label><input class="input" type="date" name="sampai" value="' + t + '"></div>' +
        '<div class="field" style="min-width:220px"><label>Karyawan</label><select class="select" name="karyawan_id">' + optKaryawan(list, '', 'Semua karyawan') + '</select></div>' +
        '<button class="btn" type="submit">' + icon('search', 'ico-sm') + ' Tampilkan</button></form><div data-sum class="chips mb"></div><div data-list></div></div>';
      const f = el.querySelector('[data-f]'), box = el.querySelector('[data-list]'), sum = el.querySelector('[data-sum]');
      let rows = [];
      const load = async () => {
        box.innerHTML = loading();
        try {
          rows = await API.call('listAbsensi', UI.formData(f));
          if (!alive()) return;
          const tl = rows.filter(r => r.status === 'Terlambat').length;
          sum.innerHTML = '<span class="badge blue">' + rows.length + ' catatan absen</span><span class="badge green">' + (rows.length - tl) + ' tepat waktu</span><span class="badge amber">' + tl + ' terlambat</span><span class="badge cyan">' + rows.filter(r => r.mode === 'WFH').length + ' WFH</span>';
          box.innerHTML = rows.length ? '<div class="table-wrap"><table class="table"><thead><tr><th>Karyawan</th><th>Tanggal</th><th>Masuk</th><th>Pulang</th><th>Status</th><th>Mode</th><th>Lokasi</th><th class="right">Foto & Peta</th></tr></thead><tbody>' +
            rows.map(r => '<tr><td>' + person(r.nama) + '</td><td class="nowrap">' + esc(fmt.tglHari(r.tanggal)) + '</td><td class="bold">' + esc(fmt.jam(r.jam_masuk)) + (r.terlambat_menit > 0 ? '<div class="xs warn">+' + r.terlambat_menit + ' mnt</div>' : '') + '</td><td>' + esc(fmt.jam(r.jam_pulang)) + (r.catatan ? '<div class="xs muted">' + esc(r.catatan) + '</div>' : '') + '</td>' +
              '<td>' + badge(r.status) + '</td><td>' + badge(r.mode) + '</td><td class="small">' + esc(r.lokasi_masuk) + (r.jarak_masuk !== '' ? '<div class="xs muted">' + esc(r.jarak_masuk) + ' m · akurasi ' + esc(r.akurasi || '-') + ' m</div>' : '') + '</td>' +
              '<td><div class="actions">' + (r.ada_foto_masuk ? '<button class="icon-btn" data-foto="' + esc(r.id) + '" data-t="masuk" title="Foto masuk">' + icon('image', 'ico-sm') + '</button>' : '') +
              (r.ada_foto_pulang ? '<button class="icon-btn" data-foto="' + esc(r.id) + '" data-t="pulang" title="Foto pulang">' + icon('camera', 'ico-sm') + '</button>' : '') +
              (r.lat ? '<a class="icon-btn" target="_blank" rel="noopener" href="https://www.google.com/maps?q=' + esc(r.lat) + ',' + esc(r.lng) + '" title="Buka di Google Maps">' + icon('pin', 'ico-sm') + '</a>' : '') + '</div></td></tr>').join('') +
            '</tbody></table></div>' : empty('clock', 'Tidak ada data absensi pada rentang ini.');
        } catch (e) { box.innerHTML = empty('alert', e.message); }
      };
      f.onsubmit = e => { e.preventDefault(); load(); };
      box.addEventListener('click', async e => {
        const b = e.target.closest('[data-foto]'); if (!b) return;
        busy(b, true);
        try { UI.viewFile(await API.call('getFotoAbsen', { id: b.dataset.foto, tipe: b.dataset.t }), 'Foto absen ' + b.dataset.t); } catch (err) { toast(err.message, 'error'); }
        busy(b, false);
      });
      load();
    }
  });

  // ============================================================
  // DATA KARYAWAN (CRUD + akun login)
  // ============================================================
  function genPass() {
    const c = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let s = ''; const r = crypto.getRandomValues(new Uint32Array(10)); r.forEach(n => s += c[n % c.length]);
    return s.slice(0, 8) + '#' + (r[9] % 90 + 10);
  }
  function karyawanForm(k, onSaved) {
    const baru = !k; k = k || { mode_kerja: 'WFO', status_karyawan: 'Tetap', tanggal_masuk: UI.isoDate(), kuota_cuti: 12 };
    const f = (n, l, t, extra) => '<div class="field' + (extra && extra.full ? ' full' : '') + '"><label>' + l + '</label><input class="input" name="' + n + '" type="' + (t || 'text') + '" value="' + esc(k[n] || '') + '"' + (extra && extra.attr ? ' ' + extra.attr : '') + '></div>';
    const m = UI.modal({
      title: baru ? 'Tambah Karyawan' : 'Edit Data Karyawan', size: 'lg',
      body: '<form class="form-grid" data-f>' + f('nama', 'Nama lengkap *', 'text', { attr: 'required' }) + f('nik', 'NIK / ID Karyawan') + f('jabatan', 'Jabatan') + f('departemen', 'Departemen') +
        f('email', 'Email', 'email') + f('telepon', 'Telepon', 'tel') + f('tanggal_masuk', 'Tanggal masuk', 'date') +
        '<div class="field"><label>Status karyawan</label><select class="select" name="status_karyawan">' + UI.options(['Tetap', 'Kontrak', 'Probation', 'Magang'], k.status_karyawan) + '</select></div>' +
        '<div class="field"><label>Mode kerja</label><select class="select" name="mode_kerja">' + UI.options([{ v: 'WFO', l: 'WFO — wajib di radius kantor' }, { v: 'WFH', l: 'WFH — lokasi bebas, tetap dicatat' }], k.mode_kerja) + '</select></div>' +
        f('kuota_cuti', 'Kuota cuti tahunan (hari)', 'number', { attr: 'min="0" max="60"' }) +
        '<div class="field full"><label>Alamat</label><textarea class="textarea" name="alamat" style="min-height:64px">' + esc(k.alamat || '') + '</textarea></div>' +
        (baru ? '<div class="full alert">' + icon('key') + '<div style="flex:1"><b>Akun login karyawan</b><div class="form-grid mt-sm">' +
          '<div class="field"><label>Username *</label><input class="input" name="username" placeholder="mis. budi.santoso" autocomplete="off" required></div>' +
          '<div class="field"><label>Kata sandi awal *</label><div class="input-group"><input class="input" name="password" value="' + genPass() + '" style="padding-right:44px;padding-left:12px"><button type="button" class="trail" data-gen title="Buat acak">' + icon('refresh', 'ico-sm') + '</button></div></div>' +
          '</div><div class="xs muted mt-sm">Berikan username & kata sandi ini ke karyawan. Mereka dapat menggantinya di menu Profil.</div></div></div>' : '') +
        '</form>',
      foot: '<button class="btn ghost" data-close>Batal</button><button class="btn" data-save>' + icon('save', 'ico-sm') + ' Simpan</button>'
    });
    const form = m.$('[data-f]');
    if (baru) {
      m.$('[data-gen]').onclick = () => form.password.value = genPass();
      form.nama.addEventListener('input', () => { if (!form.username._touched) form.username.value = form.nama.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '').slice(0, 30); });
      form.username.addEventListener('input', () => form.username._touched = true);
    }
    m.$('[data-save]').onclick = async () => {
      const d = UI.formData(form);
      if (!d.nama) return toast('Nama wajib diisi.', 'warning');
      if (!baru) d.id = k.id;
      const b = m.$('[data-save]'); busy(b, true);
      try {
        const r = await API.call('saveKaryawan', d, { full: true });
        m.close(); karyawanCache = null;
        if (baru) {
          UI.modal({ title: 'Karyawan ditambahkan', size: 'sm', body: '<div class="alert green mb">' + icon('checkc') + '<div>' + esc(d.nama) + ' berhasil ditambahkan.</div></div><dl class="kv"><dt>Username</dt><dd>' + esc(d.username) + '</dd><dt>Kata sandi awal</dt><dd class="tabular">' + esc(d.password) + '</dd></dl><p class="xs muted mt">Catat dan sampaikan ke karyawan secara pribadi.</p>', foot: '<button class="btn" data-close>Selesai</button>' });
        } else toast(r.message);
        onSaved();
      } catch (e) { toast(e.message, 'error'); busy(b, false); }
    };
  }
  async function resetPw(userId, nama) {
    const pw = await UI.prompt({ title: 'Reset kata sandi', message: 'Buat kata sandi baru untuk ' + nama + '.', label: 'Kata sandi baru (min. 8 karakter)', value: genPass(), required: true, ok: 'Reset' });
    if (!pw) return;
    try { const r = await API.call('resetPassword', { user_id: userId, password: pw }, { full: true }); toast(r.message); } catch (e) { toast(e.message, 'error'); }
  }
  window.HRView.resetPw = resetPw; window.HRView.genPass = genPass;

  Pages.register('karyawan', {
    title: 'Data Karyawan', roles: 'HR',
    async render(el, q, alive) {
      let list = await daftarKaryawan(true);
      if (!alive()) return;
      let cari = '', st = 'Aktif';
      el.innerHTML = head('Data Karyawan', 'Kelola profil, mode kerja (WFO/WFH), dan akun login karyawan.', '<button class="btn" data-add>' + icon('plus', 'ico-sm') + ' Tambah Karyawan</button>') +
        '<div class="card"><div class="row between wrap mb"><div class="tabs" data-tabs>' + ['Aktif', 'Nonaktif', 'Semua'].map(s => '<button class="tab' + (s === st ? ' active' : '') + '" data-s="' + s + '">' + s + '</button>').join('') + '</div>' +
        '<div class="input-group" style="width:260px;max-width:100%">' + icon('search', 'lead') + '<input class="input" placeholder="Cari nama, jabatan, NIK…" data-cari></div></div><div data-list></div></div>';
      const box = el.querySelector('[data-list]');
      const draw = () => {
        const f = list.filter(k => (st === 'Semua' || (k.status || 'Aktif') === st) && (!cari || [k.nama, k.jabatan, k.nik, k.departemen, k.username].join(' ').toLowerCase().includes(cari)));
        box.innerHTML = f.length ? '<div class="table-wrap"><table class="table"><thead><tr><th>Karyawan</th><th>Jabatan</th><th>Mode</th><th class="hide-m">Status</th><th>Akun</th><th class="right">Aksi</th></tr></thead><tbody>' +
          f.map(k => '<tr' + (k.status === 'Nonaktif' ? ' style="opacity:.6"' : '') + '><td>' + person(k.nama, k.nik || k.email) + '</td><td>' + esc(k.jabatan || '-') + '<div class="xs muted">' + esc(k.departemen || '') + '</div></td><td>' + badge(k.mode_kerja || 'WFO') + '</td>' +
            '<td class="hide-m">' + badge(k.status_karyawan || 'Tetap', 'blue') + '</td><td class="small">@' + esc(k.username || '-') + ' ' + (k.role && k.role !== 'KARYAWAN' ? badge(k.role) : '') + (k.status_akun === 'Nonaktif' ? ' ' + badge('Nonaktif') : '') + '</td>' +
            '<td><div class="actions"><button class="icon-btn" data-edit="' + esc(k.id) + '" title="Edit">' + icon('edit', 'ico-sm') + '</button>' +
            (k.user_id ? '<button class="icon-btn" data-pw="' + esc(k.id) + '" title="Reset kata sandi">' + icon('key', 'ico-sm') + '</button>' : '') +
            (k.id !== App.state.user.karyawan_id ? '<button class="icon-btn ' + (k.status === 'Nonaktif' ? 'ok' : 'no') + '" data-tog="' + esc(k.id) + '" title="' + (k.status === 'Nonaktif' ? 'Aktifkan' : 'Nonaktifkan') + '">' + icon(k.status === 'Nonaktif' ? 'refresh' : 'trash', 'ico-sm') + '</button>' : '') +
            '</div></td></tr>').join('') + '</tbody></table></div><p class="xs muted mt">' + f.length + ' karyawan ditampilkan</p>' : empty('users', 'Tidak ada karyawan yang cocok.');
      };
      const reload = async () => { list = await daftarKaryawan(true); draw(); };
      el.querySelector('[data-add]').onclick = () => karyawanForm(null, reload);
      el.querySelector('[data-tabs]').onclick = e => { const t = e.target.closest('[data-s]'); if (!t) return; st = t.dataset.s; el.querySelectorAll('[data-s]').forEach(x => x.classList.toggle('active', x === t)); draw(); };
      el.querySelector('[data-cari]').oninput = UI.debounce(e => { cari = e.target.value.toLowerCase(); draw(); }, 150);
      box.addEventListener('click', async e => {
        const ed = e.target.closest('[data-edit]'), pw = e.target.closest('[data-pw]'), tg = e.target.closest('[data-tog]');
        if (ed) karyawanForm(list.find(k => k.id === ed.dataset.edit), reload);
        if (pw) { const k = list.find(x => x.id === pw.dataset.pw); resetPw(k.user_id, k.nama); }
        if (tg) {
          const k = list.find(x => x.id === tg.dataset.tog), aktifkan = k.status === 'Nonaktif';
          if (!await UI.confirm(aktifkan ? 'Aktifkan kembali ' + k.nama + '?' : 'Nonaktifkan ' + k.nama + '? Akun login ikut dinonaktifkan, data historis tetap tersimpan.', { danger: !aktifkan, ok: aktifkan ? 'Aktifkan' : 'Nonaktifkan' })) return;
          try { const r = await API.call('deleteKaryawan', { id: k.id, aktifkan }, { full: true }); toast(r.message); reload(); } catch (err) { toast(err.message, 'error'); }
        }
      });
      draw();
    }
  });

  // ============================================================
  // KPI SELURUH KARYAWAN
  // ============================================================
  Pages.register('kpi-karyawan', {
    title: 'KPI Karyawan', roles: 'HR',
    async render(el, q, alive) {
      const periode = q.p || UI.periodeNow();
      const d = await API.call('listKPI', { periode });
      if (!alive()) return;
      const dinilai = d.list.filter(x => x.skor_akhir !== null);
      const avg = dinilai.length ? dinilai.reduce((a, x) => a + x.skor_akhir, 0) / dinilai.length : null;
      const sb = dinilai.filter(x => x.skor_akhir >= 90).length, pp = dinilai.filter(x => x.skor_akhir < 70).length;
      const warna = v => v === null ? 'var(--muted)' : v >= 90 ? 'var(--success)' : v >= 80 ? 'var(--interactive)' : v >= 70 ? 'var(--warning)' : 'var(--danger)';
      el.innerHTML = head('KPI Karyawan', 'Skor kedisiplinan otomatis dari absensi & izin, ditambah nilai kinerja dari HRD.', '<div class="row wrap"><input type="month" class="input" style="width:auto" data-p value="' + esc(periode) + '"><button class="btn ghost" data-snap>' + icon('save', 'ico-sm') + ' Simpan Rekap ke Sheet</button><a class="btn" href="#/app/laporan?tab=kpi&p=' + esc(periode) + '">' + icon('printer', 'ico-sm') + ' Laporan PDF</a></div>') +
        '<div class="stack"><div class="grid g-4 keep2">' +
        '<div class="card stat dark" style="min-height:0"><div class="stat-top"><span class="stat-label">Rata-rata Skor</span><span class="stat-ico">' + icon('trend') + '</span></div><div class="stat-value">' + fmt.num(avg) + '</div><div class="muted small">' + esc(fmt.periode(periode)) + '</div></div>' +
        '<div class="card stat" style="min-height:0"><div class="stat-top"><span class="stat-label">Dinilai</span><span class="stat-ico">' + icon('users') + '</span></div><div class="stat-value">' + dinilai.length + ' <small>/ ' + d.list.length + '</small></div><div class="muted small">karyawan punya data</div></div>' +
        '<div class="card stat" style="min-height:0"><div class="stat-top"><span class="stat-label">Sangat Baik</span><span class="stat-ico green">' + icon('checkc') + '</span></div><div class="stat-value">' + sb + '</div><div class="muted small">skor ≥ 90</div></div>' +
        '<div class="card stat" style="min-height:0"><div class="stat-top"><span class="stat-label">Perlu Perbaikan</span><span class="stat-ico red">' + icon('alert') + '</span></div><div class="stat-value">' + pp + '</div><div class="muted small">skor &lt; 70</div></div></div>' +
        '<div class="card"><div class="card-head"><h3>Skor Akhir per Karyawan</h3></div><div class="chart-box"><canvas data-c></canvas></div></div>' +
        '<div class="card"><div class="card-head"><h3>Detail KPI</h3><div class="input-group" style="width:240px">' + icon('search', 'lead') + '<input class="input" placeholder="Cari nama…" data-cari></div></div><div data-list></div></div></div>';
      el.querySelector('[data-p]').onchange = e => App.go('#/app/kpi-karyawan?p=' + e.target.value);
      el.querySelector('[data-snap]').onclick = async e => { const b = e.currentTarget; busy(b, true); try { const r = await API.call('snapshotKPI', { periode }, { full: true }); toast(r.message); } catch (err) { toast(err.message, 'error'); } busy(b, false); };
      const box = el.querySelector('[data-list]');
      let cari = '';
      const draw = () => {
        const f = d.list.filter(x => !cari || x.nama.toLowerCase().includes(cari));
        box.innerHTML = f.length ? '<div class="table-wrap"><table class="table"><thead><tr><th>Karyawan</th><th class="center">Hari Kerja</th><th class="center">Hadir</th><th class="center">Tepat</th><th class="center">Telat</th><th class="center">Izin</th><th class="center">Alpha</th><th class="center">Disiplin</th><th class="center">Kinerja</th><th class="center">Skor Akhir</th><th></th></tr></thead><tbody>' +
          f.map(x => '<tr><td>' + person(x.nama, x.jabatan) + '</td><td class="center">' + x.hari_kerja + '</td><td class="center">' + fmt.num(x.pct_hadir) + '%</td><td class="center">' + fmt.num(x.pct_tepat) + '%</td><td class="center">' + x.terlambat + '</td><td class="center">' + x.izin + '</td><td class="center">' + x.alpha + '</td>' +
            '<td class="center">' + fmt.num(x.skor_disiplin) + '</td><td class="center">' + fmt.num(x.nilai_kinerja) + '</td><td class="center"><b style="color:' + warna(x.skor_akhir) + ';font-size:16px">' + fmt.num(x.skor_akhir) + '</b></td>' +
            '<td class="right"><button class="btn sm soft" data-nilai="' + esc(x.karyawan_id) + '">' + icon('edit', 'ico-sm') + ' Nilai</button></td></tr>').join('') + '</tbody></table></div>' : empty('chart', 'Tidak ada data.');
      };
      el.querySelector('[data-cari]').oninput = UI.debounce(e => { cari = e.target.value.toLowerCase(); draw(); }, 150);
      box.addEventListener('click', e => {
        const b = e.target.closest('[data-nilai]'); if (!b) return;
        const x = d.list.find(k => k.karyawan_id === b.dataset.nilai);
        const m = UI.modal({ title: 'Nilai Kinerja — ' + x.nama, size: 'sm',
          body: '<p class="small muted mb">Skor disiplin otomatis: <b>' + fmt.num(x.skor_disiplin) + '</b>. Skor akhir = 60% disiplin + 40% nilai kinerja.</p>' +
            '<div class="field mb"><label>Nilai kinerja (0–100)</label><input class="input" type="number" min="0" max="100" data-n value="' + (x.nilai_kinerja === null ? '' : x.nilai_kinerja) + '"><span class="hint">Kosongkan untuk menghapus nilai.</span></div>' +
            '<div class="field"><label>Catatan untuk karyawan</label><textarea class="textarea" data-c>' + esc(x.catatan || '') + '</textarea></div>',
          foot: '<button class="btn ghost" data-close>Batal</button><button class="btn" data-ok>Simpan</button>' });
        m.$('[data-ok]').onclick = async () => {
          const bb = m.$('[data-ok]'); busy(bb, true);
          try { const r = await API.call('saveNilaiKinerja', { periode, karyawan_id: x.karyawan_id, nilai_kinerja: m.$('[data-n]').value, catatan: m.$('[data-c]').value }, { full: true }); toast(r.message); m.close(); App.route(); }
          catch (err) { toast(err.message, 'error'); busy(bb, false); }
        };
      });
      draw();
      const top = dinilai.slice(0, 20);
      UI.chart(el.querySelector('[data-c]'), {
        type: 'bar',
        data: { labels: top.map(x => x.nama.split(' ').slice(0, 2).join(' ')), datasets: [
          { label: 'Disiplin', data: top.map(x => x.skor_disiplin), backgroundColor: colors().track, borderRadius: 6 },
          { label: 'Skor akhir', data: top.map(x => x.skor_akhir), backgroundColor: top.map(x => { const v = x.skor_akhir; return v >= 90 ? '#059669' : v >= 80 ? colors().blue : v >= 70 ? '#D97706' : '#DC2626'; }), borderRadius: 6 }] },
        options: { maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, scales: { y: { min: 0, max: 100, grid: { color: colors().grid } }, x: { grid: { display: false } } } }
      });
    }
  });

  // ============================================================
  // GAJI & SLIP
  // ============================================================
  const KOMP = [['gaji_pokok', 'Gaji pokok'], ['tunjangan', 'Tunjangan'], ['uang_lembur', 'Uang lembur'], ['bonus', 'Bonus / insentif']];
  const POT = [['pot_bpjs_kes', 'BPJS Kesehatan'], ['pot_bpjs_tk', 'BPJS Ketenagakerjaan'], ['pot_pph21', 'PPh 21'], ['pot_lain', 'Potongan lain']];
  function gajiForm(g, karyawan, periode, onSaved) {
    const baru = !g; g = g || { periode: periode || UI.periodeNow() };
    const inp = ([n, l]) => '<div class="field"><label>' + l + '</label><input class="input tabular" type="number" min="0" step="1000" name="' + n + '" value="' + (g[n] || 0) + '"></div>';
    const m = UI.modal({
      title: baru ? 'Tambah Data Gaji' : 'Edit Data Gaji — ' + g.nama, size: 'lg',
      body: '<form data-f><div class="form-grid mb"><div class="field"><label>Karyawan</label><select class="select" name="karyawan_id"' + (baru ? '' : ' disabled') + '>' + optKaryawan(karyawan, g.karyawan_id) + '</select></div>' +
        '<div class="field"><label>Periode</label><input class="input" type="month" name="periode" value="' + esc(g.periode) + '"></div></div>' +
        '<div class="grid g-2" style="gap:16px"><div class="geo-box"><b class="mb" style="display:block;color:var(--success)">Pendapatan</b><div class="stack" style="gap:10px">' + KOMP.map(inp).join('') + '</div></div>' +
        '<div class="geo-box"><div class="row between mb"><b style="color:var(--danger)">Potongan</b><button type="button" class="btn sm soft" data-auto title="Hitung BPJS standar dari gaji pokok">Isi BPJS otomatis</button></div><div class="stack" style="gap:10px">' + POT.map(inp).join('') + '</div></div></div>' +
        '<div class="alert mt" data-tot></div></form>',
      foot: '<button class="btn ghost" data-close>Batal</button><button class="btn" data-save>' + icon('save', 'ico-sm') + ' Simpan</button>'
    });
    const f = m.$('[data-f]');
    const n = k => Number(f[k].value) || 0;
    const calc = () => {
      const p = KOMP.reduce((a, [k]) => a + n(k), 0), q = POT.reduce((a, [k]) => a + n(k), 0);
      m.$('[data-tot]').innerHTML = icon('wallet') + '<div style="flex:1" class="row between wrap"><span>Pendapatan <b>' + fmt.rp(p) + '</b></span><span>Potongan <b style="color:var(--danger)">' + fmt.rp(q) + '</b></span><span style="font-size:17px">Gaji bersih <b>' + fmt.rp(p - q) + '</b></span></div>';
    };
    f.addEventListener('input', calc); calc();
    m.$('[data-auto]').onclick = () => { f.pot_bpjs_kes.value = Math.round(n('gaji_pokok') * 0.01); f.pot_bpjs_tk.value = Math.round(n('gaji_pokok') * 0.03); calc(); toast('BPJS Kesehatan 1% & Ketenagakerjaan 3% (JHT 2% + JP 1%) dari gaji pokok. Sesuaikan bila perlu.', 'info'); };
    m.$('[data-save]').onclick = async () => {
      const d = UI.formData(f);
      d.karyawan_id = f.karyawan_id.value;
      if (!baru) d.id = g.id;
      const b = m.$('[data-save]'); busy(b, true);
      try { const r = await API.call('saveGaji', d, { full: true }); toast(r.message); m.close(); onSaved(d.periode); } catch (e) { toast(e.message, 'error'); busy(b, false); }
    };
  }

  Pages.register('gaji', {
    title: 'Gaji & Slip', roles: 'HR',
    async render(el, q, alive) {
      const karyawan = await daftarKaryawan();
      let periode = q.p === undefined ? '' : q.p;
      let rows = await API.call('listGaji', { periode });
      if (!alive()) return;
      el.innerHTML = head('Gaji & Slip Gaji', 'Kelola komponen gaji per periode dan terbitkan slip gaji PDF (tersimpan otomatis ke Google Drive per karyawan).', '<button class="btn" data-add>' + icon('plus', 'ico-sm') + ' Tambah Data Gaji</button>') +
        '<div class="card"><div class="row between wrap mb"><div class="row wrap"><label class="small bold">Periode</label><input type="month" class="input" style="width:auto" data-p value="' + esc(periode) + '"><button class="btn sm ghost" data-all>Semua periode</button></div><div data-sum class="row wrap small"></div></div><div data-list></div></div>';
      const box = el.querySelector('[data-list]'), sum = el.querySelector('[data-sum]');
      const draw = () => {
        const tot = rows.reduce((a, g) => a + g.gaji_bersih, 0);
        sum.innerHTML = '<span class="badge blue">' + rows.length + ' data</span><span>Total gaji bersih: <b>' + fmt.rp(tot) + '</b></span>';
        box.innerHTML = rows.length ? '<div class="table-wrap"><table class="table"><thead><tr><th>Karyawan</th><th>Periode</th><th class="right">Pendapatan</th><th class="right">Potongan</th><th class="right">Gaji Bersih</th><th class="center">Slip</th><th class="right">Aksi</th></tr></thead><tbody>' +
          rows.map(g => '<tr><td>' + person(g.nama) + '</td><td class="nowrap">' + esc(fmt.periode(g.periode)) + '</td><td class="right tabular">' + fmt.rp(g.total_pendapatan) + '</td><td class="right tabular" style="color:var(--danger)">' + fmt.rp(g.total_potongan) + '</td><td class="right tabular bold">' + fmt.rp(g.gaji_bersih) + '</td>' +
            '<td class="center">' + (g.ada_slip ? badge('Tersimpan', 'green') : badge('Belum dibuat', '')) + '</td>' +
            '<td><div class="actions"><button class="icon-btn" data-view="' + esc(g.id) + '" title="Pratinjau & unduh slip">' + icon('eye', 'ico-sm') + '</button><button class="icon-btn" data-edit="' + esc(g.id) + '" title="Edit">' + icon('edit', 'ico-sm') + '</button><button class="icon-btn no" data-del="' + esc(g.id) + '" title="Hapus">' + icon('trash', 'ico-sm') + '</button></div></td></tr>').join('') +
          '</tbody></table></div>' : empty('wallet', 'Belum ada data gaji' + (periode ? ' untuk ' + fmt.periode(periode) : '') + '.');
      };
      const load = async (p) => { if (p !== undefined) { periode = p; el.querySelector('[data-p]').value = p; } box.innerHTML = loading(); rows = await API.call('listGaji', { periode }); draw(); };
      el.querySelector('[data-p]').onchange = e => load(e.target.value);
      el.querySelector('[data-all]').onclick = () => load('');
      el.querySelector('[data-add]').onclick = () => gajiForm(null, karyawan, periode, p => load(p));
      box.addEventListener('click', async e => {
        const v = e.target.closest('[data-view]'), ed = e.target.closest('[data-edit]'), dl = e.target.closest('[data-del]');
        if (v) { const g = rows.find(x => x.id === v.dataset.view); PageKit.previewSlip(g.id, 'Slip Gaji — ' + g.nama + ' · ' + fmt.periode(g.periode)); setTimeout(() => load(), 8000); }
        if (ed) gajiForm(rows.find(x => x.id === ed.dataset.edit), karyawan, periode, () => load());
        if (dl && await UI.confirm('Hapus data gaji ini?', { danger: true, ok: 'Hapus' })) { try { const r = await API.call('deleteGaji', { id: dl.dataset.del }, { full: true }); toast(r.message); load(); } catch (err) { toast(err.message, 'error'); } }
      });
      draw();
    }
  });

  // ============================================================
  // BPJS
  // ============================================================
  Pages.register('bpjs', {
    title: 'BPJS', roles: 'HR',
    async render(el, q, alive) {
      let rows = await API.call('listBPJS');
      if (!alive()) return;
      const ST = ['Aktif', 'Belum Terdaftar', 'Tidak Aktif'];
      el.innerHTML = head('Data BPJS Karyawan', 'Kepesertaan BPJS Kesehatan & BPJS Ketenagakerjaan.') + '<div class="card"><div class="row between wrap mb"><div class="chips" data-sum></div><div class="input-group" style="width:240px">' + icon('search', 'lead') + '<input class="input" placeholder="Cari nama…" data-cari></div></div><div data-list></div></div>';
      const box = el.querySelector('[data-list]');
      let cari = '';
      const draw = () => {
        el.querySelector('[data-sum]').innerHTML = '<span class="badge green">' + rows.filter(r => r.status_kes === 'Aktif').length + ' Kesehatan aktif</span><span class="badge blue">' + rows.filter(r => r.status_tk === 'Aktif').length + ' Ketenagakerjaan aktif</span><span class="badge amber">' + rows.filter(r => r.status_kes !== 'Aktif' || r.status_tk !== 'Aktif').length + ' perlu dilengkapi</span>';
        const f = rows.filter(r => !cari || r.nama.toLowerCase().includes(cari));
        box.innerHTML = '<div class="table-wrap"><table class="table"><thead><tr><th>Karyawan</th><th>BPJS Kesehatan</th><th>Kelas</th><th>BPJS Ketenagakerjaan</th><th class="hide-m">Terdaftar</th><th class="right">Aksi</th></tr></thead><tbody>' +
          f.map(r => '<tr><td>' + person(r.nama, r.jabatan) + '</td><td>' + badge(r.status_kes) + '<div class="xs muted tabular mt-sm">' + esc(r.no_bpjs_kes || '-') + '</div></td><td>' + esc(r.kelas_kes || '-') + '</td>' +
            '<td>' + badge(r.status_tk) + '<div class="xs muted tabular mt-sm">' + esc(r.no_bpjs_tk || '-') + '</div></td><td class="hide-m">' + esc(r.tanggal_daftar ? fmt.tgl(r.tanggal_daftar) : '-') + '</td>' +
            '<td class="right"><button class="icon-btn" data-edit="' + esc(r.karyawan_id) + '">' + icon('edit', 'ico-sm') + '</button></td></tr>').join('') + '</tbody></table></div>';
      };
      el.querySelector('[data-cari]').oninput = UI.debounce(e => { cari = e.target.value.toLowerCase(); draw(); }, 150);
      box.addEventListener('click', e => {
        const b = e.target.closest('[data-edit]'); if (!b) return;
        const r = rows.find(x => x.karyawan_id === b.dataset.edit);
        const m = UI.modal({ title: 'BPJS — ' + r.nama, size: 'lg',
          body: '<form class="form-grid" data-f><div class="field"><label>No. BPJS Kesehatan</label><input class="input" name="no_bpjs_kes" value="' + esc(r.no_bpjs_kes) + '"></div>' +
            '<div class="field"><label>Kelas</label><select class="select" name="kelas_kes">' + UI.options(['', 'Kelas 1', 'Kelas 2', 'Kelas 3', 'KRIS'], r.kelas_kes) + '</select></div>' +
            '<div class="field"><label>Status BPJS Kesehatan</label><select class="select" name="status_kes">' + UI.options(ST, r.status_kes) + '</select></div>' +
            '<div class="field"><label>No. BPJS Ketenagakerjaan</label><input class="input" name="no_bpjs_tk" value="' + esc(r.no_bpjs_tk) + '"></div>' +
            '<div class="field"><label>Status BPJS Ketenagakerjaan</label><select class="select" name="status_tk">' + UI.options(ST, r.status_tk) + '</select></div>' +
            '<div class="field"><label>Tanggal terdaftar</label><input class="input" type="date" name="tanggal_daftar" value="' + esc(r.tanggal_daftar) + '"></div>' +
            '<div class="field full"><label>Keterangan</label><input class="input" name="keterangan" value="' + esc(r.keterangan) + '"></div></form>',
          foot: '<button class="btn ghost" data-close>Batal</button><button class="btn" data-ok>Simpan</button>' });
        m.$('[data-ok]').onclick = async () => {
          const d = UI.formData(m.$('[data-f]')); d.karyawan_id = r.karyawan_id;
          const bb = m.$('[data-ok]'); busy(bb, true);
          try { const x = await API.call('saveBPJS', d, { full: true }); toast(x.message); m.close(); rows = await API.call('listBPJS'); draw(); } catch (err) { toast(err.message, 'error'); busy(bb, false); }
        };
      });
      draw();
    }
  });

  // ============================================================
  // SURAT PERINGATAN (SP1–SP3)
  // ============================================================
  Pages.register('sp', {
    title: 'Surat Peringatan', roles: 'HR',
    async render(el, q, alive) {
      const [karyawan, list] = await Promise.all([daftarKaryawan(), API.call('listSP')]);
      if (!alive()) return;
      el.innerHTML = head('Surat Peringatan', 'Terbitkan SP1/SP2/SP3 resmi dalam PDF. Karyawan menerima notifikasi dan dapat mengunduh suratnya.') +
        '<div class="grid g-main-r" style="grid-template-columns:minmax(0,1fr) minmax(0,1.5fr)">' +
        '<form class="card" data-f><div class="card-head"><div class="card-title-ico">' + icon('alert', 'ico-lg') + '<h3>Buat Surat Peringatan</h3></div></div><div class="stack" style="gap:14px">' +
        '<div class="field"><label>Karyawan</label><select class="select" name="karyawan_id">' + optKaryawan(karyawan.filter(k => k.id !== App.state.user.karyawan_id), '', '— Pilih karyawan —') + '</select></div>' +
        '<div data-riw></div>' +
        '<div class="field"><label>Jenis</label><select class="select" name="jenis">' + UI.options([{ v: 'SP1', l: 'SP1 — Peringatan Pertama' }, { v: 'SP2', l: 'SP2 — Peringatan Kedua' }, { v: 'SP3', l: 'SP3 — Peringatan Ketiga (terakhir)' }]) + '</select></div>' +
        '<div class="field"><label>Alasan / pelanggaran</label><textarea class="textarea" name="alasan" style="min-height:130px" placeholder="Contoh: Terlambat masuk kerja sebanyak 6 kali pada bulan September tanpa keterangan yang sah, melanggar Pasal 12 Peraturan Perusahaan."></textarea></div>' +
        '<div class="alert amber small">' + icon('info', 'ico-sm') + '<div>Masa berlaku SP otomatis 6 bulan. Periksa pratinjau sebelum menerbitkan — surat yang terbit langsung terkirim ke karyawan.</div></div>' +
        '<button class="btn lg" type="submit">' + icon('eye') + ' Pratinjau Surat</button></div></form>' +
        '<div class="card"><div class="card-head"><h3>Riwayat Surat Peringatan</h3><span class="badge">' + list.length + ' surat</span></div>' +
        (list.length ? '<div class="table-wrap"><table class="table"><thead><tr><th>Karyawan</th><th>Jenis</th><th>Tanggal</th><th>Status</th><th class="right">Surat</th></tr></thead><tbody>' +
          list.map(s => '<tr><td>' + person(s.nama, s.nomor_surat) + '</td><td>' + badge(s.jenis) + '</td><td class="nowrap">' + esc(fmt.tgl(s.tanggal)) + '<div class="xs muted">s/d ' + esc(fmt.tgl(s.berlaku_sampai)) + '</div></td>' +
            '<td>' + badge(s.status) + (s.aktif ? '' : ' ' + badge('Kedaluwarsa', '')) + '</td><td class="right"><button class="icon-btn" data-dl="' + esc(s.id) + '" title="Lihat PDF">' + icon('file', 'ico-sm') + '</button></td></tr>').join('') +
          '</tbody></table></div>' : empty('file', 'Belum ada surat peringatan.')) + '</div></div>';
      const f = el.querySelector('[data-f]');
      f.karyawan_id.onchange = () => {
        const aktif = list.filter(s => s.karyawan_id === f.karyawan_id.value && s.aktif);
        const lv = aktif.reduce((m, s) => Math.max(m, +s.jenis.slice(2)), 0);
        f.jenis.value = 'SP' + Math.min(3, lv + 1);
        el.querySelector('[data-riw]').innerHTML = f.karyawan_id.value ? (aktif.length ? '<div class="alert red small">' + icon('alert', 'ico-sm') + '<div>SP aktif: ' + aktif.map(s => esc(s.jenis) + ' (s/d ' + esc(fmt.tgl(s.berlaku_sampai)) + ')').join(', ') + '. Disarankan: <b>SP' + Math.min(3, lv + 1) + '</b>.</div></div>' : '<div class="alert green small">' + icon('checkc', 'ico-sm') + '<div>Belum ada SP aktif untuk karyawan ini.</div></div>') : '';
      };
      f.onsubmit = async e => {
        e.preventDefault();
        const d = UI.formData(f);
        if (!d.karyawan_id) return toast('Pilih karyawan terlebih dahulu.', 'warning');
        if (d.alasan.length < 10) return toast('Alasan minimal 10 karakter.', 'warning');
        const b = f.querySelector('[type=submit]'); busy(b, true);
        try {
          const p = await API.call('previewSP', d);
          busy(b, false);
          const m = UI.modal({ title: 'Pratinjau ' + d.jenis, size: 'lg', body: '<iframe class="doc-frame" sandbox title="Pratinjau SP"></iframe>',
            foot: '<button class="btn ghost" data-close>Perbaiki</button><button class="btn danger" data-ok>' + icon('send', 'ico-sm') + ' Terbitkan & Kirim</button>' });
          m.$('iframe').srcdoc = p.html;
          m.$('[data-ok]').onclick = async () => {
            const bb = m.$('[data-ok]'); busy(bb, true, 'Membuat PDF…');
            try { const r = await API.call('createSP', d, { full: true }); toast(r.message); m.close(); App.route(); } catch (err) { toast(err.message, 'error'); busy(bb, false); }
          };
        } catch (err) { toast(err.message, 'error'); busy(b, false); }
      };
      el.querySelectorAll('[data-dl]').forEach(b => b.onclick = async () => { busy(b, true); try { UI.viewFile(await API.call('downloadSP', { id: b.dataset.dl }), 'Surat Peringatan'); } catch (e) { toast(e.message, 'error'); } busy(b, false); });
    }
  });

  // ============================================================
  // KELOLA BERITA
  // ============================================================
  const KATEGORI = ['Perusahaan', 'Pengumuman', 'Teknologi', 'Budaya Kerja', 'Tips Karir', 'Kegiatan'];
  function beritaForm(b, onSaved) {
    const baru = !b; b = b || { tanggal: UI.isoDate(), status: 'Publish', kategori: 'Pengumuman' };
    let gambar = null, hapus = false;
    const m = UI.modal({
      title: baru ? 'Tulis Berita' : 'Edit Berita', size: 'lg',
      body: '<form class="form-grid" data-f><div class="field full"><label>Judul *</label><input class="input" name="judul" value="' + esc(b.judul || '') + '" maxlength="200"></div>' +
        '<div class="field"><label>Kategori</label><input class="input" name="kategori" list="kat-list" value="' + esc(b.kategori || '') + '"><datalist id="kat-list">' + KATEGORI.map(k => '<option value="' + k + '">').join('') + '</datalist></div>' +
        '<div class="field"><label>Tanggal</label><input class="input" type="date" name="tanggal" value="' + esc(b.tanggal || '') + '"></div>' +
        '<div class="field"><label>Status</label><select class="select" name="status">' + UI.options([{ v: 'Publish', l: 'Publish — tampil di halaman publik' }, { v: 'Draft', l: 'Draft — disimpan saja' }], b.status) + '</select></div>' +
        '<div class="field" style="justify-content:flex-end"><label class="check"><input type="checkbox" name="unggulan"' + (b.unggulan ? ' checked' : '') + '> Jadikan berita utama</label></div>' +
        '<div class="field full"><label>Gambar sampul</label><div class="upload-img" data-img ' + (b.gambar_url ? 'style="background-image:url(\'' + esc(b.gambar_url) + '\')"' : '') + '>' + (b.gambar_url ? '' : '<span>' + icon('image') + ' Klik untuk memilih gambar (JPG/PNG)</span>') + '</div><input type="file" accept="image/*" class="sr-only" data-file>' +
        '<div class="row mt-sm"><button type="button" class="btn sm ghost" data-pick>' + icon('upload', 'ico-sm') + ' Pilih gambar</button><button type="button" class="btn sm ghost" data-rm>' + icon('trash', 'ico-sm') + ' Hapus gambar</button></div></div>' +
        '<div class="field full"><label>Ringkasan</label><textarea class="textarea" name="ringkasan" style="min-height:70px" maxlength="400" placeholder="1–2 kalimat yang tampil di kartu berita">' + esc(b.ringkasan || '') + '</textarea></div>' +
        '<div class="field full"><label>Isi berita</label><textarea class="textarea" name="isi" style="min-height:220px">' + esc(b.isi || '') + '</textarea></div></form>',
      foot: '<button class="btn ghost" data-close>Batal</button><button class="btn" data-save>' + icon('save', 'ico-sm') + ' Simpan</button>'
    });
    const file = m.$('[data-file]'), img = m.$('[data-img]');
    const pick = () => file.click();
    img.onclick = pick; m.$('[data-pick]').onclick = pick;
    file.onchange = async () => { if (!file.files[0]) return; gambar = await UI.fileToDataUrl(file.files[0], 1400, 0.82); hapus = false; img.style.backgroundImage = 'url(' + gambar + ')'; img.innerHTML = ''; };
    m.$('[data-rm]').onclick = () => { gambar = null; hapus = true; img.style.backgroundImage = ''; img.innerHTML = '<span>' + icon('image') + ' Tidak ada gambar</span>'; };
    m.$('[data-save]').onclick = async () => {
      const d = UI.formData(m.$('[data-f]'));
      if (d.judul.length < 5) return toast('Judul minimal 5 karakter.', 'warning');
      if (!baru) d.id = b.id;
      if (gambar) d.gambar = gambar; if (hapus) d.hapus_gambar = true;
      const bt = m.$('[data-save]'); busy(bt, true);
      try { const r = await API.call('saveBerita', d, { full: true }); toast(r.message); m.close(); onSaved(); } catch (e) { toast(e.message, 'error'); busy(bt, false); }
    };
  }

  Pages.register('berita', {
    title: 'Kelola Berita', roles: 'HR',
    async render(el, q, alive) {
      let rows = await API.call('listBeritaAdmin');
      if (!alive()) return;
      el.innerHTML = head('Kelola Berita & Pengumuman', 'Berita berstatus Publish tampil di halaman depan sebelum login.', '<div class="row wrap"><a class="btn ghost" href="#/" target="_blank">' + icon('globe', 'ico-sm') + ' Lihat portal</a><button class="btn" data-add>' + icon('plus', 'ico-sm') + ' Tulis Berita</button></div>') + '<div class="card"><div data-list></div></div>';
      const box = el.querySelector('[data-list]');
      const draw = () => {
        box.innerHTML = rows.length ? '<div class="table-wrap"><table class="table"><thead><tr><th>Berita</th><th>Kategori</th><th>Tanggal</th><th>Status</th><th class="right">Aksi</th></tr></thead><tbody>' +
          rows.map(b => '<tr><td><div class="row"><div class="news-img" style="width:72px;height:48px;min-height:0;border-radius:8px;flex:none;' + (b.gambar_url ? 'background-image:url(\'' + esc(b.gambar_url) + '\')' : '') + '">' + (b.gambar_url ? '' : icon('news', 'ico-sm')) + '</div><div style="min-width:0"><b class="clamp2">' + (b.unggulan ? '★ ' : '') + esc(b.judul) + '</b><div class="xs muted">Oleh ' + esc(b.penulis) + '</div></div></div></td>' +
            '<td>' + badge(b.kategori, 'cyan') + '</td><td class="nowrap">' + esc(fmt.tgl(b.tanggal)) + '</td><td>' + badge(b.status) + (b.unggulan ? ' ' + badge('Utama', 'blue') : '') + '</td>' +
            '<td><div class="actions"><button class="icon-btn" data-edit="' + esc(b.id) + '" title="Edit">' + icon('edit', 'ico-sm') + '</button><button class="icon-btn no" data-del="' + esc(b.id) + '" title="Hapus">' + icon('trash', 'ico-sm') + '</button></div></td></tr>').join('') +
          '</tbody></table></div>' : empty('news', 'Belum ada berita.');
      };
      const reload = async () => { rows = await API.call('listBeritaAdmin'); draw(); };
      el.querySelector('[data-add]').onclick = () => beritaForm(null, reload);
      box.addEventListener('click', async e => {
        const ed = e.target.closest('[data-edit]'), dl = e.target.closest('[data-del]');
        if (ed) beritaForm(rows.find(b => b.id === ed.dataset.edit), reload);
        if (dl && await UI.confirm('Hapus berita ini secara permanen?', { danger: true, ok: 'Hapus' })) { try { const r = await API.call('deleteBerita', { id: dl.dataset.del }, { full: true }); toast(r.message); reload(); } catch (err) { toast(err.message, 'error'); } }
      });
      draw();
    }
  });

  // ============================================================
  // LAPORAN — pratinjau dengan grafik, unduh PDF, simpan ke Drive
  // ============================================================
  Pages.register('laporan', {
    title: 'Laporan', roles: 'HR',
    async render(el, q) {
      let tab = q.tab || 'absensi';
      const t = UI.isoDate(), awal = t.slice(0, 8) + '01';
      el.innerHTML = head('Laporan', 'Pilih jenis laporan, tampilkan pratinjau lengkap dengan grafik, lalu unduh sebagai PDF.') +
        '<div class="stack"><div class="card no-print"><div class="row between wrap"><div class="tabs" data-tabs>' +
        [['absensi', 'Absensi'], ['izin', 'Izin & Cuti'], ['kpi', 'KPI']].map(([k, l]) => '<button class="tab' + (k === tab ? ' active' : '') + '" data-t="' + k + '">' + l + '</button>').join('') + '</div></div>' +
        '<form class="row wrap mt" data-f style="align-items:flex-end">' +
        '<div class="field" data-rg><label>Dari</label><input class="input" type="date" name="dari" value="' + awal + '"></div>' +
        '<div class="field" data-rg><label>Sampai</label><input class="input" type="date" name="sampai" value="' + t + '"></div>' +
        '<div class="field hidden" data-pp><label>Periode</label><input class="input" type="month" name="periode" value="' + esc(q.p || UI.periodeNow()) + '"></div>' +
        '<button class="btn" type="submit">' + icon('eye', 'ico-sm') + ' Tampilkan Pratinjau</button></form></div>' +
        '<div data-out></div></div>';
      const f = el.querySelector('[data-f]'), out = el.querySelector('[data-out]');
      const setTab = () => {
        el.querySelectorAll('[data-t]').forEach(x => x.classList.toggle('active', x.dataset.t === tab));
        el.querySelectorAll('[data-rg]').forEach(x => x.classList.toggle('hidden', tab === 'kpi'));
        el.querySelector('[data-pp]').classList.toggle('hidden', tab !== 'kpi');
        out.innerHTML = '';
      };
      el.querySelector('[data-tabs]').onclick = e => { const b = e.target.closest('[data-t]'); if (!b) return; tab = b.dataset.t; setTab(); };
      f.onsubmit = async e => {
        e.preventDefault();
        const b = f.querySelector('[type=submit]'); busy(b, true, 'Menyusun…');
        out.innerHTML = '<div class="card">' + loading('Menyusun laporan…') + '</div>';
        try {
          const d = await API.call('laporanData', Object.assign({ jenis: tab }, UI.formData(f)));
          UI.destroyCharts();
          renderReport(out, d);
        } catch (err) { out.innerHTML = '<div class="card">' + empty('alert', err.message) + '</div>'; }
        busy(b, false);
      };
      setTab();
      if (q.tab) f.requestSubmit();
    }
  });

  function renderReport(out, d) {
    const info = App.state.info || {};
    const judul = { absensi: 'Laporan Rekap Absensi', izin: 'Laporan Izin, Cuti & Lembur', kpi: 'Laporan KPI Karyawan' }[d.jenis];
    const periode = d.jenis === 'kpi' ? fmt.periode(d.periode) : fmt.tgl(d.dari) + ' s/d ' + fmt.tgl(d.sampai);
    const box = (l, v) => '<div class="rs-box"><span style="font-size:11px;color:#64748B">' + l + '</span><b>' + v + '</b></div>';
    let body = '';
    if (d.jenis === 'absensi') {
      const r = d.ringkasan;
      body = '<div class="rs-grid">' + box('Hari kerja', d.hari_kerja) + box('Total absen', r.total_absen) + box('Tepat waktu', r.tepat) + box('Terlambat', r.terlambat) + '</div>' +
        '<div class="rcharts"><div class="rchart"><canvas data-c1></canvas></div><div class="rchart"><canvas data-c2></canvas></div></div>' +
        '<table><thead><tr><th>No</th><th>Nama</th><th>Jabatan</th><th>Hadir</th><th>Tepat</th><th>Terlambat</th><th>Total Telat</th><th>WFH</th><th>Rata Masuk</th><th>% Hadir</th></tr></thead><tbody>' +
        d.rekap.map((x, i) => '<tr><td>' + (i + 1) + '</td><td>' + esc(x.nama) + '</td><td>' + esc(x.jabatan || '-') + '</td><td>' + x.hadir + '</td><td>' + x.tepat + '</td><td>' + x.terlambat + '</td><td>' + x.menit_telat + ' mnt</td><td>' + x.wfh + '</td><td>' + x.rata_masuk + '</td><td><b>' + fmt.num(x.pct_hadir) + '%</b></td></tr>').join('') + '</tbody></table>';
    } else if (d.jenis === 'izin') {
      const ps = d.per_status;
      body = '<div class="rs-grid">' + box('Total pengajuan', d.list.length) + box('Disetujui', ps.Disetujui || 0) + box('Menunggu', ps.Menunggu || 0) + box('Ditolak', ps.Ditolak || 0) + '</div>' +
        '<div class="rcharts"><div class="rchart"><canvas data-c1></canvas></div><div class="rchart"><canvas data-c2></canvas></div></div>' +
        '<table><thead><tr><th>No</th><th>Nama</th><th>Jenis</th><th>Tanggal</th><th>Durasi</th><th>Status</th><th>Disetujui oleh</th></tr></thead><tbody>' +
        (d.list.length ? d.list.map((x, i) => '<tr><td>' + (i + 1) + '</td><td>' + esc(x.nama) + '</td><td>' + esc(x.jenis) + '</td><td>' + esc(fmt.rentang(x.tanggal_mulai, x.tanggal_selesai)) + '</td><td>' + x.durasi + ' ' + esc(x.satuan) + '</td><td>' + esc(x.status) + '</td><td>' + esc(x.approver || '-') + '</td></tr>').join('') : '<tr><td colspan="7" style="text-align:center">Tidak ada data</td></tr>') + '</tbody></table>';
    } else {
      const s = d.list.filter(x => x.skor_akhir !== null);
      const avg = s.length ? s.reduce((a, x) => a + x.skor_akhir, 0) / s.length : null;
      body = '<div class="rs-grid">' + box('Rata-rata skor', fmt.num(avg)) + box('Tertinggi', s.length ? fmt.num(s[0].skor_akhir) : '-') + box('Terendah', s.length ? fmt.num(s[s.length - 1].skor_akhir) : '-') + box('Dinilai', s.length + ' / ' + d.list.length) + '</div>' +
        '<div class="rcharts"><div class="rchart"><canvas data-c1></canvas></div><div class="rchart"><canvas data-c2></canvas></div></div>' +
        '<table><thead><tr><th>No</th><th>Nama</th><th>Hari Kerja</th><th>% Hadir</th><th>% Tepat</th><th>Izin</th><th>Alpha</th><th>Disiplin</th><th>Kinerja</th><th>Skor Akhir</th></tr></thead><tbody>' +
        d.list.map((x, i) => '<tr><td>' + (i + 1) + '</td><td>' + esc(x.nama) + '</td><td>' + x.hari_kerja + '</td><td>' + fmt.num(x.pct_hadir) + '%</td><td>' + fmt.num(x.pct_tepat) + '%</td><td>' + x.izin + '</td><td>' + x.alpha + '</td><td>' + fmt.num(x.skor_disiplin) + '</td><td>' + fmt.num(x.nilai_kinerja) + '</td><td><b>' + fmt.num(x.skor_akhir) + '</b></td></tr>').join('') + '</tbody></table>';
    }
    const nama = judul.replace(/\s+/g, '_') + '_' + (d.jenis === 'kpi' ? d.periode : d.dari + '_' + d.sampai) + '.pdf';
    out.innerHTML = '<div class="card no-print"><div class="row between wrap"><div><b>Pratinjau siap.</b> <span class="muted small">Periksa isi laporan di bawah sebelum mengunduh.</span></div>' +
      '<div class="row wrap"><label class="check small"><input type="checkbox" data-drive checked> Simpan salinan ke Google Drive</label><button class="btn ghost" data-print>' + icon('printer', 'ico-sm') + ' Cetak</button><button class="btn" data-pdf>' + icon('download', 'ico-sm') + ' Unduh PDF</button></div></div></div>' +
      '<div class="mt" style="overflow-x:auto"><div class="report-sheet" data-sheet>' +
      '<div class="rh">' + (info.logo_url ? '<img src="' + esc(info.logo_url) + '" crossorigin="anonymous" alt="" onerror="this.remove()">' : '') + '<div style="flex:1"><h2>' + esc(judul) + '</h2><div style="font-size:12px;color:#64748B">' + esc(info.perusahaan || '') + ' · ' + esc(info.alamat || '') + '</div></div>' +
      '<div style="text-align:right;font-size:12px"><b>Periode</b><br>' + esc(periode) + '</div></div>' + body +
      '<div class="rf">Dibuat oleh ' + esc(App.state.user.nama) + ' melalui ' + esc(info.app_name || 'Absenku') + ' pada ' + esc(new Date().toLocaleString('id-ID')) + '.</div></div></div>';

    // Grafik laporan (warna tetap, latar putih, tanpa animasi agar ikut tercetak)
    const NAVY = '#1E3A8A', BLUE = '#2563EB', CY = '#06B6D4', AMB = '#F59E0B', RED = '#DC2626', GR = '#059669', GRID = '#E2E8F0';
    const base = { animation: false, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#334155', boxWidth: 12 } } } };
    const sc = { x: { ticks: { color: '#475569' }, grid: { display: false } }, y: { beginAtZero: true, ticks: { color: '#475569', precision: 0 }, grid: { color: GRID } } };
    const c1 = out.querySelector('[data-c1]'), c2 = out.querySelector('[data-c2]');
    if (d.jenis === 'absensi') {
      UI.chart(c1, { type: 'bar', data: { labels: d.harian.map(h => fmt.tglPendek(h.tanggal)), datasets: [{ label: 'Hadir', data: d.harian.map(h => h.hadir - h.terlambat), backgroundColor: NAVY, stack: 's' }, { label: 'Terlambat', data: d.harian.map(h => h.terlambat), backgroundColor: AMB, stack: 's' }] },
        options: Object.assign({}, base, { plugins: { legend: base.plugins.legend, title: { display: true, text: 'Kehadiran harian', color: '#0F172A' } }, scales: { x: Object.assign({ stacked: true }, sc.x), y: Object.assign({ stacked: true }, sc.y) } }) });
      UI.chart(c2, { type: 'doughnut', data: { labels: ['Tepat waktu', 'Terlambat'], datasets: [{ data: [d.ringkasan.tepat, d.ringkasan.terlambat], backgroundColor: [GR, AMB], borderWidth: 0 }] },
        options: Object.assign({}, base, { cutout: '62%', plugins: { legend: { position: 'bottom', labels: base.plugins.legend.labels }, title: { display: true, text: 'Ketepatan waktu', color: '#0F172A' } } }) });
    } else if (d.jenis === 'izin') {
      const j = Object.keys(d.per_jenis), s = Object.keys(d.per_status);
      UI.chart(c1, { type: 'bar', data: { labels: j, datasets: [{ label: 'Pengajuan', data: j.map(x => d.per_jenis[x]), backgroundColor: [NAVY, BLUE, CY, AMB, GR, RED] }] },
        options: Object.assign({}, base, { plugins: { legend: { display: false }, title: { display: true, text: 'Pengajuan per jenis', color: '#0F172A' } }, scales: sc }) });
      UI.chart(c2, { type: 'pie', data: { labels: s, datasets: [{ data: s.map(x => d.per_status[x]), backgroundColor: s.map(x => ({ Disetujui: GR, Menunggu: AMB, Ditolak: RED }[x] || '#94A3B8')), borderWidth: 0 }] },
        options: Object.assign({}, base, { plugins: { legend: { position: 'bottom', labels: base.plugins.legend.labels }, title: { display: true, text: 'Status pengajuan', color: '#0F172A' } } }) });
    } else {
      const s = d.list.filter(x => x.skor_akhir !== null).slice(0, 15), dist = Object.keys(d.distribusi);
      UI.chart(c1, { type: 'bar', data: { labels: s.map(x => x.nama.split(' ')[0]), datasets: [{ label: 'Skor akhir', data: s.map(x => x.skor_akhir), backgroundColor: s.map(x => x.skor_akhir >= 90 ? GR : x.skor_akhir >= 80 ? BLUE : x.skor_akhir >= 70 ? AMB : RED) }] },
        options: Object.assign({}, base, { plugins: { legend: { display: false }, title: { display: true, text: 'Skor akhir karyawan', color: '#0F172A' } }, scales: { x: sc.x, y: Object.assign({}, sc.y, { max: 100 }) } }) });
      UI.chart(c2, { type: 'doughnut', data: { labels: dist, datasets: [{ data: dist.map(x => d.distribusi[x]), backgroundColor: [GR, BLUE, AMB, RED], borderWidth: 0 }] },
        options: Object.assign({}, base, { cutout: '58%', plugins: { legend: { position: 'bottom', labels: base.plugins.legend.labels }, title: { display: true, text: 'Distribusi predikat', color: '#0F172A' } } }) });
    }

    out.querySelector('[data-print]').onclick = () => window.print();
    out.querySelector('[data-pdf]').onclick = async e => {
      const b = e.currentTarget;
      if (!window.html2pdf) return toast('Pustaka PDF belum termuat. Gunakan tombol Cetak → Simpan sebagai PDF.', 'warning');
      busy(b, true, 'Membuat PDF…');
      try {
        const sheet = out.querySelector('[data-sheet]');
        const opt = { margin: [8, 8, 10, 8], filename: nama, image: { type: 'jpeg', quality: 0.95 }, html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
          jsPDF: { unit: 'mm', format: 'a4', orientation: d.jenis === 'absensi' || d.jenis === 'kpi' ? 'landscape' : 'portrait' }, pagebreak: { mode: ['avoid-all', 'css'] } };
        const uri = await html2pdf().set(opt).from(sheet).outputPdf('datauristring');
        const b64 = uri.split(',')[1];
        UI.downloadB64(b64, 'application/pdf', nama);
        if (out.querySelector('[data-drive]').checked) {
          const r = await API.call('saveLaporanPdf', { jenis: judul.replace('Laporan ', ''), nama, pdf: 'data:application/pdf;base64,' + b64 }, { full: true });
          toast(r.message);
        } else toast('PDF diunduh.');
      } catch (err) { toast(err.message || 'Gagal membuat PDF', 'error'); }
      busy(b, false);
    };
  }
})();
