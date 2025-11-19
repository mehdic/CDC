/**
 * Reject Prescription DTO
 * Input validation for prescription rejection endpoint
 */

import { IsString, IsNotEmpty, IsUUID, MaxLength, MinLength } from 'class-validator';

export class RejectPrescriptionDto {
  @IsString()
  @IsNotEmpty({ message: 'pharmacist_id is required' })
  @IsUUID('4', { message: 'pharmacist_id must be a valid UUID' })
  pharmacist_id: string;

  @IsString()
  @IsNotEmpty({ message: 'rejection_reason is required' })
  @MinLength(10, { message: 'rejection_reason must be at least 10 characters' })
  @MaxLength(1000, { message: 'rejection_reason must not exceed 1000 characters' })
  rejection_reason: string;
}
