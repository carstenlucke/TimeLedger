import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface KeyboardShortcutContextType {
  registerModal: (id: string) => void;
  unregisterModal: (id: string) => void;
  isAnyModalOpen: () => boolean;
}

const KeyboardShortcutContext = createContext<KeyboardShortcutContextType | undefined>(undefined);

interface KeyboardShortcutProviderProps {
  children: ReactNode;
}

export const KeyboardShortcutProvider: React.FC<KeyboardShortcutProviderProps> = ({ children }) => {
  const [openModals, setOpenModals] = useState<Set<string>>(new Set());

  const registerModal = useCallback((id: string) => {
    setOpenModals((prev) => new Set([...prev, id]));
  }, []);

  const unregisterModal = useCallback((id: string) => {
    setOpenModals((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const isAnyModalOpen = useCallback(() => openModals.size > 0, [openModals]);

  return (
    <KeyboardShortcutContext.Provider value={{ registerModal, unregisterModal, isAnyModalOpen }}>
      {children}
    </KeyboardShortcutContext.Provider>
  );
};

export const useKeyboardShortcut = () => {
  const context = useContext(KeyboardShortcutContext);
  if (context === undefined) {
    throw new Error('useKeyboardShortcut must be used within a KeyboardShortcutProvider');
  }
  return context;
};

// Helper function to detect if user is typing in an input field
export const isTypingInInput = (event: KeyboardEvent): boolean => {
  const target = event.target as HTMLElement;
  return (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT' ||
    target.isContentEditable ||
    target.closest('[contenteditable="true"]') !== null
  );
};

// Helper function for platform detection
export const isMac = (): boolean => {
  return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
};

// Helper function to get the appropriate modifier key
export const getModifierKey = (event: KeyboardEvent): boolean => {
  return isMac() ? event.metaKey : event.ctrlKey;
};

// Helper function to get the modifier label for display
export const getModifierLabel = (): string => {
  return isMac() ? 'CMD' : 'CTRL';
};
