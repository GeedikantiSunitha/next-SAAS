import { renderHook } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { useKeyboardNavigation, COMMON_SHORTCUTS } from '../../hooks/useKeyboardNavigation';

describe('useKeyboardNavigation', () => {
  it('should call handler when matching key is pressed', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardNavigation([{ key: 's', altKey: true, handler }]));
    fireEvent.keyDown(window, { key: 's', altKey: true });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should not call handler when wrong key is pressed', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardNavigation([{ key: 's', altKey: true, handler }]));
    fireEvent.keyDown(window, { key: 'x', altKey: true });
    expect(handler).not.toHaveBeenCalled();
  });

  it('should call handler when Ctrl shortcut fires on Windows', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardNavigation([{ key: '+', ctrlKey: true, handler }]));
    fireEvent.keyDown(window, { key: '+', ctrlKey: true });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  describe('ctrlOrMetaKey - cross-platform Ctrl/Cmd support', () => {
    it('should call handler when Ctrl is pressed (Windows/Linux)', () => {
      const handler = vi.fn();
      renderHook(() => useKeyboardNavigation([{ key: '+', ctrlOrMetaKey: true, handler }]));
      fireEvent.keyDown(window, { key: '+', ctrlKey: true });
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should call handler when Meta/Cmd is pressed (Mac)', () => {
      const handler = vi.fn();
      renderHook(() => useKeyboardNavigation([{ key: '+', ctrlOrMetaKey: true, handler }]));
      fireEvent.keyDown(window, { key: '+', metaKey: true });
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should not call handler when neither Ctrl nor Meta is pressed', () => {
      const handler = vi.fn();
      renderHook(() => useKeyboardNavigation([{ key: '+', ctrlOrMetaKey: true, handler }]));
      fireEvent.keyDown(window, { key: '+' });
      expect(handler).not.toHaveBeenCalled();
    });
  });

  it('should clean up event listener on unmount', () => {
    const handler = vi.fn();
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() =>
      useKeyboardNavigation([{ key: 's', altKey: true, handler }])
    );
    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    removeEventListenerSpy.mockRestore();
  });

  describe('COMMON_SHORTCUTS', () => {
    it('should have INCREASE_FONT with ctrlOrMetaKey for cross-platform support', () => {
      expect(COMMON_SHORTCUTS.INCREASE_FONT).toEqual({ key: '+', ctrlOrMetaKey: true });
    });

    it('should have DECREASE_FONT with ctrlOrMetaKey for cross-platform support', () => {
      expect(COMMON_SHORTCUTS.DECREASE_FONT).toEqual({ key: '-', ctrlOrMetaKey: true });
    });

    it('should have SKIP_TO_CONTENT with altKey', () => {
      expect(COMMON_SHORTCUTS.SKIP_TO_CONTENT).toEqual({ key: 's', altKey: true });
    });
  });
});
