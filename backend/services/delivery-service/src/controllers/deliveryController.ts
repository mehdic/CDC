/**
 * Delivery Controller
 * Handles CRUD operations for deliveries
 * Batch 3 Phase 4 - Delivery Service
 */

import { Request, Response } from 'express';
import { DataSource } from 'typeorm';
import { Delivery, DeliveryStatus } from '../../../../shared/models/Delivery';

/**
 * GET /deliveries
 * List deliveries with optional filtering
 */
export async function listDeliveries(req: Request, res: Response): Promise<void> {
  try {
    const dataSource: DataSource = req.app.locals.dataSource;
    const deliveryRepo = dataSource.getRepository(Delivery);

    // Parse query parameters
    const { status, user_id, order_id, delivery_personnel_id } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    // Build query
    let queryBuilder = deliveryRepo
      .createQueryBuilder('delivery')
      .leftJoinAndSelect('delivery.user', 'user')
      .leftJoinAndSelect('delivery.delivery_personnel', 'delivery_personnel');

    // Apply filters
    if (status) {
      queryBuilder = queryBuilder.andWhere('delivery.status = :status', { status });
    }
    if (user_id) {
      queryBuilder = queryBuilder.andWhere('delivery.user_id = :userId', { userId: user_id });
    }
    if (order_id) {
      queryBuilder = queryBuilder.andWhere('delivery.order_id = :orderId', { orderId: order_id });
    }
    if (delivery_personnel_id) {
      queryBuilder = queryBuilder.andWhere('delivery.delivery_personnel_id = :deliveryPersonnelId', {
        deliveryPersonnelId: delivery_personnel_id,
      });
    }

    // Apply sorting
    queryBuilder = queryBuilder.orderBy('delivery.created_at', 'DESC');

    // Count total
    const totalItems = await queryBuilder.getCount();

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder = queryBuilder.skip(skip).take(limit);

    // Execute query
    const deliveries = await queryBuilder.getMany();

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalItems / limit);

    res.json({
      deliveries: deliveries.map(sanitizeDelivery),
      pagination: {
        page,
        limit,
        total_items: totalItems,
        total_pages: totalPages,
        has_next_page: page < totalPages,
        has_prev_page: page > 1,
      },
    });
  } catch (error: any) {
    console.error('[Delivery Controller] List error:', error);
    res.status(500).json({
      error: 'Failed to list deliveries',
      message: error.message,
    });
  }
}

/**
 * GET /deliveries/:id
 * Get a single delivery by ID
 */
export async function getDelivery(req: Request, res: Response): Promise<void> {
  try {
    const dataSource: DataSource = req.app.locals.dataSource;
    const deliveryRepo = dataSource.getRepository(Delivery);

    const delivery = await deliveryRepo.findOne({
      where: { id: req.params.id },
      relations: ['user', 'delivery_personnel'],
    });

    if (!delivery) {
      res.status(404).json({
        error: 'Delivery not found',
      });
      return;
    }

    res.json(sanitizeDelivery(delivery));
  } catch (error: any) {
    console.error('[Delivery Controller] Get error:', error);
    res.status(500).json({
      error: 'Failed to get delivery',
      message: error.message,
    });
  }
}

/**
 * POST /deliveries
 * Create a new delivery
 */
export async function createDelivery(req: Request, res: Response): Promise<void> {
  try {
    const dataSource: DataSource = req.app.locals.dataSource;
    const deliveryRepo = dataSource.getRepository(Delivery);

    const {
      user_id,
      order_id,
      delivery_address_encrypted,
      delivery_notes_encrypted,
      scheduled_at,
      // Cold chain fields (T3-066)
      requires_temperature_control,
      temperature_range_min,
      temperature_range_max,
      max_delivery_duration_minutes,
      special_handling_instructions,
      // Controlled substance fields (T3-067)
      contains_controlled_substance,
      substance_schedule,
      requires_signature,
      age_verification_required,
    } = req.body;

    // Validation
    if (!user_id) {
      res.status(400).json({
        error: 'user_id is required',
      });
      return;
    }

    if (!delivery_address_encrypted) {
      res.status(400).json({
        error: 'delivery_address_encrypted is required',
      });
      return;
    }

    // Validation for cold chain requirements
    if (requires_temperature_control) {
      if (!temperature_range_min || !temperature_range_max) {
        res.status(400).json({
          error: 'temperature_range_min and temperature_range_max are required for temperature-controlled deliveries',
        });
        return;
      }
      if (!max_delivery_duration_minutes) {
        res.status(400).json({
          error: 'max_delivery_duration_minutes is required for temperature-controlled deliveries',
        });
        return;
      }
    }

    // Validation for controlled substance requirements
    if (contains_controlled_substance) {
      if (!substance_schedule) {
        res.status(400).json({
          error: 'substance_schedule is required for controlled substance deliveries',
        });
        return;
      }
      // Controlled substances always require signature
      if (!requires_signature) {
        res.status(400).json({
          error: 'requires_signature must be true for controlled substance deliveries',
        });
        return;
      }
    }

    // Create delivery
    const delivery = deliveryRepo.create({
      user_id,
      order_id: order_id || null,
      delivery_address_encrypted: Buffer.from(delivery_address_encrypted, 'base64'),
      delivery_notes_encrypted: delivery_notes_encrypted
        ? Buffer.from(delivery_notes_encrypted, 'base64')
        : null,
      scheduled_at: scheduled_at ? new Date(scheduled_at) : null,
      status: DeliveryStatus.PENDING,
      // Cold chain fields (T3-066)
      requires_temperature_control: requires_temperature_control || false,
      temperature_range_min: temperature_range_min || null,
      temperature_range_max: temperature_range_max || null,
      max_delivery_duration_minutes: max_delivery_duration_minutes || null,
      special_handling_instructions: special_handling_instructions || null,
      // Controlled substance fields (T3-067)
      contains_controlled_substance: contains_controlled_substance || false,
      substance_schedule: substance_schedule || null,
      requires_signature: requires_signature || false,
      age_verification_required: age_verification_required || false,
    });

    // Add initial compliance log entry
    delivery.addComplianceLog(
      'delivery_created',
      `Delivery created with special handling flags: cold_chain=${requires_temperature_control}, controlled_substance=${contains_controlled_substance}`,
      'system'
    );

    await deliveryRepo.save(delivery);

    res.status(201).json(sanitizeDelivery(delivery));
  } catch (error: any) {
    console.error('[Delivery Controller] Create error:', error);
    res.status(500).json({
      error: 'Failed to create delivery',
      message: error.message,
    });
  }
}

/**
 * PUT /deliveries/:id
 * Update a delivery
 */
export async function updateDelivery(req: Request, res: Response): Promise<void> {
  try {
    const dataSource: DataSource = req.app.locals.dataSource;
    const deliveryRepo = dataSource.getRepository(Delivery);

    const delivery = await deliveryRepo.findOne({
      where: { id: req.params.id },
    });

    if (!delivery) {
      res.status(404).json({
        error: 'Delivery not found',
      });
      return;
    }

    const {
      status,
      delivery_personnel_id,
      tracking_info,
      tracking_number,
      failure_reason,
      // Controlled substance operations (T3-067)
      signature_image_encrypted,
      signed_by_name,
      age_verification_requested,
      verified_age_minimum,
      id_scan_data_encrypted,
      scanned_by_person_id,
    } = req.body;

    // Update fields
    if (status) {
      delivery.status = status;

      // Update timestamps based on status
      if (status === DeliveryStatus.IN_TRANSIT && !delivery.picked_up_at) {
        delivery.picked_up_at = new Date();
        // Check for cold chain violation at pickup (T3-066)
        if (delivery.requires_temperature_control) {
          delivery.addComplianceLog(
            'pickup',
            'Delivery picked up - temperature control required',
            'system'
          );
        }
      } else if (status === DeliveryStatus.DELIVERED && !delivery.delivered_at) {
        // Check controlled substance requirements before delivery (T3-067)
        if (delivery.contains_controlled_substance) {
          if (!delivery.areControlledSubstanceRequirementsMet()) {
            res.status(400).json({
              error: 'Cannot mark delivery as delivered: controlled substance requirements not met',
              missing_requirements: {
                signature: !delivery.isSignatureMet(),
                age_verified: delivery.age_verification_required && !delivery.isAgeVerified(),
                id_scanned: delivery.id_scanned && !delivery.isIdScanned(),
              },
            });
            return;
          }
        }
        delivery.delivered_at = new Date();
        delivery.addComplianceLog('delivery_completed', 'Delivery marked as completed', 'system');
      } else if (status === DeliveryStatus.FAILED && !delivery.failed_at) {
        delivery.failed_at = new Date();
        if (failure_reason) {
          delivery.failure_reason = failure_reason;
          delivery.addComplianceLog('delivery_failed', `Failure reason: ${failure_reason}`, 'system');
        }
      }
    }

    if (delivery_personnel_id !== undefined) {
      delivery.delivery_personnel_id = delivery_personnel_id;
    }

    if (tracking_info) {
      delivery.tracking_info = tracking_info;
    }

    if (tracking_number !== undefined) {
      delivery.tracking_number = tracking_number;
    }

    // Handle signature recording for controlled substances (T3-067)
    if (signature_image_encrypted) {
      if (!delivery.requires_signature) {
        res.status(400).json({
          error: 'Signature not required for this delivery',
        });
        return;
      }
      delivery.recordSignature(signature_image_encrypted, signed_by_name);
    }

    // Handle age verification for controlled substances (T3-067)
    if (age_verification_requested && verified_age_minimum) {
      if (!delivery.age_verification_required) {
        res.status(400).json({
          error: 'Age verification not required for this delivery',
        });
        return;
      }
      delivery.verifyAge(verified_age_minimum);
    }

    // Handle ID scan for controlled substances (T3-067)
    if (id_scan_data_encrypted) {
      delivery.scanId(id_scan_data_encrypted, scanned_by_person_id);
    }

    // Cold chain monitoring - check if delivery is taking too long (T3-066)
    if (delivery.requires_temperature_control && delivery.isExceedingMaxDuration()) {
      if (!delivery.temperature_alert_sent_at) {
        const maxMinutes = delivery.max_delivery_duration_minutes;
        delivery.triggerColdChainAlert(
          `Delivery exceeds maximum duration of ${maxMinutes} minutes. Temperature control may be compromised.`
        );
      }
    }

    await deliveryRepo.save(delivery);

    res.json(sanitizeDelivery(delivery));
  } catch (error: any) {
    console.error('[Delivery Controller] Update error:', error);
    res.status(500).json({
      error: 'Failed to update delivery',
      message: error.message,
    });
  }
}

/**
 * DELETE /deliveries/:id
 * Delete a delivery
 */
export async function deleteDelivery(req: Request, res: Response): Promise<void> {
  try {
    const dataSource: DataSource = req.app.locals.dataSource;
    const deliveryRepo = dataSource.getRepository(Delivery);

    const delivery = await deliveryRepo.findOne({
      where: { id: req.params.id },
    });

    if (!delivery) {
      res.status(404).json({
        error: 'Delivery not found',
      });
      return;
    }

    // Only allow deletion if pending or cancelled
    if (delivery.status !== DeliveryStatus.PENDING && delivery.status !== DeliveryStatus.CANCELLED) {
      res.status(400).json({
        error: 'Cannot delete delivery in current status',
        status: delivery.status,
      });
      return;
    }

    await deliveryRepo.remove(delivery);

    res.status(204).send();
  } catch (error: any) {
    console.error('[Delivery Controller] Delete error:', error);
    res.status(500).json({
      error: 'Failed to delete delivery',
      message: error.message,
    });
  }
}

/**
 * Sanitize delivery object for API response
 * Remove sensitive encrypted fields
 */
function sanitizeDelivery(delivery: Delivery): any {
  return {
    id: delivery.id,
    user_id: delivery.user_id,
    order_id: delivery.order_id,
    delivery_personnel_id: delivery.delivery_personnel_id,
    status: delivery.status,
    tracking_info: delivery.tracking_info,
    tracking_number: delivery.tracking_number,
    scheduled_at: delivery.scheduled_at,
    picked_up_at: delivery.picked_up_at,
    delivered_at: delivery.delivered_at,
    failed_at: delivery.failed_at,
    failure_reason: delivery.failure_reason,
    created_at: delivery.created_at,
    updated_at: delivery.updated_at,
    // Cold chain fields (T3-066)
    requires_temperature_control: delivery.requires_temperature_control,
    temperature_range_min: delivery.temperature_range_min,
    temperature_range_max: delivery.temperature_range_max,
    temperature_range_display: delivery.getTemperatureRangeDisplay(),
    max_delivery_duration_minutes: delivery.max_delivery_duration_minutes,
    temperature_alert_sent_at: delivery.temperature_alert_sent_at,
    temperature_alert_reason: delivery.temperature_alert_reason,
    special_handling_instructions: delivery.special_handling_instructions,
    // Controlled substance fields (T3-067)
    contains_controlled_substance: delivery.contains_controlled_substance,
    substance_schedule: delivery.substance_schedule,
    requires_signature: delivery.requires_signature,
    signature_obtained_at: delivery.signature_obtained_at,
    age_verification_required: delivery.age_verification_required,
    age_verified_at: delivery.age_verified_at,
    verified_age_minimum: delivery.verified_age_minimum,
    id_scanned: delivery.id_scanned,
    id_scanned_at: delivery.id_scanned_at,
    // Compliance
    compliance_log: delivery.getComplianceLog(),
    // Note: Encrypted fields (signature_image_encrypted, id_scan_data_encrypted, delivery_address_encrypted) are excluded for security
  };
}
