/**
 * User PII Decryption Utilities
 * Service layer helpers for decrypting User model encrypted fields
 *
 * Pattern: User model stores encrypted fields (first_name_encrypted, etc.)
 * Services need plain text values for notifications, templates, etc.
 * This utility bridges that gap.
 */

import { User } from '../models/User';
import { decryptField } from './encryption';

/**
 * Decrypted PII fields from User entity
 */
export interface DecryptedUserPII {
  first_name: string;
  last_name: string;
  phone: string | null;
}

/**
 * Decrypt PII fields from a User entity
 * Call this in service layer when you need plain text values
 *
 * @param user - User entity with encrypted fields
 * @returns Decrypted first_name, last_name, and phone
 * @throws Error if decryption fails
 *
 * @example
 * const user = await userRepository.findOne({ where: { id: userId } });
 * const { first_name, last_name, phone } = await decryptUserPII(user);
 * await sendSMS(phone, `Hello ${first_name}!`);
 */
export async function decryptUserPII(user: User): Promise<DecryptedUserPII> {
  const [first_name, last_name, phone] = await Promise.all([
    decryptField(user.first_name_encrypted),
    decryptField(user.last_name_encrypted),
    user.phone_encrypted ? decryptField(user.phone_encrypted) : Promise.resolve(null),
  ]);

  return { first_name, last_name, phone };
}

/**
 * Create a User-like object with decrypted fields for use in templates/notifications
 * Combines User entity with decrypted PII fields
 *
 * @param user - User entity with encrypted fields
 * @returns User entity extended with decrypted first_name, last_name, phone
 * @throws Error if decryption fails
 *
 * @example
 * const user = await userRepository.findOne({ where: { id: userId } });
 * const userWithPII = await getUserWithDecryptedPII(user);
 * const template = `Dear ${userWithPII.first_name} ${userWithPII.last_name}...`;
 */
export async function getUserWithDecryptedPII<T extends User>(user: T): Promise<T & DecryptedUserPII> {
  const pii = await decryptUserPII(user);
  return { ...user, ...pii };
}
