/* ================================================================
   ACAXEL — LANGUAGE SWITCHER (English / French)
   Applies translations to any element carrying a data-i18n="key"
   attribute, and injects an EN | FR toggle pill into the page.
   The selection is remembered in localStorage across every page.
   Scope: navigation, sidebar labels, and the most common headings/
   buttons — not a full line-by-line translation of every string.
   ================================================================ */

(function (global) {
  'use strict';

  const LANG_KEY = 'hc_lang';

  const DICT = {
    fr: {
      // Marketing nav
      'nav.home': 'Accueil',
      'nav.features': 'Fonctionnalités',
      'nav.pricing': 'Tarifs',
      'nav.about': 'À propos',
      'nav.portals': 'Portails',
      'nav.contact': 'Contact',
      'nav.login': 'Connexion',
      'nav.getstarted': 'Commencer',
      'nav.signup': "S'inscrire",

      // Dashboard sidebar — common
      'side.overview': "Vue d'ensemble",
      'side.students': 'Élèves',
      'side.grades': 'Notes',
      'side.mygrades': 'Mes notes',
      'side.attendance': 'Présence',
      'side.messages': 'Messages',
      'side.timetable': 'Emploi du temps',
      'side.mytimetable': 'Mon emploi du temps',
      'side.clockin': 'Pointage',
      'side.support': 'Assistance',
      'side.profile': 'Mon profil',
      'side.myprofile': 'Mon profil',
      'side.settings': 'Paramètres',
      'side.fees': 'Frais scolaires',
      'side.feestatus': 'État des frais',
      'side.bills': 'Factures',
      'side.billsinvoices': 'Factures & Reçus',
      'side.mychildren': 'Mes enfants',
      'side.assignments': 'Devoirs',
      'side.billing': 'Facturation',
      'side.staff': 'Personnel',
      'side.feeding': 'Cantine',
      'side.inventory': 'Inventaire',
      'side.announcements': 'Annonces',
      'side.reports': 'Rapports',

      // Common buttons
      'btn.save': 'Enregistrer',
      'btn.cancel': 'Annuler',
      'btn.print': 'Imprimer',
      'btn.payNow': 'Payer maintenant',
      'btn.logout': 'Déconnexion',
      'btn.signout': 'Se déconnecter',
    }
  };

  function currentLang() {
    return localStorage.getItem(LANG_KEY) || 'en';
  }

  function translateKey(key) {
    const lang = currentLang();
    if (lang === 'en') return null; // caller should restore original text
    return (DICT[lang] && DICT[lang][key]) || null;
  }

  function applyLanguage() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      if (!el.dataset.i18nOriginal) el.dataset.i18nOriginal = el.textContent;
      const translated = translateKey(el.dataset.i18n);
      el.textContent = translated || el.dataset.i18nOriginal;
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      if (!el.dataset.i18nTitleOriginal) el.dataset.i18nTitleOriginal = el.title || '';
      const translated = translateKey(el.dataset.i18nTitle);
      el.title = translated || el.dataset.i18nTitleOriginal;
    });
    document.documentElement.lang = currentLang();
    updateToggleUI();
  }

  function setLanguage(lang) {
    localStorage.setItem(LANG_KEY, lang);
    applyLanguage();
  }
  global.setAcaxelLanguage = setLanguage;

  function updateToggleUI() {
    document.querySelectorAll('.hc-lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === currentLang());
    });
  }

  function injectToggle() {
    if (document.getElementById('hcLangToggle')) return;

    const style = document.createElement('style');
    style.textContent = `
      #hcLangToggle {
        display: inline-flex; align-items: center; background: rgba(120,120,140,0.12);
        border-radius: 20px; padding: 3px; gap: 2px; font-family: inherit;
      }
      .hc-lang-btn {
        border: none; background: transparent; padding: 4px 10px; border-radius: 16px;
        font-size: 0.74rem; font-weight: 700; cursor: pointer; color: inherit; opacity: 0.6;
        transition: all 0.15s;
      }
      .hc-lang-btn.active { background: var(--accent, #722F37); color: #fff; opacity: 1; }
    `;
    document.head.appendChild(style);

    const wrap = document.createElement('div');
    wrap.id = 'hcLangToggle';
    wrap.innerHTML = `
      <button class="hc-lang-btn" data-lang="en" title="English">EN</button>
      <button class="hc-lang-btn" data-lang="fr" title="Français">FR</button>
    `;
    wrap.querySelectorAll('.hc-lang-btn').forEach(btn => {
      btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
    });

    // Prefer placing it in the dashboard topnav (next to notifications/user chip)
    const dashSlot = document.querySelector('.dash-topnav-right, .dashtopnav-right');
    // Prefer placing it in the marketing navbar
    const navSlot = document.querySelector('.navbar .nav-actions, .navbar-actions, nav .nav-cta, header nav');

    if (dashSlot) {
      dashSlot.insertBefore(wrap, dashSlot.firstChild);
    } else if (navSlot) {
      navSlot.insertBefore(wrap, navSlot.firstChild);
    } else {
      wrap.style.position = 'fixed';
      wrap.style.top = '14px';
      wrap.style.right = '14px';
      wrap.style.zIndex = '9999';
      document.body.appendChild(wrap);
    }
  }

  function init() {
    injectToggle();
    applyLanguage();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(window);
