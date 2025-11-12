/**
 * Locations Routes
 * Handles pharmacy location management
 */

import { Router, Request, Response } from 'express';
import { AppDataSource } from '../index';
import { Pharmacy } from '@models/Pharmacy';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Apply authentication middleware
router.use(authenticateToken);

// ============================================================================
// GET /account/locations
// List pharmacy locations for current user
// ============================================================================

router.get('/locations', async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user?.userId;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const pharmacyRepository = AppDataSource.getRepository(Pharmacy);

    // Find pharmacies associated with user (via users relationship)
    const pharmacies = await pharmacyRepository.createQueryBuilder('pharmacy')
      .leftJoin('pharmacy.users', 'user')
      .where('user.id = :userId', { userId: currentUserId })
      .getMany();

    const locationsResponse = pharmacies.map(pharmacy => ({
      id: pharmacy.id,
      name: pharmacy.name,
      address: pharmacy.address,
      city: pharmacy.city,
      postalCode: pharmacy.postal_code,
      country: pharmacy.country,
      phone: pharmacy.phone,
      email: pharmacy.email,
      isActive: pharmacy.isActive(),
      createdAt: pharmacy.created_at,
    }));

    return res.status(200).json({
      success: true,
      locations: locationsResponse,
    });
  } catch (error) {
    console.error('List locations error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to list locations',
    });
  }
});

export default router;
