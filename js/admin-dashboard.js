// ===== ADMIN DASHBOARD JS =====

document.addEventListener('DOMContentLoaded', () => {
  renderCharts();
  initBillPreview();
  loadAdminTimetable('JSS2A');
  initFeeding();
  renderFeedingTimetable();
  initInventory();
  initUpdates();
  initNewsletter();
});

// ===== CHARTS =====
function renderCharts() {
  const accent = '#6366f1';
  const accentLight = 'rgba(99,102,241,0.12)';
  const grid = 'rgba(0,0,0,0.06)';
  const textLight = '#94a3b8';

  const chartDefaults = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: grid }, ticks: { color: textLight, font: { size: 11 } } },
      y: { grid: { color: grid }, ticks: { color: textLight, font: { size: 11 } } }
    }
  };

  // Fee Collection Chart
  const feeCtx = document.getElementById('feeCollectionChart');
  if (feeCtx) {
    new Chart(feeCtx, {
      type: 'bar',
      data: {
        labels: ['Jan','Feb','Mar','Apr','May','Jun'],
        datasets: [{
          label: 'Collected (₵)',
          data: [210000, 185000, 240000, 195000, 220000, 190000],
          backgroundColor: accentLight,
          borderColor: accent,
          borderWidth: 2,
          borderRadius: 6
        }]
      },
      options: chartDefaults
    });
  }

  // Attendance Trend Chart
  const attCtx = document.getElementById('attendanceTrendChart');
  if (attCtx) {
    new Chart(attCtx, {
      type: 'line',
      data: {
        labels: ['Mon','Tue','Wed','Thu','Fri'],
        datasets: [{
          label: 'Attendance %',
          data: [92, 89, 94, 91, 93],
          borderColor: accent,
          backgroundColor: accentLight,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: accent,
          pointRadius: 4
        }]
      },
      options: { ...chartDefaults }
    });
  }

  // Weekly Attendance Chart (attendance tab)
  const wattCtx = document.getElementById('weekAttChart');
  if (wattCtx) {
    new Chart(wattCtx, {
      type: 'bar',
      data: {
        labels: ['Mon','Tue','Wed','Thu','Fri'],
        datasets: [
          { label: 'Present', data: [1128, 1102, 1140, 1118, 1130], backgroundColor: 'rgba(22,163,74,0.7)', borderRadius: 4 },
          { label: 'Absent',  data: [112, 138, 100, 122, 110],  backgroundColor: 'rgba(220,38,38,0.5)', borderRadius: 4 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: true, position: 'bottom', labels: { font: { size: 11 }, color: textLight } } },
        scales: {
          x: { grid: { color: grid }, ticks: { color: textLight, font: { size: 11 } }, stacked: false },
          y: { grid: { color: grid }, ticks: { color: textLight, font: { size: 11 } } }
        }
      }
    });
  }

  // Reports — Fee Doughnut
  const rfCtx = document.getElementById('reportFeeChart');
  if (rfCtx) {
    new Chart(rfCtx, {
      type: 'doughnut',
      data: {
        labels: ['Paid','Partial','Overdue'],
        datasets: [{ data: [87, 8, 5], backgroundColor: ['#16a34a','#f59e0b','#dc2626'], borderWidth: 0 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, color: textLight } } }
      }
    });
  }

  // Reports — Attendance bar
  const raCtx = document.getElementById('reportAttChart');
  if (raCtx) {
    new Chart(raCtx, {
      type: 'bar',
      data: {
        labels: ['JSS 1','JSS 2','JSS 3','SSS 1','SSS 2','SSS 3'],
        datasets: [{ label: 'Rate %', data: [93,92,94,96,91,90], backgroundColor: accentLight, borderColor: accent, borderWidth: 2, borderRadius: 4 }]
      },
      options: { ...chartDefaults, plugins: { legend: { display: false } } }
    });
  }

  // Reports — Grade distribution
  const rgCtx = document.getElementById('reportGradeChart');
  if (rgCtx) {
    new Chart(rgCtx, {
      type: 'bar',
      data: {
        labels: ['A','B+','B','C+','C','D','F'],
        datasets: [{ data: [180,320,410,220,85,18,7],
          backgroundColor: ['#16a34a','#22c55e','#86efac','#fde68a','#fbbf24','#f97316','#ef4444'],
          borderRadius: 4 }]
      },
      options: { ...chartDefaults, plugins: { legend: { display: false } } }
    });
  }

  // Reports — Enrollment by class
  const reCtx = document.getElementById('reportEnrollChart');
  if (reCtx) {
    new Chart(reCtx, {
      type: 'bar',
      data: {
        labels: ['JSS 1','JSS 2','JSS 3','SSS 1','SSS 2','SSS 3'],
        datasets: [{ label: 'Students', data: [195,200,210,215,215,205],
          backgroundColor: accentLight, borderColor: accent, borderWidth: 2, borderRadius: 4 }]
      },
      options: { ...chartDefaults, plugins: { legend: { display: false } } }
    });
  }
}

// ===== BILL COMPOSE =====
function initBillPreview() {
  const today = new Date().toISOString().split('T')[0];
  const due = document.getElementById('billDue');
  if (due && !due.value) due.value = today;
}

function addBillItem() {
  const container = document.getElementById('billItems');
  if (!container) return;
  const row = document.createElement('div');
  row.className = 'form-field bill-item-row';
  row.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 130px 32px;gap:8px;align-items:end;">
      <div>
        <label class="input-label">Item Description</label>
        <input class="input-field" type="text" placeholder="e.g. Books Levy" oninput="updatePreview()" />
      </div>
      <div>
        <label class="input-label">Amount (₵)</label>
        <input class="input-field" type="number" placeholder="0" oninput="updatePreview()" />
      </div>
      <button onclick="this.closest('.bill-item-row').remove();updatePreview();" 
              style="padding:8px;background:none;border:1.5px solid var(--border);border-radius:6px;cursor:pointer;color:var(--text-light);line-height:1;margin-bottom:0;align-self:end;" 
              title="Remove">✕</button>
    </div>`;
  container.appendChild(row);
  lucide.createIcons();
}

function updatePreview() {
  const to   = document.getElementById('billTo');
  const title= document.getElementById('billTitle');
  const due  = document.getElementById('billDue');
  const note = document.getElementById('billNote');

  const toText  = to   ? to.options[to.selectedIndex]?.text || '—' : '—';
  const titleText = title ? (title.value || 'Fee Invoice Preview') : 'Fee Invoice Preview';
  const dueText   = due   ? (due.value ? new Date(due.value).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) : '—') : '—';

  const pTo    = document.getElementById('previewTo');
  const pTitle = document.getElementById('previewTitle');
  const pDue   = document.getElementById('previewDue');
  const pNote  = document.getElementById('previewNote');
  const pItems = document.getElementById('previewItems');
  const pTotal = document.getElementById('previewTotal');

  if (pTo)    pTo.textContent    = toText;
  if (pTitle) pTitle.textContent = titleText;
  if (pDue)   pDue.textContent   = dueText;
  if (pNote && note)  pNote.textContent  = note.value;

  // Collect line items
  const rows = document.querySelectorAll('.bill-item-row');
  let total = 0;
  let html = '';
  rows.forEach(row => {
    const inputs = row.querySelectorAll('input');
    if (inputs.length >= 2) {
      const desc = inputs[0].value.trim() || '(Item)';
      const amt  = parseFloat(inputs[1].value) || 0;
      total += amt;
      html += `<div class="bill-line"><span>${desc}</span><span>₵${amt.toLocaleString()}</span></div>`;
    }
  });
  if (!html) html = '<div class="bill-line"><span>No items yet</span><span>—</span></div>';
  if (pItems) pItems.innerHTML = html;
  if (pTotal) pTotal.textContent = '₵' + total.toLocaleString();
}

function sendBill() {
  const to = document.getElementById('billTo');
  if (!to || !to.value) { alert('Please select a recipient.'); return; }
  const title = document.getElementById('billTitle')?.value?.trim();
  if (!title) { alert('Please enter a bill title.'); return; }
  const total = document.getElementById('previewTotal')?.textContent;
  alert(`✓ Bill "${title}" sent to ${to.options[to.selectedIndex].text}\nTotal: ${total}`);
  clearBill();
}

function clearBill() {
  const billTo = document.getElementById('billTo');
  const billTitle = document.getElementById('billTitle');
  const billNote = document.getElementById('billNote');
  const billItems = document.getElementById('billItems');
  if (billTo) billTo.value = '';
  if (billTitle) billTitle.value = '';
  if (billNote) billNote.value = '';
  if (billItems) {
    billItems.innerHTML = `
      <div class="form-field bill-item-row">
        <div style="display:grid;grid-template-columns:1fr 130px;gap:8px;align-items:end;">
          <div><label class="input-label">Item Description</label><input class="input-field" type="text" placeholder="e.g. Tuition Fee" oninput="updatePreview()" /></div>
          <div><label class="input-label">Amount (₵)</label><input class="input-field" type="number" placeholder="0" oninput="updatePreview()" /></div>
        </div>
      </div>`;
  }
  updatePreview();
}

// ===== MESSAGES =====
function showMessage(el, from, subject, body) {
  document.querySelectorAll('.adm-msg-item').forEach(i => i.classList.remove('adm-msg-selected'));
  el.classList.add('adm-msg-selected');
  el.classList.remove('adm-msg-unread');
  const view = document.getElementById('adm-msg-view-content');
  if (!view) return;
  const initial = from.trim().charAt(0).toUpperCase();
  view.innerHTML = `
    <div class="adm-msg-full">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
        <div class="adm-msg-avatar">${initial}</div>
        <div>
          <div class="adm-msg-full-from">${from}</div>
          <div class="adm-msg-full-subject">${subject}</div>
        </div>
      </div>
      <div class="adm-msg-full-body">${body}</div>
      <div class="adm-msg-full-actions">
        <button class="btn-sm wine" onclick="alert('Reply sent!')"><i data-lucide="reply"></i> Reply</button>
        <button class="btn-sm outline" onclick="this.closest('.adm-msg-full').parentElement.innerHTML='<div class=\\'adm-msg-empty\\'><p>Message deleted</p></div>'"><i data-lucide="trash-2"></i> Delete</button>
      </div>
    </div>`;
  const viewCard = view.closest('.adm-msg-view-card');
  if (viewCard) viewCard.classList.add('active');
  lucide.createIcons();
}

// ===== STUDENT MANAGEMENT =====
function addStudent() {
  const first    = document.getElementById('stFirstName')?.value.trim();
  const last     = document.getElementById('stLastName')?.value.trim();
  const sid      = document.getElementById('stStudentId')?.value.trim();
  const guardian = document.getElementById('stGuardian')?.value.trim() || '—';
  const classEl  = document.getElementById('stClass');
  const className = classEl?.options[classEl.selectedIndex]?.text || '—';
  const classKey  = classEl?.value || 'jss1';

  if (!first || !last) { alert('Please enter first and last name.'); return; }

  const tbody = document.getElementById('studentTableBody');
  if (!tbody) return;
  const rowNum = tbody.querySelectorAll('tr').length + 1;
  const autoId = sid || ('HC/2026/' + String(rowNum + 50).padStart(3, '0'));

  const row = document.createElement('tr');
  row.dataset.class = classKey;
  row.innerHTML = `
    <td>${rowNum}</td>
    <td><strong>${first} ${last}</strong></td>
    <td>${autoId}</td>
    <td>${className}</td>
    <td>${guardian}</td>
    <td>—</td>
    <td><span class="badge badge-pending">Pending</span></td>
    <td class="adm-row-actions">
      <button class="btn-icon" title="View"><i data-lucide="eye"></i></button>
      <button class="btn-icon" title="Delete" onclick="deleteStudentRow(this)"><i data-lucide="trash-2"></i></button>
    </td>`;
  tbody.appendChild(row);
  lucide.createIcons();

  ['stFirstName','stLastName','stStudentId','stDob','stGuardian','stPhone','stEmail'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  closeModal('addStudentModal');
}

function deleteStudentRow(btn) {
  const row = btn.closest('tr');
  if (!row) return;
  if (!confirm('Remove this student record?')) return;
  row.remove();
  document.querySelectorAll('#studentTableBody tr').forEach((r, i) => { r.cells[0].textContent = i + 1; });
}

function exportStudents() {
  const headers = ['#','Name','Student ID','Class','Parent / Guardian','Attendance','Fee Status'];
  const rows = [];
  document.querySelectorAll('#studentTableBody tr').forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length < 7) return;
    rows.push([
      cells[0].textContent.trim(),
      cells[1].textContent.trim(),
      cells[2].textContent.trim(),
      cells[3].textContent.trim(),
      cells[4].textContent.trim(),
      cells[5].textContent.trim(),
      cells[6].textContent.trim(),
    ]);
  });
  const csv = [headers, ...rows].map(r => r.map(v => `"${v.replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'students_export.csv'; a.click();
  URL.revokeObjectURL(url);
}

// ===== STAFF MANAGEMENT =====
function addStaff() {
  const first   = document.getElementById('sfFirstName')?.value.trim();
  const last    = document.getElementById('sfLastName')?.value.trim();
  const role    = document.getElementById('sfRole')?.value || 'Teacher';
  const subject = document.getElementById('sfSubject')?.value.trim() || '—';
  const classes = document.getElementById('sfClasses')?.value.trim() || '—';
  const staffId = document.getElementById('sfStaffId')?.value.trim() || '—';

  if (!first || !last) { alert('Please enter first and last name.'); return; }

  const tbody = document.getElementById('staffTableBody');
  if (!tbody) return;
  const rowNum = tbody.querySelectorAll('tr').length + 1;
  const row = document.createElement('tr');
  row.innerHTML = `
    <td>${rowNum}</td>
    <td><strong>${first} ${last}</strong></td>
    <td>${staffId}</td>
    <td>${role}</td>
    <td>${subject}</td>
    <td>${classes}</td>
    <td><span class="badge badge-paid">Active</span></td>
    <td class="adm-row-actions">
      <button class="btn-icon" title="Delete" onclick="deleteStaffRow(this)"><i data-lucide="trash-2"></i></button>
    </td>`;
  tbody.appendChild(row);
  lucide.createIcons();

  ['sfFirstName','sfLastName','sfSubject','sfClasses','sfStaffId','sfPhone','sfEmail','sfDateJoined'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  closeModal('addStaffModal');
}

function deleteStaffRow(btn) {
  const row = btn.closest('tr');
  if (!row) return;
  if (!confirm('Remove this staff member?')) return;
  row.remove();
  document.querySelectorAll('#staffTableBody tr').forEach((r, i) => { r.cells[0].textContent = i + 1; });
}

function filterStaff(query) {
  const q = query.toLowerCase();
  document.querySelectorAll('#staffTableBody tr').forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}

function exportStaff() {
  const headers = ['#','Name','Staff ID','Role','Subject / Dept','Classes','Status'];
  const rows = [];
  document.querySelectorAll('#staffTableBody tr').forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length < 7) return;
    rows.push([
      cells[0].textContent.trim(),
      cells[1].textContent.trim(),
      cells[2].textContent.trim(),
      cells[3].textContent.trim(),
      cells[4].textContent.trim(),
      cells[5].textContent.trim(),
      cells[6].textContent.trim(),
    ]);
  });
  const csv = [headers, ...rows].map(r => r.map(v => `"${v.replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'staff_export.csv'; a.click();
  URL.revokeObjectURL(url);
}

// ===== STUDENT FILTER =====
function filterStudents(query) {
  const q = query.toLowerCase();
  document.querySelectorAll('#studentTable tbody tr').forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}

function filterByClass(cls, btn) {
  document.querySelectorAll('.adm-filter-pill').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('#studentTable tbody tr').forEach(row => {
    row.style.display = (cls === 'all' || row.dataset.class === cls) ? '' : 'none';
  });
}

// ===== ANNOUNCEMENTS =====
function postAnnouncement() {
  const title = document.getElementById('annTitle')?.value?.trim();
  const body  = document.getElementById('annBody')?.value?.trim();
  const priority = document.getElementById('annPriority')?.value || 'normal';
  if (!title || !body) { alert('Please fill in title and message.'); return; }

  const badgeMap = { normal: '<span class="badge badge-paid">Normal</span>', urgent: '<span class="badge badge-overdue">Urgent</span>', info: '<span class="badge badge-pending">Info</span>' };
  const card = document.createElement('div');
  card.className = 'adm-ann-card' + (priority === 'urgent' ? ' urgent' : '');
  card.innerHTML = `
    <div class="adm-ann-card-header">${badgeMap[priority]}<span class="adm-ann-card-date">Just now</span></div>
    <div class="adm-ann-card-title">${title}</div>
    <div class="adm-ann-card-body">${body}</div>
    <div class="adm-ann-card-footer"><span class="adm-ann-card-aud">All</span><button class="adm-link-btn" onclick="this.closest('.adm-ann-card').remove()">Delete</button></div>`;
  const list = document.getElementById('announcementList');
  if (list) list.prepend(card);
  document.getElementById('annTitle').value = '';
  document.getElementById('annBody').value = '';
}

// ===== EDITABLE TIMETABLE =====
const TT_DEFAULT = {
  JSS2A: [
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
  ]
};

function ttGetData(cls) {
  const stored = localStorage.getItem('tt_' + cls);
  if (stored) { try { return JSON.parse(stored); } catch(e) {} }
  return TT_DEFAULT[cls] || [
    { time: '8:00–8:45',  cells: ['—|—','—|—','—|—','—|—','—|—'] },
    { time: '8:45–9:30',  cells: ['—|—','—|—','—|—','—|—','—|—'] },
    { time: '10:15–10:30', break: true, label: 'Short Break' },
    { time: '10:30–11:15', cells: ['—|—','—|—','—|—','—|—','—|—'] },
    { time: '12:00–1:00',  break: true, label: 'Lunch Break' },
    { time: '1:00–1:45',   cells: ['—|—','—|—','—|—','—|—','—|—'] },
  ];
}

function ttRenderCell(val) {
  const [subj, teacher] = val.split('|');
  return `<strong>${subj || '—'}</strong><span>${teacher || ''}</span>`;
}

function loadAdminTimetable(cls) {
  const body = document.getElementById('ttBody');
  if (!body) return;
  const rows = ttGetData(cls);
  body.innerHTML = rows.map((row, ri) => {
    if (row.break) {
      return `<tr data-ri="${ri}" data-break="1">
        <td class="time-cell tt-editable" ondblclick="ttEditTime(this,${ri})">${row.time}</td>
        <td colspan="5" class="tt-cell break-row tt-editable" style="text-align:center;" ondblclick="ttEditBreak(this,${ri})">${row.label}</td>
        <td class="tt-del-cell"><button class="tt-del-btn" title="Delete row" onclick="ttDeleteRow(${ri})"><i data-lucide="trash-2"></i></button></td>
      </tr>`;
    }
    const cells = row.cells.map((val, ci) =>
      `<td class="tt-cell tt-editable" onclick="ttEditCell(this,${ri},${ci})">${ttRenderCell(val)}</td>`
    ).join('');
    return `<tr data-ri="${ri}">
      <td class="time-cell tt-editable" ondblclick="ttEditTime(this,${ri})">${row.time}</td>
      ${cells}
      <td class="tt-del-cell"><button class="tt-del-btn" title="Delete row" onclick="ttDeleteRow(${ri})"><i data-lucide="trash-2"></i></button></td>
    </tr>`;
  }).join('');
  lucide.createIcons();
}

function ttCurrentClass() {
  return document.getElementById('ttClassSelect')?.value || 'JSS2A';
}

function ttEditCell(td, ri, ci) {
  if (td.querySelector('input')) return;
  const cls = ttCurrentClass();
  const rows = ttGetData(cls);
  const [subj, teacher] = (rows[ri].cells[ci] || '|').split('|');
  td.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:3px;">
      <input class="tt-input" value="${subj === '—' ? '' : subj}" placeholder="Subject" style="width:100%;" />
      <input class="tt-input" value="${teacher === '—' ? '' : teacher}" placeholder="Teacher" style="width:100%;font-size:0.75rem;" />
    </div>`;
  const inputs = td.querySelectorAll('.tt-input');
  inputs[0].focus();
  inputs[0].select();
  function commit() {
    const s = inputs[0].value.trim() || '—';
    const t = inputs[1].value.trim() || '—';
    rows[ri].cells[ci] = s + '|' + t;
    td.innerHTML = ttRenderCell(rows[ri].cells[ci]);
    ttMarkUnsaved();
  }
  inputs.forEach(inp => {
    inp.addEventListener('blur', () => setTimeout(commit, 120));
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); commit(); } if (e.key === 'Escape') loadAdminTimetable(cls); });
  });
}

function ttEditTime(td, ri) {
  if (td.querySelector('input')) return;
  const cls = ttCurrentClass();
  const rows = ttGetData(cls);
  td.innerHTML = `<input class="tt-input" value="${rows[ri].time}" style="width:88px;" />`;
  const inp = td.querySelector('input');
  inp.focus(); inp.select();
  function commit() {
    rows[ri].time = inp.value.trim() || rows[ri].time;
    td.textContent = rows[ri].time;
    ttMarkUnsaved();
  }
  inp.addEventListener('blur', () => setTimeout(commit, 100));
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') commit(); });
}

function ttEditBreak(td, ri) {
  if (td.querySelector('input')) return;
  const cls = ttCurrentClass();
  const rows = ttGetData(cls);
  td.innerHTML = `<input class="tt-input" value="${rows[ri].label}" style="width:280px;text-align:center;" />`;
  const inp = td.querySelector('input');
  inp.focus(); inp.select();
  function commit() {
    rows[ri].label = inp.value.trim() || rows[ri].label;
    td.textContent = rows[ri].label;
    ttMarkUnsaved();
  }
  inp.addEventListener('blur', () => setTimeout(commit, 100));
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') commit(); });
}

function ttDeleteRow(ri) {
  const cls = ttCurrentClass();
  const rows = ttGetData(cls);
  rows.splice(ri, 1);
  localStorage.setItem('tt_' + cls, JSON.stringify(rows));
  loadAdminTimetable(cls);
  ttMarkUnsaved();
}

function ttAddRow() {
  const cls = ttCurrentClass();
  const rows = ttGetData(cls);
  rows.push({ time: 'New Slot', cells: ['—|—','—|—','—|—','—|—','—|—'] });
  localStorage.setItem('tt_' + cls, JSON.stringify(rows));
  loadAdminTimetable(cls);
  ttMarkUnsaved();
}

function ttMarkUnsaved() {
  const cls = ttCurrentClass();
  const rows = ttGetData(cls);
  localStorage.setItem('tt_' + cls, JSON.stringify(rows));
  const status = document.getElementById('ttSaveStatus');
  if (status) { status.style.display = 'none'; }
}

function saveTimetable() {
  const cls = ttCurrentClass();
  const rows = ttGetData(cls);
  localStorage.setItem('tt_' + cls, JSON.stringify(rows));
  const status = document.getElementById('ttSaveStatus');
  if (status) { status.style.display = 'inline'; setTimeout(() => status.style.display = 'none', 2500); }
}

// ===== FEEDING TIMETABLE =====
const FD_DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday'];
const FD_DEFAULT_MENU = [
  { breakfast:'Porridge & Bread',       lunch:'Jollof Rice & Chicken',      snack:'Fruit Salad',          fee:'5.00' },
  { breakfast:'Cocoa & Biscuits',        lunch:'Banku & Tilapia',             snack:'Groundnut Soup & Rice',fee:'5.00' },
  { breakfast:'Tom Brown & Egg',         lunch:'Fried Rice & Coleslaw',       snack:'Kelewele & Beans',     fee:'5.00' },
  { breakfast:'Hausa Koko & Koose',      lunch:'Kontomire Stew & Fufu',       snack:'Bofrot & Juice',       fee:'5.00' },
  { breakfast:'Oats & Milk',             lunch:'Waakye & Shito',              snack:'Chin Chin & Sobolo',   fee:'5.00' },
];

let fdWeekOffset = 0;

function fdGetWeekStart(offset) {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff + offset * 7));
  monday.setHours(0,0,0,0);
  return monday;
}

function fdFormatDate(d) {
  return d.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
}

function fdGetMenu() {
  const key = 'fdMenu_' + fdWeekOffset;
  const stored = localStorage.getItem(key);
  if (stored) { try { return JSON.parse(stored); } catch(e){} }
  return JSON.parse(JSON.stringify(FD_DEFAULT_MENU));
}

function renderFeedingTimetable() {
  const body = document.getElementById('feedingTimetableBody');
  const label = document.getElementById('fdWeekLabel');
  if (!body) return;

  const weekStart = fdGetWeekStart(fdWeekOffset);
  const weekEnd   = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 4);
  if (label) label.textContent = 'Week of ' + fdFormatDate(weekStart) + ' – ' + fdFormatDate(weekEnd);

  const menu = fdGetMenu();
  const today = new Date(); today.setHours(0,0,0,0);

  body.innerHTML = menu.map((row, i) => {
    const date = new Date(weekStart); date.setDate(weekStart.getDate() + i);
    const dateStr = fdFormatDate(date);
    const isToday = date.getTime() === today.getTime();
    const rowClass = isToday ? 'fd-today-row' : '';
    return `<tr class="${rowClass}">
      <td class="fd-day-cell" data-label="Day">
        <strong>${FD_DAYS[i]}</strong>
        <span class="fd-date-badge${isToday ? ' fd-date-today' : ''}">${dateStr}</span>
      </td>
      <td class="tt-cell" data-label="Breakfast"><strong>${row.breakfast}</strong></td>
      <td class="tt-cell accent-tt" data-label="Lunch"><strong>${row.lunch}</strong></td>
      <td class="tt-cell" data-label="Snack/Supper"><strong>${row.snack}</strong></td>
      <td class="fd-fee-cell" data-label="Fee (₵)">₵${row.fee}</td>
    </tr>`;
  }).join('');
}

function fdWeekNav(dir) {
  fdWeekOffset += dir;
  renderFeedingTimetable();
}

function openEditMenuModal() {
  const menu = fdGetMenu();
  const weekStart = fdGetWeekStart(fdWeekOffset);
  const fields = document.getElementById('editMenuFields');
  if (!fields) return;
  fields.innerHTML = menu.map((row, i) => {
    const date = new Date(weekStart); date.setDate(weekStart.getDate() + i);
    return `<div style="margin-bottom:20px;">
      <div style="font-weight:700;font-size:0.88rem;color:var(--accent);margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid var(--border);">
        ${FD_DAYS[i]} — ${fdFormatDate(date)}
      </div>
      <div class="profile-form-grid" style="grid-template-columns:1fr 1fr;">
        <div class="form-field">
          <label class="input-label">Breakfast</label>
          <input class="input-field" id="em_breakfast_${i}" type="text" value="${row.breakfast}" />
        </div>
        <div class="form-field">
          <label class="input-label">Lunch</label>
          <input class="input-field" id="em_lunch_${i}" type="text" value="${row.lunch}" />
        </div>
        <div class="form-field">
          <label class="input-label">Snack / Supper</label>
          <input class="input-field" id="em_snack_${i}" type="text" value="${row.snack}" />
        </div>
        <div class="form-field">
          <label class="input-label">Fee (₵)</label>
          <input class="input-field" id="em_fee_${i}" type="number" min="0" step="0.01" value="${row.fee}" />
        </div>
      </div>
    </div>`;
  }).join('');
}

function saveMenu() {
  const menu = FD_DAYS.map((_, i) => ({
    breakfast: document.getElementById(`em_breakfast_${i}`)?.value.trim() || '—',
    lunch:     document.getElementById(`em_lunch_${i}`)?.value.trim()     || '—',
    snack:     document.getElementById(`em_snack_${i}`)?.value.trim()     || '—',
    fee:       parseFloat(document.getElementById(`em_fee_${i}`)?.value   || '5').toFixed(2),
  }));
  localStorage.setItem('fdMenu_' + fdWeekOffset, JSON.stringify(menu));
  renderFeedingTimetable();
  closeModal('editMenuModal');
}

// ===== FEEDING COLLECTION =====
function initFeeding() {
  const today = new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
  const el = document.getElementById('fdDate');
  if (el) el.textContent = today;
  document.querySelectorAll('#feedingTableBody td[id="fdDateCell"], #feedingTableBody tr[data-status="paid"] td:nth-child(6)').forEach(td => {
    if (!td.textContent.trim()) td.textContent = today;
  });
  updateFeedingKPIs();
}

function updateFeedingKPIs() {
  const rows = document.querySelectorAll('#feedingTableBody tr');
  let paid = 0, unpaid = 0, total = 0;
  rows.forEach(row => {
    if (row.style.display === 'none') return;
    const status = row.dataset.status;
    if (status === 'paid') {
      paid++;
      const amtCell = row.cells[4]?.textContent.replace('₵','').trim();
      const amt = parseFloat(amtCell);
      if (!isNaN(amt)) total += amt;
    } else {
      unpaid++;
    }
  });
  const pEl = document.getElementById('fdTotalPaid');
  const uEl = document.getElementById('fdTotalUnpaid');
  const aEl = document.getElementById('fdTotalAmount');
  if (pEl) pEl.textContent = paid;
  if (uEl) uEl.textContent = unpaid;
  if (aEl) aEl.textContent = '₵' + total.toFixed(2);
}

function recordFeedingPayment() {
  const name   = document.getElementById('fdStudentName')?.value.trim();
  const sid    = document.getElementById('fdStudentId')?.value.trim() || '—';
  const cls    = document.getElementById('fdClass')?.value || '—';
  const amount = parseFloat(document.getElementById('fdAmount')?.value) || 0;
  const date   = document.getElementById('fdPayDate')?.value;
  const today  = new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
  const dateStr = date ? new Date(date).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : today;

  if (!name) { alert('Please enter the student name.'); return; }

  const tbody = document.getElementById('feedingTableBody');
  if (!tbody) return;
  const rowNum = tbody.querySelectorAll('tr').length + 1;
  const row = document.createElement('tr');
  row.dataset.status = 'paid';
  row.innerHTML = `
    <td>${rowNum}</td>
    <td><strong>${name}</strong></td>
    <td>${sid}</td>
    <td>${cls}</td>
    <td>₵${amount.toFixed(2)}</td>
    <td>${dateStr}</td>
    <td><span class="badge badge-paid">Paid</span></td>
    <td class="adm-row-actions">
      <button class="btn-icon" title="Delete" onclick="deleteFeedingRow(this)"><i data-lucide="trash-2"></i></button>
    </td>`;
  tbody.appendChild(row);
  lucide.createIcons();
  updateFeedingKPIs();

  ['fdStudentName','fdStudentId','fdAmount','fdPayDate','fdNotes'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  closeModal('addFeedingModal');
}

function deleteFeedingRow(btn) {
  const row = btn.closest('tr');
  if (!row) return;
  if (!confirm('Remove this payment record?')) return;
  row.remove();
  document.querySelectorAll('#feedingTableBody tr').forEach((r, i) => { r.cells[0].textContent = i + 1; });
  updateFeedingKPIs();
}

function filterFeeding(query) {
  const q = query.toLowerCase();
  document.querySelectorAll('#feedingTableBody tr').forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
  updateFeedingKPIs();
}

function filterFeedingStatus(status, btn) {
  document.querySelectorAll('#tab-feeding .adm-filter-pill').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('#feedingTableBody tr').forEach(row => {
    row.style.display = (status === 'all' || row.dataset.status === status) ? '' : 'none';
  });
  updateFeedingKPIs();
}

function exportFeeding() {
  const today = new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'long', year:'numeric' });
  const headers = ['#','Student Name','Student ID','Class','Amount (₵)','Date','Status'];
  const rows = [];
  document.querySelectorAll('#feedingTableBody tr').forEach(row => {
    if (row.style.display === 'none') return;
    const cells = row.querySelectorAll('td');
    if (cells.length < 7) return;
    rows.push({
      num:    cells[0].textContent.trim(),
      name:   cells[1].textContent.trim(),
      id:     cells[2].textContent.trim(),
      cls:    cells[3].textContent.trim(),
      amount: cells[4].textContent.trim(),
      date:   cells[5].textContent.trim(),
      status: cells[6].textContent.trim(),
    });
  });

  const totalCollected = rows
    .filter(r => r.status.toLowerCase() === 'paid')
    .reduce((sum, r) => sum + parseFloat(r.amount.replace('₵','')) || 0, 0);

  const tableRows = rows.map(r => `
    <tr>
      <td>${r.num}</td>
      <td>${r.name}</td>
      <td>${r.id}</td>
      <td>${r.cls}</td>
      <td style="text-align:center;">${r.amount}</td>
      <td style="text-align:center;">${r.date || today}</td>
      <td style="text-align:center;">
        <span class="badge ${r.status.toLowerCase() === 'paid' ? 'paid' : 'unpaid'}">${r.status}</span>
      </td>
    </tr>`).join('');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Feeding Collection Report</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e1b4b; padding: 32px; font-size: 13px; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:28px; padding-bottom:16px; border-bottom:2px solid #6366f1; }
    .header h1 { font-size:22px; font-weight:800; color:#6366f1; }
    .header p  { font-size:12px; color:#64748b; margin-top:4px; }
    .meta { display:flex; gap:32px; margin-bottom:20px; }
    .meta-item { background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:10px 18px; }
    .meta-item .val { font-size:18px; font-weight:800; color:#6366f1; }
    .meta-item .lbl { font-size:11px; color:#94a3b8; margin-top:2px; }
    table { width:100%; border-collapse:collapse; margin-top:8px; }
    thead tr { background:#6366f1; color:#fff; }
    thead th { padding:10px 12px; text-align:left; font-size:12px; font-weight:700; letter-spacing:0.03em; }
    tbody tr:nth-child(even) { background:#f8fafc; }
    tbody td { padding:9px 12px; border-bottom:1px solid #e2e8f0; }
    .badge { padding:3px 10px; border-radius:20px; font-size:11px; font-weight:700; }
    .badge.paid   { background:#dcfce7; color:#15803d; }
    .badge.unpaid { background:#fee2e2; color:#dc2626; }
    .footer { margin-top:24px; padding-top:12px; border-top:1px solid #e2e8f0; font-size:11px; color:#94a3b8; display:flex; justify-content:space-between; }
    @media print { body { padding:20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Acaxel School</h1>
      <p>Feeding Collection Report &mdash; Printed on ${today}</p>
    </div>
    <div style="text-align:right;">
      <div style="font-size:11px;color:#64748b;">Generated by Admin Dashboard</div>
    </div>
  </div>
  <div class="meta">
    <div class="meta-item"><div class="val">${rows.filter(r=>r.status.toLowerCase()==='paid').length}</div><div class="lbl">Paid</div></div>
    <div class="meta-item"><div class="val">${rows.filter(r=>r.status.toLowerCase()!=='paid').length}</div><div class="lbl">Unpaid</div></div>
    <div class="meta-item"><div class="val">₵${totalCollected.toFixed(2)}</div><div class="lbl">Total Collected</div></div>
    <div class="meta-item"><div class="val">${rows.length}</div><div class="lbl">Total Records</div></div>
  </div>
  <table>
    <thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead>
    <tbody>${tableRows}</tbody>
  </table>
  <div class="footer">
    <span>Acaxel School Management System</span>
    <span>${today}</span>
  </div>
  <script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (win) { win.document.write(html); win.document.close(); }
}

// ===== INVENTORY =====
const INV_CATEGORY_LABELS = {
  uniform:'Uniform', textbook:'Textbook', stationery:'Stationery',
  equipment:'Equipment', sports:'Sports', other:'Other'
};
const INV_CATEGORY_ICONS = {
  uniform:'shirt', textbook:'book-open', stationery:'pen-line',
  equipment:'monitor', sports:'dumbbell', other:'box'
};
const INV_DEFAULT = [
  { name:'School Shirt (Boys)',      category:'uniform',    qty:120, lowAlert:20, price:35.00, supplier:'Ghana Uniforms Ltd', size:'S,M,L,XL',    location:'Store A', notes:'' },
  { name:'School Shirt (Girls)',     category:'uniform',    qty:95,  lowAlert:20, price:35.00, supplier:'Ghana Uniforms Ltd', size:'S,M,L,XL',    location:'Store A', notes:'' },
  { name:'School Shorts (Boys)',     category:'uniform',    qty:80,  lowAlert:15, price:28.00, supplier:'Ghana Uniforms Ltd', size:'S,M,L,XL',    location:'Store A', notes:'' },
  { name:'School Skirt (Girls)',     category:'uniform',    qty:70,  lowAlert:15, price:30.00, supplier:'Ghana Uniforms Ltd', size:'S,M,L,XL',    location:'Store A', notes:'' },
  { name:'PE Kit (Boys)',            category:'uniform',    qty:60,  lowAlert:10, price:45.00, supplier:'SportsPro GH',       size:'S,M,L',        location:'Store B', notes:'' },
  { name:'PE Kit (Girls)',           category:'uniform',    qty:55,  lowAlert:10, price:45.00, supplier:'SportsPro GH',       size:'S,M,L',        location:'Store B', notes:'' },
  { name:'School Tie',               category:'uniform',    qty:8,   lowAlert:15, price:12.00, supplier:'Ghana Uniforms Ltd', size:'One Size',     location:'Store A', notes:'Low — reorder needed' },
  { name:'Mathematics Textbook',     category:'textbook',   qty:200, lowAlert:30, price:55.00, supplier:'GES Publishers',    size:'N/A',          location:'Library', notes:'JSS 1-3' },
  { name:'English Language Book',    category:'textbook',   qty:180, lowAlert:30, price:50.00, supplier:'GES Publishers',    size:'N/A',          location:'Library', notes:'' },
  { name:'Science Textbook',         category:'textbook',   qty:150, lowAlert:30, price:60.00, supplier:'GES Publishers',    size:'N/A',          location:'Library', notes:'' },
  { name:'Exercise Books (Ruled)',   category:'stationery', qty:500, lowAlert:50, price:3.50,  supplier:'Paper World',        size:'A4',           location:'Store C', notes:'Pack of 10' },
  { name:'Ballpoint Pens (Blue)',    category:'stationery', qty:300, lowAlert:50, price:1.50,  supplier:'Paper World',        size:'N/A',          location:'Store C', notes:'' },
  { name:'HB Pencils',               category:'stationery', qty:250, lowAlert:50, price:1.00,  supplier:'Paper World',        size:'N/A',          location:'Store C', notes:'' },
  { name:'Geometry Set',             category:'stationery', qty:18,  lowAlert:25, price:8.00,  supplier:'Paper World',        size:'N/A',          location:'Store C', notes:'Low stock' },
  { name:'Projector',                category:'equipment',  qty:4,   lowAlert:2,  price:1800,  supplier:'TechSupply GH',      size:'N/A',          location:'AV Room', notes:'' },
  { name:'Whiteboard Markers',       category:'equipment',  qty:60,  lowAlert:20, price:4.00,  supplier:'Office Plus',        size:'N/A',          location:'Store C', notes:'Pack of 5' },
  { name:'Football',                 category:'sports',     qty:12,  lowAlert:5,  price:80.00, supplier:'SportsPro GH',       size:'Size 5',       location:'Sports Store', notes:'' },
  { name:'Volleyball Net',           category:'sports',     qty:3,   lowAlert:2,  price:150.00,supplier:'SportsPro GH',       size:'Standard',     location:'Sports Store', notes:'' },
];

let invItems = [];
let invActiveCategory = 'all';
let invSearchQuery = '';

function invLoad() {
  const stored = localStorage.getItem('hc_inventory');
  invItems = stored ? JSON.parse(stored) : JSON.parse(JSON.stringify(INV_DEFAULT));
}

function invSave() {
  localStorage.setItem('hc_inventory', JSON.stringify(invItems));
}

function invStockClass(item) {
  if (item.qty === 0) return 'inv-out';
  if (item.qty <= item.lowAlert) return 'inv-low';
  return 'inv-ok';
}
function invStockLabel(item) {
  if (item.qty === 0) return '<span class="badge badge-overdue">Out of Stock</span>';
  if (item.qty <= item.lowAlert) return '<span class="badge badge-pending">Low Stock</span>';
  return '<span class="badge badge-paid">In Stock</span>';
}

function renderInventory() {
  const grid = document.getElementById('invGrid');
  if (!grid) return;

  const filtered = invItems.filter((item, idx) => {
    item._idx = idx;
    const matchCat = invActiveCategory === 'all' || item.category === invActiveCategory;
    const matchQ   = !invSearchQuery || item.name.toLowerCase().includes(invSearchQuery) ||
                     INV_CATEGORY_LABELS[item.category]?.toLowerCase().includes(invSearchQuery) ||
                     (item.supplier||'').toLowerCase().includes(invSearchQuery);
    return matchCat && matchQ;
  });

  if (!filtered.length) {
    grid.innerHTML = '<div class="inv-empty"><i data-lucide="package-open"></i><p>No items found</p></div>';
    lucide.createIcons(); updateInvKPIs(); return;
  }

  grid.innerHTML = filtered.map(item => {
    const sc = invStockClass(item);
    const icon = INV_CATEGORY_ICONS[item.category] || 'box';
    const totalVal = (item.qty * item.price).toFixed(2);
    return `<div class="inv-card ${sc}" data-idx="${item._idx}">
      <div class="inv-card-top">
        <div class="inv-cat-icon"><i data-lucide="${icon}"></i></div>
        <div class="inv-card-actions">
          <button class="btn-icon" title="Issue / Receipt" onclick="openReceiptModal(${item._idx})"><i data-lucide="receipt"></i></button>
          <button class="btn-icon" title="Edit" onclick="editInventoryItem(${item._idx})"><i data-lucide="edit-2"></i></button>
          <button class="btn-icon" title="Delete" onclick="deleteInventoryItem(${item._idx})"><i data-lucide="trash-2"></i></button>
        </div>
      </div>
      <div class="inv-card-body">
        <div class="inv-card-name">${item.name}</div>
        <div class="inv-card-cat">${INV_CATEGORY_LABELS[item.category] || item.category}${item.size && item.size !== 'N/A' ? ' &bull; ' + item.size : ''}</div>
        <div class="inv-card-stock">${invStockLabel(item)}</div>
        <div class="inv-card-stats">
          <div class="inv-stat"><span class="inv-stat-val">${item.qty}</span><span class="inv-stat-lbl">Qty</span></div>
          <div class="inv-stat"><span class="inv-stat-val">₵${Number(item.price).toFixed(2)}</span><span class="inv-stat-lbl">Unit Price</span></div>
          <div class="inv-stat"><span class="inv-stat-val">₵${totalVal}</span><span class="inv-stat-lbl">Total Value</span></div>
        </div>
        ${item.supplier ? `<div class="inv-card-supplier"><i data-lucide="truck" style="width:12px;height:12px;"></i> ${item.supplier}</div>` : ''}
        ${item.location ? `<div class="inv-card-supplier"><i data-lucide="map-pin" style="width:12px;height:12px;"></i> ${item.location}</div>` : ''}
        ${item.notes ? `<div class="inv-card-notes">${item.notes}</div>` : ''}
      </div>
    </div>`;
  }).join('');
  lucide.createIcons();
  updateInvKPIs();
}

function updateInvKPIs() {
  const total   = invItems.length;
  const low     = invItems.filter(i => i.qty > 0 && i.qty <= i.lowAlert).length;
  const out     = invItems.filter(i => i.qty === 0).length;
  const inStock = total - low - out;
  const value   = invItems.reduce((s, i) => s + i.qty * i.price, 0);
  const t = document.getElementById('invTotalItems'); if(t) t.textContent = total;
  const l = document.getElementById('invLowStock');   if(l) l.textContent = low + out;
  const k = document.getElementById('invInStock');    if(k) k.textContent = inStock;
  const v = document.getElementById('invTotalValue'); if(v) v.textContent = '₵' + value.toFixed(2);
}

function openInventoryModal(editIdx) {
  const isEdit = editIdx !== undefined;
  document.getElementById('invModalTitle').textContent = isEdit ? 'Edit Inventory Item' : 'Add Inventory Item';
  document.getElementById('invEditIndex').value = isEdit ? editIdx : '';
  const fields = ['invName','invQty','invLowAlert','invPrice','invSupplier','invSize','invLocation','invNotes'];
  if (isEdit) {
    const item = invItems[editIdx];
    document.getElementById('invName').value      = item.name;
    document.getElementById('invCategory').value  = item.category;
    document.getElementById('invQty').value       = item.qty;
    document.getElementById('invLowAlert').value  = item.lowAlert;
    document.getElementById('invPrice').value     = item.price;
    document.getElementById('invSupplier').value  = item.supplier || '';
    document.getElementById('invSize').value      = item.size || '';
    document.getElementById('invLocation').value  = item.location || '';
    document.getElementById('invNotes').value     = item.notes || '';
  } else {
    fields.forEach(id => { document.getElementById(id).value = ''; });
    document.getElementById('invCategory').value = 'uniform';
  }
  openModal('invItemModal');
}

function editInventoryItem(idx) { openInventoryModal(idx); }

function saveInventoryItem() {
  const name = document.getElementById('invName')?.value.trim();
  if (!name) { alert('Please enter an item name.'); return; }
  const item = {
    name,
    category: document.getElementById('invCategory')?.value || 'other',
    qty:      parseInt(document.getElementById('invQty')?.value)    || 0,
    lowAlert: parseInt(document.getElementById('invLowAlert')?.value) || 10,
    price:    parseFloat(document.getElementById('invPrice')?.value)  || 0,
    supplier: document.getElementById('invSupplier')?.value.trim() || '',
    size:     document.getElementById('invSize')?.value.trim()     || 'N/A',
    location: document.getElementById('invLocation')?.value.trim() || '',
    notes:    document.getElementById('invNotes')?.value.trim()    || '',
  };
  const idx = document.getElementById('invEditIndex')?.value;
  if (idx !== '') { invItems[parseInt(idx)] = item; }
  else { invItems.push(item); }
  invSave();
  renderInventory();
  closeModal('invItemModal');
}

function deleteInventoryItem(idx) {
  if (!confirm(`Remove "${invItems[idx]?.name}" from inventory?`)) return;
  invItems.splice(idx, 1);
  invSave();
  renderInventory();
}

function filterInventory(query) {
  invSearchQuery = query.toLowerCase();
  renderInventory();
}

function filterInvCategory(cat, btn) {
  document.querySelectorAll('#tab-inventory .adm-filter-pill').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  invActiveCategory = cat;
  renderInventory();
}

function exportInventory() {
  const today = new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'long', year:'numeric' });
  const totalValue = invItems.reduce((s,i) => s + i.qty * i.price, 0);
  const rows = invItems.map((item, i) => `
    <tr>
      <td>${i+1}</td>
      <td><strong>${item.name}</strong></td>
      <td>${INV_CATEGORY_LABELS[item.category] || item.category}</td>
      <td style="text-align:center;">${item.qty}</td>
      <td style="text-align:center;">₵${Number(item.price).toFixed(2)}</td>
      <td style="text-align:center;">₵${(item.qty * item.price).toFixed(2)}</td>
      <td style="text-align:center;">${item.size || 'N/A'}</td>
      <td>${item.supplier || '—'}</td>
      <td style="text-align:center;"><span class="badge ${item.qty===0?'out':item.qty<=item.lowAlert?'low':'ok'}">${item.qty===0?'Out':item.qty<=item.lowAlert?'Low':'OK'}</span></td>
    </tr>`).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Inventory Report</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:'Segoe UI',Arial,sans-serif;color:#1e1b4b;padding:32px;font-size:12px;}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:14px;border-bottom:2px solid #6366f1;}
    .header h1{font-size:20px;font-weight:800;color:#6366f1;} .header p{font-size:11px;color:#64748b;margin-top:4px;}
    .meta{display:flex;gap:24px;margin-bottom:18px;}
    .meta-item{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:8px 16px;}
    .meta-item .val{font-size:16px;font-weight:800;color:#6366f1;} .meta-item .lbl{font-size:10px;color:#94a3b8;margin-top:2px;}
    table{width:100%;border-collapse:collapse;}
    thead tr{background:#6366f1;color:#fff;}
    thead th{padding:9px 10px;text-align:left;font-size:11px;font-weight:700;}
    tbody tr:nth-child(even){background:#f8fafc;}
    tbody td{padding:8px 10px;border-bottom:1px solid #e2e8f0;}
    .badge{padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;}
    .badge.ok{background:#dcfce7;color:#15803d;} .badge.low{background:#fef3c7;color:#b45309;} .badge.out{background:#fee2e2;color:#dc2626;}
    .footer{margin-top:20px;padding-top:10px;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8;display:flex;justify-content:space-between;}
    @media print{body{padding:16px;}}
  </style></head><body>
  <div class="header"><div><h1>Acaxel School — Inventory Report</h1><p>Generated on ${today}</p></div></div>
  <div class="meta">
    <div class="meta-item"><div class="val">${invItems.length}</div><div class="lbl">Total Items</div></div>
    <div class="meta-item"><div class="val">${invItems.filter(i=>i.qty===0).length}</div><div class="lbl">Out of Stock</div></div>
    <div class="meta-item"><div class="val">${invItems.filter(i=>i.qty>0&&i.qty<=i.lowAlert).length}</div><div class="lbl">Low Stock</div></div>
    <div class="meta-item"><div class="val">₵${totalValue.toFixed(2)}</div><div class="lbl">Total Value</div></div>
  </div>
  <table><thead><tr><th>#</th><th>Item Name</th><th>Category</th><th>Qty</th><th>Unit Price</th><th>Total Value</th><th>Size</th><th>Supplier</th><th>Status</th></tr></thead>
  <tbody>${rows}</tbody></table>
  <div class="footer"><span>Acaxel School Management System</span><span>${today}</span></div>
  <script>window.onload=()=>{window.print();}<\/script>
  </body></html>`;
  const win = window.open('','_blank');
  if (win) { win.document.write(html); win.document.close(); }
}

let _receiptItemIdx = null;

function openReceiptModal(idx) {
  _receiptItemIdx = idx;
  const item = invItems[idx];
  if (!item) return;
  document.getElementById('rcItemName').textContent  = item.name;
  document.getElementById('rcUnitPrice').textContent = '₵' + Number(item.price).toFixed(2);
  document.getElementById('rcCategory').textContent  = INV_CATEGORY_LABELS[item.category] || item.category;
  document.getElementById('rcSize').textContent      = item.size || 'N/A';
  document.getElementById('rcQtyInput').value        = 1;
  document.getElementById('rcTotal').textContent     = '₵' + Number(item.price).toFixed(2);
  document.getElementById('rcStudentName').value     = '';
  document.getElementById('rcStudentId').value       = '';
  document.getElementById('rcParentName').value      = '';
  document.getElementById('rcClass').value           = '';
  document.getElementById('rcPayMethod').value       = 'Cash';
  document.getElementById('rcDate').value            = new Date().toISOString().split('T')[0];
  openModal('invReceiptModal');
}

function rcUpdateTotal() {
  const idx   = _receiptItemIdx;
  if (idx === null || !invItems[idx]) return;
  const qty   = parseInt(document.getElementById('rcQtyInput')?.value) || 1;
  const price = Number(invItems[idx].price);
  document.getElementById('rcTotal').textContent = '₵' + (qty * price).toFixed(2);
}

function printReceipt() {
  const idx  = _receiptItemIdx;
  if (idx === null || !invItems[idx]) return;
  const item = invItems[idx];

  const studentName = document.getElementById('rcStudentName')?.value.trim() || '—';
  const studentId   = document.getElementById('rcStudentId')?.value.trim()   || '—';
  const parentName  = document.getElementById('rcParentName')?.value.trim()  || '—';
  const cls         = document.getElementById('rcClass')?.value.trim()        || '—';
  const qty         = parseInt(document.getElementById('rcQtyInput')?.value)  || 1;
  const payMethod   = document.getElementById('rcPayMethod')?.value           || 'Cash';
  const dateVal     = document.getElementById('rcDate')?.value;
  const dateStr     = dateVal ? new Date(dateVal).toLocaleDateString('en-GB', { day:'2-digit', month:'long', year:'numeric' }) : '—';
  const total       = (qty * Number(item.price)).toFixed(2);
  const receiptNo   = 'RCP-' + Date.now().toString().slice(-6);

  if (!studentName || studentName === '—') { alert('Please enter the student name.'); return; }

  /* deduct from inventory */
  invItems[idx].qty = Math.max(0, invItems[idx].qty - qty);
  invSave();
  renderInventory();
  closeModal('invReceiptModal');

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Receipt ${receiptNo}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:'Segoe UI',Arial,sans-serif;color:#1e1b4b;padding:40px;font-size:13px;max-width:520px;margin:auto;}
    .school-header{text-align:center;margin-bottom:28px;}
    .school-logo{width:52px;height:52px;background:#6366f1;border-radius:12px;margin:0 auto 10px;display:flex;align-items:center;justify-content:center;}
    .school-logo span{color:#fff;font-size:22px;font-weight:900;}
    .school-name{font-size:20px;font-weight:800;color:#6366f1;}
    .school-sub{font-size:11px;color:#64748b;margin-top:2px;}
    .receipt-title{text-align:center;font-size:15px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;color:#1e1b4b;margin:18px 0 4px;}
    .receipt-meta{display:flex;justify-content:space-between;font-size:11px;color:#64748b;margin-bottom:20px;}
    .section{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 18px;margin-bottom:14px;}
    .section-title{font-size:11px;font-weight:700;color:#94a3b8;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:10px;}
    .row{display:flex;justify-content:space-between;margin-bottom:6px;font-size:12.5px;}
    .row .lbl{color:#64748b;} .row .val{font-weight:600;color:#1e1b4b;}
    .divider{border:none;border-top:1px dashed #e2e8f0;margin:12px 0;}
    .total-row{display:flex;justify-content:space-between;font-size:16px;font-weight:800;color:#6366f1;padding:10px 0 2px;}
    .badge-pay{display:inline-block;background:#dcfce7;color:#15803d;padding:3px 12px;border-radius:20px;font-size:11px;font-weight:700;}
    .footer{text-align:center;margin-top:24px;font-size:10.5px;color:#94a3b8;line-height:1.7;}
    .footer strong{color:#6366f1;}
    @media print{body{padding:20px;} button{display:none;}}
  </style></head><body>
  <div class="school-header">
    <div class="school-logo"><span>A</span></div>
    <div class="school-name">Acaxel School</div>
    <div class="school-sub">Official Item Issuance Receipt</div>
  </div>
  <div class="receipt-title">Receipt</div>
  <div class="receipt-meta"><span>Receipt No: <strong>${receiptNo}</strong></span><span>Date: ${dateStr}</span></div>

  <div class="section">
    <div class="section-title">Student / Parent Details</div>
    <div class="row"><span class="lbl">Student Name</span><span class="val">${studentName}</span></div>
    <div class="row"><span class="lbl">Student ID</span><span class="val">${studentId}</span></div>
    <div class="row"><span class="lbl">Class</span><span class="val">${cls}</span></div>
    <div class="row"><span class="lbl">Parent / Guardian</span><span class="val">${parentName}</span></div>
  </div>

  <div class="section">
    <div class="section-title">Item Details</div>
    <div class="row"><span class="lbl">Item</span><span class="val">${item.name}</span></div>
    <div class="row"><span class="lbl">Category</span><span class="val">${INV_CATEGORY_LABELS[item.category] || item.category}</span></div>
    <div class="row"><span class="lbl">Size / Variant</span><span class="val">${item.size || 'N/A'}</span></div>
    <div class="row"><span class="lbl">Quantity</span><span class="val">${qty}</span></div>
    <div class="row"><span class="lbl">Unit Price</span><span class="val">₵${Number(item.price).toFixed(2)}</span></div>
    <hr class="divider"/>
    <div class="total-row"><span>Total Amount</span><span>₵${total}</span></div>
    <div style="margin-top:8px;"><span class="badge-pay">${payMethod}</span></div>
  </div>

  <div class="footer">
    This receipt confirms the issuance of the above item(s) to the student.<br/>
    Please retain this receipt for your records.<br/><br/>
    <strong>Acaxel School Management System</strong><br/>
    Thank you.
  </div>
  <script>window.onload=()=>{window.print();}<\/script>
  </body></html>`;

  const win = window.open('', '_blank');
  if (win) { win.document.write(html); win.document.close(); }
}

function initInventory() {
  invLoad();
  renderInventory();
}

// ===== WEEKLY & MONTHLY UPDATES =====
const UPD_TYPE_META = {
  weekly:   { label:'Weekly Update',   color:'#6366f1', bg:'rgba(99,102,241,0.1)',  icon:'calendar-days' },
  monthly:  { label:'Monthly Update',  color:'#8b5cf6', bg:'rgba(139,92,246,0.1)',  icon:'calendar' },
  notice:   { label:'General Notice',  color:'#0ea5e9', bg:'rgba(14,165,233,0.1)',  icon:'megaphone' },
  academic: { label:'Academic Report', color:'#16a34a', bg:'rgba(22,163,74,0.1)',   icon:'book-open' },
  finance:  { label:'Finance Notice',  color:'#d97706', bg:'rgba(217,119,6,0.1)',   icon:'coins' },
  health:   { label:'Health & Safety', color:'#dc2626', bg:'rgba(220,38,38,0.1)',   icon:'heart-pulse' },
};
const UPD_AUDIENCE_LABELS = {
  all:'All (Parents, Staff & Students)', parents:'Parents Only', staff:'Staff Only', students:'Students Only'
};

const UPD_DEFAULT = [
  {
    title: 'Week 1 Academic Update — Term 2',
    type: 'weekly', date: (() => { const d=new Date(); d.setDate(d.getDate()-3); return d.toISOString().split('T')[0]; })(),
    author: 'Head Teacher', audience: 'all', pinned: true,
    body: 'This week students covered chapters 4–6 in Mathematics and completed their mid-term assignments in English. Science practical exams are scheduled for next week. Parents are reminded to ensure students bring their lab coats.\n\nAttendance this week stood at 94%. Three students were absent due to illness and have been notified.'
  },
  {
    title: 'May Monthly Report — Finance & Fees',
    type: 'monthly', date: (() => { const d=new Date(); d.setDate(d.getDate()-10); return d.toISOString().split('T')[0]; })(),
    author: 'Admin', audience: 'parents', pinned: false,
    body: 'Fee collection for the month of May stands at 87%. Parents with outstanding balances are kindly requested to clear payments by the 30th of May to avoid any disruption to their ward\'s academic activities.\n\nFeeding fees for the term have been updated — please see the Feeding Collection section for details.'
  },
  {
    title: 'Health Notice — Hand Washing Campaign',
    type: 'health', date: (() => { const d=new Date(); d.setDate(d.getDate()-5); return d.toISOString().split('T')[0]; })(),
    author: 'School Nurse', audience: 'all', pinned: false,
    body: 'As part of our hygiene initiative, all students are required to wash hands before and after meals and after using the restroom. Hand sanitisers have been placed at all classroom entrances. Parents are encouraged to reinforce these habits at home.'
  },
  {
    title: 'Week 2 Academic Update — Term 2',
    type: 'weekly', date: (() => { const d=new Date(); d.setDate(d.getDate()-9); return d.toISOString().split('T')[0]; })(),
    author: 'Head Teacher', audience: 'all', pinned: false,
    body: 'Week 2 saw great progress across all classes. JSS 2 students excelled in their group presentations. End-of-week quizzes are being marked and results will be shared by Monday.'
  },
  {
    title: 'April Monthly Academic Summary',
    type: 'monthly', date: (() => { const d=new Date(); d.setMonth(d.getMonth()-1); return d.toISOString().split('T')[0]; })(),
    author: 'Admin', audience: 'all', pinned: false,
    body: 'April was a productive month with a school-wide average score of 72% across all subjects. Science and Mathematics continue to show improvement. Students who need extra support have been referred to our after-school tutoring programme.'
  },
];

let updItems = [];
let updPeriodFilter = 'all';
let updTypeFilter  = 'all';
let updSearchQ     = '';

function updLoad() {
  const stored = localStorage.getItem('hc_updates');
  updItems = stored ? JSON.parse(stored) : JSON.parse(JSON.stringify(UPD_DEFAULT));
}
function updSave() { localStorage.setItem('hc_updates', JSON.stringify(updItems)); }

function updInThisWeek(dateStr) {
  const d = new Date(dateStr); const now = new Date();
  const day = now.getDay() || 7;
  const mon = new Date(now); mon.setDate(now.getDate() - day + 1); mon.setHours(0,0,0,0);
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6); sun.setHours(23,59,59,999);
  return d >= mon && d <= sun;
}
function updInThisMonth(dateStr) {
  const d = new Date(dateStr); const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function renderUpdates() {
  const feed = document.getElementById('updFeed');
  if (!feed) return;

  let list = [...updItems].map((u, i) => ({ ...u, _idx: i }));

  // sort: pinned first, then newest
  list.sort((a, b) => {
    if (b.pinned !== a.pinned) return b.pinned ? 1 : -1;
    return new Date(b.date) - new Date(a.date);
  });

  // filters
  list = list.filter(u => {
    if (updPeriodFilter === 'week'   && !updInThisWeek(u.date))  return false;
    if (updPeriodFilter === 'month'  && !updInThisMonth(u.date)) return false;
    if (updPeriodFilter === 'pinned' && !u.pinned)               return false;
    if (updTypeFilter !== 'all' && u.type !== updTypeFilter)     return false;
    if (updSearchQ && !u.title.toLowerCase().includes(updSearchQ) &&
        !u.body.toLowerCase().includes(updSearchQ))              return false;
    return true;
  });

  if (!list.length) {
    feed.innerHTML = '<div class="upd-empty"><i data-lucide="inbox"></i><p>No updates found</p></div>';
    lucide.createIcons(); updateUpdKPIs(); return;
  }

  feed.innerHTML = list.map(u => {
    const meta  = UPD_TYPE_META[u.type] || UPD_TYPE_META.notice;
    const dateF = new Date(u.date).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
    const bodyPreview = u.body.length > 220 ? u.body.substring(0, 220) + '…' : u.body;
    return `<div class="upd-card${u.pinned ? ' upd-pinned' : ''}">
      <div class="upd-card-side" style="background:${meta.bg};border-color:${meta.color}20;">
        <i data-lucide="${meta.icon}" style="stroke:${meta.color};width:20px;height:20px;"></i>
      </div>
      <div class="upd-card-body">
        <div class="upd-card-top">
          <div class="upd-badges">
            <span class="upd-type-badge" style="background:${meta.bg};color:${meta.color};">${meta.label}</span>
            <span class="upd-aud-badge">${UPD_AUDIENCE_LABELS[u.audience] || u.audience}</span>
            ${u.pinned ? '<span class="upd-pin-badge"><i data-lucide="pin" style="width:11px;height:11px;"></i> Pinned</span>' : ''}
          </div>
          <div class="upd-card-actions">
            <button class="btn-icon" title="${u.pinned ? 'Unpin':'Pin'}" onclick="togglePin(${u._idx})"><i data-lucide="${u.pinned ? 'pin-off':'pin'}"></i></button>
            <button class="btn-icon" title="Edit" onclick="editUpdate(${u._idx})"><i data-lucide="edit-2"></i></button>
            <button class="btn-icon" title="Delete" onclick="deleteUpdate(${u._idx})"><i data-lucide="trash-2"></i></button>
          </div>
        </div>
        <div class="upd-card-title">${u.title}</div>
        <div class="upd-card-meta"><i data-lucide="user" style="width:12px;height:12px;"></i> ${u.author} &nbsp;&bull;&nbsp; <i data-lucide="clock" style="width:12px;height:12px;"></i> ${dateF}</div>
        <div class="upd-card-content">${bodyPreview.replace(/\n/g,'<br/>')}</div>
      </div>
    </div>`;
  }).join('');
  lucide.createIcons();
  updateUpdKPIs();
}

function updateUpdKPIs() {
  const total   = updItems.length;
  const weekly  = updItems.filter(u => updInThisWeek(u.date)).length;
  const monthly = updItems.filter(u => updInThisMonth(u.date)).length;
  const pinned  = updItems.filter(u => u.pinned).length;
  const t = document.getElementById('updTotal');   if(t) t.textContent = total;
  const w = document.getElementById('updWeekly');  if(w) w.textContent = weekly;
  const m = document.getElementById('updMonthly'); if(m) m.textContent = monthly;
  const p = document.getElementById('updPinned');  if(p) p.textContent = pinned;
}

function openAddUpdateModal() {
  document.getElementById('updModalTitle').textContent = 'New Update';
  document.getElementById('updEditIndex').value = '';
  document.getElementById('updTitle').value   = '';
  document.getElementById('updType').value    = 'weekly';
  document.getElementById('updDate').value    = new Date().toISOString().split('T')[0];
  document.getElementById('updAuthor').value  = 'Admin';
  document.getElementById('updAudience').value= 'all';
  document.getElementById('updBody').value    = '';
  document.getElementById('updPinCheck').checked = false;
}

function editUpdate(idx) {
  const u = updItems[idx]; if (!u) return;
  document.getElementById('updModalTitle').textContent = 'Edit Update';
  document.getElementById('updEditIndex').value = idx;
  document.getElementById('updTitle').value    = u.title;
  document.getElementById('updType').value     = u.type;
  document.getElementById('updDate').value     = u.date;
  document.getElementById('updAuthor').value   = u.author;
  document.getElementById('updAudience').value = u.audience;
  document.getElementById('updBody').value     = u.body;
  document.getElementById('updPinCheck').checked = u.pinned;
  openModal('addUpdateModal');
}

function saveUpdate() {
  const title = document.getElementById('updTitle')?.value.trim();
  if (!title) { alert('Please enter a title.'); return; }
  const u = {
    title,
    type:     document.getElementById('updType')?.value     || 'weekly',
    date:     document.getElementById('updDate')?.value     || new Date().toISOString().split('T')[0],
    author:   document.getElementById('updAuthor')?.value.trim() || 'Admin',
    audience: document.getElementById('updAudience')?.value || 'all',
    body:     document.getElementById('updBody')?.value.trim() || '',
    pinned:   document.getElementById('updPinCheck')?.checked || false,
  };
  const idx = document.getElementById('updEditIndex')?.value;
  if (idx !== '') { updItems[parseInt(idx)] = u; }
  else { updItems.unshift(u); }
  updSave();
  renderUpdates();
  closeModal('addUpdateModal');
}

function deleteUpdate(idx) {
  if (!confirm(`Delete "${updItems[idx]?.title}"?`)) return;
  updItems.splice(idx, 1);
  updSave();
  renderUpdates();
}

function togglePin(idx) {
  if (!updItems[idx]) return;
  updItems[idx].pinned = !updItems[idx].pinned;
  updSave();
  renderUpdates();
}

function filterUpdPeriod(period, btn) {
  document.querySelectorAll('#tab-updates .adm-filter-pills:first-of-type .adm-filter-pill').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  updPeriodFilter = period;
  renderUpdates();
}

function filterUpdType(type, btn) {
  document.querySelectorAll('#tab-updates .adm-filter-pills:last-of-type .adm-filter-pill').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  updTypeFilter = type;
  renderUpdates();
}

function filterUpdates(query) {
  updSearchQ = query.toLowerCase();
  renderUpdates();
}

function initUpdates() {
  updLoad();
  renderUpdates();
}

// ===== NEWSLETTER =====
const NL_AUD_LABELS = {
  all:'All (Parents, Staff & Students)', parents:'Parents Only',
  staff:'Staff Only', students:'Students Only'
};

const NL_DEFAULT = [
  {
    title:'Acaxel School Newsletter — May 2026, Issue 3',
    issue:'Vol. 1, Issue 3', date: new Date().toISOString().split('T')[0],
    audience:'all', author:'Head Teacher', status:'sent',
    intro:'Dear Parents and Guardians,\n\nWe are delighted to share our latest school newsletter covering the highlights of the past month. Thank you for your continued support and partnership in your child\'s education.',
    academic:'JSS 2 students achieved a class average of 78% in their mid-term exams, with exceptional performance in Mathematics. Science group projects were presented this week and the quality of work was outstanding. End-of-term examinations are scheduled for the 3rd week of June.',
    events:'Sports Day is confirmed for Saturday 7th June. All parents are warmly invited. The Cultural Day performance will take place on 20th June. Students should begin preparing their cultural presentations.',
    health:'All students are reminded to bring water bottles daily. The school nurse will conduct routine health checks for JSS 1 students next week. Parents of students with known allergies should update the school records.',
    finance:'Term 2 fees are due by 31st May. Feeding collection for June is now open. Please see the Feeding Collection section for updated meal fees. Uniform purchases can be made at the school store.',
    notices:'School closes at 1:00 PM on Fridays during June for staff development. The school library will be open for extended hours 7 AM – 5 PM starting next week.',
    closing:'Thank you for your continued trust and support. Together we are building a brighter future for our children.\n\nWarm regards,\nHead Teacher, Acaxel School'
  },
  {
    title:'Acaxel School Newsletter — April 2026, Issue 2',
    issue:'Vol. 1, Issue 2', date: (() => { const d=new Date(); d.setMonth(d.getMonth()-1); return d.toISOString().split('T')[0]; })(),
    audience:'parents', author:'Admin', status:'sent',
    intro:'Dear Parents,\n\nHere is our April newsletter summarising the month\'s highlights.',
    academic:'April saw great progress across all year groups. The inter-class quiz competition was won by JSS 3B. Congratulations to all participants.',
    events:'The Easter break was a success. Students returned refreshed and focused. The school garden project launched with JSS 1 students.',
    health:'Reminder: Any student with symptoms of illness should remain at home. Please notify the school office promptly.',
    finance:'All Term 2 fees have been received. Thank you for prompt payments. Feeding collection for May opens on the 28th April.',
    notices:'New reading books have arrived in the library. Students are encouraged to borrow and read regularly.',
    closing:'Thank you for being wonderful partners in your child\'s learning journey.\n\nRegards,\nAcaxel School Administration'
  },
];

let nlItems = [];
let nlStatusFilter = 'all';
let nlSearchQ = '';

function nlLoad() {
  const stored = localStorage.getItem('hc_newsletters');
  nlItems = stored ? JSON.parse(stored) : JSON.parse(JSON.stringify(NL_DEFAULT));
}
function nlSave() { localStorage.setItem('hc_newsletters', JSON.stringify(nlItems)); }

function nlInThisMonth(dateStr) {
  const d = new Date(dateStr), now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function renderNewsletters() {
  const grid = document.getElementById('nlGrid');
  if (!grid) return;

  let list = nlItems.map((n, i) => ({ ...n, _idx: i }))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  list = list.filter(n => {
    if (nlStatusFilter !== 'all' && n.status !== nlStatusFilter) return false;
    if (nlSearchQ && !n.title.toLowerCase().includes(nlSearchQ) &&
        !(n.intro||'').toLowerCase().includes(nlSearchQ)) return false;
    return true;
  });

  if (!list.length) {
    grid.innerHTML = '<div class="nl-empty"><i data-lucide="mail-open"></i><p>No newsletters found</p></div>';
    lucide.createIcons(); updateNlKPIs(); return;
  }

  grid.innerHTML = list.map(n => {
    const isSent = n.status === 'sent';
    const dateF  = new Date(n.date).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
    const preview = (n.intro || '').substring(0, 130) + ((n.intro||'').length > 130 ? '…' : '');
    return `<div class="nl-card">
      <div class="nl-card-header">
        <div class="nl-card-icon"><i data-lucide="mail"></i></div>
        <div class="nl-card-badges">
          <span class="nl-status-badge ${isSent ? 'nl-sent' : 'nl-draft'}">${isSent ? 'Sent' : 'Draft'}</span>
          <span class="nl-aud-badge">${NL_AUD_LABELS[n.audience] || n.audience}</span>
        </div>
        <div class="nl-card-actions">
          <button class="btn-icon" title="Export PDF" onclick="exportNewsletter(${n._idx})"><i data-lucide="file-down"></i></button>
          <button class="btn-icon" title="Edit" onclick="editNewsletter(${n._idx})"><i data-lucide="edit-2"></i></button>
          <button class="btn-icon" title="Delete" onclick="deleteNewsletter(${n._idx})"><i data-lucide="trash-2"></i></button>
        </div>
      </div>
      <div class="nl-card-body">
        <div class="nl-card-title">${n.title}</div>
        <div class="nl-card-meta">
          <span><i data-lucide="hash" style="width:11px;height:11px;"></i> ${n.issue || '—'}</span>
          <span><i data-lucide="user" style="width:11px;height:11px;"></i> ${n.author}</span>
          <span><i data-lucide="clock" style="width:11px;height:11px;"></i> ${dateF}</span>
        </div>
        <div class="nl-card-preview">${preview}</div>
      </div>
      <div class="nl-card-footer">
        <button class="nl-section-pill" onclick="exportNewsletter(${n._idx})"><i data-lucide="file-down" style="width:13px;height:13px;"></i> Export PDF</button>
        ${!isSent ? `<button class="nl-section-pill nl-mark-sent" onclick="markNlSent(${n._idx})"><i data-lucide="send" style="width:13px;height:13px;"></i> Mark as Sent</button>` : ''}
      </div>
    </div>`;
  }).join('');
  lucide.createIcons();
  updateNlKPIs();
}

function updateNlKPIs() {
  const t = nlItems.length;
  const s = nlItems.filter(n => n.status === 'sent').length;
  const d = nlItems.filter(n => n.status === 'draft').length;
  const m = nlItems.filter(n => nlInThisMonth(n.date)).length;
  const el = id => document.getElementById(id);
  if(el('nlTotal'))    el('nlTotal').textContent    = t;
  if(el('nlSent'))     el('nlSent').textContent     = s;
  if(el('nlDraft'))    el('nlDraft').textContent    = d;
  if(el('nlThisMonth'))el('nlThisMonth').textContent= m;
}

function openNewsletterModal(editIdx) {
  const isEdit = editIdx !== undefined;
  document.getElementById('nlModalTitle').textContent = isEdit ? 'Edit Newsletter' : 'Create Newsletter';
  document.getElementById('nlEditIndex').value = isEdit ? editIdx : '';
  const fields = ['nlTitle','nlIssue','nlAuthor','nlIntro','nlAcademic','nlEvents','nlHealth','nlFinance','nlNotices','nlClosing'];
  if (isEdit) {
    const n = nlItems[editIdx];
    document.getElementById('nlTitle').value    = n.title;
    document.getElementById('nlIssue').value    = n.issue || '';
    document.getElementById('nlDate').value     = n.date;
    document.getElementById('nlAudience').value = n.audience;
    document.getElementById('nlAuthor').value   = n.author;
    document.getElementById('nlIntro').value    = n.intro || '';
    document.getElementById('nlAcademic').value = n.academic || '';
    document.getElementById('nlEvents').value   = n.events || '';
    document.getElementById('nlHealth').value   = n.health || '';
    document.getElementById('nlFinance').value  = n.finance || '';
    document.getElementById('nlNotices').value  = n.notices || '';
    document.getElementById('nlClosing').value  = n.closing || '';
    document.getElementById('nlMarkSent').checked = n.status === 'sent';
  } else {
    fields.forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
    document.getElementById('nlDate').value     = new Date().toISOString().split('T')[0];
    document.getElementById('nlAudience').value = 'all';
    document.getElementById('nlAuthor').value   = 'Admin';
    document.getElementById('nlMarkSent').checked = false;
  }
  openModal('nlModal');
}

function editNewsletter(idx) { openNewsletterModal(idx); }

function saveNewsletter(exportAfter) {
  const title = document.getElementById('nlTitle')?.value.trim();
  if (!title) { alert('Please enter a newsletter title.'); return; }
  const n = {
    title,
    issue:    document.getElementById('nlIssue')?.value.trim()    || '',
    date:     document.getElementById('nlDate')?.value            || new Date().toISOString().split('T')[0],
    audience: document.getElementById('nlAudience')?.value        || 'all',
    author:   document.getElementById('nlAuthor')?.value.trim()   || 'Admin',
    status:   document.getElementById('nlMarkSent')?.checked ? 'sent' : 'draft',
    intro:    document.getElementById('nlIntro')?.value.trim()    || '',
    academic: document.getElementById('nlAcademic')?.value.trim() || '',
    events:   document.getElementById('nlEvents')?.value.trim()   || '',
    health:   document.getElementById('nlHealth')?.value.trim()   || '',
    finance:  document.getElementById('nlFinance')?.value.trim()  || '',
    notices:  document.getElementById('nlNotices')?.value.trim()  || '',
    closing:  document.getElementById('nlClosing')?.value.trim()  || '',
  };
  const idx = document.getElementById('nlEditIndex')?.value;
  if (idx !== '') { nlItems[parseInt(idx)] = n; }
  else { nlItems.unshift(n); }
  nlSave();
  renderNewsletters();
  closeModal('nlModal');
  if (exportAfter) {
    const saved = idx !== '' ? parseInt(idx) : 0;
    exportNewsletter(saved);
  }
}

function deleteNewsletter(idx) {
  if (!confirm(`Delete "${nlItems[idx]?.title}"?`)) return;
  nlItems.splice(idx, 1); nlSave(); renderNewsletters();
}

function markNlSent(idx) {
  if (!nlItems[idx]) return;
  nlItems[idx].status = 'sent'; nlSave(); renderNewsletters();
}

function filterNlStatus(status, btn) {
  document.querySelectorAll('#tab-newsletter .adm-filter-pill').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  nlStatusFilter = status; renderNewsletters();
}

function filterNewsletters(query) {
  nlSearchQ = query.toLowerCase(); renderNewsletters();
}

function nlSection(title, body) {
  if (!body || !body.trim()) return '';
  return `<div style="margin-bottom:22px;">
    <div style="font-size:12px;font-weight:800;color:#6366f1;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:8px;padding-bottom:5px;border-bottom:2px solid #e0e7ff;">${title}</div>
    <div style="font-size:13px;color:#374151;line-height:1.75;white-space:pre-wrap;">${body}</div>
  </div>`;
}

function exportNewsletter(idx) {
  const n = nlItems[idx]; if (!n) return;
  const dateF = new Date(n.date).toLocaleDateString('en-GB', { day:'2-digit', month:'long', year:'numeric' });

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
  <title>${n.title}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:'Segoe UI',Arial,sans-serif;background:#f1f5f9;padding:30px 20px;}
    .nl-wrap{max-width:680px;margin:auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 32px rgba(0,0,0,0.10);}
    .nl-header{background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);padding:36px 40px;text-align:center;color:#fff;}
    .nl-school{font-size:13px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;opacity:0.85;margin-bottom:6px;}
    .nl-title{font-size:22px;font-weight:800;line-height:1.3;margin-bottom:8px;}
    .nl-meta{font-size:11px;opacity:0.8;display:flex;justify-content:center;gap:20px;flex-wrap:wrap;}
    .nl-body{padding:36px 40px;}
    .nl-section{margin-bottom:24px;}
    .nl-section-title{font-size:11.5px;font-weight:800;color:#6366f1;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:9px;padding-bottom:6px;border-bottom:2px solid #e0e7ff;}
    .nl-section-body{font-size:13px;color:#374151;line-height:1.75;white-space:pre-wrap;}
    .nl-divider{border:none;border-top:1px solid #e5e7eb;margin:20px 0;}
    .nl-footer{background:#f8fafc;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;font-size:11px;color:#94a3b8;}
    .nl-footer strong{color:#6366f1;}
    .nl-badge{display:inline-block;background:rgba(255,255,255,0.2);padding:3px 12px;border-radius:20px;font-size:11px;font-weight:700;margin:2px;}
    @media print{body{background:#fff;padding:0;}.nl-wrap{box-shadow:none;border-radius:0;}}
  </style></head><body>
  <div class="nl-wrap">
    <div class="nl-header">
      <div class="nl-school">Acaxel School</div>
      <div class="nl-title">${n.title}</div>
      <div class="nl-meta">
        ${n.issue ? `<span>${n.issue}</span>` : ''}
        <span>${dateF}</span>
        <span>By ${n.author}</span>
        <span class="nl-badge">${NL_AUD_LABELS[n.audience] || n.audience}</span>
      </div>
    </div>
    <div class="nl-body">
      ${nlSection('Introduction', n.intro)}
      ${nlSection('Academic Highlights', n.academic)}
      ${nlSection('Events & Activities', n.events)}
      ${nlSection('Health & Safety', n.health)}
      ${nlSection('Finance & Fees', n.finance)}
      ${nlSection('General Notices', n.notices)}
      ${n.closing ? `<hr class="nl-divider"/>${nlSection('Closing Message', n.closing)}` : ''}
    </div>
    <div class="nl-footer">
      <strong>Acaxel School Management System</strong><br/>
      This newsletter was generated on ${new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'long',year:'numeric'})}.
    </div>
  </div>
  <script>window.onload=()=>{window.print();}<\/script>
  </body></html>`;

  const win = window.open('','_blank');
  if (win) { win.document.write(html); win.document.close(); }
}

function exportAllNewsletters() {
  const sent = nlItems.filter(n => n.status === 'sent');
  if (!sent.length) { alert('No sent newsletters to export.'); return; }
  sent.forEach((_, i) => {
    setTimeout(() => exportNewsletter(nlItems.indexOf(sent[i])), i * 400);
  });
}

function initNewsletter() { nlLoad(); renderNewsletters(); }

// ===== SETTINGS =====
function saveSettings() {
  alert('Settings saved successfully.');
}

// ===== MODALS =====
function openModal(id) {
  const m = document.getElementById(id);
  if (m) { m.classList.add('open'); document.body.style.overflow = 'hidden'; }
  if (id === 'editMenuModal') openEditMenuModal();
  if (id === 'addUpdateModal') openAddUpdateModal();
  if (id === 'nlModal') { const idx = document.getElementById('nlEditIndex')?.value; if (idx === '') openNewsletterModal(); }
}
function closeModal(id) {
  const m = document.getElementById(id);
  if (m) { m.classList.remove('open'); document.body.style.overflow = ''; }
}

// ===== LOGOUT =====
function logout() {
  localStorage.removeItem('hc_user');
  window.location.href = 'login.html';
}
