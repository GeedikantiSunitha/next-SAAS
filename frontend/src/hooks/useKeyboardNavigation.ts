import { useEffect } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  handler: () => void;
  description?: string;
}

export const useKeyboardNavigation = (shortcuts: KeyboardShortcut[]) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const matchesKey = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const matchesCtrl = shortcut.ctrlKey ? event.ctrlKey : !event.ctrlKey || !shortcut.ctrlKey;
        const matchesShift = shortcut.shiftKey ? event.shiftKey : !event.shiftKey || !shortcut.shiftKey;
        const matchesAlt = shortcut.altKey ? event.altKey : !event.altKey || !shortcut.altKey;
        const matchesMeta = shortcut.metaKey ? event.metaKey : !event.metaKey || !shortcut.metaKey;

        if (matchesKey && matchesCtrl && matchesShift && matchesAlt && matchesMeta) {
          event.preventDefault();
          shortcut.handler();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts]);
};

// Export common shortcuts
export const COMMON_SHORTCUTS = {
  SKIP_TO_CONTENT: { key: 's', altKey: true },
  TOGGLE_HIGH_CONTRAST: { key: 'c', altKey: true },
  TOGGLE_REDUCED_MOTION: { key: 'm', altKey: true },
  INCREASE_FONT: { key: '+', ctrlKey: true },
  DECREASE_FONT: { key: '-', ctrlKey: true },
  OPEN_HELP: { key: '?', shiftKey: true },
  CLOSE_MODAL: { key: 'Escape' },
};