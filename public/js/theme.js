// Tema claro/oscuro. Se carga en <head>, SIN defer, para fijar data-theme antes del primer pintado (sin parpadeo).
// Prioridad: preferencia guardada (localStorage "theme") > preferencia del sistema (prefers-color-scheme).
(function () {
  'use strict';
  var KEY = 'theme';
  var root = document.documentElement;
  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  var chosen = null; // elección manual de esta sesión (respaldo si localStorage no está disponible)
  function stored() {
    try { var v = localStorage.getItem(KEY); if (v === 'light' || v === 'dark') return v; } catch (e) { /* sin acceso */ }
    return chosen;
  }
  var current = function () { return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'; };
  function apply(t) {
    root.setAttribute('data-theme', t);
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', t === 'dark' ? '#0b0b0d' : '#f5f5f7');
    var dark = t === 'dark';
    document.querySelectorAll('.theme-toggle').forEach(function (b) {
      b.setAttribute('aria-pressed', String(dark));
      b.setAttribute('title', dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'); // el nombre accesible es fijo ("Modo oscuro"); aria-pressed indica el estado
    });
  }

  apply(stored() || (mq && mq.matches ? 'dark' : 'light'));

  // Transición breve (≈250 ms) solo al cambiar; en CSS queda desactivada con prefers-reduced-motion.
  var timer;
  function animate() {
    root.classList.add('theme-anim');
    clearTimeout(timer);
    timer = setTimeout(function () { root.classList.remove('theme-anim'); }, 280);
  }

  function toggle() {
    var next = current() === 'dark' ? 'light' : 'dark';
    chosen = next;
    try { localStorage.setItem(KEY, next); } catch (e) { /* sin almacenamiento: el tema vale solo en esta página */ }
    animate();
    apply(next);
  }

  // Mientras el usuario no haya elegido, seguir al sistema operativo.
  if (mq && mq.addEventListener) {
    mq.addEventListener('change', function (e) { if (!stored()) { animate(); apply(e.matches ? 'dark' : 'light'); } });
  }

  var ICONS = {
    sun: '<svg class="icon i-sun" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>',
    moon: '<svg class="icon i-moon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>',
  };

  window.Theme = {
    current: current,
    toggle: toggle,
    // HTML del botón (sol/luna). La etiqueta y aria-pressed los actualiza apply().
    button: function () { return '<button type="button" class="theme-toggle" aria-pressed="false" aria-label="Modo oscuro" title="Cambiar a modo oscuro">' + ICONS.sun + ICONS.moon + '</button>'; },
    refresh: function () { apply(current()); },
  };

  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('.theme-toggle')) toggle();
  });
})();
