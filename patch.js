const fs = require('fs');
const path = './frontend/src/index.css';
let css = fs.readFileSync(path, 'utf8');

css = css.replace('html, body {', 'html, body {\n  position: fixed;\n  inset: 0;\n  width: 100vw;\n  height: 100vh;');

fs.writeFileSync(path, css);
