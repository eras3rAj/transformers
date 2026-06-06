const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));
  
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  
  console.log("Page loaded. Clicking Price Variation link...");
  
  try {
    await page.click('text/Price Variation');
    await page.waitForTimeout(2000);
    console.log("Clicked successfully.");
  } catch(e) {
    console.log("Could not click link:", e.message);
  }

  await browser.close();
})();
