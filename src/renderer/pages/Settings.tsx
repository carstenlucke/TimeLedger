import React, { useState, useEffect } from 'react';
import type { AppSettings, BackupFile } from '../../shared/types';
import { useNotification } from '../context/NotificationContext';
import { useI18n, Locale } from '../context/I18nContext';
import { useTheme, Theme } from '../context/ThemeContext';

const Settings: React.FC = () => {
  const { showNotification, showConfirmation } = useNotification();
  const { t, locale, setLocale } = useI18n();
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState<AppSettings>({
    backup_directory: undefined,
    last_backup: undefined,
  });
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [backupPageSize, setBackupPageSize] = useState<number | 'ALL'>(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [databasePath, setDatabasePath] = useState<string>('');

  useEffect(() => {
    loadSettings();
    loadBackups();
    loadDatabasePath();
  }, []);

  const loadDatabasePath = async () => {
    try {
      const path = await window.api.database.getPath();
      setDatabasePath(path);
    } catch (error) {
      console.error('Failed to load database path:', error);
    }
  };

  const handleCopyDatabasePath = async () => {
    try {
      await navigator.clipboard.writeText(databasePath);
      showNotification(t.notifications.copiedToClipboard, 'success');
    } catch (error) {
      console.error('Failed to copy path:', error);
      showNotification(t.notifications.copyFailed, 'error');
    }
  };

  const handleShowInFolder = async () => {
    try {
      await window.api.shell.showItemInFolder(databasePath);
    } catch (error) {
      console.error('Failed to show in folder:', error);
    }
  };

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const data = await window.api.settings.get();
      setSettings(data);
    } catch (error) {
      console.error('Failed to load settings:', error);
      showNotification(t.notifications.loadFailed, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadBackups = async () => {
    try {
      const data = await window.api.backup.list();
      setBackups(data);
    } catch (error) {
      console.error('Failed to load backups:', error);
    }
  };

  const handleSelectBackupDir = async () => {
    try {
      const dir = await window.api.settings.selectBackupDir();
      if (dir) {
        showNotification(t.notifications.backupDirSelected, 'success');
        await loadSettings();
        await loadBackups();
      }
    } catch (error) {
      console.error('Failed to select backup directory:', error);
      showNotification(t.notifications.saveFailed, 'error');
    }
  };

  const handleCreateBackup = async () => {
    if (!settings.backup_directory) {
      showNotification(t.settings.selectBackupDirFirst, 'warning');
      return;
    }

    try {
      setIsCreatingBackup(true);
      const backupPath = await window.api.backup.create();
      showNotification(`${t.notifications.backupCreated}: ${backupPath}`, 'success');
      await loadSettings();
      await loadBackups();
    } catch (error) {
      console.error('Failed to create backup:', error);
      showNotification(t.notifications.saveFailed, 'error');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleRestoreBackup = async (backupPath: string) => {
    showConfirmation({
      message: t.settings.restoreConfirm,
      confirmText: t.common.restore,
      onConfirm: async () => {
        try {
          await window.api.backup.restore(backupPath);
          showNotification(t.notifications.backupRestored, 'success');
        } catch (error) {
          console.error('Failed to restore backup:', error);
          showNotification(t.notifications.saveFailed, 'error');
        }
      },
    });
  };

  const formatDate = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const localeString = locale === 'de' ? 'de-DE' : 'en-GB';
    return d.toLocaleString(localeString);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getDisplayedBackups = (): BackupFile[] => {
    if (backupPageSize === 'ALL') {
      return backups;
    }
    const startIndex = (currentPage - 1) * backupPageSize;
    const endIndex = startIndex + backupPageSize;
    return backups.slice(startIndex, endIndex);
  };

  const getTotalPages = (): number => {
    if (backupPageSize === 'ALL') return 1;
    return Math.ceil(backups.length / backupPageSize);
  };

  const handlePageSizeChange = (newSize: number | 'ALL') => {
    setBackupPageSize(newSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(getTotalPages(), prev + 1));
  };

  if (isLoading) {
    return <div className="loading">{t.common.loading}</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>{t.settings.title}</h1>
        <p>{t.settings.subtitle}</p>
      </div>

      <div className="card">
        <h2>{t.settings.appearance}</h2>

        <div className="form-group">
          <label htmlFor="theme">{t.settings.themeLabel}</label>
          <select
            id="theme"
            value={theme}
            onChange={(e) => setTheme(e.target.value as Theme)}
          >
            <option value="dark">{t.settings.themeDark}</option>
            <option value="light">{t.settings.themeLight}</option>
            <option value="ocean">{t.settings.themeOcean}</option>
            <option value="sunset">{t.settings.themeSunset}</option>
            <option value="forest">{t.settings.themeForest}</option>
            <option value="neon">{t.settings.themeNeon}</option>
            <option value="candy">{t.settings.themeCandy}</option>
            <option value="lavender">{t.settings.themeLavender}</option>
            <option value="mint">{t.settings.themeMint}</option>
            <option value="peach">{t.settings.themePeach}</option>
          </select>
        </div>
      </div>

      <div className="card">
        <h2>{t.settings.language}</h2>

        <div className="form-group">
          <label htmlFor="language">{t.settings.languageLabel}</label>
          <select
            id="language"
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
          >
            <option value="en">English</option>
            <option value="de">Deutsch</option>
          </select>
        </div>
      </div>

      <div className="card">
        <h2>{t.settings.dataStorage}</h2>

        {/* Database Location */}
        <div className="form-group">
          <label>{t.settings.databaseLocation}</label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              value={databasePath}
              readOnly
              style={{ flex: 1, fontFamily: 'monospace', fontSize: '13px' }}
            />
            <button className="btn btn-secondary" onClick={handleCopyDatabasePath} title={t.settings.copyPath}>
              {t.settings.copyPath}
            </button>
            <button className="btn btn-secondary" onClick={handleShowInFolder} title={t.settings.showInFolder}>
              {t.settings.showInFolder}
            </button>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '6px' }}>
            {t.settings.databaseHint}
          </p>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '24px 0' }} />

        {/* Backup Directory */}
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>{t.settings.backupConfig}</h3>

        <div className="form-group">
          <label>{t.settings.backupDirectory}</label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              value={settings.backup_directory || t.settings.notConfigured}
              readOnly
              style={{ flex: 1 }}
            />
            <button className="btn btn-secondary" onClick={handleSelectBackupDir}>
              {t.settings.selectDirectory}
            </button>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '6px' }}>
            {t.settings.directoryHint}
          </p>
        </div>

        {/* Backup Status and Actions */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          padding: '12px 16px',
          backgroundColor: 'var(--bg-tertiary)',
          borderRadius: '6px',
          marginTop: '8px'
        }}>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            {settings.last_backup ? (
              <span>{t.settings.lastBackup}: <strong>{formatDate(settings.last_backup)}</strong></span>
            ) : (
              <span>{t.settings.noBackups}</span>
            )}
            <span style={{ margin: '0 8px', color: 'var(--text-tertiary)' }}>·</span>
            <span>{t.settings.backupNote}</span>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleCreateBackup}
            disabled={!settings.backup_directory || isCreatingBackup}
            style={{ whiteSpace: 'nowrap' }}
          >
            {isCreatingBackup ? t.settings.creatingBackup : t.settings.createBackup}
          </button>
        </div>

        {/* Available Backups */}
        {settings.backup_directory && (
          <>
            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '24px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>
                {t.settings.availableBackups} ({backups.length})
              </h3>
              {backups.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{t.common.show}:</span>
                  <select
                    value={backupPageSize}
                    onChange={(e) => handlePageSizeChange(e.target.value === 'ALL' ? 'ALL' : parseInt(e.target.value))}
                    style={{ padding: '6px 12px', fontSize: '14px', minWidth: '80px' }}
                  >
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value="ALL">{t.common.all}</option>
                  </select>
                </div>
              )}
            </div>

            {backups.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px' }}>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{t.settings.createFirstBackup}</p>
              </div>
            ) : (
              <>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>{t.settings.filename}</th>
                        <th>{t.common.date}</th>
                        <th>{t.settings.size}</th>
                        <th>{t.common.actions}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getDisplayedBackups().map((backup) => (
                        <tr key={backup.path}>
                          <td>{backup.filename}</td>
                          <td>{formatDate(backup.date)}</td>
                          <td>{formatFileSize(backup.size)}</td>
                          <td>
                            <button
                              className="btn btn-danger"
                              onClick={() => handleRestoreBackup(backup.path)}
                            >
                              {t.common.restore}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {backupPageSize !== 'ALL' && getTotalPages() > 1 && (
                  <div style={{
                    marginTop: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: '4px'
                  }}>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                      {t.settings.showing} {((currentPage - 1) * (backupPageSize as number)) + 1}-{Math.min(currentPage * (backupPageSize as number), backups.length)} {t.settings.of} {backups.length} {t.settings.backups}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn btn-secondary"
                        onClick={handlePreviousPage}
                        disabled={currentPage === 1}
                        style={{ padding: '6px 12px', fontSize: '14px' }}
                      >
                        ← {t.common.previous}
                      </button>
                      <span style={{
                        padding: '6px 12px',
                        fontSize: '14px',
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        {t.common.page} {currentPage} / {getTotalPages()}
                      </span>
                      <button
                        className="btn btn-secondary"
                        onClick={handleNextPage}
                        disabled={currentPage === getTotalPages()}
                        style={{ padding: '6px 12px', fontSize: '14px' }}
                      >
                        {t.common.next} →
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      <div className="card">
        <h2>{t.settings.about}</h2>
        <p>
          <strong>TimeLedger</strong> - {t.settings.aboutText}
        </p>
        <p style={{ marginTop: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>{t.settings.version} {__APP_VERSION__}</p>
      </div>
    </div>
  );
};

export default Settings;
