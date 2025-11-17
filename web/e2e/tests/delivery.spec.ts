import { test, expect } from '../fixtures/auth.fixture';
import { DeliveryPage } from '../page-objects';

test.describe('Delivery Management', () => {
  test('should display delivery list', async ({ pharmacistPage }) => {
    const deliveryPage = new DeliveryPage(pharmacistPage);
    await deliveryPage.goto();

    await deliveryPage.expectPageLoaded();
    await expect(deliveryPage.deliveryList).toBeVisible();
  });

  test('should create new delivery request', async ({ pharmacistPage }) => {
    const deliveryPage = new DeliveryPage(pharmacistPage);
    await deliveryPage.goto();

    await deliveryPage.createDelivery({
      patientName: 'Sophie Bernard',
      address: 'Rue de la Gare 12, 1200 Genève',
      prescriptionId: 'rx_001',
      specialHandling: false,
    });
  });

  test('should create delivery with special handling for controlled substances', async ({ pharmacistPage }) => {
    const deliveryPage = new DeliveryPage(pharmacistPage);
    await deliveryPage.goto();

    await deliveryPage.createDelivery({
      patientName: 'Marc Dubois',
      address: 'Avenue du Lac 45, 1204 Genève',
      prescriptionId: 'rx_controlled_001',
      specialHandling: true,
    });
  });

  test('should assign delivery to personnel', async ({ pharmacistPage }) => {
    const deliveryPage = new DeliveryPage(pharmacistPage);
    await deliveryPage.goto();

    await deliveryPage.assignDeliveryPersonnel('delivery_001', 'personnel_001');
  });

  test('should track delivery status with GPS', async ({ pharmacistPage }) => {
    const deliveryPage = new DeliveryPage(pharmacistPage);
    await deliveryPage.goto();

    await deliveryPage.trackDelivery('delivery_002');
  });

  test('should verify QR code for delivery', async ({ pharmacistPage }) => {
    const deliveryPage = new DeliveryPage(pharmacistPage);
    await deliveryPage.goto();

    await deliveryPage.verifyQRCode('delivery_001');
  });

  test('should view active deliveries', async ({ pharmacistPage }) => {
    const deliveryPage = new DeliveryPage(pharmacistPage);
    await deliveryPage.goto();

    await deliveryPage.viewActiveDeliveries();
    await deliveryPage.expectDeliveryInList('delivery_001');
    await deliveryPage.expectDeliveryInList('delivery_002');
  });

  test('should view delivery history', async ({ pharmacistPage }) => {
    const deliveryPage = new DeliveryPage(pharmacistPage);
    await deliveryPage.goto();

    await deliveryPage.viewDeliveryHistory();
  });

  test('should generate delivery report', async ({ pharmacistPage }) => {
    const deliveryPage = new DeliveryPage(pharmacistPage);
    await deliveryPage.goto();

    const today = new Date().toISOString().slice(0, 10);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    await deliveryPage.generateDeliveryReport({
      start: weekAgo,
      end: today,
    });
  });

  test('should display delivery status correctly', async ({ pharmacistPage }) => {
    const deliveryPage = new DeliveryPage(pharmacistPage);
    await deliveryPage.goto();

    await deliveryPage.expectDeliveryStatus('delivery_001', 'assigned');
    await deliveryPage.expectDeliveryStatus('delivery_002', 'in_transit');
  });

  test('should handle delivery route optimization', async ({ pharmacistPage }) => {
    const deliveryPage = new DeliveryPage(pharmacistPage);
    await deliveryPage.goto();

    await pharmacistPage.getByRole('button', { name: /optimiser routes|optimize routes/i }).click();
    await expect(pharmacistPage.locator('[data-testid="route-optimization-result"]')).toBeVisible();
  });
});
