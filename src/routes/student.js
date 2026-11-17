const express = require('express');
const repo = require('../repositories/registros');
const { requireStudent } = require('../middleware/auth');
const { isId, validarRegistro } = require('../validation');

const router = express.Router();
router.use(requireStudent);

// El estudiante SIEMPRE sale de la sesión, nunca del cuerpo ni de la URL.
const yo = (req) => req.session.user.id_estudiante;
const noEncontrado = (res) => res.status(404).json({ error: 'No encontramos ese registro.' });
const invalido = (res, errores) => res.status(422).json({ error: 'Revisa los datos del formulario.', campos: errores });

router.get('/dashboard', async (req, res, next) => {
  try {
    const [resumen, proximas] = await Promise.all([repo.resumenEstudiante(yo(req)), repo.proximasPracticas(yo(req))]);
    res.json({ resumen, proximas });
  } catch (e) { next(e); }
});

router.get('/plannings', async (req, res, next) => {
  try { res.json({ planificaciones: await repo.planificacionesLibres(yo(req)) }); } catch (e) { next(e); }
});

router.get('/records', async (req, res, next) => {
  try { res.json({ registros: await repo.listarDeEstudiante(yo(req)) }); } catch (e) { next(e); }
});

router.get('/records/:id', async (req, res, next) => {
  try {
    if (!isId(req.params.id)) return noEncontrado(res);
    const r = await repo.obtenerDeEstudiante(req.params.id, yo(req));
    if (!r) return noEncontrado(res);
    res.json({ registro: r });
  } catch (e) { next(e); }
});

// Crea un BORRADOR. Para enviarlo se usa POST /records/:id/send.
router.post('/records', async (req, res, next) => {
  try {
    const body = req.body || {};
    const { valores, errores } = validarRegistro(body, { requerirCompleto: false });
    if (body.id_planificacion === undefined) errores.id_planificacion = 'Selecciona la práctica que vas a registrar.';
    if (Object.keys(errores).length) return invalido(res, errores);
    const id = await repo.crear(yo(req), valores);
    if (!id) return invalido(res, { id_planificacion: 'Esa planificación no está disponible para ti.' });
    res.status(201).json({ id_registro: id });
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Ya existe un registro para esa práctica.' });
    next(e);
  }
});

router.put('/records/:id', async (req, res, next) => {
  try {
    if (!isId(req.params.id)) return noEncontrado(res);
    const { valores, errores } = validarRegistro({ ...req.body, id_planificacion: undefined }, { requerirCompleto: false });
    if (Object.keys(errores).length) return invalido(res, errores);
    if (await repo.actualizarBorrador(req.params.id, yo(req), valores)) return res.json({ id_registro: req.params.id });
    const r = await repo.obtenerDeEstudiante(req.params.id, yo(req));
    if (!r) return noEncontrado(res);
    res.status(409).json({ error: 'Este registro ya fue enviado y no se puede modificar.' });
  } catch (e) { next(e); }
});

router.post('/records/:id/send', async (req, res, next) => {
  try {
    if (!isId(req.params.id)) return noEncontrado(res);
    const r = await repo.obtenerDeEstudiante(req.params.id, yo(req));
    if (!r) return noEncontrado(res);
    if (r.estado !== 'BORRADOR') return res.status(409).json({ error: 'Este registro ya fue enviado.' });
    // Al enviar, los datos GUARDADOS deben estar completos.
    const { errores } = validarRegistro(r, { requerirCompleto: true });
    if (Object.keys(errores).length) return invalido(res, errores);
    if (!(await repo.enviar(req.params.id, yo(req)))) return res.status(409).json({ error: 'Este registro ya fue enviado.' });
    res.json({ ok: true, estado: 'ENVIADA' });
  } catch (e) {
    if (e.code === '23514') return res.status(409).json({ error: 'El borrador cambió mientras se enviaba. Revísalo e inténtalo de nuevo.' });
    next(e);
  }
});

module.exports = router;
