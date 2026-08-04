/* ================================================================
   ACAXEL — STUDENT CLOCK-IN  (QR scan)
   Reads admin gate code from hc_gate_qr_config (same key admin
   and teacher use). Stores log under hc_stu_ci_log.
   On Time cutoff: 07:45. No clock-out for students.
   ================================================================ */

(function () {

  const STU_CI_KEY     = 'hc_stu_ci_log';
  const ON_TIME_CUTOFF = { h: 7, m: 45 };
  const DAYS           = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  let stuQrScanner = null;

  /* ── Helpers ─────────────────────────────────────────────────── */
  function todayStr() {
    const d = new Date();
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  }

  function getGateCode() {
    try {
      const cfg = JSON.parse(localStorage.getItem('hc_gate_qr_config'));
      if (cfg && cfg.code) return cfg.code.toUpperCase();
    } catch {}
    return 'ACAXEL-GATE-2026';
  }

  function loadLog() {
    try { return JSON.parse(localStorage.getItem(STU_CI_KEY) || '[]'); } catch { return []; }
  }
  function saveLog(log) { localStorage.setItem(STU_CI_KEY, JSON.stringify(log)); }

  function getTodayEntry() {
    return loadLog().find(e => e.date === todayStr()) || null;
  }

  function calcStatus(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    return (h * 60 + m) <= (ON_TIME_CUTOFF.h * 60 + ON_TIME_CUTOFF.m) ? 'on-time' : 'late';
  }

  function startLiveClock(id) {
    function tick() {
      const el = document.getElementById(id);
      if (!el) return;
      const now = new Date();
      el.textContent = now.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit', second:'2-digit' })
        + '  ' + now.toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short' });
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ── Perform check-in ────────────────────────────────────────── */
  function performCheckIn(method) {
    const log   = loadLog();
    const today = todayStr();
    if (log.find(e => e.date === today)) return; /* already done today */

    const now     = new Date();
    const timeStr = now.toTimeString().slice(0, 8);
    log.unshift({
      date:   today,
      inTime: timeStr,
      status: calcStatus(timeStr),
      method,
      day:    DAYS[now.getDay()],
    });
    saveLog(log);
    stuCloseScanner();
    renderUI();
    pulseRing();
  }

  function pulseRing() {
    const ring = document.getElementById('stuCiRing');
    if (ring) {
      ring.classList.add('tch-ring-pulse');
      setTimeout(() => ring.classList.remove('tch-ring-pulse'), 700);
    }
  }

  /* ── Open scanner ────────────────────────────────────────────── */
  window.stuOpenScanner = function () {
    if (getTodayEntry()) return;

    const overlay = document.getElementById('stuScanModal');
    if (overlay) overlay.style.display = 'flex';

    if (typeof Html5Qrcode === 'undefined') {
      const feed = document.getElementById('stuCameraFeed');
      if (feed) feed.innerHTML = '<p style="padding:24px;text-align:center;color:var(--text-light);font-size:0.84rem;">Camera library loading… use manual entry instead.</p>';
      return;
    }

    stuQrScanner = new Html5Qrcode('stuCameraFeed');
    stuQrScanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 220, height: 220 } },
      (decoded) => {
        if (decoded.trim().toUpperCase() === getGateCode()) {
          performCheckIn('QR Scan');
        } else {
          showScanError('Wrong QR code — use the official school gate QR.');
        }
      },
      () => {}
    ).catch(() => {
      const feed = document.getElementById('stuCameraFeed');
      if (feed) feed.innerHTML =
        '<div style="padding:24px;text-align:center;color:var(--text-light);font-size:0.84rem;">' +
        '<i data-lucide="camera-off" style="width:36px;height:36px;display:block;margin:0 auto 10px;stroke:var(--text-light);"></i>' +
        'Camera access denied.<br>Use the manual code entry below.</div>';
      if (typeof lucide !== 'undefined') lucide.createIcons();
    });
  };

  /* ── Close scanner ───────────────────────────────────────────── */
  window.stuCloseScanner = function () {
    if (stuQrScanner) {
      stuQrScanner.stop().catch(() => {});
      stuQrScanner = null;
    }
    const feed = document.getElementById('stuCameraFeed');
    if (feed) feed.innerHTML = '';
    const overlay = document.getElementById('stuScanModal');
    if (overlay) overlay.style.display = 'none';
  };

  /* ── Manual verify ───────────────────────────────────────────── */
  window.stuManualVerify = function () {
    const input = document.getElementById('stuCiManualCode');
    if (!input) return;
    const val = input.value.trim().toUpperCase();
    if (val === getGateCode()) {
      input.value = '';
      performCheckIn('Manual Code');
    } else {
      input.style.borderColor = '#dc2626';
      input.placeholder = 'Invalid code — try again';
      setTimeout(() => {
        input.style.borderColor = '';
        input.placeholder = 'Enter gate code…';
      }, 2000);
    }
  };

  function showScanError(msg) {
    const feed = document.getElementById('stuCameraFeed');
    if (!feed) return;
    const err = document.createElement('div');
    err.style.cssText = 'position:absolute;bottom:10px;left:50%;transform:translateX(-50%);background:rgba(220,38,38,0.92);color:#fff;padding:8px 16px;border-radius:8px;font-size:0.78rem;white-space:nowrap;z-index:10;';
    err.textContent = msg;
    feed.style.position = 'relative';
    feed.appendChild(err);
    setTimeout(() => err.remove(), 3000);
  }

  /* ── Render UI ───────────────────────────────────────────────── */
  function renderUI() {
    const entry  = getTodayEntry();
    const ring   = document.getElementById('stuCiRing');
    const icon   = document.getElementById('stuCiIcon');
    const label  = document.getElementById('stuCiLabel');
    const timeEl = document.getElementById('stuCiTime');
    const btn    = document.getElementById('stuCiBtn');
    const btnLbl = document.getElementById('stuCiBtnLabel');
    const hint   = document.getElementById('stuCiHint');
    const badge  = document.getElementById('stuCiStatusBadge');
    const setTxt = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };

    if (!entry) {
      if (ring)   ring.className = 'tch-ci-status-ring';
      if (icon)   icon.innerHTML = '<i data-lucide="scan-line"></i>';
      if (label)  label.textContent = 'Not Checked In';
      if (timeEl) timeEl.textContent = '';
      if (btn)    { btn.style.display = ''; btn.disabled = false; btn.className = 'tch-ci-btn'; }
      if (btnLbl) btnLbl.textContent = 'Scan QR to Check In';
      if (hint)   hint.textContent = 'Scan the school gate QR code to record your arrival';
      if (badge)  badge.style.display = 'none';
      setTxt('stuCiInTime',   '—');
      setTxt('stuCiDateVal',  '—');
      setTxt('stuCiStatusVal','—');
      setTxt('stuCiMethod',   '—');
    } else {
      const st = entry.status === 'on-time';
      if (ring)   ring.className = `tch-ci-status-ring ${st ? 'ring-present' : 'ring-late'}`;
      if (icon)   icon.innerHTML = `<i data-lucide="${st ? 'check-circle' : 'clock'}"></i>`;
      if (label)  label.textContent = st ? 'Present' : 'Present (Late)';
      if (timeEl) timeEl.textContent = `Checked in at ${entry.inTime.slice(0,5)} via ${entry.method || 'QR Scan'}`;
      if (btn)    { btn.style.display = 'none'; }
      if (hint)   hint.textContent = st ? 'You are marked present — on time!' : 'You are marked present, but arrived late.';
      if (badge)  { badge.style.display = ''; badge.textContent = '✓'; }
      setTxt('stuCiInTime',   entry.inTime.slice(0,5));
      setTxt('stuCiDateVal',  entry.date);
      setTxt('stuCiStatusVal', st ? 'On Time' : 'Late');
      setTxt('stuCiMethod',   entry.method || 'QR Scan');
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
    renderWeekGrid();
    renderLog();
  }

  /* ── Weekly grid ─────────────────────────────────────────────── */
  function renderWeekGrid() {
    const grid = document.getElementById('stuCiWeekGrid');
    if (!grid) return;
    const log     = loadLog();
    const today   = new Date();
    const dow     = today.getDay();
    const monday  = new Date(today);
    monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));

    const days = ['Mon','Tue','Wed','Thu','Fri'];
    grid.innerHTML = days.map((d, i) => {
      const date    = new Date(monday);
      date.setDate(monday.getDate() + i);
      const dateStr = `${String(date.getDate()).padStart(2,'0')}/${String(date.getMonth()+1).padStart(2,'0')}/${date.getFullYear()}`;
      const entry   = log.find(e => e.date === dateStr);
      const isFuture = date > today && dateStr !== todayStr();
      const isToday  = dateStr === todayStr();

      let cls = 'tch-week-day', iconName = 'minus', sub = 'No record', color = '';
      if (isFuture) {
        cls += ' tch-week-future'; sub = '—';
      } else if (entry) {
        const st = entry.status === 'on-time';
        cls += st ? ' tch-week-present' : ' tch-week-late';
        iconName = st ? 'check' : 'clock';
        sub  = entry.inTime.slice(0,5);
        color = st ? '#16a34a' : '#d97706';
      } else {
        cls += ' tch-week-absent'; iconName = 'x'; sub = 'Absent'; color = '#dc2626';
      }
      if (isToday) cls += ' tch-week-today';

      return `<div class="${cls}">
        <div class="tch-week-icon-wrap" style="${color ? `color:${color};border-color:${color};` : ''}">
          <i data-lucide="${iconName}" style="width:16px;height:16px;"></i>
        </div>
        <div class="tch-week-day-label">${d}</div>
        <div class="tch-week-date">${date.getDate()}</div>
        <div class="tch-week-sub">${sub}</div>
      </div>`;
    }).join('');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  /* ── Log list ────────────────────────────────────────────────── */
  function renderLog() {
    const list = document.getElementById('stuCiLogList');
    if (!list) return;
    const log = loadLog().slice(0, 30);
    if (!log.length) {
      list.innerHTML = '<div style="text-align:center;padding:32px 0;color:var(--text-light);font-size:0.84rem;">No attendance records yet.</div>';
      return;
    }
    list.innerHTML = log.map(e => {
      const st = e.status === 'on-time';
      const badge = `<span class="ci-badge ${st ? 'ci-badge-ontime' : 'ci-badge-late'}">${st ? 'On Time' : 'Late'}</span>`;
      return `<div class="ci-log-item">
        <div class="ci-log-icon ${st ? '' : 'ci-log-icon-late'}">
          <i data-lucide="${st ? 'check-circle' : 'clock'}"></i>
        </div>
        <div class="ci-log-meta">
          <div class="ci-log-name">${e.day || ''} ${e.date}</div>
          <div class="ci-log-time">In: ${e.inTime ? e.inTime.slice(0,5) : '—'} &nbsp;•&nbsp; ${e.method || 'QR Scan'}</div>
        </div>
        ${badge}
      </div>`;
    }).join('');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  /* ── Export CSV ──────────────────────────────────────────────── */
  window.stuCiExport = function () {
    const log = loadLog();
    const header = 'Date,Day,Check-In,Status,Method\n';
    const rows = log.map(e =>
      `"${e.date}","${e.day || ''}","${e.inTime || ''}","${e.status || ''}","${e.method || ''}"`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `student-attendance-${todayStr().replace(/\//g,'-')}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  /* ── Demo seed ───────────────────────────────────────────────── */
  function seedDemo() {
    if (loadLog().length) return;
    const d   = new Date();
    const dow = d.getDay();
    const mon = new Date(d);
    mon.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
    const daysArr = ['Mon','Tue','Wed','Thu','Fri'];
    const demo = [];
    for (let i = 0; i < (dow === 0 ? 5 : dow - 1); i++) {
      const dd = new Date(mon);
      dd.setDate(mon.getDate() + i);
      const dStr = `${String(dd.getDate()).padStart(2,'0')}/${String(dd.getMonth()+1).padStart(2,'0')}/${dd.getFullYear()}`;
      demo.push({
        date:   dStr,
        inTime: i === 1 ? '08:05:00' : '07:32:00',
        status: i === 1 ? 'late' : 'on-time',
        method: 'QR Scan',
        day:    daysArr[i],
      });
    }
    saveLog(demo);
  }

  /* ── Init ────────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    seedDemo();
    startLiveClock('stuCiClock');
    renderUI();
  });

})();
