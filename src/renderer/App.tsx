import React, { useState } from 'react';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import TimeEntries from './pages/TimeEntries';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import { NotificationProvider } from './context/NotificationContext';
import { NotificationContainer } from './components/NotificationContainer';
import { ConfirmationDialog } from './components/ConfirmationDialog';

type Page = 'dashboard' | 'projects' | 'entries' | 'reports' | 'settings';

interface AppContextType {
  navigateToPage: (page: Page, options?: { projectFilter?: number }) => void;
}

export const AppContext = React.createContext<AppContextType>({
  navigateToPage: () => {},
});

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [entriesProjectFilter, setEntriesProjectFilter] = useState<number | undefined>(undefined);

  const navigateToPage = (page: Page, options?: { projectFilter?: number }) => {
    setCurrentPage(page);
    if (page === 'entries' && options?.projectFilter) {
      setEntriesProjectFilter(options.projectFilter);
    } else {
      setEntriesProjectFilter(undefined);
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'projects':
        return <Projects />;
      case 'entries':
        return <TimeEntries initialProjectFilter={entriesProjectFilter} />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <NotificationProvider>
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
                Dashboard
              </a>
              <a
                href="#"
                className={currentPage === 'projects' ? 'active' : ''}
                onClick={(e) => {
                  e.preventDefault();
                  navigateToPage('projects');
                }}
              >
                Projects
              </a>
              <a
                href="#"
                className={currentPage === 'entries' ? 'active' : ''}
                onClick={(e) => {
                  e.preventDefault();
                  navigateToPage('entries');
                }}
              >
                Time Entries
              </a>
              <a
                href="#"
                className={currentPage === 'reports' ? 'active' : ''}
                onClick={(e) => {
                  e.preventDefault();
                  navigateToPage('reports');
                }}
              >
                Reports
              </a>
              <a
                href="#"
                className={currentPage === 'settings' ? 'active' : ''}
                onClick={(e) => {
                  e.preventDefault();
                  navigateToPage('settings');
                }}
              >
                Settings
              </a>
            </nav>
          </aside>
          <main className="main-content">{renderPage()}</main>
          <NotificationContainer />
          <ConfirmationDialog />
        </div>
      </AppContext.Provider>
    </NotificationProvider>
  );
};

export default App;
