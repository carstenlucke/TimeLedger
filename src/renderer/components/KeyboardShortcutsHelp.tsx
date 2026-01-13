import React, { useEffect } from 'react';
import { useI18n } from '../context/I18nContext';
import { getModifierLabel } from '../contexts/KeyboardShortcutContext';

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({ isOpen, onClose }) => {
  const { t } = useI18n();

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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
      onClose();
    }
  };

  if (!isOpen) return null;

  const modifierKey = getModifierLabel();

  interface ShortcutItem {
    keys: string[];
    description: string;
  }

  interface ShortcutCategory {
    title: string;
    shortcuts: ShortcutItem[];
  }

  const categories: ShortcutCategory[] = [
    {
      title: t.shortcuts.navigation,
      shortcuts: [
        { keys: [modifierKey, '1'], description: t.shortcuts.goDashboard },
        { keys: [modifierKey, '2'], description: t.shortcuts.goCustomers },
        { keys: [modifierKey, '3'], description: t.shortcuts.goProjects },
        { keys: [modifierKey, '4'], description: t.shortcuts.goTimeEntries },
        { keys: [modifierKey, '5'], description: t.shortcuts.goInvoices },
        { keys: [modifierKey, '6'], description: t.shortcuts.goReports },
        { keys: [modifierKey, '7'], description: t.shortcuts.goSettings },
      ],
    },
    {
      title: t.shortcuts.general,
      shortcuts: [
        { keys: [t.shortcuts.esc], description: t.shortcuts.closeModal },
        { keys: ['?'], description: t.shortcuts.showHelp },
        { keys: [modifierKey, 'F'], description: t.shortcuts.globalSearch },
      ],
    },
    {
      title: t.shortcuts.projects,
      shortcuts: [
        { keys: ['F'], description: t.shortcuts.focusSearch },
        { keys: [modifierKey, 'N'], description: t.shortcuts.addNew },
        { keys: [modifierKey, t.shortcuts.enter], description: t.shortcuts.submitForm },
      ],
    },
    {
      title: t.shortcuts.timeEntries,
      shortcuts: [
        { keys: ['F'], description: t.shortcuts.focusSearch },
        { keys: [modifierKey, 'N'], description: t.shortcuts.addNew },
        { keys: [modifierKey, t.shortcuts.enter], description: t.shortcuts.submitForm },
      ],
    },
    {
      title: t.shortcuts.invoices,
      shortcuts: [
        { keys: ['F'], description: t.shortcuts.focusSearch },
        { keys: [modifierKey, 'N'], description: t.shortcuts.addNew },
        { keys: [modifierKey, t.shortcuts.enter], description: t.shortcuts.submitForm },
      ],
    },
  ];

  return (
    <div
      className="modal-overlay shortcuts-help-overlay"
      onMouseDown={handleOverlayMouseDown}
      onClick={handleOverlayClick}
    >
      <div className="modal shortcuts-help-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close">
          ×
        </button>
        <div className="modal-header">
          <h2>{t.shortcuts.title}</h2>
        </div>

        <div className="shortcuts-help-content">
          {categories.map((category, index) => (
            <div key={index} className="shortcuts-category">
              <h3>{category.title}</h3>
              <div className="shortcuts-list">
                {category.shortcuts.map((shortcut, idx) => (
                  <div key={idx} className="shortcut-row">
                    <div className="shortcut-keys">
                      {shortcut.keys.map((key, keyIdx) => (
                        <React.Fragment key={keyIdx}>
                          {keyIdx > 0 && <span className="key-separator">+</span>}
                          <kbd className="keyboard-key">{key}</kbd>
                        </React.Fragment>
                      ))}
                    </div>
                    <div className="shortcut-description">{shortcut.description}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
