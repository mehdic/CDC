/**
 * Doctor Teleconsultation E2E Tests
 *
 * Tests teleconsultation functionality for doctors:
 * - View consultation requests
 * - Accept/decline consultation
 * - Join video call
 * - Share screen/documents
 * - Send prescription during call
 * - End consultation and save notes
 */

describe('Doctor Teleconsultation', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    await completeLogin();
  });

  beforeEach(async () => {
    // Navigate to teleconsultation tab
    await element(by.id('teleconsultation-tab')).tap();
    await expect(element(by.id('teleconsultation-screen'))).toBeVisible();
  });

  describe('View Consultation Requests', () => {
    it('should display consultation requests list', async () => {
      await expect(element(by.id('consultation-requests-list'))).toBeVisible();
      await expect(element(by.id('filter-requests-button'))).toBeVisible();
    });

    it('should show pending consultation requests', async () => {
      await expect(element(by.id('request-0'))).toBeVisible();
      await expect(element(by.id('request-0-patient-name'))).toBeVisible();
      await expect(element(by.id('request-0-timestamp'))).toBeVisible();
      await expect(element(by.id('request-0-status'))).toHaveText('Pending');
    });

    it('should filter requests by status', async () => {
      await element(by.id('filter-requests-button')).tap();
      await expect(element(by.id('filter-modal'))).toBeVisible();

      await element(by.id('filter-pending-option')).tap();
      await element(by.id('apply-filter-button')).tap();

      // All visible requests should be pending
      await expect(element(by.id('request-0-status'))).toHaveText('Pending');
      await expect(element(by.id('active-filter-badge'))).toHaveText('Pending');
    });

    it('should view consultation request details', async () => {
      await element(by.id('request-0')).tap();
      await expect(element(by.id('request-detail-modal'))).toBeVisible();

      await expect(element(by.id('patient-info'))).toBeVisible();
      await expect(element(by.id('consultation-reason'))).toBeVisible();
      await expect(element(by.id('patient-symptoms'))).toBeVisible();
      await expect(element(by.id('preferred-time'))).toBeVisible();
    });

    it('should show urgent consultation priority', async () => {
      await expect(element(by.id('request-urgent-0'))).toBeVisible();
      await expect(element(by.id('request-urgent-0-priority-badge'))).toHaveText('Urgent');
      await expect(element(by.id('request-urgent-0-priority-badge'))).toHaveClass('urgent-priority');
    });
  });

  describe('Accept/Decline Consultation', () => {
    it('should accept consultation request', async () => {
      await element(by.id('request-0')).tap();
      await expect(element(by.id('request-detail-modal'))).toBeVisible();

      await element(by.id('accept-consultation-button')).tap();

      // Confirmation dialog
      await expect(element(by.id('accept-confirmation-dialog'))).toBeVisible();
      await element(by.id('confirm-accept-button')).tap();

      await waitFor(element(by.id('acceptance-success-message'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('acceptance-success-message'))).toHaveText('Consultation accepted');

      // Request should move to accepted status
      await element(by.id('close-modal-button')).tap();
      await expect(element(by.id('request-0-status'))).toHaveText('Accepted');
    });

    it('should suggest alternative time slot when accepting', async () => {
      await element(by.id('request-0')).tap();
      await element(by.id('accept-consultation-button')).tap();

      // Option to suggest different time
      await element(by.id('suggest-alternative-time-checkbox')).tap();
      await expect(element(by.id('time-picker'))).toBeVisible();

      await element(by.id('time-picker')).tap();
      await element(by.text('14:00')).tap();
      await element(by.id('confirm-accept-button')).tap();

      await expect(element(by.id('acceptance-success-message'))).toContain('Alternative time suggested');
    });

    it('should decline consultation request with reason', async () => {
      await element(by.id('request-0')).tap();
      await element(by.id('decline-consultation-button')).tap();

      await expect(element(by.id('decline-reason-modal'))).toBeVisible();
      await element(by.id('decline-reason-picker')).tap();
      await element(by.text('Schedule conflict')).tap();
      await element(by.id('decline-reason-details')).typeText('Unavailable at requested time');
      await element(by.id('confirm-decline-button')).tap();

      await expect(element(by.id('decline-success-message'))).toBeVisible();
    });

    it('should refer to another doctor when declining', async () => {
      await element(by.id('request-0')).tap();
      await element(by.id('decline-consultation-button')).tap();

      await element(by.id('refer-to-colleague-checkbox')).tap();
      await expect(element(by.id('doctor-search-input'))).toBeVisible();

      await element(by.id('doctor-search-input')).typeText('Dr. Jane Wilson');
      await element(by.id('doctor-search-button')).tap();
      await waitFor(element(by.id('doctor-results-list'))).toBeVisible().withTimeout(5000);
      await element(by.id('doctor-result-0')).tap();

      await element(by.id('confirm-decline-button')).tap();
      await expect(element(by.id('referral-success-message'))).toBeVisible();
    });
  });

  describe('Join Video Call', () => {
    beforeEach(async () => {
      // Accept a consultation first
      await acceptConsultation();
      await waitForScheduledTime();
    });

    it('should show join call button when consultation time arrives', async () => {
      await expect(element(by.id('active-consultation-0'))).toBeVisible();
      await expect(element(by.id('join-call-button-0'))).toBeVisible();
      await expect(element(by.id('join-call-button-0'))).toBeEnabled();
    });

    it('should initialize video call with patient', async () => {
      await element(by.id('join-call-button-0')).tap();

      await waitFor(element(by.id('video-call-screen'))).toBeVisible().withTimeout(10000);
      await expect(element(by.id('local-video'))).toBeVisible();
      await expect(element(by.id('remote-video'))).toBeVisible();
      await expect(element(by.id('call-controls'))).toBeVisible();
    });

    it('should request camera and microphone permissions', async () => {
      await element(by.id('join-call-button-0')).tap();

      // System permission dialogs
      await waitFor(element(by.text('Allow camera access'))).toBeVisible().withTimeout(5000);
      await element(by.text('Allow')).tap();

      await waitFor(element(by.text('Allow microphone access'))).toBeVisible().withTimeout(5000);
      await element(by.text('Allow')).tap();

      await expect(element(by.id('video-call-screen'))).toBeVisible();
    });

    it('should display call quality indicator', async () => {
      await element(by.id('join-call-button-0')).tap();
      await waitFor(element(by.id('video-call-screen'))).toBeVisible().withTimeout(10000);

      await expect(element(by.id('call-quality-indicator'))).toBeVisible();
      await expect(element(by.id('call-quality-status'))).toBeVisible(); // Good/Fair/Poor
    });

    it('should toggle video during call', async () => {
      await element(by.id('join-call-button-0')).tap();
      await waitFor(element(by.id('video-call-screen'))).toBeVisible().withTimeout(10000);

      // Turn off video
      await element(by.id('toggle-video-button')).tap();
      await expect(element(by.id('local-video-disabled'))).toBeVisible();

      // Turn on video
      await element(by.id('toggle-video-button')).tap();
      await expect(element(by.id('local-video'))).toBeVisible();
    });

    it('should mute/unmute audio during call', async () => {
      await element(by.id('join-call-button-0')).tap();
      await waitFor(element(by.id('video-call-screen'))).toBeVisible().withTimeout(10000);

      // Mute audio
      await element(by.id('toggle-audio-button')).tap();
      await expect(element(by.id('muted-indicator'))).toBeVisible();

      // Unmute audio
      await element(by.id('toggle-audio-button')).tap();
      await expect(element(by.id('muted-indicator'))).not.toBeVisible();
    });
  });

  describe('Share Screen/Documents', () => {
    beforeEach(async () => {
      await startVideoCall();
    });

    it('should display screen sharing option', async () => {
      await element(by.id('call-menu-button')).tap();
      await expect(element(by.id('share-screen-option'))).toBeVisible();
    });

    it('should share screen with patient', async () => {
      await element(by.id('call-menu-button')).tap();
      await element(by.id('share-screen-option')).tap();

      // Screen sharing permission
      await waitFor(element(by.text('Start screen sharing'))).toBeVisible().withTimeout(5000);
      await element(by.text('Start Broadcast')).tap();

      await expect(element(by.id('screen-sharing-active'))).toBeVisible();
      await expect(element(by.id('screen-sharing-indicator'))).toHaveText('Sharing screen');
    });

    it('should share medical documents during call', async () => {
      await element(by.id('call-menu-button')).tap();
      await element(by.id('share-document-option')).tap();

      await expect(element(by.id('document-picker-modal'))).toBeVisible();
      await element(by.id('patient-records-tab')).tap();
      await element(by.id('record-0')).tap();
      await element(by.id('confirm-share-button')).tap();

      await expect(element(by.id('document-shared-notification'))).toBeVisible();
      await expect(element(by.id('shared-document-viewer'))).toBeVisible();
    });

    it('should stop screen sharing', async () => {
      await element(by.id('call-menu-button')).tap();
      await element(by.id('share-screen-option')).tap();
      await waitFor(element(by.text('Start Broadcast'))).toBeVisible().withTimeout(5000);
      await element(by.text('Start Broadcast')).tap();

      // Stop sharing
      await element(by.id('stop-sharing-button')).tap();
      await expect(element(by.id('screen-sharing-active'))).not.toBeVisible();
    });
  });

  describe('Send Prescription During Call', () => {
    beforeEach(async () => {
      await startVideoCall();
    });

    it('should access prescription creation during call', async () => {
      await element(by.id('call-menu-button')).tap();
      await expect(element(by.id('create-prescription-option'))).toBeVisible();
    });

    it('should create and send prescription in-call', async () => {
      await element(by.id('call-menu-button')).tap();
      await element(by.id('create-prescription-option')).tap();

      // Prescription form overlay
      await expect(element(by.id('inline-prescription-form'))).toBeVisible();

      // Patient should be pre-selected from call
      await expect(element(by.id('selected-patient-name'))).toBeVisible();

      // Add medication
      await element(by.id('medication-search-button')).tap();
      await element(by.id('medication-search-input')).typeText('Amoxicillin');
      await element(by.id('medication-search-submit')).tap();
      await waitFor(element(by.id('medication-results-list'))).toBeVisible().withTimeout(5000);
      await element(by.id('medication-result-0')).tap();

      // Set dosage
      await element(by.id('medication-item-0-edit')).tap();
      await element(by.id('dosage-amount-input')).replaceText('1');
      await element(by.id('dosage-save-button')).tap();

      // Send prescription
      await element(by.id('send-prescription-button')).tap();
      await element(by.id('use-preferred-pharmacy-button')).tap();
      await element(by.id('pharmacy-confirm-button')).tap();

      await expect(element(by.id('prescription-sent-notification'))).toBeVisible();

      // Should return to video call
      await expect(element(by.id('video-call-screen'))).toBeVisible();
    });

    it('should notify patient of prescription sent', async () => {
      await createAndSendPrescriptionInCall();

      await expect(element(by.id('patient-notification-sent'))).toBeVisible();
      await expect(element(by.id('patient-notification-text'))).toContain('Prescription sent');
    });
  });

  describe('End Consultation and Save Notes', () => {
    beforeEach(async () => {
      await startVideoCall();
    });

    it('should end video call', async () => {
      await element(by.id('end-call-button')).tap();

      await expect(element(by.id('end-call-confirmation'))).toBeVisible();
      await element(by.id('confirm-end-call-button')).tap();

      // Should navigate to post-consultation screen
      await waitFor(element(by.id('post-consultation-screen'))).toBeVisible().withTimeout(5000);
    });

    it('should display call summary', async () => {
      await element(by.id('end-call-button')).tap();
      await element(by.id('confirm-end-call-button')).tap();
      await waitFor(element(by.id('post-consultation-screen'))).toBeVisible().withTimeout(5000);

      await expect(element(by.id('call-duration'))).toBeVisible();
      await expect(element(by.id('call-patient-name'))).toBeVisible();
      await expect(element(by.id('call-start-time'))).toBeVisible();
    });

    it('should save consultation notes', async () => {
      await element(by.id('end-call-button')).tap();
      await element(by.id('confirm-end-call-button')).tap();
      await waitFor(element(by.id('post-consultation-screen'))).toBeVisible().withTimeout(5000);

      const notes = 'Patient presented with symptoms of seasonal allergies. Prescribed antihistamine. Follow-up in 2 weeks if symptoms persist.';
      await element(by.id('consultation-notes-input')).typeText(notes);
      await element(by.id('save-notes-button')).tap();

      await expect(element(by.id('notes-saved-success'))).toBeVisible();
    });

    it('should add diagnosis codes', async () => {
      await element(by.id('end-call-button')).tap();
      await element(by.id('confirm-end-call-button')).tap();
      await waitFor(element(by.id('post-consultation-screen'))).toBeVisible().withTimeout(5000);

      await element(by.id('add-diagnosis-button')).tap();
      await expect(element(by.id('diagnosis-picker'))).toBeVisible();

      await element(by.id('diagnosis-search-input')).typeText('J30.1');
      await element(by.id('diagnosis-search-button')).tap();
      await waitFor(element(by.id('diagnosis-results-list'))).toBeVisible().withTimeout(5000);
      await element(by.id('diagnosis-result-0')).tap();

      await expect(element(by.id('selected-diagnosis-0'))).toBeVisible();
      await expect(element(by.id('selected-diagnosis-0-code'))).toHaveText('J30.1');
    });

    it('should schedule follow-up appointment', async () => {
      await element(by.id('end-call-button')).tap();
      await element(by.id('confirm-end-call-button')).tap();
      await waitFor(element(by.id('post-consultation-screen'))).toBeVisible().withTimeout(5000);

      await element(by.id('schedule-followup-checkbox')).tap();
      await expect(element(by.id('followup-date-picker'))).toBeVisible();

      await element(by.id('followup-date-picker')).tap();
      // Select date 2 weeks from now
      await element(by.id('date-picker-next-button')).tap();
      await element(by.id('date-picker-day-14')).tap();
      await element(by.id('date-picker-confirm')).tap();

      await element(by.id('save-notes-button')).tap();
      await expect(element(by.id('followup-scheduled-success'))).toBeVisible();
    });

    it('should generate consultation report', async () => {
      await element(by.id('end-call-button')).tap();
      await element(by.id('confirm-end-call-button')).tap();
      await waitFor(element(by.id('post-consultation-screen'))).toBeVisible().withTimeout(5000);

      await element(by.id('consultation-notes-input')).typeText('Consultation completed successfully');
      await element(by.id('save-notes-button')).tap();

      await element(by.id('generate-report-button')).tap();
      await waitFor(element(by.id('report-generated-success'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('download-report-button'))).toBeVisible();
    });
  });

  describe('Call Recording and Consent', () => {
    it('should request patient consent before recording', async () => {
      await acceptConsultation();
      await waitForScheduledTime();
      await element(by.id('join-call-button-0')).tap();
      await waitFor(element(by.id('video-call-screen'))).toBeVisible().withTimeout(10000);

      await element(by.id('call-menu-button')).tap();
      await element(by.id('start-recording-option')).tap();

      await expect(element(by.id('recording-consent-request'))).toBeVisible();
      await expect(element(by.id('consent-status'))).toHaveText('Waiting for patient consent');
    });

    it('should start recording after patient approval', async () => {
      await startVideoCall();
      await element(by.id('call-menu-button')).tap();
      await element(by.id('start-recording-option')).tap();

      // Simulate patient approval (in real test, would come from backend)
      await waitFor(element(by.id('recording-active-indicator'))).toBeVisible().withTimeout(15000);
      await expect(element(by.id('recording-active-indicator'))).toHaveText('Recording');
    });

    it('should stop recording', async () => {
      await startVideoCall();
      await startRecording();

      await element(by.id('call-menu-button')).tap();
      await element(by.id('stop-recording-option')).tap();

      await expect(element(by.id('recording-stopped-notification'))).toBeVisible();
      await expect(element(by.id('recording-active-indicator'))).not.toBeVisible();
    });
  });
});

/**
 * Helper Functions
 */

async function completeLogin() {
  await element(by.id('eid-login-button')).tap();
  await waitFor(element(by.id('eid-username-input'))).toBeVisible().withTimeout(5000);
  await element(by.id('eid-username-input')).typeText('doctor@hin.ch');
  await element(by.id('eid-password-input')).typeText('ValidPassword123!');
  await element(by.id('eid-submit-button')).tap();
  await waitFor(element(by.id('mfa-screen'))).toBeVisible().withTimeout(10000);
  await element(by.id('mfa-code-input')).typeText('123456');
  await element(by.id('mfa-submit-button')).tap();
  await waitFor(element(by.id('doctor-dashboard'))).toBeVisible().withTimeout(10000);
}

async function acceptConsultation() {
  await element(by.id('request-0')).tap();
  await element(by.id('accept-consultation-button')).tap();
  await element(by.id('confirm-accept-button')).tap();
  await waitFor(element(by.id('acceptance-success-message'))).toBeVisible().withTimeout(5000);
  await element(by.id('close-modal-button')).tap();
}

async function waitForScheduledTime() {
  // In real test, would wait for actual scheduled time or mock time progression
  // For test purposes, assume consultation is ready to join
  await new Promise(resolve => setTimeout(resolve, 1000));
}

async function startVideoCall() {
  await acceptConsultation();
  await waitForScheduledTime();
  await element(by.id('join-call-button-0')).tap();
  await waitFor(element(by.id('video-call-screen'))).toBeVisible().withTimeout(10000);
}

async function createAndSendPrescriptionInCall() {
  await element(by.id('call-menu-button')).tap();
  await element(by.id('create-prescription-option')).tap();
  await element(by.id('medication-search-button')).tap();
  await element(by.id('medication-search-input')).typeText('Amoxicillin');
  await element(by.id('medication-search-submit')).tap();
  await waitFor(element(by.id('medication-results-list'))).toBeVisible().withTimeout(5000);
  await element(by.id('medication-result-0')).tap();
  await element(by.id('send-prescription-button')).tap();
  await element(by.id('use-preferred-pharmacy-button')).tap();
  await element(by.id('pharmacy-confirm-button')).tap();
}

async function startRecording() {
  await element(by.id('call-menu-button')).tap();
  await element(by.id('start-recording-option')).tap();
  await waitFor(element(by.id('recording-active-indicator'))).toBeVisible().withTimeout(15000);
}
