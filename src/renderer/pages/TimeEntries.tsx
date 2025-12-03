import React, { useState, useEffect } from 'react';
import type { TimeEntry, TimeEntryInput, Project } from '../../shared/types';

const TimeEntries: React.FC = () => {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [inputMode, setInputMode] = useState<'duration' | 'times'>('duration');
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
      alert('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.project_id === 0) {
      alert('Please select a project');
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
      } else {
        await window.api.timeEntry.create(dataToSubmit);
      }

      setShowModal(false);
      setEditingEntry(null);
      resetForm();
      await loadData();
    } catch (error) {
      console.error('Failed to save time entry:', error);
      alert('Failed to save time entry');
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
    if (!confirm('Are you sure you want to delete this time entry?')) {
      return;
    }

    try {
      await window.api.timeEntry.delete(id);
      await loadData();
    } catch (error) {
      console.error('Failed to delete time entry:', error);
      alert('Failed to delete time entry');
    }
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

  const getProjectName = (projectId: number): string => {
    const project = projects.find((p) => p.id === projectId);
    return project ? project.name : 'Unknown';
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (isLoading) {
    return <div className="loading">Loading time entries...</div>;
  }

  if (projects.length === 0) {
    return (
      <div>
        <div className="page-header">
          <h1>Time Entries</h1>
          <p>Track your working hours</p>
        </div>
        <div className="card">
          <div className="empty-state">
            <h3>No projects available</h3>
            <p>Please create a project first before tracking time</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Time Entries</h1>
        <p>Track your working hours</p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2>All Time Entries</h2>
          <button className="btn btn-primary" onClick={handleAddNew}>
            Add Time Entry
          </button>
        </div>

        {entries.length === 0 ? (
          <div className="empty-state">
            <h3>No time entries yet</h3>
            <p>Start tracking your time by creating your first entry</p>
            <button className="btn btn-primary" onClick={handleAddNew}>
              Create Entry
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Project</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Duration</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
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
                          Edit
                        </button>
                        <button className="btn btn-danger" onClick={() => handleDelete(entry.id)}>
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
              <h2>{editingEntry ? 'Edit Time Entry' : 'New Time Entry'}</h2>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="project_id">Project *</label>
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
                <label htmlFor="date">Date *</label>
                <input
                  type="date"
                  id="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Input Mode</label>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="radio"
                      checked={inputMode === 'duration'}
                      onChange={() => setInputMode('duration')}
                    />
                    Duration
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="radio"
                      checked={inputMode === 'times'}
                      onChange={() => setInputMode('times')}
                    />
                    Start/End Times
                  </label>
                </div>
              </div>

              {inputMode === 'duration' ? (
                <div className="form-group">
                  <label htmlFor="duration_minutes">Duration (minutes) *</label>
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
                    <label htmlFor="start_time">Start Time *</label>
                    <input
                      type="time"
                      id="start_time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="end_time">End Time *</label>
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
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What did you work on?"
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingEntry ? 'Update' : 'Create'}
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
