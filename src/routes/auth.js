const express = require('express');
const bcrypt = require('bcrypt');
const usuarios = require('../repositories/usuarios');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Hash de relleno: se compara igual aunque el usuario no exista (evita revelar qué usuarios existen por tiempo de respuesta).
const HASH_FALSO = bcrypt.hashSync('relleno-no-valido', 10);

// Límite de intentos fallidos por IP + usuario. shortcut: en memoria (se pierde al reiniciar y no sirve con varios procesos), migrar a tabla/Redis si se despliega.
const MAX_INTENTOS = 5, VENTANA_MS = 15 * 60 * 1000;
const fallos = new Map();
const clave = (req, u) => `${req.ip}|${String(u).toLowerCase()}`;
const bloqueado = (k) => { const f = fallos.get(k); if (f && Date.now() - f.desde > VENTANA_MS) fallos.delete(k); return (fallos.get(k)?.n || 0) >= MAX_INTENTOS; };
const registrarFallo = (k) => { const f = fallos.get(k) || { n: 0, desde: Date.now() }; f.n++; fallos.set(k, f); };

const publico = (u) => ({ id_usuario: u.id_usuario, username: u.username, rol: u.rol, nombre: u.nombre });

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    if (typeof username !== 'string' || typeof password !== 'string' || !username.trim() || !password || password.length > 200) {
      return res.status(400).json({ error: 'Ingresa tu usuario y tu contraseña.' });
    }
    const k = clave(req, username.trim());
    if (bloqueado(k)) return res.status(429).json({ error: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.' });
    const u = await usuarios.buscarPorUsername(username.trim());
    const ok = await bcrypt.compare(password, u ? u.password_hash : HASH_FALSO);
    if (!u || !ok) { registrarFallo(k); return res.status(401).json({ error: 'No pudimos iniciar sesión. Revisa tus credenciales.' }); }
    fallos.delete(k);

    // Se regenera la sesión al iniciar (evita fijación de sesión).
    req.session.regenerate((err) => {
      if (err) return next(err);
      req.session.user = { id_usuario: u.id_usuario, username: u.username, rol: u.rol, nombre: u.nombre,
                           id_estudiante: u.id_estudiante, id_tutor: u.id_tutor };
      res.json({ user: publico(u), destino: u.rol === 'TUTOR' ? '/tutor.html' : '/estudiante.html' });
    });
  } catch (e) { next(e); }
});

router.post('/logout', (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie('enf.sid');
    res.json({ ok: true });
  });
});

router.get('/me', requireAuth, (req, res) => res.json({ user: publico(req.session.user) }));

module.exports = router;
