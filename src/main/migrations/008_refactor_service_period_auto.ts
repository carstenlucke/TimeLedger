import type { Migration } from './index';
import type Database from 'better-sqlite3';

export const migration008: Migration = {
  version: 8,
  name: 'refactor_service_period_auto',
  up: (db: Database.Database) => {
    const columns = db.pragma('table_info(invoices)') as { name: string }[];

    // Add independent auto flags for start and end
    if (!columns.some(col => col.name === 'service_period_start_auto')) {
      db.exec(`ALTER TABLE invoices ADD COLUMN service_period_start_auto INTEGER NOT NULL DEFAULT 1`);
    }
    if (!columns.some(col => col.name === 'service_period_end_auto')) {
      db.exec(`ALTER TABLE invoices ADD COLUMN service_period_end_auto INTEGER NOT NULL DEFAULT 1`);
    }

    // Backfill from the old manually_set flag:
    // manually_set=1 → both auto=0, manually_set=0 → both auto=1
    if (columns.some(col => col.name === 'service_period_manually_set')) {
      db.exec(`
        UPDATE invoices
        SET service_period_start_auto = CASE WHEN service_period_manually_set = 1 THEN 0 ELSE 1 END,
            service_period_end_auto = CASE WHEN service_period_manually_set = 1 THEN 0 ELSE 1 END
      `);
    }
  },
};
