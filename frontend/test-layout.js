import puppeteer from 'puppeteer';
import fs from 'fs';

async function run() {
  console.log('Starting puppeteer...');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Set viewport to a common laptop size
  await page.setViewport({ width: 1280, height: 800 });
  
  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  
  // Wait a moment for any renders
  await new Promise(r => setTimeout(r, 1000));
  
  console.log('Taking screenshot before adding messages...');
  await page.screenshot({ path: 'screenshot_initial.png' });
  
  // Add 10 dummy messages to force scrolling
  console.log('Adding messages to force scroll...');
  await page.evaluate(() => {
    // We can't easily dispatch React state changes, but we can manipulate DOM to check CSS
    const container = document.querySelector('.messages-container');
    if (container) {
      for (let i = 0; i < 20; i++) {
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble bot';
        bubble.innerHTML = 'Dummy message ' + i + '<br><br>Testing scrolling behavior.';
        // use margin auto to emulate my CSS
        bubble.style.marginRight = 'auto';
        bubble.style.marginLeft = '0';
        bubble.style.marginBottom = '16px';
        bubble.style.padding = '16px';
        bubble.style.background = 'rgba(99, 102, 241, 0.1)';
        bubble.style.border = '1px solid rgba(99, 102, 241, 0.2)';
        container.appendChild(bubble);
      }
    }
  });
  
  await new Promise(r => setTimeout(r, 500));
  console.log('Taking screenshot after adding messages...');
  await page.screenshot({ path: 'screenshot_overflow.png' });
  
  // Extract dimensions and styles
  const metrics = await page.evaluate(() => {
    const getMetrics = (selector) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return {
        tag: el.tagName,
        class: el.className,
        width: rect.width,
        height: rect.height,
        top: rect.top,
        left: rect.left,
        scrollHeight: el.scrollHeight,
        scrollTop: el.scrollTop,
        display: style.display,
        position: style.position,
        overflowY: style.overflowY,
        marginTop: style.marginTop,
        marginBottom: style.marginBottom,
      };
    };
    
    return {
      html: getMetrics('html'),
      body: getMetrics('body'),
      root: getMetrics('#root'),
      appContainer: getMetrics('.app-container'),
      sidebar: getMetrics('.sidebar'),
      mainChat: getMetrics('.main-chat'),
      messagesContainer: getMetrics('.messages-container'),
      inputContainer: getMetrics('.input-container'),
    };
  });
  
  console.log('METRICS:', JSON.stringify(metrics, null, 2));
  
  // Try scrolling
  console.log('Attempting to scroll messages container...');
  await page.evaluate(() => {
    const container = document.querySelector('.messages-container');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  });
  
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: 'screenshot_scrolled.png' });
  
  const scrollAfter = await page.evaluate(() => {
    const el = document.querySelector('.messages-container');
    return el ? el.scrollTop : null;
  });
  console.log('ScrollTop after scroll:', scrollAfter);
  
  await browser.close();
  console.log('Done.');
}

run().catch(console.error);
