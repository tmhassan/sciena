import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { CompareFloatingButton } from '../ui/CompareFloatingButton';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function Layout({ children, className }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Fixed Header */}
      <Header />
      
      {/* Main Content with Header Offset */}
      <main className="flex-1 pt-16 sm:pt-20">
        <div className={className}>
          {children}
        </div>
      </main>
      
      {/* Footer */}
      <Footer />
      
      {/* Compare Floating Button */}
      <CompareFloatingButton />
    </div>
  );
}
