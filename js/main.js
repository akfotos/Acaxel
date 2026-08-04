// Navbar scroll effect
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar?.classList.toggle('scrolled', window.scrollY > 20);
});

// Hamburger menu
const hamburger = document.getElementById('hamburger');
const mobileNav = document.getElementById('mobileNav');
hamburger?.addEventListener('click', () => {
  mobileNav.classList.toggle('open');
});

// Close mobile nav on link click
document.querySelectorAll('.mobile-nav a').forEach(link => {
  link.addEventListener('click', () => mobileNav.classList.remove('open'));
});

// Animate stats on scroll
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.feature-card, .stat-item, .portal-card, .pricing-card, .testimonial-card, .section-header-warm, .cta-content, .img-showcase-item').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  observer.observe(el);
});

// Pricing billing toggle
let isAnnual = false;
function toggleBilling() {
  isAnnual = !isAnnual;
  const btn = document.getElementById('billingToggle');
  btn?.classList.toggle('annual', isAnnual);

  const notes = {
    billedNoteBasic: isAnnual ? 'Billed annually (₵96/yr)' : 'Billed monthly',
    billedNoteInter: isAnnual ? 'Billed annually (₵240/yr)' : 'Billed monthly',
    billedNoteAdv:   isAnnual ? 'Billed annually (₵480/yr)' : 'Billed monthly',
  };
  Object.entries(notes).forEach(([id, text]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  });

  document.querySelectorAll('.pricing-amount').forEach(el => {
    const val = isAnnual ? el.dataset.annual : el.dataset.monthly;
    el.textContent = val;
  });
}
