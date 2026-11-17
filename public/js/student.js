// Panel del estudiante: inicio, mis prácticas, formulario, detalle y seguimiento (rutas por hash).
'use strict';

const NAV = [
  { label: 'General', links: [{ key: 'inicio', href: '#/', icon: 'home', label: 'Inicio' }] },
  { label: 'Prácticas', links: [
    { key: 'practicas', href: '#/practicas', icon: 'list', label: 'Mis prácticas' },
    { key: 'nueva', href: '#/nueva', icon: 'plus', label: 'Nueva práctica' },
    { key: 'seguimiento', href: '#/seguimiento', icon: 'activity', label: 'Seguimiento' },
  ] },
];
const NUEVA_BTN = `<a class="btn btn-sm" href="#/nueva" aria-label="Nueva práctica">${icon('plus2', 'sm')}<span class="lbl-d">Nueva práctica</span></a>`;
const HOME = { label: 'Inicio', href: '#/' };
let navId = 0;

let limpiarVista = null; // libera listeners de la pantalla anterior (guarda de cambios sin guardar)
async function route() {
  if (limpiarVista) { limpiarVista(); limpiarVista = null; }
  const my = ++navId;
  const live = () => my === navId; // descarta respuestas de pantallas que ya no están activas
  const hash = location.hash.replace(/^#/, '') || '/';
  const [path, query] = hash.split('?');
  const params = new URLSearchParams(query || '');
  let m;
  try {
    if (path === '/') { setActiveNav('inicio'); await dashboard(live); }
    else if (path === '/practicas') { setActiveNav('practicas'); await lista(live); }
    else if (path === '/seguimiento') { setActiveNav('seguimiento'); await seguimiento(live); }
    else if (path === '/nueva') { setActiveNav('nueva'); await formulario(live, null, params.get('plan')); }
    else if ((m = path.match(/^\/practicas\/(\d+)\/editar$/))) { setActiveNav('practicas'); await formulario(live, m[1]); }
    else if ((m = path.match(/^\/practicas\/(\d+)$/))) { setActiveNav('practicas'); await detalle(live, m[1]); }
    else { location.hash = '#/'; return; }
  } catch (e) {
    if (!live()) return;
    setPage({ title: 'No disponible', crumbs: [HOME] });
    render(`<div class="card">${emptyState('No pudimos abrir esta pantalla', e.error || 'Inténtalo de nuevo en unos minutos.', '<a class="btn" href="#/practicas">Volver a mis prácticas</a>', 'alert')}</div>`);
  }
  if (live()) { focusView(); window.scrollTo(0, 0); }
}

// Carga con skeleton diferido: pide los datos y solo continúa si la pantalla sigue activa.
async function cargar(live, kind, fn) {
  const cancel = lazySkeleton(kind, live);
  try { const r = await fn(); return live() ? r : null; } finally { cancel(); }
}

const lugar = (p) => (p.institucion ? `<span>${icon('pin')}${esc(p.institucion)} · ${esc(p.servicio)}</span>` : '');

// ---------- Inicio ----------
async function dashboard(live) {
  const d = await cargar(live, 'dashboard', () => api('/api/student/dashboard'));
  if (!d) return;
  const { resumen: r, proximas } = d;
  setPage({ title: 'Inicio', actions: NUEVA_BTN });
  const seg = (n) => `<i style="flex-grow:${n}"></i>`;
  render(`
    <div class="page-head"><div><h1>${saludo()}, ${esc(nombreCorto(user.nombre))}</h1><p>Gestiona y consulta tus prácticas académicas.</p></div></div>
    <div class="metrics">
      <div class="card metric hero"><div><div class="m-head"><span>Mis registros</span><span class="icon-tile">${icon('layers')}</span></div>
        <div class="num" style="margin-top:14px">${r.total}</div></div>
        ${r.total ? `<div><div class="bar" role="img" aria-label="${r.BORRADOR} borradores, ${r.ENVIADA} enviadas, ${r.VALIDADA} validadas">${seg(r.VALIDADA)}${seg(r.ENVIADA)}${seg(r.BORRADOR)}</div>
        <div class="legend"><span>● ${r.VALIDADA} validadas</span><span>● ${r.ENVIADA} enviadas</span><span>● ${r.BORRADOR} borradores</span></div></div>` : '<div class="sub">Aún no tienes registros. Crea el primero.</div>'}</div>
      <div class="card metric hoverable"><div class="m-head"><span>Borradores</span><span class="icon-tile gray">${icon('pencil')}</span></div><div><div class="num">${r.BORRADOR}</div><div class="sub">Sin enviar</div></div></div>
      <div class="card metric hoverable"><div class="m-head"><span>Enviadas</span><span class="icon-tile">${icon('send')}</span></div><div><div class="num">${r.ENVIADA}</div><div class="sub">Esperando revisión</div></div></div>
      <div class="card metric hoverable"><div class="m-head"><span>Validadas</span><span class="icon-tile green">${icon('check')}</span></div><div><div class="num">${r.VALIDADA}</div><div class="sub">Revisadas por el tutor</div></div></div>
    </div>
    <div class="section-head"><h2>Próximas prácticas</h2><a class="btn btn-ghost btn-sm" href="#/practicas">Ver mis prácticas${icon('chevron', 'sm nudge')}</a></div>
    ${proximas.length ? `<div class="list">${proximas.map((p) => `
      <div class="item hover">
        ${dateBlock(p.fecha_practica)}
        <div class="item-main"><div class="item-title">${esc(p.practica)}</div>
          <div class="item-meta"><span>${icon('clock')}${relDays(p.fecha_practica)} · ${fmtDate(p.fecha_practica)}</span>${lugar(p)}</div></div>
        <div class="item-end">${p.estado ? badge(p.estado) : badgeText('pendiente', 'Pendiente')}
          ${p.id_registro ? `<a class="btn btn-secondary btn-sm" href="#/practicas/${esc(p.id_registro)}" aria-label="Ver registro de ${esc(p.practica)}">Ver registro</a>` : `<a class="btn btn-sm" href="#/nueva?plan=${esc(p.id_planificacion)}" aria-label="Registrar ${esc(p.practica)}">Registrar</a>`}</div>
      </div>`).join('')}</div>` : `<div class="card">${emptyState('No tienes prácticas próximas', 'Cuando tengas nuevas planificaciones aparecerán aquí.', '', 'calendar')}</div>`}`);
}

// ---------- Mis prácticas ----------
const ICON_ESTADO = { BORRADOR: ['pencil', 'gray'], ENVIADA: ['send', ''], VALIDADA: ['check', 'green'] };
async function lista(live) {
  const d = await cargar(live, 'list', () => api('/api/student/records'));
  if (!d) return;
  const registros = d.registros;
  setPage({ title: 'Mis prácticas', crumbs: [HOME], actions: NUEVA_BTN });
  const cnt = (e) => registros.filter((r) => r.estado === e).length;
  const filtros = [['', 'Todas', registros.length], ['BORRADOR', 'Borradores', cnt('BORRADOR')], ['ENVIADA', 'Enviadas', cnt('ENVIADA')], ['VALIDADA', 'Validadas', cnt('VALIDADA')]];
  render(`
    <div class="page-head"><div><h1>Mis prácticas</h1><p>Consulta el estado y el seguimiento de cada registro.</p></div></div>
    ${registros.length ? `<div class="chips" role="group" aria-label="Filtrar por estado">${filtros.map(([v, t, n], i) => `<button class="chip" data-f="${v}" aria-pressed="${i === 0}">${t} <b>${n}</b></button>`).join('')}</div><div id="lst"></div>`
      : `<div class="card">${emptyState('Todavía no registraste ninguna práctica', 'Empieza registrando una práctica de tu planificación.', '<a class="btn" href="#/nueva">Nueva práctica</a>', 'file')}</div>`}`);
  if (!registros.length) return;
  const pintar = (f) => {
    const rs = f ? registros.filter((r) => r.estado === f) : registros;
    document.getElementById('lst').innerHTML = rs.length ? `<div class="list">${rs.map((r) => {
      const [ic, tone] = ICON_ESTADO[r.estado];
      return `<a class="item" href="#/practicas/${esc(r.id_registro)}">
        <span class="icon-tile ${tone}">${icon(ic)}</span>
        <div class="item-main"><div class="item-title">${esc(r.practica)}</div>
          <div class="item-meta"><span>${icon('calendar')}${fmtDate(r.fecha_practica)}</span><span>${icon('clock')}Actualizada ${fmtDateTime(r.fecha_modificacion)}</span></div></div>
        <div class="item-end">${badge(r.estado)}${icon('chevron', 'chev')}</div></a>`;
    }).join('')}</div>` : `<div class="card">${emptyState('No hay registros en este estado', 'Prueba con otro filtro.', '', 'search')}</div>`;
  };
  pintar('');
  viewEl.querySelectorAll('.chip').forEach((b) => b.addEventListener('click', () => {
    viewEl.querySelectorAll('.chip').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    pintar(b.dataset.f);
  }));
}

// ---------- Seguimiento: el avance de cada registro por etapa ----------
async function seguimiento(live) {
  const d = await cargar(live, 'list', () => api('/api/student/records'));
  if (!d) return;
  setPage({ title: 'Seguimiento', crumbs: [HOME] });
  const col = (estado, titulo, ic, tone, vacio) => {
    const rs = d.registros.filter((r) => r.estado === estado);
    return `<section class="pipe-col" aria-label="${titulo}"><h3><span style="display:inline-flex;align-items:center;gap:8px"><span class="icon-tile ${tone}" style="width:30px;height:30px;border-radius:10px">${icon(ic, 'sm')}</span>${titulo}</span><b class="muted">${rs.length}</b></h3>
      ${rs.length ? rs.map((r) => `<a class="pipe-card" href="#/practicas/${esc(r.id_registro)}"><strong>${esc(r.practica)}</strong><span>${fmtDate(r.fecha_practica)}${r.fecha_hora_validacion ? ` · validada ${fmtDate(r.fecha_hora_validacion)}` : ''}</span></a>`).join('') : `<div class="pipe-empty">${vacio}</div>`}</section>`;
  };
  render(`<div class="page-head"><div><h1>Seguimiento</h1><p>El avance de tus registros: de borrador a validada.</p></div></div>
    <div class="pipeline">${col('BORRADOR', 'Borrador', 'pencil', 'gray', 'Sin borradores')}${col('ENVIADA', 'Enviada', 'send', '', 'Nada pendiente de revisión')}${col('VALIDADA', 'Validada', 'check', 'green', 'Aún sin validaciones')}</div>`);
}

// ---------- Formulario (nuevo o edición de borrador) ----------
async function formulario(live, id, planPre) {
  const d = await cargar(live, 'form', async () => {
    if (id) return { reg: (await api(`/api/student/records/${id}`)).registro };
    return { planes: (await api('/api/student/plannings')).planificaciones };
  });
  if (!d) return;
  const { reg, planes = [] } = d;
  if (reg && reg.estado !== 'BORRADOR') { location.hash = `#/practicas/${id}`; return; }
  setPage({ title: id ? 'Editar borrador' : 'Nueva práctica', crumbs: [HOME, { label: 'Mis prácticas', href: '#/practicas' }] });
  if (!id && !planes.length) {
    render(`<div class="page-head"><h1>Nueva práctica</h1></div><div class="card">${emptyState('No tienes planificaciones pendientes', 'Todas tus prácticas planificadas ya tienen un registro.', '<a class="btn" href="#/practicas">Ver mis prácticas</a>', 'check')}</div>`);
    return;
  }
  const horasVal = reg?.horas_realizadas ?? '';
  render(`
    <div class="page-head"><div><h1>${id ? 'Editar borrador' : 'Nueva práctica'}</h1><p>Completa solo lo que el sistema todavía no conoce.</p></div></div>
    <form id="f" novalidate>
      <div class="form-layout">
        <div class="stack-v">
          ${formError('').replace('class="form-error"', 'class="form-error" id="ferr" hidden')}
          <div class="card">
            <div class="card-title"><span class="icon-tile">${icon('book')}</span><h2>Información académica</h2></div>
            ${id ? `<div class="field"><span class="lbl">Práctica planificada</span><div><strong>${esc(reg.practica)}</strong></div></div>`
              : `<div class="field"><label for="id_planificacion">Práctica planificada</label>
                  <select class="select" id="id_planificacion" name="id_planificacion" required>
                    <option value="">Selecciona una práctica…</option>
                    ${planes.map((p) => `<option value="${esc(p.id_planificacion)}" ${String(p.id_planificacion) === String(planPre) ? 'selected' : ''}>${esc(p.practica)} · ${fmtDate(p.fecha_practica)}</option>`).join('')}
                  </select><span class="hint">La fecha proviene de tu planificación; no necesitas escribirla.</span></div>`}
          </div>
          <div class="card">
            <div class="card-title"><span class="icon-tile">${icon('file')}</span><h2>Registro de la práctica</h2></div>
            <div class="field"><label for="horas_realizadas">Horas realizadas</label>
              <input class="input" id="horas_realizadas" name="horas_realizadas" type="number" inputmode="decimal" min="0.5" max="24" step="0.5" value="${esc(horasVal)}" style="max-width:200px" placeholder="Ej. 6">
              <span class="hint">Entre 0,5 y 24, en múltiplos de 0,5.</span></div>
            <div class="field"><label for="actividades">Actividades realizadas</label>
              <textarea class="textarea" id="actividades" name="actividades" maxlength="1500" placeholder="Describe brevemente las actividades que realizaste.">${esc(reg?.actividades ?? '')}</textarea>
              <div class="counter" id="c-act" aria-hidden="true"></div>
              <span class="hint">No incluyas datos de pacientes ni información clínica.</span></div>
            <div class="field"><label for="reflexion">Reflexión <span class="muted">(opcional)</span></label>
              <textarea class="textarea" id="reflexion" name="reflexion" maxlength="1500" placeholder="¿Qué aprendiste?" style="min-height:96px">${esc(reg?.reflexion ?? '')}</textarea></div>
          </div>
        </div>
        <aside class="card side-sticky" aria-label="Resumen">
          <div class="card-title"><span class="icon-tile gray">${icon('info')}</span><h2>Resumen</h2></div>
          <div class="summary-row"><span>Estado</span>${badge('BORRADOR')}</div>
          <div class="summary-row"><span>Fecha de la práctica</span><b id="s-fecha">${reg ? fmtDate(reg.fecha_practica) : '—'}</b></div>
          ${reg?.institucion ? `<div class="summary-row"><span>Institución</span><b>${esc(reg.institucion)}</b></div>` : ''}
          <div class="summary-row"><span>Estudiante</span><b>${esc(user.nombre)}</b></div>
          <div class="callout">${icon('info')}<span>Puedes guardar un borrador y seguir después. Al enviar, el registro queda protegido hasta que el tutor lo revise.</span></div>
        </aside>
      </div>
      <div class="actionbar" role="region" aria-label="Acciones del formulario">
        <span class="dirty" id="dirty" role="status"><i></i><span>Sin cambios</span></span>
        <a class="btn btn-ghost" href="#/practicas">Cancelar</a>
        <button type="button" class="btn btn-secondary" id="draft">${icon('pencil', 'sm')}Guardar borrador</button>
        <button type="button" class="btn" id="send">${icon('send', 'sm')}Enviar práctica</button>
      </div>
    </form>`);

  const f = document.getElementById('f');
  f.addEventListener('submit', (e) => e.preventDefault()); // Enter en un campo no debe recargar la página
  const ferr = document.getElementById('ferr');
  const fechas = Object.fromEntries(planes.map((p) => [String(p.id_planificacion), p.fecha_practica]));
  const datos = () => ({
    ...(id ? {} : { id_planificacion: f.id_planificacion.value || undefined }),
    horas_realizadas: f.horas_realizadas.value, actividades: f.actividades.value, reflexion: f.reflexion.value,
  });
  let base = JSON.stringify(datos()); // estado guardado; si cambia, se muestra "Cambios sin guardar"
  const dirty = document.getElementById('dirty');
  const refrescar = () => {
    const sucio = JSON.stringify(datos()) !== base;
    dirty.classList.toggle('on', sucio);
    dirty.lastChild.textContent = sucio ? 'Cambios sin guardar' : (id ? 'Todo guardado' : 'Sin cambios');
    document.getElementById('c-act').textContent = `${f.actividades.value.length}/1500`;
    if (!id) document.getElementById('s-fecha').textContent = fechas[f.id_planificacion.value] ? fmtDate(fechas[f.id_planificacion.value]) : '—';
  };
  f.addEventListener('input', (e) => clearFieldError(e.target)); f.addEventListener('change', (e) => clearFieldError(e.target));
  f.addEventListener('input', refrescar); f.addEventListener('change', refrescar);
  refrescar();
  const sucio = () => JSON.stringify(datos()) !== base;
  // Avisar antes de perder cambios: recarga/cierre y clics en enlaces internos.
  window.onbeforeunload = (e) => { if (sucio()) { e.preventDefault(); e.returnValue = ''; } };
  const guarda = async (e) => {
    const a = e.target.closest('a[href^="#/"]');
    if (!a || !sucio() || a.closest('.modal')) return;
    e.preventDefault(); e.stopPropagation();
    const ok = await confirmModal({ title: '¿Salir sin guardar?', text: 'Tienes cambios sin guardar. Si sales ahora se perderán.', confirmLabel: 'Salir sin guardar', cancelLabel: 'Seguir editando', iconName: 'warn' });
    if (ok) { base = JSON.stringify(datos()); location.hash = a.getAttribute('href'); }
  };
  document.addEventListener('click', guarda, true);
  limpiarVista = () => { window.onbeforeunload = null; document.removeEventListener('click', guarda, true); };

  // Validación local (la del servidor es la definitiva).
  const validar = (completo) => {
    const e = {};
    if (!id && !f.id_planificacion.value) e.id_planificacion = 'Selecciona la práctica que vas a registrar.';
    const h = f.horas_realizadas.value.trim();
    if (!h) { if (completo) e.horas_realizadas = 'Indica las horas realizadas.'; }
    else if (!(Number(h) >= 0.5 && Number(h) <= 24 && Math.round(Number(h) * 2) === Number(h) * 2)) e.horas_realizadas = 'Las horas deben estar entre 0,5 y 24, en múltiplos de 0,5.';
    const a = f.actividades.value.trim();
    if (!a) { if (completo) e.actividades = 'Describe las actividades realizadas.'; }
    else if (a.length < 10) e.actividades = 'Describe las actividades con al menos 10 caracteres.';
    return e;
  };
  const guardar = async () => {
    let nid = id;
    if (id) await api(`/api/student/records/${id}`, { method: 'PUT', body: datos() });
    else nid = (await api('/api/student/records', { method: 'POST', body: datos() })).id_registro;
    base = JSON.stringify(datos()); refrescar();
    return nid;
  };
  const mostrarError = (msg) => { ferr.lastChild.textContent = msg; ferr.hidden = false; };
  const manejar = (e) => { if (e.campos) showFieldErrors(f, e.campos); mostrarError(e.error || 'No pudimos guardar. Inténtalo de nuevo.'); };
  const ocupado = (v) => f.querySelectorAll('button').forEach((b) => (b.disabled = v));

  let enCurso = false; // evita doble clic mientras hay un modal o un guardado en curso
  document.getElementById('draft').onclick = async () => {
    if (enCurso) return; enCurso = true;
    ferr.hidden = true;
    const e = validar(false); showFieldErrors(f, e);
    if (Object.keys(e).length) { mostrarError('Revisa los campos marcados.'); enCurso = false; return; }
    ocupado(true);
    try { const nid = await guardar(); toast('Borrador guardado.'); if (live()) location.hash = `#/practicas/${nid}`; }
    catch (ex) { manejar(ex); } finally { ocupado(false); enCurso = false; }
  };

  document.getElementById('send').onclick = async () => {
    if (enCurso) return; enCurso = true;
    ferr.hidden = true;
    const e = validar(true); showFieldErrors(f, e);
    if (Object.keys(e).length) { mostrarError('Completa los campos marcados para poder enviar.'); enCurso = false; return; }
    const ok = await confirmModal({ title: 'Enviar práctica', text: 'Después del envío no podrás modificar este registro mientras esté pendiente de revisión.', confirmLabel: 'Enviar práctica', iconName: 'send' });
    if (!ok) { enCurso = false; return; }
    ocupado(true);
    let nid = id;
    try {
      nid = await guardar();
      await api(`/api/student/records/${nid}/send`, { method: 'POST' });
      toast('Práctica enviada correctamente.');
      if (live()) location.hash = `#/practicas/${nid}`;
    } catch (ex) { manejar(ex); if (nid && nid !== id) { toast('Se guardó como borrador.', 'warning'); if (live()) location.hash = `#/practicas/${nid}/editar`; } }
    finally { ocupado(false); enCurso = false; }
  };
}

// ---------- Detalle con timeline ----------
async function detalle(live, id) {
  const d = await cargar(live, 'detail', () => api(`/api/student/records/${id}`));
  if (!d) return;
  const r = d.registro;
  setPage({ title: r.practica, crumbs: [HOME, { label: 'Mis prácticas', href: '#/practicas' }] });
  // Solo eventos que realmente ocurrieron.
  const pasos = [{ t: 'Creada', d: r.fecha_creacion, desc: 'Registro iniciado como borrador.', ic: 'file' }];
  if (r.fecha_envio) pasos.push({ t: 'Enviada', d: r.fecha_envio, desc: 'Enviada al tutor para su revisión.', ic: 'send' });
  if (r.fecha_hora_validacion) pasos.push({ t: 'Validada', d: r.fecha_hora_validacion, desc: `Revisión registrada por ${r.tutor}.`, ic: 'check', done: true });
  render(`
    <div class="page-head"><div><div class="eyebrow">${icon('calendar', 'sm')}${fmtDate(r.fecha_practica)}</div><h1>${esc(r.practica)}</h1>
      <p style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">${badge(r.estado)}<span>${r.institucion ? `${esc(r.institucion)} · ${esc(r.servicio)}` : 'Lugar por confirmar'}</span></p></div>
      ${r.estado === 'BORRADOR' ? `<a class="btn" href="#/practicas/${esc(r.id_registro)}/editar">${icon('pencil', 'sm')}Editar borrador</a>` : ''}</div>
    <div class="grid-2">
      <div class="stack-v">
        <div class="card"><div class="card-title"><span class="icon-tile">${icon('book')}</span><h2>Datos de la práctica</h2></div>
          <dl class="dl">
            <div class="fact"><span class="icon-tile">${icon('calendar')}</span><div><dt>Fecha de la práctica</dt><dd>${fmtDate(r.fecha_practica)}</dd></div></div>
            <div class="fact"><span class="icon-tile">${icon('hourglass')}</span><div><dt>Horas realizadas</dt><dd>${fmtHoras(r.horas_realizadas)}</dd></div></div>
            <div class="fact"><span class="icon-tile">${icon('pin')}</span><div><dt>Institución</dt><dd>${r.institucion ? `${esc(r.institucion)} · ${esc(r.servicio)}` : 'Por confirmar'}</dd></div></div>
            <div class="fact"><span class="icon-tile">${icon('clock')}</span><div><dt>Última modificación</dt><dd>${fmtDateTime(r.fecha_modificacion)}</dd></div></div>
          </dl></div>
        <div class="card"><div class="card-title"><span class="icon-tile gray">${icon('file')}</span><h2>Actividades realizadas</h2></div>
          <p class="prose ${r.actividades ? '' : 'empty'}">${r.actividades ? esc(r.actividades) : 'Aún no registraste actividades.'}</p>
          ${r.reflexion ? `<h3 style="margin:20px 0 8px">Reflexión</h3><p class="prose">${esc(r.reflexion)}</p>` : ''}</div>
        ${r.estado === 'VALIDADA' ? `<div class="card review-card"><div class="card-title"><span class="icon-tile green">${icon('shield')}</span><h2>Observación del tutor</h2></div>
          <div class="review-head">${avatar(r.tutor, 'lg tutor')}<div class="who-t"><strong>${esc(r.tutor)}</strong><span>${fmtDateTime(r.fecha_hora_validacion)}</span></div>${badgeText('validada', 'Validación registrada')}</div>
          <div class="quote">${esc(r.observacion)}</div></div>` : ''}
      </div>
      <div class="stack-v">
        <div class="card"><div class="card-title"><span class="icon-tile gray">${icon('activity')}</span><h2>Seguimiento</h2></div>
          <ol class="timeline">${pasos.map((p) => `<li class="tl-step ${p.done ? 'done' : ''}"><span class="tl-dot">${icon(p.ic, 'sm')}</span><div><strong>${p.t}</strong><div class="when">${fmtDateTime(p.d)}</div><div class="desc">${esc(p.desc)}</div></div></li>`).join('')}</ol></div>
        ${r.estado === 'ENVIADA' ? `<div class="callout amber">${icon('hourglass')}<span><strong>Pendiente de revisión.</strong> El registro está protegido contra edición hasta que el tutor lo revise.</span></div>` : ''}
        ${r.estado === 'BORRADOR' ? `<div class="callout">${icon('info')}<span><strong>Borrador.</strong> Aún no se envió al tutor. Puedes seguir editándolo.</span></div>` : ''}
      </div>
    </div>`);
}

(async () => {
  await mountShell('ESTUDIANTE', NAV);
  if (!viewEl) return;
  window.addEventListener('hashchange', route);
  route();
})();
