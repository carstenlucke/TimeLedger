import type { Migration } from './index';
import type Database from 'better-sqlite3';

export const migration004: Migration = {
  version: 4,
  name: 'add_project_status',
  up: (db: Database.Database) => {
    // Add status column to projects
    const columns = db.pragma('table_info(projects)') as { name: string }[];
    const hasStatus = columns.some(col => col.name === 'status');

    if (!hasStatus) {
      db.exec(`ALTER TABLE projects ADD COLUMN status TEXT NOT NULL DEFAULT 'active'`);
    }

    // Create index for project status
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
    `);
  },
};
