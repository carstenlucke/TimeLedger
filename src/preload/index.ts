import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../shared/types';
import type {
  Project,
  TimeEntry,
  ProjectInput,
  TimeEntryInput,
  ReportFilter,
  ProjectReport,
  AppSettings,
  BackupFile,
  ExportFormat,
} from '../shared/types';

// Define the API that will be exposed to the renderer
const api = {
  // Project methods
  project: {
    create: (input: ProjectInput): Promise<Project> =>
      ipcRenderer.invoke(IPC_CHANNELS.PROJECT_CREATE, input),
    update: (id: number, input: Partial<ProjectInput>): Promise<Project> =>
      ipcRenderer.invoke(IPC_CHANNELS.PROJECT_UPDATE, id, input),
    delete: (id: number): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.PROJECT_DELETE, id),
    getAll: (): Promise<Project[]> =>
      ipcRenderer.invoke(IPC_CHANNELS.PROJECT_GET_ALL),
    getById: (id: number): Promise<Project | undefined> =>
      ipcRenderer.invoke(IPC_CHANNELS.PROJECT_GET_BY_ID, id),
  },

  // Time Entry methods
  timeEntry: {
    create: (input: TimeEntryInput): Promise<TimeEntry> =>
      ipcRenderer.invoke(IPC_CHANNELS.TIME_ENTRY_CREATE, input),
    update: (id: number, input: Partial<TimeEntryInput>): Promise<TimeEntry> =>
      ipcRenderer.invoke(IPC_CHANNELS.TIME_ENTRY_UPDATE, id, input),
    delete: (id: number): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.TIME_ENTRY_DELETE, id),
    getAll: (): Promise<TimeEntry[]> =>
      ipcRenderer.invoke(IPC_CHANNELS.TIME_ENTRY_GET_ALL),
    getById: (id: number): Promise<TimeEntry | undefined> =>
      ipcRenderer.invoke(IPC_CHANNELS.TIME_ENTRY_GET_BY_ID, id),
    getByProject: (projectId: number): Promise<TimeEntry[]> =>
      ipcRenderer.invoke(IPC_CHANNELS.TIME_ENTRY_GET_BY_PROJECT, projectId),
    getByDateRange: (startDate: string, endDate: string): Promise<TimeEntry[]> =>
      ipcRenderer.invoke(IPC_CHANNELS.TIME_ENTRY_GET_BY_DATE_RANGE, startDate, endDate),
  },

  // Report methods
  report: {
    generate: (filter: ReportFilter): Promise<ProjectReport[]> =>
      ipcRenderer.invoke(IPC_CHANNELS.REPORT_GENERATE, filter),
    export: (report: ProjectReport[], format: ExportFormat): Promise<string | null> =>
      ipcRenderer.invoke(IPC_CHANNELS.REPORT_EXPORT, report, format),
  },

  // Settings methods
  settings: {
    get: (): Promise<AppSettings> =>
      ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET),
    update: (settings: Partial<AppSettings>): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_UPDATE, settings),
    selectBackupDir: (): Promise<string | undefined> =>
      ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_SELECT_BACKUP_DIR),
  },

  // Backup methods
  backup: {
    create: (): Promise<string> =>
      ipcRenderer.invoke(IPC_CHANNELS.BACKUP_CREATE),
    list: (): Promise<BackupFile[]> =>
      ipcRenderer.invoke(IPC_CHANNELS.BACKUP_LIST),
    restore: (backupPath: string): Promise<boolean> =>
      ipcRenderer.invoke(IPC_CHANNELS.BACKUP_RESTORE, backupPath),
  },
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('api', api);

// Type declaration for TypeScript
export type API = typeof api;
