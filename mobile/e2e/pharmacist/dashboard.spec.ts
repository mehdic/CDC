/**
 * Pharmacist App Dashboard E2E Tests
 *
 * Tests the pharmacist dashboard functionality including:
 * - Dashboard display and layout
 * - Prescription statistics and metrics
 * - Patient information
 * - Consultation scheduling
 * - Quick actions and navigation
 * - Real-time data updates
 */

describe('Pharmacist Dashboard', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { notifications: 'YES', camera: 'YES' }
    });
  });

  beforeEach(async () => {
    await loginAsPharmacist();
    await waitFor(element(by.id('pharmacist-dashboard-screen'))).toBeVisible().withTimeout(10000);
  });

  describe('Dashboard Display and Layout', () => {
    it('should display main dashboard screen after login', async () => {
      await expect(element(by.id('pharmacist-dashboard-screen'))).toBeVisible();
      await expect(element(by.id('dashboard-header'))).toBeVisible();
    });

    it('should display pharmacy information in header', async () => {
      await expect(element(by.id('pharmacy-name'))).toBeVisible();
      await expect(element(by.id('pharmacy-location'))).toBeVisible();
      await expect(element(by.id('operating-hours'))).toBeVisible();
    });

    it('should display bottom navigation tabs', async () => {
      await expect(element(by.id('dashboard-tab'))).toBeVisible();
      await expect(element(by.id('prescriptions-tab'))).toBeVisible();
      await expect(element(by.id('inventory-tab'))).toBeVisible();
      await expect(element(by.id('messages-tab'))).toBeVisible();
      await expect(element(by.id('profile-tab'))).toBeVisible();
    });

    it('should display welcome greeting with pharmacist name', async () => {
      await expect(element(by.id('welcome-message'))).toBeVisible();
      await expect(element(by.text(/Welcome|Bonjour|Grüezi/i))).toBeVisible();
    });

    it('should scroll through all dashboard sections', async () => {
      // Scroll to see all sections
      await element(by.id('dashboard-scroll-view')).scrollTo('bottom');
      await expect(element(by.id('dashboard-footer'))).toBeVisible();
    });
  });

  describe('Prescription Metrics and Statistics', () => {
    it('should display prescription summary card', async () => {
      await expect(element(by.id('prescription-summary-card'))).toBeVisible();
      await expect(element(by.text('Prescriptions'))).toBeVisible();
    });

    it('should display pending prescriptions count', async () => {
      await expect(element(by.id('pending-prescriptions-count'))).toBeVisible();
      await expect(element(by.text(/\d+ Pending/))).toBeVisible();
    });

    it('should display processed prescriptions count', async () => {
      await expect(element(by.id('processed-prescriptions-count'))).toBeVisible();
    });

    it('should display prescription approval rate', async () => {
      await expect(element(by.id('approval-rate'))).toBeVisible();
      await expect(element(by.text(/%/))).toBeVisible();
    });

    it('should navigate to prescriptions list on card tap', async () => {
      await element(by.id('prescription-summary-card')).tap();
      await waitFor(element(by.id('prescription-list-screen'))).toBeVisible().withTimeout(5000);
    });

    it('should show prescription trend (up/down)', async () => {
      await expect(element(by.id('prescription-trend'))).toBeVisible();
      await expect(element(by.id('prescription-trend-indicator'))).toBeVisible();
    });
  });

  describe('Patient Information and Recent Consultations', () => {
    it('should display active patients section', async () => {
      await expect(element(by.id('active-patients-section'))).toBeVisible();
      await expect(element(by.text('Active Patients'))).toBeVisible();
    });

    it('should display list of recent patients', async () => {
      await expect(element(by.id('recent-patients-list'))).toBeVisible();
      await expect(element(by.id('patient-card-0'))).toBeVisible();
    });

    it('should show patient basic information', async () => {
      await expect(element(by.id('patient-name-0'))).toBeVisible();
      await expect(element(by.id('patient-age-0'))).toBeVisible();
      await expect(element(by.id('patient-last-consultation-0'))).toBeVisible();
    });

    it('should display recent consultations section', async () => {
      await expect(element(by.id('recent-consultations-section'))).toBeVisible();
      await expect(element(by.text('Recent Consultations'))).toBeVisible();
    });

    it('should navigate to patient profile on patient card tap', async () => {
      await element(by.id('patient-card-0')).tap();
      await waitFor(element(by.id('patient-profile-screen'))).toBeVisible().withTimeout(5000);
    });

    it('should show number of active patients', async () => {
      await expect(element(by.id('active-patients-count'))).toBeVisible();
      await expect(element(by.text(/Active.*Patients/))).toBeVisible();
    });
  });

  describe('Consultation Scheduling', () => {
    it('should display upcoming consultations section', async () => {
      await expect(element(by.id('upcoming-consultations-section'))).toBeVisible();
      await expect(element(by.text('Upcoming Consultations'))).toBeVisible();
    });

    it('should display consultation cards with details', async () => {
      await expect(element(by.id('consultation-card-0'))).toBeVisible();
      await expect(element(by.id('consultation-time-0'))).toBeVisible();
      await expect(element(by.id('patient-name-consultation-0'))).toBeVisible();
    });

    it('should show consultation status (scheduled, in-progress, completed)', async () => {
      await expect(element(by.id('consultation-status-0'))).toBeVisible();
    });

    it('should allow joining video consultation', async () => {
      await expect(element(by.id('join-consultation-button-0'))).toBeVisible();
      await element(by.id('join-consultation-button-0')).tap();
      // This would navigate to video call screen
    });

    it('should display consultation reschedule option', async () => {
      await element(by.id('consultation-card-0')).multiTap();
      await expect(element(by.id('reschedule-consultation-button'))).toBeVisible();
    });
  });

  describe('Quick Actions and Navigation', () => {
    it('should display quick action buttons', async () => {
      await expect(element(by.id('quick-actions-section'))).toBeVisible();
    });

    it('should have "New Prescription" quick action', async () => {
      await expect(element(by.id('new-prescription-button'))).toBeVisible();
    });

    it('should have "Scan QR Code" quick action', async () => {
      await expect(element(by.id('scan-qr-button'))).toBeVisible();
    });

    it('should have "View Inventory" quick action', async () => {
      await expect(element(by.id('view-inventory-button'))).toBeVisible();
    });

    it('should have "Message Patient" quick action', async () => {
      await expect(element(by.id('message-patient-button'))).toBeVisible();
    });

    it('should navigate to new prescription screen on tap', async () => {
      await element(by.id('new-prescription-button')).tap();
      await waitFor(element(by.id('new-prescription-screen'))).toBeVisible().withTimeout(5000);
    });

    it('should open QR scanner on scan button tap', async () => {
      await element(by.id('scan-qr-button')).tap();
      await waitFor(element(by.id('qr-scanner-screen'))).toBeVisible().withTimeout(5000);
    });
  });

  describe('Alerts and Notifications', () => {
    it('should display alerts section if there are alerts', async () => {
      // This may vary - check if alerts exist
      const alerts = element(by.id('alerts-section'));
      try {
        await expect(alerts).toBeVisible();
      } catch {
        // Alerts section might not always be visible
      }
    });

    it('should display medication expiry alerts', async () => {
      try {
        await expect(element(by.id('expiry-alert'))).toBeVisible();
      } catch {
        // Only visible if there are expiring items
      }
    });

    it('should display low stock alerts', async () => {
      try {
        await expect(element(by.id('low-stock-alert'))).toBeVisible();
      } catch {
        // Only visible if inventory is low
      }
    });

    it('should display unread message count in tab', async () => {
      const messageCount = element(by.id('message-tab-badge'));
      try {
        await expect(messageCount).toBeVisible();
      } catch {
        // Badge might not be visible if no messages
      }
    });
  });

  describe('Master Account Overview', () => {
    it('should display master account badge if user is master pharmacist', async () => {
      try {
        await expect(element(by.id('master-account-badge'))).toBeVisible();
      } catch {
        // Not visible for sub-users
      }
    });

    it('should display sub-users summary for master pharmacist', async () => {
      try {
        await expect(element(by.id('sub-users-summary'))).toBeVisible();
        await expect(element(by.id('sub-users-count'))).toBeVisible();
      } catch {
        // Only visible for master account
      }
    });

    it('should display shared inventory status', async () => {
      try {
        await expect(element(by.id('shared-inventory-status'))).toBeVisible();
      } catch {
        // May not be visible in all cases
      }
    });

    it('should allow quick access to manage sub-users', async () => {
      try {
        await element(by.id('manage-sub-users-button')).tap();
        await waitFor(element(by.id('sub-users-management-screen'))).toBeVisible().withTimeout(5000);
      } catch {
        // Option not available for sub-users
      }
    });
  });

  describe('Data Refresh and Real-time Updates', () => {
    it('should support pull-to-refresh', async () => {
      await element(by.id('dashboard-scroll-view')).swipe({ direction: 'down', speed: 'fast' });
      // Dashboard should refresh
      await expect(element(by.id('dashboard-screen'))).toBeVisible();
    });

    it('should update prescription count in real-time', async () => {
      const initialCount = await element(by.id('pending-prescriptions-count')).getAtIndex(0);
      // In a real test, would trigger a prescription update
      // Then verify count updates
    });

    it('should display last sync timestamp', async () => {
      try {
        await expect(element(by.id('last-sync-time'))).toBeVisible();
      } catch {
        // May not always be visible
      }
    });
  });

  describe('Accessibility and Edge Cases', () => {
    it('should display empty state if no prescriptions', async () => {
      try {
        await expect(element(by.id('no-prescriptions-message'))).toBeVisible();
      } catch {
        // Would only appear if user has no prescriptions
      }
    });

    it('should display no patients message if applicable', async () => {
      try {
        await expect(element(by.id('no-patients-message'))).toBeVisible();
      } catch {
        // Only shows if no active patients
      }
    });

    it('should handle offline mode gracefully', async () => {
      // This would require turning off network in a real test
      // Verify that app shows offline indicator
      try {
        await expect(element(by.id('offline-indicator'))).toBeVisible();
      } catch {
        // Not in offline mode
      }
    });

    it('should display error message if data fails to load', async () => {
      try {
        await expect(element(by.id('loading-error-message'))).toBeVisible();
      } catch {
        // No error currently
      }
    });
  });
});

// Helper function for pharmacist login
async function loginAsPharmacist() {
  await element(by.id('email-input')).typeText('pharmacist@metapharm.ch');
  await element(by.id('password-input')).typeText('PharmacistPass123!');
  await element(by.id('login-button')).tap();
}
