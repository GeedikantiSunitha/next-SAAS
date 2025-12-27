import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Skeleton } from '../../../components/ui/skeleton';

describe('Skeleton Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render skeleton element', () => {
      const { container } = render(<Skeleton />);
      const skeleton = container.querySelector('[data-testid="skeleton"]') || 
                      container.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
    });

    it('should render with default className', () => {
      const { container } = render(<Skeleton />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toBeInTheDocument();
      expect(skeleton?.className).toContain('animate-pulse');
    });

    it('should render with custom className', () => {
      const { container } = render(<Skeleton className="custom-skeleton" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton?.className).toContain('custom-skeleton');
    });

    it('should support custom width', () => {
      const { container } = render(<Skeleton className="w-32" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton?.className).toContain('w-32');
    });

    it('should support custom height', () => {
      const { container } = render(<Skeleton className="h-8" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton?.className).toContain('h-8');
    });

    it('should support rounded variants', () => {
      const { container } = render(<Skeleton className="rounded-full" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton?.className).toContain('rounded-full');
    });
  });

  describe('Common Use Cases', () => {
    it('should render text skeleton', () => {
      const { container } = render(<Skeleton className="h-4 w-full" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton?.className).toContain('h-4');
      expect(skeleton?.className).toContain('w-full');
    });

    it('should render avatar skeleton', () => {
      const { container } = render(<Skeleton className="h-12 w-12 rounded-full" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton?.className).toContain('h-12');
      expect(skeleton?.className).toContain('w-12');
      expect(skeleton?.className).toContain('rounded-full');
    });

    it('should render card skeleton', () => {
      const { container } = render(
        <div>
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      );
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBe(3);
    });

    it('should render button skeleton', () => {
      const { container } = render(<Skeleton className="h-10 w-24 rounded-md" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton?.className).toContain('h-10');
      expect(skeleton?.className).toContain('w-24');
      expect(skeleton?.className).toContain('rounded-md');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const { container } = render(<Skeleton aria-label="Loading content" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveAttribute('aria-label', 'Loading content');
    });

    it('should support aria-busy attribute', () => {
      const { container } = render(<Skeleton aria-busy="true" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveAttribute('aria-busy', 'true');
    });

    it('should have role="status" when provided', () => {
      const { container } = render(<Skeleton role="status" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveAttribute('role', 'status');
    });
  });

  describe('Styling', () => {
    it('should have pulse animation', () => {
      const { container } = render(<Skeleton />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton?.className).toContain('animate-pulse');
    });

    it('should have background color', () => {
      const { container } = render(<Skeleton />);
      const skeleton = container.firstChild as HTMLElement;
      // Should have muted background
      expect(skeleton?.className).toMatch(/bg-/);
    });

    it('should support custom background color', () => {
      const { container } = render(<Skeleton className="bg-gray-200" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton?.className).toContain('bg-gray-200');
    });
  });

  describe('Composition', () => {
    it('should work with multiple skeletons', () => {
      const { container } = render(
        <div>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      );
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBe(3);
    });

    it('should work inside other components', () => {
      const { container } = render(
        <div className="card">
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-4 w-full" />
        </div>
      );
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBe(2);
    });
  });
});

