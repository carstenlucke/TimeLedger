import React, { useState, useEffect, useRef, useContext } from 'react';
import { Search, Clock3, Folder, FileText } from 'lucide-react';
import { AppContext } from '../App';
import { useI18n } from '../context/I18nContext';
import type { SearchResult } from '../../shared/types';

export const GlobalSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { navigateToPage } = useContext(AppContext);
  const { t, formatDate } = useI18n();

  // Debounced search effect
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timeoutId = setTimeout(async () => {
      try {
        const searchResults = await window.api.search.global(query);
        setResults(searchResults);
      } catch (error) {
        console.error('Search error:', error);
        setResults(null);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // CMD+F (Mac) or CTRL+F (Windows/Linux) to focus search
      if ((event.metaKey || event.ctrlKey) && event.key === 'f') {
        event.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
        return;
      }

      // Escape to close and clear
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setQuery('');
        inputRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleProjectClick = (_projectId: number) => {
    navigateToPage('projects');
    setIsOpen(false);
    setQuery('');
  };

  const handleTimeEntryClick = (entryId: number) => {
    navigateToPage('entries', { entryId });
    setIsOpen(false);
    setQuery('');
  };

  const handleInvoiceClick = (invoiceId: number) => {
    navigateToPage('invoices', { invoiceId });
    setIsOpen(false);
    setQuery('');
  };

  const getMatchFieldLabel = (matchField: string): string => {
    const labels: { [key: string]: string } = {
      name: t.projects?.projectName || 'Project Name',
      client_name: t.projects?.clientName || 'Client Name',
      description: 'Description',
      project_name: t.projects?.projectName || 'Project',
      invoice_number: t.invoices?.invoiceNumber || 'Invoice Number',
      notes: t.invoices?.notes || 'Notes',
    };
    return labels[matchField] || matchField;
  };

  const hasResults =
    results &&
    (results.projects.length > 0 || results.timeEntries.length > 0 || results.invoices.length > 0);

  const showDropdown = isOpen && query.trim().length >= 2 && (isLoading || hasResults || results);

  return (
    <div className="global-search" ref={searchRef}>
      <div className="search-input-wrapper">
        <Search size={18} />
        <input
          ref={inputRef}
          type="text"
          placeholder={t.search?.placeholder || 'Search...'}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
        />
      </div>
      {showDropdown && (
        <div className="search-results-dropdown">
          {isLoading && (
            <div className="search-loading">{t.search?.searching || 'Searching...'}</div>
          )}
          {!isLoading && !hasResults && (
            <div className="search-no-results">{t.search?.noResults || 'No results found'}</div>
          )}
          {!isLoading && results && results.projects.length > 0 && (
            <div className="search-results-section">
              <div className="search-results-header">
                <Folder size={14} />
                {t.search?.projects || 'Projects'}
              </div>
              {results.projects.map((project) => (
                <div
                  key={project.id}
                  className="search-result-item"
                  onClick={() => handleProjectClick(project.id)}
                >
                  <div className="search-result-title">{project.name}</div>
                  {project.client_name && (
                    <div className="search-result-subtitle">{project.client_name}</div>
                  )}
                  <div className="search-result-match">
                    {t.search?.matchedIn || 'Matched in'}: {getMatchFieldLabel(project.match_field)}
                  </div>
                </div>
              ))}
            </div>
          )}
          {!isLoading && results && results.timeEntries.length > 0 && (
            <div className="search-results-section">
              <div className="search-results-header">
                <Clock3 size={14} />
                {t.search?.timeEntries || 'Time Entries'}
              </div>
              {results.timeEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="search-result-item"
                  onClick={() => handleTimeEntryClick(entry.id)}
                >
                  <div className="search-result-title">
                    {entry.project_name || `Project ID ${entry.project_id}`}
                  </div>
                  <div className="search-result-subtitle">
                    {formatDate(entry.date)}
                    {entry.description && ` • ${entry.description}`}
                  </div>
                  <div className="search-result-match">
                    {t.search?.matchedIn || 'Matched in'}: {getMatchFieldLabel(entry.match_field)}
                  </div>
                </div>
              ))}
            </div>
          )}
          {!isLoading && results && results.invoices.length > 0 && (
            <div className="search-results-section">
              <div className="search-results-header">
                <FileText size={14} />
                {t.search?.invoices || 'Invoices'}
              </div>
              {results.invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="search-result-item"
                  onClick={() => handleInvoiceClick(invoice.id)}
                >
                  <div className="search-result-title">{invoice.invoice_number}</div>
                  <div className="search-result-subtitle">
                    {invoice.invoice_date} • {invoice.status}
                  </div>
                  <div className="search-result-match">
                    {t.search?.matchedIn || 'Matched in'}: {getMatchFieldLabel(invoice.match_field)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
