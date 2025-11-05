import React, { useState } from 'react';
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { SearchBar } from '../search/SearchBar';
import { compoundService } from '../../services/api';
import { useCompare } from '../../context/CompareContext';
import { Compound } from '../../types/compound';
import { formatCompoundCategory } from '../../utils/formatters';

interface CompoundSelectorProps {
  onClose: () => void;
}

export function CompoundSelector({ onClose }: CompoundSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { addToCompare, isInCompare, canAddMore } = useCompare();

  const { data: compounds, isLoading } = useQuery({
    queryKey: ['compounds', searchQuery],
    queryFn: () => compoundService.getAll({
      q: searchQuery,
      per_page: 20,
    }),
  });

  const handleAddCompound = (compound: Compound) => {
    if (canAddMore && !isInCompare(compound.id)) {
      addToCompare(compound);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose} />
        
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Select Compounds to Compare
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Search */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search compounds..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Results */}
          <div className="p-6 max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin h-6 w-6 border-2 border-primary-600 border-t-transparent rounded-full" />
              </div>
            ) : (
              <div className="space-y-3">
                {compounds?.data.map((compound) => {
                  const inCompare = isInCompare(compound.id);
                  const disabled = !canAddMore && !inCompare;
                  
                  return (
                    <div
                      key={compound.id}
                      className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 dark:text-white truncate">
                          {compound.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={`category-${compound.category}` as any} size="sm">
                            {formatCompoundCategory(compound.category)}
                          </Badge>
                          <Badge variant={`safety-${compound.safety_rating.toLowerCase()}` as any} size="sm">
                            {compound.safety_rating}
                          </Badge>
                        </div>
                      </div>
                      
                      <Button
                        size="sm"
                        variant={inCompare ? 'default' : 'outline'}
                        onClick={() => handleAddCompound(compound)}
                        disabled={disabled}
                        className="ml-3"
                      >
                        {inCompare ? 'Added' : 'Add'}
                      </Button>
                    </div>
                  );
                })}
                
                {compounds?.data.length === 0 && (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                    No compounds found matching your search.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
