import { test, expect } from '../fixtures/auth.fixture';
import { DeliveryPage } from '../page-objects';
import { mockApiResponse } from '../utils/api-mock';

test.describe('Delivery Management', () => {
  test.beforeEach(async ({ page }) => {
    // Mock deliveries list
    await mockApiResponse(page, '**/deliveries**', {
      status: 200,
      body: {
        success: true,
        deliveries: [
          {
            id: 'delivery_001',
            patientName: 'Sophie Bernard',
            address: 'Rue de la Gare 12, 1200 Genève',
            status: 'assigned',
            prescriptionId: 'rx_001',
            assignedTo: 'personnel_001',
          },
          {
            id: 'delivery_002',
            patientName: 'Marc Dubois',
            address: 'Avenue du Lac 45, 1204 Genève',
            status: 'in_transit',
            prescriptionId: 'rx_002',
            assignedTo: 'personnel_002',
          },
        ],
      },
    });
  });

  test('should display delivery list', async ({ pharmacistPage }) => {
    const deliveryPage = new DeliveryPage(pharmacistPage);
    await deliveryPage.goto();

    await deliveryPage.expectPageLoaded();
    await expect(deliveryPage.deliveryList).toBeVisible();
  });

  test('should create new delivery request', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/deliveries/create', {
      status: 200,
      body: {
        success: true,
        deliveryId: 'delivery_new_001',
        qrCode: 'QR_DELIVERY_123',
      },
    });

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
    await mockApiResponse(pharmacistPage, '**/deliveries/create', {
      status: 200,
      body: {
        success: true,
        deliveryId: 'delivery_controlled_001',
        specialHandling: true,
      },
    });

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
    await mockApiResponse(pharmacistPage, '**/deliveries/delivery_001', {
      status: 200,
      body: {
        success: true,
        delivery: {
          id: 'delivery_001',
          status: 'pending',
        },
      },
    });

    await mockApiResponse(pharmacistPage, '**/delivery-personnel', {
      status: 200,
      body: {
        success: true,
        personnel: [
          { id: 'personnel_001', name: 'Pierre Leroux', available: true },
          { id: 'personnel_002', name: 'Marie Blanc', available: true },
        ],
      },
    });

    await mockApiResponse(pharmacistPage, '**/deliveries/delivery_001/assign', {
      status: 200,
      body: { success: true },
    });

    const deliveryPage = new DeliveryPage(pharmacistPage);
    await deliveryPage.goto();

    await deliveryPage.assignDeliveryPersonnel('delivery_001', 'personnel_001');
  });

  test('should track delivery status with GPS', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/deliveries/delivery_002', {
      status: 200,
      body: {
        success: true,
        delivery: {
          id: 'delivery_002',
          status: 'in_transit',
          currentLocation: {
            lat: 46.2044,
            lng: 6.1432,
          },
        },
      },
    });

    await mockApiResponse(pharmacistPage, '**/deliveries/delivery_002/track', {
      status: 200,
      body: {
        success: true,
        location: { lat: 46.2044, lng: 6.1432 },
        estimatedArrival: new Date(Date.now() + 900000).toISOString(),
      },
    });

    const deliveryPage = new DeliveryPage(pharmacistPage);
    await deliveryPage.goto();

    await deliveryPage.trackDelivery('delivery_002');
  });

  test('should verify QR code for delivery', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/deliveries/delivery_001', {
      status: 200,
      body: {
        success: true,
        delivery: {
          id: 'delivery_001',
          qrCode: 'QR_DELIVERY_001',
        },
      },
    });

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
    await mockApiResponse(pharmacistPage, '**/deliveries?status=completed', {
      status: 200,
      body: {
        success: true,
        deliveries: [
          {
            id: 'delivery_completed_001',
            patientName: 'Alice Leroy',
            status: 'completed',
            completedAt: new Date(Date.now() - 86400000).toISOString(),
          },
        ],
      },
    });

    const deliveryPage = new DeliveryPage(pharmacistPage);
    await deliveryPage.goto();

    await deliveryPage.viewDeliveryHistory();
  });

  test('should generate delivery report', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/deliveries/reports', {
      status: 200,
      body: {
        success: true,
        report: {
          totalDeliveries: 150,
          completedDeliveries: 145,
          averageDeliveryTime: 45,
          onTimePercentage: 96,
        },
      },
    });

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
    await mockApiResponse(pharmacistPage, '**/deliveries/optimize-routes', {
      status: 200,
      body: {
        success: true,
        optimizedRoutes: [
          {
            personnelId: 'personnel_001',
            deliveries: ['delivery_001', 'delivery_003'],
            estimatedTime: 90,
          },
        ],
      },
    });

    const deliveryPage = new DeliveryPage(pharmacistPage);
    await deliveryPage.goto();

    await pharmacistPage.getByRole('button', { name: /optimiser routes|optimize routes/i }).click();
    await expect(pharmacistPage.locator('[data-testid="route-optimization-result"]')).toBeVisible();
  });
});
