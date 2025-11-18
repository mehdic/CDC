/**
 * Database Connection and Initialization
 * Uses better-sqlite3 for SQLite database
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Database configuration
const DB_DIR = path.join(__dirname, '../../data');
const DB_PATH = process.env.NODE_ENV === 'test'
  ? ':memory:'
  : path.join(DB_DIR, 'deliveries.db');

// Ensure data directory exists (for non-test environments)
if (process.env.NODE_ENV !== 'test' && !fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Create database connection
const db = new Database(DB_PATH, {
  verbose: process.env.NODE_ENV === 'development' ? console.log : undefined,
});

// Enable foreign keys
db.pragma('foreign_keys = ON');

/**
 * Initialize database schema
 */
export function initializeDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS deliveries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      orderId TEXT NOT NULL,
      pharmacyId TEXT NOT NULL,
      patientId TEXT NOT NULL,
      driverId TEXT,
      pickupAddress TEXT NOT NULL,
      deliveryAddress TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      currentLocationLat REAL,
      currentLocationLng REAL,
      estimatedDeliveryTime TEXT NOT NULL,
      actualDeliveryTime TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,

      CHECK(status IN ('pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'failed'))
    )
  `);

  console.log('✅ Database schema initialized');
}

/**
 * Clear all data (for testing)
 */
export function clearDatabase(): void {
  db.exec('DELETE FROM deliveries');
}

/**
 * Close database connection
 */
export function closeDatabase(): void {
  db.close();
}

export default db;
