import React, { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import TimeEntries from './pages/TimeEntries';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import { NotificationProvider } from './context/NotificationContext';
import { I18nProvider, useI18n } from './context/I18nContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationContainer } from './components/NotificationContainer';
import { ConfirmationDialog } from './components/ConfirmationDialog';

type Page = 'dashboard' | 'projects' | 'entries' | 'reports' | 'settings';

interface AppContextType {
  navigateToPage: (page: Page, options?: { projectFilter?: number; entryId?: number }) => void;
}

export const AppContext = React.createContext<AppContextType>({
  navigateToPage: () => {},
});

const AppContent: React.FC = () => {
  const { t } = useI18n();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [entriesProjectFilter, setEntriesProjectFilter] = useState<number | undefined>(undefined);
  const [entryToEdit, setEntryToEdit] = useState<number | undefined>(undefined);

  const navigateToPage = (page: Page, options?: { projectFilter?: number; entryId?: number }) => {
    setCurrentPage(page);
    if (page === 'entries') {
      setEntriesProjectFilter(options?.projectFilter);
      setEntryToEdit(options?.entryId);
    } else {
      setEntriesProjectFilter(undefined);
      setEntryToEdit(undefined);
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
          <nav>
            <a
              href="#"
              className={currentPage === 'dashboard' ? 'active' : ''}
              onClick={(e) => {
                e.preventDefault();
                navigateToPage('dashboard');
              }}
            >
              <span className="nav-icon">📊</span>
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
              <span className="nav-icon">📁</span>
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
              <span className="nav-icon">⏱️</span>
              {t.nav.timeEntries}
            </a>
            <a
              href="#"
              className={currentPage === 'reports' ? 'active' : ''}
              onClick={(e) => {
                e.preventDefault();
                navigateToPage('reports');
              }}
            >
              <span className="nav-icon">📈</span>
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
              <span className="nav-icon">⚙️</span>
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
