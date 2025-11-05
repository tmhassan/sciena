import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200',
        secondary:
          'border-transparent bg-secondary-100 text-secondary-800 dark:bg-secondary-900 dark:text-secondary-200',
        destructive:
          'border-transparent bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        success:
          'border-transparent bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        warning:
          'border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        outline: 'text-gray-900 border border-gray-200 dark:text-gray-100 dark:border-gray-700',
        // Safety ratings
        'safety-excellent':
          'border-transparent bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        'safety-good':
          'border-transparent bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200',
        'safety-moderate':
          'border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        'safety-poor':
          'border-transparent bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        'safety-unknown':
          'border-transparent bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
        // Evidence levels
        'evidence-high':
          'border-transparent bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        'evidence-moderate':
          'border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        'evidence-low':
          'border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        'evidence-very-low':
          'border-transparent bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        'evidence-insufficient':
          'border-transparent bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
        // Categories
        'category-supplement':
          'border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        'category-nootropic':
          'border-transparent bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
        'category-sarm':
          'border-transparent bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
        'category-peptide':
          'border-transparent bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      },
      size: {
        default: 'px-2.5 py-0.5 text-xs',
        sm: 'px-2 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
