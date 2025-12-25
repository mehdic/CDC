/**
 * Digital Twin Controller
 * Handles HTTP requests for patient digital twin profiles
 *
 * Security (T8-054):
 * - All endpoints require authentication via authenticateJWT middleware
 * - User context available via req.user
 */

import { Response } from 'express';
import { AuthenticatedRequest } from '@shared/middleware/auth';
// eslint-disable-next-line no-restricted-imports
import { AppDataSource } from '../index';
// eslint-disable-next-line no-restricted-imports
import { DigitalTwinProfile } from '../models/DigitalTwinProfile';
import { getDigitalTwinProfile as computeProfile } from '@shared/services/digitalTwinService';

/**
 * Get digital twin profile for a patient
 * Uses cached profile if available and fresh (<24h old)
 * Otherwise computes new profile and caches it
 *
 * Security: Requires authentication (enforced by middleware)
 */
export async function getDigitalTwinProfile(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { patientId } = req.params;

    if (!patientId) {
      res.status(400).json({ error: 'Patient ID is required' });
      return;
    }

    const profileRepo = AppDataSource.getRepository(DigitalTwinProfile);

    // Check for cached profile
    const cachedProfile = await profileRepo.findOne({
      where: { patientId },
    });

    const now = new Date();
    const cacheMaxAge = 24 * 60 * 60 * 1000; // 24 hours in ms

    // Use cache if fresh (<24h old)
    if (cachedProfile && cachedProfile.lastComputed) {
      const cacheAge = now.getTime() - cachedProfile.lastComputed.getTime();

      if (cacheAge < cacheMaxAge) {
        console.log(`[DigitalTwin] Using cached profile for ${patientId}`);
        res.json({
          patient_id: cachedProfile.patientId,
          patient_name: cachedProfile.patientName,
          age: cachedProfile.age,
          demographic: cachedProfile.demographic,
          medical_history: cachedProfile.medicalHistory,
          purchase_behavior: cachedProfile.purchaseBehavior,
          health_insights: cachedProfile.healthInsights,
          predictions: cachedProfile.predictions,
          engagement: cachedProfile.engagement,
          privacy: cachedProfile.privacy,
          cached: true,
          computed_at: cachedProfile.lastComputed,
        });
        return;
      }
    }

    // Compute fresh profile
    console.log(`[DigitalTwin] Computing fresh profile for ${patientId}`);
    const profile = await computeProfile(patientId);

    if (!profile) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }

    // Save to cache
    const profileToSave: Partial<DigitalTwinProfile> = {
      patientId: profile.patient_id,
      patientName: profile.patient_name,
      age: profile.age,
      demographic: profile.demographic,
      medicalHistory: profile.medical_history,
      purchaseBehavior: profile.purchase_behavior,
      healthInsights: profile.health_insights,
      predictions: profile.predictions,
      engagement: profile.engagement,
      privacy: profile.privacy,
      lastComputed: now,
    };

    if (cachedProfile) {
      // Update existing
      await profileRepo.update({ patientId }, profileToSave);
    } else {
      // Create new
      const newProfile = profileRepo.create(profileToSave);
      await profileRepo.save(newProfile);
    }

    res.json({
      ...profile,
      cached: false,
      computed_at: now,
    });
  } catch (error) {
    console.error('[DigitalTwin] Error fetching profile:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Force refresh of digital twin profile
 * Recomputes profile regardless of cache state
 *
 * Security: Requires authentication (enforced by middleware)
 */
export async function refreshDigitalTwinProfile(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { patientId } = req.params;

    if (!patientId) {
      res.status(400).json({ error: 'Patient ID is required' });
      return;
    }

    console.log(`[DigitalTwin] Force refresh for ${patientId}`);
    const profile = await computeProfile(patientId);

    if (!profile) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }

    // Update cache
    const profileRepo = AppDataSource.getRepository(DigitalTwinProfile);
    const now = new Date();

    const profileToSave: Partial<DigitalTwinProfile> = {
      patientId: profile.patient_id,
      patientName: profile.patient_name,
      age: profile.age,
      demographic: profile.demographic,
      medicalHistory: profile.medical_history,
      purchaseBehavior: profile.purchase_behavior,
      healthInsights: profile.health_insights,
      predictions: profile.predictions,
      engagement: profile.engagement,
      privacy: profile.privacy,
      lastComputed: now,
    };

    const existingProfile = await profileRepo.findOne({ where: { patientId } });

    if (existingProfile) {
      await profileRepo.update({ patientId }, profileToSave);
    } else {
      const newProfile = profileRepo.create(profileToSave);
      await profileRepo.save(newProfile);
    }

    res.json({
      ...profile,
      cached: false,
      computed_at: now,
    });
  } catch (error) {
    console.error('[DigitalTwin] Error refreshing profile:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Get health trends for a patient
 * Returns historical data for trend visualization
 *
 * Security: Requires authentication (enforced by middleware)
 */
export async function getHealthTrends(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { patientId } = req.params;

    if (!patientId) {
      res.status(400).json({ error: 'Patient ID is required' });
      return;
    }

    // TODO: Implement historical trend analysis
    // This would query historical snapshots or compute trends from medical records

    res.json({
      patient_id: patientId,
      trends: {
        medication_adherence: [],
        health_risk: [],
        engagement: [],
      },
      message: 'Historical trend analysis - to be implemented',
    });
  } catch (error) {
    console.error('[DigitalTwin] Error fetching trends:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
