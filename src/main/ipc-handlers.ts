import { ipcMain, dialog, shell } from 'electron';
import { getDatabase } from './database';
import { BackupManager } from './backup';
import { ExportManager } from './export';
import { IPC_CHANNELS } from '../shared/types';
import { BACKUP_INTERVAL_MS } from './index';
import type {
  ProjectInput,
  TimeEntryInput,
  ReportFilter,
  ExportFormat,
  InvoiceInput,
  CustomerInput,
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

  // Customer handlers
  ipcMain.handle(IPC_CHANNELS.CUSTOMER_CREATE, async (_, input: CustomerInput) => {
    try {
      console.log('Creating customer:', input);
      return db.createCustomer(input);
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  });

  ipcMain.handle(IPC_CHANNELS.CUSTOMER_UPDATE, async (_, id: number, input: Partial<CustomerInput>) => {
    return db.updateCustomer(id, input);
  });

  ipcMain.handle(IPC_CHANNELS.CUSTOMER_DELETE, async (_, id: number) => {
    db.deleteCustomer(id);
  });

  ipcMain.handle(IPC_CHANNELS.CUSTOMER_GET_ALL, async () => {
    try {
      console.log('Fetching all customers...');
      const customers = db.getAllCustomers();
      console.log(`Found ${customers.length} customers`);
      return customers;
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  });

  ipcMain.handle(IPC_CHANNELS.CUSTOMER_GET_BY_ID, async (_, id: number) => {
    return db.getCustomerById(id);
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

  // Dashboard handlers
  ipcMain.handle(IPC_CHANNELS.DASHBOARD_GET_STATISTICS, async () => {
    return db.getDashboardStatistics();
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
    db.setLastBackupVersion(db.getDataVersion());
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

  // Invoice handlers
  ipcMain.handle(IPC_CHANNELS.INVOICE_CREATE, async (_, input: InvoiceInput) => {
    try {
      console.log('Creating invoice:', input);
      return db.createInvoice(input);
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  });

  ipcMain.handle(IPC_CHANNELS.INVOICE_UPDATE, async (_, id: number, input: Partial<InvoiceInput>) => {
    return db.updateInvoice(id, input);
  });

  ipcMain.handle(IPC_CHANNELS.INVOICE_DELETE, async (_, id: number) => {
    db.deleteInvoice(id);
  });

  ipcMain.handle(IPC_CHANNELS.INVOICE_GET_ALL, async () => {
    try {
      console.log('Fetching all invoices...');
      const invoices = db.getAllInvoices();
      console.log(`Found ${invoices.length} invoices`);
      return invoices;
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }
  });

  ipcMain.handle(IPC_CHANNELS.INVOICE_GET_BY_ID, async (_, id: number) => {
    return db.getInvoiceById(id);
  });

  ipcMain.handle(IPC_CHANNELS.INVOICE_GET_WITH_ENTRIES, async (_, id: number) => {
    return db.getInvoiceWithEntries(id);
  });

  ipcMain.handle(IPC_CHANNELS.INVOICE_ADD_ENTRIES, async (_, invoiceId: number, entryIds: number[]) => {
    try {
      db.addTimeEntriesToInvoice(invoiceId, entryIds);
      return db.getInvoiceWithEntries(invoiceId);
    } catch (error) {
      console.error('Error adding entries to invoice:', error);
      throw error;
    }
  });

  ipcMain.handle(IPC_CHANNELS.INVOICE_REMOVE_ENTRIES, async (_, entryIds: number[]) => {
    try {
      db.removeTimeEntriesFromInvoice(entryIds);
    } catch (error) {
      console.error('Error removing entries from invoice:', error);
      throw error;
    }
  });

  ipcMain.handle(IPC_CHANNELS.INVOICE_FINALIZE, async (_, id: number) => {
    try {
      return db.finalizeInvoice(id);
    } catch (error) {
      console.error('Error finalizing invoice:', error);
      throw error;
    }
  });

  ipcMain.handle(IPC_CHANNELS.INVOICE_CANCEL, async (_, id: number, reason: string) => {
    try {
      return db.cancelInvoice(id, reason);
    } catch (error) {
      console.error('Error cancelling invoice:', error);
      throw error;
    }
  });

  ipcMain.handle(IPC_CHANNELS.INVOICE_GET_UNBILLED_ENTRIES, async () => {
    return db.getUnbilledTimeEntries();
  });

  ipcMain.handle(IPC_CHANNELS.INVOICE_GENERATE_NUMBER, async () => {
    return db.generateNextInvoiceNumber();
  });

  // Search handlers
  ipcMain.handle(IPC_CHANNELS.SEARCH_GLOBAL, async (_, query: string) => {
    if (!query || query.trim().length < 2) {
      return { projects: [], customers: [], timeEntries: [], invoices: [] };
    }
    return db.searchGlobal(query.trim());
  });

  // Database handlers
  ipcMain.handle(IPC_CHANNELS.DATABASE_GET_PATH, async () => {
    return db.getDbPath();
  });

  ipcMain.handle(IPC_CHANNELS.DATABASE_GET_SCHEMA_VERSION, async () => {
    return db.getSchemaVersion();
  });

  // App Config handlers
  ipcMain.handle(IPC_CHANNELS.APP_GET_BACKUP_INTERVAL, async () => {
    return BACKUP_INTERVAL_MS;
  });

  // Shell handlers
  ipcMain.handle(IPC_CHANNELS.SHELL_SHOW_ITEM_IN_FOLDER, async (_, filePath: string) => {
    shell.showItemInFolder(filePath);
  });
}
