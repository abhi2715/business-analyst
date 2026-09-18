const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('http://localhost:5173');
  await new Promise(r => setTimeout(r, 2000));
  
  // mock adding a very long message
  await page.evaluate(() => {
    // try to switch to chat view
    const main = document.querySelector('main');
    if(main) {
       document.querySelector('.messages-container').innerHTML += `<div style="height: 3000px; width: 100%; flex-shrink: 0; background: red;">HUGE DIV</div>`;
    }
  });

  await new Promise(r => setTimeout(r, 1000));
  
  // try scrolling
  await page.evaluate(() => {
     document.querySelector('.messages-container').scrollTop = 500;
  });

  await new Promise(r => setTimeout(r, 1000));

  const stats = await page.evaluate(() => {
     return document.querySelector('.messages-container').scrollTop;
  });
  console.log("ScrollTop after manual scroll:", stats);

  await browser.close();
})();
