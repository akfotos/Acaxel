/* ================================================================
   ACAXEL — MOBILE MONEY PAYMENT FLOW (MTN MoMo / Telecel Cash / AirtelTigo Money)
   Self-contained module: injects its own modal + styles, works on any
   dashboard that includes this script. No server/API keys required —
   this simulates the real MoMo prompt-and-approve flow used by Ghanaian
   payment gateways (Paystack / Hubtel / Flutterwave) for demo purposes.

   Usage:
     window.openMomoPayment({
       amount: 12500,
       title: 'Exam Fee — Term 2',
       subtitle: 'Djaba Emily · Grade 1',
       reference: 'INV-2026-004',
       onSuccess: function (result) { ... }
     });
   ================================================================ */

(function (global) {
  'use strict';

  const NETWORKS = [
    { id: 'mtn',      label: 'MTN Mobile Money', short: 'MTN MoMo',    color: '#FFCC08', text: '#111', prefixes: ['024','054','055','059','025'] },
    { id: 'telecel',  label: 'Telecel Cash',      short: 'Telecel Cash', color: '#E60000', text: '#fff', prefixes: ['020','050'] },
    { id: 'airteltigo', label: 'AirtelTigo Money', short: 'AirtelTigo', color: '#0033A0', text: '#fff', prefixes: ['026','056','027','057'] },
  ];

  const TXN_KEY = 'hc_momo_transactions';
  let _current = null; // holds the options passed to openMomoPayment

  function detectNetwork(phone) {
    const digits = phone.replace(/\D/g, '');
    const prefix = digits.startsWith('233') ? '0' + digits.slice(3, 5) : digits.slice(0, 3);
    return NETWORKS.find(n => n.prefixes.includes(prefix)) || null;
  }

  function fmtGHS(n) {
    return '₵' + Number(n || 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function logTransaction(txn) {
    try {
      const list = JSON.parse(localStorage.getItem(TXN_KEY) || '[]');
      list.unshift(txn);
      localStorage.setItem(TXN_KEY, JSON.stringify(list.slice(0, 100)));
    } catch {}
  }

  function genReference() {
    return 'MOMO-' + Date.now().toString().slice(-8) + '-' + Math.floor(Math.random() * 900 + 100);
  }

  /* ── Build modal markup once ──────────────────────────────────── */
  function ensureModal() {
    if (document.getElementById('momoModal')) return;

    const style = document.createElement('style');
    style.id = 'momoStyles';
    style.textContent = `
      #momoModal.momo-overlay {
        position: fixed; inset: 0; background: rgba(10,10,15,0.55);
        display: flex; align-items: center; justify-content: center;
        z-index: 100000; opacity: 0; pointer-events: none; transition: opacity 0.2s;
        font-family: inherit;
      }
      #momoModal.momo-overlay.open { opacity: 1; pointer-events: all; }
      .momo-card {
        background: #fff; color: #1c1917; width: 92%; max-width: 400px;
        border-radius: 18px; overflow: hidden; transform: translateY(16px);
        transition: transform 0.2s; box-shadow: 0 20px 60px rgba(0,0,0,0.35);
      }
      #momoModal.momo-overlay.open .momo-card { transform: translateY(0); }
      .momo-head {
        padding: 18px 20px; display: flex; align-items: center; justify-content: space-between;
        background: linear-gradient(135deg,#722F37,#8a3a44); color: #fff;
      }
      .momo-head h3 { font-size: 1rem; font-weight: 700; margin: 0; }
      .momo-head .momo-close { cursor: pointer; opacity: 0.85; font-size: 1.1rem; }
      .momo-body { padding: 22px 22px 24px; }
      .momo-amount-box { text-align: center; margin-bottom: 18px; }
      .momo-amount-box .amt { font-size: 1.9rem; font-weight: 800; color: #722F37; }
      .momo-amount-box .desc { font-size: 0.82rem; color: #6b7280; margin-top: 4px; }
      .momo-networks { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; margin-bottom: 18px; }
      .momo-net-btn {
        border: 2px solid #e5e7eb; border-radius: 12px; padding: 10px 6px; cursor: pointer;
        text-align: center; font-size: 0.72rem; font-weight: 700; transition: all 0.15s; background: #fff;
      }
      .momo-net-btn .momo-net-swatch { width: 26px; height: 26px; border-radius: 50%; margin: 0 auto 6px; }
      .momo-net-btn.selected { border-color: #722F37; box-shadow: 0 0 0 3px rgba(114,47,55,0.12); }
      .momo-field { margin-bottom: 14px; }
      .momo-field label { display: block; font-size: 0.78rem; font-weight: 600; color: #44403c; margin-bottom: 6px; }
      .momo-field input {
        width: 100%; padding: 11px 14px; border: 1.5px solid #e5e7eb; border-radius: 10px;
        font-size: 0.95rem; box-sizing: border-box;
      }
      .momo-field input:focus { outline: none; border-color: #722F37; }
      .momo-hint { font-size: 0.72rem; color: #9ca3af; margin-top: 4px; }
      .momo-pay-btn {
        width: 100%; padding: 13px; border: none; border-radius: 10px; background: #722F37; color: #fff;
        font-weight: 700; font-size: 0.95rem; cursor: pointer; transition: opacity 0.15s;
      }
      .momo-pay-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      .momo-pay-btn:hover:not(:disabled) { opacity: 0.92; }
      .momo-state { display: none; text-align: center; padding: 10px 4px 4px; }
      .momo-state.active { display: block; }
      .momo-spinner {
        width: 46px; height: 46px; border-radius: 50%; margin: 6px auto 18px;
        border: 4px solid #f3e8e9; border-top-color: #722F37; animation: momo-spin 0.8s linear infinite;
      }
      @keyframes momo-spin { to { transform: rotate(360deg); } }
      .momo-state h4 { font-size: 1rem; margin: 0 0 6px; }
      .momo-state p { font-size: 0.84rem; color: #6b7280; margin: 0 0 4px; }
      .momo-check {
        width: 56px; height: 56px; border-radius: 50%; background: #dcfce7; color: #16a34a;
        display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 1.6rem;
      }
      .momo-receipt {
        background: #f9fafb; border: 1px solid #eee; border-radius: 10px; padding: 12px 16px;
        margin: 14px 0; text-align: left; font-size: 0.8rem;
      }
      .momo-receipt div { display: flex; justify-content: space-between; padding: 3px 0; }
      .momo-receipt div span:first-child { color: #6b7280; }
      .momo-receipt div span:last-child { font-weight: 600; }
      .momo-done-btn {
        width: 100%; padding: 12px; border: none; border-radius: 10px; background: #16a34a; color: #fff;
        font-weight: 700; cursor: pointer; margin-top: 4px;
      }
      .momo-sms-toast {
        position: fixed; bottom: 24px; left: 24px; z-index: 100001; background: #1c1917; color: #fff;
        padding: 12px 16px; border-radius: 12px; max-width: 300px; font-size: 0.78rem; line-height: 1.4;
        box-shadow: 0 8px 24px rgba(0,0,0,0.3); display: flex; gap: 10px; opacity: 0; transform: translateY(12px);
        transition: opacity 0.25s, transform 0.25s;
      }
      .momo-sms-toast.show { opacity: 1; transform: translateY(0); }
      .momo-sms-toast .sms-icon { flex-shrink: 0; font-size: 1.1rem; }
      .momo-sms-toast .sms-label { font-weight: 700; color: #a3e635; display: block; margin-bottom: 2px; }
    `;
    document.head.appendChild(style);

    const wrap = document.createElement('div');
    wrap.id = 'momoModal';
    wrap.className = 'momo-overlay';
    wrap.innerHTML = `
      <div class="momo-card">
        <div class="momo-head">
          <h3>Pay with Mobile Money</h3>
          <span class="momo-close" id="momoCloseBtn">&#10005;</span>
        </div>
        <div class="momo-body">

          <div class="momo-state active" id="momoStepForm">
            <div class="momo-amount-box">
              <div class="amt" id="momoAmt">₵0.00</div>
              <div class="desc" id="momoDesc">&nbsp;</div>
            </div>
            <div class="momo-networks" id="momoNetworks"></div>
            <div class="momo-field">
              <label>Mobile Money Number</label>
              <input type="tel" id="momoPhone" placeholder="e.g. 024 123 4567" maxlength="10" />
              <div class="momo-hint">You'll receive a prompt on this number to approve payment.</div>
            </div>
            <button class="momo-pay-btn" id="momoPayBtn" disabled>Confirm &amp; Pay</button>
          </div>

          <div class="momo-state" id="momoStepProcessing">
            <div class="momo-spinner"></div>
            <h4>Waiting for approval...</h4>
            <p>A prompt has been sent to <strong id="momoProcPhone"></strong>.<br/>Please approve on your phone.</p>
          </div>

          <div class="momo-state" id="momoStepSuccess">
            <div class="momo-check">&#10003;</div>
            <h4>Payment Successful</h4>
            <p>Your payment has been received.</p>
            <div class="momo-receipt">
              <div><span>Reference</span><span id="rcptRef"></span></div>
              <div><span>Network</span><span id="rcptNet"></span></div>
              <div><span>Amount</span><span id="rcptAmt"></span></div>
              <div><span>Date</span><span id="rcptDate"></span></div>
            </div>
            <button class="momo-done-btn" id="momoDoneBtn">Done</button>
          </div>

        </div>
      </div>
    `;
    document.body.appendChild(wrap);

    // Render network buttons
    const netContainer = wrap.querySelector('#momoNetworks');
    netContainer.innerHTML = NETWORKS.map(n => `
      <div class="momo-net-btn" data-net="${n.id}">
        <div class="momo-net-swatch" style="background:${n.color};"></div>
        ${n.short}
      </div>
    `).join('');

    // Wire up interactions
    wrap.addEventListener('click', e => { if (e.target === wrap) closeMomoModal(); });
    document.getElementById('momoCloseBtn').addEventListener('click', closeMomoModal);
    netContainer.querySelectorAll('.momo-net-btn').forEach(btn => {
      btn.addEventListener('click', () => selectNetwork(btn.dataset.net));
    });
    document.getElementById('momoPhone').addEventListener('input', onPhoneInput);
    document.getElementById('momoPayBtn').addEventListener('click', submitPayment);
    document.getElementById('momoDoneBtn').addEventListener('click', () => {
      closeMomoModal();
      if (_current && typeof _current.onSuccess === 'function') _current.onSuccess(_current._result);
    });
  }

  let _selectedNetwork = null;

  function selectNetwork(id) {
    _selectedNetwork = NETWORKS.find(n => n.id === id);
    document.querySelectorAll('.momo-net-btn').forEach(b => b.classList.toggle('selected', b.dataset.net === id));
    validateForm();
  }

  function onPhoneInput(e) {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
    e.target.value = digits;
    const auto = detectNetwork(digits);
    if (auto && (!_selectedNetwork || digits.length >= 3)) selectNetwork(auto.id);
    validateForm();
  }

  function validateForm() {
    const phone = document.getElementById('momoPhone').value.replace(/\D/g, '');
    const ok = _selectedNetwork && /^0\d{9}$/.test(phone);
    document.getElementById('momoPayBtn').disabled = !ok;
  }

  function showStep(id) {
    document.querySelectorAll('.momo-state').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  }

  function submitPayment() {
    const phone = document.getElementById('momoPhone').value.replace(/\D/g, '');
    document.getElementById('momoProcPhone').textContent = phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
    showStep('momoStepProcessing');

    setTimeout(() => {
      const ref = genReference();
      const now = new Date();
      const result = {
        reference: ref,
        network: _selectedNetwork.short,
        phone: phone,
        amount: _current.amount,
        title: _current.title,
        date: now.toISOString(),
      };
      document.getElementById('rcptRef').textContent = ref;
      document.getElementById('rcptNet').textContent = _selectedNetwork.short;
      document.getElementById('rcptAmt').textContent = fmtGHS(_current.amount);
      document.getElementById('rcptDate').textContent = now.toLocaleString('en-GH', { dateStyle: 'medium', timeStyle: 'short' });
      showStep('momoStepSuccess');

      logTransaction(result);
      _current._result = result;

      // Simulated SMS receipt (respects notification preferences if module present)
      if (!global.hcNotifyPrefs || global.hcNotifyPrefs.isEnabled('sms', 'fees')) {
        showSmsToast(`Payment of ${fmtGHS(_current.amount)} received for "${_current.title}". Ref: ${ref}. Thank you — ${(window.schoolData && window.schoolData.getSchoolInfo().shortName) || 'Acaxel'} School.`);
      }
    }, 2200);
  }

  function showSmsToast(message) {
    const toast = document.createElement('div');
    toast.className = 'momo-sms-toast';
    toast.innerHTML = `<span class="sms-icon">&#128241;</span><span><span class="sms-label">SMS from School</span>${message}</span>`;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 6000);
  }
  global.showSmsToast = showSmsToast;

  function closeMomoModal() {
    document.getElementById('momoModal')?.classList.remove('open');
  }

  function resetForm() {
    _selectedNetwork = null;
    document.querySelectorAll('.momo-net-btn').forEach(b => b.classList.remove('selected'));
    const phoneEl = document.getElementById('momoPhone');
    if (phoneEl) phoneEl.value = '';
    document.getElementById('momoPayBtn').disabled = true;
    showStep('momoStepForm');
  }

  /* ── Public API ───────────────────────────────────────────────── */
  function openMomoPayment(options) {
    options = options || {};
    ensureModal();
    resetForm();
    _current = options;
    document.getElementById('momoAmt').textContent = fmtGHS(options.amount);
    document.getElementById('momoDesc').textContent = [options.title, options.subtitle].filter(Boolean).join(' · ');
    document.getElementById('momoModal').classList.add('open');
  }

  global.openMomoPayment = openMomoPayment;
  global.getMomoTransactions = function () {
    try { return JSON.parse(localStorage.getItem(TXN_KEY) || '[]'); } catch { return []; }
  };

})(window);
