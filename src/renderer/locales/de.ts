import type { TranslationKeys } from './en';

export const de: TranslationKeys = {
  // Formatting
  formatting: {
    currency: 'EUR',
    currencySymbol: '€',
    decimalSeparator: ',',
    thousandsSeparator: '.',
  },

  // Common
  common: {
    save: 'Speichern',
    cancel: 'Abbrechen',
    delete: 'Löschen',
    edit: 'Bearbeiten',
    create: 'Erstellen',
    update: 'Aktualisieren',
    close: 'Schließen',
    loading: 'Lädt...',
    actions: 'Aktionen',
    description: 'Beschreibung',
    date: 'Datum',
    restore: 'Wiederherstellen',
    all: 'Alle',
    show: 'Anzeigen',
    search: 'Suchen',
    searchPlaceholder: 'Suchen...',
  },

  // Navigation
  nav: {
    dashboard: 'Dashboard',
    helloWorld: 'Hallo Welt',
    settings: 'Einstellungen',
  },

  // Search
  search: {
    placeholder: 'Suchen...',
    noResults: 'Keine Ergebnisse gefunden',
    searching: 'Suche läuft...',
    matchedIn: 'Gefunden in',
  },

  // Dashboard
  dashboard: {
    title: 'Dashboard',
    subtitle: 'Willkommen in Ihrer Anwendung',
  },

  // Settings
  settings: {
    title: 'Einstellungen',
    subtitle: 'Anwendungseinstellungen und Backups verwalten',
    appearance: 'Erscheinungsbild',
    theme: 'Thema',
    themeLabel: 'Farbschema',
    lightMode: 'Hell',
    darkMode: 'Dunkel',
    themeDark: 'Dunkel',
    themeLight: 'Hell',
    themeOcean: 'Ozean',
    themeSunset: 'Sonnenuntergang',
    themeForest: 'Wald',
    themeNeon: 'Neon',
    themeCandy: 'Bonbon',
    themeLavender: 'Lavendel',
    themeMint: 'Minze',
    themePeach: 'Pfirsich',
    backupConfig: 'Backup-Konfiguration',
    backupDirectory: 'Backup-Verzeichnis',
    selectDirectory: 'Verzeichnis auswählen',
    notConfigured: 'Nicht konfiguriert',
    directoryHint: 'Wählen Sie einen Ordner in iCloud Drive, Dropbox, OneDrive oder einem anderen synchronisierten Speicherort',
    lastBackup: 'Letztes Backup',
    createBackup: 'Backup jetzt erstellen',
    creatingBackup: 'Erstelle Backup...',
    backupNote: 'Backups werden automatisch stündlich und beim Schließen der App erstellt.',
    availableBackups: 'Verfügbare Backups',
    noBackups: 'Keine Backups gefunden',
    createFirstBackup: 'Erstellen Sie Ihr erstes Backup, um es hier zu sehen',
    filename: 'Dateiname',
    size: 'Größe',
    about: 'Über',
    aboutText: 'Eine Electron-Anwendungsvorlage mit React, TypeScript und SQLite',
    version: 'Version',
    selectBackupDirFirst: 'Bitte wählen Sie zuerst ein Backup-Verzeichnis aus',
    restoreConfirm: 'Möchten Sie dieses Backup wirklich wiederherstellen? Ihre aktuellen Daten werden ersetzt. Die Anwendung muss nach der Wiederherstellung neu gestartet werden.',
    showing: 'Zeige',
    of: 'von',
    backups: 'Backups',
    language: 'Sprache',
    languageLabel: 'Anwendungssprache',
  },

  // Notifications
  notifications: {
    success: 'Erfolg',
    error: 'Fehler',
    warning: 'Warnung',
    info: 'Information',
    backupCreated: 'Backup erfolgreich erstellt',
    backupRestored: 'Backup erfolgreich wiederhergestellt. Bitte starten Sie die Anwendung neu.',
    backupDirSelected: 'Backup-Verzeichnis erfolgreich ausgewählt',
    settingsSaved: 'Einstellungen erfolgreich gespeichert',
    loadFailed: 'Laden fehlgeschlagen',
    saveFailed: 'Speichern fehlgeschlagen',
    deleteFailed: 'Löschen fehlgeschlagen',
    copiedToClipboard: 'In Zwischenablage kopiert',
    copyFailed: 'Kopieren in Zwischenablage fehlgeschlagen',
  },

  shortcuts: {
    title: 'Tastaturkürzel',
    help: 'Tastaturkürzel',
    navigation: 'Navigation',
    general: 'Allgemein',
    goDashboard: 'Zum Dashboard',
    goHelloWorld: 'Zu Hallo Welt',
    goSettings: 'Zu Einstellungen',
    closeModal: 'Modal oder Dialog schließen',
    showHelp: 'Tastaturkürzel anzeigen',
    globalSearch: 'Globale Suche',
    cmd: 'CMD',
    ctrl: 'STRG',
    shift: 'UMSCHALT',
    esc: 'ESC',
    enter: 'ENTER',
  },
};
