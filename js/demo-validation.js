const DemoValidation = (() => {
// Validación del lado servidor. Devuelve { valores, errores } (errores: { campo: mensaje }).
const isId = (v) => /^[1-9]\d{0,17}$/.test(String(v));

function validarRegistro(body, { requerirCompleto }) {
  const errores = {};
  const v = {};

  if (body.id_planificacion !== undefined) {
    if (!isId(body.id_planificacion)) errores.id_planificacion = 'Selecciona una planificación válida.';
    else v.id_planificacion = String(body.id_planificacion);
  }

  const horas = body.horas_realizadas;
  if (horas === undefined || horas === null || horas === '') {
    if (requerirCompleto) errores.horas_realizadas = 'Indica las horas realizadas.';
    v.horas_realizadas = null;
  } else {
    const n = Number(horas);
    if (!Number.isFinite(n) || n < 0.5 || n > 24 || Math.round(n * 2) !== n * 2) {
      errores.horas_realizadas = 'Las horas deben estar entre 0,5 y 24, en múltiplos de 0,5.';
    } else v.horas_realizadas = n;
  }

  const act = typeof body.actividades === 'string' ? body.actividades.trim() : '';
  if (!act) {
    if (requerirCompleto) errores.actividades = 'Describe las actividades realizadas.';
    v.actividades = null;
  } else if (act.length < 10) errores.actividades = 'Describe las actividades con al menos 10 caracteres.';
  else if (act.length > 1500) errores.actividades = 'Las actividades no pueden superar los 1500 caracteres.';
  else v.actividades = act;

  const ref = typeof body.reflexion === 'string' ? body.reflexion.trim() : '';
  if (ref.length > 1500) errores.reflexion = 'La reflexión no puede superar los 1500 caracteres.';
  else v.reflexion = ref || null;

  return { valores: v, errores };
}

function validarObservacion(body) {
  const obs = typeof body.observacion === 'string' ? body.observacion.trim() : '';
  if (obs.length < 5) return { errores: { observacion: 'Escribe una observación de al menos 5 caracteres.' } };
  if (obs.length > 1000) return { errores: { observacion: 'La observación no puede superar los 1000 caracteres.' } };
  return { valores: { observacion: obs }, errores: {} };
}

return { isId, validarRegistro, validarObservacion };

})();
