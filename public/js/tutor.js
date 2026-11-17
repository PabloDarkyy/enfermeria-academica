// Panel del tutor: pendientes de revisión y revisión de un registro.
'use strict';

const NAV = [
  { label: 'Revisión', links: [{ key: 'pendientes', href: '/tutor.html#/', icon: 'shield', label: 'Revisiones' }] },
  { label: 'Informes', links: [{ key: 'seguimiento', href: '/seguimiento.html', icon: 'chart', label: 'Seguimiento de prácticas' }] },
];
const HOME = { label: 'Revisiones', href: '#/' };
let navId = 0;

async function route() {
  const my = ++navId;
  const live = () => my === navId;
  const path = location.hash.replace(/^#/, '') || '/';
  let m;
  try {
    setActiveNav('pendientes');
    if (path === '/') await dashboard(live);
    else if ((m = path.match(/^\/revisar\/(\d+)$/))) await revisar(live, m[1]);
    else { location.hash = '#/'; return; }
  } catch (e) {
    if (!live()) return;
    setPage({ title: 'No disponible', crumbs: [HOME] });
    render(`<div class="card">${emptyState('No pudimos abrir esta pantalla', e.error || 'Inténtalo de nuevo en unos minutos.', '<a class="btn" href="#/">Volver a revisiones</a>', 'alert')}</div>`);
  }
  if (live()) { focusView(); window.scrollTo(0, 0); }
}

async function cargar(live, kind, fn) {
  const cancel = lazySkeleton(kind, live);
  try { const r = await fn(); return live() ? r : null; } finally { cancel(); }
}

async function dashboard(live) {
  const d = await cargar(live, 'dashboard', () => api('/api/tutor/dashboard'));
  if (!d) return;
  const { resumen: r, pendientes } = d;
  setPage({ title: 'Revisiones', actions: `<a class="btn btn-secondary btn-sm" href="/seguimiento.html" aria-label="Seguimiento de prácticas">${icon('chart', 'sm')}<span class="lbl-d">Seguimiento</span></a>` });
  render(`
    <div class="page-head"><div><h1>${saludo()}, ${esc(nombreCorto(user.nombre))}</h1><p>Estas prácticas requieren tu revisión.</p></div></div>
    <div class="metrics three">
      <div class="card metric hero tutor-hero"><div><div class="m-head"><span>Pendientes</span><span class="icon-tile">${icon('hourglass')}</span></div><div class="num" style="margin-top:14px">${r.pendientes}</div></div>
        <div class="sub">${r.pendientes ? 'Registros enviados esperando tu revisión' : 'Todo al día'}</div></div>
      <div class="card metric hoverable"><div class="m-head"><span>Revisadas hoy</span><span class="icon-tile green">${icon('check')}</span></div><div><div class="num">${r.validadas_hoy}</div><div class="sub">Validaciones de hoy</div></div></div>
      <div class="card metric hoverable"><div class="m-head"><span>Total revisadas</span><span class="icon-tile">${icon('layers')}</span></div><div><div class="num">${r.total_revisadas}</div><div class="sub">Desde el inicio</div></div></div>
    </div>
    <div class="section-head"><h2>Pendientes de revisión</h2></div>
    ${pendientes.length ? `<div class="list">${pendientes.map((x) => `
      <div class="item hover">
        ${avatar(x.estudiante)}
        <div class="item-main"><div class="item-title">${esc(x.estudiante)}</div>
          <div class="item-meta"><span>${icon('book')}${esc(x.practica)}</span><span>${icon('calendar')}${fmtDate(x.fecha_practica)}</span><span>${icon('send')}Enviada ${fmtDateTime(x.fecha_envio)}</span></div></div>
        <div class="item-end">${badge(x.estado)}<a class="btn btn-sm" href="#/revisar/${esc(x.id_registro)}" aria-label="Revisar práctica de ${esc(x.estudiante)}">Revisar${icon('chevron', 'sm nudge')}</a></div>
      </div>`).join('')}</div>`
      : `<div class="card">${emptyState('No hay prácticas pendientes', 'Cuando un estudiante envíe un registro aparecerá aquí.', '<a class="btn btn-secondary" href="/seguimiento.html">Ver seguimiento</a>', 'check')}</div>`}`);
}

async function revisar(live, id) {
  const d = await cargar(live, 'detail', () => api(`/api/tutor/records/${id}`));
  if (!d) return;
  const r = d.registro;
  const validada = r.estado === 'VALIDADA';
  setPage({ title: `Revisión · ${r.estudiante}`, crumbs: [HOME] });
  render(`
    <div class="page-head"><div style="display:flex;align-items:center;gap:18px;min-width:0">${avatar(r.estudiante, 'lg')}
      <div style="min-width:0"><div class="eyebrow">Estudiante</div><h1>${esc(r.estudiante)}</h1>
      <p>Práctica de ${esc(r.practica)}</p></div></div>
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">${badge(r.estado)}<span class="muted" style="display:inline-flex;gap:6px;align-items:center">${icon('send', 'sm')}Enviada el ${fmtDate(r.fecha_envio)}</span></div></div>
    <div class="grid-2">
      <div class="stack-v">
        <div class="card"><div class="card-title"><span class="icon-tile">${icon('book')}</span><h2>Información registrada</h2></div>
          <dl class="dl">
            <div class="fact"><span class="icon-tile">${icon('calendar')}</span><div><dt>Fecha de la práctica</dt><dd>${fmtDate(r.fecha_practica)}</dd></div></div>
            <div class="fact"><span class="icon-tile">${icon('hourglass')}</span><div><dt>Horas realizadas</dt><dd>${fmtHoras(r.horas_realizadas)}</dd></div></div>
            <div class="fact"><span class="icon-tile">${icon('pin')}</span><div><dt>Institución</dt><dd>${r.institucion ? `${esc(r.institucion)} · ${esc(r.servicio)}` : 'Por confirmar'}</dd></div></div>
            <div class="fact"><span class="icon-tile">${icon('send')}</span><div><dt>Fecha de envío</dt><dd>${fmtDateTime(r.fecha_envio)}</dd></div></div>
          </dl></div>
        <div class="card"><div class="card-title"><span class="icon-tile gray">${icon('file')}</span><h2>Actividades realizadas</h2></div>
          <p class="prose">${esc(r.actividades)}</p>
          ${r.reflexion ? `<h3 style="margin:20px 0 8px">Reflexión</h3><p class="prose">${esc(r.reflexion)}</p>` : ''}</div>
      </div>
      <div class="side-sticky">
      ${validada ? `<div class="card review-card"><div class="card-title"><span class="icon-tile green">${icon('shield')}</span><h2>Observación del tutor</h2></div>
          <div class="review-head">${avatar(r.tutor, 'lg tutor')}<div class="who-t"><strong>${esc(r.tutor)}</strong><span>${fmtDateTime(r.fecha_hora_validacion)}</span></div>${badgeText('validada', 'Validación registrada')}</div>
          <div class="quote">${esc(r.observacion)}</div></div>`
      : `<form class="card" id="f" novalidate><div class="card-title"><span class="icon-tile">${icon('pencil')}</span><h2>Tu revisión</h2></div>
          <div class="form-error" id="ferr" role="alert" hidden>${icon('alert')}<span></span></div>
          <div class="field"><label for="observacion">Observación del tutor</label>
            <textarea class="textarea" id="observacion" name="observacion" maxlength="1000" placeholder="Escribe tu observación sobre este registro."></textarea>
            <span class="hint">Mínimo 5 caracteres. Esta validación no es una calificación académica.</span></div>
          <button class="btn btn-lg btn-block" type="submit" id="validar">${icon('shield', 'sm')}Registrar validación</button></form>`}
      </div>
    </div>`);
  if (validada) return;
  const f = document.getElementById('f');
  f.addEventListener('input', (e) => clearFieldError(e.target));
  let enCurso = false; // evita doble envío mientras el modal está abierto
  f.onsubmit = async (e) => {
    e.preventDefault();
    if (enCurso) return; enCurso = true;
    const ferr = document.getElementById('ferr'); ferr.hidden = true;
    const obs = f.observacion.value.trim();
    if (obs.length < 5) { showFieldErrors(f, { observacion: 'Escribe una observación de al menos 5 caracteres.' }); enCurso = false; return; }
    showFieldErrors(f, {});
    const ok = await confirmModal({ title: 'Confirmar validación', text: 'Se registrará la revisión del tutor sobre este registro. Esta acción no representa una calificación académica.', confirmLabel: 'Confirmar validación', iconName: 'shield', tone: 'green' });
    if (!ok) { enCurso = false; return; }
    const btn = document.getElementById('validar'); btn.disabled = true;
    try {
      await api(`/api/tutor/records/${id}/validate`, { method: 'POST', body: { observacion: obs } });
      toast('Validación registrada correctamente.');
      if (live()) await revisar(live, id);
    } catch (ex) {
      btn.disabled = false; enCurso = false;
      if (ex.campos) showFieldErrors(f, ex.campos);
      ferr.lastChild.textContent = ex.error; ferr.hidden = false;
      if (ex.status === 409) setTimeout(() => { if (live()) revisar(live, id); }, 1500);
    }
  };
}

(async () => {
  await mountShell('TUTOR', NAV);
  if (!viewEl) return;
  window.addEventListener('hashchange', route);
  route();
})();
