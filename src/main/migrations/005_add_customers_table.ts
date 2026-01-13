import type { Migration } from './index';
import type Database from 'better-sqlite3';

export const migration005: Migration = {
  version: 5,
  name: 'add_customers_table',
  up: (db: Database.Database) => {
    // Create customers table
    db.exec(`
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        address TEXT,
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create index on customer name for faster lookups
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
    `);

    // Add customer_id column to projects table
    db.exec(`
      ALTER TABLE projects ADD COLUMN customer_id INTEGER REFERENCES customers(id);
    `);

    // Migrate existing client_name data to customers table
    // First, get all unique client names from projects
    const clientNames = db.prepare(`
      SELECT DISTINCT client_name FROM projects WHERE client_name IS NOT NULL AND client_name != ''
    `).all() as { client_name: string }[];

    // Insert unique customer records
    const insertCustomer = db.prepare(`
      INSERT INTO customers (name, created_at, updated_at) VALUES (?, datetime('now'), datetime('now'))
    `);

    const customerMap = new Map<string, number>();
    for (const { client_name } of clientNames) {
      const result = insertCustomer.run(client_name);
      customerMap.set(client_name, result.lastInsertRowid as number);
    }

    // Update projects to reference the new customer records
    const updateProject = db.prepare(`
      UPDATE projects SET customer_id = ? WHERE client_name = ?
    `);

    for (const [clientName, customerId] of customerMap.entries()) {
      updateProject.run(customerId, clientName);
    }

    // Note: We keep client_name column for now for backward compatibility
    // It can be removed in a future migration once all code is updated
  },
};
