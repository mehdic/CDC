/**
 * Database Setup for Teleconsultation Service
 * SQLite database with better-sqlite3
 */

import Database, { Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Database file path
const dbDir = path.resolve(__dirname, '../../data');
const dbPath = path.join(dbDir, 'teleconsultation.sqlite');

// Ensure data directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize database
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

/**
 * Initialize database schema
 */
export function initializeDatabase(): void {
  // Create sessions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pharmacyId TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('scheduled', 'active', 'paused', 'completed', 'cancelled')),
      scheduledAt TEXT,
      startedAt TEXT,
      endedAt TEXT,
      notes TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  // Create participants table
  db.exec(`
    CREATE TABLE IF NOT EXISTS participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sessionId INTEGER NOT NULL,
      userId TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('pharmacist', 'doctor', 'patient', 'nurse')),
      joinedAt TEXT,
      leftAt TEXT,
      FOREIGN KEY (sessionId) REFERENCES sessions(id) ON DELETE CASCADE
    )
  `);

  // Create recordings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS recordings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sessionId INTEGER NOT NULL,
      startedAt TEXT NOT NULL,
      endedAt TEXT,
      fileUrl TEXT,
      duration INTEGER,
      FOREIGN KEY (sessionId) REFERENCES sessions(id) ON DELETE CASCADE
    )
  `);

  // Create indexes for better query performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_sessions_pharmacy ON sessions(pharmacyId);
    CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
    CREATE INDEX IF NOT EXISTS idx_participants_session ON participants(sessionId);
    CREATE INDEX IF NOT EXISTS idx_participants_user ON participants(userId);
    CREATE INDEX IF NOT EXISTS idx_recordings_session ON recordings(sessionId);
  `);

  console.log('[Teleconsultation Service] ✓ Database schema initialized');
}

/**
 * Clear all data from database (for testing)
 */
export function clearDatabase(): void {
  db.exec('DELETE FROM recordings');
  db.exec('DELETE FROM participants');
  db.exec('DELETE FROM sessions');
  console.log('[Teleconsultation Service] ✓ Database cleared');
}

/**
 * Close database connection
 */
export function closeDatabase(): void {
  db.close();
}

// Export default with explicit type to avoid TS4023 error
const database: DatabaseType = db;
export default database;
