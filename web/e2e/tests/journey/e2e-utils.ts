/**
 * E2E Journey Test Utilities
 *
 * Shared utilities for full-journey E2E tests including:
 * - Test data generators for complex journeys
 * - Service mocks for multi-step flows
 * - Assertion helpers for journey verification
 * - State management for cross-step data consistency
 */

import { Page, expect } from '@playwright/test';
import { mockApiResponse } from '../../utils/api-mock';

/**
 * Journey state manager - tracks data across multiple test steps
 * Used to verify data consistency (e.g., prescription created in step 2
 * appears in patient view in step 6)
 */
export class JourneyStateManager {
  private state: Map<string, any> = new Map();

  set(key: string, value: any): void {
    this.state.set(key, value);
  }

  get(key: string): any {
    return this.state.get(key);
  }

  getAll(): Record<string, any> {
    const result: Record<string, any> = {};
    this.state.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  clear(): void {
    this.state.clear();
  }

  has(key: string): boolean {
    return this.state.has(key);
  }
}

/**
 * Prescription journey test data
 */
export interface PrescriptionJourneyData {
  prescriptionId: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  pharmacistId: string;
  pharmacyId: string;
  medications: Array<{
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    quantity: number;
  }>;
  ocrImageUrl: string;
  ocrTranscribedText: string;
  interactionCheckStatus: 'clear' | 'warning' | 'critical';
  paymentId: string;
  paymentStatus: 'pending' | 'processing' | 'completed';
  deliveryId: string;
  deliveryStatus: 'assigned' | 'in_transit' | 'delivered';
  adherenceTrackingStarted: boolean;
  createdAt: string;
}

/**
 * Generate mock prescription journey data
 */
export function generatePrescriptionJourneyData(
  overrides?: Partial<PrescriptionJourneyData>
): PrescriptionJourneyData {
  const timestamp = Date.now();
  const prescriptionId = `rx_${timestamp}`;

  return {
    prescriptionId,
    patientId: `patient_${timestamp}`,
    patientName: 'Sophie Bernard',
    patientEmail: 'sophie.bernard@example.ch',
    pharmacistId: 'pharmacist_001',
    pharmacyId: 'pharmacy_001',
    medications: [
      {
        id: `med_${timestamp}_1`,
        name: 'Metformine 500mg',
        dosage: '500mg',
        frequency: '2 fois par jour',
        quantity: 60,
      },
      {
        id: `med_${timestamp}_2`,
        name: 'Lisinopril 10mg',
        dosage: '10mg',
        frequency: 'Une fois par jour',
        quantity: 30,
      },
    ],
    ocrImageUrl: 'https://api.example.com/prescriptions/ocr/image_001.jpg',
    ocrTranscribedText: 'Metformine 500mg 2x/jour; Lisinopril 10mg 1x/jour',
    interactionCheckStatus: 'clear',
    paymentId: `pay_${timestamp}`,
    paymentStatus: 'completed',
    deliveryId: `delivery_${timestamp}`,
    deliveryStatus: 'delivered',
    adherenceTrackingStarted: true,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Teleconsultation journey test data
 */
export interface TeleconsultationJourneyData {
  consultationId: string;
  patientId: string;
  patientName: string;
  pharmacistId: string;
  pharmacistName: string;
  bookingTime: string;
  videoRoomId: string;
  twilioToken: string;
  remindersSent: boolean;
  callStarted: boolean;
  callDuration: number; // in seconds
  transcriptionId: string;
  transcribedNotes: string;
  prescriptionCreatedDuringCall: boolean;
  prescriptionId: string;
  followUpScheduled: boolean;
  followUpDate: string;
  recordingId: string;
  recordingConsent: boolean;
  recordingSaved: boolean;
  completedAt: string;
}

/**
 * Generate mock teleconsultation journey data
 */
export function generateTeleconsultationJourneyData(
  overrides?: Partial<TeleconsultationJourneyData>
): TeleconsultationJourneyData {
  const timestamp = Date.now();
  const consultationId = `consult_${timestamp}`;

  return {
    consultationId,
    patientId: `patient_${timestamp}`,
    patientName: 'Sophie Bernard',
    pharmacistId: 'pharmacist_001',
    pharmacistName: 'Dr. Marie Dubois',
    bookingTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    videoRoomId: `room_${timestamp}`,
    twilioToken: `twilio_token_${timestamp}`,
    remindersSent: true,
    callStarted: true,
    callDuration: 1200, // 20 minutes
    transcriptionId: `transcript_${timestamp}`,
    transcribedNotes:
      'Patient reports improved blood sugar control. Continue current medications. Scheduled follow-up in 4 weeks.',
    prescriptionCreatedDuringCall: true,
    prescriptionId: `rx_${timestamp}`,
    followUpScheduled: true,
    followUpDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
    recordingId: `recording_${timestamp}`,
    recordingConsent: true,
    recordingSaved: true,
    completedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * VIP Membership journey test data
 */
export interface VIPMembershipJourneyData {
  memberId: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  signupDate: string;
  currentTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  totalPoints: number;
  pointsThisCycle: number;
  tierRequirements: Record<string, number>; // tier -> points needed
  lastPurchaseDate: string;
  purchasesThisCycle: number;
  nextTierUpgradeDate: string;
  discountPercentage: number;
  freeDeliveryEligible: boolean;
  birthdayBonusEarned: boolean;
  birthdayDate: string;
  birthdayBonusAmount: number;
  lastTierUpgradeDate: string;
}

/**
 * Generate mock VIP membership journey data
 */
export function generateVIPMembershipJourneyData(
  overrides?: Partial<VIPMembershipJourneyData>
): VIPMembershipJourneyData {
  const timestamp = Date.now();
  const memberId = `vip_${timestamp}`;

  return {
    memberId,
    patientId: `patient_${timestamp}`,
    patientName: 'Sophie Bernard',
    patientEmail: 'sophie.bernard@example.ch',
    signupDate: new Date().toISOString(),
    currentTier: 'bronze',
    totalPoints: 150,
    pointsThisCycle: 150,
    tierRequirements: {
      bronze: 0,
      silver: 500,
      gold: 1500,
      platinum: 3000,
    },
    lastPurchaseDate: new Date().toISOString(),
    purchasesThisCycle: 1,
    nextTierUpgradeDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    discountPercentage: 5,
    freeDeliveryEligible: false,
    birthdayBonusEarned: false,
    birthdayDate: '1985-05-15',
    birthdayBonusAmount: 100,
    lastTierUpgradeDate: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Mock prescription upload step
 * Mocks OCR service, drug database, and pharmacy inventory
 */
export async function mockPrescriptionUploadStep(
  page: Page,
  journeyData: PrescriptionJourneyData
): Promise<void> {
  // Mock prescription image upload
  await mockApiResponse(page, '**/prescriptions/upload', {
    status: 200,
    body: {
      success: true,
      prescriptionId: journeyData.prescriptionId,
      uploadedAt: new Date().toISOString(),
    },
  });

  // Mock OCR transcription
  await mockApiResponse(page, '**/ocr/transcribe', {
    status: 200,
    body: {
      success: true,
      transcribedText: journeyData.ocrTranscribedText,
      confidence: 0.95,
      medications: journeyData.medications.map((med) => ({
        id: med.id,
        name: med.name,
        dosage: med.dosage,
        frequency: med.frequency,
      })),
    },
  });
}

/**
 * Mock drug interaction check step
 * Mocks FDB MedKnowledge integration
 */
export async function mockDrugInteractionCheckStep(
  page: Page,
  journeyData: PrescriptionJourneyData
): Promise<void> {
  const interactions =
    journeyData.interactionCheckStatus === 'clear'
      ? []
      : journeyData.interactionCheckStatus === 'warning'
        ? [
            {
              severity: 'warning',
              drug1: 'Metformine',
              drug2: 'Lisinopril',
              description: 'Possible interaction',
              recommendation: 'Monitor patient',
            },
          ]
        : [
            {
              severity: 'critical',
              drug1: 'Metformine',
              drug2: 'Some other drug',
              description: 'Severe interaction',
              recommendation: 'Do not prescribe together',
            },
          ];

  await mockApiResponse(page, '**/prescriptions/check-interactions', {
    status: 200,
    body: {
      success: true,
      interactions,
      patientAlergies: [],
      patientConditions: ['Diabetes', 'Hypertension'],
    },
  });
}

/**
 * Mock pharmacist approval step
 */
export async function mockPharmacistApprovalStep(
  page: Page,
  journeyData: PrescriptionJourneyData
): Promise<void> {
  await mockApiResponse(page, '**/prescriptions/approve', {
    status: 200,
    body: {
      success: true,
      prescriptionId: journeyData.prescriptionId,
      approvedAt: new Date().toISOString(),
      approvedBy: journeyData.pharmacistId,
      status: 'approved',
    },
  });
}

/**
 * Mock payment processing step
 */
export async function mockPaymentProcessingStep(
  page: Page,
  journeyData: PrescriptionJourneyData
): Promise<void> {
  await mockApiResponse(page, '**/payments/process', {
    status: 200,
    body: {
      success: true,
      paymentId: journeyData.paymentId,
      prescriptionId: journeyData.prescriptionId,
      amount: 45.5,
      currency: 'CHF',
      status: journeyData.paymentStatus,
      processedAt: new Date().toISOString(),
    },
  });
}

/**
 * Mock delivery assignment and tracking step
 */
export async function mockDeliveryAssignmentStep(
  page: Page,
  journeyData: PrescriptionJourneyData
): Promise<void> {
  await mockApiResponse(page, '**/deliveries/assign', {
    status: 200,
    body: {
      success: true,
      deliveryId: journeyData.deliveryId,
      prescriptionId: journeyData.prescriptionId,
      assignedTo: 'delivery_person_001',
      estimatedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      status: journeyData.deliveryStatus,
    },
  });

  // Mock delivery tracking updates
  await mockApiResponse(page, '**/deliveries/*/tracking', {
    status: 200,
    body: {
      success: true,
      deliveryId: journeyData.deliveryId,
      status: journeyData.deliveryStatus,
      currentLocation: { lat: 46.2022, lng: 6.1431 }, // Geneva
      estimatedArrival: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    },
  });
}

/**
 * Mock adherence tracking step
 */
export async function mockAdherenceTrackingStep(
  page: Page,
  journeyData: PrescriptionJourneyData
): Promise<void> {
  await mockApiResponse(page, '**/adherence/start-tracking', {
    status: 200,
    body: {
      success: true,
      prescriptionId: journeyData.prescriptionId,
      trackingStartedAt: new Date().toISOString(),
      remindersEnabled: true,
      reminderFrequency: 'daily',
    },
  });
}

/**
 * Mock teleconsultation booking step
 */
export async function mockTeleconsultationBookingStep(
  page: Page,
  journeyData: TeleconsultationJourneyData
): Promise<void> {
  await mockApiResponse(page, '**/consultations/book', {
    status: 201,
    body: {
      success: true,
      consultationId: journeyData.consultationId,
      patientId: journeyData.patientId,
      pharmacistId: journeyData.pharmacistId,
      bookedAt: new Date().toISOString(),
      scheduledFor: journeyData.bookingTime,
    },
  });
}

/**
 * Mock reminder sending step
 */
export async function mockReminderSendingStep(
  page: Page,
  journeyData: TeleconsultationJourneyData
): Promise<void> {
  await mockApiResponse(page, '**/consultations/*/send-reminders', {
    status: 200,
    body: {
      success: true,
      consultationId: journeyData.consultationId,
      emailReminder: true,
      smsReminder: true,
      remindersSentAt: new Date().toISOString(),
    },
  });
}

/**
 * Mock video call join step
 */
export async function mockVideoCallJoinStep(
  page: Page,
  journeyData: TeleconsultationJourneyData
): Promise<void> {
  await mockApiResponse(page, '**/consultations/*/join', {
    status: 200,
    body: {
      success: true,
      consultationId: journeyData.consultationId,
      roomName: journeyData.videoRoomId,
      twilioToken: journeyData.twilioToken,
      isPharmacist: true,
    },
  });
}

/**
 * Mock voice transcription step
 */
export async function mockVoiceTranscriptionStep(
  page: Page,
  journeyData: TeleconsultationJourneyData
): Promise<void> {
  await mockApiResponse(page, '**/consultations/*/transcribe', {
    status: 200,
    body: {
      success: true,
      transcriptionId: journeyData.transcriptionId,
      consultationId: journeyData.consultationId,
      transcribedText: journeyData.transcribedNotes,
      confidence: 0.92,
      language: 'fr-CH',
    },
  });
}

/**
 * Mock follow-up scheduling step
 */
export async function mockFollowUpSchedulingStep(
  page: Page,
  journeyData: TeleconsultationJourneyData
): Promise<void> {
  await mockApiResponse(page, '**/consultations/*/schedule-followup', {
    status: 200,
    body: {
      success: true,
      followUpId: `followup_${Date.now()}`,
      consultationId: journeyData.consultationId,
      scheduledFor: journeyData.followUpDate,
      type: 'phone_consultation',
    },
  });
}

/**
 * Mock recording saving step (with consent)
 */
export async function mockRecordingSavingStep(
  page: Page,
  journeyData: TeleconsultationJourneyData
): Promise<void> {
  await mockApiResponse(page, '**/consultations/*/save-recording', {
    status: 200,
    body: {
      success: true,
      recordingId: journeyData.recordingId,
      consultationId: journeyData.consultationId,
      consentObtained: journeyData.recordingConsent,
      savedAt: new Date().toISOString(),
      duration: journeyData.callDuration,
      url: `https://storage.example.com/recordings/${journeyData.recordingId}`,
    },
  });
}

/**
 * Mock VIP signup step
 */
export async function mockVIPSignupStep(
  page: Page,
  journeyData: VIPMembershipJourneyData
): Promise<void> {
  await mockApiResponse(page, '**/vip/signup', {
    status: 201,
    body: {
      success: true,
      memberId: journeyData.memberId,
      patientId: journeyData.patientId,
      signupDate: journeyData.signupDate,
      currentTier: journeyData.currentTier,
      initialBonus: 100, // Sign-up bonus
    },
  });
}

/**
 * Mock points earning step
 */
export async function mockPointsEarningStep(
  page: Page,
  journeyData: VIPMembershipJourneyData
): Promise<void> {
  await mockApiResponse(page, '**/vip/*/earn-points', {
    status: 200,
    body: {
      success: true,
      memberId: journeyData.memberId,
      pointsEarned: 150,
      totalPoints: journeyData.totalPoints,
      transactionId: `txn_${Date.now()}`,
      earnedAt: new Date().toISOString(),
    },
  });
}

/**
 * Mock tier upgrade step
 */
export async function mockTierUpgradeStep(
  page: Page,
  journeyData: VIPMembershipJourneyData
): Promise<void> {
  const newTier = journeyData.currentTier === 'bronze' ? 'silver' : 'gold';

  await mockApiResponse(page, '**/vip/*/upgrade-tier', {
    status: 200,
    body: {
      success: true,
      memberId: journeyData.memberId,
      previousTier: journeyData.currentTier,
      newTier,
      upgradeDate: new Date().toISOString(),
      newBenefits: {
        discountPercentage: 10,
        freeDelivery: true,
        prioritySupport: true,
      },
    },
  });
}

/**
 * Mock discount application step
 */
export async function mockDiscountApplicationStep(
  page: Page,
  journeyData: VIPMembershipJourneyData
): Promise<void> {
  await mockApiResponse(page, '**/orders/*/apply-vip-discount', {
    status: 200,
    body: {
      success: true,
      orderId: `order_${Date.now()}`,
      memberId: journeyData.memberId,
      originalPrice: 100.0,
      discountPercentage: journeyData.discountPercentage,
      discountAmount: 100.0 * (journeyData.discountPercentage / 100),
      finalPrice: 100.0 * (1 - journeyData.discountPercentage / 100),
    },
  });
}

/**
 * Mock birthday bonus step
 */
export async function mockBirthdayBonusStep(
  page: Page,
  journeyData: VIPMembershipJourneyData
): Promise<void> {
  await mockApiResponse(page, '**/vip/*/claim-birthday-bonus', {
    status: 200,
    body: {
      success: true,
      memberId: journeyData.memberId,
      bonusPoints: journeyData.birthdayBonusAmount,
      totalPoints: journeyData.totalPoints + journeyData.birthdayBonusAmount,
      claimedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
  });
}

/**
 * Mock free delivery eligibility check
 */
export async function mockFreeDeliveryEligibilityStep(
  page: Page,
  journeyData: VIPMembershipJourneyData
): Promise<void> {
  await mockApiResponse(page, '**/vip/*/check-free-delivery', {
    status: 200,
    body: {
      success: true,
      memberId: journeyData.memberId,
      eligible: journeyData.freeDeliveryEligible,
      tier: journeyData.currentTier,
      minimumPurchaseRequired: journeyData.currentTier === 'bronze' ? 100 : 50,
      deliveryCost: journeyData.freeDeliveryEligible ? 0 : 5.5,
    },
  });
}

/**
 * Assertion helper - verify prescription journey completion
 */
export async function assertPrescriptionJourneyComplete(
  page: Page,
  journeyData: PrescriptionJourneyData
): Promise<void> {
  // Verify prescription appears in user's prescription list
  const prescriptionElement = page.locator(
    `[data-testid="prescription-${journeyData.prescriptionId}"]`
  );
  await expect(prescriptionElement).toBeVisible();

  // Verify status is marked as "delivered"
  const statusElement = page.locator(
    `[data-testid="prescription-status-${journeyData.prescriptionId}"]`
  );
  await expect(statusElement).toContainText(/livré|delivered/i);

  // Verify adherence tracking is active
  const adherenceElement = page.locator(
    `[data-testid="adherence-tracking-${journeyData.prescriptionId}"]`
  );
  await expect(adherenceElement).toContainText(/suivi actif|tracking active/i);
}

/**
 * Assertion helper - verify teleconsultation journey completion
 */
export async function assertTeleconsultationJourneyComplete(
  page: Page,
  journeyData: TeleconsultationJourneyData
): Promise<void> {
  // Verify consultation completed
  const consultationElement = page.locator(
    `[data-testid="consultation-${journeyData.consultationId}"]`
  );
  await expect(consultationElement).toBeVisible();

  // Verify prescription was created
  const prescriptionElement = page.locator(
    `[data-testid="consultation-prescription-${journeyData.prescriptionId}"]`
  );
  await expect(prescriptionElement).toBeVisible();

  // Verify follow-up scheduled
  const followupElement = page.locator(
    `[data-testid="consultation-followup-${journeyData.consultationId}"]`
  );
  await expect(followupElement).toContainText(/planifié|scheduled/i);

  // Verify recording saved (if consent given)
  if (journeyData.recordingConsent) {
    const recordingElement = page.locator(
      `[data-testid="consultation-recording-${journeyData.recordingId}"]`
    );
    await expect(recordingElement).toBeVisible();
  }
}

/**
 * Assertion helper - verify VIP membership journey completion
 */
export async function assertVIPMembershipJourneyComplete(
  page: Page,
  journeyData: VIPMembershipJourneyData
): Promise<void> {
  // Verify VIP membership active
  const membershipElement = page.locator(
    `[data-testid="vip-membership-${journeyData.memberId}"]`
  );
  await expect(membershipElement).toBeVisible();

  // Verify current tier displayed
  const tierElement = page.locator(
    `[data-testid="vip-tier-${journeyData.memberId}"]`
  );
  await expect(tierElement).toContainText(journeyData.currentTier);

  // Verify points displayed
  const pointsElement = page.locator(
    `[data-testid="vip-points-${journeyData.memberId}"]`
  );
  await expect(pointsElement).toContainText(`${journeyData.totalPoints}`);

  // Verify discount shown if eligible
  if (journeyData.currentTier !== 'bronze') {
    const discountElement = page.locator(
      `[data-testid="vip-discount-${journeyData.memberId}"]`
    );
    await expect(discountElement).toContainText(`${journeyData.discountPercentage}%`);
  }
}
