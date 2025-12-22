/**
 * ADR Slice Redux Tests
 * Unit tests for adverse reaction Redux state management
 */

import adrReducer, {
  initializeForm,
  updateFormField,
  addSymptom,
  removeSymptom,
  addPhotoAttachment,
  removePhotoAttachment,
  setSubmitting,
  setError,
  setSuccessMessage,
  addSubmittedReport,
  setSubmittedReports,
  clearCurrentForm,
  resetADRState,
} from '../adrSlice';
import { AdverseReaction } from '../../types';

describe('ADR Slice', () => {
  describe('initial state', () => {
    it('should return the initial state', () => {
      const state = adrReducer(undefined, { type: 'unknown' });
      expect(state.currentReport).toBeNull();
      expect(state.submittedReports).toEqual([]);
      expect(state.isSubmitting).toBe(false);
      expect(state.error).toBeNull();
      expect(state.successMessage).toBeNull();
    });
  });

  describe('initializeForm', () => {
    it('should initialize form with patient and medication info', () => {
      const payload = {
        patientId: 'patient-1',
        patientName: 'John Doe',
        medicationId: 'med-1',
        medicationName: 'Aspirin',
      };

      const state = adrReducer(undefined, initializeForm(payload));

      expect(state.currentReport).not.toBeNull();
      expect(state.currentReport?.patientId).toBe('patient-1');
      expect(state.currentReport?.patientName).toBe('John Doe');
      expect(state.currentReport?.medicationId).toBe('med-1');
      expect(state.currentReport?.medicationName).toBe('Aspirin');
      expect(state.currentReport?.severity).toBe('mild');
      expect(state.currentReport?.symptoms).toEqual([]);
    });

    it('should reset error and success message on init', () => {
      let state = adrReducer(undefined, setError('Some error'));
      state = adrReducer(state, setSuccessMessage('Success'));

      const payload = {
        patientId: 'patient-1',
        patientName: 'John Doe',
      };

      state = adrReducer(state, initializeForm(payload));

      expect(state.error).toBeNull();
      expect(state.successMessage).toBeNull();
    });
  });

  describe('updateFormField', () => {
    it('should update medication name', () => {
      let state = adrReducer(
        undefined,
        initializeForm({
          patientId: 'p-1',
          patientName: 'Patient',
        })
      );

      state = adrReducer(
        state,
        updateFormField({
          field: 'medicationName',
          value: 'Ibuprofen',
        })
      );

      expect(state.currentReport?.medicationName).toBe('Ibuprofen');
    });

    it('should update severity level', () => {
      let state = adrReducer(
        undefined,
        initializeForm({
          patientId: 'p-1',
          patientName: 'Patient',
        })
      );

      state = adrReducer(
        state,
        updateFormField({
          field: 'severity',
          value: 'severe',
        })
      );

      expect(state.currentReport?.severity).toBe('severe');
    });

    it('should update action taken', () => {
      let state = adrReducer(
        undefined,
        initializeForm({
          patientId: 'p-1',
          patientName: 'Patient',
        })
      );

      state = adrReducer(
        state,
        updateFormField({
          field: 'actionTaken',
          value: 'Administered antihistamine',
        })
      );

      expect(state.currentReport?.actionTaken).toBe('Administered antihistamine');
    });
  });

  describe('symptom management', () => {
    let initialState: any;

    beforeEach(() => {
      initialState = adrReducer(
        undefined,
        initializeForm({
          patientId: 'p-1',
          patientName: 'Patient',
        })
      );
    });

    it('should add a symptom', () => {
      const state = adrReducer(initialState, addSymptom('Rash'));

      expect(state.currentReport?.symptoms).toContain('Rash');
      expect(state.currentReport?.symptoms?.length).toBe(1);
    });

    it('should not add duplicate symptoms', () => {
      let state = adrReducer(initialState, addSymptom('Fever'));
      state = adrReducer(state, addSymptom('Fever'));

      expect(state.currentReport?.symptoms?.length).toBe(1);
    });

    it('should remove a symptom', () => {
      let state = adrReducer(initialState, addSymptom('Rash'));
      state = adrReducer(state, addSymptom('Itching'));
      state = adrReducer(state, removeSymptom('Rash'));

      expect(state.currentReport?.symptoms).toEqual(['Itching']);
      expect(state.currentReport?.symptoms?.length).toBe(1);
    });

    it('should handle removing non-existent symptom', () => {
      let state = adrReducer(initialState, addSymptom('Rash'));
      state = adrReducer(state, removeSymptom('NonExistent'));

      expect(state.currentReport?.symptoms).toEqual(['Rash']);
    });
  });

  describe('photo management', () => {
    let initialState: any;

    beforeEach(() => {
      initialState = adrReducer(
        undefined,
        initializeForm({
          patientId: 'p-1',
          patientName: 'Patient',
        })
      );
    });

    it('should add photo attachment', () => {
      const photo = {
        id: 'photo-1',
        uri: 'file:///path/to/photo.jpg',
        fileName: 'photo.jpg',
      };

      const state = adrReducer(initialState, addPhotoAttachment(photo));

      expect(state.currentReport?.photoAttachments).toHaveLength(1);
      expect(state.currentReport?.photoAttachments?.[0]).toEqual(photo);
    });

    it('should add multiple photo attachments', () => {
      let state = initialState;

      const photos = [
        { id: 'photo-1', uri: 'file:///path1', fileName: 'photo1.jpg' },
        { id: 'photo-2', uri: 'file:///path2', fileName: 'photo2.jpg' },
      ];

      photos.forEach((photo) => {
        state = adrReducer(state, addPhotoAttachment(photo));
      });

      expect(state.currentReport?.photoAttachments).toHaveLength(2);
    });

    it('should remove photo attachment', () => {
      let state = initialState;

      state = adrReducer(
        state,
        addPhotoAttachment({
          id: 'photo-1',
          uri: 'file:///path1',
          fileName: 'photo1.jpg',
        })
      );
      state = adrReducer(
        state,
        addPhotoAttachment({
          id: 'photo-2',
          uri: 'file:///path2',
          fileName: 'photo2.jpg',
        })
      );

      state = adrReducer(state, removePhotoAttachment('photo-1'));

      expect(state.currentReport?.photoAttachments).toHaveLength(1);
      expect(state.currentReport?.photoAttachments?.[0].id).toBe('photo-2');
    });
  });

  describe('submission management', () => {
    it('should set submitting state', () => {
      let state = adrReducer(undefined, setSubmitting(true));
      expect(state.isSubmitting).toBe(true);

      state = adrReducer(state, setSubmitting(false));
      expect(state.isSubmitting).toBe(false);
    });

    it('should set and clear error', () => {
      let state = adrReducer(undefined, setError('Test error'));
      expect(state.error).toBe('Test error');

      state = adrReducer(state, setError(null));
      expect(state.error).toBeNull();
    });

    it('should set and clear success message', () => {
      let state = adrReducer(undefined, setSuccessMessage('Success!'));
      expect(state.successMessage).toBe('Success!');

      state = adrReducer(state, setSuccessMessage(null));
      expect(state.successMessage).toBeNull();
    });

    it('should add submitted report', () => {
      const report: AdverseReaction = {
        id: 'adr-1',
        patientId: 'p-1',
        medicationId: 'med-1',
        medicationName: 'Aspirin',
        reactionType: 'Allergic',
        severity: 'severe',
        symptoms: ['Rash', 'Itching'],
        onsetTime: '2025-12-22T10:00:00Z',
        reportedBy: 'nurse-1',
        reportedAt: '2025-12-22T10:05:00Z',
        actionTaken: 'Administered antihistamine',
        resolved: false,
      };

      let state = adrReducer(
        undefined,
        initializeForm({
          patientId: 'p-1',
          patientName: 'Patient',
        })
      );

      state = adrReducer(state, addSubmittedReport(report));

      expect(state.submittedReports).toHaveLength(1);
      expect(state.submittedReports[0]).toEqual(report);
      expect(state.currentReport).toBeNull();
    });

    it('should set multiple submitted reports', () => {
      const reports: AdverseReaction[] = [
        {
          id: 'adr-1',
          patientId: 'p-1',
          medicationId: 'med-1',
          medicationName: 'Aspirin',
          reactionType: 'Allergic',
          severity: 'mild',
          symptoms: ['Rash'],
          onsetTime: '2025-12-22T10:00:00Z',
          reportedBy: 'nurse-1',
          reportedAt: '2025-12-22T10:05:00Z',
          actionTaken: 'Administered antihistamine',
          resolved: false,
        },
        {
          id: 'adr-2',
          patientId: 'p-1',
          medicationId: 'med-2',
          medicationName: 'Ibuprofen',
          reactionType: 'Side Effect',
          severity: 'moderate',
          symptoms: ['Nausea', 'Vomiting'],
          onsetTime: '2025-12-21T10:00:00Z',
          reportedBy: 'nurse-1',
          reportedAt: '2025-12-21T10:05:00Z',
          actionTaken: 'Stopped medication',
          resolved: true,
          resolvedAt: '2025-12-22T08:00:00Z',
        },
      ];

      let state = adrReducer(undefined, setSubmittedReports(reports));

      expect(state.submittedReports).toHaveLength(2);
      expect(state.submittedReports).toEqual(reports);
    });
  });

  describe('form clearing', () => {
    it('should clear current form', () => {
      let state = adrReducer(
        undefined,
        initializeForm({
          patientId: 'p-1',
          patientName: 'Patient',
        })
      );

      state = adrReducer(state, addSymptom('Rash'));
      state = adrReducer(state, setError('Some error'));

      state = adrReducer(state, clearCurrentForm());

      expect(state.currentReport).toBeNull();
      expect(state.error).toBeNull();
      expect(state.successMessage).toBeNull();
    });

    it('should reset entire ADR state', () => {
      let state = adrReducer(
        undefined,
        initializeForm({
          patientId: 'p-1',
          patientName: 'Patient',
        })
      );

      state = adrReducer(state, setSubmitting(true));
      state = adrReducer(state, setError('Error'));

      const report: AdverseReaction = {
        id: 'adr-1',
        patientId: 'p-1',
        medicationId: 'med-1',
        medicationName: 'Aspirin',
        reactionType: 'Allergic',
        severity: 'mild',
        symptoms: ['Rash'],
        onsetTime: '2025-12-22T10:00:00Z',
        reportedBy: 'nurse-1',
        reportedAt: '2025-12-22T10:05:00Z',
        actionTaken: 'Administered antihistamine',
        resolved: false,
      };

      state = adrReducer(state, addSubmittedReport(report));

      state = adrReducer(state, resetADRState());

      expect(state.currentReport).toBeNull();
      expect(state.submittedReports).toEqual([]);
      expect(state.isSubmitting).toBe(false);
      expect(state.error).toBeNull();
      expect(state.successMessage).toBeNull();
    });
  });
});
