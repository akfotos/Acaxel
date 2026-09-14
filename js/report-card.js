/* ================================================================
   ACAXEL — PRINTABLE TERM REPORT CARD GENERATOR
   Builds a BECE/WASSCE-style terminal report (Continuous Assessment
   30% / Exam 70% split, class position, attendance, teacher remarks,
   school stamp) from whatever exam-results row is passed in, and
   opens it in a new window ready to print or save as PDF.
   ================================================================ */

(function (global) {
  'use strict';

  const REMARKS = [
    { min: 80, remark: 'Excellent performance. Keep up the outstanding work!' },
    { min: 70, remark: 'Very good result. Continue to work hard.' },
    { min: 60, remark: 'Good performance. There is room for improvement.' },
    { min: 50, remark: 'Fair performance. More effort is required next term.' },
    { min: 0,  remark: 'Needs significant improvement. Extra support recommended.' },
  ];

  function remarkFor(avg) {
    return (REMARKS.find(r => avg >= r.min) || REMARKS[REMARKS.length - 1]).remark;
  }

  function gradeFromScore(score) {
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    if (score >= 40) return 'E';
    return 'F';
  }

  /* Split a single 0-100 subject score into the standard
     CA (30%) / Exam (70%) breakdown used in Ghanaian terminal reports. */
  function splitScore(total) {
    const ca = Math.round(total * 0.3);
    const exam = Math.max(0, total - ca);
    return { ca, exam, total };
  }

  function attendanceFor(studentName) {
    try {
      const log = JSON.parse(localStorage.getItem('hc_attendance_log') || '[]');
      let presentDays = 0, totalDays = 0;
      log.forEach(entry => {
        const rec = (entry.records || []).find(r => r.name === studentName);
        if (rec) {
          totalDays++;
          if (rec.status === 'present') presentDays++;
        }
      });
      if (totalDays) return Math.round((presentDays / totalDays) * 100);
    } catch {}
    return 94; // sensible default when no offline attendance data exists yet
  }

  function studentClassAndHouse(studentName, fallbackClass) {
    if (global.schoolData && typeof global.schoolData.getStudents === 'function') {
      const s = global.schoolData.getStudents().find(st => st.fullName === studentName);
      if (s) return { class: s.class || fallbackClass, house: s.birdHouse || '—' };
    }
    return { class: fallbackClass || '—', house: '—' };
  }

  /**
   * subjects: [{ name, total }]
   * meta: { studentName, position, outOf, term }
   */
  function buildReportHtml(studentName, subjects, meta) {
    const info = (global.schoolData && global.schoolData.getSchoolInfo && global.schoolData.getSchoolInfo()) || {
      name: 'Acaxel School', motto: 'Nurturing Excellence, Building Character.',
      address: 'Accra, Ghana', academicYear: '2025/2026'
    };
    const { class: cls, house } = studentClassAndHouse(studentName, meta.class);
    const attendance = attendanceFor(studentName);
    const rows = subjects.map(s => {
      const { ca, exam, total } = (s.ca != null && s.exam != null)
        ? { ca: s.ca, exam: s.exam, total: s.total }
        : splitScore(s.total);
      const grade = gradeFromScore(total);
      return `<tr>
        <td>${s.name}</td>
        <td>${ca}</td>
        <td>${exam}</td>
        <td><strong>${total}</strong></td>
        <td>${grade}</td>
        <td>${remarkFor(total).split('.')[0]}.</td>
      </tr>`;
    }).join('');

    const overallAvg = subjects.length ? subjects.reduce((s, x) => s + x.total, 0) / subjects.length : 0;
    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

    return `<!DOCTYPE html><html><head><meta charset="UTF-8" />
<title>Terminal Report — ${studentName}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1c1917; margin: 0; padding: 32px; background: #fff; }
  .rc-wrap { max-width: 780px; margin: 0 auto; border: 2px solid #722F37; border-radius: 10px; padding: 28px 36px; position: relative; }
  .rc-header { display: flex; align-items: center; gap: 16px; border-bottom: 3px solid #722F37; padding-bottom: 16px; margin-bottom: 18px; }
  .rc-header img { height: 56px; width: 56px; object-fit: contain; }
  .rc-header .school-name { font-size: 1.3rem; font-weight: 800; color: #722F37; margin: 0; }
  .rc-header .school-sub { font-size: 0.78rem; color: #6b7280; margin: 2px 0 0; }
  .rc-title { text-align: center; font-size: 1rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; margin: 6px 0 20px; color: #1c1917; }
  .rc-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; font-size: 0.85rem; margin-bottom: 20px; }
  .rc-meta div { display: flex; justify-content: space-between; border-bottom: 1px dotted #d6d3d1; padding: 3px 0; }
  .rc-meta div span:first-child { color: #6b7280; }
  .rc-meta div span:last-child { font-weight: 700; }
  table.rc-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; margin-bottom: 18px; }
  table.rc-table th { background: #722F37; color: #fff; padding: 8px 10px; text-align: left; font-size: 0.76rem; text-transform: uppercase; letter-spacing: 0.03em; }
  table.rc-table td { padding: 7px 10px; border-bottom: 1px solid #e7e5e4; }
  table.rc-table tr:nth-child(even) td { background: #faf7f5; }
  .rc-summary { display: flex; justify-content: space-between; background: #f9f2ee; border: 1px solid #e7d9d4; border-radius: 8px; padding: 12px 18px; margin-bottom: 20px; font-size: 0.85rem; }
  .rc-summary strong { color: #722F37; }
  .rc-remark { font-size: 0.85rem; margin-bottom: 22px; }
  .rc-remark .lbl { font-weight: 700; color: #722F37; display: block; margin-bottom: 4px; }
  .rc-sign-row { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 30px; }
  .rc-sign { text-align: center; font-size: 0.78rem; }
  .rc-sign .line { border-top: 1.5px solid #444; width: 160px; margin-bottom: 6px; }
  .rc-stamp {
    position: absolute; right: 40px; bottom: 90px; width: 108px; height: 108px; border-radius: 50%;
    border: 3px double #722F37; color: #722F37; display: flex; align-items: center; justify-content: center;
    text-align: center; font-size: 0.62rem; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase;
    transform: rotate(-14deg); opacity: 0.75; line-height: 1.3;
  }
  .rc-footer-note { text-align: center; font-size: 0.7rem; color: #9ca3af; margin-top: 26px; }
  .rc-print-btn { display: block; margin: 0 auto 20px; padding: 10px 22px; background: #722F37; color: #fff; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; }
  @media print { .rc-print-btn { display: none; } body { padding: 0; } .rc-wrap { border: none; } }
</style>
</head><body>
  <button class="rc-print-btn" onclick="window.print()">Print / Save as PDF</button>
  <div class="rc-wrap">
    <div class="rc-stamp">Official<br/>School<br/>Stamp<br/>${(info.shortName || 'Acaxel')}</div>
    <div class="rc-header">
      <img src="images/Logo/logo.png" alt="School Logo" />
      <div>
        <p class="school-name">${info.name}</p>
        <p class="school-sub">${info.address || ''} &middot; ${info.email || ''}</p>
        <p class="school-sub">${info.motto || ''}</p>
      </div>
    </div>
    <div class="rc-title">Terminal Report — ${meta.term || 'Term 2'}, ${info.academicYear || ''}</div>
    <div class="rc-meta">
      <div><span>Student Name</span><span>${studentName}</span></div>
      <div><span>Class</span><span>${cls}</span></div>
      <div><span>Bird House</span><span>${house}</span></div>
      <div><span>Attendance</span><span>${attendance}%</span></div>
      <div><span>Class Position</span><span>${meta.position || '—'} out of ${meta.outOf || '—'}</span></div>
      <div><span>Date Issued</span><span>${today}</span></div>
    </div>
    <table class="rc-table">
      <thead><tr><th>Subject</th><th>C.A. (30%)</th><th>Exam (70%)</th><th>Total (100%)</th><th>Grade</th><th>Remark</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="rc-summary">
      <span>Overall Average: <strong>${overallAvg.toFixed(1)}%</strong></span>
      <span>Overall Grade: <strong>${gradeFromScore(overallAvg)}</strong></span>
    </div>
    <div class="rc-remark">
      <span class="lbl">Class Teacher's Remark</span>
      ${remarkFor(overallAvg)}
    </div>
    <div class="rc-sign-row">
      <div class="rc-sign"><div class="line"></div>Class Teacher's Signature</div>
      <div class="rc-sign"><div class="line"></div>Headteacher / Principal's Signature</div>
    </div>
    <div class="rc-footer-note">Generated by Acaxel School Management System &middot; ${today}</div>
  </div>
  <script>window.addEventListener('load', () => setTimeout(() => window.print(), 300));<\/script>
</body></html>`;
  }

  /**
   * Print a report card for a student found in a results table row.
   * @param {HTMLElement} el - any element inside the student's <tr>
   *   (e.g. the button that was clicked), OR pass a plain object
   *   { studentName, class, subjects: [{name,total}], position, outOf }.
   */
  function printReportCardFromRow(el, subjectNames) {
    const row = el.closest ? el.closest('tr') : null;
    if (!row) return;
    const cells = row.querySelectorAll('td');
    const studentName = cells[1]?.textContent.trim() || cells[0]?.textContent.trim();
    const cls = cells[2]?.textContent.trim();
    const names = subjectNames || ['Mathematics', 'English Language', 'Basic Science', 'Social Studies'];
    const startCol = subjectNames ? 3 : 3;
    const subjects = names.map((name, i) => ({ name, total: Number(cells[startCol + i]?.textContent.trim()) || 0 }));

    // Compute class position by ranking all sibling rows by their average column
    const allRows = Array.from(row.parentElement.querySelectorAll('tr'));
    const avgColIndex = startCol + names.length; // "Average" column right after subjects
    const ranked = allRows
      .map(r => ({ r, avg: parseFloat(r.querySelectorAll('td')[avgColIndex]?.textContent) || 0 }))
      .sort((a, b) => b.avg - a.avg);
    const position = ranked.findIndex(x => x.r === row) + 1;

    printReportCard({ studentName, class: cls, subjects, position: position || undefined, outOf: allRows.length });
  }

  function printReportCard(opts) {
    const html = buildReportHtml(opts.studentName, opts.subjects, opts);
    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); }

    // Simulated SMS alert to the parent that the report card is ready
    if (typeof global.showSmsToast === 'function' && (!global.hcNotifyPrefs || global.hcNotifyPrefs.isEnabled('sms', 'reportCards'))) {
      global.showSmsToast(`${opts.studentName}'s Term report card is now available. Please check the parent portal or contact the school office.`);
    }
  }

  global.printReportCardFromRow = printReportCardFromRow;
  global.printReportCard = printReportCard;

})(window);
