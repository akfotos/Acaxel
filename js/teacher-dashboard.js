// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  buildAttendanceGrid();
  const today = new Date().toISOString().split('T')[0];
  const dateInputs = document.querySelectorAll('input[type="date"]');
  dateInputs.forEach(d => { if (!d.value) d.value = today; });
});

// ===== TAB SWITCHING =====
function switchTab(tabId, btn) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const panel = document.getElementById('tab-' + tabId);
  if (panel) panel.classList.add('active');
  if (btn) btn.classList.add('active');
}

// ===== SIDEBAR =====
function toggleSidebar() {
  const body = document.querySelector('.dash-body');
  const sidebar = document.querySelector('.dash-sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (window.innerWidth <= 768) {
    sidebar?.classList.toggle('mobile-open');
    overlay?.classList.toggle('open');
  } else {
    body?.classList.toggle('sidebar-collapsed');
    sidebar?.classList.toggle('collapsed');
    const collapsed = sidebar?.classList.contains('collapsed');
    localStorage.setItem('hc_sidebar_collapsed', collapsed ? '1' : '0');
  }
}
function openSidebar() {}
function closeSidebar() {
  document.querySelector('.dash-sidebar')?.classList.remove('mobile-open');
  document.getElementById('sidebarOverlay')?.classList.remove('open');
}

// ===== NOTIFICATIONS =====
function toggleNotif() {
  const panel = document.getElementById('notifPanel');
  const backdrop = document.getElementById('notifBackdrop');
  if (!panel) return;
  const isOpen = panel.classList.contains('open');
  if (isOpen) {
    panel.classList.remove('open');
    backdrop?.classList.remove('open');
  } else {
    panel.classList.add('open');
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

// ===== LOGOUT =====
function logout() {
  localStorage.removeItem('hc_user');
  window.location.href = 'login.html';
}

// ===== MODALS =====
function openModal(id) { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.remove('open');
  });
});

// ===== STUDENT SEARCH =====
function searchStudents(query) {
  const q = query.toLowerCase();
  document.querySelectorAll('#studentsTable tr').forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}

// ===== ADD STUDENT =====
function addStudent() {
  const first = document.getElementById('newFirstName')?.value.trim();
  const last = document.getElementById('newLastName')?.value.trim();
  const id = document.getElementById('newStudentId')?.value.trim();
  const parent = document.getElementById('newParentName')?.value.trim();
  if (!first || !last) { alert('Please enter student name.'); return; }
  const tbody = document.getElementById('studentsTable');
  const rowCount = tbody.querySelectorAll('tr').length + 1;
  const row = document.createElement('tr');
  row.innerHTML = `
    <td>${rowCount}</td>
    <td>${first} ${last}</td>
    <td>${id || 'HC/2026/0' + rowCount}</td>
    <td>${parent || '—'}</td>
    <td>—</td><td>—</td>
    <td><span class="badge badge-pending">Pending</span></td>
    <td><button class="btn-icon" title="View">&#128065;</button></td>
  `;
  tbody.appendChild(row);
  closeModal('addStudentModal');
  showToast(`${first} ${last} added to JSS 2A`);
  // Clear fields
  ['newFirstName','newLastName','newStudentId','newParentName','newParentEmail'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
}

// ===== RECORD PAYMENT =====
function recordPayment(studentName) {
  document.getElementById('payStudent').value = studentName;
  document.getElementById('payDate').value = new Date().toISOString().split('T')[0];
  openModal('paymentModal');
}

function confirmPayment() {
  const student = document.getElementById('payStudent')?.value;
  const amount = document.getElementById('payAmount')?.value;
  if (!amount || amount <= 0) { alert('Please enter a valid amount.'); return; }
  closeModal('paymentModal');
  showToast(`Payment of ₵${Number(amount).toLocaleString()} recorded for ${student}`);
}

// ===== GRADES =====
function calcGrade(input) {
  const row = input.closest('tr');
  const inputs = row.querySelectorAll('.grade-input');
  let total = 0;
  inputs.forEach(i => total += Number(i.value) || 0);
  const totalCell = row.querySelector('.grade-total');
  const gradeCell = row.querySelector('.grade-letter');
  if (totalCell) totalCell.textContent = total;
  if (gradeCell) {
    const { letter, cls } = getGrade(total);
    gradeCell.textContent = letter;
    gradeCell.className = `grade-letter grade-${cls}`;
  }
}

function getGrade(score) {
  if (score >= 90) return { letter: 'A+', cls: 'A' };
  if (score >= 80) return { letter: 'A', cls: 'A' };
  if (score >= 75) return { letter: 'A-', cls: 'A' };
  if (score >= 70) return { letter: 'B+', cls: 'B' };
  if (score >= 65) return { letter: 'B', cls: 'B' };
  if (score >= 60) return { letter: 'B-', cls: 'B' };
  if (score >= 55) return { letter: 'C+', cls: 'C' };
  if (score >= 50) return { letter: 'C', cls: 'C' };
  if (score >= 45) return { letter: 'D', cls: 'D' };
  return { letter: 'F', cls: 'F' };
}

function saveGrades() { showToast('Grades saved successfully!'); }

// ===== ATTENDANCE =====
const students = [
  'Afful Ewura-Yaa Nkunim', 'Antwi Brion', 'Appiah Zakiel Nana Kwame', 'Kanati Jesse Nuna',
  'Morkeh Michelle', 'Mortty Gaius Eyiram', 'Tagoe Henry', 'Tsikata Eli-Vava Sebastian'
];

function buildAttendanceGrid() {
  const grid = document.getElementById('attendanceGrid');
  if (!grid) return;
  grid.innerHTML = students.map((name, i) => `
    <div class="student-attend-card">
      <div class="s-name">${name}</div>
      <div class="attend-options">
        <input type="radio" class="attend-radio present" name="att_${i}" id="p_${i}" />
        <label class="attend-label" for="p_${i}">Present</label>
        <input type="radio" class="attend-radio absent" name="att_${i}" id="a_${i}" />
        <label class="attend-label" for="a_${i}">Absent</label>
        <input type="radio" class="attend-radio late" name="att_${i}" id="l_${i}" />
        <label class="attend-label" for="l_${i}">Late</label>
      </div>
    </div>
  `).join('');
  // Default all to present
  document.querySelectorAll('.attend-radio.present').forEach(r => r.checked = true);
}

function saveAttendance() {
  const date = document.getElementById('attendDate')?.value;
  let present = 0, absent = 0, late = 0;
  students.forEach((_, i) => {
    const checked = document.querySelector(`input[name="att_${i}"]:checked`);
    if (checked?.classList.contains('present')) present++;
    else if (checked?.classList.contains('absent')) absent++;
    else if (checked?.classList.contains('late')) late++;
  });
  showToast(`Attendance saved for ${date}: ${present} present, ${absent} absent, ${late} late`);
}

// ===== BILL COMPOSER =====
function addBillItem() {
  const container = document.getElementById('billItems');
  const div = document.createElement('div');
  div.className = 'form-field bill-item-row';
  div.style.cssText = 'display:grid;grid-template-columns:1fr auto;gap:8px;align-items:end;';
  div.innerHTML = `
    <div>
      <label class="input-label">Item Description</label>
      <input class="input-field" type="text" placeholder="e.g. Lab Fee" oninput="updatePreview()" />
    </div>
    <div>
      <label class="input-label">Amount (&#8373;)</label>
      <input class="input-field" type="number" placeholder="0" style="width:120px;" oninput="updatePreview()" />
    </div>
  `;
  container.appendChild(div);
}

function updatePreview() {
  const to = document.getElementById('billTo')?.value || '—';
  const title = document.getElementById('billTitle')?.value || 'Bill Preview';
  const due = document.getElementById('billDue')?.value || '—';
  const note = document.getElementById('billNote')?.value || '';

  document.getElementById('previewTo').textContent = to || '—';
  document.getElementById('previewTitle').textContent = title;
  document.getElementById('previewDue').textContent = due;
  document.getElementById('previewNote').textContent = note;

  const rows = document.querySelectorAll('.bill-item-row');
  let total = 0;
  const itemsHtml = Array.from(rows).map(row => {
    const desc = row.querySelector('input[type="text"]')?.value || '';
    const amt = Number(row.querySelector('input[type="number"]')?.value) || 0;
    total += amt;
    return desc ? `<div class="bill-line"><span>${desc}</span><span>&#8373;${amt.toLocaleString()}</span></div>` : '';
  }).join('');

  document.getElementById('previewItems').innerHTML = itemsHtml || '<div class="bill-line"><span>No items yet</span><span>—</span></div>';
  document.getElementById('previewTotal').textContent = '₵' + total.toLocaleString();
}

function sendBill() {
  const to = document.getElementById('billTo')?.value;
  if (!to) { alert('Please select a recipient.'); return; }
  showToast(`Bill sent to ${to} successfully!`);
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

// ===== PROFILE =====
function saveProfile() { showToast('Profile saved successfully!'); }

// ===== TOAST =====
function showToast(msg) {
  const toast = document.createElement('div');
  toast.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#722F37;color:white;padding:12px 20px;border-radius:8px;font-size:0.88rem;font-weight:600;z-index:9999;box-shadow:0 4px 16px rgba(0,0,0,0.2);transition:opacity 0.3s;';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3000);
}
