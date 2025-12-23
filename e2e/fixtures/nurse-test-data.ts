/**
 * Nurse Workflow Test Data
 * Test data for medication orders, adverse reactions, shift handovers, and emergency requests
 */

export const medicationOrderData = {
  validOrder: {
    medication: 'Amoxicillin',
    dosage: '500mg',
    quantity: 10,
    urgency: 'routine',
    instructions: 'Take with food, 3 times daily',
  },
  urgentOrder: {
    medication: 'Ibuprofen',
    dosage: '400mg',
    quantity: 20,
    urgency: 'urgent',
    instructions: 'For pain management',
  },
  emergencyOrder: {
    medication: 'Epinephrine',
    dosage: '0.5mg',
    quantity: 1,
    urgency: 'stat',
    instructions: 'Emergency use only - anaphylaxis',
  },
  invalidQuantity: {
    medication: 'Aspirin',
    dosage: '100mg',
    quantity: 0,
    urgency: 'routine',
  },
  missingMedication: {
    medication: '',
    dosage: '500mg',
    quantity: 10,
    urgency: 'routine',
  },
  invalidDosage: {
    medication: 'Metformin',
    dosage: '',
    quantity: 30,
    urgency: 'routine',
  },
};

export const adverseReactionData = {
  mildAllergy: {
    medicationName: 'Penicillin',
    reactionType: 'rash',
    severity: 'mild',
    description: 'Mild rash appeared 2 hours after medication',
  },
  severeAnaphylaxis: {
    medicationName: 'Peanut extract',
    reactionType: 'anaphylaxis',
    severity: 'critical',
    description: 'Severe allergic reaction - patient requires immediate medical attention',
  },
  moderateStevens: {
    medicationName: 'Sulfonamide',
    reactionType: 'stevens_johnson_syndrome',
    severity: 'severe',
    description: 'Stevens-Johnson syndrome developing',
  },
  mildNausea: {
    medicationName: 'Metformin',
    reactionType: 'nausea',
    severity: 'mild',
    description: 'Mild nausea after taking medication',
  },
  severeDiarrhea: {
    medicationName: 'Antibiotic',
    reactionType: 'diarrhea',
    severity: 'severe',
    description: 'Severe diarrhea - possible C. difficile infection',
  },
};

export const shiftHandoverData = {
  standardHandover: {
    shift: 'morning',
    notes: 'All medication orders for ward A completed. 3 patients waiting for delivery. No critical issues.',
    patientUpdates: 'Mr. Dupont (Room 102) - medication administered at 08:00. Ms. Bernard (Room 104) - medication pending pharmacy approval.',
    issues: [],
  },
  handoverWithIssues: {
    shift: 'evening',
    notes: 'One critical issue: Patient in Room 201 reported adverse reaction to new medication. Pharmacy contacted. Delivered orders: 5. Pending: 2.',
    patientUpdates: 'Patient in Room 201 - report adverse reaction to Penicillin (rash). Continue monitoring.',
    issues: ['Adverse reaction to Penicillin in Room 201', 'Pharmacy out of Metformin 500mg - backorder expected tomorrow'],
  },
  nightShiftHandover: {
    shift: 'night',
    notes: 'Quiet night shift. All medications administered on schedule. 1 emergency order was expedited at 23:45.',
    patientUpdates: 'Emergency medication (Epinephrine) administered to patient in Room 105 at 23:45 - patient stable.',
    issues: [],
  },
};

export const emergencyMedicationRequestData = {
  emergencyEpinephrine: {
    medication: 'Epinephrine 0.5mg',
    reason: 'Patient experiencing anaphylactic shock - urgent intervention required',
    urgency: 'stat',
    patientId: 'patient-001',
  },
  emergencyAntibiotics: {
    medication: 'Broad-spectrum antibiotics',
    reason: 'Sepsis suspected - immediate antibiotic therapy required',
    urgency: 'stat',
    patientId: 'patient-002',
  },
  urgentPainRelief: {
    medication: 'Morphine IV',
    reason: 'Severe post-operative pain management',
    urgency: 'urgent',
    patientId: 'patient-003',
  },
  emergencyCardiacMeds: {
    medication: 'Atropine 1mg IV',
    reason: 'Cardiac arrest - resuscitation required',
    urgency: 'stat',
    patientId: 'patient-004',
  },
};

export const patientData = {
  patient1: {
    id: 'patient-001',
    firstName: 'Jean',
    lastName: 'Dupont',
    age: 65,
    medicalRecordNumber: 'MRN-001',
    allergies: ['Penicillin', 'Sulfonamides'],
    activeMedications: [
      { name: 'Lisinopril', dosage: '10mg', frequency: 'daily' },
      { name: 'Metformin', dosage: '500mg', frequency: 'twice daily' },
    ],
    dateOfBirth: '1959-05-15',
  },
  patient2: {
    id: 'patient-002',
    firstName: 'Marie',
    lastName: 'Bernard',
    age: 72,
    medicalRecordNumber: 'MRN-002',
    allergies: ['Aspirin'],
    activeMedications: [
      { name: 'Warfarin', dosage: '5mg', frequency: 'daily' },
      { name: 'Atorvastatin', dosage: '20mg', frequency: 'daily' },
    ],
    dateOfBirth: '1952-11-22',
  },
  patient3: {
    id: 'patient-003',
    firstName: 'Pierre',
    lastName: 'Michel',
    age: 55,
    medicalRecordNumber: 'MRN-003',
    allergies: [],
    activeMedications: [
      { name: 'Enalapril', dosage: '5mg', frequency: 'daily' },
    ],
    dateOfBirth: '1969-03-10',
  },
};

export const pharmacyData = {
  pharmacy1: {
    id: 'pharmacy-001',
    name: 'Pharmacie du Centre',
    address: 'Rue du Centre 42, 1200 Genève',
    phone: '+41223334455',
    email: 'contact@pharmacieducentre.ch',
  },
  pharmacy2: {
    id: 'pharmacy-002',
    name: 'Pharmacie Principale',
    address: 'Avenue de la République 10, 1202 Genève',
    phone: '+41223335566',
    email: 'info@pharmacieprincipale.ch',
  },
};

export const deliveryData = {
  standardDelivery: {
    address: 'Rue de la Paix 15, 1204 Genève',
    scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    specialInstructions: 'Ring doorbell 3 times',
    requiresSignature: true,
  },
  expeditedDelivery: {
    address: 'Avenue des Nations 8, 1202 Genève',
    scheduledTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    specialInstructions: 'Urgent delivery - patient waiting',
    requiresSignature: true,
  },
  coldChainDelivery: {
    address: 'Route de Meyrin 50, 1210 Genève',
    scheduledTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    specialInstructions: 'Refrigerated transport required - insulin',
    requiresSignature: true,
    requiresColdChain: true,
  },
};

export const workflowSteps = {
  completeWorkflow: [
    'Create medication order as nurse',
    'Validate prescription in pharmacy',
    'Check stock availability',
    'Mark order as approved in pharmacy',
    'Request delivery',
    'Pickup order for delivery',
    'Mark as in transit',
    'Confirm delivery with signature',
    'Record medication administration',
    'Generate receipt',
  ],
};

export const negativeTestCases = {
  wrongPatient: {
    description: 'Order for wrong patient should be blocked',
    testData: {
      orderPatient: 'patient-001',
      administeredPatient: 'patient-002',
    },
    expectedResult: 'Order rejected or warning displayed',
  },
  insufficientStock: {
    description: 'Order should be rejected if insufficient stock',
    testData: {
      medication: 'Rare medication',
      quantity: 1000,
    },
    expectedResult: 'Stock validation fails, order rejected',
  },
  invalidPrescription: {
    description: 'Order with invalid prescription should be rejected',
    testData: {
      medication: 'Controlled substance without prescription',
    },
    expectedResult: 'Prescription validation fails',
  },
  expiredMedication: {
    description: 'Dispensing expired medication should be prevented',
    testData: {
      batchNumber: 'EXPIRED-BATCH',
      expiryDate: '2023-12-31',
    },
    expectedResult: 'Medication marked as expired, cannot dispense',
  },
  allergyConflict: {
    description: 'Order of medication patient is allergic to should be flagged',
    testData: {
      patientId: 'patient-001',
      medication: 'Penicillin', // Patient allergic
    },
    expectedResult: 'Allergy warning displayed, requires nurse override',
  },
};
