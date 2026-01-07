import type { Migration } from './index';
import type Database from 'better-sqlite3';

export const migration003: Migration = {
  version: 3,
  name: 'add_billing_status',
  up: (db: Database.Database) => {
    // Add billing_status column to time_entries
    const columns = db.pragma('table_info(time_entries)') as { name: string }[];
    const hasBillingStatus = columns.some(col => col.name === 'billing_status');

    if (!hasBillingStatus) {
      db.exec(`ALTER TABLE time_entries ADD COLUMN billing_status TEXT NOT NULL DEFAULT 'unbilled'`);
    }

    // Create index for billing_status
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_time_entries_billing_status ON time_entries(billing_status);
    `);
  },
};
