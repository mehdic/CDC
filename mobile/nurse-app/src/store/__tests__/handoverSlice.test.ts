/**
 * Handover Slice Tests
 * Unit tests for shift handover state management
 */

import handoverReducer, {
  createHandover,
  fetchHandoverNotes,
  fetchMyHandoverNotes,
  clearError,
  clearSuccess,
  setCurrentNote,
  acknowledgeHandover,
  resetState,
} from '../handoverSlice';
import { ShiftHandoverNote } from '../../types/nurse';

describe('handoverSlice', () => {
  const initialState = {
    notes: [],
    currentNote: null,
    loading: false,
    error: null,
    success: false,
    acknowledgedNotes: [],
  };

  const mockNote: ShiftHandoverNote = {
    id: '1',
    fromNurse: 'nurse-001',
    shift: 'day',
    date: '2025-12-22',
    patients: [
      {
        patientId: 'pat-001',
        patientName: 'John Doe',
        status: 'Stable',
        criticalNotes: 'Post-op day 2',
        pendingTasks: ['Change dressing', 'Check vitals'],
      },
    ],
    generalNotes: 'All patients stable',
    createdAt: '2025-12-22T10:00:00Z',
  };

  const mockNotesList: ShiftHandoverNote[] = [
    mockNote,
    {
      ...mockNote,
      id: '2',
      date: '2025-12-21',
    },
  ];

  describe('reducers', () => {
    it('should return initial state', () => {
      expect(handoverReducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });

    it('should handle clearError', () => {
      const stateWithError = {
        ...initialState,
        error: 'Test error',
      };
      const actual = handoverReducer(stateWithError, clearError());
      expect(actual.error).toBeNull();
    });

    it('should handle clearSuccess', () => {
      const stateWithSuccess = {
        ...initialState,
        success: true,
      };
      const actual = handoverReducer(stateWithSuccess, clearSuccess());
      expect(actual.success).toBe(false);
    });

    it('should handle setCurrentNote', () => {
      const actual = handoverReducer(initialState, setCurrentNote(mockNote));
      expect(actual.currentNote).toEqual(mockNote);
    });

    it('should handle setCurrentNote with null', () => {
      const stateWithNote = {
        ...initialState,
        currentNote: mockNote,
      };
      const actual = handoverReducer(stateWithNote, setCurrentNote(null));
      expect(actual.currentNote).toBeNull();
    });

    it('should handle acknowledgeHandover', () => {
      const actual = handoverReducer(initialState, acknowledgeHandover('note-1'));
      expect(actual.acknowledgedNotes).toContain('note-1');
    });

    it('should not add duplicate acknowledged notes', () => {
      const stateWithAck = {
        ...initialState,
        acknowledgedNotes: ['note-1'],
      };
      const actual = handoverReducer(stateWithAck, acknowledgeHandover('note-1'));
      expect(actual.acknowledgedNotes).toEqual(['note-1']);
      expect(actual.acknowledgedNotes.length).toBe(1);
    });

    it('should handle resetState', () => {
      const complexState = {
        notes: mockNotesList,
        currentNote: mockNote,
        loading: true,
        error: 'Some error',
        success: true,
        acknowledgedNotes: ['1', '2'],
      };
      const actual = handoverReducer(complexState, resetState());
      expect(actual).toEqual(initialState);
    });
  });

  describe('async thunks', () => {
    describe('createHandover', () => {
      it('should set loading on pending', () => {
        const action = { type: createHandover.pending.type };
        const state = handoverReducer(initialState, action);
        expect(state.loading).toBe(true);
        expect(state.error).toBeNull();
        expect(state.success).toBe(false);
      });

      it('should handle fulfilled createHandover', () => {
        const action = {
          type: createHandover.fulfilled.type,
          payload: mockNote,
        };
        const state = handoverReducer(initialState, action);
        expect(state.loading).toBe(false);
        expect(state.success).toBe(true);
        expect(state.notes).toContain(mockNote);
        expect(state.currentNote).toEqual(mockNote);
      });

      it('should add new note to beginning of list', () => {
        const existingState = {
          ...initialState,
          notes: mockNotesList,
        };
        const newNote: ShiftHandoverNote = {
          ...mockNote,
          id: '99',
        };
        const action = {
          type: createHandover.fulfilled.type,
          payload: newNote,
        };
        const state = handoverReducer(existingState, action);
        expect(state.notes[0]).toEqual(newNote);
        expect(state.notes.length).toBe(3);
      });

      it('should handle rejected createHandover', () => {
        const action = {
          type: createHandover.rejected.type,
          error: { message: 'Network error' },
        };
        const state = handoverReducer(initialState, action);
        expect(state.loading).toBe(false);
        expect(state.error).toBe('Network error');
        expect(state.success).toBe(false);
      });
    });

    describe('fetchHandoverNotes', () => {
      it('should set loading on pending', () => {
        const action = { type: fetchHandoverNotes.pending.type };
        const state = handoverReducer(initialState, action);
        expect(state.loading).toBe(true);
        expect(state.error).toBeNull();
      });

      it('should handle fulfilled fetchHandoverNotes', () => {
        const action = {
          type: fetchHandoverNotes.fulfilled.type,
          payload: mockNotesList,
        };
        const state = handoverReducer(initialState, action);
        expect(state.loading).toBe(false);
        expect(state.notes).toEqual(mockNotesList);
        expect(state.notes.length).toBe(2);
      });

      it('should handle rejected fetchHandoverNotes', () => {
        const action = {
          type: fetchHandoverNotes.rejected.type,
          error: { message: 'Failed to fetch notes' },
        };
        const state = handoverReducer(initialState, action);
        expect(state.loading).toBe(false);
        expect(state.error).toBe('Failed to fetch notes');
      });
    });

    describe('fetchMyHandoverNotes', () => {
      it('should set loading on pending', () => {
        const action = { type: fetchMyHandoverNotes.pending.type };
        const state = handoverReducer(initialState, action);
        expect(state.loading).toBe(true);
        expect(state.error).toBeNull();
      });

      it('should handle fulfilled fetchMyHandoverNotes', () => {
        const action = {
          type: fetchMyHandoverNotes.fulfilled.type,
          payload: [mockNote],
        };
        const state = handoverReducer(initialState, action);
        expect(state.loading).toBe(false);
        expect(state.notes).toEqual([mockNote]);
      });

      it('should handle rejected fetchMyHandoverNotes', () => {
        const action = {
          type: fetchMyHandoverNotes.rejected.type,
          error: { message: 'Unauthorized' },
        };
        const state = handoverReducer(initialState, action);
        expect(state.loading).toBe(false);
        expect(state.error).toBe('Unauthorized');
      });
    });
  });

  describe('state transitions', () => {
    it('should handle loading multiple notes then acknowledging', () => {
      let state = initialState;

      // Load notes
      state = handoverReducer(state, {
        type: fetchHandoverNotes.fulfilled.type,
        payload: mockNotesList,
      });
      expect(state.notes.length).toBe(2);
      expect(state.acknowledgedNotes.length).toBe(0);

      // Acknowledge first note
      state = handoverReducer(state, acknowledgeHandover('1'));
      expect(state.acknowledgedNotes).toContain('1');

      // Acknowledge second note
      state = handoverReducer(state, acknowledgeHandover('2'));
      expect(state.acknowledgedNotes.length).toBe(2);
    });

    it('should clear error after setting new one', () => {
      let state = initialState;

      // Create error
      state = handoverReducer(state, {
        type: createHandover.rejected.type,
        error: { message: 'First error' },
      });
      expect(state.error).toBe('First error');

      // Clear error
      state = handoverReducer(state, clearError());
      expect(state.error).toBeNull();
    });

    it('should update current note and reset on create', () => {
      let state = initialState;

      // Set current note
      state = handoverReducer(state, setCurrentNote(mockNote));
      expect(state.currentNote).toEqual(mockNote);

      // Create new note
      const newNote: ShiftHandoverNote = {
        ...mockNote,
        id: '99',
      };
      state = handoverReducer(state, {
        type: createHandover.fulfilled.type,
        payload: newNote,
      });
      expect(state.currentNote).toEqual(newNote);
      expect(state.notes[0]).toEqual(newNote);
    });
  });

  describe('error handling', () => {
    it('should handle error message fallback for createHandover', () => {
      const action = {
        type: createHandover.rejected.type,
        error: {},
      };
      const state = handoverReducer(initialState, action);
      expect(state.error).toBe('Failed to create handover note');
    });

    it('should handle error message fallback for fetchHandoverNotes', () => {
      const action = {
        type: fetchHandoverNotes.rejected.type,
        error: {},
      };
      const state = handoverReducer(initialState, action);
      expect(state.error).toBe('Failed to fetch handover notes');
    });

    it('should handle error message fallback for fetchMyHandoverNotes', () => {
      const action = {
        type: fetchMyHandoverNotes.rejected.type,
        error: {},
      };
      const state = handoverReducer(initialState, action);
      expect(state.error).toBe('Failed to fetch my handover notes');
    });
  });
});
