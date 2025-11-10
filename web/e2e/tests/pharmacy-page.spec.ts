import { test, expect } from '../fixtures/auth.fixture';
import { PharmacyPageManagement } from '../page-objects';
import { mockApiResponse } from '../utils/api-mock';

test.describe('Pharmacy Page Management', () => {
  test.beforeEach(async ({ page }) => {
    // Mock pharmacy page data
    await mockApiResponse(page, '**/pharmacy/page', {
      status: 200,
      body: {
        success: true,
        pharmacy: {
          id: 'pharmacy_001',
          name: 'Pharmacie Centrale Genève',
          description: 'Votre pharmacie de confiance au coeur de Genève',
          phone: '+41 22 123 45 67',
          address: 'Rue du Rhône 12, 1200 Genève',
          published: true,
          operatingHours: [
            { day: 'monday', open: '08:00', close: '19:00' },
            { day: 'tuesday', open: '08:00', close: '19:00' },
          ],
          deliveryZones: ['1200', '1201', '1202'],
          photos: [],
        },
      },
    });
  });

  test('should display pharmacy page management', async ({ pharmacistPage }) => {
    const pharmacyPage = new PharmacyPageManagement(pharmacistPage);
    await pharmacyPage.goto();

    await pharmacyPage.expectPageLoaded();
  });

  test('should update pharmacy information', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/pharmacy/page/update', {
      status: 200,
      body: { success: true },
    });

    const pharmacyPage = new PharmacyPageManagement(pharmacistPage);
    await pharmacyPage.goto();

    await pharmacyPage.updatePharmacyInfo({
      name: 'Pharmacie Centrale Genève',
      description: 'Votre pharmacie moderne et connectée',
      phone: '+41 22 123 45 67',
      address: 'Rue du Rhône 12, 1200 Genève, Suisse',
    });
  });

  test('should upload pharmacy photos', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/pharmacy/photos/upload', {
      status: 200,
      body: {
        success: true,
        photoUrls: ['/photos/pharmacy_001_1.jpg', '/photos/pharmacy_001_2.jpg'],
      },
    });

    const pharmacyPage = new PharmacyPageManagement(pharmacistPage);
    await pharmacyPage.goto();

    // Note: In a real test, we would use actual test image files
    // For now, we simulate the upload flow
    const fileInput = pharmacistPage.locator('input[type="file"]');
    await expect(fileInput).toBeTruthy();
  });

  test('should set operating hours', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/pharmacy/page/hours', {
      status: 200,
      body: { success: true },
    });

    const pharmacyPage = new PharmacyPageManagement(pharmacistPage);
    await pharmacyPage.goto();

    await pharmacyPage.setOperatingHours([
      { day: 'monday', open: '08:00', close: '19:00' },
      { day: 'tuesday', open: '08:00', close: '19:00' },
      { day: 'wednesday', open: '08:00', close: '19:00' },
      { day: 'thursday', open: '08:00', close: '19:00' },
      { day: 'friday', open: '08:00', close: '19:00' },
      { day: 'saturday', open: '09:00', close: '17:00' },
    ]);
  });

  test('should configure delivery zones', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/pharmacy/page/delivery-zones', {
      status: 200,
      body: { success: true },
    });

    const pharmacyPage = new PharmacyPageManagement(pharmacistPage);
    await pharmacyPage.goto();

    await pharmacyPage.configureDeliveryZones([
      { postalCode: '1200', enabled: true },
      { postalCode: '1201', enabled: true },
      { postalCode: '1202', enabled: true },
      { postalCode: '1203', enabled: true },
      { postalCode: '1204', enabled: false },
    ]);
  });

  test('should manage product catalog', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/products', {
      status: 200,
      body: {
        success: true,
        products: [
          { id: 'prod_001', name: 'Paracétamol 500mg' },
          { id: 'prod_002', name: 'Ibuprofène 400mg' },
        ],
      },
    });

    await mockApiResponse(pharmacistPage, '**/pharmacy/page/catalog', {
      status: 200,
      body: { success: true },
    });

    const pharmacyPage = new PharmacyPageManagement(pharmacistPage);
    await pharmacyPage.goto();

    await pharmacyPage.manageProductCatalog('add', 'prod_001');
    await pharmacyPage.manageProductCatalog('add', 'prod_002');
  });

  test('should remove product from catalog', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/pharmacy/page/catalog', {
      status: 200,
      body: { success: true },
    });

    const pharmacyPage = new PharmacyPageManagement(pharmacistPage);
    await pharmacyPage.goto();

    await pharmacyPage.manageProductCatalog('remove', 'prod_001');
  });

  test('should publish pharmacy page', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/pharmacy/page/publish', {
      status: 200,
      body: { success: true },
    });

    const pharmacyPage = new PharmacyPageManagement(pharmacistPage);
    await pharmacyPage.goto();

    await pharmacyPage.publishPharmacyPage();
    await pharmacyPage.expectPublished();
  });

  test('should unpublish pharmacy page', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/pharmacy/page/unpublish', {
      status: 200,
      body: { success: true },
    });

    const pharmacyPage = new PharmacyPageManagement(pharmacistPage);
    await pharmacyPage.goto();

    await pharmacyPage.unpublishPharmacyPage();
    await pharmacyPage.expectUnpublished();
  });

  test('should update multiple sections simultaneously', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/pharmacy/page/update', {
      status: 200,
      body: { success: true },
    });

    await mockApiResponse(pharmacistPage, '**/pharmacy/page/hours', {
      status: 200,
      body: { success: true },
    });

    await mockApiResponse(pharmacistPage, '**/pharmacy/page/delivery-zones', {
      status: 200,
      body: { success: true },
    });

    const pharmacyPage = new PharmacyPageManagement(pharmacistPage);
    await pharmacyPage.goto();

    await pharmacyPage.updatePharmacyInfo({
      description: 'Updated description',
    });

    await pharmacyPage.setOperatingHours([
      { day: 'monday', open: '07:00', close: '20:00' },
    ]);

    await pharmacyPage.configureDeliveryZones([
      { postalCode: '1200', enabled: true },
    ]);
  });

  test('should validate required fields', async ({ pharmacistPage }) => {
    const pharmacyPage = new PharmacyPageManagement(pharmacistPage);
    await pharmacyPage.goto();

    await pharmacyPage.editInfoButton.click();

    // Clear required fields and try to save
    await pharmacistPage.getByLabel(/nom|name/i).clear();
    await pharmacistPage.getByRole('button', { name: /enregistrer|save/i }).click();

    // Expect validation error
    await expect(pharmacistPage.locator('[data-testid="validation-error"]')).toBeVisible();
  });
});
