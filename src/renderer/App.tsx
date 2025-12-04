import React, { useState } from 'react';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import TimeEntries from './pages/TimeEntries';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import { NotificationProvider } from './context/NotificationContext';
import { I18nProvider, useI18n } from './context/I18nContext';
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
          <nav>
            <a
              href="#"
              className={currentPage === 'dashboard' ? 'active' : ''}
              onClick={(e) => {
                e.preventDefault();
                navigateToPage('dashboard');
              }}
            >
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
    <I18nProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </I18nProvider>
  );
};

export default App;
