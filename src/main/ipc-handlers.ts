import { ipcMain, dialog } from 'electron';
import { getDatabase } from './database';
import { BackupManager } from './backup';
import { ExportManager } from './export';
import { IPC_CHANNELS } from '../shared/types';
import type {
  ProjectInput,
  TimeEntryInput,
  ReportFilter,
  ExportFormat,
} from '../shared/types';

export function setupIpcHandlers(): void {
  const db = getDatabase();
  const backupManager = new BackupManager(db.getDbPath());
  const exportManager = new ExportManager();

  // Project handlers
  ipcMain.handle(IPC_CHANNELS.PROJECT_CREATE, async (_, input: ProjectInput) => {
    try {
      console.log('Creating project:', input);
      return db.createProject(input);
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  });

  ipcMain.handle(IPC_CHANNELS.PROJECT_UPDATE, async (_, id: number, input: Partial<ProjectInput>) => {
    return db.updateProject(id, input);
  });

  ipcMain.handle(IPC_CHANNELS.PROJECT_DELETE, async (_, id: number) => {
    db.deleteProject(id);
  });

  ipcMain.handle(IPC_CHANNELS.PROJECT_GET_ALL, async () => {
    try {
      console.log('Fetching all projects...');
      const projects = db.getAllProjects();
      console.log(`Found ${projects.length} projects`);
      return projects;
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  });

  ipcMain.handle(IPC_CHANNELS.PROJECT_GET_BY_ID, async (_, id: number) => {
    return db.getProjectById(id);
  });

  // Time Entry handlers
  ipcMain.handle(IPC_CHANNELS.TIME_ENTRY_CREATE, async (_, input: TimeEntryInput) => {
    return db.createTimeEntry(input);
  });

  ipcMain.handle(IPC_CHANNELS.TIME_ENTRY_UPDATE, async (_, id: number, input: Partial<TimeEntryInput>) => {
    return db.updateTimeEntry(id, input);
  });

  ipcMain.handle(IPC_CHANNELS.TIME_ENTRY_DELETE, async (_, id: number) => {
    db.deleteTimeEntry(id);
  });

  ipcMain.handle(IPC_CHANNELS.TIME_ENTRY_GET_ALL, async () => {
    return db.getAllTimeEntries();
  });

  ipcMain.handle(IPC_CHANNELS.TIME_ENTRY_GET_BY_ID, async (_, id: number) => {
    return db.getTimeEntryById(id);
  });

  ipcMain.handle(IPC_CHANNELS.TIME_ENTRY_GET_BY_PROJECT, async (_, projectId: number) => {
    return db.getTimeEntriesByProject(projectId);
  });

  ipcMain.handle(IPC_CHANNELS.TIME_ENTRY_GET_BY_DATE_RANGE, async (_, startDate: string, endDate: string) => {
    return db.getTimeEntriesByDateRange(startDate, endDate);
  });

  // Report handlers
  ipcMain.handle(IPC_CHANNELS.REPORT_GENERATE, async (_, filter: ReportFilter) => {
    return db.generateReport(filter);
  });

  ipcMain.handle(IPC_CHANNELS.REPORT_EXPORT, async (_, report, format: ExportFormat) => {
    let extension: string;
    let filterName: string;

    if (format === 'csv') {
      extension = 'csv';
      filterName = 'CSV';
    } else if (format === 'json') {
      extension = 'json';
      filterName = 'JSON';
    } else if (format === 'pdf') {
      extension = 'pdf';
      filterName = 'PDF';
    } else {
      throw new Error(`Unsupported format: ${format}`);
    }

    const result = await dialog.showSaveDialog({
      title: 'Export Report',
      defaultPath: `timeledger-report.${extension}`,
      filters: [
        { name: filterName, extensions: [extension] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });

    if (!result.canceled && result.filePath) {
      if (format === 'csv') {
        const content = exportManager.exportToCSV(report);
        await exportManager.saveToFile(content, result.filePath);
      } else if (format === 'json') {
        const content = exportManager.exportToJSON(report);
        await exportManager.saveToFile(content, result.filePath);
      } else if (format === 'pdf') {
        await exportManager.exportToPDF(report, result.filePath);
      }
      return result.filePath;
    }

    return null;
  });

  // Settings handlers
  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, async () => {
    return db.getSettings();
  });

  ipcMain.handle(IPC_CHANNELS.SETTINGS_UPDATE, async (_, settings) => {
    db.updateSettings(settings);
  });

  ipcMain.handle(IPC_CHANNELS.SETTINGS_SELECT_BACKUP_DIR, async () => {
    const dir = await backupManager.selectBackupDirectory();
    if (dir) {
      db.updateSettings({ backup_directory: dir });
    }
    return dir;
  });

  // Backup handlers
  ipcMain.handle(IPC_CHANNELS.BACKUP_CREATE, async () => {
    const settings = db.getSettings();
    if (!settings.backup_directory) {
      throw new Error('Backup directory not configured');
    }

    const backupPath = await backupManager.createBackup(settings.backup_directory);
    db.updateSettings({ last_backup: new Date().toISOString() });
    return backupPath;
  });

  ipcMain.handle(IPC_CHANNELS.BACKUP_LIST, async () => {
    const settings = db.getSettings();
    if (!settings.backup_directory) {
      return [];
    }

    return backupManager.listBackups(settings.backup_directory);
  });

  ipcMain.handle(IPC_CHANNELS.BACKUP_RESTORE, async (_, backupPath: string) => {
    await backupManager.restoreBackup(backupPath);
    // Note: The app should be restarted after restore
    return true;
  });
}
