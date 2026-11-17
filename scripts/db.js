// Inicializa la base sin necesitar psql:
//   node scripts/db.js setup [--recreate] -> crea la BD si no existe + 01_schema + 02_seed + 03_reset_demo
//                                (--recreate elimina antes el esquema enfermeria_g02 de esa base)
//   node scripts/db.js reset   -> solo 03_reset_demo.sql
//   node scripts/db.js check   -> comprobaciones iniciales (tablas, FK, cuentas, hashes)
require('dotenv').config({ quiet: true });
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const dir = path.join(__dirname, '..', 'database');
const sql = (f) => fs.readFileSync(path.join(dir, f), 'utf8');

function conn(database) {
  return {
    host: process.env.PGHOST || 'localhost',
    port: Number(process.env.PGPORT || 5432),
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD,
    database,
  };
}

async function run(database, files) {
  const c = new Client(conn(database));
  await c.connect();
  try {
    for (const f of files) {
      await c.query(sql(f));
      console.log(`  ok  ${f}`);
    }
  } finally {
    await c.end();
  }
}

// recreate: borra SOLO el esquema enfermeria_g02 de esa base antes de crearlo de nuevo.
async function setup(dbName = process.env.PGDATABASE || 'enfermeria_academica', { recreate = false } = {}) {
  if (!/^[a-z_][a-z0-9_]*$/.test(dbName)) throw new Error('Nombre de base inválido');
  const admin = new Client(conn('postgres'));
  await admin.connect();
  const { rowCount } = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
  if (!rowCount) {
    await admin.query(`CREATE DATABASE ${dbName}`); // el nombre ya fue validado arriba
    console.log(`  ok  base ${dbName} creada`);
  } else {
    console.log(`  ..  base ${dbName} ya existe (se reutiliza solo el esquema enfermeria_g02)`);
  }
  await admin.end();
  if (recreate) {
    const c = new Client(conn(dbName));
    await c.connect();
    await c.query('DROP SCHEMA IF EXISTS enfermeria_g02 CASCADE');
    await c.end();
    console.log('  ok  esquema enfermeria_g02 eliminado para recrearlo');
  }
  await run(dbName, ['01_schema.sql', '02_seed.sql', '03_reset_demo.sql']);
}

async function reset(dbName = process.env.PGDATABASE || 'enfermeria_academica') {
  await run(dbName, ['03_reset_demo.sql']);
}

async function check(dbName = process.env.PGDATABASE || 'enfermeria_academica') {
  const c = new Client(conn(dbName));
  await c.connect();
  const one = async (q) => (await c.query(q)).rows[0];
  console.log('SELECT NOW():', (await one('SELECT NOW() AS now')).now);
  console.log('tablas:', (await one(`SELECT count(*) FROM information_schema.tables WHERE table_schema='enfermeria_g02'`)).count);
  console.log('FK:', (await one(`SELECT count(*) FROM information_schema.table_constraints WHERE constraint_schema='enfermeria_g02' AND constraint_type='FOREIGN KEY'`)).count);
  console.log('estudiantes:', (await one('SELECT count(*) FROM enfermeria_g02.estudiante')).count);
  console.log('tutores:', (await one('SELECT count(*) FROM enfermeria_g02.docente_tutor')).count);
  console.log('cuentas:', (await one('SELECT count(*) FROM enfermeria_g02.usuario')).count);
  console.log('hashes bcrypt:', (await one(`SELECT count(*) FROM enfermeria_g02.usuario WHERE password_hash ~ '^\\$2[aby]\\$'`)).count);
  await c.end();
}

module.exports = { setup, reset, check };

if (require.main === module) {
  const cmd = process.argv[2];
  const fn = { setup: () => setup(undefined, { recreate: process.argv.includes('--recreate') }), reset, check }[cmd];
  if (!fn) { console.error('Uso: node scripts/db.js setup|reset|check'); process.exit(1); }
  fn().catch((e) => { console.error('Error:', e.message); process.exit(1); });
}
