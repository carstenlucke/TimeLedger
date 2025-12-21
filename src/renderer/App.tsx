import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Sparkles, Settings as SettingsIcon, Keyboard } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import HelloWorld from './pages/HelloWorld';
import Settings from './pages/Settings';
import { NotificationProvider } from './context/NotificationContext';
import { I18nProvider, useI18n } from './context/I18nContext';
import { ThemeProvider } from './context/ThemeContext';
import { KeyboardShortcutProvider, useKeyboardShortcut, isTypingInInput, getModifierKey } from './contexts/KeyboardShortcutContext';
import { NotificationContainer } from './components/NotificationContainer';
import { ConfirmationDialog } from './components/ConfirmationDialog';
import { GlobalSearch } from './components/GlobalSearch';
import { KeyboardShortcutsHelp } from './components/KeyboardShortcutsHelp';

type Page = 'dashboard' | 'helloworld' | 'settings';

interface AppContextType {
  navigateToPage: (page: Page) => void;
}

export const AppContext = React.createContext<AppContextType>({
  navigateToPage: () => {},
});

const AppContent: React.FC = () => {
  const { t } = useI18n();
  const { isAnyModalOpen, registerModal, unregisterModal } = useKeyboardShortcut();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  const navigateToPage = (page: Page) => {
    setCurrentPage(page);
  };

  // Listen for navigation events from main process (e.g., menu shortcuts)
  useEffect(() => {
    const cleanup = window.api.onNavigate((path: string) => {
      // Convert path to page
      if (path === '/settings') {
        navigateToPage('settings');
      } else if (path === '/dashboard') {
        navigateToPage('dashboard');
      } else if (path === '/helloworld') {
        navigateToPage('helloworld');
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
            navigateToPage('helloworld');
            break;
          case '3':
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
      case 'helloworld':
        return <HelloWorld />;
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
              <img src="./icons/icon_128x128.png" alt="Electron App" />
            </div>
            <div className="sidebar-title">
              <h1>Electron App</h1>
              <p>Template</p>
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
              className={currentPage === 'helloworld' ? 'active' : ''}
              onClick={(e) => {
                e.preventDefault();
                navigateToPage('helloworld');
              }}
            >
              <Sparkles className="nav-icon" aria-hidden="true" size={20} strokeWidth={1.75} />
              {t.nav.helloWorld}
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
