/**
 * Settings Routes
 * Handles account settings management
 */

import { Router, Request, Response } from 'express';
import { AppDataSource } from '../index';
import { User } from '@models/User';
import { AuditLog } from '@models/AuditLog';
import { authenticateToken } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

// Apply authentication middleware
router.use(authenticateToken);

// ============================================================================
// Validation Schema
// ============================================================================

const UpdateSettingsSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
});

// ============================================================================
// PUT /account/settings
// Update account settings
// ============================================================================

router.put('/settings', async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user?.userId;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    // Validate request body
    const validation = UpdateSettingsSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: validation.error.issues,
      });
    }

    const { name, phone, email } = validation.data;

    const userRepository = AppDataSource.getRepository(User);

    // Find user
    const user = await userRepository.findOne({ where: { id: currentUserId } });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Update fields (in production, would encrypt with AWS KMS)
    if (email) {
      user.email = email;
    }

    if (phone) {
      user.phone_encrypted = Buffer.from(phone, 'utf-8'); // Mock encryption
    }

    await userRepository.save(user);

    // Log audit entry
    const auditRepository = AppDataSource.getRepository(AuditLog);
    const auditEntry = auditRepository.create({
      user_id: currentUserId,
      action: 'settings.updated',
      resource: 'user',
      resource_id: currentUserId,
      details: { fields: Object.keys(req.body) },
      ip_address: req.ip || (req.socket as any).remoteAddress || 'unknown',
      user_agent: req.headers['user-agent'] || 'unknown',
    });

    await auditRepository.save(auditEntry);

    return res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    console.error('Update settings error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update settings',
    });
  }
});

export default router;
