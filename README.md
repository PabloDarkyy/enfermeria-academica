# Sistema de Prácticas de Enfermería

Prototipo académico v0.1 del Grupo 02 para el TPA12 de Herramientas de Diseño, Ingeniería Informática, Universidad del Norte.

## Demo web

[Abrir la demo en GitHub Pages](https://pablodarkyy.github.io/enfermeria-academica/)

1. Entrá como estudiante, creá una práctica y enviala a revisión.
2. Cerrá sesión, entrá como tutora y validá la práctica con una observación.
3. Volvé a entrar como estudiante para consultar el resultado. Usá el mismo navegador durante todo el recorrido.

La demo usa datos ficticios, simula el inicio de sesión y guarda los cambios en ese navegador. Para repetir el recorrido, elegí **Restablecer demo** en la pantalla de inicio.

## Ejecutar con Node.js y PostgreSQL

Con Node.js 20 o superior y PostgreSQL disponibles:

```sh
npm ci
npm run configurar
npm start
```

Abrí <http://localhost:3000>. En Windows también podés usar `INICIAR_DEMO.bat`. La [guía de instalación](LEEME.md) incluye las cuentas ficticias, el esquema SQL y cómo ejecutar las pruebas. El [guion de presentación](docs/GUIA_DEMO.md) describe el recorrido del TPA12.

## Generar la demo estática

```sh
node scripts/build-pages.js
```

El script genera `pages/` a partir de la interfaz en `public/`. El contenido generado se publica desde la raíz de la rama `gh-pages`.
