import type React from 'react';
import { useMemo } from 'react';

/**
 * Represents the Skeleton properties.
 */
export interface SkeletonProps {
  /**
   * The children elements to be rendered inside the Skeleton component.
   */
  children?: React.ReactNode;
  /**
   * Additional class names to apply to the Skeleton component.
   */
  className?: string;
  /**
   * Whether the Skeleton component should be rendered inline.
   */
  inline?: boolean;
  /**
   * Indicates if the Skeleton component is in a loading state.
   */
  isLoading?: boolean;
  /**
   * Additional HTML attributes to apply to the Skeleton component.
   */
  rest?: React.HTMLAttributes<HTMLDivElement>;
}

function Skeleton({ children, className = '', inline = false, isLoading = true, rest = {} }: SkeletonProps) {
  const skeletonClasses = useMemo(() => {
    return isLoading ? `animate-pulse rounded-lg bg-slate-200 text-transparent ${className}` : className;
  }, [isLoading, className]);

  return (
    <div className={skeletonClasses} {...rest}>
      {inline ? <span>Loading data ...</span> : children}
    </div>
  );
}

export default Skeleton;
