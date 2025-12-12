import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Folder, Clock3, FileText, LineChart, Settings as SettingsIcon } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import TimeEntries from './pages/TimeEntries';
import { Invoices } from './pages/Invoices';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import { NotificationProvider } from './context/NotificationContext';
import { I18nProvider, useI18n } from './context/I18nContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationContainer } from './components/NotificationContainer';
import { ConfirmationDialog } from './components/ConfirmationDialog';
import { GlobalSearch } from './components/GlobalSearch';

type Page = 'dashboard' | 'projects' | 'entries' | 'invoices' | 'reports' | 'settings';

interface AppContextType {
  navigateToPage: (page: Page, options?: { projectFilter?: number; entryId?: number; invoiceId?: number }) => void;
}

export const AppContext = React.createContext<AppContextType>({
  navigateToPage: () => {},
});

const AppContent: React.FC = () => {
  const { t } = useI18n();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [entriesProjectFilter, setEntriesProjectFilter] = useState<number | undefined>(undefined);
  const [entryToEdit, setEntryToEdit] = useState<number | undefined>(undefined);
  const [invoiceToView, setInvoiceToView] = useState<number | undefined>(undefined);

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

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'projects':
        return <Projects />;
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
        </aside>
        <main className="main-content">{renderPage()}</main>
        <NotificationContainer />
        <ConfirmationDialog />
      </div>
    </AppContext.Provider>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <I18nProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </I18nProvider>
    </ThemeProvider>
  );
};

export default App;
