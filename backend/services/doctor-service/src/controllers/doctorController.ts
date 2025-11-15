/**
 * Doctor Controller
 * Business logic for doctor CRUD operations
 * HIPAA/GDPR Compliant - Healthcare professional data management
 */

import { AppDataSource } from '../index';
import { Doctor } from '../models/Doctor';
import { User, UserRole } from '@shared/models/User';
import { Repository } from 'typeorm';

export class DoctorController {
  private doctorRepository: Repository<Doctor>;
  private userRepository: Repository<User>;

  constructor() {
    this.doctorRepository = AppDataSource.getRepository(Doctor);
    this.userRepository = AppDataSource.getRepository(User);
  }

  /**
   * Get all doctors (with pagination)
   */
  async getAllDoctors(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [doctors, total] = await this.doctorRepository.findAndCount({
      where: { deleted_at: null },
      relations: ['user'],
      take: limit,
      skip,
      order: { created_at: 'DESC' },
    });

    return {
      doctors,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get doctor by ID
   */
  async getDoctorById(id: string) {
    const doctor = await this.doctorRepository.findOne({
      where: { id, deleted_at: null },
      relations: ['user'],
    });

    if (!doctor) {
      throw new Error('Doctor not found');
    }

    return doctor;
  }

  /**
   * Get doctor by user ID
   */
  async getDoctorByUserId(userId: string) {
    const doctor = await this.doctorRepository.findOne({
      where: { user_id: userId, deleted_at: null },
      relations: ['user'],
    });

    if (!doctor) {
      throw new Error('Doctor profile not found for this user');
    }

    return doctor;
  }

  /**
   * Create new doctor profile
   */
  async createDoctor(data: {
    user_id: string;
    specialization: string;
    license_number: string;
    license_country?: string;
    qualifications?: any;
    bio?: string;
  }) {
    // Verify user exists and has doctor role
    const user = await this.userRepository.findOne({
      where: { id: data.user_id },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.role !== UserRole.DOCTOR) {
      throw new Error('User must have doctor role');
    }

    // Check if doctor profile already exists
    const existing = await this.doctorRepository.findOne({
      where: { user_id: data.user_id },
    });

    if (existing && !existing.isDeleted()) {
      throw new Error('Doctor profile already exists for this user');
    }

    // Create doctor profile
    const doctor = this.doctorRepository.create({
      user_id: data.user_id,
      specialization: data.specialization,
      license_number: data.license_number,
      license_country: data.license_country || 'CH',
      qualifications: data.qualifications || null,
      bio: data.bio || null,
      is_verified: false, // Admin must verify
    });

    await this.doctorRepository.save(doctor);

    return doctor;
  }

  /**
   * Update doctor profile
   */
  async updateDoctor(
    id: string,
    data: Partial<{
      specialization: string;
      license_number: string;
      license_country: string;
      qualifications: any;
      bio: string;
    }>
  ) {
    const doctor = await this.getDoctorById(id);

    // Update fields
    if (data.specialization !== undefined)
      doctor.specialization = data.specialization;
    if (data.license_number !== undefined)
      doctor.license_number = data.license_number;
    if (data.license_country !== undefined)
      doctor.license_country = data.license_country;
    if (data.qualifications !== undefined)
      doctor.qualifications = data.qualifications;
    if (data.bio !== undefined) doctor.bio = data.bio;

    await this.doctorRepository.save(doctor);

    return doctor;
  }

  /**
   * Verify doctor (admin only)
   */
  async verifyDoctor(id: string) {
    const doctor = await this.getDoctorById(id);

    doctor.is_verified = true;
    await this.doctorRepository.save(doctor);

    return doctor;
  }

  /**
   * Soft delete doctor profile
   */
  async deleteDoctor(id: string) {
    const doctor = await this.getDoctorById(id);

    doctor.softDelete();
    await this.doctorRepository.save(doctor);

    return { message: 'Doctor profile deleted successfully' };
  }

  /**
   * Search doctors by specialization
   */
  async searchDoctors(specialization: string) {
    const doctors = await this.doctorRepository
      .createQueryBuilder('doctor')
      .leftJoinAndSelect('doctor.user', 'user')
      .where('doctor.deleted_at IS NULL')
      .andWhere('doctor.is_verified = :verified', { verified: true })
      .andWhere('LOWER(doctor.specialization) LIKE LOWER(:specialization)', {
        specialization: `%${specialization}%`,
      })
      .getMany();

    return doctors;
  }
}
