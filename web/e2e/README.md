# Playwright E2E Testing Infrastructure

This directory contains the end-to-end testing infrastructure for the MetaPharm Connect web application using Playwright.

## Table of Contents

- [Quick Start](#quick-start)
- [Directory Structure](#directory-structure)
- [Writing Tests](#writing-tests)
- [Page Object Model](#page-object-model)
- [Fixtures](#fixtures)
- [Test Utilities](#test-utilities)
- [Running Tests](#running-tests)
- [CI/CD Integration](#cicd-integration)
- [Best Practices](#best-practices)

## Quick Start

### Installation

Playwright is already installed as a dev dependency. To install browsers:

```bash
cd web
npx playwright install
```

### Run All Tests

```bash
npm run test:e2e
```

### Run Tests in UI Mode (Interactive)

```bash
npm run test:e2e:ui
```

### Run Tests for Specific Browser

```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## Directory Structure

```
e2e/
├── config/                 # Global setup and configuration
│   ├── global-setup.ts     # Runs once before all tests
│   ├── global-teardown.ts  # Runs once after all tests
│   └── test-env.ts         # Environment configuration
├── fixtures/               # Test fixtures for reusable setup
│   └── auth.fixture.ts     # Authentication fixtures
├── page-objects/           # Page Object Models (POM)
│   ├── BasePage.ts         # Base class for all page objects
│   ├── LoginPage.ts        # Login page object
│   └── index.ts            # Exports
├── utils/                  # Shared utilities
│   ├── auth-helpers.ts     # Authentication helpers
│   ├── api-mock.ts         # API mocking utilities
│   ├── test-data.ts        # Test data generators
│   └── index.ts            # Exports
├── tests/                  # Test files (to be created by Phase 2 developers)
└── README.md              # This file
```

## Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';

test('basic test example', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/MetaPharm/);
});
```

### Using Page Objects

```typescript
import { test, expect } from '../fixtures/auth.fixture';
import { LoginPage } from '../page-objects/LoginPage';

test('login with valid credentials', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.goto();
  await loginPage.login({
    email: 'test@example.com',
    password: 'password123'
  });

  await loginPage.expectLoginSuccess();
});
```

### Using Authentication Fixtures

```typescript
import { test, expect } from '../fixtures/auth.fixture';

// Test with authenticated user
test('view dashboard', async ({ pharmacistPage }) => {
  // Already logged in as pharmacist
  await expect(pharmacistPage).toHaveURL(/dashboard/);
});
```

## Page Object Model

All page interactions should be encapsulated in Page Object Models.

### Creating a New Page Object

```typescript
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class DashboardPage extends BasePage {
  readonly pageTitle: Locator;
  readonly prescriptionsLink: Locator;

  constructor(page: Page) {
    super(page);
    this.pageTitle = page.getByRole('heading', { name: /dashboard/i });
    this.prescriptionsLink = page.getByRole('link', { name: /prescriptions/i });
  }

  async goto(): Promise<void> {
    await this.page.goto('/dashboard');
    await this.expectPageLoaded();
  }

  async navigateToPrescriptions(): Promise<void> {
    await this.prescriptionsLink.click();
    await this.waitForUrl(/prescriptions/);
  }

  async expectPageLoaded(): Promise<void> {
    await expect(this.pageTitle).toBeVisible();
  }
}
```

## Fixtures

Fixtures provide reusable setup and teardown logic.

### Available Fixtures

- `loginPage`: LoginPage instance
- `authenticatedPage`: Page with default authenticated user
- `pharmacistPage`: Page with pharmacist user authenticated

### Using Fixtures

```typescript
import { test, expect, testUsers } from '../fixtures/auth.fixture';

test('test with custom user', async ({ page }) => {
  // Login manually with specific user
  const { login } = await import('../utils/auth-helpers');
  await login(page, testUsers.doctor);

  // Your test code here
});
```

## Test Utilities

### Authentication Helpers

```typescript
import { login, logout, isAuthenticated } from '../utils/auth-helpers';

// Login via UI
await login(page, testUsers.pharmacist);

// Check authentication status
const authenticated = await isAuthenticated(page);

// Logout
await logout(page);
```

### API Mocking

```typescript
import { mockLoginSuccess, mockApiResponse } from '../utils/api-mock';

// Mock successful login
await mockLoginSuccess(page, {
  email: 'test@example.com',
  role: 'pharmacist'
});

// Mock custom API endpoint
await mockApiResponse(page, '**/prescriptions', {
  status: 200,
  body: { data: [], total: 0 }
});
```

### Test Data Generators

```typescript
import {
  generateMockPrescription,
  generateMockInventoryItem
} from '../utils/test-data';

const prescription = generateMockPrescription();
const items = generateMockInventoryItems(10);
```

## Running Tests

### Local Development

```bash
# Run all tests
npm run test:e2e

# Run in UI mode (recommended for debugging)
npm run test:e2e:ui

# Run specific test file
npx playwright test e2e/tests/login.spec.ts

# Run tests matching pattern
npx playwright test -g "login"

# Run in headed mode (see browser)
npx playwright test --headed

# Debug mode
npx playwright test --debug
```

### Environment Variables

Create a `.env.test` file (already exists) or set environment variables:

```bash
PLAYWRIGHT_BASE_URL=http://localhost:5173
PLAYWRIGHT_HEADLESS=false
USE_REAL_API=true
```

## CI/CD Integration

### GitHub Actions

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Only when files in `web/` directory change

See `.github/workflows/playwright-tests.yml` for configuration.

### Viewing Test Results

Test reports are uploaded as artifacts in GitHub Actions. Download them from:
- Actions tab > Workflow run > Artifacts section

### Local HTML Report

After running tests locally:

```bash
npx playwright show-report
```

## Best Practices

### 1. Use Page Objects

Don't interact with the DOM directly in tests. Use page objects.

❌ Bad:
```typescript
await page.locator('input[name="email"]').fill('test@example.com');
```

✅ Good:
```typescript
const loginPage = new LoginPage(page);
await loginPage.fillEmail('test@example.com');
```

### 2. Use Meaningful Test Names

```typescript
// Good test names
test('should display error when login fails with invalid credentials');
test('should successfully create a new prescription');
test('should navigate to inventory page from dashboard');
```

### 3. Keep Tests Independent

Each test should be able to run independently. Don't rely on test execution order.

### 4. Use Fixtures for Setup

Don't duplicate setup code. Use fixtures or helper functions.

### 5. Use Explicit Waits

```typescript
// Wait for element to be visible
await expect(page.locator('.spinner')).toBeVisible();

// Wait for element to be hidden
await expect(page.locator('.spinner')).toBeHidden();

// Wait for URL change
await page.waitForURL(/dashboard/);
```

### 6. Test Workflows, Not DOM

Focus on user workflows and functionality, not implementation details.

❌ Bad (testing implementation):
```typescript
test('button has correct class', async ({ page }) => {
  await expect(page.locator('.btn-primary')).toHaveClass('btn-primary');
});
```

✅ Good (testing functionality):
```typescript
test('user can submit prescription form', async ({ page }) => {
  await fillPrescriptionForm(page);
  await submitForm(page);
  await expect(page).toHaveURL(/prescriptions/);
});
```

### 7. Mock External Dependencies

Use API mocking for tests that don't need real API calls.

```typescript
import { mockPrescriptionList } from '../utils/api-mock';

test('display empty state when no prescriptions', async ({ page }) => {
  await mockPrescriptionList(page, []);
  // Test empty state UI
});
```

### 8. Use Test Data Generators

Don't hardcode test data. Use generators for flexibility.

```typescript
import { generateMockPrescriptions } from '../utils/test-data';

const prescriptions = generateMockPrescriptions(5);
```

### 9. Clean Up After Tests

Fixtures handle cleanup automatically, but if you create resources manually:

```typescript
test('my test', async ({ page }) => {
  // Test code

  // Cleanup
  await clearAuth(page);
});
```

### 10. Use Descriptive Locators

Prefer user-facing locators over implementation details.

✅ Good:
```typescript
page.getByRole('button', { name: 'Se connecter' })
page.getByLabel('Email')
page.getByText('Bienvenue')
```

❌ Avoid:
```typescript
page.locator('#submit-btn')
page.locator('.form-input:nth-child(2)')
```

## Debugging Tips

### 1. Use UI Mode

```bash
npm run test:e2e:ui
```

### 2. Use Debug Mode

```bash
npx playwright test --debug
```

### 3. Add Screenshots

```typescript
await page.screenshot({ path: 'debug.png' });
```

### 4. Console Logs

```typescript
page.on('console', msg => console.log(msg.text()));
```

### 5. Slow Down Execution

```typescript
// In playwright.config.ts
use: {
  slowMo: 1000, // Slow down by 1 second
}
```

## Questions or Issues?

For Phase 2 developers:
- Review this README thoroughly before writing tests
- Use existing page objects and utilities
- Follow the established patterns
- Add new page objects as needed
- Keep tests focused on workflows, not DOM structure

---

**Infrastructure Developer:** Group `playwright_infrastructure`
**Created:** 2025-11-09
**For Questions:** Contact the Phase 1 infrastructure developer
