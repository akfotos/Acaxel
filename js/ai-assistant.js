/* ================================================================
   ACAXEL AI ASSISTANT  — shared across all dashboards
   Role-aware, suggestion chips, keyword knowledge base, no API key
   ================================================================ */

(function () {
  /* ─── Role detection ─────────────────────────────────────────── */
  const PAGE = location.pathname.toLowerCase();
  const ROLE =
    PAGE.includes('admin')   ? 'admin'   :
    PAGE.includes('teacher') ? 'teacher' :
    PAGE.includes('parent')  ? 'parent'  :
    PAGE.includes('student') ? 'student' : 'general';

  /* ─── Knowledge base ─────────────────────────────────────────── */
  const KB = [

    /* ── GENERAL / NAVIGATION ── */
    { tags:['navigate','tab','menu','sidebar','find','where','go','switch'],
      answer:`You can navigate using the **sidebar menu** on the left. Each icon takes you to a different section. On mobile, tap the ☰ hamburger icon to open the menu. Click any menu item to switch tabs instantly.` },
    { tags:['logout','sign out','log out','exit'],
      answer:`To sign out, scroll to the bottom of the sidebar and click **Sign Out**. Your session will end and you'll be redirected to the login page.` },
    { tags:['dark mode','light mode','theme','colour','color','appearance'],
      answer:`You can switch between light and dark mode using the **theme toggle** in the top-right corner of the dashboard. Your preference is saved automatically.` },
    { tags:['notification','bell','alert','unread'],
      answer:`Click the **bell icon** in the top navigation bar to see all notifications. You can mark individual notifications as read by clicking them, or use "Mark all read" to clear them all at once.` },
    { tags:['profile','account','name','email','phone','password','update details'],
      answer:`Go to **My Profile** from the sidebar to update your personal details, contact number, email address, and password. Click **Save Changes** when done.` },
    { tags:['search','find student','lookup','filter'],
      answer:`Most sections have a **search bar** at the top. Type a name, subject, or keyword and results update in real time. You can also use the **filter pills** to narrow by status, category, or date.` },

    /* ── FEES & PAYMENTS ── */
    { tags:['fee','fees','payment','pay','bill','invoice','outstanding','overdue','pending','balance'],
      answer:`Fee information is under **Fee Status** and **Bills & Invoices** in the sidebar.\n\n- **Fee Status** shows a full breakdown of what's paid and what's outstanding.\n- **Bills & Invoices** lists every invoice with a **Pay Now** button for pending items.\n- Overdue fees are highlighted in **red** with an alert icon.\n- You can view a detailed invoice by clicking **View** on any bill card.` },
    { tags:['receipt','print','download invoice'],
      answer:`To print or save a receipt, click **View** on any invoice in the **Bills & Invoices** tab, then click **Print** in the invoice modal. Use your browser's print dialog to save as PDF.` },

    /* ── GRADES & RESULTS ── */
    { tags:['grade','result','score','exam','mark','performance','average','report'],
      answer:`Check grades in the **Overview** tab — the **Grade Trend chart** shows average scores across subjects. For detailed results per subject, your class teacher or admin can provide a full term report.` },
    { tags:['attendance','absent','present','rate'],
      answer:`Attendance rate is shown on the **Overview** dashboard as a percentage. If attendance is below expected, contact the school admin or class teacher for details.` },

    /* ── MESSAGES ── */
    { tags:['message','chat','teacher','contact','send','reply','inbox'],
      answer:`Go to **Messages** in the sidebar to chat with teachers. Select a conversation from the left panel, type in the input box at the bottom, and press **Send** or hit Enter. New unread messages show a blue badge on the sidebar.` },

    /* ── ASSIGNMENTS (Parent/Student) ── */
    { tags:['assignment','homework','task','due','submit','deadline','overdue assignment'],
      answer:`Open **Assignments** from the sidebar to see all tasks.\n\n- 🟠 **Pending** — not yet submitted\n- 🟢 **Submitted** — turned in, awaiting grade\n- 🔴 **Overdue** — past the deadline\n- 🟣 **Graded** — marked by teacher with score\n\nClick any assignment card for full details including teacher instructions and notes. Use the **filter pills** or **search bar** to find specific ones.` },
    { tags:['grade assignment','mark','score assignment'],
      answer:`Graded assignments show a **score badge** (e.g. "A (92%)") on the card. Click the card to see the full details and teacher notes.` },

    /* ── TIMETABLE / SCHEDULE ── */
    { tags:['timetable','schedule','class','lesson','period','subject time'],
      answer:`The **Weekly Schedule** is on the Overview dashboard. Click each day (M/T/W/T/F) to see that day's lessons with times. Grades for completed lessons appear as coloured dots next to each subject.` },

    /* ── CHILDREN (Parent) ── */
    { tags:['my children','child','kids','son','daughter','linked'],
      answer:`Go to **My Children** in the sidebar. Each child card shows:\n- Attendance %, Position in class, Average grade\n- Term progress bar\n\nFor more details on a specific child's performance, check the **Assignments** or **Messages** tabs.` },

    /* ── ADMIN — STUDENTS ── */
    { tags:['add student','enrol','register student','new student','student list'],
      answer:`In the Admin dashboard, go to **Students** tab. Click **+ Add Student** to open the registration form. Fill in the student's name, class, ID, and contact details, then click **Save**. The student appears in the list immediately.` },
    { tags:['delete student','remove student'],
      answer:`In the **Students** tab, find the student card and click the **delete (trash)** icon. Confirm the deletion. Note: this action cannot be undone.` },
    { tags:['student report','export student'],
      answer:`In the **Students** tab, use the **Export PDF** button to generate a printable student report. You can also filter by class before exporting.` },

    /* ── ADMIN — FEEDING COLLECTION ── */
    { tags:['feeding','meal','canteen','lunch','food fee','feeding collection','feeding payment'],
      answer:`Go to **Feeding Collection** in the Admin sidebar.\n\n- **Record Payment** — log a new payment for a student\n- **Edit Menu** — update the weekly feeding timetable (meals per day)\n- **Export PDF** — download a formatted payment report\n- **KPI cards** at the top show Total Collected, Paid, and Unpaid counts\n\nUse the search bar and status filter to find specific records.` },
    { tags:['edit menu','timetable menu','weekly menu','food menu'],
      answer:`In the **Feeding Collection** tab, click **Edit Menu**. A modal opens where you can type the meal for each day of the week. Click **Save Menu** and it updates the timetable immediately.` },

    /* ── ADMIN — INVENTORY ── */
    { tags:['inventory','stock','item','supplies','equipment','low stock','out of stock'],
      answer:`Open **Inventory** from the Admin sidebar.\n\n- Cards show each item with stock level (green/amber/red).\n- Click **+ Add Item** to add new stock.\n- Click the **edit pencil** to update quantity or details.\n- Click **Receipt** to generate a parent-facing receipt for any item.\n- Use **Export PDF** to download the full inventory list.\n- Filter by category: All, Stationery, Equipment, Furniture, Textbooks, Uniform.` },

    /* ── ADMIN — UPDATES ── */
    { tags:['update','announcement','notice','post','pin','school update'],
      answer:`Go to **Updates** in the Admin sidebar to manage school announcements.\n\n- Click **+ New Update** to create a post with title, type, audience, and content.\n- **Pin** important updates to keep them at the top.\n- Filter by period (All / This Week / This Month) or type (General, Academic, Event, Health, Finance).\n- Edit or delete any update using the action buttons on each card.` },

    /* ── ADMIN — NEWSLETTER ── */
    { tags:['newsletter','issue','send newsletter','draft','publish','email parents'],
      answer:`Open **Newsletter** from the Admin sidebar.\n\n- Click **+ Create Newsletter** to build a new issue with sections: Intro, Academic Highlights, Events, Health, Finance, Notices, Closing.\n- **Save as Draft** to continue editing later.\n- **Save & Export PDF** to generate a print-ready newsletter with school branding.\n- Mark a newsletter as **Sent** once distributed to parents.\n- Filter by All / Draft / Sent using the status pills.` },

    /* ── TEACHER — CLASSES / GRADES ── */
    { tags:['class','my class','students','roster','class list'],
      answer:`In the Teacher dashboard, the **Overview** shows your assigned classes and student counts. Click on a class to see the full roster and performance summary.` },
    { tags:['enter grade','record mark','input score','add result'],
      answer:`Go to the **Grades** or **Results** section of the Teacher dashboard. Select the student and subject, enter the score, and click **Save**. Grades are instantly visible to the student and their parents.` },
    { tags:['lesson plan','plan','curriculum','weekly plan'],
      answer:`Access **Lesson Plans** from the Teacher sidebar. You can create plans by week, assign topics per day, and add notes. Plans help keep your teaching structured and easy to review.` },
    { tags:['attendance teacher','mark attendance','take register'],
      answer:`In the Teacher dashboard, go to **Attendance**. Select the class and date, then mark each student Present, Absent, or Late. Click **Submit** to save the register.` },

    /* ── STUDENT ── */
    { tags:['my grade','my score','my result','how did i do'],
      answer:`Your grades are shown on the **Overview** tab in the Grade Trend chart. For individual subject scores, check with your class teacher or look in the **Grades** section of your dashboard.` },
    { tags:['event','sports day','activity','school event','upcoming'],
      answer:`Upcoming school events are listed in the **Upcoming Events** card on your Overview dashboard. Keep an eye on the dates and arrive on time for each event.` },
    { tags:['term','term progress','how long','school calendar'],
      answer:`The **Term Progress** donut chart on your Overview shows how much of the term has passed and how many days are left. It updates based on the current date.` },

    /* ── CLOCK-IN / QR SCAN (Teacher & Student) ── */
    { tags:['clock in','clock-in','clockin','check in','check-in','qr','scan','qr code','gate','arrival','present','mark present'],
      answer:`To clock in:\n\n1. Open the **Clock-In** tab from the sidebar.\n2. Tap **Scan QR to Clock In** (or "Scan QR to Check In" for students).\n3. Point your camera at the **school gate QR code** — it registers automatically.\n\n**No camera?** Use the **manual code entry** box below the button and type the gate code.\n\n- On-time cut-off is **7:45 AM**. Arrivals after that are marked **Late**.\n- Teachers also have a **Clock Out** button that appears after clocking in.\n- Your full attendance history is in the **Attendance Log** below.` },
    { tags:['clock out','leaving','leave school'],
      answer:`To clock out (teachers only):\n\n1. Go to the **Clock-In** tab.\n2. Tap the amber **Clock Out** button — it appears once you've clocked in for the day.\n3. Your duration and out-time are recorded automatically.\n\nStudents do not need to clock out.` },
    { tags:['late','on time','attendance status','attendance cutoff'],
      answer:`The on-time cut-off is **7:45 AM**.\n\n- Arrive by 7:45 → status is **On Time** (green ring).\n- Arrive after 7:45 → status is **Late** (amber ring).\n\nYour weekly presence grid (Mon–Fri) uses colour-coded icons:\n✓ green = On Time &nbsp;|&nbsp; 🕐 amber = Late &nbsp;|&nbsp; ✗ red = Absent.` },
    { tags:['attendance log','export attendance','download attendance','csv'],
      answer:`Scroll to the bottom of the **Clock-In** tab and click **Export CSV**. A file downloads with all your attendance records including date, day, clock-in/out times, status, and method.` },
    { tags:['qr code wrong','wrong code','invalid code','scan not working','camera denied','no camera'],
      answer:`If the QR scan isn't working:\n\n1. **Wrong QR** — make sure you're scanning the **official school gate QR code**, not any other code.\n2. **Camera denied** — allow camera access in your browser settings, then reload the page.\n3. **No camera** — use the **manual code entry** box below the scan button and type the gate code.\n4. **Library loading** — wait a few seconds for the camera library to load, then try again.` },

    /* ── TEACHER TIMETABLE ── */
    { tags:['timetable','my timetable','my schedule','weekly timetable','teacher timetable','lesson','period','class time','view schedule'],
      answer:`Go to **My Timetable** in the sidebar.\n\n- Use the **day buttons** (Mon–Tue–Wed–Thu–Fri) to switch days.\n- Today is automatically selected and lessons are colour-coded:\n  - **Now** (indigo) — currently in progress\n  - **Done** (faded) — already finished\n  - **Upcoming** (green) — still to come\n- The **Up Next** banner shows your next lesson and how many minutes away it is.\n- The timetable reads from the admin-configured schedule automatically.` },
    { tags:['up next','next lesson','next class','next period'],
      answer:`The **Up Next** banner appears at the bottom of the Timetable tab when you're viewing today. It shows the next subject, class, time, and how many minutes until it starts.` },

    /* ── TIMETABLE NOTIFICATIONS (Admin) ── */
    { tags:['notify teacher','staff notification','lesson reminder','timetable notification','alert before lesson','notification settings','lead time'],
      answer:`In the Admin dashboard, go to the **Timetable** tab and scroll down to the **Staff Notification Settings** card.\n\n- **Enable** the toggle to activate automatic lesson reminders.\n- Set the **Lead Time** (5, 10, 15, or 20 minutes before lesson start).\n- Choose the **method**: In-App toast, Browser notification, or Both.\n- Select which **days** notifications fire (Mon–Fri checkboxes).\n- Click **Request Browser Permission** if using browser notifications.\n- Use **Send Test Alert** to preview what teachers will see.` },

    /* ── TECHNICAL HELP ── */
    { tags:['error','not working','broken','bug','issue','problem','cant','cannot','help'],
      answer:`Here are steps to fix common issues:\n\n1. **Refresh the page** — press Ctrl+Shift+R (or Cmd+Shift+R on Mac).\n2. **Clear cache** — in browser settings, clear cookies and cached files.\n3. **Check internet** — ensure you have a stable connection.\n4. **Try another browser** — Chrome or Edge work best.\n5. **Log out and back in** — this resets your session.\n\nIf the problem persists, contact the school administrator.` },
    { tags:['print','pdf','export','download'],
      answer:`To export or print any report:\n1. Click the **Export PDF** button available in most sections.\n2. A formatted document opens in a new tab with the school header.\n3. Press **Ctrl+P** (or Cmd+P) to print or save as PDF.\n\nFor invoices, use the **Print** button inside the invoice modal.` },
    { tags:['mobile','phone','responsive','small screen'],
      answer:`The dashboard is fully responsive. On mobile:\n- Tap the **☰ menu icon** (top-left) to open the sidebar.\n- Tap outside the sidebar or the overlay to close it.\n- All features including search, filters, and modals work on touch screens.` },
    { tags:['password','change password','forgot password','reset'],
      answer:`To change your password:\n1. Go to **My Profile** in the sidebar.\n2. Scroll to the **Account & Security** section.\n3. Enter your **New Password** and **Confirm Password**.\n4. Click **Save Changes**.\n\nIf you've forgotten your password, contact the school administrator to reset it.` },
    { tags:['data','save','lost data','stored','local storage'],
      answer:`All your dashboard data (updates, newsletters, inventory, feeding records) is saved automatically in your browser's **local storage**. This means data stays even after closing the tab — as long as you use the same browser on the same device.` },
  ];

  /* ─── Role-specific welcome + quick chips ────────────────────── */
  const ROLE_CONFIG = {
    admin: {
      greeting: "Hi! I'm **Acaxel AI** ✨\nI'm here to help you manage the school. What do you need?",
      chips: [
        'How do I add a student?',
        'How do I set up lesson notifications?',
        'How do I record a feeding payment?',
        'How do I create a newsletter?',
        'How do I manage inventory?',
        'How do I post a school update?',
        'How do I export a PDF report?',
      ]
    },
    teacher: {
      greeting: "Hi! I'm **Acaxel AI** ✨\nI'm your teaching assistant. How can I help you today?",
      chips: [
        'How do I clock in?',
        'How do I view my timetable?',
        'What does the Up Next banner mean?',
        'How do I clock out?',
        'How do I enter student grades?',
        'How do I take class attendance?',
        'How do I message a parent?',
      ]
    },
    parent: {
      greeting: "Hi! I'm **Acaxel AI** ✨\nI'm here to help you stay on top of your child's education. What would you like to know?",
      chips: [
        'How do I check my child\'s grades?',
        'How do I view pending assignments?',
        'How do I pay a fee?',
        'How do I message a teacher?',
        'How do I view my invoice?',
        'How do I check my child\'s attendance?',
        'How do I update my profile?',
      ]
    },
    student: {
      greeting: "Hi! I'm **Acaxel AI** ✨\nI'm your school assistant. Ask me anything about your dashboard!",
      chips: [
        'How do I check in at school?',
        'What if the QR scan doesn\'t work?',
        'How do I check my grades?',
        'What are upcoming school events?',
        'How do I see my timetable?',
        'How do I message my teacher?',
        'What does term progress mean?',
      ]
    },
    general: {
      greeting: "Hi! I'm **Acaxel AI** ✨\nHow can I help you today?",
      chips: ['How do I navigate the dashboard?','How do I change my password?','How do I export a PDF?']
    }
  };

  const cfg = ROLE_CONFIG[ROLE] || ROLE_CONFIG.general;

  /* ─── Match query to KB ──────────────────────────────────────── */
  function findAnswer(query) {
    const q = query.toLowerCase().trim();
    let best = null, bestScore = 0;
    KB.forEach(entry => {
      let score = 0;
      entry.tags.forEach(tag => { if (q.includes(tag)) score += tag.length; });
      if (score > bestScore) { bestScore = score; best = entry; }
    });
    if (bestScore > 0) return best.answer;
    return null;
  }

  /* ─── Markdown-lite renderer ─────────────────────────────────── */
  function renderMd(text) {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n- /g, '<br>• ')
      .replace(/\n(\d+)\. /g, (_, n) => `<br><strong>${n}.</strong> `)
      .replace(/\n/g, '<br>');
  }

  /* ─── Typing animation ───────────────────────────────────────── */
  function typeMessage(el, html, cb) {
    el.innerHTML = '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    const full = tmp.innerHTML;
    let i = 0;
    const tick = () => {
      if (i <= full.length) { el.innerHTML = full.slice(0, i++); requestAnimationFrame(tick); }
      else if (cb) cb();
    };
    tick();
  }

  /* ─── Inject HTML widget ─────────────────────────────────────── */
  const widget = document.createElement('div');
  widget.id = 'aiWidget';
  widget.innerHTML = `
    <button class="ai-fab" id="aiFab" onclick="toggleAI()" aria-label="Open AI Assistant" title="Ask Acaxel AI">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2a9 9 0 0 1 9 9c0 4.97-4.03 9-9 9a9 9 0 0 1-9-9 9 9 0 0 1 9-9z"/>
        <path d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.97-4.03 9-9 9a9 9 0 0 1-9-9"/>
      </svg>
      <span class="ai-fab-label">AI Help</span>
      <span class="ai-fab-ping"></span>
    </button>

    <div class="ai-panel" id="aiPanel">
      <div class="ai-panel-header">
        <div class="ai-panel-title">
          <div class="ai-avatar-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><circle cx="12" cy="12" r="10"/><path d="M8 10h.01M12 10h.01M16 10h.01"/></svg>
          </div>
          <div>
            <div style="font-weight:700;font-size:0.88rem;line-height:1;">Acaxel AI</div>
            <div style="font-size:0.7rem;color:rgba(255,255,255,0.7);margin-top:1px;">School Assistant · Online</div>
          </div>
        </div>
        <div style="display:flex;gap:4px;align-items:center;">
          <button class="ai-hdr-btn" onclick="clearAIChat()" title="Clear chat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg></button>
          <button class="ai-hdr-btn" onclick="toggleAI()" title="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
      </div>

      <div class="ai-messages" id="aiMessages"></div>

      <div class="ai-chips-wrap" id="aiChipsWrap">
        <div class="ai-chips" id="aiChips"></div>
      </div>

      <div class="ai-input-row">
        <input type="text" id="aiInput" class="ai-input" placeholder="Ask me anything…" onkeydown="aiHandleKey(event)" />
        <button class="ai-send-btn" onclick="aiSend()" title="Send">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(widget);

  /* ─── Chat state ─────────────────────────────────────────────── */
  let aiOpen = false;
  let firstOpen = true;

  window.toggleAI = function () {
    aiOpen = !aiOpen;
    const panel = document.getElementById('aiPanel');
    const fab   = document.getElementById('aiFab');
    panel.classList.toggle('open', aiOpen);
    fab.classList.toggle('active', aiOpen);
    if (aiOpen && firstOpen) { firstOpen = false; initAIChat(); }
    if (aiOpen) setTimeout(() => document.getElementById('aiInput').focus(), 280);
  };

  window.clearAIChat = function () {
    document.getElementById('aiMessages').innerHTML = '';
    firstOpen = true;
    initAIChat();
  };

  function initAIChat() {
    addAIMessage('bot', cfg.greeting, true);
    setTimeout(renderChips, 600);
  }

  function renderChips() {
    const wrap = document.getElementById('aiChipsWrap');
    const box  = document.getElementById('aiChips');
    if (!wrap || !box) return;
    box.innerHTML = cfg.chips.map(c =>
      `<button class="ai-chip" onclick="aiSendChip(this,'${c.replace(/'/g,"\\'")}')">${c}</button>`
    ).join('');
    wrap.style.display = 'block';
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  window.aiSendChip = function (btn, text) {
    btn.disabled = true;
    addAIMessage('user', text, false);
    setTimeout(() => respondAI(text), 400);
  };

  window.aiHandleKey = function (e) {
    if (e.key === 'Enter') aiSend();
  };

  window.aiSend = function () {
    const input = document.getElementById('aiInput');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    addAIMessage('user', text, false);
    setTimeout(() => respondAI(text), 400);
  };

  function respondAI(text) {
    const answer = findAnswer(text);
    const reply  = answer ||
      `I don't have a specific answer for that, but here are a few things that might help:\n\n- Check the relevant tab in the sidebar for your question.\n- Try rephrasing — e.g. "How do I pay a fee?" or "Where are my grades?"\n- Contact the school admin for account-specific issues.\n\nI'm always learning — try another question! 😊`;
    addAIMessage('bot', reply, true);
    // Refresh chips if hidden
    const wrap = document.getElementById('aiChipsWrap');
    if (wrap) wrap.style.display = 'block';
  }

  function addAIMessage(role, text, animate) {
    const msgs = document.getElementById('aiMessages');
    if (!msgs) return;
    const bubble = document.createElement('div');
    bubble.className = `ai-msg ai-msg-${role}`;

    if (role === 'bot') {
      bubble.innerHTML = `
        <div class="ai-msg-avatar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><circle cx="12" cy="12" r="10"/><path d="M8 10h.01M12 10h.01M16 10h.01"/></svg></div>
        <div class="ai-bubble"><p class="ai-bubble-text"></p><div class="ai-bubble-time">${nowStr()}</div></div>`;
      msgs.appendChild(bubble);
      msgs.scrollTop = msgs.scrollHeight;
      const p = bubble.querySelector('.ai-bubble-text');
      const html = renderMd(text);
      if (animate) {
        p.innerHTML = '<span class="ai-typing-dots"><span></span><span></span><span></span></span>';
        msgs.scrollTop = msgs.scrollHeight;
        setTimeout(() => { p.innerHTML = html; msgs.scrollTop = msgs.scrollHeight; }, 700);
      } else {
        p.innerHTML = html;
      }
    } else {
      bubble.innerHTML = `<div class="ai-bubble ai-bubble-user"><p class="ai-bubble-text">${text}</p><div class="ai-bubble-time">${nowStr()}</div></div>`;
      msgs.appendChild(bubble);
    }
    msgs.scrollTop = msgs.scrollHeight;
  }

  function nowStr() {
    const d = new Date();
    return d.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' });
  }

  /* ─── Lucide icons ───────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    if (typeof lucide !== 'undefined') lucide.createIcons();
  });

})();
