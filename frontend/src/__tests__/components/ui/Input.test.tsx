import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../../../components/ui/input';

describe('Input Component', () => {
  it('should render input', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('should handle user input', async () => {
    const user = userEvent.setup();
    render(<Input placeholder="Enter text" />);
    
    const input = screen.getByPlaceholderText('Enter text');
    await user.type(input, 'Hello');
    
    expect(input).toHaveValue('Hello');
  });

  it('should display error message when error prop provided', () => {
    render(<Input name="email" error="This field is required" />);
    const errorElement = screen.getByTestId('email-error');
    expect(errorElement).toHaveTextContent('This field is required');
  });

  it('should apply error styles when error exists', () => {
    const { container } = render(<Input error="Error message" />);
    const input = container.querySelector('input');
    expect(input).toHaveClass('border-destructive');
  });

  it('should support different input types', () => {
    render(<Input type="email" placeholder="Email" />);
    const input = screen.getByPlaceholderText('Email');
    expect(input).toHaveAttribute('type', 'email');
  });
});

