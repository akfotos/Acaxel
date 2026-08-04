/* ================================================================
   ACAXEL AI ASSISTANT v2  — shared across all dashboards
   Role-aware, context memory, smart actions, voice input, and
   an expanded knowledge base. No API key required.
   ================================================================ */

(function () {
  /* ─── Role detection ─────────────────────────────────────────── */
  const PAGE = location.pathname.toLowerCase();
  const ROLE =
    PAGE.includes('admin')   ? 'admin'   :
    PAGE.includes('teacher') ? 'teacher' :
    PAGE.includes('parent')  ? 'parent'  :
    PAGE.includes('student') ? 'student' : 'general';

  const STORAGE_KEY = `acaxel_ai_chat_${ROLE}`;
  const CONTEXT_KEY = `acaxel_ai_context_${ROLE}`;

  /* ─── Knowledge base ─────────────────────────────────────────── */
  const KB = [

    /* ── GENERAL / NAVIGATION ── */
    { tags:['navigate','tab','menu','sidebar','find','where','go','switch'],
      answer:`You can navigate using the **sidebar menu** on the left. Each icon takes you to a different section. On mobile, tap the ☰ hamburger icon to open the menu. Click any menu item to switch tabs instantly.` },
    { tags:['logout','sign out','log out','exit'],
      answer:`To sign out, scroll to the bottom of the sidebar and click **Sign Out**, or say "log me out" and I'll do it for you. Your session will end and you'll be redirected to the login page.` },
    { tags:['dark mode','light mode','theme','colour','color','appearance'],
      answer:`You can switch between light and dark mode using the **theme toggle** in the top-right corner, or ask me to "enable dark mode" / "enable light mode". Your preference is saved automatically.` },
    { tags:['notification','bell','alert','unread'],
      answer:`Click the **bell icon** in the top navigation bar to see all notifications. You can mark individual notifications as read by clicking them, or use "Mark all read" to clear them all at once. You can also say "show notifications" and I'll open the panel.` },
    { tags:['profile','account','name','email','phone','password','update details'],
      answer:`Go to **My Profile** from the sidebar to update your personal details, contact number, email address, and password. Click **Save Changes** when done. You can also ask me to "open my profile".` },
    { tags:['search','find student','lookup','filter'],
      answer:`Most sections have a **search bar** at the top. Type a name, subject, or keyword and results update in real time. You can also use the **filter pills** to narrow by status, category, or date.` },
    { tags:['home','dashboard','overview','main page'],
      answer:`Your dashboard overview shows KPI cards, charts, and quick actions. Click **Overview** in the sidebar to return home at any time, or ask me to "go to overview".` },

    /* ── FEES & PAYMENTS ── */
    { tags:['fee','fees','payment','pay','bill','invoice','outstanding','overdue','pending','balance'],
      answer:`Fee information is under **Fee Status** and **Bills & Invoices** in the sidebar.

- **Fee Status** shows a full breakdown of what's paid and what's outstanding.
- **Bills & Invoices** lists every invoice with a **Pay Now** button for pending items.
- Overdue fees are highlighted in **red** with an alert icon.
- You can view a detailed invoice by clicking **View** on any bill card.

Try saying "open fees" or "show my invoices".` },
    { tags:['receipt','print','download invoice'],
      answer:`To print or save a receipt, click **View** on any invoice in the **Bills & Invoices** tab, then click **Print** in the invoice modal. Use your browser's print dialog to save as PDF.` },

    /* ── GRADES & RESULTS ── */
    { tags:['grade','result','score','exam','mark','performance','average','report'],
      answer:`Check grades in the **Overview** tab — the **Grade Trend chart** shows average scores across subjects. For detailed results per subject, your class teacher or admin can provide a full term report. Say "show grades" to jump there.` },
    { tags:['attendance','absent','present','rate'],
      answer:`Attendance rate is shown on the **Overview** dashboard as a percentage. If attendance is below expected, contact the school admin or class teacher for details. Say "open attendance" to navigate quickly.` },

    /* ── MESSAGES ── */
    { tags:['message','chat','teacher','contact','send','reply','inbox'],
      answer:`Go to **Messages** in the sidebar to chat with teachers. Select a conversation from the left panel, type in the input box at the bottom, and press **Send** or hit Enter. New unread messages show a blue badge on the sidebar. Say "open messages" to jump there.` },

    /* ── ASSIGNMENTS (Parent/Student) ── */
    { tags:['assignment','homework','task','due','submit','deadline','overdue assignment'],
      answer:`Open **Assignments** from the sidebar to see all tasks.

- 🟠 **Pending** — not yet submitted
- 🟢 **Submitted** — turned in, awaiting grade
- 🔴 **Overdue** — past the deadline
- 🟣 **Graded** — marked by teacher with score

Click any assignment card for full details including teacher instructions and notes. Use the **filter pills** or **search bar** to find specific ones. Say "show assignments" to navigate.` },
    { tags:['grade assignment','mark','score assignment'],
      answer:`Graded assignments show a **score badge** (e.g. "A (92%)") on the card. Click the card to see the full details and teacher notes.` },

    /* ── TIMETABLE / SCHEDULE ── */
    { tags:['timetable','schedule','class','lesson','period','subject time'],
      answer:`The **Weekly Schedule** is on the Overview dashboard. Click each day (M/T/W/T/F) to see that day's lessons with times. Grades for completed lessons appear as coloured dots next to each subject. Say "open timetable" to jump there.` },

    /* ── CHILDREN (Parent) ── */
    { tags:['my children','child','kids','son','daughter','linked'],
      answer:`Go to **My Children** in the sidebar. Each child card shows:
- Attendance %, Position in class, Average grade
- Term progress bar

For more details on a specific child's performance, check the **Assignments** or **Messages** tabs.` },

    /* ── ADMIN — STUDENTS ── */
    { tags:['add student','enrol','register student','new student','student list'],
      answer:`In the Admin dashboard, go to **Students** tab. Click **+ Add Student** to open the registration form. Fill in the student's name, class, ID, and contact details, then click **Save**. The student appears in the list immediately.` },
    { tags:['delete student','remove student'],
      answer:`In the **Students** tab, find the student card and click the **delete (trash)** icon. Confirm the deletion. Note: this action cannot be undone.` },
    { tags:['student report','export student'],
      answer:`In the **Students** tab, use the **Export PDF** button to generate a printable student report. You can also filter by class before exporting.` },

    /* ── ADMIN — FEEDING COLLECTION ── */
    { tags:['feeding','meal','canteen','lunch','food fee','feeding collection','feeding payment'],
      answer:`Go to **Feeding Collection** in the Admin sidebar.

- **Record Payment** — log a new payment for a student
- **Edit Menu** — update the weekly feeding timetable (meals per day)
- **Export PDF** — download a formatted payment report
- **KPI cards** at the top show Total Collected, Paid, and Unpaid counts

Use the search bar and status filter to find specific records.` },
    { tags:['edit menu','timetable menu','weekly menu','food menu'],
      answer:`In the **Feeding Collection** tab, click **Edit Menu**. A modal opens where you can type the meal for each day of the week. Click **Save Menu** and it updates the timetable immediately.` },

    /* ── ADMIN — INVENTORY ── */
    { tags:['inventory','stock','item','supplies','equipment','low stock','out of stock'],
      answer:`Open **Inventory** from the Admin sidebar.

- Cards show each item with stock level (green/amber/red).
- Click **+ Add Item** to add new stock.
- Click the **edit pencil** to update quantity or details.
- Click **Receipt** to generate a parent-facing receipt for any item.
- Use **Export PDF** to download the full inventory list.
- Filter by category: All, Stationery, Equipment, Furniture, Textbooks, Uniform.` },

    /* ── ADMIN — UPDATES ── */
    { tags:['update','announcement','notice','post','pin','school update'],
      answer:`Go to **Updates** in the Admin sidebar to manage school announcements.

- Click **+ New Update** to create a post with title, type, audience, and content.
- **Pin** important updates to keep them at the top.
- Filter by period (All / This Week / This Month) or type (General, Academic, Event, Health, Finance).
- Edit or delete any update using the action buttons on each card.` },

    /* ── ADMIN — NEWSLETTER ── */
    { tags:['newsletter','issue','send newsletter','draft','publish','email parents'],
      answer:`Open **Newsletter** from the Admin sidebar.

- Click **+ Create Newsletter** to build a new issue with sections: Intro, Academic Highlights, Events, Health, Finance, Notices, Closing.
- **Save as Draft** to continue editing later.
- **Save & Export PDF** to generate a print-ready newsletter with school branding.
- Mark a newsletter as **Sent** once distributed to parents.
- Filter by All / Draft / Sent using the status pills.` },

    /* ── ADMIN — REPORTS ── */
    { tags:['report','analytics','kpi','statistic','summary'],
      answer:`The **Reports** tab in the Admin dashboard gives you downloadable summaries including:

- Student enrolment and class distribution
- Fee collection and outstanding balances
- Attendance trends
- Inventory status

Use the date range picker and filters, then click **Export PDF** or **Export CSV** to download.` },

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
      answer:`To clock in:

1. Open the **Clock-In** tab from the sidebar (or say "open clock-in").
2. Tap **Scan QR to Clock In** (or "Scan QR to Check In" for students).
3. Point your camera at the **school gate QR code** — it registers automatically.

**No camera?** Use the **manual code entry** box below the button and type the gate code.

- On-time cut-off is **7:45 AM**. Arrivals after that are marked **Late**.
- Teachers also have a **Clock Out** button that appears after clocking in.
- Your full attendance history is in the **Attendance Log** below.` },
    { tags:['clock out','leaving','leave school'],
      answer:`To clock out (teachers only):

1. Go to the **Clock-In** tab.
2. Tap the amber **Clock Out** button — it appears once you've clocked in for the day.
3. Your duration and out-time are recorded automatically.

Students do not need to clock out.` },
    { tags:['late','on time','attendance status','attendance cutoff'],
      answer:`The on-time cut-off is **7:45 AM**.

- Arrive by 7:45 → status is **On Time** (green ring).
- Arrive after 7:45 → status is **Late** (amber ring).

Your weekly presence grid (Mon–Fri) uses colour-coded icons:
✓ green = On Time &nbsp;|&nbsp; 🕐 amber = Late &nbsp;|&nbsp; ✗ red = Absent.` },
    { tags:['attendance log','export attendance','download attendance','csv'],
      answer:`Scroll to the bottom of the **Clock-In** tab and click **Export CSV**. A file downloads with all your attendance records including date, day, clock-in/out times, status, and method.` },
    { tags:['qr code wrong','wrong code','invalid code','scan not working','camera denied','no camera'],
      answer:`If the QR scan isn't working:

1. **Wrong QR** — make sure you're scanning the **official school gate QR code**, not any other code.
2. **Camera denied** — allow camera access in your browser settings, then reload the page.
3. **No camera** — use the **manual code entry** box below the scan button and type the gate code.
4. **Library loading** — wait a few seconds for the camera library to load, then try again.` },

    /* ── TEACHER TIMETABLE ── */
    { tags:['timetable','my timetable','my schedule','weekly timetable','teacher timetable','lesson','period','class time','view schedule'],
      answer:`Go to **My Timetable** in the sidebar.

- Use the **day buttons** (Mon–Tue–Wed–Thu–Fri) to switch days.
- Today is automatically selected and lessons are colour-coded:
  - **Now** (indigo) — currently in progress
  - **Done** (faded) — already finished
  - **Upcoming** (green) — still to come
- The **Up Next** banner shows your next lesson and how many minutes away it is.
- The timetable reads from the admin-configured schedule automatically.` },
    { tags:['up next','next lesson','next class','next period'],
      answer:`The **Up Next** banner appears at the bottom of the Timetable tab when you're viewing today. It shows the next subject, class, time, and how many minutes until it starts.` },

    /* ── TIMETABLE NOTIFICATIONS (Admin) ── */
    { tags:['notify teacher','staff notification','lesson reminder','timetable notification','alert before lesson','notification settings','lead time'],
      answer:`In the Admin dashboard, go to the **Timetable** tab and scroll down to the **Staff Notification Settings** card.

- **Enable** the toggle to activate automatic lesson reminders.
- Set the **Lead Time** (5, 10, 15, or 20 minutes before lesson start).
- Choose the **method**: In-App toast, Browser notification, or Both.
- Select which **days** notifications fire (Mon–Fri checkboxes).
- Click **Request Browser Permission** if using browser notifications.
- Use **Send Test Alert** to preview what teachers will see.` },

    /* ── TECHNICAL HELP ── */
    { tags:['error','not working','broken','bug','issue','problem','cant','cannot','help'],
      answer:`Here are steps to fix common issues:

1. **Refresh the page** — press Ctrl+Shift+R (or Cmd+Shift+R on Mac).
2. **Clear cache** — in browser settings, clear cookies and cached files.
3. **Check internet** — ensure you have a stable connection.
4. **Try another browser** — Chrome or Edge work best.
5. **Log out and back in** — this resets your session.

If the problem persists, contact the school administrator.` },
    { tags:['print','pdf','export','download'],
      answer:`To export or print any report:
1. Click the **Export PDF** button available in most sections.
2. A formatted document opens in a new tab with the school header.
3. Press **Ctrl+P** (or Cmd+P) to print or save as PDF.

For invoices, use the **Print** button inside the invoice modal.` },
    { tags:['mobile','phone','responsive','small screen'],
      answer:`The dashboard is fully responsive. On mobile:
- Tap the **☰ menu icon** (top-left) to open the sidebar.
- Tap outside the sidebar or the overlay to close it.
- All features including search, filters, and modals work on touch screens.` },
    { tags:['password','change password','forgot password','reset'],
      answer:`To change your password:
1. Go to **My Profile** in the sidebar.
2. Scroll to the **Account & Security** section.
3. Enter your **New Password** and **Confirm Password**.
4. Click **Save Changes**.

If you've forgotten your password, contact the school administrator to reset it.` },
    { tags:['data','save','lost data','stored','local storage'],
      answer:`All your dashboard data (updates, newsletters, inventory, feeding records) is saved automatically in your browser's **local storage**. This means data stays even after closing the tab — as long as you use the same browser on the same device.` },
    { tags:['voice','mic','microphone','speak','talk'],
      answer:`Tap the **microphone icon** in the chat input to ask a question with your voice. Your browser may ask for microphone permission the first time. If your device doesn't support voice input, you can always type instead.` },
    { tags:['ai capabilities','what can you do','commands','help me','features'],
      answer:`I can help you in lots of ways:

- **Navigate**: "go to fees", "open timetable", "show my profile"
- **Control the UI**: "dark mode", "light mode", "show notifications", "log me out"
- **Answer questions**: fees, grades, attendance, clock-in, messages, assignments, and more
- **Slash commands**: type /help, /clear, /theme, /profile
- **Voice input**: tap the mic and speak
- **Follow-ups**: I remember the current topic, so you can ask "tell me more" or "how do I do that?"

Tap the **✨ What can Acaxel AI do?** button in the chat header for the full list.` },
  ];

  /* ─── Synonym expansion ────────────────────────────────────────── */
  const SYNONYMS = {
    'grade': ['grades','result','results','score','scores','mark','marks','report','reports','performance'],
    'fee': ['fees','payment','payments','bill','bills','invoice','invoices','balance','outstanding','due'],
    'timetable': ['timetable','schedule','classes','lessons','periods','routine'],
    'attendance': ['attendance','present','absent','late','clockin','clock-in','checkin','check-in'],
    'message': ['message','messages','chat','inbox','conversation','conversations'],
    'assignment': ['assignment','assignments','homework','task','tasks','project','projects'],
    'profile': ['profile','account','settings','my details','my info'],
    'notification': ['notification','notifications','alert','alerts','bell'],
    'logout': ['logout','log out','sign out','signout','exit','leave'],
  };

  /* ─── Role-specific welcome + quick chips ────────────────────── */
  const ROLE_CONFIG = {
    admin: {
      greeting: "Hi! I'm **Acaxel AI** ✨\nYour school management assistant. What would you like to do?",
      chips: [
        { text: 'Go to Students', action: 'navigate:students' },
        { text: 'Open Fee Records', action: 'navigate:fees' },
        { text: 'Record Feeding Payment', action: 'navigate:feeding' },
        { text: 'Create Newsletter', action: 'navigate:newsletter' },
        { text: 'Enable Dark Mode', action: 'theme:dark' },
        { text: 'Show Notifications', action: 'notif:toggle' },
      ]
    },
    teacher: {
      greeting: "Hi! I'm **Acaxel AI** ✨\nYour teaching assistant. How can I help you today?",
      chips: [
        { text: 'Clock In', action: 'navigate:clockin' },
        { text: 'View Timetable', action: 'navigate:timetable' },
        { text: 'Enter Grades', action: 'navigate:grades' },
        { text: 'Take Attendance', action: 'navigate:attendance' },
        { text: 'Open Messages', action: 'navigate:messages' },
        { text: 'Enable Dark Mode', action: 'theme:dark' },
      ]
    },
    parent: {
      greeting: "Hi! I'm **Acaxel AI** ✨\nHere to help you stay on top of your child's education.",
      chips: [
        { text: 'Check Grades', action: 'navigate:grades' },
        { text: 'View Assignments', action: 'navigate:assignments' },
        { text: 'Pay a Fee', action: 'navigate:fees' },
        { text: 'Message Teacher', action: 'navigate:messages' },
        { text: 'Show Notifications', action: 'notif:toggle' },
        { text: 'Enable Dark Mode', action: 'theme:dark' },
      ]
    },
    student: {
      greeting: "Hi! I'm **Acaxel AI** ✨\nYour school assistant. Ask me anything about your dashboard!",
      chips: [
        { text: 'Clock In', action: 'navigate:clockin' },
        { text: 'Check Grades', action: 'navigate:grades' },
        { text: 'View Timetable', action: 'navigate:timetable' },
        { text: 'Assignments', action: 'navigate:assignments' },
        { text: 'Message Teacher', action: 'navigate:messages' },
        { text: 'Enable Dark Mode', action: 'theme:dark' },
      ]
    },
    general: {
      greeting: "Hi! I'm **Acaxel AI** ✨\nHow can I help you today?",
      chips: [
        { text: 'How do I navigate?', query: 'How do I navigate the dashboard?' },
        { text: 'Change password', query: 'How do I change my password?' },
        { text: 'Export a PDF', query: 'How do I export a PDF?' },
        { text: 'Enable Dark Mode', action: 'theme:dark' },
      ]
    }
  };

  const cfg = ROLE_CONFIG[ROLE] || ROLE_CONFIG.general;

  /* ─── Navigation map per role ────────────────────────────────── */
  const NAV_MAP = {
    admin: {
      overview: ['overview','home','dashboard','main'],
      students: ['students','student list','add student','enrol','register student'],
      staff: ['staff','teachers','employees','personnel'],
      fees: ['fees','fee records','payments','invoices','billing records'],
      billing: ['billing','send bills','send bill'],
      feeding: ['feeding','feeding collection','meals','canteen','lunch'],
      grades: ['grades','exams','results','marks'],
      attendance: ['attendance','attendance log'],
      clockin: ['clockin','clock-in','clock in','check in','gate'],
      timetable: ['timetable','schedule','timetable notifications'],
      messages: ['messages','inbox','chat'],
      announcements: ['announcements','announcement'],
      events: ['events','calendar','school events'],
      inventory: ['inventory','stock','supplies'],
      updates: ['updates','school updates','announcements'],
      newsletter: ['newsletter','newsletters'],
      reports: ['reports','analytics','statistics'],
      settings: ['settings','preferences'],
      support: ['support','help']
    },
    teacher: {
      overview: ['overview','home','dashboard'],
      students: ['students','my class','roster','class list'],
      grades: ['grades','enter grades','record marks','results'],
      attendance: ['attendance','take attendance','register'],
      messages: ['messages','inbox','chat'],
      timetable: ['timetable','my timetable','schedule','lessons'],
      clockin: ['clockin','clock-in','clock in','check in','gate'],
      support: ['support','help'],
      profile: ['profile','my profile','account','settings']
    },
    parent: {
      overview: ['overview','home','dashboard'],
      children: ['children','my children','child','kids'],
      grades: ['grades','results','marks','performance'],
      assignments: ['assignments','homework','tasks'],
      fees: ['fees','payments','bills','invoices'],
      messages: ['messages','inbox','chat'],
      attendance: ['attendance','attendance rate'],
      timetable: ['timetable','schedule'],
      profile: ['profile','my profile','account','settings']
    },
    student: {
      overview: ['overview','home','dashboard'],
      grades: ['grades','results','marks','my grades'],
      assignments: ['assignments','homework','tasks'],
      timetable: ['timetable','schedule','my timetable'],
      messages: ['messages','inbox','chat'],
      clockin: ['clockin','clock-in','clock in','check in','gate'],
      attendance: ['attendance','my attendance'],
      events: ['events','upcoming events'],
      profile: ['profile','my profile','account','settings']
    },
    general: {
      overview: ['overview','home','dashboard'],
      profile: ['profile','my profile','account','settings'],
      support: ['support','help']
    }
  };

  /* ─── Utilities ──────────────────────────────────────────────── */
  function nowStr() {
    const d = new Date();
    return d.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' });
  }

  function timeGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
  }

  function renderMd(text) {
    return text
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n- /g, '<br>• ')
      .replace(/\n(\d+)\. /g, (_, n) => `<br><strong>${n}.</strong> `)
      .replace(/\n/g, '<br>');
  }

  /* ─── Local storage chat history ─────────────────────────────── */
  function saveHistory() {
    try {
      const msgs = [];
      document.querySelectorAll('#aiMessages .ai-msg').forEach(row => {
        const role = row.classList.contains('ai-msg-user') ? 'user' : 'bot';
        const text = role === 'bot'
          ? row.querySelector('.ai-bubble-text')?.dataset.raw
          : row.querySelector('.ai-bubble-text')?.textContent;
        if (text) msgs.push({ role, text });
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs.slice(-50)));
    } catch (e) {}
  }

  function loadHistory() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  function saveContext(topic) {
    try { localStorage.setItem(CONTEXT_KEY, topic); } catch (e) {}
  }

  function loadContext() {
    try { return localStorage.getItem(CONTEXT_KEY) || ''; } catch (e) { return ''; }
  }

  /* ─── Typing animation ───────────────────────────────────────── */
  function typeMessage(el, html, raw, cb) {
    el.innerHTML = '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    const full = tmp.innerHTML;
    let i = 0;
    const tick = () => {
      if (i <= full.length) { el.innerHTML = full.slice(0, i++); requestAnimationFrame(tick); }
      else { if (el) el.dataset.raw = raw; if (cb) cb(); }
    };
    tick();
  }

  /* ─── Smart actions engine ─────────────────────────────────────── */
  const SMART_ACTIONS = [
    {
      name: 'navigate',
      patterns: ['go to','open','show me','take me to','navigate to','switch to','jump to','bring me to'],
      handler: (q) => navigateSmart(q)
    },
    {
      name: 'theme',
      patterns: ['dark mode','enable dark','turn on dark','switch to dark','dark theme','make it dark'],
      handler: () => setTheme('dark')
    },
    {
      name: 'theme-light',
      patterns: ['light mode','enable light','turn on light','switch to light','light theme','make it light','white mode'],
      handler: () => setTheme('light')
    },
    {
      name: 'theme-panel',
      patterns: ['open theme','theme settings','appearance settings','change theme','change color','change colour'],
      handler: () => { window.__hcTheme?.openPanel?.(); return 'Opening appearance settings...'; }
    },
    {
      name: 'notifications',
      patterns: ['show notifications','open notifications','view notifications','check notifications','open bell'],
      handler: () => { typeof toggleNotif === 'function' ? toggleNotif() : clickNotifBtn(); return 'Opening notifications panel...'; }
    },
    {
      name: 'logout',
      patterns: ['log me out','sign me out','logout','log out','sign out'],
      handler: () => { setTimeout(() => { typeof logout === 'function' && logout(); }, 800); return 'Signing you out now...'; }
    },
    {
      name: 'help',
      patterns: ['what can you do','help','commands','capabilities','features'],
      handler: () => { showCapabilities(); return capabilitiesText(); }
    }
  ];

  function normalize(str) {
    return str.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function expandQuery(q) {
    const words = normalize(q).split(' ');
    const extra = [];
    words.forEach(w => {
      Object.entries(SYNONYMS).forEach(([key, list]) => {
        if (w === key || list.includes(w)) extra.push(key, ...list);
      });
    });
    return [...new Set([...words, ...extra])];
  }

  function runSmartAction(q) {
    const nq = normalize(q);
    // slash commands
    if (q.trim().startsWith('/')) return runSlashCommand(q.trim());
    // specific actions first (theme, notifications, logout, help)
    for (const action of SMART_ACTIONS) {
      if (action.name !== 'navigate' && action.patterns.some(p => nq.includes(p))) {
        return action.handler(q);
      }
    }
    // explicit navigation patterns
    const navTriggers = ['go to','open','show me','take me to','navigate to','switch to','jump to','bring me to'];
    if (navTriggers.some(t => nq.includes(t))) {
      return navigateSmart(q);
    }
    return null;
  }

  function runSlashCommand(cmd) {
    const c = cmd.toLowerCase();
    if (c === '/clear') { clearAIChat(); return 'Chat history cleared.'; }
    if (c === '/help') { showCapabilities(); return capabilitiesText(); }
    if (c === '/theme') { window.__hcTheme?.openPanel?.(); return 'Opening appearance settings...'; }
    if (c === '/dark') return setTheme('dark');
    if (c === '/light') return setTheme('light');
    if (c === '/profile') return navigateToTab('profile') ? 'Opening your profile...' : 'Profile tab not found on this dashboard.';
    if (c.startsWith('/go ') || c.startsWith('/open ')) {
      const target = c.replace(/^\/(go|open)\s+/, '');
      return navigateSmart(target);
    }
    return `Unknown command: ${escapeHtml(cmd)}. Try /help, /clear, /theme, /dark, /light, or /go <tab name>.`;
  }

  function setTheme(mode) {
    if (window.__hcTheme?.setMode) {
      window.__hcTheme.setMode(mode);
      return `Switched to ${mode} mode.`;
    }
    return `I can't change the theme automatically here, but you can use the theme toggle in the top-right corner.`;
  }

  function clickNotifBtn() {
    document.querySelector('.notif-btn')?.click();
  }

  function navigateSmart(q) {
    const map = NAV_MAP[ROLE] || NAV_MAP.general;
    const nq = normalize(q);
    let bestTab = '', bestScore = 0;
    Object.entries(map).forEach(([tab, aliases]) => {
      aliases.forEach(alias => {
        const idx = nq.indexOf(alias);
        if (idx !== -1) {
          const score = alias.length + (idx < 5 ? 5 : 0);
          if (score > bestScore) { bestScore = score; bestTab = tab; }
        }
      });
    });
    if (!bestTab) {
      // try single-word fallback
      const words = nq.split(' ').filter(w => w.length > 2);
      Object.entries(map).forEach(([tab, aliases]) => {
        aliases.forEach(alias => {
          const aParts = alias.split(' ');
          const matches = aParts.filter(part => words.includes(part)).length;
          if (matches > 0 && matches > bestScore) { bestScore = matches; bestTab = tab; }
        });
      });
    }
    if (bestTab) {
      const ok = navigateToTab(bestTab);
      return ok ? `Navigating to **${capitalize(bestTab.replace(/-/g,' '))}**...` : `I found the tab but couldn't switch automatically. Try clicking **${capitalize(bestTab.replace(/-/g,' '))}** in the sidebar.`;
    }
    return null;
  }

  function navigateToTab(tabId) {
    const selector = `.nav-item[onclick*="switchTab('${tabId}'"]`;
    let btn = document.querySelector(selector);
    if (!btn) {
      // try matching label text
      document.querySelectorAll('.nav-item').forEach(el => {
        const label = el.querySelector('.nav-item-label')?.textContent.toLowerCase() || '';
        if (label.includes(tabId.toLowerCase())) btn = el;
      });
    }
    if (btn && typeof switchTab === 'function') {
      switchTab(tabId, btn);
      return true;
    }
    return false;
  }

  function capitalize(s) {
    return s.replace(/\b\w/g, c => c.toUpperCase());
  }

  /* ─── Knowledge base matching ────────────────────────────────── */
  function findAnswer(query) {
    const words = expandQuery(query);
    let best = null, bestScore = 0;

    KB.forEach(entry => {
      let score = 0;
      entry.tags.forEach(tag => {
        const tagWords = normalize(tag).split(' ');
        tagWords.forEach(tw => {
          words.forEach(w => {
            if (w === tw) score += 3;
            else if (tw.startsWith(w) || w.startsWith(tw)) score += 1.5;
          });
        });
      });
      // small bonus for matching many different tags
      const distinctTags = entry.tags.filter(tag => words.some(w => normalize(tag).includes(w) || w.includes(normalize(tag)))).length;
      score += distinctTags * 2;
      if (score > bestScore) { bestScore = score; best = entry; }
    });

    if (bestScore >= 3) return best.answer;
    return null;
  }

  function findSuggestions(query) {
    const words = normalize(query).split(' ').filter(w => w.length > 2);
    if (!words.length) return [];
    const scored = [];
    KB.forEach(entry => {
      let score = 0;
      entry.tags.forEach(tag => {
        const tagNorm = normalize(tag);
        words.forEach(w => {
          if (tagNorm.includes(w)) score += w.length;
        });
      });
      if (score > 0) scored.push({ score, text: entry.tags[0] });
    });
    scored.sort((a, b) => b.score - a.score);
    const unique = [];
    const seen = new Set();
    for (const item of scored) {
      if (!seen.has(item.text)) { seen.add(item.text); unique.push(item.text); }
      if (unique.length >= 3) break;
    }
    return unique.map(t => `How do I ${t.replace(/_/g,' ')}?`);
  }

  function getContextualAnswer(query) {
    const ctx = loadContext();
    const q = normalize(query);
    if (!ctx) return null;
    // Follow-up intent detection
    const followUp = ['tell me more','explain more','more details','how','why','what about','and','also','continue'];
    const isFollowUp = followUp.some(f => q.includes(f)) || q.length < 20;
    if (!isFollowUp) return null;
    const entry = KB.find(e => e.tags.includes(ctx));
    if (!entry) return null;
    return `Re: **${capitalize(ctx.replace(/_/g,' '))}** — ${entry.answer}`;
  }

  /* ─── Chat state ─────────────────────────────────────────────── */
  let aiOpen = false;
  let firstOpen = true;

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
          <button class="ai-hdr-btn" onclick="showCapabilities()" title="What can Acaxel AI do?">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </button>
          <button class="ai-hdr-btn" onclick="clearAIChat()" title="Clear chat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg></button>
          <button class="ai-hdr-btn" onclick="toggleAI()" title="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
      </div>

      <div class="ai-messages" id="aiMessages"></div>

      <div class="ai-chips-wrap" id="aiChipsWrap">
        <div class="ai-chips" id="aiChips"></div>
      </div>

      <div class="ai-input-row">
        <button class="ai-mic-btn" id="aiMicBtn" onclick="toggleVoiceInput()" title="Voice input">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
        </button>
        <input type="text" id="aiInput" class="ai-input" placeholder="Ask me anything…" onkeydown="aiHandleKey(event)" />
        <button class="ai-send-btn" onclick="aiSend()" title="Send">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>
    </div>

    <!-- Capabilities modal -->
    <div class="ai-capabilities" id="aiCapabilities" onclick="hideCapabilities(event)">
      <div class="ai-capabilities-content" onclick="event.stopPropagation()">
        <div class="ai-capabilities-header">
          <strong>✨ What can Acaxel AI do?</strong>
          <button class="ai-hdr-btn" onclick="hideCapabilities()" title="Close" style="color:var(--text);"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        <div class="ai-capabilities-body">
          <p>I can answer questions about the dashboard, perform quick actions, and remember your conversation.</p>
          <ul>
            <li><strong>Navigate:</strong> "go to fees", "open timetable", "show my profile", "jump to assignments"</li>
            <li><strong>Control the UI:</strong> "dark mode", "light mode", "show notifications", "log me out"</li>
            <li><strong>Answer questions:</strong> fees, grades, attendance, clock-in, messages, assignments, and more</li>
            <li><strong>Slash commands:</strong> /help, /clear, /theme, /dark, /light, /go &lt;tab&gt;</li>
            <li><strong>Voice input:</strong> tap the microphone icon and speak</li>
            <li><strong>Follow-ups:</strong> I remember the current topic, so you can ask "tell me more"</li>
          </ul>
          <p style="margin-top:10px;"><strong>Tip:</strong> Your last 50 messages are saved in this browser.</p>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(widget);

  /* ─── Capability modal functions ─────────────────────────────── */
  window.showCapabilities = function () {
    document.getElementById('aiCapabilities')?.classList.add('open');
  };
  window.hideCapabilities = function (e) {
    if (e && e.target !== document.getElementById('aiCapabilities')) return;
    document.getElementById('aiCapabilities')?.classList.remove('open');
  };
  function capabilitiesText() {
    return `Here are some things I can do:

- **Navigate**: "go to fees", "open timetable", "show my profile"
- **Control the UI**: "dark mode", "light mode", "show notifications", "log me out"
- **Answer questions**: fees, grades, attendance, clock-in, messages, assignments, and more
- **Slash commands**: /help, /clear, /theme, /dark, /light, /go <tab>
- **Voice input**: tap the microphone icon and speak
- **Follow-ups**: I remember the current topic, so you can ask "tell me more"`;
  }

  /* ─── Voice input ────────────────────────────────────────────── */
  let recognition = null;
  let listening = false;

  function initVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onstart = () => { listening = true; updateMicIcon(true); };
    recognition.onend = () => { listening = false; updateMicIcon(false); };
    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript;
      const input = document.getElementById('aiInput');
      if (input) input.value = text;
      aiSend();
    };
    recognition.onerror = () => { listening = false; updateMicIcon(false); };
  }

  function updateMicIcon(active) {
    const btn = document.getElementById('aiMicBtn');
    if (!btn) return;
    btn.classList.toggle('listening', active);
    btn.title = active ? 'Listening...' : 'Voice input';
  }

  window.toggleVoiceInput = function () {
    if (!recognition) initVoice();
    if (!recognition) {
      addAIMessage('bot', 'Voice input is not supported in this browser. Please type your question.', true);
      return;
    }
    if (listening) { recognition.stop(); }
    else { try { recognition.start(); } catch (e) {} }
  };

  /* ─── Widget controls ────────────────────────────────────────── */
  window.toggleAI = function () {
    aiOpen = !aiOpen;
    const panel = document.getElementById('aiPanel');
    const fab   = document.getElementById('aiFab');
    panel.classList.toggle('open', aiOpen);
    fab.classList.toggle('active', aiOpen);
    if (aiOpen && firstOpen) { firstOpen = false; initAIChat(); }
    if (aiOpen) setTimeout(() => document.getElementById('aiInput')?.focus(), 280);
  };

  window.clearAIChat = function () {
    document.getElementById('aiMessages').innerHTML = '';
    try { localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(CONTEXT_KEY); } catch (e) {}
    firstOpen = true;
    initAIChat();
  };

  function initAIChat() {
    const msgs = loadHistory();
    if (msgs.length) {
      msgs.forEach(m => addAIMessage(m.role, m.text, false, true));
      renderChips();
      return;
    }
    const greeting = `${timeGreeting()}! ${cfg.greeting}`;
    addAIMessage('bot', greeting, true);
  }

  function renderChips() {
    const wrap = document.getElementById('aiChipsWrap');
    const box  = document.getElementById('aiChips');
    if (!wrap || !box) return;
    box.innerHTML = cfg.chips.map(c => {
      const text = typeof c === 'string' ? c : c.text;
      const action = typeof c === 'string' ? `query:${escapeHtml(text)}` : c.action;
      return `<button class="ai-chip" onclick="aiSendChip(this,'${action.replace(/'/g,"\\'")}')">${escapeHtml(text)}</button>`;
    }).join('');
    wrap.style.display = 'block';
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  window.aiSendChip = function (btn, payload) {
    btn.disabled = true;
    if (payload.startsWith('query:')) {
      const text = payload.replace('query:', '');
      addAIMessage('user', text, false);
      setTimeout(() => respondAI(text), 400);
    } else if (payload.startsWith('navigate:')) {
      const tab = payload.replace('navigate:', '');
      const ok = navigateToTab(tab);
      const text = btn.textContent;
      addAIMessage('user', text, false);
      setTimeout(() => {
        const msg = ok ? `Navigating to **${text}**...` : `I couldn't switch automatically. Please click **${text}** in the sidebar.`;
        addAIMessage('bot', msg, true);
      }, 400);
    } else if (payload.startsWith('theme:')) {
      const mode = payload.replace('theme:', '');
      const text = btn.textContent;
      addAIMessage('user', text, false);
      setTimeout(() => addAIMessage('bot', setTheme(mode), true), 400);
    } else if (payload === 'notif:toggle') {
      const text = btn.textContent;
      addAIMessage('user', text, false);
      setTimeout(() => {
        clickNotifBtn();
        addAIMessage('bot', 'Opening notifications panel...', true);
      }, 400);
    }
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
    // 1. Smart actions / slash commands
    let reply = runSmartAction(text);
    if (reply) {
      addAIMessage('bot', reply, true);
      return;
    }

    // 2. Knowledge base match
    reply = findAnswer(text);
    if (reply) {
      const matched = KB.find(e => findAnswer(text) === e.answer);
      if (matched) saveContext(matched.tags[0]);
      addAIMessage('bot', reply, true);
      return;
    }

    // 3. Contextual follow-up
    const contextual = getContextualAnswer(text);
    if (contextual) {
      addAIMessage('bot', contextual, true);
      return;
    }

    // 4. Fallback with suggestions
    const suggestions = findSuggestions(text);
    let msg = `I don't have a specific answer for that, but here are a few things that might help:\n\n- Check the relevant tab in the sidebar for your question.`;
    if (suggestions.length) {
      msg += `\n- Try asking: ${suggestions.map(s => `**${s}**`).join(', ')}`;
    }
    msg += `\n- Contact the school admin for account-specific issues.\n\nI'm always learning — try another question or tap **✨ What can Acaxel AI do?** in the header.`;
    addAIMessage('bot', msg, true);
  }

  function addAIMessage(role, text, animate, fromHistory) {
    const msgs = document.getElementById('aiMessages');
    if (!msgs) return;
    const bubble = document.createElement('div');
    bubble.className = `ai-msg ai-msg-${role}`;

    if (role === 'bot') {
      bubble.innerHTML = `
        <div class="ai-msg-avatar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><circle cx="12" cy="12" r="10"/><path d="M8 10h.01M12 10h.01M16 10h.01"/></svg></div>
        <div class="ai-bubble">
          <p class="ai-bubble-text"></p>
          <div class="ai-bubble-actions">
            <button class="ai-copy-btn" onclick="copyAIMessage(this)" title="Copy">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              <span>Copy</span>
            </button>
          </div>
          <div class="ai-bubble-time">${nowStr()}</div>
        </div>`;
      msgs.appendChild(bubble);
      msgs.scrollTop = msgs.scrollHeight;
      const p = bubble.querySelector('.ai-bubble-text');
      const html = renderMd(text);
      if (animate) {
        p.innerHTML = '<span class="ai-typing-dots"><span></span><span></span><span></span></span>';
        msgs.scrollTop = msgs.scrollHeight;
        setTimeout(() => {
          p.innerHTML = html;
          p.dataset.raw = text;
          msgs.scrollTop = msgs.scrollHeight;
          if (!fromHistory) saveHistory();
        }, 700);
      } else {
        p.innerHTML = html;
        p.dataset.raw = text;
        if (!fromHistory) saveHistory();
      }
    } else {
      bubble.innerHTML = `<div class="ai-bubble ai-bubble-user"><p class="ai-bubble-text">${escapeHtml(text)}</p><div class="ai-bubble-time">${nowStr()}</div></div>`;
      msgs.appendChild(bubble);
      if (!fromHistory) saveHistory();
    }
    msgs.scrollTop = msgs.scrollHeight;
  }

  window.copyAIMessage = function (btn) {
    const bubble = btn.closest('.ai-bubble');
    const raw = bubble?.querySelector('.ai-bubble-text')?.dataset.raw || bubble?.querySelector('.ai-bubble-text')?.textContent || '';
    navigator.clipboard?.writeText(raw).then(() => {
      const span = btn.querySelector('span');
      const old = span?.textContent;
      if (span) span.textContent = 'Copied!';
      setTimeout(() => { if (span) span.textContent = old; }, 1500);
    }).catch(() => {});
  };

  /* ─── Lucide icons ───────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    if (typeof lucide !== 'undefined') lucide.createIcons();
    initVoice();
  });

})();
