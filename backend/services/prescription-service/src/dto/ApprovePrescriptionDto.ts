/**
 * Approve Prescription DTO
 * Input validation for prescription approval endpoint
 */

import { IsString, IsNotEmpty, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class ApprovePrescriptionDto {
  @IsString()
  @IsNotEmpty({ message: 'pharmacist_id is required' })
  @IsUUID('4', { message: 'pharmacist_id must be a valid UUID' })
  pharmacist_id: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'digital_signature must not exceed 500 characters' })
  digital_signature?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'notes must not exceed 1000 characters' })
  notes?: string;
}
