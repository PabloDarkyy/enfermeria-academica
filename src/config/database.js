require('dotenv').config({ quiet: true });
const { Pool, types } = require('pg');

// Las columnas DATE se devuelven como texto 'AAAA-MM-DD' (evita corrimientos de zona horaria).
types.setTypeParser(1082, (v) => v);

// Un solo pool para toda la app. Todas las consultas usan el esquema enfermeria_g02.
const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE || 'enfermeria_academica',
  options: '-c search_path=enfermeria_g02',
});

pool.on('error', (e) => console.error('[pg] error en conexión inactiva:', e.message));

module.exports = pool;
