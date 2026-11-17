// API simulada para la demostración estática de GitHub Pages.
(() => {
  'use strict';

  const storage = 'enfermeria-academica:demo:v1';
  const session = storage + ':user';
  const users = [
    { id_usuario: 1, username: 'ana.estudiante', nombre: 'Ana Lopez', rol: 'ESTUDIANTE' },
    { id_usuario: 2, username: 'bruno.estudiante', nombre: 'Bruno Benitez', rol: 'ESTUDIANTE' },
    { id_usuario: 3, username: 'laura.tutor', nombre: 'Prof. Laura Martinez', rol: 'TUTOR' },
  ];
  const passwords = ['Ana2026!', 'Bruno2026!', 'Laura2026!'];
  const practices = ['Fundamentos de Enfermería - Práctica I', 'Enfermería Comunitaria - Práctica II',
    'Enfermería del Adulto - Práctica III', 'Enfermería Materno Infantil - Práctica IV'];
  const hospital = 'Hospital Escuela Ficticio del Norte';
  const center = 'Centro de Salud Familiar Ficticio San Martín';
  const places = [[hospital, 'Clínica Médica'], [hospital, 'Pediatría'],
    [center, 'Atención Primaria'], [center, 'Control Prenatal']];

  const timestamp = (offset = 0) => new Date(Date.now() + offset * 86400000).toISOString();
  function date(offset = 0) {
    const now = new Date();
    now.setDate(now.getDate() + offset);
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }

  function seed() {
    const plans = [[1, 0, 0, -14], [1, 1, 2, -7], [1, 2, 0, 5], [1, 3, 3, 12],
      [2, 0, 1, -14], [2, 1, 2, -7], [2, 2, 0, 6]]
      .map(([student, practice, place, offset], i) => ({
        id_planificacion: i + 1, id_estudiante: student, estudiante: users[student - 1].nombre,
        practica: practices[practice], fecha_practica: date(offset),
        institucion: places[place][0], servicio: places[place][1],
      }));
    const records = [
      { id_registro: 1, id_planificacion: 5, estado: 'VALIDADA', horas_realizadas: 6,
        actividades: 'Observación de la rutina del servicio y registro de actividades supervisadas.',
        reflexion: 'Aprendí la importancia de la comunicación con el equipo.',
        fecha_creacion: timestamp(-5), fecha_envio: timestamp(-4), fecha_modificacion: timestamp(-2),
        fecha_hora_validacion: timestamp(-2), observacion: 'Registro completo y claro.',
        tutor: users[2].nombre, resultado: 'VALIDADA' },
      { id_registro: 2, id_planificacion: 6, estado: 'ENVIADA', horas_realizadas: 5.5,
        actividades: 'Participación en una jornada de educación para la salud en la comunidad.',
        fecha_creacion: timestamp(-1), fecha_envio: timestamp(-0.8), fecha_modificacion: timestamp(-0.8) },
    ];
    return { plans, records };
  }

  const json = (data, status = 200) => new Response(JSON.stringify(data), {
    status, headers: { 'Content-Type': 'application/json' },
  });
  const fail = (status, error) => json({ error }, status);
  const missing = () => fail(404, 'No encontramos ese registro.');
  const invalid = (campos) => json({ error: 'Revisa los datos del formulario.', campos }, 422);
  const conflict = () => fail(409, 'El registro ya pasó a la siguiente etapa.');
  const target = (user) => user.rol === 'TUTOR' ? './tutor.html' : './estudiante.html';

  function student(path, method, body, user, state) {
    const plans = state.plans.filter((p) => p.id_estudiante === user.id_usuario);
    const find = (plan) => state.records.find((r) => r.id_planificacion === plan);
    const records = plans.flatMap((p) => {
      const record = find(p.id_planificacion);
      return record ? [{ ...p, ...record }] : [];
    }).sort((a, b) => b.fecha_modificacion.localeCompare(a.fecha_modificacion));

    if (path === '/dashboard') {
      const resumen = { total: records.length, BORRADOR: 0, ENVIADA: 0, VALIDADA: 0 };
      for (const record of records) resumen[record.estado]++;
      const proximas = plans.filter((p) => p.fecha_practica >= date())
        .map((p) => ({ ...p, ...find(p.id_planificacion) }));
      return json({ resumen, proximas });
    }
    if (path === '/plannings') return json({ planificaciones: plans.filter((p) => !find(p.id_planificacion)) });
    if (path === '/records' && method === 'GET') return json({ registros: records });
    if (path === '/records' && method === 'POST') {
      const { valores, errores } = DemoValidation.validarRegistro(body, { requerirCompleto: false });
      const plan = plans.find((p) => p.id_planificacion === Number(valores.id_planificacion));
      if (!plan) errores.id_planificacion ??= 'Selecciona una práctica de tu planificación.';
      if (Object.keys(errores).length) return invalid(errores);
      if (find(plan.id_planificacion)) return fail(409, 'Ya existe un registro para esa práctica.');
      const id = Math.max(0, ...state.records.map((r) => r.id_registro)) + 1;
      state.records.push({ ...valores, id_planificacion: plan.id_planificacion, id_registro: id,
        estado: 'BORRADOR', fecha_creacion: timestamp(), fecha_modificacion: timestamp() });
      return json({ id_registro: id }, 201);
    }

    const match = path.match(/^\/records\/(\d+)(\/send)?$/);
    if (!match) return missing();
    const item = records.find((r) => r.id_registro === Number(match[1]));
    if (!item) return missing();
    if (method === 'GET' && !match[2]) return json({ registro: item });
    const record = find(item.id_planificacion);
    if (record.estado !== 'BORRADOR') return conflict();
    if (match[2] && method === 'POST') {
      const { errores } = DemoValidation.validarRegistro(record, { requerirCompleto: true });
      if (Object.keys(errores).length) return invalid(errores);
      Object.assign(record, { estado: 'ENVIADA', fecha_envio: timestamp(), fecha_modificacion: timestamp() });
      return json({ ok: true, estado: record.estado });
    }
    if (!match[2] && method === 'PUT') {
      const { valores, errores } = DemoValidation.validarRegistro({ ...body, id_planificacion: undefined }, { requerirCompleto: false });
      if (Object.keys(errores).length) return invalid(errores);
      Object.assign(record, valores, { fecha_modificacion: timestamp() });
      return json({ id_registro: record.id_registro });
    }
    return missing();
  }

  function tutor(path, method, body, query, user, state) {
    const records = state.records.filter((r) => r.estado !== 'BORRADOR')
      .map((r) => ({ ...state.plans.find((p) => p.id_planificacion === r.id_planificacion), ...r }));
    if (path === '/dashboard') {
      const pendientes = records.filter((r) => r.estado === 'ENVIADA')
        .sort((a, b) => a.fecha_envio.localeCompare(b.fecha_envio));
      const reviewed = records.filter((r) => r.estado === 'VALIDADA');
      return json({ pendientes, resumen: { pendientes: pendientes.length, total_revisadas: reviewed.length,
        validadas_hoy: reviewed.filter((r) => r.fecha_hora_validacion.slice(0, 10) === date()).length } });
    }
    if (path === '/reports/validation') {
      const [person, status, from, to] = ['estudiante', 'estado', 'desde', 'hasta'].map((key) => query.get(key));
      const registros = records.filter((r) => (!person || String(r.id_estudiante) === person)
        && (!status || r.estado === status) && (!from || r.fecha_practica >= from) && (!to || r.fecha_practica <= to))
        .sort((a, b) => b.fecha_practica.localeCompare(a.fecha_practica) || b.id_registro - a.id_registro);
      const estudiantes = users.slice(0, 2).map(({ id_usuario, nombre }) => ({ id_estudiante: id_usuario, nombre }));
      return json({ registros, estudiantes });
    }
    const match = path.match(/^\/records\/(\d+)(\/validate)?$/);
    if (!match) return missing();
    const item = records.find((r) => r.id_registro === Number(match[1]));
    if (!item) return missing();
    if (method === 'GET' && !match[2]) return json({ registro: item });
    if (method !== 'POST' || !match[2]) return missing();
    if (item.estado !== 'ENVIADA') return conflict();
    const { valores, errores } = DemoValidation.validarObservacion(body);
    if (Object.keys(errores).length) return invalid(errores);
    const record = state.records.find((r) => r.id_registro === item.id_registro);
    Object.assign(record, valores, { estado: 'VALIDADA', resultado: 'VALIDADA', tutor: user.nombre,
      fecha_hora_validacion: timestamp(), fecha_modificacion: timestamp() });
    return json({ ok: true, estado: record.estado });
  }

  window.demoFetch = async (input, options = {}) => {
    const url = new URL(input, location.href);
    const { pathname, searchParams } = url;
    const method = options.method || 'GET';
    const body = JSON.parse(options.body || '{}');
    if (pathname === '/api/auth/login') {
      const i = users.findIndex((u, index) => u.username === body.username?.trim().toLowerCase()
        && passwords[index] === body.password);
      if (i < 0) return fail(401, 'No pudimos iniciar sesión. Revisa tus credenciales.');
      sessionStorage.setItem(session, users[i].username);
      return json({ user: users[i], destino: target(users[i]) });
    }
    if (pathname === '/api/auth/logout') {
      sessionStorage.removeItem(session);
      return json({ ok: true });
    }

    const user = users.find((u) => u.username === sessionStorage.getItem(session));
    if (!user) return fail(401, 'Sesión expirada.');
    if (pathname === '/api/auth/me') return json({ user });
    const [, , role, ...parts] = pathname.split('/');
    const isStudent = user.rol === 'ESTUDIANTE';
    if (role !== (isStudent ? 'student' : 'tutor')) return fail(403, 'No tienes acceso a esta sección.');

    const saved = localStorage.getItem(storage);
    const state = saved ? JSON.parse(saved) : seed();
    const path = '/' + parts.join('/');
    const response = isStudent ? student(path, method, body, user, state)
      : tutor(path, method, body, searchParams, user, state);
    if (!saved || (method !== 'GET' && response.ok)) localStorage.setItem(storage, JSON.stringify(state));
    return response;
  };

  const form = document.querySelector('#login');
  if (!form) return;
  const panel = document.createElement('div');
  panel.className = 'demo-access';
  panel.innerHTML = '<p><strong>Demo interactiva.</strong> Usa datos ficticios. Los cambios se guardan en este navegador.</p>'
    + '<div><button type="button" class="btn btn-secondary btn-sm" data-user="0">Entrar como estudiante</button>'
    + '<button type="button" class="btn btn-secondary btn-sm" data-user="2">Entrar como tutora</button></div>'
    + '<button type="button" class="btn btn-ghost btn-sm" data-reset>Restablecer demo</button>'
    + '<span role="status" class="hint"></span>';
  form.append(panel);
  for (const button of panel.querySelectorAll('[data-user]')) {
    button.addEventListener('click', () => {
      form.elements.username.value = users[button.dataset.user].username;
      form.elements.password.value = passwords[button.dataset.user];
      form.requestSubmit();
    });
  }
  panel.querySelector('[data-reset]').addEventListener('click', () => {
    localStorage.removeItem(storage);
    panel.querySelector('[role=status]').textContent = 'Datos iniciales restaurados.';
  });
})();
