import type { Migration } from './index';
import type Database from 'better-sqlite3';

export const migration002: Migration = {
  version: 2,
  name: 'add_invoices',
  up: (db: Database.Database) => {
    // Create invoices table
    db.exec(`
      CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_number TEXT NOT NULL UNIQUE,
        invoice_date TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'draft',
        total_amount REAL NOT NULL DEFAULT 0,
        notes TEXT,
        cancellation_reason TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add invoice_id column to time_entries
    // Check if column exists first (for existing databases)
    const columns = db.pragma('table_info(time_entries)') as { name: string }[];
    const hasInvoiceId = columns.some(col => col.name === 'invoice_id');

    if (!hasInvoiceId) {
      db.exec(`ALTER TABLE time_entries ADD COLUMN invoice_id INTEGER REFERENCES invoices(id)`);
    }

    // Create indices for invoices
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_time_entries_invoice_id ON time_entries(invoice_id);
      CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
      CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date);
    `);
  },
};
