/**
 * List Prescriptions DTO
 * Input validation for prescription listing endpoint
 */

import {
  IsString,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsISO8601,
  IsEnum,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { PrescriptionStatus } from '../../../../shared/models/Prescription';

export class ListPrescriptionsDto {
  @IsOptional()
  @IsString()
  status?: string; // Can be single status or comma-separated list

  @IsOptional()
  @IsUUID('4', { message: 'patient_id must be a valid UUID' })
  patient_id?: string;

  @IsOptional()
  @IsUUID('4', { message: 'pharmacy_id must be a valid UUID' })
  pharmacy_id?: string;

  @IsOptional()
  @IsUUID('4', { message: 'pharmacist_id must be a valid UUID' })
  pharmacist_id?: string;

  @IsOptional()
  @IsUUID('4', { message: 'prescribing_doctor_id must be a valid UUID' })
  prescribing_doctor_id?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === '1')
  @IsBoolean()
  has_safety_warnings?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === '1')
  @IsBoolean()
  has_low_confidence?: boolean;

  @IsOptional()
  @IsISO8601({}, { message: 'date_from must be a valid ISO8601 date' })
  date_from?: string;

  @IsOptional()
  @IsISO8601({}, { message: 'date_to must be a valid ISO8601 date' })
  date_to?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1, { message: 'page must be at least 1' })
  page?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1, { message: 'limit must be at least 1' })
  @Max(100, { message: 'limit must not exceed 100' })
  limit?: number;

  @IsOptional()
  @IsEnum(['created_at', 'updated_at', 'approved_at'], {
    message: 'sort_by must be one of: created_at, updated_at, approved_at',
  })
  sort_by?: 'created_at' | 'updated_at' | 'approved_at';

  @IsOptional()
  @IsEnum(['asc', 'desc'], {
    message: 'sort_order must be one of: asc, desc',
  })
  sort_order?: 'asc' | 'desc';
}
