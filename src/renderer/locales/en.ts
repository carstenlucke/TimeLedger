export const en = {
  // Formatting
  formatting: {
    currency: 'USD',
    currencySymbol: '$',
    decimalSeparator: '.',
    thousandsSeparator: ',',
  },

  // Common
  common: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    update: 'Update',
    close: 'Close',
    loading: 'Loading...',
    actions: 'Actions',
    description: 'Description',
    date: 'Date',
    restore: 'Restore',
    all: 'All',
    show: 'Show',
    search: 'Search',
    searchPlaceholder: 'Search...',
  },

  // Navigation
  nav: {
    dashboard: 'Dashboard',
    helloWorld: 'Hello World',
    settings: 'Settings',
  },

  // Search
  search: {
    placeholder: 'Search...',
    noResults: 'No results found',
    searching: 'Searching...',
    matchedIn: 'Matched in',
  },

  // Dashboard
  dashboard: {
    title: 'Dashboard',
    subtitle: 'Welcome to your application',
  },

  // Settings
  settings: {
    title: 'Settings',
    subtitle: 'Manage application settings and backups',
    appearance: 'Appearance',
    theme: 'Theme',
    themeLabel: 'Color Scheme',
    lightMode: 'Light',
    darkMode: 'Dark',
    themeDark: 'Dark',
    themeLight: 'Light',
    themeOcean: 'Ocean',
    themeSunset: 'Sunset',
    themeForest: 'Forest',
    themeNeon: 'Neon',
    themeCandy: 'Candy',
    themeLavender: 'Lavender',
    themeMint: 'Mint',
    themePeach: 'Peach',
    backupConfig: 'Backup Configuration',
    backupDirectory: 'Backup Directory',
    selectDirectory: 'Select Directory',
    notConfigured: 'Not configured',
    directoryHint: 'Choose a folder in iCloud Drive, Dropbox, OneDrive, or another synced location',
    lastBackup: 'Last backup',
    createBackup: 'Create Backup Now',
    creatingBackup: 'Creating Backup...',
    backupNote: 'Backups are created automatically every hour and when you close the app.',
    availableBackups: 'Available Backups',
    noBackups: 'No backups found',
    createFirstBackup: 'Create your first backup to see it here',
    filename: 'Filename',
    size: 'Size',
    about: 'About',
    aboutText: 'An Electron application template with React, TypeScript, and SQLite',
    version: 'Version',
    selectBackupDirFirst: 'Please select a backup directory first',
    restoreConfirm: 'Are you sure you want to restore this backup? This will replace your current data. The application will need to restart after restoration.',
    showing: 'Showing',
    of: 'of',
    backups: 'backups',
    language: 'Language',
    languageLabel: 'Application Language',
  },

  // Notifications
  notifications: {
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Information',
    backupCreated: 'Backup created successfully',
    backupRestored: 'Backup restored successfully. Please restart the application.',
    backupDirSelected: 'Backup directory selected successfully',
    settingsSaved: 'Settings saved successfully',
    loadFailed: 'Failed to load data',
    saveFailed: 'Failed to save',
    deleteFailed: 'Failed to delete',
    copiedToClipboard: 'Copied to clipboard',
    copyFailed: 'Failed to copy to clipboard',
  },

  shortcuts: {
    title: 'Keyboard Shortcuts',
    help: 'Shortcuts',
    navigation: 'Navigation',
    general: 'General',
    goDashboard: 'Go to Dashboard',
    goHelloWorld: 'Go to Hello World',
    goSettings: 'Go to Settings',
    closeModal: 'Close modal or dialog',
    showHelp: 'Show keyboard shortcuts',
    globalSearch: 'Global search',
    cmd: 'CMD',
    ctrl: 'CTRL',
    shift: 'SHIFT',
    esc: 'ESC',
    enter: 'ENTER',
  },
};

export type TranslationKeys = typeof en;
