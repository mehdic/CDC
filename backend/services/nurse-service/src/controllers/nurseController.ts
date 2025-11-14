/**
 * Nurse Controller
 * Business logic for nurse CRUD operations
 * HIPAA/GDPR Compliant - Healthcare professional data management
 */

import { AppDataSource } from '../index';
import { Nurse } from '../models/Nurse';
import { User, UserRole } from '@shared/models/User';
import { Repository } from 'typeorm';

export class NurseController {
  private nurseRepository: Repository<Nurse>;
  private userRepository: Repository<User>;

  constructor() {
    this.nurseRepository = AppDataSource.getRepository(Nurse);
    this.userRepository = AppDataSource.getRepository(User);
  }

  /**
   * Get all nurses (with pagination)
   */
  async getAllNurses(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [nurses, total] = await this.nurseRepository.findAndCount({
      where: { deleted_at: null },
      relations: ['user'],
      take: limit,
      skip,
      order: { created_at: 'DESC' },
    });

    return {
      nurses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get nurse by ID
   */
  async getNurseById(id: string) {
    const nurse = await this.nurseRepository.findOne({
      where: { id, deleted_at: null },
      relations: ['user'],
    });

    if (!nurse) {
      throw new Error('Nurse not found');
    }

    return nurse;
  }

  /**
   * Get nurse by user ID
   */
  async getNurseByUserId(userId: string) {
    const nurse = await this.nurseRepository.findOne({
      where: { user_id: userId, deleted_at: null },
      relations: ['user'],
    });

    if (!nurse) {
      throw new Error('Nurse profile not found for this user');
    }

    return nurse;
  }

  /**
   * Create new nurse profile
   */
  async createNurse(data: {
    user_id: string;
    specialization: string;
    license_number: string;
    license_country?: string;
    certifications?: any;
  }) {
    // Verify user exists and has nurse role
    const user = await this.userRepository.findOne({
      where: { id: data.user_id },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.role !== UserRole.NURSE) {
      throw new Error('User must have nurse role');
    }

    // Check if nurse profile already exists
    const existing = await this.nurseRepository.findOne({
      where: { user_id: data.user_id },
    });

    if (existing && !existing.isDeleted()) {
      throw new Error('Nurse profile already exists for this user');
    }

    // Create nurse profile
    const nurse = this.nurseRepository.create({
      user_id: data.user_id,
      specialization: data.specialization,
      license_number: data.license_number,
      license_country: data.license_country || 'CH',
      certifications: data.certifications || null,
      is_verified: false, // Admin must verify
    });

    await this.nurseRepository.save(nurse);

    return nurse;
  }

  /**
   * Update nurse profile
   */
  async updateNurse(
    id: string,
    data: Partial<{
      specialization: string;
      license_number: string;
      license_country: string;
      certifications: any;
    }>
  ) {
    const nurse = await this.getNurseById(id);

    // Update fields
    if (data.specialization !== undefined)
      nurse.specialization = data.specialization;
    if (data.license_number !== undefined)
      nurse.license_number = data.license_number;
    if (data.license_country !== undefined)
      nurse.license_country = data.license_country;
    if (data.certifications !== undefined)
      nurse.certifications = data.certifications;

    await this.nurseRepository.save(nurse);

    return nurse;
  }

  /**
   * Verify nurse (admin only)
   */
  async verifyNurse(id: string) {
    const nurse = await this.getNurseById(id);

    nurse.is_verified = true;
    await this.nurseRepository.save(nurse);

    return nurse;
  }

  /**
   * Soft delete nurse profile
   */
  async deleteNurse(id: string) {
    const nurse = await this.getNurseById(id);

    nurse.softDelete();
    await this.nurseRepository.save(nurse);

    return { message: 'Nurse profile deleted successfully' };
  }

  /**
   * Search nurses by specialization
   */
  async searchNurses(specialization: string) {
    const nurses = await this.nurseRepository
      .createQueryBuilder('nurse')
      .leftJoinAndSelect('nurse.user', 'user')
      .where('nurse.deleted_at IS NULL')
      .andWhere('nurse.is_verified = :verified', { verified: true })
      .andWhere('LOWER(nurse.specialization) LIKE LOWER(:specialization)', {
        specialization: `%${specialization}%`,
      })
      .getMany();

    return nurses;
  }

  /**
   * Get nurses with expiring certifications
   */
  async getNursesWithExpiringCertifications(daysThreshold: number = 30) {
    const nurses = await this.nurseRepository.find({
      where: { deleted_at: null },
      relations: ['user'],
    });

    return nurses.filter((nurse) =>
      nurse.hasCertificationsExpiringSoon(daysThreshold)
    );
  }
}
