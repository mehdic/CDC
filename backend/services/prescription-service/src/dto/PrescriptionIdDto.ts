/**
 * Prescription ID DTO
 * Input validation for prescription ID route parameter
 */

import { Matches } from 'class-validator';

// UUID format regex (accepts any UUID format including test/synthetic UUIDs)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class PrescriptionIdDto {
  @Matches(UUID_REGEX, { message: 'id must be a valid UUID format' })
  id: string;
}
