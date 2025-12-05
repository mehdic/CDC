import { Request, Response } from 'express';
import { AppDataSource } from '../index';
import { PharmacyProfile } from '../models/PharmacyProfile';

/**
 * Profile Controller
 * Handles pharmacy profile CRUD operations
 */

export const getPharmacyProfile = async (req: Request, res: Response) => {
  try {
    const { pharmacyId } = req.params;

    if (!pharmacyId) {
      return res.status(400).json({
        success: false,
        error: 'Pharmacy ID required',
      });
    }

    const profileRepository = AppDataSource.getRepository(PharmacyProfile);
    let profile = await profileRepository.findOne({
      where: { pharmacyId },
    });

    // Create default profile if not exists
    if (!profile) {
      profile = profileRepository.create({ pharmacyId });
      profile = await profileRepository.save(profile);
    }

    return res.status(200).json({
      success: true,
      pharmacy: profile,
    });
  } catch (error) {
    console.error('Get pharmacy profile error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get pharmacy profile',
    });
  }
};

export const updatePharmacyProfile = async (req: Request, res: Response) => {
  try {
    const { pharmacyId } = req.params;
    const updateData = req.body;

    if (!pharmacyId) {
      return res.status(400).json({
        success: false,
        error: 'Pharmacy ID required',
      });
    }

    const profileRepository = AppDataSource.getRepository(PharmacyProfile);
    let profile = await profileRepository.findOne({
      where: { pharmacyId },
    });

    // Create profile if not exists
    if (!profile) {
      profile = profileRepository.create({ pharmacyId, ...updateData });
    } else {
      Object.assign(profile, updateData);
    }

    profile = await profileRepository.save(profile);

    return res.status(200).json({
      success: true,
      pharmacy: profile,
    });
  } catch (error) {
    console.error('Update pharmacy profile error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update pharmacy profile',
    });
  }
};

export const publishPharmacyProfile = async (req: Request, res: Response) => {
  try {
    const { pharmacyId } = req.params;

    if (!pharmacyId) {
      return res.status(400).json({
        success: false,
        error: 'Pharmacy ID required',
      });
    }

    const profileRepository = AppDataSource.getRepository(PharmacyProfile);
    const profile = await profileRepository.findOne({
      where: { pharmacyId },
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Pharmacy profile not found',
      });
    }

    profile.published = true;
    const updatedProfile = await profileRepository.save(profile);

    return res.status(200).json({
      success: true,
      pharmacy: updatedProfile,
    });
  } catch (error) {
    console.error('Publish pharmacy profile error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to publish pharmacy profile',
    });
  }
};

export const unpublishPharmacyProfile = async (req: Request, res: Response) => {
  try {
    const { pharmacyId } = req.params;

    if (!pharmacyId) {
      return res.status(400).json({
        success: false,
        error: 'Pharmacy ID required',
      });
    }

    const profileRepository = AppDataSource.getRepository(PharmacyProfile);
    const profile = await profileRepository.findOne({
      where: { pharmacyId },
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Pharmacy profile not found',
      });
    }

    profile.published = false;
    const updatedProfile = await profileRepository.save(profile);

    return res.status(200).json({
      success: true,
      pharmacy: updatedProfile,
    });
  } catch (error) {
    console.error('Unpublish pharmacy profile error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to unpublish pharmacy profile',
    });
  }
};
