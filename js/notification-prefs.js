/* ================================================================
   ACAXEL — NOTIFICATION PREFERENCES (SMS / Email / Push)
   Lets each user choose which channel they want alerts on for fee
   bills, attendance, report cards and announcements. Since there's
   no real SMS gateway here, other modules (momo-payment.js,
   dashboard.js, etc.) call hcNotifyPrefs.isEnabled(...) and, if SMS
   is enabled, show a simulated "SMS from School" toast so the flow
   feels like a real low-data SMS-first alert system.
   ================================================================ */

(function (global) {
  'use strict';

  const KEY = 'hc_notify_prefs';
  const CHANNELS = ['sms', 'email', 'push'];
  const CATEGORIES = [
    { id: 'fees',          label: 'Fee bills & payment receipts' },
    { id: 'attendance',    label: 'Attendance alerts' },
    { id: 'reportCards',   label: 'Report card availability' },
    { id: 'announcements', label: 'School announcements' },
  ];

  const DEFAULTS = {
    sms:   { fees: true,  attendance: true,  reportCards: true,  announcements: false },
    email: { fees: true,  attendance: false, reportCards: true,  announcements: true  },
    push:  { fees: false, attendance: true,  reportCards: false, announcements: true  },
  };

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (!saved) return JSON.parse(JSON.stringify(DEFAULTS));
      // Merge with defaults in case new categories were added since last save
      CHANNELS.forEach(ch => { saved[ch] = Object.assign({}, DEFAULTS[ch], saved[ch]); });
      return saved;
    } catch { return JSON.parse(JSON.stringify(DEFAULTS)); }
  }

  function save(prefs) {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  }

  let _prefs = load();

  function isEnabled(channel, category) {
    return !!(_prefs[channel] && _prefs[channel][category]);
  }

  function set(channel, category, value) {
    if (!_prefs[channel]) _prefs[channel] = {};
    _prefs[channel][category] = value;
    save(_prefs);
  }

  /* ── Render a settings card into any container ───────────────── */
  function renderInto(containerSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    let html = `
      <div class="card" id="hcNotifyPrefsCard">
        <div class="card-header">
          <h3>Notification Preferences</h3>
          <span style="font-size:0.76rem;color:var(--text-light);">Choose how you'd like to be notified</span>
        </div>
        <div class="card-body" style="overflow-x:auto;">
          <table class="hc-notify-table">
            <thead>
              <tr>
                <th></th>
                <th><i data-lucide="message-square" style="width:14px;height:14px;"></i> SMS</th>
                <th><i data-lucide="mail" style="width:14px;height:14px;"></i> Email</th>
                <th><i data-lucide="bell" style="width:14px;height:14px;"></i> Push</th>
              </tr>
            </thead>
            <tbody>
              ${CATEGORIES.map(cat => `
                <tr>
                  <td class="hc-notify-cat">${cat.label}</td>
                  ${CHANNELS.map(ch => `
                    <td style="text-align:center;">
                      <input type="checkbox" class="hc-notify-check" data-channel="${ch}" data-cat="${cat.id}"
                        ${isEnabled(ch, cat.id) ? 'checked' : ''} />
                    </td>
                  `).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
          <p style="font-size:0.74rem;color:var(--text-light);margin-top:12px;margin-bottom:0;">
            SMS alerts are ideal for low-data connections — a text message is simulated below whenever a matching event happens (e.g. a fee payment).
          </p>
        </div>
      </div>`;

    container.innerHTML = html;

    if (!document.getElementById('hcNotifyStyles')) {
      const style = document.createElement('style');
      style.id = 'hcNotifyStyles';
      style.textContent = `
        .hc-notify-table { width: 100%; border-collapse: collapse; font-size: 0.86rem; }
        .hc-notify-table th { padding: 8px 10px; text-align: center; color: var(--text-light); font-weight: 600; font-size: 0.78rem; }
        .hc-notify-table th:first-child { text-align: left; }
        .hc-notify-table td { padding: 10px; border-top: 1px solid var(--border); }
        .hc-notify-cat { color: var(--text); font-weight: 500; }
        .hc-notify-check { width: 17px; height: 17px; accent-color: var(--accent); cursor: pointer; }
      `;
      document.head.appendChild(style);
    }

    container.querySelectorAll('.hc-notify-check').forEach(cb => {
      cb.addEventListener('change', () => {
        set(cb.dataset.channel, cb.dataset.cat, cb.checked);
        if (typeof showToast === 'function') showToast('Notification preferences saved!');
      });
    });

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  global.hcNotifyPrefs = { isEnabled, set, renderInto, getAll: () => _prefs };

})(window);
