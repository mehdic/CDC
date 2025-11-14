/**
 * Master Account Controller
 * Business logic for pharmacy master account management
 * Handles sub-account creation, permissions override, and master account operations
 */

import { AppDataSource } from '../index';
import { User, UserRole, UserStatus } from '@shared/models/User';
import { Repository } from 'typeorm';

export class MasterAccountController {
  private userRepository: Repository<User>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
  }

  /**
   * Create sub-account for master pharmacy
   */
  async createSubAccount(data: {
    master_account_id: string;
    email: string;
    password_hash: string;
    first_name_encrypted: Buffer;
    last_name_encrypted: Buffer;
    phone_encrypted?: Buffer;
    role: UserRole;
    permissions_override?: Record<string, any>;
    primary_pharmacy_id?: string;
  }) {
    // Verify master account exists and is a pharmacist
    const masterAccount = await this.userRepository.findOne({
      where: { id: data.master_account_id },
    });

    if (!masterAccount) {
      throw new Error('Master account not found');
    }

    if (masterAccount.role !== UserRole.PHARMACIST) {
      throw new Error('Master account must be a pharmacist');
    }

    if (!masterAccount.isActive()) {
      throw new Error('Master account must be active');
    }

    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('Email already in use');
    }

    // Create sub-account
    const subAccount = this.userRepository.create({
      email: data.email,
      password_hash: data.password_hash,
      first_name_encrypted: data.first_name_encrypted,
      last_name_encrypted: data.last_name_encrypted,
      phone_encrypted: data.phone_encrypted || null,
      role: data.role,
      status: UserStatus.ACTIVE,
      master_account_id: data.master_account_id,
      permissions_override: data.permissions_override || null,
      primary_pharmacy_id: data.primary_pharmacy_id || masterAccount.primary_pharmacy_id,
      email_verified: false,
      mfa_enabled: false,
    });

    await this.userRepository.save(subAccount);

    return subAccount;
  }

  /**
   * Get all sub-accounts for a master account
   */
  async getSubAccounts(masterAccountId: string) {
    const masterAccount = await this.userRepository.findOne({
      where: { id: masterAccountId },
    });

    if (!masterAccount) {
      throw new Error('Master account not found');
    }

    const subAccounts = await this.userRepository.find({
      where: { master_account_id: masterAccountId, deleted_at: null },
      order: { created_at: 'DESC' },
    });

    return subAccounts;
  }

  /**
   * Get sub-account by ID (with authorization check)
   */
  async getSubAccountById(subAccountId: string, masterAccountId: string) {
    const subAccount = await this.userRepository.findOne({
      where: { id: subAccountId, master_account_id: masterAccountId, deleted_at: null },
    });

    if (!subAccount) {
      throw new Error('Sub-account not found or unauthorized');
    }

    return subAccount;
  }

  /**
   * Update sub-account permissions
   */
  async updateSubAccountPermissions(
    subAccountId: string,
    masterAccountId: string,
    permissions: Record<string, any>
  ) {
    const subAccount = await this.getSubAccountById(subAccountId, masterAccountId);

    subAccount.permissions_override = permissions;
    await this.userRepository.save(subAccount);

    return subAccount;
  }

  /**
   * Update sub-account status
   */
  async updateSubAccountStatus(
    subAccountId: string,
    masterAccountId: string,
    status: UserStatus
  ) {
    const subAccount = await this.getSubAccountById(subAccountId, masterAccountId);

    subAccount.status = status;
    await this.userRepository.save(subAccount);

    return subAccount;
  }

  /**
   * Delete sub-account (soft delete)
   */
  async deleteSubAccount(subAccountId: string, masterAccountId: string) {
    const subAccount = await this.getSubAccountById(subAccountId, masterAccountId);

    subAccount.softDelete();
    await this.userRepository.save(subAccount);

    return { message: 'Sub-account deleted successfully' };
  }

  /**
   * Check if user is a master account
   */
  async isMasterAccount(userId: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      return false;
    }

    // User is a master account if they are a pharmacist and have no master_account_id
    return user.role === UserRole.PHARMACIST && user.master_account_id === null;
  }

  /**
   * Get master account for a sub-account
   */
  async getMasterAccount(subAccountId: string) {
    const subAccount = await this.userRepository.findOne({
      where: { id: subAccountId },
      relations: ['master_account'],
    });

    if (!subAccount) {
      throw new Error('Sub-account not found');
    }

    if (!subAccount.master_account_id) {
      throw new Error('User is not a sub-account');
    }

    return subAccount.master_account;
  }
}
