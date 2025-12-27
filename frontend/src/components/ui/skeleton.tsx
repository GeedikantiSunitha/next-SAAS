import * as React from 'react';
import { cn } from '../../lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Optional data-testid for testing
   */
  'data-testid'?: string;
}

/**
 * Skeleton loader component for loading states
 * Provides a pulsing animation to indicate content is loading
 */
export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'animate-pulse rounded-md bg-muted',
          className
        )}
        data-testid="skeleton"
        {...props}
      />
    );
  }
);
Skeleton.displayName = 'Skeleton';

