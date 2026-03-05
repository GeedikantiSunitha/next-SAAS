/**
 * NetworkErrorBanner Component Tests (TDD - Issues 10, 11)
 *
 * Verifies offline handling and API timeout handling are implemented.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { NetworkErrorBanner } from '../../components/NetworkErrorBanner';

vi.mock('../../hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

describe('NetworkErrorBanner (Issues 10, 11)', () => {
  const originalOnLine = Object.getOwnPropertyDescriptor(navigator, 'onLine');

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      configurable: true,
    });
  });

  afterEach(() => {
    if (originalOnLine) {
      Object.defineProperty(navigator, 'onLine', originalOnLine);
    }
  });

  it('should show "You are offline" when offline event is dispatched', async () => {
    render(<NetworkErrorBanner />);

    await act(async () => {
      window.dispatchEvent(new Event('offline'));
    });

    expect(screen.getByText(/you are offline/i)).toBeInTheDocument();
    expect(screen.getByText(/check your internet connection/i)).toBeInTheDocument();
  });

  it('should show "Request timeout" when network-error event has isTimeout', async () => {
    render(<NetworkErrorBanner />);

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent('network-error', {
          detail: { isTimeout: true, isOffline: false },
        })
      );
    });

    expect(screen.getByText(/request timeout/i)).toBeInTheDocument();
    expect(screen.getByText(/took too long/i)).toBeInTheDocument();
  });

  it('should show "Network error" when network-error event without timeout', async () => {
    render(<NetworkErrorBanner />);

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent('network-error', {
          detail: { isTimeout: false, isOffline: false },
        })
      );
    });

    expect(screen.getByText(/network error/i)).toBeInTheDocument();
    expect(screen.getByText(/unable to connect/i)).toBeInTheDocument();
  });

  it('should show Retry button when not offline (network-error)', async () => {
    render(<NetworkErrorBanner />);

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent('network-error', {
          detail: { isTimeout: true, isOffline: false },
        })
      );
    });

    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('should NOT show Retry button when offline', async () => {
    render(<NetworkErrorBanner />);

    await act(async () => {
      window.dispatchEvent(new Event('offline'));
    });

    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
  });
});
