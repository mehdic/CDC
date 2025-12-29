const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('Opening login page...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

  console.log('Page title:', await page.title());

  // Fill login form
  const emailInput = await page.$('input[name="email"], input[type="email"]');
  const passwordInput = await page.$('input[name="password"], input[type="password"]');

  if (!emailInput || !passwordInput) {
    console.log('Login form not found');
    await browser.close();
    process.exit(1);
  }

  console.log('Filling credentials...');
  await emailInput.fill('pharmacist@test.metapharm.ch');
  await passwordInput.fill('TestPass123!');

  const loginButton = await page.$('button[type="submit"]');
  console.log('Clicking login button...');
  await loginButton.click();

  // Wait for navigation
  await page.waitForTimeout(3000);

  console.log('Current URL:', page.url());

  // Check if we're on dashboard
  if (page.url().includes('/dashboard')) {
    console.log('SUCCESS: Logged in and on dashboard!');

    // Check for error messages
    const errorAlert = await page.$('[role="alert"]');
    if (errorAlert) {
      const errorText = await errorAlert.textContent();
      console.log('Alert on page:', errorText);
    }

    // Wait for dashboard data to load
    await page.waitForTimeout(2000);

    // Check if dashboard has content
    const bodyText = await page.evaluate(() => document.body.innerText);
    if (bodyText.includes('Ordonnances') || bodyText.includes('Prescriptions') || bodyText.includes('1248')) {
      console.log('Dashboard data is loading!');
    }
  } else {
    console.log('Not on dashboard, current page:', page.url());
  }

  await browser.close();
  console.log('Test complete');
})();
