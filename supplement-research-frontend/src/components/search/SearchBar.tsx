import React, { useState, useRef, useEffect } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useDebounce } from '../../hooks/useDebounce';
import { compoundService } from '../../services/api';
import { Compound } from '../../types/compound';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../utils/cn';

interface SearchBarProps {
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  onSelect?: (compound: Compound) => void;
}

export function SearchBar({
  placeholder = "Search compounds...",
  className,
  autoFocus = false,
  onSelect
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Compound[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  
  const debouncedQuery = useDebounce(query, 300);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Auto-focus if requested
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Search effect with enhanced error handling
  useEffect(() => {
    const searchCompounds = async () => {
      if (!debouncedQuery.trim() || debouncedQuery.length < 2) {
        setResults([]);
        setIsOpen(false);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);
      
      try {
        console.log('Searching for:', debouncedQuery);
        const searchResults = await compoundService.search(debouncedQuery, 8);
        console.log('Search results:', searchResults);
        
        setResults(searchResults || []);
        setIsOpen(true);
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Search error:', error);
        setError('Search failed. Please try again.');
        setResults([]);
        setIsOpen(true); // Keep open to show error
      } finally {
        setIsLoading(false);
      }
    };

    searchCompounds();
  }, [debouncedQuery]);

  // Handle keyboard navigation with enhanced functionality
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (isOpen && results.length > 0) {
          setSelectedIndex(prev => 
            prev < results.length - 1 ? prev + 1 : prev
          );
        } else if (!isOpen && results.length > 0) {
          setIsOpen(true);
          setSelectedIndex(0);
        }
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen && results.length > 0) {
          setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        }
        break;
        
      case 'Enter':
        e.preventDefault();
        if (isOpen && selectedIndex >= 0 && results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        } else if (query.trim()) {
          // Navigate to browse page with search query
          navigate(`/browse?q=${encodeURIComponent(query.trim())}`);
          setIsOpen(false);
        }
        break;
        
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
        
      case 'Tab':
        // Allow tab to close dropdown and move focus
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSelect = (compound: Compound) => {
    console.log('Selected compound:', compound);
    setQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
    setError(null);
    
    if (onSelect) {
      onSelect(compound);
    } else {
      navigate(`/compound/${compound.id}`);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    setError(null);
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    // Show dropdown immediately if there are cached results
    if (value.length >= 2 && results.length > 0) {
      setIsOpen(true);
    }
  };

  const handleInputFocus = () => {
    // Show results if we have them and query is long enough
    if (query.length >= 2 && (results.length > 0 || error)) {
      setIsOpen(true);
    }
  };

  const handleViewAllResults = () => {
    navigate(`/browse?q=${encodeURIComponent(query.trim())}`);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn("relative", className)} ref={resultsRef}>
      <div className="relative">
        {/* Search Icon */}
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>

        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="block w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-10 text-sm placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:border-primary-400 dark:focus:ring-primary-400"
        />

        {/* Clear Button */}
        {query && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            type="button"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="absolute inset-y-0 right-8 flex items-center">
            <div className="animate-spin h-4 w-4 border-2 border-primary-500 border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (query.length >= 2) && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg max-h-96 rounded-lg py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none border border-gray-200 dark:border-gray-700">
          {error ? (
            <div className="px-4 py-3 text-center text-red-600 dark:text-red-400">
              <div className="text-sm">{error}</div>
              <button
                onClick={() => setError(null)}
                className="mt-1 text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                Dismiss
              </button>
            </div>
          ) : results.length > 0 ? (
            <>
              {results.map((compound, index) => (
                <button
                  key={compound.id}
                  onClick={() => handleSelect(compound)}
                  className={cn(
                    "w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0",
                    selectedIndex === index && "bg-primary-50 dark:bg-primary-900/20"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-white truncate">
                        {compound.name}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                          {compound.category}
                        </span>
                        {compound.safety_rating && (
                          <>
                            <span className="text-xs text-gray-400">•</span>
                            <span className={cn(
                              "text-xs font-medium",
                              compound.safety_rating === 'A' ? 'text-green-600 dark:text-green-400' :
                              compound.safety_rating === 'B' ? 'text-blue-600 dark:text-blue-400' :
                              compound.safety_rating === 'C' ? 'text-yellow-600 dark:text-yellow-400' :
                              'text-gray-600 dark:text-gray-400'
                            )}>
                              Safety {compound.safety_rating}
                            </span>
                          </>
                        )}
                      </div>
                      {compound.synonyms && compound.synonyms.length > 0 && (
                        <div className="text-xs text-gray-400 dark:text-gray-500 truncate mt-1">
                          aka {compound.synonyms[0]}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
              
              {/* View All Results Link */}
              {query.trim() && (
                <button
                  onClick={handleViewAllResults}
                  className="w-full px-4 py-3 text-left text-sm text-primary-600 hover:bg-gray-50 dark:text-primary-400 dark:hover:bg-gray-700 border-t border-gray-200 dark:border-gray-600 transition-colors"
                >
                  <div className="flex items-center">
                    <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
                    View all results for "{query}"
                  </div>
                </button>
              )}
            </>
          ) : !isLoading ? (
            <div className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">
              <div className="text-sm">
                {query.length < 2 
                  ? 'Type at least 2 characters to search'
                  : `No compounds found for "${query}"`
                }
              </div>
              {query.length >= 2 && (
                <button
                  onClick={handleViewAllResults}
                  className="mt-2 text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  Search in all compounds →
                </button>
              )}
            </div>
          ) : (
            <div className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">
              <div className="flex items-center justify-center">
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                <span className="text-sm">Searching...</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
