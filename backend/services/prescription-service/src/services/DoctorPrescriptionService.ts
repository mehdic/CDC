/**
 * Doctor Prescription Service
 * Business logic for doctor prescription creation, template management, and sending
 * Tasks: T3-100, T3-101, T3-102
 */

import { DataSource, Repository } from 'typeorm';
import { Prescription } from '../models/Prescription';
import { PrescriptionTemplate, Templatemedication } from '../models/PrescriptionTemplate';
import { PrescriptionRepository, CreatePrescriptionDTO } from '../repository/PrescriptionRepository';

// ============================================================================
// DTOs
// ============================================================================

export interface CreatePrescriptionRequest {
  patientId: string;
  doctorId: string;
  pharmacyId: string;
  medications: Array<{
    drugName: string;
    dosage: string;
    quantity: number;
    instructions: string;
  }>;
  notes?: string;
}

export interface CreateTemplateRequest {
  doctorId: string;
  name: string;
  description?: string;
  medications: Templatemedication[];
}

export interface UpdateTemplateRequest {
  name?: string;
  description?: string;
  medications?: Templatemedication[];
}

export interface SendPrescriptionRequest {
  prescriptionId: string;
  pharmacyId: string;
  doctorId: string;
}

// ============================================================================
// Service
// ============================================================================

export class DoctorPrescriptionService {
  private prescriptionRepo: PrescriptionRepository;
  private templateRepository: Repository<PrescriptionTemplate>;

  constructor(dataSource: DataSource) {
    this.prescriptionRepo = new PrescriptionRepository(dataSource);
    this.templateRepository = dataSource.getRepository(PrescriptionTemplate);
  }

  /**
   * Create a new prescription for a doctor
   * Task: T3-100
   */
  async createPrescription(request: CreatePrescriptionRequest): Promise<Prescription> {
    // Validate inputs
    if (!request.patientId || !request.doctorId || !request.pharmacyId) {
      throw new Error('Missing required fields: patientId, doctorId, pharmacyId');
    }

    if (!request.medications || request.medications.length === 0) {
      throw new Error('At least one medication is required');
    }

    // Validate each medication
    for (const med of request.medications) {
      if (!med.drugName || !med.dosage || !med.quantity || med.quantity <= 0) {
        throw new Error(`Invalid medication: ${JSON.stringify(med)}`);
      }
    }

    // Convert to repository format
    const createDto: CreatePrescriptionDTO = {
      patientId: request.patientId,
      doctorId: request.doctorId,
      pharmacyId: request.pharmacyId,
      medications: request.medications.map((med) => ({
        name: med.drugName,
        dosage: med.dosage,
        quantity: med.quantity,
        instructions: med.instructions || '',
      })),
    };

    // Create and return prescription
    return this.prescriptionRepo.create(createDto);
  }

  /**
   * Send prescription to pharmacy
   * Task: T3-101
   * In production, this would trigger notifications and status updates
   */
  async sendPrescriptionToPharmacy(request: SendPrescriptionRequest): Promise<Prescription> {
    const { prescriptionId, pharmacyId, doctorId } = request;

    // Fetch prescription
    const prescription = await this.prescriptionRepo.findById(prescriptionId);

    if (!prescription) {
      throw new Error(`Prescription ${prescriptionId} not found`);
    }

    // Verify doctor ownership
    if (prescription.doctorId !== doctorId) {
      throw new Error('Unauthorized: Doctor does not own this prescription');
    }

    // Verify target pharmacy matches or update if needed
    if (prescription.pharmacyId !== pharmacyId) {
      throw new Error('Prescription already sent to a different pharmacy');
    }

    // In a real system, this would:
    // 1. Send notification to pharmacist
    // 2. Add to pharmacist's queue
    // 3. Log the send event
    // For now, we just return the prescription confirming it's ready to be sent

    return prescription;
  }

  /**
   * Create a prescription template for quick reuse
   * Task: T3-102
   */
  async createTemplate(request: CreateTemplateRequest): Promise<PrescriptionTemplate> {
    const { doctorId, name, description, medications } = request;

    // Validate inputs
    if (!doctorId || !name) {
      throw new Error('Missing required fields: doctorId, name');
    }

    if (!medications || medications.length === 0) {
      throw new Error('Template must contain at least one medication');
    }

    // Validate medications
    for (const med of medications) {
      if (!med.drugName || !med.dosage || !med.quantity || med.quantity <= 0) {
        throw new Error(`Invalid medication in template: ${JSON.stringify(med)}`);
      }
    }

    // Check for duplicate template names for this doctor
    const existing = await this.templateRepository.findOne({
      where: {
        doctorId,
        name,
      },
    });

    if (existing) {
      throw new Error(`Template with name "${name}" already exists for this doctor`);
    }

    // Create template
    const template = this.templateRepository.create({
      doctorId,
      name,
      description,
      medications,
    });

    return this.templateRepository.save(template);
  }

  /**
   * Get all templates for a doctor
   * Task: T3-102
   */
  async getTemplates(doctorId: string): Promise<PrescriptionTemplate[]> {
    return this.templateRepository.find({
      where: { doctorId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get a specific template by ID
   * Task: T3-102
   */
  async getTemplate(templateId: string, doctorId: string): Promise<PrescriptionTemplate | null> {
    return this.templateRepository.findOne({
      where: {
        id: templateId,
        doctorId,
      },
    });
  }

  /**
   * Update a template
   * Task: T3-102
   */
  async updateTemplate(
    templateId: string,
    doctorId: string,
    request: UpdateTemplateRequest
  ): Promise<PrescriptionTemplate | null> {
    const template = await this.getTemplate(templateId, doctorId);

    if (!template) {
      return null;
    }

    // Validate medications if updating
    if (request.medications) {
      if (request.medications.length === 0) {
        throw new Error('Template must contain at least one medication');
      }

      for (const med of request.medications) {
        if (!med.drugName || !med.dosage || !med.quantity || med.quantity <= 0) {
          throw new Error(`Invalid medication in template: ${JSON.stringify(med)}`);
        }
      }
    }

    // Update fields
    if (request.name) {
      template.name = request.name;
    }
    if (request.description !== undefined) {
      template.description = request.description;
    }
    if (request.medications) {
      template.medications = request.medications;
    }

    return this.templateRepository.save(template);
  }

  /**
   * Delete a template
   * Task: T3-102
   */
  async deleteTemplate(templateId: string, doctorId: string): Promise<boolean> {
    const template = await this.getTemplate(templateId, doctorId);

    if (!template) {
      return false;
    }

    await this.templateRepository.remove(template);
    return true;
  }

  /**
   * Create prescription from template
   * Task: T3-102
   */
  async createPrescriptionFromTemplate(
    templateId: string,
    doctorId: string,
    patientId: string,
    pharmacyId: string,
    overrides?: Partial<CreatePrescriptionRequest>
  ): Promise<Prescription> {
    const template = await this.getTemplate(templateId, doctorId);

    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Create prescription with template medications
    const request: CreatePrescriptionRequest = {
      patientId,
      doctorId,
      pharmacyId,
      medications: template.medications,
      ...overrides,
    };

    return this.createPrescription(request);
  }
}
