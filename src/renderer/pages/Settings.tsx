import React, { useState, useEffect } from 'react';
import type { AppSettings, BackupFile } from '../../shared/types';
import { useNotification } from '../context/NotificationContext';
import { useI18n, Locale } from '../context/I18nContext';
import { useTheme } from '../context/ThemeContext';

const Settings: React.FC = () => {
  const { showNotification, showConfirmation } = useNotification();
  const { t, locale, setLocale } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const [settings, setSettings] = useState<AppSettings>({
    backup_directory: undefined,
    last_backup: undefined,
  });
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [backupPageSize, setBackupPageSize] = useState<number | 'ALL'>(20);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadSettings();
    loadBackups();
  }, []);

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
    return d.toLocaleString();
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
          <label>{t.settings.themeLabel}</label>
          <div className="theme-toggle-container">
            <span className="theme-toggle-label">
              {theme === 'dark' ? t.settings.darkMode : t.settings.lightMode}
            </span>
            <div
              className={`theme-toggle-switch ${theme === 'light' ? 'active' : ''}`}
              onClick={toggleTheme}
            >
              <div className="theme-toggle-slider">
                {theme === 'dark' ? '🌙' : '☀️'}
              </div>
            </div>
          </div>
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
        <h2>{t.settings.backupConfig}</h2>

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

        {settings.last_backup && (
          <div className="alert alert-info">
            {t.settings.lastBackup}: {formatDate(settings.last_backup)}
          </div>
        )}

        <div className="btn-group">
          <button
            className="btn btn-primary"
            onClick={handleCreateBackup}
            disabled={!settings.backup_directory || isCreatingBackup}
          >
            {isCreatingBackup ? t.settings.creatingBackup : t.settings.createBackup}
          </button>
        </div>

        <div style={{ marginTop: '16px', padding: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px' }}>
          <p style={{ fontSize: '14px', margin: 0, color: 'var(--text-secondary)' }}>
            <strong>Note:</strong> {t.settings.backupNote}
          </p>
        </div>
      </div>

      {settings.backup_directory && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2>{t.settings.availableBackups}</h2>
            {backups.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{t.common.show}:</span>
                <select
                  value={backupPageSize}
                  onChange={(e) => handlePageSizeChange(e.target.value === 'ALL' ? 'ALL' : parseInt(e.target.value))}
                  style={{ padding: '6px 12px', fontSize: '14px' }}
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
            <div className="empty-state">
              <h3>{t.settings.noBackups}</h3>
              <p>{t.settings.createFirstBackup}</p>
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
        </div>
      )}

      <div className="card">
        <h2>{t.settings.about}</h2>
        <p>
          <strong>TimeLedger</strong> - {t.settings.aboutText}
        </p>
        <p style={{ marginTop: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>{t.settings.version} 1.0.0</p>
      </div>
    </div>
  );
};

export default Settings;
