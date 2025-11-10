import { test, expect } from '../fixtures/auth.fixture';
import { MasterAccountPage } from '../page-objects';
import { mockApiResponse } from '../utils/api-mock';

test.describe('Master Account Management', () => {
  test.beforeEach(async ({ page }) => {
    // Mock users list
    await mockApiResponse(page, '**/account/users', {
      status: 200,
      body: {
        success: true,
        users: [
          {
            id: 'user_001',
            email: 'sub1@pharmacy.ch',
            firstName: 'Pierre',
            lastName: 'Dupont',
            role: 'pharmacist',
            permissions: ['prescriptions', 'inventory'],
          },
          {
            id: 'user_002',
            email: 'sub2@pharmacy.ch',
            firstName: 'Marie',
            lastName: 'Leroy',
            role: 'assistant',
            permissions: ['inventory'],
          },
        ],
      },
    });
  });

  test('should display master account page', async ({ pharmacistPage }) => {
    const masterAccountPage = new MasterAccountPage(pharmacistPage);
    await masterAccountPage.goto();

    await masterAccountPage.expectPageLoaded();
    await expect(masterAccountPage.userList).toBeVisible();
  });

  test('should add sub-pharmacist user', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/account/users/create', {
      status: 200,
      body: {
        success: true,
        userId: 'user_new_001',
      },
    });

    const masterAccountPage = new MasterAccountPage(pharmacistPage);
    await masterAccountPage.goto();

    await masterAccountPage.addSubPharmacist({
      email: 'newpharmacist@pharmacy.ch',
      firstName: 'Jean',
      lastName: 'Martin',
      role: 'pharmacist',
      permissions: ['prescriptions', 'inventory', 'consultations'],
    });
  });

  test('should assign permissions to user', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/account/users/user_001', {
      status: 200,
      body: {
        success: true,
        user: {
          id: 'user_001',
          permissions: ['prescriptions', 'inventory'],
        },
      },
    });

    await mockApiResponse(pharmacistPage, '**/account/users/user_001/permissions', {
      status: 200,
      body: { success: true },
    });

    const masterAccountPage = new MasterAccountPage(pharmacistPage);
    await masterAccountPage.goto();

    await masterAccountPage.assignPermissions('user_001', [
      'prescriptions',
      'inventory',
      'consultations',
      'deliveries',
    ]);
  });

  test('should view all pharmacy locations', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/account/locations', {
      status: 200,
      body: {
        success: true,
        locations: [
          {
            id: 'loc_001',
            name: 'Pharmacie Centrale Genève',
            address: 'Rue du Rhône 12, 1200 Genève',
          },
          {
            id: 'loc_002',
            name: 'Pharmacie Cornavin',
            address: 'Place Cornavin 5, 1201 Genève',
          },
        ],
      },
    });

    const masterAccountPage = new MasterAccountPage(pharmacistPage);
    await masterAccountPage.goto();

    await masterAccountPage.viewPharmacyLocations();
  });

  test('should setup multi-factor authentication', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/account/mfa/setup', {
      status: 200,
      body: {
        success: true,
        qrCodeUrl: 'data:image/png;base64,mockqrcode',
        secret: 'MOCK_MFA_SECRET',
      },
    });

    const masterAccountPage = new MasterAccountPage(pharmacistPage);
    await masterAccountPage.goto();

    await masterAccountPage.setupMFA();
  });

  test('should view audit log', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/account/audit-log', {
      status: 200,
      body: {
        success: true,
        logs: [
          {
            id: 'log_001',
            action: 'prescription_approved',
            user: 'user_001',
            timestamp: new Date().toISOString(),
            details: 'Prescription rx_001 approved',
          },
          {
            id: 'log_002',
            action: 'user_created',
            user: 'master_user',
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            details: 'User user_002 created',
          },
        ],
      },
    });

    const masterAccountPage = new MasterAccountPage(pharmacistPage);
    await masterAccountPage.goto();

    await masterAccountPage.viewAuditLog();
  });

  test('should update account settings', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/account/settings', {
      status: 200,
      body: { success: true },
    });

    const masterAccountPage = new MasterAccountPage(pharmacistPage);
    await masterAccountPage.goto();

    await masterAccountPage.updateAccountSettings({
      'Nom de la pharmacie': 'Pharmacie Centrale Genève',
      'Téléphone': '+41 22 123 45 67',
      'Email': 'contact@pharmacie.ch',
    });
  });

  test('should verify user in list', async ({ pharmacistPage }) => {
    const masterAccountPage = new MasterAccountPage(pharmacistPage);
    await masterAccountPage.goto();

    await masterAccountPage.expectUserInList('user_001');
    await masterAccountPage.expectUserInList('user_002');
  });

  test('should manage role-based access control', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/account/users/user_002', {
      status: 200,
      body: {
        success: true,
        user: {
          id: 'user_002',
          role: 'assistant',
        },
      },
    });

    const masterAccountPage = new MasterAccountPage(pharmacistPage);
    await masterAccountPage.goto();

    await pharmacistPage.locator('[data-testid="user-user_002"]').click();
    await expect(pharmacistPage.locator('[data-testid="role-badge"]')).toContainText('assistant');
  });

  test('should track user activity in audit log', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/account/audit-log?user=user_001', {
      status: 200,
      body: {
        success: true,
        logs: [
          {
            action: 'login',
            timestamp: new Date().toISOString(),
          },
          {
            action: 'prescription_viewed',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
          },
        ],
      },
    });

    const masterAccountPage = new MasterAccountPage(pharmacistPage);
    await masterAccountPage.goto();

    await masterAccountPage.viewAuditLog();
    await pharmacistPage.locator('[data-testid="filter-by-user"]').selectOption('user_001');
  });
});
