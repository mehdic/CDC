/**
 * Test Data Fixtures
 * Common data for E2E testing scenarios
 */

export const prescriptionData = {
  valid: {
    medications: [
      {
        name: 'Amoxicillin',
        dosage: '500mg',
        quantity: 10,
        frequency: 'three times daily',
        duration: '7 days',
      },
    ],
    patientId: 'patient-001',
    doctorId: 'doctor-001',
    pharmacyId: 'pharmacy-001',
    notes: 'Standard antibiotic prescription',
  },
  invalidMissing: {
    // Missing medications array
    patientId: 'patient-001',
    doctorId: 'doctor-001',
    pharmacyId: 'pharmacy-001',
  },
  emptyMedications: {
    medications: [],
    patientId: 'patient-001',
    doctorId: 'doctor-001',
    pharmacyId: 'pharmacy-001',
  },
};

export const appointmentData = {
  valid: {
    type: 'TELECONSULTATION',
    patientId: 'patient-001',
    pharmacistId: 'pharmacist-001',
    scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    duration: 30, // minutes
    reason: 'Medication consultation',
  },
  pastDate: {
    type: 'TELECONSULTATION',
    patientId: 'patient-001',
    pharmacistId: 'pharmacist-001',
    scheduledDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    duration: 30,
    reason: 'Medication consultation',
  },
  missingDate: {
    type: 'TELECONSULTATION',
    patientId: 'patient-001',
    pharmacistId: 'pharmacist-001',
    duration: 30,
    reason: 'Medication consultation',
  },
};

export const refillData = {
  valid: {
    prescriptionId: 'prescription-001',
    quantity: 30, // tablets
    reason: 'Running out of medication',
  },
  tooManyRefills: {
    prescriptionId: 'prescription-001',
    quantity: 1000,
    reason: 'Emergency refill',
  },
  missingQuantity: {
    prescriptionId: 'prescription-001',
    reason: 'Running out of medication',
  },
};

export const inventoryData = {
  validStock: [
    {
      productId: 'product-001',
      productName: 'Amoxicillin 500mg',
      quantity: 100,
      reorderLevel: 20,
      batchNumber: 'BATCH-001',
      expiryDate: '2025-12-31',
    },
    {
      productId: 'product-002',
      productName: 'Ibuprofen 400mg',
      quantity: 50,
      reorderLevel: 10,
      batchNumber: 'BATCH-002',
      expiryDate: '2026-01-15',
    },
  ],
  lowStock: {
    productId: 'product-003',
    productName: 'Lisinopril 10mg',
    quantity: 5, // Below reorder level
    reorderLevel: 20,
  },
  expiredBatch: {
    productId: 'product-004',
    productName: 'Metformin 500mg',
    quantity: 30,
    reorderLevel: 10,
    batchNumber: 'BATCH-EXPIRED',
    expiryDate: '2023-12-31',
  },
};

export const messagingData = {
  validMessage: {
    recipientId: 'pharmacist-001',
    subject: 'Prescription refill request',
    content: 'I would like to refill my allergy medication. My prescription is valid until 2025-12-31.',
  },
  emptyContent: {
    recipientId: 'pharmacist-001',
    subject: 'Test message',
    content: '',
  },
  tooLongMessage: {
    recipientId: 'pharmacist-001',
    subject: 'Test',
    content: 'A'.repeat(10001), // Exceeds typical char limit
  },
};

export const ecommerceData = {
  validProduct: {
    productId: 'product-ot-001',
    name: 'Vitamin D3 1000IU',
    price: 12.50,
    quantity: 1,
    category: 'VITAMINS_SUPPLEMENTS',
  },
  bulkOrder: {
    items: [
      {
        productId: 'product-ot-001',
        name: 'Vitamin D3 1000IU',
        price: 12.50,
        quantity: 3,
      },
      {
        productId: 'product-ot-002',
        name: 'Vitamin C 500mg',
        price: 8.99,
        quantity: 2,
      },
    ],
  },
};

export const deliveryData = {
  validDelivery: {
    orderId: 'order-001',
    patientId: 'patient-001',
    deliveryPersonId: 'delivery-001',
    address: 'Rue du Centre 42, 1200 Genève',
    scheduledTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Ring doorbell 3 times',
  },
  missingScanCode: {
    orderId: 'order-002',
    patientId: 'patient-002',
    deliveryPersonId: 'delivery-001',
    address: 'Avenue des Nations 10, 1202 Genève',
  },
};

export const teleconsultationData = {
  validSession: {
    type: 'PHARMACIST_CONSULTATION',
    patientId: 'patient-001',
    pharmacistId: 'pharmacist-001',
    topic: 'Medication review',
    scheduledDate: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
  },
  doctorConsult: {
    type: 'DOCTOR_CONSULTATION',
    patientId: 'patient-001',
    doctorId: 'doctor-001',
    topic: 'Follow-up consultation',
    scheduledDate: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
  },
};
