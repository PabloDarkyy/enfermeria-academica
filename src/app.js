const path = require('path');
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');

const prod = process.env.NODE_ENV === 'production';

function createApp() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) throw new Error('Falta SESSION_SECRET en .env (mínimo 16 caracteres).');

  const app = express();
  app.disable('x-powered-by');
  // CSP: valores por defecto de helmet, pero sin permitir estilos ni fuentes de otros orígenes (la fuente Inter se sirve localmente).
  app.use(helmet({ contentSecurityPolicy: { directives: { ...helmet.contentSecurityPolicy.getDefaultDirectives(), 'style-src': ["'self'", "'unsafe-inline'"], 'font-src': ["'self'"] } } }));
  app.use(express.json({ limit: '50kb' })); // solo JSON: formularios de otros sitios no pueden enviar POST válidos

  // Sesión en memoria: suficiente para v0.1 (al reiniciar el servidor hay que volver a iniciar sesión;
  // los datos del negocio viven en PostgreSQL y no se pierden).
  app.use(session({
    name: 'enf.sid',
    secret,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax', secure: prod, maxAge: 1000 * 60 * 60 * 4 },
  }));

  app.use('/api', (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/student', require('./routes/student'));
  app.use('/api/tutor', require('./routes/tutor'));
  app.use('/api', (req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));

  // Páginas protegidas: solo se sirven al rol correcto (el HTML no contiene datos, pero así no hay pantallas ajenas).
  const rolDe = (req) => req.session.user?.rol;
  const pagina = (archivo, roles) => (req, res) => {
    if (!rolDe(req)) return res.redirect('/');
    if (!roles.includes(rolDe(req))) return res.redirect(rolDe(req) === 'TUTOR' ? '/tutor.html' : '/estudiante.html');
    res.sendFile(path.join(__dirname, '..', 'public', archivo));
  };
  app.get('/estudiante.html', pagina('estudiante.html', ['ESTUDIANTE']));
  app.get('/tutor.html', pagina('tutor.html', ['TUTOR']));
  app.get('/seguimiento.html', pagina('seguimiento.html', ['TUTOR']));

  app.use(express.static(path.join(__dirname, '..', 'public')));

  // Manejo de errores: el detalle técnico queda en el log del servidor, no en el navegador.
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'La solicitud no es válida.' });
    console.error(`[error] ${req.method} ${req.originalUrl}:`, err);
    res.status(500).json({ error: 'Ocurrió un problema inesperado. Inténtalo de nuevo en unos minutos.' });
  });

  return app;
}

module.exports = { createApp };
