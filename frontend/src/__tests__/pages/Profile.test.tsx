/**
 * Profile Page Tests (TDD)
 * 
 * Following TDD: Write tests FIRST, then implement
 * RED → GREEN → REFACTOR
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { Profile } from '../../pages/Profile';
import { AuthProvider } from '../../contexts/AuthContext';
import { profileApi } from '../../api/profile';
import { authApi } from '../../api/auth';
import { Toaster } from '../../components/ui/toaster';

// Mock profile API
vi.mock('../../api/profile', () => ({
  profileApi: {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    changePassword: vi.fn(),
  },
}));

// Mock auth API
vi.mock('../../api/auth', () => ({
  authApi: {
    getMe: vi.fn(),
  },
}));

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Helper to create QueryClient for tests
const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
    },
  });
};

// Helper wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Profile Page', () => {
  const mockUser = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'USER',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock authenticated user
    (authApi.getMe as any).mockResolvedValue({
      success: true,
      data: mockUser,
    });

    // Mock profile API
    (profileApi.getProfile as any).mockResolvedValue({
      success: true,
      data: mockUser,
    });

    (profileApi.updateProfile as any).mockResolvedValue({
      success: true,
      data: mockUser,
    });

    (profileApi.changePassword as any).mockResolvedValue({
      success: true,
      data: { message: 'Password changed successfully' },
    });
  });

  it('should display user profile information', async () => {
    render(
      <TestWrapper>
        <Profile />
      </TestWrapper>
    );

    // Wait for profile to load and form to be populated
    await waitFor(() => {
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    });

    // Check that profile data is displayed
    expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
  });

  it('should allow editing profile name', async () => {
    const user = userEvent.setup();
    const updatedUser = { ...mockUser, name: 'Updated Name' };

    (profileApi.updateProfile as any).mockResolvedValue({
      success: true,
      data: updatedUser,
    });

    render(
      <TestWrapper>
        <Profile />
      </TestWrapper>
    );

    // Wait for profile to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    });

    // Find name input and update it
    const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Name');

    // Find and click save button
    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    // Verify update was called
    await waitFor(() => {
      expect(profileApi.updateProfile).toHaveBeenCalledWith({
        name: 'Updated Name',
      });
    });
  });

  it('should allow editing profile email', async () => {
    const user = userEvent.setup();
    const updatedUser = { ...mockUser, email: 'updated@example.com' };

    (profileApi.updateProfile as any).mockResolvedValue({
      success: true,
      data: updatedUser,
    });

    render(
      <TestWrapper>
        <Profile />
      </TestWrapper>
    );

    // Wait for profile to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    });

    // Find email input and update it
    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    await user.clear(emailInput);
    await user.type(emailInput, 'updated@example.com');

    // Find and click save button
    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    // Verify update was called
    await waitFor(() => {
      expect(profileApi.updateProfile).toHaveBeenCalledWith({
        email: 'updated@example.com',
      });
    });
  });

  it('should validate email format', async () => {
    const user = userEvent.setup();
    const { fireEvent } = await import('@testing-library/react');

    render(
      <TestWrapper>
        <Profile />
      </TestWrapper>
    );

    // Wait for profile to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    });

    // Find email input and enter invalid email
    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    const form = emailInput.closest('form') as HTMLFormElement;
    
    await user.clear(emailInput);
    await user.type(emailInput, 'invalid-email');

    // Submit form explicitly using fireEvent (like Login test)
    // This ensures react-hook-form validation runs
    fireEvent.submit(form);

    // Verify validation error is shown (error is displayed via Input component)
    await waitFor(() => {
      const errorElement = screen.queryByTestId('email-error');
      expect(errorElement).toBeInTheDocument();
      expect(errorElement?.textContent?.toLowerCase()).toContain('invalid email');
    }, { timeout: 3000 });

    // Verify update was NOT called (validation prevented submission)
    expect(profileApi.updateProfile).not.toHaveBeenCalled();
  });

  it('should show error on update failure', async () => {
    const user = userEvent.setup();

    (profileApi.updateProfile as any).mockRejectedValue({
      response: {
        data: {
          success: false,
          error: 'Email already registered',
        },
      },
    });

    render(
      <TestWrapper>
        <Profile />
      </TestWrapper>
    );

    // Wait for profile to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    });

    // Update email
    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    await user.clear(emailInput);
    await user.type(emailInput, 'duplicate@example.com');

    // Find and click save button
    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    // Verify error toast is shown
    await waitFor(() => {
      expect(screen.getByText(/email already registered/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should display success message on successful update', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <Profile />
      </TestWrapper>
    );

    // Wait for profile to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    });

    // Update name
    const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Name');

    // Find and click save button
    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    // Verify success toast is shown
    await waitFor(() => {
      // Toast might appear multiple times, use getAllByText and check at least one exists
      const successMessages = screen.getAllByText(/profile updated successfully/i);
      expect(successMessages.length).toBeGreaterThan(0);
    }, { timeout: 3000 });
  });

  it('should allow changing password', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <Profile />
      </TestWrapper>
    );

    // Wait for profile to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    });

    // Find password change section
    const currentPasswordInput = screen.getByLabelText(/current password/i) as HTMLInputElement;
    const newPasswordInput = screen.getByLabelText(/new password/i) as HTMLInputElement;

    await user.type(currentPasswordInput, 'OldPassword123!');
    await user.type(newPasswordInput, 'NewPassword123!');

    // Find and click change password button
    const changePasswordButton = screen.getByRole('button', { name: /change password/i });
    await user.click(changePasswordButton);

    // Verify change password was called
    await waitFor(() => {
      expect(profileApi.changePassword).toHaveBeenCalledWith({
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
      });
    });

    // Verify success toast
    await waitFor(() => {
      expect(screen.getByText(/password changed successfully/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should validate password strength when changing password', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <Profile />
      </TestWrapper>
    );

    // Wait for profile to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    });

    // Enter weak password
    const currentPasswordInput = screen.getByLabelText(/current password/i) as HTMLInputElement;
    const newPasswordInput = screen.getByLabelText(/new password/i) as HTMLInputElement;

    await user.type(currentPasswordInput, 'OldPassword123!');
    await user.type(newPasswordInput, 'weak'); // Too weak

    // Find and click change password button
    const changePasswordButton = screen.getByRole('button', { name: /change password/i });
    await user.click(changePasswordButton);

    // Verify validation error is shown
    await waitFor(() => {
      expect(screen.getByText(/password must be at least/i)).toBeInTheDocument();
    });

    // Verify change password was NOT called
    expect(profileApi.changePassword).not.toHaveBeenCalled();
  });

  it('should show error on password change failure', async () => {
    const user = userEvent.setup();

    (profileApi.changePassword as any).mockRejectedValue({
      response: {
        data: {
          success: false,
          error: 'Current password is incorrect',
        },
      },
    });

    render(
      <TestWrapper>
        <Profile />
      </TestWrapper>
    );

    // Wait for profile to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    });

    // Enter passwords
    const currentPasswordInput = screen.getByLabelText(/current password/i) as HTMLInputElement;
    const newPasswordInput = screen.getByLabelText(/new password/i) as HTMLInputElement;

    await user.type(currentPasswordInput, 'WrongPassword123!');
    await user.type(newPasswordInput, 'NewPassword123!');

    // Find and click change password button
    const changePasswordButton = screen.getByRole('button', { name: /change password/i });
    await user.click(changePasswordButton);

    // Verify error toast is shown
    await waitFor(() => {
      expect(screen.getByText(/current password is incorrect/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});

