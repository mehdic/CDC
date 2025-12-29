-- ============================================================================
-- MetaPharm Connect - CORRECTED Test Data Seed Script
-- Uses actual column names from the database schema
-- ============================================================================

-- ============================================================================
-- 1. PATIENT INSURANCE (using correct column names)
-- ============================================================================
INSERT INTO patient_insurance (id, "patientId", "insuranceProviderId", "policyNumber", "memberId", "franchiseLevel", "currentFranchiseSpent", "franchiseYearStart", "franchiseYearEnd", "quotePartPercentage", "isActive", "startDate")
VALUES
('11111111-0003-0001-0001-000000000001'::uuid, '22222222-0001-0001-0001-000000000001'::uuid, '77777777-0001-0001-0001-000000000001'::uuid, 'POL-CSS-2024-001', 'MEM-001', 2500, 1250.00, '2024-01-01', '2024-12-31', 10, true, '2024-01-01'),
('11111111-0003-0001-0001-000000000002'::uuid, '22222222-0001-0001-0001-000000000002'::uuid, '77777777-0001-0001-0001-000000000002'::uuid, 'POL-SWICA-2024-001', 'MEM-002', 1500, 800.00, '2024-01-01', '2024-12-31', 10, true, '2024-01-01'),
('11111111-0003-0001-0001-000000000003'::uuid, '22222222-0001-0001-0001-000000000005'::uuid, '77777777-0001-0001-0001-000000000003'::uuid, 'POL-HELS-2024-001', 'MEM-003', 2000, 2000.00, '2024-01-01', '2024-12-31', 10, true, '2024-01-01'),
('11111111-0003-0001-0001-000000000004'::uuid, '22222222-0001-0001-0001-000000000007'::uuid, '77777777-0001-0001-0001-000000000005'::uuid, 'POL-GM-2024-001', 'MEM-004', 300, 150.00, '2024-01-01', '2024-12-31', 10, true, '2024-01-01'),
('11111111-0003-0001-0001-000000000005'::uuid, '22222222-0001-0001-0001-000000000010'::uuid, '77777777-0001-0001-0001-000000000004'::uuid, 'POL-VIS-2024-001', 'MEM-005', 500, 450.00, '2024-01-01', '2024-12-31', 10, true, '2024-01-01')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. POINTS TRANSACTIONS (using correct column names)
-- ============================================================================
INSERT INTO points_transactions (id, vip_membership_id, type, source, amount, description, reference_id, expires_at, redeemed, related_amount)
VALUES
('99999999-0001-0001-0001-000000000001'::uuid, '88888888-0001-0001-0001-000000000001'::uuid, 'earn', 'purchase', 500, 'Achat prescription Lisinopril', 'ORD-001', NOW() + INTERVAL '365 days', false, 45.80),
('99999999-0001-0001-0001-000000000002'::uuid, '88888888-0001-0001-0001-000000000001'::uuid, 'redeem', 'reward', -250, 'Reduction 5 CHF sur commande', 'RED-001', NULL, true, 5.00),
('99999999-0001-0001-0001-000000000003'::uuid, '88888888-0001-0001-0001-000000000001'::uuid, 'earn', 'purchase', 750, 'Achat multiple produits', 'ORD-002', NOW() + INTERVAL '365 days', false, 89.50),
('99999999-0001-0001-0001-000000000004'::uuid, '88888888-0001-0001-0001-000000000001'::uuid, 'earn', 'bonus', 100, 'Bonus anniversaire', 'BONUS-001', NOW() + INTERVAL '365 days', false, NULL),
('99999999-0001-0001-0001-000000000005'::uuid, '88888888-0001-0001-0001-000000000003'::uuid, 'earn', 'purchase', 300, 'Achat parapharmacie', 'ORD-003', NOW() + INTERVAL '365 days', false, 35.90),
('99999999-0001-0001-0001-000000000006'::uuid, '88888888-0001-0001-0001-000000000003'::uuid, 'earn', 'purchase', 200, 'Achat vitamines', 'ORD-004', NOW() + INTERVAL '365 days', false, 24.90),
('99999999-0001-0001-0001-000000000007'::uuid, '88888888-0001-0001-0001-000000000006'::uuid, 'earn', 'purchase', 150, 'Premier achat', 'ORD-005', NOW() + INTERVAL '365 days', false, 18.50),
('99999999-0001-0001-0001-000000000008'::uuid, '88888888-0001-0001-0001-000000000007'::uuid, 'earn', 'purchase', 100, 'Achat produits bebe', 'ORD-006', NOW() + INTERVAL '365 days', false, 12.90)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 3. CART ITEMS (using correct schema - product details stored directly)
-- ============================================================================
INSERT INTO cart_items (id, cart_id, "productId", name, description, category, price, quantity, subtotal, "requiresPrescription", "imageUrl", "availableStock")
VALUES
('ffffffff-0001-0001-0001-000000000001'::uuid, 'eeeeeeee-0001-0001-0001-000000000001'::uuid, 'dddddddd-0001-0001-0001-000000000001', 'Dafalgan 1g', 'Paracetamol 1g', 'Antidouleurs', 8.50, 2, 17.00, false, '/products/dafalgan.jpg', 150),
('ffffffff-0001-0001-0001-000000000002'::uuid, 'eeeeeeee-0001-0001-0001-000000000001'::uuid, 'dddddddd-0001-0001-0001-000000000015', 'Berocca Performance', 'Vitamines energie', 'Vitamines', 16.90, 1, 16.90, false, '/products/berocca.jpg', 110),
('ffffffff-0001-0001-0001-000000000003'::uuid, 'eeeeeeee-0001-0001-0001-000000000002'::uuid, 'dddddddd-0001-0001-0001-000000000009', 'Bioderma Sensibio', 'Eau micellaire', 'Parapharmacie', 18.90, 1, 18.90, false, '/products/bioderma.jpg', 120),
('ffffffff-0001-0001-0001-000000000004'::uuid, 'eeeeeeee-0001-0001-0001-000000000002'::uuid, 'dddddddd-0001-0001-0001-000000000010', 'Effaclar Duo+', 'Soin anti-imperfections', 'Parapharmacie', 24.50, 2, 49.00, false, '/products/effaclar.jpg', 80),
('ffffffff-0001-0001-0001-000000000005'::uuid, 'eeeeeeee-0001-0001-0001-000000000003'::uuid, 'dddddddd-0001-0001-0001-000000000013', 'Pampers Premium T3', 'Couches taille 3', 'Bebe', 22.90, 3, 68.70, false, '/products/pampers.jpg', 95)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 4. NURSE ORDERS (using correct schema)
-- ============================================================================
INSERT INTO nurse_orders (id, nurse_id, patient_id, pharmacy_id, medication, dosage, quantity, instructions, urgency, status, "nurseNotes")
VALUES
('33333333-0001-0002-0001-000000000001'::uuid, '55555555-0001-0001-0001-000000000001'::uuid, '22222222-0001-0001-0001-000000000015'::uuid, '11111111-1111-1111-1111-111111111111', 'Insuline Lantus', '20 UI', 1, 'Injection sous-cutanee le soir', 'urgent', 'pending', 'Patient diabetique insulino-dependant'),
('33333333-0001-0002-0001-000000000002'::uuid, '55555555-0001-0001-0001-000000000002'::uuid, '22222222-0001-0001-0001-000000000018'::uuid, '11111111-1111-1111-1111-111111111111', 'Morphine 10mg', '10mg toutes les 6h', 20, 'Soins palliatifs - substance controlee', 'urgent', 'pending', 'Patient en soins palliatifs'),
('33333333-0001-0002-0001-000000000003'::uuid, '55555555-0001-0001-0001-000000000003'::uuid, '22222222-0001-0001-0001-000000000020'::uuid, '11111111-1111-1111-1111-111111111111', 'Pansements steriles', 'Application quotidienne', 50, 'Soins de plaie chronique', 'routine', 'approved', 'Plaie diabetique en voie de guerison'),
('33333333-0001-0002-0001-000000000004'::uuid, '55555555-0001-0001-0001-000000000001'::uuid, '22222222-0001-0001-0001-000000000012'::uuid, '11111111-1111-1111-1111-111111111111', 'Ventolin aerosol', '2 bouffees 4x/jour', 1, 'Patient BPCO renouvellement mensuel', 'routine', 'pending', 'Renouvellement habituel')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 5. CONTROLLED SUBSTANCES (using correct enum values A-E)
-- ============================================================================
INSERT INTO controlled_substances (id, name, "scientificName", schedule, "maxSupplyDays", "requiresSpecialForm", "crossPharmacyCheck", description, swissmedic, "maxDailyDosageMg", "warningDailyDosageMg", active)
VALUES
('44444444-0001-0002-0001-000000000001'::uuid, 'Morphine', 'Morphini hydrochloridum', 'A', 30, true, true, 'Analgesique opioide puissant', '{"authorization": "A+"}', 200, 100, true),
('44444444-0001-0002-0001-000000000002'::uuid, 'Oxycodone', 'Oxycodonum', 'A', 30, true, true, 'Analgesique opioide semi-synthetique', '{"authorization": "A+"}', 160, 80, true),
('44444444-0001-0002-0001-000000000003'::uuid, 'Fentanyl', 'Fentanylum', 'A', 30, true, true, 'Analgesique opioide synthetique', '{"authorization": "A+"}', NULL, NULL, true),
('44444444-0001-0002-0001-000000000004'::uuid, 'Ritaline', 'Methylphenidatum', 'B', 30, true, true, 'Psychostimulant - TDAH', '{"authorization": "B"}', 60, 40, true),
('44444444-0001-0002-0001-000000000005'::uuid, 'Dormicum', 'Midazolamum', 'C', 14, false, false, 'Benzodiazepine hypnotique', '{"authorization": "C"}', 15, 7, true),
('44444444-0001-0002-0001-000000000006'::uuid, 'Valium', 'Diazepamum', 'C', 30, false, false, 'Benzodiazepine anxiolytique', '{"authorization": "C"}', 40, 20, true),
('44444444-0001-0002-0001-000000000007'::uuid, 'Xanax', 'Alprazolamum', 'C', 30, false, false, 'Benzodiazepine anxiolytique', '{"authorization": "C"}', 4, 2, true),
('44444444-0001-0002-0001-000000000008'::uuid, 'Tramadol', 'Tramadolum', 'D', 30, false, false, 'Analgesique opioide faible', '{"authorization": "D"}', 400, 200, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 6. CAMPAIGNS (using correct enum values)
-- ============================================================================
INSERT INTO campaigns (id, "pharmacyId", name, description, type, status, "targetAudience", subject, content, "scheduledAt", "startDate", "endDate", "isRecurring", "totalRecipients", "sentCount", "openCount", "clickCount")
VALUES
('77777777-0001-0002-0001-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Soldes hiver 2024', 'Promotions sur les produits de parapharmacie', 'email', 'completed', '{all_customers}', 'Soldes hiver - Jusqu a -30%!', 'Profitez de nos soldes exceptionnelles sur toute la parapharmacie...', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days', NOW() - INTERVAL '15 days', false, 850, 850, 425, 156),
('77777777-0001-0002-0001-000000000002'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Rappel Vaccination Grippe', 'Campagne de rappel vaccination antigrippale', 'sms', 'completed', '{vip_members}', 'Vaccination grippe - Protegez-vous!', 'La saison grippale approche. Prenez rendez-vous pour votre vaccination...', NOW() - INTERVAL '60 days', NOW() - INTERVAL '60 days', NOW() - INTERVAL '45 days', false, 320, 320, 280, 95),
('77777777-0001-0002-0001-000000000003'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Nouveautes Printemps', 'Presentation des nouveaux produits', 'email', 'active', '{all_customers}', 'Decouvrez nos nouveautes de printemps!', 'Nouveaux produits bio, soins naturels et bien plus...', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days', NOW() + INTERVAL '23 days', false, 920, 650, 312, 89),
('77777777-0001-0002-0001-000000000004'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Programme Fidelite Golden', 'Campagne VIP exclusive', 'push', 'scheduled', '{gold_members}', 'Offre exclusive membres Gold!', 'En tant que membre Gold, profitez de 20% de reduction exclusive...', NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days', NOW() + INTERVAL '10 days', false, 45, 0, 0, 0)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 7. Check and verify what was inserted
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE 'Corrected seed data inserted successfully!';
END $$;
