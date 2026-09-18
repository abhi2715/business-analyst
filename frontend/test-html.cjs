const puppeteer = require('puppeteer');
const fs = require('fs');

const css = fs.readFileSync('src/index.css', 'utf8');

const html = `
<!DOCTYPE html>
<html>
<head>
<style>${css}</style>
</head>
<body>
  <div id="root">
    <div class="app-container">
      <aside class="sidebar glass">
        <div style="flex:1"></div>
        <button>Clear</button>
      </aside>
      <main class="main-chat">
        <div class="messages-container"></div>
        <div class="input-container glass">Input</div>
      </main>
    </div>
  </div>
</body>
</html>
`;
fs.writeFileSync('test.html', html);

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1000 });
  await page.goto('file://' + __dirname + '/test.html');
  await new Promise(r => setTimeout(r, 1000));
  
  const stats = await page.evaluate(() => {
    return {
      bodyHeight: document.body.clientHeight,
      rootHeight: document.getElementById('root').clientHeight,
      appHeight: document.querySelector('.app-container').clientHeight,
      sidebarHeight: document.querySelector('.sidebar').clientHeight,
      mainChatHeight: document.querySelector('.main-chat').clientHeight
    };
  });
  console.log(JSON.stringify(stats, null, 2));
  await browser.close();
})();
