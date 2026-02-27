import React, { useState, useEffect, useContext, useRef } from 'react';
import type { TimeEntry, TimeEntryInput, Project, Invoice, InvoiceWithEntries } from '../../shared/types';
import { useNotification } from '../context/NotificationContext';
import { useI18n } from '../context/I18nContext';
import { Copy } from 'lucide-react';
import { AppContext } from '../App';
import { isTypingInInput, getModifierKey } from '../contexts/KeyboardShortcutContext';
import { LocalizedDateInput } from '../components/LocalizedDateInput';
import { DurationPicker } from '../components/DurationPicker';
import { useSortableData, SortableHeader, SortableColumnConfig } from '../components/SortableTable';

interface TimeEntriesProps {
  initialProjectFilter?: number;
  initialEntryId?: number;
  initialOpenNew?: boolean;
}

type TimeEntryRow = TimeEntry & {
  project_name: string;
};

const TimeEntries: React.FC<TimeEntriesProps> = ({ initialProjectFilter, initialEntryId, initialOpenNew }) => {
  const { showNotification, showConfirmation } = useNotification();
  const { t, formatCurrency, formatDate } = useI18n();
  const { navigateToPage } = useContext(AppContext);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [viewingInvoice, setViewingInvoice] = useState<InvoiceWithEntries | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [inputMode, setInputMode] = useState<'duration' | 'times'>('duration');
  const [projectFilter, setProjectFilter] = useState<number | undefined>(initialProjectFilter);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [selectedEntries, setSelectedEntries] = useState<Set<number>>(new Set());
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

  const [handledInitialEntryId, setHandledInitialEntryId] = useState<number | null>(null);
  const [handledOpenNew, setHandledOpenNew] = useState(false);

  useEffect(() => {
    // Auto-open edit modal if initialEntryId is provided (only once)
    if (initialEntryId && entries.length > 0 && handledInitialEntryId !== initialEntryId) {
      const entry = entries.find(e => e.id === initialEntryId);
      if (entry) {
        setHandledInitialEntryId(initialEntryId);
        handleEdit(entry);
      }
    }
  }, [initialEntryId, entries, handledInitialEntryId]);

  useEffect(() => {
    // Auto-open new entry modal if initialOpenNew is provided (only once)
    if (initialOpenNew && !handledOpenNew && !isLoading) {
      setHandledOpenNew(true);
      handleAddNew();
    }
  }, [initialOpenNew, handledOpenNew, isLoading]);

  // ESC key to close modals
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (viewingInvoice) {
          setViewingInvoice(null);
        } else if (showModal) {
          handleCloseModal();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showModal, viewingInvoice]);

  // 'f' key to focus search field
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'f' && !showModal && !viewingInvoice && !isTypingInInput(event)) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showModal, viewingInvoice]);

  // CMD+N / CTRL+N to add new time entry
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'n' && getModifierKey(event) && !showModal && !viewingInvoice) {
        event.preventDefault();
        handleAddNew();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showModal, viewingInvoice]);

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
  }, [showModal, formData, editingEntry, inputMode]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [entriesData, projectsData, invoicesData] = await Promise.all([
        window.api.timeEntry.getAll(),
        window.api.project.getAll(),
        window.api.invoice.getAll(),
      ]);
      setEntries(entriesData);
      setProjects(projectsData);
      setInvoices(invoicesData);

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

  const getProjectStatus = (projectId: number): string => {
    const project = projects.find((p) => p.id === projectId);
    return project?.status || 'active';
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const loadInvoiceDetails = async (invoiceId: number) => {
    try {
      const data = await window.api.invoice.getWithEntries(invoiceId);
      setViewingInvoice(data);
    } catch (error) {
      console.error('Failed to load invoice details:', error);
      showNotification(t.notifications.loadFailed, 'error');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      draft: { label: t.invoices.statusDraft, color: 'var(--text-secondary)' },
      invoiced: { label: t.invoices.statusInvoiced, color: 'var(--accent-green)' },
      cancelled: { label: t.invoices.statusCancelled, color: 'var(--accent-red)' },
    };
    const info = statusMap[status];
    return (
      <span
        style={{
          padding: '4px 12px',
          borderRadius: '12px',
          backgroundColor: `${info.color}20`,
          color: info.color,
          fontSize: '0.85rem',
          fontWeight: '600',
        }}
      >
        {info.label}
      </span>
    );
  };

  // Clipboard utility functions
  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      // Modern Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        textArea.remove();
        return successful;
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  };

  const formatSingleEntry = (entry: TimeEntry): string => {
    const parts: string[] = [];
    parts.push(`Project: ${getProjectName(entry.project_id)}`);
    parts.push(`Date: ${formatDate(entry.date)}`);

    if (entry.start_time && entry.end_time) {
      parts.push(`Time: ${entry.start_time} - ${entry.end_time}`);
    }

    parts.push(`Duration: ${formatDuration(entry.duration_minutes)}`);

    if (entry.description) {
      parts.push(`Description: ${entry.description}`);
    }

    return parts.join('\n');
  };

  const formatMultipleEntries = (entries: TimeEntry[]): string => {
    // Group entries by project
    const groupedByProject = entries.reduce((acc, entry) => {
      const projectName = getProjectName(entry.project_id);
      if (!acc[projectName]) {
        acc[projectName] = [];
      }
      acc[projectName].push(entry);
      return acc;
    }, {} as Record<string, TimeEntry[]>);

    const parts: string[] = [];
    let grandTotal = 0;

    // Format each project section
    Object.entries(groupedByProject).forEach(([projectName, projectEntries]) => {
      parts.push(`\n${projectName}`);
      parts.push('='.repeat(projectName.length));

      let projectTotal = 0;
      projectEntries.forEach(entry => {
        const timeStr = entry.start_time && entry.end_time
          ? ` (${entry.start_time} - ${entry.end_time})`
          : '';
        const descStr = entry.description ? ` - ${entry.description}` : '';
        parts.push(`• ${formatDate(entry.date)}: ${formatDuration(entry.duration_minutes)}${timeStr}${descStr}`);
        projectTotal += entry.duration_minutes;
      });

      parts.push(`Subtotal: ${formatDuration(projectTotal)}`);
      grandTotal += projectTotal;
    });

    parts.push(`\nGrand Total: ${formatDuration(grandTotal)}`);

    return parts.join('\n');
  };

  const handleCopySingle = async (entry: TimeEntry) => {
    const text = formatSingleEntry(entry);
    const success = await copyToClipboard(text);
    if (success) {
      showNotification(t.notifications.copiedToClipboard || 'Copied to clipboard', 'success');
    } else {
      showNotification(t.notifications.copyFailed || 'Failed to copy', 'error');
    }
  };

  const handleCopySelected = async () => {
    const entriesToCopy = sortedEntries.filter(entry => selectedEntries.has(entry.id));
    if (entriesToCopy.length === 0) return;

    const text = formatMultipleEntries(entriesToCopy);
    const success = await copyToClipboard(text);
    if (success) {
      const message = t.notifications.copiedEntries
        ? t.notifications.copiedEntries.replace('{count}', entriesToCopy.length.toString())
        : `Copied ${entriesToCopy.length} entries`;
      showNotification(message, 'success');
      setSelectedEntries(new Set()); // Clear selection after copying
    } else {
      showNotification(t.notifications.copyFailed || 'Failed to copy', 'error');
    }
  };

  const handleCopyAllVisible = async () => {
    if (sortedEntries.length === 0) return;

    const text = formatMultipleEntries(sortedEntries);
    const success = await copyToClipboard(text);
    if (success) {
      const message = t.notifications.copiedEntries
        ? t.notifications.copiedEntries.replace('{count}', sortedEntries.length.toString())
        : `Copied ${sortedEntries.length} entries`;
      showNotification(message, 'success');
    } else {
      showNotification(t.notifications.copyFailed || 'Failed to copy', 'error');
    }
  };

  // Checkbox selection handlers
  const handleToggleEntry = (entryId: number) => {
    const newSelected = new Set(selectedEntries);
    if (newSelected.has(entryId)) {
      newSelected.delete(entryId);
    } else {
      newSelected.add(entryId);
    }
    setSelectedEntries(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedEntries.size === sortedEntries.length) {
      // Deselect all
      setSelectedEntries(new Set());
    } else {
      // Select all visible entries
      const allIds = new Set(sortedEntries.map(entry => entry.id));
      setSelectedEntries(allIds);
    }
  };

  const getFilteredEntries = (): TimeEntry[] => {
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

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter((entry) => {
        const projectName = getProjectName(entry.project_id);
        const haystack = [
          entry.date,
          entry.start_time || '',
          entry.end_time || '',
          entry.description || '',
          entry.billing_status || '',
          projectName,
        ].join(' ').toLowerCase();
        return haystack.includes(query);
      });
    }

    return filtered;
  };

  const filteredEntries = getFilteredEntries();
  const entriesWithProjectName: TimeEntryRow[] = filteredEntries.map((entry) => ({
    ...entry,
    project_name: getProjectName(entry.project_id),
  }));

  const getBillingStatusSortValue = (entry: TimeEntryRow): string => {
    const invoice = entry.invoice_id ? invoices.find(inv => inv.id === entry.invoice_id) : undefined;
    if (invoice?.status === 'cancelled') return t.invoices.statusCancelled;

    const statusMap: Record<string, string> = {
      unbilled: t.invoices.unbilled,
      in_draft: t.invoices.inDraft,
      invoiced: t.invoices.invoiced,
    };

    return statusMap[entry.billing_status || 'unbilled'];
  };

  const getSortValue = (entry: TimeEntryRow, key: keyof TimeEntryRow) => {
    if (key === 'date') {
      return entry.start_time ? `${entry.date} ${entry.start_time}` : entry.date;
    }
    if (key === 'billing_status') {
      return getBillingStatusSortValue(entry);
    }

    return entry[key];
  };

  const { sortedItems: sortedEntries, sortConfig, handleSort } = useSortableData(
    entriesWithProjectName,
    { key: 'date', direction: 'desc' },
    getSortValue
  );

  const entryColumns: SortableColumnConfig<TimeEntryRow>[] = [
    {
      key: 'id',
      label: (
        <input
          type="checkbox"
          checked={selectedEntries.size === sortedEntries.length && sortedEntries.length > 0}
          onChange={handleSelectAll}
          title="Select all"
        />
      ),
      sortable: false,
      headerStyle: { width: '40px', textAlign: 'center' },
    },
    { key: 'date', label: t.common.date },
    { key: 'project_name', label: t.common.project },
    { key: 'start_time', label: t.projects.start, sortable: false },
    { key: 'end_time', label: t.projects.end, sortable: false },
    { key: 'duration_minutes', label: t.common.duration },
    { key: 'description', label: t.common.description, sortable: false },
    { key: 'billing_status', label: t.invoices.billingStatus },
    { key: 'invoice_id', label: t.common.actions, sortable: false },
  ];

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <h2>
            {projectFilter ? `${t.timeEntries.title}: ${getFilteredProjectName()}` : t.timeEntries.allEntries}
          </h2>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <input
                ref={searchInputRef}
                type="text"
                id="filter-search"
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
              {t.timeEntries.addEntry}
            </button>
          </div>
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
              <LocalizedDateInput
                id="filter-date-from"
                value={dateFrom}
                onChange={setDateFrom}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="filter-date-to">{t.timeEntries.to}</label>
              <LocalizedDateInput
                id="filter-date-to"
                value={dateTo}
                onChange={setDateTo}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            {(projectFilter || dateFrom || dateTo || searchQuery) && (
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setProjectFilter(undefined);
                  setDateFrom('');
                  setDateTo('');
                  setSearchQuery('');
                }}
              >
                {t.common.clearFilter}
              </button>
            )}
            {sortedEntries.length > 0 && (
              <button
                className="btn btn-primary"
                onClick={handleCopyAllVisible}
                title={`Copy all ${sortedEntries.length} visible entries`}
              >
                <Copy size={16} strokeWidth={1.75} /> Copy All Visible ({sortedEntries.length})
              </button>
            )}
            {selectedEntries.size > 0 && (
              <button
                className="btn btn-success"
                onClick={handleCopySelected}
                title={`Copy ${selectedEntries.size} selected entries`}
              >
                <Copy size={16} strokeWidth={1.75} /> Copy Selected ({selectedEntries.size})
              </button>
            )}
          </div>
        </div>

        {sortedEntries.length === 0 ? (
          <div className="empty-state">
            <h3>
              {searchQuery.trim() ? t.search.noResults : (projectFilter ? t.timeEntries.noEntriesForProject : t.timeEntries.noEntries)}
            </h3>
            {!searchQuery.trim() && <p>{t.timeEntries.createFirst}</p>}
            <button className="btn btn-primary" onClick={handleAddNew}>
              {t.timeEntries.createEntry}
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <SortableHeader
                columns={entryColumns}
                sortConfig={sortConfig}
                onSort={handleSort}
              />
              <tbody>
                {sortedEntries.map((entry) => {
                  const getBillingStatusBadge = (status?: string) => {
                    // Check if the associated invoice is cancelled
                    const invoice = entry.invoice_id ? invoices.find(inv => inv.id === entry.invoice_id) : undefined;
                    const isInvoiceCancelled = invoice?.status === 'cancelled';

                    const statusMap: Record<string, { label: string; color: string }> = {
                      unbilled: { label: t.invoices.unbilled, color: 'var(--text-secondary)' },
                      in_draft: { label: t.invoices.inDraft, color: 'var(--accent-blue)' },
                      invoiced: { label: t.invoices.invoiced, color: 'var(--accent-green)' },
                    };
                    const info = statusMap[status || 'unbilled'];

                    // Clickable if invoice exists (including cancelled invoices)
                    const isClickable = !!entry.invoice_id;

                    // Show different styling for cancelled invoices
                    const displayColor = isInvoiceCancelled ? 'var(--accent-red)' : info.color;
                    const displayLabel = isInvoiceCancelled ? t.invoices.statusCancelled : info.label;

                    return (
                      <span
                        style={{
                          padding: '4px 8px',
                          borderRadius: '8px',
                          backgroundColor: `${displayColor}20`,
                          color: displayColor,
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          whiteSpace: 'nowrap',
                          cursor: isClickable ? 'pointer' : 'default',
                          opacity: isInvoiceCancelled ? 0.7 : 1,
                          textDecoration: isInvoiceCancelled ? 'line-through' : 'none',
                        }}
                        onClick={isClickable ? () => loadInvoiceDetails(entry.invoice_id!) : undefined}
                        title={isClickable ? (isInvoiceCancelled ? 'Click to view cancelled invoice' : 'Click to view invoice') : undefined}
                      >
                        {displayLabel}
                      </span>
                    );
                  };

                  return (
                    <tr
                      key={entry.id}
                      className={selectedEntries.has(entry.id) ? 'selected-row' : ''}
                      onDoubleClick={() => handleEdit(entry)}
                    >
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selectedEntries.has(entry.id)}
                          onChange={() => handleToggleEntry(entry.id)}
                        />
                      </td>
                      <td>{formatDate(entry.date)}</td>
                      <td>
                        {entry.project_name}
                        {' '}
                        <span className={`status-badge-small status-${getProjectStatus(entry.project_id)}`}>
                          {t.projects.status[getProjectStatus(entry.project_id) as 'active' | 'completed' | 'paused']}
                        </span>
                      </td>
                      <td>{entry.start_time || '-'}</td>
                      <td>{entry.end_time || '-'}</td>
                      <td>{formatDuration(entry.duration_minutes)}</td>
                      <td>{entry.description || '-'}</td>
                      <td>{getBillingStatusBadge(entry.billing_status)}</td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="btn btn-icon copy-btn"
                            onClick={() => handleCopySingle(entry)}
                            title="Copy entry"
                          >
                            <Copy size={16} strokeWidth={1.75} />
                          </button>
                          <button className="btn btn-secondary" onClick={() => handleEdit(entry)}>
                            {t.common.edit}
                          </button>
                          <button className="btn btn-danger" onClick={() => handleDelete(entry.id)}>
                            {t.common.delete}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
                <LocalizedDateInput
                  id="date"
                  value={formData.date}
                  onChange={(value) => setFormData({ ...formData, date: value })}
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
                  <label>{t.common.duration} {t.timeEntries.required}</label>
                  <DurationPicker
                    value={formData.duration_minutes}
                    onChange={(minutes) =>
                      setFormData({
                        ...formData,
                        duration_minutes: minutes,
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

      {/* Invoice Details Modal */}
      {viewingInvoice && (
        <div className="modal-overlay" onClick={() => setViewingInvoice(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ margin: 0 }}>{viewingInvoice.invoice_number}</h2>
                <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                  {formatDate(viewingInvoice.invoice_date)}
                </p>
              </div>
              {getStatusBadge(viewingInvoice.status)}
            </div>

            {/* Summary */}
            <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '4px' }}>
                    {t.invoices.totalAmount}
                  </p>
                  <p style={{ fontSize: '1.5rem', fontWeight: '600', margin: 0 }}>
                    {formatCurrency(viewingInvoice.total_amount)}
                  </p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '4px' }}>
                    {t.invoices.totalHours}
                  </p>
                  <p style={{ fontSize: '1.5rem', fontWeight: '600', margin: 0 }}>
                    {formatDuration(viewingInvoice.entries.reduce((sum: number, e: any) => sum + e.duration_minutes, 0))}
                  </p>
                </div>
              </div>

              {viewingInvoice.notes && (
                <div style={{ marginTop: '16px' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '4px' }}>
                    {t.invoices.notes}
                  </p>
                  <p style={{ margin: 0 }}>{viewingInvoice.notes}</p>
                </div>
              )}

              {viewingInvoice.cancellation_reason && (
                <div style={{ marginTop: '16px' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '4px' }}>
                    {t.invoices.cancellationReason}
                  </p>
                  <p style={{ margin: 0, color: 'var(--accent-red)' }}>{viewingInvoice.cancellation_reason}</p>
                </div>
              )}
            </div>

            {/* Time Entries */}
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ margin: '0 0 16px 0' }}>{t.invoices.invoiceEntries} ({viewingInvoice.entries.length})</h3>
            </div>

            {viewingInvoice.entries.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <p>{t.invoices.noEntriesInInvoice}</p>
              </div>
            ) : (
              <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>{t.common.date}</th>
                      <th>{t.common.project}</th>
                      <th>{t.common.description}</th>
                      <th>{t.common.duration}</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingInvoice.entries.map((entry: any) => (
                      <tr key={entry.id}>
                        <td>{formatDate(entry.date)}</td>
                        <td>{entry.project_name}</td>
                        <td>{entry.description || '-'}</td>
                        <td>{formatDuration(entry.duration_minutes)}</td>
                        <td>{formatCurrency((entry.duration_minutes / 60) * (entry.hourly_rate || 0))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer Actions */}
            <div className="form-actions" style={{ marginTop: '20px' }}>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setViewingInvoice(null);
                  navigateToPage('invoices', { invoiceId: viewingInvoice.id });
                }}
              >
                {t.invoices.viewDetails}
              </button>
              <button className="btn btn-secondary" onClick={() => setViewingInvoice(null)}>
                {t.common.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeEntries;
