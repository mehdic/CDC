import { test, expect } from '@playwright/test';
import { testUsers } from '../fixtures/auth.fixture';
import { getAuthToken } from '../utils/auth-helpers';
import { LoginPage } from '../page-objects/LoginPage';

test('debug auth token flow', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.goto();
  await loginPage.login({
    email: testUsers.pharmacist.email,
    password: testUsers.pharmacist.password,
  });

  // Wait for navigation
  await page.waitForURL(/.*\/(?!login)/, { timeout: 10000 });
  await page.waitForLoadState('domcontentloaded', { timeout: 10000 });

  // CRITICAL: Wait for token to be stored in localStorage
  await page.waitForFunction(
    () => localStorage.getItem('auth_token') !== null,
    { timeout: 10000 }
  );

  // Get auth token
  const token = await getAuthToken(page);
  console.log('=== TOKEN DEBUG ===');
  console.log('Token value:', token);
  console.log('Token length:', token ? token.length : 0);
  console.log('Token first 50 chars:', token ? token.substring(0, 50) : 'NULL');

  // Test making authenticated API call
  console.log('Making request to http://localhost:4000/prescriptions');
  const response = await page.request.get('http://localhost:4000/prescriptions', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  console.log('Response status:', response.status());
  const responseBody = await response.text();
  console.log('Response body:', responseBody);

  // Just check we got a response
  expect(response.status()).toBeGreaterThan(0);
});
