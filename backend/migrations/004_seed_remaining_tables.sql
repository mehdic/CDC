-- ============================================================================
-- MetaPharm Connect - Remaining Tables Seed Script
-- Covers all 21 remaining empty tables with correct schemas and enum values
-- ============================================================================

-- ============================================================================
-- 1. PAYMENTS (using snake_case columns - FK to users)
-- ============================================================================
INSERT INTO payments (id, user_id, order_id, amount, currency, status, payment_method, card_last_four, card_brand, gateway_transaction_id, processed_at, created_at, updated_at)
VALUES
('55555555-0001-0001-0001-000000000001'::uuid, '22222222-0001-0001-0001-000000000001'::uuid, NULL, 89.50, 'CHF', 'completed', 'card', '4532', 'Visa', 'TXN-CH-001', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
('55555555-0001-0001-0001-000000000002'::uuid, '22222222-0001-0001-0001-000000000002'::uuid, NULL, 156.80, 'CHF', 'completed', 'card', '1234', 'Mastercard', 'TXN-CH-002', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
('55555555-0001-0001-0001-000000000003'::uuid, '22222222-0001-0001-0001-000000000003'::uuid, NULL, 45.90, 'CHF', 'completed', 'bank_transfer', NULL, NULL, 'TXN-CH-003', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
('55555555-0001-0001-0001-000000000004'::uuid, '22222222-0001-0001-0001-000000000005'::uuid, NULL, 234.50, 'CHF', 'completed', 'insurance', NULL, NULL, 'TXN-CH-004', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
('55555555-0001-0001-0001-000000000005'::uuid, '22222222-0001-0001-0001-000000000007'::uuid, NULL, 67.90, 'CHF', 'pending', 'card', '8765', 'Visa', NULL, NULL, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
('55555555-0001-0001-0001-000000000006'::uuid, '22222222-0001-0001-0001-000000000010'::uuid, NULL, 125.00, 'CHF', 'failed', 'card', '9999', 'Mastercard', NULL, NULL, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. MEDICAL_RECORDS (using correct enum values)
-- ============================================================================
INSERT INTO medical_records (id, "patientId", "recordType", title, description, data, source, "sourceId", "recordedBy", "recordedAt", "consentGiven", active)
VALUES
('66666666-0001-0001-0001-000000000001'::uuid, '22222222-0001-0001-0001-000000000001', 'allergy', 'Allergie Penicilline', 'Reaction cutanee severe aux penicillines', '{"severity": "severe", "reaction": "urticaria", "confirmed": true}', 'doctor_entered', 'DR-001', 'Dr. Martin', NOW() - INTERVAL '365 days', true, true),
('66666666-0001-0001-0001-000000000002'::uuid, '22222222-0001-0001-0001-000000000001', 'condition', 'Hypertension arterielle', 'HTA essentielle stade 2', '{"stage": 2, "controlled": true, "since_year": 2020}', 'doctor_entered', 'DR-001', 'Dr. Martin', NOW() - INTERVAL '300 days', true, true),
('66666666-0001-0001-0001-000000000003'::uuid, '22222222-0001-0001-0001-000000000002', 'medication', 'Traitement diabete', 'Metformine 500mg 2x/jour', '{"medication": "Metformine", "dosage": "500mg", "frequency": "2x/jour"}', 'pharmacist_entered', 'PH-001', 'Pharmacien Dubois', NOW() - INTERVAL '200 days', true, true),
('66666666-0001-0001-0001-000000000004'::uuid, '22222222-0001-0001-0001-000000000003', 'immunization', 'Vaccin COVID-19', 'Pfizer-BioNTech 3eme dose', '{"vaccine": "Pfizer-BioNTech", "dose": 3, "batch": "EP2163"}', 'e_sante_api', 'VAC-CH-001', NULL, NOW() - INTERVAL '180 days', true, true),
('66666666-0001-0001-0001-000000000005'::uuid, '22222222-0001-0001-0001-000000000005', 'lab_result', 'Bilan sanguin complet', 'Hemogramme, glycemie, lipides', '{"hemoglobin": 14.2, "glucose": 5.8, "cholesterol": 5.1}', 'imported', 'LAB-001', NULL, NOW() - INTERVAL '90 days', true, true),
('66666666-0001-0001-0001-000000000006'::uuid, '22222222-0001-0001-0001-000000000007', 'procedure', 'Appendicectomie', 'Chirurgie laparoscopique', '{"type": "laparoscopic", "duration_minutes": 45, "complications": "none"}', 'doctor_entered', 'DR-002', 'Dr. Schneider', NOW() - INTERVAL '730 days', true, true),
('66666666-0001-0001-0001-000000000007'::uuid, '22222222-0001-0001-0001-000000000010', 'vital_signs', 'Mesures tension', 'Suivi tension arterielle', '{"systolic": 135, "diastolic": 85, "pulse": 72}', 'patient_reported', NULL, NULL, NOW() - INTERVAL '7 days', true, true),
('66666666-0001-0001-0001-000000000008'::uuid, '22222222-0001-0001-0001-000000000012', 'allergy', 'Intolerance lactose', 'Intolerance au lactose confirmee', '{"severity": "moderate", "confirmed": true}', 'patient_reported', NULL, NULL, NOW() - INTERVAL '500 days', true, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 3. DIGITAL_TWIN_PROFILES (JSONB heavy)
-- ============================================================================
INSERT INTO digital_twin_profiles (id, "patientId", "patientName", age, demographic, "medicalHistory", "purchaseBehavior", "healthInsights", predictions, engagement, privacy, "lastComputed")
VALUES
('77777777-0002-0001-0001-000000000001'::uuid, '22222222-0001-0001-0001-000000000001', 'Jean-Pierre Muller', 58,
  '{"gender": "male", "canton": "Vaud", "language": "fr", "occupation": "retired"}',
  '{"conditions": ["hypertension", "type2_diabetes"], "allergies": ["penicillin"], "surgeries": ["appendectomy"]}',
  '{"avg_monthly_spend": 245.50, "preferred_brands": ["Sandoz", "Novartis"], "purchase_frequency": "monthly"}',
  '{"risk_scores": {"cardiovascular": 0.65, "diabetes_progression": 0.45}, "recommendations": ["regular_bp_monitoring", "diet_consultation"]}',
  '{"medication_adherence": {"next_refill_date": "2024-02-15", "refill_probability": 0.92}, "health_events": []}',
  '{"last_interaction": "2024-01-20", "preferred_channel": "app", "response_rate": 0.85}',
  '{"consent_date": "2023-01-15", "data_sharing": true, "marketing_opt_in": true}',
  NOW() - INTERVAL '1 day'),
('77777777-0002-0001-0001-000000000002'::uuid, '22222222-0001-0001-0001-000000000002', 'Marie Dubois', 45,
  '{"gender": "female", "canton": "Geneva", "language": "fr", "occupation": "teacher"}',
  '{"conditions": ["asthma"], "allergies": [], "surgeries": []}',
  '{"avg_monthly_spend": 89.00, "preferred_brands": ["Roche"], "purchase_frequency": "quarterly"}',
  '{"risk_scores": {"respiratory": 0.35}, "recommendations": ["inhaler_technique_review"]}',
  '{"medication_adherence": {"next_refill_date": "2024-03-01", "refill_probability": 0.78}}',
  '{"last_interaction": "2024-01-18", "preferred_channel": "sms", "response_rate": 0.72}',
  '{"consent_date": "2023-06-20", "data_sharing": true, "marketing_opt_in": false}',
  NOW() - INTERVAL '2 days'),
('77777777-0002-0001-0001-000000000003'::uuid, '22222222-0001-0001-0001-000000000005', 'Sophie Bernasconi', 32,
  '{"gender": "female", "canton": "Ticino", "language": "it", "occupation": "engineer"}',
  '{"conditions": [], "allergies": ["aspirin"], "surgeries": []}',
  '{"avg_monthly_spend": 55.00, "preferred_brands": [], "purchase_frequency": "occasional"}',
  '{"risk_scores": {}, "recommendations": ["annual_checkup"]}',
  '{"medication_adherence": {}}',
  '{"last_interaction": "2024-01-10", "preferred_channel": "email", "response_rate": 0.60}',
  '{"consent_date": "2023-09-01", "data_sharing": false, "marketing_opt_in": false}',
  NOW() - INTERVAL '5 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 4. INSURANCE_CLAIMS
-- ============================================================================
INSERT INTO insurance_claims (id, "patientId", "patientInsuranceId", "prescriptionId", amount, "franchiseDeduction", "quotePartAmount", "reimbursableAmount", status, "claimDate", "submissionDate", "responseDate", reference, notes)
VALUES
('88888888-0002-0001-0001-000000000001'::uuid, '22222222-0001-0001-0001-000000000001'::uuid, '11111111-0003-0001-0001-000000000001'::uuid, 'aaaaaaaa-0001-0001-0001-000000000001'::uuid, 450.00, 125.00, 32.50, 292.50, 'approved', '2024-01-15', NOW() - INTERVAL '10 days', NOW() - INTERVAL '5 days', 'CLM-CSS-2024-0001', 'Prescription mensuelle medicaments chroniques'),
('88888888-0002-0001-0001-000000000002'::uuid, '22222222-0001-0001-0001-000000000002'::uuid, '11111111-0003-0001-0001-000000000002'::uuid, 'aaaaaaaa-0001-0001-0001-000000000002'::uuid, 180.00, 50.00, 13.00, 117.00, 'approved', '2024-01-18', NOW() - INTERVAL '7 days', NOW() - INTERVAL '2 days', 'CLM-SWI-2024-0001', 'Traitement grippe'),
('88888888-0002-0001-0001-000000000003'::uuid, '22222222-0001-0001-0001-000000000005'::uuid, '11111111-0003-0001-0001-000000000003'::uuid, 'aaaaaaaa-0001-0001-0001-000000000005'::uuid, 890.00, 0.00, 89.00, 801.00, 'pending', '2024-01-20', NOW() - INTERVAL '3 days', NULL, 'CLM-HEL-2024-0001', 'Franchise atteinte - remboursement complet'),
('88888888-0002-0001-0001-000000000004'::uuid, '22222222-0001-0001-0001-000000000007'::uuid, '11111111-0003-0001-0001-000000000004'::uuid, 'aaaaaaaa-0001-0001-0001-000000000007'::uuid, 75.00, 75.00, 0.00, 0.00, 'denied', '2024-01-22', NOW() - INTERVAL '1 day', NOW(), 'CLM-GM-2024-0001', 'Montant sous franchise')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 5. COVERAGE_DETAILS
-- ============================================================================
INSERT INTO coverage_details (id, "patientInsuranceId", "coverageType", "isApproved", "maxReimbursementPercentage", "annualLimit", "currentYearSpent", "yearStart", "yearEnd", conditions)
VALUES
('99999999-0002-0001-0001-000000000001'::uuid, '11111111-0003-0001-0001-000000000001'::uuid, 'prescription_drugs', true, 90, 50000.00, 12500.00, '2024-01-01', '2024-12-31', 'Medicaments sur ordonnance'),
('99999999-0002-0001-0001-000000000002'::uuid, '11111111-0003-0001-0001-000000000001'::uuid, 'otc_medications', true, 50, 1000.00, 250.00, '2024-01-01', '2024-12-31', 'Medicaments sans ordonnance'),
('99999999-0002-0001-0001-000000000003'::uuid, '11111111-0003-0001-0001-000000000002'::uuid, 'prescription_drugs', true, 90, 40000.00, 8500.00, '2024-01-01', '2024-12-31', NULL),
('99999999-0002-0001-0001-000000000004'::uuid, '11111111-0003-0001-0001-000000000003'::uuid, 'chronic_care', true, 100, NULL, 0.00, '2024-01-01', '2024-12-31', 'Franchise atteinte - couverture complete'),
('99999999-0002-0001-0001-000000000005'::uuid, '11111111-0003-0001-0001-000000000004'::uuid, 'pediatric', true, 100, 10000.00, 450.00, '2024-01-01', '2024-12-31', 'Couverture enfants')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 6. THIRD_PARTY_PAYMENTS
-- ============================================================================
INSERT INTO third_party_payments (id, "claimId", "paymentModel", "insuranceResponsibility", "patientResponsibility", status, "completionDate", "transactionId")
VALUES
('aaaaaaaa-0002-0001-0001-000000000001'::uuid, '88888888-0002-0001-0001-000000000001'::uuid, 'tiers_garant', 292.50, 157.50, 'completed', NOW() - INTERVAL '3 days', 'TPP-2024-0001'),
('aaaaaaaa-0002-0001-0001-000000000002'::uuid, '88888888-0002-0001-0001-000000000002'::uuid, 'tiers_payant', 117.00, 63.00, 'completed', NOW() - INTERVAL '1 day', 'TPP-2024-0002'),
('aaaaaaaa-0002-0001-0001-000000000003'::uuid, '88888888-0002-0001-0001-000000000003'::uuid, 'tiers_garant', 801.00, 89.00, 'pending', NULL, NULL),
('aaaaaaaa-0002-0001-0001-000000000004'::uuid, '88888888-0002-0001-0001-000000000004'::uuid, 'tiers_garant', 0.00, 75.00, 'completed', NOW(), 'TPP-2024-0003')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 7. REFILL_REQUESTS
-- ============================================================================
INSERT INTO refill_requests (id, "prescriptionId", "patientId", "pharmacyId", "pharmacistId", "quantityRequested", status, "decisionType", "denialReason", "pharmacistNotes", "approvedAt", "filledAt", "expiresAt")
VALUES
('bbbbbbbb-0002-0001-0001-000000000001'::uuid, 'aaaaaaaa-0001-0001-0001-000000000001', '22222222-0001-0001-0001-000000000001', '11111111-1111-1111-1111-111111111111', '22222222-0001-0001-0001-000000000031', 1, 'approved', 'auto', NULL, 'Renouvellement automatique approuve', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day', NOW() + INTERVAL '30 days'),
('bbbbbbbb-0002-0001-0001-000000000002'::uuid, 'aaaaaaaa-0001-0001-0001-000000000002', '22222222-0001-0001-0001-000000000002', '11111111-1111-1111-1111-111111111111', NULL, 2, 'pending', NULL, NULL, NULL, NULL, NULL, NOW() + INTERVAL '7 days'),
('bbbbbbbb-0002-0001-0001-000000000003'::uuid, 'aaaaaaaa-0001-0001-0001-000000000003', '22222222-0001-0001-0001-000000000003', '11111111-1111-1111-1111-111111111111', '22222222-0001-0001-0001-000000000031', 1, 'denied', 'manual', 'Ordonnance expiree - nouvelle ordonnance requise', 'Patient contacte pour nouvelle consultation', NULL, NULL, NOW() - INTERVAL '5 days'),
('bbbbbbbb-0002-0001-0001-000000000004'::uuid, 'aaaaaaaa-0001-0001-0001-000000000005', '22222222-0001-0001-0001-000000000005', '11111111-1111-1111-1111-111111111111', '22222222-0001-0001-0001-000000000032', 1, 'filled', 'auto', NULL, 'Delivre sans probleme', NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days', NOW() + INTERVAL '20 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 8. REFILL_HISTORY
-- ============================================================================
INSERT INTO refill_history (id, "refillRequestId", "prescriptionId", "patientId", "pharmacyId", "pharmacistId", action, quantity, details, "ipAddress", "createdAt")
VALUES
('cccccccc-0002-0001-0001-000000000001'::uuid, 'bbbbbbbb-0002-0001-0001-000000000001', 'aaaaaaaa-0001-0001-0001-000000000001', '22222222-0001-0001-0001-000000000001', '11111111-1111-1111-1111-111111111111', NULL, 'requested', 1, '{"source": "patient_app"}', '192.168.1.100', NOW() - INTERVAL '3 days'),
('cccccccc-0002-0001-0001-000000000002'::uuid, 'bbbbbbbb-0002-0001-0001-000000000001', 'aaaaaaaa-0001-0001-0001-000000000001', '22222222-0001-0001-0001-000000000001', '11111111-1111-1111-1111-111111111111', '22222222-0001-0001-0001-000000000031', 'approved', 1, '{"auto_approved": true}', '10.0.0.50', NOW() - INTERVAL '2 days'),
('cccccccc-0002-0001-0001-000000000003'::uuid, 'bbbbbbbb-0002-0001-0001-000000000001', 'aaaaaaaa-0001-0001-0001-000000000001', '22222222-0001-0001-0001-000000000001', '11111111-1111-1111-1111-111111111111', '22222222-0001-0001-0001-000000000031', 'filled', 1, '{"batch": "LOT-2024-001"}', '10.0.0.50', NOW() - INTERVAL '1 day'),
('cccccccc-0002-0001-0001-000000000004'::uuid, 'bbbbbbbb-0002-0001-0001-000000000003', 'aaaaaaaa-0001-0001-0001-000000000003', '22222222-0001-0001-0001-000000000003', '11111111-1111-1111-1111-111111111111', NULL, 'requested', 1, '{"source": "phone_call"}', NULL, NOW() - INTERVAL '6 days'),
('cccccccc-0002-0001-0001-000000000005'::uuid, 'bbbbbbbb-0002-0001-0001-000000000003', 'aaaaaaaa-0001-0001-0001-000000000003', '22222222-0001-0001-0001-000000000003', '11111111-1111-1111-1111-111111111111', '22222222-0001-0001-0001-000000000031', 'denied', NULL, '{"reason": "prescription_expired"}', '10.0.0.50', NOW() - INTERVAL '5 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 9. CONTROLLED_PRESCRIPTIONS
-- ============================================================================
INSERT INTO controlled_prescriptions (id, "prescriptionId", "patientId", "prescriberId", "pharmacyId", "substanceId", quantity, "dosagePerUnit", unit, "daysSupply", "prescriptionDate", "specialFormNumber", "validationPassed", "requiresPharmacistReview", "reviewedByPharmacistId", "reviewedAt", "reviewNotes")
VALUES
('dddddddd-0002-0001-0001-000000000001'::uuid, 'aaaaaaaa-0001-0001-0001-000000000001'::uuid, '22222222-0001-0001-0001-000000000015'::uuid, '22222222-0001-0001-0001-000000000026'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, '44444444-0001-0002-0001-000000000001'::uuid, 60.00, 10.00, 'mg', 30, NOW() - INTERVAL '5 days', 'SF-2024-0001', true, true, '22222222-0001-0001-0001-000000000031'::uuid, NOW() - INTERVAL '4 days', 'Patient en soins palliatifs - morphine approuvee'),
('dddddddd-0002-0001-0001-000000000002'::uuid, 'aaaaaaaa-0001-0001-0001-000000000002'::uuid, '22222222-0001-0001-0001-000000000018'::uuid, '22222222-0001-0001-0001-000000000027'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, '44444444-0001-0002-0001-000000000004'::uuid, 30.00, 10.00, 'mg', 30, NOW() - INTERVAL '10 days', 'SF-2024-0002', true, false, NULL, NULL, NULL),
('dddddddd-0002-0001-0001-000000000003'::uuid, 'aaaaaaaa-0001-0001-0001-000000000003'::uuid, '22222222-0001-0001-0001-000000000020'::uuid, '22222222-0001-0001-0001-000000000028'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, '44444444-0001-0002-0001-000000000006'::uuid, 20.00, 5.00, 'mg', 14, NOW() - INTERVAL '3 days', NULL, true, false, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 10. CONTROLLED_ALERTS
-- ============================================================================
INSERT INTO controlled_alerts (id, type, severity, message, "patientId", "substanceId", "pharmacyId", "resolvedAt", "resolvedBy", "resolutionNotes", metadata)
VALUES
('eeeeeeee-0002-0001-0001-000000000001'::uuid, 'FREQUENCY_ABUSE', 'HIGH', 'Patient demande morphine plus frequemment que prescrit', '22222222-0001-0001-0001-000000000015'::uuid, '44444444-0001-0002-0001-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, NOW() - INTERVAL '1 day', '22222222-0001-0001-0001-000000000031'::uuid, 'Consultation medecin confirmee - ajustement posologie autorise', '{"previous_frequency": "weekly", "requested_frequency": "every_3_days"}'),
('eeeeeeee-0002-0001-0001-000000000002'::uuid, 'MULTI_PHARMACY', 'CRITICAL', 'Patient detecte dans plusieurs pharmacies pour meme substance', '22222222-0001-0001-0001-000000000018'::uuid, '44444444-0001-0002-0001-000000000002'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, NULL, NULL, NULL, '{"pharmacies_detected": 3, "last_30_days": true}'),
('eeeeeeee-0002-0001-0001-000000000003'::uuid, 'DOSAGE_ABUSE', 'MEDIUM', 'Dosage cumule proche limite quotidienne', '22222222-0001-0001-0001-000000000020'::uuid, '44444444-0001-0002-0001-000000000008'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, NOW() - INTERVAL '12 hours', '22222222-0001-0001-0001-000000000032'::uuid, 'Erreur de saisie corrigee', '{"daily_total_mg": 380, "warning_threshold_mg": 400}'),
('eeeeeeee-0002-0001-0001-000000000004'::uuid, 'SUPPLY_LIMIT', 'LOW', 'Approche limite 30 jours pour substance B', '22222222-0001-0001-0001-000000000012'::uuid, '44444444-0001-0002-0001-000000000004'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, NULL, NULL, NULL, '{"current_days_supply": 28, "max_days_supply": 30}')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 11. DISPENSATION_LOGS
-- ============================================================================
INSERT INTO dispensation_logs (id, "prescriptionId", "patientId", "pharmacyId", "pharmacistId", "substanceId", "quantityDispensed", unit, "dosagePerUnit", "daysSupply", dispensed_date, status, "batchNumber", "expirationDate", "specialFormNumber", notes)
VALUES
('ffffffff-0002-0001-0001-000000000001'::uuid, 'aaaaaaaa-0001-0001-0001-000000000001'::uuid, '22222222-0001-0001-0001-000000000015'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, '22222222-0001-0001-0001-000000000031'::uuid, '44444444-0001-0002-0001-000000000001'::uuid, 60.00, 'mg', 10.00, 30, NOW() - INTERVAL '4 days', 'DISPENSED', 'LOT-MOR-2024-001', NOW() + INTERVAL '365 days', 'SF-2024-0001', 'Dispensation morphine soins palliatifs'),
('ffffffff-0002-0001-0001-000000000002'::uuid, 'aaaaaaaa-0001-0001-0001-000000000002'::uuid, '22222222-0001-0001-0001-000000000018'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, '22222222-0001-0001-0001-000000000032'::uuid, '44444444-0001-0002-0001-000000000004'::uuid, 30.00, 'mg', 10.00, 30, NOW() - INTERVAL '9 days', 'DISPENSED', 'LOT-RIT-2024-001', NOW() + INTERVAL '540 days', 'SF-2024-0002', 'Ritaline pour TDAH adulte'),
('ffffffff-0002-0001-0001-000000000003'::uuid, 'aaaaaaaa-0001-0001-0001-000000000003'::uuid, '22222222-0001-0001-0001-000000000020'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, '22222222-0001-0001-0001-000000000031'::uuid, '44444444-0001-0002-0001-000000000006'::uuid, 20.00, 'mg', 5.00, 14, NOW() - INTERVAL '2 days', 'DISPENSED', 'LOT-VAL-2024-001', NOW() + INTERVAL '730 days', NULL, 'Valium anxiete ponctuelle')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 12. CALENDAR_INTEGRATIONS (using correct enums)
-- ============================================================================
INSERT INTO calendar_integrations (id, user_id, provider, account_email, access_token, refresh_token, token_expiry, sync_enabled, two_way_sync, sync_frequency_minutes, last_sync_at, status, settings, calendar_id)
VALUES
('11111111-0004-0001-0001-000000000001'::uuid, '22222222-0001-0001-0001-000000000001'::uuid, 'google', 'jean.muller@gmail.com', 'encrypted_token_placeholder', 'encrypted_refresh_placeholder', NOW() + INTERVAL '1 hour', true, true, 30, NOW() - INTERVAL '15 minutes', 'active', '{"reminder_default_minutes": 30}', 'primary'),
('11111111-0004-0001-0001-000000000002'::uuid, '22222222-0001-0001-0001-000000000002'::uuid, 'apple', 'marie.dubois@icloud.com', 'encrypted_token_placeholder', 'encrypted_refresh_placeholder', NOW() + INTERVAL '2 hours', true, false, 60, NOW() - INTERVAL '45 minutes', 'active', '{"reminder_default_minutes": 15}', 'home'),
('11111111-0004-0001-0001-000000000003'::uuid, '22222222-0001-0001-0001-000000000005'::uuid, 'google', 'sophie.b@gmail.com', NULL, NULL, NULL, false, false, 30, NULL, 'inactive', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 13. CALENDAR_EVENTS (using correct enums)
-- ============================================================================
INSERT INTO calendar_events (id, user_id, provider, calendar_integration_id, external_id, title, description, event_type, start_time, end_time, timezone, location, has_reminder, reminder_minutes_before, sync_status, is_recurring, recurrence_rule)
VALUES
('22222222-0004-0001-0001-000000000001'::uuid, '22222222-0001-0001-0001-000000000001'::uuid, 'google', '11111111-0004-0001-0001-000000000001'::uuid, 'google_evt_001', 'Rappel medicament Lisinopril', 'Prendre Lisinopril 10mg', 'medication_reminder', NOW() + INTERVAL '2 hours', NOW() + INTERVAL '2 hours 15 minutes', 'Europe/Zurich', NULL, true, 30, 'synced', true, 'FREQ=DAILY;BYHOUR=8'),
('22222222-0004-0001-0001-000000000002'::uuid, '22222222-0001-0001-0001-000000000001'::uuid, 'google', '11111111-0004-0001-0001-000000000001'::uuid, 'google_evt_002', 'Teleconsultation Dr. Martin', 'Suivi tension arterielle', 'teleconsultation', NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days 30 minutes', 'Europe/Zurich', 'Video - lien envoye par email', true, 60, 'synced', false, NULL),
('22222222-0004-0001-0001-000000000003'::uuid, '22222222-0001-0001-0001-000000000002'::uuid, 'apple', '11111111-0004-0001-0001-000000000002'::uuid, 'apple_evt_001', 'Retrait commande pharmacie', 'Commande #ORD-2024-003 prete', 'delivery', NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day 15 minutes', 'Europe/Zurich', 'Pharmacie Centrale, Rue du Marche 12, Lausanne', true, 120, 'synced', false, NULL),
('22222222-0004-0001-0001-000000000004'::uuid, '22222222-0001-0001-0001-000000000001'::uuid, 'google', '11111111-0004-0001-0001-000000000001'::uuid, 'google_evt_003', 'RDV vaccination grippe', 'Vaccination antigrippale annuelle', 'appointment', NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days 30 minutes', 'Europe/Zurich', 'Pharmacie Centrale, Rue du Marche 12, Lausanne', true, 1440, 'synced', false, NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 14. VOICE_RECORDINGS
-- ============================================================================
INSERT INTO voice_recordings (id, "userId", "userRole", "conversationId", "appointmentId", "consultationType", language, status, "fileUrl", "fileName", metadata, tags, notes, "completedAt")
VALUES
('33333333-0004-0001-0001-000000000001'::uuid, '22222222-0001-0001-0001-000000000031', 'pharmacist', 'conv_001', NULL, 'patient_consultation', 'fr-CH', 'completed', '/recordings/2024/01/rec_001.webm', 'consultation_muller_20240120.webm', '{"duration_seconds": 342, "file_size_bytes": 2456789}', 'consultation,chronic,hypertension', 'Consultation suivi HTA patient Muller', NOW() - INTERVAL '2 days'),
('33333333-0004-0001-0001-000000000002'::uuid, '22222222-0001-0001-0001-000000000031', 'pharmacist', 'conv_002', 'apt_001', 'teleconsultation', 'fr-CH', 'completed', '/recordings/2024/01/rec_002.webm', 'teleconsult_dubois_20240118.webm', '{"duration_seconds": 567, "file_size_bytes": 4123456}', 'teleconsultation,asthma,follow-up', 'Teleconsultation asthme avec Dr. Bernard', NOW() - INTERVAL '4 days'),
('33333333-0004-0001-0001-000000000003'::uuid, '22222222-0001-0001-0001-000000000032', 'pharmacist', NULL, NULL, 'medication_review', 'de-CH', 'processing', '/recordings/2024/01/rec_003.webm', 'review_schmidt_20240122.webm', '{"duration_seconds": 189}', 'medication_review,german', NULL, NULL),
('33333333-0004-0001-0001-000000000004'::uuid, '22222222-0001-0001-0001-000000000031', 'pharmacist', 'conv_003', NULL, 'patient_consultation', 'it-CH', 'pending', '/recordings/2024/01/rec_004.webm', 'consultation_bernasconi_20240123.webm', '{"duration_seconds": 245}', 'italian,parapharmacie', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 15. TRANSCRIPTIONS
-- ============================================================================
INSERT INTO transcriptions (id, "recordingId", "userId", "userRole", status, text, confidence, "requestedLanguage", "detectedLanguage", "hasDoctor", "hasPharmaTerms", keywords, "processingTime", "completedAt", metadata)
VALUES
('44444444-0004-0001-0001-000000000001'::uuid, '33333333-0004-0001-0001-000000000001', '22222222-0001-0001-0001-000000000031', 'pharmacist', 'completed', 'Bonjour M. Muller, comment allez-vous depuis votre derniere visite? Votre tension est-elle stable? Oui, je prends bien mon Lisinopril tous les matins. Tres bien, continuez ainsi. Navez-vous pas de vertiges ou deffets secondaires?', 0.94, 'fr-CH', 'fr-CH', false, true, 'tension,Lisinopril,effets secondaires,vertiges', 4521, NOW() - INTERVAL '2 days', '{"word_count": 52, "speaker_count": 2}'),
('44444444-0004-0001-0001-000000000002'::uuid, '33333333-0004-0001-0001-000000000002', '22222222-0001-0001-0001-000000000031', 'pharmacist', 'completed', 'Teleconsultation avec Dr. Bernard pour Mme Dubois. Discussion sur lutilisation du Ventolin. La patiente signale une utilisation plus frequente ces derniers jours. Le docteur recommande un suivi plus rapproche.', 0.91, 'fr-CH', 'fr-CH', true, true, 'Ventolin,asthme,teleconsultation,suivi', 6234, NOW() - INTERVAL '4 days', '{"word_count": 38, "speaker_count": 3}'),
('44444444-0004-0001-0001-000000000003'::uuid, '33333333-0004-0001-0001-000000000003', '22222222-0001-0001-0001-000000000032', 'pharmacist', 'processing', NULL, 0.00, 'de-CH', NULL, false, false, NULL, NULL, NULL, NULL),
('44444444-0004-0001-0001-000000000004'::uuid, '33333333-0004-0001-0001-000000000004', '22222222-0001-0001-0001-000000000031', 'pharmacist', 'pending', NULL, 0.00, 'it-CH', NULL, false, false, NULL, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 16. CAMPAIGN_TEMPLATES
-- ============================================================================
INSERT INTO campaign_templates (id, "pharmacyId", name, description, channel, subject, body, "htmlContent", variables, "usageCount", "isActive")
VALUES
('55555555-0004-0001-0001-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Rappel vaccination', 'Template pour campagnes vaccination', 'email', 'Rappel: Vaccination {{vaccine_name}} disponible', 'Cher(e) {{patient_name}}, La vaccination {{vaccine_name}} est maintenant disponible a notre pharmacie. Prenez rendez-vous des aujourdhui!', '<html><body><h1>Vaccination {{vaccine_name}}</h1><p>Cher(e) {{patient_name}},</p><p>La vaccination est disponible.</p></body></html>', ARRAY['patient_name', 'vaccine_name'], 12, true),
('55555555-0004-0001-0001-000000000002'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Promotion saisonniere', 'Template promotions saisonnieres', 'sms', NULL, '{{pharmacy_name}}: Profitez de {{discount}}% sur {{category}}! Valable jusquau {{end_date}}. Plus dinfos: {{link}}', NULL, ARRAY['pharmacy_name', 'discount', 'category', 'end_date', 'link'], 8, true),
('55555555-0004-0001-0001-000000000003'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Rappel medicament', 'Rappel renouvellement ordonnance', 'push', 'Rappel medicament', 'Il est temps de renouveler votre {{medication_name}}. Commandez en ligne ou passez a la pharmacie.', NULL, ARRAY['medication_name'], 45, true),
('55555555-0004-0001-0001-000000000004'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Bienvenue VIP', 'Email bienvenue nouveaux membres VIP', 'email', 'Bienvenue dans le programme Golden MetaPharm!', 'Cher(e) {{patient_name}}, Felicitations! Vous etes maintenant membre {{tier}} de notre programme de fidelite. Profitez de {{benefits}}.', '<html><body><h1>Bienvenue {{patient_name}}!</h1><p>Votre niveau: {{tier}}</p></body></html>', ARRAY['patient_name', 'tier', 'benefits'], 23, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 17. CAMPAIGN_ANALYTICS
-- ============================================================================
INSERT INTO campaign_analytics (id, "campaignId", "recipientId", "recipientEmail", "recipientPhoneNumber", sent, "sentAt", opened, "openedAt", "openCount", clicked, "clickedAt", "clickCount", converted, "convertedAt", "conversionValue", "deviceType", browser, "operatingSystem", country, city)
VALUES
('66666666-0004-0001-0001-000000000001'::uuid, '77777777-0001-0002-0001-000000000001'::uuid, '22222222-0001-0001-0001-000000000001'::uuid, 'jean.muller@email.ch', NULL, true, NOW() - INTERVAL '25 days', true, NOW() - INTERVAL '24 days', 2, true, NOW() - INTERVAL '24 days', 1, true, NOW() - INTERVAL '23 days', 89.50, 'mobile', 'Safari', 'iOS', 'Switzerland', 'Lausanne'),
('66666666-0004-0001-0001-000000000002'::uuid, '77777777-0001-0002-0001-000000000001'::uuid, '22222222-0001-0001-0001-000000000002'::uuid, 'marie.dubois@email.ch', NULL, true, NOW() - INTERVAL '25 days', true, NOW() - INTERVAL '25 days', 1, false, NULL, 0, false, NULL, NULL, 'desktop', 'Chrome', 'Windows', 'Switzerland', 'Geneva'),
('66666666-0004-0001-0001-000000000003'::uuid, '77777777-0001-0002-0001-000000000002'::uuid, '22222222-0001-0001-0001-000000000001'::uuid, NULL, '+41791234567', true, NOW() - INTERVAL '55 days', true, NOW() - INTERVAL '55 days', 1, true, NOW() - INTERVAL '54 days', 1, false, NULL, NULL, 'mobile', NULL, 'Android', 'Switzerland', 'Lausanne'),
('66666666-0004-0001-0001-000000000004'::uuid, '77777777-0001-0002-0001-000000000003'::uuid, '22222222-0001-0001-0001-000000000005'::uuid, 'sophie.b@email.ch', NULL, true, NOW() - INTERVAL '5 days', false, NULL, 0, false, NULL, 0, false, NULL, NULL, NULL, NULL, NULL, 'Switzerland', NULL),
('66666666-0004-0001-0001-000000000005'::uuid, '77777777-0001-0002-0001-000000000003'::uuid, '22222222-0001-0001-0001-000000000007'::uuid, 'lucas.favre@email.ch', NULL, true, NOW() - INTERVAL '5 days', true, NOW() - INTERVAL '4 days', 3, true, NOW() - INTERVAL '4 days', 2, true, NOW() - INTERVAL '3 days', 156.00, 'tablet', 'Safari', 'iPadOS', 'Switzerland', 'Zurich')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 18. PROMOTIONS
-- ============================================================================
INSERT INTO promotions (id, "pharmacyId", name, description, code, type, status, "startDate", "expiryDate", "discountValue", "discountUnit", "minimumPurchaseAmount", "maxUsageCount", "usedCount", "maxUsagePerCustomer", "isStackable", "eligibleCustomerTypes")
VALUES
('77777777-0004-0001-0001-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Soldes Hiver 2024', 'Reduction hiver sur parapharmacie', 'HIVER2024', 'percentage_discount', 'active', NOW() - INTERVAL '30 days', NOW() + INTERVAL '30 days', 20.00, '%', 50.00, 500, 156, 2, false, ARRAY['all']),
('77777777-0004-0001-0001-000000000002'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'VIP Gold Exclusif', 'Reduction exclusive membres Gold', 'VIPGOLD20', 'percentage_discount', 'active', NOW() - INTERVAL '7 days', NOW() + INTERVAL '60 days', 25.00, '%', NULL, NULL, 12, 5, true, ARRAY['gold', 'platinum']),
('77777777-0004-0001-0001-000000000003'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Livraison Gratuite', 'Livraison offerte des 80 CHF', 'FREESHIP', 'free_shipping', 'active', NOW() - INTERVAL '60 days', NOW() + INTERVAL '120 days', NULL, NULL, 80.00, NULL, 89, NULL, true, ARRAY['all']),
('77777777-0004-0001-0001-000000000004'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Vitamines 2+1', 'Achetez 2 vitamines, 1 offerte', 'VIT21', 'buy_x_get_y', 'active', NOW() - INTERVAL '14 days', NOW() + INTERVAL '45 days', NULL, NULL, NULL, 100, 34, 3, false, ARRAY['all']),
('77777777-0004-0001-0001-000000000005'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Points Double', 'Points fidelite doubles ce weekend', 'DOUBLE', 'loyalty_points', 'expired', NOW() - INTERVAL '10 days', NOW() - INTERVAL '3 days', NULL, NULL, NULL, NULL, 67, NULL, true, ARRAY['silver', 'gold', 'platinum'])
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 19. COD_TRANSACTIONS (FK to users as driver_id)
-- ============================================================================
INSERT INTO cod_transactions (id, order_id, delivery_id, driver_id, amount, collected_amount, status, payment_method, collected_at, change_given, collection_notes, settlement_id, settled_at)
VALUES
('88888888-0004-0001-0001-000000000001'::uuid, 'aaaaaaaa-0001-0001-0001-000000000001'::uuid, 'dddddddd-0001-0001-0001-000000000001'::uuid, '22222222-0001-0001-0001-000000000036'::uuid, 89.50, 89.50, 'collected', 'cash', NOW() - INTERVAL '3 days', 10.50, 'Client a paye avec 100 CHF', NULL, NULL),
('88888888-0004-0001-0001-000000000002'::uuid, 'aaaaaaaa-0001-0001-0001-000000000002'::uuid, 'dddddddd-0001-0001-0001-000000000002'::uuid, '22222222-0001-0001-0001-000000000036'::uuid, 156.80, 156.80, 'collected', 'card', NOW() - INTERVAL '2 days', 0.00, 'Paiement par carte mobile', NULL, NULL),
('88888888-0004-0001-0001-000000000003'::uuid, 'aaaaaaaa-0001-0001-0001-000000000003'::uuid, 'dddddddd-0001-0001-0001-000000000003'::uuid, '22222222-0001-0001-0001-000000000037'::uuid, 45.90, NULL, 'pending', NULL, NULL, 0.00, NULL, NULL, NULL),
('88888888-0004-0001-0001-000000000004'::uuid, 'aaaaaaaa-0001-0001-0001-000000000004'::uuid, 'dddddddd-0001-0001-0001-000000000004'::uuid, '22222222-0001-0001-0001-000000000036'::uuid, 234.50, 234.50, 'settled', 'cash', NOW() - INTERVAL '5 days', 15.50, 'Paiement especes', '99999999-0004-0001-0001-000000000001'::uuid, NOW() - INTERVAL '4 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 20. DRIVER_SETTLEMENTS (FK to users as driver_id)
-- ============================================================================
INSERT INTO driver_settlements (id, driver_id, settlement_date, total_expected, total_collected, total_settled, variance, transaction_count, cash_amount, card_amount, status, driver_notes, manager_notes, approved_by, approved_at)
VALUES
('99999999-0004-0001-0001-000000000001'::uuid, '22222222-0001-0001-0001-000000000036'::uuid, CURRENT_DATE - INTERVAL '4 days', 480.80, 480.80, 480.80, 0.00, 3, 324.00, 156.80, 'approved', 'Toutes les livraisons du jour completees', 'Compte verifie - OK', '22222222-0001-0001-0001-000000000031'::uuid, NOW() - INTERVAL '4 days'),
('99999999-0004-0001-0001-000000000002'::uuid, '22222222-0001-0001-0001-000000000037'::uuid, CURRENT_DATE - INTERVAL '3 days', 312.50, 312.50, 312.50, 0.00, 2, 312.50, 0.00, 'approved', NULL, NULL, '22222222-0001-0001-0001-000000000032'::uuid, NOW() - INTERVAL '3 days'),
('99999999-0004-0001-0001-000000000003'::uuid, '22222222-0001-0001-0001-000000000036'::uuid, CURRENT_DATE - INTERVAL '1 day', 246.30, 246.30, 0.00, 0.00, 2, 89.50, 156.80, 'pending', 'En attente de validation', NULL, NULL, NULL),
('99999999-0004-0001-0001-000000000004'::uuid, '22222222-0001-0001-0001-000000000037'::uuid, CURRENT_DATE - INTERVAL '2 days', 178.90, 168.90, 168.90, -10.00, 2, 168.90, 0.00, 'disputed', 'Difference de 10 CHF - client conteste montant', 'Verification en cours avec client', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 21. ACCESS_LOGS
-- ============================================================================
INSERT INTO access_logs (id, "recordId", "patientId", "userId", "userRole", action, "ipAddress", reason, "accessedAt")
VALUES
('aaaaaaaa-0004-0001-0001-000000000001'::uuid, '66666666-0001-0001-0001-000000000001', '22222222-0001-0001-0001-000000000001', '22222222-0001-0001-0001-000000000031', 'pharmacist', 'view', '10.0.0.50', 'Verification allergie avant dispensation', NOW() - INTERVAL '2 days'),
('aaaaaaaa-0004-0001-0001-000000000002'::uuid, '66666666-0001-0001-0001-000000000002', '22222222-0001-0001-0001-000000000001', '22222222-0001-0001-0001-000000000026', 'doctor', 'view', '192.168.1.25', 'Consultation de suivi HTA', NOW() - INTERVAL '5 days'),
('aaaaaaaa-0004-0001-0001-000000000003'::uuid, '66666666-0001-0001-0001-000000000003', '22222222-0001-0001-0001-000000000002', '22222222-0001-0001-0001-000000000031', 'pharmacist', 'update', '10.0.0.50', 'Mise a jour posologie diabete', NOW() - INTERVAL '3 days'),
('aaaaaaaa-0004-0001-0001-000000000004'::uuid, '66666666-0001-0001-0001-000000000005', '22222222-0001-0001-0001-000000000005', '55555555-0001-0001-0001-000000000001', 'nurse', 'view', '192.168.2.100', 'Soins a domicile - verification traitement', NOW() - INTERVAL '1 day'),
('aaaaaaaa-0004-0001-0001-000000000005'::uuid, '66666666-0001-0001-0001-000000000001', '22222222-0001-0001-0001-000000000001', '22222222-0001-0001-0001-000000000001', 'patient', 'view', '85.195.234.12', 'Consultation propre dossier medical', NOW() - INTERVAL '12 hours')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 22. AUDIT_LOGS (FK to users)
-- ============================================================================
INSERT INTO audit_logs (id, user_id, action, resource, resource_id, details, ip_address, user_agent, created_at)
VALUES
('bbbbbbbb-0004-0001-0001-000000000001'::uuid, '22222222-0001-0001-0001-000000000031'::uuid, 'prescription_approved', 'prescription', 'aaaaaaaa-0001-0001-0001-000000000001'::uuid, '{"patient_id": "22222222-0001-0001-0001-000000000001", "medication": "Lisinopril 10mg"}', '10.0.0.50', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0', NOW() - INTERVAL '5 days'),
('bbbbbbbb-0004-0001-0001-000000000002'::uuid, '22222222-0001-0001-0001-000000000031'::uuid, 'controlled_substance_dispensed', 'dispensation_log', 'ffffffff-0002-0001-0001-000000000001'::uuid, '{"substance": "Morphine", "quantity": 60, "patient_id": "22222222-0001-0001-0001-000000000015"}', '10.0.0.50', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0', NOW() - INTERVAL '4 days'),
('bbbbbbbb-0004-0001-0001-000000000003'::uuid, '22222222-0001-0001-0001-000000000001'::uuid, 'login', 'session', NULL, '{"method": "password", "mfa_used": false}', '85.195.234.12', 'MetaPharm-iOS/2.1.0', NOW() - INTERVAL '1 day'),
('bbbbbbbb-0004-0001-0001-000000000004'::uuid, '22222222-0001-0001-0001-000000000026'::uuid, 'medical_record_accessed', 'medical_record', '66666666-0001-0001-0001-000000000002'::uuid, '{"patient_id": "22222222-0001-0001-0001-000000000001", "access_reason": "follow_up_consultation"}', '192.168.1.25', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/17.0', NOW() - INTERVAL '5 days'),
('bbbbbbbb-0004-0001-0001-000000000005'::uuid, '22222222-0001-0001-0001-000000000032'::uuid, 'vip_membership_upgraded', 'vip_membership', '88888888-0001-0001-0001-000000000001'::uuid, '{"previous_tier": "silver", "new_tier": "gold", "patient_id": "22222222-0001-0001-0001-000000000001"}', '10.0.0.51', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/121.0', NOW() - INTERVAL '10 days'),
('bbbbbbbb-0004-0001-0001-000000000006'::uuid, '22222222-0001-0001-0001-000000000036'::uuid, 'delivery_completed', 'delivery', 'dddddddd-0001-0001-0001-000000000001'::uuid, '{"order_id": "ORD-2024-001", "cod_collected": 89.50}', '10.0.0.100', 'MetaPharm-Driver-Android/1.5.0', NOW() - INTERVAL '3 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Verification
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE 'Remaining tables seed data inserted successfully!';
END $$;
