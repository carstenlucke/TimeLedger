import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';
import type { AppSettings } from '../shared/types';

export class DatabaseManager {
  private db: Database.Database;
  private dbPath: string;

  constructor() {
    // Create app data directory if it doesn't exist
    const userDataPath = app.getPath('userData');
    console.log('User data path:', userDataPath);
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }

    this.dbPath = path.join(userDataPath, 'db.sqlite');
    console.log('Database path:', this.dbPath);
    this.db = new Database(this.dbPath);
    this.db.pragma('journal_mode = WAL');
    console.log('Database opened, initializing tables...');
    this.initialize();
    console.log('Database initialization complete');
  }

  public getDbPath(): string {
    return this.dbPath;
  }

  private initialize(): void {
    // Create settings table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);

    // Create metadata table for versioning
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);

    // Initialize metadata values if missing
    this.db.exec(`
      INSERT INTO meta (key, value) VALUES ('data_version', '1')
      ON CONFLICT(key) DO NOTHING
    `);
    this.db.exec(`
      INSERT INTO meta (key, value) VALUES ('last_backup_version', '0')
      ON CONFLICT(key) DO NOTHING
    `);

    // Demo table - replace with your own tables
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS demo_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indices for demo table
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_demo_items_name ON demo_items(name);
    `);
  }

  // Settings methods
  public getSetting(key: string): string | null {
    const stmt = this.db.prepare('SELECT value FROM settings WHERE key = ?');
    const result = stmt.get(key) as { value: string } | undefined;
    return result ? result.value : null;
  }

  public setSetting(key: string, value: string): void {
    const stmt = this.db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);
    stmt.run(key, value);
    this.bumpDataVersion();
  }

  public getAllSettings(): AppSettings {
    const stmt = this.db.prepare('SELECT key, value FROM settings');
    const rows = stmt.all() as Array<{ key: string; value: string }>;
    const settings: AppSettings = {};
    rows.forEach((row) => {
      settings[row.key] = row.value;
    });
    return settings;
  }

  // Metadata methods
  public getMetaValue(key: string): string | null {
    const stmt = this.db.prepare('SELECT value FROM meta WHERE key = ?');
    const result = stmt.get(key) as { value: string } | undefined;
    return result ? result.value : null;
  }

  public setMetaValue(key: string, value: string): void {
    const stmt = this.db.prepare(`
      INSERT INTO meta (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);
    stmt.run(key, value);
  }

  // Bump data version to trigger backups
  public bumpDataVersion(): void {
    const currentVersion = parseInt(this.getMetaValue('data_version') || '0', 10);
    this.setMetaValue('data_version', (currentVersion + 1).toString());
  }

  // Demo methods - replace with your own business logic
  public createDemoItem(name: string, description?: string): number {
    const stmt = this.db.prepare(`
      INSERT INTO demo_items (name, description, created_at, updated_at)
      VALUES (?, ?, datetime('now'), datetime('now'))
    `);
    const result = stmt.run(name, description);
    this.bumpDataVersion();
    return result.lastInsertRowid as number;
  }

  public getAllDemoItems(): Array<{ id: number; name: string; description: string | null; created_at: string; updated_at: string }> {
    const stmt = this.db.prepare('SELECT * FROM demo_items ORDER BY created_at DESC');
    return stmt.all() as Array<{ id: number; name: string; description: string | null; created_at: string; updated_at: string }>;
  }

  public deleteDemoItem(id: number): void {
    const stmt = this.db.prepare('DELETE FROM demo_items WHERE id = ?');
    stmt.run(id);
    this.bumpDataVersion();
  }

  public close(): void {
    this.db.close();
  }
}

let dbManager: DatabaseManager | null = null;

export function getDatabase(): DatabaseManager {
  if (!dbManager) {
    dbManager = new DatabaseManager();
  }
  return dbManager;
}

export function closeDatabase(): void {
  if (dbManager) {
    dbManager.close();
    dbManager = null;
  }
}
