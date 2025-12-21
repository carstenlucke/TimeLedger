import { contextBridge, ipcRenderer } from 'electron';

console.log('Preload script is running...');

// Define IPC channels inline to avoid module loading issues in sandbox
const IPC_CHANNELS = {
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

  // Settings methods
  settings: {
    get: (): Promise<any> =>
      ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET),
    update: (key: string, value: string): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_UPDATE, key, value),
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
