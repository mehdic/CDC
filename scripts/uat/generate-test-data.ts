/**
 * MetaPharm Connect - UAT Test Data Generation Script
 *
 * Generates synthetic test data for User Acceptance Testing
 * Includes all 5 user roles with realistic healthcare data
 *
 * Usage:
 *   npx ts-node scripts/uat/generate-test-data.ts
 *   npm run seed:uat
 *
 * @version 1.0.0
 * @author MetaPharm Connect Team
 */

import { faker } from '@faker-js/faker/locale/fr_CH';

// Configure faker for Swiss French
faker.seed(12345); // Reproducible data

// ============================================================================
// Type Definitions
// ============================================================================

interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;
  createdAt: Date;
  mfaEnabled: boolean;
  mfaSecret?: string;
}

type UserRole = 'pharmacist' | 'doctor' | 'nurse' | 'delivery' | 'patient';

interface Pharmacist extends User {
  role: 'pharmacist';
  pharmacyId: string;
  licenseNumber: string;
  isOwner: boolean;
}

interface Doctor extends User {
  role: 'doctor';
  hinId: string;
  specialty: string;
  clinicName: string;
}

interface Nurse extends User {
  role: 'nurse';
  facilityId: string;
  department: string;
}

interface DeliveryPerson extends User {
  role: 'delivery';
  vehicleType: string;
  licensePlate: string;
}

interface Patient extends User {
  role: 'patient';
  dateOfBirth: Date;
  insuranceProvider: string;
  insuranceNumber: string;
  vipTier: 'bronze' | 'silver' | 'gold' | null;
  allergies: string[];
  primaryPharmacyId: string;
}

interface Pharmacy {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  email: string;
  ownerId: string;
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
  form: string;
  manufacturer: string;
  category: string;
  requiresPrescription: boolean;
  isControlled: boolean;
  price: number;
}

interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  pharmacyId: string;
  medications: PrescriptionMedication[];
  status: 'pending' | 'validated' | 'dispensed' | 'rejected';
  createdAt: Date;
  expiresAt: Date;
}

interface PrescriptionMedication {
  medicationId: string;
  quantity: number;
  dosageInstructions: string;
  duration: string;
  refillsRemaining: number;
}

interface Appointment {
  id: string;
  patientId: string;
  providerId: string;
  providerType: 'pharmacist' | 'doctor';
  type: 'teleconsultation' | 'in_person';
  scheduledAt: Date;
  duration: number;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
}

interface Order {
  id: string;
  patientId: string;
  pharmacyId: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  deliveryAddress: string;
  createdAt: Date;
}

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

interface Delivery {
  id: string;
  orderId: string;
  driverId: string;
  status: 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed';
  pickupAddress: string;
  deliveryAddress: string;
  scheduledTime: Date;
  actualDeliveryTime?: Date;
  signature?: string;
  photo?: string;
  notes?: string;
}

// ============================================================================
// Data Generators
// ============================================================================

/**
 * Generate Swiss-specific address
 */
function generateSwissAddress(): { address: string; city: string; postalCode: string } {
  const cities = [
    { name: 'Geneve', postalCode: '1200' },
    { name: 'Lausanne', postalCode: '1000' },
    { name: 'Fribourg', postalCode: '1700' },
    { name: 'Neuchatel', postalCode: '2000' },
    { name: 'Sion', postalCode: '1950' },
    { name: 'Montreux', postalCode: '1820' },
    { name: 'Yverdon-les-Bains', postalCode: '1400' },
    { name: 'Nyon', postalCode: '1260' },
  ];

  const streets = [
    'Rue du Centre',
    'Avenue de la Gare',
    'Rue du Marche',
    'Place de la Riponne',
    'Rue de Lausanne',
    'Avenue des Nations',
    'Rue du Mont-Blanc',
    'Boulevard de Grancy',
  ];

  const city = faker.helpers.arrayElement(cities);
  return {
    address: `${faker.helpers.arrayElement(streets)} ${faker.number.int({ min: 1, max: 150 })}`,
    city: city.name,
    postalCode: city.postalCode,
  };
}

/**
 * Generate common Swiss medications
 */
function generateMedications(): Medication[] {
  const medications: Medication[] = [
    // Prescription medications
    { id: 'med-001', name: 'Amoxicilline', dosage: '500mg', form: 'capsule', manufacturer: 'Sandoz', category: 'Antibiotics', requiresPrescription: true, isControlled: false, price: 12.50 },
    { id: 'med-002', name: 'Lisinopril', dosage: '10mg', form: 'tablet', manufacturer: 'Mepha', category: 'Cardiovascular', requiresPrescription: true, isControlled: false, price: 18.90 },
    { id: 'med-003', name: 'Metformine', dosage: '850mg', form: 'tablet', manufacturer: 'Spirig', category: 'Diabetes', requiresPrescription: true, isControlled: false, price: 8.50 },
    { id: 'med-004', name: 'Omeprazole', dosage: '20mg', form: 'capsule', manufacturer: 'Helvepharm', category: 'Gastrointestinal', requiresPrescription: true, isControlled: false, price: 15.20 },
    { id: 'med-005', name: 'Simvastatine', dosage: '40mg', form: 'tablet', manufacturer: 'Actavis', category: 'Cardiovascular', requiresPrescription: true, isControlled: false, price: 22.80 },
    { id: 'med-006', name: 'Tramadol', dosage: '50mg', form: 'capsule', manufacturer: 'Pfizer', category: 'Pain', requiresPrescription: true, isControlled: true, price: 28.50 },
    { id: 'med-007', name: 'Alprazolam', dosage: '0.5mg', form: 'tablet', manufacturer: 'Roche', category: 'Anxiety', requiresPrescription: true, isControlled: true, price: 19.90 },
    { id: 'med-008', name: 'Levothyroxine', dosage: '100mcg', form: 'tablet', manufacturer: 'Merck', category: 'Thyroid', requiresPrescription: true, isControlled: false, price: 11.20 },
    { id: 'med-009', name: 'Atorvastatine', dosage: '20mg', form: 'tablet', manufacturer: 'Pfizer', category: 'Cardiovascular', requiresPrescription: true, isControlled: false, price: 35.60 },
    { id: 'med-010', name: 'Amlodipine', dosage: '5mg', form: 'tablet', manufacturer: 'Novartis', category: 'Cardiovascular', requiresPrescription: true, isControlled: false, price: 14.80 },

    // OTC Products
    { id: 'otc-001', name: 'Paracetamol', dosage: '500mg', form: 'tablet', manufacturer: 'Dafalgan', category: 'Pain', requiresPrescription: false, isControlled: false, price: 6.90 },
    { id: 'otc-002', name: 'Ibuprofene', dosage: '400mg', form: 'tablet', manufacturer: 'Algifor', category: 'Pain', requiresPrescription: false, isControlled: false, price: 8.50 },
    { id: 'otc-003', name: 'Vitamine D3', dosage: '1000UI', form: 'capsule', manufacturer: 'Burgerstein', category: 'Vitamins', requiresPrescription: false, isControlled: false, price: 24.50 },
    { id: 'otc-004', name: 'Vitamine C', dosage: '500mg', form: 'tablet', manufacturer: 'Burgerstein', category: 'Vitamins', requiresPrescription: false, isControlled: false, price: 18.90 },
    { id: 'otc-005', name: 'Magnesium', dosage: '300mg', form: 'tablet', manufacturer: 'Biomed', category: 'Supplements', requiresPrescription: false, isControlled: false, price: 21.50 },
    { id: 'otc-006', name: 'Cetirizine', dosage: '10mg', form: 'tablet', manufacturer: 'Zyrtec', category: 'Allergy', requiresPrescription: false, isControlled: false, price: 12.80 },
    { id: 'otc-007', name: 'Loratadine', dosage: '10mg', form: 'tablet', manufacturer: 'Claritine', category: 'Allergy', requiresPrescription: false, isControlled: false, price: 11.50 },
    { id: 'otc-008', name: 'Rhinomer', dosage: 'spray', form: 'spray', manufacturer: 'Novartis', category: 'Cold', requiresPrescription: false, isControlled: false, price: 9.80 },
  ];

  return medications;
}

/**
 * Generate pharmacies
 */
function generatePharmacies(count: number): Pharmacy[] {
  const pharmacies: Pharmacy[] = [];
  const pharmacyNames = [
    'Pharmacie du Centre',
    'Pharmacie de la Gare',
    'Pharmacie Populaire',
    'Sun Store',
    'Pharmacie du Lac',
    'Pharmacie de l\'Hopital',
    'Pharmacie des Alpes',
    'Amavita',
  ];

  for (let i = 0; i < count; i++) {
    const address = generateSwissAddress();
    pharmacies.push({
      id: `pharmacy-${String(i + 1).padStart(3, '0')}`,
      name: pharmacyNames[i % pharmacyNames.length],
      address: address.address,
      city: address.city,
      postalCode: address.postalCode,
      phone: faker.phone.number('+41 ## ### ## ##'),
      email: faker.internet.email({ provider: 'pharmacy.ch' }),
      ownerId: `pharmacist-${String(i + 1).padStart(3, '0')}`,
    });
  }

  return pharmacies;
}

/**
 * Generate pharmacists
 */
function generatePharmacists(pharmacies: Pharmacy[]): Pharmacist[] {
  const pharmacists: Pharmacist[] = [];

  pharmacies.forEach((pharmacy, index) => {
    // Owner
    pharmacists.push({
      id: `pharmacist-${String(index + 1).padStart(3, '0')}`,
      email: `pharmacist${index + 1}@uat.metapharm.ch`,
      password: 'Uat2025!Pharm',
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      phone: faker.phone.number('+41 ## ### ## ##'),
      role: 'pharmacist',
      createdAt: faker.date.past({ years: 2 }),
      mfaEnabled: true,
      mfaSecret: 'JBSWY3DPEHPK3PXP', // Test TOTP secret
      pharmacyId: pharmacy.id,
      licenseNumber: `PH-${faker.string.alphanumeric(6).toUpperCase()}`,
      isOwner: true,
    });

    // Assistant
    pharmacists.push({
      id: `pharmacist-asst-${String(index + 1).padStart(3, '0')}`,
      email: `assistant${index + 1}@uat.metapharm.ch`,
      password: 'Uat2025!Asst',
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      phone: faker.phone.number('+41 ## ### ## ##'),
      role: 'pharmacist',
      createdAt: faker.date.past({ years: 1 }),
      mfaEnabled: true,
      mfaSecret: 'JBSWY3DPEHPK3PXP',
      pharmacyId: pharmacy.id,
      licenseNumber: `PH-${faker.string.alphanumeric(6).toUpperCase()}`,
      isOwner: false,
    });
  });

  return pharmacists;
}

/**
 * Generate doctors
 */
function generateDoctors(count: number): Doctor[] {
  const doctors: Doctor[] = [];
  const specialties = [
    'Medecine generale',
    'Cardiologie',
    'Dermatologie',
    'Pediatrie',
    'Psychiatrie',
    'Gynecologie',
    'Orthopédie',
    'Neurologie',
  ];

  for (let i = 0; i < count; i++) {
    doctors.push({
      id: `doctor-${String(i + 1).padStart(3, '0')}`,
      email: `doctor${i + 1}@uat.metapharm.ch`,
      password: 'Uat2025!Doc',
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      phone: faker.phone.number('+41 ## ### ## ##'),
      role: 'doctor',
      createdAt: faker.date.past({ years: 3 }),
      mfaEnabled: true,
      mfaSecret: 'JBSWY3DPEHPK3PXP',
      hinId: `HIN-${faker.string.alphanumeric(8).toUpperCase()}`,
      specialty: specialties[i % specialties.length],
      clinicName: `Cabinet Medical ${faker.person.lastName()}`,
    });
  }

  return doctors;
}

/**
 * Generate nurses
 */
function generateNurses(count: number): Nurse[] {
  const nurses: Nurse[] = [];
  const departments = [
    'Urgences',
    'Medecine interne',
    'Chirurgie',
    'Pediatrie',
    'Geriatrie',
    'Soins intensifs',
    'Maternite',
    'Oncologie',
  ];

  const facilities = [
    'HUG - Hopitaux Universitaires de Geneve',
    'CHUV - Centre Hospitalier Universitaire Vaudois',
    'EMS Les Tilleuls',
    'Clinique de la Source',
    'Hopital de Nyon',
  ];

  for (let i = 0; i < count; i++) {
    nurses.push({
      id: `nurse-${String(i + 1).padStart(3, '0')}`,
      email: `nurse${i + 1}@uat.metapharm.ch`,
      password: 'Uat2025!Nurse',
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      phone: faker.phone.number('+41 ## ### ## ##'),
      role: 'nurse',
      createdAt: faker.date.past({ years: 2 }),
      mfaEnabled: true,
      mfaSecret: 'JBSWY3DPEHPK3PXP',
      facilityId: `facility-${(i % facilities.length) + 1}`,
      department: departments[i % departments.length],
    });
  }

  return nurses;
}

/**
 * Generate delivery personnel
 */
function generateDeliveryPersonnel(count: number): DeliveryPerson[] {
  const delivery: DeliveryPerson[] = [];
  const vehicleTypes = ['Scooter', 'Velo electrique', 'Voiture', 'Fourgonnette'];

  for (let i = 0; i < count; i++) {
    delivery.push({
      id: `delivery-${String(i + 1).padStart(3, '0')}`,
      email: `delivery${i + 1}@uat.metapharm.ch`,
      password: 'Uat2025!Del',
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      phone: faker.phone.number('+41 ## ### ## ##'),
      role: 'delivery',
      createdAt: faker.date.past({ years: 1 }),
      mfaEnabled: false,
      vehicleType: vehicleTypes[i % vehicleTypes.length],
      licensePlate: `GE ${faker.number.int({ min: 100, max: 999 })}${faker.string.alpha({ length: 2 }).toUpperCase()}`,
    });
  }

  return delivery;
}

/**
 * Generate patients
 */
function generatePatients(count: number, pharmacies: Pharmacy[]): Patient[] {
  const patients: Patient[] = [];
  const insuranceProviders = [
    'CSS Assurance',
    'Helsana',
    'Swica',
    'Groupe Mutuel',
    'Assura',
    'Sanitas',
    'Concordia',
    'Visana',
  ];

  const allergies = [
    'Penicilline',
    'Aspirine',
    'Latex',
    'Arachides',
    'Sulfamides',
    'Iode',
    'Codeine',
    null, // No allergies
  ];

  const vipTiers: ('bronze' | 'silver' | 'gold' | null)[] = [null, null, null, 'bronze', 'bronze', 'silver', 'gold'];

  for (let i = 0; i < count; i++) {
    const patientAllergies: string[] = [];
    const numAllergies = faker.number.int({ min: 0, max: 2 });
    for (let j = 0; j < numAllergies; j++) {
      const allergy = faker.helpers.arrayElement(allergies.filter(a => a !== null));
      if (allergy && !patientAllergies.includes(allergy)) {
        patientAllergies.push(allergy);
      }
    }

    patients.push({
      id: `patient-${String(i + 1).padStart(3, '0')}`,
      email: `patient${i + 1}@uat.metapharm.ch`,
      password: 'Uat2025!Pat',
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      phone: faker.phone.number('+41 ## ### ## ##'),
      role: 'patient',
      createdAt: faker.date.past({ years: 2 }),
      mfaEnabled: false,
      dateOfBirth: faker.date.birthdate({ min: 18, max: 85, mode: 'age' }),
      insuranceProvider: insuranceProviders[i % insuranceProviders.length],
      insuranceNumber: `INS-${faker.string.alphanumeric(10).toUpperCase()}`,
      vipTier: vipTiers[i % vipTiers.length],
      allergies: patientAllergies,
      primaryPharmacyId: pharmacies[i % pharmacies.length].id,
    });
  }

  return patients;
}

/**
 * Generate prescriptions
 */
function generatePrescriptions(
  patients: Patient[],
  doctors: Doctor[],
  pharmacies: Pharmacy[],
  medications: Medication[],
  count: number
): Prescription[] {
  const prescriptions: Prescription[] = [];
  const prescriptionMeds = medications.filter(m => m.requiresPrescription);
  const statuses: Prescription['status'][] = ['pending', 'validated', 'dispensed', 'rejected'];

  for (let i = 0; i < count; i++) {
    const patient = faker.helpers.arrayElement(patients);
    const numMeds = faker.number.int({ min: 1, max: 3 });
    const selectedMeds: PrescriptionMedication[] = [];

    for (let j = 0; j < numMeds; j++) {
      const med = faker.helpers.arrayElement(prescriptionMeds);
      if (!selectedMeds.find(m => m.medicationId === med.id)) {
        selectedMeds.push({
          medicationId: med.id,
          quantity: faker.number.int({ min: 10, max: 90 }),
          dosageInstructions: faker.helpers.arrayElement([
            '1 comprime 3x par jour',
            '2 comprimes matin et soir',
            '1 comprime au coucher',
            '1 comprime avant les repas',
          ]),
          duration: faker.helpers.arrayElement(['7 jours', '14 jours', '30 jours', '3 mois']),
          refillsRemaining: faker.number.int({ min: 0, max: 5 }),
        });
      }
    }

    const createdAt = faker.date.recent({ days: 30 });

    prescriptions.push({
      id: `rx-${String(i + 1).padStart(5, '0')}`,
      patientId: patient.id,
      doctorId: faker.helpers.arrayElement(doctors).id,
      pharmacyId: patient.primaryPharmacyId,
      medications: selectedMeds,
      status: faker.helpers.arrayElement(statuses),
      createdAt,
      expiresAt: new Date(createdAt.getTime() + 365 * 24 * 60 * 60 * 1000), // 1 year validity
    });
  }

  return prescriptions;
}

/**
 * Generate appointments
 */
function generateAppointments(
  patients: Patient[],
  pharmacists: Pharmacist[],
  doctors: Doctor[],
  count: number
): Appointment[] {
  const appointments: Appointment[] = [];
  const statuses: Appointment['status'][] = ['scheduled', 'completed', 'cancelled'];

  for (let i = 0; i < count; i++) {
    const isDoctor = faker.datatype.boolean();
    const provider = isDoctor
      ? faker.helpers.arrayElement(doctors)
      : faker.helpers.arrayElement(pharmacists.filter(p => p.isOwner));

    appointments.push({
      id: `apt-${String(i + 1).padStart(5, '0')}`,
      patientId: faker.helpers.arrayElement(patients).id,
      providerId: provider.id,
      providerType: isDoctor ? 'doctor' : 'pharmacist',
      type: 'teleconsultation',
      scheduledAt: faker.date.soon({ days: 14 }),
      duration: faker.helpers.arrayElement([15, 30, 45, 60]),
      status: faker.helpers.arrayElement(statuses),
      notes: faker.datatype.boolean() ? faker.lorem.sentence() : undefined,
    });
  }

  return appointments;
}

/**
 * Generate orders
 */
function generateOrders(
  patients: Patient[],
  pharmacies: Pharmacy[],
  medications: Medication[],
  count: number
): Order[] {
  const orders: Order[] = [];
  const otcProducts = medications.filter(m => !m.requiresPrescription);
  const statuses: Order['status'][] = ['pending', 'processing', 'shipped', 'delivered'];

  for (let i = 0; i < count; i++) {
    const numItems = faker.number.int({ min: 1, max: 4 });
    const items: OrderItem[] = [];
    let total = 0;

    for (let j = 0; j < numItems; j++) {
      const product = faker.helpers.arrayElement(otcProducts);
      const quantity = faker.number.int({ min: 1, max: 3 });
      if (!items.find(item => item.productId === product.id)) {
        items.push({
          productId: product.id,
          productName: product.name,
          quantity,
          unitPrice: product.price,
        });
        total += product.price * quantity;
      }
    }

    const address = generateSwissAddress();

    orders.push({
      id: `order-${String(i + 1).padStart(5, '0')}`,
      patientId: faker.helpers.arrayElement(patients).id,
      pharmacyId: faker.helpers.arrayElement(pharmacies).id,
      items,
      totalAmount: Math.round(total * 100) / 100,
      status: faker.helpers.arrayElement(statuses),
      deliveryAddress: `${address.address}, ${address.postalCode} ${address.city}`,
      createdAt: faker.date.recent({ days: 7 }),
    });
  }

  return orders;
}

/**
 * Generate deliveries
 */
function generateDeliveries(
  orders: Order[],
  deliveryPersonnel: DeliveryPerson[],
  pharmacies: Pharmacy[]
): Delivery[] {
  const shippedOrders = orders.filter(o => o.status === 'shipped' || o.status === 'delivered');
  const statuses: Delivery['status'][] = ['assigned', 'picked_up', 'in_transit', 'delivered', 'failed'];

  return shippedOrders.map((order, index) => {
    const pharmacy = pharmacies.find(p => p.id === order.pharmacyId)!;
    const status = order.status === 'delivered' ? 'delivered' : faker.helpers.arrayElement(statuses.slice(0, 3));

    return {
      id: `del-${String(index + 1).padStart(5, '0')}`,
      orderId: order.id,
      driverId: faker.helpers.arrayElement(deliveryPersonnel).id,
      status,
      pickupAddress: `${pharmacy.address}, ${pharmacy.postalCode} ${pharmacy.city}`,
      deliveryAddress: order.deliveryAddress,
      scheduledTime: faker.date.soon({ days: 2 }),
      actualDeliveryTime: status === 'delivered' ? faker.date.recent({ days: 1 }) : undefined,
      signature: status === 'delivered' ? 'data:image/png;base64,iVBORw0KGgo...' : undefined,
      photo: status === 'delivered' ? 'https://uat.metapharm.ch/photos/del-001.jpg' : undefined,
    };
  });
}

// ============================================================================
// Main Generator
// ============================================================================

interface GeneratedData {
  pharmacies: Pharmacy[];
  pharmacists: Pharmacist[];
  doctors: Doctor[];
  nurses: Nurse[];
  deliveryPersonnel: DeliveryPerson[];
  patients: Patient[];
  medications: Medication[];
  prescriptions: Prescription[];
  appointments: Appointment[];
  orders: Order[];
  deliveries: Delivery[];
}

function generateAllData(): GeneratedData {
  console.log('Generating UAT test data...');

  // Generate base entities
  const pharmacies = generatePharmacies(5);
  console.log(`  Generated ${pharmacies.length} pharmacies`);

  const pharmacists = generatePharmacists(pharmacies);
  console.log(`  Generated ${pharmacists.length} pharmacists`);

  const doctors = generateDoctors(10);
  console.log(`  Generated ${doctors.length} doctors`);

  const nurses = generateNurses(8);
  console.log(`  Generated ${nurses.length} nurses`);

  const deliveryPersonnel = generateDeliveryPersonnel(6);
  console.log(`  Generated ${deliveryPersonnel.length} delivery personnel`);

  const patients = generatePatients(50, pharmacies);
  console.log(`  Generated ${patients.length} patients`);

  const medications = generateMedications();
  console.log(`  Generated ${medications.length} medications`);

  // Generate transactional data
  const prescriptions = generatePrescriptions(patients, doctors, pharmacies, medications, 100);
  console.log(`  Generated ${prescriptions.length} prescriptions`);

  const appointments = generateAppointments(patients, pharmacists, doctors, 30);
  console.log(`  Generated ${appointments.length} appointments`);

  const orders = generateOrders(patients, pharmacies, medications, 40);
  console.log(`  Generated ${orders.length} orders`);

  const deliveries = generateDeliveries(orders, deliveryPersonnel, pharmacies);
  console.log(`  Generated ${deliveries.length} deliveries`);

  return {
    pharmacies,
    pharmacists,
    doctors,
    nurses,
    deliveryPersonnel,
    patients,
    medications,
    prescriptions,
    appointments,
    orders,
    deliveries,
  };
}

// ============================================================================
// Export Functions
// ============================================================================

export function exportToJSON(data: GeneratedData, outputPath: string): void {
  const fs = require('fs');
  const path = require('path');

  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  console.log(`Data exported to ${outputPath}`);
}

export function exportToSQL(data: GeneratedData, outputPath: string): void {
  const fs = require('fs');
  const path = require('path');

  let sql = '-- MetaPharm Connect UAT Test Data\n';
  sql += '-- Generated: ' + new Date().toISOString() + '\n\n';

  // Users table (simplified)
  sql += '-- Pharmacists\n';
  data.pharmacists.forEach(p => {
    sql += `INSERT INTO users (id, email, password_hash, first_name, last_name, role, mfa_enabled) VALUES ('${p.id}', '${p.email}', '$2b$12$hash', '${p.firstName}', '${p.lastName}', 'pharmacist', ${p.mfaEnabled});\n`;
  });

  sql += '\n-- Doctors\n';
  data.doctors.forEach(d => {
    sql += `INSERT INTO users (id, email, password_hash, first_name, last_name, role, mfa_enabled) VALUES ('${d.id}', '${d.email}', '$2b$12$hash', '${d.firstName}', '${d.lastName}', 'doctor', ${d.mfaEnabled});\n`;
  });

  sql += '\n-- Patients\n';
  data.patients.forEach(p => {
    sql += `INSERT INTO users (id, email, password_hash, first_name, last_name, role, mfa_enabled) VALUES ('${p.id}', '${p.email}', '$2b$12$hash', '${p.firstName}', '${p.lastName}', 'patient', ${p.mfaEnabled});\n`;
  });

  // Continue for other entities...

  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, sql);
  console.log(`SQL exported to ${outputPath}`);
}

// ============================================================================
// CLI Execution
// ============================================================================

if (require.main === module) {
  const data = generateAllData();

  // Export to JSON
  exportToJSON(data, './scripts/uat/data/uat-test-data.json');

  // Export to SQL
  exportToSQL(data, './scripts/uat/data/uat-seed.sql');

  console.log('\nUAT test data generation complete!');
  console.log('Summary:');
  console.log(`  - Pharmacies: ${data.pharmacies.length}`);
  console.log(`  - Pharmacists: ${data.pharmacists.length}`);
  console.log(`  - Doctors: ${data.doctors.length}`);
  console.log(`  - Nurses: ${data.nurses.length}`);
  console.log(`  - Delivery: ${data.deliveryPersonnel.length}`);
  console.log(`  - Patients: ${data.patients.length}`);
  console.log(`  - Medications: ${data.medications.length}`);
  console.log(`  - Prescriptions: ${data.prescriptions.length}`);
  console.log(`  - Appointments: ${data.appointments.length}`);
  console.log(`  - Orders: ${data.orders.length}`);
  console.log(`  - Deliveries: ${data.deliveries.length}`);
}

export { generateAllData, GeneratedData };
