require('dotenv').config({ quiet: true });
const db = require('./src/config/database');
const { createApp } = require('./src/app');

const port = Number(process.env.PORT || 3000);

(async () => {
  try {
    await db.query('SELECT 1 FROM usuario LIMIT 1'); // falla pronto si la BD no está lista
  } catch (e) {
    console.error('No se pudo conectar a PostgreSQL o falta cargar la base. Revisa .env y ejecuta "npm run db:setup".');
    console.error(e.message);
    process.exit(1);
  }
  const server = createApp().listen(port, () => console.log(`Enfermería Académica v0.1 en http://localhost:${port}`));
  const cerrar = () => server.close(() => db.end().then(() => process.exit(0)));
  process.on('SIGINT', cerrar);
  process.on('SIGTERM', cerrar);
})();
