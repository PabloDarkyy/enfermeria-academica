# Guía de demostración (máx. 8 minutos)

**Preparación (antes de la defensa):**
```bash
npm run db:reset      # estado conocido: Ana sin registros; Bruno con 1 Enviado y 1 Validado
npm start             # http://localhost:3000
```
Tener dos ventanas del navegador: una normal y otra privada (para el intento no autorizado). Terminal visible para reiniciar el servidor.

| # | Min | Acción | Qué decir / qué se ve |
|---|---|---|---|
| 1 | 0:00 | Explicar v0.1 | Plataforma web: Node + Express + PostgreSQL, HTML/CSS/JS vanilla. Recorrido obligatorio estudiante → tutor → estudiante con persistencia real. Cambio de modelo **CAM-12-01**. |
| 2 | 0:45 | Login estudiante `ana.estudiante` / `Ana2026!` | Primero probar una contraseña incorrecta: mensaje "No pudimos iniciar sesión. Revisa tus credenciales." Dashboard con contadores en 0 y *Próximas prácticas* leídas de PostgreSQL. |
| 3 | 1:30 | **Nueva práctica** (botón *Registrar* de una próxima práctica) | El estudiante y la fecha no se vuelven a escribir: salen de la sesión y de la planificación. |
| 4 | 2:00 | Mostrar validación (P04): **Enviar práctica** con campos vacíos | Errores por campo, nada se guarda. |
| 5 | 2:20 | Completar horas y actividades → **Guardar borrador** | Detalle con timeline solo con "Creada"; estado *Borrador*. |
| 6 | 2:50 | **Editar borrador** → **Enviar práctica** | Modal "¿Enviar esta práctica al tutor?"; toast; estado *Enviada*; ya no hay botón de edición (protegido). |
| 7 | 3:30 | **Cerrar sesión** | |
| 8 | 3:40 | Login tutor `laura.tutor` / `Laura2026!` | Dashboard: Pendientes = 2 (Bruno y Ana). |
| 9 | 4:00 | Localizar el registro de **Ana Lopez** → **Revisar** | Datos registrados y fecha de envío. |
| 10 | 4:20 | Escribir **Observación del tutor** → **Registrar validación** → confirmar | Modal: "Esta acción no representa una calificación académica." Toast; estado *Validada*. Se guarda en `validacion_practica` (transacción). |
| 11 | 5:00 | **Cerrar sesión** y volver a entrar como `ana.estudiante` | |
| 12 | 5:20 | Abrir **Mis prácticas** → el mismo registro | *Validada*, con tutor, fecha y observación; timeline con 3 eventos reales. |
| 13 | 5:50 | Login tutor → **Seguimiento de prácticas** (NI-03) | Consulta informativa M06 con datos reales: estudiante, práctica, fecha, estado, tutor, fecha de validación. |
| 14 | 6:20 | Cambiar filtros: estudiante = Bruno; estado = Enviada; fechas de 2000 | Resultado normal, luego estado vacío "No encontramos registros con los filtros seleccionados." + **Limpiar filtros**. |
| 15 | 6:50 | Terminal: Ctrl+C y `npm start` | Reiniciar el servidor. |
| 16 | 7:10 | Volver a iniciar sesión y abrir Seguimiento / el registro de Ana | Todo sigue: persistencia en PostgreSQL (la sesión sí se reinicia; es memoria). |
| 17 | 7:30 | Acceso no autorizado | Con la sesión de Ana abrir `http://localhost:3000/api/tutor/dashboard` → **403** "No tienes permiso para realizar esta acción". Con la de Bruno abrir un registro de Ana por URL (`#/practicas/<id de Ana>`) → "No encontramos ese registro". |

## Extra (30 s): modo oscuro
Pulsa el botón sol/luna de la barra superior (o del login): el tema cambia con una transición breve y se recuerda en el navegador (`localStorage`). Si el sistema operativo está en oscuro, la primera visita ya abre en oscuro.

## Comprobación en la base (opcional, 30 s)
```bash
psql -U postgres -d enfermeria_academica -c "SELECT r.id_registro, r.estado, v.id_tutor, v.observacion FROM enfermeria_g02.registro_practica r LEFT JOIN enfermeria_g02.validacion_practica v USING (id_registro) ORDER BY 1"
```

## Posibles preguntas del profesor
- **¿Por qué no "Aprobada"?** No hay evidencia institucional de que la validación sea una calificación; ver supuesto provisional en `LEEME.md`.
- **¿Dónde se impone la seguridad?** En el backend (`src/middleware/auth.js` y filtros `id_estudiante` en el SQL), no en el frontend.
- **¿Qué evita validar dos veces?** `UNIQUE(id_registro)` en `validacion_practica` y bloqueo `FOR UPDATE` en la transacción.
- **¿Qué cambió del modelo?** CAM-12-01: tablas `usuario`, `registro_practica` y columnas `id_registro`, `observacion`, `resultado` en `validacion_practica`.
- **Si algo falla en vivo:** `npm run db:reset` y repetir.
