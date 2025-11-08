/**
 * Tests for Teleconsultation Redux Slice
 * Task: T161
 */

import teleconsultationReducer, {
  setSelectedConsultation,
  toggleAudio,
  toggleVideo,
  switchToAudioOnly,
  switchToVideoMode,
  setConnectionQuality,
  endVideoCall,
  clearConsultations,
  updateConsultation,
  TeleconsultationState,
  Teleconsultation,
  VideoCallSession,
} from '../src/store/teleconsultationSlice';

describe('teleconsultationSlice', () => {
  const initialState: TeleconsultationState = {
    consultations: [],
    selectedConsultation: null,
    availablePharmacists: [],
    currentSession: null,
    loading: false,
    booking: false,
    error: null,
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      hasMore: false,
    },
  };

  const mockConsultation: Teleconsultation = {
    id: 'test-consultation-1',
    scheduled_at: '2025-11-08T10:00:00Z',
    duration_minutes: 15,
    status: 'scheduled',
    pharmacist: {
      id: 'pharmacist-1',
      name: 'Dr. Smith',
    },
    recording_consent: true,
  };

  const mockSession: VideoCallSession = {
    teleconsultationId: 'test-consultation-1',
    accessToken: 'test-token',
    roomSid: 'room-123',
    roomName: 'test-room',
    participantIdentity: 'patient-1',
    connected: true,
    audioEnabled: true,
    videoEnabled: true,
    audioOnly: false,
    connectionQuality: 'good',
  };

  it('returns initial state', () => {
    expect(teleconsultationReducer(undefined, { type: 'unknown' })).toEqual(
      initialState
    );
  });

  it('handles setSelectedConsultation', () => {
    const actual = teleconsultationReducer(
      initialState,
      setSelectedConsultation(mockConsultation)
    );

    expect(actual.selectedConsultation).toEqual(mockConsultation);
  });

  it('handles toggleAudio', () => {
    const stateWithSession = {
      ...initialState,
      currentSession: mockSession,
    };

    const actual = teleconsultationReducer(stateWithSession, toggleAudio());

    expect(actual.currentSession?.audioEnabled).toBe(false);

    // Toggle again
    const actual2 = teleconsultationReducer(actual, toggleAudio());
    expect(actual2.currentSession?.audioEnabled).toBe(true);
  });

  it('handles toggleVideo', () => {
    const stateWithSession = {
      ...initialState,
      currentSession: mockSession,
    };

    const actual = teleconsultationReducer(stateWithSession, toggleVideo());

    expect(actual.currentSession?.videoEnabled).toBe(false);
  });

  it('handles switchToAudioOnly', () => {
    const stateWithSession = {
      ...initialState,
      currentSession: mockSession,
    };

    const actual = teleconsultationReducer(
      stateWithSession,
      switchToAudioOnly()
    );

    expect(actual.currentSession?.audioOnly).toBe(true);
    expect(actual.currentSession?.videoEnabled).toBe(false);
  });

  it('handles switchToVideoMode', () => {
    const stateWithSession = {
      ...initialState,
      currentSession: { ...mockSession, audioOnly: true, videoEnabled: false },
    };

    const actual = teleconsultationReducer(
      stateWithSession,
      switchToVideoMode()
    );

    expect(actual.currentSession?.audioOnly).toBe(false);
    expect(actual.currentSession?.videoEnabled).toBe(true);
  });

  it('handles setConnectionQuality', () => {
    const stateWithSession = {
      ...initialState,
      currentSession: mockSession,
    };

    const actual = teleconsultationReducer(
      stateWithSession,
      setConnectionQuality('poor')
    );

    expect(actual.currentSession?.connectionQuality).toBe('poor');
  });

  it('handles endVideoCall', () => {
    const stateWithSession = {
      ...initialState,
      currentSession: mockSession,
    };

    const actual = teleconsultationReducer(stateWithSession, endVideoCall());

    expect(actual.currentSession).toBeNull();
  });

  it('handles clearConsultations', () => {
    const stateWithData = {
      ...initialState,
      consultations: [mockConsultation],
      selectedConsultation: mockConsultation,
      currentSession: mockSession,
    };

    const actual = teleconsultationReducer(stateWithData, clearConsultations());

    expect(actual.consultations).toEqual([]);
    expect(actual.selectedConsultation).toBeNull();
    expect(actual.currentSession).toBeNull();
  });

  it('handles updateConsultation', () => {
    const stateWithConsultations = {
      ...initialState,
      consultations: [mockConsultation],
    };

    const updatedConsultation = {
      ...mockConsultation,
      status: 'completed' as const,
    };

    const actual = teleconsultationReducer(
      stateWithConsultations,
      updateConsultation(updatedConsultation)
    );

    expect(actual.consultations[0].status).toBe('completed');
  });

  it('does not toggle audio when no session exists', () => {
    const actual = teleconsultationReducer(initialState, toggleAudio());

    expect(actual.currentSession).toBeNull();
  });

  it('does not toggle video when no session exists', () => {
    const actual = teleconsultationReducer(initialState, toggleVideo());

    expect(actual.currentSession).toBeNull();
  });
});
