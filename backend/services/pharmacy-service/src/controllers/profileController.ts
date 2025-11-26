import { Request, Response } from 'express';
import { AppDataSource } from '../index';
import { PharmacyProfile } from '../models/PharmacyProfile';

/**
 * Profile Controller
 * Handles pharmacy profile CRUD operations
 */

export const getPharmacyProfile = async (req: Request, res: Response) => {
  try {
    const pharmacyId = req.params.pharmacyId || (req as any).user?.pharmacyId;

    if (!pharmacyId) {
      return res.status(400).json({
        success: false,
        error: 'Pharmacy ID required',
      });
    }

    const profileRepo = AppDataSource.getRepository(PharmacyProfile);
    let profile = await profileRepo.findOne({ where: { pharmacyId } });

    // Create default profile if not exists
    if (!profile) {
      profile = profileRepo.create({
        pharmacyId,
        name: '',
        description: null,
        address: null,
        phone: null,
        email: null,
        published: false,
      });
      await profileRepo.save(profile);
    }

    res.status(200).json({
      success: true,
      pharmacy: profile,
    });
  } catch (error) {
    console.error('Error fetching pharmacy profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pharmacy profile',
    });
  }
};

export const updatePharmacyProfile = async (req: Request, res: Response) => {
  try {
    const pharmacyId = req.params.pharmacyId || (req as any).user?.pharmacyId;

    if (!pharmacyId) {
      return res.status(400).json({
        success: false,
        error: 'Pharmacy ID required',
      });
    }

    const { name, description, address, phone, email, fax, whatsapp, website, services } = req.body;

    const profileRepo = AppDataSource.getRepository(PharmacyProfile);
    let profile = await profileRepo.findOne({ where: { pharmacyId } });

    if (!profile) {
      profile = profileRepo.create({ pharmacyId });
    }

    // Update fields
    if (name !== undefined) profile.name = name;
    if (description !== undefined) profile.description = description;
    if (address !== undefined) profile.address = address;
    if (phone !== undefined) profile.phone = phone;
    if (email !== undefined) profile.email = email;
    if (fax !== undefined) profile.fax = fax;
    if (whatsapp !== undefined) profile.whatsapp = whatsapp;
    if (website !== undefined) profile.website = website;
    if (services !== undefined) profile.services = services;

    await profileRepo.save(profile);

    res.status(200).json({
      success: true,
      pharmacy: profile,
    });
  } catch (error) {
    console.error('Error updating pharmacy profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update pharmacy profile',
    });
  }
};

export const publishPharmacyProfile = async (req: Request, res: Response) => {
  try {
    const pharmacyId = req.params.pharmacyId || (req as any).user?.pharmacyId;

    if (!pharmacyId) {
      return res.status(400).json({
        success: false,
        error: 'Pharmacy ID required',
      });
    }

    const profileRepo = AppDataSource.getRepository(PharmacyProfile);
    const profile = await profileRepo.findOne({ where: { pharmacyId } });

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Pharmacy profile not found',
      });
    }

    profile.published = true;
    await profileRepo.save(profile);

    res.status(200).json({
      success: true,
      pharmacy: profile,
    });
  } catch (error) {
    console.error('Error publishing pharmacy profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to publish pharmacy profile',
    });
  }
};

export const unpublishPharmacyProfile = async (req: Request, res: Response) => {
  try {
    const pharmacyId = req.params.pharmacyId || (req as any).user?.pharmacyId;

    if (!pharmacyId) {
      return res.status(400).json({
        success: false,
        error: 'Pharmacy ID required',
      });
    }

    const profileRepo = AppDataSource.getRepository(PharmacyProfile);
    const profile = await profileRepo.findOne({ where: { pharmacyId } });

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Pharmacy profile not found',
      });
    }

    profile.published = false;
    await profileRepo.save(profile);

    res.status(200).json({
      success: true,
      pharmacy: profile,
    });
  } catch (error) {
    console.error('Error unpublishing pharmacy profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unpublish pharmacy profile',
    });
  }
};
