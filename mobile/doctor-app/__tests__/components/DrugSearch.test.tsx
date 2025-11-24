/**
 * Unit Tests: DrugSearch Component
 * Tests AI-powered drug search functionality
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import DrugSearch from '../../src/components/DrugSearch';
import { drugApi } from '../../src/services/api';

// Mock the App module to provide theme
jest.mock('../../src/App', () => ({
  theme: {
    colors: {
      primary: '#2196F3',
      secondary: '#03DAC6',
      background: '#FFFFFF',
      surface: '#F5F5F5',
      error: '#B00020',
      success: '#4CAF50',
      warning: '#FF9800',
      text: '#000000',
      textSecondary: '#666666',
      border: '#E0E0E0',
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
    },
    typography: {
      h1: { fontSize: 32, fontWeight: '700' },
      h2: { fontSize: 24, fontWeight: '600' },
      h3: { fontSize: 20, fontWeight: '600' },
      body1: { fontSize: 16, fontWeight: '400' },
      body2: { fontSize: 14, fontWeight: '400' },
      caption: { fontSize: 12, fontWeight: '400' },
    },
  },
}));

jest.mock('../../src/services/api');

describe('DrugSearch Component', () => {
  const mockOnSelectDrug = jest.fn();

  const mockDrugSuggestions = [
    {
      drug: {
        id: 'drug-1',
        name: 'Amoxicillin',
        rxnorm_code: 'RX123',
        generic_name: 'Amoxicillin',
        common_dosages: ['500mg', '250mg'],
      },
      confidence: 95,
      reason: 'Commonly prescribed for bacterial infections',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render search input', () => {
    const { getByPlaceholderText } = render(
      <DrugSearch onSelectDrug={mockOnSelectDrug} />
    );

    expect(getByPlaceholderText('Search medication...')).toBeTruthy();
  });

  it('should search drugs when typing', async () => {
    (drugApi.search as jest.Mock).mockResolvedValue(mockDrugSuggestions);

    const { getByPlaceholderText, getByText } = render(
      <DrugSearch onSelectDrug={mockOnSelectDrug} />
    );

    const input = getByPlaceholderText('Search medication...');
    fireEvent.changeText(input, 'Amox');

    await waitFor(() => {
      expect(drugApi.search).toHaveBeenCalledWith('Amox');
    });
  });

  it('should display drug suggestions', async () => {
    (drugApi.search as jest.Mock).mockResolvedValue(mockDrugSuggestions);

    const { getByPlaceholderText, findByText } = render(
      <DrugSearch onSelectDrug={mockOnSelectDrug} />
    );

    const input = getByPlaceholderText('Search medication...');
    fireEvent.changeText(input, 'Amox');

    const drugName = await findByText('Amoxicillin');
    expect(drugName).toBeTruthy();
  });

  it('should call onSelectDrug when drug is selected', async () => {
    (drugApi.search as jest.Mock).mockResolvedValue(mockDrugSuggestions);

    const { getByPlaceholderText, findByText } = render(
      <DrugSearch onSelectDrug={mockOnSelectDrug} />
    );

    const input = getByPlaceholderText('Search medication...');
    fireEvent.changeText(input, 'Amox');

    const drugName = await findByText('Amoxicillin');
    fireEvent.press(drugName.parent!);

    expect(mockOnSelectDrug).toHaveBeenCalledWith('Amoxicillin', 'RX123');
  });

  it('should display confidence badge for high confidence drugs', async () => {
    (drugApi.search as jest.Mock).mockResolvedValue(mockDrugSuggestions);

    const { getByPlaceholderText, findByText } = render(
      <DrugSearch onSelectDrug={mockOnSelectDrug} />
    );

    const input = getByPlaceholderText('Search medication...');
    fireEvent.changeText(input, 'Amox');

    const confidence = await findByText('95%');
    expect(confidence).toBeTruthy();
  });

  it('should handle search errors gracefully', async () => {
    (drugApi.search as jest.Mock).mockRejectedValue(new Error('API Error'));

    const { getByPlaceholderText, findByText } = render(
      <DrugSearch onSelectDrug={mockOnSelectDrug} />
    );

    const input = getByPlaceholderText('Search medication...');
    fireEvent.changeText(input, 'Amox');

    const errorMessage = await findByText(/API Error/);
    expect(errorMessage).toBeTruthy();
  });

  it('should not search for queries less than 2 characters', () => {
    const { getByPlaceholderText } = render(
      <DrugSearch onSelectDrug={mockOnSelectDrug} />
    );

    const input = getByPlaceholderText('Search medication...');
    fireEvent.changeText(input, 'A');

    expect(drugApi.search).not.toHaveBeenCalled();
  });
});
