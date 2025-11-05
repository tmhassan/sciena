import React from 'react';
import { Link } from 'react-router-dom';
import { 
  BeakerIcon,
  ChartBarIcon,
  SparklesIcon,
  CameraIcon,
  HeartIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

const footerNavigation = {
  platform: [
    { name: 'Browse Compounds', href: '/browse', icon: BeakerIcon },
    { name: 'Compare', href: '/compare', icon: ChartBarIcon },
    { name: 'Stack Builder', href: '/stack-builder', icon: SparklesIcon },
    { name: 'Scanner', href: '/scanner', icon: CameraIcon },
  ],
  resources: [
    { name: 'Documentation', href: '/docs' },
    { name: 'Research Methodology', href: '/methodology' },
    { name: 'Evidence Grading', href: '/grading' },
    { name: 'API Reference', href: '/api' },
  ],
  company: [
    { name: 'About', href: '/about' },
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Contact', href: '/contact' },
  ],
};

export function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="lg:col-span-1">
            {/* Simplified Logo - No Icon */}
            <Link to="/" className="inline-block group mb-6">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-200">
                sciena
              </h1>
              <p className="text-xs text-gray-600 dark:text-gray-400 -mt-1">
                Research Platform
              </p>
            </Link>
            
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-6">
              The most comprehensive supplement research platform with evidence-based insights, 
              AI-powered analysis, and advanced comparison tools.
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="text-lg font-bold text-primary-600 dark:text-primary-400">767+</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Compounds</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="text-lg font-bold text-secondary-600 dark:text-secondary-400">AI</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Powered</div>
              </div>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">
              Platform
            </h3>
            <ul className="space-y-3">
              {footerNavigation.platform.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 group"
                    >
                      <Icon className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                      <span className="text-sm">{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">
              Resources
            </h3>
            <ul className="space-y-3">
              {footerNavigation.resources.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 text-sm"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">
              Company
            </h3>
            <ul className="space-y-3">
              {footerNavigation.company.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 text-sm"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar - Fixed Layout */}
      <div className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Desktop Layout */}
          <div className="hidden md:flex items-center justify-between">
            {/* Left: Copyright */}
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <span>© {new Date().getFullYear()}</span>
              <span className="font-semibold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                sciena
              </span>
              <span>• All rights reserved</span>
            </div>

            {/* Center: Version */}
            <div className="text-xs text-gray-500 dark:text-gray-500">
              <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full">
                v1.0.0
              </span>
            </div>

            {/* Right: Made with love */}
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <span>Made with</span>
              <HeartIcon className="w-4 h-4 text-red-500 animate-pulse" />
              <span>for supplement research</span>
              <GlobeAltIcon className="w-4 h-4 ml-2" />
            </div>
          </div>

          {/* Mobile Layout - Stacked */}
          <div className="md:hidden space-y-4">
            {/* Copyright - Top */}
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <span>© {new Date().getFullYear()}</span>
              <span className="font-semibold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                Sciena
              </span>
              <span>• All rights reserved</span>
            </div>

            {/* Version - Center */}
            <div className="flex justify-center">
              <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-xs">
                v1.0.0
              </span>
            </div>

            {/* Made with love - Bottom */}
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <span>Made with</span>
              <HeartIcon className="w-4 h-4 text-red-500 animate-pulse" />
              <span>for supplement research</span>
              <GlobeAltIcon className="w-4 h-4 ml-2" />
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Bottom Gradient */}
      <div className="h-1 bg-gradient-to-r from-primary-600 via-secondary-600 to-primary-600" />
    </footer>
  );
}
