-- ============================================================================
-- MetaPharm Connect - Comprehensive Test Data Seed Script
-- ============================================================================

-- Create prescriptions table if not exists
CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pharmacy_id UUID NOT NULL REFERENCES pharmacies(id),
    patient_id UUID NOT NULL REFERENCES users(id),
    prescribing_doctor_id UUID REFERENCES users(id),
    pharmacist_id UUID REFERENCES users(id),
    source VARCHAR(50) NOT NULL CHECK (source IN ('patient_upload', 'doctor_direct', 'teleconsultation')),
    image_url VARCHAR(500),
    ai_transcription_data JSONB,
    ai_confidence_score DECIMAL(5, 2),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'in_review', 'clarification_needed', 'approved', 'rejected', 'expired'
    )),
    rejection_reason TEXT,
    drug_interactions JSONB,
    allergy_warnings JSONB,
    contraindications JSONB,
    prescribed_date DATE,
    expiry_date DATE,
    treatment_plan_id UUID,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    approved_at TIMESTAMP,
    approved_by_pharmacist_id UUID REFERENCES users(id)
);

-- Create prescription_items table if not exists
CREATE TABLE IF NOT EXISTS prescription_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    medication_name VARCHAR(255) NOT NULL,
    medication_rxnorm_code VARCHAR(50),
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    duration VARCHAR(100),
    quantity INTEGER,
    medication_confidence DECIMAL(5, 2),
    dosage_confidence DECIMAL(5, 2),
    frequency_confidence DECIMAL(5, 2),
    pharmacist_corrected BOOLEAN DEFAULT FALSE,
    original_ai_value JSONB,
    inventory_item_id UUID,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes if not exist
CREATE INDEX IF NOT EXISTS idx_prescriptions_pharmacy ON prescriptions(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status);
CREATE INDEX IF NOT EXISTS idx_prescription_items_prescription ON prescription_items(prescription_id);

-- ============================================================================
-- 1. Insert Test Pharmacy
-- ============================================================================
INSERT INTO pharmacies (id, name, license_number, address_encrypted, city, canton, postal_code, phone, email, subscription_tier, subscription_status)
VALUES (
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Pharmacie du Rhône',
    'CH-VS-2024-001',
    decode('00', 'hex'),
    'Sion',
    'Valais',
    '1950',
    '+41 27 322 45 67',
    'contact@pharmacie-rhone.ch',
    'premium',
    'active'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. Update existing users with pharmacy_id
-- ============================================================================
UPDATE users SET primary_pharmacy_id = '11111111-1111-1111-1111-111111111111'::uuid
WHERE primary_pharmacy_id IS NULL;

-- ============================================================================
-- 3. Insert Additional Test Patients (25 total for prescriptions)
-- ============================================================================
INSERT INTO users (id, email, email_verified, role, status, first_name_encrypted, last_name_encrypted, primary_pharmacy_id)
VALUES
('22222222-0001-0001-0001-000000000001'::uuid, 'jean-pierre.muller@test.ch', true, 'PATIENT', 'active', decode('00', 'hex'), decode('00', 'hex'), '11111111-1111-1111-1111-111111111111'::uuid),
('22222222-0001-0001-0001-000000000002'::uuid, 'francoise.dubois@test.ch', true, 'PATIENT', 'active', decode('00', 'hex'), decode('00', 'hex'), '11111111-1111-1111-1111-111111111111'::uuid),
('22222222-0001-0001-0001-000000000003'::uuid, 'marc.schneider@test.ch', true, 'PATIENT', 'active', decode('00', 'hex'), decode('00', 'hex'), '11111111-1111-1111-1111-111111111111'::uuid),
('22222222-0001-0001-0001-000000000004'::uuid, 'claire.rochat@test.ch', true, 'PATIENT', 'active', decode('00', 'hex'), decode('00', 'hex'), '11111111-1111-1111-1111-111111111111'::uuid),
('22222222-0001-0001-0001-000000000005'::uuid, 'andre.bonvin@test.ch', true, 'PATIENT', 'active', decode('00', 'hex'), decode('00', 'hex'), '11111111-1111-1111-1111-111111111111'::uuid),
('22222222-0001-0001-0001-000000000006'::uuid, 'helene.germanier@test.ch', true, 'PATIENT', 'active', decode('00', 'hex'), decode('00', 'hex'), '11111111-1111-1111-1111-111111111111'::uuid),
('22222222-0001-0001-0001-000000000007'::uuid, 'sophie.vuagnaux@test.ch', true, 'PATIENT', 'active', decode('00', 'hex'), decode('00', 'hex'), '11111111-1111-1111-1111-111111111111'::uuid),
('22222222-0001-0001-0001-000000000008'::uuid, 'nicolas.favre@test.ch', true, 'PATIENT', 'active', decode('00', 'hex'), decode('00', 'hex'), '11111111-1111-1111-1111-111111111111'::uuid),
('22222222-0001-0001-0001-000000000009'::uuid, 'isabelle.crettenand@test.ch', true, 'PATIENT', 'active', decode('00', 'hex'), decode('00', 'hex'), '11111111-1111-1111-1111-111111111111'::uuid),
('22222222-0001-0001-0001-000000000010'::uuid, 'olivier.zufferey@test.ch', true, 'PATIENT', 'active', decode('00', 'hex'), decode('00', 'hex'), '11111111-1111-1111-1111-111111111111'::uuid),
('22222222-0001-0001-0001-000000000011'::uuid, 'veronique.deleze@test.ch', true, 'PATIENT', 'active', decode('00', 'hex'), decode('00', 'hex'), '11111111-1111-1111-1111-111111111111'::uuid),
('22222222-0001-0001-0001-000000000012'::uuid, 'anne-marie.blanc@test.ch', true, 'PATIENT', 'active', decode('00', 'hex'), decode('00', 'hex'), '11111111-1111-1111-1111-111111111111'::uuid),
('22222222-0001-0001-0001-000000000013'::uuid, 'pierre-alain.mottet@test.ch', true, 'PATIENT', 'active', decode('00', 'hex'), decode('00', 'hex'), '11111111-1111-1111-1111-111111111111'::uuid),
('22222222-0001-0001-0001-000000000014'::uuid, 'valerie.thurre@test.ch', true, 'PATIENT', 'active', decode('00', 'hex'), decode('00', 'hex'), '11111111-1111-1111-1111-111111111111'::uuid),
('22222222-0001-0001-0001-000000000015'::uuid, 'maurice.corthay@test.ch', true, 'PATIENT', 'active', decode('00', 'hex'), decode('00', 'hex'), '11111111-1111-1111-1111-111111111111'::uuid),
('22222222-0001-0001-0001-000000000016'::uuid, 'michel.favre@test.ch', true, 'PATIENT', 'active', decode('00', 'hex'), decode('00', 'hex'), '11111111-1111-1111-1111-111111111111'::uuid),
('22222222-0001-0001-0001-000000000017'::uuid, 'christine.rausis@test.ch', true, 'PATIENT', 'active', decode('00', 'hex'), decode('00', 'hex'), '11111111-1111-1111-1111-111111111111'::uuid),
('22222222-0001-0001-0001-000000000018'::uuid, 'bernard.heritier@test.ch', true, 'PATIENT', 'active', decode('00', 'hex'), decode('00', 'hex'), '11111111-1111-1111-1111-111111111111'::uuid),
('22222222-0001-0001-0001-000000000019'::uuid, 'marie-jose.carron@test.ch', true, 'PATIENT', 'active', decode('00', 'hex'), decode('00', 'hex'), '11111111-1111-1111-1111-111111111111'::uuid),
('22222222-0001-0001-0001-000000000020'::uuid, 'alain.bagnoud@test.ch', true, 'PATIENT', 'active', decode('00', 'hex'), decode('00', 'hex'), '11111111-1111-1111-1111-111111111111'::uuid),
('22222222-0001-0001-0001-000000000021'::uuid, 'sylvie.besse@test.ch', true, 'PATIENT', 'active', decode('00', 'hex'), decode('00', 'hex'), '11111111-1111-1111-1111-111111111111'::uuid),
('22222222-0001-0001-0001-000000000022'::uuid, 'stephane.roh@test.ch', true, 'PATIENT', 'active', decode('00', 'hex'), decode('00', 'hex'), '11111111-1111-1111-1111-111111111111'::uuid),
('22222222-0001-0001-0001-000000000023'::uuid, 'nathalie.fournier@test.ch', true, 'PATIENT', 'active', decode('00', 'hex'), decode('00', 'hex'), '11111111-1111-1111-1111-111111111111'::uuid),
('22222222-0001-0001-0001-000000000024'::uuid, 'laurent.dorsaz@test.ch', true, 'PATIENT', 'active', decode('00', 'hex'), decode('00', 'hex'), '11111111-1111-1111-1111-111111111111'::uuid),
('22222222-0001-0001-0001-000000000025'::uuid, 'patrick.fellay@test.ch', true, 'PATIENT', 'active', decode('00', 'hex'), decode('00', 'hex'), '11111111-1111-1111-1111-111111111111'::uuid)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 4. Insert Test Doctors
-- ============================================================================
INSERT INTO users (id, email, email_verified, role, status, first_name_encrypted, last_name_encrypted, primary_pharmacy_id)
VALUES
('33333333-0001-0001-0001-000000000001'::uuid, 'marie.martin@doctor.ch', true, 'DOCTOR', 'active', decode('00', 'hex'), decode('00', 'hex'), '11111111-1111-1111-1111-111111111111'::uuid),
('33333333-0001-0001-0001-000000000002'::uuid, 'pierre.leroy@doctor.ch', true, 'DOCTOR', 'active', decode('00', 'hex'), decode('00', 'hex'), '11111111-1111-1111-1111-111111111111'::uuid),
('33333333-0001-0001-0001-000000000003'::uuid, 'lucie.girard@doctor.ch', true, 'DOCTOR', 'active', decode('00', 'hex'), decode('00', 'hex'), '11111111-1111-1111-1111-111111111111'::uuid),
('33333333-0001-0001-0001-000000000004'::uuid, 'thomas.weber@doctor.ch', true, 'DOCTOR', 'active', decode('00', 'hex'), decode('00', 'hex'), '11111111-1111-1111-1111-111111111111'::uuid)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 5. Insert 25 Test Prescriptions
-- ============================================================================

-- PENDING prescriptions (6)
INSERT INTO prescriptions (id, pharmacy_id, patient_id, prescribing_doctor_id, source, ai_confidence_score, status, created_at, updated_at, drug_interactions, allergy_warnings, contraindications)
VALUES
('aaaaaaaa-0001-0001-0001-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, '22222222-0001-0001-0001-000000000001'::uuid, '33333333-0001-0001-0001-000000000001'::uuid, 'patient_upload', 92.5, 'pending', NOW() - INTERVAL '1 hour', NOW(), '[]', '[]', '[]'),
('aaaaaaaa-0001-0001-0001-000000000002'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, '22222222-0001-0001-0001-000000000002'::uuid, '33333333-0001-0001-0001-000000000002'::uuid, 'doctor_direct', 88.7, 'pending', NOW() - INTERVAL '2 hours', NOW(), '[]', '[]', '[]'),
('aaaaaaaa-0001-0001-0001-000000000003'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, '22222222-0001-0001-0001-000000000003'::uuid, '33333333-0001-0001-0001-000000000003'::uuid, 'teleconsultation', 95.2, 'pending', NOW() - INTERVAL '3 hours', NOW(), '[]', '[]', '[]'),
('aaaaaaaa-0001-0001-0001-000000000004'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, '22222222-0001-0001-0001-000000000004'::uuid, '33333333-0001-0001-0001-000000000001'::uuid, 'patient_upload', 91.0, 'pending', NOW() - INTERVAL '4 hours', NOW(), '[]', '[]', '[]'),
('aaaaaaaa-0001-0001-0001-000000000005'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, '22222222-0001-0001-0001-000000000005'::uuid, '33333333-0001-0001-0001-000000000004'::uuid, 'doctor_direct', 89.3, 'pending', NOW() - INTERVAL '5 hours', NOW(), '[]', '[]', '[]'),
('aaaaaaaa-0001-0001-0001-000000000006'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, '22222222-0001-0001-0001-000000000006'::uuid, '33333333-0001-0001-0001-000000000002'::uuid, 'patient_upload', 94.1, 'pending', NOW() - INTERVAL '6 hours', NOW(), '[]', '[]', '[]'),

-- IN_REVIEW prescriptions (5)
('aaaaaaaa-0001-0001-0001-000000000007'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, '22222222-0001-0001-0001-000000000007'::uuid, '33333333-0001-0001-0001-000000000002'::uuid, 'patient_upload', 78.3, 'in_review', NOW() - INTERVAL '1 day', NOW(), '[{"drug1": "Amoxicilline", "drug2": "Methotrexate", "severity": "moderate", "description": "Risque de toxicité accrue"}]', '[]', '[]'),
('aaaaaaaa-0001-0001-0001-000000000008'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, '22222222-0001-0001-0001-000000000008'::uuid, '33333333-0001-0001-0001-000000000003'::uuid, 'teleconsultation', 82.1, 'in_review', NOW() - INTERVAL '25 hours', NOW(), '[]', '[]', '[]'),
('aaaaaaaa-0001-0001-0001-000000000009'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, '22222222-0001-0001-0001-000000000009'::uuid, '33333333-0001-0001-0001-000000000001'::uuid, 'doctor_direct', 76.8, 'in_review', NOW() - INTERVAL '26 hours', NOW(), '[{"drug1": "Tramadol", "drug2": "SSRI", "severity": "high", "description": "Risque de syndrome sérotoninergique"}]', '[]', '[]'),
('aaaaaaaa-0001-0001-0001-000000000010'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, '22222222-0001-0001-0001-000000000010'::uuid, '33333333-0001-0001-0001-000000000004'::uuid, 'patient_upload', 85.5, 'in_review', NOW() - INTERVAL '27 hours', NOW(), '[]', '[]', '[]'),
('aaaaaaaa-0001-0001-0001-000000000011'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, '22222222-0001-0001-0001-000000000011'::uuid, '33333333-0001-0001-0001-000000000003'::uuid, 'teleconsultation', 79.9, 'in_review', NOW() - INTERVAL '28 hours', NOW(), '[]', '[]', '[]'),

-- CLARIFICATION_NEEDED prescriptions (4)
('aaaaaaaa-0001-0001-0001-000000000012'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, '22222222-0001-0001-0001-000000000012'::uuid, '33333333-0001-0001-0001-000000000003'::uuid, 'patient_upload', 65.2, 'clarification_needed', NOW() - INTERVAL '3 days', NOW(), '[]', '[]', '[]'),
('aaaaaaaa-0001-0001-0001-000000000013'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, '22222222-0001-0001-0001-000000000013'::uuid, '33333333-0001-0001-0001-000000000002'::uuid, 'patient_upload', 58.9, 'clarification_needed', NOW() - INTERVAL '2 days', NOW(), '[]', '[]', '[]'),
('aaaaaaaa-0001-0001-0001-000000000014'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, '22222222-0001-0001-0001-000000000014'::uuid, '33333333-0001-0001-0001-000000000001'::uuid, 'teleconsultation', 72.1, 'clarification_needed', NOW() - INTERVAL '4 days', NOW(), '[]', '[]', '[]'),
('aaaaaaaa-0001-0001-0001-000000000015'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, '22222222-0001-0001-0001-000000000015'::uuid, '33333333-0001-0001-0001-000000000004'::uuid, 'patient_upload', 61.5, 'clarification_needed', NOW() - INTERVAL '5 days', NOW(), '[]', '[]', '[]'),

-- APPROVED prescriptions (6)
('aaaaaaaa-0001-0001-0001-000000000016'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, '22222222-0001-0001-0001-000000000016'::uuid, '33333333-0001-0001-0001-000000000001'::uuid, 'teleconsultation', 98.1, 'approved', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days', '[]', '[]', '[]'),
('aaaaaaaa-0001-0001-0001-000000000017'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, '22222222-0001-0001-0001-000000000017'::uuid, '33333333-0001-0001-0001-000000000004'::uuid, 'doctor_direct', 99.2, 'approved', NOW() - INTERVAL '6 days', NOW() - INTERVAL '5 days', '[]', '[]', '[]'),
('aaaaaaaa-0001-0001-0001-000000000018'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, '22222222-0001-0001-0001-000000000018'::uuid, '33333333-0001-0001-0001-000000000002'::uuid, 'patient_upload', 94.7, 'approved', NOW() - INTERVAL '7 days', NOW() - INTERVAL '6 days', '[]', '[]', '[]'),
('aaaaaaaa-0001-0001-0001-000000000019'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, '22222222-0001-0001-0001-000000000019'::uuid, '33333333-0001-0001-0001-000000000003'::uuid, 'teleconsultation', 96.3, 'approved', NOW() - INTERVAL '8 days', NOW() - INTERVAL '7 days', '[]', '[]', '[]'),
('aaaaaaaa-0001-0001-0001-000000000020'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, '22222222-0001-0001-0001-000000000020'::uuid, '33333333-0001-0001-0001-000000000001'::uuid, 'doctor_direct', 97.8, 'approved', NOW() - INTERVAL '9 days', NOW() - INTERVAL '8 days', '[]', '[]', '[]'),
('aaaaaaaa-0001-0001-0001-000000000021'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, '22222222-0001-0001-0001-000000000021'::uuid, '33333333-0001-0001-0001-000000000002'::uuid, 'teleconsultation', 95.5, 'approved', NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days', '[]', '[]', '[]'),

-- REJECTED prescriptions (4)
('aaaaaaaa-0001-0001-0001-000000000022'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, '22222222-0001-0001-0001-000000000022'::uuid, '33333333-0001-0001-0001-000000000002'::uuid, 'patient_upload', 45.2, 'rejected', NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days', '[]', '[]', '[]'),
('aaaaaaaa-0001-0001-0001-000000000023'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, '22222222-0001-0001-0001-000000000023'::uuid, '33333333-0001-0001-0001-000000000004'::uuid, 'patient_upload', 38.7, 'rejected', NOW() - INTERVAL '11 days', NOW() - INTERVAL '10 days', '[]', '[]', '[]'),
('aaaaaaaa-0001-0001-0001-000000000024'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, '22222222-0001-0001-0001-000000000024'::uuid, '33333333-0001-0001-0001-000000000003'::uuid, 'teleconsultation', 52.1, 'rejected', NOW() - INTERVAL '12 days', NOW() - INTERVAL '11 days', '[]', '[{"allergen": "Codéine", "reaction_type": "Allergie connue", "severity": "high"}]', '[]'),
('aaaaaaaa-0001-0001-0001-000000000025'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, '22222222-0001-0001-0001-000000000025'::uuid, '33333333-0001-0001-0001-000000000001'::uuid, 'patient_upload', 40.3, 'rejected', NOW() - INTERVAL '13 days', NOW() - INTERVAL '12 days', '[]', '[]', '[]')
ON CONFLICT (id) DO NOTHING;

-- Update rejection reasons for rejected prescriptions
UPDATE prescriptions SET rejection_reason = 'Document uploadé n''est pas une ordonnance médicale valide.' WHERE id = 'aaaaaaaa-0001-0001-0001-000000000022'::uuid;
UPDATE prescriptions SET rejection_reason = 'Ordonnance datée de plus de 3 mois. Veuillez obtenir une nouvelle prescription.' WHERE id = 'aaaaaaaa-0001-0001-0001-000000000023'::uuid;
UPDATE prescriptions SET rejection_reason = 'Cette substance nécessite une ordonnance sécurisée. Veuillez consulter en personne.' WHERE id = 'aaaaaaaa-0001-0001-0001-000000000024'::uuid;
UPDATE prescriptions SET rejection_reason = 'Image trop sombre pour être traitée. Veuillez reprendre la photo avec un meilleur éclairage.' WHERE id = 'aaaaaaaa-0001-0001-0001-000000000025'::uuid;

-- ============================================================================
-- 6. Insert Prescription Items (medications for each prescription)
-- ============================================================================
INSERT INTO prescription_items (id, prescription_id, medication_name, dosage, frequency, duration, quantity, medication_confidence, dosage_confidence, frequency_confidence)
VALUES
-- Prescription 1 items
('bbbbbbbb-0001-0001-0001-000000000001'::uuid, 'aaaaaaaa-0001-0001-0001-000000000001'::uuid, 'Paracétamol 500mg', '500mg', '3 fois par jour', '10 jours', 30, 95.0, 92.0, 90.0),
('bbbbbbbb-0001-0001-0001-000000000002'::uuid, 'aaaaaaaa-0001-0001-0001-000000000001'::uuid, 'Ibuprofène 400mg', '400mg', '2 fois par jour', '7 jours', 20, 93.0, 91.0, 89.0),
-- Prescription 2 items
('bbbbbbbb-0001-0001-0001-000000000003'::uuid, 'aaaaaaaa-0001-0001-0001-000000000002'::uuid, 'Lisinopril 10mg', '10mg', 'le matin', '30 jours', 30, 94.0, 92.0, 91.0),
-- Prescription 3 items
('bbbbbbbb-0001-0001-0001-000000000004'::uuid, 'aaaaaaaa-0001-0001-0001-000000000003'::uuid, 'Metformine 850mg', '850mg', 'matin et soir', '30 jours', 60, 96.0, 94.0, 93.0),
('bbbbbbbb-0001-0001-0001-000000000005'::uuid, 'aaaaaaaa-0001-0001-0001-000000000003'::uuid, 'Gliclazide 30mg', '30mg', 'le matin', '30 jours', 30, 95.0, 93.0, 92.0),
-- Prescription 4 items
('bbbbbbbb-0001-0001-0001-000000000006'::uuid, 'aaaaaaaa-0001-0001-0001-000000000004'::uuid, 'Lévothyroxine 50µg', '50µg', 'à jeun', '30 jours', 30, 92.0, 90.0, 88.0),
-- Prescription 5 items
('bbbbbbbb-0001-0001-0001-000000000007'::uuid, 'aaaaaaaa-0001-0001-0001-000000000005'::uuid, 'Atorvastatine 20mg', '20mg', 'le soir', '30 jours', 30, 94.0, 92.0, 91.0),
('bbbbbbbb-0001-0001-0001-000000000008'::uuid, 'aaaaaaaa-0001-0001-0001-000000000005'::uuid, 'Aspirine Cardio 100mg', '100mg', 'le matin', '30 jours', 30, 95.0, 93.0, 92.0),
-- Prescription 6 items
('bbbbbbbb-0001-0001-0001-000000000009'::uuid, 'aaaaaaaa-0001-0001-0001-000000000006'::uuid, 'Pantoprazole 40mg', '40mg', 'avant le petit-déjeuner', '28 jours', 28, 93.0, 91.0, 90.0),
-- Prescription 7 items (in_review with drug interaction)
('bbbbbbbb-0001-0001-0001-000000000010'::uuid, 'aaaaaaaa-0001-0001-0001-000000000007'::uuid, 'Amoxicilline 1g', '1g', 'matin et soir', '7 jours', 14, 85.0, 82.0, 80.0),
-- Prescription 8 items
('bbbbbbbb-0001-0001-0001-000000000011'::uuid, 'aaaaaaaa-0001-0001-0001-000000000008'::uuid, 'Pantoprazole 40mg', '40mg', 'avant le repas', '28 jours', 28, 88.0, 85.0, 83.0),
('bbbbbbbb-0001-0001-0001-000000000012'::uuid, 'aaaaaaaa-0001-0001-0001-000000000008'::uuid, 'Dompéridone 10mg', '10mg', 'avant les repas', '10 jours', 30, 86.0, 84.0, 82.0),
-- Prescription 9 items (in_review with high severity interaction)
('bbbbbbbb-0001-0001-0001-000000000013'::uuid, 'aaaaaaaa-0001-0001-0001-000000000009'::uuid, 'Tramadol 50mg', '50mg', 'max 4x/jour', '5 jours', 20, 78.0, 75.0, 73.0),
-- Prescription 10 items
('bbbbbbbb-0001-0001-0001-000000000014'::uuid, 'aaaaaaaa-0001-0001-0001-000000000010'::uuid, 'Alprazolam 0.25mg', '0.25mg', 'max 3x/jour', '14 jours', 30, 87.0, 84.0, 82.0),
-- Prescription 11 items
('bbbbbbbb-0001-0001-0001-000000000015'::uuid, 'aaaaaaaa-0001-0001-0001-000000000011'::uuid, 'Fluoxétine 20mg', '20mg', 'le matin', '30 jours', 30, 82.0, 80.0, 78.0),
-- Prescription 16 items (approved)
('bbbbbbbb-0001-0001-0001-000000000016'::uuid, 'aaaaaaaa-0001-0001-0001-000000000016'::uuid, 'Oméprazole 20mg', '20mg', 'le matin', '28 jours', 28, 98.0, 97.0, 96.0),
('bbbbbbbb-0001-0001-0001-000000000017'::uuid, 'aaaaaaaa-0001-0001-0001-000000000016'::uuid, 'Gaviscon', 'selon besoin', 'après les repas', 'selon besoin', 1, 96.0, 95.0, 94.0),
-- Prescription 17 items
('bbbbbbbb-0001-0001-0001-000000000018'::uuid, 'aaaaaaaa-0001-0001-0001-000000000017'::uuid, 'Dafalgan 1g', '1g', 'toutes les 6h', '4 jours', 16, 99.0, 98.0, 97.0),
-- Prescription 18 items
('bbbbbbbb-0001-0001-0001-000000000019'::uuid, 'aaaaaaaa-0001-0001-0001-000000000018'::uuid, 'Amlodipine 5mg', '5mg', 'le matin', '30 jours', 30, 96.0, 94.0, 93.0),
('bbbbbbbb-0001-0001-0001-000000000020'::uuid, 'aaaaaaaa-0001-0001-0001-000000000018'::uuid, 'Ramipril 5mg', '5mg', 'le soir', '30 jours', 30, 95.0, 93.0, 92.0),
-- Prescription 19 items
('bbbbbbbb-0001-0001-0001-000000000021'::uuid, 'aaaaaaaa-0001-0001-0001-000000000019'::uuid, 'Sertraline 50mg', '50mg', 'le matin', '30 jours', 30, 97.0, 95.0, 94.0),
-- Prescription 20 items
('bbbbbbbb-0001-0001-0001-000000000022'::uuid, 'aaaaaaaa-0001-0001-0001-000000000020'::uuid, 'Ventolin 100µg', '2 bouffées', 'si besoin', 'selon besoin', 1, 98.0, 96.0, 95.0),
('bbbbbbbb-0001-0001-0001-000000000023'::uuid, 'aaaaaaaa-0001-0001-0001-000000000020'::uuid, 'Sérétide 250', '2 bouffées', '2x/jour', '30 jours', 1, 97.0, 95.0, 94.0),
-- Prescription 21 items
('bbbbbbbb-0001-0001-0001-000000000024'::uuid, 'aaaaaaaa-0001-0001-0001-000000000021'::uuid, 'Citalopram 20mg', '20mg', 'le matin', '30 jours', 30, 96.0, 94.0, 93.0)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Summary
-- ============================================================================
-- Pharmacy: 1
-- Patients: 25
-- Doctors: 4
-- Prescriptions: 25 (6 pending, 5 in_review, 4 clarification_needed, 6 approved, 4 rejected)
-- Prescription Items: 24
