/* ============================================================
   GEMBA GUITAR — Shared Hamburger Navigation
   Collapses the navbar link list into a hamburger menu at every
   screen size. Load in <head> on any page with a .gemba-nav or
   legacy <nav> bar:
   <script src="/js/gemba-nav.js"></script>

   Styles are injected synchronously so the full link list never
   flashes before the script runs. The menu itself is built on
   DOM ready.
   ============================================================ */

(function () {
  'use strict';

  /* ── STYLES (injected immediately, before first paint) ── */
  var css = [
    /* Collapse the inline link list at all widths */
    '.gemba-nav-links, nav > ul.nav-links { display: none !important; }',

    /* Drawer — absolutely positioned against the fixed navbar */
    '.gemba-nav-links.gemba-open, nav > ul.nav-links.gemba-open {',
    '  display: flex !important;',
    '  flex-direction: column;',
    '  align-items: stretch;',
    '  gap: 2px;',
    '  position: absolute;',
    '  top: 100%;',
    '  left: auto;',
    '  right: 0;',
    '  width: min(300px, calc(100vw - 40px));',
    '  margin: 0;',
    '  padding: 12px 12px 16px;',
    '  list-style: none;',
    '  background: rgba(11, 30, 61, 0.98);',
    '  -webkit-backdrop-filter: blur(16px);',
    '  backdrop-filter: blur(16px);',
    '  border: 1px solid rgba(201, 168, 76, 0.15);',
    '  border-top: none;',
    '  border-radius: 0 0 14px 14px;',
    '  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.45);',
    '}',

    '.gemba-open li { width: 100%; list-style: none; }',

    '.gemba-open li > a {',
    '  display: block !important;',
    '  width: 100%;',
    '  padding: 11px 14px !important;',
    '  border-radius: 8px;',
    '  font-family: \'DM Sans\', sans-serif;',
    '  font-size: 15px !important;',
    '  font-weight: 500;',
    '  letter-spacing: 0.3px;',
    '  color: rgba(245, 240, 232, 0.82);',
    '  text-decoration: none;',
    '  transition: background 0.15s, color 0.15s;',
    '}',

    '.gemba-open li > a:hover, .gemba-open li > a:focus-visible {',
    '  background: rgba(201, 168, 76, 0.12);',
    '  color: #e8c96a;',
    '}',

    '.gemba-open li > a.active {',
    '  color: #c9a84c;',
    '  background: rgba(201, 168, 76, 0.1);',
    '}',

    /* "Home" sits above a hairline separator */
    '.gemba-open > li.gemba-home-item {',
    '  margin-bottom: 6px;',
    '  padding-bottom: 6px;',
    '  border-bottom: 1px solid rgba(255, 255, 255, 0.08);',
    '}',

    /* ── "TOOLS" SUBMENU ── */
    '.gemba-group-toggle {',
    '  display: flex;',
    '  align-items: center;',
    '  justify-content: space-between;',
    '  gap: 8px;',
    '  width: 100%;',
    '  padding: 11px 14px;',
    '  background: none;',
    '  border: none;',
    '  border-radius: 8px;',
    '  font-family: \'DM Sans\', sans-serif;',
    '  font-size: 15px;',
    '  font-weight: 500;',
    '  letter-spacing: 0.3px;',
    '  color: rgba(245, 240, 232, 0.82);',
    '  text-align: left;',
    '  cursor: pointer;',
    '  transition: background 0.15s, color 0.15s;',
    '}',

    '.gemba-group-toggle:hover, .gemba-group-toggle:focus-visible {',
    '  background: rgba(201, 168, 76, 0.12);',
    '  color: #e8c96a;',
    '}',

    '.gemba-group-toggle.gemba-sub-open { color: #e8c96a; }',

    '.gemba-chevron {',
    '  width: 15px;',
    '  height: 15px;',
    '  flex-shrink: 0;',
    '  transition: transform 0.2s;',
    '}',

    '.gemba-group-toggle.gemba-sub-open .gemba-chevron { transform: rotate(180deg); }',

    '.gemba-submenu {',
    '  display: none;',
    '  margin: 2px 0 4px 12px;',
    '  padding: 0 0 0 10px;',
    '  list-style: none;',
    '  border-left: 1px solid rgba(201, 168, 76, 0.25);',
    '}',

    '.gemba-submenu.gemba-sub-open {',
    '  display: flex;',
    '  flex-direction: column;',
    '  gap: 2px;',
    '}',

    '.gemba-submenu li > a {',
    '  font-size: 14px !important;',
    '  padding: 9px 12px !important;',
    '}',

    /* ── HAMBURGER BUTTON ── */
    '.gemba-burger {',
    '  display: flex;',
    '  flex-direction: column;',
    '  gap: 5px;',
    '  padding: 8px;',
    '  background: none;',
    '  border: none;',
    '  cursor: pointer;',
    '  flex-shrink: 0;',
    '}',

    '.gemba-burger span {',
    '  display: block;',
    '  width: 24px;',
    '  height: 2px;',
    '  background: #f5f0e8;',
    '  border-radius: 2px;',
    '  transition: transform 0.25s, opacity 0.2s;',
    '}',

    '.gemba-burger:hover span { background: #e8c96a; }',

    '.gemba-burger.gemba-open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }',
    '.gemba-burger.gemba-open span:nth-child(2) { opacity: 0; }',
    '.gemba-burger.gemba-open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }'
  ].join('\n');

  var styleEl = document.createElement('style');
  styleEl.setAttribute('data-gemba-nav', '');
  styleEl.textContent = css;
  (document.head || document.documentElement).appendChild(styleEl);

  /* Links that belong under the "Tools" submenu. */
  var TOOL_PATHS = [
    '/chord-lookup',
    '/chord-generator',
    '/metronome',
    '/tuner',
    '/tab-creator'
  ];

  function normalizePath(href) {
    if (!href) return '';
    return href.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';
  }

  /* Pull the tool links out of the flat list and nest them under a
     collapsible "Tools" toggle, in place of the first one. */
  function buildToolsGroup(list) {
    var toolItems = Array.prototype.filter.call(list.children, function (li) {
      var a = li.querySelector('a');
      return a && TOOL_PATHS.indexOf(normalizePath(a.getAttribute('href'))) !== -1;
    });
    if (toolItems.length < 2) return;

    var group = document.createElement('li');
    group.className = 'gemba-group';

    var submenu = document.createElement('ul');
    submenu.className = 'gemba-submenu';
    submenu.id = 'gemba-tools-submenu';

    var toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'gemba-group-toggle';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', submenu.id);
    toggle.innerHTML =
      '<span>Tools</span>' +
      '<svg class="gemba-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<polyline points="6 9 12 15 18 9"/></svg>';

    function setSubOpen(open) {
      submenu.classList.toggle('gemba-sub-open', open);
      toggle.classList.toggle('gemba-sub-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    }

    list.insertBefore(group, toolItems[0]);
    toolItems.forEach(function (li) { submenu.appendChild(li); });
    group.appendChild(toggle);
    group.appendChild(submenu);

    // Already on a tool page? Open the submenu so the active item shows.
    setSubOpen(!!submenu.querySelector('a.active'));

    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      setSubOpen(!submenu.classList.contains('gemba-sub-open'));
    });
  }

  /* ── MENU ── */
  function init() {
    var list = document.querySelector('.gemba-nav-links, nav > ul.nav-links');
    if (!list) return;

    var nav = list.closest('nav');
    if (!nav) return;

    if (!list.id) list.id = 'gemba-nav-menu';

    // Fold the standalone "← Home" button into the menu so the bar
    // holds nothing but the logo and the hamburger.
    var homeBtn = nav.querySelector('.gemba-nav-home, .nav-back, .nav-home');
    if (homeBtn) {
      var homeItem = document.createElement('li');
      homeItem.className = 'gemba-home-item';
      var homeLink = document.createElement('a');
      homeLink.href = homeBtn.getAttribute('href') || '/';
      homeLink.textContent = 'Home';
      homeItem.appendChild(homeLink);
      list.insertBefore(homeItem, list.firstChild);
      homeBtn.parentNode.removeChild(homeBtn);
    }

    buildToolsGroup(list);

    var burger = document.createElement('button');
    burger.className = 'gemba-burger';
    burger.type = 'button';
    burger.setAttribute('aria-label', 'Menu');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-controls', list.id);
    burger.innerHTML = '<span></span><span></span><span></span>';
    nav.appendChild(burger);

    function setOpen(open) {
      list.classList.toggle('gemba-open', open);
      burger.classList.toggle('gemba-open', open);
      burger.setAttribute('aria-expanded', String(open));
    }

    burger.addEventListener('click', function (e) {
      e.stopPropagation();
      setOpen(!list.classList.contains('gemba-open'));
    });

    // Close on outside click, link click, or Escape.
    document.addEventListener('click', function (e) {
      if (!nav.contains(e.target)) setOpen(false);
    });

    list.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && list.classList.contains('gemba-open')) {
        setOpen(false);
        burger.focus();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
