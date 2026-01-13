import React, { useState, useEffect, useRef } from 'react';
import type { Customer, CustomerInput } from '../../shared/types';
import { useNotification } from '../context/NotificationContext';
import { useI18n } from '../context/I18nContext';
import { isTypingInInput, getModifierKey } from '../contexts/KeyboardShortcutContext';
import { useSortableData, SortableHeader, SortableColumnConfig } from '../components/SortableTable';

const Customers: React.FC = () => {
  const { showNotification, showConfirmation } = useNotification();
  const { t } = useI18n();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<CustomerInput>({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  // ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showModal) {
        handleCloseModal();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showModal]);

  // 'f' key to focus search field
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'f' && !showModal && !isTypingInInput(event)) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showModal]);

  // CMD+N / CTRL+N to add new customer
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'n' && getModifierKey(event) && !showModal) {
        event.preventDefault();
        handleAddNew();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showModal]);

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
  }, [showModal, formData, editingCustomer]);

  const loadCustomers = async () => {
    try {
      setIsLoading(true);
      const data = await window.api.customer.getAll();
      setCustomers(data);
    } catch (error) {
      console.error('Failed to load customers:', error);
      showNotification(t.notifications.loadFailed + ': ' + (error as Error).message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showNotification(t.customers.customerName + ' is required', 'error');
      return;
    }

    try {
      if (editingCustomer) {
        await window.api.customer.update(editingCustomer.id, formData);
        showNotification(t.notifications.customerUpdated || 'Customer updated successfully', 'success');
      } else {
        await window.api.customer.create(formData);
        showNotification(t.notifications.customerCreated || 'Customer created successfully', 'success');
      }

      setShowModal(false);
      setEditingCustomer(null);
      setFormData({ name: '', email: '', phone: '', address: '', notes: '' });
      await loadCustomers();
    } catch (error) {
      console.error('Failed to save customer:', error);
      showNotification(t.notifications.saveFailed, 'error');
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      notes: customer.notes || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    showConfirmation({
      message: t.customers.deleteConfirm,
      confirmText: t.common.delete,
      onConfirm: async () => {
        try {
          await window.api.customer.delete(id);
          showNotification(t.notifications.customerDeleted || 'Customer deleted successfully', 'success');
          await loadCustomers();
        } catch (error) {
          console.error('Failed to delete customer:', error);
          showNotification(t.notifications.deleteFailed, 'error');
        }
      },
    });
  };

  const handleAddNew = () => {
    setEditingCustomer(null);
    setFormData({ name: '', email: '', phone: '', address: '', notes: '' });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCustomer(null);
    setFormData({ name: '', email: '', phone: '', address: '', notes: '' });
  };

  const normalizeSearchValue = (value: string): string => value.toLowerCase();

  const filteredCustomers = customers.filter((customer) => {
    if (!searchQuery.trim()) return true;
    const query = normalizeSearchValue(searchQuery.trim());
    const haystack = [
      customer.name,
      customer.email || '',
      customer.phone || '',
    ].join(' ').toLowerCase();
    return haystack.includes(query);
  });

  const customerColumns: SortableColumnConfig<Customer>[] = [
    { key: 'name', label: t.customers.customerName },
    { key: 'email', label: t.customers.email },
    { key: 'phone', label: t.customers.phone },
  ];

  const { sortedItems: sortedCustomers, sortConfig, handleSort } = useSortableData(
    filteredCustomers,
    { key: 'name', direction: 'asc' }
  );

  if (isLoading) {
    return <div className="loading">{t.common.loading}</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>{t.customers.title}</h1>
        <p>{t.customers.subtitle}</p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <h2>{t.customers.allCustomers}</h2>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <input
                ref={searchInputRef}
                id="customer-search"
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
              {t.customers.addCustomer}
            </button>
          </div>
        </div>

        {customers.length === 0 ? (
          <div className="empty-state">
            <h3>{t.customers.noCustomers}</h3>
            <p>{t.customers.createFirst}</p>
            <button className="btn btn-primary" onClick={handleAddNew}>
              {t.customers.createCustomer}
            </button>
          </div>
        ) : (
          <div className="table-container">
            {filteredCustomers.length === 0 ? (
              <div className="empty-state">
                <h3>{t.search.noResults}</h3>
              </div>
            ) : (
              <table>
                <SortableHeader
                  columns={[...customerColumns, { key: 'id' as keyof Customer, label: t.common.actions, sortable: false }]}
                  sortConfig={sortConfig}
                  onSort={handleSort}
                />
                <tbody>
                  {sortedCustomers.map((customer) => (
                    <tr key={customer.id} onDoubleClick={() => handleEdit(customer)}>
                      <td style={{ fontWeight: '500' }}>{customer.name}</td>
                      <td>{customer.email || '—'}</td>
                      <td>{customer.phone || '—'}</td>
                      <td>
                        <div className="actions">
                          <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(customer)}>
                            {t.common.edit}
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(customer.id)}>
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
        <div className="modal-overlay">
          <div className="modal">
            <h2>{editingCustomer ? t.customers.editCustomer : t.customers.newCustomer}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="customer-name">
                  {t.customers.customerName} <span className="required">*</span>
                </label>
                <input
                  id="customer-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t.customers.namePlaceholder}
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label htmlFor="customer-email">{t.customers.email}</label>
                <input
                  id="customer-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={t.customers.emailPlaceholder}
                />
              </div>
              <div className="form-group">
                <label htmlFor="customer-phone">{t.customers.phone}</label>
                <input
                  id="customer-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder={t.customers.phonePlaceholder}
                />
              </div>
              <div className="form-group">
                <label htmlFor="customer-address">{t.customers.address}</label>
                <input
                  id="customer-address"
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder={t.customers.addressPlaceholder}
                />
              </div>
              <div className="form-group">
                <label htmlFor="customer-notes">{t.customers.notes}</label>
                <textarea
                  id="customer-notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder={t.customers.notesPlaceholder}
                  rows={3}
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  {t.common.cancel}
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCustomer ? t.common.update : t.common.create}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
