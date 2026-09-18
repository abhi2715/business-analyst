const fs = require('fs');
const path = './frontend/src/index.css';
let css = fs.readFileSync(path, 'utf8');

css = css.replace(/#root\s*\{[^}]+\}/, `#root {
  width: 100vw;
  height: 100vh;
  display: flex;
  overflow: hidden;
}`);

css = css.replace(/\.app-container\s*\{[^}]+\}/, `.app-container {
  display: flex;
  flex: 1;
  width: 100%;
  padding: 20px;
  gap: 20px;
  overflow: hidden;
  z-index: 5;
  position: relative;
}`);

fs.writeFileSync(path, css);
