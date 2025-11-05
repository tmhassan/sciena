import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { compoundService } from '../services/api';
import { Compound } from '../types/compound';
import { FilterPanel } from '../components/browse/FilterPanel';
import { CompoundGrid } from '../components/browse/CompoundGrid';
import { Spinner } from '../components/ui/Spinner';
import { SearchBar } from '../components/search/SearchBar';
import { Button } from '../components/ui/Button';
import { DEFAULT_PAGE_SIZE } from '../utils/constants';
import { cn } from '../utils/cn';

export function BrowsePage() {
  /* ---------------- URL state management ---------------- */
  const [searchParams, setSearchParams] = useSearchParams();
  
  /* ---------------- Local UI state ---------------- */
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [filters, setFilters] = useState<Record<string, any>>({
    category: searchParams.get('category') || '',
    safety_rating: searchParams.get('safety_rating') || '',
    legal_status: searchParams.get('legal_status') || '',
  });
  const [sortBy, setSortBy] = useState<'az' | 'evidence' | 'safety'>(
    (searchParams.get('sort') as 'az' | 'evidence' | 'safety') || 'az'
  );

  /* ---------------- Sync URL params with state ---------------- */
  useEffect(() => {
    const urlQuery = searchParams.get('q') || '';
    const urlCategory = searchParams.get('category') || '';
    const urlSafety = searchParams.get('safety_rating') || '';
    const urlLegal = searchParams.get('legal_status') || '';
    const urlSort = searchParams.get('sort') || 'az';

    setQuery(urlQuery);
    setFilters({
      category: urlCategory,
      safety_rating: urlSafety,
      legal_status: urlLegal,
    });
    setSortBy(urlSort as 'az' | 'evidence' | 'safety');
    setPage(1); // Reset page when URL changes
  }, [searchParams]);

  /* ---------------- Data fetch with enhanced parameters ---------------- */
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['browse', query, filters, sortBy, page],
    queryFn: () => {
      console.log('Fetching compounds with params:', {
        q: query || undefined,
        page,
        per_page: DEFAULT_PAGE_SIZE,
        ...filters,
        sort_by: sortBy === 'az' ? 'name' : sortBy === 'evidence' ? 'evidence' : 'safety',
        sort_order: 'asc'
      });

      return compoundService.getAll({
        q: query || undefined,
        page,
        per_page: DEFAULT_PAGE_SIZE,
        category: filters.category || undefined,
        safety_rating: filters.safety_rating || undefined,
        legal_status: filters.legal_status || undefined,
        sort_by: sortBy === 'az' ? 'name' : sortBy === 'evidence' ? 'evidence' : 'safety',
        sort_order: 'asc'
      });
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  /* ---------------- Event handlers ---------------- */
  const handleSearch = (searchQuery: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (searchQuery.trim()) {
      newParams.set('q', searchQuery.trim());
    } else {
      newParams.delete('q');
    }
    setSearchParams(newParams);
  };

  const handleFilterChange = (newFilters: Record<string, any>) => {
    const newParams = new URLSearchParams(searchParams);
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value !== '') {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    
    setSearchParams(newParams);
  };

  const handleSortChange = (newSort: 'az' | 'evidence' | 'safety') => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sort', newSort);
    setSearchParams(newParams);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearAllFilters = () => {
    setSearchParams({});
  };

  const hasActiveFilters = query || filters.category || filters.safety_rating || filters.legal_status;

  /* ---------------- Render ---------------- */
  return (
    <Layout>
      {/* Header Section */}
      <section className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Browse All Compounds
              </h1>
              <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
                {isLoading 
                  ? 'Loading compounds...' 
                  : `Filter and compare ${data?.metadata.total_count?.toLocaleString() || 0} research-backed ingredients`
                }
              </p>
              
              {/* Active filters indicator */}
              {hasActiveFilters && (
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Active filters:</span>
                  {query && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                      Search: "{query}"
                    </span>
                  )}
                  {filters.category && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {filters.category}
                    </span>
                  )}
                  {filters.safety_rating && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Safety {filters.safety_rating}
                    </span>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-xs"
                  >
                    Clear all
                  </Button>
                </div>
              )}
            </div>

            {/* Sort Controls */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 dark:text-gray-400">Sort by:</span>
              <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
                {[
                  { key: 'az', label: 'A-Z' },
                  { key: 'evidence', label: 'Evidence' },
                  { key: 'safety', label: 'Safety' }
                ].map((option) => (
                  <button
                    key={option.key}
                    onClick={() => handleSortChange(option.key as any)}
                    className={cn(
                      "px-4 py-2 text-sm font-medium transition-colors",
                      sortBy === option.key
                        ? "bg-primary-600 text-white"
                        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Global Search Bar */}
          <div className="mt-6">
            <SearchBar
              placeholder="Search compounds by name, category, or effect..."
              onSelect={(compound) => (window.location.href = `/compound/${compound.id}`)}
              className="max-w-2xl"
              autoFocus={false}
            />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8 py-8">
          {/* Left Rail – Filters */}
          <aside className="w-full lg:w-80 flex-shrink-0">
            <div className="sticky top-4">
              {/* Filter Panel with Internal State Management */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Filter Results
                </h3>
                
                {/* Category Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange({ ...filters, category: e.target.value })}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="">All Categories</option>
                    <option value="supplement">Supplement</option>
                    <option value="nootropic">Nootropic</option>
                    <option value="sarm">SARM</option>
                    <option value="peptide">Peptide</option>
                    <option value="herb">Herb</option>
                    <option value="vitamin">Vitamin</option>
                    <option value="mineral">Mineral</option>
                  </select>
                </div>

                {/* Safety Rating Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Safety Rating
                  </label>
                  <select
                    value={filters.safety_rating}
                    onChange={(e) => handleFilterChange({ ...filters, safety_rating: e.target.value })}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="">All Safety Ratings</option>
                    <option value="A">A - Excellent</option>
                    <option value="B">B - Good</option>
                    <option value="C">C - Moderate</option>
                    <option value="D">D - Poor</option>
                  </select>
                </div>

                {/* Legal Status Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Legal Status
                  </label>
                  <select
                    value={filters.legal_status}
                    onChange={(e) => handleFilterChange({ ...filters, legal_status: e.target.value })}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="">All Legal Statuses</option>
                    <option value="legal">Legal</option>
                    <option value="OTC">Over-the-Counter</option>
                    <option value="Prescription">Prescription</option>
                    <option value="Research Chemical">Research Only</option>
                    <option value="prescription_only">Prescription Only</option>
                    <option value="controlled_substance">Controlled</option>
                    <option value="banned">Banned</option>
                  </select>
                </div>

                {/* Clear Filters Button */}
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    onClick={clearAllFilters}
                    className="w-full"
                  >
                    Clear All Filters
                  </Button>
                )}
              </div>
            </div>
          </aside>

          {/* Results Grid */}
          <main className="flex-1 min-w-0">
            {error ? (
              <div className="text-center py-12">
                <div className="mb-4">
                  <div className="mx-auto h-12 w-12 text-red-400">
                    <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Failed to Load Compounds
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {error.message || 'An unexpected error occurred while loading compounds.'}
                </p>
                <Button onClick={() => refetch()}>
                  Try Again
                </Button>
              </div>
            ) : isLoading ? (
              <div className="flex justify-center items-center py-24">
                <Spinner size="lg" />
              </div>
            ) : (
              <>
                {/* Results Summary */}
                {data && (
                  <div className="mb-6 flex items-center justify-between">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Showing {((page - 1) * DEFAULT_PAGE_SIZE) + 1} to{' '}
                      {Math.min(page * DEFAULT_PAGE_SIZE, data.metadata.total_count)} of{' '}
                      {data.metadata.total_count.toLocaleString()} compounds
                    </p>
                  </div>
                )}

                {/* Compounds Grid - Fixed to only pass compounds prop */}
                <CompoundGrid compounds={data?.data || []} />

                {/* Pagination */}
                {data && data.metadata.total_pages > 1 && (
                  <div className="mt-12">
                    <Pagination
                      current={page}
                      total={data.metadata.total_pages}
                      onChange={handlePageChange}
                      hasNext={data.metadata.has_next}
                      hasPrev={data.metadata.has_prev}
                      totalItems={data.metadata.total_count}
                    />
                  </div>
                )}

                {/* No Results */}
                {data && data.data.length === 0 && (
                  <div className="text-center py-12">
                    <div className="mb-4">
                      <div className="mx-auto h-12 w-12 text-gray-400">
                        <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No compounds found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {hasActiveFilters 
                        ? 'Try adjusting your search terms or filters.'
                        : 'No compounds match your current search criteria.'
                      }
                    </p>
                    {hasActiveFilters && (
                      <Button variant="outline" onClick={clearAllFilters}>
                        Clear all filters
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </Layout>
  );
}

/* ------------ Enhanced Pagination Component ------------ */
interface PaginationProps {
  current: number;
  total: number;
  onChange: (page: number) => void;
  hasNext: boolean;
  hasPrev: boolean;
  totalItems: number;
}

function Pagination({ current, total, onChange, hasNext, hasPrev, totalItems }: PaginationProps) {
  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
      range.push(i);
    }

    if (current - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (current + delta < total - 1) {
      rangeWithDots.push('...', total);
    } else {
      rangeWithDots.push(total);
    }

    return rangeWithDots;
  };

  return (
    <nav className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 px-4 py-3 sm:px-6">
      <div className="flex flex-1 justify-between sm:hidden">
        <Button
          variant="outline"
          disabled={!hasPrev}
          onClick={() => onChange(current - 1)}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          disabled={!hasNext}
          onClick={() => onChange(current + 1)}
        >
          Next
        </Button>
      </div>
      
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Showing page <span className="font-medium">{current}</span> of{' '}
            <span className="font-medium">{total}</span> ({totalItems.toLocaleString()} total compounds)
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!hasPrev}
            onClick={() => onChange(current - 1)}
          >
            Previous
          </Button>
          
          <div className="flex items-center space-x-1">
            {getVisiblePages().map((page, index) => (
              <React.Fragment key={index}>
                {page === '...' ? (
                  <span className="px-3 py-2 text-gray-500">...</span>
                ) : (
                  <button
                    onClick={() => onChange(page as number)}
                    className={cn(
                      "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      current === page
                        ? "bg-primary-600 text-white"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    )}
                  >
                    {page}
                  </button>
                )}
              </React.Fragment>
            ))}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            disabled={!hasNext}
            onClick={() => onChange(current + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </nav>
  );
}
