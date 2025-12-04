import React, { useState, useEffect, useContext } from 'react';
import type { Project, ProjectInput, TimeEntry } from '../../shared/types';
import { useNotification } from '../context/NotificationContext';
import { useI18n } from '../context/I18nContext';
import { AppContext } from '../App';

const Projects: React.FC = () => {
  const { showNotification, showConfirmation } = useNotification();
  const { t } = useI18n();
  const { navigateToPage } = useContext(AppContext);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showEntriesOverlay, setShowEntriesOverlay] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectEntries, setProjectEntries] = useState<TimeEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [formData, setFormData] = useState<ProjectInput>({
    name: '',
    hourly_rate: undefined,
    client_name: '',
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      console.log('Projects: Starting to load projects...');
      console.log('Projects: window.api available?', !!window.api);
      console.log('Projects: window.api.project available?', !!window.api?.project);
      const data = await window.api.project.getAll();
      console.log('Projects: Loaded projects:', data);
      setProjects(data);
    } catch (error) {
      console.error('Failed to load projects:', error);
      showNotification(t.notifications.loadFailed + ': ' + (error as Error).message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingProject) {
        await window.api.project.update(editingProject.id, formData);
        showNotification(t.notifications.projectUpdated, 'success');
      } else {
        await window.api.project.create(formData);
        showNotification(t.notifications.projectCreated, 'success');
      }

      setShowModal(false);
      setEditingProject(null);
      setFormData({ name: '', hourly_rate: undefined, client_name: '' });
      await loadProjects();
    } catch (error) {
      console.error('Failed to save project:', error);
      showNotification(t.notifications.saveFailed, 'error');
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      hourly_rate: project.hourly_rate,
      client_name: project.client_name || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    showConfirmation({
      message: t.projects.deleteConfirm,
      confirmText: t.common.delete,
      onConfirm: async () => {
        try {
          await window.api.project.delete(id);
          showNotification(t.notifications.projectDeleted, 'success');
          await loadProjects();
        } catch (error) {
          console.error('Failed to delete project:', error);
          showNotification(t.notifications.deleteFailed, 'error');
        }
      },
    });
  };

  const handleAddNew = () => {
    setEditingProject(null);
    setFormData({ name: '', hourly_rate: undefined, client_name: '' });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProject(null);
    setFormData({ name: '', hourly_rate: undefined, client_name: '' });
  };

  const handleProjectClick = async (project: Project) => {
    setSelectedProject(project);
    setShowEntriesOverlay(true);
    setLoadingEntries(true);

    try {
      const entries = await window.api.timeEntry.getByProject(project.id);
      setProjectEntries(entries.sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date);
        if (dateCompare !== 0) return dateCompare;
        return (b.start_time || '').localeCompare(a.start_time || '');
      }));
    } catch (error) {
      console.error('Failed to load project entries:', error);
      showNotification(t.notifications.loadFailed, 'error');
    } finally {
      setLoadingEntries(false);
    }
  };

  const handleCloseEntriesOverlay = () => {
    setShowEntriesOverlay(false);
    setSelectedProject(null);
    setProjectEntries([]);
  };

  const handleViewAllEntries = () => {
    if (selectedProject) {
      navigateToPage('entries', { projectFilter: selectedProject.id });
      handleCloseEntriesOverlay();
    }
  };

  const handleOverlayMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      (e.currentTarget as HTMLElement).dataset.mousedownOnOverlay = 'true';
    } else {
      (e.currentTarget as HTMLElement).dataset.mousedownOnOverlay = 'false';
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    const overlay = e.currentTarget as HTMLElement;
    if (e.target === e.currentTarget && overlay.dataset.mousedownOnOverlay === 'true') {
      handleCloseEntriesOverlay();
    }
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getTotalHours = (): number => {
    const totalMinutes = projectEntries.reduce((sum, entry) => sum + entry.duration_minutes, 0);
    return totalMinutes / 60;
  };

  const getTotalValue = (): number | undefined => {
    if (!selectedProject?.hourly_rate) return undefined;
    return getTotalHours() * selectedProject.hourly_rate;
  };

  if (isLoading) {
    return <div className="loading">{t.common.loading}</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>{t.projects.title}</h1>
        <p>{t.projects.subtitle}</p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2>{t.projects.allProjects}</h2>
          <button className="btn btn-primary" onClick={handleAddNew}>
            {t.projects.addProject}
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="empty-state">
            <h3>{t.projects.noProjects}</h3>
            <p>{t.projects.createFirst}</p>
            <button className="btn btn-primary" onClick={handleAddNew}>
              {t.projects.createProject}
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>{t.projects.projectName}</th>
                  <th>{t.projects.client}</th>
                  <th>{t.projects.hourlyRate}</th>
                  <th>{t.common.actions}</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id}>
                    <td>
                      <span
                        style={{ cursor: 'pointer', color: '#3498db', textDecoration: 'underline' }}
                        onClick={() => handleProjectClick(project)}
                      >
                        {project.name}
                      </span>
                    </td>
                    <td>{project.client_name || '-'}</td>
                    <td>{project.hourly_rate ? `$${project.hourly_rate.toFixed(2)}` : '-'}</td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-secondary" onClick={() => handleEdit(project)}>
                          {t.common.edit}
                        </button>
                        <button className="btn btn-danger" onClick={() => handleDelete(project.id)}>
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
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingProject ? t.projects.editProject : t.projects.newProject}</h2>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">{t.projects.projectName} *</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="client_name">{t.projects.clientName}</label>
                <input
                  type="text"
                  id="client_name"
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="hourly_rate">{t.projects.hourlyRate}</label>
                <input
                  type="number"
                  id="hourly_rate"
                  step="0.01"
                  min="0"
                  value={formData.hourly_rate || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      hourly_rate: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  {t.common.cancel}
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProject ? t.common.update : t.common.create}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEntriesOverlay && selectedProject && (
        <div
          className="modal-overlay"
          onMouseDown={handleOverlayMouseDown}
          onClick={handleOverlayClick}
        >
          <div className="modal" style={{ maxWidth: '900px' }}>
            <div className="modal-header">
              <h2>{t.projects.timeEntries}: {selectedProject.name}</h2>
              {selectedProject.client_name && (
                <p style={{ color: 'var(--text-tertiary)', fontSize: '14px', marginTop: '4px' }}>
                  {t.projects.client}: {selectedProject.client_name}
                </p>
              )}
            </div>

            {loadingEntries ? (
              <div style={{ padding: '32px', textAlign: 'center' }}>{t.common.loading}</div>
            ) : (
              <>
                {projectEntries.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <div className="stats-grid">
                      <div className="stat-card">
                        <h3>{t.dashboard.totalHours}</h3>
                        <div className="value">{getTotalHours().toFixed(2)}</div>
                      </div>
                      {getTotalValue() !== undefined && (
                        <div className="stat-card">
                          <h3>{t.projects.totalValue}</h3>
                          <div className="value">${getTotalValue()!.toFixed(2)}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {projectEntries.length === 0 ? (
                  <div className="empty-state">
                    <h3>{t.projects.noTimeEntries}</h3>
                    <p>{t.projects.noTimeTracked}</p>
                  </div>
                ) : (
                  <div className="table-container" style={{ maxHeight: '400px', overflow: 'auto' }}>
                    <table>
                      <thead>
                        <tr>
                          <th>{t.common.date}</th>
                          <th>{t.projects.start}</th>
                          <th>{t.projects.end}</th>
                          <th>{t.common.duration}</th>
                          <th>{t.common.description}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {projectEntries.map((entry) => (
                          <tr key={entry.id}>
                            <td>{entry.date}</td>
                            <td>{entry.start_time || '-'}</td>
                            <td>{entry.end_time || '-'}</td>
                            <td>{formatDuration(entry.duration_minutes)}</td>
                            <td>{entry.description || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={handleCloseEntriesOverlay}>
                {t.common.close}
              </button>
              <button type="button" className="btn btn-primary" onClick={handleViewAllEntries}>
                {t.projects.viewInTimeEntries}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
