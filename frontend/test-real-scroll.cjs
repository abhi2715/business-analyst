const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('http://localhost:5173');
  
  // wait for react to render
  await new Promise(r => setTimeout(r, 3000));
  
  // click "Upload New File" to bypass to chat if needed?
  // Actually, we can just inject a HUGE div into messages-container
  await page.evaluate(() => {
    const mc = document.querySelector('.messages-container');
    if (mc) {
       mc.innerHTML += `<div style="height: 3000px; width: 100%; flex-shrink: 0; background: red;">HUGE DIV</div>`;
    }
  });

  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({path: 'screenshot-real.png'});

  const stats = await page.evaluate(() => {
    const getStats = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const computed = window.getComputedStyle(el);
      return {
        clientHeight: el.clientHeight,
        scrollHeight: el.scrollHeight,
        flexShrink: computed.flexShrink,
        minHeight: computed.minHeight,
      }
    };
    return {
      messagesContainer: getStats('.messages-container'),
      mainChat: getStats('.main-chat'),
      appContainer: getStats('.app-container')
    };
  });
  console.log(JSON.stringify(stats, null, 2));
  await browser.close();
})();
