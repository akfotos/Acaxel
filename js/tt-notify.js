/* ================================================================
   ACAXEL — TIMETABLE STAFF NOTIFICATION SCHEDULER
   Reads timetable data from localStorage (same format as
   admin-dashboard.js TT_DEFAULT / tt_<cls> keys).
   Fires in-app toasts and/or browser Notifications to teachers
   X minutes before their lesson, based on admin settings.
   ================================================================ */

(function () {
  const SETTINGS_KEY  = 'hc_ttn_settings';
  const FIRED_KEY     = 'hc_ttn_fired';       /* tracks fired alerts per day */
  const CLASSES       = ['JSS1A','JSS1B','JSS2A','JSS2B','JSS3A','JSS3B','SSS1A','SSS2A'];
  const DAYS          = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  /* Default timetable — mirrors admin-dashboard.js TT_DEFAULT */
  const TT_DEFAULT = {
    JSS2A: [
      { time: '7:30–8:00',   break: true  },
      { time: '8:00–8:45',   cells: ['Mathematics|Mr. Adeyemi','English|Mrs. Eze','Mathematics|Mr. Adeyemi','Basic Science|Mr. Bello','Social Studies|Mr. Mensah'] },
      { time: '8:45–9:30',   cells: ['English|Mrs. Eze','Mathematics|Mr. Adeyemi','Social Studies|Mr. Mensah','Mathematics|Mr. Adeyemi','English|Mrs. Eze'] },
      { time: '9:30–10:15',  cells: ['Basic Science|Mr. Bello','Social Studies|Mr. Mensah','English|Mrs. Eze','Civic Ed|Mr. Kofi','Mathematics|Mr. Adeyemi'] },
      { time: '10:15–10:30', break: true  },
      { time: '10:30–11:15', cells: ['Creative Arts|Mrs. Amoah','Basic Science|Mr. Bello','Civic Ed|Mr. Kofi','English|Mrs. Eze','Biology|Mrs. Garba'] },
      { time: '11:15–12:00', cells: ['Civic Ed|Mr. Kofi','Creative Arts|Mrs. Amoah','Biology|Mrs. Garba','Creative Arts|Mrs. Amoah','Basic Science|Mr. Bello'] },
      { time: '12:00–1:00',  break: true  },
      { time: '1:00–1:45',   cells: ['ICT|Mr. Agyei','PHE|Coach Adu','Mathematics|Mr. Adeyemi','ICT|Mr. Agyei','PHE|Coach Adu'] },
      { time: '1:45–2:30',   cells: ['PHE|Coach Adu','ICT|Mr. Agyei','Agric Science|Mr. Darko','Biology|Mrs. Garba','Revision / Free|—'] },
    ]
  };

  /* ── Settings ───────────────────────────────────────────────── */
  function defaultSettings() {
    return { enabled: true, leadTime: 10, method: 'both', activeDays: [1,2,3,4,5] };
  }
  function loadSettings() {
    try {
      const s = JSON.parse(localStorage.getItem(SETTINGS_KEY));
      return s ? Object.assign(defaultSettings(), s) : defaultSettings();
    } catch { return defaultSettings(); }
  }
  function saveSettingsData(s) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  }

  /* ── Fired tracker (reset daily) ───────────────────────────── */
  function loadFired() {
    const today = new Date().toLocaleDateString('en-GB');
    try {
      const f = JSON.parse(localStorage.getItem(FIRED_KEY) || '{}');
      if (f.date !== today) return {};
      return f.keys || {};
    } catch { return {}; }
  }
  function saveFired(keys) {
    localStorage.setItem(FIRED_KEY, JSON.stringify({ date: new Date().toLocaleDateString('en-GB'), keys }));
  }
  function markFired(key) {
    const f = loadFired(); f[key] = true; saveFired(f);
  }
  function wasFired(key) { return !!loadFired()[key]; }

  /* ── Timetable reader ───────────────────────────────────────── */
  function getTimetable(cls) {
    const stored = localStorage.getItem('tt_' + cls);
    if (stored) { try { return JSON.parse(stored); } catch {} }
    return TT_DEFAULT[cls] || [];
  }

  /* Parse "8:00–8:45" → start minutes-since-midnight */
  function parseStartMins(timeStr) {
    const match = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (!match) return null;
    return parseInt(match[1]) * 60 + parseInt(match[2]);
  }

  /* ── Collect all lessons for today ─────────────────────────── */
  function getTodaysLessons(dayIndex) {
    /* dayIndex: 0=Sun … 6=Sat; timetable cols: 0=Mon … 4=Fri */
    const colIndex = dayIndex - 1; /* Mon=0 … Fri=4 */
    if (colIndex < 0 || colIndex > 4) return [];
    const lessons = [];
    CLASSES.forEach(cls => {
      const rows = getTimetable(cls);
      rows.forEach(row => {
        if (row.break) return;
        const cellVal = (row.cells || [])[colIndex] || '';
        const [subj, teacher] = cellVal.split('|');
        if (!subj || subj === '—' || !teacher || teacher === '—' || teacher === '') return;
        const startMins = parseStartMins(row.time);
        if (startMins === null) return;
        lessons.push({ cls, subj: subj.trim(), teacher: teacher.trim(), time: row.time, startMins });
      });
    });
    return lessons;
  }

  /* ── Show in-app toast ─────────────────────────────────────── */
  function showToast(teacher, subj, cls, time, leadTime) {
    /* Create or reuse toast container */
    let container = document.getElementById('ttnToastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'ttnToastContainer';
      container.className = 'ttn-toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'ttn-toast';
    toast.innerHTML = `
      <div class="ttn-toast-icon"><i data-lucide="bell-ring"></i></div>
      <div class="ttn-toast-body">
        <div class="ttn-toast-title">${teacher} — Class in ${leadTime} min</div>
        <div class="ttn-toast-sub">${subj} &bull; ${cls} &bull; ${time}</div>
      </div>
      <button class="ttn-toast-close" onclick="this.closest('.ttn-toast').remove()">
        <i data-lucide="x"></i>
      </button>`;
    container.appendChild(toast);
    if (typeof lucide !== 'undefined') lucide.createIcons();

    /* Auto-dismiss after 12 seconds */
    setTimeout(() => { toast.classList.add('ttn-toast-out'); setTimeout(() => toast.remove(), 400); }, 12000);

    /* Slide in */
    requestAnimationFrame(() => toast.classList.add('ttn-toast-in'));
  }

  /* ── Browser notification ──────────────────────────────────── */
  function showBrowserNotif(teacher, subj, cls, time, leadTime) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    new Notification(`📚 ${teacher} — Class in ${leadTime} min`, {
      body: `${subj} | ${cls} | ${time}`,
      icon: 'img/logo.png',
      tag:  `ttn-${teacher}-${time}`,
    });
  }

  /* ── Fire an alert ─────────────────────────────────────────── */
  function fireAlert(lesson, settings) {
    const { teacher, subj, cls, time } = lesson;
    const method = settings.method;
    if (method === 'both' || method === 'inapp') {
      showToast(teacher, subj, cls, time, settings.leadTime);
    }
    if (method === 'both' || method === 'browser') {
      showBrowserNotif(teacher, subj, cls, time, settings.leadTime);
    }
    updateStatusText(`Last alert: ${teacher} for ${subj} (${cls}) at ${new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}`);
  }

  /* ── Main scheduler tick (runs every 30 seconds) ───────────── */
  function tick() {
    const settings = loadSettings();
    settings.enabled = true; /* notifications are always forced on */

    const now       = new Date();
    const dayIndex  = now.getDay();
    const nowMins   = now.getHours() * 60 + now.getMinutes();
    const todaySec  = now.getSeconds();

    if (!settings.activeDays.includes(dayIndex)) return;

    const lessons = getTodaysLessons(dayIndex);
    lessons.forEach(lesson => {
      const triggerMins = lesson.startMins - settings.leadTime;
      /* Fire when we're within a 1-minute window of the trigger time */
      if (nowMins === triggerMins || (nowMins === triggerMins && todaySec < 60)) {
        const key = `${lesson.cls}|${lesson.teacher}|${lesson.startMins}`;
        if (!wasFired(key)) {
          markFired(key);
          fireAlert(lesson, settings);
        }
      }
    });
  }

  /* ── UI helpers ─────────────────────────────────────────────── */
  function updateStatusText(text) {
    const el = document.getElementById('ttnStatusText');
    if (el) el.textContent = text;
    const dot = document.getElementById('ttnStatusDot');
    if (dot) dot.className = 'ttn-status-dot ttn-dot-active'; /* always active */
  }

  /* ── Public: save settings from form ───────────────────────── */
  window.ttnSaveSettings = function () {
    const leadTime  = parseInt(document.getElementById('ttnLeadTime')?.value || '10');
    const method    = document.getElementById('ttnMethod')?.value || 'both';
    const dayBoxes  = document.querySelectorAll('.ttn-day-chip input[type=checkbox]');
    const activeDays = Array.from(dayBoxes).filter(c => c.checked).map(c => parseInt(c.value));

    const settings = { enabled: true, leadTime, method, activeDays }; /* always forced on */
    saveSettingsData(settings);
    updateStatusText(`Active — alerting ${leadTime} min before each lesson`);
  };

  /* ── Public: request browser notification permission ────────── */
  window.ttnRequestPermission = function () {
    if (!('Notification' in window)) {
      alert('Browser notifications are not supported in this browser.');
      return;
    }
    Notification.requestPermission().then(perm => {
      if (perm === 'granted') {
        updateStatusText('Browser notifications: granted ✓');
        new Notification('Acaxel — Notifications enabled', {
          body: 'Staff class reminders will appear here.',
        });
      } else {
        updateStatusText('Browser notifications: blocked by browser');
      }
    });
  };

  /* ── Public: send a test alert ──────────────────────────────── */
  window.ttnTestAlert = function () {
    const settings = loadSettings();
    showToast('Mr. Adeyemi', 'Mathematics', 'JSS 2A', '8:00–8:45', settings.leadTime);
    if (settings.method !== 'inapp') {
      showBrowserNotif('Mr. Adeyemi', 'Mathematics', 'JSS 2A', '8:00–8:45', settings.leadTime);
    }
    updateStatusText('Test alert sent');
  };

  /* ── Restore form state from saved settings ─────────────────── */
  function restoreFormState() {
    const s = loadSettings();
    const setEl = (id, val) => { const e = document.getElementById(id); if (e) e.value = val; };
    const cb    = (id, val) => { const e = document.getElementById(id); if (e) e.checked = val; };

    setEl('ttnLeadTime', String(s.leadTime));
    setEl('ttnMethod', s.method);

    const dayBoxes = document.querySelectorAll('.ttn-day-chip input[type=checkbox]');
    dayBoxes.forEach(box => {
      box.checked = s.activeDays.includes(parseInt(box.value));
    });

    /* Force save enabled=true on every page load */
    saveSettingsData(Object.assign(s, { enabled: true }));
    updateStatusText(`Active — alerting ${s.leadTime} min before each lesson`);
  }

  /* ── Init ───────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    restoreFormState();

    /* Run scheduler every 30 seconds */
    setInterval(tick, 30000);
    /* Also run immediately in case page loads close to a trigger */
    setTimeout(tick, 2000);
  });

})();
