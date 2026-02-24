import { useMemo } from 'react';

/** Returns true when running on macOS, iOS, or iPadOS. */
export const isMacPlatform = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return /Mac|iPhone|iPod|iPad/.test(navigator.platform);
};

export interface PlatformShortcutKeys {
  /** 'Ctrl' on Windows/Linux, '⌘' on Mac */
  modifier: string;
  /** 'Alt' on Windows/Linux, '⌥' on Mac */
  alt: string;
  isMac: boolean;
}

/**
 * Returns platform-appropriate key label strings for displaying keyboard shortcuts.
 * Detects Mac vs Windows/Linux at runtime so the correct keys are shown to each user.
 */
export const usePlatformShortcuts = (): PlatformShortcutKeys => {
  return useMemo(() => {
    const mac = isMacPlatform();
    return {
      modifier: mac ? '⌘' : 'Ctrl',
      alt: mac ? '⌥' : 'Alt',
      isMac: mac,
    };
  }, []);
};
