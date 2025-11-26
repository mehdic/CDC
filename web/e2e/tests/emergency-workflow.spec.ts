import { test, expect, testUsers } from '../fixtures/auth.fixture';
import { PrescriptionPage, DeliveryPage, NursePage } from '../page-objects';
import { mockApiResponse } from '../utils/api-mock';
import { login, clearAuth } from '../utils/auth-helpers';

/**
 * E2E-030: Emergency Workflow Testing
 *
 * Tests emergency and urgent workflows across the platform:
 * 1. Urgent prescription from doctor with immediate pharmacy notification
 * 2. Pharmacist expedited processing for urgent orders
 * 3. Priority delivery dispatch with route optimization
 * 4. Real-time tracking for urgent deliveries
 * 5. Emergency medication ordering by nurse
 * 6. After-hours emergency handling
 */

test.describe('E2E-030: Emergency Workflow Testing', () => {
  const urgentPrescriptionId = 'rx_urgent_001';
  const emergencyOrderId = 'order_emergency_001';
  const priorityDeliveryId = 'delivery_priority_001';
  const patientId = 'patient_emergency_001';

  test.beforeEach(async ({ page }) => {
    // Mock patient with emergency context
    await mockApiResponse(page, `**/patients/${patientId}`, {
      status: 200,
      body: {
        success: true,
        data: {
          id: patientId,
          name: 'Marie Rousseau',
          dateOfBirth: '1965-08-22',
          chronicConditions: ['Severe Asthma'],
          allergies: ['Penicillin'],
          emergencyContact: {
            name: 'Jean Rousseau',
            phone: '+41 79 987 65 43',
            relationship: 'Spouse',
          },
        },
      },
    });
  });

  /**
   * Scenario 1: Doctor creates urgent prescription with immediate notification
   */
  test('should allow doctor to create urgent prescription with immediate pharmacy alert', async ({ page }) => {
    // Login as doctor
    await page.goto('/');
    await login(page, testUsers.doctor);

    // Mock patient critical condition
    await mockApiResponse(page, `**/doctor/patients/${patientId}`, {
      status: 200,
      body: {
        success: true,
        data: {
          id: patientId,
          name: 'Marie Rousseau',
          recentVitals: {
            oxygenSaturation: 89, // Low - emergency
            heartRate: 110,
            timestamp: new Date().toISOString(),
          },
          activeConditions: ['Severe Asthma Exacerbation'],
        },
      },
    });

    // Mock urgent prescription creation
    await mockApiResponse(page, '**/doctor/prescriptions', {
      status: 201,
      body: {
        success: true,
        prescriptionId: urgentPrescriptionId,
        urgencyLevel: 'emergency',
        estimatedPharmacyPreparationTime: 15, // minutes
        notificationsSent: ['pharmacist', 'patient'],
      },
    });

    // Navigate to patient
    await page.getByRole('link', { name: /patients/i }).click();
    await page.locator(`[data-testid="patient-${patientId}"]`).click();

    // Verify critical vitals alert
    await expect(page.locator('[data-testid="critical-alert"]')).toBeVisible();
    await expect(page.getByText(/oxygen saturation.*89%|SpO2.*89%/i)).toBeVisible();

    // Create prescription
    await page.getByRole('button', { name: /nouvelle ordonnance|new prescription|emergency/i }).click();

    // Mark as URGENT
    await page.locator('[data-testid="urgency-level"]').selectOption('emergency');

    // Add emergency medication
    await page.locator('[data-testid="medication-search"]').fill('Prednisolone');
    await page.locator('[data-testid="medication-result-Prednisolone"]').click();
    await page.locator('[data-testid="dosage"]').fill('60mg');
    await page.locator('[data-testid="frequency"]').fill('Once daily for 5 days then taper');
    await page.locator('[data-testid="urgent-instructions"]').fill('EMERGENCY - Patient having severe asthma attack. O2 sat 89%. Needs immediate treatment.');

    // Add second critical medication
    await page.getByRole('button', { name: /ajouter médicament|add medication/i }).click();
    await page.locator('[data-testid="medication-search"]').fill('Salbutamol Inhaler');
    await page.locator('[data-testid="medication-result-Salbutamol"]').click();
    await page.locator('[data-testid="instructions"]').fill('2 puffs every 4 hours as needed');

    // Select nearest pharmacy
    await page.locator('[data-testid="pharmacy-selector"]').selectOption('nearest');

    // Verify emergency notification preview
    await expect(page.locator('[data-testid="emergency-notification-preview"]')).toBeVisible();
    await expect(page.getByText(/pharmacist will be notified immediately/i)).toBeVisible();
    await expect(page.getByText(/SMS \+ Phone call/i)).toBeVisible();

    // Submit urgent prescription
    await page.getByRole('button', { name: /envoyer urgent|send emergency|submit/i }).click();

    // Verify immediate confirmation
    await expect(page.locator('[data-testid="urgent-confirmation"]')).toBeVisible();
    await expect(page.getByText(/15 minutes|15 min/i)).toBeVisible(); // Prep time
    await expect(page.locator('[data-testid="prescription-id"]')).toContainText(urgentPrescriptionId);

    // Verify notification status
    await expect(page.locator('[data-testid="notifications-sent"]')).toBeVisible();
    await expect(page.getByText(/pharmacist notified|pharmacien notifié/i)).toBeVisible();
    await expect(page.getByText(/patient notified|patient notifié/i)).toBeVisible();

    await clearAuth(page);
  });

  /**
   * Scenario 2: Pharmacist receives and expedites urgent prescription
   */
  test('should allow pharmacist to receive urgent alert and expedite processing', async ({ page }) => {
    // Login as pharmacist
    await page.goto('/');
    await login(page, testUsers.pharmacist);

    // Mock urgent notification (simulating real-time)
    await mockApiResponse(page, '**/pharmacist/notifications/real-time', {
      status: 200,
      body: {
        success: true,
        urgentAlert: true,
        notification: {
          id: 'notif_urgent_001',
          type: 'emergency_prescription',
          prescriptionId: urgentPrescriptionId,
          patientName: 'Marie Rousseau',
          doctorName: 'Dr. Jean Martin',
          condition: 'Severe Asthma Exacerbation',
          urgencyLevel: 'emergency',
          requiredWithin: 30, // minutes
        },
      },
    });

    // Mock prescription details
    await mockApiResponse(page, `**/prescriptions/${urgentPrescriptionId}`, {
      status: 200,
      body: {
        success: true,
        data: {
          id: urgentPrescriptionId,
          patientName: 'Marie Rousseau',
          patientPhone: '+41 79 456 78 90',
          doctorName: 'Dr. Jean Martin',
          urgencyLevel: 'emergency',
          createdAt: new Date().toISOString(),
          requiredWithin: 30,
          medications: [
            {
              name: 'Prednisolone',
              dosage: '60mg',
              quantity: 5,
              inStock: true,
              urgentInstructions: 'EMERGENCY - Patient having severe asthma attack. O2 sat 89%.',
            },
            {
              name: 'Salbutamol Inhaler',
              dosage: '100mcg',
              quantity: 1,
              inStock: true,
            },
          ],
          patientVitals: {
            oxygenSaturation: 89,
            heartRate: 110,
          },
        },
      },
    });

    // Mock expedited processing
    await mockApiResponse(page, `**/prescriptions/${urgentPrescriptionId}/expedite`, {
      status: 200,
      body: {
        success: true,
        status: 'preparing',
        priorityLevel: 1,
        estimatedCompletion: new Date(Date.now() + 600000).toISOString(), // 10 min
      },
    });

    // Simulate urgent notification alert
    // In real app, this would be a WebSocket push notification
    await page.evaluate(() => {
      const event = new CustomEvent('urgent-prescription-alert', {
        detail: {
          prescriptionId: 'rx_urgent_001',
          urgencyLevel: 'emergency',
        },
      });
      window.dispatchEvent(event);
    });

    // Verify urgent alert modal appears
    await expect(page.locator('[data-testid="urgent-alert-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="emergency-badge"]')).toBeVisible();
    await expect(page.getByText('Marie Rousseau')).toBeVisible();
    await expect(page.getByText('Severe Asthma Exacerbation')).toBeVisible();

    // Verify countdown timer
    await expect(page.locator('[data-testid="urgency-timer"]')).toBeVisible();
    await expect(page.locator('[data-testid="urgency-timer"]')).toContainText(/30|29|28/); // Minutes remaining

    // Click to view prescription
    await page.getByRole('button', { name: /voir|view|open/i }).click();

    // Verify prescription details with emergency context
    await expect(page.locator('[data-testid="prescription-details"]')).toBeVisible();
    await expect(page.locator('[data-testid="emergency-banner"]')).toBeVisible();
    await expect(page.getByText('O2 sat 89%')).toBeVisible();

    // Verify patient vitals displayed
    await expect(page.locator('[data-testid="patient-vitals"]')).toBeVisible();
    await expect(page.getByText('89%')).toBeVisible(); // Oxygen saturation
    await expect(page.getByText('110')).toBeVisible(); // Heart rate

    // Check stock - both available
    await expect(page.locator('[data-testid="stock-status-Prednisolone"]')).toContainText(/in stock|disponible/i);
    await expect(page.locator('[data-testid="stock-status-Salbutamol"]')).toContainText(/in stock|disponible/i);

    // Expedite processing (skip normal validation steps for emergency)
    await page.getByRole('button', { name: /traiter en urgence|expedite|start immediately/i }).click();

    // Confirm expedited processing
    await expect(page.locator('[data-testid="expedite-confirmation"]')).toBeVisible();
    await expect(page.getByText(/skip standard review|accéléré/i)).toBeVisible();
    await page.getByRole('button', { name: /confirmer|confirm/i }).click();

    // Verify status updated to preparing
    await expect(page.locator('[data-testid="prescription-status"]')).toContainText(/preparing|préparation/i);
    await expect(page.locator('[data-testid="priority-badge"]')).toContainText('Priority 1');

    // Verify estimated completion time
    await expect(page.locator('[data-testid="estimated-completion"]')).toContainText(/10 min/i);

    await clearAuth(page);
  });

  /**
   * Scenario 3: Priority delivery dispatch with optimized route
   */
  test('should dispatch priority delivery with optimized route for urgent medication', async ({ page }) => {
    // Login as pharmacist
    await page.goto('/');
    await login(page, testUsers.pharmacist);

    // Mock completed urgent prescription
    await mockApiResponse(page, `**/prescriptions/${urgentPrescriptionId}`, {
      status: 200,
      body: {
        success: true,
        data: {
          id: urgentPrescriptionId,
          patientName: 'Marie Rousseau',
          patientAddress: 'Rue du Rhône 25, 1204 Genève',
          patientPhone: '+41 79 456 78 90',
          status: 'ready_for_delivery',
          urgencyLevel: 'emergency',
          medications: ['Prednisolone 60mg x5', 'Salbutamol Inhaler'],
        },
      },
    });

    // Mock available drivers
    await mockApiResponse(page, '**/delivery/drivers/available', {
      status: 200,
      body: {
        success: true,
        data: [
          {
            id: 'driver_001',
            name: 'Pierre Leclerc',
            currentLocation: {
              latitude: 46.2044,
              longitude: 6.1432,
            },
            distanceKm: 1.2,
            estimatedArrival: 5, // minutes
            activeDeliveries: 0,
          },
          {
            id: 'driver_002',
            name: 'Marc Dubois',
            currentLocation: {
              latitude: 46.2100,
              longitude: 6.1500,
            },
            distanceKm: 3.5,
            estimatedArrival: 12,
            activeDeliveries: 1,
          },
        ],
      },
    });

    // Mock priority delivery creation
    await mockApiResponse(page, '**/delivery/create', {
      status: 201,
      body: {
        success: true,
        deliveryId: priorityDeliveryId,
        driverId: 'driver_001',
        driverName: 'Pierre Leclerc',
        priority: 'emergency',
        estimatedArrival: new Date(Date.now() + 300000).toISOString(), // 5 min
        routeOptimized: true,
      },
    });

    // Navigate to prescription
    await page.getByRole('link', { name: /prescriptions|ordonnances/i }).click();
    await page.locator(`[data-testid="prescription-${urgentPrescriptionId}"]`).click();

    // Click dispatch delivery
    await page.getByRole('button', { name: /livraison|delivery|dispatch/i }).click();

    // Verify priority delivery mode
    await expect(page.locator('[data-testid="delivery-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="priority-mode-active"]')).toBeVisible();
    await expect(page.getByText(/emergency delivery|livraison urgente/i)).toBeVisible();

    // Verify available drivers sorted by proximity
    const driverList = page.locator('[data-testid="driver-list"]');
    await expect(driverList.locator('[data-testid="driver-driver_001"]')).toBeVisible();
    await expect(driverList.getByText('Pierre Leclerc')).toBeVisible();
    await expect(driverList.getByText('1.2 km')).toBeVisible();
    await expect(driverList.getByText('5 min')).toBeVisible();

    // System auto-selects nearest available driver
    await expect(page.locator('[data-testid="driver-driver_001"]')).toHaveClass(/selected|active/);

    // Verify route optimization info
    await expect(page.locator('[data-testid="route-info"]')).toBeVisible();
    await expect(page.getByText(/direct route|route directe/i)).toBeVisible();

    // Add delivery instructions
    await page.locator('[data-testid="delivery-instructions"]').fill('EMERGENCY DELIVERY - Ring doorbell immediately. Call patient if no answer. Do not leave package unattended.');

    // Confirm dispatch
    await page.getByRole('button', { name: /confirmer|dispatch|send/i }).click();

    // Verify dispatch confirmation
    await expect(page.locator('[data-testid="dispatch-confirmation"]')).toBeVisible();
    await expect(page.getByText('Pierre Leclerc')).toBeVisible();
    await expect(page.getByText(/5 minutes|5 min/i)).toBeVisible();

    // Verify patient notified
    await expect(page.locator('[data-testid="patient-notified"]')).toBeVisible();
    await expect(page.getByText(/SMS sent|SMS envoyé/i)).toBeVisible();

    await clearAuth(page);
  });

  /**
   * Scenario 4: Real-time tracking for urgent delivery with patient alerts
   */
  test('should provide real-time tracking for urgent delivery with frequent patient updates', async ({ page }) => {
    // Login as patient
    await page.goto('/');
    await login(page, testUsers.patient);

    // Mock active urgent delivery
    await mockApiResponse(page, '**/patient/deliveries/active', {
      status: 200,
      body: {
        success: true,
        data: [
          {
            id: priorityDeliveryId,
            prescriptionId: urgentPrescriptionId,
            priority: 'emergency',
            medications: ['Prednisolone 60mg x5', 'Salbutamol Inhaler'],
            driverName: 'Pierre Leclerc',
            driverPhone: '+41 79 123 45 67',
            status: 'in_transit',
            estimatedArrival: new Date(Date.now() + 180000).toISOString(), // 3 min
            currentLocation: {
              latitude: 46.2044,
              longitude: 6.1432,
            },
            destinationAddress: 'Rue du Rhône 25, 1204 Genève',
          },
        ],
      },
    });

    // Mock real-time location updates
    await mockApiResponse(page, `**/patient/deliveries/${priorityDeliveryId}/track`, {
      status: 200,
      body: {
        success: true,
        location: {
          latitude: 46.2050,
          longitude: 6.1440,
          timestamp: new Date().toISOString(),
          distanceRemaining: 0.5, // km
          timeRemaining: 3, // minutes
        },
      },
    });

    // Patient should see urgent delivery notification
    await expect(page.locator('[data-testid="urgent-delivery-banner"]')).toBeVisible();
    await expect(page.getByText(/emergency medication|médicament urgent/i)).toBeVisible();

    // Click to track
    await page.getByRole('button', { name: /suivre|track|view delivery/i }).click();

    // Verify tracking page with priority indicator
    await expect(page.locator('[data-testid="tracking-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="priority-badge"]')).toBeVisible();
    await expect(page.locator('[data-testid="priority-badge"]')).toContainText('URGENT');

    // Verify map with driver location
    await expect(page.locator('[data-testid="delivery-map"]')).toBeVisible();
    await expect(page.locator('[data-testid="driver-marker"]')).toBeVisible();
    await expect(page.locator('[data-testid="destination-marker"]')).toBeVisible();

    // Verify ETA prominently displayed
    await expect(page.locator('[data-testid="eta-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="eta-display"]')).toContainText('3 min');
    await expect(page.locator('[data-testid="eta-display"]')).toHaveClass(/urgent|priority|emergency/);

    // Verify driver contact info
    await expect(page.locator('[data-testid="driver-info"]')).toBeVisible();
    await expect(page.getByText('Pierre Leclerc')).toBeVisible();
    await expect(page.getByText('+41 79 123 45 67')).toBeVisible();

    // Verify call driver button
    await expect(page.getByRole('button', { name: /appeler|call driver/i })).toBeVisible();

    // Verify medication details
    await expect(page.getByText('Prednisolone 60mg')).toBeVisible();
    await expect(page.getByText('Salbutamol Inhaler')).toBeVisible();

    // Verify delivery instructions visible
    await expect(page.getByText(/Ring doorbell immediately/i)).toBeVisible();

    await clearAuth(page);
  });

  /**
   * Scenario 5: Emergency medication ordering by nurse for critical patient
   */
  test('should allow nurse to place emergency medication order with immediate pharmacy response', async ({ page }) => {
    // Login as nurse
    await page.goto('/');
    await login(page, testUsers.nurse);

    // Mock critical patient
    await mockApiResponse(page, `**/nurse/patients/${patientId}`, {
      status: 200,
      body: {
        success: true,
        data: {
          id: patientId,
          name: 'Marie Rousseau',
          room: '402',
          ward: 'ICU',
          status: 'critical',
          currentVitals: {
            oxygenSaturation: 88,
            bloodPressure: '90/60',
            heartRate: 125,
            alertLevel: 'critical',
          },
          activePrescriptions: [
            {
              id: 'rx_001',
              medication: 'Epinephrine',
              dosage: '0.3mg',
              route: 'IM',
              status: 'active',
              prescribedBy: 'Dr. Martin',
            },
          ],
        },
      },
    });

    // Mock emergency order
    await mockApiResponse(page, '**/nurse/orders/emergency', {
      status: 201,
      body: {
        success: true,
        orderId: emergencyOrderId,
        status: 'emergency_processing',
        pharmacistNotified: true,
        estimatedPreparationTime: 5, // minutes
        priorityLevel: 'critical',
      },
    });

    const nursePage = new NursePage(page);
    await nursePage.goto();

    // Search for critical patient
    await nursePage.searchPatient('Marie Rousseau');
    await nursePage.selectPatient(patientId);

    // Verify critical status alert
    await expect(page.locator('[data-testid="critical-patient-alert"]')).toBeVisible();
    await expect(page.getByText(/ICU|critical|critique/i)).toBeVisible();

    // View patient vitals
    await expect(page.locator('[data-testid="vitals-panel"]')).toBeVisible();
    await expect(page.getByText('88%')).toBeVisible(); // O2 sat
    await expect(page.locator('[data-testid="vitals-alert"]')).toBeVisible();

    // Click emergency order button
    await page.getByRole('button', { name: /urgence|emergency order/i }).click();

    // Verify emergency order form
    await expect(page.locator('[data-testid="emergency-order-form"]')).toBeVisible();
    await expect(page.locator('[data-testid="emergency-mode-active"]')).toBeVisible();

    // Select prescription
    await page.locator('[data-testid="prescription-rx_001"]').click();

    // Verify pre-filled emergency details
    await expect(page.locator('[data-testid="patient-room"]')).toHaveValue('402');
    await expect(page.locator('[data-testid="patient-ward"]')).toHaveValue('ICU');

    // Add clinical notes
    await page.locator('[data-testid="clinical-notes"]').fill('Patient in respiratory distress. O2 sat dropping. Epinephrine needed STAT for suspected anaphylaxis.');

    // Specify required time
    await page.locator('[data-testid="required-time"]').selectOption('immediate'); // Within 5 minutes

    // Verify notification options pre-selected
    await expect(page.locator('[data-testid="notify-pharmacist-sms"]')).toBeChecked();
    await expect(page.locator('[data-testid="notify-pharmacist-call"]')).toBeChecked();

    // Submit emergency order
    await page.getByRole('button', { name: /commander|order now|emergency submit/i }).click();

    // Verify immediate confirmation
    await expect(page.locator('[data-testid="emergency-order-confirmation"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-id"]')).toContainText(emergencyOrderId);
    await expect(page.getByText(/5 minutes|5 min/i)).toBeVisible();

    // Verify pharmacist notification sent
    await expect(page.locator('[data-testid="pharmacist-notified"]')).toBeVisible();
    await expect(page.getByText(/SMS \+ Call sent|SMS \+ Appel/i)).toBeVisible();

    // Verify real-time status tracking activated
    await expect(page.locator('[data-testid="realtime-status-tracker"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-status"]')).toContainText(/emergency processing|traitement urgent/i);

    await clearAuth(page);
  });

  /**
   * Scenario 6: After-hours emergency handling
   */
  test('should handle after-hours emergency with on-call pharmacist notification', async ({ page }) => {
    // Set time to after-hours (simulated)
    const afterHoursTime = new Date();
    afterHoursTime.setHours(22, 30, 0); // 10:30 PM

    // Login as patient
    await page.goto('/');
    await login(page, testUsers.patient);

    // Mock after-hours status
    await mockApiResponse(page, '**/pharmacy/status', {
      status: 200,
      body: {
        success: true,
        isOpen: false,
        regularHours: '08:00 - 20:00',
        currentTime: afterHoursTime.toISOString(),
        emergencyService: {
          available: true,
          onCallPharmacist: {
            name: 'Marie Dupont',
            phone: '+41 79 999 88 77',
          },
          responseTime: '15-30 minutes',
        },
      },
    });

    // Mock emergency request
    await mockApiResponse(page, '**/patient/emergency-request', {
      status: 201,
      body: {
        success: true,
        requestId: 'emergency_req_001',
        status: 'on_call_notified',
        estimatedResponse: new Date(Date.now() + 900000).toISOString(), // 15 min
      },
    });

    // Patient tries to order prescription after hours
    await page.getByRole('link', { name: /prescriptions|ordonnances/i }).click();
    await page.locator(`[data-testid="prescription-${urgentPrescriptionId}"]`).click();
    await page.getByRole('button', { name: /commander|order/i }).click();

    // Verify after-hours notice
    await expect(page.locator('[data-testid="after-hours-notice"]')).toBeVisible();
    await expect(page.getByText(/closed|fermé/i)).toBeVisible();
    await expect(page.getByText(/08:00 - 20:00/i)).toBeVisible();

    // Verify emergency service option
    await expect(page.locator('[data-testid="emergency-service-option"]')).toBeVisible();
    await expect(page.getByText(/emergency service available|service d'urgence disponible/i)).toBeVisible();

    // Select emergency reason
    await page.locator('[data-testid="emergency-reason"]').selectOption('medical_emergency');
    await page.locator('[data-testid="emergency-details"]').fill('Having severe asthma attack. Cannot breathe properly. Need emergency inhaler immediately.');

    // Acknowledge response time
    await page.locator('[data-testid="acknowledge-response-time"]').check();

    // Submit emergency request
    await page.getByRole('button', { name: /demande urgence|request emergency service/i }).click();

    // Verify confirmation
    await expect(page.locator('[data-testid="emergency-request-confirmation"]')).toBeVisible();
    await expect(page.getByText('Marie Dupont')).toBeVisible();
    await expect(page.getByText('+41 79 999 88 77')).toBeVisible();
    await expect(page.getByText(/15-30 minutes|15-30 min/i)).toBeVisible();

    // Verify on-call pharmacist notified
    await expect(page.locator('[data-testid="on-call-notified"]')).toBeVisible();

    // Verify patient can call directly
    await expect(page.getByRole('button', { name: /appeler pharmacien|call pharmacist/i })).toBeVisible();

    await clearAuth(page);
  });

  /**
   * Integration scenario: Complete emergency workflow from prescription to delivery
   */
  test('should complete full emergency workflow: urgent prescription → expedited processing → priority delivery', async ({ context }) => {
    // Step 1: Doctor creates urgent prescription
    const doctorPage = await context.newPage();
    await doctorPage.goto('/');
    await login(doctorPage, testUsers.doctor);

    await mockApiResponse(doctorPage, '**/doctor/prescriptions', {
      status: 201,
      body: {
        success: true,
        prescriptionId: urgentPrescriptionId,
        urgencyLevel: 'emergency',
      },
    });

    await doctorPage.getByRole('link', { name: /patients/i }).click();
    await doctorPage.locator(`[data-testid="patient-${patientId}"]`).click();
    await doctorPage.getByRole('button', { name: /nouvelle ordonnance|new prescription/i }).click();
    await doctorPage.locator('[data-testid="urgency-level"]').selectOption('emergency');
    await doctorPage.getByRole('button', { name: /envoyer|send/i }).click();
    await expect(doctorPage.locator('[data-testid="urgent-confirmation"]')).toBeVisible();
    await doctorPage.close();

    // Step 2: Pharmacist expedites
    const pharmacistPage = await context.newPage();
    await pharmacistPage.goto('/');
    await login(pharmacistPage, testUsers.pharmacist);

    await mockApiResponse(pharmacistPage, `**/prescriptions/${urgentPrescriptionId}/expedite`, {
      status: 200,
      body: { success: true },
    });

    await pharmacistPage.evaluate(() => {
      window.dispatchEvent(new CustomEvent('urgent-prescription-alert'));
    });
    await expect(pharmacistPage.locator('[data-testid="urgent-alert-modal"]')).toBeVisible();
    await pharmacistPage.getByRole('button', { name: /voir|view/i }).click();
    await pharmacistPage.getByRole('button', { name: /traiter en urgence|expedite/i }).click();
    await pharmacistPage.getByRole('button', { name: /confirmer|confirm/i }).click();
    await expect(pharmacistPage.locator('[data-testid="prescription-status"]')).toContainText(/preparing/i);

    // Step 3: Priority delivery dispatched
    await mockApiResponse(pharmacistPage, '**/delivery/create', {
      status: 201,
      body: {
        success: true,
        deliveryId: priorityDeliveryId,
        priority: 'emergency',
      },
    });

    await pharmacistPage.getByRole('button', { name: /livraison|delivery/i }).click();
    await pharmacistPage.getByRole('button', { name: /confirmer|dispatch/i }).click();
    await expect(pharmacistPage.locator('[data-testid="dispatch-confirmation"]')).toBeVisible();
    await pharmacistPage.close();

    // Step 4: Patient tracks delivery
    const patientPage = await context.newPage();
    await patientPage.goto('/');
    await login(patientPage, testUsers.patient);

    await expect(patientPage.locator('[data-testid="urgent-delivery-banner"]')).toBeVisible();
    await patientPage.getByRole('button', { name: /suivre|track/i }).click();
    await expect(patientPage.locator('[data-testid="priority-badge"]')).toBeVisible();
    await patientPage.close();
  });
});
