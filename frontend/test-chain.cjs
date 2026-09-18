const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(`
    <style>
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      html, body { width: 100%; height: 100%; overflow: hidden; }
      #root { width: 100%; height: 100%; overflow: hidden; display: block; }
      .app-container { display: flex; height: 100%; width: 100%; padding: 20px; overflow: hidden; }
      .main-chat { flex: 1; display: flex; flex-direction: column; min-height: 0; overflow: hidden; }
      .messages-container { flex: 1 1 0%; min-height: 0; overflow-y: scroll; padding: 24px; }
      .message-bubble { padding: 16px; margin-bottom: 12px; background: #eee; }
      .input-container { padding: 16px; height: 60px; background: #ddd; }
    </style>
    <div id="root">
      <div class="app-container">
        <div class="main-chat">
          <div class="messages-container">
            <div class="message-bubble">Top</div>
            <div class="message-bubble" style="height: 3000px;">Huge Message</div>
            <div class="message-bubble">Bottom</div>
          </div>
          <div class="input-container">Input</div>
        </div>
      </div>
    </div>
  `);
  const stats = await page.evaluate(() => {
    return {
      messagesContainer: {
        clientHeight: document.querySelector('.messages-container').clientHeight,
        scrollHeight: document.querySelector('.messages-container').scrollHeight
      },
      mainChat: {
        clientHeight: document.querySelector('.main-chat').clientHeight,
        scrollHeight: document.querySelector('.main-chat').scrollHeight
      }
    };
  });
  console.log(JSON.stringify(stats, null, 2));
  await browser.close();
})();
