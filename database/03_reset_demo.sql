-- =====================================================================
-- 03_reset_demo.sql · Restaura el estado conocido de la demostración
-- Qué hace (solo esquema enfermeria_g02, no toca otras bases/esquemas):
--   1. Borra TODOS los registros de práctica y validaciones (datos de demo).
--   2. Reinicia sus contadores de id.
--   3. Recalcula las fechas de planificación respecto a la fecha actual.
--   4. Reactiva las cuentas demo.
--   5. Carga el estado inicial: Ana sin registros; Bruno con un registro
--      ENVIADO (pendiente de revisión) y uno VALIDADO (para el seguimiento).
-- NO borra estudiantes, tutores, prácticas, instituciones ni cuentas.
-- =====================================================================
SET search_path TO enfermeria_g02;

BEGIN;

TRUNCATE validacion_practica, registro_practica RESTART IDENTITY;

UPDATE planificacion SET fecha_vigente = CURRENT_DATE + CASE id_planificacion
  WHEN 1 THEN -14 WHEN 2 THEN -7 WHEN 3 THEN 5 WHEN 4 THEN 12
  WHEN 5 THEN -14 WHEN 6 THEN -7 WHEN 7 THEN 6 END;

UPDATE usuario SET activo = TRUE;

-- Bruno: registro validado (práctica del pasado) ...
INSERT INTO registro_practica
  (id_estudiante, id_planificacion, horas_realizadas, actividades, reflexion, estado,
   fecha_creacion, fecha_envio, fecha_modificacion)
VALUES
  (2, 5, 6.0,
   'Observación de la rutina del servicio, apoyo en toma de signos vitales y registro de actividades supervisadas.',
   'Aprendí la importancia de la comunicación con el equipo.',
   'VALIDADA', now() - interval '5 days', now() - interval '4 days', now() - interval '2 days');

INSERT INTO validacion_practica (id_planificacion, id_tutor, id_registro, observacion, fecha_hora_validacion)
VALUES (5, 1, 1, 'Registro completo y claro. Continuar con el mismo nivel de detalle.', now() - interval '2 days');

-- ... y un registro ENVIADO pendiente de revisión.
INSERT INTO registro_practica
  (id_estudiante, id_planificacion, horas_realizadas, actividades, reflexion, estado,
   fecha_creacion, fecha_envio, fecha_modificacion)
VALUES
  (2, 6, 5.5,
   'Participación en jornada de educación para la salud en la comunidad: armado de material y orientación a familias.',
   NULL,
   'ENVIADA', now() - interval '1 day', now() - interval '20 hours', now() - interval '20 hours');

COMMIT;
