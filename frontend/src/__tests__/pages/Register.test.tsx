import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { Register } from '../../pages/Register';
import { useAuth } from '../../contexts/AuthContext';

// Mock auth context
vi.mock('../../contexts/AuthContext', async () => {
  const actual = await vi.importActual('../../contexts/AuthContext');
  return {
    ...actual,
    useAuth: vi.fn(),
  };
});

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Register Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      register: vi.fn().mockResolvedValue(undefined),
      isAuthenticated: false,
    });
  });

  it('should render register form', () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    expect(screen.getByText('Create Account')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
  });

  it('should validate email format', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    const form = emailInput.closest('form') as HTMLFormElement;

    // Type invalid email
    await user.type(emailInput, 'invalid-email');
    
    // Submit form using fireEvent to ensure form submission is triggered
    // react-hook-form validates on submit - when validation fails, onSubmit is not called, but errors are set
    fireEvent.submit(form);

    // Wait for React to re-render with validation errors
    // Input component now generates unique test IDs based on input name (e.g., "email-error")
    await waitFor(() => {
      const errorMessage = screen.getByTestId('email-error');
      expect(errorMessage).toHaveTextContent('Invalid email address');
    }, { timeout: 3000 });
  });

  it('should validate password strength', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /register/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'weak');
    await user.click(submitButton);

    await waitFor(() => {
      // Password strength indicator or validation error may show this message
      const passwordMessages = screen.getAllByText(/password must be at least 8 characters/i);
      expect(passwordMessages.length).toBeGreaterThan(0);
    });
  });

  it('should validate password contains uppercase', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /register/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/password must contain at least one uppercase letter/i)).toBeInTheDocument();
    });
  });

  it('should call register on form submit', async () => {
    const user = userEvent.setup();
    const mockRegister = vi.fn().mockResolvedValue(undefined);
    (useAuth as any).mockReturnValue({
      register: mockRegister,
      isAuthenticated: false,
    });

    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const nameInput = screen.getByLabelText(/name/i);
    const termsCheckbox = screen.getByLabelText(/I accept the.*Terms of Service/i);
    const privacyCheckbox = screen.getByLabelText(/I accept the.*Privacy Policy/i);
    const submitButton = screen.getByRole('button', { name: /register/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'Password123!');
    await user.type(nameInput, 'Test User');
    await user.click(termsCheckbox);
    await user.click(privacyCheckbox);
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith('test@example.com', 'Password123!', 'Test User', true, true);
    });
  });

  it('should display error message on register failure', async () => {
    const user = userEvent.setup();
    const mockRegister = vi.fn().mockRejectedValue({
      response: { data: { error: 'Email already registered' } },
    });
    (useAuth as any).mockReturnValue({
      register: mockRegister,
      isAuthenticated: false,
    });

    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const nameInput = screen.getByLabelText(/name/i);
    const termsCheckbox = screen.getByLabelText(/I accept the.*Terms of Service/i);
    const privacyCheckbox = screen.getByLabelText(/I accept the.*Privacy Policy/i);
    const submitButton = screen.getByRole('button', { name: /register/i });

    // Fill in valid form data that passes all validation
    await user.type(emailInput, 'existing@example.com');
    await user.type(passwordInput, 'Password123!');
    await user.type(nameInput, 'Test User');
    await user.click(termsCheckbox);
    await user.click(privacyCheckbox);

    // Submit form - this will call mockRegister which rejects
    await user.click(submitButton);

    // Wait for mockRegister to be called (proving form passed validation)
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith('existing@example.com', 'Password123!', 'Test User', true, true);
    }, { timeout: 3000 });

    // Wait for error state to update and display in the error div
    await waitFor(() => {
      expect(screen.getByText('Email already registered')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});

