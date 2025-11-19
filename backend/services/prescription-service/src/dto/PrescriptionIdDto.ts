/**
 * Prescription ID DTO
 * Input validation for prescription ID route parameter
 */

import { IsUUID } from 'class-validator';

export class PrescriptionIdDto {
  @IsUUID('4', { message: 'id must be a valid UUID' })
  id: string;
}
