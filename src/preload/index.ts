import { contextBridge, ipcRenderer } from 'electron';

console.log('Preload script is running...');

// Define IPC channels inline to avoid module loading issues in sandbox
const IPC_CHANNELS = {
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

// Define the API that will be exposed to the renderer
const api = {
  // Navigation listener
  onNavigate: (callback: (path: string) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, path: string) => callback(path);
    ipcRenderer.on('navigate', listener);
    // Return cleanup function
    return () => {
      ipcRenderer.removeListener('navigate', listener);
    };
  },

  // Project methods
  project: {
    create: (input: any): Promise<any> =>
      ipcRenderer.invoke(IPC_CHANNELS.PROJECT_CREATE, input),
    update: (id: number, input: any): Promise<any> =>
      ipcRenderer.invoke(IPC_CHANNELS.PROJECT_UPDATE, id, input),
    delete: (id: number): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.PROJECT_DELETE, id),
    getAll: (): Promise<any[]> =>
      ipcRenderer.invoke(IPC_CHANNELS.PROJECT_GET_ALL),
    getById: (id: number): Promise<any> =>
      ipcRenderer.invoke(IPC_CHANNELS.PROJECT_GET_BY_ID, id),
  },

  // Time Entry methods
  timeEntry: {
    create: (input: any): Promise<any> =>
      ipcRenderer.invoke(IPC_CHANNELS.TIME_ENTRY_CREATE, input),
    update: (id: number, input: any): Promise<any> =>
      ipcRenderer.invoke(IPC_CHANNELS.TIME_ENTRY_UPDATE, id, input),
    delete: (id: number): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.TIME_ENTRY_DELETE, id),
    getAll: (): Promise<any[]> =>
      ipcRenderer.invoke(IPC_CHANNELS.TIME_ENTRY_GET_ALL),
    getById: (id: number): Promise<any> =>
      ipcRenderer.invoke(IPC_CHANNELS.TIME_ENTRY_GET_BY_ID, id),
    getByProject: (projectId: number): Promise<any[]> =>
      ipcRenderer.invoke(IPC_CHANNELS.TIME_ENTRY_GET_BY_PROJECT, projectId),
    getByDateRange: (startDate: string, endDate: string): Promise<any[]> =>
      ipcRenderer.invoke(IPC_CHANNELS.TIME_ENTRY_GET_BY_DATE_RANGE, startDate, endDate),
  },

  // Report methods
  report: {
    generate: (filter: any): Promise<any[]> =>
      ipcRenderer.invoke(IPC_CHANNELS.REPORT_GENERATE, filter),
    export: (report: any[], format: string): Promise<string | null> =>
      ipcRenderer.invoke(IPC_CHANNELS.REPORT_EXPORT, report, format),
  },

  // Settings methods
  settings: {
    get: (): Promise<any> =>
      ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET),
    update: (settings: any): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_UPDATE, settings),
    selectBackupDir: (): Promise<string | undefined> =>
      ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_SELECT_BACKUP_DIR),
  },

  // Backup methods
  backup: {
    create: (): Promise<string> =>
      ipcRenderer.invoke(IPC_CHANNELS.BACKUP_CREATE),
    list: (): Promise<any[]> =>
      ipcRenderer.invoke(IPC_CHANNELS.BACKUP_LIST),
    restore: (backupPath: string): Promise<boolean> =>
      ipcRenderer.invoke(IPC_CHANNELS.BACKUP_RESTORE, backupPath),
  },
};

console.log('About to expose API to renderer...');
console.log('API object:', api);

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('api', api);

console.log('API exposed successfully');

// Type declaration for TypeScript
export type API = typeof api;
