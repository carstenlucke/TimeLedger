import type { Migration } from './index';
import type Database from 'better-sqlite3';

export const migration006: Migration = {
  version: 6,
  name: 'add_external_invoices',
  up: (db: Database.Database) => {
    // Add type column with default 'internal' for existing records
    const columns = db.pragma('table_info(invoices)') as { name: string }[];
    const hasType = columns.some(col => col.name === 'type');

    if (!hasType) {
      db.exec(`ALTER TABLE invoices ADD COLUMN type TEXT NOT NULL DEFAULT 'internal'`);
    }

    const hasExternalInvoiceNumber = columns.some(col => col.name === 'external_invoice_number');
    if (!hasExternalInvoiceNumber) {
      db.exec(`ALTER TABLE invoices ADD COLUMN external_invoice_number TEXT`);
    }

    const hasNetAmount = columns.some(col => col.name === 'net_amount');
    if (!hasNetAmount) {
      db.exec(`ALTER TABLE invoices ADD COLUMN net_amount REAL`);
    }

    const hasGrossAmount = columns.some(col => col.name === 'gross_amount');
    if (!hasGrossAmount) {
      db.exec(`ALTER TABLE invoices ADD COLUMN gross_amount REAL`);
    }
  },
};
