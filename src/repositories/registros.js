// Todas las consultas son parametrizadas ($1, $2...). Nunca se concatenan valores del usuario.
const db = require('../config/database');

// Consulta base: un registro con su práctica, fecha, lugar y (si existe) la revisión del tutor.
const SELECT_REGISTRO = `
  SELECT r.id_registro, r.estado, r.horas_realizadas, r.actividades, r.reflexion,
         r.fecha_creacion, r.fecha_envio, r.fecha_modificacion,
         p.id_planificacion, p.fecha_vigente AS fecha_practica,
         pr.nombre AS practica,
         e.id_estudiante, e.nombre_referencia AS estudiante,
         lugar.institucion, lugar.servicio,
         v.fecha_hora_validacion, v.observacion, v.resultado,
         t.nombre_referencia AS tutor
    FROM registro_practica r
    JOIN planificacion p ON p.id_planificacion = r.id_planificacion
    JOIN practica pr     ON pr.id_practica = p.id_practica
    JOIN estudiante e    ON e.id_estudiante = r.id_estudiante
    LEFT JOIN LATERAL (
         SELECT i.nombre AS institucion, s.nombre AS servicio
           FROM asignacion a
           JOIN servicio s ON s.id_servicio = a.id_servicio
           JOIN institucion_practica i ON i.id_institucion = s.id_institucion
          WHERE a.id_planificacion = p.id_planificacion
          ORDER BY a.fecha_confirmacion DESC NULLS LAST LIMIT 1) lugar ON TRUE
    LEFT JOIN validacion_practica v ON v.id_registro = r.id_registro
    LEFT JOIN docente_tutor t       ON t.id_tutor = v.id_tutor`;

// ------------------------- ESTUDIANTE -------------------------
async function resumenEstudiante(idEstudiante) {
  const { rows } = await db.query(
    'SELECT estado, count(*)::int AS total FROM registro_practica WHERE id_estudiante = $1 GROUP BY estado',
    [idEstudiante]
  );
  const r = { total: 0, BORRADOR: 0, ENVIADA: 0, VALIDADA: 0 };
  for (const x of rows) { r[x.estado] = x.total; r.total += x.total; }
  return r;
}

// Planificaciones futuras del estudiante, con el registro asociado si ya existe.
async function proximasPracticas(idEstudiante) {
  const { rows } = await db.query(
    `SELECT p.id_planificacion, p.fecha_vigente AS fecha_practica, pr.nombre AS practica,
            lugar.institucion, lugar.servicio, r.id_registro, r.estado
       FROM planificacion p
       JOIN practica pr ON pr.id_practica = p.id_practica
       LEFT JOIN registro_practica r ON r.id_planificacion = p.id_planificacion
       LEFT JOIN LATERAL (
            SELECT i.nombre AS institucion, s.nombre AS servicio
              FROM asignacion a
              JOIN servicio s ON s.id_servicio = a.id_servicio
              JOIN institucion_practica i ON i.id_institucion = s.id_institucion
             WHERE a.id_planificacion = p.id_planificacion
             ORDER BY a.fecha_confirmacion DESC NULLS LAST LIMIT 1) lugar ON TRUE
      WHERE p.id_estudiante = $1 AND p.fecha_vigente >= CURRENT_DATE
      ORDER BY p.fecha_vigente`,
    [idEstudiante]
  );
  return rows;
}

// Planificaciones del estudiante que todavía no tienen registro (opciones del formulario).
async function planificacionesLibres(idEstudiante) {
  const { rows } = await db.query(
    `SELECT p.id_planificacion, p.fecha_vigente AS fecha_practica, pr.nombre AS practica
       FROM planificacion p
       JOIN practica pr ON pr.id_practica = p.id_practica
      WHERE p.id_estudiante = $1
        AND NOT EXISTS (SELECT 1 FROM registro_practica r WHERE r.id_planificacion = p.id_planificacion)
      ORDER BY p.fecha_vigente`,
    [idEstudiante]
  );
  return rows;
}

async function listarDeEstudiante(idEstudiante) {
  const { rows } = await db.query(
    `${SELECT_REGISTRO} WHERE r.id_estudiante = $1 ORDER BY r.fecha_modificacion DESC`,
    [idEstudiante]
  );
  return rows;
}

// El filtro por id_estudiante es la comprobación de pertenencia (ownership).
async function obtenerDeEstudiante(idRegistro, idEstudiante) {
  const { rows } = await db.query(
    `${SELECT_REGISTRO} WHERE r.id_registro = $1 AND r.id_estudiante = $2`,
    [idRegistro, idEstudiante]
  );
  return rows[0] || null;
}

// Devuelve el id nuevo, o null si la planificación no es del estudiante.
// Si ya existe un registro para esa planificación, la restricción UNIQUE lanza el error 23505.
async function crear(idEstudiante, v) {
  const { rows } = await db.query(
    `INSERT INTO registro_practica (id_estudiante, id_planificacion, horas_realizadas, actividades, reflexion)
     SELECT p.id_estudiante, p.id_planificacion, $3, $4, $5
       FROM planificacion p WHERE p.id_planificacion = $1 AND p.id_estudiante = $2
     RETURNING id_registro`,
    [v.id_planificacion, idEstudiante, v.horas_realizadas, v.actividades, v.reflexion]
  );
  return rows[0]?.id_registro || null;
}

// Solo se edita en BORRADOR (el estado va en el WHERE: no hay carrera entre leer y escribir).
async function actualizarBorrador(idRegistro, idEstudiante, v) {
  const { rowCount } = await db.query(
    `UPDATE registro_practica
        SET horas_realizadas = $3, actividades = $4, reflexion = $5, fecha_modificacion = now()
      WHERE id_registro = $1 AND id_estudiante = $2 AND estado = 'BORRADOR'`,
    [idRegistro, idEstudiante, v.horas_realizadas, v.actividades, v.reflexion]
  );
  return rowCount === 1;
}

async function enviar(idRegistro, idEstudiante) {
  const { rowCount } = await db.query(
    `UPDATE registro_practica
        SET estado = 'ENVIADA', fecha_envio = now(), fecha_modificacion = now()
      WHERE id_registro = $1 AND id_estudiante = $2 AND estado = 'BORRADOR'`,
    [idRegistro, idEstudiante]
  );
  return rowCount === 1;
}

// ------------------------- TUTOR -------------------------
async function resumenTutor(idTutor) {
  const { rows } = await db.query(
    `SELECT (SELECT count(*)::int FROM registro_practica WHERE estado = 'ENVIADA') AS pendientes,
            (SELECT count(*)::int FROM validacion_practica
              WHERE id_tutor = $1 AND id_registro IS NOT NULL
                AND fecha_hora_validacion::date = CURRENT_DATE) AS validadas_hoy,
            (SELECT count(*)::int FROM validacion_practica
              WHERE id_tutor = $1 AND id_registro IS NOT NULL) AS total_revisadas`,
    [idTutor]
  );
  return rows[0];
}

async function pendientes() {
  const { rows } = await db.query(
    `${SELECT_REGISTRO} WHERE r.estado = 'ENVIADA' ORDER BY r.fecha_envio`
  );
  return rows;
}

// El tutor nunca ve borradores.
async function obtenerParaTutor(idRegistro) {
  const { rows } = await db.query(
    `${SELECT_REGISTRO} WHERE r.id_registro = $1 AND r.estado IN ('ENVIADA','VALIDADA')`,
    [idRegistro]
  );
  return rows[0] || null;
}

// Validación en una transacción: bloquea la fila, comprueba el estado, inserta la revisión
// y cambia el estado. Resultado: 'OK' | 'NO_EXISTE' | 'ESTADO'.
async function validar(idRegistro, idTutor, observacion) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      'SELECT estado, id_planificacion FROM registro_practica WHERE id_registro = $1 FOR UPDATE',
      [idRegistro]
    );
    if (!rows[0] || rows[0].estado === 'BORRADOR') { await client.query('ROLLBACK'); return 'NO_EXISTE'; }
    if (rows[0].estado !== 'ENVIADA') { await client.query('ROLLBACK'); return 'ESTADO'; }
    await client.query(
      `INSERT INTO validacion_practica (id_planificacion, id_tutor, id_registro, observacion, resultado)
       VALUES ($1, $2, $3, $4, 'VALIDADA')`,
      [rows[0].id_planificacion, idTutor, idRegistro, observacion]
    );
    await client.query(
      `UPDATE registro_practica SET estado = 'VALIDADA', fecha_modificacion = now() WHERE id_registro = $1`,
      [idRegistro]
    );
    await client.query('COMMIT');
    return 'OK';
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

async function estudiantes() {
  const { rows } = await db.query('SELECT id_estudiante, nombre_referencia AS nombre FROM estudiante ORDER BY nombre_referencia');
  return rows;
}

// NI-03 Seguimiento de validaciones. Filtros opcionales; solo registros enviados o validados.
async function seguimiento({ estudiante, estado, desde, hasta }) {
  const cond = [`r.estado IN ('ENVIADA','VALIDADA')`];
  const params = [];
  const add = (sql, val) => { params.push(val); cond.push(sql.replace('?', `$${params.length}`)); };
  if (estudiante) add('r.id_estudiante = ?', estudiante);
  if (estado) add('r.estado = ?', estado);
  if (desde) add('p.fecha_vigente >= ?', desde);
  if (hasta) add('p.fecha_vigente <= ?', hasta);
  const { rows } = await db.query(
    `${SELECT_REGISTRO} WHERE ${cond.join(' AND ')} ORDER BY p.fecha_vigente DESC, r.id_registro DESC`,
    params
  );
  return rows;
}

module.exports = {
  resumenEstudiante, proximasPracticas, planificacionesLibres, listarDeEstudiante, obtenerDeEstudiante,
  crear, actualizarBorrador, enviar,
  resumenTutor, pendientes, obtenerParaTutor, validar, estudiantes, seguimiento,
};
