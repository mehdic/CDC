/**
 * Upload Prescription DTO
 * Input validation for prescription upload endpoint
 */

import { IsString, IsNotEmpty, IsEnum, IsOptional, IsUUID } from 'class-validator';

export class UploadPrescriptionDto {
  @IsString()
  @IsNotEmpty({ message: 'patient_id is required' })
  @IsUUID('4', { message: 'patient_id must be a valid UUID' })
  patient_id: string;

  @IsString()
  @IsNotEmpty({ message: 'uploaded_by_type is required' })
  @IsEnum(['patient', 'doctor', 'nurse'], {
    message: 'uploaded_by_type must be one of: patient, doctor, nurse',
  })
  uploaded_by_type: 'patient' | 'doctor' | 'nurse';

  @IsString()
  @IsNotEmpty({ message: 'uploaded_by_id is required' })
  @IsUUID('4', { message: 'uploaded_by_id must be a valid UUID' })
  uploaded_by_id: string;

  @IsOptional()
  @IsString()
  @IsUUID('4', { message: 'pharmacy_id must be a valid UUID' })
  pharmacy_id?: string;
}
