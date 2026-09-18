const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  await page.goto('http://localhost:5173');
  
  // wait for load
  await new Promise(r => setTimeout(r, 2000));
  
  await page.screenshot({path: 'screenshot_initial.png'});
  
  // mock adding a very long message
  await page.evaluate(() => {
    const chatBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Back to Dashboard'));
    if (!chatBtn) {
       // if we are in home view, let's just trigger a huge text in the dom to test if it scrolls
    }
  });

  await browser.close();
})();
