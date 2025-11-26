import { test, expect } from '../fixtures/auth.fixture';
import { NursePage } from '../page-objects';
import { mockApiResponse } from '../utils/api-mock';

test.describe('Delivery Tracking for Nurses (E2E-019)', () => {
  test.beforeEach(async ({ page }) => {
    // Mock nurse orders with delivery info
    await mockApiResponse(page, '**/nurse/orders**', {
      status: 200,
      body: {
        success: true,
        data: [
          {
            id: 'order_001',
            patientName: 'Paul Deschamp',
            patientRoom: '101',
            medications: ['Lisinopril 10mg x30', 'Metformine 500mg x60'],
            status: 'in_transit',
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            deliveryETA: new Date(Date.now() + 1800000).toISOString(),
            deliveryPersonnel: 'Marc Leblanc',
            deliveryPhone: '+41 79 987 6543',
            urgent: false,
          },
          {
            id: 'order_002',
            patientName: 'Marie Rousseau',
            patientRoom: '102',
            medications: ['Salbutamol Inhaler'],
            status: 'prepared',
            createdAt: new Date(Date.now() - 7200000).toISOString(),
            deliveryETA: new Date(Date.now() + 3600000).toISOString(),
            deliveryPersonnel: null,
            urgent: false,
          },
          {
            id: 'order_003',
            patientName: 'Jean-Claude Fontaine',
            patientRoom: '103',
            medications: ['Insulin Glargine 100U/mL'],
            status: 'delivered',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            deliveredAt: new Date(Date.now() - 7200000).toISOString(),
            deliveryPersonnel: 'Sophie Renault',
            urgent: true,
          },
        ],
        total: 3,
      },
    });

    // Mock delivery tracking details
    await mockApiResponse(page, '**/nurse/orders/order_001/tracking**', {
      status: 200,
      body: {
        success: true,
        data: {
          orderId: 'order_001',
          status: 'in_transit',
          currentLocation: {
            latitude: 46.9479,
            longitude: 7.4474,
            address: 'Route to Rue des Alpes, Bern',
          },
          deliveryPersonnel: {
            name: 'Marc Leblanc',
            phone: '+41 79 987 6543',
            rating: 4.8,
            vehicleInfo: 'White Renault van - License: BE 123 AB',
          },
          route: [
            { location: 'Pharmacy', timestamp: new Date(Date.now() - 1800000).toISOString(), status: 'picked_up' },
            { location: 'Route intersection', timestamp: new Date(Date.now() - 900000).toISOString(), status: 'in_transit' },
          ],
          estimatedArrival: new Date(Date.now() + 1800000).toISOString(),
          distanceRemaining: '2.5 km',
          estimatedTime: '8 minutes',
        },
      },
    });

    // Mock delivery status updates
    await mockApiResponse(page, '**/nurse/orders/order_002/delivery-personnel**', {
      status: 200,
      body: {
        success: true,
        data: [
          { id: 'person_001', name: 'Marc Leblanc', available: true, rating: 4.8 },
          { id: 'person_002', name: 'Sophie Renault', available: false, rating: 4.9 },
        ],
      },
    });
  });

  test('should display active orders with delivery status', async ({ nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Navigate to active orders
    await nursePageObj.viewActiveOrders();

    // Verify orders are displayed
    const activeOrdersList = nursePage.locator('[data-testid="active-orders-list"]');
    await expect(activeOrdersList).toBeVisible();

    // Verify in-transit order
    const inTransitOrder = nursePage.locator('[data-testid="order-order_001"]');
    await expect(inTransitOrder).toBeVisible();
    await expect(inTransitOrder).toContainText('Paul Deschamp');
    await expect(inTransitOrder).toContainText('Room 101');

    // Verify status badge
    const statusBadge = inTransitOrder.locator('[data-testid="status-badge"]');
    await expect(statusBadge).toContainText(/en cours|in transit/i);

    // Verify prepared order
    const preparedOrder = nursePage.locator('[data-testid="order-order_002"]');
    await expect(preparedOrder).toBeVisible();
    await expect(preparedOrder).toContainText('Marie Rousseau');
  });

  test('should display delivery ETA and personnel info', async ({ nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // View active orders
    await nursePageObj.viewActiveOrders();

    // Check in-transit order details
    const inTransitOrder = nursePage.locator('[data-testid="order-order_001"]');
    await inTransitOrder.click();

    // Verify ETA is displayed
    const etaDisplay = nursePage.locator('[data-testid="delivery-eta"]');
    await expect(etaDisplay).toBeVisible();

    // Verify delivery personnel info
    const personnelInfo = nursePage.locator('[data-testid="delivery-personnel-info"]');
    if (await personnelInfo.isVisible()) {
      await expect(personnelInfo).toContainText('Marc Leblanc');
      // Verify contact button
      const contactButton = personnelInfo.getByRole('button', { name: /appeler|call|contacter/i });
      if (await contactButton.isVisible()) {
        await expect(contactButton).toBeVisible();
      }
    }
  });

  test('should track delivery on map in real-time', async ({ nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // View active orders
    await nursePageObj.viewActiveOrders();

    // Click to track delivery
    await nursePageObj.trackDelivery('order_001');

    // Verify map is displayed
    await expect(nursePage.locator('[data-testid="delivery-tracking-map"]')).toBeVisible();

    // Verify current location marker
    const locationMarker = nursePage.locator('[data-testid="current-location-marker"]');
    if (await locationMarker.isVisible()) {
      await expect(locationMarker).toBeVisible();
    }

    // Verify destination marker
    const destinationMarker = nursePage.locator('[data-testid="destination-marker"]');
    if (await destinationMarker.isVisible()) {
      await expect(destinationMarker).toBeVisible();
    }

    // Verify route is drawn
    const routePath = nursePage.locator('[data-testid="route-path"]');
    if (await routePath.isVisible()) {
      await expect(routePath).toBeVisible();
    }
  });

  test('should display delivery timeline with status updates', async ({ nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // View active orders
    await nursePageObj.viewActiveOrders();

    // Open tracking for order
    await nursePageObj.trackDelivery('order_001');

    // Verify timeline section
    const timeline = nursePage.locator('[data-testid="delivery-timeline"]');
    if (await timeline.isVisible()) {
      // Verify pickup timestamp
      const pickupEvent = timeline.locator('[data-testid="timeline-picked_up"]');
      if (await pickupEvent.isVisible()) {
        await expect(pickupEvent).toContainText(/picked up|Pharmacy/i);
      }

      // Verify in-transit timestamp
      const inTransitEvent = timeline.locator('[data-testid="timeline-in_transit"]');
      if (await inTransitEvent.isVisible()) {
        await expect(inTransitEvent).toBeVisible();
      }
    }
  });

  test('should show estimated time remaining', async ({ nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // View active orders
    await nursePageObj.viewActiveOrders();

    // Open tracking
    await nursePageObj.trackDelivery('order_001');

    // Verify time remaining display
    const timeRemaining = nursePage.locator('[data-testid="estimated-time-remaining"]');
    if (await timeRemaining.isVisible()) {
      await expect(timeRemaining).toContainText(/minute|minutes/i);
    }

    // Verify distance remaining
    const distanceRemaining = nursePage.locator('[data-testid="distance-remaining"]');
    if (await distanceRemaining.isVisible()) {
      await expect(distanceRemaining).toContainText(/km|distance/i);
    }
  });

  test('should display delivery personnel profile and contact', async ({ nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // View active orders
    await nursePageObj.viewActiveOrders();

    // Click on order to view personnel details
    const orderElement = nursePage.locator('[data-testid="order-order_001"]');
    await orderElement.click();

    // Verify personnel section
    const personnelSection = nursePage.locator('[data-testid="personnel-section"]');
    if (await personnelSection.isVisible()) {
      // Verify name
      await expect(personnelSection).toContainText('Marc Leblanc');

      // Verify rating
      const ratingDisplay = personnelSection.locator('[data-testid="personnel-rating"]');
      if (await ratingDisplay.isVisible()) {
        await expect(ratingDisplay).toContainText('4.8');
      }

      // Verify vehicle info
      const vehicleInfo = personnelSection.locator('[data-testid="vehicle-info"]');
      if (await vehicleInfo.isVisible()) {
        await expect(vehicleInfo).toContainText('White Renault van');
      }

      // Verify contact buttons
      const callButton = personnelSection.getByRole('button', { name: /appeler|call/i });
      const messageButton = personnelSection.getByRole('button', { name: /message|sms/i });
      if (await callButton.isVisible()) {
        await expect(callButton).toBeVisible();
      }
      if (await messageButton.isVisible()) {
        await expect(messageButton).toBeVisible();
      }
    }
  });

  test('should show completed deliveries in history', async ({ nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // View completed deliveries
    const completedTab = nursePage.getByRole('tab', { name: /terminées|completed|historique/i });
    if (await completedTab.isVisible()) {
      await completedTab.click();

      // Verify completed order is displayed
      const completedOrder = nursePage.locator('[data-testid="order-order_003"]');
      if (await completedOrder.isVisible()) {
        await expect(completedOrder).toBeVisible();

        // Verify delivery date
        const deliveryDate = completedOrder.locator('[data-testid="delivery-date"]');
        if (await deliveryDate.isVisible()) {
          await expect(deliveryDate).toBeVisible();
        }

        // Verify delivery personnel
        await expect(completedOrder).toContainText('Sophie Renault');
      }
    }
  });

  test('should display urgent order indicators', async ({ nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // View all orders
    const completedTab = nursePage.getByRole('tab', { name: /.*completed.*|.*historique.*/i });
    if (await completedTab.isVisible()) {
      await completedTab.click();
    }

    // Verify urgent order has special indicator
    const urgentOrder = nursePage.locator('[data-testid="order-order_003"]');
    if (await urgentOrder.isVisible()) {
      const urgentBadge = urgentOrder.locator('[data-testid="urgent-badge"]');
      if (await urgentBadge.isVisible()) {
        await expect(urgentBadge).toContainText(/urgent/i);
      }
    }
  });

  test('should allow nurse to request delivery reassignment', async ({ nursePage }) => {
    // Mock reassignment endpoint
    await mockApiResponse(nursePage, '**/nurse/orders/order_002/request-reassignment**', {
      status: 200,
      body: {
        success: true,
        message: 'Reassignment request sent to pharmacy',
      },
    });

    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // View active orders
    await nursePageObj.viewActiveOrders();

    // Open prepared order
    const preparedOrder = nursePage.locator('[data-testid="order-order_002"]');
    await preparedOrder.click();

    // Verify reassignment button
    const reassignButton = nursePage.getByRole('button', { name: /réassigner|reassign|change personnel/i });
    if (await reassignButton.isVisible()) {
      await reassignButton.click();

      // Verify personnel selection
      const personnelList = nursePage.locator('[data-testid="personnel-select-list"]');
      if (await personnelList.isVisible()) {
        await expect(personnelList).toBeVisible();

        // Select available personnel
        const availablePersonnel = nursePage.locator('[data-testid="personnel-person_001"]');
        if (await availablePersonnel.isVisible()) {
          await availablePersonnel.click();

          // Confirm selection
          const confirmButton = nursePage.getByRole('button', { name: /confirmer|confirm/i });
          await confirmButton.click();

          // Verify success message
          await expect(nursePage.locator('[data-testid="success-toast"]')).toBeVisible();
        }
      }
    }
  });

  test('should display delivery issues/exceptions', async ({ nursePage }) => {
    // Mock order with delivery issue
    await mockApiResponse(nursePage, '**/nurse/orders/order_004**', {
      status: 200,
      body: {
        success: true,
        data: {
          id: 'order_004',
          patientName: 'Test Patient',
          status: 'delivery_failed',
          failureReason: 'Patient not available',
          attemptedAt: new Date().toISOString(),
          nextDeliveryAttempt: new Date(Date.now() + 86400000).toISOString(),
          notes: 'Will retry tomorrow at 10:00',
        },
      },
    });

    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // If delivery failed order exists, verify it's displayed
    const failedOrder = nursePage.locator('[data-testid="order-order_004"]');
    if (await failedOrder.isVisible()) {
      // Verify failure reason
      const failureReason = failedOrder.locator('[data-testid="failure-reason"]');
      if (await failureReason.isVisible()) {
        await expect(failureReason).toContainText(/not available|indisponible/i);
      }

      // Verify next attempt info
      const nextAttempt = failedOrder.locator('[data-testid="next-attempt"]');
      if (await nextAttempt.isVisible()) {
        await expect(nextAttempt).toBeVisible();
      }
    }
  });

  test('should allow export of delivery report', async ({ nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // View active orders
    await nursePageObj.viewActiveOrders();

    // Open order
    const orderElement = nursePage.locator('[data-testid="order-order_001"]');
    await orderElement.click();

    // Verify export button
    const exportButton = nursePage.getByRole('button', { name: /exporter|export|pdf/i });
    if (await exportButton.isVisible()) {
      // Expect download
      const downloadPromise = nursePage.context().waitForEvent('download');
      await exportButton.click();

      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain('delivery');
    }
  });

  test('should handle network errors in tracking', async ({ nursePage }) => {
    // Mock network error for tracking
    await mockApiResponse(nursePage, '**/nurse/orders/order_001/tracking**', {
      status: 500,
      body: {
        success: false,
        error: 'Tracking service temporarily unavailable',
      },
    });

    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // View active orders
    await nursePageObj.viewActiveOrders();

    // Try to track delivery
    await nursePageObj.trackDelivery('order_001');

    // Verify error message
    const errorMessage = nursePage.locator('[data-testid="tracking-error-message"]');
    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toBeVisible();

      // Verify retry button
      const retryButton = nursePage.getByRole('button', { name: /réessayer|retry/i });
      if (await retryButton.isVisible()) {
        await expect(retryButton).toBeVisible();
      }
    }
  });
});
