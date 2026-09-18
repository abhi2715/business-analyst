const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1000 });
  await page.goto('http://localhost:5173');
  await new Promise(r => setTimeout(r, 2000));
  
  const stats = await page.evaluate(() => {
    return {
      viewport: { height: window.innerHeight },
      body: { height: document.body.clientHeight },
      root: { height: document.getElementById('root')?.clientHeight },
      appContainer: { height: document.querySelector('.app-container')?.clientHeight },
      sidebar: { height: document.querySelector('.sidebar')?.clientHeight },
      mainChat: { height: document.querySelector('.main-chat')?.clientHeight },
      messagesContainer: { height: document.querySelector('.messages-container')?.clientHeight },
    };
  });
  console.log(JSON.stringify(stats, null, 2));
  await browser.close();
})();
