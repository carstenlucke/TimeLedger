// Database models
export interface Project {
  id: number;
  name: string;
  hourly_rate?: number;
  client_name?: string;
  created_at: string;
  updated_at: string;
}

export interface TimeEntry {
  id: number;
  project_id: number;
  date: string;
  start_time?: string;
  end_time?: string;
  duration_minutes: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

// Input types for creating/updating records
export interface ProjectInput {
  name: string;
  hourly_rate?: number;
  client_name?: string;
}

export interface TimeEntryInput {
  project_id: number;
  date: string;
  start_time?: string;
  end_time?: string;
  duration_minutes?: number;
  description?: string;
}

// Reporting types
export interface ReportFilter {
  start_date?: string;
  end_date?: string;
  project_ids?: number[];
}

export interface ProjectReport {
  project_id: number;
  project_name: string;
  client_name?: string;
  hourly_rate?: number;
  total_minutes: number;
  total_hours: number;
  total_value?: number;
  entries: TimeEntry[];
}

// Backup types
export interface BackupFile {
  filename: string;
  path: string;
  date: Date;
  size: number;
}

// Settings types
export interface AppSettings {
  backup_directory?: string;
  last_backup?: string;
}

// Export formats
export type ExportFormat = 'csv' | 'json';

// IPC Channel names
export const IPC_CHANNELS = {
  // Projects
  PROJECT_CREATE: 'project:create',
  PROJECT_UPDATE: 'project:update',
  PROJECT_DELETE: 'project:delete',
  PROJECT_GET_ALL: 'project:get-all',
  PROJECT_GET_BY_ID: 'project:get-by-id',

  // Time Entries
  TIME_ENTRY_CREATE: 'time-entry:create',
  TIME_ENTRY_UPDATE: 'time-entry:update',
  TIME_ENTRY_DELETE: 'time-entry:delete',
  TIME_ENTRY_GET_ALL: 'time-entry:get-all',
  TIME_ENTRY_GET_BY_ID: 'time-entry:get-by-id',
  TIME_ENTRY_GET_BY_PROJECT: 'time-entry:get-by-project',
  TIME_ENTRY_GET_BY_DATE_RANGE: 'time-entry:get-by-date-range',

  // Reporting
  REPORT_GENERATE: 'report:generate',
  REPORT_EXPORT: 'report:export',

  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_UPDATE: 'settings:update',
  SETTINGS_SELECT_BACKUP_DIR: 'settings:select-backup-dir',

  // Backup
  BACKUP_CREATE: 'backup:create',
  BACKUP_LIST: 'backup:list',
  BACKUP_RESTORE: 'backup:restore',
} as const;
