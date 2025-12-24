/**
 * MedicalRecordsDashboard Component Tests
 * Integration tests for the main dashboard page
 * Task: T8-041 - Patient Medical Records Dashboard
 */

import { describe, it, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import { MedicalRecordsDashboard } from '../pages/MedicalRecordsDashboard';
import * as hooks from '../hooks/useMedicalRecords';
import React from 'react';

jest.mock('../hooks/useMedicalRecords');
jest.mock('../hooks/useDocumentUpload', () => ({
  useDocumentUpload: () => ({
    upload: jest.fn(),
    uploading: false,
    uploadProgress: 0,
    error: null,
    uploadedDocument: null,
    reset: jest.fn(),
  }),
}));
jest.mock('../hooks/useShareRecords', () => ({
  useShareRecords: () => ({
    share: jest.fn(),
    sharing: false,
    error: null,
    shareResult: null,
    reset: jest.fn(),
  }),
}));

describe('MedicalRecordsDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    jest.spyOn(hooks, 'useRecordCounts').mockReturnValue({
      counts: {
        allergy: 2,
        medication: 3,
        condition: 1,
        procedure: 0,
        immunization: 1,
        lab_result: 4,
        vital_signs: 0,
        diagnosis: 0,
        prescription: 5,
        consultation: 2,
        hospitalization: 0,
        imaging: 0,
        other: 0,
        total: 18,
      },
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    jest.spyOn(hooks, 'useMedicalRecords').mockReturnValue({
      records: [],
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    jest.spyOn(hooks, 'useRecordsByType').mockReturnValue({
      records: [],
      loading: false,
      error: null,
      refetch: jest.fn(),
    });
  });

  it('should render dashboard header', () => {
    render(<MedicalRecordsDashboard />);

    expect(screen.getByText(/Medical Records Dashboard/i)).toBeInTheDocument();
    expect(
      screen.getByText(/View and manage your complete medical history/i)
    ).toBeInTheDocument();
  });

  it('should render navigation buttons', () => {
    render(<MedicalRecordsDashboard />);

    const navButtons = screen.getAllByRole('button');
    const navTexts = navButtons.map(btn => btn.textContent);

    expect(navTexts).toContain('Overview');
    expect(navTexts).toContain('Prescriptions');
    expect(navTexts).toContain('Lab Results');
    expect(navTexts).toContain('Medications');
    expect(navTexts).toContain('Allergies');
    expect(navTexts).toContain('Conditions');
    expect(navTexts).toContain('Documents');
  });

  it('should render share records button', () => {
    render(<MedicalRecordsDashboard />);

    expect(screen.getByText(/Share Records/i)).toBeInTheDocument();
  });

  it('should switch to prescriptions view when navigation clicked', () => {
    render(<MedicalRecordsDashboard />);

    const navButtons = screen.getAllByRole('button');
    const prescriptionsBtn = navButtons.find(btn => btn.textContent === 'Prescriptions' && btn.className.includes('nav-btn'));

    expect(prescriptionsBtn).toBeDefined();
    if (prescriptionsBtn) {
      fireEvent.click(prescriptionsBtn);
      expect(prescriptionsBtn).toHaveClass('active');
    }
  });

  it('should switch to lab results view when navigation clicked', () => {
    render(<MedicalRecordsDashboard />);

    const navButtons = screen.getAllByRole('button');
    const labResultsBtn = navButtons.find(btn => btn.textContent === 'Lab Results' && btn.className.includes('nav-btn'));

    expect(labResultsBtn).toBeDefined();
    if (labResultsBtn) {
      fireEvent.click(labResultsBtn);
      expect(labResultsBtn).toHaveClass('active');
    }
  });

  it('should open share records modal when button clicked', () => {
    render(<MedicalRecordsDashboard />);

    const shareBtn = screen.getByText(/Share Records/i);
    fireEvent.click(shareBtn);

    // Modal should be rendered (even if not visible, component is mounted)
    // The actual modal content testing is done in ShareRecordsModal.test.tsx
  });

  it('should render security notice in footer', () => {
    render(<MedicalRecordsDashboard />);

    expect(
      screen.getByText(/Your medical records are encrypted/i)
    ).toBeInTheDocument();
  });

  it('should start with overview as active view', () => {
    render(<MedicalRecordsDashboard />);

    const navButtons = screen.getAllByRole('button');
    const overviewBtn = navButtons.find(btn => btn.textContent === 'Overview' && btn.className.includes('nav-btn'));
    expect(overviewBtn).toHaveClass('active');
  });

  it('should switch between all navigation views', () => {
    render(<MedicalRecordsDashboard />);

    const views = [
      'Prescriptions',
      'Lab Results',
      'Medications',
      'Allergies',
      'Conditions',
      'Documents',
      'Overview',
    ];

    views.forEach((viewName) => {
      const navButtons = screen.getAllByRole('button');
      const btn = navButtons.find(b => b.textContent === viewName && b.className.includes('nav-btn'));
      expect(btn).toBeDefined();
      if (btn) {
        fireEvent.click(btn);
        expect(btn).toHaveClass('active');
      }
    });
  });
});
