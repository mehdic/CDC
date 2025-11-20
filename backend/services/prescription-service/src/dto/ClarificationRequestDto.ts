/**
 * Clarification Request DTO
 * Input validation for requesting clarification from doctor
 */

import { IsString, IsNotEmpty, IsUUID, MaxLength, MinLength, IsOptional } from 'class-validator';

export class ClarificationRequestDto {
  @IsString()
  @IsNotEmpty({ message: 'pharmacist_id is required' })
  @IsUUID('4', { message: 'pharmacist_id must be a valid UUID' })
  pharmacist_id: string;

  @IsString()
  @IsNotEmpty({ message: 'question is required' })
  @MinLength(10, { message: 'question must be at least 10 characters' })
  @MaxLength(2000, { message: 'question must not exceed 2000 characters' })
  question: string;

  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'category must not exceed 50 characters' })
  category?: string; // e.g., 'dosage', 'drug_name', 'instructions', 'interaction'
}
