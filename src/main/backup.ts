import fs from 'fs';
import path from 'path';
import { dialog } from 'electron';
import type { BackupFile } from '../shared/types';

export class BackupManager {
  private dbPath: string;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
  }

  /**
   * Create a backup of the database
   */
  public async createBackup(backupDir: string): Promise<string> {
    if (!fs.existsSync(backupDir)) {
      throw new Error('Backup directory does not exist');
    }

    const now = new Date();
    const timestamp = this.formatTimestamp(now);
    const backupFilename = `backup-${timestamp}.sqlite`;
    const backupPath = path.join(backupDir, backupFilename);

    // Copy the database file
    await fs.promises.copyFile(this.dbPath, backupPath);

    return backupPath;
  }

  /**
   * List all backup files in the backup directory
   */
  public async listBackups(backupDir: string): Promise<BackupFile[]> {
    if (!fs.existsSync(backupDir)) {
      return [];
    }

    const files = await fs.promises.readdir(backupDir);
    const backupFiles: BackupFile[] = [];

    for (const file of files) {
      if (file.startsWith('backup-') && file.endsWith('.sqlite')) {
        const filePath = path.join(backupDir, file);
        const stats = await fs.promises.stat(filePath);

        backupFiles.push({
          filename: file,
          path: filePath,
          date: stats.mtime,
          size: stats.size,
        });
      }
    }

    // Sort by date, newest first
    backupFiles.sort((a, b) => b.date.getTime() - a.date.getTime());

    return backupFiles;
  }

  /**
   * Restore database from a backup file
   */
  public async restoreBackup(backupDir: string, filename: string): Promise<void> {
    const backupPath = path.join(backupDir, filename);
    if (!fs.existsSync(backupPath)) {
      throw new Error('Backup file does not exist');
    }

    // Create a backup of current database before restoring
    const currentBackupDir = path.dirname(this.dbPath);
    const currentBackupPath = path.join(
      currentBackupDir,
      `pre-restore-${this.formatTimestamp(new Date())}.sqlite`
    );

    if (fs.existsSync(this.dbPath)) {
      await fs.promises.copyFile(this.dbPath, currentBackupPath);
    }

    // Restore the backup
    await fs.promises.copyFile(backupPath, this.dbPath);
  }

  /**
   * Select a backup directory using a dialog
   */
  public async selectBackupDirectory(): Promise<string | undefined> {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
      title: 'Select Backup Directory',
      message: 'Choose a folder to store backups (ideally in iCloud, Dropbox, or OneDrive)',
    });

    if (result.canceled || result.filePaths.length === 0) {
      return undefined;
    }

    return result.filePaths[0];
  }

  /**
   * Format timestamp for backup filename
   */
  private formatTimestamp(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
  }
}
