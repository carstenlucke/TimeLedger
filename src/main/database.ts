import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';
import type {
  Project,
  TimeEntry,
  ProjectInput,
  TimeEntryInput,
  ReportFilter,
  ProjectReport,
  AppSettings,
} from '../shared/types';

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
    // Create projects table
    this.db.exec(`
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
    this.db.exec(`
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
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);

    // Create indices
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_time_entries_project_id ON time_entries(project_id);
      CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(date);
    `);
  }

  // Project methods
  public createProject(input: ProjectInput): Project {
    const stmt = this.db.prepare(`
      INSERT INTO projects (name, hourly_rate, client_name, created_at, updated_at)
      VALUES (?, ?, ?, datetime('now'), datetime('now'))
    `);
    const result = stmt.run(input.name, input.hourly_rate, input.client_name);
    return this.getProjectById(result.lastInsertRowid as number)!;
  }

  public updateProject(id: number, input: Partial<ProjectInput>): Project {
    const updates: string[] = [];
    const values: any[] = [];

    if (input.name !== undefined) {
      updates.push('name = ?');
      values.push(input.name);
    }
    if (input.hourly_rate !== undefined) {
      updates.push('hourly_rate = ?');
      values.push(input.hourly_rate);
    }
    if (input.client_name !== undefined) {
      updates.push('client_name = ?');
      values.push(input.client_name);
    }

    updates.push("updated_at = datetime('now')");
    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE projects SET ${updates.join(', ')} WHERE id = ?
    `);
    stmt.run(...values);
    return this.getProjectById(id)!;
  }

  public deleteProject(id: number): void {
    const stmt = this.db.prepare('DELETE FROM projects WHERE id = ?');
    stmt.run(id);
  }

  public getAllProjects(): Project[] {
    const stmt = this.db.prepare('SELECT * FROM projects ORDER BY name');
    return stmt.all() as Project[];
  }

  public getProjectById(id: number): Project | undefined {
    const stmt = this.db.prepare('SELECT * FROM projects WHERE id = ?');
    return stmt.get(id) as Project | undefined;
  }

  // Time Entry methods
  public createTimeEntry(input: TimeEntryInput): TimeEntry {
    let durationMinutes = input.duration_minutes;

    // Calculate duration from start/end times if not provided
    if (!durationMinutes && input.start_time && input.end_time) {
      const start = new Date(`${input.date}T${input.start_time}`);
      const end = new Date(`${input.date}T${input.end_time}`);
      durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
    }

    if (!durationMinutes || durationMinutes <= 0) {
      throw new Error('Duration must be provided or calculated from start/end times');
    }

    const stmt = this.db.prepare(`
      INSERT INTO time_entries (project_id, date, start_time, end_time, duration_minutes, description, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);
    const result = stmt.run(
      input.project_id,
      input.date,
      input.start_time,
      input.end_time,
      durationMinutes,
      input.description
    );
    return this.getTimeEntryById(result.lastInsertRowid as number)!;
  }

  public updateTimeEntry(id: number, input: Partial<TimeEntryInput>): TimeEntry {
    const current = this.getTimeEntryById(id);
    if (!current) {
      throw new Error('Time entry not found');
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (input.project_id !== undefined) {
      updates.push('project_id = ?');
      values.push(input.project_id);
    }
    if (input.date !== undefined) {
      updates.push('date = ?');
      values.push(input.date);
    }
    if (input.start_time !== undefined) {
      updates.push('start_time = ?');
      values.push(input.start_time);
    }
    if (input.end_time !== undefined) {
      updates.push('end_time = ?');
      values.push(input.end_time);
    }
    if (input.description !== undefined) {
      updates.push('description = ?');
      values.push(input.description);
    }

    // Recalculate duration if necessary
    const startTime = input.start_time ?? current.start_time;
    const endTime = input.end_time ?? current.end_time;
    const date = input.date ?? current.date;

    if (input.duration_minutes !== undefined) {
      updates.push('duration_minutes = ?');
      values.push(input.duration_minutes);
    } else if (startTime && endTime) {
      const start = new Date(`${date}T${startTime}`);
      const end = new Date(`${date}T${endTime}`);
      const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
      updates.push('duration_minutes = ?');
      values.push(durationMinutes);
    }

    updates.push("updated_at = datetime('now')");
    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE time_entries SET ${updates.join(', ')} WHERE id = ?
    `);
    stmt.run(...values);
    return this.getTimeEntryById(id)!;
  }

  public deleteTimeEntry(id: number): void {
    const stmt = this.db.prepare('DELETE FROM time_entries WHERE id = ?');
    stmt.run(id);
  }

  public getAllTimeEntries(): TimeEntry[] {
    const stmt = this.db.prepare('SELECT * FROM time_entries ORDER BY date DESC, start_time DESC');
    return stmt.all() as TimeEntry[];
  }

  public getTimeEntryById(id: number): TimeEntry | undefined {
    const stmt = this.db.prepare('SELECT * FROM time_entries WHERE id = ?');
    return stmt.get(id) as TimeEntry | undefined;
  }

  public getTimeEntriesByProject(projectId: number): TimeEntry[] {
    const stmt = this.db.prepare(
      'SELECT * FROM time_entries WHERE project_id = ? ORDER BY date DESC, start_time DESC'
    );
    return stmt.all(projectId) as TimeEntry[];
  }

  public getTimeEntriesByDateRange(startDate: string, endDate: string): TimeEntry[] {
    const stmt = this.db.prepare(
      'SELECT * FROM time_entries WHERE date >= ? AND date <= ? ORDER BY date DESC, start_time DESC'
    );
    return stmt.all(startDate, endDate) as TimeEntry[];
  }

  // Reporting methods
  public generateReport(filter: ReportFilter): ProjectReport[] {
    const { start_date, end_date, project_ids } = filter;

    // Build query based on whether date filtering is enabled
    let query = `
      SELECT
        p.id as project_id,
        p.name as project_name,
        p.client_name,
        p.hourly_rate,
        SUM(te.duration_minutes) as total_minutes
      FROM projects p
      LEFT JOIN time_entries te ON p.id = te.project_id
    `;

    const params: any[] = [];

    // Add date filtering if provided
    if (start_date && end_date) {
      query += ' AND te.date >= ? AND te.date <= ?';
      params.push(start_date, end_date);
    }

    // Add project filtering if provided
    if (project_ids && project_ids.length > 0) {
      query += ` WHERE p.id IN (${project_ids.map(() => '?').join(',')})`;
      params.push(...project_ids);
    }

    query += ' GROUP BY p.id ORDER BY p.name';

    const stmt = this.db.prepare(query);
    const results = stmt.all(...params) as any[];

    return results.map((row) => {
      const totalMinutes = row.total_minutes || 0;
      const totalHours = totalMinutes / 60;
      const totalValue = row.hourly_rate ? totalHours * row.hourly_rate : undefined;

      // Get entries for this project
      let entriesQuery = 'SELECT * FROM time_entries WHERE project_id = ?';
      const entriesParams: any[] = [row.project_id];

      if (start_date && end_date) {
        entriesQuery += ' AND date >= ? AND date <= ?';
        entriesParams.push(start_date, end_date);
      }

      entriesQuery += ' ORDER BY date DESC, start_time DESC';

      const entriesStmt = this.db.prepare(entriesQuery);
      const entries = entriesStmt.all(...entriesParams) as TimeEntry[];

      return {
        project_id: row.project_id,
        project_name: row.project_name,
        client_name: row.client_name,
        hourly_rate: row.hourly_rate,
        total_minutes: totalMinutes,
        total_hours: totalHours,
        total_value: totalValue,
        entries,
      };
    });
  }

  // Settings methods
  public getSetting(key: string): string | undefined {
    const stmt = this.db.prepare('SELECT value FROM settings WHERE key = ?');
    const result = stmt.get(key) as { value: string } | undefined;
    return result?.value;
  }

  public setSetting(key: string, value: string): void {
    const stmt = this.db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);
    stmt.run(key, value);
  }

  public getSettings(): AppSettings {
    return {
      backup_directory: this.getSetting('backup_directory'),
      last_backup: this.getSetting('last_backup'),
    };
  }

  public updateSettings(settings: Partial<AppSettings>): void {
    if (settings.backup_directory !== undefined) {
      this.setSetting('backup_directory', settings.backup_directory);
    }
    if (settings.last_backup !== undefined) {
      this.setSetting('last_backup', settings.last_backup);
    }
  }

  public close(): void {
    this.db.close();
  }
}

// Singleton instance
let dbInstance: DatabaseManager | null = null;

export function getDatabase(): DatabaseManager {
  if (!dbInstance) {
    dbInstance = new DatabaseManager();
  }
  return dbInstance;
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
