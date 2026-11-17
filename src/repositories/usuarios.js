const db = require('../config/database');

// Devuelve la cuenta activa con el nombre de la persona asociada (incluye password_hash: solo uso interno).
async function buscarPorUsername(username) {
  const { rows } = await db.query(
    `SELECT u.id_usuario, u.username, u.password_hash, u.rol, u.id_estudiante, u.id_tutor,
            COALESCE(e.nombre_referencia, t.nombre_referencia) AS nombre
       FROM usuario u
       LEFT JOIN estudiante e ON e.id_estudiante = u.id_estudiante
       LEFT JOIN docente_tutor t ON t.id_tutor = u.id_tutor
      WHERE lower(u.username) = lower($1) AND u.activo`,
    [username]
  );
  return rows[0] || null;
}

// Para revalidar la sesión en cada petición: ¿sigue activa la cuenta y con el mismo rol?
async function sigueVigente(idUsuario, rol) {
  const { rowCount } = await db.query('SELECT 1 FROM usuario WHERE id_usuario = $1 AND activo AND rol = $2', [idUsuario, rol]);
  return rowCount === 1;
}

module.exports = { buscarPorUsername, sigueVigente };
