/**
 * Debug test for doctor login issue
 */

import { test, expect } from '@playwright/test';
import { testUsers } from '../fixtures/auth.fixture';

test.describe('Debug Doctor Login', () => {
  test('Debug doctor login with detailed logging', async ({ page }) => {
    console.log('Starting doctor login test...');

    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Browser console error:', msg.text());
      }
    });

    // Monitor network requests
    page.on('request', request => {
      if (request.url().includes('/auth/login')) {
        console.log('Login request:', request.url(), request.postData());
      }
    });

    page.on('response', async response => {
      if (response.url().includes('/auth/login')) {
        console.log('Login response:', response.status(), response.statusText());
        const body = await response.text();
        console.log('Response body:', body);
      }
    });

    // Navigate to login page
    await page.goto('http://localhost:5173/login');
    console.log('Navigated to login page');

    // Wait for page to load
    await page.waitForSelector('input[name="email"]', { timeout: 5000 });
    console.log('Login form is visible');

    // Fill login form
    await page.fill('input[name="email"]', testUsers.doctor.email);
    await page.fill('input[name="password"]', testUsers.doctor.password);
    console.log('Filled doctor credentials:', testUsers.doctor.email);

    // Submit form
    await page.click('button[type="submit"]');
    console.log('Clicked submit button');

    // Wait a bit for the request to complete
    await page.waitForTimeout(3000);

    // Check localStorage
    const authToken = await page.evaluate(() => localStorage.getItem('auth_token'));
    console.log('Auth token in localStorage:', authToken ? 'Present' : 'Missing');

    // Check current URL
    console.log('Current URL:', page.url());

    // Check if we're still on login page
    const isOnLoginPage = page.url().includes('/login');
    console.log('Still on login page:', isOnLoginPage);

    // Check for error messages
    const errorElement = await page.locator('[role="alert"]');
    const hasError = await errorElement.isVisible().catch(() => false);
    if (hasError) {
      const errorText = await errorElement.textContent();
      console.log('Error message visible:', errorText);
    }

    // Assert auth token exists
    expect(authToken).toBeTruthy();
    expect(authToken).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/); // JWT format
  });
});