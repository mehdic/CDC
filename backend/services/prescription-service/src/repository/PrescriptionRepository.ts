/**
 * Prescription Repository
 * Data access layer for prescription operations
 */

import { DataSource, Repository } from 'typeorm';
import { Prescription, PrescriptionStatus } from '../models/Prescription';
import { Medication } from '../models/Medication';

export interface CreatePrescriptionDTO {
  patientId: string;
  doctorId: string;
  pharmacyId: string;
  medications: Array<{
    name: string;
    dosage: string;
    quantity: number;
    instructions: string;
  }>;
}

export class PrescriptionRepository {
  private prescriptionRepo: Repository<Prescription>;
  private medicationRepo: Repository<Medication>;

  constructor(dataSource: DataSource) {
    this.prescriptionRepo = dataSource.getRepository(Prescription);
    this.medicationRepo = dataSource.getRepository(Medication);
  }

  /**
   * Create a new prescription with medications
   */
  async create(data: CreatePrescriptionDTO): Promise<Prescription> {
    // Create prescription entity
    const prescription = this.prescriptionRepo.create({
      patientId: data.patientId,
      doctorId: data.doctorId,
      pharmacyId: data.pharmacyId,
      status: 'pending',
    });

    // Save prescription first to get ID
    const savedPrescription = await this.prescriptionRepo.save(prescription);

    // Create medication entities linked to prescription
    const medications = data.medications.map((med) =>
      this.medicationRepo.create({
        ...med,
        prescriptionId: savedPrescription.id,
      })
    );

    // Save medications
    await this.medicationRepo.save(medications);

    // Reload prescription with medications (eager loading)
    const fullPrescription = await this.prescriptionRepo.findOne({
      where: { id: savedPrescription.id },
      relations: ['medications'],
    });

    if (!fullPrescription) {
      throw new Error('Failed to retrieve created prescription');
    }

    return fullPrescription;
  }

  /**
   * Find all prescriptions
   */
  async findAll(): Promise<Prescription[]> {
    return this.prescriptionRepo.find({
      relations: ['medications'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Find prescription by ID
   */
  async findById(id: string): Promise<Prescription | null> {
    return this.prescriptionRepo.findOne({
      where: { id },
      relations: ['medications'],
    });
  }

  /**
   * Update prescription status
   */
  async updateStatus(
    id: string,
    status: PrescriptionStatus
  ): Promise<Prescription | null> {
    const prescription = await this.prescriptionRepo.findOne({
      where: { id },
      relations: ['medications'],
    });

    if (!prescription) {
      return null;
    }

    prescription.status = status;

    // Set dispensedAt timestamp when status becomes dispensed
    if (status === 'dispensed') {
      prescription.dispensedAt = new Date();
    }

    return this.prescriptionRepo.save(prescription);
  }

  /**
   * Delete prescription by ID (for testing)
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.prescriptionRepo.delete(id);
    return (result.affected ?? 0) > 0;
  }

  /**
   * Clear all prescriptions (for testing)
   */
  async clear(): Promise<void> {
    await this.medicationRepo.clear();
    await this.prescriptionRepo.clear();
  }
}
