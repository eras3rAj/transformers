const puppeteer = require('puppeteer');

(async () => {
  console.log("Launching browser...");
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Track console logs and errors
  page.on('console', msg => {
    const type = msg.type();
    console.log(`[BROWSER CONSOLE ${type.toUpperCase()}]:`, msg.text());
  });
  
  page.on('pageerror', error => {
    console.error('[BROWSER PAGE ERROR]:', error.message, error.stack);
  });
  
  page.on('requestfailed', request => {
    console.warn('[BROWSER REQUEST FAILED]:', request.url(), request.failure()?.errorText || '');
  });
  
  async function testRoute(routeName) {
    console.log(`\n-------------------------------------`);
    console.log(`Navigating to http://localhost:5173${routeName}...`);
    try {
      await page.goto(`http://localhost:5173${routeName}`, { waitUntil: 'networkidle2' });
      console.log(`URL reached: ${page.url()}`);
      await new Promise(r => setTimeout(r, 2000));
    } catch (err) {
      console.error(`Failed to navigate to ${routeName}:`, err.message);
    }
  }

  try {
    console.log("Navigating to http://localhost:5173/login...");
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    
    console.log("Logging in as superadmin...");
    await page.waitForSelector('input[placeholder="e.g. superadmin"]');
    await page.type('input[placeholder="e.g. superadmin"]', 'superadmin');
    await page.type('input[type="password"]', 'voltforge2026');
    await page.click('button[type="submit"]');
    
    console.log("Waiting for navigation to dashboard...");
    await page.waitForSelector('.dashboard-grid, aside.sidebar', { timeout: 10000 });
    console.log("Logged in successfully. Current URL:", page.url());
    
    // Test all three routes
    await testRoute('/eod-summary');
    await testRoute('/bg-lc');
    await testRoute('/custom-duty');
    
    console.log("Done checking.");
  } catch (err) {
    console.error("Test script failed:", err);
  } finally {
    await browser.close();
    console.log("Browser closed.");
  }
})();
