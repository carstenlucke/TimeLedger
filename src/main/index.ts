import { app, BrowserWindow, Menu } from 'electron';
import path from 'path';
import { getDatabase, closeDatabase } from './database';
import { setupIpcHandlers } from './ipc-handlers';
import { BackupManager } from './backup';

let mainWindow: BrowserWindow | null = null;
let backupIntervalId: NodeJS.Timeout | null = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Set app name for all platforms
if (app.setName) {
  app.setName('TimeLedger');
}

function createWindow(): void {
  const preloadPath = path.join(__dirname, '../preload/index.js');
  console.log('Preload path:', preloadPath);
  console.log('Preload exists:', require('fs').existsSync(preloadPath));

  const iconPath = isDev
    ? path.join(__dirname, '../../assets/icons/icon_512x512.png')
    : path.join(process.resourcesPath, 'assets/icons/icon_512x512.png');

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: iconPath,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Create menu
  createMenu();
}

function createMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    // macOS app menu
    ...(process.platform === 'darwin' ? [{
      label: 'TimeLedger',
      submenu: [
        { role: 'about' as const },
        { type: 'separator' as const },
        {
          label: 'Settings',
          accelerator: 'Cmd+,',
          click: () => {
            mainWindow?.webContents.send('navigate', '/settings');
          },
        },
        { type: 'separator' as const },
        { role: 'hide' as const },
        { role: 'hideOthers' as const },
        { role: 'unhide' as const },
        { type: 'separator' as const },
        { role: 'quit' as const },
      ],
    }] : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'Settings',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            mainWindow?.webContents.send('navigate', '/settings');
          },
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

async function setupBackupSchedule(): Promise<void> {
  const db = getDatabase();
  const settings = db.getSettings();

  if (!settings.backup_directory) {
    // Prompt user to select backup directory on first launch
    const backupManager = new BackupManager(db.getDbPath());
    const dir = await backupManager.selectBackupDirectory();
    if (dir) {
      db.updateSettings({ backup_directory: dir });
      await createBackup();
    }
  }

  // Schedule hourly backups
  backupIntervalId = setInterval(async () => {
    await createBackup();
  }, 60 * 60 * 1000); // 1 hour
}

async function createBackup(): Promise<void> {
  try {
    const db = getDatabase();
    const settings = db.getSettings();

    if (settings.backup_directory) {
      const backupManager = new BackupManager(db.getDbPath());
      await backupManager.createBackup(settings.backup_directory);
      db.updateSettings({ last_backup: new Date().toISOString() });
    }
  } catch (error) {
    console.error('Backup failed:', error);
  }
}

app.whenReady().then(() => {
  // Initialize database
  getDatabase();

  // Setup IPC handlers
  setupIpcHandlers();

  // Set dock icon on macOS
  if (process.platform === 'darwin' && isDev) {
    const iconPath = path.join(__dirname, '../../assets/icons/icon_512x512.png');
    app.dock.setIcon(iconPath);
  }

  // Create window
  createWindow();

  // Setup backup schedule
  setupBackupSchedule();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (backupIntervalId) {
    clearInterval(backupIntervalId);
  }

  // Create backup on exit
  createBackup().finally(() => {
    closeDatabase();
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
});

app.on('will-quit', async (e) => {
  e.preventDefault();

  // Create final backup
  await createBackup();
  closeDatabase();

  if (backupIntervalId) {
    clearInterval(backupIntervalId);
  }

  app.exit();
});
