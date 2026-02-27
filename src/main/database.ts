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
  Invoice,
  InvoiceInput,
  InvoiceWithEntries,
  Customer,
  CustomerInput,
} from '../shared/types';
import { MigrationRunner } from './migrations';

export class DatabaseManager {
  private db: Database.Database;
  private dbPath: string;
  private migrationRunner: MigrationRunner;

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

    // Initialize migration runner
    this.migrationRunner = new MigrationRunner(this.db);

    console.log('Database opened, running migrations...');
    this.runMigrations();
    console.log('Database initialization complete');
  }

  public getDbPath(): string {
    return this.dbPath;
  }

  /**
   * Run database migrations
   */
  private runMigrations(): void {
    const { applied, currentVersion } = this.migrationRunner.runMigrations();
    if (applied > 0) {
      console.log(`Applied ${applied} migration(s). Schema version: ${currentVersion}`);
    }
  }

  /**
   * Get current schema version
   */
  public getSchemaVersion(): number {
    return this.migrationRunner.getCurrentVersion();
  }

  /**
   * Check if migrations are pending
   */
  public hasPendingMigrations(): boolean {
    return this.migrationRunner.needsMigration();
  }

  /**
   * Get migration info
   */
  public getMigrationInfo(): {
    currentVersion: number;
    latestVersion: number;
    appliedMigrations: { version: number; name: string; applied_at: string }[];
  } {
    return {
      currentVersion: this.migrationRunner.getCurrentVersion(),
      latestVersion: this.migrationRunner.getLatestVersion(),
      appliedMigrations: this.migrationRunner.getAppliedMigrations(),
    };
  }

  // Project methods
  public createProject(input: ProjectInput): Project {
    const stmt = this.db.prepare(`
      INSERT INTO projects (name, hourly_rate, client_name, customer_id, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);
    const result = stmt.run(input.name, input.hourly_rate, input.client_name, input.customer_id, input.status || 'active');
    this.bumpDataVersion();
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
    if (input.customer_id !== undefined) {
      updates.push('customer_id = ?');
      values.push(input.customer_id);
    }
    if (input.status !== undefined) {
      updates.push('status = ?');
      values.push(input.status);
    }

    updates.push("updated_at = datetime('now')");
    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE projects SET ${updates.join(', ')} WHERE id = ?
    `);
    stmt.run(...values);
    this.bumpDataVersion();
    return this.getProjectById(id)!;
  }

  public deleteProject(id: number): void {
    const stmt = this.db.prepare('DELETE FROM projects WHERE id = ?');
    stmt.run(id);
    this.bumpDataVersion();
  }

  public getAllProjects(): Project[] {
    const stmt = this.db.prepare('SELECT * FROM projects ORDER BY name');
    return stmt.all() as Project[];
  }

  public getProjectById(id: number): Project | undefined {
    const stmt = this.db.prepare('SELECT * FROM projects WHERE id = ?');
    return stmt.get(id) as Project | undefined;
  }

  // Customer methods
  public createCustomer(input: CustomerInput): Customer {
    const stmt = this.db.prepare(`
      INSERT INTO customers (name, email, phone, address, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);
    const result = stmt.run(input.name, input.email, input.phone, input.address, input.notes);
    this.bumpDataVersion();
    return this.getCustomerById(result.lastInsertRowid as number)!;
  }

  public updateCustomer(id: number, input: Partial<CustomerInput>): Customer {
    const updates: string[] = [];
    const values: any[] = [];

    if (input.name !== undefined) {
      updates.push('name = ?');
      values.push(input.name);
    }
    if (input.email !== undefined) {
      updates.push('email = ?');
      values.push(input.email);
    }
    if (input.phone !== undefined) {
      updates.push('phone = ?');
      values.push(input.phone);
    }
    if (input.address !== undefined) {
      updates.push('address = ?');
      values.push(input.address);
    }
    if (input.notes !== undefined) {
      updates.push('notes = ?');
      values.push(input.notes);
    }

    updates.push("updated_at = datetime('now')");
    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE customers SET ${updates.join(', ')} WHERE id = ?
    `);
    stmt.run(...values);
    this.bumpDataVersion();
    return this.getCustomerById(id)!;
  }

  public deleteCustomer(id: number): void {
    // Set customer_id to NULL in projects that reference this customer
    const updateStmt = this.db.prepare('UPDATE projects SET customer_id = NULL WHERE customer_id = ?');
    updateStmt.run(id);

    // Delete the customer
    const stmt = this.db.prepare('DELETE FROM customers WHERE id = ?');
    stmt.run(id);
    this.bumpDataVersion();
  }

  public getAllCustomers(): Customer[] {
    const stmt = this.db.prepare('SELECT * FROM customers ORDER BY name');
    return stmt.all() as Customer[];
  }

  public getCustomerById(id: number): Customer | undefined {
    const stmt = this.db.prepare('SELECT * FROM customers WHERE id = ?');
    return stmt.get(id) as Customer | undefined;
  }

  public getDashboardStatistics(): any {
    // Project counts by status
    const projectCounts = this.db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'paused' THEN 1 ELSE 0 END) as paused
      FROM projects
    `).get() as any;

    // Revenue breakdown by project status
    const revenueBreakdown = this.db.prepare(`
      SELECT
        p.status,
        SUM(te.duration_minutes * COALESCE(p.hourly_rate, 0) / 60.0) as revenue
      FROM projects p
      LEFT JOIN time_entries te ON p.id = te.project_id
      GROUP BY p.status
    `).all() as any[];

    const revenueMap = new Map<string, number>();
    revenueBreakdown.forEach(row => {
      revenueMap.set(row.status, row.revenue || 0);
    });

    // Unbilled revenue
    const unbilled = this.db.prepare(`
      SELECT
        SUM(te.duration_minutes * COALESCE(p.hourly_rate, 0) / 60.0) as unbilled_revenue,
        SUM(te.duration_minutes) as unbilled_minutes
      FROM time_entries te
      JOIN projects p ON te.project_id = p.id
      WHERE te.billing_status = 'unbilled'
    `).get() as any;

    return {
      totalProjects: projectCounts.total || 0,
      activeProjects: projectCounts.active || 0,
      completedProjects: projectCounts.completed || 0,
      pausedProjects: projectCounts.paused || 0,

      totalRevenue: Array.from(revenueMap.values()).reduce((sum, val) => sum + val, 0),
      activeRevenue: revenueMap.get('active') || 0,
      completedRevenue: revenueMap.get('completed') || 0,
      pausedRevenue: revenueMap.get('paused') || 0,

      unbilledRevenue: unbilled?.unbilled_revenue || 0,
      unbilledHours: (unbilled?.unbilled_minutes || 0) / 60,
    };
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
    this.bumpDataVersion();
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
    this.bumpDataVersion();
    return this.getTimeEntryById(id)!;
  }

  public deleteTimeEntry(id: number): void {
    const stmt = this.db.prepare('DELETE FROM time_entries WHERE id = ?');
    stmt.run(id);
    this.bumpDataVersion();
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

  // Search methods
  public searchGlobal(query: string): {
    projects: Array<Project & { match_field: string }>;
    customers: Array<Customer & { match_field: string }>;
    timeEntries: Array<any>;
    invoices: Array<Invoice & { match_field: string }>;
  } {
    const searchPattern = `%${query}%`;

    // Search Projects (name, client_name)
    const projectsStmt = this.db.prepare(`
      SELECT
        *,
        CASE
          WHEN name LIKE ? THEN 'name'
          WHEN client_name LIKE ? THEN 'client_name'
          ELSE 'unknown'
        END as match_field
      FROM projects
      WHERE name LIKE ? OR client_name LIKE ?
      ORDER BY name
      LIMIT 10
    `);
    const projects = projectsStmt.all(searchPattern, searchPattern, searchPattern, searchPattern) as Array<Project & { match_field: string }>;

    // Search Customers (name, email, phone, address, notes)
    const customersStmt = this.db.prepare(`
      SELECT
        *,
        CASE
          WHEN name LIKE ? THEN 'name'
          WHEN email LIKE ? THEN 'email'
          WHEN phone LIKE ? THEN 'phone'
          WHEN address LIKE ? THEN 'address'
          WHEN notes LIKE ? THEN 'notes'
          ELSE 'unknown'
        END as match_field
      FROM customers
      WHERE name LIKE ? OR email LIKE ? OR phone LIKE ? OR address LIKE ? OR notes LIKE ?
      ORDER BY name
      LIMIT 10
    `);
    const customers = customersStmt.all(
      searchPattern, searchPattern, searchPattern, searchPattern, searchPattern,
      searchPattern, searchPattern, searchPattern, searchPattern, searchPattern
    ) as Array<Customer & { match_field: string }>;

    // Search Time Entries (description + joined project name)
    const entriesStmt = this.db.prepare(`
      SELECT
        te.*,
        p.name as project_name,
        p.hourly_rate,
        CASE
          WHEN te.description LIKE ? THEN 'description'
          WHEN p.name LIKE ? THEN 'project_name'
          ELSE 'unknown'
        END as match_field
      FROM time_entries te
      LEFT JOIN projects p ON te.project_id = p.id
      WHERE te.description LIKE ? OR p.name LIKE ?
      ORDER BY te.date DESC
      LIMIT 10
    `);
    const timeEntries = entriesStmt.all(searchPattern, searchPattern, searchPattern, searchPattern) as any[];

    // Search Invoices (invoice_number, external_invoice_number, notes)
    const invoicesStmt = this.db.prepare(`
      SELECT
        *,
        CASE
          WHEN invoice_number LIKE ? THEN 'invoice_number'
          WHEN external_invoice_number LIKE ? THEN 'external_invoice_number'
          WHEN notes LIKE ? THEN 'notes'
          ELSE 'unknown'
        END as match_field
      FROM invoices
      WHERE invoice_number LIKE ? OR external_invoice_number LIKE ? OR notes LIKE ?
      ORDER BY invoice_date DESC
      LIMIT 10
    `);
    const invoices = invoicesStmt.all(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern) as Array<Invoice & { match_field: string }>;

    return { projects, customers, timeEntries, invoices };
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

  private getMeta(key: string): string | undefined {
    const stmt = this.db.prepare('SELECT value FROM meta WHERE key = ?');
    const result = stmt.get(key) as { value: string } | undefined;
    return result?.value;
  }

  private setMeta(key: string, value: string): void {
    const stmt = this.db.prepare(`
      INSERT INTO meta (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);
    stmt.run(key, value);
  }

  private getMetaNumber(key: string, defaultValue: number): number {
    const value = this.getMeta(key);
    const parsed = value ? Number.parseInt(value, 10) : NaN;
    return Number.isFinite(parsed) ? parsed : defaultValue;
  }

  private bumpDataVersion(): void {
    this.db.prepare(`
      INSERT INTO meta (key, value) VALUES ('data_version', '1')
      ON CONFLICT(key) DO UPDATE SET value = CAST(value AS INTEGER) + 1
    `).run();
  }

  public getDataVersion(): number {
    return this.getMetaNumber('data_version', 0);
  }

  public getLastBackupVersion(): number {
    return this.getMetaNumber('last_backup_version', 0);
  }

  public setLastBackupVersion(version: number): void {
    this.setMeta('last_backup_version', String(version));
  }

  public getSettings(): AppSettings {
    const windowX = this.getSetting('window_x');
    const windowY = this.getSetting('window_y');
    const windowWidth = this.getSetting('window_width');
    const windowHeight = this.getSetting('window_height');
    const windowMaximized = this.getSetting('window_maximized');

    return {
      backup_directory: this.getSetting('backup_directory'),
      last_backup: this.getSetting('last_backup'),
      window_x: windowX ? parseInt(windowX, 10) : undefined,
      window_y: windowY ? parseInt(windowY, 10) : undefined,
      window_width: windowWidth ? parseInt(windowWidth, 10) : undefined,
      window_height: windowHeight ? parseInt(windowHeight, 10) : undefined,
      window_maximized: windowMaximized === 'true',
    };
  }

  public updateSettings(settings: Partial<AppSettings>): void {
    if (settings.backup_directory !== undefined) {
      this.setSetting('backup_directory', settings.backup_directory);
    }
    if (settings.last_backup !== undefined) {
      this.setSetting('last_backup', settings.last_backup);
    }
    if (settings.window_x !== undefined) {
      this.setSetting('window_x', settings.window_x.toString());
    }
    if (settings.window_y !== undefined) {
      this.setSetting('window_y', settings.window_y.toString());
    }
    if (settings.window_width !== undefined) {
      this.setSetting('window_width', settings.window_width.toString());
    }
    if (settings.window_height !== undefined) {
      this.setSetting('window_height', settings.window_height.toString());
    }
    if (settings.window_maximized !== undefined) {
      this.setSetting('window_maximized', settings.window_maximized.toString());
    }
  }

  // Invoice methods
  public createInvoice(input: InvoiceInput): Invoice {
    const stmt = this.db.prepare(`
      INSERT INTO invoices (invoice_number, invoice_date, type, status, total_amount, external_invoice_number, net_amount, gross_amount, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);
    const result = stmt.run(
      input.invoice_number,
      input.invoice_date,
      input.type ?? 'internal',
      input.status ?? 'draft',
      input.total_amount ?? 0,
      input.external_invoice_number ?? null,
      input.net_amount ?? null,
      input.gross_amount ?? null,
      input.notes
    );
    this.bumpDataVersion();
    return this.getInvoiceById(result.lastInsertRowid as number)!;
  }

  public updateInvoice(id: number, input: Partial<InvoiceInput>): Invoice {
    const updates: string[] = [];
    const values: any[] = [];

    if (input.invoice_number !== undefined) {
      updates.push('invoice_number = ?');
      values.push(input.invoice_number);
    }
    if (input.invoice_date !== undefined) {
      updates.push('invoice_date = ?');
      values.push(input.invoice_date);
    }
    if (input.type !== undefined) {
      updates.push('type = ?');
      values.push(input.type);
    }
    if (input.status !== undefined) {
      updates.push('status = ?');
      values.push(input.status);
    }
    if (input.total_amount !== undefined) {
      updates.push('total_amount = ?');
      values.push(input.total_amount);
    }
    if (input.external_invoice_number !== undefined) {
      updates.push('external_invoice_number = ?');
      values.push(input.external_invoice_number);
    }
    if (input.net_amount !== undefined) {
      updates.push('net_amount = ?');
      values.push(input.net_amount);
    }
    if (input.gross_amount !== undefined) {
      updates.push('gross_amount = ?');
      values.push(input.gross_amount);
    }
    if (input.notes !== undefined) {
      updates.push('notes = ?');
      values.push(input.notes);
    }
    if (input.cancellation_reason !== undefined) {
      updates.push('cancellation_reason = ?');
      values.push(input.cancellation_reason);
    }

    updates.push("updated_at = datetime('now')");
    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE invoices SET ${updates.join(', ')} WHERE id = ?
    `);
    stmt.run(...values);
    this.bumpDataVersion();
    return this.getInvoiceById(id)!;
  }

  public deleteInvoice(id: number): void {
    // Release all time entries from this invoice
    const releaseStmt = this.db.prepare(`
      UPDATE time_entries
      SET invoice_id = NULL, billing_status = 'unbilled'
      WHERE invoice_id = ?
    `);
    releaseStmt.run(id);

    // Delete the invoice
    const stmt = this.db.prepare('DELETE FROM invoices WHERE id = ?');
    stmt.run(id);
    this.bumpDataVersion();
  }

  public getAllInvoices(): Invoice[] {
    const stmt = this.db.prepare('SELECT * FROM invoices ORDER BY invoice_date DESC');
    return stmt.all() as Invoice[];
  }

  public getInvoiceById(id: number): Invoice | undefined {
    const stmt = this.db.prepare('SELECT * FROM invoices WHERE id = ?');
    return stmt.get(id) as Invoice | undefined;
  }

  public getInvoiceWithEntries(id: number): InvoiceWithEntries | undefined {
    const invoice = this.getInvoiceById(id);
    if (!invoice) return undefined;

    const entriesStmt = this.db.prepare(`
      SELECT te.*, p.name as project_name, p.hourly_rate
      FROM time_entries te
      LEFT JOIN projects p ON te.project_id = p.id
      WHERE te.invoice_id = ?
      ORDER BY te.date DESC
    `);
    const entries = entriesStmt.all(id) as any[];

    return {
      ...invoice,
      entries,
    };
  }

  public addTimeEntriesToInvoice(invoiceId: number, entryIds: number[]): void {
    // Check if invoice exists and is in draft status
    const invoice = this.getInvoiceById(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    if (invoice.status !== 'draft') {
      throw new Error('Can only add entries to draft invoices');
    }

    // Check if any entries are already billed (not unbilled)
    const checkStmt = this.db.prepare(`
      SELECT id FROM time_entries
      WHERE id IN (${entryIds.map(() => '?').join(',')})
      AND billing_status != 'unbilled'
    `);
    const alreadyBilled = checkStmt.all(...entryIds) as any[];
    if (alreadyBilled.length > 0) {
      throw new Error('Some entries are already billed to another invoice');
    }

    // Add entries to invoice
    const stmt = this.db.prepare(`
      UPDATE time_entries
      SET invoice_id = ?, billing_status = 'in_draft'
      WHERE id = ?
    `);

    for (const entryId of entryIds) {
      stmt.run(invoiceId, entryId);
    }

    // Recalculate invoice total
    this.recalculateInvoiceTotal(invoiceId);
    this.bumpDataVersion();
  }

  public removeTimeEntriesFromInvoice(entryIds: number[]): void {
    const stmt = this.db.prepare(`
      UPDATE time_entries
      SET invoice_id = NULL, billing_status = 'unbilled'
      WHERE id = ?
    `);

    const invoiceIds = new Set<number>();

    // Get invoice IDs first
    const getInvoiceStmt = this.db.prepare('SELECT invoice_id FROM time_entries WHERE id = ?');
    for (const entryId of entryIds) {
      const result = getInvoiceStmt.get(entryId) as { invoice_id?: number } | undefined;
      if (result?.invoice_id) {
        invoiceIds.add(result.invoice_id);
      }
    }

    // Remove entries
    for (const entryId of entryIds) {
      stmt.run(entryId);
    }

    // Recalculate totals for affected invoices
    for (const invoiceId of invoiceIds) {
      this.recalculateInvoiceTotal(invoiceId);
    }
    this.bumpDataVersion();
  }

  public finalizeInvoice(id: number): Invoice {
    const invoice = this.getInvoiceById(id);
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    if (invoice.status !== 'draft') {
      throw new Error('Only draft invoices can be finalized');
    }

    // Update invoice status
    const updateInvoiceStmt = this.db.prepare(`
      UPDATE invoices SET status = 'invoiced', updated_at = datetime('now') WHERE id = ?
    `);
    updateInvoiceStmt.run(id);

    // Update all time entries to 'invoiced' status
    const updateEntriesStmt = this.db.prepare(`
      UPDATE time_entries SET billing_status = 'invoiced' WHERE invoice_id = ?
    `);
    updateEntriesStmt.run(id);

    this.bumpDataVersion();
    return this.getInvoiceById(id)!;
  }

  public cancelInvoice(id: number, reason: string): Invoice {
    const invoice = this.getInvoiceById(id);
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    if (invoice.status === 'cancelled') {
      throw new Error('Invoice is already cancelled');
    }

    // Update invoice status
    const updateInvoiceStmt = this.db.prepare(`
      UPDATE invoices
      SET status = 'cancelled', cancellation_reason = ?, updated_at = datetime('now')
      WHERE id = ?
    `);
    updateInvoiceStmt.run(reason, id);

    // Reset billing status but keep invoice_id for reference
    const updateEntriesStmt = this.db.prepare(`
      UPDATE time_entries SET billing_status = 'unbilled' WHERE invoice_id = ?
    `);
    updateEntriesStmt.run(id);

    this.bumpDataVersion();
    return this.getInvoiceById(id)!;
  }

  public getUnbilledTimeEntries(): any[] {
    const stmt = this.db.prepare(`
      SELECT te.*, p.name as project_name, p.hourly_rate
      FROM time_entries te
      LEFT JOIN projects p ON te.project_id = p.id
      WHERE te.billing_status = 'unbilled'
      ORDER BY te.date DESC
    `);
    return stmt.all() as any[];
  }

  public generateNextInvoiceNumber(): string {
    // Get the latest invoice number
    const stmt = this.db.prepare(`
      SELECT invoice_number FROM invoices
      ORDER BY id DESC LIMIT 1
    `);
    const result = stmt.get() as { invoice_number: string } | undefined;

    if (!result) {
      // First invoice
      const year = new Date().getFullYear();
      return `INV-${year}-001`;
    }

    // Try to parse the existing format
    const match = result.invoice_number.match(/INV-(\d{4})-(\d+)/);
    if (match) {
      const year = new Date().getFullYear();
      const lastYear = parseInt(match[1]);
      const lastNumber = parseInt(match[2]);

      if (year === lastYear) {
        // Same year, increment number
        return `INV-${year}-${String(lastNumber + 1).padStart(3, '0')}`;
      } else {
        // New year, start from 001
        return `INV-${year}-001`;
      }
    }

    // Fallback: generate based on timestamp
    return `INV-${Date.now()}`;
  }

  private recalculateInvoiceTotal(invoiceId: number): void {
    const stmt = this.db.prepare(`
      SELECT
        SUM(te.duration_minutes * COALESCE(p.hourly_rate, 0) / 60.0) as total
      FROM time_entries te
      LEFT JOIN projects p ON te.project_id = p.id
      WHERE te.invoice_id = ?
    `);
    const result = stmt.get(invoiceId) as { total: number | null };
    const total = result.total || 0;

    const updateStmt = this.db.prepare(`
      UPDATE invoices SET total_amount = ?, updated_at = datetime('now') WHERE id = ?
    `);
    updateStmt.run(total, invoiceId);
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
