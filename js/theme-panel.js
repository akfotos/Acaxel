/* =====================================================
   HIGHCREST — THEME PANEL
   Injects the theme switcher UI and manages all themes
   ===================================================== */

(function () {

  // ── Palette definitions ──────────────────────────────
  const PALETTES = [
    { id: 'indigo',   label: 'Indigo',   color: '#6366f1' },
    { id: 'wine',     label: 'Wine',     color: '#7c2d3e' },
    { id: 'ocean',    label: 'Ocean',    color: '#0369a1' },
    { id: 'midnight', label: 'Purple',   color: '#7c3aed' },
  ];

  // ── Theme state ──────────────────────────────────────
  let currentPalette = localStorage.getItem('hc_palette') || 'indigo';
  let currentMode    = localStorage.getItem('hc_mode')    || 'dark';

  // wine palette maps to "light"/"dark" directly; others use palette[-dark] suffix
  function buildThemeName(palette, mode) {
    if (palette === 'wine') return mode === 'dark' ? 'dark' : 'light';
    return mode === 'dark' ? palette + '-dark' : palette;
  }

  function applyTheme() {
    const theme = buildThemeName(currentPalette, currentMode);
    document.documentElement.setAttribute('data-theme', theme);
    // Update toggle button icon
    const icon = document.getElementById('themeToggleIcon');
    if (icon) {
      icon.setAttribute('data-lucide', currentMode === 'dark' ? 'sun' : 'moon');
      if (window.lucide) lucide.createIcons();
    }
    // Persist
    localStorage.setItem('hc_palette', currentPalette);
    localStorage.setItem('hc_mode', currentMode);
  }

  // ── Inject panel HTML ───────────────────────────────
  function injectPanel() {
    if (document.getElementById('themePanel')) return;

    // Backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'theme-panel-backdrop';
    backdrop.id = 'themePanelBackdrop';
    backdrop.addEventListener('click', closePanel);
    document.body.appendChild(backdrop);

    // Panel
    const panel = document.createElement('div');
    panel.className = 'theme-panel';
    panel.id = 'themePanel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Theme settings');

    const swatchHTML = PALETTES.map(p => `
      <div class="theme-swatch${p.id === currentPalette ? ' active' : ''}"
           data-palette="${p.id}"
           title="${p.label}"
           onclick="window.__hcTheme.setPalette('${p.id}')">
        <div class="theme-swatch-dot" style="background:${p.color};"></div>
        <span class="theme-swatch-label">${p.label}</span>
      </div>`).join('');

    panel.innerHTML = `
      <div class="theme-panel-header">
        <div class="theme-panel-title">
          <i data-lucide="palette"></i> Appearance
        </div>
        <button class="theme-panel-close" onclick="window.__hcTheme.closePanel()" aria-label="Close">
          <i data-lucide="x"></i>
        </button>
      </div>
      <div class="theme-panel-body">
        <div class="theme-palette-label">Mode</div>
        <div class="theme-mode-row">
          <button class="theme-mode-btn${currentMode === 'light' ? ' active' : ''}"
                  id="modeBtnLight"
                  onclick="window.__hcTheme.setMode('light')">
            <i data-lucide="sun"></i> Light
          </button>
          <button class="theme-mode-btn${currentMode === 'dark' ? ' active' : ''}"
                  id="modeBtnDark"
                  onclick="window.__hcTheme.setMode('dark')">
            <i data-lucide="moon"></i> Dark
          </button>
        </div>
        <div class="theme-palette-label">Colour</div>
        <div class="theme-palette-grid">${swatchHTML}</div>
        <div class="theme-palette-label" style="margin-top:4px;">Preview</div>
        <div id="themePreviewBar" style="
          height:6px; border-radius:100px;
          background: linear-gradient(90deg, var(--accent), var(--accent-dark));
          margin-top:4px; transition: background 0.3s;
        "></div>
      </div>`;

    document.body.appendChild(panel);
    if (window.lucide) lucide.createIcons();
  }

  // ── Inject toggle button into topnav ────────────────
  function injectToggleButton() {
    const rightCluster = document.querySelector('.dash-topnav-right');
    if (!rightCluster || document.getElementById('themeToggleBtn')) return;

    const btn = document.createElement('button');
    btn.className = 'theme-toggle-btn';
    btn.id = 'themeToggleBtn';
    btn.setAttribute('aria-label', 'Toggle theme panel');
    btn.setAttribute('title', 'Appearance');
    btn.innerHTML = `<i data-lucide="${currentMode === 'dark' ? 'sun' : 'moon'}" id="themeToggleIcon"></i>`;
    btn.addEventListener('click', togglePanel);

    // Insert before notif-btn if present, else prepend
    const notifBtn = rightCluster.querySelector('.notif-btn');
    if (notifBtn) {
      rightCluster.insertBefore(btn, notifBtn);
    } else {
      rightCluster.prepend(btn);
    }
    if (window.lucide) lucide.createIcons();
  }

  // ── Panel open / close ───────────────────────────────
  function openPanel() {
    document.getElementById('themePanel')?.classList.add('open');
    document.getElementById('themePanelBackdrop')?.classList.add('open');
  }
  function closePanel() {
    document.getElementById('themePanel')?.classList.remove('open');
    document.getElementById('themePanelBackdrop')?.classList.remove('open');
  }
  function togglePanel() {
    const panel = document.getElementById('themePanel');
    if (panel?.classList.contains('open')) closePanel();
    else openPanel();
  }

  // ── Set mode (light / dark) ──────────────────────────
  function setMode(mode) {
    currentMode = mode;
    applyTheme();
    // Update button states
    document.getElementById('modeBtnLight')?.classList.toggle('active', mode === 'light');
    document.getElementById('modeBtnDark')?.classList.toggle('active', mode === 'dark');
  }

  // ── Set palette ──────────────────────────────────────
  function setPalette(palette) {
    currentPalette = palette;
    applyTheme();
    // Update swatch active states
    document.querySelectorAll('.theme-swatch').forEach(s => {
      s.classList.toggle('active', s.dataset.palette === palette);
    });
  }

  // ── Keyboard shortcut (Alt + T) ──────────────────────
  document.addEventListener('keydown', e => {
    if (e.altKey && e.key.toLowerCase() === 't') { e.preventDefault(); togglePanel(); }
  });

  // ── Init on DOM ready ────────────────────────────────
  function init() {
    applyTheme();
    injectPanel();
    injectToggleButton();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ── Expose to global (for onclick handlers) ──────────
  window.__hcTheme = { setMode, setPalette, openPanel, closePanel, togglePanel };

})();
