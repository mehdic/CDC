-- ============================================================================
-- MetaPharm Connect - Fix Failed Inserts
-- Corrects user IDs and enum values for failed tables
-- ============================================================================

-- Use actual user IDs from the database:
-- Pharmacist: 0b2f251b-6c5d-4686-b5b1-b1053d914f86
-- Delivery drivers: 44444444-0001-0001-0001-000000000001, 44444444-0001-0001-0001-000000000002, 44444444-0001-0001-0001-000000000003
-- Doctors: 33333333-0001-0001-0001-000000000001 to 000000000004
-- Patients: 22222222-0001-0001-0001-000000000001 to 000000000025

-- ============================================================================
-- 1. REFILL_REQUESTS (fix enum value: auto -> auto_approved)
-- ============================================================================
INSERT INTO refill_requests (id, "prescriptionId", "patientId", "pharmacyId", "pharmacistId", "quantityRequested", status, "decisionType", "denialReason", "pharmacistNotes", "approvedAt", "filledAt", "expiresAt")
VALUES
('bbbbbbbb-0002-0001-0001-000000000001'::uuid, 'aaaaaaaa-0001-0001-0001-000000000001', '22222222-0001-0001-0001-000000000001', '11111111-1111-1111-1111-111111111111', '0b2f251b-6c5d-4686-b5b1-b1053d914f86', 1, 'approved', 'auto_approved', NULL, 'Renouvellement automatique approuve', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day', NOW() + INTERVAL '30 days'),
('bbbbbbbb-0002-0001-0001-000000000002'::uuid, 'aaaaaaaa-0001-0001-0001-000000000002', '22222222-0001-0001-0001-000000000002', '11111111-1111-1111-1111-111111111111', NULL, 2, 'pending', NULL, NULL, NULL, NULL, NULL, NOW() + INTERVAL '7 days'),
('bbbbbbbb-0002-0001-0001-000000000003'::uuid, 'aaaaaaaa-0001-0001-0001-000000000003', '22222222-0001-0001-0001-000000000003', '11111111-1111-1111-1111-111111111111', '0b2f251b-6c5d-4686-b5b1-b1053d914f86', 1, 'denied', 'manual_reviewed', 'Ordonnance expiree - nouvelle ordonnance requise', 'Patient contacte pour nouvelle consultation', NULL, NULL, NOW() - INTERVAL '5 days'),
('bbbbbbbb-0002-0001-0001-000000000004'::uuid, 'aaaaaaaa-0001-0001-0001-000000000005', '22222222-0001-0001-0001-000000000005', '11111111-1111-1111-1111-111111111111', '0b2f251b-6c5d-4686-b5b1-b1053d914f86', 1, 'filled', 'auto_approved', NULL, 'Delivre sans probleme', NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days', NOW() + INTERVAL '20 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. COD_TRANSACTIONS (use actual delivery driver IDs)
-- ============================================================================
INSERT INTO cod_transactions (id, order_id, delivery_id, driver_id, amount, collected_amount, status, payment_method, collected_at, change_given, collection_notes, settlement_id, settled_at)
VALUES
('88888888-0004-0001-0001-000000000001'::uuid, 'aaaaaaaa-0001-0001-0001-000000000001'::uuid, 'dddddddd-0001-0001-0001-000000000001'::uuid, '44444444-0001-0001-0001-000000000001'::uuid, 89.50, 89.50, 'collected', 'cash', NOW() - INTERVAL '3 days', 10.50, 'Client a paye avec 100 CHF', NULL, NULL),
('88888888-0004-0001-0001-000000000002'::uuid, 'aaaaaaaa-0001-0001-0001-000000000002'::uuid, 'dddddddd-0001-0001-0001-000000000002'::uuid, '44444444-0001-0001-0001-000000000001'::uuid, 156.80, 156.80, 'collected', 'card', NOW() - INTERVAL '2 days', 0.00, 'Paiement par carte mobile', NULL, NULL),
('88888888-0004-0001-0001-000000000003'::uuid, 'aaaaaaaa-0001-0001-0001-000000000003'::uuid, 'dddddddd-0001-0001-0001-000000000003'::uuid, '44444444-0001-0001-0001-000000000002'::uuid, 45.90, NULL, 'pending', NULL, NULL, 0.00, NULL, NULL, NULL),
('88888888-0004-0001-0001-000000000004'::uuid, 'aaaaaaaa-0001-0001-0001-000000000004'::uuid, 'dddddddd-0001-0001-0001-000000000004'::uuid, '44444444-0001-0001-0001-000000000001'::uuid, 234.50, 234.50, 'settled', 'cash', NOW() - INTERVAL '5 days', 15.50, 'Paiement especes', '99999999-0004-0001-0001-000000000001'::uuid, NOW() - INTERVAL '4 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 3. DRIVER_SETTLEMENTS (use actual delivery driver IDs)
-- ============================================================================
INSERT INTO driver_settlements (id, driver_id, settlement_date, total_expected, total_collected, total_settled, variance, transaction_count, cash_amount, card_amount, status, driver_notes, manager_notes, approved_by, approved_at)
VALUES
('99999999-0004-0001-0001-000000000001'::uuid, '44444444-0001-0001-0001-000000000001'::uuid, CURRENT_DATE - INTERVAL '4 days', 480.80, 480.80, 480.80, 0.00, 3, 324.00, 156.80, 'approved', 'Toutes les livraisons du jour completees', 'Compte verifie - OK', '0b2f251b-6c5d-4686-b5b1-b1053d914f86'::uuid, NOW() - INTERVAL '4 days'),
('99999999-0004-0001-0001-000000000002'::uuid, '44444444-0001-0001-0001-000000000002'::uuid, CURRENT_DATE - INTERVAL '3 days', 312.50, 312.50, 312.50, 0.00, 2, 312.50, 0.00, 'approved', NULL, NULL, '0b2f251b-6c5d-4686-b5b1-b1053d914f86'::uuid, NOW() - INTERVAL '3 days'),
('99999999-0004-0001-0001-000000000003'::uuid, '44444444-0001-0001-0001-000000000001'::uuid, CURRENT_DATE - INTERVAL '1 day', 246.30, 246.30, 0.00, 0.00, 2, 89.50, 156.80, 'pending', 'En attente de validation', NULL, NULL, NULL),
('99999999-0004-0001-0001-000000000004'::uuid, '44444444-0001-0001-0001-000000000002'::uuid, CURRENT_DATE - INTERVAL '2 days', 178.90, 168.90, 168.90, -10.00, 2, 168.90, 0.00, 'disputed', 'Difference de 10 CHF - client conteste montant', 'Verification en cours avec client', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 4. AUDIT_LOGS (use actual user IDs)
-- ============================================================================
INSERT INTO audit_logs (id, user_id, action, resource, resource_id, details, ip_address, user_agent, created_at)
VALUES
('bbbbbbbb-0004-0001-0001-000000000001'::uuid, '0b2f251b-6c5d-4686-b5b1-b1053d914f86'::uuid, 'prescription_approved', 'prescription', 'aaaaaaaa-0001-0001-0001-000000000001'::uuid, '{"patient_id": "22222222-0001-0001-0001-000000000001", "medication": "Lisinopril 10mg"}', '10.0.0.50', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0', NOW() - INTERVAL '5 days'),
('bbbbbbbb-0004-0001-0001-000000000002'::uuid, '0b2f251b-6c5d-4686-b5b1-b1053d914f86'::uuid, 'controlled_substance_dispensed', 'dispensation_log', 'ffffffff-0002-0001-0001-000000000001'::uuid, '{"substance": "Morphine", "quantity": 60, "patient_id": "22222222-0001-0001-0001-000000000015"}', '10.0.0.50', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0', NOW() - INTERVAL '4 days'),
('bbbbbbbb-0004-0001-0001-000000000003'::uuid, '22222222-0001-0001-0001-000000000001'::uuid, 'login', 'session', NULL, '{"method": "password", "mfa_used": false}', '85.195.234.12', 'MetaPharm-iOS/2.1.0', NOW() - INTERVAL '1 day'),
('bbbbbbbb-0004-0001-0001-000000000004'::uuid, '33333333-0001-0001-0001-000000000001'::uuid, 'medical_record_accessed', 'medical_record', '66666666-0001-0001-0001-000000000002'::uuid, '{"patient_id": "22222222-0001-0001-0001-000000000001", "access_reason": "follow_up_consultation"}', '192.168.1.25', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/17.0', NOW() - INTERVAL '5 days'),
('bbbbbbbb-0004-0001-0001-000000000005'::uuid, '0b2f251b-6c5d-4686-b5b1-b1053d914f86'::uuid, 'vip_membership_upgraded', 'vip_membership', '88888888-0001-0001-0001-000000000001'::uuid, '{"previous_tier": "silver", "new_tier": "gold", "patient_id": "22222222-0001-0001-0001-000000000001"}', '10.0.0.51', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/121.0', NOW() - INTERVAL '10 days'),
('bbbbbbbb-0004-0001-0001-000000000006'::uuid, '44444444-0001-0001-0001-000000000001'::uuid, 'delivery_completed', 'delivery', 'dddddddd-0001-0001-0001-000000000001'::uuid, '{"order_id": "ORD-2024-001", "cod_collected": 89.50}', '10.0.0.100', 'MetaPharm-Driver-Android/1.5.0', NOW() - INTERVAL '3 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Verification
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE 'Fix script completed successfully!';
END $$;
