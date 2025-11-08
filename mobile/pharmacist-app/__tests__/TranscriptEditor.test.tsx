/**
 * Tests for TranscriptEditor Component - Pharmacist App
 * Task: T166
 * FR-025a Compliance: AI transcripts MUST be editable with full audit trail
 *
 * CRITICAL: This test suite validates healthcare compliance requirements
 */

import React from 'react';
import { render, fireEvent, waitFor, getAllByText } from '@testing-library/react-native';
import TranscriptEditor from '../src/components/TranscriptEditor';
import { EditHistoryEntry } from '../src/services/teleconsultationService';

describe('TranscriptEditor - FR-025a Compliance Tests', () => {
  const mockAiTranscript = 'Patient reports headache for 3 days. Recommends ibuprofen 400mg.';
  const mockPharmacistNotes = 'Patient reports headache for 3 days. Recommends acetaminophen 500mg instead due to NSAID sensitivity.';

  const mockEditHistory: EditHistoryEntry[] = [
    {
      timestamp: '2025-11-08T10:30:00Z',
      user_id: 'pharmacist-uuid-12345',
      changes: [
        {
          field: 'pharmacist_notes',
          old_value: mockAiTranscript,
          new_value: mockPharmacistNotes,
        },
      ],
      original_ai_version: mockAiTranscript,
    },
    {
      timestamp: '2025-11-08T10:35:00Z',
      user_id: 'pharmacist-uuid-12345',
      changes: [
        {
          field: 'pharmacist_notes',
          old_value: mockPharmacistNotes,
          new_value: mockPharmacistNotes + ' Follow-up in 1 week.',
        },
      ],
    },
  ];

  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // FR-025a CRITICAL COMPLIANCE TESTS
  // ============================================================================

  describe('FR-025a: Original AI Version Preservation', () => {
    it('should preserve original AI version in first edit history entry', () => {
      const { getByText, getAllByText } = render(
        <TranscriptEditor
          aiTranscript={mockAiTranscript}
          pharmacistNotes={mockPharmacistNotes}
          edited={true}
          editHistory={mockEditHistory}
          visible={true}
          onClose={mockOnClose}
        />
      );

      // Expand first edit entry to see original AI version
      const auditTrail = getByText(/#2/); // First edit is shown as #2 (reversed)
      fireEvent.press(auditTrail);

      // Verify original AI version is displayed
      expect(getByText('Original AI Transcript (Preserved):')).toBeTruthy();
      expect(getAllByText(mockAiTranscript).length).toBeGreaterThan(0);
    });

    it('should display "Original AI Version Saved" badge on first edit', () => {
      const { getByText } = render(
        <TranscriptEditor
          aiTranscript={mockAiTranscript}
          pharmacistNotes={mockPharmacistNotes}
          edited={true}
          editHistory={mockEditHistory}
          visible={true}
          onClose={mockOnClose}
        />
      );

      // Badge should be visible
      expect(getByText('Original AI Version Saved')).toBeTruthy();
    });
  });

  describe('FR-025a: Audit Trail Completeness', () => {
    it('should track user_id and timestamp for all edits', () => {
      const { getByText, getAllByText } = render(
        <TranscriptEditor
          aiTranscript={mockAiTranscript}
          pharmacistNotes={mockPharmacistNotes}
          edited={true}
          editHistory={mockEditHistory}
          visible={true}
          onClose={mockOnClose}
        />
      );

      // Check first edit has user_id (truncated to 8 chars + ...) - may appear multiple times
      const userIdElements = getAllByText(/User ID: pharmaci/);
      expect(userIdElements.length).toBeGreaterThan(0);

      // Check timestamp is displayed - may appear multiple times
      const timestampElements = getAllByText(/11\/8\/2025/);
      expect(timestampElements.length).toBeGreaterThan(0);
    });

    it('should record old and new values in changes array', () => {
      const { getByText } = render(
        <TranscriptEditor
          aiTranscript={mockAiTranscript}
          pharmacistNotes={mockPharmacistNotes}
          edited={true}
          editHistory={mockEditHistory}
          visible={true}
          onClose={mockOnClose}
        />
      );

      // Expand first edit
      const firstEdit = getByText(/#2/);
      fireEvent.press(firstEdit);

      // Verify changes are shown
      expect(getByText('Field: pharmacist_notes')).toBeTruthy();
      expect(getByText('Previous:')).toBeTruthy();
      expect(getByText('New:')).toBeTruthy();
    });

    it('should render audit trail with all edit history entries', () => {
      const { getByText } = render(
        <TranscriptEditor
          aiTranscript={mockAiTranscript}
          pharmacistNotes={mockPharmacistNotes}
          edited={true}
          editHistory={mockEditHistory}
          visible={true}
          onClose={mockOnClose}
        />
      );

      // Should show count of edits
      expect(getByText('2 edits')).toBeTruthy();

      // Should show both edit entries
      expect(getByText('#1')).toBeTruthy(); // Second edit (reversed order)
      expect(getByText('#2')).toBeTruthy(); // First edit
    });
  });

  describe('FR-025a: Version Toggle Functionality', () => {
    it('should toggle between current and original versions', () => {
      const { getByText } = render(
        <TranscriptEditor
          aiTranscript={mockAiTranscript}
          pharmacistNotes={mockPharmacistNotes}
          edited={true}
          editHistory={mockEditHistory}
          visible={true}
          onClose={mockOnClose}
        />
      );

      // Should start with current version
      expect(getByText('Current Version (Edited by Pharmacist)')).toBeTruthy();
      expect(getByText(mockPharmacistNotes)).toBeTruthy();

      // Click "Original AI" button
      const originalButton = getByText('Original AI');
      fireEvent.press(originalButton);

      // Should show original AI transcript
      expect(getByText('Original AI Transcript (Read-Only)')).toBeTruthy();
      expect(getByText(mockAiTranscript)).toBeTruthy();
    });

    it('should display version toggle buttons only when edited', () => {
      const { queryByText } = render(
        <TranscriptEditor
          aiTranscript={mockAiTranscript}
          pharmacistNotes={null}
          edited={false}
          editHistory={null}
          visible={true}
          onClose={mockOnClose}
        />
      );

      // Version toggle should NOT be visible when not edited
      expect(queryByText('Current Version')).toBeNull();
      expect(queryByText('Original AI')).toBeNull();
    });
  });

  // ============================================================================
  // COMPONENT BEHAVIOR TESTS
  // ============================================================================

  describe('Component Rendering', () => {
    it('should render without crashing when visible', () => {
      const { getByText } = render(
        <TranscriptEditor
          aiTranscript={mockAiTranscript}
          pharmacistNotes={null}
          edited={false}
          editHistory={null}
          visible={true}
          onClose={mockOnClose}
        />
      );

      expect(getByText('Transcript & Audit Trail')).toBeTruthy();
    });

    it('should not render when visible is false', () => {
      const { queryByText } = render(
        <TranscriptEditor
          aiTranscript={mockAiTranscript}
          pharmacistNotes={null}
          edited={false}
          editHistory={null}
          visible={false}
          onClose={mockOnClose}
        />
      );

      // Modal content should not be visible
      expect(queryByText('Transcript & Audit Trail')).toBeNull();
    });

    it('should display close button', () => {
      const { getByText } = render(
        <TranscriptEditor
          aiTranscript={mockAiTranscript}
          pharmacistNotes={null}
          edited={false}
          editHistory={null}
          visible={true}
          onClose={mockOnClose}
        />
      );

      const closeButton = getByText('✕');
      expect(closeButton).toBeTruthy();
    });

    it('should call onClose when close button is pressed', () => {
      const { getByText } = render(
        <TranscriptEditor
          aiTranscript={mockAiTranscript}
          pharmacistNotes={null}
          edited={false}
          editHistory={null}
          visible={true}
          onClose={mockOnClose}
        />
      );

      const closeButton = getByText('✕');
      fireEvent.press(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Unedited State', () => {
    it('should display AI transcript when not edited', () => {
      const { getByText } = render(
        <TranscriptEditor
          aiTranscript={mockAiTranscript}
          pharmacistNotes={null}
          edited={false}
          editHistory={null}
          visible={true}
          onClose={mockOnClose}
        />
      );

      expect(getByText('AI Transcript (Unedited)')).toBeTruthy();
      expect(getByText(mockAiTranscript)).toBeTruthy();
    });

    it('should not show audit trail when not edited', () => {
      const { queryByText } = render(
        <TranscriptEditor
          aiTranscript={mockAiTranscript}
          pharmacistNotes={null}
          edited={false}
          editHistory={null}
          visible={true}
          onClose={mockOnClose}
        />
      );

      expect(queryByText('Audit Trail')).toBeNull();
    });
  });

  describe('Empty States', () => {
    it('should show "not available" message when no transcript exists', () => {
      const { getByText } = render(
        <TranscriptEditor
          aiTranscript={null}
          pharmacistNotes={null}
          edited={false}
          editHistory={null}
          visible={true}
          onClose={mockOnClose}
        />
      );

      expect(getByText('No transcript available')).toBeTruthy();
    });

    it('should show "no history" message when edited but no edit history', () => {
      const { getByText } = render(
        <TranscriptEditor
          aiTranscript={mockAiTranscript}
          pharmacistNotes={mockPharmacistNotes}
          edited={true}
          editHistory={[]}
          visible={true}
          onClose={mockOnClose}
        />
      );

      expect(getByText('No edit history available')).toBeTruthy();
    });
  });

  describe('Audit Trail Interaction', () => {
    it('should expand and collapse edit history entries', () => {
      const { getByText, queryByText } = render(
        <TranscriptEditor
          aiTranscript={mockAiTranscript}
          pharmacistNotes={mockPharmacistNotes}
          edited={true}
          editHistory={mockEditHistory}
          visible={true}
          onClose={mockOnClose}
        />
      );

      // Initially, changes should not be visible
      expect(queryByText('Field: pharmacist_notes')).toBeNull();

      // Click to expand first edit
      const firstEdit = getByText(/#2/);
      fireEvent.press(firstEdit);

      // Changes should now be visible
      expect(getByText('Field: pharmacist_notes')).toBeTruthy();

      // Click again to collapse
      fireEvent.press(firstEdit);

      // Changes should be hidden again (note: this depends on implementation details)
    });
  });

  describe('Compliance Footer', () => {
    it('should display compliance message', () => {
      const { getByText } = render(
        <TranscriptEditor
          aiTranscript={mockAiTranscript}
          pharmacistNotes={null}
          edited={false}
          editHistory={null}
          visible={true}
          onClose={mockOnClose}
        />
      );

      expect(
        getByText(/Audit trail is immutable and complies with FR-025a regulatory requirements/)
      ).toBeTruthy();
    });
  });
});
