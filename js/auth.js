// Dashboard map
const dashboardMap = {
  parent:  'parent-dashboard.html',
  student: 'student-dashboard.html',
  teacher: 'teacher-dashboard.html',
  admin:   'admin-dashboard.html'
};

// Demo user map
const demoUsers = {
  parent:  { name: 'Mrs. Adaeze Okonkwo',  email: 'adaeze@demo.com' },
  student: { name: 'Asare Tony Papa Kwesi', email: 'kwesi@demo.com' },
  teacher: { name: 'Mr. Adeyemi Taiwo',     email: 'adeyemi@demo.com' },
  admin:   { name: 'Mrs. Grace Acheampong', email: 'grace@demo.com' }
};

// Default school info (Highcrest School from the Excel workbook)
const defaultSchoolInfo = {
  name: 'Highcrest School',
  code: 'HCS-2526-01',
  shortName: 'Highcrest',
  motto: 'Nurturing Excellence, Building Character.',
  curriculum: 'Oxford International Curriculum',
  address: 'Adentan, Accra',
  city: 'Accra',
  country: 'Ghana',
  type: 'Combined (JHS + SHS)',
  position: 'Principal',
  adminName: demoUsers.admin.name,
  adminEmail: demoUsers.admin.email,
  registeredAt: new Date().toISOString()
};

/* ── helpers ────────────────────────────────────────────── */
function adminIsRegistered() {
  return !!localStorage.getItem('hc_school_registered');
}

/* ── ID / Code generators ────────────────────────────────── */
function _pad(n, len) { return String(n).padStart(len, '0'); }
function _rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function _seq() { return _pad(_rand(1, 9999), 4); }

function genSchoolCode(schoolName) {
  const words = (schoolName || '').trim().split(/\s+/).filter(Boolean);
  const initials = words.slice(0, 3).map(w => w[0].toUpperCase()).join('');
  const year = new Date().getFullYear().toString().slice(-2);
  const num  = _pad(_rand(1, 99), 2);
  return initials ? `${initials}-${year}${num}` : `SCH-${year}${num}`;
}

function genStaffId(prefix) {
  return `${prefix}-${_seq()}`;
}

function genStudentId(prefix) {
  const year = new Date().getFullYear();
  return `${prefix}/${year}/${_seq()}`;
}

function setGenField(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}

function refreshGenField(id, role) {
  const el = document.getElementById(id);
  if (!el) return;

  /* Spin the refresh icon */
  const btn = el.parentElement?.querySelector('.gen-refresh-btn');
  if (btn) {
    btn.classList.add('gen-spinning');
    setTimeout(() => btn.classList.remove('gen-spinning'), 600);
  }

  /* Generate correct type per field */
  if (id === 'schoolCode') {
    const name = document.getElementById('schoolName')?.value || '';
    setGenField('schoolCode', genSchoolCode(name));
  } else if (id === 'adminStaffId') {
    setGenField('adminStaffId', genStaffId('ADM'));
  } else if (id === 'staffId') {
    setGenField('staffId', genStaffId('TCH'));
  } else if (id === 'studentIdNum') {
    setGenField('studentIdNum', genStudentId('STU'));
  } else if (id === 'studentId') {
    setGenField('studentId', genStudentId('HC'));
  }

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function copyGenField(id) {
  const el = document.getElementById(id);
  if (!el || !el.value) return;
  navigator.clipboard.writeText(el.value).then(() => {
    const btn = el.parentElement?.querySelector('.gen-copy-btn');
    if (btn) {
      const orig = btn.innerHTML;
      btn.innerHTML = '<i data-lucide="check"></i>';
      if (typeof lucide !== 'undefined') lucide.createIcons();
      setTimeout(() => { btn.innerHTML = orig; if (typeof lucide !== 'undefined') lucide.createIcons(); }, 1800);
    }
  }).catch(() => {
    el.select(); document.execCommand('copy');
  });
}

/* ── Wire up auto-generation on page load ─────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const year = new Date().getFullYear();

  /* Generate immediately for roles that don't depend on name input */
  setGenField('staffId',     genStaffId('TCH'));
  setGenField('adminStaffId', genStaffId('ADM'));
  setGenField('studentIdNum', genStudentId('STU'));
  setGenField('studentId',    genStudentId('HC'));   /* parent — child's ID */

  /* School code regenerates live as admin types the school name */
  const schoolNameEl = document.getElementById('schoolName');
  if (schoolNameEl) {
    schoolNameEl.addEventListener('input', () => {
      setGenField('schoolCode', genSchoolCode(schoolNameEl.value));
    });
    /* Seed an initial value if already filled */
    if (schoolNameEl.value) setGenField('schoolCode', genSchoolCode(schoolNameEl.value));
    else setGenField('schoolCode', `SCH-${year.toString().slice(-2)}${_pad(_rand(1,99),2)}`);
  }

  /* Regenerate student/teacher IDs when first/last name changes (optional personalisation) */
  ['firstName', 'lastName'].forEach(fid => {
    const el = document.getElementById(fid);
    if (el) el.addEventListener('change', () => {
      const role = (document.getElementById('signupRole')?.value || '');
      if (role === 'student') setGenField('studentIdNum', genStudentId('STU'));
      if (role === 'teacher') setGenField('staffId',      genStaffId('TCH'));
      if (role === 'admin')   setGenField('adminStaffId', genStaffId('ADM'));
      if (role === 'parent')  setGenField('studentId',    genStudentId('HC'));
    });
  });
});

/* ── Role toggle ─────────────────────────────────────────── */
function setRole(role, btn) {
  document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  const roleField = document.getElementById('loginRole') || document.getElementById('signupRole');
  if (roleField) roleField.value = role;

  // Toggle role-specific fields (signup page only)
  ['parentFields','studentFields','teacherFields','adminFields'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.remove('active');
      el.querySelectorAll('input, select, textarea').forEach(f => {
        f.disabled = true;
        f.dataset.roleDisabled = 'true';
      });
    }
  });
  const active = document.getElementById(role + 'Fields');
  if (active) {
    active.classList.add('active');
    active.querySelectorAll('input, select, textarea').forEach(f => {
      f.disabled = false;
      delete f.dataset.roleDisabled;
    });
  }

  // Signup-page-only UI updates
  const subtitle    = document.getElementById('signupSubtitle');
  const notice      = document.getElementById('schoolFirstNotice');
  const submitBtn   = document.getElementById('signupSubmitBtn');
  const form        = document.getElementById('signupForm');

  if (!subtitle) return; // login page — nothing more to do

  const schoolReady = adminIsRegistered();

  const subtitles = {
    admin:   'Register your school to get started',
    teacher: 'Join your school as a teacher',
    parent:  'Stay connected to your child\'s progress',
    student: 'Access your grades, timetable, and more',
  };
  subtitle.textContent = subtitles[role] || 'Create your account';

  const submitLabels = {
    admin:   'Register School & Create Account',
    teacher: 'Create Teacher Account',
    parent:  'Create Parent Account',
    student: 'Create Student Account',
  };
  if (submitBtn) submitBtn.innerHTML = submitLabels[role] || 'Create Account';

  if (role === 'admin') {
    if (notice) notice.style.display = 'none';
    if (form)   form.style.opacity   = '1';
    if (form)   form.style.pointerEvents = 'auto';
  } else {
    if (!schoolReady) {
      if (notice) notice.style.display = 'flex';
      if (form)   form.style.opacity   = '0.45';
      if (form)   form.style.pointerEvents = 'none';
    } else {
      if (notice) notice.style.display = 'none';
      if (form)   form.style.opacity   = '1';
      if (form)   form.style.pointerEvents = 'auto';
    }
  }
}

/* ── Login handler ───────────────────────────────────────── */
function handleLogin(e) {
  e.preventDefault();
  const role  = document.getElementById('loginRole').value;
  const email = document.getElementById('email').value;
  const remember = document.getElementById('rememberMe')?.checked;

  if (remember) {
    localStorage.setItem('hc_remember_email', email);
    localStorage.setItem('hc_remember_role', role);
  } else {
    localStorage.removeItem('hc_remember_email');
    localStorage.removeItem('hc_remember_role');
  }

  localStorage.setItem('hc_user', JSON.stringify({
    name: demoUsers[role]?.name || 'User',
    role, email
  }));
  window.location.href = dashboardMap[role] || 'parent-dashboard.html';
}

/* ── Restore remembered login details ────────────────────── */
function restoreLoginFields() {
  const savedEmail = localStorage.getItem('hc_remember_email');
  const savedRole  = localStorage.getItem('hc_remember_role');
  const emailInput = document.getElementById('email');
  const rememberBox = document.getElementById('rememberMe');

  if (savedEmail && emailInput) emailInput.value = savedEmail;
  if (savedRole && rememberBox) {
    rememberBox.checked = true;
    const btn = document.querySelector(`[data-role="${savedRole}"]`);
    if (btn) setRole(savedRole, btn);
  }
}

if (document.getElementById('loginForm')) {
  document.addEventListener('DOMContentLoaded', restoreLoginFields);
}

/* ── Signup handler ──────────────────────────────────────── */
function clearSignupErrors() {
  document.querySelectorAll('.field-error').forEach(el => { el.textContent = ''; el.classList.remove('visible'); });
  document.querySelectorAll('.form-group input, .form-group select').forEach(el => el.classList.remove('invalid'));
}

function showFieldError(id, message, inputId) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = message;
    el.classList.add('visible');
  }
  if (inputId) {
    const input = document.getElementById(inputId);
    if (input) input.classList.add('invalid');
  }
}

function handleSignup(e) {
  e.preventDefault();
  clearSignupErrors();

  const role      = document.getElementById('signupRole').value;
  const firstName = document.getElementById('firstName').value.trim();
  const lastName  = document.getElementById('lastName').value.trim();
  const email     = document.getElementById('email').value.trim();
  const password  = document.getElementById('password').value;
  const confirm   = document.getElementById('confirmPassword')?.value;
  const terms     = document.getElementById('termsCheck')?.checked;

  let hasError = false;

  if (!firstName) { showFieldError('firstNameError', 'First name is required.', 'firstName'); hasError = true; }
  if (!lastName)  { showFieldError('lastNameError',  'Last name is required.',  'lastName');  hasError = true; }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showFieldError('emailError', 'Please enter a valid email address.', 'email');
    hasError = true;
  }
  if (password.length < 8) {
    showFieldError('passwordError', 'Password must be at least 8 characters.', 'password');
    hasError = true;
  } else if (confirm !== undefined && confirm !== password) {
    showFieldError('passwordError', 'Passwords do not match.', 'confirmPassword');
    hasError = true;
  }
  if (!terms) {
    showFieldError('termsError', 'You must agree to the terms to continue.');
    hasError = true;
  }

  // Block non-admin if no school registered
  if (role !== 'admin' && !adminIsRegistered()) {
    const notice = document.getElementById('schoolFirstNotice');
    if (notice) { notice.style.display = 'flex'; notice.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    return;
  }

  if (hasError) return;

  const userData = {
    name:  `${firstName} ${lastName}`,
    role,
    email,
  };

  // Save school info when admin registers
  if (role === 'admin') {
    const schoolName = document.getElementById('schoolName')?.value || defaultSchoolInfo.name;
    const schoolCode = document.getElementById('schoolCode')?.value || defaultSchoolInfo.code;
    const schoolType = document.getElementById('schoolType')?.value || defaultSchoolInfo.type;
    const position   = document.getElementById('adminRole')?.value  || defaultSchoolInfo.position;
    localStorage.setItem('hc_school_registered', JSON.stringify({
      ...defaultSchoolInfo,
      name: schoolName, code: schoolCode, type: schoolType, position,
      adminName: userData.name, adminEmail: userData.email,
      registeredAt: new Date().toISOString(),
    }));
  }

  localStorage.setItem('hc_user', JSON.stringify(userData));
  window.location.href = dashboardMap[role] || 'parent-dashboard.html';
}

/* ── Demo login ──────────────────────────────────────────── */
function demoLogin(role) {
  const user = demoUsers[role] || demoUsers.parent;
  // Demo admin auto-registers the Highcrest School from the Excel workbook
  if (!adminIsRegistered()) {
    localStorage.setItem('hc_school_registered', JSON.stringify(defaultSchoolInfo));
  }
  localStorage.setItem('hc_user', JSON.stringify({ ...user, role }));
  window.location.href = dashboardMap[role] || 'parent-dashboard.html';
}

/* ── Pre-fill role from URL param ────────────────────────── */
const params  = new URLSearchParams(window.location.search);
const urlRole = params.get('role');
if (urlRole) {
  const btn = document.querySelector(`[data-role="${urlRole}"]`);
  if (btn) setRole(urlRole, btn);
} else {
  // On signup page default to admin role UI update
  const adminBtn = document.querySelector('[data-role="admin"]');
  if (adminBtn && document.getElementById('signupRole')) setRole('admin', adminBtn);
}
