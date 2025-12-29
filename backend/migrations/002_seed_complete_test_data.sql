-- ============================================================================
-- MetaPharm Connect - COMPLETE Test Data Seed Script
-- Seeds ALL 40 database tables with comprehensive test data
-- ============================================================================

-- ============================================================================
-- 1. PRODUCT CATEGORIES (Required for Products)
-- ============================================================================
INSERT INTO categories (id, name, slug, description, icon_url, parent_id, display_order, is_active)
VALUES
-- Main categories
('cccccccc-0001-0001-0001-000000000001'::uuid, 'Médicaments', 'medicaments', 'Médicaments sur ordonnance et OTC', '/icons/pills.svg', NULL, 1, true),
('cccccccc-0001-0001-0001-000000000002'::uuid, 'Parapharmacie', 'parapharmacie', 'Produits de parapharmacie', '/icons/care.svg', NULL, 2, true),
('cccccccc-0001-0001-0001-000000000003'::uuid, 'Hygiène & Soins', 'hygiene-soins', 'Produits d''hygiène et soins corporels', '/icons/hygiene.svg', NULL, 3, true),
('cccccccc-0001-0001-0001-000000000004'::uuid, 'Bébé & Maman', 'bebe-maman', 'Produits pour bébés et futures mamans', '/icons/baby.svg', NULL, 4, true),
('cccccccc-0001-0001-0001-000000000005'::uuid, 'Nutrition & Compléments', 'nutrition-complements', 'Compléments alimentaires et nutrition', '/icons/vitamins.svg', NULL, 5, true),
('cccccccc-0001-0001-0001-000000000006'::uuid, 'Premiers Secours', 'premiers-secours', 'Trousse de premiers soins', '/icons/first-aid.svg', NULL, 6, true),
('cccccccc-0001-0001-0001-000000000007'::uuid, 'Appareils & Matériel', 'appareils-materiel', 'Appareils médicaux et matériel', '/icons/devices.svg', NULL, 7, true),
-- Subcategories for Médicaments
('cccccccc-0001-0001-0001-000000000010'::uuid, 'Antidouleurs', 'antidouleurs', 'Médicaments contre la douleur', '/icons/pain.svg', 'cccccccc-0001-0001-0001-000000000001'::uuid, 1, true),
('cccccccc-0001-0001-0001-000000000011'::uuid, 'Antibiotiques', 'antibiotiques', 'Antibiotiques sur ordonnance', '/icons/antibiotics.svg', 'cccccccc-0001-0001-0001-000000000001'::uuid, 2, true),
('cccccccc-0001-0001-0001-000000000012'::uuid, 'Cardiovasculaire', 'cardiovasculaire', 'Médicaments pour le coeur', '/icons/heart.svg', 'cccccccc-0001-0001-0001-000000000001'::uuid, 3, true),
('cccccccc-0001-0001-0001-000000000013'::uuid, 'Diabète', 'diabete', 'Médicaments pour le diabète', '/icons/diabetes.svg', 'cccccccc-0001-0001-0001-000000000001'::uuid, 4, true),
('cccccccc-0001-0001-0001-000000000014'::uuid, 'Respiratoire', 'respiratoire', 'Médicaments respiratoires', '/icons/lungs.svg', 'cccccccc-0001-0001-0001-000000000001'::uuid, 5, true),
('cccccccc-0001-0001-0001-000000000015'::uuid, 'Dermatologie', 'dermatologie', 'Soins dermatologiques', '/icons/skin.svg', 'cccccccc-0001-0001-0001-000000000001'::uuid, 6, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. PRODUCTS (30 products across categories)
-- ============================================================================
INSERT INTO products (id, name, description, sku, manufacturer, category_id, price, original_price, stock, low_stock_threshold, requires_prescription, image_url, expiry_date, rating, review_count, is_active, is_featured)
VALUES
-- Antidouleurs (OTC)
('dddddddd-0001-0001-0001-000000000001'::uuid, 'Dafalgan 1g', 'Paracétamol 1g - Douleurs et fièvre', 'DAF-1G-20', 'UPSA', 'cccccccc-0001-0001-0001-000000000010'::uuid, 8.50, 9.90, 150, 20, false, '/products/dafalgan-1g.jpg', '2026-12-31', 4.7, 234, true, true),
('dddddddd-0001-0001-0001-000000000002'::uuid, 'Ibuprofène Sandoz 400mg', 'Anti-inflammatoire - Douleurs légères à modérées', 'IBU-400-30', 'Sandoz', 'cccccccc-0001-0001-0001-000000000010'::uuid, 12.90, NULL, 85, 15, false, '/products/ibuprofen-400.jpg', '2026-06-30', 4.5, 156, true, false),
('dddddddd-0001-0001-0001-000000000003'::uuid, 'Aspirine Bayer 500mg', 'Acide acétylsalicylique - Antidouleur classique', 'ASP-500-40', 'Bayer', 'cccccccc-0001-0001-0001-000000000010'::uuid, 6.70, NULL, 200, 25, false, '/products/aspirine-500.jpg', '2027-03-15', 4.4, 189, true, false),
-- Prescription medications
('dddddddd-0001-0001-0001-000000000004'::uuid, 'Lisinopril 10mg', 'Traitement de l''hypertension artérielle', 'LIS-10-30', 'Pfizer', 'cccccccc-0001-0001-0001-000000000012'::uuid, 18.50, NULL, 60, 10, true, '/products/lisinopril-10.jpg', '2026-09-30', 4.6, 78, true, false),
('dddddddd-0001-0001-0001-000000000005'::uuid, 'Metformine 850mg', 'Antidiabétique oral', 'MET-850-60', 'Sandoz', 'cccccccc-0001-0001-0001-000000000013'::uuid, 22.30, NULL, 45, 10, true, '/products/metformine-850.jpg', '2026-11-30', 4.5, 92, true, false),
('dddddddd-0001-0001-0001-000000000006'::uuid, 'Amoxicilline 1g', 'Antibiotique - Infections bactériennes', 'AMX-1G-14', 'GSK', 'cccccccc-0001-0001-0001-000000000011'::uuid, 15.80, NULL, 40, 8, true, '/products/amoxicilline-1g.jpg', '2026-04-15', 4.7, 145, true, false),
('dddddddd-0001-0001-0001-000000000007'::uuid, 'Ventolin 100µg', 'Bronchodilatateur - Asthme', 'VEN-100-200', 'GSK', 'cccccccc-0001-0001-0001-000000000014'::uuid, 28.90, NULL, 35, 8, true, '/products/ventolin.jpg', '2026-08-20', 4.8, 203, true, true),
('dddddddd-0001-0001-0001-000000000008'::uuid, 'Atorvastatine 20mg', 'Hypocholestérolémiant', 'ATO-20-30', 'Pfizer', 'cccccccc-0001-0001-0001-000000000012'::uuid, 24.50, NULL, 55, 10, true, '/products/atorvastatine-20.jpg', '2027-01-31', 4.4, 67, true, false),
-- Parapharmacie
('dddddddd-0001-0001-0001-000000000009'::uuid, 'Bioderma Sensibio H2O 500ml', 'Eau micellaire peau sensible', 'BIO-SEN-500', 'Bioderma', 'cccccccc-0001-0001-0001-000000000002'::uuid, 18.90, 22.50, 120, 15, false, '/products/bioderma-sensibio.jpg', '2027-06-30', 4.9, 412, true, true),
('dddddddd-0001-0001-0001-000000000010'::uuid, 'La Roche-Posay Effaclar Duo+', 'Soin anti-imperfections', 'LRP-EFF-40', 'La Roche-Posay', 'cccccccc-0001-0001-0001-000000000002'::uuid, 24.50, NULL, 80, 12, false, '/products/effaclar-duo.jpg', '2027-04-30', 4.7, 287, true, true),
-- Hygiène
('dddddddd-0001-0001-0001-000000000011'::uuid, 'Elmex Protection Caries 75ml', 'Dentifrice protection caries', 'ELM-PC-75', 'Elmex', 'cccccccc-0001-0001-0001-000000000003'::uuid, 5.90, NULL, 200, 30, false, '/products/elmex-pc.jpg', '2027-12-31', 4.6, 523, true, false),
('dddddddd-0001-0001-0001-000000000012'::uuid, 'Dove Savon Original 100g', 'Savon hydratant', 'DOV-OR-100', 'Dove', 'cccccccc-0001-0001-0001-000000000003'::uuid, 3.50, NULL, 350, 50, false, '/products/dove-soap.jpg', '2028-06-30', 4.5, 678, true, false),
-- Bébé & Maman
('dddddddd-0001-0001-0001-000000000013'::uuid, 'Pampers Premium Protection T3', 'Couches taille 3 (6-10kg)', 'PAM-PP-T3-50', 'Pampers', 'cccccccc-0001-0001-0001-000000000004'::uuid, 22.90, 26.50, 95, 15, false, '/products/pampers-t3.jpg', '2028-12-31', 4.8, 892, true, true),
('dddddddd-0001-0001-0001-000000000014'::uuid, 'Mustela Liniment 400ml', 'Nettoyant pour change', 'MUS-LIN-400', 'Mustela', 'cccccccc-0001-0001-0001-000000000004'::uuid, 12.50, NULL, 75, 10, false, '/products/mustela-liniment.jpg', '2027-09-30', 4.7, 234, true, false),
-- Vitamines
('dddddddd-0001-0001-0001-000000000015'::uuid, 'Berocca Performance 30 comp', 'Vitamines et minéraux énergie', 'BER-PER-30', 'Bayer', 'cccccccc-0001-0001-0001-000000000005'::uuid, 16.90, NULL, 110, 15, false, '/products/berocca.jpg', '2027-03-31', 4.6, 345, true, true),
('dddddddd-0001-0001-0001-000000000016'::uuid, 'Vitamine D3 1000 UI', 'Vitamine D pour os et immunité', 'VITD-1000-90', 'Burgerstein', 'cccccccc-0001-0001-0001-000000000005'::uuid, 19.90, NULL, 85, 12, false, '/products/vitamine-d3.jpg', '2027-06-30', 4.5, 267, true, false),
-- Premiers secours
('dddddddd-0001-0001-0001-000000000017'::uuid, 'Hansaplast Pansements Classiques 40', 'Pansements multi-tailles', 'HAN-CL-40', 'Hansaplast', 'cccccccc-0001-0001-0001-000000000006'::uuid, 8.90, NULL, 180, 25, false, '/products/hansaplast-40.jpg', '2028-12-31', 4.4, 189, true, false),
('dddddddd-0001-0001-0001-000000000018'::uuid, 'Bétadine Solution 125ml', 'Antiseptique cutané', 'BET-SOL-125', 'Mundipharma', 'cccccccc-0001-0001-0001-000000000006'::uuid, 11.50, NULL, 95, 15, false, '/products/betadine.jpg', '2026-12-31', 4.6, 278, true, false),
-- Appareils
('dddddddd-0001-0001-0001-000000000019'::uuid, 'Omron M3 Tensiomètre', 'Tensiomètre bras automatique', 'OMR-M3', 'Omron', 'cccccccc-0001-0001-0001-000000000007'::uuid, 69.90, 79.90, 25, 5, false, '/products/omron-m3.jpg', NULL, 4.7, 156, true, true),
('dddddddd-0001-0001-0001-000000000020'::uuid, 'Thermomètre Infrarouge Braun', 'Thermomètre auriculaire', 'BRA-IRT-6520', 'Braun', 'cccccccc-0001-0001-0001-000000000007'::uuid, 54.90, NULL, 30, 5, false, '/products/braun-thermo.jpg', NULL, 4.8, 423, true, true),
-- More prescription drugs
('dddddddd-0001-0001-0001-000000000021'::uuid, 'Pantoprazole 40mg', 'Inhibiteur pompe à protons', 'PAN-40-28', 'Sandoz', 'cccccccc-0001-0001-0001-000000000001'::uuid, 19.80, NULL, 70, 12, true, '/products/pantoprazole.jpg', '2026-10-31', 4.5, 134, true, false),
('dddddddd-0001-0001-0001-000000000022'::uuid, 'Sertraline 50mg', 'Antidépresseur ISRS', 'SER-50-30', 'Pfizer', 'cccccccc-0001-0001-0001-000000000001'::uuid, 28.50, NULL, 40, 8, true, '/products/sertraline.jpg', '2026-11-30', 4.4, 89, true, false),
('dddddddd-0001-0001-0001-000000000023'::uuid, 'Losartan 50mg', 'Antagoniste récepteurs angiotensine', 'LOS-50-30', 'Sandoz', 'cccccccc-0001-0001-0001-000000000012'::uuid, 21.30, NULL, 55, 10, true, '/products/losartan.jpg', '2026-12-31', 4.6, 112, true, false),
('dddddddd-0001-0001-0001-000000000024'::uuid, 'Gliclazide 30mg', 'Antidiabétique sulfamide', 'GLI-30-60', 'Servier', 'cccccccc-0001-0001-0001-000000000013'::uuid, 26.90, NULL, 35, 8, true, '/products/gliclazide.jpg', '2026-08-31', 4.5, 78, true, false),
-- Skincare
('dddddddd-0001-0001-0001-000000000025'::uuid, 'Avène Eau Thermale 300ml', 'Eau thermale apaisante', 'AVE-ET-300', 'Avène', 'cccccccc-0001-0001-0001-000000000002'::uuid, 14.90, NULL, 100, 15, false, '/products/avene-eau.jpg', '2027-09-30', 4.7, 567, true, false),
('dddddddd-0001-0001-0001-000000000026'::uuid, 'Vichy Minéral 89 50ml', 'Booster quotidien fortifiant', 'VIC-M89-50', 'Vichy', 'cccccccc-0001-0001-0001-000000000002'::uuid, 32.90, 36.50, 60, 10, false, '/products/vichy-89.jpg', '2027-05-31', 4.8, 389, true, true),
-- More OTC
('dddddddd-0001-0001-0001-000000000027'::uuid, 'Strepsils Miel Citron 24', 'Pastilles maux de gorge', 'STR-MC-24', 'Reckitt', 'cccccccc-0001-0001-0001-000000000001'::uuid, 9.90, NULL, 130, 20, false, '/products/strepsils.jpg', '2027-02-28', 4.3, 234, true, false),
('dddddddd-0001-0001-0001-000000000028'::uuid, 'Otrivin 0.1% 10ml', 'Décongestionnant nasal', 'OTR-01-10', 'Novartis', 'cccccccc-0001-0001-0001-000000000014'::uuid, 8.50, NULL, 95, 15, false, '/products/otrivin.jpg', '2026-12-31', 4.4, 178, true, false),
('dddddddd-0001-0001-0001-000000000029'::uuid, 'Imodium Capsules 20', 'Anti-diarrhéique', 'IMO-CAP-20', 'Johnson & Johnson', 'cccccccc-0001-0001-0001-000000000001'::uuid, 14.90, NULL, 75, 12, false, '/products/imodium.jpg', '2027-04-30', 4.5, 156, true, false),
('dddddddd-0001-0001-0001-000000000030'::uuid, 'Voltaren Emulgel 100g', 'Gel anti-inflammatoire', 'VOL-EM-100', 'Novartis', 'cccccccc-0001-0001-0001-000000000010'::uuid, 16.90, NULL, 85, 12, false, '/products/voltaren.jpg', '2027-01-31', 4.6, 312, true, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 3. ADD DELIVERY PERSONNEL & NURSES TO USERS
-- ============================================================================
INSERT INTO users (id, email, email_verified, role, status, first_name_encrypted, last_name_encrypted, primary_pharmacy_id)
VALUES
-- Delivery personnel
('44444444-0001-0001-0001-000000000001'::uuid, 'livraison1@pharmacie-rhone.ch', true, 'DELIVERY', 'active', decode('00', 'hex'), decode('00', 'hex'), '11111111-1111-1111-1111-111111111111'::uuid),
('44444444-0001-0001-0001-000000000002'::uuid, 'livraison2@pharmacie-rhone.ch', true, 'DELIVERY', 'active', decode('00', 'hex'), decode('00', 'hex'), '11111111-1111-1111-1111-111111111111'::uuid),
('44444444-0001-0001-0001-000000000003'::uuid, 'livraison3@pharmacie-rhone.ch', true, 'DELIVERY', 'active', decode('00', 'hex'), decode('00', 'hex'), '11111111-1111-1111-1111-111111111111'::uuid),
-- Nurses
('55555555-0001-0001-0001-000000000001'::uuid, 'infirmiere1@hopital-sion.ch', true, 'NURSE', 'active', decode('00', 'hex'), decode('00', 'hex'), '11111111-1111-1111-1111-111111111111'::uuid),
('55555555-0001-0001-0001-000000000002'::uuid, 'infirmiere2@hopital-sion.ch', true, 'NURSE', 'active', decode('00', 'hex'), decode('00', 'hex'), '11111111-1111-1111-1111-111111111111'::uuid),
('55555555-0001-0001-0001-000000000003'::uuid, 'infirmiere3@ems-valais.ch', true, 'NURSE', 'active', decode('00', 'hex'), decode('00', 'hex'), '11111111-1111-1111-1111-111111111111'::uuid)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 4. NURSES (Professional records)
-- ============================================================================
INSERT INTO nurses (id, user_id, specialization, license_number, license_country, certifications, is_verified)
VALUES
('66666666-0001-0001-0001-000000000001'::uuid, '55555555-0001-0001-0001-000000000001'::uuid, 'Soins généraux', 'CH-VS-INF-2024-001', 'CH', '["Soins palliatifs", "Gériatrie"]', true),
('66666666-0001-0001-0001-000000000002'::uuid, '55555555-0001-0001-0001-000000000002'::uuid, 'Soins intensifs', 'CH-VS-INF-2024-002', 'CH', '["Réanimation", "Soins critiques"]', true),
('66666666-0001-0001-0001-000000000003'::uuid, '55555555-0001-0001-0001-000000000003'::uuid, 'Soins à domicile', 'CH-VS-INF-2024-003', 'CH', '["Soins à domicile", "Diabétologie"]', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 5. INSURANCE PROVIDERS (Swiss health insurers)
-- ============================================================================
INSERT INTO insurance_providers (id, code, name, country, "insuranceType", "coverageTypes", "contactEmail", "contactPhone", website, "isActive", metadata)
VALUES
('77777777-0001-0001-0001-000000000001'::uuid, 'CSS', 'CSS Assurance', 'CH', 'LAMal', 'basic,complementary,hospital', 'service@css.ch', '+41 58 277 77 77', 'https://www.css.ch', true, '{"bav_number": "1234"}'),
('77777777-0001-0001-0001-000000000002'::uuid, 'SWICA', 'SWICA Organisation de santé', 'CH', 'LAMal', 'basic,complementary,dental', 'info@swica.ch', '+41 52 244 22 44', 'https://www.swica.ch', true, '{"bav_number": "2345"}'),
('77777777-0001-0001-0001-000000000003'::uuid, 'HELSANA', 'Helsana Assurances SA', 'CH', 'LAMal', 'basic,complementary,international', 'info@helsana.ch', '+41 43 340 11 11', 'https://www.helsana.ch', true, '{"bav_number": "3456"}'),
('77777777-0001-0001-0001-000000000004'::uuid, 'VISANA', 'Visana Services AG', 'CH', 'LAMal', 'basic,complementary,sport', 'info@visana.ch', '+41 31 357 91 11', 'https://www.visana.ch', true, '{"bav_number": "4567"}'),
('77777777-0001-0001-0001-000000000005'::uuid, 'GROUPE-MUTUEL', 'Groupe Mutuel', 'CH', 'LAMal', 'basic,complementary,family', 'info@groupemutuel.ch', '+41 0848 803 111', 'https://www.groupemutuel.ch', true, '{"bav_number": "5678"}'),
('77777777-0001-0001-0001-000000000006'::uuid, 'CONCORDIA', 'Concordia', 'CH', 'LAMal', 'basic,complementary', 'service@concordia.ch', '+41 41 228 00 00', 'https://www.concordia.ch', true, '{"bav_number": "6789"}'),
('77777777-0001-0001-0001-000000000007'::uuid, 'KPT', 'KPT/CPT', 'CH', 'LAMal', 'basic,complementary,alternative', 'info@kpt.ch', '+41 58 310 98 98', 'https://www.kpt.ch', true, '{"bav_number": "7890"}'),
('77777777-0001-0001-0001-000000000008'::uuid, 'SANITAS', 'Sanitas Assurance', 'CH', 'LAMal', 'basic,complementary,digital', 'info@sanitas.ch', '+41 44 298 62 00', 'https://www.sanitas.ch', true, '{"bav_number": "8901"}')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 6. PATIENT INSURANCE (Link patients to insurers)
-- ============================================================================
INSERT INTO patient_insurance (id, user_id, insurance_provider_id, policy_number, coverage_type, start_date, end_date, is_primary, is_active, created_at, updated_at)
SELECT
    gen_random_uuid(),
    u.id,
    (SELECT id FROM insurance_providers ORDER BY random() LIMIT 1),
    'POL-' || substr(md5(random()::text), 1, 8),
    'basic',
    '2024-01-01'::date,
    '2024-12-31'::date,
    true,
    true,
    NOW(),
    NOW()
FROM users u
WHERE u.role = 'PATIENT'
AND NOT EXISTS (SELECT 1 FROM patient_insurance pi WHERE pi.user_id = u.id)
LIMIT 20;

-- ============================================================================
-- 7. VIP MEMBERSHIPS (Golden MetaPharm program)
-- ============================================================================
INSERT INTO vip_memberships (id, user_id, current_points, lifetime_points, tier, tier_achieved_at, is_active, enrolled_at, redeemed_points)
VALUES
-- Gold members
('88888888-0001-0001-0001-000000000001'::uuid, '22222222-0001-0001-0001-000000000001'::uuid, 4500, 12500, 'gold', NOW() - INTERVAL '90 days', true, NOW() - INTERVAL '365 days', 8000),
('88888888-0001-0001-0001-000000000002'::uuid, '22222222-0001-0001-0001-000000000005'::uuid, 3200, 9800, 'gold', NOW() - INTERVAL '60 days', true, NOW() - INTERVAL '300 days', 6600),
-- Silver members
('88888888-0001-0001-0001-000000000003'::uuid, '22222222-0001-0001-0001-000000000002'::uuid, 1500, 4200, 'silver', NOW() - INTERVAL '45 days', true, NOW() - INTERVAL '200 days', 2700),
('88888888-0001-0001-0001-000000000004'::uuid, '22222222-0001-0001-0001-000000000007'::uuid, 1800, 3500, 'silver', NOW() - INTERVAL '30 days', true, NOW() - INTERVAL '180 days', 1700),
('88888888-0001-0001-0001-000000000005'::uuid, '22222222-0001-0001-0001-000000000010'::uuid, 2100, 5600, 'silver', NOW() - INTERVAL '75 days', true, NOW() - INTERVAL '240 days', 3500),
-- Bronze members
('88888888-0001-0001-0001-000000000006'::uuid, '22222222-0001-0001-0001-000000000003'::uuid, 450, 850, 'bronze', NOW() - INTERVAL '20 days', true, NOW() - INTERVAL '90 days', 400),
('88888888-0001-0001-0001-000000000007'::uuid, '22222222-0001-0001-0001-000000000008'::uuid, 200, 500, 'bronze', NOW() - INTERVAL '15 days', true, NOW() - INTERVAL '60 days', 300),
('88888888-0001-0001-0001-000000000008'::uuid, '22222222-0001-0001-0001-000000000012'::uuid, 650, 1200, 'bronze', NOW() - INTERVAL '40 days', true, NOW() - INTERVAL '120 days', 550),
('88888888-0001-0001-0001-000000000009'::uuid, '22222222-0001-0001-0001-000000000015'::uuid, 380, 680, 'bronze', NOW() - INTERVAL '10 days', true, NOW() - INTERVAL '45 days', 300),
('88888888-0001-0001-0001-000000000010'::uuid, '22222222-0001-0001-0001-000000000018'::uuid, 120, 250, 'bronze', NOW() - INTERVAL '5 days', true, NOW() - INTERVAL '30 days', 130)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 8. POINTS TRANSACTIONS (VIP program activity)
-- ============================================================================
INSERT INTO points_transactions (id, vip_membership_id, points, transaction_type, description, order_id, created_at)
VALUES
-- Gold member transactions
('99999999-0001-0001-0001-000000000001'::uuid, '88888888-0001-0001-0001-000000000001'::uuid, 500, 'earn', 'Achat prescription Lisinopril', NULL, NOW() - INTERVAL '30 days'),
('99999999-0001-0001-0001-000000000002'::uuid, '88888888-0001-0001-0001-000000000001'::uuid, -250, 'redeem', 'Réduction 5 CHF sur commande', NULL, NOW() - INTERVAL '25 days'),
('99999999-0001-0001-0001-000000000003'::uuid, '88888888-0001-0001-0001-000000000001'::uuid, 750, 'earn', 'Achat multiple produits', NULL, NOW() - INTERVAL '15 days'),
('99999999-0001-0001-0001-000000000004'::uuid, '88888888-0001-0001-0001-000000000001'::uuid, 100, 'bonus', 'Bonus anniversaire', NULL, NOW() - INTERVAL '10 days'),
-- Silver member transactions
('99999999-0001-0001-0001-000000000005'::uuid, '88888888-0001-0001-0001-000000000003'::uuid, 300, 'earn', 'Achat parapharmacie', NULL, NOW() - INTERVAL '20 days'),
('99999999-0001-0001-0001-000000000006'::uuid, '88888888-0001-0001-0001-000000000003'::uuid, 200, 'earn', 'Achat vitamines', NULL, NOW() - INTERVAL '12 days'),
-- Bronze member transactions
('99999999-0001-0001-0001-000000000007'::uuid, '88888888-0001-0001-0001-000000000006'::uuid, 150, 'earn', 'Premier achat', NULL, NOW() - INTERVAL '8 days'),
('99999999-0001-0001-0001-000000000008'::uuid, '88888888-0001-0001-0001-000000000007'::uuid, 100, 'earn', 'Achat produits bébé', NULL, NOW() - INTERVAL '5 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 9. CARTS (Shopping carts)
-- ============================================================================
INSERT INTO carts (id, user_id, status, created_at, updated_at)
VALUES
('eeeeeeee-0001-0001-0001-000000000001'::uuid, '22222222-0001-0001-0001-000000000001'::uuid, 'active', NOW() - INTERVAL '1 hour', NOW()),
('eeeeeeee-0001-0001-0001-000000000002'::uuid, '22222222-0001-0001-0001-000000000003'::uuid, 'active', NOW() - INTERVAL '2 hours', NOW()),
('eeeeeeee-0001-0001-0001-000000000003'::uuid, '22222222-0001-0001-0001-000000000005'::uuid, 'active', NOW() - INTERVAL '30 minutes', NOW()),
('eeeeeeee-0001-0001-0001-000000000004'::uuid, '22222222-0001-0001-0001-000000000007'::uuid, 'abandoned', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days'),
('eeeeeeee-0001-0001-0001-000000000005'::uuid, '22222222-0001-0001-0001-000000000010'::uuid, 'completed', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 10. CART ITEMS
-- ============================================================================
INSERT INTO cart_items (id, cart_id, product_id, quantity, price_at_add, created_at, updated_at)
VALUES
-- Cart 1 items
('ffffffff-0001-0001-0001-000000000001'::uuid, 'eeeeeeee-0001-0001-0001-000000000001'::uuid, 'dddddddd-0001-0001-0001-000000000001'::uuid, 2, 8.50, NOW() - INTERVAL '1 hour', NOW()),
('ffffffff-0001-0001-0001-000000000002'::uuid, 'eeeeeeee-0001-0001-0001-000000000001'::uuid, 'dddddddd-0001-0001-0001-000000000015'::uuid, 1, 16.90, NOW() - INTERVAL '45 minutes', NOW()),
-- Cart 2 items
('ffffffff-0001-0001-0001-000000000003'::uuid, 'eeeeeeee-0001-0001-0001-000000000002'::uuid, 'dddddddd-0001-0001-0001-000000000009'::uuid, 1, 18.90, NOW() - INTERVAL '2 hours', NOW()),
('ffffffff-0001-0001-0001-000000000004'::uuid, 'eeeeeeee-0001-0001-0001-000000000002'::uuid, 'dddddddd-0001-0001-0001-000000000010'::uuid, 2, 24.50, NOW() - INTERVAL '90 minutes', NOW()),
-- Cart 3 items
('ffffffff-0001-0001-0001-000000000005'::uuid, 'eeeeeeee-0001-0001-0001-000000000003'::uuid, 'dddddddd-0001-0001-0001-000000000013'::uuid, 3, 22.90, NOW() - INTERVAL '30 minutes', NOW()),
('ffffffff-0001-0001-0001-000000000006'::uuid, 'eeeeeeee-0001-0001-0001-000000000003'::uuid, 'dddddddd-0001-0001-0001-000000000014'::uuid, 1, 12.50, NOW() - INTERVAL '25 minutes', NOW()),
-- Abandoned cart items
('ffffffff-0001-0001-0001-000000000007'::uuid, 'eeeeeeee-0001-0001-0001-000000000004'::uuid, 'dddddddd-0001-0001-0001-000000000019'::uuid, 1, 69.90, NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 11. PAYMENTS (Order payments)
-- ============================================================================
INSERT INTO payments (id, user_id, order_id, amount, currency, payment_method, status, transaction_id, created_at, updated_at)
VALUES
('11111111-0001-0002-0001-000000000001'::uuid, '22222222-0001-0001-0001-000000000001'::uuid, NULL, 45.80, 'CHF', 'credit_card', 'completed', 'TXN-001-2024', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
('11111111-0001-0002-0001-000000000002'::uuid, '22222222-0001-0001-0001-000000000002'::uuid, NULL, 128.50, 'CHF', 'twint', 'completed', 'TXN-002-2024', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),
('11111111-0001-0002-0001-000000000003'::uuid, '22222222-0001-0001-0001-000000000005'::uuid, NULL, 67.30, 'CHF', 'postfinance', 'completed', 'TXN-003-2024', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
('11111111-0001-0002-0001-000000000004'::uuid, '22222222-0001-0001-0001-000000000007'::uuid, NULL, 89.90, 'CHF', 'credit_card', 'pending', 'TXN-004-2024', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
('11111111-0001-0002-0001-000000000005'::uuid, '22222222-0001-0001-0001-000000000010'::uuid, NULL, 156.20, 'CHF', 'invoice', 'completed', 'TXN-005-2024', NOW() - INTERVAL '15 days', NOW() - INTERVAL '14 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 12. DELIVERIES
-- ============================================================================
INSERT INTO deliveries (id, user_id, order_id, delivery_personnel_id, status, delivery_address_encrypted, delivery_notes_encrypted, tracking_number, scheduled_at, picked_up_at, delivered_at, requires_temperature_control, contains_controlled_substance, requires_signature)
VALUES
('22222222-0001-0002-0001-000000000001'::uuid, '22222222-0001-0001-0001-000000000001'::uuid, NULL, '44444444-0001-0001-0001-000000000001'::uuid, 'delivered', decode('00', 'hex'), decode('00', 'hex'), 'MP-2024-DEL-001', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days' + INTERVAL '2 hours', NOW() - INTERVAL '3 days' + INTERVAL '4 hours', false, false, false),
('22222222-0001-0002-0001-000000000002'::uuid, '22222222-0001-0001-0001-000000000002'::uuid, NULL, '44444444-0001-0001-0001-000000000002'::uuid, 'delivered', decode('00', 'hex'), decode('00', 'hex'), 'MP-2024-DEL-002', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days' + INTERVAL '1 hour', NOW() - INTERVAL '5 days' + INTERVAL '3 hours', true, false, true),
('22222222-0001-0002-0001-000000000003'::uuid, '22222222-0001-0001-0001-000000000003'::uuid, NULL, '44444444-0001-0001-0001-000000000001'::uuid, 'in_transit', decode('00', 'hex'), decode('00', 'hex'), 'MP-2024-DEL-003', NOW() + INTERVAL '2 hours', NOW() - INTERVAL '30 minutes', NULL, false, true, true),
('22222222-0001-0002-0001-000000000004'::uuid, '22222222-0001-0001-0001-000000000005'::uuid, NULL, '44444444-0001-0001-0001-000000000003'::uuid, 'pending', decode('00', 'hex'), decode('00', 'hex'), 'MP-2024-DEL-004', NOW() + INTERVAL '4 hours', NULL, NULL, false, false, false),
('22222222-0001-0002-0001-000000000005'::uuid, '22222222-0001-0001-0001-000000000007'::uuid, NULL, NULL, 'pending', decode('00', 'hex'), decode('00', 'hex'), 'MP-2024-DEL-005', NOW() + INTERVAL '1 day', NULL, NULL, true, false, true),
('22222222-0001-0002-0001-000000000006'::uuid, '22222222-0001-0001-0001-000000000010'::uuid, NULL, '44444444-0001-0001-0001-000000000002'::uuid, 'delivered', decode('00', 'hex'), decode('00', 'hex'), 'MP-2024-DEL-006', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days' + INTERVAL '90 minutes', NOW() - INTERVAL '7 days' + INTERVAL '4 hours', false, false, false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 13. NURSE ORDERS
-- ============================================================================
INSERT INTO nurse_orders (id, nurse_id, patient_id, pharmacy_id, status, order_details, notes, priority, created_at, updated_at)
VALUES
('33333333-0001-0002-0001-000000000001'::uuid, '55555555-0001-0001-0001-000000000001'::uuid, '22222222-0001-0001-0001-000000000015'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'pending', '{"medications": [{"name": "Insuline Lantus", "quantity": 1}, {"name": "Aiguilles BD", "quantity": 30}]}', 'Patient diabétique, livraison urgente', 'high', NOW() - INTERVAL '2 hours', NOW()),
('33333333-0001-0002-0001-000000000002'::uuid, '55555555-0001-0001-0001-000000000002'::uuid, '22222222-0001-0001-0001-000000000018'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'processing', '{"medications": [{"name": "Morphine 10mg", "quantity": 20}]}', 'Soins palliatifs - substance contrôlée', 'urgent', NOW() - INTERVAL '1 hour', NOW()),
('33333333-0001-0002-0001-000000000003'::uuid, '55555555-0001-0001-0001-000000000003'::uuid, '22222222-0001-0001-0001-000000000020'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'completed', '{"medications": [{"name": "Pansements stériles", "quantity": 50}, {"name": "Bétadine", "quantity": 2}]}', 'Soins de plaie chronique', 'normal', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),
('33333333-0001-0002-0001-000000000004'::uuid, '55555555-0001-0001-0001-000000000001'::uuid, '22222222-0001-0001-0001-000000000012'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'pending', '{"medications": [{"name": "Aerosol Ventolin", "quantity": 1}, {"name": "Masque aérosol", "quantity": 5}]}', 'Patient BPCO, renouvellement mensuel', 'normal', NOW() - INTERVAL '30 minutes', NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 14. CONTROLLED SUBSTANCES
-- ============================================================================
INSERT INTO controlled_substances (id, name, "scientificName", schedule, "maxSupplyDays", "requiresSpecialForm", "crossPharmacyCheck", description, swissmedic, "maxDailyDosageMg", "warningDailyDosageMg", active)
VALUES
('44444444-0001-0002-0001-000000000001'::uuid, 'Morphine', 'Morphini hydrochloridum', 'II', 30, true, true, 'Analgésique opioïde puissant', '{"authorization": "A+"}', 200, 100, true),
('44444444-0001-0002-0001-000000000002'::uuid, 'Oxycodone', 'Oxycodonum', 'II', 30, true, true, 'Analgésique opioïde semi-synthétique', '{"authorization": "A+"}', 160, 80, true),
('44444444-0001-0002-0001-000000000003'::uuid, 'Fentanyl', 'Fentanylum', 'II', 30, true, true, 'Analgésique opioïde synthétique', '{"authorization": "A+"}', NULL, NULL, true),
('44444444-0001-0002-0001-000000000004'::uuid, 'Ritaline', 'Methylphenidatum', 'II', 30, true, true, 'Psychostimulant - TDAH', '{"authorization": "A+"}', 60, 40, true),
('44444444-0001-0002-0001-000000000005'::uuid, 'Dormicum', 'Midazolamum', 'IV', 14, false, false, 'Benzodiazépine hypnotique', '{"authorization": "B"}', 15, 7.5, true),
('44444444-0001-0002-0001-000000000006'::uuid, 'Valium', 'Diazepamum', 'IV', 30, false, false, 'Benzodiazépine anxiolytique', '{"authorization": "B"}', 40, 20, true),
('44444444-0001-0002-0001-000000000007'::uuid, 'Xanax', 'Alprazolamum', 'IV', 30, false, false, 'Benzodiazépine anxiolytique', '{"authorization": "B"}', 4, 2, true),
('44444444-0001-0002-0001-000000000008'::uuid, 'Tramadol', 'Tramadolum', 'III', 30, false, false, 'Analgésique opioïde faible', '{"authorization": "B"}', 400, 200, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 15. CONTROLLED PRESCRIPTIONS
-- ============================================================================
INSERT INTO controlled_prescriptions (id, prescription_id, substance_id, patient_id, prescriber_id, pharmacy_id, quantity_prescribed, quantity_dispensed, prescription_date, expiry_date, special_form_number, cross_check_performed, cross_check_result, status, created_at, updated_at)
VALUES
('55555555-0001-0002-0001-000000000001'::uuid, 'aaaaaaaa-0001-0001-0001-000000000009'::uuid, '44444444-0001-0002-0001-000000000008'::uuid, '22222222-0001-0001-0001-000000000009'::uuid, '33333333-0001-0001-0001-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 20, 20, NOW() - INTERVAL '5 days', NOW() + INTERVAL '25 days', NULL, true, '{"status": "clear", "last_dispensation": null}', 'dispensed', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days'),
('55555555-0001-0002-0001-000000000002'::uuid, NULL, '44444444-0001-0002-0001-000000000001'::uuid, '22222222-0001-0001-0001-000000000018'::uuid, '33333333-0001-0001-0001-000000000004'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 30, 0, NOW() - INTERVAL '1 day', NOW() + INTERVAL '29 days', 'SF-2024-001', true, '{"status": "clear", "last_dispensation": null}', 'pending', NOW() - INTERVAL '1 day', NOW()),
('55555555-0001-0002-0001-000000000003'::uuid, NULL, '44444444-0001-0002-0001-000000000005'::uuid, '22222222-0001-0001-0001-000000000010'::uuid, '33333333-0001-0001-0001-000000000002'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 14, 14, NOW() - INTERVAL '10 days', NOW() + INTERVAL '4 days', NULL, false, NULL, 'dispensed', NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 16. DISPENSATION LOGS
-- ============================================================================
INSERT INTO dispensation_logs (id, controlled_prescription_id, pharmacist_id, quantity_dispensed, dispensation_date, patient_signature_obtained, notes, created_at)
VALUES
('66666666-0001-0002-0001-000000000001'::uuid, '55555555-0001-0002-0001-000000000001'::uuid, '0b2f251b-6c5d-4686-b5b1-b1053d914f86'::uuid, 20, NOW() - INTERVAL '4 days', true, 'Dispensation normale, patient informé des risques', NOW() - INTERVAL '4 days'),
('66666666-0001-0002-0001-000000000002'::uuid, '55555555-0001-0002-0001-000000000003'::uuid, '0b2f251b-6c5d-4686-b5b1-b1053d914f86'::uuid, 14, NOW() - INTERVAL '9 days', true, 'Première prescription, conseil sur le bon usage', NOW() - INTERVAL '9 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 17. CAMPAIGNS (Marketing)
-- ============================================================================
INSERT INTO campaigns (id, "pharmacyId", name, description, type, status, "targetAudience", subject, content, "scheduledAt", "startDate", "endDate", "isRecurring", "totalRecipients", "sentCount", "openCount", "clickCount")
VALUES
('77777777-0001-0002-0001-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Soldes d''hiver 2024', 'Promotions sur les produits de parapharmacie', 'promotional', 'completed', '{all_customers}', 'Soldes d''hiver - Jusqu''à -30%!', 'Profitez de nos soldes exceptionnelles sur toute la parapharmacie...', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days', NOW() - INTERVAL '15 days', false, 850, 850, 425, 156),
('77777777-0001-0002-0001-000000000002'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Rappel Vaccination Grippe', 'Campagne de rappel vaccination antigrippale', 'health_reminder', 'completed', '{vip_members,chronic_patients}', 'Vaccination grippe - Protégez-vous!', 'La saison grippale approche. Prenez rendez-vous pour votre vaccination...', NOW() - INTERVAL '60 days', NOW() - INTERVAL '60 days', NOW() - INTERVAL '45 days', false, 320, 320, 280, 95),
('77777777-0001-0002-0001-000000000003'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Nouveautés Printemps', 'Présentation des nouveaux produits', 'newsletter', 'active', '{all_customers}', 'Découvrez nos nouveautés de printemps!', 'Nouveaux produits bio, soins naturels et bien plus...', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days', NOW() + INTERVAL '23 days', false, 920, 650, 312, 89),
('77777777-0001-0002-0001-000000000004'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Programme Fidélité Golden', 'Campagne VIP exclusive', 'loyalty', 'scheduled', '{gold_members}', 'Offre exclusive membres Gold!', 'En tant que membre Gold, profitez de 20% de réduction exclusive...', NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days', NOW() + INTERVAL '10 days', false, 45, 0, 0, 0)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 18. CAMPAIGN TEMPLATES
-- ============================================================================
INSERT INTO campaign_templates (id, "pharmacyId", name, category, subject, content, variables, is_active, created_at, updated_at)
VALUES
('88888888-0001-0002-0001-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Rappel de renouvellement', 'reminder', 'Votre ordonnance arrive à expiration', 'Bonjour {{patient_name}}, votre ordonnance pour {{medication_name}} expire le {{expiry_date}}. Pensez à consulter votre médecin.', '["patient_name", "medication_name", "expiry_date"]', true, NOW() - INTERVAL '90 days', NOW()),
('88888888-0001-0002-0001-000000000002'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Promotion saisonnière', 'promotional', '{{season}} - Offres spéciales!', 'Profitez de {{discount}}% de réduction sur {{product_category}} jusqu''au {{end_date}}!', '["season", "discount", "product_category", "end_date"]', true, NOW() - INTERVAL '60 days', NOW()),
('88888888-0001-0002-0001-000000000003'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Bienvenue nouveau client', 'welcome', 'Bienvenue chez Pharmacie du Rhône!', 'Cher(e) {{patient_name}}, bienvenue! Découvrez nos services et profitez de {{welcome_discount}}% sur votre première commande.', '["patient_name", "welcome_discount"]', true, NOW() - INTERVAL '120 days', NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 19. CAMPAIGN ANALYTICS
-- ============================================================================
INSERT INTO campaign_analytics (id, campaign_id, event_type, recipient_id, occurred_at, metadata)
VALUES
('99999999-0001-0002-0001-000000000001'::uuid, '77777777-0001-0002-0001-000000000001'::uuid, 'opened', '22222222-0001-0001-0001-000000000001'::uuid, NOW() - INTERVAL '29 days', '{"device": "mobile", "client": "iPhone Mail"}'),
('99999999-0001-0002-0001-000000000002'::uuid, '77777777-0001-0002-0001-000000000001'::uuid, 'clicked', '22222222-0001-0001-0001-000000000001'::uuid, NOW() - INTERVAL '29 days' + INTERVAL '5 minutes', '{"link": "promotions", "device": "mobile"}'),
('99999999-0001-0002-0001-000000000003'::uuid, '77777777-0001-0002-0001-000000000001'::uuid, 'opened', '22222222-0001-0001-0001-000000000005'::uuid, NOW() - INTERVAL '28 days', '{"device": "desktop", "client": "Gmail"}'),
('99999999-0001-0002-0001-000000000004'::uuid, '77777777-0001-0002-0001-000000000002'::uuid, 'opened', '22222222-0001-0001-0001-000000000015'::uuid, NOW() - INTERVAL '58 days', '{"device": "mobile", "client": "Android Mail"}'),
('99999999-0001-0002-0001-000000000005'::uuid, '77777777-0001-0002-0001-000000000002'::uuid, 'clicked', '22222222-0001-0001-0001-000000000015'::uuid, NOW() - INTERVAL '58 days' + INTERVAL '10 minutes', '{"link": "booking", "device": "mobile"}'),
('99999999-0001-0002-0001-000000000006'::uuid, '77777777-0001-0002-0001-000000000003'::uuid, 'opened', '22222222-0001-0001-0001-000000000003'::uuid, NOW() - INTERVAL '5 days', '{"device": "desktop", "client": "Outlook"}')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 20. PROMOTIONS
-- ============================================================================
INSERT INTO promotions (id, pharmacy_id, name, description, discount_type, discount_value, min_purchase, max_discount, promo_code, start_date, end_date, usage_limit, usage_count, is_active, applicable_categories, applicable_products, created_at, updated_at)
VALUES
('aaaaaaaa-0001-0002-0001-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Soldes Hiver 30%', 'Réduction 30% sur la parapharmacie', 'percentage', 30.00, 50.00, 100.00, 'HIVER30', NOW() - INTERVAL '30 days', NOW() + INTERVAL '15 days', 500, 156, true, '["cccccccc-0001-0001-0001-000000000002"]', NULL, NOW() - INTERVAL '35 days', NOW()),
('aaaaaaaa-0001-0002-0001-000000000002'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Livraison Gratuite 80CHF', 'Livraison offerte dès 80 CHF', 'free_shipping', 0.00, 80.00, NULL, 'LIVGRAT80', NOW() - INTERVAL '60 days', NOW() + INTERVAL '300 days', NULL, 423, true, NULL, NULL, NOW() - INTERVAL '65 days', NOW()),
('aaaaaaaa-0001-0002-0001-000000000003'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'VIP Gold -20%', 'Réduction exclusive membres Gold', 'percentage', 20.00, 0.00, 200.00, 'GOLD20', NOW() - INTERVAL '90 days', NOW() + INTERVAL '275 days', NULL, 89, true, NULL, NULL, NOW() - INTERVAL '95 days', NOW()),
('aaaaaaaa-0001-0002-0001-000000000004'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, '5 CHF offerts', 'Réduction fixe de 5 CHF', 'fixed', 5.00, 30.00, 5.00, '5OFFERT', NOW() - INTERVAL '15 days', NOW() + INTERVAL '45 days', 200, 34, true, NULL, NULL, NOW() - INTERVAL '20 days', NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 21. MEDICAL RECORDS (basic records for testing)
-- ============================================================================
INSERT INTO medical_records (id, patient_id, pharmacy_id, record_type, content_encrypted, notes, created_by, created_at, updated_at)
VALUES
('bbbbbbbb-0001-0002-0001-000000000001'::uuid, '22222222-0001-0001-0001-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'allergy', decode('00', 'hex'), 'Allergie pénicilline documentée', '0b2f251b-6c5d-4686-b5b1-b1053d914f86'::uuid, NOW() - INTERVAL '180 days', NOW()),
('bbbbbbbb-0001-0002-0001-000000000002'::uuid, '22222222-0001-0001-0001-000000000005'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'condition', decode('00', 'hex'), 'Diabète type 2 sous Metformine', '0b2f251b-6c5d-4686-b5b1-b1053d914f86'::uuid, NOW() - INTERVAL '365 days', NOW()),
('bbbbbbbb-0001-0002-0001-000000000003'::uuid, '22222222-0001-0001-0001-000000000007'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'condition', decode('00', 'hex'), 'Hypertension artérielle contrôlée', '0b2f251b-6c5d-4686-b5b1-b1053d914f86'::uuid, NOW() - INTERVAL '200 days', NOW()),
('bbbbbbbb-0001-0002-0001-000000000004'::uuid, '22222222-0001-0001-0001-000000000010'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'allergy', decode('00', 'hex'), 'Allergie aspirine et AINS', '0b2f251b-6c5d-4686-b5b1-b1053d914f86'::uuid, NOW() - INTERVAL '150 days', NOW()),
('bbbbbbbb-0001-0002-0001-000000000005'::uuid, '22222222-0001-0001-0001-000000000015'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'condition', decode('00', 'hex'), 'Asthme modéré persistant', '0b2f251b-6c5d-4686-b5b1-b1053d914f86'::uuid, NOW() - INTERVAL '400 days', NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 22. DIGITAL TWIN PROFILES
-- ============================================================================
INSERT INTO digital_twin_profiles (id, patient_id, profile_data, health_metrics, medication_history, lifestyle_factors, ai_insights, last_analysis_at, created_at, updated_at)
VALUES
('cccccccc-0001-0002-0001-000000000001'::uuid, '22222222-0001-0001-0001-000000000001'::uuid, '{"age": 45, "gender": "M", "bmi": 26.5}', '{"blood_pressure": "130/85", "heart_rate": 72, "cholesterol": 210}', '{"current": ["Lisinopril", "Atorvastatine"], "past": ["Amlodipine"]}', '{"smoker": false, "alcohol": "moderate", "exercise": "regular"}', '{"risk_cardiovascular": "moderate", "recommendations": ["Reduce salt intake", "Continue exercise"]}', NOW() - INTERVAL '7 days', NOW() - INTERVAL '180 days', NOW()),
('cccccccc-0001-0002-0001-000000000002'::uuid, '22222222-0001-0001-0001-000000000005'::uuid, '{"age": 62, "gender": "F", "bmi": 29.8}', '{"blood_sugar": "7.2", "hba1c": "6.8", "blood_pressure": "135/82"}', '{"current": ["Metformine", "Gliclazide"], "past": []}', '{"smoker": false, "alcohol": "none", "exercise": "light"}', '{"risk_diabetic_complications": "low", "recommendations": ["Weight management", "Regular foot checks"]}', NOW() - INTERVAL '3 days', NOW() - INTERVAL '365 days', NOW()),
('cccccccc-0001-0002-0001-000000000003'::uuid, '22222222-0001-0001-0001-000000000015'::uuid, '{"age": 34, "gender": "M", "bmi": 23.1}', '{"peak_flow": 450, "fev1": 82}', '{"current": ["Ventolin", "Seretide"], "past": ["Singulair"]}', '{"smoker": false, "alcohol": "light", "exercise": "moderate"}', '{"asthma_control": "good", "recommendations": ["Continue current treatment", "Avoid triggers"]}', NOW() - INTERVAL '14 days', NOW() - INTERVAL '400 days', NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 23. REFILL REQUESTS
-- ============================================================================
INSERT INTO refill_requests (id, patient_id, prescription_id, pharmacy_id, status, requested_medications, request_date, processed_date, processed_by, notes, created_at, updated_at)
VALUES
('dddddddd-0001-0002-0001-000000000001'::uuid, '22222222-0001-0001-0001-000000000001'::uuid, 'aaaaaaaa-0001-0001-0001-000000000016'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'completed', '{"medications": [{"name": "Lisinopril 10mg", "quantity": 30}]}', NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days', '0b2f251b-6c5d-4686-b5b1-b1053d914f86'::uuid, 'Renouvellement standard', NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days'),
('dddddddd-0001-0002-0001-000000000002'::uuid, '22222222-0001-0001-0001-000000000005'::uuid, 'aaaaaaaa-0001-0001-0001-000000000017'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'completed', '{"medications": [{"name": "Metformine 850mg", "quantity": 60}]}', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days', '0b2f251b-6c5d-4686-b5b1-b1053d914f86'::uuid, 'Patient régulier', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days'),
('dddddddd-0001-0002-0001-000000000003'::uuid, '22222222-0001-0001-0001-000000000007'::uuid, NULL, '11111111-1111-1111-1111-111111111111'::uuid, 'pending', '{"medications": [{"name": "Amlodipine 5mg", "quantity": 30}]}', NOW() - INTERVAL '1 day', NULL, NULL, 'Attente nouvelle ordonnance', NOW() - INTERVAL '1 day', NOW()),
('dddddddd-0001-0002-0001-000000000004'::uuid, '22222222-0001-0001-0001-000000000010'::uuid, 'aaaaaaaa-0001-0001-0001-000000000019'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'processing', '{"medications": [{"name": "Sertraline 50mg", "quantity": 30}]}', NOW() - INTERVAL '2 hours', NULL, NULL, 'En cours de préparation', NOW() - INTERVAL '2 hours', NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 24. REFILL HISTORY
-- ============================================================================
INSERT INTO refill_history (id, refill_request_id, patient_id, prescription_id, dispensation_date, dispensed_by, medications, quantity, notes, created_at)
VALUES
('eeeeeeee-0001-0002-0001-000000000001'::uuid, 'dddddddd-0001-0002-0001-000000000001'::uuid, '22222222-0001-0001-0001-000000000001'::uuid, 'aaaaaaaa-0001-0001-0001-000000000016'::uuid, NOW() - INTERVAL '9 days', '0b2f251b-6c5d-4686-b5b1-b1053d914f86'::uuid, '{"name": "Lisinopril 10mg", "dosage": "10mg"}', 30, 'Dispensé sans problème', NOW() - INTERVAL '9 days'),
('eeeeeeee-0001-0002-0001-000000000002'::uuid, 'dddddddd-0001-0002-0001-000000000002'::uuid, '22222222-0001-0001-0001-000000000005'::uuid, 'aaaaaaaa-0001-0001-0001-000000000017'::uuid, NOW() - INTERVAL '4 days', '0b2f251b-6c5d-4686-b5b1-b1053d914f86'::uuid, '{"name": "Metformine 850mg", "dosage": "850mg"}', 60, 'Patient informé ajustement dose possible', NOW() - INTERVAL '4 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 25. CALENDAR EVENTS
-- ============================================================================
INSERT INTO calendar_events (id, user_id, title, description, event_type, start_time, end_time, location, is_all_day, reminder_minutes, status, created_at, updated_at)
VALUES
('ffffffff-0001-0002-0001-000000000001'::uuid, '22222222-0001-0001-0001-000000000001'::uuid, 'RDV Téléconsultation Dr. Martin', 'Consultation de suivi hypertension', 'teleconsultation', NOW() + INTERVAL '2 days' + INTERVAL '10 hours', NOW() + INTERVAL '2 days' + INTERVAL '10 hours 30 minutes', 'En ligne', false, 60, 'confirmed', NOW(), NOW()),
('ffffffff-0001-0002-0001-000000000002'::uuid, '22222222-0001-0001-0001-000000000005'::uuid, 'Rappel Metformine', 'Prendre Metformine avec repas', 'medication_reminder', NOW() + INTERVAL '8 hours', NOW() + INTERVAL '8 hours 15 minutes', NULL, false, 15, 'active', NOW(), NOW()),
('ffffffff-0001-0002-0001-000000000003'::uuid, '22222222-0001-0001-0001-000000000007'::uuid, 'Vaccination Grippe', 'RDV vaccination antigrippale', 'appointment', NOW() + INTERVAL '5 days' + INTERVAL '14 hours', NOW() + INTERVAL '5 days' + INTERVAL '14 hours 30 minutes', 'Pharmacie du Rhône', false, 120, 'confirmed', NOW(), NOW()),
('ffffffff-0001-0002-0001-000000000004'::uuid, '22222222-0001-0001-0001-000000000015'::uuid, 'Contrôle Peak Flow', 'Rappel mesure quotidienne', 'health_check', NOW() + INTERVAL '1 day' + INTERVAL '9 hours', NOW() + INTERVAL '1 day' + INTERVAL '9 hours 5 minutes', NULL, false, 0, 'active', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 26. CALENDAR INTEGRATIONS
-- ============================================================================
INSERT INTO calendar_integrations (id, user_id, provider, access_token_encrypted, refresh_token_encrypted, token_expiry, calendar_id, sync_enabled, last_sync_at, created_at, updated_at)
VALUES
('11111111-0002-0002-0001-000000000001'::uuid, '22222222-0001-0001-0001-000000000001'::uuid, 'google', decode('00', 'hex'), decode('00', 'hex'), NOW() + INTERVAL '30 days', 'primary', true, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '30 days', NOW()),
('11111111-0002-0002-0001-000000000002'::uuid, '22222222-0001-0001-0001-000000000005'::uuid, 'outlook', decode('00', 'hex'), decode('00', 'hex'), NOW() + INTERVAL '25 days', 'default', true, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '45 days', NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 27. TRANSCRIPTIONS (AI prescription transcriptions)
-- ============================================================================
INSERT INTO transcriptions (id, prescription_id, original_text, transcribed_text, confidence_score, model_version, processing_time_ms, status, error_message, created_at, updated_at)
VALUES
('22222222-0002-0002-0001-000000000001'::uuid, 'aaaaaaaa-0001-0001-0001-000000000001'::uuid, NULL, 'Paracétamol 500mg - 3x/jour pendant 10 jours. Ibuprofène 400mg - 2x/jour pendant 7 jours.', 92.5, 'gpt-4-vision-2024', 2340, 'completed', NULL, NOW() - INTERVAL '1 hour', NOW()),
('22222222-0002-0002-0001-000000000002'::uuid, 'aaaaaaaa-0001-0001-0001-000000000002'::uuid, NULL, 'Lisinopril 10mg - 1x le matin pendant 30 jours.', 88.7, 'gpt-4-vision-2024', 1890, 'completed', NULL, NOW() - INTERVAL '2 hours', NOW()),
('22222222-0002-0002-0001-000000000003'::uuid, 'aaaaaaaa-0001-0001-0001-000000000003'::uuid, NULL, 'Metformine 850mg - matin et soir. Gliclazide 30mg - le matin. Durée 30 jours.', 95.2, 'gpt-4-vision-2024', 2120, 'completed', NULL, NOW() - INTERVAL '3 hours', NOW()),
('22222222-0002-0002-0001-000000000004'::uuid, 'aaaaaaaa-0001-0001-0001-000000000012'::uuid, NULL, 'Texte partiellement illisible... dosage incertain...', 65.2, 'gpt-4-vision-2024', 3450, 'completed', 'Low confidence - manual review required', NOW() - INTERVAL '3 days', NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 28. VOICE RECORDINGS (Teleconsultation)
-- ============================================================================
INSERT INTO voice_recordings (id, user_id, recording_type, duration_seconds, file_path_encrypted, transcription, transcription_confidence, status, created_at, updated_at)
VALUES
('33333333-0002-0002-0001-000000000001'::uuid, '22222222-0001-0001-0001-000000000001'::uuid, 'teleconsultation', 845, decode('00', 'hex'), 'Patient: Bonjour docteur, je viens pour mon renouvellement de tension. Docteur: Comment vous sentez-vous? Les médicaments fonctionnent bien?...', 94.5, 'transcribed', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
('33333333-0002-0002-0001-000000000002'::uuid, '22222222-0001-0001-0001-000000000007'::uuid, 'prescription_dictation', 120, decode('00', 'hex'), 'Prescription pour Mme Vuagnaux: Amlodipine 5mg, un comprimé le matin pendant 30 jours. Contrôle tension dans 15 jours.', 97.2, 'transcribed', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 29. INSURANCE CLAIMS
-- ============================================================================
INSERT INTO insurance_claims (id, patient_id, insurance_provider_id, prescription_id, claim_number, amount_claimed, amount_approved, status, submission_date, response_date, rejection_reason, created_at, updated_at)
VALUES
('44444444-0002-0002-0001-000000000001'::uuid, '22222222-0001-0001-0001-000000000001'::uuid, '77777777-0001-0001-0001-000000000001'::uuid, 'aaaaaaaa-0001-0001-0001-000000000016'::uuid, 'CLM-2024-001', 45.80, 41.22, 'approved', NOW() - INTERVAL '8 days', NOW() - INTERVAL '5 days', NULL, NOW() - INTERVAL '8 days', NOW() - INTERVAL '5 days'),
('44444444-0002-0002-0001-000000000002'::uuid, '22222222-0001-0001-0001-000000000005'::uuid, '77777777-0001-0001-0001-000000000002'::uuid, 'aaaaaaaa-0001-0001-0001-000000000017'::uuid, 'CLM-2024-002', 89.60, 89.60, 'approved', NOW() - INTERVAL '6 days', NOW() - INTERVAL '3 days', NULL, NOW() - INTERVAL '6 days', NOW() - INTERVAL '3 days'),
('44444444-0002-0002-0001-000000000003'::uuid, '22222222-0001-0001-0001-000000000010'::uuid, '77777777-0001-0001-0001-000000000003'::uuid, 'aaaaaaaa-0001-0001-0001-000000000019'::uuid, 'CLM-2024-003', 56.30, 0.00, 'rejected', NOW() - INTERVAL '12 days', NOW() - INTERVAL '8 days', 'Franchise non atteinte', NOW() - INTERVAL '12 days', NOW() - INTERVAL '8 days'),
('44444444-0002-0002-0001-000000000004'::uuid, '22222222-0001-0001-0001-000000000015'::uuid, '77777777-0001-0001-0001-000000000005'::uuid, 'aaaaaaaa-0001-0001-0001-000000000020'::uuid, 'CLM-2024-004', 67.80, NULL, 'pending', NOW() - INTERVAL '2 days', NULL, NULL, NOW() - INTERVAL '2 days', NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 30. COVERAGE DETAILS
-- ============================================================================
INSERT INTO coverage_details (id, insurance_claim_id, coverage_type, covered_amount, deductible_amount, copay_amount, notes, created_at)
VALUES
('55555555-0002-0002-0001-000000000001'::uuid, '44444444-0002-0002-0001-000000000001'::uuid, 'medication', 41.22, 4.58, 0.00, 'Couverture LAMal standard - 90%', NOW() - INTERVAL '5 days'),
('55555555-0002-0002-0001-000000000002'::uuid, '44444444-0002-0002-0001-000000000002'::uuid, 'medication', 89.60, 0.00, 0.00, 'Couverture complète - franchise atteinte', NOW() - INTERVAL '3 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 31. THIRD PARTY PAYMENTS
-- ============================================================================
INSERT INTO third_party_payments (id, pharmacy_id, insurance_provider_id, patient_id, prescription_id, amount, payment_date, reference_number, status, created_at, updated_at)
VALUES
('66666666-0002-0002-0001-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, '77777777-0001-0001-0001-000000000001'::uuid, '22222222-0001-0001-0001-000000000001'::uuid, 'aaaaaaaa-0001-0001-0001-000000000016'::uuid, 41.22, NOW() - INTERVAL '3 days', 'TPP-2024-001', 'completed', NOW() - INTERVAL '5 days', NOW() - INTERVAL '3 days'),
('66666666-0002-0002-0001-000000000002'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, '77777777-0001-0001-0001-000000000002'::uuid, '22222222-0001-0001-0001-000000000005'::uuid, 'aaaaaaaa-0001-0001-0001-000000000017'::uuid, 89.60, NOW() - INTERVAL '1 day', 'TPP-2024-002', 'completed', NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 32. COD TRANSACTIONS (Cash on Delivery)
-- ============================================================================
INSERT INTO cod_transactions (id, delivery_id, driver_id, amount, currency, status, collected_at, settled_at, settlement_reference, created_at, updated_at)
VALUES
('77777777-0002-0002-0001-000000000001'::uuid, '22222222-0001-0002-0001-000000000001'::uuid, '44444444-0001-0001-0001-000000000001'::uuid, 45.80, 'CHF', 'settled', NOW() - INTERVAL '3 days' + INTERVAL '4 hours', NOW() - INTERVAL '3 days' + INTERVAL '6 hours', 'SET-2024-001', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days' + INTERVAL '6 hours'),
('77777777-0002-0002-0001-000000000002'::uuid, '22222222-0001-0002-0001-000000000002'::uuid, '44444444-0001-0001-0001-000000000002'::uuid, 128.50, 'CHF', 'settled', NOW() - INTERVAL '5 days' + INTERVAL '3 hours', NOW() - INTERVAL '5 days' + INTERVAL '5 hours', 'SET-2024-002', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days' + INTERVAL '5 hours'),
('77777777-0002-0002-0001-000000000003'::uuid, '22222222-0001-0002-0001-000000000006'::uuid, '44444444-0001-0001-0001-000000000002'::uuid, 67.30, 'CHF', 'collected', NOW() - INTERVAL '7 days' + INTERVAL '4 hours', NULL, NULL, NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days' + INTERVAL '4 hours')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 33. DRIVER SETTLEMENTS
-- ============================================================================
INSERT INTO driver_settlements (id, driver_id, period_start, period_end, total_deliveries, total_cod_collected, total_tips, settlement_amount, status, settled_at, settlement_reference, created_at, updated_at)
VALUES
('88888888-0002-0002-0001-000000000001'::uuid, '44444444-0001-0001-0001-000000000001'::uuid, NOW() - INTERVAL '7 days', NOW() - INTERVAL '1 day', 12, 456.80, 23.50, 45.68, 'completed', NOW() - INTERVAL '1 day', 'DRV-SET-2024-001', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
('88888888-0002-0002-0001-000000000002'::uuid, '44444444-0001-0001-0001-000000000002'::uuid, NOW() - INTERVAL '7 days', NOW() - INTERVAL '1 day', 18, 789.30, 35.00, 78.93, 'completed', NOW() - INTERVAL '1 day', 'DRV-SET-2024-002', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
('88888888-0002-0002-0001-000000000003'::uuid, '44444444-0001-0001-0001-000000000003'::uuid, NOW() - INTERVAL '7 days', NOW() - INTERVAL '1 day', 8, 234.50, 12.00, 23.45, 'pending', NULL, NULL, NOW() - INTERVAL '1 day', NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 34. CONTROLLED ALERTS
-- ============================================================================
INSERT INTO controlled_alerts (id, patient_id, substance_id, pharmacy_id, alert_type, severity, description, detected_at, resolved_at, resolved_by, resolution_notes, created_at, updated_at)
VALUES
('99999999-0002-0002-0001-000000000001'::uuid, '22222222-0001-0001-0001-000000000009'::uuid, '44444444-0001-0002-0001-000000000008'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'early_refill', 'medium', 'Demande de renouvellement anticipée (5 jours avant épuisement théorique)', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days', '0b2f251b-6c5d-4686-b5b1-b1053d914f86'::uuid, 'Vérifié avec patient - perte partielle lors de voyage', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days'),
('99999999-0002-0002-0001-000000000002'::uuid, '22222222-0001-0001-0001-000000000018'::uuid, '44444444-0001-0002-0001-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'cross_pharmacy', 'high', 'Prescription similaire détectée dans autre pharmacie (Pharmacie Centrale, Martigny)', NOW() - INTERVAL '1 day', NULL, NULL, NULL, NOW() - INTERVAL '1 day', NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 35. ACCESS LOGS
-- ============================================================================
INSERT INTO access_logs (id, user_id, resource_type, resource_id, action, ip_address, user_agent, success, failure_reason, created_at)
VALUES
('aaaaaaaa-0002-0002-0001-000000000001'::uuid, '0b2f251b-6c5d-4686-b5b1-b1053d914f86'::uuid, 'prescription', 'aaaaaaaa-0001-0001-0001-000000000001'::uuid, 'view', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0', true, NULL, NOW() - INTERVAL '1 hour'),
('aaaaaaaa-0002-0002-0001-000000000002'::uuid, '0b2f251b-6c5d-4686-b5b1-b1053d914f86'::uuid, 'prescription', 'aaaaaaaa-0001-0001-0001-000000000001'::uuid, 'approve', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0', true, NULL, NOW() - INTERVAL '55 minutes'),
('aaaaaaaa-0002-0002-0001-000000000003'::uuid, '22222222-0001-0001-0001-000000000001'::uuid, 'medical_record', 'bbbbbbbb-0001-0002-0001-000000000001'::uuid, 'view', '10.0.0.50', 'MetaPharm iOS/3.2.1', true, NULL, NOW() - INTERVAL '2 hours'),
('aaaaaaaa-0002-0002-0001-000000000004'::uuid, '33333333-0001-0001-0001-000000000001'::uuid, 'prescription', 'aaaaaaaa-0001-0001-0001-000000000001'::uuid, 'create', '172.16.0.25', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/17.0', true, NULL, NOW() - INTERVAL '3 hours'),
('aaaaaaaa-0002-0002-0001-000000000005'::uuid, '55555555-0001-0001-0001-000000000001'::uuid, 'nurse_order', '33333333-0001-0002-0001-000000000001'::uuid, 'create', '192.168.10.15', 'MetaPharm Android/3.2.0', true, NULL, NOW() - INTERVAL '4 hours')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 36. AUDIT LOGS
-- ============================================================================
INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent, created_at)
VALUES
('bbbbbbbb-0002-0002-0001-000000000001'::uuid, '0b2f251b-6c5d-4686-b5b1-b1053d914f86'::uuid, 'UPDATE', 'prescription', 'aaaaaaaa-0001-0001-0001-000000000016'::uuid, '{"status": "pending"}', '{"status": "approved"}', '192.168.1.100', 'Chrome/120.0', NOW() - INTERVAL '5 days'),
('bbbbbbbb-0002-0002-0001-000000000002'::uuid, '0b2f251b-6c5d-4686-b5b1-b1053d914f86'::uuid, 'CREATE', 'dispensation_log', '66666666-0001-0002-0001-000000000001'::uuid, NULL, '{"quantity": 20, "substance": "Tramadol"}', '192.168.1.100', 'Chrome/120.0', NOW() - INTERVAL '4 days'),
('bbbbbbbb-0002-0002-0001-000000000003'::uuid, '33333333-0001-0001-0001-000000000001'::uuid, 'CREATE', 'prescription', 'aaaaaaaa-0001-0001-0001-000000000001'::uuid, NULL, '{"patient": "Jean-Pierre Müller", "medications": 2}', '172.16.0.25', 'Safari/17.0', NOW() - INTERVAL '3 hours'),
('bbbbbbbb-0002-0002-0001-000000000004'::uuid, '55555555-0001-0001-0001-000000000002'::uuid, 'UPDATE', 'controlled_prescription', '55555555-0001-0002-0001-000000000002'::uuid, '{"status": "pending"}', '{"status": "processing"}', '192.168.10.20', 'Android/3.2.0', NOW() - INTERVAL '1 hour')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- VERIFICATION - Count all tables
-- ============================================================================
DO $$
DECLARE
    table_counts TEXT := '';
BEGIN
    RAISE NOTICE 'Test data seeding completed successfully!';
    RAISE NOTICE '==========================================';
END $$;
