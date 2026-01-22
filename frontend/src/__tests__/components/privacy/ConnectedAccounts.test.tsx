/**
 * Tests for ConnectedAccounts Component
 * TDD Phase 1: RED - These tests WILL FAIL initially
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ConnectedAccounts from '../../../components/privacy/ConnectedAccounts';
import { vi } from 'vitest';

describe('ConnectedAccounts Component', () => {
  const mockAccounts = [
    {
      provider: 'google',
      connectedAt: '2024-01-01T10:00:00Z',
    },
    {
      provider: 'github',
      connectedAt: '2024-01-15T14:00:00Z',
    },
    {
      provider: 'microsoft',
      connectedAt: '2023-12-20T09:00:00Z',
    },
  ];

  it('should render section title', () => {
    render(<ConnectedAccounts accounts={mockAccounts} />);
    expect(screen.getByText('Connected Accounts')).toBeInTheDocument();
  });

  it('should display all connected accounts', () => {
    render(<ConnectedAccounts accounts={mockAccounts} />);

    expect(screen.getByText(/Google/i)).toBeInTheDocument();
    expect(screen.getByText(/GitHub/i)).toBeInTheDocument();
    expect(screen.getByText(/Microsoft/i)).toBeInTheDocument();
  });

  it('should show provider icons', () => {
    render(<ConnectedAccounts accounts={mockAccounts} />);

    expect(screen.getByAltText('Google icon')).toBeInTheDocument();
    expect(screen.getByAltText('GitHub icon')).toBeInTheDocument();
    expect(screen.getByAltText('Microsoft icon')).toBeInTheDocument();
  });

  it('should display connection dates', () => {
    render(<ConnectedAccounts accounts={mockAccounts} />);

    expect(screen.getByText(/Connected:.*Jan 1, 2024/)).toBeInTheDocument();
    expect(screen.getByText(/Connected:.*Jan 15, 2024/)).toBeInTheDocument();
    expect(screen.getByText(/Connected:.*Dec 20, 2023/)).toBeInTheDocument();
  });

  it('should show disconnect buttons', () => {
    render(<ConnectedAccounts accounts={mockAccounts} />);

    const disconnectButtons = screen.getAllByRole('button', { name: /Disconnect/i });
    expect(disconnectButtons).toHaveLength(3);
  });

  it('should handle disconnect action', () => {
    const mockOnDisconnect = vi.fn();
    render(<ConnectedAccounts accounts={mockAccounts} onDisconnect={mockOnDisconnect} />);

    // Click the first disconnect button to show confirmation
    const googleDisconnectButton = screen.getAllByRole('button', { name: /Disconnect/i })[0];
    fireEvent.click(googleDisconnectButton);

    // Now click the confirm disconnect button in the dialog
    const confirmDisconnectButton = screen.getAllByRole('button', { name: /Disconnect/i })[1];
    fireEvent.click(confirmDisconnectButton);

    expect(mockOnDisconnect).toHaveBeenCalledWith('google');
  });

  it('should show confirmation before disconnect', () => {
    render(<ConnectedAccounts accounts={mockAccounts} />);

    const disconnectButton = screen.getAllByRole('button', { name: /Disconnect/i })[0];
    fireEvent.click(disconnectButton);

    expect(screen.getByText(/Are you sure you want to disconnect/i)).toBeInTheDocument();
    expect(screen.getByText(/You will need to reconnect/i)).toBeInTheDocument();
  });

  it('should display permissions for each account', () => {
    const accountsWithPermissions = [
      {
        provider: 'google',
        connectedAt: '2024-01-01T10:00:00Z',
        permissions: ['email', 'profile', 'calendar'],
      },
    ];

    render(<ConnectedAccounts accounts={accountsWithPermissions} />);

    expect(screen.getByText(/Permissions:/i)).toBeInTheDocument();
    expect(screen.getByText(/email/i)).toBeInTheDocument();
    expect(screen.getByText(/profile/i)).toBeInTheDocument();
    expect(screen.getByText(/calendar/i)).toBeInTheDocument();
  });

  it('should show last accessed time', () => {
    const accountsWithAccess = [
      {
        provider: 'google',
        connectedAt: '2024-01-01T10:00:00Z',
        lastAccessed: '2024-01-20T15:00:00Z',
      },
    ];

    render(<ConnectedAccounts accounts={accountsWithAccess} />);
    expect(screen.getByText(/Last accessed:.*Jan 20, 2024/)).toBeInTheDocument();
  });

  it('should handle empty accounts list', () => {
    render(<ConnectedAccounts accounts={[]} />);
    expect(screen.getByText('No accounts connected')).toBeInTheDocument();
    expect(screen.getByText(/Connect accounts to enable/i)).toBeInTheDocument();
  });

  it('should show connect new account button', () => {
    render(<ConnectedAccounts accounts={mockAccounts} />);
    expect(screen.getByRole('button', { name: /Connect New Account/i })).toBeInTheDocument();
  });

  it('should display account status badges', () => {
    const accountsWithStatus = [
      {
        provider: 'google',
        connectedAt: '2024-01-01T10:00:00Z',
        status: 'active',
      },
      {
        provider: 'github',
        connectedAt: '2024-01-15T14:00:00Z',
        status: 'expired',
      },
    ];

    render(<ConnectedAccounts accounts={accountsWithStatus} />);

    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Expired')).toBeInTheDocument();
  });

  it('should show re-authenticate for expired accounts', () => {
    const expiredAccount = [
      {
        provider: 'google',
        connectedAt: '2024-01-01T10:00:00Z',
        status: 'expired',
      },
    ];

    render(<ConnectedAccounts accounts={expiredAccount} />);
    expect(screen.getByRole('button', { name: /Re-authenticate/i })).toBeInTheDocument();
  });

  it('should group accounts by provider type', () => {
    const multipleGoogleAccounts = [
      {
        provider: 'google',
        connectedAt: '2024-01-01T10:00:00Z',
        email: 'user1@gmail.com',
      },
      {
        provider: 'google',
        connectedAt: '2024-01-02T10:00:00Z',
        email: 'user2@gmail.com',
      },
    ];

    render(<ConnectedAccounts accounts={multipleGoogleAccounts} />);
    expect(screen.getByText('user1@gmail.com')).toBeInTheDocument();
    expect(screen.getByText('user2@gmail.com')).toBeInTheDocument();
  });
});