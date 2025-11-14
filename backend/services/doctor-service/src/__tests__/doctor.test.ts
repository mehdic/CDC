/**
 * Doctor Service Tests
 * Unit and integration tests for doctor CRUD operations
 */

import { Doctor } from '../models/Doctor';

describe('Doctor Model', () => {
  test('should create doctor instance', () => {
    const doctor = new Doctor();
    doctor.id = '123e4567-e89b-12d3-a456-426614174000';
    doctor.user_id = '123e4567-e89b-12d3-a456-426614174001';
    doctor.specialization = 'Cardiology';
    doctor.license_number = 'CH-DOC-12345';
    doctor.license_country = 'CH';
    doctor.is_verified = false;

    expect(doctor.id).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect(doctor.specialization).toBe('Cardiology');
    expect(doctor.license_number).toBe('CH-DOC-12345');
  });

  test('should check if doctor is deleted', () => {
    const doctor = new Doctor();
    doctor.deleted_at = null;
    expect(doctor.isDeleted()).toBe(false);

    doctor.deleted_at = new Date();
    expect(doctor.isDeleted()).toBe(true);
  });

  test('should soft delete doctor', () => {
    const doctor = new Doctor();
    doctor.deleted_at = null;

    doctor.softDelete();

    expect(doctor.deleted_at).not.toBeNull();
    expect(doctor.isDeleted()).toBe(true);
  });

  test('should check if doctor is verified', () => {
    const doctor = new Doctor();
    doctor.is_verified = false;
    doctor.deleted_at = null;
    expect(doctor.isVerified()).toBe(false);

    doctor.is_verified = true;
    expect(doctor.isVerified()).toBe(true);

    doctor.deleted_at = new Date();
    expect(doctor.isVerified()).toBe(false); // Deleted doctors are not verified
  });
});

describe('Doctor Routes', () => {
  test('placeholder for route tests', () => {
    // TODO: Add integration tests for routes when database is set up
    expect(true).toBe(true);
  });
});
