/**
 * Prescription Service (Database Version)
 * Main Express server for prescription management
 *
 * Endpoints:
 * - POST /api/prescriptions - Create new prescription
 * - GET /api/prescriptions - List all prescriptions
 * - GET /api/prescriptions/:id - Get prescription by ID
 * - PATCH /api/prescriptions/:id/status - Update prescription status
 * - GET /health - Health check
 */

import dotenv from 'dotenv';

// Load environment variables FIRST (before any imports that depend on them)
dotenv.config();

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { initializeDatabase, closeDatabase, AppDataSource, isMockMode } from './config/database';
import { PrescriptionRepository } from './repository/PrescriptionRepository';
import { PrescriptionStatus } from './models/Prescription';

// Import route modules (with validation) - only used in non-mock mode
import prescriptionRoutes from './routes/prescriptions';
import listRoutes from './routes/list';
import approveRoutes from './routes/approve';
import rejectRoutes from './routes/reject';
import transcribeRoutes from './routes/transcribe';
import validateRoutes from './routes/validate';
import clarificationRoutes from './routes/clarification';
import productRoutes from './routes/products';

// ============================================================================
// Mock Data for Development
// ============================================================================

const MOCK_PRESCRIPTIONS = [
  // PENDING prescriptions (5)
  {
    id: 'presc-001',
    pharmacy_id: 'pharm-001',
    patient_id: 'pat-001',
    patient: { id: 'pat-001', first_name: 'Jean-Pierre', last_name: 'Müller' },
    prescribing_doctor_id: 'doc-001',
    prescribing_doctor: { id: 'doc-001', first_name: 'Marie', last_name: 'Martin' },
    status: 'pending',
    source: 'patient_upload',
    ai_confidence_score: 92.5,
    items: [
      { id: 'item-001', medication_name: 'Paracétamol 500mg', quantity: 30, dosage: '3x/jour', frequency: '3 fois par jour', duration: '10 jours' },
      { id: 'item-002', medication_name: 'Ibuprofène 400mg', quantity: 20, dosage: '2x/jour', frequency: '2 fois par jour', duration: '7 jours' },
    ],
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date().toISOString(),
    drug_interactions: [],
    allergy_warnings: [],
    contraindications: [],
  },
  {
    id: 'presc-002',
    pharmacy_id: 'pharm-001',
    patient_id: 'pat-002',
    patient: { id: 'pat-002', first_name: 'Françoise', last_name: 'Dubois' },
    prescribing_doctor_id: 'doc-002',
    prescribing_doctor: { id: 'doc-002', first_name: 'Pierre', last_name: 'Leroy' },
    status: 'pending',
    source: 'doctor_direct',
    ai_confidence_score: 88.7,
    items: [
      { id: 'item-003', medication_name: 'Lisinopril 10mg', quantity: 30, dosage: '1x/jour', frequency: 'le matin', duration: '30 jours' },
    ],
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date().toISOString(),
    drug_interactions: [],
    allergy_warnings: [],
    contraindications: [],
  },
  {
    id: 'presc-003',
    pharmacy_id: 'pharm-001',
    patient_id: 'pat-003',
    patient: { id: 'pat-003', first_name: 'Marc', last_name: 'Schneider' },
    prescribing_doctor_id: 'doc-003',
    prescribing_doctor: { id: 'doc-003', first_name: 'Lucie', last_name: 'Girard' },
    status: 'pending',
    source: 'teleconsultation',
    ai_confidence_score: 95.2,
    items: [
      { id: 'item-004', medication_name: 'Metformine 850mg', quantity: 60, dosage: '2x/jour', frequency: 'matin et soir', duration: '30 jours' },
      { id: 'item-005', medication_name: 'Gliclazide 30mg', quantity: 30, dosage: '1x/jour', frequency: 'le matin', duration: '30 jours' },
    ],
    created_at: new Date(Date.now() - 10800000).toISOString(),
    updated_at: new Date().toISOString(),
    drug_interactions: [],
    allergy_warnings: [],
    contraindications: [],
  },
  {
    id: 'presc-004',
    pharmacy_id: 'pharm-001',
    patient_id: 'pat-004',
    patient: { id: 'pat-004', first_name: 'Claire', last_name: 'Rochat' },
    prescribing_doctor_id: 'doc-001',
    prescribing_doctor: { id: 'doc-001', first_name: 'Marie', last_name: 'Martin' },
    status: 'pending',
    source: 'patient_upload',
    ai_confidence_score: 91.0,
    items: [
      { id: 'item-006', medication_name: 'Lévothyroxine 50µg', quantity: 30, dosage: '1x/jour', frequency: 'à jeun', duration: '30 jours' },
    ],
    created_at: new Date(Date.now() - 14400000).toISOString(),
    updated_at: new Date().toISOString(),
    drug_interactions: [],
    allergy_warnings: [],
    contraindications: [],
  },
  {
    id: 'presc-005',
    pharmacy_id: 'pharm-001',
    patient_id: 'pat-005',
    patient: { id: 'pat-005', first_name: 'André', last_name: 'Bonvin' },
    prescribing_doctor_id: 'doc-004',
    prescribing_doctor: { id: 'doc-004', first_name: 'Thomas', last_name: 'Weber' },
    status: 'pending',
    source: 'doctor_direct',
    ai_confidence_score: 89.3,
    items: [
      { id: 'item-007', medication_name: 'Atorvastatine 20mg', quantity: 30, dosage: '1x/jour', frequency: 'le soir', duration: '30 jours' },
      { id: 'item-008', medication_name: 'Aspirine Cardio 100mg', quantity: 30, dosage: '1x/jour', frequency: 'le matin', duration: '30 jours' },
    ],
    created_at: new Date(Date.now() - 18000000).toISOString(),
    updated_at: new Date().toISOString(),
    drug_interactions: [],
    allergy_warnings: [],
    contraindications: [],
  },
  {
    id: 'presc-006',
    pharmacy_id: 'pharm-001',
    patient_id: 'pat-006',
    patient: { id: 'pat-006', first_name: 'Hélène', last_name: 'Germanier' },
    prescribing_doctor_id: 'doc-002',
    prescribing_doctor: { id: 'doc-002', first_name: 'Pierre', last_name: 'Leroy' },
    status: 'pending',
    source: 'patient_upload',
    ai_confidence_score: 94.1,
    items: [
      { id: 'item-009', medication_name: 'Pantoprazole 40mg', quantity: 28, dosage: '1x/jour', frequency: 'avant le petit-déjeuner', duration: '28 jours' },
    ],
    created_at: new Date(Date.now() - 21600000).toISOString(),
    updated_at: new Date().toISOString(),
    drug_interactions: [],
    allergy_warnings: [],
    contraindications: [],
  },

  // IN_REVIEW prescriptions (5)
  {
    id: 'presc-007',
    pharmacy_id: 'pharm-001',
    patient_id: 'pat-007',
    patient: { id: 'pat-007', first_name: 'Sophie', last_name: 'Vuagnaux' },
    prescribing_doctor_id: 'doc-002',
    prescribing_doctor: { id: 'doc-002', first_name: 'Pierre', last_name: 'Leroy' },
    status: 'in_review',
    source: 'patient_upload',
    ai_confidence_score: 78.3,
    items: [
      { id: 'item-010', medication_name: 'Amoxicilline 1g', quantity: 14, dosage: '2x/jour', frequency: 'matin et soir', duration: '7 jours' },
    ],
    drug_interactions: [{ drug1: 'Amoxicilline', drug2: 'Methotrexate', severity: 'moderate', description: 'Risque de toxicité accrue' }],
    allergy_warnings: [],
    contraindications: [],
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'presc-008',
    pharmacy_id: 'pharm-001',
    patient_id: 'pat-008',
    patient: { id: 'pat-008', first_name: 'Nicolas', last_name: 'Favre' },
    prescribing_doctor_id: 'doc-003',
    prescribing_doctor: { id: 'doc-003', first_name: 'Lucie', last_name: 'Girard' },
    status: 'in_review',
    source: 'teleconsultation',
    ai_confidence_score: 82.1,
    items: [
      { id: 'item-011', medication_name: 'Pantoprazole 40mg', quantity: 28, dosage: '1x/jour', frequency: 'avant le repas', duration: '28 jours' },
      { id: 'item-012', medication_name: 'Dompéridone 10mg', quantity: 30, dosage: '3x/jour', frequency: 'avant les repas', duration: '10 jours' },
    ],
    drug_interactions: [],
    allergy_warnings: [],
    contraindications: [],
    created_at: new Date(Date.now() - 90000000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'presc-009',
    pharmacy_id: 'pharm-001',
    patient_id: 'pat-009',
    patient: { id: 'pat-009', first_name: 'Isabelle', last_name: 'Crettenand' },
    prescribing_doctor_id: 'doc-001',
    prescribing_doctor: { id: 'doc-001', first_name: 'Marie', last_name: 'Martin' },
    status: 'in_review',
    source: 'doctor_direct',
    ai_confidence_score: 76.8,
    items: [
      { id: 'item-013', medication_name: 'Tramadol 50mg', quantity: 20, dosage: 'si douleur', frequency: 'max 4x/jour', duration: '5 jours' },
    ],
    drug_interactions: [{ drug1: 'Tramadol', drug2: 'SSRI', severity: 'high', description: 'Risque de syndrome sérotoninergique' }],
    allergy_warnings: [],
    contraindications: [],
    created_at: new Date(Date.now() - 93600000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'presc-010',
    pharmacy_id: 'pharm-001',
    patient_id: 'pat-010',
    patient: { id: 'pat-010', first_name: 'Olivier', last_name: 'Zufferey' },
    prescribing_doctor_id: 'doc-004',
    prescribing_doctor: { id: 'doc-004', first_name: 'Thomas', last_name: 'Weber' },
    status: 'in_review',
    source: 'patient_upload',
    ai_confidence_score: 85.5,
    items: [
      { id: 'item-014', medication_name: 'Alprazolam 0.25mg', quantity: 30, dosage: 'si anxiété', frequency: 'max 3x/jour', duration: '14 jours' },
    ],
    drug_interactions: [],
    allergy_warnings: [],
    contraindications: [],
    created_at: new Date(Date.now() - 97200000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'presc-011',
    pharmacy_id: 'pharm-001',
    patient_id: 'pat-011',
    patient: { id: 'pat-011', first_name: 'Véronique', last_name: 'Délèze' },
    prescribing_doctor_id: 'doc-003',
    prescribing_doctor: { id: 'doc-003', first_name: 'Lucie', last_name: 'Girard' },
    status: 'in_review',
    source: 'teleconsultation',
    ai_confidence_score: 79.9,
    items: [
      { id: 'item-015', medication_name: 'Fluoxétine 20mg', quantity: 30, dosage: '1x/jour', frequency: 'le matin', duration: '30 jours' },
    ],
    drug_interactions: [],
    allergy_warnings: [],
    contraindications: [],
    created_at: new Date(Date.now() - 100800000).toISOString(),
    updated_at: new Date().toISOString(),
  },

  // CLARIFICATION_NEEDED prescriptions (4)
  {
    id: 'presc-012',
    pharmacy_id: 'pharm-001',
    patient_id: 'pat-012',
    patient: { id: 'pat-012', first_name: 'Anne-Marie', last_name: 'Blanc' },
    prescribing_doctor_id: 'doc-003',
    prescribing_doctor: { id: 'doc-003', first_name: 'Lucie', last_name: 'Girard' },
    status: 'clarification_needed',
    source: 'patient_upload',
    ai_confidence_score: 65.2,
    items: [
      { id: 'item-016', medication_name: 'Médicament illisible', quantity: 1, dosage: 'À clarifier', frequency: 'À clarifier', duration: 'À clarifier' },
    ],
    rejection_reason: 'Écriture illisible sur l\'ordonnance. Confirmation du médecin requise.',
    drug_interactions: [],
    allergy_warnings: [],
    contraindications: [],
    created_at: new Date(Date.now() - 259200000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'presc-013',
    pharmacy_id: 'pharm-001',
    patient_id: 'pat-013',
    patient: { id: 'pat-013', first_name: 'Pierre-Alain', last_name: 'Mottet' },
    prescribing_doctor_id: 'doc-002',
    prescribing_doctor: { id: 'doc-002', first_name: 'Pierre', last_name: 'Leroy' },
    status: 'clarification_needed',
    source: 'patient_upload',
    ai_confidence_score: 58.9,
    items: [
      { id: 'item-017', medication_name: 'Antibiotique non identifié', quantity: 1, dosage: 'À confirmer', frequency: 'À confirmer', duration: 'À confirmer' },
    ],
    rejection_reason: 'Photo floue. Merci de renvoyer une photo plus nette.',
    drug_interactions: [],
    allergy_warnings: [],
    contraindications: [],
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'presc-014',
    pharmacy_id: 'pharm-001',
    patient_id: 'pat-014',
    patient: { id: 'pat-014', first_name: 'Valérie', last_name: 'Thurre' },
    prescribing_doctor_id: 'doc-001',
    prescribing_doctor: { id: 'doc-001', first_name: 'Marie', last_name: 'Martin' },
    status: 'clarification_needed',
    source: 'teleconsultation',
    ai_confidence_score: 72.1,
    items: [
      { id: 'item-018', medication_name: 'Prednisone', quantity: 1, dosage: 'Posologie incomplète', frequency: 'À préciser', duration: 'À préciser' },
    ],
    rejection_reason: 'Durée du traitement non spécifiée. Merci de préciser.',
    drug_interactions: [],
    allergy_warnings: [],
    contraindications: [],
    created_at: new Date(Date.now() - 345600000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'presc-015',
    pharmacy_id: 'pharm-001',
    patient_id: 'pat-015',
    patient: { id: 'pat-015', first_name: 'Maurice', last_name: 'Corthay' },
    prescribing_doctor_id: 'doc-004',
    prescribing_doctor: { id: 'doc-004', first_name: 'Thomas', last_name: 'Weber' },
    status: 'clarification_needed',
    source: 'patient_upload',
    ai_confidence_score: 61.5,
    items: [
      { id: 'item-019', medication_name: 'Dosage incertain', quantity: 1, dosage: '?', frequency: '?', duration: '?' },
    ],
    rejection_reason: 'Le dosage n\'est pas lisible. Veuillez confirmer avec le médecin.',
    drug_interactions: [],
    allergy_warnings: [],
    contraindications: [],
    created_at: new Date(Date.now() - 400000000).toISOString(),
    updated_at: new Date().toISOString(),
  },

  // APPROVED prescriptions (6)
  {
    id: 'presc-016',
    pharmacy_id: 'pharm-001',
    patient_id: 'pat-016',
    patient: { id: 'pat-016', first_name: 'Michel', last_name: 'Favre' },
    prescribing_doctor_id: 'doc-001',
    prescribing_doctor: { id: 'doc-001', first_name: 'Marie', last_name: 'Martin' },
    status: 'approved',
    source: 'teleconsultation',
    ai_confidence_score: 98.1,
    items: [
      { id: 'item-020', medication_name: 'Oméprazole 20mg', quantity: 28, dosage: '1x/jour', frequency: 'le matin', duration: '28 jours' },
      { id: 'item-021', medication_name: 'Gaviscon', quantity: 1, dosage: 'si besoin', frequency: 'après les repas', duration: 'selon besoin' },
    ],
    drug_interactions: [],
    allergy_warnings: [],
    contraindications: [],
    created_at: new Date(Date.now() - 432000000).toISOString(),
    updated_at: new Date(Date.now() - 345600000).toISOString(),
    approved_at: new Date(Date.now() - 345600000).toISOString(),
  },
  {
    id: 'presc-017',
    pharmacy_id: 'pharm-001',
    patient_id: 'pat-017',
    patient: { id: 'pat-017', first_name: 'Christine', last_name: 'Rausis' },
    prescribing_doctor_id: 'doc-004',
    prescribing_doctor: { id: 'doc-004', first_name: 'Thomas', last_name: 'Weber' },
    status: 'approved',
    source: 'doctor_direct',
    ai_confidence_score: 99.2,
    items: [
      { id: 'item-022', medication_name: 'Dafalgan 1g', quantity: 16, dosage: '4x/jour max', frequency: 'toutes les 6h', duration: '4 jours' },
    ],
    drug_interactions: [],
    allergy_warnings: [],
    contraindications: [],
    created_at: new Date(Date.now() - 518400000).toISOString(),
    updated_at: new Date(Date.now() - 432000000).toISOString(),
    approved_at: new Date(Date.now() - 432000000).toISOString(),
  },
  {
    id: 'presc-018',
    pharmacy_id: 'pharm-001',
    patient_id: 'pat-018',
    patient: { id: 'pat-018', first_name: 'Bernard', last_name: 'Héritier' },
    prescribing_doctor_id: 'doc-002',
    prescribing_doctor: { id: 'doc-002', first_name: 'Pierre', last_name: 'Leroy' },
    status: 'approved',
    source: 'patient_upload',
    ai_confidence_score: 94.7,
    items: [
      { id: 'item-023', medication_name: 'Amlodipine 5mg', quantity: 30, dosage: '1x/jour', frequency: 'le matin', duration: '30 jours' },
      { id: 'item-024', medication_name: 'Ramipril 5mg', quantity: 30, dosage: '1x/jour', frequency: 'le soir', duration: '30 jours' },
    ],
    drug_interactions: [],
    allergy_warnings: [],
    contraindications: [],
    created_at: new Date(Date.now() - 604800000).toISOString(),
    updated_at: new Date(Date.now() - 518400000).toISOString(),
    approved_at: new Date(Date.now() - 518400000).toISOString(),
  },
  {
    id: 'presc-019',
    pharmacy_id: 'pharm-001',
    patient_id: 'pat-019',
    patient: { id: 'pat-019', first_name: 'Marie-José', last_name: 'Carron' },
    prescribing_doctor_id: 'doc-003',
    prescribing_doctor: { id: 'doc-003', first_name: 'Lucie', last_name: 'Girard' },
    status: 'approved',
    source: 'teleconsultation',
    ai_confidence_score: 96.3,
    items: [
      { id: 'item-025', medication_name: 'Sertraline 50mg', quantity: 30, dosage: '1x/jour', frequency: 'le matin', duration: '30 jours' },
    ],
    drug_interactions: [],
    allergy_warnings: [],
    contraindications: [],
    created_at: new Date(Date.now() - 691200000).toISOString(),
    updated_at: new Date(Date.now() - 604800000).toISOString(),
    approved_at: new Date(Date.now() - 604800000).toISOString(),
  },
  {
    id: 'presc-020',
    pharmacy_id: 'pharm-001',
    patient_id: 'pat-020',
    patient: { id: 'pat-020', first_name: 'Alain', last_name: 'Bagnoud' },
    prescribing_doctor_id: 'doc-001',
    prescribing_doctor: { id: 'doc-001', first_name: 'Marie', last_name: 'Martin' },
    status: 'approved',
    source: 'doctor_direct',
    ai_confidence_score: 97.8,
    items: [
      { id: 'item-026', medication_name: 'Ventolin 100µg', quantity: 1, dosage: '2 bouffées', frequency: 'si besoin', duration: 'selon besoin' },
      { id: 'item-027', medication_name: 'Sérétide 250', quantity: 1, dosage: '2 bouffées', frequency: '2x/jour', duration: '30 jours' },
    ],
    drug_interactions: [],
    allergy_warnings: [],
    contraindications: [],
    created_at: new Date(Date.now() - 777600000).toISOString(),
    updated_at: new Date(Date.now() - 691200000).toISOString(),
    approved_at: new Date(Date.now() - 691200000).toISOString(),
  },
  {
    id: 'presc-021',
    pharmacy_id: 'pharm-001',
    patient_id: 'pat-021',
    patient: { id: 'pat-021', first_name: 'Sylvie', last_name: 'Besse' },
    prescribing_doctor_id: 'doc-002',
    prescribing_doctor: { id: 'doc-002', first_name: 'Pierre', last_name: 'Leroy' },
    status: 'approved',
    source: 'teleconsultation',
    ai_confidence_score: 95.5,
    items: [
      { id: 'item-028', medication_name: 'Citalopram 20mg', quantity: 30, dosage: '1x/jour', frequency: 'le matin', duration: '30 jours' },
    ],
    drug_interactions: [],
    allergy_warnings: [],
    contraindications: [],
    created_at: new Date(Date.now() - 800000000).toISOString(),
    updated_at: new Date(Date.now() - 750000000).toISOString(),
    approved_at: new Date(Date.now() - 750000000).toISOString(),
  },

  // REJECTED prescriptions (4)
  {
    id: 'presc-022',
    pharmacy_id: 'pharm-001',
    patient_id: 'pat-022',
    patient: { id: 'pat-022', first_name: 'Stéphane', last_name: 'Roh' },
    prescribing_doctor_id: 'doc-002',
    prescribing_doctor: { id: 'doc-002', first_name: 'Pierre', last_name: 'Leroy' },
    status: 'rejected',
    source: 'patient_upload',
    ai_confidence_score: 45.2,
    items: [
      { id: 'item-029', medication_name: 'Document non médical', quantity: 0, dosage: 'N/A', frequency: 'N/A', duration: 'N/A' },
    ],
    rejection_reason: 'Document uploadé n\'est pas une ordonnance médicale valide.',
    drug_interactions: [],
    allergy_warnings: [],
    contraindications: [],
    created_at: new Date(Date.now() - 864000000).toISOString(),
    updated_at: new Date(Date.now() - 777600000).toISOString(),
  },
  {
    id: 'presc-023',
    pharmacy_id: 'pharm-001',
    patient_id: 'pat-023',
    patient: { id: 'pat-023', first_name: 'Nathalie', last_name: 'Fournier' },
    prescribing_doctor_id: 'doc-004',
    prescribing_doctor: { id: 'doc-004', first_name: 'Thomas', last_name: 'Weber' },
    status: 'rejected',
    source: 'patient_upload',
    ai_confidence_score: 38.7,
    items: [
      { id: 'item-030', medication_name: 'Ordonnance expirée', quantity: 0, dosage: 'N/A', frequency: 'N/A', duration: 'N/A' },
    ],
    rejection_reason: 'Ordonnance datée de plus de 3 mois. Veuillez obtenir une nouvelle prescription.',
    drug_interactions: [],
    allergy_warnings: [],
    contraindications: [],
    created_at: new Date(Date.now() - 950400000).toISOString(),
    updated_at: new Date(Date.now() - 864000000).toISOString(),
  },
  {
    id: 'presc-024',
    pharmacy_id: 'pharm-001',
    patient_id: 'pat-024',
    patient: { id: 'pat-024', first_name: 'Laurent', last_name: 'Dorsaz' },
    prescribing_doctor_id: 'doc-003',
    prescribing_doctor: { id: 'doc-003', first_name: 'Lucie', last_name: 'Girard' },
    status: 'rejected',
    source: 'teleconsultation',
    ai_confidence_score: 52.1,
    items: [
      { id: 'item-031', medication_name: 'Substance contrôlée', quantity: 1, dosage: 'Non autorisé', frequency: 'N/A', duration: 'N/A' },
    ],
    rejection_reason: 'Cette substance nécessite une ordonnance sécurisée. Veuillez consulter en personne.',
    drug_interactions: [],
    allergy_warnings: [{ allergen: 'Codéine', reaction_type: 'Allergie connue', severity: 'high' }],
    contraindications: [],
    created_at: new Date(Date.now() - 1036800000).toISOString(),
    updated_at: new Date(Date.now() - 950400000).toISOString(),
  },
  {
    id: 'presc-025',
    pharmacy_id: 'pharm-001',
    patient_id: 'pat-025',
    patient: { id: 'pat-025', first_name: 'Patrick', last_name: 'Fellay' },
    prescribing_doctor_id: 'doc-001',
    prescribing_doctor: { id: 'doc-001', first_name: 'Marie', last_name: 'Martin' },
    status: 'rejected',
    source: 'patient_upload',
    ai_confidence_score: 40.3,
    items: [
      { id: 'item-032', medication_name: 'Image illisible', quantity: 0, dosage: 'N/A', frequency: 'N/A', duration: 'N/A' },
    ],
    rejection_reason: 'Image trop sombre pour être traitée. Veuillez reprendre la photo avec un meilleur éclairage.',
    drug_interactions: [],
    allergy_warnings: [],
    contraindications: [],
    created_at: new Date(Date.now() - 1100000000).toISOString(),
    updated_at: new Date(Date.now() - 1050000000).toISOString(),
  },
];

// ============================================================================
// Configuration
// ============================================================================

const PORT = process.env.PRESCRIPTION_SERVICE_PORT || 4003;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CORS_ORIGIN = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : ['http://localhost:3000'];

// ============================================================================
// Data Models (for API validation)
// ============================================================================

interface MedicationDTO {
  name: string;
  dosage: string;
  quantity: number;
  instructions: string;
}

// ============================================================================
// Validation Functions
// ============================================================================

function isValidStatus(status: string): status is PrescriptionStatus {
  return ['pending', 'dispensed', 'cancelled'].includes(status);
}

function isValidStatusTransition(currentStatus: string, newStatus: string): boolean {
  // Only pending prescriptions can transition to dispensed or cancelled
  if (currentStatus === 'pending') {
    return newStatus === 'dispensed' || newStatus === 'cancelled';
  }
  // Dispensed and cancelled are terminal states
  return false;
}

function validateMedications(medications: any): medications is MedicationDTO[] {
  if (!Array.isArray(medications) || medications.length === 0) {
    return false;
  }

  return medications.every(med =>
    med &&
    typeof med.name === 'string' && med.name.trim() !== '' &&
    typeof med.dosage === 'string' && med.dosage.trim() !== '' &&
    typeof med.quantity === 'number' && med.quantity > 0 &&
    typeof med.instructions === 'string' && med.instructions.trim() !== ''
  );
}

// ============================================================================
// Express App Setup
// ============================================================================

const app: Express = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware (development only)
if (NODE_ENV === 'development') {
  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
  });
}

// ============================================================================
// Repository Initialization
// ============================================================================

let prescriptionRepository: PrescriptionRepository;

// Initialize repository for tests (will be overridden in startServer for production)
if (NODE_ENV === 'test') {
  // In test mode, create a dummy DataSource that will be mocked by jest
  prescriptionRepository = new PrescriptionRepository(AppDataSource);
  // Make dataSource available to controllers in test mode
  app.locals.dataSource = AppDataSource;
}

// ============================================================================
// Health Check
// ============================================================================

app.get('/health', async (_req: Request, res: Response) => {
  try {
    // Check database connection
    const dbHealthy = AppDataSource.isInitialized;

    res.status(dbHealthy ? 200 : 503).json({
      status: dbHealthy ? 'healthy' : 'unhealthy',
      service: 'prescription-service',
      database: dbHealthy ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      service: 'prescription-service',
      database: 'error',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  }
});

// ============================================================================
// Mock Routes for Development (before database routes)
// ============================================================================

if (isMockMode) {
  console.log('📋 Running in MOCK MODE - using sample prescription data');

  // Handler for listing prescriptions (mock)
  const handleListPrescriptions = (_req: Request, res: Response) => {
    const { status, limit = '100' } = _req.query;
    let filtered = [...MOCK_PRESCRIPTIONS];

    // Filter by status if provided
    if (status) {
      const statusArray = Array.isArray(status) ? status : [status];
      filtered = filtered.filter(p => statusArray.includes(p.status));
    }

    // Apply limit
    const limitNum = parseInt(limit as string) || 100;
    filtered = filtered.slice(0, limitNum);

    res.json({
      prescriptions: filtered,
      pagination: {
        page: 1,
        limit: limitNum,
        total_items: filtered.length,
        total_pages: 1,
        has_next_page: false,
        has_prev_page: false,
      },
      filters_applied: { status },
    });
  };

  // GET /prescriptions - List prescriptions (mock) - both with and without trailing slash
  app.get('/prescriptions', handleListPrescriptions);
  app.get('/prescriptions/', handleListPrescriptions);

  // GET /prescriptions/:id - Get single prescription (mock)
  app.get('/prescriptions/:id', (req: Request, res: Response) => {
    const prescription = MOCK_PRESCRIPTIONS.find(p => p.id === req.params.id);
    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }
    return res.json(prescription);
  });

  // POST /prescriptions/:id/validate - Validate prescription (mock)
  app.post('/prescriptions/:id/validate', (req: Request, res: Response) => {
    const prescription = MOCK_PRESCRIPTIONS.find(p => p.id === req.params.id);
    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }
    return res.json({
      success: true,
      message: 'Prescription validated successfully',
      prescription: {
        ...prescription,
        status: 'in_review',
        validated_at: new Date().toISOString(),
      },
      safety_checks: {
        drug_interactions: prescription.drug_interactions || [],
        allergy_warnings: prescription.allergy_warnings || [],
        contraindications: prescription.contraindications || [],
        all_clear: (prescription.drug_interactions?.length || 0) === 0 &&
                   (prescription.allergy_warnings?.length || 0) === 0 &&
                   (prescription.contraindications?.length || 0) === 0,
      },
    });
  });

  // PUT /prescriptions/:id/approve - Approve prescription (mock)
  app.put('/prescriptions/:id/approve', (req: Request, res: Response) => {
    const prescriptionIndex = MOCK_PRESCRIPTIONS.findIndex(p => p.id === req.params.id);
    if (prescriptionIndex === -1) {
      return res.status(404).json({ error: 'Prescription not found' });
    }
    const prescription = MOCK_PRESCRIPTIONS[prescriptionIndex];
    const updatedPrescription = {
      ...prescription,
      status: 'approved',
      approved_at: new Date().toISOString(),
    };
    return res.json({
      success: true,
      message: 'Prescription approved successfully',
      prescription: updatedPrescription,
    });
  });

  // PUT /prescriptions/:id/reject - Reject prescription (mock)
  app.put('/prescriptions/:id/reject', (req: Request, res: Response) => {
    const prescriptionIndex = MOCK_PRESCRIPTIONS.findIndex(p => p.id === req.params.id);
    if (prescriptionIndex === -1) {
      return res.status(404).json({ error: 'Prescription not found' });
    }
    const { reason } = req.body;
    const prescription = MOCK_PRESCRIPTIONS[prescriptionIndex];
    const updatedPrescription = {
      ...prescription,
      status: 'rejected',
      rejection_reason: reason || 'No reason provided',
      rejected_at: new Date().toISOString(),
    };
    return res.json({
      success: true,
      message: 'Prescription rejected successfully',
      prescription: updatedPrescription,
    });
  });
}

// ============================================================================
// Mount Routes with Validation (non-mock mode)
// ============================================================================

if (!isMockMode) {
  // Note: These routes use class-validator DTOs and validation middleware
  app.use('/prescriptions', prescriptionRoutes);      // POST /prescriptions (upload)
  app.use('/prescriptions', listRoutes);              // GET /prescriptions (list)
  app.use('/prescriptions', approveRoutes);           // PUT /prescriptions/:id/approve
  app.use('/prescriptions', rejectRoutes);            // PUT /prescriptions/:id/reject
  app.use('/prescriptions', transcribeRoutes);        // POST /prescriptions/:id/transcribe
  app.use('/prescriptions', validateRoutes);          // POST /prescriptions/:id/validate
  app.use('/prescriptions', clarificationRoutes);     // POST /prescriptions/:id/request-clarification
}

// Product routes (available in both mock and non-mock modes for medication autocomplete)
app.use('/products', productRoutes);                  // GET /products/search, GET /products/:id

// ============================================================================
// Legacy API Routes (for backward compatibility)
// ============================================================================

/**
 * POST /api/prescriptions - Create new prescription
 */
app.post('/api/prescriptions', async (req: Request, res: Response) => {
  try {
    const { patientId, doctorId, pharmacyId, medications } = req.body;

    // Validate required fields
    if (!patientId || !doctorId || !pharmacyId || !medications) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Missing required fields: patientId, doctorId, pharmacyId, medications',
        timestamp: new Date().toISOString(),
      });
    }

    // Validate medications array
    if (!validateMedications(medications)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid medications array. Must be non-empty array with valid medication objects (name, dosage, quantity, instructions)',
        timestamp: new Date().toISOString(),
      });
    }

    // Create prescription using repository
    const prescription = await prescriptionRepository.create({
      patientId,
      doctorId,
      pharmacyId,
      medications,
    });

    console.log(`✅ Created prescription: ${prescription.id} (${medications.length} medication(s))`);

    return res.status(201).json({
      message: 'Prescription created successfully',
      prescription: {
        id: prescription.id,
        patientId: prescription.patientId,
        doctorId: prescription.doctorId,
        pharmacyId: prescription.pharmacyId,
        medications: prescription.medications,
        status: prescription.status,
        createdAt: prescription.createdAt.toISOString(),
        updatedAt: prescription.updatedAt.toISOString(),
        dispensedAt: prescription.dispensedAt?.toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error creating prescription:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create prescription',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/prescriptions - List all prescriptions
 */
app.get('/api/prescriptions', async (_req: Request, res: Response) => {
  try {
    const prescriptions = await prescriptionRepository.findAll();

    return res.status(200).json({
      count: prescriptions.length,
      prescriptions: prescriptions.map(p => ({
        id: p.id,
        patientId: p.patientId,
        doctorId: p.doctorId,
        pharmacyId: p.pharmacyId,
        medications: p.medications,
        status: p.status,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        dispensedAt: p.dispensedAt?.toISOString(),
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch prescriptions',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/prescriptions/:id - Get prescription by ID
 */
app.get('/api/prescriptions/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const prescription = await prescriptionRepository.findById(id);

    if (!prescription) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Prescription with ID ${id} not found`,
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(200).json({
      prescription: {
        id: prescription.id,
        patientId: prescription.patientId,
        doctorId: prescription.doctorId,
        pharmacyId: prescription.pharmacyId,
        medications: prescription.medications,
        status: prescription.status,
        createdAt: prescription.createdAt.toISOString(),
        updatedAt: prescription.updatedAt.toISOString(),
        dispensedAt: prescription.dispensedAt?.toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching prescription:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch prescription',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * PATCH /api/prescriptions/:id/status - Update prescription status
 */
app.patch('/api/prescriptions/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status field
    if (!status) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Missing required field: status',
        timestamp: new Date().toISOString(),
      });
    }

    // Validate status value
    if (!isValidStatus(status)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid status. Must be one of: pending, dispensed, cancelled',
        timestamp: new Date().toISOString(),
      });
    }

    const prescription = await prescriptionRepository.findById(id);

    if (!prescription) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Prescription with ID ${id} not found`,
        timestamp: new Date().toISOString(),
      });
    }

    // Validate status transition
    if (!isValidStatusTransition(prescription.status, status)) {
      return res.status(409).json({
        error: 'Conflict',
        message: `Invalid status transition from ${prescription.status} to ${status}. Only pending prescriptions can be dispensed or cancelled.`,
        timestamp: new Date().toISOString(),
      });
    }

    // Update prescription status
    const updatedPrescription = await prescriptionRepository.updateStatus(id, status);

    if (!updatedPrescription) {
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update prescription status',
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`✅ Updated prescription status: ${id} -> ${status}`);

    return res.status(200).json({
      message: 'Prescription status updated successfully',
      prescription: {
        id: updatedPrescription.id,
        patientId: updatedPrescription.patientId,
        doctorId: updatedPrescription.doctorId,
        pharmacyId: updatedPrescription.pharmacyId,
        medications: updatedPrescription.medications,
        status: updatedPrescription.status,
        createdAt: updatedPrescription.createdAt.toISOString(),
        updatedAt: updatedPrescription.updatedAt.toISOString(),
        dispensedAt: updatedPrescription.dispensedAt?.toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating prescription status:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update prescription status',
      timestamp: new Date().toISOString(),
    });
  }
});

// ============================================================================
// Error Handling
// ============================================================================

// 404 handler
app.use((req: Request, res: Response) => {
  return res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);

  // Don't expose internal errors in production
  const message = NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;

  return res.status(500).json({
    error: 'Internal Server Error',
    message,
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// Server Initialization
// ============================================================================

async function startServer() {
  try {
    // In mock mode, skip database initialization
    if (!isMockMode) {
      // Initialize database connection
      const dataSource = await initializeDatabase();

      // Initialize repository
      prescriptionRepository = new PrescriptionRepository(dataSource);

      // Make dataSource available to controllers via app.locals
      app.locals.dataSource = dataSource;
    } else {
      console.log('⚠️  Database initialization skipped (mock mode)');
    }

    // Start Express server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Prescription Service running on port ${PORT}`);
      console.log(`📊 Environment: ${NODE_ENV}`);
      console.log(`📋 Mock mode: ${isMockMode ? 'ENABLED' : 'DISABLED'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log('\n🛑 Shutting down gracefully...');

      server.close(async () => {
        console.log('✅ HTTP server closed');
        await closeDatabase();
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('❌ Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start server if this file is executed directly
if (require.main === module) {
  startServer();
}

// Export app and repository for testing
export default app;
export { prescriptionRepository, initializeDatabase, closeDatabase };
