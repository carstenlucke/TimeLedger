import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { useI18n } from '../context/I18nContext';

export const GlobalSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useI18n();

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

  const showDropdown = isOpen && query.trim().length >= 2;

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
          <div className="search-no-results">
            {t.search?.noResults || 'No results found'}
            <div style={{ fontSize: '12px', marginTop: '8px', color: 'var(--text-tertiary)' }}>
              Implement your search logic here
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
