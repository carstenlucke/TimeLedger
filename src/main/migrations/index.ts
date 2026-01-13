import Database from 'better-sqlite3';

export interface Migration {
  version: number;
  name: string;
  up: (db: Database.Database) => void;
}

// Import all migrations
import { migration001 } from './001_initial_schema';
import { migration002 } from './002_add_invoices';
import { migration003 } from './003_add_billing_status';
import { migration004 } from './004_add_project_status';
import { migration005 } from './005_add_customers_table';

// Register all migrations in order
export const migrations: Migration[] = [
  migration001,
  migration002,
  migration003,
  migration004,
  migration005,
];

export class MigrationRunner {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  /**
   * Initialize the migrations table if it doesn't exist
   */
  private initMigrationsTable(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  /**
   * Get the current schema version
   */
  public getCurrentVersion(): number {
    this.initMigrationsTable();
    const result = this.db.prepare(
      'SELECT MAX(version) as version FROM schema_migrations'
    ).get() as { version: number | null };
    return result?.version ?? 0;
  }

  /**
   * Get list of applied migrations
   */
  public getAppliedMigrations(): { version: number; name: string; applied_at: string }[] {
    this.initMigrationsTable();
    return this.db.prepare(
      'SELECT version, name, applied_at FROM schema_migrations ORDER BY version'
    ).all() as { version: number; name: string; applied_at: string }[];
  }

  /**
   * Detect if this is an existing database that needs to be bootstrapped
   * to the migration system (has tables but no schema_migrations)
   */
  private detectExistingDatabase(): number {
    // Check if schema_migrations exists
    const migrationTableExists = this.db.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='schema_migrations'
    `).get();

    if (migrationTableExists) {
      return 0; // Already using migrations
    }

    // Check for existing tables to determine which version to bootstrap to
    const tables = this.db.prepare(`
      SELECT name FROM sqlite_master WHERE type='table'
    `).all() as { name: string }[];

    const tableNames = tables.map(t => t.name);

    // No tables = fresh database, start from 0
    if (!tableNames.includes('projects')) {
      return 0;
    }

    // Check which features exist to determine version
    let detectedVersion = 1; // Has projects = at least v1

    if (tableNames.includes('invoices')) {
      detectedVersion = 2; // Has invoices = at least v2
    }

    // Check for billing_status column
    const timeEntryCols = this.db.pragma('table_info(time_entries)') as { name: string }[];
    if (timeEntryCols.some(col => col.name === 'billing_status')) {
      detectedVersion = 3; // Has billing_status = at least v3
    }

    // Check for project status column
    const projectCols = this.db.pragma('table_info(projects)') as { name: string }[];
    if (projectCols.some(col => col.name === 'status')) {
      detectedVersion = 4; // Has project status = v4
    }

    return detectedVersion;
  }

  /**
   * Bootstrap an existing database to the migration system
   */
  private bootstrapExistingDatabase(): void {
    const detectedVersion = this.detectExistingDatabase();

    if (detectedVersion === 0) {
      return; // Fresh database or already migrated
    }

    console.log(`Detected existing database at schema version ${detectedVersion}`);
    console.log('Bootstrapping to migration system...');

    // Initialize migration table
    this.initMigrationsTable();

    // Mark all migrations up to detected version as applied
    const migrationsToMark = migrations.filter(m => m.version <= detectedVersion);

    for (const migration of migrationsToMark) {
      const exists = this.db.prepare(
        'SELECT 1 FROM schema_migrations WHERE version = ?'
      ).get(migration.version);

      if (!exists) {
        this.db.prepare(
          'INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)'
        ).run(migration.version, migration.name, new Date().toISOString());
        console.log(`Marked migration ${migration.version} (${migration.name}) as applied`);
      }
    }

    console.log('Database bootstrapped successfully');
  }

  /**
   * Run all pending migrations
   * @returns Number of migrations applied
   */
  public runMigrations(): { applied: number; currentVersion: number } {
    // First, bootstrap existing databases to the migration system
    this.bootstrapExistingDatabase();

    this.initMigrationsTable();
    const currentVersion = this.getCurrentVersion();

    const pendingMigrations = migrations.filter(m => m.version > currentVersion);

    if (pendingMigrations.length === 0) {
      console.log(`Database schema is up to date (version ${currentVersion})`);
      return { applied: 0, currentVersion };
    }

    console.log(`Current schema version: ${currentVersion}`);
    console.log(`Pending migrations: ${pendingMigrations.length}`);

    // Sort by version to ensure correct order
    pendingMigrations.sort((a, b) => a.version - b.version);

    for (const migration of pendingMigrations) {
      console.log(`Applying migration ${migration.version}: ${migration.name}...`);

      try {
        // Run migration in a transaction
        this.db.transaction(() => {
          migration.up(this.db);

          // Record the migration
          this.db.prepare(
            'INSERT INTO schema_migrations (version, name) VALUES (?, ?)'
          ).run(migration.version, migration.name);
        })();

        console.log(`Migration ${migration.version} applied successfully`);
      } catch (error) {
        console.error(`Migration ${migration.version} failed:`, error);
        throw new Error(`Migration ${migration.version} (${migration.name}) failed: ${error}`);
      }
    }

    const newVersion = this.getCurrentVersion();
    console.log(`Database schema updated to version ${newVersion}`);

    return { applied: pendingMigrations.length, currentVersion: newVersion };
  }

  /**
   * Check if migrations are needed
   */
  public needsMigration(): boolean {
    const currentVersion = this.getCurrentVersion();
    const latestVersion = migrations.length > 0
      ? Math.max(...migrations.map(m => m.version))
      : 0;
    return currentVersion < latestVersion;
  }

  /**
   * Get the latest available schema version
   */
  public getLatestVersion(): number {
    return migrations.length > 0
      ? Math.max(...migrations.map(m => m.version))
      : 0;
  }
}
