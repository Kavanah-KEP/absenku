/* ============================================================
   HALAMAN SISTEM — Pengaturan (HR) & Akun & Akses (Superadmin)
   ============================================================ */
(function () {
  const { icon, esc, fmt, initials, badge, toast, busy, empty, loading } = UI;

  const THEMES = [
    { k: 'korporat', n: 'Korporat Biru', d: 'Formal, seperti dashboard referensi', c: ['#1E3A8A', '#2563EB', '#06B6D4', '#F1F5F9'] },
    { k: 'indigo', n: 'Modern Ungu-Indigo', d: 'Kekinian & energik', c: ['#3730A3', '#4F46E5', '#EC4899', '#F3F4F6'] },
    { k: 'teal', n: 'Segar Hijau-Teal', d: 'Fresh & ramah', c: ['#0F766E', '#0D9488', '#84CC16', '#FAFAFA'] },
    { k: 'gelap', n: 'Elegan Gelap', d: 'Dark mode mewah & premium', c: ['#111113', '#27272A', '#F59E0B', '#18181B'] },
    { k: 'oranye', n: 'Cerah Oranye-Karamel', d: 'Hangat & akrab', c: ['#7C2D12', '#EA580C', '#78350F', '#FFF7ED'] }
  ];
  const FONTS = [
    { k: 'Poppins', d: 'Bulat, ramah, populer' }, { k: 'Inter', d: 'Bersih & netral ala SaaS' }, { k: 'Plus Jakarta Sans', d: 'Modern, sentuhan lokal' },
    { k: 'Manrope', d: 'Geometris, mudah dibaca di HP' }, { k: 'Sora', d: 'Tegas & kontemporer' }
  ];

  // ============================================================
  // PENGATURAN
  // ============================================================
  Pages.register('pengaturan', {
    title: 'Pengaturan', roles: 'HR',
    async render(el, q, alive) {
      const d = await API.call('getSettingsAdmin');
      if (!alive()) return;
      const s = d.settings;
      let tab = q.tab || 'branding';
      const pv = { theme: s.THEME, font: s.FONT };
      App.onLeave(() => { const i = App.state.info || {}; UI.applyTheme(i.theme, i.font); });

      el.innerHTML = PageKit.head('Pengaturan', 'Branding, tampilan, jam kerja, dan lokasi kantor. Perubahan berlaku untuk seluruh pengguna.') +
        '<div class="tabs mb" data-tabs>' + [['branding', 'building', 'Branding'], ['tema', 'palette', 'Tema Tampilan'], ['jam', 'clock', 'Jam Kerja'], ['lokasi', 'pin', 'Lokasi Kantor']]
          .map(([k, i, l]) => '<button class="tab' + (k === tab ? ' active' : '') + '" data-t="' + k + '">' + icon(i, 'ico-sm') + l + '</button>').join('') + '</div><div data-body></div>';
      const body = el.querySelector('[data-body]');
      const saveSettings = async (btn, obj) => {
        busy(btn, true, 'Menyimpan…');
        try { const r = await API.call('saveSettings', { settings: obj }, { full: true }); Object.assign(s, obj); App.setInfo(r.data); toast(r.message); }
        catch (e) { toast(e.message, 'error'); }
        busy(btn, false);
      };

      const views = {
        // ---------- Branding
        branding() {
          let logo = null;
          body.innerHTML = '<div class="grid g-main-r" style="grid-template-columns:minmax(0,1fr) minmax(0,1.6fr)">' +
            '<div class="card"><div class="card-head"><h3>Logo Aplikasi</h3></div><div class="row" style="align-items:flex-start;gap:18px"><div class="logo-preview" data-lp>' + (s.LOGO_URL ? '<img src="' + esc(s.LOGO_URL) + '" alt="Logo">' : icon('image', 'ico-lg')) + '</div>' +
            '<div class="stack" style="gap:8px;flex:1"><input type="file" accept="image/png,image/jpeg" class="sr-only" data-file><button class="btn ghost" data-pick>' + icon('upload', 'ico-sm') + ' Pilih logo (PNG/JPG)</button>' +
            '<button class="btn hidden" data-up>' + icon('save', 'ico-sm') + ' Simpan logo</button>' + (s.LOGO_URL ? '<button class="btn sm ghost" data-rm style="color:var(--danger)">Hapus logo</button>' : '') +
            '<span class="xs muted">Disarankan persegi, minimal 256×256 px, latar transparan. Logo disimpan di Google Drive dan tampil di sidebar, halaman login, dan dokumen PDF.</span></div></div></div>' +
            '<form class="card" data-f><div class="card-head"><h3>Identitas Aplikasi & Perusahaan</h3></div><div class="form-grid">' +
            '<div class="field"><label>Nama aplikasi</label><input class="input" name="APP_NAME" maxlength="40" value="' + esc(s.APP_NAME) + '"><span class="hint">Tampil di header, tab browser, dan halaman login.</span></div>' +
            '<div class="field"><label>Nama perusahaan</label><input class="input" name="NAMA_PERUSAHAAN" value="' + esc(s.NAMA_PERUSAHAAN) + '"></div>' +
            '<div class="field full"><label>Tagline (halaman depan)</label><input class="input" name="TAGLINE" value="' + esc(s.TAGLINE) + '"></div>' +
            '<div class="field full"><label>Alamat perusahaan</label><input class="input" name="ALAMAT_PERUSAHAAN" value="' + esc(s.ALAMAT_PERUSAHAAN) + '"></div>' +
            '<div class="field"><label>Email</label><input class="input" name="EMAIL_PERUSAHAAN" value="' + esc(s.EMAIL_PERUSAHAAN) + '"></div>' +
            '<div class="field"><label>Telepon</label><input class="input" name="TELEPON_PERUSAHAAN" value="' + esc(s.TELEPON_PERUSAHAAN) + '"></div>' +
            '</div><div class="form-actions mt"><button class="btn" type="submit">' + icon('save', 'ico-sm') + ' Simpan</button></div></form></div>';
          const file = body.querySelector('[data-file]'), up = body.querySelector('[data-up]'), lp = body.querySelector('[data-lp]');
          body.querySelector('[data-pick]').onclick = () => file.click();
          file.onchange = async () => {
            const f = file.files[0]; if (!f) return;
            if (!/^image\/(png|jpeg)$/.test(f.type)) return toast('Logo harus PNG atau JPG.', 'warning');
            logo = await UI.fileToDataUrl(f, 512, 0.9, true);
            lp.innerHTML = '<img src="' + logo + '" alt="Pratinjau logo">'; up.classList.remove('hidden');
            toast('Pratinjau logo. Tekan "Simpan logo" untuk menerapkan.', 'info');
          };
          up.onclick = async () => {
            busy(up, true, 'Mengunggah…');
            try { const r = await API.call('uploadLogo', { logo }, { full: true }); s.LOGO_URL = r.data.logo_url; App.setInfo(r.data); toast(r.message); up.classList.add('hidden'); } catch (e) { toast(e.message, 'error'); }
            busy(up, false);
          };
          const rm = body.querySelector('[data-rm]');
          if (rm) rm.onclick = async () => { if (!await UI.confirm('Hapus logo aplikasi?', { danger: true, ok: 'Hapus' })) return; try { const r = await API.call('uploadLogo', { hapus: true }, { full: true }); s.LOGO_URL = ''; App.setInfo(r.data); toast(r.message); views.branding(); } catch (e) { toast(e.message, 'error'); } };
          const f = body.querySelector('[data-f]');
          f.onsubmit = e => { e.preventDefault(); const v = UI.formData(f); if (!v.APP_NAME) return toast('Nama aplikasi wajib diisi.', 'warning'); saveSettings(f.querySelector('[type=submit]'), v); };
        },

        // ---------- Tema & font (pratinjau langsung)
        tema() {
          FONTS.forEach(x => UI.loadFont(x.k));
          const draw = () => {
            body.innerHTML = '<div class="stack"><div class="card"><div class="card-head"><div><h3>Tema Warna</h3><div class="sub">Klik untuk pratinjau langsung di layar ini.</div></div></div>' +
              '<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px">' + THEMES.map(t => '<button class="theme-card' + (t.k === pv.theme ? ' active' : '') + '" data-th="' + t.k + '"><div class="swatches">' + t.c.map(c => '<i style="background:' + c + '"></i>').join('') + '</div><b>' + esc(t.n) + '</b><span class="xs muted">' + esc(t.d) + '</span></button>').join('') + '</div></div>' +
              '<div class="card"><div class="card-head"><div><h3>Gaya Huruf</h3><div class="sub">Font dimuat dari Google Fonts.</div></div></div>' +
              '<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px">' + FONTS.map(x => '<button class="font-card' + (x.k === pv.font ? ' active' : '') + '" data-fn="' + esc(x.k) + '" style="font-family:\'' + esc(x.k) + '\',sans-serif"><div class="sample">Aa ' + esc(s.APP_NAME) + '</div><b>' + esc(x.k) + '</b><div class="xs muted">' + esc(x.d) + '</div></button>').join('') + '</div></div>' +
              '<div class="card"><div class="card-head"><h3>Pratinjau Komponen</h3></div><div class="row wrap"><button class="btn">Tombol utama</button><button class="btn ghost">Sekunder</button>' + badge('Tepat Waktu') + badge('Terlambat') + badge('Menunggu') + badge('WFH') + '</div>' +
              '<div class="grid g-3 mt"><div class="card stat dark" style="min-height:0"><span class="stat-label">Kartu gelap</span><div class="stat-value">1.248</div></div><div class="card stat" style="min-height:0"><span class="stat-label">Kartu statistik</span><div class="stat-value">94,5</div></div><div class="cta blue" style="min-height:0;padding:20px"><b>Kartu aksi</b></div></div></div>' +
              '<div class="card row between wrap" style="position:sticky;bottom:12px;z-index:5"><div><b>' + esc(THEMES.find(t => t.k === pv.theme).n) + '</b> + <b>' + esc(pv.font) + '</b>' + (pv.theme !== s.THEME || pv.font !== s.FONT ? ' <span class="badge amber">Belum disimpan</span>' : ' <span class="badge green">Tema aktif</span>') + '</div>' +
              '<div class="row"><button class="btn ghost" data-reset>Batalkan pratinjau</button><button class="btn" data-save>' + icon('save', 'ico-sm') + ' Simpan untuk Semua Pengguna</button></div></div></div>';
            body.querySelectorAll('[data-th]').forEach(b => b.onclick = () => { pv.theme = b.dataset.th; UI.applyTheme(pv.theme, pv.font); draw(); });
            body.querySelectorAll('[data-fn]').forEach(b => b.onclick = () => { pv.font = b.dataset.fn; UI.applyTheme(pv.theme, pv.font); draw(); });
            body.querySelector('[data-reset]').onclick = () => { pv.theme = s.THEME; pv.font = s.FONT; UI.applyTheme(pv.theme, pv.font); draw(); };
            body.querySelector('[data-save]').onclick = async e => { await saveSettings(e.currentTarget, { THEME: pv.theme, FONT: pv.font }); draw(); };
          };
          draw();
        },

        // ---------- Jam kerja
        jam() {
          const hk = String(s.HARI_KERJA || '1,2,3,4,5').split(',').map(x => x.trim());
          const HR = [['1', 'Senin'], ['2', 'Selasa'], ['3', 'Rabu'], ['4', 'Kamis'], ['5', 'Jumat'], ['6', 'Sabtu'], ['0', 'Minggu']];
          body.innerHTML = '<form class="card" data-f style="max-width:820px"><div class="card-head"><h3>Jam Kerja & Kebijakan</h3></div><div class="form-grid">' +
            '<div class="field"><label>Jam masuk</label><input class="input" type="time" name="JAM_MASUK" value="' + esc(s.JAM_MASUK) + '"></div>' +
            '<div class="field"><label>Jam pulang</label><input class="input" type="time" name="JAM_PULANG" value="' + esc(s.JAM_PULANG) + '"></div>' +
            '<div class="field"><label>Toleransi keterlambatan (menit)</label><input class="input" type="number" min="0" max="120" name="TOLERANSI_MENIT" value="' + esc(s.TOLERANSI_MENIT) + '"><span class="hint">Absen setelah jam masuk + toleransi dianggap terlambat.</span></div>' +
            '<div class="field"><label>Kuota cuti tahunan default (hari)</label><input class="input" type="number" min="0" max="60" name="KUOTA_CUTI" value="' + esc(s.KUOTA_CUTI) + '"><span class="hint">Untuk karyawan baru. Bisa diubah per karyawan.</span></div>' +
            '<div class="field full"><label>Hari kerja</label><div class="chips" data-hk>' + HR.map(([v, l]) => '<label class="chip' + (hk.includes(v) ? ' active' : '') + '"><input type="checkbox" class="sr-only" value="' + v + '"' + (hk.includes(v) ? ' checked' : '') + '>' + l + '</label>').join('') + '</div><span class="hint">Dipakai untuk menghitung hari kerja, durasi cuti, dan KPI.</span></div>' +
            '<div class="field"><label>Penandatangan SP & slip</label><input class="input" name="PENANDATANGAN_SP" value="' + esc(s.PENANDATANGAN_SP) + '"></div>' +
            '<div class="field"><label>Jabatan penandatangan</label><input class="input" name="JABATAN_PENANDATANGAN" value="' + esc(s.JABATAN_PENANDATANGAN) + '"></div>' +
            '</div><div class="form-actions mt"><button class="btn" type="submit">' + icon('save', 'ico-sm') + ' Simpan</button></div></form>';
          body.querySelectorAll('[data-hk] input').forEach(c => c.onchange = () => c.parentNode.classList.toggle('active', c.checked));
          const f = body.querySelector('[data-f]');
          f.onsubmit = e => {
            e.preventDefault();
            const v = UI.formData(f);
            const hari = Array.from(f.querySelectorAll('[data-hk] input:checked')).map(c => c.value);
            if (!hari.length) return toast('Pilih minimal satu hari kerja.', 'warning');
            v.HARI_KERJA = hari.join(',');
            Object.keys(v).forEach(k => { if (!/^[A-Z_]+$/.test(k)) delete v[k]; });
            saveSettings(f.querySelector('[type=submit]'), v);
          };
        },

        // ---------- Lokasi kantor (geofence)
        async lokasi() {
          const draw = () => {
            body.innerHTML = '<div class="grid g-main-r"><div class="card"><div class="card-head"><div><h3>Titik Lokasi Kantor</h3><div class="sub">Karyawan WFO hanya bisa absen di dalam radius salah satu lokasi aktif.</div></div><button class="btn" data-add>' + icon('plus', 'ico-sm') + ' Tambah Lokasi</button></div>' +
              (d.lokasi.length ? '<div class="stack" style="gap:12px">' + d.lokasi.map(l => '<div class="geo-box row between wrap"><div class="row" style="align-items:flex-start">' + icon('building', 'ico-lg') + '<div><b>' + esc(l.nama) + '</b> ' + (l.aktif ? badge('Aktif') : badge('Nonaktif')) + '<div class="small muted">' + esc(l.alamat || '-') + '</div><div class="xs muted tabular">' + l.lat.toFixed(6) + ', ' + l.lng.toFixed(6) + ' · radius ' + l.radius + ' m</div></div></div>' +
                '<div class="actions"><button class="icon-btn" data-edit="' + esc(l.id) + '">' + icon('edit', 'ico-sm') + '</button><button class="icon-btn no" data-del="' + esc(l.id) + '">' + icon('trash', 'ico-sm') + '</button></div></div>').join('') + '</div>'
                : empty('pin', 'Belum ada lokasi kantor. Tambahkan agar karyawan WFO dapat absen.')) + '</div>' +
              '<div class="card"><div class="card-head"><h3>Peta Geofence</h3></div><div class="map tall" data-map></div><p class="xs muted mt-sm">Saran radius 50–150 m untuk mengakomodasi akurasi GPS HP.</p></div></div>';
            if (d.lokasi.length) UI.need('leaflet').then(() => {
              if (!body.querySelector('[data-map]')) return;
              const map = L.map(body.querySelector('[data-map]'));
              L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);
              let bounds = null;
              d.lokasi.forEach(l => {
                L.circle([l.lat, l.lng], { radius: l.radius, color: l.aktif ? UI.cssVar('--interactive') : '#94A3B8', fillOpacity: .15 }).bindTooltip(l.nama).addTo(map);
                const bb = L.latLng(l.lat, l.lng).toBounds(l.radius * 2);
                bounds = bounds ? bounds.extend(bb) : bb;
              });
              map.fitBounds(bounds.pad(0.4), { maxZoom: 17 });
              setTimeout(() => map.invalidateSize(), 200);
              App.onLeave(() => { try { map.remove(); } catch (e) { } });
            }).catch(() => { const me = body.querySelector('[data-map]'); if (me) me.innerHTML = empty('pin', 'Peta tidak dapat dimuat.'); });
            else body.querySelector('[data-map]').innerHTML = empty('pin', 'Belum ada lokasi.');
            body.querySelector('[data-add]').onclick = () => lokasiForm(null);
            body.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => lokasiForm(d.lokasi.find(l => l.id === b.dataset.edit)));
            body.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => {
              if (!await UI.confirm('Hapus lokasi ini?', { danger: true, ok: 'Hapus' })) return;
              try { const r = await API.call('deleteLokasi', { id: b.dataset.del }, { full: true }); toast(r.message); await reload(); } catch (e) { toast(e.message, 'error'); }
            });
          };
          const reload = async () => { const x = await API.call('getSettingsAdmin'); d.lokasi = x.lokasi; draw(); };
          const lokasiForm = (l) => {
            const baru = !l; l = l || { nama: '', alamat: '', lat: '', lng: '', radius: 100, aktif: true };
            const m = UI.modal({ title: baru ? 'Tambah Lokasi Kantor' : 'Edit Lokasi', size: 'lg',
              body: '<form class="form-grid" data-f><div class="field"><label>Nama lokasi *</label><input class="input" name="nama" value="' + esc(l.nama) + '" placeholder="mis. Kantor Pusat"></div>' +
                '<div class="field"><label>Radius (meter)</label><input class="input" type="number" min="10" max="5000" name="radius" value="' + l.radius + '"></div>' +
                '<div class="field full"><label>Alamat</label><input class="input" name="alamat" value="' + esc(l.alamat) + '"></div>' +
                '<div class="field"><label>Latitude</label><input class="input tabular" name="lat" value="' + l.lat + '" placeholder="-6.2253"></div>' +
                '<div class="field"><label>Longitude</label><input class="input tabular" name="lng" value="' + l.lng + '" placeholder="106.8008"></div>' +
                '<div class="full row wrap between"><span class="xs muted">Klik peta untuk memindahkan titik, atau gunakan lokasi Anda saat ini.</span><button type="button" class="btn sm soft" data-here>' + icon('crosshair', 'ico-sm') + ' Gunakan lokasi saya</button></div>' +
                '<div class="full"><div class="map" data-map style="height:300px"></div></div>' +
                '<label class="check full"><input type="checkbox" name="aktif"' + (l.aktif ? ' checked' : '') + '> Lokasi aktif untuk absensi</label></form>',
              foot: '<button class="btn ghost" data-close>Batal</button><button class="btn" data-save>' + icon('save', 'ico-sm') + ' Simpan</button>' });
            const f = m.$('[data-f]');
            let map, mk, ci;
            const sync = (fit) => {
              const la = parseFloat(f.lat.value), lo = parseFloat(f.lng.value), r = parseFloat(f.radius.value) || 100;
              if (!map || isNaN(la) || isNaN(lo)) return;
              if (!mk) { mk = L.marker([la, lo], { draggable: true }).addTo(map); ci = L.circle([la, lo], { radius: r, color: UI.cssVar('--interactive'), fillOpacity: .15 }).addTo(map);
                mk.on('dragend', () => { const p = mk.getLatLng(); f.lat.value = p.lat.toFixed(6); f.lng.value = p.lng.toFixed(6); sync(); }); }
              mk.setLatLng([la, lo]); ci.setLatLng([la, lo]).setRadius(r);
              if (fit) map.fitBounds(L.latLng(la, lo).toBounds(r * 2).pad(0.5), { maxZoom: 18 });
            };
            UI.need('leaflet').then(() => {
              if (!m.$('[data-map]')) return;
              setTimeout(() => {
                map = L.map(m.$('[data-map]')).setView(l.lat !== '' ? [l.lat, l.lng] : [-2.5, 118], l.lat !== '' ? 17 : 5);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);
                map.on('click', e => { f.lat.value = e.latlng.lat.toFixed(6); f.lng.value = e.latlng.lng.toFixed(6); sync(); });
                sync(true);
                setTimeout(() => map.invalidateSize(), 250);
              }, 60);
            }).catch(() => { const me = m.$('[data-map]'); if (me) me.innerHTML = empty('pin', 'Peta tidak dapat dimuat — isi koordinat secara manual.'); });
            f.addEventListener('input', UI.debounce(() => sync(), 300));
            m.$('[data-here]').onclick = e => {
              const b = e.currentTarget; busy(b, true);
              navigator.geolocation.getCurrentPosition(p => { f.lat.value = p.coords.latitude.toFixed(6); f.lng.value = p.coords.longitude.toFixed(6); sync(true); busy(b, false); toast('Akurasi ±' + Math.round(p.coords.accuracy) + ' m', 'info'); },
                () => { toast('Lokasi tidak dapat dibaca. Izinkan akses lokasi.', 'error'); busy(b, false); }, { enableHighAccuracy: true, timeout: 20000 });
            };
            m.$('[data-save]').onclick = async () => {
              const v = UI.formData(f); if (!baru) v.id = l.id;
              const b = m.$('[data-save]'); busy(b, true);
              try { const r = await API.call('saveLokasi', v, { full: true }); toast(r.message); m.close(); await reload(); } catch (e) { toast(e.message, 'error'); busy(b, false); }
            };
          };
          draw();
        }
      };
      const show = () => { el.querySelectorAll('[data-t]').forEach(x => x.classList.toggle('active', x.dataset.t === tab)); body.innerHTML = ''; views[tab](); };
      el.querySelector('[data-tabs]').onclick = e => {
        const b = e.target.closest('[data-t]'); if (!b) return;
        if (tab === 'tema') { const i = App.state.info || {}; UI.applyTheme(i.theme, i.font); pv.theme = s.THEME; pv.font = s.FONT; }
        tab = b.dataset.t; show();
      };
      show();
    }
  });

  // ============================================================
  // AKUN & AKSES (khusus Superadmin)
  // ============================================================
  Pages.register('akun', {
    title: 'Akun & Akses', roles: 'SA',
    async render(el, q, alive) {
      let rows = await API.call('listAkun');
      if (!alive()) return;
      let role = 'STAF', cari = '';
      el.innerHTML = PageKit.head('Akun & Akses', 'Tambah, ubah role, reset kata sandi, dan nonaktifkan akun. Akun yang dinonaktifkan langsung kehilangan akses.', '<button class="btn" data-add>' + icon('plus', 'ico-sm') + ' Tambah Akun</button>') +
        '<div class="card"><div class="row between wrap mb"><div class="tabs" data-tabs>' + [['STAF', 'HRD & Admin'], ['SUPERADMIN', 'Superadmin'], ['KARYAWAN', 'Karyawan'], ['ALL', 'Semua']].map(([k, l]) => '<button class="tab' + (k === role ? ' active' : '') + '" data-r="' + k + '">' + l + '</button>').join('') + '</div>' +
        '<div class="input-group" style="width:240px">' + icon('search', 'lead') + '<input class="input" placeholder="Cari nama/username…" data-cari></div></div><div data-list></div></div>';
      const box = el.querySelector('[data-list]');
      const draw = () => {
        const f = rows.filter(u => (role === 'ALL' || (role === 'STAF' ? (u.role === 'HRD' || u.role === 'ADMIN_HRD') : u.role === role)) && (!cari || (u.nama + ' ' + u.username).toLowerCase().includes(cari)));
        box.innerHTML = f.length ? '<div class="table-wrap"><table class="table"><thead><tr><th>Pengguna</th><th>Role</th><th>Status</th><th class="hide-m">Login terakhir</th><th class="right">Aksi</th></tr></thead><tbody>' +
          f.map(u => '<tr' + (u.status !== 'Aktif' ? ' style="opacity:.6"' : '') + '><td><div class="person"><span class="avatar">' + esc(initials(u.nama)) + '</span><div><div class="nm">' + esc(u.nama) + (u.saya ? ' <span class="badge blue">Anda</span>' : '') + '</div><div class="jb">@' + esc(u.username) + (u.jabatan ? ' · ' + esc(u.jabatan) : '') + '</div></div></div></td>' +
            '<td>' + badge(u.role) + '</td><td>' + badge(u.status) + '</td><td class="hide-m small muted">' + esc(u.last_login ? fmt.ago(u.last_login) : 'Belum pernah') + '</td>' +
            '<td><div class="actions"><button class="icon-btn" data-edit="' + esc(u.id) + '" title="Ubah">' + icon('edit', 'ico-sm') + '</button><button class="icon-btn" data-pw="' + esc(u.id) + '" title="Reset kata sandi">' + icon('key', 'ico-sm') + '</button>' +
            (u.saya ? '' : '<button class="icon-btn ' + (u.status === 'Aktif' ? 'no' : 'ok') + '" data-st="' + esc(u.id) + '" title="' + (u.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan') + '">' + icon(u.status === 'Aktif' ? 'lock' : 'refresh', 'ico-sm') + '</button>') + '</div></td></tr>').join('') +
          '</tbody></table></div>' : empty('users', 'Tidak ada akun.');
      };
      const reload = async () => { rows = await API.call('listAkun'); draw(); };
      const form = (u) => {
        const baru = !u; u = u || { role: 'HRD' };
        const m = UI.modal({ title: baru ? 'Tambah Akun' : 'Ubah Akun @' + u.username, size: 'lg',
          body: '<form class="form-grid" data-f><div class="field"><label>Nama lengkap *</label><input class="input" name="nama" value="' + esc(u.nama || '') + '"></div>' +
            '<div class="field"><label>Jabatan</label><input class="input" name="jabatan" value="' + esc(u.jabatan || '') + '" placeholder="mis. HRD Manager"></div>' +
            '<div class="field"><label>Email</label><input class="input" type="email" name="email" value="' + esc(u.email || '') + '"></div>' +
            '<div class="field"><label>Role</label><select class="select" name="role"' + (u.saya ? ' disabled' : '') + '>' + UI.options([{ v: 'HRD', l: 'HRD' }, { v: 'ADMIN_HRD', l: 'Admin HRD' }, { v: 'SUPERADMIN', l: 'Superadmin' }, { v: 'KARYAWAN', l: 'Karyawan' }], u.role) + '</select></div>' +
            (baru ? '<div class="field"><label>Username *</label><input class="input" name="username" autocomplete="off"></div><div class="field"><label>Kata sandi awal *</label><input class="input" name="password" value="' + HRView.genPass() + '"></div>' : '') +
            '<div class="full alert small">' + icon('info', 'ico-sm') + '<div><b>HRD & Admin HRD</b> memiliki akses operasional yang sama (persetujuan, data karyawan, gaji, SP, berita, pengaturan). <b>Superadmin</b> juga mengelola akun & akses.</div></div></form>',
          foot: '<button class="btn ghost" data-close>Batal</button><button class="btn" data-save>' + icon('save', 'ico-sm') + ' Simpan</button>' });
        m.$('[data-save]').onclick = async () => {
          const d = UI.formData(m.$('[data-f]'));
          if (!baru) { d.id = u.id; if (u.saya) d.role = u.role; }
          const b = m.$('[data-save]'); busy(b, true);
          try { const r = await API.call('saveAkun', d, { full: true }); toast(r.message); m.close(); reload(); } catch (e) { toast(e.message, 'error'); busy(b, false); }
        };
      };
      el.querySelector('[data-add]').onclick = () => form(null);
      el.querySelector('[data-tabs]').onclick = e => { const t = e.target.closest('[data-r]'); if (!t) return; role = t.dataset.r; el.querySelectorAll('[data-r]').forEach(x => x.classList.toggle('active', x === t)); draw(); };
      el.querySelector('[data-cari]').oninput = UI.debounce(e => { cari = e.target.value.toLowerCase(); draw(); }, 150);
      box.addEventListener('click', async e => {
        const ed = e.target.closest('[data-edit]'), pw = e.target.closest('[data-pw]'), st = e.target.closest('[data-st]');
        if (ed) form(rows.find(u => u.id === ed.dataset.edit));
        if (pw) { const u = rows.find(x => x.id === pw.dataset.pw); HRView.resetPw(u.id, u.nama); }
        if (st) {
          const u = rows.find(x => x.id === st.dataset.st), to = u.status === 'Aktif' ? 'Nonaktif' : 'Aktif';
          if (!await UI.confirm(to === 'Nonaktif' ? 'Nonaktifkan akun ' + u.nama + '? Sesi login-nya langsung berakhir.' : 'Aktifkan kembali akun ' + u.nama + '?', { danger: to === 'Nonaktif', ok: to === 'Nonaktif' ? 'Nonaktifkan' : 'Aktifkan' })) return;
          try { const r = await API.call('setStatusAkun', { id: u.id, status: to }, { full: true }); toast(r.message); reload(); } catch (err) { toast(err.message, 'error'); }
        }
      });
      draw();
    }
  });
})();
