const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1000 });
  await page.goto('http://localhost:5173');
  await new Promise(r => setTimeout(r, 2000));
  
  // switch to chat view
  await page.evaluate(() => {
    // Assuming there's a button or we can just set state, but simpler:
    // Let's just click 'Start Chat' or whatever button goes to chat.
    // Actually we can just find the button and click it
    const btns = Array.from(document.querySelectorAll('button'));
    const startChatBtn = btns.find(b => b.textContent.includes('Start Analyzing'));
    if (startChatBtn) startChatBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  const stats = await page.evaluate(() => {
    return {
      appContainer: document.querySelector('.app-container')?.clientHeight,
      sidebar: document.querySelector('.sidebar')?.clientHeight,
      mainChat: document.querySelector('.main-chat')?.clientHeight,
      messagesContainer: document.querySelector('.messages-container')?.clientHeight,
      inputContainer: document.querySelector('.input-container')?.clientHeight
    };
  });
  console.log(JSON.stringify(stats, null, 2));
  await browser.close();
})();
