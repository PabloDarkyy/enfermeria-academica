// Asistente de primera configuración en una computadora nueva:  npm run configurar
//   1) pide los datos de PostgreSQL de ESTA computadora (la contraseña no se muestra),
//   2) escribe el archivo .env (con un SESSION_SECRET aleatorio),
//   3) comprueba la conexión y carga la base de demostración (npm run db:setup).
// También acepta variables de entorno (PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE) para no preguntar.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

const envPath = path.join(__dirname, '..', '.env');

function ask(pregunta, { porDefecto = '', oculto = false } = {}) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (oculto) { // no repetir en pantalla lo que se escribe
      rl._writeToOutput = (s) => { if (s.includes(pregunta)) process.stdout.write(s); };
    }
    let respondido = false;
    rl.on('close', () => { if (!respondido) { console.error('\nNo hay entrada de teclado disponible; se cancela la configuración.'); process.exit(1); } });
    rl.question(`${pregunta}${porDefecto && !oculto ? ` [${porDefecto}]` : ''}: `, (r) => {
      respondido = true; rl.close(); if (oculto) process.stdout.write('\n');
      resolve(r.trim() || porDefecto);
    });
  });
}

(async () => {
  console.log('\nConfiguración de Enfermería Académica (v0.1)\n');
  if (fs.existsSync(envPath) && process.argv[2] !== '--forzar') {
    console.log('Ya existe un archivo .env. Para rehacerlo ejecuta: npm run configurar -- --forzar');
    return;
  }
  const e = process.env;
  const cfg = {
    PGHOST: e.PGHOST || await ask('Servidor de PostgreSQL', { porDefecto: 'localhost' }),
    PGPORT: e.PGPORT || await ask('Puerto', { porDefecto: '5432' }),
    PGUSER: e.PGUSER || await ask('Usuario de PostgreSQL', { porDefecto: 'postgres' }),
    PGPASSWORD: e.PGPASSWORD || await ask('Contraseña de ese usuario (no se muestra)', { oculto: true }),
    PGDATABASE: e.PGDATABASE || 'enfermeria_academica',
  };
  if (!cfg.PGPASSWORD) { console.error('La contraseña no puede estar vacía.'); process.exit(1); }

  // Las comillas protegen contraseñas con espacios o # (dotenv las interpreta).
  const q = (v) => (/[\s#"'\\]/.test(v) ? `"${v.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"` : v);
  const contenido = [
    'PORT=' + (e.PORT || '3000'),
    'SESSION_SECRET=' + crypto.randomBytes(24).toString('hex'),
    ...Object.entries(cfg).map(([k, v]) => `${k}=${q(v)}`),
    '',
  ].join('\n');
  fs.writeFileSync(envPath, contenido);
  console.log('\n.env creado.');

  // Cargar variables y preparar la base
  Object.assign(process.env, cfg);
  require('dotenv').config({ path: envPath, override: true, quiet: true });
  const { setup } = require('./db');
  try {
    await setup();
    console.log('\nListo. Inicia con: npm start   →   http://localhost:' + (e.PORT || '3000'));
  } catch (err) {
    console.error('\nNo se pudo preparar la base: ' + err.message);
    console.error('Comprueba que PostgreSQL esté iniciado y que el usuario/contraseña sean correctos; luego repite: npm run configurar -- --forzar');
    process.exit(1);
  }
})();
