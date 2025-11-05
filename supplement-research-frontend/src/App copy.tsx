import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext';
import { CompareProvider } from './context/CompareContext';
import { HomePage } from './pages/HomePage';
import { CompoundPage } from './pages/CompoundPage';
import { BrowsePage } from './pages/BrowsePage';
import { ComparePage } from './pages/ComparePage';
import { StackBuilderPage } from './pages/StackBuilderPage';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <CompareProvider>
          <Router>
            <div className="App">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/browse" element={<BrowsePage />} />
                <Route path="/compound/:id" element={<CompoundPage />} />
                <Route path="/compare" element={<ComparePage />} />
                <Route path="/stack-builder" element={<StackBuilderPage />} />
                {/* Additional routes will be added here */}
              </Routes>
            </div>
          </Router>
        </CompareProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
