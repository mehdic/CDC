/**
 * Test Data for E2E Tests
 *
 * Provides predefined test data for various delivery scenarios
 */

import { DeliveryRequest, SpecialHandling } from '../../src/types/delivery';
import { testLocations } from './mockGPS';

/**
 * Standard delivery (no special handling)
 */
export const standardDelivery: DeliveryRequest = {
  id: 'DEL-STD-001',
  pharmacyId: 'PHARM-GE-001',
  pharmacyName: 'Pharmacie de la Gare',
  patient: {
    id: 'PAT-001',
    name: 'Jean Dupont',
    phone: '+41 22 123 4567',
    address: {
      street: 'Rue du Rhône 15',
      city: 'Geneva',
      postalCode: '1204',
      canton: 'GE',
      country: 'Switzerland',
      latitude: testLocations.patientHomeGeneva.latitude,
      longitude: testLocations.patientHomeGeneva.longitude,
      instructions: 'Ring doorbell twice'
    }
  },
  packages: [
    {
      id: 'PKG-001',
      qrCode: 'QR-STD-001',
      medications: [
        {
          id: 'MED-001',
          name: 'Paracetamol 500mg',
          quantity: 30,
          dosage: '500mg',
          requiresColdChain: false,
          isControlledSubstance: false
        }
      ],
      specialHandling: []
    }
  ],
  status: 'assigned',
  priority: 'medium',
  estimatedDuration: 15,
  distance: 2.5,
  paymentMethod: 'insurance',
  createdAt: '2025-12-18T10:00:00Z',
  assignedAt: '2025-12-18T10:05:00Z'
};

/**
 * Cold chain delivery (temperature-sensitive medication)
 */
export const coldChainDelivery: DeliveryRequest = {
  id: 'DEL-CC-001',
  pharmacyId: 'PHARM-GE-001',
  pharmacyName: 'Pharmacie de la Gare',
  patient: {
    id: 'PAT-002',
    name: 'Marie Martin',
    phone: '+41 22 987 6543',
    address: {
      street: 'Avenue de France 8',
      city: 'Geneva',
      postalCode: '1202',
      canton: 'GE',
      country: 'Switzerland',
      latitude: 46.2097,
      longitude: 6.1432
    }
  },
  packages: [
    {
      id: 'PKG-CC-001',
      qrCode: 'QR-CC-001',
      medications: [
        {
          id: 'MED-CC-001',
          name: 'Insulin Glargine',
          quantity: 3,
          dosage: '100 units/mL',
          requiresColdChain: true,
          isControlledSubstance: false
        }
      ],
      specialHandling: ['cold_chain' as SpecialHandling],
      temperatureLog: [
        {
          timestamp: '2025-12-18T10:00:00Z',
          temperature: 4.5,
          withinRange: true
        },
        {
          timestamp: '2025-12-18T10:15:00Z',
          temperature: 5.2,
          withinRange: true
        }
      ]
    }
  ],
  status: 'assigned',
  priority: 'high',
  estimatedDuration: 20,
  distance: 3.2,
  paymentMethod: 'insurance',
  specialInstructions: 'Keep refrigerated at all times. Temperature must remain between 2-8°C',
  createdAt: '2025-12-18T09:30:00Z',
  assignedAt: '2025-12-18T09:35:00Z'
};

/**
 * Controlled substance delivery (narcotics - requires ID verification and signature)
 */
export const controlledSubstanceDelivery: DeliveryRequest = {
  id: 'DEL-CS-001',
  pharmacyId: 'PHARM-ZH-001',
  pharmacyName: 'Bahnhof Apotheke',
  patient: {
    id: 'PAT-003',
    name: 'Hans Mueller',
    phone: '+41 44 123 4567',
    address: {
      street: 'Bahnhofstrasse 50',
      city: 'Zurich',
      postalCode: '8001',
      canton: 'ZH',
      country: 'Switzerland',
      latitude: testLocations.patientHomeZurich.latitude,
      longitude: testLocations.patientHomeZurich.longitude,
      instructions: 'Apartment 3B, 2nd floor'
    },
    availabilityWindow: {
      start: '2025-12-18T14:00:00Z',
      end: '2025-12-18T18:00:00Z'
    }
  },
  packages: [
    {
      id: 'PKG-CS-001',
      qrCode: 'QR-CS-001',
      medications: [
        {
          id: 'MED-CS-001',
          name: 'Morphine Sulfate SR',
          quantity: 60,
          dosage: '30mg',
          requiresColdChain: false,
          isControlledSubstance: true
        }
      ],
      specialHandling: [
        'narcotics' as SpecialHandling,
        'id_verification' as SpecialHandling,
        'signature_required' as SpecialHandling
      ]
    }
  ],
  status: 'assigned',
  priority: 'urgent',
  estimatedDuration: 25,
  distance: 4.5,
  paymentMethod: 'insurance',
  specialInstructions: 'CONTROLLED SUBSTANCE: Verify patient ID and obtain signature. Patient must be present.',
  createdAt: '2025-12-18T09:00:00Z',
  assignedAt: '2025-12-18T09:10:00Z'
};

/**
 * Failed delivery scenario (patient absent)
 */
export const failedDelivery: DeliveryRequest = {
  id: 'DEL-FAIL-001',
  pharmacyId: 'PHARM-GE-001',
  pharmacyName: 'Pharmacie de la Gare',
  patient: {
    id: 'PAT-004',
    name: 'Pierre Dubois',
    phone: '+41 22 555 1234',
    address: {
      street: 'Rue de Lausanne 100',
      city: 'Geneva',
      postalCode: '1202',
      canton: 'GE',
      country: 'Switzerland',
      latitude: 46.2120,
      longitude: 6.1450
    }
  },
  packages: [
    {
      id: 'PKG-FAIL-001',
      qrCode: 'QR-FAIL-001',
      medications: [
        {
          id: 'MED-FAIL-001',
          name: 'Amoxicillin 500mg',
          quantity: 21,
          dosage: '500mg',
          requiresColdChain: false,
          isControlledSubstance: false
        }
      ],
      specialHandling: []
    }
  ],
  status: 'assigned',
  priority: 'medium',
  estimatedDuration: 18,
  distance: 3.0,
  paymentMethod: 'cash',
  createdAt: '2025-12-18T11:00:00Z',
  assignedAt: '2025-12-18T11:05:00Z'
};

/**
 * Collection of all test deliveries
 */
export const testDeliveries = {
  standardDelivery,
  coldChainDelivery,
  controlledSubstanceDelivery,
  failedDelivery
};

/**
 * Test user credentials
 */
export const testUser = {
  email: 'delivery@test.com',
  password: 'Test123!',
  name: 'Test Delivery Person',
  badgeNumber: 'DLV-001'
};
