// Pruebas de API contra PostgreSQL REAL en una base separada (enfermeria_academica_test).
// Ejecutar con: npm test   (no toca la base de demostración).
process.env.PGDATABASE = 'enfermeria_academica_test';
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'secreto-de-pruebas-1234567890';

const test = require('node:test');
const assert = require('node:assert/strict');
const { setup } = require('../scripts/db');
const db = require('../src/config/database');
const { createApp } = require('../src/app');

let server, base;

// Cliente mínimo con cookie de sesión.
function client() {
  let cookie = '';
  const call = async (method, path, body, opts = {}) => {
    const res = await fetch(base + path, {
      method, redirect: opts.redirect || 'follow',
      headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const sc = res.headers.get('set-cookie');
    if (sc) cookie = sc.split(';')[0];
    const text = await res.text();
    let json; try { json = JSON.parse(text); } catch { json = null; }
    return { status: res.status, json, headers: res.headers, text };
  };
  return { get: (p, o) => call('GET', p, null, o), post: (p, b) => call('POST', p, b ?? {}), put: (p, b) => call('PUT', p, b) };
}
async function login(u, p) { const c = client(); const r = await c.post('/api/auth/login', { username: u, password: p }); assert.equal(r.status, 200); return c; }
const completo = { horas_realizadas: 6, actividades: 'Apoyo en actividades del servicio bajo supervisión.', reflexion: '' };

test.before(async () => {
  await setup('enfermeria_academica_test', { recreate: true }); // crea la BD de pruebas si hace falta y la deja en estado conocido
  server = createApp().listen(0);
  base = `http://localhost:${server.address().port}`;
});
test.after(async () => { server.close(); await db.end(); });

test('P01 acceso: login correcto de estudiante y tutor, credencial incorrecta rechazada', async () => {
  const a = client();
  const r = await a.post('/api/auth/login', { username: 'ana.estudiante', password: 'Ana2026!' });
  assert.equal(r.status, 200); assert.equal(r.json.destino, '/estudiante.html');
  assert.ok(!r.text.includes('password_hash') && !r.text.includes('$2b$'), 'no se expone el hash');
  const t = await client().post('/api/auth/login', { username: 'laura.tutor', password: 'Laura2026!' });
  assert.equal(t.json.destino, '/tutor.html');
  const mal = await client().post('/api/auth/login', { username: 'ana.estudiante', password: 'incorrecta' });
  const noExiste = await client().post('/api/auth/login', { username: 'fantasma', password: 'x' });
  assert.equal(mal.status, 401); assert.equal(noExiste.status, 401);
  assert.equal(mal.json.error, noExiste.json.error, 'mismo mensaje: no revela si el usuario existe');
});

test('sin sesión no hay acceso a la API, y logout cierra la sesión', async () => {
  assert.equal((await client().get('/api/student/records')).status, 401);
  const c = await login('ana.estudiante', 'Ana2026!');
  assert.equal((await c.get('/api/auth/me')).status, 200);
  await c.post('/api/auth/logout');
  assert.equal((await c.get('/api/auth/me')).status, 401);
});

test('P05 autorización por rol: 403 cruzado y páginas protegidas', async () => {
  const est = await login('ana.estudiante', 'Ana2026!');
  const tut = await login('laura.tutor', 'Laura2026!');
  assert.equal((await est.get('/api/tutor/dashboard')).status, 403);
  assert.equal((await est.post('/api/tutor/records/1/validate', { observacion: 'intento no autorizado' })).status, 403);
  assert.equal((await est.get('/api/tutor/reports/validation')).status, 403);
  assert.equal((await tut.get('/api/student/records')).status, 403);
  const pag = await est.get('/tutor.html', { redirect: 'manual' });
  assert.equal(pag.status, 302);
});

test('P02/P04 registro: crea borrador válido; datos inválidos o incompletos se rechazan', async () => {
  const ana = await login('ana.estudiante', 'Ana2026!');
  assert.equal((await ana.post('/api/student/records', { ...completo })).status, 422); // falta planificación
  const horasMal = await ana.post('/api/student/records', { id_planificacion: 1, horas_realizadas: 30 });
  assert.equal(horasMal.status, 422); assert.ok(horasMal.json.campos.horas_realizadas);
  const vacio = await ana.post('/api/student/records', { id_planificacion: 1 }); // borrador mínimo
  assert.equal(vacio.status, 201);
  const id = vacio.json.id_registro;
  const envio = await ana.post(`/api/student/records/${id}/send`); // incompleto
  assert.equal(envio.status, 422); assert.ok(envio.json.campos.actividades && envio.json.campos.horas_realizadas);
  assert.equal((await ana.put(`/api/student/records/${id}`, completo)).status, 200);
  const det = await ana.get(`/api/student/records/${id}`);
  assert.equal(det.json.registro.estado, 'BORRADOR'); assert.equal(det.json.registro.actividades, completo.actividades);
  assert.equal((await ana.post('/api/student/records', { id_planificacion: 1 })).status, 409); // duplicado
});

test('ownership: un estudiante no ve ni toca registros ni planificaciones ajenas', async () => {
  const ana = await login('ana.estudiante', 'Ana2026!');
  const bruno = await login('bruno.estudiante', 'Bruno2026!');
  const { id_registro } = (await ana.post('/api/student/records', { id_planificacion: 2, ...completo })).json;
  assert.equal((await bruno.get(`/api/student/records/${id_registro}`)).status, 404);
  assert.equal((await bruno.put(`/api/student/records/${id_registro}`, completo)).status, 404);
  assert.equal((await bruno.post(`/api/student/records/${id_registro}/send`)).status, 404);
  assert.equal((await bruno.post('/api/student/records', { id_planificacion: 3, ...completo })).status, 422); // planificación de Ana
  const lista = await bruno.get('/api/student/records');
  assert.ok(lista.json.registros.every((r) => r.estudiante === 'Bruno Benitez'));
});

test('P06/P07 recorrido completo y transiciones BORRADOR → ENVIADA → VALIDADA', async () => {
  const ana = await login('ana.estudiante', 'Ana2026!');
  const tut = await login('laura.tutor', 'Laura2026!');
  const { id_registro: id } = (await ana.post('/api/student/records', { id_planificacion: 3, ...completo })).json;

  assert.equal((await tut.get(`/api/tutor/records/${id}`)).status, 404, 'el tutor no ve borradores');
  assert.equal((await tut.post(`/api/tutor/records/${id}/validate`, { observacion: 'Observación válida' })).status, 404);

  assert.equal((await ana.post(`/api/student/records/${id}/send`)).status, 200);
  assert.equal((await ana.post(`/api/student/records/${id}/send`)).status, 409, 'no se envía dos veces');
  const edit = await ana.put(`/api/student/records/${id}`, { ...completo, actividades: 'Intento editar después de enviar.' });
  assert.equal(edit.status, 409, 'enviada = protegida contra edición');

  const pend = await tut.get('/api/tutor/dashboard');
  assert.ok(pend.json.pendientes.some((r) => String(r.id_registro) === String(id)));

  assert.equal((await tut.post(`/api/tutor/records/${id}/validate`, { observacion: '  ' })).status, 422, 'observación obligatoria');
  const ok = await tut.post(`/api/tutor/records/${id}/validate`, { observacion: 'Registro claro y completo.' });
  assert.equal(ok.status, 200);
  assert.equal((await tut.post(`/api/tutor/records/${id}/validate`, { observacion: 'Segunda validación' })).status, 409, 'no se valida dos veces');

  const det = (await ana.get(`/api/student/records/${id}`)).json.registro;
  assert.equal(det.estado, 'VALIDADA');
  assert.equal(det.tutor, 'Prof. Laura Martinez'); assert.equal(det.observacion, 'Registro claro y completo.');
  assert.ok(det.fecha_hora_validacion);

  // Verificación directa en PostgreSQL
  const { rows } = await db.query('SELECT count(*)::int n FROM validacion_practica WHERE id_registro = $1', [id]);
  assert.equal(rows[0].n, 1);
});

test('validaciones simultáneas del mismo registro: solo una se registra', async () => {
  const bruno = await login('bruno.estudiante', 'Bruno2026!');
  const t1 = await login('laura.tutor', 'Laura2026!'); const t2 = await login('laura.tutor', 'Laura2026!');
  const { id_registro: id } = (await bruno.post('/api/student/records', { id_planificacion: 7, ...completo })).json;
  await bruno.post(`/api/student/records/${id}/send`);
  const [a, b] = await Promise.all([
    t1.post(`/api/tutor/records/${id}/validate`, { observacion: 'Validación A' }),
    t2.post(`/api/tutor/records/${id}/validate`, { observacion: 'Validación B' }),
  ]);
  assert.deepEqual([a.status, b.status].sort(), [200, 409]);
  const { rows } = await db.query('SELECT count(*)::int n FROM validacion_practica WHERE id_registro = $1', [id]);
  assert.equal(rows[0].n, 1);
});

test('P08 seguimiento (NI-03): filtros, vacío, validación de filtros y reflejo de cambios', async () => {
  const tut = await login('laura.tutor', 'Laura2026!');
  const todos = (await tut.get('/api/tutor/reports/validation')).json;
  assert.ok(todos.registros.length >= 2 && todos.estudiantes.length === 2);
  assert.ok(todos.registros.every((r) => r.estado !== 'BORRADOR'), 'los borradores no aparecen');

  const val = (await tut.get('/api/tutor/reports/validation?estado=VALIDADA')).json.registros;
  assert.ok(val.every((r) => r.estado === 'VALIDADA' && r.tutor && r.fecha_hora_validacion));
  const delEst = (await tut.get('/api/tutor/reports/validation?estudiante=2')).json.registros;
  assert.ok(delEst.length > 0 && delEst.every((r) => r.estudiante === 'Bruno Benitez'));
  const vacio = await tut.get('/api/tutor/reports/validation?desde=2000-01-01&hasta=2000-01-02');
  assert.equal(vacio.json.registros.length, 0);
  for (const q of ['estado=BORRADOR', 'estudiante=abc', 'desde=ayer', 'hasta=2026-02-30']) {
    assert.equal((await tut.get(`/api/tutor/reports/validation?${q}`)).status, 400, q);
  }
  assert.equal((await tut.get(`/api/tutor/reports/validation?estudiante=1%27%20OR%201=1--`)).status, 400);

  // Cambio tras validar: Bruno tiene un ENVIADA sembrado (planificación 6)
  const antes = (await tut.get('/api/tutor/reports/validation?estudiante=2&estado=ENVIADA')).json.registros;
  assert.ok(antes.length >= 1);
  await tut.post(`/api/tutor/records/${antes[0].id_registro}/validate`, { observacion: 'Revisado desde seguimiento.' });
  const despues = (await tut.get('/api/tutor/reports/validation?estudiante=2&estado=ENVIADA')).json.registros;
  assert.equal(despues.length, antes.length - 1);
});

test('cabeceras de seguridad y errores sin detalle técnico', async () => {
  const r = await client().get('/api/auth/me');
  assert.ok(r.headers.get('content-security-policy'));
  assert.equal(r.headers.get('x-powered-by'), null);
  const mal = await fetch(base + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{malformado' });
  assert.equal(mal.status, 400);
  assert.ok(!(await mal.text()).includes('SyntaxError'));
});

test('sesión revocable: una cuenta desactivada pierde el acceso de inmediato', async () => {
  const bruno = await login('bruno.estudiante', 'Bruno2026!');
  assert.equal((await bruno.get('/api/student/records')).status, 200);
  await db.query(`UPDATE usuario SET activo = FALSE WHERE username = 'bruno.estudiante'`);
  try {
    assert.equal((await bruno.get('/api/student/records')).status, 401);
    assert.equal((await client().post('/api/auth/login', { username: 'bruno.estudiante', password: 'Bruno2026!' })).status, 401);
  } finally { await db.query(`UPDATE usuario SET activo = TRUE WHERE username = 'bruno.estudiante'`); }
});

test('límite de intentos de login: el sexto intento fallido recibe 429', async () => {
  const c = client(); let ultimo;
  for (let i = 0; i < 6; i++) ultimo = await c.post('/api/auth/login', { username: 'intruso', password: 'mala' });
  assert.equal(ultimo.status, 429);
});

test('horas: solo múltiplos de 0,5 entre 0,5 y 24', async () => {
  const ana = await login('ana.estudiante', 'Ana2026!');
  for (const h of [0.1, 0.7, 0, -1, 25, 'abc']) {
    assert.equal((await ana.post('/api/student/records', { id_planificacion: 4, horas_realizadas: h })).status, 422, String(h));
  }
});

test('integridad CAM-12-01 en la base: restricciones que la API no puede saltarse', async () => {
  const rechaza = async (sql, params, codigo) => {
    await assert.rejects(db.query(sql, params), (e) => e.code === codigo, `esperaba ${codigo}: ${sql.slice(0, 50)}`);
  };
  // estudiante 2 con planificación 4 (que es de Ana) -> FK compuesta
  await rechaza(`INSERT INTO registro_practica (id_estudiante, id_planificacion) VALUES (2, 4)`, [], '23503');
  // horas fuera de regla (0,7 no es múltiplo de 0,5)
  await rechaza(`INSERT INTO registro_practica (id_estudiante, id_planificacion, horas_realizadas) VALUES (1, 4, 0.7)`, [], '23514');
  // estado inválido
  await rechaza(`UPDATE registro_practica SET estado = 'APROBADA' WHERE id_registro = 1`, [], '23514');
  // enviada sin datos completos
  await rechaza(`INSERT INTO registro_practica (id_estudiante, id_planificacion, estado) VALUES (1, 4, 'ENVIADA')`, [], '23514');
  // validación con planificación distinta a la de su registro
  const { rows } = await db.query(`INSERT INTO registro_practica (id_estudiante, id_planificacion) VALUES (1, 4) RETURNING id_registro`);
  await rechaza(`INSERT INTO validacion_practica (id_planificacion, id_tutor, id_registro) VALUES (7, 1, $1)`, [rows[0].id_registro], '23503');
  // cuenta de ESTUDIANTE sin estudiante asociado / usuario duplicado sin importar mayúsculas
  await rechaza(`INSERT INTO usuario (username, password_hash, rol) VALUES ('x1', 'h', 'ESTUDIANTE')`, [], '23514');
  await rechaza(`INSERT INTO usuario (username, password_hash, rol, id_tutor) VALUES ('LAURA.TUTOR', 'h', 'TUTOR', 1)`, [], '23505');
});
