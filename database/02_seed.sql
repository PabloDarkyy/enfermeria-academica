-- =====================================================================
-- 02_seed.sql · Datos maestros FICTICIOS + cuentas demo
-- Inicializa SOLO las tablas del esquema enfermeria_g02 (TRUNCATE).
-- Los hashes bcrypt corresponden a contraseñas ficticias (ver LEEME.md).
-- Datos de práctica (registros/validaciones) se cargan en 03_reset_demo.sql.
-- =====================================================================
SET search_path TO enfermeria_g02;

TRUNCATE validacion_practica, registro_practica, usuario, asignacion, planificacion,
         servicio, institucion_practica, docente_tutor, practica, estudiante
         RESTART IDENTITY CASCADE;

INSERT INTO estudiante (id_estudiante, nombre_referencia) VALUES
  (1, 'Ana Lopez'),
  (2, 'Bruno Benitez');

INSERT INTO docente_tutor (id_tutor, nombre_referencia) VALUES
  (1, 'Prof. Laura Martinez');

INSERT INTO practica (id_practica, nombre) VALUES
  (1, 'Fundamentos de Enfermería - Práctica I'),
  (2, 'Enfermería Comunitaria - Práctica II'),
  (3, 'Enfermería del Adulto - Práctica III'),
  (4, 'Enfermería Materno Infantil - Práctica IV');

INSERT INTO institucion_practica (id_institucion, nombre) VALUES
  (1, 'Hospital Escuela Ficticio del Norte'),
  (2, 'Centro de Salud Familiar Ficticio San Martín');

INSERT INTO servicio (id_servicio, id_institucion, nombre) VALUES
  (1, 1, 'Clínica Médica'),
  (2, 1, 'Pediatría'),
  (3, 2, 'Atención Primaria'),
  (4, 2, 'Control Prenatal');

-- Las fechas reales se (re)calculan en 03_reset_demo.sql respecto a la fecha actual.
INSERT INTO planificacion (id_planificacion, id_estudiante, id_practica, fecha_vigente) VALUES
  (1, 1, 1, CURRENT_DATE - 14),
  (2, 1, 2, CURRENT_DATE - 7),
  (3, 1, 3, CURRENT_DATE + 5),
  (4, 1, 4, CURRENT_DATE + 12),
  (5, 2, 1, CURRENT_DATE - 14),
  (6, 2, 2, CURRENT_DATE - 7),
  (7, 2, 3, CURRENT_DATE + 6);

INSERT INTO asignacion (id_asignacion, id_planificacion, id_servicio, fecha_confirmacion) VALUES
  (1, 1, 1, CURRENT_DATE - 30),
  (2, 2, 3, CURRENT_DATE - 30),
  (3, 3, 1, CURRENT_DATE - 20),
  (4, 4, 4, CURRENT_DATE - 20),
  (5, 5, 2, CURRENT_DATE - 30),
  (6, 6, 3, CURRENT_DATE - 30),
  (7, 7, 1, CURRENT_DATE - 20);

-- Cuentas demo (contraseñas ficticias documentadas en LEEME.md; solo se guarda el hash bcrypt).
INSERT INTO usuario (username, password_hash, rol, id_estudiante, id_tutor) VALUES
  ('ana.estudiante',   '$2b$10$d4MtxDdyRNBTa8vzEG9lgOUitU.i4ipjnHrZCxER1tUrZJlgqAhcq', 'ESTUDIANTE', 1, NULL),
  ('bruno.estudiante', '$2b$10$jxgleDvmtqKKuNZ77H4u7Ov0R9IYMMM8cr7Qp9BAFSdOGxoK3PuHa', 'ESTUDIANTE', 2, NULL),
  ('laura.tutor',      '$2b$10$su.ul1y6DgSu4KGu/X4EhOWHzMXe7BoqEav9Oe2CPCd3LkQoGNR6m', 'TUTOR',      NULL, 1);
