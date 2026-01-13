import React, { useState, useEffect, useContext, useRef } from 'react';
import type { Project, ProjectInput, TimeEntry, ProjectStatus, Customer } from '../../shared/types';
import { useNotification } from '../context/NotificationContext';
import { useI18n } from '../context/I18nContext';
import { AppContext } from '../App';
import { isTypingInInput, getModifierKey } from '../contexts/KeyboardShortcutContext';
import { useSortableData, SortableHeader, SortableColumnConfig } from '../components/SortableTable';

const Projects: React.FC = () => {
  const { showNotification, showConfirmation } = useNotification();
  const { t, formatCurrency, formatNumber, formatDate } = useI18n();
  const { navigateToPage } = useContext(AppContext);
  const [projects, setProjects] = useState<Project[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showEntriesOverlay, setShowEntriesOverlay] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectEntries, setProjectEntries] = useState<TimeEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<ProjectInput>({
    name: '',
    hourly_rate: undefined,
    client_name: '',
    customer_id: undefined,
    status: 'active',
  });
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const customerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProjects();
    loadCustomers();
  }, []);

  // ESC key to close modals
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showEntriesOverlay) {
          handleCloseEntriesOverlay();
        } else if (showModal) {
          handleCloseModal();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showModal, showEntriesOverlay]);

  // 'f' key to focus search field
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'f' && !showModal && !showEntriesOverlay && !isTypingInInput(event)) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showModal, showEntriesOverlay]);

  // CMD+N / CTRL+N to add new project
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'n' && getModifierKey(event) && !showModal && !showEntriesOverlay) {
        event.preventDefault();
        handleAddNew();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showModal, showEntriesOverlay]);

  // CMD+ENTER / CTRL+ENTER to submit form in modal
  useEffect(() => {
    if (!showModal) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && getModifierKey(event)) {
        event.preventDefault();
        handleSubmit(new Event('submit') as any);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showModal, formData, editingProject]);

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

  const loadCustomers = async () => {
    try {
      const data = await window.api.customer.getAll();
      setCustomers(data);
    } catch (error) {
      console.error('Failed to load customers:', error);
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
      setFormData({ name: '', hourly_rate: undefined, client_name: '', customer_id: undefined, status: 'active' });
      setCustomerSearch('');
      setShowNewCustomerForm(false);
      await loadProjects();
    } catch (error) {
      console.error('Failed to save project:', error);
      showNotification(t.notifications.saveFailed, 'error');
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    
    // Find customer name if customer_id is set
    const customer = project.customer_id ? customers.find(c => c.id === project.customer_id) : null;
    
    setFormData({
      name: project.name,
      hourly_rate: project.hourly_rate,
      client_name: project.client_name || '',
      customer_id: project.customer_id,
      status: project.status,
    });
    
    setCustomerSearch(customer?.name || '');
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
    setFormData({ name: '', hourly_rate: undefined, client_name: '', customer_id: undefined, status: 'active' });
    setCustomerSearch('');
    setShowNewCustomerForm(false);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProject(null);
    setFormData({ name: '', hourly_rate: undefined, client_name: '', customer_id: undefined, status: 'active' });
    setCustomerSearch('');
    setShowNewCustomerForm(false);
    setShowCustomerDropdown(false);
  };

  const handleSelectCustomer = (customer: Customer) => {
    setFormData({ ...formData, customer_id: customer.id, client_name: customer.name });
    setCustomerSearch(customer.name);
    setShowCustomerDropdown(false);
    setShowNewCustomerForm(false);
  };

  const handleCreateNewCustomer = async () => {
    if (!customerSearch.trim()) {
      showNotification(t.customers.customerName + ' is required', 'error');
      return;
    }

    try {
      const newCustomer = await window.api.customer.create({ name: customerSearch.trim() });
      await loadCustomers();
      setFormData({ ...formData, customer_id: newCustomer.id, client_name: newCustomer.name });
      setCustomerSearch(newCustomer.name);
      setShowNewCustomerForm(false);
      setShowCustomerDropdown(false);
      showNotification(t.notifications.customerCreated || 'Customer created successfully', 'success');
    } catch (error) {
      console.error('Failed to create customer:', error);
      showNotification(t.notifications.saveFailed, 'error');
    }
  };

  const getFilteredCustomers = () => {
    if (!customerSearch.trim()) return customers;
    const query = customerSearch.toLowerCase();
    return customers.filter(c => c.name.toLowerCase().includes(query));
  };

  const getCustomerNameById = (customerId?: number): string => {
    if (!customerId) return '';
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || '';
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

  const normalizeSearchValue = (value: string): string => value.toLowerCase();

  const filteredProjects = projects.filter((project) => {
    // Status filter
    if (statusFilter !== 'all' && project.status !== statusFilter) return false;

    // Search filter
    if (!searchQuery.trim()) return true;
    const query = normalizeSearchValue(searchQuery.trim());
    const haystack = [
      project.name,
      project.client_name || '',
      project.hourly_rate !== undefined ? String(project.hourly_rate) : '',
    ].join(' ').toLowerCase();
    return haystack.includes(query);
  });

  const projectColumns: SortableColumnConfig<Project>[] = [
    { key: 'name', label: t.projects.projectName },
    { key: 'client_name', label: t.projects.client },
    { key: 'hourly_rate', label: t.projects.hourlyRate },
    { key: 'status', label: t.projects.status.label },
  ];

  const { sortedItems: sortedProjects, sortConfig, handleSort } = useSortableData(
    filteredProjects,
    { key: 'name', direction: 'asc' }
  );

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <h2>{t.projects.allProjects}</h2>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | 'all')}
                className="form-control"
                style={{ width: '150px' }}
              >
                <option value="all">{t.projects.status.all}</option>
                <option value="active">{t.projects.status.active}</option>
                <option value="completed">{t.projects.status.completed}</option>
                <option value="paused">{t.projects.status.paused}</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <input
                ref={searchInputRef}
                id="project-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    setSearchQuery('');
                  }
                }}
                placeholder={t.common.searchPlaceholder}
              />
            </div>
            <button className="btn btn-primary" onClick={handleAddNew}>
              {t.projects.addProject}
            </button>
          </div>
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

            {filteredProjects.length === 0 ? (
              <div className="empty-state">
                <h3>{t.search.noResults}</h3>
              </div>
            ) : (
              <table>
                <SortableHeader
                  columns={[...projectColumns, { key: 'id' as keyof Project, label: t.common.actions, sortable: false }]}
                  sortConfig={sortConfig}
                  onSort={handleSort}
                />
                <tbody>
                  {sortedProjects.map((project) => (
                    <tr key={project.id} onDoubleClick={() => handleEdit(project)}>
                      <td>
                        <span
                          onClick={() => handleProjectClick(project)}
                          style={{
                            cursor: 'pointer',
                            color: 'var(--accent-blue)',
                            fontWeight: '500',
                            transition: 'opacity 0.2s',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                        >
                          {project.name}
                        </span>
                      </td>
                      <td>{getCustomerNameById(project.customer_id) || project.client_name || '—'}</td>
                      <td>{project.hourly_rate ? formatCurrency(project.hourly_rate) : '—'}</td>
                      <td>
                        <span className={`status-badge status-${project.status}`}>
                          {t.projects.status[project.status]}
                        </span>
                      </td>
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
            )}
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
                <label htmlFor="customer">{t.projects.client}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    ref={customerInputRef}
                    type="text"
                    id="customer"
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setShowCustomerDropdown(true);
                      setShowNewCustomerForm(false);
                      // Clear selection if user types
                      if (formData.customer_id) {
                        setFormData({ ...formData, customer_id: undefined, client_name: '' });
                      }
                    }}
                    onFocus={() => setShowCustomerDropdown(true)}
                    placeholder={t.customers.selectOrCreate}
                  />
                  {showCustomerDropdown && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: '4px',
                        backgroundColor: 'var(--card-bg)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        zIndex: 1000,
                      }}
                    >
                      {getFilteredCustomers().length > 0 ? (
                        <>
                          {getFilteredCustomers().map((customer) => (
                            <div
                              key={customer.id}
                              onClick={() => handleSelectCustomer(customer)}
                              style={{
                                padding: '8px 12px',
                                cursor: 'pointer',
                                borderBottom: '1px solid var(--border-color)',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--hover-bg)')}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                            >
                              {customer.name}
                              {customer.email && (
                                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                                  {customer.email}
                                </div>
                              )}
                            </div>
                          ))}
                        </>
                      ) : null}
                      {customerSearch.trim() && !getFilteredCustomers().some(c => c.name.toLowerCase() === customerSearch.toLowerCase()) && (
                        <div
                          onClick={() => {
                            setShowNewCustomerForm(true);
                            setShowCustomerDropdown(false);
                          }}
                          style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                            color: 'var(--accent-blue)',
                            fontWeight: '500',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--hover-bg)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          + {t.customers.createNew}: "{customerSearch}"
                        </div>
                      )}
                      <div
                        onClick={() => {
                          setShowCustomerDropdown(false);
                          setCustomerSearch('');
                          setFormData({ ...formData, customer_id: undefined, client_name: '' });
                        }}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          textAlign: 'center',
                          color: 'var(--text-tertiary)',
                          fontSize: '12px',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--hover-bg)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        {t.common.close}
                      </div>
                    </div>
                  )}
                </div>
                {showNewCustomerForm && (
                  <div style={{ marginTop: '8px', padding: '12px', backgroundColor: 'var(--hover-bg)', borderRadius: '4px' }}>
                    <p style={{ marginBottom: '8px', fontSize: '14px' }}>
                      {t.customers.createNew}: <strong>{customerSearch}</strong>
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={handleCreateNewCustomer}
                      >
                        {t.common.create}
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setShowNewCustomerForm(false);
                          setCustomerSearch('');
                        }}
                      >
                        {t.common.cancel}
                      </button>
                    </div>
                  </div>
                )}
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

              <div className="form-group">
                <label htmlFor="status">{t.projects.status.label}</label>
                <select
                  id="status"
                  value={formData.status || 'active'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectStatus })}
                  className="form-control"
                >
                  <option value="active">{t.projects.status.active}</option>
                  <option value="completed">{t.projects.status.completed}</option>
                  <option value="paused">{t.projects.status.paused}</option>
                </select>
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
                        <div className="value">{formatNumber(getTotalHours(), 2)}</div>
                      </div>
                      {getTotalValue() !== undefined && (
                        <div className="stat-card">
                          <h3>{t.projects.totalValue}</h3>
                          <div className="value">{formatCurrency(getTotalValue()!)}</div>
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
                            <td>{formatDate(entry.date)}</td>
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
