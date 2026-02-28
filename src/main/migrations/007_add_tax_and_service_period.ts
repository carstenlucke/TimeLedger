import type { Migration } from './index';
import type Database from 'better-sqlite3';

export const migration007: Migration = {
  version: 7,
  name: 'add_tax_and_service_period',
  up: (db: Database.Database) => {
    const columns = db.pragma('table_info(invoices)') as { name: string }[];

    // Tax fields
    if (!columns.some(col => col.name === 'tax_rate')) {
      db.exec(`ALTER TABLE invoices ADD COLUMN tax_rate REAL NOT NULL DEFAULT 0`);
    }
    if (!columns.some(col => col.name === 'is_small_business')) {
      db.exec(`ALTER TABLE invoices ADD COLUMN is_small_business INTEGER NOT NULL DEFAULT 0`);
    }
    if (!columns.some(col => col.name === 'tax_amount')) {
      db.exec(`ALTER TABLE invoices ADD COLUMN tax_amount REAL NOT NULL DEFAULT 0`);
    }

    // Service period fields
    if (!columns.some(col => col.name === 'service_period_start')) {
      db.exec(`ALTER TABLE invoices ADD COLUMN service_period_start TEXT`);
    }
    if (!columns.some(col => col.name === 'service_period_end')) {
      db.exec(`ALTER TABLE invoices ADD COLUMN service_period_end TEXT`);
    }
    if (!columns.some(col => col.name === 'service_period_manually_set')) {
      db.exec(`ALTER TABLE invoices ADD COLUMN service_period_manually_set INTEGER NOT NULL DEFAULT 0`);
    }

    // Backfill service period from linked time entries for existing invoices
    db.exec(`
      UPDATE invoices
      SET service_period_start = (
        SELECT MIN(te.date)
        FROM time_entries te
        WHERE te.invoice_id = invoices.id
      ),
      service_period_end = (
        SELECT MAX(te.date)
        FROM time_entries te
        WHERE te.invoice_id = invoices.id
      )
      WHERE EXISTS (
        SELECT 1 FROM time_entries te WHERE te.invoice_id = invoices.id
      )
    `);
  },
};
