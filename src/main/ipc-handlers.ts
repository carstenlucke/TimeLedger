import { ipcMain } from 'electron';
import { getDatabase } from './database';
import { BackupManager } from './backup';
import { IPC_CHANNELS } from '../shared/types';

export function setupIpcHandlers(): void {
  const db = getDatabase();
  const backupManager = new BackupManager(db.getDbPath());

  // Settings handlers
  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, async () => {
    return db.getAllSettings();
  });

  ipcMain.handle(IPC_CHANNELS.SETTINGS_UPDATE, async (_, key: string, value: string) => {
    db.setSetting(key, value);
  });

  ipcMain.handle(IPC_CHANNELS.SETTINGS_SELECT_BACKUP_DIR, async () => {
    return backupManager.selectBackupDirectory();
  });

  // Backup handlers
  ipcMain.handle(IPC_CHANNELS.BACKUP_CREATE, async () => {
    const backupDir = db.getSetting('backup_directory');
    if (!backupDir) {
      throw new Error('Backup directory not configured');
    }
    return backupManager.createBackup(backupDir);
  });

  ipcMain.handle(IPC_CHANNELS.BACKUP_LIST, async () => {
    const backupDir = db.getSetting('backup_directory');
    if (!backupDir) {
      return [];
    }
    return backupManager.listBackups(backupDir);
  });

  ipcMain.handle(IPC_CHANNELS.BACKUP_RESTORE, async (_, filename: string) => {
    const backupDir = db.getSetting('backup_directory');
    if (!backupDir) {
      throw new Error('Backup directory not configured');
    }
    await backupManager.restoreBackup(backupDir, filename);
  });
}
