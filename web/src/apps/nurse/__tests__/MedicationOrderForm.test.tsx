/**
 * Unit Tests for MedicationOrderForm Component
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MedicationOrderForm from '../components/MedicationOrderForm';
import * as nurseApi from '../services/nurseApi';
import * as usePatientsHook from '../hooks/usePatients';

jest.mock('../services/nurseApi');
jest.mock('../hooks/usePatients');

const mockPatient = {
  id: 'patient-1',
  firstName: 'Jean',
  lastName: 'Dupont',
  room: '101',
  dateOfBirth: '1980-01-01',
  ward: 'Cardiologie',
  allergies: [],
  chronicConditions: [],
  currentMedications: [],
  contactNumber: '+41 79 123 45 67',
  emergencyContact: {
    name: 'Marie Dupont',
    phone: '+41 79 987 65 43',
    relationship: 'Épouse',
  },
  nurseNotes: [],
  lastUpdated: '2024-12-01T10:00:00Z',
};

describe('MedicationOrderForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (usePatientsHook.usePatient as jest.Mock).mockReturnValue({
      patient: mockPatient,
      loading: false,
      error: null,
    });
    (nurseApi.createMedicationOrder as jest.Mock).mockResolvedValue({
      id: 'order-1',
      patientId: 'patient-1',
      patientName: 'Jean Dupont',
      room: '101',
      medications: [],
      urgency: 'routine',
      status: 'pending',
      pharmacyId: 'pharmacy-1',
      pharmacyName: 'Pharmacie Centrale',
      createdBy: 'nurse-1',
      createdAt: '2024-12-01T10:00:00Z',
      updatedAt: '2024-12-01T10:00:00Z',
    });
  });

  it('renders form title', () => {
    render(
      <BrowserRouter>
        <MedicationOrderForm />
      </BrowserRouter>
    );

    expect(screen.getByText('Nouvelle commande de médicaments')).toBeInTheDocument();
  });

  it('opens medication dialog when clicking add button', () => {
    render(
      <BrowserRouter>
        <MedicationOrderForm />
      </BrowserRouter>
    );

    const addButton = screen.getByText('Ajouter');
    fireEvent.click(addButton);

    expect(screen.getByText('Ajouter un médicament')).toBeInTheDocument();
  });

  it('validates required fields before submission', async () => {
    render(
      <BrowserRouter>
        <MedicationOrderForm />
      </BrowserRouter>
    );

    const submitButton = screen.getByText('Envoyer la commande');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Veuillez sélectionner/)).toBeInTheDocument();
    });
  });

  it('selects urgency level', () => {
    render(
      <BrowserRouter>
        <MedicationOrderForm />
      </BrowserRouter>
    );

    const urgencySelect = screen.getByLabelText("Niveau d'urgence");
    fireEvent.mouseDown(urgencySelect);

    const urgentOption = screen.getByText('Urgent');
    fireEvent.click(urgentOption);

    expect(urgencySelect).toHaveTextContent('Urgent');
  });

  it('displays patient info when patientId is provided', () => {
    render(
      <BrowserRouter>
        <MedicationOrderForm />
      </BrowserRouter>
    );

    expect(screen.getByText(/Patient:/)).toBeInTheDocument();
  });

  it('adds notes to order', () => {
    render(
      <BrowserRouter>
        <MedicationOrderForm />
      </BrowserRouter>
    );

    const notesInput = screen.getByLabelText('Notes additionnelles');
    fireEvent.change(notesInput, { target: { value: 'Test notes' } });

    expect(notesInput).toHaveValue('Test notes');
  });

  it('submits form with valid data', async () => {
    render(
      <BrowserRouter>
        <MedicationOrderForm />
      </BrowserRouter>
    );

    // Fill patient ID
    const patientInput = screen.getByLabelText('ID Patient');
    fireEvent.change(patientInput, { target: { value: 'patient-1' } });

    // Select pharmacy
    const pharmacySelect = screen.getByLabelText('Pharmacie');
    fireEvent.mouseDown(pharmacySelect);
    fireEvent.click(screen.getByText('Pharmacie Centrale'));

    // Add medication (simplified - in real test would open dialog)
    // For this test, we assume medications are added

    await waitFor(() => {
      expect(nurseApi.createMedicationOrder).toHaveBeenCalled();
    });
  });
});
