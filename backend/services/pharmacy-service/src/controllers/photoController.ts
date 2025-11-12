import { Request, Response } from 'express';
import { AppDataSource } from '../index';
import { PharmacyPhoto } from '../models/PharmacyPhoto';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

/**
 * Photo Controller
 * Handles pharmacy photo uploads and management
 */

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(__dirname, '../../uploads/photos');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export const uploadPhotos = async (req: Request, res: Response) => {
  try {
    const pharmacyId = req.params.pharmacyId || (req as any).user?.pharmacyId;

    if (!pharmacyId) {
      return res.status(400).json({
        success: false,
        error: 'Pharmacy ID required',
      });
    }

    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded',
      });
    }

    const photoRepo = AppDataSource.getRepository(PharmacyPhoto);
    const photoUrls: string[] = [];

    for (const file of req.files) {
      // Process image with sharp (resize, optimize)
      const filename = `${pharmacyId}_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      const filepath = path.join(UPLOADS_DIR, filename);

      await sharp(file.buffer)
        .resize(1200, 800, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toFile(filepath);

      const photoUrl = `/photos/${filename}`;

      // Save to database
      const photo = photoRepo.create({
        pharmacyId,
        url: photoUrl,
        caption: null,
        isPrimary: false,
        displayOrder: 0,
      });

      await photoRepo.save(photo);
      photoUrls.push(photoUrl);
    }

    res.status(200).json({
      success: true,
      photoUrls,
    });
  } catch (error) {
    console.error('Error uploading photos:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload photos',
    });
  }
};

export const getPhotos = async (req: Request, res: Response) => {
  try {
    const pharmacyId = req.params.pharmacyId || (req as any).user?.pharmacyId;

    if (!pharmacyId) {
      return res.status(400).json({
        success: false,
        error: 'Pharmacy ID required',
      });
    }

    const photoRepo = AppDataSource.getRepository(PharmacyPhoto);
    const photos = await photoRepo.find({
      where: { pharmacyId },
      order: { displayOrder: 'ASC', createdAt: 'DESC' },
    });

    res.status(200).json({
      success: true,
      photos,
    });
  } catch (error) {
    console.error('Error fetching photos:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch photos',
    });
  }
};

export const deletePhoto = async (req: Request, res: Response) => {
  try {
    const { photoId } = req.params;
    const pharmacyId = (req as any).user?.pharmacyId;

    if (!pharmacyId) {
      return res.status(400).json({
        success: false,
        error: 'Pharmacy ID required',
      });
    }

    const photoRepo = AppDataSource.getRepository(PharmacyPhoto);
    const photo = await photoRepo.findOne({
      where: { id: photoId, pharmacyId },
    });

    if (!photo) {
      return res.status(404).json({
        success: false,
        error: 'Photo not found',
      });
    }

    // Delete file from disk
    const filepath = path.join(UPLOADS_DIR, path.basename(photo.url));
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }

    // Delete from database
    await photoRepo.remove(photo);

    res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete photo',
    });
  }
};

export const updatePhotoOrder = async (req: Request, res: Response) => {
  try {
    const pharmacyId = (req as any).user?.pharmacyId;
    const { photoOrders } = req.body; // [{ photoId, displayOrder }]

    if (!pharmacyId) {
      return res.status(400).json({
        success: false,
        error: 'Pharmacy ID required',
      });
    }

    if (!Array.isArray(photoOrders)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid photo orders',
      });
    }

    const photoRepo = AppDataSource.getRepository(PharmacyPhoto);

    for (const { photoId, displayOrder } of photoOrders) {
      await photoRepo.update(
        { id: photoId, pharmacyId },
        { displayOrder }
      );
    }

    res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.error('Error updating photo order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update photo order',
    });
  }
};
