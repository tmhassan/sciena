import React from 'react';
import { ScaleIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Button } from './Button';
import { useCompare } from '../../context/CompareContext';
import { Compound } from '../../types/compound';
import { cn } from '../../utils/cn';

interface CompareButtonProps {
  compound: Compound;
  size?: 'sm' | 'lg' | 'default';
  variant?: 'icon' | 'text';
  className?: string;
}

export function CompareButton({ 
  compound, 
  size = 'default', 
  variant = 'icon',
  className 
}: CompareButtonProps) {
  const { addToCompare, removeFromCompare, isInCompare, canAddMore } = useCompare();
  const inCompare = isInCompare(compound.id);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (inCompare) {
      removeFromCompare(compound.id);
    } else if (canAddMore) {
      addToCompare(compound);
    }
  };

  const disabled = !inCompare && !canAddMore;

  if (variant === 'icon') {
    return (
      <Button
        variant={inCompare ? 'default' : 'outline'}
        size="icon"
        onClick={handleClick}
        disabled={disabled}
        className={cn(
          'transition-all duration-200',
          inCompare && 'bg-primary-600 text-white',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        title={
          disabled 
            ? 'Maximum 4 compounds can be compared'
            : inCompare 
            ? 'Remove from comparison'
            : 'Add to comparison'
        }
      >
        {inCompare ? (
          <CheckIcon className="h-4 w-4" />
        ) : (
          <ScaleIcon className="h-4 w-4" />
        )}
      </Button>
    );
  }

  return (
    <Button
      variant={inCompare ? 'default' : 'outline'}
      size={size}
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        'transition-all duration-200',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {inCompare ? (
        <>
          <CheckIcon className="mr-2 h-4 w-4" />
          Added to Compare
        </>
      ) : (
        <>
          <ScaleIcon className="mr-2 h-4 w-4" />
          Compare
        </>
      )}
    </Button>
  );
}
