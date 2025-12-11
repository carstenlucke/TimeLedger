import React, { useState, useEffect } from 'react';
import { useNotification } from '../context/NotificationContext';
import { useI18n } from '../context/I18nContext';
import type { Invoice, InvoiceWithEntries } from '../../shared/types';

interface InvoicesProps {
  initialInvoiceId?: number;
}

export const Invoices: React.FC<InvoicesProps> = ({ initialInvoiceId }) => {
  const { showNotification, showConfirmation } = useNotification();
  const { t, formatCurrency } = useI18n();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showAddEntriesModal, setShowAddEntriesModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithEntries | null>(null);
  const [unbilledEntries, setUnbilledEntries] = useState<any[]>([]);
  const [selectedEntryIds, setSelectedEntryIds] = useState<number[]>([]);
  const [cancellationReason, setCancellationReason] = useState('');
  const [isEditingFields, setIsEditingFields] = useState(false);

  const [formData, setFormData] = useState({
    invoice_number: '',
    invoice_date: new Date().toISOString().split('T')[0],
    notes: '',
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

  const loadInvoiceDetails = async (id: number) => {
    try {
      const data = await window.api.invoice.getWithEntries(id);
      setSelectedInvoice(data);
      setFormData({
        invoice_number: data.invoice_number,
        invoice_date: data.invoice_date,
        notes: data.notes || '',
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
    });
    setIsEditingFields(true);
    setShowInvoiceModal(true);
  };

  const handleSaveFields = async () => {
    try {
      if (selectedInvoice) {
        await window.api.invoice.update(selectedInvoice.id, formData);
        showNotification(t.notifications.invoiceUpdated, 'success');
        await loadInvoiceDetails(selectedInvoice.id);
        loadInvoices();
      } else {
        const newInvoice = await window.api.invoice.create({
          ...formData,
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
        <button className="btn btn-primary" onClick={handleCreate}>
          {t.invoices.addInvoice}
        </button>
      </div>

      {invoices.length === 0 ? (
        <div className="empty-state">
          <h2>{t.invoices.noInvoices}</h2>
          <p>{t.invoices.createFirst}</p>
        </div>
      ) : (
        <div className="card">
          <h2>{t.invoices.allInvoices}</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>{t.invoices.invoiceNumber}</th>
                  <th>{t.invoices.invoiceDate}</th>
                  <th>{t.invoices.status}</th>
                  <th>{t.invoices.totalAmount}</th>
                  <th>{t.common.actions}</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>
                      <button
                        className="link-button"
                        onClick={() => loadInvoiceDetails(invoice.id)}
                        style={{ color: 'var(--accent-blue)', cursor: 'pointer' }}
                      >
                        {invoice.invoice_number}
                      </button>
                    </td>
                    <td>{new Date(invoice.invoice_date).toLocaleDateString()}</td>
                    <td>{getStatusBadge(invoice.status)}</td>
                    <td>{formatCurrency(invoice.total_amount)}</td>
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
                    <input
                      type="date"
                      value={formData.invoice_date}
                      onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                      style={{ marginTop: '8px' }}
                    />
                  </div>
                ) : (
                  <>
                    <h2 style={{ margin: 0 }}>{selectedInvoice.invoice_number}</h2>
                    <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                      {new Date(selectedInvoice.invoice_date).toLocaleDateString()}
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
                            <td>{new Date(entry.date).toLocaleDateString()}</td>
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
        <div className="modal-overlay" onClick={() => setShowAddEntriesModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px' }}>
            <h2>{t.invoices.addTimeEntries}</h2>
            <p style={{ color: 'var(--text-secondary)' }}>{t.invoices.selectEntries}</p>

            {unbilledEntries.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <p>{t.invoices.noUnbilledEntries}</p>
              </div>
            ) : (
              <div className="table-container" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>
                        <input
                          type="checkbox"
                          checked={selectedEntryIds.length === unbilledEntries.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedEntryIds(unbilledEntries.map((entry) => entry.id));
                            } else {
                              setSelectedEntryIds([]);
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
                    {unbilledEntries.map((entry) => (
                      <tr key={entry.id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedEntryIds.includes(entry.id)}
                            onChange={() => toggleEntrySelection(entry.id)}
                          />
                        </td>
                        <td>{new Date(entry.date).toLocaleDateString()}</td>
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

            <div className="form-actions">
              <button className="btn btn-secondary" onClick={() => setShowAddEntriesModal(false)}>
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
