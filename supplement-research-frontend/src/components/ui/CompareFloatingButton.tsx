import React from 'react';
import { Link } from 'react-router-dom';
import { ScaleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from './Button';
import { Badge } from './Badge';
import { useCompare } from '../../context/CompareContext';
import { cn } from '../../utils/cn';

export function CompareFloatingButton() {
  const { compareList, removeFromCompare, clearCompare } = useCompare();

  if (compareList.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 max-w-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ScaleIcon className="h-5 w-5 text-primary-600" />
            <span className="font-medium text-gray-900 dark:text-white">
              Compare ({compareList.length})
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearCompare}
            className="h-6 w-6 p-0"
          >
            <XMarkIcon className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2 mb-4">
          {compareList.map((compound) => (
            <div key={compound.id} className="flex items-center justify-between text-sm">
              <span className="truncate text-gray-700 dark:text-gray-300">
                {compound.name}
              </span>
              <button
                onClick={() => removeFromCompare(compound.id)}
                className="text-gray-400 hover:text-red-500 ml-2"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <Link to="/compare">
          <Button className="w-full" size="sm">
            Compare Now
          </Button>
        </Link>
      </div>
    </div>
  );
}
