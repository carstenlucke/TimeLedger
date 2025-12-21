// Backup types
export interface BackupFile {
  filename: string;
  path: string;
  date: Date;
  size: number;
}

// Settings types
export interface AppSettings {
  [key: string]: string | undefined;
  backup_directory?: string;
  last_backup?: string;
}

// IPC Channel names
export const IPC_CHANNELS = {
  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_UPDATE: 'settings:update',
  SETTINGS_SELECT_BACKUP_DIR: 'settings:select-backup-dir',

  // Backup
  BACKUP_CREATE: 'backup:create',
  BACKUP_LIST: 'backup:list',
  BACKUP_RESTORE: 'backup:restore',

  // Navigation
  NAVIGATE: 'navigate',
} as const;
