const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('http://localhost:5173');
  await new Promise(r => setTimeout(r, 2000));
  await page.evaluate(() => {
    document.body.innerHTML = `
      <style>
        .messages-container > * { flex-shrink: 0; }
      </style>
      <div id="root">
        <div class="app-container">
          <main class="main-chat">
            <div class="messages-container">
               <div id="child" style="height: 3000px;">HUGE CONTENT</div>
            </div>
          </main>
        </div>
      </div>
    `;
  });
  const stats = await page.evaluate(() => {
    return {
      messagesContainer: {
        clientHeight: document.querySelector('.messages-container').clientHeight,
        scrollHeight: document.querySelector('.messages-container').scrollHeight
      },
      child: {
        clientHeight: document.getElementById('child').clientHeight,
        scrollHeight: document.getElementById('child').scrollHeight
      }
    };
  });
  console.log(JSON.stringify(stats, null, 2));
  await browser.close();
})();
