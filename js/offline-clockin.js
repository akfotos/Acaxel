/* ================================================================
   ACAXEL — OFFLINE CLOCK-IN CACHE MANAGER
   Works across all dashboards.
   - Detects online/offline status in real time.
   - Shows a persistent banner when offline.
   - Tags any clock-in performed while offline as { offline: true }.
   - On reconnect, marks queued entries as synced and notifies user.
   - All data stays in localStorage — no server required.
   ================================================================ */

(function () {

  const OFFLINE_QUEUE_KEY = 'hc_ci_offline_queue';
  const BANNER_ID         = 'hcOfflineBanner';

  /* ── Queue helpers ─────────────────────────────────────────── */
  function loadQueue() {
    try { return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]'); }
    catch { return []; }
  }
  function saveQueue(q) {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(q));
  }
  function queueEntry(entry) {
    const q = loadQueue();
    /* Avoid duplicates by id */
    if (!q.find(e => e.id === entry.id)) {
      q.push(Object.assign({}, entry, { offline: true, queuedAt: new Date().toISOString() }));
      saveQueue(q);
    }
  }
  function clearQueue() {
    saveQueue([]);
  }

  /* ── Banner ────────────────────────────────────────────────── */
  function getBanner() {
    return document.getElementById(BANNER_ID);
  }

  function createBanner() {
    if (getBanner()) return;
    const bar = document.createElement('div');
    bar.id = BANNER_ID;
    bar.innerHTML = `
      <span class="hc-offline-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round"
             stroke-linejoin="round">
          <line x1="1" y1="1" x2="23" y2="23"/>
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
          <path d="M10.71 5.05A16 16 0 0 1 22.56 9"/>
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
          <circle cx="12" cy="20" r="1"/>
        </svg>
      </span>
      <span class="hc-offline-text">
        <strong>You're offline</strong> — Clock-in records are being saved locally and will sync automatically when you reconnect.
      </span>
      <span class="hc-offline-queue" id="hcOfflineCount"></span>`;
    document.body.appendChild(bar);
  }

  function showBanner() {
    createBanner();
    const bar = getBanner();
    if (bar) {
      bar.classList.add('hc-offline-show');
      updateQueueCount();
    }
  }

  function hideBanner() {
    const bar = getBanner();
    if (bar) bar.classList.remove('hc-offline-show');
  }

  function updateQueueCount() {
    const el = document.getElementById('hcOfflineCount');
    if (!el) return;
    const n = loadQueue().length;
    el.textContent = n > 0 ? `${n} record${n > 1 ? 's' : ''} pending sync` : '';
    el.style.display = n > 0 ? 'inline-flex' : 'none';
  }

  /* ── Sync on reconnect ─────────────────────────────────────── */
  function syncOfflineQueue() {
    const q = loadQueue();
    if (!q.length) return;

    /* Mark all queued entries as synced in their respective log keys */
    const logKeys = [
      'hc_tch_ci_log',    /* teacher */
      'hc_stu_ci_log',    /* student */
      'hc_clockin_log',   /* parent / admin */
    ];

    logKeys.forEach(key => {
      try {
        const log = JSON.parse(localStorage.getItem(key) || '[]');
        let changed = false;
        log.forEach(entry => {
          const queued = q.find(qe => qe.id === entry.id || (qe.date === entry.date && qe.inTime === entry.inTime));
          if (queued && entry.offline) {
            entry.offline = false;
            entry.syncedAt = new Date().toISOString();
            changed = true;
          }
        });
        if (changed) localStorage.setItem(key, JSON.stringify(log));
      } catch {}
    });

    clearQueue();
    showSyncToast(q.length);
  }

  /* ── Toast on sync ─────────────────────────────────────────── */
  function showSyncToast(count) {
    const toast = document.createElement('div');
    toast.className = 'hc-sync-toast';
    toast.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
           stroke="#16a34a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 6L9 17l-5-5"/>
      </svg>
      Back online — ${count} clock-in record${count > 1 ? 's' : ''} synced successfully.`;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('hc-sync-toast-in'));
    setTimeout(() => {
      toast.classList.remove('hc-sync-toast-in');
      setTimeout(() => toast.remove(), 400);
    }, 4000);
  }

  /* ── Patch clock-in save functions to tag offline entries ──── */
  function patchSaveFunction(key) {
    /* Intercept localStorage.setItem for this key to tag offline entries */
    const origSetItem = localStorage.setItem.bind(localStorage);
    const _patch = function (k, v) {
      if (k === key && !navigator.onLine) {
        try {
          const entries = JSON.parse(v);
          if (Array.isArray(entries) && entries.length) {
            const latest = entries[0];
            if (latest && !latest.offline) {
              latest.offline = true;
              if (!latest.id) latest.id = `ci-${Date.now()}`;
              queueEntry(latest);
              updateQueueCount();
              return origSetItem(k, JSON.stringify(entries));
            }
          }
        } catch {}
      }
      return origSetItem(k, v);
    };
    return _patch;
  }

  /* ── Public: expose queue accessor for other modules ────────── */
  window.hcOfflineCI = {
    queueEntry,
    loadQueue,
    isOffline: () => !navigator.onLine,
  };

  /* ── Init ───────────────────────────────────────────────────── */
  function init() {
    /* Inject styles */
    if (!document.getElementById('hcOfflineStyles')) {
      const style = document.createElement('style');
      style.id = 'hcOfflineStyles';
      style.textContent = `
        #hcOfflineBanner {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 99999;
          background: #1c1917;
          color: #fef3c7;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 20px;
          font-size: 0.82rem;
          font-weight: 500;
          border-bottom: 2px solid #d97706;
          transform: translateY(-100%);
          transition: transform 0.3s cubic-bezier(0.4,0,0.2,1);
          font-family: inherit;
        }
        #hcOfflineBanner.hc-offline-show { transform: translateY(0); }
        .hc-offline-icon { flex-shrink: 0; color: #fbbf24; display: flex; }
        .hc-offline-text { flex: 1; }
        .hc-offline-queue {
          display: inline-flex;
          align-items: center;
          background: rgba(217,119,6,0.25);
          border: 1px solid rgba(217,119,6,0.5);
          color: #fbbf24;
          border-radius: 20px;
          padding: 2px 10px;
          font-size: 0.74rem;
          font-weight: 700;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .hc-sync-toast {
          position: fixed;
          bottom: 28px; right: 24px;
          z-index: 99999;
          background: #f0fdf4;
          border: 1.5px solid #86efac;
          color: #15803d;
          border-radius: 12px;
          padding: 12px 18px;
          font-size: 0.82rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
          opacity: 0;
          transform: translateY(12px);
          transition: opacity 0.28s, transform 0.28s;
          font-family: inherit;
        }
        .hc-sync-toast.hc-sync-toast-in { opacity: 1; transform: translateY(0); }
      `;
      document.head.appendChild(style);
    }

    /* Patch localStorage.setItem for all clock-in log keys */
    const patchedSetItem = (function () {
      const orig = localStorage.setItem.bind(localStorage);
      return function (key, value) {
        const CI_KEYS = ['hc_tch_ci_log', 'hc_stu_ci_log', 'hc_clockin_log'];
        if (CI_KEYS.includes(key) && !navigator.onLine) {
          try {
            const entries = JSON.parse(value);
            if (Array.isArray(entries) && entries.length) {
              const latest = entries[0];
              if (latest && !latest.offline) {
                latest.offline = true;
                if (!latest.id) latest.id = `ci-${Date.now()}`;
                queueEntry(latest);
                updateQueueCount();
                return orig(key, JSON.stringify(entries));
              }
            }
          } catch {}
        }
        return orig(key, value);
      };
    })();
    localStorage.setItem = patchedSetItem;

    /* Initial state */
    if (!navigator.onLine) showBanner();

    /* React to connectivity changes */
    window.addEventListener('offline', () => {
      showBanner();
    });

    window.addEventListener('online', () => {
      hideBanner();
      syncOfflineQueue();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
