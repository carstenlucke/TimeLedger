import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNotification } from '../context/NotificationContext';
import { useI18n } from '../context/I18nContext';
import type { Invoice, InvoiceWithEntries, InvoiceType } from '../../shared/types';
import { isTypingInInput, getModifierKey } from '../contexts/KeyboardShortcutContext';
import { LocalizedDateInput } from '../components/LocalizedDateInput';
import { useSortableData, SortableHeader, SortableColumnConfig } from '../components/SortableTable';

interface InvoicesProps {
  initialInvoiceId?: number;
}

export const Invoices: React.FC<InvoicesProps> = ({ initialInvoiceId }) => {
  const { showNotification, showConfirmation } = useNotification();
  const { t, formatCurrency, formatDate } = useI18n();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showAddEntriesModal, setShowAddEntriesModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithEntries | null>(null);
  const [unbilledEntries, setUnbilledEntries] = useState<any[]>([]);
  const [selectedEntryIds, setSelectedEntryIds] = useState<number[]>([]);
  const [entryFilterProject, setEntryFilterProject] = useState<string>('');
  const [entryFilterDateFrom, setEntryFilterDateFrom] = useState<string>('');
  const [entryFilterDateTo, setEntryFilterDateTo] = useState<string>('');
  const [cancellationReason, setCancellationReason] = useState('');
  const [isEditingFields, setIsEditingFields] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    invoice_number: '',
    invoice_date: new Date().toISOString().split('T')[0],
    notes: '',
    type: 'internal' as InvoiceType,
    external_invoice_number: '',
    net_amount: '',
    gross_amount: '',
  });

  useEffect(() => {
    loadInvoices();
  }, []);

  useEffect(() => {
    // Auto-open invoice details modal if initialInvoiceId is provided
    if (initialInvoiceId && invoices.length > 0) {
      const invoice = invoices.find(inv => inv.id === initialInvoiceId);
      if (invoice) {
        loadInvoiceDetails(invoice.id);
      }
    }
  }, [initialInvoiceId, invoices]);

  // ESC key to close modals
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showCancelModal) {
          setShowCancelModal(false);
          setCancellationReason('');
        } else if (showAddEntriesModal) {
          setShowAddEntriesModal(false);
          setSelectedEntryIds([]);
          resetEntryFilters();
        } else if (showInvoiceModal) {
          setShowInvoiceModal(false);
          setSelectedInvoice(null);
          setIsEditingFields(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showInvoiceModal, showAddEntriesModal, showCancelModal]);

  // 'f' key to focus search field
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'f' && !showInvoiceModal && !showAddEntriesModal && !showCancelModal && !isTypingInInput(event)) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showInvoiceModal, showAddEntriesModal, showCancelModal]);

  // CMD+N / CTRL+N to create new invoice
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'n' && getModifierKey(event) && !showInvoiceModal && !showAddEntriesModal && !showCancelModal) {
        event.preventDefault();
        handleCreate();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showInvoiceModal, showAddEntriesModal, showCancelModal]);

  // CMD+ENTER / CTRL+ENTER to submit form in modal
  useEffect(() => {
    if (!showInvoiceModal || !isEditingFields) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && getModifierKey(event)) {
        event.preventDefault();
        handleSaveFields();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showInvoiceModal, selectedInvoice, formData, isEditingFields]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await window.api.invoice.getAll();
      setInvoices(data);
    } catch (error) {
      console.error('Failed to load invoices:', error);
      showNotification(t.notifications.loadFailed, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadUnbilledEntries = async () => {
    try {
      const data = await window.api.invoice.getUnbilledEntries();
      setUnbilledEntries(data);
    } catch (error) {
      console.error('Failed to load unbilled entries:', error);
      showNotification(t.notifications.loadFailed, 'error');
    }
  };

  const uniqueProjects = useMemo(() => {
    const seen = new Set<string>();
    for (const entry of unbilledEntries) {
      if (entry.project_name) {
        seen.add(entry.project_name);
      }
    }
    return Array.from(seen).sort();
  }, [unbilledEntries]);

  const filteredUnbilledEntries = useMemo(() => {
    let filtered = unbilledEntries;
    if (entryFilterProject) {
      filtered = filtered.filter(entry => entry.project_name === entryFilterProject);
    }
    if (entryFilterDateFrom) {
      filtered = filtered.filter(entry => entry.date >= entryFilterDateFrom);
    }
    if (entryFilterDateTo) {
      filtered = filtered.filter(entry => entry.date <= entryFilterDateTo);
    }
    return filtered;
  }, [unbilledEntries, entryFilterProject, entryFilterDateFrom, entryFilterDateTo]);

  const selectedEntryIdsSet = useMemo(() => new Set(selectedEntryIds), [selectedEntryIds]);

  const resetEntryFilters = () => {
    setEntryFilterProject('');
    setEntryFilterDateFrom('');
    setEntryFilterDateTo('');
  };

  const loadInvoiceDetails = async (id: number) => {
    try {
      const data = await window.api.invoice.getWithEntries(id);
      setSelectedInvoice(data);
      setFormData({
        invoice_number: data.invoice_number,
        invoice_date: data.invoice_date,
        notes: data.notes || '',
        type: data.type || 'internal',
        external_invoice_number: data.external_invoice_number || '',
        net_amount: data.net_amount != null ? String(data.net_amount) : '',
        gross_amount: data.gross_amount != null ? String(data.gross_amount) : '',
      });
      setIsEditingFields(false);
      setShowInvoiceModal(true);
    } catch (error) {
      console.error('Failed to load invoice details:', error);
      showNotification(t.notifications.loadFailed, 'error');
    }
  };

  const handleCreate = async () => {
    const generatedNumber = await window.api.invoice.generateNumber();
    setSelectedInvoice(null);
    setFormData({
      invoice_number: generatedNumber,
      invoice_date: new Date().toISOString().split('T')[0],
      notes: '',
      type: 'internal',
      external_invoice_number: '',
      net_amount: '',
      gross_amount: '',
    });
    setIsEditingFields(true);
    setShowInvoiceModal(true);
  };

  const handleSaveFields = async () => {
    try {
      const invoiceData = {
        invoice_number: formData.invoice_number,
        invoice_date: formData.invoice_date,
        notes: formData.notes,
        type: formData.type,
        external_invoice_number: formData.type === 'external' ? formData.external_invoice_number : undefined,
        net_amount: formData.type === 'external' && formData.net_amount ? parseFloat(formData.net_amount) : undefined,
        gross_amount: formData.type === 'external' && formData.gross_amount ? parseFloat(formData.gross_amount) : undefined,
      };
      if (selectedInvoice) {
        await window.api.invoice.update(selectedInvoice.id, invoiceData);
        showNotification(t.notifications.invoiceUpdated, 'success');
        await loadInvoiceDetails(selectedInvoice.id);
        loadInvoices();
      } else {
        const newInvoice = await window.api.invoice.create({
          ...invoiceData,
          status: 'draft',
          total_amount: 0,
        });
        showNotification(t.notifications.invoiceCreated, 'success');
        await loadInvoiceDetails(newInvoice.id);
        loadInvoices();
      }
      setIsEditingFields(false);
    } catch (error) {
      console.error('Failed to save invoice:', error);
      showNotification(t.notifications.saveFailed, 'error');
    }
  };

  const handleCloseInvoiceModal = () => {
    setShowInvoiceModal(false);
    setSelectedInvoice(null);
    setIsEditingFields(false);
  };

  const handleDelete = async (invoice: Invoice) => {
    if (invoice.status === 'invoiced') {
      showNotification('Invoiced invoices cannot be deleted', 'warning');
      return;
    }

    const message = invoice.status === 'cancelled'
      ? t.invoices.deleteCancelledConfirm
      : t.invoices.deleteConfirm;

    showConfirmation({
      message,
      confirmText: t.common.delete,
      onConfirm: async () => {
        try {
          await window.api.invoice.delete(invoice.id);
          showNotification(t.notifications.invoiceDeleted, 'success');
          loadInvoices();
        } catch (error) {
          console.error('Failed to delete invoice:', error);
          showNotification(t.notifications.deleteFailed, 'error');
        }
      },
    });
  };

  const handleFinalize = async (invoice: Invoice) => {
    showConfirmation({
      message: t.invoices.finalizeConfirm,
      confirmText: t.invoices.finalize,
      onConfirm: async () => {
        try {
          await window.api.invoice.finalize(invoice.id);
          showNotification(t.notifications.invoiceFinalized, 'success');
          loadInvoices();
          if (selectedInvoice?.id === invoice.id) {
            handleCloseInvoiceModal();
          }
        } catch (error) {
          console.error('Failed to finalize invoice:', error);
          showNotification(t.notifications.saveFailed, 'error');
        }
      },
    });
  };

  const handleCancelInvoice = async () => {
    if (!selectedInvoice || !cancellationReason.trim()) {
      showNotification('Please provide a cancellation reason', 'warning');
      return;
    }

    try {
      await window.api.invoice.cancel(selectedInvoice.id, cancellationReason);
      showNotification(t.notifications.invoiceCancelled, 'success');
      setShowCancelModal(false);
      setCancellationReason('');
      loadInvoices();
      handleCloseInvoiceModal();
    } catch (error) {
      console.error('Failed to cancel invoice:', error);
      showNotification(t.notifications.saveFailed, 'error');
    }
  };

  const handleAddEntries = async (invoiceId: number) => {
    setSelectedInvoice(prev => prev ? { ...prev, id: invoiceId } : null);
    setSelectedEntryIds([]);
    await loadUnbilledEntries();
    setShowAddEntriesModal(true);
  };

  const handleConfirmAddEntries = async () => {
    if (!selectedInvoice || selectedEntryIds.length === 0) return;

    try {
      await window.api.invoice.addEntries(selectedInvoice.id, selectedEntryIds);
      showNotification(t.notifications.entriesAdded, 'success');
      setShowAddEntriesModal(false);
      setSelectedEntryIds([]);
      resetEntryFilters();
      await loadInvoiceDetails(selectedInvoice.id);
      loadInvoices();
    } catch (error) {
      console.error('Failed to add entries:', error);
      showNotification(t.notifications.saveFailed, 'error');
    }
  };

  const handleRemoveEntries = async (entryIds: number[]) => {
    showConfirmation({
      message: `Remove ${entryIds.length} ${entryIds.length === 1 ? 'entry' : 'entries'} from this invoice?`,
      confirmText: t.invoices.removeEntries,
      onConfirm: async () => {
        try {
          await window.api.invoice.removeEntries(entryIds);
          showNotification(t.notifications.entriesRemoved, 'success');
          if (selectedInvoice) {
            await loadInvoiceDetails(selectedInvoice.id);
          }
          loadInvoices();
        } catch (error) {
          console.error('Failed to remove entries:', error);
          showNotification(t.notifications.saveFailed, 'error');
        }
      },
    });
  };

  const toggleEntrySelection = (entryId: number) => {
    setSelectedEntryIds(prev =>
      prev.includes(entryId)
        ? prev.filter(id => id !== entryId)
        : [...prev, entryId]
    );
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      draft: 'var(--text-secondary)',
      invoiced: 'var(--accent-green)',
      cancelled: 'var(--accent-red)',
    };

    const statusLabels: Record<string, string> = {
      draft: t.invoices.statusDraft,
      invoiced: t.invoices.statusInvoiced,
      cancelled: t.invoices.statusCancelled,
    };

    return (
      <span
        style={{
          padding: '4px 12px',
          borderRadius: '12px',
          backgroundColor: `${statusColors[status]}20`,
          color: statusColors[status],
          fontSize: '0.85rem',
          fontWeight: '500',
        }}
      >
        {statusLabels[status]}
      </span>
    );
  };

  const filteredInvoices = invoices.filter((invoice) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.trim().toLowerCase();
    const haystack = [
      invoice.invoice_number,
      invoice.invoice_date,
      invoice.status,
      invoice.notes || '',
      String(invoice.total_amount),
      invoice.external_invoice_number || '',
    ].join(' ').toLowerCase();
    return haystack.includes(query);
  });

  const invoiceColumns: SortableColumnConfig<Invoice>[] = [
    { key: 'invoice_number', label: t.invoices.invoiceNumber },
    { key: 'invoice_date', label: t.invoices.invoiceDate },
    { key: 'status', label: t.invoices.status },
    { key: 'total_amount', label: t.invoices.totalAmount },
  ];

  const { sortedItems: sortedInvoices, sortConfig, handleSort } = useSortableData(
    filteredInvoices,
    { key: 'invoice_date', direction: 'desc' }
  );

  if (loading) {
    return <div className="page">{t.common.loading}</div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>{t.invoices.title}</h1>
          <p className="subtitle">{t.invoices.subtitle}</p>
        </div>
      </div>

      {invoices.length === 0 ? (
        <div className="empty-state">
          <h2>{t.invoices.noInvoices}</h2>
          <p>{t.invoices.createFirst}</p>
          <button className="btn btn-primary" onClick={handleCreate}>
            {t.invoices.addInvoice}
          </button>
        </div>
      ) : (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <h2>{t.invoices.allInvoices}</h2>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <input
                  ref={searchInputRef}
                  id="invoice-search"
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
              <button className="btn btn-primary" onClick={handleCreate}>
                {t.invoices.addInvoice}
              </button>
            </div>
          </div>
          <div className="table-container">
            {filteredInvoices.length === 0 ? (
              <div className="empty-state">
                <h2>{t.search.noResults}</h2>
              </div>
            ) : (
              <table>
                <SortableHeader
                  columns={[...invoiceColumns, { key: 'id' as keyof Invoice, label: t.common.actions, sortable: false }]}
                  sortConfig={sortConfig}
                  onSort={handleSort}
                />
                <tbody>
                  {sortedInvoices.map((invoice) => (
                    <tr key={invoice.id} onDoubleClick={() => loadInvoiceDetails(invoice.id)}>
                      <td>
                        <span
                          onClick={() => loadInvoiceDetails(invoice.id)}
                          style={{
                            cursor: 'pointer',
                            color: 'var(--accent-blue)',
                            fontWeight: '500',
                            transition: 'opacity 0.2s',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                        >
                          {invoice.invoice_number}
                        </span>
                        {invoice.type === 'external' && (
                          <span style={{
                            marginLeft: '6px',
                            padding: '1px 6px',
                            borderRadius: '6px',
                            backgroundColor: 'var(--accent-blue)20',
                            color: 'var(--accent-blue)',
                            fontSize: '0.7rem',
                            fontWeight: '500',
                          }}>
                            {t.invoices.typeExternal}
                          </span>
                        )}
                      </td>
                      <td>{formatDate(invoice.invoice_date)}</td>
                      <td>{getStatusBadge(invoice.status)}</td>
                      <td>
                        {invoice.type === 'external' && invoice.net_amount != null
                          ? formatCurrency(invoice.net_amount)
                          : formatCurrency(invoice.total_amount)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {invoice.status === 'draft' && (
                            <>
                              <button
                                className="btn btn-success btn-sm"
                                onClick={() => handleFinalize(invoice)}
                              >
                                {t.invoices.finalize}
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleDelete(invoice)}
                              >
                                {t.common.delete}
                              </button>
                            </>
                          )}
                          {invoice.status === 'cancelled' && (
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDelete(invoice)}
                            >
                              {t.common.delete}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Combined Invoice Modal */}
      {showInvoiceModal && (
        <div className="modal-overlay" onClick={handleCloseInvoiceModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            {/* Header with invoice number/date and edit button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ flex: 1 }}>
                {isEditingFields || !selectedInvoice ? (
                  <div className="form-group" style={{ marginBottom: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="text"
                        value={formData.invoice_number}
                        onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                        placeholder={t.invoices.invoiceNumber}
                        style={{ fontSize: '1.5rem', fontWeight: 'bold', flex: 1 }}
                      />
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={async () => {
                          const num = await window.api.invoice.generateNumber();
                          setFormData({ ...formData, invoice_number: num });
                        }}
                      >
                        {t.invoices.generateNumber}
                      </button>
                    </div>
                    <LocalizedDateInput
                      value={formData.invoice_date}
                      onChange={(value) => setFormData({ ...formData, invoice_date: value })}
                      style={{ marginTop: '8px' }}
                    />
                    {/* External Invoice Toggle */}
                    <div style={{ marginTop: '12px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                        <input
                          type="checkbox"
                          checked={formData.type === 'external'}
                          onChange={(e) => setFormData({ ...formData, type: e.target.checked ? 'external' : 'internal' })}
                        />
                        {t.invoices.externalInvoice}
                      </label>
                    </div>
                    {/* External Invoice Fields */}
                    {formData.type === 'external' && (
                      <div style={{ marginTop: '12px', padding: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                        <div className="form-group" style={{ marginBottom: '8px' }}>
                          <label>{t.invoices.externalInvoiceNumber}</label>
                          <input
                            type="text"
                            value={formData.external_invoice_number}
                            onChange={(e) => setFormData({ ...formData, external_invoice_number: e.target.value })}
                            placeholder={t.invoices.externalInvoiceNumber}
                          />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>{t.invoices.netAmount}</label>
                            <input
                              type="number"
                              step="0.01"
                              value={formData.net_amount}
                              onChange={(e) => setFormData({ ...formData, net_amount: e.target.value })}
                              placeholder="0.00"
                            />
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>{t.invoices.grossAmount}</label>
                            <input
                              type="number"
                              step="0.01"
                              value={formData.gross_amount}
                              onChange={(e) => setFormData({ ...formData, gross_amount: e.target.value })}
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <h2 style={{ margin: 0 }}>
                      {selectedInvoice.invoice_number}
                      {selectedInvoice.type === 'external' && (
                        <span style={{
                          marginLeft: '8px',
                          padding: '2px 8px',
                          borderRadius: '8px',
                          backgroundColor: 'var(--accent-blue)20',
                          color: 'var(--accent-blue)',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          verticalAlign: 'middle',
                        }}>
                          {t.invoices.typeExternal}
                        </span>
                      )}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                      {formatDate(selectedInvoice.invoice_date)}
                      {selectedInvoice.type === 'external' && selectedInvoice.external_invoice_number && (
                        <span> · {t.invoices.externalInvoiceNumber}: {selectedInvoice.external_invoice_number}</span>
                      )}
                    </p>
                  </>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {selectedInvoice && getStatusBadge(selectedInvoice.status)}
                {selectedInvoice && selectedInvoice.status === 'draft' && !isEditingFields && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setIsEditingFields(true)}
                  >
                    {t.common.edit}
                  </button>
                )}
                {isEditingFields && (
                  <>
                    <button className="btn btn-secondary btn-sm" onClick={() => {
                      if (selectedInvoice) {
                        setFormData({
                          invoice_number: selectedInvoice.invoice_number,
                          invoice_date: selectedInvoice.invoice_date,
                          notes: selectedInvoice.notes || '',
                          type: selectedInvoice.type || 'internal',
                          external_invoice_number: selectedInvoice.external_invoice_number || '',
                          net_amount: selectedInvoice.net_amount != null ? String(selectedInvoice.net_amount) : '',
                          gross_amount: selectedInvoice.gross_amount != null ? String(selectedInvoice.gross_amount) : '',
                        });
                        setIsEditingFields(false);
                      } else {
                        handleCloseInvoiceModal();
                      }
                    }}>
                      {t.common.cancel}
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={handleSaveFields}>
                      {t.common.save}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Summary and Notes Section */}
            {selectedInvoice && (
              <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                {selectedInvoice.type === 'external' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '4px' }}>
                        {t.invoices.netAmount}
                      </p>
                      <p style={{ fontSize: '1.5rem', fontWeight: '600', margin: 0 }}>
                        {selectedInvoice.net_amount != null ? formatCurrency(selectedInvoice.net_amount) : '–'}
                      </p>
                    </div>
                    <div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '4px' }}>
                        {t.invoices.grossAmount}
                      </p>
                      <p style={{ fontSize: '1.5rem', fontWeight: '600', margin: 0 }}>
                        {selectedInvoice.gross_amount != null ? formatCurrency(selectedInvoice.gross_amount) : '–'}
                      </p>
                    </div>
                    <div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '4px' }}>
                        {t.invoices.linkedEntriesTotal}
                      </p>
                      <p style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
                        {formatCurrency(selectedInvoice.total_amount)}
                      </p>
                    </div>
                    <div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '4px' }}>
                        {t.invoices.unbilledDifference}
                      </p>
                      <p style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: selectedInvoice.net_amount != null && selectedInvoice.net_amount - selectedInvoice.total_amount !== 0 ? 'var(--accent-orange, #f59e0b)' : undefined }}>
                        {selectedInvoice.net_amount != null ? formatCurrency(selectedInvoice.net_amount - selectedInvoice.total_amount) : '–'}
                      </p>
                    </div>
                    <div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '4px' }}>
                        {t.invoices.totalHours}
                      </p>
                      <p style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
                        {formatDuration(selectedInvoice.entries.reduce((sum: number, e: any) => sum + e.duration_minutes, 0))}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '4px' }}>
                        {t.invoices.totalAmount}
                      </p>
                      <p style={{ fontSize: '1.5rem', fontWeight: '600', margin: 0 }}>
                        {formatCurrency(selectedInvoice.total_amount)}
                      </p>
                    </div>
                    <div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '4px' }}>
                        {t.invoices.totalHours}
                      </p>
                      <p style={{ fontSize: '1.5rem', fontWeight: '600', margin: 0 }}>
                        {formatDuration(selectedInvoice.entries.reduce((sum: number, e: any) => sum + e.duration_minutes, 0))}
                      </p>
                    </div>
                  </div>
                )}

                {/* Notes Section */}
                <div style={{ marginTop: '16px' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '4px' }}>
                    {t.invoices.notes}
                  </p>
                  {isEditingFields ? (
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      placeholder={t.invoices.notesPlaceholder}
                      style={{ width: '100%' }}
                    />
                  ) : (
                    <p style={{ margin: 0 }}>{selectedInvoice.notes || t.invoices.noNotesPlaceholder}</p>
                  )}
                </div>

                {selectedInvoice.cancellation_reason && (
                  <div style={{ marginTop: '16px' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '4px' }}>
                      {t.invoices.cancellationReason}
                    </p>
                    <p style={{ margin: 0, color: 'var(--accent-red)' }}>{selectedInvoice.cancellation_reason}</p>
                  </div>
                )}
              </div>
            )}

            {/* Notes Section for New Invoice */}
            {!selectedInvoice && (
              <div style={{ marginBottom: '20px' }}>
                <div className="form-group">
                  <label>{t.invoices.notes}</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={4}
                    placeholder={t.invoices.notesPlaceholder}
                  />
                </div>
              </div>
            )}

            {/* Time Entries Section - only show for existing invoices */}
            {selectedInvoice && (
              <>
                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0 }}>{t.invoices.invoiceEntries} ({selectedInvoice.entries.length})</h3>
                  {selectedInvoice.status === 'draft' && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleAddEntries(selectedInvoice.id)}
                    >
                      {t.invoices.addTimeEntries}
                    </button>
                  )}
                </div>

                {selectedInvoice.entries.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <p>{t.invoices.noEntriesInInvoice}</p>
                    {selectedInvoice.status === 'draft' && <p>{t.invoices.addEntriesToInvoice}</p>}
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
                          {selectedInvoice.status === 'draft' && <th>{t.common.actions}</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedInvoice.entries.map((entry: any) => (
                          <tr key={entry.id}>
                            <td>{formatDate(entry.date)}</td>
                            <td>{entry.project_name}</td>
                            <td>{entry.description || '-'}</td>
                            <td>{formatDuration(entry.duration_minutes)}</td>
                            <td>{formatCurrency((entry.duration_minutes / 60) * (entry.hourly_rate || 0))}</td>
                            {selectedInvoice.status === 'draft' && (
                              <td>
                                <button
                                  className="btn btn-danger btn-sm"
                                  onClick={() => handleRemoveEntries([entry.id])}
                                >
                                  Remove
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {/* Footer Actions */}
            <div className="form-actions" style={{ marginTop: '20px' }}>
              {selectedInvoice && selectedInvoice.status === 'draft' && (
                <button
                  className="btn btn-success"
                  onClick={() => handleFinalize(selectedInvoice)}
                >
                  {t.invoices.finalize}
                </button>
              )}
              {selectedInvoice && (selectedInvoice.status === 'invoiced' || selectedInvoice.status === 'draft') && (
                <button
                  className="btn btn-danger"
                  onClick={() => setShowCancelModal(true)}
                >
                  {t.invoices.cancelInvoice}
                </button>
              )}
              <button className="btn btn-secondary" onClick={handleCloseInvoiceModal}>
                {t.common.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Entries Modal */}
      {showAddEntriesModal && (
        <div className="modal-overlay" onClick={() => { setShowAddEntriesModal(false); resetEntryFilters(); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px' }}>
            <h2>{t.invoices.addTimeEntries}</h2>
            <p style={{ color: 'var(--text-secondary)' }}>{t.invoices.selectEntries}</p>

            {unbilledEntries.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <p>{t.invoices.noUnbilledEntries}</p>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '16px', padding: '16px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label htmlFor="entry-filter-project">{t.timeEntries.filterByProject}</label>
                      <select
                        id="entry-filter-project"
                        value={entryFilterProject}
                        onChange={(e) => setEntryFilterProject(e.target.value)}
                      >
                        <option value="">{t.invoices.allProjects}</option>
                        {uniqueProjects.map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label htmlFor="entry-filter-date-from">{t.timeEntries.from}</label>
                      <LocalizedDateInput
                        id="entry-filter-date-from"
                        value={entryFilterDateFrom}
                        onChange={setEntryFilterDateFrom}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label htmlFor="entry-filter-date-to">{t.timeEntries.to}</label>
                      <LocalizedDateInput
                        id="entry-filter-date-to"
                        value={entryFilterDateTo}
                        onChange={setEntryFilterDateTo}
                      />
                    </div>
                  </div>
                  {(entryFilterProject || entryFilterDateFrom || entryFilterDateTo) && (
                    <div style={{ marginTop: '12px' }}>
                      <button
                        className="btn btn-secondary"
                        onClick={resetEntryFilters}
                      >
                        {t.common.clearFilter}
                      </button>
                    </div>
                  )}
                </div>

                {filteredUnbilledEntries.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <p>{t.invoices.noMatchingEntries}</p>
                  </div>
                ) : (
                  <div className="table-container" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                    <table>
                      <thead>
                        <tr>
                          <th style={{ width: '40px' }}>
                            <input
                              type="checkbox"
                              checked={filteredUnbilledEntries.length > 0 && filteredUnbilledEntries.every(entry => selectedEntryIdsSet.has(entry.id))}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  const filteredIds = filteredUnbilledEntries.map((entry) => entry.id);
                                  setSelectedEntryIds(prev => [...new Set([...prev, ...filteredIds])]);
                                } else {
                                  const filteredIds = new Set(filteredUnbilledEntries.map((entry) => entry.id));
                                  setSelectedEntryIds(prev => prev.filter(id => !filteredIds.has(id)));
                                }
                              }}
                            />
                          </th>
                          <th>{t.common.date}</th>
                          <th>{t.common.project}</th>
                          <th>{t.common.description}</th>
                          <th>{t.common.duration}</th>
                          <th>Rate</th>
                          <th>Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUnbilledEntries.map((entry) => (
                          <tr key={entry.id}>
                            <td>
                              <input
                                type="checkbox"
                                checked={selectedEntryIdsSet.has(entry.id)}
                                onChange={() => toggleEntrySelection(entry.id)}
                              />
                            </td>
                            <td>{formatDate(entry.date)}</td>
                            <td>{entry.project_name}</td>
                            <td>{entry.description || '-'}</td>
                            <td>{formatDuration(entry.duration_minutes)}</td>
                            <td>{entry.hourly_rate ? formatCurrency(entry.hourly_rate) + '/hr' : '-'}</td>
                            <td>{formatCurrency((entry.duration_minutes / 60) * (entry.hourly_rate || 0))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            <div className="form-actions">
              <button className="btn btn-secondary" onClick={() => { setShowAddEntriesModal(false); resetEntryFilters(); }}>
                {t.common.cancel}
              </button>
              <button
                className="btn btn-primary"
                onClick={handleConfirmAddEntries}
                disabled={selectedEntryIds.length === 0}
              >
                {`Add ${selectedEntryIds.length} ${selectedEntryIds.length === 1 ? 'Entry' : 'Entries'}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Invoice Modal */}
      {showCancelModal && (
        <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{t.invoices.cancelInvoice}</h2>
            <div className="form-group">
              <label>
                {t.invoices.cancellationReason} {t.timeEntries.required}
              </label>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                rows={4}
                placeholder={t.invoices.reasonPlaceholder}
                required
              />
            </div>
            <div className="form-actions">
              <button className="btn btn-secondary" onClick={() => setShowCancelModal(false)}>
                {t.common.cancel}
              </button>
              <button className="btn btn-danger" onClick={handleCancelInvoice}>
                {t.invoices.cancelInvoice}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
