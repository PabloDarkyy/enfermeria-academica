# Plataforma Académica para la Carrera de Enfermería — v0.1 (TPA12)

**Materia:** Herramientas de Diseño · **Carrera:** Ingeniería Informática · **Universidad del Norte** · **Grupo 02**
**Integrantes:** _[completar nombres del Grupo 02]_

Primera versión funcional (v0.1): acceso con cuentas de estudiante y tutor, registro de prácticas, envío, revisión del tutor con observación, consulta del resultado y seguimiento informativo. Todo se guarda en PostgreSQL. La interfaz fue rediseñada (sistema de diseño propio, barra lateral flotante con efecto vidrio, skeletons, toasts, diseño responsive) sin cambiar las reglas de negocio.

## Versiones utilizadas

| Componente | Versión con la que se desarrolló y probó |
|---|---|
| Node.js | 24.21.0 (se requiere ≥ 20) |
| npm | 11.19.0 |
| PostgreSQL | 17.12 (cualquier 14+ debería funcionar) |
| Dependencias | `express`, `express-session`, `pg`, `bcrypt`, `helmet`, `dotenv` (ver `package.json`) |
| Tipografía e iconos | Inter (variable, licencia OFL, en `public/assets/fonts/`) e iconos SVG en línea estilo Lucide: todo local, sin CDN |

No usa frameworks de frontend, ORM, Docker ni servicios externos.

## Instalación (desde el ZIP)

1. **Requisitos:** Node.js y PostgreSQL instalados y PostgreSQL en ejecución (puerto 5432 por defecto).
2. Descomprimir el ZIP y abrir una terminal en la carpeta del proyecto.
3. Instalar dependencias:
   ```bash
   npm install
   ```
4. Crear el archivo de configuración a partir del ejemplo y editarlo:
   ```bash
   cp .env.example .env        # en Windows PowerShell: Copy-Item .env.example .env
   ```
   Editar `.env`: poner la contraseña de tu usuario de PostgreSQL en `PGPASSWORD` y una cadena larga y aleatoria en `SESSION_SECRET`.
   Ejemplo para generar el secreto: `node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"`
5. Crear la base y cargar los datos ficticios (**no requiere `psql` ni pgAdmin**):
   ```bash
   npm run db:setup
   ```
   Esto crea la base `enfermeria_academica` (si no existe), crea el esquema `enfermeria_g02` y ejecuta en orden `01_schema.sql`, `02_seed.sql` y `03_reset_demo.sql`. Es reproducible y solo toca el esquema `enfermeria_g02`, pero **es destructivo dentro de ese esquema**: `02_seed.sql` vacía sus tablas y las vuelve a cargar. Si la base ya tenía un esquema de una versión anterior, usa `npm run db:setup -- --recreate` (elimina y recrea únicamente `enfermeria_g02`).
6. Verificar (opcional): `npm run db:check` (consulta `SELECT NOW()`, cuenta tablas, FK, cuentas y hashes).
7. Iniciar:
   ```bash
   npm start
   ```
8. Abrir **http://localhost:3000**

> Alternativa con `psql`: `psql -U postgres -c "CREATE DATABASE enfermeria_academica"` y luego `psql -U postgres -d enfermeria_academica -f database/01_schema.sql -f database/02_seed.sql -f database/03_reset_demo.sql`.

## Presentar en otra computadora (Windows)

La otra computadora necesita **Node.js** (LTS, ≥ 20) y **PostgreSQL** (≥ 14) instalados, con PostgreSQL iniciado. No hace falta pgAdmin ni Internet si usaste el ZIP `..._PORTABLE` (ya trae `node_modules`).

1. Descomprime el ZIP en cualquier carpeta.
2. Doble clic en **`INICIAR_DEMO.bat`**. La primera vez te pide la contraseña del usuario `postgres` **de esa computadora** (no se muestra al escribirla), crea el `.env`, crea la base `enfermeria_academica`, carga los datos ficticios, inicia el servidor y abre http://localhost:3000. Las veces siguientes solo inicia.
3. Para dejar los datos como al principio de la demostración: `npm run db:reset`.

Sin el `.bat` (cualquier sistema): `npm install`, `npm run configurar` (asistente que crea `.env` y carga la base) y `npm start`. Si la instalación de PostgreSQL usa otro puerto o usuario, el asistente los pregunta.

## Cuentas demo (ficticias)

| Rol | Usuario | Contraseña | Persona |
|---|---|---|---|
| Estudiante | `ana.estudiante` | `Ana2026!` | Ana Lopez |
| Estudiante | `bruno.estudiante` | `Bruno2026!` | Bruno Benitez |
| Tutor | `laura.tutor` | `Laura2026!` | Prof. Laura Martinez |

Las contraseñas se guardan solo como hash **bcrypt** (`password_hash`). Todos los datos (personas, instituciones, prácticas) son ficticios; no hay pacientes ni datos clínicos.

## Flujo de demostración (TPA12)

1. Ingresar como `ana.estudiante` → **Nueva práctica** → elegir práctica, horas y actividades → **Guardar borrador**.
2. **Enviar práctica** → confirmar el modal → estado **Enviada** (ya no se puede editar).
3. **Cerrar sesión** → ingresar como `laura.tutor` → localizar el registro de Ana en *Revisiones* → **Revisar**.
4. Escribir la **Observación del tutor** → **Registrar validación** → confirmar.
5. **Cerrar sesión** → ingresar como Ana → *Mis prácticas*: el mismo registro figura como **Validada** con tutor, fecha y observación.
6. Como tutor, abrir **Seguimiento de prácticas** (NI-03) y probar los filtros.
7. Detener el servidor (Ctrl+C), volver a ejecutar `npm start` y comprobar que todo sigue ahí (persistencia en PostgreSQL).

Guion completo de 8 minutos: [`docs/GUIA_DEMO.md`](docs/GUIA_DEMO.md).

## Restablecer la demostración

```bash
npm run db:reset
```
Ejecuta `database/03_reset_demo.sql`, que **solo dentro del esquema `enfermeria_g02`**:
1. borra todos los registros de práctica y validaciones;
2. reinicia sus contadores de id;
3. recalcula las fechas de planificación respecto a la fecha actual (hay prácticas pasadas y próximas);
4. reactiva las cuentas demo;
5. carga el estado inicial: Ana sin registros; Bruno con un registro **Enviado** (pendiente) y uno **Validado**.

No borra estudiantes, tutores, prácticas, instituciones ni cuentas, y no toca otras bases ni esquemas.

## Marca, modo claro/oscuro y aviso de prototipo

- **Prototipo académico.** Este sistema es un proyecto de la materia *Herramientas de Diseño* (Grupo 02). **No es una aplicación institucional ni representa un despliegue oficial de la Universidad del Norte.** El aviso «Prototipo académico · Grupo 02» aparece en la barra lateral y en el login.
- **Branding UniNorte.** El logo (Enfermería · UniNorte) es el archivo **proporcionado por el grupo**, guardado sin modificar en `public/assets/branding/uninorte-logo.jpg` (480×480, fondo blanco, sin transparencia). Se muestra siempre completo, sin recolorear ni deformar, sobre una pequeña placa blanca (así se ve igual en modo oscuro). Se usa en el login, la barra lateral y como favicon (el mismo archivo; a 16 px solo se distingue la silueta del escudo; no se creó ninguna variante). Si la Universidad entrega otra versión oficial (p. ej. con transparencia o en blanco), basta con reemplazar ese archivo.
- **Modo claro / oscuro.** Botón sol/luna en la barra superior (y en el login). En la primera visita se respeta la preferencia del sistema operativo (`prefers-color-scheme`); cuando eliges un tema manualmente se respeta tu elección. La preferencia se guarda **solo en tu navegador** (`localStorage`, clave `theme` = `light` | `dark`); no se envía al servidor ni a la base de datos. El tema se aplica antes del primer pintado (`public/js/theme.js`, cargado en `<head>`), por lo que no hay parpadeo. Todo el tema vive en variables CSS (`:root` y `[data-theme="dark"]` en `public/css/app.css`). Para volver a seguir al sistema: `localStorage.removeItem('theme')` en la consola del navegador.

## Interfaz

Vistas: login · inicio del estudiante · Mis prácticas · Nueva práctica / edición de borrador · detalle con línea de tiempo · seguimiento por etapa · panel y revisión del tutor · informe «Seguimiento de prácticas». Diseño responsive (drawer en móvil, tablas apiladas), accesible (foco visible, teclado, `prefers-reduced-motion`). Las capturas de las pruebas P01–P08 están en `docs/evidencias/`.

## Pruebas automatizadas

```bash
npm test
```
Usa una base separada (`enfermeria_academica_test`, se crea sola) y **no modifica los datos de la demostración**. Cubre login, roles (403), ownership, transiciones de estado, doble validación (incluida concurrente) y la consulta de seguimiento con filtros.

## Estructura

```
server.js                 arranque
src/app.js                Express: helmet, sesión, rutas, errores
src/config/database.js    pool de PostgreSQL (consultas parametrizadas)
src/middleware/auth.js    autenticación y roles (backend)
src/routes/               auth.js · student.js · tutor.js
src/repositories/         SQL (usuarios.js · registros.js)
src/validation.js         validación de datos
public/                   HTML + css/app.css (sistema de diseño) + js/ (vanilla)
database/                 01_schema.sql · 02_seed.sql · 03_reset_demo.sql
scripts/db.js             setup / reset / check sin necesitar psql
tests/api.test.js         pruebas de API
docs/                     guía de demostración
```

## API

| Método y ruta | Rol | Descripción |
|---|---|---|
| `POST /api/auth/login` · `POST /api/auth/logout` · `GET /api/auth/me` | — | Sesión |
| `GET /api/student/dashboard` | Estudiante | Contadores y próximas prácticas |
| `GET /api/student/plannings` | Estudiante | Planificaciones sin registro |
| `GET/POST /api/student/records` | Estudiante | Listar / crear borrador |
| `GET/PUT /api/student/records/:id` | Estudiante | Detalle / editar (solo BORRADOR) |
| `POST /api/student/records/:id/send` | Estudiante | Enviar (BORRADOR → ENVIADA) |
| `GET /api/tutor/dashboard` | Tutor | Contadores y pendientes |
| `GET /api/tutor/records/:id` | Tutor | Detalle (solo ENVIADA/VALIDADA) |
| `POST /api/tutor/records/:id/validate` | Tutor | Validar con observación (ENVIADA → VALIDADA) |
| `GET /api/tutor/reports/validation` | Tutor | Seguimiento (NI-03) con filtros `estudiante`, `estado`, `desde`, `hasta` |

## Seguridad aplicada

bcrypt para contraseñas · consultas parametrizadas · sesión HTTP con cookie `httpOnly` + `sameSite=lax` (`secure` en producción) · regeneración de sesión al ingresar · autorización por rol y de pertenencia **en el backend** · `helmet` (CSP) · secretos en `.env` · el hash nunca sale del servidor · errores SQL solo en el log del servidor · API solo acepta JSON (mitiga CSRF junto con `sameSite`).

## Supuestos provisionales de v0.1 (no son acuerdos institucionales)

- **Estados `BORRADOR → ENVIADA → VALIDADA`:** supuesto técnico provisional para v0.1 requerido por TPA12. Se evitó `APROBADA/REPROBADA`: una validación **no es una nota**, ni una aprobación, ni afirma que se cumplieron todos los criterios; solo indica que el tutor realizó la revisión prevista por el sistema.
- Un registro por planificación (restricción `UNIQUE`).
- El modelo no relaciona tutor con estudiante: en v0.1 cualquier tutor activo puede validar cualquier registro `ENVIADA`.
- Datos del registro (horas, actividades, reflexión) son una propuesta mínima, sin información clínica.
- El tutor no ve borradores.
- La validación exige una observación (mín. 5 caracteres).

## Limitaciones conocidas

- La sesión HTTP se guarda en memoria: al reiniciar el servidor hay que volver a iniciar sesión (los datos en PostgreSQL no se pierden).
- El límite de intentos de login (5 fallidos por IP+usuario cada 15 min) está en memoria; no hay recuperación de contraseña ni administración de usuarios (las cuentas se crean por SQL).
- Las transiciones de estado se garantizan por la API y por restricciones CHECK/FK, no por triggers: un SQL manual podría saltarse el orden.
- El texto libre del registro no se analiza automáticamente en busca de datos de pacientes (solo hay una advertencia visible).
- Una validación no se puede revertir ni devolver al estudiante con observaciones para corregir.
- Sin paginación en listados (suficiente para el volumen de v0.1).
- Las horas se muestran en la zona horaria del navegador; la base usa `TIMESTAMP` sin zona, asumiendo servidor y base en la misma zona.
- Probado en Windows 11 con Microsoft Edge (Chromium); no probado en Safari/Firefox. Modo oscuro verificado visualmente en Chromium (Edge) en escritorio y móvil.
