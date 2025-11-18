/**
 * Delivery Repository
 * Data access layer for delivery operations
 */

import db from '../database';
import { Delivery, DeliveryRow, DeliveryStatus, Location, rowToDelivery } from '../models/Delivery';

export class DeliveryRepository {
  /**
   * Create a new delivery
   */
  create(deliveryData: {
    orderId: string;
    pharmacyId: string;
    patientId: string;
    driverId?: string;
    pickupAddress: string;
    deliveryAddress: string;
    estimatedDeliveryTime: string;
  }): Delivery {
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO deliveries (
        orderId, pharmacyId, patientId, driverId,
        pickupAddress, deliveryAddress,
        estimatedDeliveryTime, status,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      deliveryData.orderId,
      deliveryData.pharmacyId,
      deliveryData.patientId,
      deliveryData.driverId || null,
      deliveryData.pickupAddress,
      deliveryData.deliveryAddress,
      deliveryData.estimatedDeliveryTime,
      'pending',
      now,
      now
    );

    const newDelivery = this.findById(String(result.lastInsertRowid));
    if (!newDelivery) {
      throw new Error('Failed to create delivery');
    }

    return newDelivery;
  }

  /**
   * Find delivery by ID
   */
  findById(id: string): Delivery | null {
    const stmt = db.prepare('SELECT * FROM deliveries WHERE id = ?');
    const row = stmt.get(id) as DeliveryRow | undefined;

    return row ? rowToDelivery(row) : null;
  }

  /**
   * Find all deliveries
   */
  findAll(): Delivery[] {
    const stmt = db.prepare('SELECT * FROM deliveries ORDER BY createdAt DESC');
    const rows = stmt.all() as DeliveryRow[];

    return rows.map(rowToDelivery);
  }

  /**
   * Update delivery status
   */
  updateStatus(
    id: string,
    status: DeliveryStatus,
    driverId?: string,
    actualDeliveryTime?: string
  ): Delivery | null {
    const now = new Date().toISOString();

    // Build dynamic update query
    const updates: string[] = ['status = ?', 'updatedAt = ?'];
    const params: any[] = [status, now];

    if (driverId !== undefined) {
      updates.push('driverId = ?');
      params.push(driverId);
    }

    if (actualDeliveryTime !== undefined) {
      updates.push('actualDeliveryTime = ?');
      params.push(actualDeliveryTime);
    }

    params.push(id);

    const stmt = db.prepare(`
      UPDATE deliveries
      SET ${updates.join(', ')}
      WHERE id = ?
    `);

    stmt.run(...params);

    return this.findById(id);
  }

  /**
   * Update delivery location
   */
  updateLocation(id: string, location: Location): Delivery | null {
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      UPDATE deliveries
      SET currentLocationLat = ?, currentLocationLng = ?, updatedAt = ?
      WHERE id = ?
    `);

    stmt.run(location.lat, location.lng, now, id);

    return this.findById(id);
  }

  /**
   * Delete all deliveries (for testing)
   */
  deleteAll(): void {
    db.exec('DELETE FROM deliveries');
  }
}

// Export singleton instance
export default new DeliveryRepository();
