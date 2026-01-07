import type { Migration } from './index';
import type Database from 'better-sqlite3';

export const migration001: Migration = {
  version: 1,
  name: 'initial_schema',
  up: (db: Database.Database) => {
    // Create projects table
    db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        hourly_rate REAL,
        client_name TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create time_entries table
    db.exec(`
      CREATE TABLE IF NOT EXISTS time_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        start_time TEXT,
        end_time TEXT,
        duration_minutes INTEGER NOT NULL,
        description TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
      )
    `);

    // Create settings table
    db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);

    // Create metadata table for versioning
    db.exec(`
      CREATE TABLE IF NOT EXISTS meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);

    // Initialize metadata values
    db.exec(`
      INSERT INTO meta (key, value) VALUES ('data_version', '1')
      ON CONFLICT(key) DO NOTHING
    `);
    db.exec(`
      INSERT INTO meta (key, value) VALUES ('last_backup_version', '0')
      ON CONFLICT(key) DO NOTHING
    `);

    // Create initial indices
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_time_entries_project_id ON time_entries(project_id);
      CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(date);
    `);
  },
};
