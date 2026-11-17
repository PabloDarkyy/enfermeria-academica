const express = require('express');
const repo = require('../repositories/registros');
const { requireTutor } = require('../middleware/auth');
const { isId, validarObservacion } = require('../validation');

const router = express.Router();
router.use(requireTutor);

const noEncontrado = (res) => res.status(404).json({ error: 'No encontramos ese registro.' });
const fechaOk = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s)) && new Date(s).toISOString().slice(0, 10) === s;

router.get('/dashboard', async (req, res, next) => {
  try {
    const [resumen, pendientes] = await Promise.all([repo.resumenTutor(req.session.user.id_tutor), repo.pendientes()]);
    res.json({ resumen, pendientes });
  } catch (e) { next(e); }
});

router.get('/records/:id', async (req, res, next) => {
  try {
    if (!isId(req.params.id)) return noEncontrado(res);
    const r = await repo.obtenerParaTutor(req.params.id);
    if (!r) return noEncontrado(res);
    res.json({ registro: r });
  } catch (e) { next(e); }
});

router.post('/records/:id/validate', async (req, res, next) => {
  try {
    if (!isId(req.params.id)) return noEncontrado(res);
    const { valores, errores } = validarObservacion(req.body || {});
    if (Object.keys(errores).length) return res.status(422).json({ error: 'Revisa los datos del formulario.', campos: errores });
    const out = await repo.validar(req.params.id, req.session.user.id_tutor, valores.observacion);
    if (out === 'NO_EXISTE') return noEncontrado(res);
    if (out === 'ESTADO') return res.status(409).json({ error: 'Este registro ya fue validado.' });
    res.json({ ok: true, estado: 'VALIDADA' });
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Este registro ya fue validado.' });
    next(e);
  }
});

// NI-03 Seguimiento de validaciones (consulta informativa M06).
router.get('/reports/validation', async (req, res, next) => {
  try {
    const { estudiante, estado, desde, hasta } = req.query;
    const bad = (campo) => res.status(400).json({ error: `El filtro "${campo}" no es válido.` });
    if (estudiante && !isId(estudiante)) return bad('estudiante');
    if (estado && !['ENVIADA', 'VALIDADA'].includes(estado)) return bad('estado');
    if (desde && !fechaOk(desde)) return bad('desde');
    if (hasta && !fechaOk(hasta)) return bad('hasta');
    const [registros, estudiantes] = await Promise.all([
      repo.seguimiento({ estudiante, estado, desde, hasta }), repo.estudiantes(),
    ]);
    res.json({ registros, estudiantes });
  } catch (e) { next(e); }
});

module.exports = router;
