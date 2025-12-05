/**
 * Notification Integrations
 * Task T3-027: Integrate notifications throughout app
 *
 * Provides helper functions for sending notifications for common events:
 * - Prescription status changes
 * - Teleconsultation reminders
 * - Delivery status updates
 * - Low stock alerts for pharmacists
 */

import { NotificationService, NotificationCategory, NotificationPriority } from './notificationService';
import { AuditService } from './auditService';
import { Prescription } from '../models/Prescription';
import { Delivery } from '../models/Delivery';
import { Teleconsultation } from '../models/Teleconsultation';

/**
 * Notification Integration Helper
 * Provides domain-specific notification methods
 */
export class NotificationIntegrations {
  constructor(
    private notificationService: NotificationService,
    private auditService?: AuditService
  ) {}

  // ==================== Prescription Notifications ====================

  /**
   * Notify patient when prescription status changes
   */
  async notifyPrescriptionStatusChange(
    prescription: Prescription,
    oldStatus: string,
    newStatus: string,
    req?: any
  ): Promise<void> {
    const statusMessages: Record<string, { subject: string; message: string; priority: NotificationPriority }> = {
      approved: {
        subject: 'Ordonnance approuvée',
        message: `Votre ordonnance #${prescription.id.substring(0, 8)} a été approuvée et est prête à être préparée.`,
        priority: NotificationPriority.NORMAL,
      },
      rejected: {
        subject: 'Ordonnance rejetée',
        message: `Votre ordonnance #${prescription.id.substring(0, 8)} a été rejetée. Veuillez contacter la pharmacie pour plus d'informations.`,
        priority: NotificationPriority.HIGH,
      },
      dispensed: {
        subject: 'Ordonnance prête',
        message: `Votre ordonnance #${prescription.id.substring(0, 8)} est prête. Vous pouvez venir la chercher ou demander une livraison.`,
        priority: NotificationPriority.HIGH,
      },
      ready_for_pickup: {
        subject: 'Ordonnance prête à retirer',
        message: `Votre ordonnance #${prescription.id.substring(0, 8)} est prête à être retirée à la pharmacie.`,
        priority: NotificationPriority.HIGH,
      },
    };

    const config = statusMessages[newStatus];
    if (!config) {
      console.warn(`[NotificationIntegrations] No notification config for prescription status: ${newStatus}`);
      return;
    }

    try {
      await this.notificationService.sendMultiChannel(
        prescription.patient_id,
        config.subject,
        config.message,
        NotificationCategory.PRESCRIPTION_STATUS,
        ['email', 'push'] as any,
        {
          priority: config.priority,
          metadata: {
            prescription_id: prescription.id,
            old_status: oldStatus,
            new_status: newStatus,
          },
        }
      );

      // Log audit event if audit service is available
      if (this.auditService && req) {
        // Audit logging handled by prescription service
      }
    } catch (error) {
      console.error('[NotificationIntegrations] Failed to send prescription status notification:', error);
      // Don't throw - notification failure shouldn't block prescription processing
    }
  }

  /**
   * Notify pharmacist when prescription needs review
   */
  async notifyPharmacistNewPrescription(
    prescription: Prescription,
    pharmacistId: string
  ): Promise<void> {
    try {
      await this.notificationService.sendMultiChannel(
        pharmacistId,
        'Nouvelle ordonnance à valider',
        `Une nouvelle ordonnance #${prescription.id.substring(0, 8)} nécessite votre validation.`,
        NotificationCategory.PRESCRIPTION_STATUS,
        ['email', 'push'] as any,
        {
          priority: NotificationPriority.HIGH,
          metadata: {
            prescription_id: prescription.id,
            patient_id: prescription.patient_id,
          },
        }
      );
    } catch (error) {
      console.error('[NotificationIntegrations] Failed to notify pharmacist:', error);
    }
  }

  // ==================== Teleconsultation Notifications ====================

  /**
   * Notify when teleconsultation is scheduled
   */
  async notifyTeleconsultationScheduled(
    teleconsultation: Teleconsultation
  ): Promise<void> {
    const formattedTime = teleconsultation.scheduled_at.toLocaleString('fr-CH', {
      timeZone: 'Europe/Zurich',
      dateStyle: 'full',
      timeStyle: 'short',
    });

    // Notify patient
    try {
      await this.notificationService.sendMultiChannel(
        teleconsultation.patient_id,
        'Téléconsultation confirmée',
        `Votre téléconsultation est confirmée pour le ${formattedTime}.`,
        NotificationCategory.APPOINTMENT_REMINDER,
        ['email', 'push'] as any,
        {
          priority: NotificationPriority.NORMAL,
          metadata: {
            teleconsultation_id: teleconsultation.id,
            scheduled_at: teleconsultation.scheduled_at.toISOString(),
          },
        }
      );
    } catch (error) {
      console.error('[NotificationIntegrations] Failed to notify patient about scheduled teleconsultation:', error);
    }

    // Notify pharmacist
    try {
      await this.notificationService.sendEmail(
        teleconsultation.pharmacist_id,
        'Nouvelle téléconsultation',
        `Une téléconsultation a été planifiée pour le ${formattedTime}.`,
        NotificationCategory.APPOINTMENT_REMINDER,
        {
          priority: NotificationPriority.NORMAL,
          metadata: {
            teleconsultation_id: teleconsultation.id,
            patient_id: teleconsultation.patient_id,
          },
        }
      );
    } catch (error) {
      console.error('[NotificationIntegrations] Failed to notify pharmacist about scheduled teleconsultation:', error);
    }
  }

  /**
   * Notify when teleconsultation is cancelled
   */
  async notifyTeleconsultationCancelled(
    teleconsultation: Teleconsultation,
    cancelledBy: 'patient' | 'pharmacist',
    reason?: string
  ): Promise<void> {
    const formattedTime = teleconsultation.scheduled_at.toLocaleString('fr-CH', {
      timeZone: 'Europe/Zurich',
      dateStyle: 'full',
      timeStyle: 'short',
    });

    const message = reason
      ? `Votre téléconsultation du ${formattedTime} a été annulée. Raison: ${reason}`
      : `Votre téléconsultation du ${formattedTime} a été annulée.`;

    // Notify the other party
    const recipientId = cancelledBy === 'patient'
      ? teleconsultation.pharmacist_id
      : teleconsultation.patient_id;

    try {
      await this.notificationService.sendMultiChannel(
        recipientId,
        'Téléconsultation annulée',
        message,
        NotificationCategory.APPOINTMENT_REMINDER,
        ['email', 'push', 'sms'] as any,
        {
          priority: NotificationPriority.HIGH,
          metadata: {
            teleconsultation_id: teleconsultation.id,
            cancelled_by: cancelledBy,
            reason,
          },
        }
      );
    } catch (error) {
      console.error('[NotificationIntegrations] Failed to send cancellation notification:', error);
    }
  }

  // ==================== Delivery Notifications ====================

  /**
   * Notify when delivery status changes
   */
  async notifyDeliveryStatusChange(
    delivery: Delivery,
    oldStatus: string,
    newStatus: string
  ): Promise<void> {
    const statusMessages: Record<string, { subject: string; message: string; priority: NotificationPriority }> = {
      assigned: {
        subject: 'Livreur assigné',
        message: `Un livreur a été assigné à votre commande. Suivi en temps réel disponible.`,
        priority: NotificationPriority.NORMAL,
      },
      picked_up: {
        subject: 'Commande récupérée',
        message: `Votre commande a été récupérée par le livreur et est en route.`,
        priority: NotificationPriority.NORMAL,
      },
      in_transit: {
        subject: 'En cours de livraison',
        message: `Votre commande est en cours de livraison. Temps estimé: ${(delivery as any).estimated_delivery_time || 'bientôt'}.`,
        priority: NotificationPriority.HIGH,
      },
      delivered: {
        subject: 'Commande livrée',
        message: `Votre commande a été livrée avec succès. Merci pour votre confiance!`,
        priority: NotificationPriority.NORMAL,
      },
      failed: {
        subject: 'Problème de livraison',
        message: `Un problème est survenu lors de la livraison. Veuillez contacter la pharmacie.`,
        priority: NotificationPriority.URGENT,
      },
    };

    const config = statusMessages[newStatus];
    if (!config) {
      console.warn(`[NotificationIntegrations] No notification config for delivery status: ${newStatus}`);
      return;
    }

    try {
      await this.notificationService.sendMultiChannel(
        delivery.user_id,
        config.subject,
        config.message,
        NotificationCategory.DELIVERY_STATUS,
        ['push', 'sms'] as any, // Real-time updates via push/SMS
        {
          priority: config.priority,
          metadata: {
            delivery_id: delivery.id,
            old_status: oldStatus,
            new_status: newStatus,
            tracking_url: (delivery as any).tracking_url || delivery.tracking_number,
          },
        }
      );
    } catch (error) {
      console.error('[NotificationIntegrations] Failed to send delivery status notification:', error);
    }
  }

  /**
   * Notify delivery personnel when delivery is assigned
   */
  async notifyDeliveryPersonnelAssigned(
    delivery: Delivery,
    deliveryPersonId: string
  ): Promise<void> {
    try {
      // Note: pharmacy and pharmacy_id are not part of Delivery entity in current schema
      // They should be passed as separate parameters in production
      const pharmacy = (delivery as any).pharmacy;
      const pharmacyId = (delivery as any).pharmacy_id;

      await this.notificationService.sendMultiChannel(
        deliveryPersonId,
        'Nouvelle livraison assignée',
        `Une nouvelle livraison vous a été assignée. Veuillez la récupérer à la pharmacie ${pharmacy?.name || 'la pharmacie assignée'}.`,
        NotificationCategory.DELIVERY_STATUS,
        ['push', 'sms'] as any,
        {
          priority: NotificationPriority.HIGH,
          metadata: {
            delivery_id: delivery.id,
            pharmacy_id: pharmacyId,
            patient_address: (delivery as any).delivery_address || 'Voir détails dans l\'application',
          },
        }
      );
    } catch (error) {
      console.error('[NotificationIntegrations] Failed to notify delivery personnel:', error);
    }
  }

  // ==================== Inventory Notifications ====================

  /**
   * Notify pharmacist when inventory is low
   */
  async notifyLowStock(
    pharmacistId: string,
    pharmacyId: string,
    itemName: string,
    currentQuantity: number,
    threshold: number,
    inventoryItemId: string
  ): Promise<void> {
    try {
      await this.notificationService.sendMultiChannel(
        pharmacistId,
        'Alerte stock faible',
        `Le stock de "${itemName}" est faible (${currentQuantity} unités restantes, seuil: ${threshold}). Veuillez réapprovisionner.`,
        NotificationCategory.LOW_STOCK_ALERT,
        ['email', 'push'] as any,
        {
          priority: currentQuantity === 0 ? NotificationPriority.URGENT : NotificationPriority.HIGH,
          metadata: {
            inventory_item_id: inventoryItemId,
            item_name: itemName,
            current_quantity: currentQuantity,
            threshold,
            pharmacy_id: pharmacyId,
          },
        }
      );

      // Log audit event
      if (this.auditService) {
        await this.auditService.logInventoryLowStock(
          pharmacistId,
          pharmacyId,
          inventoryItemId,
          currentQuantity,
          threshold
        );
      }
    } catch (error) {
      console.error('[NotificationIntegrations] Failed to send low stock alert:', error);
    }
  }

  /**
   * Notify pharmacist when inventory item expired
   */
  async notifyInventoryExpired(
    pharmacistId: string,
    pharmacyId: string,
    itemName: string,
    quantity: number,
    expiryDate: Date,
    inventoryItemId: string
  ): Promise<void> {
    try {
      await this.notificationService.sendMultiChannel(
        pharmacistId,
        'Alerte produit expiré',
        `Le produit "${itemName}" a expiré (${quantity} unités, date d'expiration: ${expiryDate.toLocaleDateString('fr-CH')}). Veuillez retirer du stock.`,
        NotificationCategory.LOW_STOCK_ALERT,
        ['email', 'push'] as any,
        {
          priority: NotificationPriority.URGENT,
          metadata: {
            inventory_item_id: inventoryItemId,
            item_name: itemName,
            quantity,
            expiry_date: expiryDate.toISOString(),
            pharmacy_id: pharmacyId,
          },
        }
      );
    } catch (error) {
      console.error('[NotificationIntegrations] Failed to send expired inventory alert:', error);
    }
  }
}

/**
 * Singleton instance
 */
let integrationInstance: NotificationIntegrations | null = null;

/**
 * Initialize notification integrations
 */
export function initializeNotificationIntegrations(
  notificationService: NotificationService,
  auditService?: AuditService
): NotificationIntegrations {
  integrationInstance = new NotificationIntegrations(notificationService, auditService);
  return integrationInstance;
}

/**
 * Get notification integrations instance
 */
export function getNotificationIntegrations(): NotificationIntegrations {
  if (!integrationInstance) {
    throw new Error('NotificationIntegrations not initialized');
  }
  return integrationInstance;
}
