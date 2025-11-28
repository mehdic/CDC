/**
 * Data Transfer Objects for Medical Records API
 * Using class-validator for request validation
 */

import { IsString, IsEnum, IsOptional, IsBoolean, IsObject, IsDateString, Length, IsNotEmpty } from 'class-validator';
import { RecordType, RecordSource } from '../models/MedicalRecord';

export class CreateMedicalRecordDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  patientId!: string;

  @IsEnum(['diagnosis', 'allergy', 'medication', 'procedure', 'lab_result', 'immunization', 'condition'])
  recordType!: RecordType;

  @IsString()
  @IsNotEmpty()
  @Length(1, 500)
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  @IsOptional()
  data?: Record<string, any>;

  @IsEnum(['manual', 'e-sante', 'import', 'prescription'])
  @IsOptional()
  source?: RecordSource;

  @IsString()
  @IsOptional()
  sourceId?: string;

  @IsString()
  @IsOptional()
  recordedBy?: string;

  @IsDateString()
  @IsOptional()
  recordedAt?: string;

  @IsBoolean()
  @IsOptional()
  consentGiven?: boolean;
}

export class UpdateMedicalRecordDto {
  @IsString()
  @IsOptional()
  @Length(1, 500)
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  @IsOptional()
  data?: Record<string, any>;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsBoolean()
  @IsOptional()
  consentGiven?: boolean;
}

export class SyncESanteDto {
  @IsString()
  @IsNotEmpty()
  patientId!: string;
}
