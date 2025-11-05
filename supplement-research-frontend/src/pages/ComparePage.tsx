import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, XMarkIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Layout } from '../components/layout/Layout';
import { ComparisonTable } from '../components/compare/ComparisonTable';
import { CompoundSelector } from '../components/compare/CompoundSelector';
import { Button } from '../components/ui/Button';
import { useCompare } from '../context/CompareContext';

export function ComparePage() {
  const { compareList, removeFromCompare, clearCompare } = useCompare();
  const [showSelector, setShowSelector] = useState(false);

  if (compareList.length === 0) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <PlusIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              No Compounds to Compare
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start by browsing compounds and adding them to your comparison list.
            </p>
            <div className="space-y-3">
              <Link to="/browse">
                <Button className="w-full">
                  Browse Compounds
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => setShowSelector(true)}
                className="w-full"
              >
                Select Compounds
              </Button>
            </div>
          </div>
        </div>
        
        {showSelector && (
          <CompoundSelector onClose={() => setShowSelector(false)} />
        )}
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <section className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/browse">
                <Button variant="ghost" size="icon">
                  <ArrowLeftIcon className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Compare Compounds
                </h1>
                <p className="mt-1 text-gray-600 dark:text-gray-400">
                  Side-by-side analysis of {compareList.length} compounds
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setShowSelector(true)}
                disabled={compareList.length >= 4}
              >
                <PlusIcon className="mr-2 h-4 w-4" />
                Add Compound
              </Button>
              <Button variant="outline" onClick={clearCompare}>
                Clear All
              </Button>
            </div>
          </div>

          {/* Compound Pills */}
          <div className="mt-6 flex flex-wrap gap-2">
            {compareList.map((compound) => (
              <div
                key={compound.id}
                className="flex items-center gap-2 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 px-3 py-1 rounded-full text-sm"
              >
                <span>{compound.name}</span>
                <button
                  onClick={() => removeFromCompare(compound.id)}
                  className="hover:bg-primary-200 dark:hover:bg-primary-800 rounded-full p-0.5"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ComparisonTable compounds={compareList} />
      </main>

      {/* Compound Selector Modal */}
      {showSelector && (
        <CompoundSelector onClose={() => setShowSelector(false)} />
      )}
    </Layout>
  );
}
