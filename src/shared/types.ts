// Database models
export type ProjectStatus = 'active' | 'completed' | 'paused';

export interface Project {
  id: number;
  name: string;
  hourly_rate?: number;
  client_name?: string;
  status: ProjectStatus;
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
  invoice_id?: number;
  billing_status?: 'unbilled' | 'in_draft' | 'invoiced';
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  invoice_date: string;
  status: 'draft' | 'invoiced' | 'cancelled';
  total_amount: number;
  notes?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceWithEntries extends Invoice {
  entries: any[];
}

// Input types for creating/updating records
export interface ProjectInput {
  name: string;
  hourly_rate?: number;
  client_name?: string;
  status?: ProjectStatus;
}

export interface TimeEntryInput {
  project_id: number;
  date: string;
  start_time?: string;
  end_time?: string;
  duration_minutes?: number;
  description?: string;
}

export interface InvoiceInput {
  invoice_number: string;
  invoice_date: string;
  status?: 'draft' | 'invoiced' | 'cancelled';
  total_amount?: number;
  notes?: string;
  cancellation_reason?: string;
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

export interface DashboardStatistics {
  // Projekt-Counts
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  pausedProjects: number;

  // Revenue Breakdown
  totalRevenue: number;
  activeRevenue: number;
  completedRevenue: number;
  pausedRevenue: number;

  // Unbilled Revenue
  unbilledRevenue: number;
  unbilledHours: number;
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
  window_x?: number;
  window_y?: number;
  window_width?: number;
  window_height?: number;
  window_maximized?: boolean;
}

// Export formats
export type ExportFormat = 'csv' | 'json';

// Search types
export interface SearchResult {
  projects: Array<Project & { match_field: string }>;
  timeEntries: Array<TimeEntry & { project_name: string; hourly_rate?: number; match_field: string }>;
  invoices: Array<Invoice & { match_field: string }>;
}

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

  // Invoices
  INVOICE_CREATE: 'invoice:create',
  INVOICE_UPDATE: 'invoice:update',
  INVOICE_DELETE: 'invoice:delete',
  INVOICE_GET_ALL: 'invoice:get-all',
  INVOICE_GET_BY_ID: 'invoice:get-by-id',
  INVOICE_GET_WITH_ENTRIES: 'invoice:get-with-entries',
  INVOICE_ADD_ENTRIES: 'invoice:add-entries',
  INVOICE_REMOVE_ENTRIES: 'invoice:remove-entries',
  INVOICE_FINALIZE: 'invoice:finalize',
  INVOICE_CANCEL: 'invoice:cancel',
  INVOICE_GET_UNBILLED_ENTRIES: 'invoice:get-unbilled-entries',
  INVOICE_GENERATE_NUMBER: 'invoice:generate-number',

  // Search
  SEARCH_GLOBAL: 'search:global',

  // Database
  DATABASE_GET_PATH: 'database:get-path',

  // Dashboard
  DASHBOARD_GET_STATISTICS: 'dashboard:get-statistics',

  // App Config
  APP_GET_BACKUP_INTERVAL: 'app:get-backup-interval',

  // Shell
  SHELL_SHOW_ITEM_IN_FOLDER: 'shell:show-item-in-folder',
} as const;
