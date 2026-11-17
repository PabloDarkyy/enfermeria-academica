// Utilidades compartidas: iconos, API, toasts, modales, formato y estructura de página (shell).
'use strict';

// ---- Iconos (trazos estilo Lucide, 24x24) ----
const ICON_PATHS = {
  home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  list: '<rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4M12 16h4M8 11h.01M8 16h.01"/>',
  plus: '<circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/>',
  plus2: '<path d="M12 5v14M5 12h14"/>',
  activity: '<path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>',
  check: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  chart: '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9M13 17V5M8 17v-3"/>',
  menu: '<line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  calendar: '<path d="M8 2v4M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
  pin: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  back: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  inbox: '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  alert: '<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  warn: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4M12 17h.01"/>',
  file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4M10 9H8M16 13H8M16 17H8"/>',
  send: '<path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/>',
  pencil: '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',
  reset: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  hourglass: '<path d="M5 22h14M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/>',
  book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  layers: '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
};
const icon = (name, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICON_PATHS[name] || ''}</svg>`;

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---- Formato ----
const dateObj = (s) => { const [y, m, d] = String(s).slice(0, 10).split('-').map(Number); return new Date(y, m - 1, d); };
const fmtDate = (s) => (s ? dateObj(s).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
const fmtDateTime = (s) => (s ? new Date(s).toLocaleString('es', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');
const dateBlock = (s) => { const d = dateObj(s); return `<div class="date-block" aria-hidden="true"><b>${d.getDate()}</b><small>${d.toLocaleDateString('es', { month: 'short' }).replace('.', '')}</small></div>`; };
function relDays(s) {
  const t = new Date(); t.setHours(0, 0, 0, 0);
  const n = Math.round((dateObj(s) - t) / 86400000);
  return n === 0 ? 'Hoy' : n === 1 ? 'Mañana' : n > 1 ? `En ${n} días` : n === -1 ? 'Ayer' : `Hace ${-n} días`;
}

const fmtHoras = (h) => (h == null ? '—' : `${Number(h).toLocaleString('es')} h`);
const ESTADOS = { BORRADOR: 'Borrador', ENVIADA: 'Enviada', VALIDADA: 'Validada' };
const badge = (estado) => (ESTADOS[estado] ? `<span class="badge badge-${estado.toLowerCase()}">${ESTADOS[estado]}</span>` : badgeText('borrador', estado));
const TONOS = ['borrador', 'enviada', 'pendiente', 'validada', 'confirmada'];
const badgeText = (tone, text) => `<span class="badge badge-${TONOS.includes(tone) ? tone : 'borrador'}">${esc(text)}</span>`;

const saludo = () => { const h = new Date().getHours(); return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'; };
function nombreCorto(nombre) { const p = String(nombre).split(' '); return /^prof/i.test(p[0]) ? p.slice(0, 2).join(' ') : p[0]; }
function iniciales(nombre) { const p = String(nombre).replace(/^prof\.?\s*/i, '').split(' ').filter(Boolean); return ((p[0]?.[0] || '') + (p[1]?.[0] || '')).toUpperCase(); }
// Color estable por nombre para distinguir personas en listados.
const avatar = (nombre, cls = '') => {
  let h = 0; for (const c of String(nombre)) h = (h * 31 + c.charCodeAt(0)) % 3;
  const tone = /\btutor\b/.test(cls) ? '' : ['', 'alt1', 'alt2'][h];
  return `<span class="avatar ${cls} ${tone}" aria-hidden="true">${esc(iniciales(nombre))}</span>`;
};

// ---- API ----
async function api(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(path, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined, credentials: 'same-origin' });
  } catch {
    throw { status: 0, error: 'No pudimos conectar con el servidor. Revisa tu conexión.' };
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && !path.startsWith('/api/auth/login')) { location.href = '/'; throw { status: 401, error: 'Sesión expirada.' }; }
  if (!res.ok) throw { status: res.status, error: data.error || 'Ocurrió un problema inesperado.', campos: data.campos };
  return data;
}

// ---- Toast (success | error | warning | info) ----
const TOAST_ICON = { ok: 'check', success: 'check', error: 'alert', warning: 'warn', info: 'info' };
function toast(msg, type = 'ok') {
  let box = document.querySelector('.toasts');
  if (!box) { box = document.createElement('div'); box.className = 'toasts'; box.setAttribute('role', 'status'); box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
  const t = document.createElement('div');
  t.className = `toast ${type === 'ok' ? 'success' : type}`;
  t.innerHTML = `<span class="t-ic">${icon(TOAST_ICON[type] || 'check', 'sm')}</span><span></span>`;
  t.lastChild.textContent = msg;
  box.appendChild(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 230); }, type === 'error' ? 5500 : 3800);
}

// ---- Modal de confirmación: devuelve Promise<boolean> ----
function confirmModal({ title, text, confirmLabel, cancelLabel = 'Cancelar', iconName = 'send', tone = '' }) {
  return new Promise((resolve) => {
    const prev = document.activeElement;
    const el = document.createElement('div');
    el.className = 'modal-backdrop';
    el.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="m-title" aria-describedby="m-text">
      <div class="m-icon ${tone}">${icon(iconName)}</div>
      <h2 id="m-title">${esc(title)}</h2><p id="m-text">${esc(text)}</p>
      <div class="modal-actions"><button class="btn btn-secondary" data-no>${esc(cancelLabel)}</button><button class="btn" data-yes>${esc(confirmLabel)}</button></div></div>`;
    const close = (v) => { el.remove(); document.removeEventListener('keydown', onKey); prev && prev.focus && prev.focus(); resolve(v); };
    const onKey = (e) => {
      if (e.key === 'Escape') close(false);
      if (e.key === 'Tab') { // el foco se queda dentro del modal
        const b = el.querySelectorAll('button'); const first = b[0], last = b[b.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    el.addEventListener('click', (e) => { if (e.target === el) close(false); });
    el.querySelector('[data-no]').onclick = () => close(false);
    el.querySelector('[data-yes]').onclick = () => close(true);
    document.addEventListener('keydown', onKey);
    document.body.appendChild(el);
    el.querySelector('[data-yes]').focus();
  });
}

// ---- Skeletons ----
function skeleton(kind) {
  const rows = (n) => `<div class="list">${'<div class="sk row-sk"><i></i><i></i></div>'.repeat(n)}</div>`;
  if (kind === 'dashboard') return `<div class="sk h1"></div><div class="sk p"></div><div class="sk-metrics"><div class="sk card-sk"></div><div class="sk card-sk"></div><div class="sk card-sk"></div><div class="sk card-sk"></div></div>${rows(3)}`;
  if (kind === 'detail') return `<div class="sk h1"></div><div class="sk p"></div><div class="grid-2" style="margin-top:28px"><div class="sk card-sk" style="height:320px"></div><div class="sk card-sk" style="height:240px"></div></div>`;
  if (kind === 'form') return `<div class="sk h1"></div><div class="sk p"></div><div class="grid-2" style="margin-top:28px"><div class="sk card-sk" style="height:420px"></div><div class="sk card-sk" style="height:220px"></div></div>`;
  return `<div class="sk h1"></div><div class="sk p" style="margin-bottom:28px"></div>${rows(4)}`;
}

// ---- Shell: sidebar flotante + topbar + contenedor de página ----
let viewEl, topbarEl;
async function mountShell(rol, groups) {
  let user;
  try { user = (await api('/api/auth/me')).user; } catch (e) {
    if (e.status === 401) return null; // api() ya redirigió al inicio
    document.getElementById('app').innerHTML = `<div class="login-page"><div class="card">${emptyState('No pudimos cargar la aplicación', e.error || 'Revisa tu conexión e inténtalo de nuevo.', '<button class="btn" id="retry">Reintentar</button>', 'alert')}</div></div>`;
    document.getElementById('retry').onclick = () => location.reload(); // CSP: sin atributos onclick
    return null;
  }
  if (user.rol !== rol) { location.href = '/'; return null; }

  const nav = groups.map((g) => `${g.label ? `<div class="nav-group">${esc(g.label)}</div>` : ''}${g.links.map((l) => `<a class="nav-link" href="${l.href}" data-nav="${l.key}">${icon(l.icon)}<span>${esc(l.label)}</span></a>`).join('')}`).join('');
  const tutor = rol === 'TUTOR';
  document.getElementById('app').innerHTML = `
    <div class="app">
      <aside class="sidebar" id="sidebar" aria-label="Navegación principal">
        <a class="brand" href="${tutor ? '/tutor.html' : '/estudiante.html'}" aria-label="UniNorte, Prácticas de Enfermería: inicio"><span class="brand-logo"><img src="/assets/branding/uninorte-logo.jpg" width="46" height="46" alt="Logo de la Universidad del Norte"></span><div class="brand-text"><strong>UniNorte</strong><span>Prácticas de Enfermería</span></div></a>
        <nav class="nav" aria-label="Secciones">${nav}</nav>
        <div class="sidebar-foot">
          <div class="who">${avatar(user.nombre, tutor ? 'tutor' : '')}<div class="who-text"><strong>${esc(user.nombre)}</strong><span>${tutor ? 'Docente tutor' : 'Estudiante'}</span></div></div>
          <button class="btn btn-secondary btn-sm btn-block" id="logout">${icon('logout', 'sm')}Cerrar sesión</button>
          <p class="proto-note">Prototipo académico · Grupo 02</p>
        </div>
      </aside>
      <div class="main">
        <header class="topbar" id="topbar">
          <button class="btn btn-icon menu-btn" id="menu" aria-label="Abrir menú" aria-expanded="false" aria-controls="sidebar">${icon('menu', 'lg')}</button>
          <div class="top-left"><nav class="crumbs" id="crumbs" aria-label="Ruta"></nav><div class="top-title" id="pageTitle"></div></div>
          <span class="top-spacer"></span>
          <div class="top-actions" id="topActions"></div>
          ${Theme.button()}
          <div class="user-chip">${avatar(user.nombre, 'sm ' + (tutor ? 'tutor' : ''))}<span class="name">${esc(nombreCorto(user.nombre))}</span></div>
        </header>
        <main class="content" id="view" tabindex="-1"></main>
      </div>
    </div>`;

  Theme.refresh();
  const sb = document.getElementById('sidebar');
  const menu = document.getElementById('menu');
  const mainEl = document.querySelector('.main');
  const setOpen = (open, restoreFocus = true) => {
    sb.classList.toggle('open', open);
    menu.setAttribute('aria-expanded', String(open));
    document.querySelector('.scrim')?.remove();
    mainEl.inert = open; // el contenido detrás del drawer no es navegable con teclado
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) {
      const s = document.createElement('div'); s.className = 'scrim'; s.onclick = () => setOpen(false); document.body.appendChild(s);
      sb.querySelector('.nav-link[aria-current], .nav-link')?.focus();
    } else if (restoreFocus) menu.focus();
  };
  menu.onclick = () => setOpen(!sb.classList.contains('open'));
  sb.addEventListener('click', (e) => { if (e.target.closest('.nav-link')) setOpen(false, false); });
  document.addEventListener('keydown', (e) => {
    if (!sb.classList.contains('open')) return;
    if (e.key === 'Escape') setOpen(false);
    if (e.key === 'Tab') { // el foco circula dentro del drawer
      const f = [...sb.querySelectorAll('a, button')]; const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  window.matchMedia('(min-width: 961px)').addEventListener('change', (e) => { if (e.matches && sb.classList.contains('open')) setOpen(false, false); });
  document.getElementById('logout').onclick = async () => { await api('/api/auth/logout', { method: 'POST' }).catch(() => {}); location.href = '/'; };

  topbarEl = document.getElementById('topbar');
  const onScroll = () => topbarEl.classList.toggle('scrolled', window.scrollY > 6);
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  window.user = user;
  viewEl = document.getElementById('view');
  return viewEl;
}

const setActiveNav = (key) => document.querySelectorAll('[data-nav]').forEach((a) => (a.dataset.nav === key ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));

// Título, migas de pan y acciones contextuales de la topbar.
function setPage({ title, crumbs = [], actions = '' }) {
  document.getElementById('pageTitle').textContent = title;
  document.title = `${title} · Prácticas de Enfermería`;
  const c = document.getElementById('crumbs');
  c.innerHTML = crumbs.map((x, i) => `${i ? icon('chevron') : ''}${x.href ? `<a href="${x.href}">${esc(x.label)}</a>` : `<span>${esc(x.label)}</span>`}`).join('');
  c.hidden = !crumbs.length;
  document.getElementById('topActions').innerHTML = actions;
}

// Tras navegar, el foco va al título de la pantalla (lectores de pantalla); el anillo solo se ve con teclado.
function focusView() {
  const h = viewEl.querySelector('h1');
  if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); } else viewEl.focus({ preventScroll: true });
}

// Pinta HTML en el contenedor con la transición de entrada.
function render(html) {
  viewEl.innerHTML = html;
  viewEl.classList.remove('page-enter'); void viewEl.offsetWidth; viewEl.classList.add('page-enter');
}
// Muestra el skeleton solo si la carga tarda más de 140 ms (evita parpadeos). Devuelve la función que lo cancela.
function lazySkeleton(kind, live = () => true) {
  const t = setTimeout(() => { if (live()) render(skeleton(kind)); }, 140);
  return () => clearTimeout(t);
}

// Pinta errores de campo devueltos por la API (o la validación local) bajo cada input.
function showFieldErrors(form, campos = {}) {
  form.querySelectorAll('.field-error').forEach((e) => e.remove());
  form.querySelectorAll('[aria-invalid]').forEach((e) => { e.removeAttribute('aria-invalid'); e.removeAttribute('aria-describedby'); });
  let first = null;
  for (const [name, msg] of Object.entries(campos)) {
    const input = form.elements[name];
    if (!input) continue;
    input.setAttribute('aria-invalid', 'true');
    const p = document.createElement('div');
    p.className = 'field-error'; p.id = `err-${name}`; p.innerHTML = `${icon('alert', 'sm')}<span></span>`; p.lastChild.textContent = msg;
    input.setAttribute('aria-describedby', p.id);
    input.closest('.field').appendChild(p);
    first = first || input;
  }
  if (first) first.focus();
}

// Quita el error de un campo en cuanto el usuario lo corrige.
function clearFieldError(input) {
  if (!input || input.getAttribute?.('aria-invalid') !== 'true') return;
  input.removeAttribute('aria-invalid'); input.removeAttribute('aria-describedby');
  input.closest('.field')?.querySelector('.field-error')?.remove();
}

const formError = (msg) => `<div class="form-error" role="alert">${icon('alert')}<span>${esc(msg)}</span></div>`;
const emptyState = (title, text, btn = '', ic = 'inbox') => `<div class="empty"><div class="ring">${icon(ic)}</div><h3>${esc(title)}</h3><p>${esc(text)}</p>${btn}</div>`;
