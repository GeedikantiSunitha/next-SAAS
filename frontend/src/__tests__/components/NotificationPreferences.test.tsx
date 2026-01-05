/**
 * Notification Preferences Component Tests (TDD)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationPreferences } from '../../components/NotificationPreferences';
import {
  useNotificationPreferences,
  useUpdatePreferences,
} from '../../hooks/useNotifications';

// Mock the hooks
vi.mock('../../hooks/useNotifications', () => ({
  useNotificationPreferences: vi.fn(),
  useUpdatePreferences: vi.fn(),
}));

const mockPreferences = {
  id: '1',
  userId: 'user1',
  emailEnabled: true,
  inAppEnabled: true,
  smsEnabled: false,
  createdAt: '2025-01-05T00:00:00Z',
  updatedAt: '2025-01-05T00:00:00Z',
};

describe('NotificationPreferences', () => {
  const mockUpdatePreferences = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useUpdatePreferences as any).mockReturnValue({
      mutate: mockUpdatePreferences,
      isPending: false,
    });
  });

  it('should render loading state', () => {
    (useNotificationPreferences as any).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    render(<NotificationPreferences />);

    expect(screen.getByTestId('preferences-loading')).toBeInTheDocument();
  });

  it('should render preferences with current values', () => {
    (useNotificationPreferences as any).mockReturnValue({
      data: mockPreferences,
      isLoading: false,
      error: null,
    });

    render(<NotificationPreferences />);

    expect(screen.getByLabelText(/email notifications/i)).toBeChecked();
    expect(screen.getByLabelText(/in-app notifications/i)).toBeChecked();
    expect(screen.getByLabelText(/sms notifications/i)).not.toBeChecked();
  });

  it('should update preferences when toggled', async () => {
    const user = userEvent.setup();
    (useNotificationPreferences as any).mockReturnValue({
      data: mockPreferences,
      isLoading: false,
      error: null,
    });

    render(<NotificationPreferences />);

    const emailToggle = screen.getByLabelText(/email notifications/i);
    await user.click(emailToggle);

    expect(mockUpdatePreferences).toHaveBeenCalledWith(
      { emailEnabled: false }
    );
  });

  it('should disable toggles when mutation is pending', () => {
    (useNotificationPreferences as any).mockReturnValue({
      data: mockPreferences,
      isLoading: false,
      error: null,
    });
    (useUpdatePreferences as any).mockReturnValue({
      mutate: mockUpdatePreferences,
      isPending: true,
    });

    render(<NotificationPreferences />);

    const emailToggle = screen.getByLabelText(/email notifications/i);
    expect(emailToggle).toBeDisabled();
  });

  it('should render error state', () => {
    (useNotificationPreferences as any).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { message: 'Failed to load preferences' },
    });

    render(<NotificationPreferences />);

    expect(screen.getByText(/error loading preferences/i)).toBeInTheDocument();
  });
});
