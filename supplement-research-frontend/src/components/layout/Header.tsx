import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  SunIcon,
  MoonIcon,
  Bars3Icon,
  XMarkIcon,
  BeakerIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  UserIcon,
  CameraIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';
import { useTheme } from '../../context/ThemeContext';
import { SearchBar } from '../search/SearchBar';
import { useCompare } from '../../context/CompareContext';
import { CompareFloatingButton } from '../ui/CompareFloatingButton';
import { cn } from '../../utils/cn';

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { compareList } = useCompare();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const navigation = [
    { name: 'Browse', href: '/browse', icon: BeakerIcon },
    { name: 'Stack Builder', href: '/stack-builder', icon: SparklesIcon },
    { name: 'Scanner', href: '/scanner', icon: CameraIcon },
  ];

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };

    if (isMenuOpen || isSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isMenuOpen, isSearchOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setIsSearchOpen(false);
  }, [navigate]);

  return (
    <>
      {/* CSS Animation Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes gradient-x {
            0%, 100% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
          }
          .animate-gradient-x {
            animation: gradient-x 6s ease infinite;
            background-size: 300% 300% !important;
          }
        `
      }} />

      {/* Main Header - Enhanced transparency for seamless integration */}
      <header 
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out",
          isScrolled 
            ? "backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 shadow-lg border-b border-white/20 dark:border-gray-800/20" 
            : "backdrop-blur-md bg-white/30 dark:bg-gray-900/30"
        )}
      >
        <div className="max-w-7xl mx-auto">
          <div 
            className={cn(
              "flex items-center justify-between transition-all duration-500 ease-out",
              isScrolled ? "px-4 py-3" : "px-6 py-4"
            )}
          >
            {/* Left Navigation */}
            <div className="flex items-center space-x-8">
              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-6">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className="group flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white/40 dark:hover:bg-gray-800/40 transition-all duration-300"
                    >
                      <Icon className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-white/40 dark:hover:bg-gray-800/40 transition-all duration-300"
                aria-label="Toggle menu"
              >
                {isMenuOpen ? (
                  <XMarkIcon className="w-5 h-5" />
                ) : (
                  <Bars3Icon className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Center Logo - Enhanced gradient */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <Link 
                to="/" 
                className="group px-4 py-2 rounded-full hover:bg-white/30 dark:hover:bg-gray-800/30 transition-all duration-300"
              >
                <span 
                  className={cn(
                    "font-bold transition-all duration-300 bg-clip-text text-transparent animate-gradient-x group-hover:scale-105 transform inline-block",
                    isScrolled ? "text-xl" : "text-2xl"
                  )}
                  style={{
                    backgroundImage: 'linear-gradient(-45deg, #667eea, #764ba2, #f093fb, #f5576c, #4facfe, #00f2fe)',
                    backgroundSize: '300% 300%'
                  }}
                >
                  sciena
                </span>
              </Link>
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative" ref={searchRef}>
                <button
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className={cn(
                    "p-2 rounded-full transition-all duration-300",
                    isSearchOpen 
                      ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400" 
                      : "text-gray-700 dark:text-gray-300 hover:bg-white/40 dark:hover:bg-gray-800/40"
                  )}
                  aria-label="Search"
                >
                  <MagnifyingGlassIcon className="w-5 h-5" />
                </button>

                {/* Hidden Search Dropdown */}
                <div 
                  className={cn(
                    "absolute right-0 top-full mt-2 w-80 transform transition-all duration-300 ease-out",
                    isSearchOpen 
                      ? "opacity-100 translate-y-0 scale-100" 
                      : "opacity-0 -translate-y-2 scale-95 pointer-events-none"
                  )}
                >
                  <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-800/20 p-4">
                    <SearchBar 
                      className="w-full"
                      placeholder="Search compounds..."
                    />
                    <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 text-center">
                      Press <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">⌘K</kbd> for quick search
                    </div>
                  </div>
                </div>
              </div>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-white/40 dark:hover:bg-gray-800/40 transition-all duration-300"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <SunIcon className="w-5 h-5 hover:scale-110 transition-transform duration-300" />
                ) : (
                  <MoonIcon className="w-5 h-5 hover:scale-110 transition-transform duration-300" />
                )}
              </button>

              {/* Login */}
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:flex items-center space-x-2 bg-white/20 dark:bg-gray-800/20 backdrop-blur-sm border-white/30 dark:border-gray-700/30 hover:bg-white/30 dark:hover:bg-gray-800/30"
              >
                <UserIcon className="w-4 h-4" />
                <span>Login</span>
              </Button>

              {/* Start for Free */}
              <Button
                size="sm"
                className="hidden sm:flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                <SparklesIcon className="w-4 h-4" />
                <span>Start for Free</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div 
          ref={menuRef}
          className={cn(
            "md:hidden transition-all duration-300 ease-out overflow-hidden",
            isMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-white/20 dark:border-gray-800/20">
            <div className="px-6 py-4 space-y-3">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all duration-300"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
              
              {/* Mobile Action Buttons */}
              <div className="pt-4 border-t border-white/20 dark:border-gray-800/20 space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-center bg-white/20 dark:bg-gray-800/20 backdrop-blur-sm border-white/30 dark:border-gray-700/30"
                >
                  <UserIcon className="w-4 h-4 mr-2" />
                  Login
                </Button>
                
                <Button
                  className="w-full justify-center bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                >
                  <SparklesIcon className="w-4 h-4 mr-2" />
                  Start for Free
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Compare Floating Button */}
      {compareList.length > 0 && <CompareFloatingButton />}

      {/* NO SPACER - Hero section will handle the spacing */}
    </>
  );
}
