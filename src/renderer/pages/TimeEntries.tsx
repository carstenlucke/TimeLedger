import React, { useState, useEffect } from 'react';
import type { TimeEntry, TimeEntryInput, Project } from '../../shared/types';
import { useNotification } from '../context/NotificationContext';
import { useI18n } from '../context/I18nContext';

interface TimeEntriesProps {
  initialProjectFilter?: number;
}

const TimeEntries: React.FC<TimeEntriesProps> = ({ initialProjectFilter }) => {
  const { showNotification, showConfirmation } = useNotification();
  const { t } = useI18n();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [inputMode, setInputMode] = useState<'duration' | 'times'>('duration');
  const [projectFilter, setProjectFilter] = useState<number | undefined>(initialProjectFilter);
  const [sortField, setSortField] = useState<'date' | 'project' | 'duration'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [formData, setFormData] = useState<TimeEntryInput>({
    project_id: 0,
    date: new Date().toISOString().split('T')[0],
    start_time: '',
    end_time: '',
    duration_minutes: undefined,
    description: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setProjectFilter(initialProjectFilter);
  }, [initialProjectFilter]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [entriesData, projectsData] = await Promise.all([
        window.api.timeEntry.getAll(),
        window.api.project.getAll(),
      ]);
      setEntries(entriesData);
      setProjects(projectsData);

      // Set default project if available
      if (projectsData.length > 0 && formData.project_id === 0) {
        setFormData((prev) => ({ ...prev, project_id: projectsData[0].id }));
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      showNotification(t.notifications.loadFailed, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.project_id === 0) {
      showNotification(t.timeEntries.selectProject, 'warning');
      return;
    }

    try {
      const dataToSubmit = { ...formData };

      if (inputMode === 'duration') {
        // Clear start/end times when using duration mode
        dataToSubmit.start_time = undefined;
        dataToSubmit.end_time = undefined;
      } else {
        // Clear duration when using times mode
        dataToSubmit.duration_minutes = undefined;
      }

      if (editingEntry) {
        await window.api.timeEntry.update(editingEntry.id, dataToSubmit);
        showNotification(t.notifications.entryUpdated, 'success');
      } else {
        await window.api.timeEntry.create(dataToSubmit);
        showNotification(t.notifications.entryCreated, 'success');
      }

      setShowModal(false);
      setEditingEntry(null);
      resetForm();
      await loadData();
    } catch (error) {
      console.error('Failed to save time entry:', error);
      showNotification(t.notifications.saveFailed, 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      project_id: projects.length > 0 ? projects[0].id : 0,
      date: new Date().toISOString().split('T')[0],
      start_time: '',
      end_time: '',
      duration_minutes: undefined,
      description: '',
    });
    setInputMode('duration');
  };

  const handleEdit = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setFormData({
      project_id: entry.project_id,
      date: entry.date,
      start_time: entry.start_time || '',
      end_time: entry.end_time || '',
      duration_minutes: entry.duration_minutes,
      description: entry.description || '',
    });
    setInputMode(entry.start_time && entry.end_time ? 'times' : 'duration');
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    showConfirmation({
      message: t.timeEntries.deleteConfirm,
      confirmText: t.common.delete,
      onConfirm: async () => {
        try {
          await window.api.timeEntry.delete(id);
          showNotification(t.notifications.entryDeleted, 'success');
          await loadData();
        } catch (error) {
          console.error('Failed to delete time entry:', error);
          showNotification(t.notifications.deleteFailed, 'error');
        }
      },
    });
  };

  const handleAddNew = () => {
    setEditingEntry(null);
    resetForm();
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingEntry(null);
    resetForm();
  };

  const handleOverlayMouseDown = (e: React.MouseEvent) => {
    // Track if mousedown was on the overlay
    if (e.target === e.currentTarget) {
      (e.currentTarget as HTMLElement).dataset.mousedownOnOverlay = 'true';
    } else {
      (e.currentTarget as HTMLElement).dataset.mousedownOnOverlay = 'false';
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    // Only close if both mousedown and click were on the overlay itself
    const overlay = e.currentTarget as HTMLElement;
    if (e.target === e.currentTarget && overlay.dataset.mousedownOnOverlay === 'true') {
      handleCloseModal();
    }
  };

  const getProjectName = (projectId: number): string => {
    const project = projects.find((p) => p.id === projectId);
    return project ? project.name : 'Unknown';
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const handleSort = (field: 'date' | 'project' | 'duration') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: 'date' | 'project' | 'duration'): string => {
    if (sortField !== field) return '↕';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const getFilteredAndSortedEntries = (): TimeEntry[] => {
    let filtered = [...entries];

    // Filter by project
    if (projectFilter) {
      filtered = filtered.filter(entry => entry.project_id === projectFilter);
    }

    // Filter by date range
    if (dateFrom) {
      filtered = filtered.filter(entry => entry.date >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter(entry => entry.date <= dateTo);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;

      if (sortField === 'date') {
        comparison = a.date.localeCompare(b.date);
        if (comparison === 0 && a.start_time && b.start_time) {
          comparison = a.start_time.localeCompare(b.start_time);
        }
      } else if (sortField === 'project') {
        const projectA = getProjectName(a.project_id);
        const projectB = getProjectName(b.project_id);
        comparison = projectA.localeCompare(projectB);
      } else if (sortField === 'duration') {
        comparison = a.duration_minutes - b.duration_minutes;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  };

  const filteredEntries = getFilteredAndSortedEntries();

  const getFilteredProjectName = (): string => {
    if (!projectFilter) return '';
    const project = projects.find(p => p.id === projectFilter);
    return project ? project.name : '';
  };

  if (isLoading) {
    return <div className="loading">{t.common.loading}</div>;
  }

  if (projects.length === 0) {
    return (
      <div>
        <div className="page-header">
          <h1>{t.timeEntries.title}</h1>
          <p>{t.timeEntries.subtitle}</p>
        </div>
        <div className="card">
          <div className="empty-state">
            <h3>{t.projects.noProjects}</h3>
            <p>{t.projects.createFirst}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>{t.timeEntries.title}</h1>
        <p>{t.timeEntries.subtitle}</p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2>
            {projectFilter ? `${t.timeEntries.title}: ${getFilteredProjectName()}` : t.timeEntries.allEntries}
          </h2>
          <button className="btn btn-primary" onClick={handleAddNew}>
            {t.timeEntries.addEntry}
          </button>
        </div>

        {/* Filters */}
        <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="filter-project">{t.timeEntries.filterByProject}</label>
              <select
                id="filter-project"
                value={projectFilter || ''}
                onChange={(e) => setProjectFilter(e.target.value ? parseInt(e.target.value) : undefined)}
              >
                <option value="">{t.projects.allProjects}</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="filter-date-from">{t.timeEntries.from}</label>
              <input
                type="date"
                id="filter-date-from"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="filter-date-to">{t.timeEntries.to}</label>
              <input
                type="date"
                id="filter-date-to"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
          {(projectFilter || dateFrom || dateTo) && (
            <button
              className="btn btn-secondary"
              onClick={() => {
                setProjectFilter(undefined);
                setDateFrom('');
                setDateTo('');
              }}
              style={{ marginTop: '12px' }}
            >
              {t.common.clearFilter}
            </button>
          )}
        </div>

        {filteredEntries.length === 0 ? (
          <div className="empty-state">
            <h3>{projectFilter ? t.timeEntries.noEntriesForProject : t.timeEntries.noEntries}</h3>
            <p>{t.timeEntries.createFirst}</p>
            <button className="btn btn-primary" onClick={handleAddNew}>
              {t.timeEntries.createEntry}
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th
                    onClick={() => handleSort('date')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    {t.common.date} {getSortIcon('date')}
                  </th>
                  <th
                    onClick={() => handleSort('project')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    {t.common.project} {getSortIcon('project')}
                  </th>
                  <th>{t.projects.start}</th>
                  <th>{t.projects.end}</th>
                  <th
                    onClick={() => handleSort('duration')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    {t.common.duration} {getSortIcon('duration')}
                  </th>
                  <th>{t.common.description}</th>
                  <th>{t.common.actions}</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.date}</td>
                    <td>{getProjectName(entry.project_id)}</td>
                    <td>{entry.start_time || '-'}</td>
                    <td>{entry.end_time || '-'}</td>
                    <td>{formatDuration(entry.duration_minutes)}</td>
                    <td>{entry.description || '-'}</td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-secondary" onClick={() => handleEdit(entry)}>
                          {t.common.edit}
                        </button>
                        <button className="btn btn-danger" onClick={() => handleDelete(entry.id)}>
                          {t.common.delete}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div
          className="modal-overlay"
          onMouseDown={handleOverlayMouseDown}
          onClick={handleOverlayClick}
        >
          <div className="modal">
            <div className="modal-header">
              <h2>{editingEntry ? t.timeEntries.editEntry : t.timeEntries.newEntry}</h2>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="project_id">{t.common.project} {t.timeEntries.required}</label>
                <select
                  id="project_id"
                  value={formData.project_id}
                  onChange={(e) => setFormData({ ...formData, project_id: parseInt(e.target.value) })}
                  required
                >
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="date">{t.common.date} {t.timeEntries.required}</label>
                <input
                  type="date"
                  id="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>{t.timeEntries.inputMode}</label>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="radio"
                      checked={inputMode === 'duration'}
                      onChange={() => setInputMode('duration')}
                    />
                    {t.timeEntries.durationMode}
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="radio"
                      checked={inputMode === 'times'}
                      onChange={() => setInputMode('times')}
                    />
                    {t.timeEntries.timesMode}
                  </label>
                </div>
              </div>

              {inputMode === 'duration' ? (
                <div className="form-group">
                  <label htmlFor="duration_minutes">{t.timeEntries.durationMinutes} {t.timeEntries.required}</label>
                  <input
                    type="number"
                    id="duration_minutes"
                    min="1"
                    value={formData.duration_minutes || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        duration_minutes: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    required
                  />
                </div>
              ) : (
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="start_time">{t.timeEntries.startTime} {t.timeEntries.required}</label>
                    <input
                      type="time"
                      id="start_time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="end_time">{t.timeEntries.endTime} {t.timeEntries.required}</label>
                    <input
                      type="time"
                      id="end_time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="description">{t.common.description}</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t.timeEntries.descriptionPlaceholder}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  {t.common.cancel}
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingEntry ? t.common.update : t.common.create}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeEntries;
