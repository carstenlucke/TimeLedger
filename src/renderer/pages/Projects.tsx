import React, { useState, useEffect } from 'react';
import type { Project, ProjectInput } from '../../shared/types';
import { useNotification } from '../context/NotificationContext';

const Projects: React.FC = () => {
  const { showNotification, showConfirmation } = useNotification();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
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
      showNotification('Failed to load projects: ' + (error as Error).message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingProject) {
        await window.api.project.update(editingProject.id, formData);
        showNotification('Project updated successfully', 'success');
      } else {
        await window.api.project.create(formData);
        showNotification('Project created successfully', 'success');
      }

      setShowModal(false);
      setEditingProject(null);
      setFormData({ name: '', hourly_rate: undefined, client_name: '' });
      await loadProjects();
    } catch (error) {
      console.error('Failed to save project:', error);
      showNotification('Failed to save project', 'error');
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
      message: 'Are you sure you want to delete this project? All associated time entries will be deleted.',
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          await window.api.project.delete(id);
          showNotification('Project deleted successfully', 'success');
          await loadProjects();
        } catch (error) {
          console.error('Failed to delete project:', error);
          showNotification('Failed to delete project', 'error');
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

  if (isLoading) {
    return <div className="loading">Loading projects...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Projects</h1>
        <p>Manage your projects and clients</p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2>All Projects</h2>
          <button className="btn btn-primary" onClick={handleAddNew}>
            Add Project
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="empty-state">
            <h3>No projects yet</h3>
            <p>Create your first project to start tracking time</p>
            <button className="btn btn-primary" onClick={handleAddNew}>
              Create Project
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Client</th>
                  <th>Hourly Rate</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id}>
                    <td>{project.name}</td>
                    <td>{project.client_name || '-'}</td>
                    <td>{project.hourly_rate ? `$${project.hourly_rate.toFixed(2)}` : '-'}</td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-secondary" onClick={() => handleEdit(project)}>
                          Edit
                        </button>
                        <button className="btn btn-danger" onClick={() => handleDelete(project.id)}>
                          Delete
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
              <h2>{editingProject ? 'Edit Project' : 'New Project'}</h2>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Project Name *</label>
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
                <label htmlFor="client_name">Client Name</label>
                <input
                  type="text"
                  id="client_name"
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="hourly_rate">Hourly Rate ($)</label>
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
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProject ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
