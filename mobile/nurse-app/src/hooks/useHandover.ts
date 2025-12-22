/**
 * useHandover Hook
 * Custom hook for shift handover functionality
 */

import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import {
  createHandover,
  fetchHandoverNotes,
  fetchMyHandoverNotes,
  clearError,
  clearSuccess,
  acknowledgeHandover,
  setCurrentNote,
} from '../store/handoverSlice';
import { ShiftHandoverNote } from '../types/nurse';

export const useHandover = () => {
  const dispatch = useDispatch<AppDispatch>();
  const handoverState = useSelector((state: RootState) => state.handover);

  const handleCreateHandover = (note: Omit<ShiftHandoverNote, 'id' | 'createdAt'>) => {
    return dispatch(createHandover(note));
  };

  const handleFetchHandoverNotes = (date: string) => {
    return dispatch(fetchHandoverNotes(date));
  };

  const handleFetchMyHandoverNotes = () => {
    return dispatch(fetchMyHandoverNotes());
  };

  const handleClearError = () => {
    dispatch(clearError());
  };

  const handleClearSuccess = () => {
    dispatch(clearSuccess());
  };

  const handleAcknowledgeHandover = (noteId: string) => {
    dispatch(acknowledgeHandover(noteId));
  };

  const handleSetCurrentNote = (note: ShiftHandoverNote | null) => {
    dispatch(setCurrentNote(note));
  };

  return {
    notes: handoverState.notes,
    currentNote: handoverState.currentNote,
    loading: handoverState.loading,
    error: handoverState.error,
    success: handoverState.success,
    acknowledgedNotes: handoverState.acknowledgedNotes,
    createHandover: handleCreateHandover,
    fetchHandoverNotes: handleFetchHandoverNotes,
    fetchMyHandoverNotes: handleFetchMyHandoverNotes,
    clearError: handleClearError,
    clearSuccess: handleClearSuccess,
    acknowledgeHandover: handleAcknowledgeHandover,
    setCurrentNote: handleSetCurrentNote,
  };
};

export default useHandover;
