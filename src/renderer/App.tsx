import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Folder, Users, Clock3, FileText, LineChart, Settings as SettingsIcon, Keyboard } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Customers from './pages/Customers';
import TimeEntries from './pages/TimeEntries';
import { Invoices } from './pages/Invoices';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import { NotificationProvider } from './context/NotificationContext';
import { I18nProvider, useI18n } from './context/I18nContext';
import { ThemeProvider } from './context/ThemeContext';
import { KeyboardShortcutProvider, useKeyboardShortcut, isTypingInInput, getModifierKey } from './contexts/KeyboardShortcutContext';
import { NotificationContainer } from './components/NotificationContainer';
import { ConfirmationDialog } from './components/ConfirmationDialog';
import { GlobalSearch } from './components/GlobalSearch';
import { KeyboardShortcutsHelp } from './components/KeyboardShortcutsHelp';

type Page = 'dashboard' | 'projects' | 'customers' | 'entries' | 'invoices' | 'reports' | 'settings';

interface AppContextType {
  navigateToPage: (page: Page, options?: { projectFilter?: number; entryId?: number; invoiceId?: number }) => void;
}

export const AppContext = React.createContext<AppContextType>({
  navigateToPage: () => {},
});

const AppContent: React.FC = () => {
  const { t } = useI18n();
  const { isAnyModalOpen, registerModal, unregisterModal } = useKeyboardShortcut();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [entriesProjectFilter, setEntriesProjectFilter] = useState<number | undefined>(undefined);
  const [entryToEdit, setEntryToEdit] = useState<number | undefined>(undefined);
  const [invoiceToView, setInvoiceToView] = useState<number | undefined>(undefined);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  const navigateToPage = (page: Page, options?: { projectFilter?: number; entryId?: number; invoiceId?: number }) => {
    setCurrentPage(page);
    if (page === 'entries') {
      setEntriesProjectFilter(options?.projectFilter);
      setEntryToEdit(options?.entryId);
      setInvoiceToView(undefined);
    } else if (page === 'invoices') {
      setInvoiceToView(options?.invoiceId);
      setEntriesProjectFilter(undefined);
      setEntryToEdit(undefined);
    } else {
      setEntriesProjectFilter(undefined);
      setEntryToEdit(undefined);
      setInvoiceToView(undefined);
    }
  };

  // Listen for navigation events from main process (e.g., menu shortcuts)
  useEffect(() => {
    const cleanup = window.api.onNavigate((path: string) => {
      // Convert path to page
      if (path === '/settings') {
        navigateToPage('settings');
      } else if (path === '/dashboard') {
        navigateToPage('dashboard');
      } else if (path === '/projects') {
        navigateToPage('projects');
      } else if (path === '/customers') {
        navigateToPage('customers');
      } else if (path === '/entries') {
        navigateToPage('entries');
      } else if (path === '/invoices') {
        navigateToPage('invoices');
      } else if (path === '/reports') {
        navigateToPage('reports');
      }
    });

    return cleanup;
  }, []);

  // Register/unregister shortcuts help modal
  useEffect(() => {
    if (showShortcutsHelp) {
      registerModal('shortcuts-help');
    } else {
      unregisterModal('shortcuts-help');
    }
    return () => unregisterModal('shortcuts-help');
  }, [showShortcutsHelp, registerModal, unregisterModal]);

  // Global keyboard shortcuts for navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // '?' to show shortcuts help (Shift + /)
      if (event.key === '?' && !isAnyModalOpen()) {
        event.preventDefault();
        setShowShortcutsHelp(true);
        return;
      }

      // Ignore shortcuts when typing in input fields or when modals are open
      if (isTypingInInput(event) || isAnyModalOpen()) {
        return;
      }

      // Navigation shortcuts with CMD/CTRL + number keys
      if (getModifierKey(event)) {
        const key = event.key;
        switch (key) {
          case '1':
            event.preventDefault();
            navigateToPage('dashboard');
            break;
          case '2':
            event.preventDefault();
            navigateToPage('customers');
            break;
          case '3':
            event.preventDefault();
            navigateToPage('projects');
            break;
          case '4':
            event.preventDefault();
            navigateToPage('entries');
            break;
          case '5':
            event.preventDefault();
            navigateToPage('invoices');
            break;
          case '6':
            event.preventDefault();
            navigateToPage('reports');
            break;
          case '7':
            event.preventDefault();
            navigateToPage('settings');
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isAnyModalOpen, navigateToPage]);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'projects':
        return <Projects />;
      case 'customers':
        return <Customers />;
      case 'entries':
        return <TimeEntries initialProjectFilter={entriesProjectFilter} initialEntryId={entryToEdit} />;
      case 'invoices':
        return <Invoices initialInvoiceId={invoiceToView} />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <AppContext.Provider value={{ navigateToPage }}>
      <div className="app">
        <aside className="sidebar">
          <div className="sidebar-header">
            <div className="sidebar-logo">
              <img src="./icons/icon_128x128.png" alt="TimeLedger" />
            </div>
            <div className="sidebar-title">
              <h1>TimeLedger</h1>
              <p>Time Tracking</p>
            </div>
          </div>
          <GlobalSearch />
          <nav>
            <a
              href="#"
              className={currentPage === 'dashboard' ? 'active' : ''}
              onClick={(e) => {
                e.preventDefault();
                navigateToPage('dashboard');
              }}
            >
              <LayoutDashboard className="nav-icon" aria-hidden="true" size={20} strokeWidth={1.75} />
              {t.nav.dashboard}
            </a>
            <a
              href="#"
              className={currentPage === 'customers' ? 'active' : ''}
              onClick={(e) => {
                e.preventDefault();
                navigateToPage('customers');
              }}
            >
              <Users className="nav-icon" aria-hidden="true" size={20} strokeWidth={1.75} />
              {t.nav.customers}
            </a>
            <a
              href="#"
              className={currentPage === 'projects' ? 'active' : ''}
              onClick={(e) => {
                e.preventDefault();
                navigateToPage('projects');
              }}
            >
              <Folder className="nav-icon" aria-hidden="true" size={20} strokeWidth={1.75} />
              {t.nav.projects}
            </a>
            <a
              href="#"
              className={currentPage === 'entries' ? 'active' : ''}
              onClick={(e) => {
                e.preventDefault();
                navigateToPage('entries');
              }}
            >
              <Clock3 className="nav-icon" aria-hidden="true" size={20} strokeWidth={1.75} />
              {t.nav.timeEntries}
            </a>
            <a
              href="#"
              className={currentPage === 'invoices' ? 'active' : ''}
              onClick={(e) => {
                e.preventDefault();
                navigateToPage('invoices');
              }}
            >
              <FileText className="nav-icon" aria-hidden="true" size={20} strokeWidth={1.75} />
              {t.nav.invoices}
            </a>
            <a
              href="#"
              className={currentPage === 'reports' ? 'active' : ''}
              onClick={(e) => {
                e.preventDefault();
                navigateToPage('reports');
              }}
            >
              <LineChart className="nav-icon" aria-hidden="true" size={20} strokeWidth={1.75} />
              {t.nav.reports}
            </a>
            <a
              href="#"
              className={currentPage === 'settings' ? 'active' : ''}
              onClick={(e) => {
                e.preventDefault();
                navigateToPage('settings');
              }}
            >
              <SettingsIcon className="nav-icon" aria-hidden="true" size={20} strokeWidth={1.75} />
              {t.nav.settings}
            </a>
          </nav>
          <div className="sidebar-footer">
            <button
              className="shortcuts-button"
              onClick={() => setShowShortcutsHelp(true)}
              aria-label={t.shortcuts.help}
              title={t.shortcuts.help}
            >
              <Keyboard size={20} />
              <span>{t.shortcuts.help}</span>
            </button>
          </div>
        </aside>
        <main className="main-content">{renderPage()}</main>
        <NotificationContainer />
        <ConfirmationDialog />
        <KeyboardShortcutsHelp isOpen={showShortcutsHelp} onClose={() => setShowShortcutsHelp(false)} />
      </div>
    </AppContext.Provider>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <I18nProvider>
        <NotificationProvider>
          <KeyboardShortcutProvider>
            <AppContent />
          </KeyboardShortcutProvider>
        </NotificationProvider>
      </I18nProvider>
    </ThemeProvider>
  );
};

export default App;
