/**
 * Medication Order Service
 * Handles order creation, validation, and submission
 */

import { MedicationOrder } from '../types/nurse';
import nurseApi from './nurseApi';

export interface OrderValidationError {
  field: string;
  message: string;
}

/**
 * Validates medication order data
 */
export const validateMedicationOrder = (orderData: {
  patientId: string;
  medications: {
    medicationId: string;
    name: string;
    quantity: number;
    dosage: string;
  }[];
  urgency: 'routine' | 'urgent' | 'stat';
  notes?: string;
}): OrderValidationError[] => {
  const errors: OrderValidationError[] = [];

  // Validate patient ID
  if (!orderData.patientId || orderData.patientId.trim().length === 0) {
    errors.push({
      field: 'patientId',
      message: 'Patient ID is required',
    });
  }

  // Validate medications
  if (!orderData.medications || orderData.medications.length === 0) {
    errors.push({
      field: 'medications',
      message: 'At least one medication must be selected',
    });
  }

  orderData.medications.forEach((med, index) => {
    if (!med.medicationId || med.medicationId.trim().length === 0) {
      errors.push({
        field: `medications.${index}.medicationId`,
        message: 'Medication ID is required',
      });
    }

    if (!med.name || med.name.trim().length === 0) {
      errors.push({
        field: `medications.${index}.name`,
        message: 'Medication name is required',
      });
    }

    if (typeof med.quantity !== 'number' || med.quantity <= 0) {
      errors.push({
        field: `medications.${index}.quantity`,
        message: 'Quantity must be a positive number',
      });
    }

    if (!med.dosage || med.dosage.trim().length === 0) {
      errors.push({
        field: `medications.${index}.dosage`,
        message: 'Dosage is required',
      });
    }
  });

  // Validate urgency
  const validUrgencies = ['routine', 'urgent', 'stat'];
  if (!validUrgencies.includes(orderData.urgency)) {
    errors.push({
      field: 'urgency',
      message: 'Invalid urgency level',
    });
  }

  return errors;
};

/**
 * Creates and submits a medication order
 */
export const createMedicationOrder = async (
  orderData: {
    patientId: string;
    medications: {
      medicationId: string;
      name: string;
      quantity: number;
      dosage: string;
    }[];
    urgency: 'routine' | 'urgent' | 'stat';
    notes?: string;
  },
  nurseName: string,
  pharmacyId: string
): Promise<MedicationOrder> => {
  // Validate order first
  const validationErrors = validateMedicationOrder(orderData);
  if (validationErrors.length > 0) {
    const errorMessages = validationErrors.map((e) => e.message).join(', ');
    throw new Error(`Order validation failed: ${errorMessages}`);
  }

  // Prepare API payload
  const payload = {
    patientId: orderData.patientId,
    pharmacyId,
    medications: orderData.medications,
    urgency: orderData.urgency,
    orderedBy: nurseName,
    notes: orderData.notes || '',
  };

  const response = await nurseApi.createMedicationOrder(
    payload as Omit<MedicationOrder, 'id' | 'orderedAt'>
  );

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to create medication order');
  }

  return response.data;
};

/**
 * Fetches available medications for selection
 */
export const fetchAvailableMedications = async (): Promise<
  {
    id: string;
    name: string;
    dosageOptions: string[];
    route: 'oral' | 'IV' | 'IM' | 'topical' | 'other';
    contraindications?: string[];
  }[]
> => {
  // This would connect to a medication database API
  // For now, return mock data
  return [
    {
      id: 'med-001',
      name: 'Acetaminophen',
      dosageOptions: ['500mg', '1000mg'],
      route: 'oral',
    },
    {
      id: 'med-002',
      name: 'Ibuprofen',
      dosageOptions: ['200mg', '400mg', '600mg'],
      route: 'oral',
    },
    {
      id: 'med-003',
      name: 'Penicillin',
      dosageOptions: ['250mg', '500mg'],
      route: 'oral',
    },
    {
      id: 'med-004',
      name: 'Insulin',
      dosageOptions: ['10 units', '20 units', '40 units'],
      route: 'IV',
    },
  ];
};

/**
 * Checks for drug interactions with patient allergies
 */
export const checkDrugInteractions = async (
  medicationId: string,
  patientAllergies: string[]
): Promise<{
  hasInteraction: boolean;
  severity: 'none' | 'low' | 'moderate' | 'severe';
  message: string;
}> => {
  // This would connect to a drug interaction API
  // For now, return mock data
  const allergySet = new Set(patientAllergies.map((a) => a.toLowerCase()));

  if (allergySet.has('penicillin') && medicationId === 'med-003') {
    return {
      hasInteraction: true,
      severity: 'severe',
      message: 'Patient has documented penicillin allergy',
    };
  }

  return {
    hasInteraction: false,
    severity: 'none',
    message: 'No known interactions',
  };
};

export default {
  validateMedicationOrder,
  createMedicationOrder,
  fetchAvailableMedications,
  checkDrugInteractions,
};
