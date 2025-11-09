import { test, expect } from '../fixtures/auth.fixture';
import { TeleconsultationPage } from '../page-objects';
import { mockApiResponse } from '../utils/api-mock';

test.describe('Teleconsultation', () => {
  test.beforeEach(async ({ page }) => {
    // Mock consultations list
    await mockApiResponse(page, '**/consultations**', {
      status: 200,
      body: {
        success: true,
        data: [
          {
            id: 'consult_001',
            patientName: 'Sophie Bernard',
            scheduledAt: new Date(Date.now() + 3600000).toISOString(),
            status: 'upcoming',
          },
          {
            id: 'consult_002',
            patientName: 'Marc Dubois',
            scheduledAt: new Date(Date.now() - 3600000).toISOString(),
            status: 'completed',
          },
        ],
        total: 2,
      },
    });
  });

  test('should display consultation list', async ({ pharmacistPage }) => {
    const consultationPage = new TeleconsultationPage(pharmacistPage);
    await consultationPage.goto();

    await consultationPage.expectPageLoaded();
    await expect(consultationPage.consultationList).toBeVisible();
  });

  test('should book new teleconsultation appointment', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/consultations/book', {
      status: 200,
      body: {
        success: true,
        consultationId: 'consult_new_001',
      },
    });

    const consultationPage = new TeleconsultationPage(pharmacistPage);
    await consultationPage.goto();

    const futureDate = new Date(Date.now() + 86400000).toISOString().slice(0, 16);
    await consultationPage.bookConsultation('Sophie Bernard', futureDate);
  });

  test('should join video consultation', async ({ pharmacistPage }) => {
    // Mock Twilio video call
    await mockApiResponse(pharmacistPage, '**/consultations/*/join', {
      status: 200,
      body: {
        success: true,
        token: 'mock_twilio_token',
        roomName: 'consult_001_room',
      },
    });

    const consultationPage = new TeleconsultationPage(pharmacistPage);
    await consultationPage.goto();

    await consultationPage.joinConsultation('consult_001');
    await consultationPage.expectVideoCallActive();
  });

  test('should send message during consultation', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/consultations/*/join', {
      status: 200,
      body: { success: true, token: 'mock_token', roomName: 'room_001' },
    });

    const consultationPage = new TeleconsultationPage(pharmacistPage);
    await consultationPage.goto();
    await consultationPage.joinConsultation('consult_001');

    await consultationPage.sendMessageInConsultation('Bonjour, comment allez-vous?');
  });

  test('should send prescription during consultation', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/consultations/*/join', {
      status: 200,
      body: { success: true, token: 'mock_token', roomName: 'room_001' },
    });

    await mockApiResponse(pharmacistPage, '**/consultations/*/send-prescription', {
      status: 200,
      body: { success: true },
    });

    const consultationPage = new TeleconsultationPage(pharmacistPage);
    await consultationPage.goto();
    await consultationPage.joinConsultation('consult_001');

    await consultationPage.sendPrescriptionDuringConsultation('rx_001');
  });

  test('should end consultation and save notes', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/consultations/*/join', {
      status: 200,
      body: { success: true, token: 'mock_token', roomName: 'room_001' },
    });

    await mockApiResponse(pharmacistPage, '**/consultations/*/end', {
      status: 200,
      body: { success: true },
    });

    await mockApiResponse(pharmacistPage, '**/consultations/*/notes', {
      status: 200,
      body: { success: true },
    });

    const consultationPage = new TeleconsultationPage(pharmacistPage);
    await consultationPage.goto();
    await consultationPage.joinConsultation('consult_001');

    await consultationPage.saveConsultationNotes('Patient reports improvement. Continue current medication.');
    await consultationPage.endConsultation();
  });

  test('should view upcoming consultations', async ({ pharmacistPage }) => {
    const consultationPage = new TeleconsultationPage(pharmacistPage);
    await consultationPage.goto();

    await consultationPage.viewUpcomingConsultations();
    await consultationPage.expectConsultationInList('consult_001');
  });

  test('should view past consultations', async ({ pharmacistPage }) => {
    const consultationPage = new TeleconsultationPage(pharmacistPage);
    await consultationPage.goto();

    await consultationPage.viewPastConsultations();
    await expect(consultationPage.consultationList).toBeVisible();
  });

  test('should verify patient consent before consultation', async ({ pharmacistPage }) => {
    const consultationPage = new TeleconsultationPage(pharmacistPage);
    await consultationPage.goto();

    await consultationPage.expectConsultationInList('consult_001');
    await pharmacistPage.locator('[data-testid="consultation-consult_001"]').click();

    await consultationPage.verifyPatientConsent();
  });

  test('should view consultation history details', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/consultations/consult_002', {
      status: 200,
      body: {
        success: true,
        consultation: {
          id: 'consult_002',
          patientName: 'Marc Dubois',
          scheduledAt: new Date(Date.now() - 3600000).toISOString(),
          duration: 1200,
          notes: 'Patient doing well',
          prescriptionsSent: ['rx_001'],
        },
      },
    });

    const consultationPage = new TeleconsultationPage(pharmacistPage);
    await consultationPage.goto();

    await consultationPage.viewConsultationHistory('consult_002');
  });
});
