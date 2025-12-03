import React, { useState, useEffect } from 'react';
import type { AppSettings, BackupFile } from '../../shared/types';

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>({
    backup_directory: undefined,
    last_backup: undefined,
  });
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);

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
      alert('Failed to load settings');
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
        await loadSettings();
        await loadBackups();
      }
    } catch (error) {
      console.error('Failed to select backup directory:', error);
      alert('Failed to select backup directory');
    }
  };

  const handleCreateBackup = async () => {
    if (!settings.backup_directory) {
      alert('Please select a backup directory first');
      return;
    }

    try {
      setIsCreatingBackup(true);
      const backupPath = await window.api.backup.create();
      alert(`Backup created successfully: ${backupPath}`);
      await loadSettings();
      await loadBackups();
    } catch (error) {
      console.error('Failed to create backup:', error);
      alert('Failed to create backup');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleRestoreBackup = async (backupPath: string) => {
    if (
      !confirm(
        'Are you sure you want to restore this backup? This will replace your current data. The application will need to restart after restoration.'
      )
    ) {
      return;
    }

    try {
      await window.api.backup.restore(backupPath);
      alert('Backup restored successfully. Please restart the application.');
      // The app should be manually restarted
    } catch (error) {
      console.error('Failed to restore backup:', error);
      alert('Failed to restore backup');
    }
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

  if (isLoading) {
    return <div className="loading">Loading settings...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Settings</h1>
        <p>Manage application settings and backups</p>
      </div>

      <div className="card">
        <h2>Backup Configuration</h2>

        <div className="form-group">
          <label>Backup Directory</label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              value={settings.backup_directory || 'Not configured'}
              readOnly
              style={{ flex: 1 }}
            />
            <button className="btn btn-secondary" onClick={handleSelectBackupDir}>
              Select Directory
            </button>
          </div>
          <p style={{ fontSize: '12px', color: '#666', marginTop: '6px' }}>
            Choose a folder in iCloud Drive, Dropbox, OneDrive, or another synced location
          </p>
        </div>

        {settings.last_backup && (
          <div className="alert alert-info">
            Last backup: {formatDate(settings.last_backup)}
          </div>
        )}

        <div className="btn-group">
          <button
            className="btn btn-primary"
            onClick={handleCreateBackup}
            disabled={!settings.backup_directory || isCreatingBackup}
          >
            {isCreatingBackup ? 'Creating Backup...' : 'Create Backup Now'}
          </button>
        </div>

        <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
          <p style={{ fontSize: '14px', margin: 0 }}>
            <strong>Note:</strong> Backups are created automatically every hour and when you close the app.
          </p>
        </div>
      </div>

      {settings.backup_directory && (
        <div className="card">
          <h2>Available Backups</h2>

          {backups.length === 0 ? (
            <div className="empty-state">
              <h3>No backups found</h3>
              <p>Create your first backup to see it here</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Filename</th>
                    <th>Date</th>
                    <th>Size</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {backups.map((backup) => (
                    <tr key={backup.path}>
                      <td>{backup.filename}</td>
                      <td>{formatDate(backup.date)}</td>
                      <td>{formatFileSize(backup.size)}</td>
                      <td>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleRestoreBackup(backup.path)}
                        >
                          Restore
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="card">
        <h2>About</h2>
        <p>
          <strong>TimeLedger</strong> - A simple time tracking application for freelancers and side projects
        </p>
        <p style={{ marginTop: '8px', color: '#666', fontSize: '14px' }}>Version 1.0.0</p>
      </div>
    </div>
  );
};

export default Settings;
