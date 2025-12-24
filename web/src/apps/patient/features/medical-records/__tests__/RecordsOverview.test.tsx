/**
 * RecordsOverview Component Tests
 * Unit tests for RecordsOverview component
 * Task: T8-041 - Patient Medical Records Dashboard
 */

import { describe, it, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecordsOverview } from '../components/RecordsOverview';
import * as hooks from '../hooks/useMedicalRecords';
import { RecordType } from '../types';
import React from 'react';

jest.mock('../hooks/useMedicalRecords');

describe('RecordsOverview', () => {
  const mockOnCategoryClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display loading state', () => {
    jest.spyOn(hooks, 'useRecordCounts').mockReturnValue({
      counts: null,
      loading: true,
      error: null,
      refetch: jest.fn(),
    });

    render(<RecordsOverview onCategoryClick={mockOnCategoryClick} />);

    expect(screen.getByText(/Loading your medical records/i)).toBeInTheDocument();
  });

  it('should display error state', () => {
    const error = new Error('Failed to fetch');
    jest.spyOn(hooks, 'useRecordCounts').mockReturnValue({
      counts: null,
      loading: false,
      error,
      refetch: jest.fn(),
    });

    render(<RecordsOverview onCategoryClick={mockOnCategoryClick} />);

    expect(screen.getByText(/Error loading medical records/i)).toBeInTheDocument();
    expect(screen.getByText(error.message)).toBeInTheDocument();
  });

  it('should display empty state when no counts', () => {
    jest.spyOn(hooks, 'useRecordCounts').mockReturnValue({
      counts: null,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<RecordsOverview onCategoryClick={mockOnCategoryClick} />);

    expect(screen.getByText(/No medical records found/i)).toBeInTheDocument();
  });

  it('should display record counts', () => {
    const mockCounts = {
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
    };

    jest.spyOn(hooks, 'useRecordCounts').mockReturnValue({
      counts: mockCounts,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<RecordsOverview onCategoryClick={mockOnCategoryClick} />);

    expect(screen.getByText(/My Medical Records/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Records:/i)).toBeInTheDocument();
    expect(screen.getByText(/18/)).toBeInTheDocument();
    expect(screen.getByText(/Prescriptions/i)).toBeInTheDocument();
    expect(screen.getByText(/5/)).toBeInTheDocument();
    expect(screen.getByText(/Lab Results/i)).toBeInTheDocument();
    expect(screen.getByText(/4/)).toBeInTheDocument();
  });

  it('should call onCategoryClick when a category card is clicked', () => {
    const mockCounts = {
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
    };

    jest.spyOn(hooks, 'useRecordCounts').mockReturnValue({
      counts: mockCounts,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<RecordsOverview onCategoryClick={mockOnCategoryClick} />);

    const prescriptionCard = screen.getByText(/Prescriptions/i).closest('div');
    if (prescriptionCard) {
      fireEvent.click(prescriptionCard);
      expect(mockOnCategoryClick).toHaveBeenCalledWith(RecordType.PRESCRIPTION);
    }
  });

  it('should handle keyboard navigation', () => {
    const mockCounts = {
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
    };

    jest.spyOn(hooks, 'useRecordCounts').mockReturnValue({
      counts: mockCounts,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<RecordsOverview onCategoryClick={mockOnCategoryClick} />);

    const prescriptionCard = screen.getByText(/Prescriptions/i).closest('div');
    if (prescriptionCard) {
      fireEvent.keyDown(prescriptionCard, { key: 'Enter' });
      expect(mockOnCategoryClick).toHaveBeenCalledWith(RecordType.PRESCRIPTION);
    }
  });
});
