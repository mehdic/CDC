import { test, expect } from '@playwright/test';
import { mockApiResponse } from '../utils/api-mock';

/**
 * E2E-002: Patient Registration Flow
 *
 * Complete end-to-end test for patient registration including
 * account creation, email verification, profile setup, and first login.
 */
test.describe('Patient Registration Flow (E2E-002)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('should successfully register a new patient account', async ({ page }) => {
    // Mock registration API response
    await mockApiResponse(page, '**/auth/register', {
      status: 201,
      body: {
        success: true,
        userId: 'user_patient_new_001',
        message: 'Compte créé avec succès. Veuillez vérifier votre email.',
        requiresEmailVerification: true,
      },
    });

    // Fill registration form
    await page.getByLabel(/prénom|first name/i).fill('Sophie');
    await page.getByLabel(/nom|last name/i).fill('Bernard');
    await page.getByLabel(/email/i).fill('sophie.bernard@example.ch');
    await page.getByLabel(/téléphone|phone/i).fill('+41 79 123 45 67');
    await page
      .getByLabel(/mot de passe|password/i)
      .first()
      .fill('SecurePass123!');
    await page.getByLabel(/confirmer.*mot de passe|confirm.*password/i).fill('SecurePass123!');
    await page.getByLabel(/date de naissance|date of birth/i).fill('1990-05-15');

    // Accept terms and conditions (GDPR/HIPAA compliance requirement)
    await page.getByLabel(/j'accepte.*conditions|i accept.*terms/i).check();
    await page
      .getByLabel(/j'accepte.*politique.*confidentialité|i accept.*privacy.*policy/i)
      .check();

    // Submit registration form
    await page.getByRole('button', { name: /s'inscrire|register|créer un compte/i }).click();

    // Verify success message
    await expect(page.locator('[role="alert"]')).toContainText(
      /compte créé|account created|vérifier.*email/i
    );

    // Should redirect to verification page
    await page.waitForURL(/\/verify-email/);
    await expect(page.getByText(/email de vérification|verification email/i)).toBeVisible();
  });

  test('should validate all required fields', async ({ page }) => {
    // Try to submit empty form
    await page.getByRole('button', { name: /s'inscrire|register/i }).click();

    // Should show validation errors for required fields
    await expect(page.getByText(/prénom.*requis|first name.*required/i)).toBeVisible();
    await expect(page.getByText(/nom.*requis|last name.*required/i)).toBeVisible();
    await expect(page.getByText(/email.*requis|email.*required/i)).toBeVisible();
    await expect(page.getByText(/mot de passe.*requis|password.*required/i)).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await page.getByLabel(/email/i).fill('invalid-email');
    await page.getByLabel(/email/i).blur();

    // Should show email format error
    await expect(page.getByText(/email.*invalide|invalid email/i)).toBeVisible();
  });

  test('should validate password strength requirements', async ({ page }) => {
    // Try weak password
    await page
      .getByLabel(/mot de passe|password/i)
      .first()
      .fill('weak');
    await page
      .getByLabel(/mot de passe|password/i)
      .first()
      .blur();

    // Should show password strength requirements
    const passwordError = page.locator('[data-testid="password-requirements"]');
    await expect(passwordError).toBeVisible();
    await expect(passwordError).toContainText(/minimum 8 caractères|minimum 8 characters/i);
    await expect(passwordError).toContainText(/majuscule|uppercase/i);
    await expect(passwordError).toContainText(/chiffre|number/i);
    await expect(passwordError).toContainText(/caractère spécial|special character/i);
  });

  test('should verify password confirmation matches', async ({ page }) => {
    await page
      .getByLabel(/mot de passe|password/i)
      .first()
      .fill('SecurePass123!');
    await page.getByLabel(/confirmer.*mot de passe|confirm.*password/i).fill('DifferentPass123!');
    await page.getByLabel(/confirmer.*mot de passe|confirm.*password/i).blur();

    // Should show mismatch error
    await expect(
      page.getByText(/mots de passe.*correspondent pas|passwords.*not match/i)
    ).toBeVisible();
  });

  test('should validate Swiss phone number format', async ({ page }) => {
    // Try invalid phone format
    await page.getByLabel(/téléphone|phone/i).fill('123');
    await page.getByLabel(/téléphone|phone/i).blur();

    // Should show phone format error (Swiss format: +41 XX XXX XX XX)
    await expect(page.getByText(/téléphone.*invalide|invalid phone/i)).toBeVisible();
  });

  test('should prevent registration with existing email', async ({ page }) => {
    // Mock API response for existing email
    await mockApiResponse(page, '**/auth/register', {
      status: 409,
      body: {
        success: false,
        error: 'Email already exists',
        message: 'Un compte existe déjà avec cette adresse email',
      },
    });

    // Fill form with existing email
    await page.getByLabel(/prénom|first name/i).fill('Sophie');
    await page.getByLabel(/nom|last name/i).fill('Bernard');
    await page.getByLabel(/email/i).fill('existing@example.ch');
    await page.getByLabel(/téléphone|phone/i).fill('+41 79 123 45 67');
    await page
      .getByLabel(/mot de passe|password/i)
      .first()
      .fill('SecurePass123!');
    await page.getByLabel(/confirmer.*mot de passe|confirm.*password/i).fill('SecurePass123!');
    await page.getByLabel(/date de naissance|date of birth/i).fill('1990-05-15');
    await page.getByLabel(/j'accepte.*conditions|i accept.*terms/i).check();
    await page
      .getByLabel(/j'accepte.*politique.*confidentialité|i accept.*privacy.*policy/i)
      .check();

    await page.getByRole('button', { name: /s'inscrire|register/i }).click();

    // Should show error message
    await expect(page.locator('[role="alert"]')).toContainText(
      /compte existe déjà|account already exists/i
    );
  });

  test('should require acceptance of terms and conditions', async ({ page }) => {
    // Fill all fields except terms
    await page.getByLabel(/prénom|first name/i).fill('Sophie');
    await page.getByLabel(/nom|last name/i).fill('Bernard');
    await page.getByLabel(/email/i).fill('sophie.bernard@example.ch');
    await page.getByLabel(/téléphone|phone/i).fill('+41 79 123 45 67');
    await page
      .getByLabel(/mot de passe|password/i)
      .first()
      .fill('SecurePass123!');
    await page.getByLabel(/confirmer.*mot de passe|confirm.*password/i).fill('SecurePass123!');
    await page.getByLabel(/date de naissance|date of birth/i).fill('1990-05-15');

    // Try to submit without accepting terms
    await page.getByRole('button', { name: /s'inscrire|register/i }).click();

    // Should show validation error or button should be disabled
    const submitButton = page.getByRole('button', { name: /s'inscrire|register/i });
    const isDisabled = await submitButton.isDisabled();
    if (!isDisabled) {
      await expect(page.getByText(/accepter.*conditions|accept.*terms/i)).toBeVisible();
    }
  });

  test('should verify email with verification code', async ({ page }) => {
    // Mock email verification API
    await mockApiResponse(page, '**/auth/verify-email', {
      status: 200,
      body: {
        success: true,
        message: 'Email vérifié avec succès',
      },
    });

    // Navigate to verification page
    await page.goto('/verify-email?token=mock_verification_token');

    // Enter verification code
    const codeInput = page.getByLabel(/code de vérification|verification code/i);
    await codeInput.fill('123456');

    // Submit verification
    await page.getByRole('button', { name: /vérifier|verify/i }).click();

    // Should show success message
    await expect(page.locator('[role="alert"]')).toContainText(/email vérifié|email verified/i);

    // Should redirect to login or profile setup
    await page.waitForURL(/\/login|\/profile-setup/);
  });

  test('should handle expired verification token', async ({ page }) => {
    // Mock expired token response
    await mockApiResponse(page, '**/auth/verify-email', {
      status: 400,
      body: {
        success: false,
        error: 'Token expired',
        message: 'Le lien de vérification a expiré',
      },
    });

    await page.goto('/verify-email?token=expired_token');

    const codeInput = page.getByLabel(/code de vérification|verification code/i);
    await codeInput.fill('123456');
    await page.getByRole('button', { name: /vérifier|verify/i }).click();

    // Should show expiration error
    await expect(page.locator('[role="alert"]')).toContainText(/lien.*expiré|link expired/i);

    // Should show resend button
    await expect(page.getByRole('button', { name: /renvoyer|resend/i })).toBeVisible();
  });

  test('should allow resending verification email', async ({ page }) => {
    // Mock resend API
    await mockApiResponse(page, '**/auth/resend-verification', {
      status: 200,
      body: {
        success: true,
        message: 'Email de vérification renvoyé',
      },
    });

    await page.goto('/verify-email');

    // Click resend button
    await page.getByRole('button', { name: /renvoyer|resend/i }).click();

    // Should show success message
    await expect(page.locator('[role="alert"]')).toContainText(/email.*renvoyé|email.*sent/i);
  });

  test('should complete profile setup after email verification', async ({ page }) => {
    // Mock profile setup API
    await mockApiResponse(page, '**/users/profile/complete', {
      status: 200,
      body: {
        success: true,
        message: 'Profil complété avec succès',
      },
    });

    await page.goto('/profile-setup');

    // Fill additional profile information
    await page.getByLabel(/adresse|address/i).fill('Rue de la Gare 10');
    await page.getByLabel(/code postal|postal code/i).fill('1003');
    await page.getByLabel(/ville|city/i).fill('Lausanne');
    await page.getByLabel(/canton/i).selectOption('VD');

    // Medical information (optional)
    await page.getByLabel(/allergies/i).fill('Pénicilline');
    await page.getByLabel(/maladies chroniques|chronic conditions/i).fill('Diabète type 2');

    // Emergency contact
    await page.getByLabel(/contact d'urgence.*nom|emergency contact.*name/i).fill('Jean Bernard');
    await page
      .getByLabel(/contact d'urgence.*téléphone|emergency contact.*phone/i)
      .fill('+41 79 987 65 43');

    // Submit profile
    await page.getByRole('button', { name: /terminer|complete|save/i }).click();

    // Should show success and redirect to dashboard
    await expect(page.locator('[role="alert"]')).toContainText(
      /profil.*complété|profile.*completed/i
    );
    await page.waitForURL(/\/dashboard/);
  });

  test('should support social login options (Google, Apple)', async ({ page }) => {
    await page.goto('/register');

    // Verify social login buttons exist
    const googleButton = page.getByRole('button', { name: /google/i });
    const appleButton = page.getByRole('button', { name: /apple/i });

    await expect(googleButton).toBeVisible();
    await expect(appleButton).toBeVisible();

    // Clicking would trigger OAuth flow (not tested here due to external redirect)
  });

  test('should validate age requirement (minimum 18 years old)', async ({ page }) => {
    // Try to register with age < 18
    const today = new Date();
    const underageDate = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());
    const underageDateStr = underageDate.toISOString().split('T')[0];

    await page.getByLabel(/date de naissance|date of birth/i).fill(underageDateStr);
    await page.getByLabel(/date de naissance|date of birth/i).blur();

    // Should show age validation error
    await expect(page.getByText(/minimum 18 ans|minimum age 18/i)).toBeVisible();
  });

  test('should show loading state during registration', async ({ page }) => {
    // Mock slow registration response
    await page.route('**/auth/register', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 201,
        body: JSON.stringify({ success: true, userId: 'new_user' }),
      });
    });

    // Fill form
    await page.getByLabel(/prénom|first name/i).fill('Sophie');
    await page.getByLabel(/nom|last name/i).fill('Bernard');
    await page.getByLabel(/email/i).fill('sophie@example.ch');
    await page.getByLabel(/téléphone|phone/i).fill('+41 79 123 45 67');
    await page
      .getByLabel(/mot de passe|password/i)
      .first()
      .fill('SecurePass123!');
    await page.getByLabel(/confirmer.*mot de passe|confirm.*password/i).fill('SecurePass123!');
    await page.getByLabel(/date de naissance|date of birth/i).fill('1990-05-15');
    await page.getByLabel(/j'accepte.*conditions|i accept.*terms/i).check();
    await page
      .getByLabel(/j'accepte.*politique.*confidentialité|i accept.*privacy.*policy/i)
      .check();

    // Submit
    await page.getByRole('button', { name: /s'inscrire|register/i }).click();

    // Verify loading state
    const submitButton = page.getByRole('button', { name: /s'inscrire|register/i });
    await expect(submitButton).toBeDisabled();
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
  });
});
