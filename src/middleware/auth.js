const usuarios = require('../repositories/usuarios');

// La autorización real vive aquí (backend). Ocultar botones en el frontend NO es seguridad.
// En cada petición se revalida en la base que la cuenta siga activa y conserve su rol.
async function sesionVigente(req, res) {
  const u = req.session.user;
  if (!u) { res.status(401).json({ error: 'Debes iniciar sesión para continuar.' }); return false; }
  if (!(await usuarios.sigueVigente(u.id_usuario, u.rol))) {
    await new Promise((r) => req.session.destroy(r));
    res.status(401).json({ error: 'Tu sesión ya no es válida. Inicia sesión nuevamente.' });
    return false;
  }
  return true;
}

const requireAuth = async (req, res, next) => {
  try { if (await sesionVigente(req, res)) next(); } catch (e) { next(e); }
};

const requireRole = (rol) => async (req, res, next) => {
  try {
    if (!(await sesionVigente(req, res))) return;
    if (req.session.user.rol !== rol) return res.status(403).json({ error: 'No tienes permiso para realizar esta acción.' });
    next();
  } catch (e) { next(e); }
};

module.exports = { requireAuth, requireStudent: requireRole('ESTUDIANTE'), requireTutor: requireRole('TUTOR') };
