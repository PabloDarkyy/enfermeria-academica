// NI-03 · Seguimiento de prácticas (consulta informativa M06). Datos reales de PostgreSQL, filtros en el servidor.
'use strict';

const NAV = [
  { label: 'Revisión', links: [{ key: 'pendientes', href: '/tutor.html#/', icon: 'shield', label: 'Revisiones' }] },
  { label: 'Informes', links: [{ key: 'seguimiento', href: '/seguimiento.html', icon: 'chart', label: 'Seguimiento de prácticas' }] },
];

(async () => {
  await mountShell('TUTOR', NAV);
  if (!viewEl) return;
  setActiveNav('seguimiento');
  setPage({ title: 'Seguimiento de prácticas', crumbs: [{ label: 'Informes' }] });
  render(`
    <div class="page-head"><div><h1>Seguimiento de prácticas</h1><p>Consulta el estado de los registros enviados y validados.</p></div></div>
    <form class="card filterbar" id="filtros" novalidate aria-label="Filtros del seguimiento">
      <div class="field"><label for="estudiante">Estudiante</label><select class="select" id="estudiante" name="estudiante"><option value="">Todos</option></select></div>
      <div class="field"><label for="estado">Estado</label><select class="select" id="estado" name="estado"><option value="">Todos</option><option value="ENVIADA">Enviada</option><option value="VALIDADA">Validada</option></select></div>
      <div class="field"><label for="desde">Práctica desde</label><input class="input" type="date" id="desde" name="desde"></div>
      <div class="field"><label for="hasta">Práctica hasta</label><input class="input" type="date" id="hasta" name="hasta"></div>
      <div class="btns"><button class="btn" type="submit">${icon('search', 'sm')}Aplicar</button><button type="button" class="btn btn-secondary" id="limpiar">${icon('reset', 'sm')}Limpiar</button></div>
    </form>
    <div id="resultado" aria-live="polite">${skeleton('list')}</div>`);

  const f = document.getElementById('filtros');
  const out = document.getElementById('resultado');
  let primera = true, seq = 0;

  async function cargar() {
    const mi = ++seq; // descarta respuestas viejas si los filtros cambian rápido
    const qs = new URLSearchParams();
    for (const k of ['estudiante', 'estado', 'desde', 'hasta']) if (f[k].value) qs.set(k, f[k].value);
    if (f.desde.value && f.hasta.value && f.desde.value > f.hasta.value) {
      out.innerHTML = formError('La fecha "desde" no puede ser posterior a la fecha "hasta".');
      return;
    }
    const t = setTimeout(() => { if (mi === seq) out.innerHTML = skeleton('list'); }, 140);
    try {
      const { registros, estudiantes } = await api(`/api/tutor/reports/validation?${qs}`);
      if (mi !== seq) return;
      if (primera) { // las opciones de estudiantes se cargan una vez
        f.estudiante.insertAdjacentHTML('beforeend', estudiantes.map((e) => `<option value="${esc(e.id_estudiante)}">${esc(e.nombre)}</option>`).join(''));
        primera = false;
      }
      out.innerHTML = registros.length
        ? `<div class="table-card page-enter"><div class="table-scroll"><table class="data stackable"><thead><tr><th>Estudiante</th><th>Práctica</th><th>Fecha</th><th>Estado</th><th>Tutor</th><th>Fecha de validación</th><th><span class="sr-only">Acción</span></th></tr></thead><tbody>
          ${registros.map((r) => `<tr>
            <td data-label="Estudiante"><div class="person">${avatar(r.estudiante, 'sm')}<strong>${esc(r.estudiante)}</strong></div></td>
            <td data-label="Práctica">${esc(r.practica)}</td>
            <td data-label="Fecha" class="nowrap">${fmtDate(r.fecha_practica)}</td>
            <td data-label="Estado">${badge(r.estado)}</td>
            <td data-label="Tutor">${r.tutor ? `<div class="person">${avatar(r.tutor, 'sm tutor')}<span>${esc(r.tutor)}</span></div>` : '<span class="muted">—</span>'}</td>
            <td data-label="Fecha de validación" class="nowrap">${r.fecha_hora_validacion ? fmtDateTime(r.fecha_hora_validacion) : '<span class="muted">—</span>'}</td>
            <td class="act"><a class="btn btn-secondary btn-sm" href="/tutor.html#/revisar/${esc(r.id_registro)}" aria-label="${r.estado === 'ENVIADA' ? 'Revisar' : 'Ver'} práctica de ${esc(r.estudiante)}">${r.estado === 'ENVIADA' ? 'Revisar' : 'Ver'}</a></td></tr>`).join('')}
          </tbody></table></div><div class="table-foot">${registros.length} ${registros.length === 1 ? 'registro' : 'registros'}</div></div>`
        : `<div class="card">${emptyState('No encontramos registros', 'No encontramos registros con los filtros seleccionados.', qs.size ? `<button class="btn" id="limpiar2">${icon('reset', 'sm')}Limpiar filtros</button>` : '', 'search')}</div>`;
      document.getElementById('limpiar2')?.addEventListener('click', limpiar);
    } catch (e) {
      if (mi === seq) out.innerHTML = formError(e.error || 'No pudimos cargar el seguimiento.');
    } finally { clearTimeout(t); }
  }
  const limpiar = () => { f.reset(); cargar(); };
  f.addEventListener('change', cargar);
  f.addEventListener('submit', (e) => { e.preventDefault(); cargar(); });
  document.getElementById('limpiar').onclick = limpiar;
  cargar();
})();
