import React, { useState } from 'react';
import Projects from './pages/Projects';
import TimeEntries from './pages/TimeEntries';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

type Page = 'projects' | 'entries' | 'reports' | 'settings';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('projects');

  const renderPage = () => {
    switch (currentPage) {
      case 'projects':
        return <Projects />;
      case 'entries':
        return <TimeEntries />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      default:
        return <Projects />;
    }
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <nav>
          <a
            href="#"
            className={currentPage === 'projects' ? 'active' : ''}
            onClick={(e) => {
              e.preventDefault();
              setCurrentPage('projects');
            }}
          >
            Projects
          </a>
          <a
            href="#"
            className={currentPage === 'entries' ? 'active' : ''}
            onClick={(e) => {
              e.preventDefault();
              setCurrentPage('entries');
            }}
          >
            Time Entries
          </a>
          <a
            href="#"
            className={currentPage === 'reports' ? 'active' : ''}
            onClick={(e) => {
              e.preventDefault();
              setCurrentPage('reports');
            }}
          >
            Reports
          </a>
          <a
            href="#"
            className={currentPage === 'settings' ? 'active' : ''}
            onClick={(e) => {
              e.preventDefault();
              setCurrentPage('settings');
            }}
          >
            Settings
          </a>
        </nav>
      </aside>
      <main className="main-content">{renderPage()}</main>
    </div>
  );
};

export default App;
