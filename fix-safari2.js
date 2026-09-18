const fs = require('fs');
const path = './frontend/src/index.css';
let css = fs.readFileSync(path, 'utf8');

css = css.replace(/\.sidebar\s*\{[^}]+\}/, `.sidebar {
  width: 280px;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 24px;
  gap: 16px;
  z-index: 10;
  position: relative;
  flex-shrink: 0;
}`);

css = css.replace(/\.main-chat\s*\{[^}]+\}/, `.main-chat {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 10;
  min-height: 0;
  overflow: hidden;
  margin-right: -20px;
  padding-right: 0;
}`);

fs.writeFileSync(path, css);
