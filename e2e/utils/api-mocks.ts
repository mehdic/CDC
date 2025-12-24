import { Page, Route } from '@playwright/test';

/**
 * API Mocking Utilities
 * Mock API responses for E2E testing
 */

export class APIMocks {
  /**
   * Mock login endpoint
   */
  static async mockLoginEndpoint(page: Page, shouldSucceed = true) {
    await page.route('**/api/auth/login', async (route: Route) => {
      if (shouldSucceed) {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            token: 'test-token-123',
            refreshToken: 'test-refresh-token-456',
            user: {
              id: 'user-001',
              email: 'test@example.com',
              role: 'PATIENT',
            },
          }),
        });
      } else {
        await route.fulfill({
          status: 401,
          body: JSON.stringify({
            error: 'Unauthorized',
            message: 'Invalid credentials',
          }),
        });
      }
    });
  }

  /**
   * Mock prescriptions endpoint
   */
  static async mockPrescriptionsEndpoint(page: Page) {
    await page.route('**/api/prescriptions', async (route: Route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          prescriptions: [
            {
              id: 'rx-001',
              medication: 'Amoxicillin 500mg',
              quantity: 30,
              status: 'ACTIVE',
              expiryDate: '2025-12-31',
            },
            {
              id: 'rx-002',
              medication: 'Ibuprofen 400mg',
              quantity: 50,
              status: 'PENDING',
              expiryDate: '2025-12-25',
            },
          ],
        }),
      });
    });
  }

  /**
   * Mock appointments endpoint
   */
  static async mockAppointmentsEndpoint(page: Page) {
    await page.route('**/api/appointments', async (route: Route) => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          appointments: [
            {
              id: 'apt-001',
              type: 'TELECONSULTATION',
              date: futureDate.toISOString(),
              status: 'CONFIRMED',
              professional: 'Marie Martin (Pharmacist)',
            },
          ],
        }),
      });
    });
  }

  /**
   * Mock messages endpoint
   */
  static async mockMessagesEndpoint(page: Page) {
    await page.route('**/api/messages', async (route: Route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          messages: [
            {
              id: 'msg-001',
              sender: 'pharmacist-001',
              senderName: 'Marie Martin',
              subject: 'Prescription Status',
              content: 'Your prescription is ready for pickup.',
              timestamp: new Date().toISOString(),
              read: false,
            },
          ],
        }),
      });
    });
  }

  /**
   * Mock inventory endpoint
   */
  static async mockInventoryEndpoint(page: Page) {
    await page.route('**/api/inventory', async (route: Route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          items: [
            {
              id: 'prod-001',
              name: 'Amoxicillin 500mg',
              quantity: 100,
              reorderLevel: 20,
              expiryDate: '2025-12-31',
              status: 'IN_STOCK',
            },
            {
              id: 'prod-002',
              name: 'Ibuprofen 400mg',
              quantity: 15,
              reorderLevel: 20,
              expiryDate: '2026-01-15',
              status: 'LOW_STOCK',
            },
          ],
        }),
      });
    });
  }

  /**
   * Mock user profile endpoint
   */
  static async mockUserProfileEndpoint(page: Page) {
    await page.route('**/api/user/profile', async (route: Route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          user: {
            id: 'user-001',
            email: 'patient@test.metapharm.ch',
            firstName: 'Jean',
            lastName: 'Dupont',
            role: 'PATIENT',
            phone: '+41791234567',
          },
        }),
      });
    });
  }

  /**
   * Mock delivery orders endpoint
   */
  static async mockDeliveryOrdersEndpoint(page: Page) {
    await page.route('**/api/delivery/orders', async (route: Route) => {
      const tomorrowDate = new Date();
      tomorrowDate.setDate(tomorrowDate.getDate() + 1);

      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          orders: [
            {
              id: 'order-001',
              patientName: 'Jean Dupont',
              address: 'Rue du Centre 42, 1200 Genève',
              scheduledTime: tomorrowDate.toISOString(),
              status: 'PENDING',
              items: ['Amoxicillin 500mg x1'],
            },
          ],
        }),
      });
    });
  }

  /**
   * Mock search endpoint
   */
  static async mockSearchEndpoint(page: Page) {
    await page.route('**/api/search*', async (route: Route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          results: [
            {
              id: 'res-001',
              type: 'medication',
              name: 'Amoxicillin 500mg',
            },
          ],
        }),
      });
    });
  }

  /**
   * Mock error endpoint
   */
  static async mockErrorEndpoint(page: Page, statusCode = 500) {
    await page.route('**/api/error/**', async (route: Route) => {
      await route.fulfill({
        status: statusCode,
        body: JSON.stringify({
          error: 'Internal Server Error',
          message: 'An unexpected error occurred',
        }),
      });
    });
  }

  /**
   * Abort all requests matching pattern
   */
  static async abortRequests(page: Page, pattern: string) {
    await page.route(pattern, (route: Route) => route.abort('failed'));
  }

  /**
   * Delay responses by duration
   */
  static async delayResponses(page: Page, pattern: string, delayMs: number) {
    await page.route(pattern, async (route: Route) => {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      await route.continue();
    });
  }

  /**
   * Intercept and log requests
   */
  static async logRequests(page: Page) {
    const requests: { method: string; url: string; status?: number }[] = [];

    page.on('request', (request) => {
      requests.push({
        method: request.method(),
        url: request.url(),
      });
    });

    page.on('response', (response) => {
      const req = requests.find((r) => r.url === response.url());
      if (req) {
        req.status = response.status();
      }
    });

    return requests;
  }

  /**
   * Mock file upload
   */
  static async mockFileUpload(page: Page, inputSelector: string, fileName: string, fileContent: string) {
    const fileInput = await page.$(inputSelector);
    if (fileInput) {
      const buffer = Buffer.from(fileContent);
      await page.evaluate((selector) => {
        const input = document.querySelector(selector) as HTMLInputElement;
        if (input) {
          input.style.display = 'block';
        }
      }, inputSelector);
    }
  }

  /**
   * Mock nurse patients endpoint
   */
  static async mockNursePatientsEndpoint(page: Page) {
    await page.route('**/api/nurse/patients', async (route: Route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          patients: [
            {
              id: 'patient-001',
              firstName: 'Jean',
              lastName: 'Dupont',
              age: 45,
              room: '201A',
              allergies: ['Penicillin', 'Peanuts'],
              activeMedications: [
                {
                  id: 'med-001',
                  name: 'Ibuprofen 400mg',
                  dosage: '400mg',
                  frequency: 'Twice daily',
                  startDate: '2025-12-01',
                },
              ],
            },
            {
              id: 'patient-002',
              firstName: 'Marie',
              lastName: 'Dubois',
              age: 62,
              room: '202B',
              allergies: [],
              activeMedications: [],
            },
          ],
        }),
      });
    });
  }

  /**
   * Mock nurse medication order endpoint
   */
  static async mockNurseMedicationOrderEndpoint(page: Page) {
    await page.route('**/api/nurse/medications/order', async (route: Route) => {
      await route.fulfill({
        status: 201,
        body: JSON.stringify({
          orderId: 'order-new-001',
          status: 'PENDING',
          message: 'Medication order submitted successfully',
        }),
      });
    });
  }

  /**
   * Mock patient medical records endpoint
   */
  static async mockPatientMedicalRecordsEndpoint(page: Page) {
    await page.route('**/api/nurse/patients/*/records', async (route: Route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          records: [
            {
              id: 'record-001',
              date: '2025-12-01',
              type: 'Consultation',
              diagnosis: 'Hypertension',
              notes: 'Patient presents with elevated blood pressure',
            },
            {
              id: 'record-002',
              date: '2025-11-15',
              type: 'Lab Results',
              diagnosis: 'Normal',
              notes: 'All vitals within normal range',
            },
          ],
        }),
      });
    });
  }

  /**
   * Mock all nurse endpoints (convenience method)
   */
  static async mockAllNurseEndpoints(page: Page) {
    await this.mockNursePatientsEndpoint(page);
    await this.mockNurseMedicationOrderEndpoint(page);
    await this.mockPatientMedicalRecordsEndpoint(page);
  }
}
