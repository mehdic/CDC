/**
 * Test Data Generators and Fixtures
 *
 * Provides reusable test data for E2E tests.
 */

/**
 * Generate a unique email for testing
 */
export function generateTestEmail(prefix: string = 'test'): string {
  const timestamp = Date.now();
  return `${prefix}_${timestamp}@test.metapharm.ch`;
}

/**
 * Generate a unique pharmacy ID
 */
export function generatePharmacyId(): string {
  return `pharmacy_${Date.now()}`;
}

/**
 * Generate mock prescription data
 */
export function generateMockPrescription(overrides?: Partial<Prescription>) {
  const id = `rx_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  return {
    id,
    patientId: 'patient_001',
    patientName: 'Sophie Bernard',
    doctorId: 'doctor_001',
    doctorName: 'Dr. Jean Martin',
    medications: [
      {
        name: 'Paracétamol',
        dosage: '500mg',
        frequency: '3x par jour',
        duration: '7 jours',
      },
    ],
    status: 'pending',
    createdAt: new Date().toISOString(),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    ...overrides,
  };
}

interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }>;
  status: string;
  createdAt: string;
  validUntil: string;
}

/**
 * Generate mock inventory item data
 */
export function generateMockInventoryItem(overrides?: Partial<InventoryItem>) {
  const id = `item_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  return {
    id,
    name: 'Paracétamol 500mg',
    sku: `SKU${Math.floor(Math.random() * 100000)}`,
    quantity: Math.floor(Math.random() * 100),
    minQuantity: 10,
    price: 5.5,
    category: 'Analgésiques',
    manufacturer: 'Generic Pharma',
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'A1-B2',
    ...overrides,
  };
}

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  minQuantity: number;
  price: number;
  category: string;
  manufacturer: string;
  expiryDate: string;
  location: string;
}

/**
 * Generate mock patient data
 */
export function generateMockPatient(overrides?: Partial<Patient>) {
  const id = `patient_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  return {
    id,
    firstName: 'Sophie',
    lastName: 'Bernard',
    email: generateTestEmail('patient'),
    phone: '+41 79 123 45 67',
    dateOfBirth: '1985-05-15',
    address: {
      street: 'Rue de la Gare 12',
      city: 'Genève',
      postalCode: '1200',
      country: 'Suisse',
    },
    insuranceNumber: 'INS123456789',
    allergies: [],
    chronicConditions: [],
    ...overrides,
  };
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  insuranceNumber: string;
  allergies: string[];
  chronicConditions: string[];
}

/**
 * Generate array of mock prescriptions
 */
export function generateMockPrescriptions(count: number): Prescription[] {
  return Array.from({ length: count }, (_, i) =>
    generateMockPrescription({ id: `rx_${i + 1}` })
  );
}

/**
 * Generate array of mock inventory items
 */
export function generateMockInventoryItems(count: number): InventoryItem[] {
  return Array.from({ length: count }, (_, i) =>
    generateMockInventoryItem({ id: `item_${i + 1}` })
  );
}

/**
 * Generate array of mock patients
 */
export function generateMockPatients(count: number): Patient[] {
  return Array.from({ length: count }, (_, i) =>
    generateMockPatient({ id: `patient_${i + 1}` })
  );
}

/**
 * Common French error messages for validation
 */
export const errorMessages = {
  requiredEmail: "L'adresse email est requise",
  invalidEmail: "Format d'email invalide",
  requiredPassword: 'Le mot de passe est requis',
  shortPassword: 'Le mot de passe doit contenir au moins 6 caractères',
  invalidCredentials: 'Identifiants invalides',
  networkError: 'Erreur de connexion au serveur',
  unauthorized: 'Non autorisé',
  serverError: 'Erreur serveur',
};

/**
 * Common test timeouts
 */
export const timeouts = {
  short: 1000,
  medium: 5000,
  long: 10000,
  veryLong: 30000,
};
