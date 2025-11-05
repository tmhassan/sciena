import React, { createContext, useContext, useState, useCallback } from 'react';
import { Compound } from '../types/compound';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface CompareContextType {
  compareList: Compound[];
  addToCompare: (compound: Compound) => void;
  removeFromCompare: (compoundId: string) => void;
  clearCompare: () => void;
  isInCompare: (compoundId: string) => boolean;
  canAddMore: boolean;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

const MAX_COMPARE_ITEMS = 4;

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [compareList, setCompareList] = useLocalStorage<Compound[]>('compareList', []);

  const addToCompare = useCallback((compound: Compound) => {
    setCompareList(prev => {
      if (prev.some(c => c.id === compound.id)) return prev;
      if (prev.length >= MAX_COMPARE_ITEMS) return prev;
      return [...prev, compound];
    });
  }, [setCompareList]);

  const removeFromCompare = useCallback((compoundId: string) => {
    setCompareList(prev => prev.filter(c => c.id !== compoundId));
  }, [setCompareList]);

  const clearCompare = useCallback(() => {
    setCompareList([]);
  }, [setCompareList]);

  const isInCompare = useCallback((compoundId: string) => {
    return compareList.some(c => c.id === compoundId);
  }, [compareList]);

  const canAddMore = compareList.length < MAX_COMPARE_ITEMS;

  return (
    <CompareContext.Provider value={{
      compareList,
      addToCompare,
      removeFromCompare,
      clearCompare,
      isInCompare,
      canAddMore,
    }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (context === undefined) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
}
