/**
 * Comprehensive Seed Data for Pharmacist App
 * Creates pharmacies, users, prescriptions, inventory, products, etc.
 *
 * Usage: DATABASE_URL=postgresql://user:pass@localhost:5432/metapharm ts-node comprehensive-seed.ts
 */

import { Client } from 'pg';
import bcrypt from 'bcrypt';

/**
 * Get database connection from environment
 */
function getDatabaseConfig() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  return {
    connectionString: databaseUrl,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  };
}

/**
 * Mock encryption for dev environment
 * In production, this would use AWS KMS
 */
function mockEncrypt(value: string): Buffer {
  return Buffer.from(`ENC:${value}`, 'utf-8');
}

/**
 * Hash password with bcrypt
 */
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Seed pharmacies
 */
async function seedPharmacies(client: Client): Promise<{ [key: string]: string }> {
  console.log('🏥 Seeding pharmacies...');

  const pharmacies = [
    {
      name: 'Pharmacie du Lac',
      license_number: 'CH-VD-12345',
      address_encrypted: mockEncrypt('Rue de la Paix 15'),
      city: 'Lausanne',
      canton: 'VD',
      postal_code: '1003',
      latitude: 46.5197,
      longitude: 6.6323,
      phone: '+41 21 555 0100',
      email: 'contact@pharmacie-du-lac.ch',
      operating_hours: JSON.stringify({
        monday: { open: '08:00', close: '18:30' },
        tuesday: { open: '08:00', close: '18:30' },
        wednesday: { open: '08:00', close: '18:30' },
        thursday: { open: '08:00', close: '18:30' },
        friday: { open: '08:00', close: '18:30' },
        saturday: { open: '09:00', close: '17:00' },
        sunday: { open: null, close: null },
      }),
      subscription_tier: 'professional',
      subscription_status: 'active',
    },
    {
      name: 'Pharmacie Centrale Genève',
      license_number: 'CH-GE-67890',
      address_encrypted: mockEncrypt('Place du Molard 3'),
      city: 'Genève',
      canton: 'GE',
      postal_code: '1204',
      latitude: 46.2044,
      longitude: 6.1432,
      phone: '+41 22 555 0200',
      email: 'info@pharmacie-centrale.ch',
      operating_hours: JSON.stringify({
        monday: { open: '08:30', close: '19:00' },
        tuesday: { open: '08:30', close: '19:00' },
        wednesday: { open: '08:30', close: '19:00' },
        thursday: { open: '08:30', close: '19:00' },
        friday: { open: '08:30', close: '19:00' },
        saturday: { open: '09:00', close: '17:00' },
        sunday: { open: null, close: null },
      }),
      subscription_tier: 'enterprise',
      subscription_status: 'active',
    },
    {
      name: 'Pharmacie des Alpes',
      license_number: 'CH-VS-11223',
      address_encrypted: mockEncrypt('Avenue de la Gare 45'),
      city: 'Sion',
      canton: 'VS',
      postal_code: '1950',
      latitude: 46.2314,
      longitude: 7.3603,
      phone: '+41 27 555 0300',
      email: 'contact@pharmacie-alpes.ch',
      operating_hours: JSON.stringify({
        monday: { open: '08:00', close: '18:00' },
        tuesday: { open: '08:00', close: '18:00' },
        wednesday: { open: '08:00', close: '18:00' },
        thursday: { open: '08:00', close: '18:00' },
        friday: { open: '08:00', close: '18:00' },
        saturday: { open: '09:00', close: '16:00' },
        sunday: { open: null, close: null },
      }),
      subscription_tier: 'basic',
      subscription_status: 'trial',
    },
  ];

  const pharmacyIds: { [key: string]: string } = {};

  for (const pharmacy of pharmacies) {
    const result = await client.query(
      `INSERT INTO pharmacies (
        name, license_number, address_encrypted, city, canton, postal_code,
        latitude, longitude, phone, email, operating_hours,
        subscription_tier, subscription_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id`,
      [
        pharmacy.name,
        pharmacy.license_number,
        pharmacy.address_encrypted,
        pharmacy.city,
        pharmacy.canton,
        pharmacy.postal_code,
        pharmacy.latitude,
        pharmacy.longitude,
        pharmacy.phone,
        pharmacy.email,
        pharmacy.operating_hours,
        pharmacy.subscription_tier,
        pharmacy.subscription_status,
      ]
    );

    pharmacyIds[pharmacy.name] = result.rows[0].id;
    console.log(`  ✅ Created pharmacy: ${pharmacy.name} (${result.rows[0].id})`);
  }

  return pharmacyIds;
}

/**
 * Seed users (pharmacists, doctors, nurses, patients, delivery)
 */
async function seedUsers(
  client: Client,
  pharmacyIds: { [key: string]: string }
): Promise<{ [key: string]: string }> {
  console.log('👥 Seeding users...');

  const users = [
    // Pharmacists
    {
      email: 'pharmacist@test.metapharm.ch',
      password: 'TestPass123!',
      role: 'pharmacist',
      first_name: 'Marie',
      last_name: 'Dupont',
      phone: '+41 79 123 4567',
      hin_id: 'HIN-CH-12345',
      mfa_enabled: false,
      primary_pharmacy_id: pharmacyIds['Pharmacie du Lac'],
    },
    {
      email: 'pharmacist2@test.com',
      password: 'Test123!',
      role: 'pharmacist',
      first_name: 'Isabelle',
      last_name: 'Rousseau',
      phone: '+41 79 789 0123',
      hin_id: 'HIN-CH-11223',
      mfa_enabled: false,
      primary_pharmacy_id: pharmacyIds['Pharmacie Centrale Genève'],
    },
    {
      email: 'pharmacist3@test.com',
      password: 'Test123!',
      role: 'pharmacist',
      first_name: 'François',
      last_name: 'Lambert',
      phone: '+41 79 234 5678',
      hin_id: 'HIN-CH-33445',
      mfa_enabled: false,
      primary_pharmacy_id: pharmacyIds['Pharmacie des Alpes'],
    },
    // Doctors
    {
      email: 'doctor@test.metapharm.ch',
      password: 'TestPass123!',
      role: 'doctor',
      first_name: 'Jean',
      last_name: 'Martin',
      phone: '+41 79 234 5678',
      hin_id: 'HIN-CH-67890',
      mfa_enabled: false,
      primary_pharmacy_id: null,
    },
    {
      email: 'doctor2@test.com',
      password: 'Test123!',
      role: 'doctor',
      first_name: 'Catherine',
      last_name: 'Morel',
      phone: '+41 79 345 6789',
      hin_id: 'HIN-CH-99887',
      mfa_enabled: false,
      primary_pharmacy_id: null,
    },
    // Nurses
    {
      email: 'nurse@test.com',
      password: 'Test123!',
      role: 'nurse',
      first_name: 'Sophie',
      last_name: 'Lemoine',
      phone: '+41 79 345 6789',
      hin_id: null,
      mfa_enabled: false,
      primary_pharmacy_id: null,
    },
    // Delivery Personnel
    {
      email: 'delivery@test.com',
      password: 'Test123!',
      role: 'delivery',
      first_name: 'Luc',
      last_name: 'Bernard',
      phone: '+41 79 456 7890',
      hin_id: null,
      mfa_enabled: false,
      primary_pharmacy_id: pharmacyIds['Pharmacie du Lac'],
    },
    // Patients
    {
      email: 'patient@test.metapharm.ch',
      password: 'TestPass123!',
      role: 'patient',
      first_name: 'Sophie',
      last_name: 'Bernard',
      phone: '+41 79 345 6789',
      hin_id: null,
      mfa_enabled: false,
      primary_pharmacy_id: pharmacyIds['Pharmacie du Lac'],
    },
    {
      email: 'patient1@test.com',
      password: 'Test123!',
      role: 'patient',
      first_name: 'Claire',
      last_name: 'Petit',
      phone: '+41 79 567 8901',
      hin_id: null,
      mfa_enabled: false,
      primary_pharmacy_id: pharmacyIds['Pharmacie du Lac'],
    },
    {
      email: 'patient2@test.com',
      password: 'Test123!',
      role: 'patient',
      first_name: 'Pierre',
      last_name: 'Blanc',
      phone: '+41 79 678 9012',
      hin_id: null,
      mfa_enabled: false,
      primary_pharmacy_id: pharmacyIds['Pharmacie Centrale Genève'],
    },
    {
      email: 'patient3@test.com',
      password: 'Test123!',
      role: 'patient',
      first_name: 'Émilie',
      last_name: 'Girard',
      phone: '+41 79 789 0123',
      hin_id: null,
      mfa_enabled: false,
      primary_pharmacy_id: pharmacyIds['Pharmacie Centrale Genève'],
    },
    {
      email: 'patient4@test.com',
      password: 'Test123!',
      role: 'patient',
      first_name: 'Nicolas',
      last_name: 'Roux',
      phone: '+41 79 890 1234',
      hin_id: null,
      mfa_enabled: false,
      primary_pharmacy_id: pharmacyIds['Pharmacie des Alpes'],
    },
  ];

  const userIds: { [key: string]: string } = {};

  for (const user of users) {
    const passwordHash = await hashPassword(user.password);

    const result = await client.query(
      `INSERT INTO users (
        email, password_hash, role, first_name_encrypted, last_name_encrypted,
        phone_encrypted, hin_id, mfa_enabled, primary_pharmacy_id, email_verified, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id`,
      [
        user.email,
        passwordHash,
        user.role,
        mockEncrypt(user.first_name),
        mockEncrypt(user.last_name),
        mockEncrypt(user.phone),
        user.hin_id,
        user.mfa_enabled,
        user.primary_pharmacy_id,
        true,
        'active',
      ]
    );

    userIds[user.email] = result.rows[0].id;
    console.log(`  ✅ Created user: ${user.email} (${user.role}) - ${result.rows[0].id}`);
  }

  return userIds;
}

/**
 * Seed categories
 */
async function seedCategories(client: Client): Promise<{ [key: string]: string }> {
  console.log('📁 Seeding categories...');

  const categories = [
    {
      name: 'Médicaments sans ordonnance',
      slug: 'medicaments-otc',
      description: 'Médicaments en vente libre',
      icon_url: '/icons/pills.svg',
      parent_id: null,
    },
    {
      name: 'Douleurs et fièvre',
      slug: 'douleurs-fievre',
      description: 'Antalgiques et antipyrétiques',
      icon_url: '/icons/pain.svg',
      parent_id: null, // Will be updated to parent
    },
    {
      name: 'Rhume et grippe',
      slug: 'rhume-grippe',
      description: 'Médicaments contre le rhume',
      icon_url: '/icons/cold.svg',
      parent_id: null,
    },
    {
      name: 'Vitamines et suppléments',
      slug: 'vitamines',
      description: 'Compléments alimentaires',
      icon_url: '/icons/vitamins.svg',
      parent_id: null,
    },
    {
      name: 'Parapharmacie',
      slug: 'parapharmacie',
      description: 'Produits de santé et bien-être',
      icon_url: '/icons/wellness.svg',
      parent_id: null,
    },
    {
      name: 'Cosmétiques',
      slug: 'cosmetiques',
      description: 'Produits de beauté',
      icon_url: '/icons/cosmetics.svg',
      parent_id: null,
    },
  ];

  const categoryIds: { [key: string]: string } = {};

  // Create parent category first
  const parentResult = await client.query(
    `INSERT INTO categories (name, slug, description, icon_url, parent_id, is_active, display_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [
      categories[0].name,
      categories[0].slug,
      categories[0].description,
      categories[0].icon_url,
      null,
      true,
      0,
    ]
  );
  categoryIds[categories[0].slug] = parentResult.rows[0].id;
  console.log(`  ✅ Created category: ${categories[0].name}`);

  // Create child categories
  for (let i = 1; i < categories.length; i++) {
    const category = categories[i];
    const parentId = i < 4 ? categoryIds['medicaments-otc'] : null;

    const result = await client.query(
      `INSERT INTO categories (name, slug, description, icon_url, parent_id, is_active, display_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [category.name, category.slug, category.description, category.icon_url, parentId, true, i]
    );

    categoryIds[category.slug] = result.rows[0].id;
    console.log(`  ✅ Created category: ${category.name}`);
  }

  return categoryIds;
}

/**
 * Seed products
 */
async function seedProducts(client: Client, categoryIds: { [key: string]: string }): Promise<{ [key: string]: string }> {
  console.log('🛒 Seeding products...');

  const products = [
    {
      name: 'Paracétamol 500mg',
      sku: 'PARA-500-20',
      description: 'Antalgique et antipyrétique, boîte de 20 comprimés',
      manufacturer: 'Sandoz',
      category_id: categoryIds['douleurs-fievre'],
      price: 5.90,
      original_price: null,
      stock: 150,
      low_stock_threshold: 20,
      requires_prescription: false,
      image_url: '/products/paracetamol.jpg',
      rating: 4.5,
      review_count: 87,
      is_active: true,
      is_featured: true,
    },
    {
      name: 'Ibuprofène 400mg',
      sku: 'IBUP-400-30',
      description: 'Anti-inflammatoire, boîte de 30 comprimés',
      manufacturer: 'Mepha',
      category_id: categoryIds['douleurs-fievre'],
      price: 8.50,
      original_price: 9.90,
      stock: 200,
      low_stock_threshold: 25,
      requires_prescription: false,
      image_url: '/products/ibuprofen.jpg',
      rating: 4.7,
      review_count: 142,
      is_active: true,
      is_featured: true,
    },
    {
      name: 'Aspirine 500mg',
      sku: 'ASPI-500-20',
      description: 'Antalgique, antipyrétique, boîte de 20 comprimés',
      manufacturer: 'Bayer',
      category_id: categoryIds['douleurs-fievre'],
      price: 6.80,
      original_price: null,
      stock: 100,
      low_stock_threshold: 15,
      requires_prescription: false,
      image_url: '/products/aspirin.jpg',
      rating: 4.3,
      review_count: 65,
      is_active: true,
      is_featured: false,
    },
    {
      name: 'Dafalgan Forte 1g',
      sku: 'DAFA-1000-16',
      description: 'Paracétamol 1g, boîte de 16 comprimés effervescents',
      manufacturer: 'UPSA',
      category_id: categoryIds['douleurs-fievre'],
      price: 12.50,
      original_price: null,
      stock: 75,
      low_stock_threshold: 10,
      requires_prescription: false,
      image_url: '/products/dafalgan.jpg',
      rating: 4.6,
      review_count: 98,
      is_active: true,
      is_featured: true,
    },
    {
      name: 'Sirop contre la toux',
      sku: 'TOUX-SIR-200',
      description: 'Sirop antitussif, flacon de 200ml',
      manufacturer: 'Vifor',
      category_id: categoryIds['rhume-grippe'],
      price: 11.90,
      original_price: null,
      stock: 60,
      low_stock_threshold: 12,
      requires_prescription: false,
      image_url: '/products/cough-syrup.jpg',
      rating: 4.2,
      review_count: 54,
      is_active: true,
      is_featured: false,
    },
    {
      name: 'Spray nasal décongestionnant',
      sku: 'NASAL-SPR-15',
      description: 'Spray nasal, flacon de 15ml',
      manufacturer: 'Otrivin',
      category_id: categoryIds['rhume-grippe'],
      price: 9.50,
      original_price: 10.90,
      stock: 45,
      low_stock_threshold: 10,
      requires_prescription: false,
      image_url: '/products/nasal-spray.jpg',
      rating: 4.4,
      review_count: 71,
      is_active: true,
      is_featured: false,
    },
    {
      name: 'Vitamine C 1000mg',
      sku: 'VITC-1000-30',
      description: 'Comprimés effervescents, boîte de 30',
      manufacturer: 'Vifor',
      category_id: categoryIds['vitamines'],
      price: 14.90,
      original_price: null,
      stock: 120,
      low_stock_threshold: 20,
      requires_prescription: false,
      image_url: '/products/vitamin-c.jpg',
      rating: 4.8,
      review_count: 203,
      is_active: true,
      is_featured: true,
    },
    {
      name: 'Multivitamines quotidiennes',
      sku: 'MULTI-VIT-60',
      description: 'Comprimés multivitaminés, boîte de 60',
      manufacturer: 'Supradyn',
      category_id: categoryIds['vitamines'],
      price: 24.90,
      original_price: 29.90,
      stock: 80,
      low_stock_threshold: 15,
      requires_prescription: false,
      image_url: '/products/multivitamin.jpg',
      rating: 4.6,
      review_count: 156,
      is_active: true,
      is_featured: true,
    },
    {
      name: 'Crème hydratante visage',
      sku: 'CREM-VIS-50',
      description: 'Crème hydratante, tube de 50ml',
      manufacturer: 'La Roche-Posay',
      category_id: categoryIds['cosmetiques'],
      price: 19.90,
      original_price: null,
      stock: 55,
      low_stock_threshold: 10,
      requires_prescription: false,
      image_url: '/products/face-cream.jpg',
      rating: 4.7,
      review_count: 189,
      is_active: true,
      is_featured: false,
    },
    {
      name: 'Thermomètre digital',
      sku: 'THERM-DIG-01',
      description: 'Thermomètre médical digital',
      manufacturer: 'Braun',
      category_id: categoryIds['parapharmacie'],
      price: 15.90,
      original_price: null,
      stock: 30,
      low_stock_threshold: 8,
      requires_prescription: false,
      image_url: '/products/thermometer.jpg',
      rating: 4.5,
      review_count: 92,
      is_active: true,
      is_featured: false,
    },
  ];

  const productIds: { [key: string]: string } = {};

  for (const product of products) {
    const result = await client.query(
      `INSERT INTO products (
        name, sku, description, manufacturer, category_id, price, original_price,
        stock, low_stock_threshold, requires_prescription, image_url,
        rating, review_count, is_active, is_featured
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id`,
      [
        product.name,
        product.sku,
        product.description,
        product.manufacturer,
        product.category_id,
        product.price,
        product.original_price,
        product.stock,
        product.low_stock_threshold,
        product.requires_prescription,
        product.image_url,
        product.rating,
        product.review_count,
        product.is_active,
        product.is_featured,
      ]
    );

    productIds[product.sku] = result.rows[0].id;
    console.log(`  ✅ Created product: ${product.name}`);
  }

  return productIds;
}

/**
 * Seed prescriptions
 */
async function seedPrescriptions(
  client: Client,
  pharmacyIds: { [key: string]: string },
  userIds: { [key: string]: string }
): Promise<string[]> {
  console.log('📋 Seeding prescriptions...');

  const prescriptions = [
    {
      pharmacy_id: pharmacyIds['Pharmacie du Lac'],
      patient_id: userIds['patient@test.metapharm.ch'],
      prescribing_doctor_id: userIds['doctor@test.metapharm.ch'],
      pharmacist_id: userIds['pharmacist@test.metapharm.ch'],
      source: 'doctor_direct',
      status: 'approved',
      ai_confidence_score: 95.5,
      prescribed_date: new Date('2024-12-15'),
      expiry_date: new Date('2025-03-15'),
    },
    {
      pharmacy_id: pharmacyIds['Pharmacie du Lac'],
      patient_id: userIds['patient1@test.com'],
      prescribing_doctor_id: userIds['doctor@test.metapharm.ch'],
      pharmacist_id: userIds['pharmacist@test.metapharm.ch'],
      source: 'patient_upload',
      image_url: 's3://metapharm/prescriptions/rx-001.jpg',
      status: 'pending',
      ai_confidence_score: 72.3,
      prescribed_date: new Date('2024-12-28'),
      expiry_date: new Date('2025-03-28'),
    },
    {
      pharmacy_id: pharmacyIds['Pharmacie Centrale Genève'],
      patient_id: userIds['patient2@test.com'],
      prescribing_doctor_id: userIds['doctor2@test.com'],
      pharmacist_id: userIds['pharmacist2@test.com'],
      source: 'teleconsultation',
      status: 'in_review',
      ai_confidence_score: 88.7,
      prescribed_date: new Date('2024-12-27'),
      expiry_date: new Date('2025-03-27'),
    },
    {
      pharmacy_id: pharmacyIds['Pharmacie Centrale Genève'],
      patient_id: userIds['patient3@test.com'],
      prescribing_doctor_id: userIds['doctor2@test.com'],
      pharmacist_id: null,
      source: 'patient_upload',
      image_url: 's3://metapharm/prescriptions/rx-002.jpg',
      status: 'clarification_needed',
      rejection_reason: 'Dosage illisible sur l\'ordonnance',
      ai_confidence_score: 65.2,
      prescribed_date: new Date('2024-12-26'),
      expiry_date: new Date('2025-03-26'),
    },
    {
      pharmacy_id: pharmacyIds['Pharmacie des Alpes'],
      patient_id: userIds['patient4@test.com'],
      prescribing_doctor_id: userIds['doctor@test.metapharm.ch'],
      pharmacist_id: userIds['pharmacist3@test.com'],
      source: 'doctor_direct',
      status: 'approved',
      ai_confidence_score: 92.1,
      prescribed_date: new Date('2024-12-20'),
      expiry_date: new Date('2025-03-20'),
    },
  ];

  const prescriptionIds: string[] = [];

  for (const prescription of prescriptions) {
    const result = await client.query(
      `INSERT INTO prescriptions (
        pharmacy_id, patient_id, prescribing_doctor_id, pharmacist_id,
        source, image_url, status, rejection_reason, ai_confidence_score,
        prescribed_date, expiry_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id`,
      [
        prescription.pharmacy_id,
        prescription.patient_id,
        prescription.prescribing_doctor_id,
        prescription.pharmacist_id,
        prescription.source,
        prescription.image_url || null,
        prescription.status,
        prescription.rejection_reason || null,
        prescription.ai_confidence_score,
        prescription.prescribed_date,
        prescription.expiry_date,
      ]
    );

    prescriptionIds.push(result.rows[0].id);
    console.log(`  ✅ Created prescription: ${prescription.status} (${result.rows[0].id})`);
  }

  return prescriptionIds;
}

/**
 * Seed prescription items
 */
async function seedPrescriptionItems(client: Client, prescriptionIds: string[]): Promise<void> {
  console.log('💊 Seeding prescription items...');

  const items = [
    // Prescription 1 items (approved)
    {
      prescription_id: prescriptionIds[0],
      medication_name: 'Amoxicilline',
      medication_rxnorm_code: 'RX-AMX-500',
      dosage: '500mg',
      frequency: '3 fois par jour',
      duration: '7 jours',
      quantity: 21,
      medication_confidence: 96.5,
      dosage_confidence: 94.2,
      frequency_confidence: 95.8,
      pharmacist_corrected: false,
    },
    {
      prescription_id: prescriptionIds[0],
      medication_name: 'Paracétamol',
      medication_rxnorm_code: 'RX-PARA-500',
      dosage: '500mg',
      frequency: '3 fois par jour si besoin',
      duration: '14 jours',
      quantity: 42,
      medication_confidence: 98.1,
      dosage_confidence: 97.3,
      frequency_confidence: 96.7,
      pharmacist_corrected: false,
    },
    // Prescription 2 items (pending - low confidence)
    {
      prescription_id: prescriptionIds[1],
      medication_name: 'Ibuprofène',
      medication_rxnorm_code: 'RX-IBUP-400',
      dosage: '400mg',
      frequency: '2 fois par jour',
      duration: '5 jours',
      quantity: 10,
      medication_confidence: 75.3,
      dosage_confidence: 68.9,
      frequency_confidence: 82.1,
      pharmacist_corrected: false,
    },
    // Prescription 3 items (in review)
    {
      prescription_id: prescriptionIds[2],
      medication_name: 'Oméprazole',
      medication_rxnorm_code: 'RX-OMEP-20',
      dosage: '20mg',
      frequency: '1 fois par jour le matin',
      duration: '30 jours',
      quantity: 30,
      medication_confidence: 89.4,
      dosage_confidence: 91.2,
      frequency_confidence: 85.6,
      pharmacist_corrected: false,
    },
    // Prescription 4 items (clarification needed - very low confidence)
    {
      prescription_id: prescriptionIds[3],
      medication_name: 'Métformine',
      medication_rxnorm_code: 'RX-METF-850',
      dosage: '850mg',
      frequency: '2 fois par jour',
      duration: '90 jours',
      quantity: 180,
      medication_confidence: 62.1,
      dosage_confidence: 58.7,
      frequency_confidence: 71.3,
      pharmacist_corrected: false,
    },
    // Prescription 5 items (approved)
    {
      prescription_id: prescriptionIds[4],
      medication_name: 'Atorvastatine',
      medication_rxnorm_code: 'RX-ATOR-20',
      dosage: '20mg',
      frequency: '1 fois par jour le soir',
      duration: '90 jours',
      quantity: 90,
      medication_confidence: 93.8,
      dosage_confidence: 92.5,
      frequency_confidence: 90.1,
      pharmacist_corrected: false,
    },
  ];

  for (const item of items) {
    await client.query(
      `INSERT INTO prescription_items (
        prescription_id, medication_name, medication_rxnorm_code,
        dosage, frequency, duration, quantity,
        medication_confidence, dosage_confidence, frequency_confidence,
        pharmacist_corrected
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        item.prescription_id,
        item.medication_name,
        item.medication_rxnorm_code,
        item.dosage,
        item.frequency,
        item.duration,
        item.quantity,
        item.medication_confidence,
        item.dosage_confidence,
        item.frequency_confidence,
        item.pharmacist_corrected,
      ]
    );

    console.log(`  ✅ Created prescription item: ${item.medication_name} (${item.dosage})`);
  }
}

/**
 * Seed inventory items
 */
async function seedInventoryItems(
  client: Client,
  pharmacyIds: { [key: string]: string }
): Promise<string[]> {
  console.log('📦 Seeding inventory items...');

  const items = [
    {
      pharmacy_id: pharmacyIds['Pharmacie du Lac'],
      medication_name: 'Amoxicilline 500mg',
      medication_rxnorm_code: 'RX-AMX-500',
      medication_gtin: '7680123456789',
      quantity: 250,
      unit: 'boîtes',
      reorder_threshold: 50,
      optimal_stock_level: 200,
      batch_number: 'BATCH-2024-001',
      expiry_date: new Date('2026-06-30'),
      supplier_name: 'Sandoz Suisse',
      cost_per_unit: 8.50,
      is_controlled: false,
      storage_location: 'A1-15',
      requires_refrigeration: false,
    },
    {
      pharmacy_id: pharmacyIds['Pharmacie du Lac'],
      medication_name: 'Paracétamol 500mg',
      medication_rxnorm_code: 'RX-PARA-500',
      medication_gtin: '7680234567890',
      quantity: 45,
      unit: 'boîtes',
      reorder_threshold: 50,
      optimal_stock_level: 150,
      batch_number: 'BATCH-2024-002',
      expiry_date: new Date('2026-03-31'),
      supplier_name: 'Mepha Pharma',
      cost_per_unit: 4.20,
      is_controlled: false,
      storage_location: 'A1-20',
      requires_refrigeration: false,
    },
    {
      pharmacy_id: pharmacyIds['Pharmacie du Lac'],
      medication_name: 'Morphine 10mg',
      medication_rxnorm_code: 'RX-MORP-10',
      medication_gtin: '7680345678901',
      quantity: 15,
      unit: 'boîtes',
      reorder_threshold: 10,
      optimal_stock_level: 25,
      batch_number: 'BATCH-2024-003',
      expiry_date: new Date('2025-12-31'),
      supplier_name: 'Mundipharma',
      cost_per_unit: 45.00,
      is_controlled: true,
      substance_schedule: 'II',
      storage_location: 'SECURE-01',
      requires_refrigeration: false,
    },
    {
      pharmacy_id: pharmacyIds['Pharmacie Centrale Genève'],
      medication_name: 'Ibuprofène 400mg',
      medication_rxnorm_code: 'RX-IBUP-400',
      medication_gtin: '7680456789012',
      quantity: 180,
      unit: 'boîtes',
      reorder_threshold: 40,
      optimal_stock_level: 150,
      batch_number: 'BATCH-2024-004',
      expiry_date: new Date('2026-09-30'),
      supplier_name: 'Mepha Pharma',
      cost_per_unit: 6.30,
      is_controlled: false,
      storage_location: 'B2-10',
      requires_refrigeration: false,
    },
    {
      pharmacy_id: pharmacyIds['Pharmacie Centrale Genève'],
      medication_name: 'Insuline Humalog',
      medication_rxnorm_code: 'RX-INSU-HUM',
      medication_gtin: '7680567890123',
      quantity: 30,
      unit: 'flacons',
      reorder_threshold: 15,
      optimal_stock_level: 40,
      batch_number: 'BATCH-2024-005',
      expiry_date: new Date('2025-04-30'),
      supplier_name: 'Eli Lilly',
      cost_per_unit: 78.50,
      is_controlled: false,
      storage_location: 'FRIDGE-01',
      requires_refrigeration: true,
    },
    {
      pharmacy_id: pharmacyIds['Pharmacie des Alpes'],
      medication_name: 'Oméprazole 20mg',
      medication_rxnorm_code: 'RX-OMEP-20',
      medication_gtin: '7680678901234',
      quantity: 120,
      unit: 'boîtes',
      reorder_threshold: 30,
      optimal_stock_level: 100,
      batch_number: 'BATCH-2024-006',
      expiry_date: new Date('2026-12-31'),
      supplier_name: 'Sandoz Suisse',
      cost_per_unit: 12.40,
      is_controlled: false,
      storage_location: 'C1-05',
      requires_refrigeration: false,
    },
    {
      pharmacy_id: pharmacyIds['Pharmacie des Alpes'],
      medication_name: 'Métformine 850mg',
      medication_rxnorm_code: 'RX-METF-850',
      medication_gtin: '7680789012345',
      quantity: 8,
      unit: 'boîtes',
      reorder_threshold: 20,
      optimal_stock_level: 60,
      batch_number: 'BATCH-2024-007',
      expiry_date: new Date('2026-08-31'),
      supplier_name: 'Spirig Healthcare',
      cost_per_unit: 9.80,
      is_controlled: false,
      storage_location: 'C1-10',
      requires_refrigeration: false,
    },
  ];

  const inventoryIds: string[] = [];

  for (const item of items) {
    const result = await client.query(
      `INSERT INTO inventory_items (
        pharmacy_id, medication_name, medication_rxnorm_code, medication_gtin,
        quantity, unit, reorder_threshold, optimal_stock_level,
        batch_number, expiry_date, supplier_name, cost_per_unit,
        is_controlled, substance_schedule, storage_location, requires_refrigeration
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING id`,
      [
        item.pharmacy_id,
        item.medication_name,
        item.medication_rxnorm_code,
        item.medication_gtin,
        item.quantity,
        item.unit,
        item.reorder_threshold,
        item.optimal_stock_level,
        item.batch_number,
        item.expiry_date,
        item.supplier_name,
        item.cost_per_unit,
        item.is_controlled,
        item.substance_schedule || null,
        item.storage_location,
        item.requires_refrigeration,
      ]
    );

    inventoryIds.push(result.rows[0].id);
    console.log(`  ✅ Created inventory item: ${item.medication_name} (qty: ${item.quantity})`);
  }

  return inventoryIds;
}

/**
 * Seed inventory alerts
 */
async function seedInventoryAlerts(client: Client, inventoryIds: string[]): Promise<void> {
  console.log('🔔 Seeding inventory alerts...');

  const alerts = [
    {
      inventory_item_id: inventoryIds[1], // Paracétamol - low stock
      alert_type: 'low_stock',
      severity: 'high',
      message: 'Stock critique: Paracétamol 500mg (45 boîtes restantes)',
      is_resolved: false,
    },
    {
      inventory_item_id: inventoryIds[4], // Insuline - expiring soon
      alert_type: 'expiring_soon',
      severity: 'medium',
      message: 'Expiration proche: Insuline Humalog expire le 30/04/2025',
      is_resolved: false,
    },
    {
      inventory_item_id: inventoryIds[6], // Métformine - critical stock
      alert_type: 'critical_stock',
      severity: 'critical',
      message: 'Stock critique: Métformine 850mg (8 boîtes restantes)',
      is_resolved: false,
    },
  ];

  for (const alert of alerts) {
    await client.query(
      `INSERT INTO inventory_alerts (
        inventory_item_id, alert_type, severity, message, is_resolved
      ) VALUES ($1, $2, $3, $4, $5)`,
      [alert.inventory_item_id, alert.alert_type, alert.severity, alert.message, alert.is_resolved]
    );

    console.log(`  ✅ Created alert: ${alert.alert_type} - ${alert.severity}`);
  }
}

/**
 * Main seed function
 */
async function seed(): Promise<void> {
  const dbConfig = getDatabaseConfig();
  const client = new Client(dbConfig);

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL database\n');

    // Start transaction
    await client.query('BEGIN');

    // Seed data
    const pharmacyIds = await seedPharmacies(client);
    console.log('');

    const userIds = await seedUsers(client, pharmacyIds);
    console.log('');

    const categoryIds = await seedCategories(client);
    console.log('');

    const productIds = await seedProducts(client, categoryIds);
    console.log('');

    const prescriptionIds = await seedPrescriptions(client, pharmacyIds, userIds);
    console.log('');

    await seedPrescriptionItems(client, prescriptionIds);
    console.log('');

    const inventoryIds = await seedInventoryItems(client, pharmacyIds);
    console.log('');

    await seedInventoryAlerts(client, inventoryIds);
    console.log('');

    // Commit transaction
    await client.query('COMMIT');

    console.log('\n✅ Comprehensive seed data created successfully!\n');
    console.log('📋 Test Credentials:');
    console.log('  Pharmacist 1: pharmacist@test.metapharm.ch / TestPass123!');
    console.log('  Pharmacist 2: pharmacist2@test.com / Test123!');
    console.log('  Pharmacist 3: pharmacist3@test.com / Test123!');
    console.log('  Doctor 1: doctor@test.metapharm.ch / TestPass123!');
    console.log('  Doctor 2: doctor2@test.com / Test123!');
    console.log('  Patient: patient@test.metapharm.ch / TestPass123!');
    console.log('\n📊 Data Summary:');
    console.log(`  - ${Object.keys(pharmacyIds).length} pharmacies`);
    console.log(`  - ${Object.keys(userIds).length} users`);
    console.log(`  - ${Object.keys(categoryIds).length} categories`);
    console.log(`  - ${Object.keys(productIds).length} products`);
    console.log(`  - ${prescriptionIds.length} prescriptions`);
    console.log(`  - ${inventoryIds.length} inventory items`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

/**
 * Run seed if executed directly
 */
if (require.main === module) {
  seed()
    .then(() => {
      console.log('\n✅ Seed command completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Seed command failed:', error);
      process.exit(1);
    });
}

export { seed };
