import * as React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  'aria-label'?: string;
}

/**
 * Spinner component for loading states
 */
export const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = 'md', 'aria-label': ariaLabel = 'Loading', ...props }, ref) => {
    const sizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-6 w-6',
      lg: 'h-8 w-8',
    };

    return (
      <div
        ref={ref}
        role="status"
        aria-label={ariaLabel}
        aria-live="polite"
        className={cn('inline-block', className)}
        {...props}
      >
        <Loader2
          className={cn(
            'animate-spin text-muted-foreground',
            sizeClasses[size]
          )}
          aria-hidden="true"
        />
      </div>
    );
  }
);
Spinner.displayName = 'Spinner';

export interface LoadingButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

/**
 * Button component with loading state
 */
export const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  (
    {
      className,
      loading = false,
      loadingText,
      children,
      disabled,
      onClick,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2',
          'px-4 py-2',
          'text-sm font-medium',
          'rounded-md',
          'transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          className
        )}
        disabled={isDisabled}
        onClick={loading ? undefined : onClick}
        {...props}
      >
        {loading && (
          <Spinner size="sm" aria-label="Loading" className="text-current" />
        )}
        <span>{loading && loadingText ? loadingText : children}</span>
      </button>
    );
  }
);
LoadingButton.displayName = 'LoadingButton';

export interface LoadingOverlayProps {
  loading: boolean;
  loadingText?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Overlay component that shows loading state over content
 */
export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  loading,
  loadingText,
  children,
  className,
}) => {
  return (
    <div className={cn('relative', className)}>
      {loading && (
        <div
          className={cn(
            'absolute inset-0',
            'flex flex-col items-center justify-center',
            'bg-background/80 backdrop-blur-sm',
            'z-50',
            'rounded-md'
          )}
          role="status"
          aria-label={loadingText || 'Loading'}
          aria-live="polite"
        >
          <Spinner size="lg" />
          {loadingText && (
            <p className="mt-4 text-sm text-muted-foreground">{loadingText}</p>
          )}
        </div>
      )}
      <div className={cn(loading && 'opacity-50 pointer-events-none')}>
        {children}
      </div>
    </div>
  );
};
LoadingOverlay.displayName = 'LoadingOverlay';

export interface InlineLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Inline loader component for inline loading states
 */
export const InlineLoader = React.forwardRef<HTMLDivElement, InlineLoaderProps>(
  ({ className, text, size = 'md', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('inline-flex items-center gap-2', className)}
        {...props}
      >
        <Spinner size={size} aria-label={text || 'Loading'} />
        {text && (
          <span className="text-sm text-muted-foreground">{text}</span>
        )}
      </div>
    );
  }
);
InlineLoader.displayName = 'InlineLoader';

