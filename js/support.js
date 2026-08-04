/* ================================================================
   ACAXEL — SUPPORT PAGE  (shared across all dashboards)
   ================================================================ */

(function () {

  const PAGE = location.pathname.toLowerCase();
  const ROLE =
    PAGE.includes('admin')   ? 'admin'   :
    PAGE.includes('teacher') ? 'teacher' :
    PAGE.includes('parent')  ? 'parent'  :
    PAGE.includes('student') ? 'student' : 'general';

  const CONTACT = {
    email:   'support@acaxel.edu.ng',
    phone:   '+233 55 6924 358',
    hours:   'Mon – Fri, 7:30 AM – 4:00 PM',
    address: '14 Highcrest Avenue, Enugu, Nigeria',
  };

  /* ── FAQ data per role ─────────────────────────────────────── */
  const FAQS = {
    admin: [
      { q: 'How do I add a new student?',
        a: 'Go to the <strong>Students</strong> tab → click <strong>+ Add Student</strong>. Fill in the name, class, student ID, and parent details, then click <strong>Save</strong>.' },
      { q: 'How do I record a feeding payment?',
        a: 'Open <strong>Feeding Collection</strong> → click <strong>Record Payment</strong> on the student row. Enter the amount, date, and method, then confirm.' },
      { q: 'How do I create and send a newsletter?',
        a: 'Go to <strong>Newsletter</strong> → click <strong>+ Create Newsletter</strong>. Fill in all sections, click <strong>Save & Export PDF</strong> to generate the file, then mark it as <strong>Sent</strong>.' },
      { q: 'How do I set up timetable notifications for teachers?',
        a: 'Go to the <strong>Timetable</strong> tab → scroll to <strong>Staff Notification Settings</strong>. Enable the toggle, choose lead time and method, select active days, then click <strong>Request Browser Permission</strong> if using browser alerts.' },
      { q: 'How do I export a report as PDF?',
        a: 'Most sections have an <strong>Export PDF</strong> button in the header. Click it and a formatted PDF opens in a new tab, ready to print or save.' },
      { q: 'How do I manage school inventory?',
        a: 'Open the <strong>Inventory</strong> tab. Use <strong>+ Add Item</strong> to create stock entries, the edit pencil to update quantities, and <strong>Export PDF</strong> to download the full report.' },
      { q: 'How do I post a school update or announcement?',
        a: 'Go to <strong>Updates</strong> → click <strong>+ New Update</strong>. Add a title, type, audience, and content. Pin important posts to keep them at the top.' },
    ],
    teacher: [
      { q: 'How do I clock in with the QR code?',
        a: 'Go to the <strong>Clock-In</strong> tab → tap <strong>Scan QR to Clock In</strong>. Point your camera at the school gate QR code. If you have no camera, use the <strong>manual code entry</strong> box below.' },
      { q: 'How do I clock out at the end of the day?',
        a: 'Once clocked in, an amber <strong>Clock Out</strong> button appears in the Clock-In tab. Tap it when you leave school. Your duration and out-time are recorded automatically.' },
      { q: 'How do I view my weekly timetable?',
        a: 'Go to <strong>My Timetable</strong> in the sidebar. Use the day buttons (Mon–Fri) to switch days. Today is selected automatically. Current lessons are highlighted in indigo.' },
      { q: 'How do I enter student grades?',
        a: 'Go to the <strong>Grades</strong> tab. Select the student and subject, enter the score, and click <strong>Save</strong>. Results are immediately visible to students and parents.' },
      { q: 'How do I take class attendance?',
        a: 'Open the <strong>Attendance</strong> tab. Select the class and date, mark each student Present, Absent, or Late, then click <strong>Submit</strong>.' },
      { q: 'How do I message a parent?',
        a: 'Go to <strong>Messages</strong> in the sidebar. Select the parent conversation, type in the box at the bottom, and press <strong>Send</strong> or Enter.' },
      { q: 'How do I export my attendance log?',
        a: 'In the <strong>Clock-In</strong> tab, scroll to the Attendance Log section and click <strong>Export CSV</strong>. A file downloads with all your attendance records.' },
    ],
    parent: [
      { q: 'How do I check my child\'s grades?',
        a: 'The <strong>Overview</strong> tab shows the Grade Trend chart. For a full subject breakdown, contact the class teacher via the <strong>Messages</strong> tab.' },
      { q: 'How do I pay a fee?',
        a: 'Go to <strong>Fee Status</strong> or <strong>Bills & Invoices</strong> → find the pending invoice and click <strong>Pay Now</strong>. Follow the payment steps.' },
      { q: 'How do I view my invoice or receipt?',
        a: 'Open <strong>Bills & Invoices</strong> → click <strong>View</strong> on any invoice. In the modal, click <strong>Print</strong> to save or print a PDF copy.' },
      { q: 'How do I check my child\'s attendance?',
        a: 'Go to the <strong>Overview</strong> dashboard. The attendance donut chart shows the present, absent, and late breakdown for the current period.' },
      { q: 'How do I view pending assignments?',
        a: 'Open the <strong>Assignments</strong> tab. Filter by <strong>Pending</strong> using the status pills at the top. Click any assignment card for full details and due dates.' },
      { q: 'How do I message a teacher?',
        a: 'Go to <strong>Messages</strong>. Select the teacher\'s conversation from the left panel, type your message at the bottom, and press <strong>Send</strong>.' },
      { q: 'How do I update my contact details?',
        a: 'Go to <strong>My Profile</strong> from the sidebar. Edit your name, phone, email, or address, then click <strong>Save Changes</strong>.' },
    ],
    student: [
      { q: 'How do I check in at school?',
        a: 'Open the <strong>Clock-In</strong> tab → tap <strong>Scan QR to Check In</strong>. Point your camera at the school gate QR code. No camera? Use the <strong>manual code entry</strong> box instead.' },
      { q: 'What happens if the QR scan doesn\'t work?',
        a: '1. Make sure you\'re scanning the <strong>official school gate QR code</strong>.<br>2. Allow camera access in browser settings, then reload.<br>3. Use the <strong>manual code entry</strong> box below the scan button.<br>4. Contact a teacher or admin if the code is not working.' },
      { q: 'How do I check my grades?',
        a: 'Your <strong>Overview</strong> tab shows the Grade Trend chart. Click <strong>My Grades</strong> in the sidebar for a full subject breakdown by term.' },
      { q: 'How do I see my timetable?',
        a: 'Click <strong>Timetable</strong> in the sidebar. Use the day tabs to switch days. Today is selected by default.' },
      { q: 'How do I view my assignments?',
        a: 'Click <strong>Assignments</strong> in the sidebar. Use the filter pills to see Pending, Submitted, Overdue, or Graded assignments. Click any card for details.' },
      { q: 'How do I message my teacher?',
        a: 'Go to <strong>Messages</strong> in the sidebar. Select your teacher\'s conversation and type at the bottom. Press <strong>Send</strong> or hit Enter.' },
      { q: 'How do I check my attendance record?',
        a: 'Click <strong>Attendance</strong> in the sidebar for the full attendance breakdown. Your Clock-In tab also shows this week\'s presence grid.' },
    ],
  };

  const faqs = FAQS[ROLE] || FAQS.student;

  /* ── Render FAQs into #spFaqList ───────────────────────────── */
  window.spRenderFaqs = function (filter) {
    const list = document.getElementById('spFaqList');
    if (!list) return;
    const q = (filter || '').toLowerCase().trim();
    const items = q
      ? faqs.filter(f => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q))
      : faqs;

    if (!items.length) {
      list.innerHTML = `<div class="sp-faq-empty"><i data-lucide="search-x"></i><p>No results for "<strong>${filter}</strong>"</p></div>`;
      if (typeof lucide !== 'undefined') lucide.createIcons();
      return;
    }

    list.innerHTML = items.map((f, i) => `
      <div class="sp-faq-item" id="spFaq${i}">
        <button class="sp-faq-q" onclick="spToggleFaq(${i})">
          <span>${f.q}</span>
          <i data-lucide="chevron-down" class="sp-faq-arrow"></i>
        </button>
        <div class="sp-faq-a" id="spFaqA${i}">${f.a}</div>
      </div>`).join('');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  };

  window.spToggleFaq = function (i) {
    const item = document.getElementById(`spFaq${i}`);
    if (!item) return;
    const isOpen = item.classList.contains('open');
    /* Close all */
    document.querySelectorAll('.sp-faq-item.open').forEach(el => el.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  };

  window.spSearchFaq = function () {
    const val = document.getElementById('spSearchInput');
    spRenderFaqs(val ? val.value : '');
  };

  /* ── Contact form submit ───────────────────────────────────── */
  window.spSubmitTicket = function () {
    const subject = document.getElementById('spTicketSubject');
    const msg     = document.getElementById('spTicketMsg');
    const status  = document.getElementById('spTicketStatus');
    if (!subject || !msg || !status) return;
    if (!subject.value.trim() || !msg.value.trim()) {
      status.textContent = 'Please fill in both fields.';
      status.className = 'sp-ticket-status sp-status-err';
      return;
    }
    status.textContent = 'Sending…';
    status.className = 'sp-ticket-status sp-status-info';
    /* Simulate send (localStorage log) */
    setTimeout(() => {
      const log = JSON.parse(localStorage.getItem('hc_support_tickets') || '[]');
      log.unshift({ subject: subject.value.trim(), msg: msg.value.trim(), role: ROLE,
        sent: new Date().toLocaleString('en-GB') });
      localStorage.setItem('hc_support_tickets', JSON.stringify(log.slice(0, 50)));
      subject.value = ''; msg.value = '';
      status.textContent = '✓ Your message has been sent. We\'ll respond within 24 hours.';
      status.className = 'sp-ticket-status sp-status-ok';
      setTimeout(() => { status.textContent = ''; status.className = 'sp-ticket-status'; }, 5000);
    }, 800);
  };

  /* ── Init on DOMContentLoaded ──────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    spRenderFaqs();
    /* Inject contact details */
    ['spContactEmail','spContactPhone','spContactHours','spContactAddress'].forEach((id, idx) => {
      const el = document.getElementById(id);
      if (el) el.textContent = [CONTACT.email, CONTACT.phone, CONTACT.hours, CONTACT.address][idx];
    });
    /* Browser detection */
    const br = document.getElementById('spBrowser');
    if (br) {
      const ua = navigator.userAgent;
      const name =
        ua.includes('Edg/')    ? 'Microsoft Edge' :
        ua.includes('Chrome/') ? 'Google Chrome'  :
        ua.includes('Firefox/') ? 'Firefox'        :
        ua.includes('Safari/') && !ua.includes('Chrome') ? 'Safari' :
        ua.includes('OPR/')    ? 'Opera'           : 'Unknown';
      br.textContent = name;
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
  });

})();
