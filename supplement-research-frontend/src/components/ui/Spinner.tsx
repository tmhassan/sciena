import React from 'react';
import { cn } from '../../utils/cn';

interface SpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Spinner({ className, size = 'md' }: SpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  };

  return (
    <div 
      className={cn(
        "animate-spin border-2 border-current border-t-transparent rounded-full",
        sizeClasses[size],
        className
      )}
    />
  );
}
