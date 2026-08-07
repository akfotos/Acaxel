/* ================================================================
   ACAXEL CLOCK-IN SYSTEM
   Works on both parent-dashboard and admin-dashboard.
   Uses: html5-qrcode (camera), QRCode.js (gate QR generation),
         localStorage for persistence.
   Gate code: "ACAXEL-GATE-2026"
   ================================================================ */

(function () {
  const QR_STORAGE_KEY = 'hc_gate_qr_config';

  /* Load or create the active gate QR config */
  function loadQrConfig() {
    try {
      const saved = JSON.parse(localStorage.getItem(QR_STORAGE_KEY));
      if (saved && saved.code) return saved;
    } catch {}
    return {
      code:    'ACAXEL-GATE-2026',
      label:   'Acaxel School — Main Gate',
      from:    '07:00',
      until:   '08:30',
      size:    220,
      created: new Date().toISOString(),
    };
  }
  function saveQrConfig(cfg) {
    localStorage.setItem(QR_STORAGE_KEY, JSON.stringify(cfg));
  }

  /* Current active gate code (always read from config) */
  function getGateCode() { return loadQrConfig().code; }

  const GATE_CODE = 'ACAXEL-GATE-2026'; /* fallback only */
  const STORAGE_KEY  = 'hc_clockin_log';
  const CUTOFF_HOUR  = 8;  /* arrivals after 08:00 are "late" */
  const PAGE         = location.pathname.toLowerCase();
  const IS_ADMIN     = PAGE.includes('admin');
  const IS_PARENT    = PAGE.includes('parent');

  /* ── Sample children for parent dashboard ─────────────────── */
  const PARENT_CHILDREN = [
    { id: 'child-001', name: 'Afful Ewura-Yaa Nkunim', cls: 'Grade 2', avatar: 'AN' },
    { id: 'child-002', name: 'Morkeh Bradley',          cls: 'KG 2',    avatar: 'MB' },
  ];

  /* ── Sample enrolled students for admin KPI ───────────────── */
  const TOTAL_ENROLLED = 24;

  /* ── State ─────────────────────────────────────────────────── */
  let selectedChildId = PARENT_CHILDREN[0]?.id || null;
  let html5QrScanner  = null;
  let adminSearchTerm = '';
  let adminStatusFlt  = 'all';

  /* ──────────────────────────────────────────────────────────── *
   *  LOG helpers
   * ──────────────────────────────────────────────────────────── */
  function loadLog() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch { return []; }
  }
  function saveLog(log) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
  }
  function todayStr() {
    return new Date().toLocaleDateString('en-GB');
  }
  function nowTimeStr() {
    return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
  function isLate(timeStr) {
    const [h] = timeStr.split(':').map(Number);
    return h >= CUTOFF_HOUR;
  }

  /* ──────────────────────────────────────────────────────────── *
   *  CLOCK-IN ACTION  (called after QR verified)
   * ──────────────────────────────────────────────────────────── */
  function performClockIn(method) {
    const child = PARENT_CHILDREN.find(c => c.id === selectedChildId);
    if (!child) { alert('Please select a child first.'); return; }

    const log   = loadLog();
    const today = todayStr();
    const time  = nowTimeStr();

    /* Prevent duplicate clock-in for same child on same day */
    const alreadyIn = log.find(e => e.childId === child.id && e.date === today);
    if (alreadyIn) {
      alert(`${child.name} has already been clocked in today at ${alreadyIn.time}.`);
      return;
    }

    const entry = {
      id:        `ci-${Date.now()}`,
      childId:   child.id,
      childName: child.name,
      cls:       child.cls,
      parent:    'Mrs. Afful',
      date:      today,
      time:      time,
      status:    isLate(time) ? 'late' : 'on-time',
      method:    method,
    };
    log.unshift(entry);
    saveLog(log);

    closeCiScanner();
    showCiSuccess(child, entry);
    renderCiLog();
  }

  /* ──────────────────────────────────────────────────────────── *
   *  PARENT DASHBOARD — render child selector cards
   * ──────────────────────────────────────────────────────────── */
  function renderCiChildren() {
    const row = document.getElementById('ciChildrenRow');
    if (!row) return;
    const log   = loadLog();
    const today = todayStr();

    row.innerHTML = PARENT_CHILDREN.map(c => {
      const entry    = log.find(e => e.childId === c.id && e.date === today);
      const selected = c.id === selectedChildId;
      const statusPill = entry
        ? `<span class="ci-child-status ${entry.status === 'late' ? 'ci-status-late' : 'ci-status-ok'}">
             ${entry.status === 'late' ? '🕐 Late' : '✓ Clocked In'} · ${entry.time}
           </span>`
        : `<span class="ci-child-status ci-status-pending">Not clocked in</span>`;

      return `
        <div class="ci-child-card ${selected ? 'ci-child-selected' : ''} ${entry ? 'ci-child-done' : ''}"
             onclick="ciSelectChild('${c.id}')">
          <div class="ci-child-avatar">${c.avatar}</div>
          <div class="ci-child-info">
            <div class="ci-child-name">${c.name}</div>
            <div class="ci-child-cls">${c.cls}</div>
            ${statusPill}
          </div>
          ${selected ? '<div class="ci-child-check"><i data-lucide="check-circle"></i></div>' : ''}
        </div>`;
    }).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  window.ciSelectChild = function (id) {
    selectedChildId = id;
    renderCiChildren();
  };

  /* ──────────────────────────────────────────────────────────── *
   *  PARENT DASHBOARD — recent log
   * ──────────────────────────────────────────────────────────── */
  function renderCiLog() {
    const list = document.getElementById('ciLogList');
    if (!list) return;
    const log = loadLog();

    if (!log.length) {
      list.innerHTML = `<div class="ci-log-empty"><i data-lucide="clock"></i><p>No clock-ins recorded yet.</p></div>`;
      if (typeof lucide !== 'undefined') lucide.createIcons();
      return;
    }

    list.innerHTML = log.slice(0, 20).map(e => `
      <div class="ci-log-item">
        <div class="ci-log-avatar">${e.childName.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>
        <div class="ci-log-info">
          <div class="ci-log-name">${e.childName} <span class="ci-log-cls">${e.cls}</span></div>
          <div class="ci-log-meta">${e.date} · ${e.time} · via ${e.method}</div>
        </div>
        <span class="ci-log-badge ${e.status === 'late' ? 'ci-status-late' : 'ci-status-ok'}">
          ${e.status === 'late' ? 'Late' : 'On Time'}
        </span>
      </div>`).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  window.ciClearLog = function () {
    if (!confirm('Clear all clock-in history?')) return;
    saveLog([]);
    renderCiLog();
    renderCiChildren();
  };

  /* ──────────────────────────────────────────────────────────── *
   *  SCANNER MODAL
   * ──────────────────────────────────────────────────────────── */
  window.openCiScanner = function () {
    const child = PARENT_CHILDREN.find(c => c.id === selectedChildId);
    if (!child) { alert('Please select a child first.'); return; }

    const log   = loadLog();
    const today = todayStr();
    if (log.find(e => e.childId === child.id && e.date === today)) {
      alert(`${child.name} is already clocked in today.`);
      return;
    }

    const modal = document.getElementById('ciScannerModal');
    if (modal) { modal.classList.add('open'); }

    /* Start camera after short delay to allow CSS transition */
    setTimeout(startCamera, 300);
  };

  window.closeCiScanner = function () {
    stopCamera();
    const modal = document.getElementById('ciScannerModal');
    if (modal) modal.classList.remove('open');
  };

  function startCamera() {
    const feedEl = document.getElementById('ciCameraFeed');
    if (!feedEl) return;
    feedEl.innerHTML = '';

    if (typeof Html5Qrcode === 'undefined') {
      feedEl.innerHTML = `<div style="padding:24px;text-align:center;color:var(--text-light);font-size:0.85rem;">
        Camera library not loaded. Use the manual code entry below.</div>`;
      return;
    }

    html5QrScanner = new Html5Qrcode('ciCameraFeed');
    html5QrScanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 220, height: 220 } },
      (decodedText) => {
        if (decodedText.trim().toUpperCase() === getGateCode().toUpperCase()) {
          performClockIn('QR Scan');
        } else {
          showScanError('Invalid QR code. Please use the official school gate QR.');
        }
      },
      () => { /* scan errors are normal while scanning, ignore */ }
    ).catch(err => {
      feedEl.innerHTML = `<div style="padding:24px;text-align:center;color:var(--text-light);font-size:0.85rem;">
        <i data-lucide="camera-off" style="width:36px;height:36px;margin-bottom:10px;stroke:var(--text-light);display:block;margin:0 auto 10px;"></i>
        Camera access denied or unavailable.<br>Use the manual code entry below.</div>`;
      if (typeof lucide !== 'undefined') lucide.createIcons();
    });
  }

  function stopCamera() {
    if (html5QrScanner) {
      html5QrScanner.stop().catch(() => {});
      html5QrScanner = null;
    }
  }

  function showScanError(msg) {
    const feedEl = document.getElementById('ciCameraFeed');
    if (!feedEl) return;
    const errDiv = document.createElement('div');
    errDiv.style.cssText = 'position:absolute;bottom:12px;left:50%;transform:translateX(-50%);background:rgba(220,38,38,0.9);color:#fff;padding:8px 16px;border-radius:8px;font-size:0.8rem;white-space:nowrap;z-index:10;';
    errDiv.textContent = msg;
    feedEl.style.position = 'relative';
    feedEl.appendChild(errDiv);
    setTimeout(() => errDiv.remove(), 3000);
  }

  /* ──────────────────────────────────────────────────────────── *
   *  MANUAL CODE VERIFY
   * ──────────────────────────────────────────────────────────── */
  window.ciManualVerify = function () {
    const input = document.getElementById('ciManualCode');
    if (!input) return;
    const val = input.value.trim().toUpperCase();
    if (val === getGateCode().toUpperCase()) {
      input.value = '';
      performClockIn('Manual Code');
    } else {
      input.style.borderColor = '#dc2626';
      input.placeholder = 'Invalid code — try again';
      setTimeout(() => {
        input.style.borderColor = '';
        input.placeholder = 'e.g. ACAXEL-GATE-2026';
      }, 2000);
    }
  };

  /* ──────────────────────────────────────────────────────────── *
   *  SUCCESS MODAL
   * ──────────────────────────────────────────────────────────── */
  function showCiSuccess(child, entry) {
    const msg  = document.getElementById('ciSuccessMsg');
    const time = document.getElementById('ciSuccessTime');
    if (msg) msg.textContent = `${child.name} (${child.cls}) has been successfully clocked in. The school has been notified of their arrival.`;
    if (time) time.innerHTML = `<i data-lucide="clock" style="width:14px;height:14px;margin-right:4px;vertical-align:middle;"></i>${entry.date} at ${entry.time}`;
    const modal = document.getElementById('ciSuccessModal');
    if (modal) { modal.classList.add('open'); }
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  /* ──────────────────────────────────────────────────────────── *
   *  LIVE CLOCK
   * ──────────────────────────────────────────────────────────── */
  function startLiveClock(elId) {
    const el = document.getElementById(elId);
    if (!el) return;
    function tick() {
      const now = new Date();
      el.textContent = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        + '  ·  ' + now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ──────────────────────────────────────────────────────────── *
   *  ADMIN DASHBOARD
   * ──────────────────────────────────────────────────────────── */
  function adminCiRender() {
    const tbody   = document.getElementById('adminCiTableBody');
    const emptyEl = document.getElementById('adminCiEmpty');
    if (!tbody) return;

    const dateFilter = document.getElementById('adminCiDateFilter');
    const filterDate = dateFilter && dateFilter.value
      ? new Date(dateFilter.value).toLocaleDateString('en-GB')
      : todayStr();

    let log = loadLog().filter(e => e.date === filterDate);

    if (adminSearchTerm) {
      const q = adminSearchTerm.toLowerCase();
      log = log.filter(e =>
        e.childName.toLowerCase().includes(q) ||
        (e.parent || '').toLowerCase().includes(q)
      );
    }
    if (adminStatusFlt !== 'all') {
      log = log.filter(e => e.status === adminStatusFlt);
    }

    /* KPIs */
    const todayLog    = loadLog().filter(e => e.date === todayStr());
    const onTimeCount = todayLog.filter(e => e.status === 'on-time').length;
    const lateCount   = todayLog.filter(e => e.status === 'late').length;
    const notInCount  = Math.max(0, TOTAL_ENROLLED - todayLog.length);

    const setEl = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    setEl('adminCiTotal',   todayLog.length);
    setEl('adminCiOnTime',  onTimeCount);
    setEl('adminCiLate',    lateCount);
    setEl('adminCiAbsent',  notInCount);
    const badge = document.getElementById('adminCiTodayBadge');
    if (badge) badge.textContent = todayLog.length;

    if (!log.length) {
      tbody.innerHTML = '';
      if (emptyEl) emptyEl.style.display = 'block';
    } else {
      if (emptyEl) emptyEl.style.display = 'none';
      tbody.innerHTML = log.map((e, i) => `
        <tr>
          <td>${i + 1}</td>
          <td><strong>${e.childName}</strong></td>
          <td>${e.cls}</td>
          <td>${e.parent || '—'}</td>
          <td>${e.time}</td>
          <td><span class="ci-log-badge ${e.status === 'late' ? 'ci-status-late' : 'ci-status-ok'}">${e.status === 'late' ? 'Late' : 'On Time'}</span></td>
          <td style="font-size:0.78rem;color:var(--text-light);">${e.method}</td>
        </tr>`).join('');
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
  window.adminCiRender = adminCiRender;

  window.adminCiFilter = function (q) {
    adminSearchTerm = q;
    adminCiRender();
  };

  window.adminCiStatusFilter = function (status, btn) {
    adminStatusFlt = status;
    document.querySelectorAll('.asg-pill').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    adminCiRender();
  };

  window.adminCiExport = function () {
    const log = loadLog();
    if (!log.length) { alert('No records to export.'); return; }
    const header = 'Student,Class,Parent,Date,Time,Status,Method\n';
    const rows   = log.map(e =>
      `"${e.childName}","${e.cls}","${e.parent || ''}","${e.date}","${e.time}","${e.status}","${e.method}"`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `clockin-log-${todayStr().replace(/\//g,'-')}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  /* ──────────────────────────────────────────────────────────── *
   *  GATE QR GENERATOR
   * ──────────────────────────────────────────────────────────── */

  function renderGateQR() {
    adminUpdateGateQR();
  }

  /* Build/refresh the QR from current config + form inputs */
  window.adminUpdateGateQR = function () {
    const cfg = loadQrConfig();

    /* Sync form fields → config */
    const labelEl = document.getElementById('adminQrLabel');
    const fromEl  = document.getElementById('adminQrFrom');
    const untilEl = document.getElementById('adminQrUntil');
    const sizeEl  = document.getElementById('adminQrSize');

    if (labelEl) cfg.label = labelEl.value || cfg.label;
    if (fromEl)  cfg.from  = fromEl.value  || cfg.from;
    if (untilEl) cfg.until = untilEl.value || cfg.until;
    if (sizeEl)  cfg.size  = parseInt(sizeEl.value) || cfg.size;
    saveQrConfig(cfg);

    /* Render QR image */
    const el = document.getElementById('adminGateQR');
    if (!el) return;
    el.innerHTML = '';
    if (typeof QRCode === 'undefined') {
      el.innerHTML = '<p style="font-size:0.78rem;color:var(--text-light);padding:16px;text-align:center;">QRCode library loading…</p>';
      setTimeout(adminUpdateGateQR, 800);
      return;
    }
    new QRCode(el, {
      text:         cfg.code,
      width:        cfg.size,
      height:       cfg.size,
      colorDark:    '#1e1b4b',
      colorLight:   '#ffffff',
      correctLevel: QRCode.CorrectLevel.H,
    });

    /* Update display labels */
    const setTxt = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
    setTxt('adminQrLabelDisplay',   cfg.label);
    setTxt('adminQrValidityDisplay', `Valid: ${cfg.from} – ${cfg.until}`);
    setTxt('adminQrCodeDisplay',    cfg.code);
    setTxt('adminQrCodeText',       cfg.code);

    /* Status pill — check if currently within validity window */
    const pill = document.getElementById('adminQrStatusPill');
    if (pill) {
      const now   = new Date();
      const [fh, fm] = cfg.from.split(':').map(Number);
      const [uh, um] = cfg.until.split(':').map(Number);
      const nowMins  = now.getHours() * 60 + now.getMinutes();
      const fromMins = fh * 60 + fm;
      const untilMins= uh * 60 + um;
      const active   = nowMins >= fromMins && nowMins <= untilMins;
      pill.className = `ci-qr-status-pill ${active ? 'ci-qr-status-active' : 'ci-qr-status-inactive'}`;
      pill.innerHTML = `<i data-lucide="${active ? 'circle-check' : 'clock'}" style="width:13px;height:13px;"></i> ${active ? 'Active' : 'Outside Window'}`;
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  };

  /* Generate a fresh unique code */
  window.adminRegenerateQR = function () {
    if (!confirm('Generate a new QR code? The current code will stop working immediately.\n\nRemember to share the new code with parents.')) return;
    const cfg   = loadQrConfig();
    const stamp = Date.now().toString(36).toUpperCase();
    const rand  = Math.random().toString(36).slice(2,6).toUpperCase();
    cfg.code    = `ACAXEL-${stamp}-${rand}`;
    cfg.created = new Date().toISOString();
    saveQrConfig(cfg);
    adminUpdateGateQR();
    /* Flash the code field green */
    const codeEl = document.getElementById('adminQrCodeText');
    if (codeEl) {
      codeEl.style.background = '#bbf7d0';
      setTimeout(() => { codeEl.style.background = ''; }, 1800);
    }
    alert(`New code generated:\n\n${cfg.code}\n\nShare this with parents or post on the announcements board.`);
  };

  /* Download QR as PNG */
  window.adminDownloadQR = function () {
    const qrWrap = document.getElementById('adminGateQR');
    if (!qrWrap) return;
    const img = qrWrap.querySelector('img');
    const canvas = qrWrap.querySelector('canvas');
    const cfg = loadQrConfig();
    if (canvas) {
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `acaxel-gate-qr-${todayStr().replace(/\//g,'-')}.png`;
      a.click();
    } else if (img) {
      const a = document.createElement('a');
      a.href = img.src;
      a.download = `acaxel-gate-qr-${todayStr().replace(/\//g,'-')}.png`;
      a.click();
    } else {
      alert('QR not ready yet. Please wait a moment.');
    }
  };

  /* Print just the QR card */
  window.adminPrintQR = function () {
    const printArea = document.getElementById('adminQrPrintArea');
    if (!printArea) { window.print(); return; }
    const w = window.open('', '_blank', 'width=520,height=620');
    w.document.write(`
      <!DOCTYPE html><html><head>
      <title>Acaxel Gate QR</title>
      <style>
        body { margin: 40px; font-family: system-ui, sans-serif; text-align: center; }
        .ci-qr-school-name { font-size: 1.1rem; font-weight: 800; margin-bottom: 12px; }
        .ci-gate-qr-label  { font-size: 0.85rem; font-weight: 700; margin-top: 10px; }
        .ci-qr-validity    { font-size: 0.75rem; color: #666; margin-top: 4px; }
        .ci-gate-qr-code-txt { font-size: 0.7rem; color:#888; font-family:monospace; margin-top:4px; }
        img, canvas { display: block; margin: 0 auto; }
      </style>
      </head><body>
      ${printArea.innerHTML}
      </body></html>
    `);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 400);
  };

  /* Copy active code to clipboard */
  window.adminCopyQrCode = function () {
    const cfg = loadQrConfig();
    navigator.clipboard.writeText(cfg.code).then(() => {
      const btn = document.querySelector('.ci-qr-copy-btn');
      if (btn) {
        btn.innerHTML = '<i data-lucide="check" style="width:14px;height:14px;stroke:#16a34a;"></i>';
        if (typeof lucide !== 'undefined') lucide.createIcons();
        setTimeout(() => {
          btn.innerHTML = '<i data-lucide="copy" style="width:14px;height:14px;"></i>';
          if (typeof lucide !== 'undefined') lucide.createIcons();
        }, 1800);
      }
    }).catch(() => {
      prompt('Copy this code:', cfg.code);
    });
  };

  /* Live-update QR as admin types in the label / time fields */
  function attachQrFormListeners() {
    ['adminQrLabel','adminQrFrom','adminQrUntil'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', adminUpdateGateQR);
    });
  }

  /* ──────────────────────────────────────────────────────────── *
   *  SEED DEMO DATA (so admin log isn't empty on first load)
   * ──────────────────────────────────────────────────────────── */
  function seedDemoData() {
    const log = loadLog();
    if (log.length) return;
    const today = todayStr();
    const demo = [
      { id:'d1', childId:'c001', childName:'Boakye Wren Okatakyie',     cls:'Nursery 2', parent:'Mr. Boakye',      date:today, time:'07:42:10', status:'on-time', method:'QR Scan' },
      { id:'d2', childId:'c002', childName:'Sangber-Dery Jayden Mwinviel', cls:'Nursery 2', parent:'Mrs. Sangber-Dery', date:today, time:'07:55:30', status:'on-time', method:'QR Scan' },
      { id:'d3', childId:'c003', childName:'Afful Ewura-Yaa Nkunim',   cls:'Grade 2',   parent:'Mrs. Afful',      date:today, time:'08:12:45', status:'late',    method:'Manual Code' },
      { id:'d4', childId:'c004', childName:'Bekoe Nana Yaa',           cls:'Nursery 2', parent:'Mr. Bekoe',       date:today, time:'07:38:00', status:'on-time', method:'QR Scan' },
      { id:'d5', childId:'c005', childName:'Adugbire Mbo Ibiza',       cls:'Nursery 2', parent:'Mr. Adugbire',    date:today, time:'08:25:15', status:'late',    method:'QR Scan' },
    ];
    saveLog(demo);
  }

  /* ──────────────────────────────────────────────────────────── *
   *  INIT
   * ──────────────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    seedDemoData();

    if (IS_PARENT) {
      startLiveClock('ciLiveClock');
      renderCiChildren();
      renderCiLog();
    }

    if (IS_ADMIN) {
      startLiveClock('adminCiClock');

      /* Set today's date in date filter */
      const dateFilter = document.getElementById('adminCiDateFilter');
      if (dateFilter) {
        const now = new Date();
        dateFilter.value = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
      }
      adminCiRender();

      /* Pre-fill QR config form from saved config */
      const cfg = loadQrConfig();
      const setVal = (id, v) => { const e = document.getElementById(id); if (e) e.value = v; };
      setVal('adminQrLabel', cfg.label);
      setVal('adminQrFrom',  cfg.from);
      setVal('adminQrUntil', cfg.until);
      const sizeEl = document.getElementById('adminQrSize');
      if (sizeEl) {
        const opt = Array.from(sizeEl.options).find(o => parseInt(o.value) === cfg.size);
        if (opt) opt.selected = true;
      }

      /* Attach live-update listeners */
      attachQrFormListeners();

      /* Render gate QR after QRCode.js loads */
      setTimeout(renderGateQR, 600);

      /* Refresh status pill every minute */
      setInterval(() => { if (document.getElementById('adminQrStatusPill')) adminUpdateGateQR(); }, 60000);
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
  });

})();
