/**
 * Test User Fixtures
 * Predefined user accounts for all 5 roles
 */

export const testUsers = {
  patient: {
    email: 'patient@test.metapharm.ch',
    password: 'TestPassword123!',
    firstName: 'Jean',
    lastName: 'Dupont',
    role: 'PATIENT',
    userId: 'patient-001',
    phone: '+41791234567',
  },
  pharmacist: {
    email: 'pharmacist@test.metapharm.ch',
    password: 'TestPassword123!',
    firstName: 'Marie',
    lastName: 'Martin',
    role: 'PHARMACIST',
    userId: 'pharmacist-001',
    phone: '+41792234567',
    pharmacyId: 'pharmacy-001',
    pharmacyName: 'Pharmacie du Centre',
  },
  doctor: {
    email: 'doctor@test.metapharm.ch',
    password: 'TestPassword123!',
    firstName: 'Pierre',
    lastName: 'Bernard',
    role: 'DOCTOR',
    userId: 'doctor-001',
    phone: '+41793234567',
    licensingNumber: 'MED123456',
  },
  nurse: {
    email: 'nurse@test.metapharm.ch',
    password: 'TestPassword123!',
    firstName: 'Sophie',
    lastName: 'Richard',
    role: 'NURSE',
    userId: 'nurse-001',
    phone: '+41794234567',
    institutionId: 'institution-001',
  },
  delivery: {
    email: 'delivery@test.metapharm.ch',
    password: 'TestPassword123!',
    firstName: 'Thomas',
    lastName: 'Moreau',
    role: 'DELIVERY',
    userId: 'delivery-001',
    phone: '+41795234567',
    vehicleId: 'vehicle-001',
  },
};

export const invalidUsers = {
  wrongPassword: {
    email: 'patient@test.metapharm.ch',
    password: 'WrongPassword123!',
  },
  nonexistentEmail: {
    email: 'nonexistent@test.metapharm.ch',
    password: 'TestPassword123!',
  },
  malformedEmail: {
    email: 'invalid-email',
    password: 'TestPassword123!',
  },
  emptyPassword: {
    email: 'patient@test.metapharm.ch',
    password: '',
  },
};
