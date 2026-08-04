/* ================================================================
   ACAXEL — TEACHER TIMETABLE + STAFF CLOCK-IN
   teacher-dashboard.html only
   - Timetable: reads admin localStorage tt_<cls> data filtered
     to this teacher (Mr. Adeyemi), shows by selected day,
     highlights current/past/upcoming lesson, "Up Next" banner.
   - Clock-In: tap-to-clock-in/out, On Time / Late logic,
     weekly grid, log list, duration timer, CSV export.
   ================================================================ */

(function () {

  /* ── Config ─────────────────────────────────────────────────── */
  const TEACHER_NAME    = 'Mr. Adeyemi';          /* match admin timetable */
  const TCH_CI_KEY      = 'hc_tch_ci_log';
  const ON_TIME_CUTOFF  = { h: 7, m: 45 };        /* 07:45 = on-time deadline */
  const WORKDAY_END     = { h: 15, m: 30 };        /* 15:30 = expected clock-out */
  const CLASSES_ALL     = ['JSS1A','JSS1B','JSS2A','JSS2B','JSS3A','JSS3B','SSS1A','SSS2A'];
  const DAYS            = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  /* Default fallback timetable (mirrors admin-dashboard.js) */
  const TT_DEFAULT_JSS2A = [
    { time: '7:30–8:00',   break: true,  label: 'Morning Assembly & Registration' },
    { time: '8:00–8:45',   cells: ['Mathematics|Mr. Adeyemi','English|Mrs. Eze','Mathematics|Mr. Adeyemi','Basic Science|Mr. Bello','Social Studies|Mr. Mensah'] },
    { time: '8:45–9:30',   cells: ['English|Mrs. Eze','Mathematics|Mr. Adeyemi','Social Studies|Mr. Mensah','Mathematics|Mr. Adeyemi','English|Mrs. Eze'] },
    { time: '9:30–10:15',  cells: ['Basic Science|Mr. Bello','Social Studies|Mr. Mensah','English|Mrs. Eze','Civic Ed|Mr. Kofi','Mathematics|Mr. Adeyemi'] },
    { time: '10:15–10:30', break: true,  label: 'Short Break' },
    { time: '10:30–11:15', cells: ['Creative Arts|Mrs. Amoah','Basic Science|Mr. Bello','Civic Ed|Mr. Kofi','English|Mrs. Eze','Biology|Mrs. Garba'] },
    { time: '11:15–12:00', cells: ['Civic Ed|Mr. Kofi','Creative Arts|Mrs. Amoah','Biology|Mrs. Garba','Creative Arts|Mrs. Amoah','Basic Science|Mr. Bello'] },
    { time: '12:00–1:00',  break: true,  label: 'Lunch Break' },
    { time: '1:00–1:45',   cells: ['ICT|Mr. Agyei','PHE|Coach Adu','Mathematics|Mr. Adeyemi','ICT|Mr. Agyei','PHE|Coach Adu'] },
    { time: '1:45–2:30',   cells: ['PHE|Coach Adu','ICT|Mr. Agyei','Agric Science|Mr. Darko','Biology|Mrs. Garba','Revision / Free|—'] },
  ];

  /* ── Helpers ─────────────────────────────────────────────────── */
  function todayStr() {
    const d = new Date();
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  }
  function nowMins() {
    const n = new Date();
    return n.getHours() * 60 + n.getMinutes();
  }
  function parseStartMins(timeStr) {
    const m = timeStr.match(/(\d{1,2}):(\d{2})/);
    return m ? parseInt(m[1]) * 60 + parseInt(m[2]) : null;
  }
  function parseEndMins(timeStr) {
    const m = timeStr.match(/–(\d{1,2}):(\d{2})/);
    return m ? parseInt(m[1]) * 60 + parseInt(m[2]) : null;
  }
  function fmtTime(h, m) {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hh = h % 12 || 12;
    return `${hh}:${String(m).padStart(2,'0')} ${ampm}`;
  }
  function startLiveClock(id) {
    function tick() {
      const el = document.getElementById(id);
      if (!el) return;
      const now = new Date();
      el.textContent = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        + '  ' + now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ════════════════════════════════════════════
     TIMETABLE SECTION
     ════════════════════════════════════════════ */

  /* Read all class timetables from localStorage, collect rows
     where this teacher appears on the given day column (0=Mon…4=Fri) */
  function getMyLessons(dayColIndex) {
    const lessons = [];
    CLASSES_ALL.forEach(cls => {
      let rows;
      try {
        const stored = localStorage.getItem('tt_' + cls);
        rows = stored ? JSON.parse(stored) : (cls === 'JSS2A' ? TT_DEFAULT_JSS2A : []);
      } catch { rows = cls === 'JSS2A' ? TT_DEFAULT_JSS2A : []; }

      rows.forEach(row => {
        if (row.break) {
          /* include break rows so table shows breaks in context */
          lessons.push({ isBreak: true, time: row.time, label: row.label });
          return;
        }
        const cellVal = (row.cells || [])[dayColIndex] || '';
        const [subj, teacher] = cellVal.split('|');
        if (!teacher) return;
        if (teacher.trim().toLowerCase().includes(TEACHER_NAME.toLowerCase().replace('mr. ','').replace('mrs. ',''))) {
          lessons.push({ isBreak: false, time: row.time, subj: subj.trim(), cls, teacher: teacher.trim() });
        }
      });
    });
    /* De-duplicate breaks (same break shows once per class iteration) */
    const seen = new Set();
    return lessons.filter(l => {
      if (!l.isBreak) return true;
      if (seen.has(l.time)) return false;
      seen.add(l.time); return true;
    }).sort((a, b) => (parseStartMins(a.time) || 0) - (parseStartMins(b.time) || 0));
  }

  let tchCurrentDay = 0; /* 1=Mon…5=Fri */

  window.tchTTSwitchDay = function (day, btn) {
    tchCurrentDay = day;
    document.querySelectorAll('.tch-tt-day').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderTimetable(day);
  };

  function renderTimetable(day) {
    const colIndex = day - 1; /* 0=Mon…4=Fri */
    const tbody = document.getElementById('tchTTBody');
    const empty = document.getElementById('tchTTEmpty');
    if (!tbody) return;

    const lessons = getMyLessons(colIndex);
    const myLessons = lessons.filter(l => !l.isBreak);

    if (myLessons.length === 0) {
      tbody.innerHTML = '';
      if (empty) empty.style.display = '';
      updateNextLesson([], day);
      return;
    }
    if (empty) empty.style.display = 'none';

    const nm = nowMins();
    const isToday = (new Date().getDay() === day); /* Sun=0 … Sat=6 */

    tbody.innerHTML = lessons.map(l => {
      if (l.isBreak) {
        return `<tr class="tch-tt-break-row">
          <td>${l.time}</td>
          <td colspan="3" style="text-align:center;font-style:italic;color:var(--text-light);">${l.label || 'Break'}</td>
        </tr>`;
      }
      const start = parseStartMins(l.time);
      const end   = parseEndMins(l.time);
      let rowClass = '', badge = '';
      if (isToday && start !== null && end !== null) {
        if (nm >= start && nm < end) {
          rowClass = 'tch-tt-current';
          badge = `<span class="tch-tt-badge tch-badge-now">Now</span>`;
        } else if (nm >= end) {
          rowClass = 'tch-tt-done';
          badge = `<span class="tch-tt-badge tch-badge-done">Done</span>`;
        } else {
          badge = `<span class="tch-tt-badge tch-badge-upcoming">Upcoming</span>`;
        }
      }
      return `<tr class="${rowClass}">
        <td style="font-weight:600;white-space:nowrap;">${l.time}</td>
        <td style="font-weight:600;">${l.subj}</td>
        <td>${l.cls}</td>
        <td>${badge}</td>
      </tr>`;
    }).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
    updateNextLesson(myLessons, day);
  }

  function updateNextLesson(myLessons, day) {
    const banner = document.getElementById('tchNextLesson');
    const text   = document.getElementById('tchNextText');
    if (!banner || !text) return;
    const isToday = (new Date().getDay() === day);
    if (!isToday) { banner.style.display = 'none'; return; }
    const nm = nowMins();
    const next = myLessons.find(l => (parseStartMins(l.time) || 0) > nm);
    if (!next) { banner.style.display = 'none'; return; }
    const minsLeft = (parseStartMins(next.time) || 0) - nm;
    text.textContent = `${next.subj} — ${next.cls} at ${next.time} (in ${minsLeft} min)`;
    banner.style.display = 'flex';
  }

  function initTimetableTab() {
    startLiveClock('tchTTClock');
    /* Auto-select today's day, default Mon if weekend */
    const today = new Date().getDay(); /* 0=Sun…6=Sat */
    const dayToSelect = (today >= 1 && today <= 5) ? today : 1;
    tchCurrentDay = dayToSelect;
    const btn = document.querySelector(`.tch-tt-day[data-day="${dayToSelect}"]`);
    if (btn) btn.classList.add('active');
    renderTimetable(dayToSelect);
    /* Refresh current-lesson highlight every minute */
    setInterval(() => renderTimetable(tchCurrentDay), 60000);
  }

  /* ════════════════════════════════════════════
     CLOCK-IN SECTION  (QR scan)
     ════════════════════════════════════════════ */

  let tchQrScanner = null;

  /* Read the active gate code from admin config */
  function getGateCode() {
    try {
      const cfg = JSON.parse(localStorage.getItem('hc_gate_qr_config'));
      if (cfg && cfg.code) return cfg.code.toUpperCase();
    } catch {}
    return 'ACAXEL-GATE-2026';
  }

  function loadCiLog() {
    try { return JSON.parse(localStorage.getItem(TCH_CI_KEY) || '[]'); } catch { return []; }
  }
  function saveCiLog(log) { localStorage.setItem(TCH_CI_KEY, JSON.stringify(log)); }

  function getTodayEntry() {
    return loadCiLog().find(e => e.date === todayStr()) || null;
  }

  function calcStatus(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    const mins = h * 60 + m;
    const cutoff = ON_TIME_CUTOFF.h * 60 + ON_TIME_CUTOFF.m;
    return mins <= cutoff ? 'on-time' : 'late';
  }

  function calcDuration(inTime, outTime) {
    if (!inTime || !outTime) return '—';
    const [ih, im] = inTime.split(':').map(Number);
    const [oh, om] = outTime.split(':').map(Number);
    const diffMins = (oh * 60 + om) - (ih * 60 + im);
    if (diffMins < 0) return '—';
    const h = Math.floor(diffMins / 60);
    const m = diffMins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  /* ── Perform clock-in after successful scan ───────────────── */
  function performClockIn(method) {
    const log   = loadCiLog();
    const today = todayStr();
    const now   = new Date();
    const timeStr = now.toTimeString().slice(0, 8);

    if (log.find(e => e.date === today && e.inTime)) return; /* already clocked in */

    log.unshift({
      date:    today,
      inTime:  timeStr,
      outTime: null,
      status:  calcStatus(timeStr),
      method,
      day:     DAYS[now.getDay()],
    });
    saveCiLog(log);
    tchCloseScanner();
    renderClockInUI();
    pulseRing();
  }

  /* ── Clock out (no scan needed — just a button) ──────────── */
  window.tchClockOut = function () {
    const log   = loadCiLog();
    const today = todayStr();
    const idx   = log.findIndex(e => e.date === today && e.inTime && !e.outTime);
    if (idx === -1) return;
    log[idx].outTime = new Date().toTimeString().slice(0, 8);
    saveCiLog(log);
    renderClockInUI();
    pulseRing();
  };

  function pulseRing() {
    const ring = document.getElementById('tchCiRing');
    if (ring) {
      ring.classList.add('tch-ring-pulse');
      setTimeout(() => ring.classList.remove('tch-ring-pulse'), 700);
    }
  }

  /* ── Open scanner modal ───────────────────────────────────── */
  window.tchOpenScanner = function () {
    const entry = getTodayEntry();
    if (entry && entry.inTime) return; /* already in */

    const overlay = document.getElementById('tchScanModal');
    if (overlay) overlay.style.display = 'flex';

    if (typeof Html5Qrcode === 'undefined') {
      document.getElementById('tchCameraFeed').innerHTML =
        '<p style="padding:24px;text-align:center;color:var(--text-light);font-size:0.84rem;">Camera library loading… Use manual code entry instead.</p>';
      return;
    }

    tchQrScanner = new Html5Qrcode('tchCameraFeed');
    tchQrScanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 220, height: 220 } },
      (decoded) => {
        if (decoded.trim().toUpperCase() === getGateCode()) {
          performClockIn('QR Scan');
        } else {
          showScanError('Wrong QR code — use the official school gate QR.');
        }
      },
      () => { /* scan misses are normal */ }
    ).catch(() => {
      const feed = document.getElementById('tchCameraFeed');
      if (feed) feed.innerHTML =
        '<div style="padding:24px;text-align:center;color:var(--text-light);font-size:0.84rem;">' +
        '<i data-lucide="camera-off" style="width:36px;height:36px;display:block;margin:0 auto 10px;stroke:var(--text-light);"></i>' +
        'Camera access denied.<br>Use the manual code entry below.</div>';
      if (typeof lucide !== 'undefined') lucide.createIcons();
    });
  };

  /* ── Close scanner modal ──────────────────────────────────── */
  window.tchCloseScanner = function () {
    if (tchQrScanner) {
      tchQrScanner.stop().catch(() => {});
      tchQrScanner = null;
    }
    const feed = document.getElementById('tchCameraFeed');
    if (feed) feed.innerHTML = '';
    const overlay = document.getElementById('tchScanModal');
    if (overlay) overlay.style.display = 'none';
  };

  /* ── Manual code verify ───────────────────────────────────── */
  window.tchManualVerify = function () {
    const input = document.getElementById('tchCiManualCode');
    if (!input) return;
    const val = input.value.trim().toUpperCase();
    if (val === getGateCode()) {
      input.value = '';
      performClockIn('Manual Code');
    } else {
      input.style.borderColor = '#dc2626';
      input.placeholder = 'Invalid code — try again';
      setTimeout(() => {
        input.style.borderColor = '';
        input.placeholder = 'Enter gate code manually…';
      }, 2000);
    }
  };

  /* ── Scan error toast inside the modal ───────────────────── */
  function showScanError(msg) {
    const feed = document.getElementById('tchCameraFeed');
    if (!feed) return;
    const err = document.createElement('div');
    err.style.cssText = 'position:absolute;bottom:10px;left:50%;transform:translateX(-50%);background:rgba(220,38,38,0.92);color:#fff;padding:8px 16px;border-radius:8px;font-size:0.78rem;white-space:nowrap;z-index:10;';
    err.textContent = msg;
    feed.style.position = 'relative';
    feed.appendChild(err);
    setTimeout(() => err.remove(), 3000);
  }

  /* ── Render the full clock-in UI ─────────────────────────── */
  function renderClockInUI() {
    const entry  = getTodayEntry();
    const ring   = document.getElementById('tchCiRing');
    const icon   = document.getElementById('tchCiIcon');
    const label  = document.getElementById('tchCiLabel');
    const timeEl = document.getElementById('tchCiTime');
    const btn    = document.getElementById('tchCiBtn');
    const btnLbl = document.getElementById('tchCiBtnLabel');
    const outBtn = document.getElementById('tchCiOutBtn');
    const hint   = document.getElementById('tchCiHint');
    const badge  = document.getElementById('tchCiStatusBadge');
    const setTxt = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };

    if (!entry || !entry.inTime) {
      /* ── Not clocked in ── */
      if (ring)   ring.className = 'tch-ci-status-ring';
      if (icon)   icon.innerHTML = '<i data-lucide="scan-line"></i>';
      if (label)  label.textContent = 'Not Clocked In';
      if (timeEl) timeEl.textContent = '';
      if (btn)    { btn.style.display = ''; btn.disabled = false; btn.className = 'tch-ci-btn'; }
      if (btnLbl) btnLbl.textContent = 'Scan QR to Clock In';
      if (outBtn) outBtn.style.display = 'none';
      if (hint)   hint.textContent = 'Scan the school gate QR code to record your arrival';
      if (badge)  badge.style.display = 'none';
      setTxt('tchCiInTime', '—'); setTxt('tchCiOutTime', '—');
      setTxt('tchCiStatusVal', '—'); setTxt('tchCiDuration', '—');

    } else if (entry.inTime && !entry.outTime) {
      /* ── Clocked in, still present ── */
      const st = entry.status === 'on-time';
      if (ring)   ring.className = `tch-ci-status-ring ${st ? 'ring-present' : 'ring-late'}`;
      if (icon)   icon.innerHTML = `<i data-lucide="${st ? 'check-circle' : 'clock'}"></i>`;
      if (label)  label.textContent = st ? 'Present' : 'Present (Late)';
      if (timeEl) timeEl.textContent = `Clocked in at ${entry.inTime.slice(0,5)} via ${entry.method || 'QR Scan'}`;
      if (btn)    btn.style.display = 'none';
      if (outBtn) outBtn.style.display = '';
      if (hint)   hint.textContent = 'Tap Clock Out when you leave school';
      if (badge)  { badge.style.display = ''; badge.textContent = '✓'; }
      setTxt('tchCiInTime',  entry.inTime.slice(0,5));
      setTxt('tchCiOutTime', '—');
      setTxt('tchCiStatusVal', st ? 'On Time' : 'Late');
      setTxt('tchCiDuration', '—');

    } else {
      /* ── Day complete ── */
      const st = entry.status === 'on-time';
      if (ring)   ring.className = 'tch-ci-status-ring ring-done';
      if (icon)   icon.innerHTML = '<i data-lucide="badge-check"></i>';
      if (label)  label.textContent = 'Day Complete';
      if (timeEl) timeEl.textContent = `Out at ${entry.outTime.slice(0,5)} • ${calcDuration(entry.inTime, entry.outTime)}`;
      if (btn)    btn.style.display = 'none';
      if (outBtn) outBtn.style.display = 'none';
      if (hint)   hint.textContent = 'See you tomorrow!';
      if (badge)  { badge.style.display = ''; badge.textContent = '✓'; }
      setTxt('tchCiInTime',  entry.inTime.slice(0,5));
      setTxt('tchCiOutTime', entry.outTime.slice(0,5));
      setTxt('tchCiStatusVal', st ? 'On Time' : 'Late');
      setTxt('tchCiDuration', calcDuration(entry.inTime, entry.outTime));
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
    renderWeekGrid();
    renderCiLog();
  }

  function renderWeekGrid() {
    const grid = document.getElementById('tchCiWeekGrid');
    if (!grid) return;
    const log   = loadCiLog();
    const today = new Date();
    /* Build Mon–Fri of current week */
    const dayOfWeek = today.getDay(); /* 0=Sun */
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

    const days = ['Mon','Tue','Wed','Thu','Fri'];
    grid.innerHTML = days.map((d, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const dateStr = `${String(date.getDate()).padStart(2,'0')}/${String(date.getMonth()+1).padStart(2,'0')}/${date.getFullYear()}`;
      const entry = log.find(e => e.date === dateStr);
      const isFuture = date > today && dateStr !== todayStr();
      const isToday  = dateStr === todayStr();

      let cls = 'tch-week-day', icon = 'minus', sub = 'No record', color = '';
      if (isFuture) { cls += ' tch-week-future'; sub = '—'; }
      else if (entry && entry.inTime) {
        const st = entry.status === 'on-time';
        cls += st ? ' tch-week-present' : ' tch-week-late';
        icon = st ? 'check' : 'clock';
        sub = entry.inTime.slice(0,5);
        color = st ? '#16a34a' : '#d97706';
      } else { cls += ' tch-week-absent'; icon = 'x'; sub = 'Absent'; color = '#dc2626'; }
      if (isToday) cls += ' tch-week-today';

      return `<div class="${cls}">
        <div class="tch-week-icon-wrap" style="${color ? `color:${color};border-color:${color};` : ''}">
          <i data-lucide="${icon}" style="width:16px;height:16px;"></i>
        </div>
        <div class="tch-week-day-label">${d}</div>
        <div class="tch-week-date">${date.getDate()}</div>
        <div class="tch-week-sub">${sub}</div>
      </div>`;
    }).join('');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  function renderCiLog() {
    const list = document.getElementById('tchCiLogList');
    if (!list) return;
    const log = loadCiLog().slice(0, 30);
    if (!log.length) {
      list.innerHTML = `<div style="text-align:center;padding:32px 0;color:var(--text-light);font-size:0.84rem;">No attendance records yet.</div>`;
      return;
    }
    list.innerHTML = log.map(e => {
      const st = e.status === 'on-time';
      const statusBadge = e.outTime
        ? `<span class="ci-badge ${st ? 'ci-badge-ontime' : 'ci-badge-late'}">${st ? 'On Time' : 'Late'}</span>`
        : `<span class="ci-badge" style="background:rgba(99,102,241,0.1);color:var(--accent);">In School</span>`;
      return `<div class="ci-log-item">
        <div class="ci-log-icon ${st ? '' : 'ci-log-icon-late'}">
          <i data-lucide="${st ? 'check-circle' : 'clock'}"></i>
        </div>
        <div class="ci-log-meta">
          <div class="ci-log-name">${e.day || ''} ${e.date}</div>
          <div class="ci-log-time">In: ${e.inTime ? e.inTime.slice(0,5) : '—'} &nbsp;•&nbsp; Out: ${e.outTime ? e.outTime.slice(0,5) : '—'} &nbsp;•&nbsp; ${calcDuration(e.inTime, e.outTime)}</div>
        </div>
        ${statusBadge}
      </div>`;
    }).join('');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  window.tchCiExport = function () {
    const log = loadCiLog();
    const header = 'Date,Day,Clock-In,Clock-Out,Status,Duration\n';
    const rows = log.map(e =>
      `"${e.date}","${e.day || ''}","${e.inTime || ''}","${e.outTime || ''}","${e.status || ''}","${calcDuration(e.inTime, e.outTime)}"`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `teacher-attendance-${todayStr().replace(/\//g,'-')}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  /* Seed demo log so it's not empty first load */
  function seedDemoLog() {
    if (loadCiLog().length) return;
    const d = new Date();
    const days = ['Mon','Tue','Wed','Thu','Fri'];
    const dow  = d.getDay();
    const mon  = new Date(d);
    mon.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
    const demo = [];
    for (let i = 0; i < (dow === 0 ? 5 : dow - 1); i++) {
      const dd = new Date(mon);
      dd.setDate(mon.getDate() + i);
      const dStr = `${String(dd.getDate()).padStart(2,'0')}/${String(dd.getMonth()+1).padStart(2,'0')}/${dd.getFullYear()}`;
      const late = i === 2; /* Wednesday is late */
      demo.push({
        date:    dStr,
        inTime:  late ? '08:12:00' : '07:38:00',
        outTime: '15:35:00',
        status:  late ? 'late' : 'on-time',
        day:     days[i],
      });
    }
    saveCiLog(demo);
  }

  /* ── Init ───────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    seedDemoLog();
    startLiveClock('tchCiClock');
    initTimetableTab();
    renderClockInUI();
    /* Refresh duration display every minute for in-school teachers */
    setInterval(renderClockInUI, 60000);
  });

})();
