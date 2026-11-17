// Genera la demo estática a partir de la interfaz de Express.
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'pages');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const write = (file, content) => fs.writeFileSync(path.join(output, file), content);
fs.cpSync(path.join(root, 'public'), output, { recursive: true });
write('.nojekyll', '');

for (const name of ['index', 'estudiante', 'tutor', 'seguimiento']) {
  const file = name + '.html';
  const html = read('public/' + file)
    .replace(/(href|src)="\//g, '$1="./')
    .replace(/(  <script src="\.\/js\/(auth|app)\.js"><\/script>)/,
      '  <script src="./js/demo-validation.js"></script>\n  <script src="./js/demo-api.js"></script>\n$1');
  write(file, html);
}
for (const name of ['app', 'auth', 'tutor', 'seguimiento']) {
  const file = 'js/' + name + '.js';
  const source = read('public/' + file)
    .replace(/\bfetch\(/g, 'window.demoFetch(')
    .replace(/(["'])\/(assets\/|estudiante\.html|tutor\.html|seguimiento\.html)/g, '$1./$2')
    .replaceAll("location.href = '/'", "location.href = './'");
  write(file, source);
}
write('js/demo-validation.js', 'const DemoValidation = (() => {\n'
  + read('src/validation.js').replace('module.exports =', 'return') + '\n})();\n');
write('js/demo-api.js', read('demo/api.js'));
write('css/app.css', read('public/css/app.css').replaceAll('url("/assets/', 'url("../assets/')
  + '\n.demo-access { margin-top: 1.25rem; display: grid; gap: .5rem; text-align: center; }\n'
  + '.demo-access div { display: flex; flex-wrap: wrap; gap: .5rem; justify-content: center; }\n'
  + '.demo-access p { font-size: .875rem; }\n');
