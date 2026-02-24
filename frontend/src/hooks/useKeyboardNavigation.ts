import { useEffect } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  /** When true, matches either Ctrl (Windows/Linux) or Meta/Cmd (Mac). */
  ctrlOrMetaKey?: boolean;
  handler: () => void;
  description?: string;
}

export const useKeyboardNavigation = (shortcuts: KeyboardShortcut[]) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const matchesKey = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const matchesShift = shortcut.shiftKey ? event.shiftKey : !event.shiftKey || !shortcut.shiftKey;
        const matchesAlt = shortcut.altKey ? event.altKey : !event.altKey || !shortcut.altKey;

        let matchesCtrl: boolean;
        let matchesMeta: boolean;

        if (shortcut.ctrlOrMetaKey) {
          // Accept Ctrl (Windows/Linux) or Cmd/Meta (Mac) interchangeably
          matchesCtrl = event.ctrlKey || event.metaKey;
          matchesMeta = true;
        } else {
          matchesCtrl = shortcut.ctrlKey ? event.ctrlKey : !event.ctrlKey || !shortcut.ctrlKey;
          matchesMeta = shortcut.metaKey ? event.metaKey : !event.metaKey || !shortcut.metaKey;
        }

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

export const COMMON_SHORTCUTS = {
  SKIP_TO_CONTENT: { key: 's', altKey: true },
  TOGGLE_HIGH_CONTRAST: { key: 'c', altKey: true },
  TOGGLE_REDUCED_MOTION: { key: 'm', altKey: true },
  INCREASE_FONT: { key: '+', ctrlOrMetaKey: true },
  DECREASE_FONT: { key: '-', ctrlOrMetaKey: true },
  OPEN_HELP: { key: '?', shiftKey: true },
  CLOSE_MODAL: { key: 'Escape' },
};