// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  const user = JSON.parse(localStorage.getItem('hc_user') || '{}');
  if (user.name) {
    const av = document.getElementById('topnavAvatar');
    if (av) av.textContent = user.name.charAt(0).toUpperCase();
    const nm = document.getElementById('topnavName');
    if (nm) nm.textContent = user.name;
    const pa = document.getElementById('profileAvatar');
    if (pa) pa.textContent = user.name.charAt(0).toUpperCase();
    const pn = document.getElementById('profileName');
    if (pn) pn.textContent = user.name;
  }
  const today = new Date().toISOString().split('T')[0];
  document.querySelectorAll('input[type="date"]').forEach(d => { if (!d.value) d.value = today; });
  // Restore sidebar collapsed state
  if (localStorage.getItem('hc_sidebar_collapsed') === '1' && window.innerWidth > 768) {
    document.querySelector('.dash-body')?.classList.add('sidebar-collapsed');
    document.querySelector('.dash-sidebar')?.classList.add('collapsed');
  }
  // Highlight today's day box in all calendar strips
  const todayIdx = getTodayDayIndex();
  document.querySelectorAll('.bs-calendar-strip').forEach(strip => {
    strip.querySelectorAll('.bs-day-box').forEach((box, i) => {
      box.classList.toggle('bs-day-active', i === todayIdx);
    });
  });
  // Render schedules
  initSchedules();
});

// ===== TAB SWITCHING =====
function switchTab(tabId, btn) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const panel = document.getElementById('tab-' + tabId);
  if (panel) panel.classList.add('active');
  if (btn) btn.classList.add('active');
  // close mobile sidebar on nav
  if (window.innerWidth <= 768) closeSidebar();
}

// ===== SIDEBAR =====
function toggleSidebar() {
  const body = document.querySelector('.dash-body');
  const sidebar = document.querySelector('.dash-sidebar');
  if (window.innerWidth <= 768) {
    // mobile: slide in/out
    const overlay = document.getElementById('sidebarOverlay');
    sidebar?.classList.toggle('mobile-open');
    overlay?.classList.toggle('open');
  } else {
    // desktop: collapse/expand
    body?.classList.toggle('sidebar-collapsed');
    sidebar?.classList.toggle('collapsed');
    // persist state
    const collapsed = sidebar?.classList.contains('collapsed');
    localStorage.setItem('hc_sidebar_collapsed', collapsed ? '1' : '0');
  }
}

function closeSidebar() {
  document.querySelector('.dash-sidebar')?.classList.remove('mobile-open');
  document.getElementById('sidebarOverlay')?.classList.remove('open');
}

function openSidebar() {
  if (window.innerWidth <= 768) {
    document.querySelector('.dash-sidebar')?.classList.add('mobile-open');
    document.getElementById('sidebarOverlay')?.classList.add('open');
  }
}

// ===== NOTIFICATIONS =====
function toggleNotif() {
  const panel = document.getElementById('notifPanel');
  const backdrop = document.getElementById('notifBackdrop');
  const isOpen = panel?.classList.contains('open');
  if (isOpen) {
    closeNotif();
  } else {
    panel?.classList.add('open');
    backdrop?.classList.add('open');
    lucide.createIcons();
  }
}

function closeNotif() {
  document.getElementById('notifPanel')?.classList.remove('open');
  document.getElementById('notifBackdrop')?.classList.remove('open');
}

function switchNotifTab(category, btn) {
  document.querySelectorAll('.notif-tab').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  document.querySelectorAll('#notifList .notif-item').forEach(item => {
    item.style.display = (category === 'all' || item.dataset.category === category) ? '' : 'none';
  });
}

function markRead(item) {
  if (!item.classList.contains('unread')) return;
  item.classList.remove('unread');
  const dot = item.querySelector('.notif-unread-dot');
  if (dot) dot.remove();
  updateNotifCount();
}

function markAllRead() {
  document.querySelectorAll('#notifList .notif-item.unread').forEach(item => {
    item.classList.remove('unread');
    const dot = item.querySelector('.notif-unread-dot');
    if (dot) dot.remove();
  });
  updateNotifCount();
}

function updateNotifCount() {
  const unread = document.querySelectorAll('#notifList .notif-item.unread').length;
  const countEl = document.getElementById('notifCount');
  if (countEl) {
    countEl.textContent = unread;
    countEl.style.display = unread > 0 ? '' : 'none';
  }
  const allBadge = document.getElementById('notifBadgeAll');
  if (allBadge) {
    allBadge.textContent = unread;
    allBadge.style.display = unread > 0 ? '' : 'none';
  }
}

// ===== TODAY'S SCHEDULE =====

// Schedule data keyed by role and day index (0=Mon … 4=Fri)
const SCHEDULES = {
  teacher: [
    [ // Monday
      { time: '7:30 – 8:00',  subject: 'Staff Briefing',        dots: [] },
      { time: '8:15 – 9:00',  subject: 'Maths — JSS 2A',        dots: [{ cls: 'bs-dot-green',  label: '38' }] },
      { time: '9:00 – 9:45',  subject: 'Maths — JSS 2B',        dots: [{ cls: 'bs-dot-orange', label: '34' }] },
      { time: '10:00 – 10:45',subject: 'Further Maths — SSS 1', dots: [{ cls: 'bs-dot-green',  label: '28' }] },
      { time: '2:00 – 3:00',  subject: 'Marking / Prep',        dots: [] },
    ],
    [ // Tuesday
      { time: '8:15 – 9:00',  subject: 'Maths — JSS 2A',        dots: [{ cls: 'bs-dot-green',  label: '38' }] },
      { time: '9:00 – 9:45',  subject: 'Maths — SSS 2',         dots: [{ cls: 'bs-dot-green',  label: '32' }] },
      { time: '11:00 – 11:45',subject: 'Remedial — JSS 2A',     dots: [] },
      { time: '2:00 – 3:00',  subject: 'Exam Prep — SSS 1',     dots: [] },
    ],
    [ // Wednesday
      { time: '7:30 – 8:00',  subject: 'Staff Briefing',        dots: [] },
      { time: '8:15 – 9:00',  subject: 'Maths — JSS 2A',        dots: [{ cls: 'bs-dot-green',  label: '38' }] },
      { time: '9:00 – 9:45',  subject: 'Maths — JSS 2B',        dots: [{ cls: 'bs-dot-orange', label: '34' }] },
      { time: '10:00 – 10:45',subject: 'Further Maths — SSS 1', dots: [{ cls: 'bs-dot-green',  label: '28' }] },
      { time: '11:00 – 11:45',subject: 'Remedial — JSS 2A',     dots: [] },
      { time: '2:00 – 3:00',  subject: 'Marking / Prep',        dots: [] },
    ],
    [ // Thursday
      { time: '8:15 – 9:00',  subject: 'Maths — JSS 2B',        dots: [{ cls: 'bs-dot-orange', label: '34' }] },
      { time: '9:00 – 9:45',  subject: 'Further Maths — SSS 1', dots: [{ cls: 'bs-dot-green',  label: '28' }] },
      { time: '10:00 – 10:45',subject: 'Maths — JSS 2A',        dots: [{ cls: 'bs-dot-green',  label: '38' }] },
      { time: '2:00 – 3:00',  subject: 'Dept. Meeting',         dots: [] },
    ],
    [ // Friday
      { time: '8:15 – 9:00',  subject: 'Maths — JSS 2A',        dots: [{ cls: 'bs-dot-green',  label: '38' }] },
      { time: '9:00 – 9:45',  subject: 'Maths — SSS 2',         dots: [{ cls: 'bs-dot-green',  label: '32' }] },
      { time: '11:00 – 11:45',subject: 'Quiz / Test — JSS 2A',  dots: [] },
      { time: '2:00 – 3:00',  subject: 'Weekend Prep',          dots: [] },
    ],
  ],
  parent: [
    [ // Monday
      { time: '7:30 – 8:15',  subject: 'Assembly & Devotion',   dots: [] },
      { time: '8:15 – 9:00',  subject: 'Mathematics',           dots: [{ cls: 'bs-dot-green',  label: 'A' }] },
      { time: '9:00 – 9:45',  subject: 'English Language',      dots: [{ cls: 'bs-dot-green',  label: 'B+' }] },
      { time: '10:00 – 10:45',subject: 'Basic Science',         dots: [{ cls: 'bs-dot-orange', label: 'B' }] },
      { time: '12:00 – 1:00', subject: 'Lunch Break',           dots: [] },
      { time: '1:00 – 1:45',  subject: 'ICT',                   dots: [{ cls: 'bs-dot-green',  label: 'A' }] },
    ],
    [ // Tuesday
      { time: '7:30 – 8:15',  subject: 'Assembly & Devotion',   dots: [] },
      { time: '8:15 – 9:00',  subject: 'Social Studies',        dots: [{ cls: 'bs-dot-orange', label: 'B' }] },
      { time: '9:00 – 9:45',  subject: 'French',                dots: [{ cls: 'bs-dot-orange', label: 'B-' }] },
      { time: '10:00 – 10:45',subject: 'RME',                   dots: [] },
      { time: '12:00 – 1:00', subject: 'Lunch Break',           dots: [] },
      { time: '1:00 – 1:45',  subject: 'Physical Education',    dots: [] },
    ],
    [ // Wednesday
      { time: '7:30 – 8:15',  subject: 'Assembly & Devotion',   dots: [] },
      { time: '8:15 – 9:00',  subject: 'Mathematics',           dots: [{ cls: 'bs-dot-green',  label: 'A' }] },
      { time: '9:00 – 9:45',  subject: 'English Language',      dots: [{ cls: 'bs-dot-green',  label: 'B+' }] },
      { time: '10:00 – 10:45',subject: 'Basic Science',         dots: [{ cls: 'bs-dot-orange', label: 'B' }] },
      { time: '11:00 – 11:45',subject: 'Social Studies',        dots: [] },
      { time: '12:00 – 1:00', subject: 'Lunch Break',           dots: [] },
    ],
    [ // Thursday
      { time: '7:30 – 8:15',  subject: 'Assembly & Devotion',   dots: [] },
      { time: '8:15 – 9:00',  subject: 'Mathematics',           dots: [{ cls: 'bs-dot-green',  label: 'A' }] },
      { time: '9:00 – 9:45',  subject: 'French',                dots: [{ cls: 'bs-dot-orange', label: 'B-' }] },
      { time: '10:00 – 10:45',subject: 'ICT',                   dots: [{ cls: 'bs-dot-green',  label: 'A' }] },
      { time: '12:00 – 1:00', subject: 'Lunch Break',           dots: [] },
    ],
    [ // Friday
      { time: '7:30 – 8:15',  subject: 'Assembly & Devotion',   dots: [] },
      { time: '8:15 – 9:00',  subject: 'English Language',      dots: [{ cls: 'bs-dot-green',  label: 'B+' }] },
      { time: '9:00 – 9:45',  subject: 'Mathematics',           dots: [{ cls: 'bs-dot-green',  label: 'A' }] },
      { time: '10:00 – 10:45',subject: 'Basic Science',         dots: [{ cls: 'bs-dot-orange', label: 'B' }] },
      { time: '12:00 – 1:00', subject: 'Lunch Break',           dots: [] },
      { time: '1:00 – 1:45',  subject: 'Club Activities',       dots: [] },
    ],
  ],
  student: [
    [ // Monday
      { time: '8:00',  subject: 'Mathematics',      detail: 'Mr. Asare · Room 4' },
      { time: '8:40',  subject: 'English Language', detail: 'Mrs. Owusu · Room 2' },
      { time: '9:20',  subject: 'Basic Science',    detail: 'Mr. Boateng · Lab 1' },
      { time: '10:20', subject: 'Social Studies',   detail: 'Mrs. Adu · Room 7' },
      { time: '11:00', subject: 'French',           detail: 'Mme. Tetteh · Room 3' },
      { time: '1:40',  subject: 'Physical Education', detail: 'Coach Mensah · Field' },
    ],
    [ // Tuesday
      { time: '8:00',  subject: 'ICT',              detail: 'Mr. Larbi · Lab 2' },
      { time: '8:40',  subject: 'Mathematics',      detail: 'Mr. Asare · Room 4' },
      { time: '9:20',  subject: 'RME',              detail: 'Mrs. Asante · Room 5' },
      { time: '10:20', subject: 'English Language', detail: 'Mrs. Owusu · Room 2' },
      { time: '11:00', subject: 'Creative Arts',    detail: 'Mr. Darko · Art Room' },
      { time: '1:40',  subject: 'Social Studies',   detail: 'Mrs. Adu · Room 7' },
    ],
    [ // Wednesday
      { time: '8:00',  subject: 'Basic Science',    detail: 'Mr. Boateng · Lab 1' },
      { time: '8:40',  subject: 'French',           detail: 'Mme. Tetteh · Room 3' },
      { time: '9:20',  subject: 'Mathematics',      detail: 'Mr. Asare · Room 4' },
      { time: '10:20', subject: 'ICT',              detail: 'Mr. Larbi · Lab 2' },
      { time: '11:00', subject: 'English Language', detail: 'Mrs. Owusu · Room 2' },
      { time: '1:40',  subject: 'Physical Education', detail: 'Coach Mensah · Field' },
    ],
    [ // Thursday
      { time: '8:00',  subject: 'Social Studies',   detail: 'Mrs. Adu · Room 7' },
      { time: '8:40',  subject: 'Basic Science',    detail: 'Mr. Boateng · Lab 1' },
      { time: '9:20',  subject: 'French',           detail: 'Mme. Tetteh · Room 3' },
      { time: '10:20', subject: 'Mathematics',      detail: 'Mr. Asare · Room 4' },
      { time: '11:00', subject: 'RME',              detail: 'Mrs. Asante · Room 5' },
      { time: '1:40',  subject: 'Creative Arts',    detail: 'Mr. Darko · Art Room' },
    ],
    [ // Friday
      { time: '8:00',  subject: 'English Language', detail: 'Mrs. Owusu · Room 2' },
      { time: '8:40',  subject: 'ICT',              detail: 'Mr. Larbi · Lab 2' },
      { time: '9:20',  subject: 'Mathematics',      detail: 'Mr. Asare · Room 4' },
      { time: '10:20', subject: 'Social Studies',   detail: 'Mrs. Adu · Room 7' },
      { time: '11:00', subject: 'Basic Science',    detail: 'Mr. Boateng · Lab 1' },
      { time: '1:40',  subject: 'French',           detail: 'Mme. Tetteh · Room 3' },
    ],
  ],
};

// Returns 0-4 for Mon-Fri, or closest weekday for Sat/Sun
function getTodayDayIndex() {
  const d = new Date().getDay(); // 0=Sun,1=Mon…
  if (d === 0) return 0; // Sun → Mon
  if (d === 6) return 4; // Sat → Fri
  return d - 1;
}

function renderTeacherSchedule(dayIdx) {
  const list = document.getElementById('teacherScheduleList');
  if (!list) return;
  const items = SCHEDULES.teacher[dayIdx] || [];
  list.innerHTML = items.map(item => `
    <div class="bs-schedule-item">
      <span class="bs-time-slot">${item.time}</span>
      <span class="bs-subject">${item.subject}</span>
      <div class="bs-score-dots">${item.dots.map(d => `<div class="bs-dot ${d.cls}">${d.label}</div>`).join('')}</div>
    </div>`).join('');
}

function renderParentSchedule(dayIdx) {
  const list = document.getElementById('parentScheduleList');
  if (!list) return;
  const items = SCHEDULES.parent[dayIdx] || [];
  list.innerHTML = items.map(item => `
    <div class="bs-schedule-item">
      <span class="bs-time-slot">${item.time}</span>
      <span class="bs-subject">${item.subject}</span>
      <div class="bs-score-dots">${item.dots.map(d => `<div class="bs-dot ${d.cls}">${d.label}</div>`).join('')}</div>
    </div>`).join('');
}

function renderStudentSchedule(dayIdx) {
  const list = document.getElementById('studentScheduleList');
  if (!list) return;
  const todayIdx = getTodayDayIndex();
  const items = SCHEDULES.student[dayIdx] || [];
  const nowHour = new Date().getHours() * 60 + new Date().getMinutes();

  function timeToMins(t) {
    const [h, m] = t.replace(/[ap]m/i, '').split(':').map(Number);
    return h * 60 + (m || 0);
  }

  list.innerHTML = items.map((item, i) => {
    const itemMins = timeToMins(item.time);
    const nextMins = items[i + 1] ? timeToMins(items[i + 1].time) : itemMins + 45;
    let cls = '', badge = '';
    if (dayIdx === todayIdx) {
      if (nowHour >= nextMins) { cls = 'done'; badge = '<span class="tc-badge done-badge">Done</span>'; }
      else if (nowHour >= itemMins) { cls = 'now'; badge = '<span class="tc-badge now-badge">Now</span>'; }
      else if (i === items.findIndex(it => timeToMins(it.time) > nowHour)) { badge = '<span class="tc-badge upcoming-badge">Next</span>'; }
      else { badge = '<span class="tc-badge"></span>'; }
    } else {
      badge = '<span class="tc-badge"></span>';
    }
    return `<div class="today-class-item ${cls}">
      <div class="tc-time">${item.time}</div>
      <div class="tc-bar${cls === 'now' ? ' now-bar' : ''}"></div>
      <div class="tc-info"><div class="tc-name">${item.subject}</div><div class="tc-teacher">${item.detail}</div></div>
      ${badge}
    </div>`;
  }).join('');
}

function switchDay(role, dayIdx, clickedEl) {
  // Update active day box
  const strip = clickedEl?.closest('.bs-calendar-strip, .stu-calendar-strip');
  if (strip) {
    strip.querySelectorAll('.bs-day-box').forEach(b => b.classList.remove('bs-day-active'));
    clickedEl.classList.add('bs-day-active');
  }
  // Re-render schedule
  if (role === 'teacher') renderTeacherSchedule(dayIdx);
  else if (role === 'parent') renderParentSchedule(dayIdx);
  else if (role === 'student') renderStudentSchedule(dayIdx);
}

// Auto-init schedules on DOMContentLoaded (called from the bottom of the existing listener)
function initSchedules() {
  const today = getTodayDayIndex();
  renderTeacherSchedule(today);
  renderParentSchedule(today);
  renderStudentSchedule(today);
}

// ===== LOGOUT =====
function logout() {
  localStorage.removeItem('hc_user');
  window.location.href = 'login.html';
}

// ===== MODALS =====
function openModal(id) {
  document.getElementById(id)?.classList.add('open');
}
function closeModal(id) {
  document.getElementById(id)?.classList.remove('open');
}
// Close modal on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.remove('open');
  });
});

// ===== BILL FILTER (legacy select) =====
function filterBills() {
  const filter = document.getElementById('billFilter')?.value;
  document.querySelectorAll('#billsTable tr').forEach(row => {
    row.style.display = (filter === 'all' || row.dataset.status === filter) ? '' : 'none';
  });
}

// ===== BILL FILTER (new pill buttons) =====
function filterBillsNew(status, btn) {
  document.querySelectorAll('.bills-filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  document.querySelectorAll('#billsTable .invoice-card').forEach(card => {
    card.style.display = (status === 'all' || card.dataset.status === status) ? '' : 'none';
  });
}

// ===== VIEW INVOICE =====
function viewInvoice(num) {
  const el = document.getElementById('invoiceNum');
  if (el) el.textContent = num;
  openModal('invoiceModal');
}

// ===== PAY NOW =====
function payNow(invoiceId) {
  alert(`Redirecting to payment gateway for ${invoiceId}...\n\n(In production, this would open a payment processor like Paystack or Flutterwave.)`);
}

// ===== MESSAGES =====
function openChat(name, sub) {
  document.getElementById('chatName').textContent = name;
  document.getElementById('chatSub').textContent = sub;
  document.querySelectorAll('.msg-item').forEach(i => i.classList.remove('active'));
  event.currentTarget.classList.add('active');
}

function sendMessage(e) {
  if (e && e.type === 'keydown' && e.key !== 'Enter') return;
  const input = document.getElementById('chatInput');
  const text = input?.value.trim();
  if (!text) return;
  const messages = document.getElementById('chatMessages');
  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble sent';
  bubble.innerHTML = `<div class="bubble-text">${text}</div><div class="bubble-time">${new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</div>`;
  messages.appendChild(bubble);
  messages.scrollTop = messages.scrollHeight;
  input.value = '';
}

// ===== PROFILE SAVE =====
function saveProfile() {
  const name = document.getElementById('pName')?.value;
  if (name) {
    const user = JSON.parse(localStorage.getItem('hc_user') || '{}');
    user.name = name;
    localStorage.setItem('hc_user', JSON.stringify(user));
    const av = document.getElementById('topnavAvatar');
    if (av) av.textContent = name.charAt(0);
    const nm = document.getElementById('topnavName');
    if (nm) nm.textContent = name;
    const pa = document.getElementById('profileAvatar');
    if (pa) pa.textContent = name.charAt(0);
    const pn = document.getElementById('profileName');
    if (pn) pn.textContent = name;
  }
  showToast('Profile saved successfully!');
}

// ===== TOAST =====
function showToast(msg) {
  const toast = document.createElement('div');
  toast.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#722F37;color:white;padding:12px 20px;border-radius:8px;font-size:0.88rem;font-weight:600;z-index:9999;box-shadow:0 4px 16px rgba(0,0,0,0.2);';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
