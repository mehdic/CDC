/**
 * Doctor Routes
 * POST/GET /doctor/prescriptions - Create and list doctor prescriptions
 * POST/GET/PUT/DELETE /doctor/templates - Manage prescription templates
 * Tasks: T3-100, T3-101, T3-102
 */

import { Router, Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { DoctorPrescriptionService } from '../services/DoctorPrescriptionService';
import { CreatePrescriptionRequest, CreateTemplateRequest } from '../services/DoctorPrescriptionService';

const router = Router();

// Initialize service (will be set up in middleware or request handler)
let doctorService: DoctorPrescriptionService;

// Middleware to initialize service
router.use((req: Request, res: Response, next) => {
  if (!doctorService) {
    const dataSource = (req.app.locals.dataSource as typeof AppDataSource) || AppDataSource;
    doctorService = new DoctorPrescriptionService(dataSource);
  }
  next();
});

// ============================================================================
// Prescription Routes (Task T3-100, T3-101)
// ============================================================================

/**
 * POST /doctor/prescriptions
 * Create a new prescription
 */
router.post('/prescriptions', async (req: Request, res: Response) => {
  try {
    const { patientId, doctorId, pharmacyId, medications, notes } = req.body;

    // Validate required fields
    if (!patientId || !doctorId || !pharmacyId || !medications) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Missing required fields: patientId, doctorId, pharmacyId, medications',
        timestamp: new Date().toISOString(),
      });
    }

    // Validate medications array
    if (!Array.isArray(medications) || medications.length === 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Medications must be a non-empty array',
        timestamp: new Date().toISOString(),
      });
    }

    const createRequest: CreatePrescriptionRequest = {
      patientId,
      doctorId,
      pharmacyId,
      medications,
      notes,
    };

    const prescription = await doctorService.createPrescription(createRequest);

    return res.status(201).json({
      message: 'Prescription created successfully',
      prescription: {
        id: prescription.id,
        patientId: prescription.patientId,
        doctorId: prescription.doctorId,
        pharmacyId: prescription.pharmacyId,
        medications: prescription.medications,
        status: prescription.status,
        createdAt: prescription.createdAt.toISOString(),
        updatedAt: prescription.updatedAt.toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error creating prescription:', error);

    return res.status(400).json({
      error: 'Bad Request',
      message: errorMessage,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * POST /doctor/prescriptions/:prescriptionId/send
 * Send prescription to pharmacy
 * Task: T3-101
 */
router.post('/prescriptions/:prescriptionId/send', async (req: Request, res: Response) => {
  try {
    const { prescriptionId } = req.params;
    const { doctorId, pharmacyId } = req.body;

    if (!doctorId || !pharmacyId) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Missing required fields: doctorId, pharmacyId',
        timestamp: new Date().toISOString(),
      });
    }

    const prescription = await doctorService.sendPrescriptionToPharmacy({
      prescriptionId,
      pharmacyId,
      doctorId,
    });

    return res.status(200).json({
      message: 'Prescription sent to pharmacy successfully',
      prescription: {
        id: prescription.id,
        patientId: prescription.patientId,
        doctorId: prescription.doctorId,
        pharmacyId: prescription.pharmacyId,
        medications: prescription.medications,
        status: prescription.status,
        createdAt: prescription.createdAt.toISOString(),
        updatedAt: prescription.updatedAt.toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error sending prescription:', error);

    if (errorMessage.includes('not found')) {
      return res.status(404).json({
        error: 'Not Found',
        message: errorMessage,
        timestamp: new Date().toISOString(),
      });
    }

    if (errorMessage.includes('Unauthorized')) {
      return res.status(403).json({
        error: 'Forbidden',
        message: errorMessage,
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(400).json({
      error: 'Bad Request',
      message: errorMessage,
      timestamp: new Date().toISOString(),
    });
  }
});

// ============================================================================
// Template Routes (Task T3-102)
// ============================================================================

/**
 * POST /doctor/templates
 * Create a new prescription template
 */
router.post('/templates', async (req: Request, res: Response) => {
  try {
    const { doctorId, name, description, medications } = req.body;

    if (!doctorId || !name || !medications) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Missing required fields: doctorId, name, medications',
        timestamp: new Date().toISOString(),
      });
    }

    if (!Array.isArray(medications) || medications.length === 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Medications must be a non-empty array',
        timestamp: new Date().toISOString(),
      });
    }

    const createRequest: CreateTemplateRequest = {
      doctorId,
      name,
      description,
      medications,
    };

    const template = await doctorService.createTemplate(createRequest);

    return res.status(201).json({
      message: 'Template created successfully',
      template: {
        id: template.id,
        doctorId: template.doctorId,
        name: template.name,
        description: template.description,
        medications: template.medications,
        createdAt: template.createdAt.toISOString(),
        updatedAt: template.updatedAt.toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error creating template:', error);

    return res.status(400).json({
      error: 'Bad Request',
      message: errorMessage,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /doctor/templates/:doctorId
 * Get all templates for a doctor
 */
router.get('/templates/:doctorId', async (req: Request, res: Response) => {
  try {
    const { doctorId } = req.params;

    const templates = await doctorService.getTemplates(doctorId);

    return res.status(200).json({
      count: templates.length,
      templates: templates.map((t) => ({
        id: t.id,
        doctorId: t.doctorId,
        name: t.name,
        description: t.description,
        medications: t.medications,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching templates:', error);

    return res.status(500).json({
      error: 'Internal Server Error',
      message: errorMessage,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /doctor/templates/:doctorId/:templateId
 * Get a specific template
 */
router.get('/templates/:doctorId/:templateId', async (req: Request, res: Response) => {
  try {
    const { doctorId, templateId } = req.params;

    const template = await doctorService.getTemplate(templateId, doctorId);

    if (!template) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Template ${templateId} not found`,
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(200).json({
      template: {
        id: template.id,
        doctorId: template.doctorId,
        name: template.name,
        description: template.description,
        medications: template.medications,
        createdAt: template.createdAt.toISOString(),
        updatedAt: template.updatedAt.toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching template:', error);

    return res.status(500).json({
      error: 'Internal Server Error',
      message: errorMessage,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * PUT /doctor/templates/:doctorId/:templateId
 * Update a template
 */
router.put('/templates/:doctorId/:templateId', async (req: Request, res: Response) => {
  try {
    const { doctorId, templateId } = req.params;
    const { name, description, medications } = req.body;

    const updated = await doctorService.updateTemplate(templateId, doctorId, {
      name,
      description,
      medications,
    });

    if (!updated) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Template ${templateId} not found`,
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(200).json({
      message: 'Template updated successfully',
      template: {
        id: updated.id,
        doctorId: updated.doctorId,
        name: updated.name,
        description: updated.description,
        medications: updated.medications,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error updating template:', error);

    return res.status(400).json({
      error: 'Bad Request',
      message: errorMessage,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * DELETE /doctor/templates/:doctorId/:templateId
 * Delete a template
 */
router.delete('/templates/:doctorId/:templateId', async (req: Request, res: Response) => {
  try {
    const { doctorId, templateId } = req.params;

    const deleted = await doctorService.deleteTemplate(templateId, doctorId);

    if (!deleted) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Template ${templateId} not found`,
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(200).json({
      message: 'Template deleted successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error deleting template:', error);

    return res.status(500).json({
      error: 'Internal Server Error',
      message: errorMessage,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * POST /doctor/templates/:doctorId/:templateId/create-prescription
 * Create a prescription from a template
 */
router.post(
  '/templates/:doctorId/:templateId/create-prescription',
  async (req: Request, res: Response) => {
    try {
      const { doctorId, templateId } = req.params;
      const { patientId, pharmacyId } = req.body;

      if (!patientId || !pharmacyId) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Missing required fields: patientId, pharmacyId',
          timestamp: new Date().toISOString(),
        });
      }

      const prescription = await doctorService.createPrescriptionFromTemplate(
        templateId,
        doctorId,
        patientId,
        pharmacyId
      );

      return res.status(201).json({
        message: 'Prescription created from template successfully',
        prescription: {
          id: prescription.id,
          patientId: prescription.patientId,
          doctorId: prescription.doctorId,
          pharmacyId: prescription.pharmacyId,
          medications: prescription.medications,
          status: prescription.status,
          createdAt: prescription.createdAt.toISOString(),
          updatedAt: prescription.updatedAt.toISOString(),
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error creating prescription from template:', error);

      if (errorMessage.includes('not found')) {
        return res.status(404).json({
          error: 'Not Found',
          message: errorMessage,
          timestamp: new Date().toISOString(),
        });
      }

      return res.status(400).json({
        error: 'Bad Request',
        message: errorMessage,
        timestamp: new Date().toISOString(),
      });
    }
  }
);

export default router;
