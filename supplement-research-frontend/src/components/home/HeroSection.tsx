import React, { useEffect, useState } from 'react';
import { ArrowRightIcon, BeakerIcon, ChartBarIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';
import { SearchBar } from '../search/SearchBar';
import { Badge } from '../ui/Badge';
import { useNavigate } from 'react-router-dom';
import { compoundService } from '../../services/api';
import { SparklesIcon } from '@heroicons/react/24/outline';

interface StatsData {
  total_compounds: number;
  total_studies: number;
  total_with_studies: number;
  categories: Record<string, number>;
}

export function HeroSection() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await compoundService.getStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        // Fallback stats
        setStats({
          total_compounds: 767,
          total_studies: 25000,
          total_with_studies: 417,
          categories: {
            supplement: 245,
            nootropic: 156,
            sarm: 89,
            peptide: 127,
            other: 150
          }
        });
      }
    };

    fetchStats();
  }, []);

  const trustIndicators = [
    {
      icon: ShieldCheckIcon,
      title: 'Evidence-Based',
      description: 'GRADE methodology for evidence evaluation'
    },
    {
      icon: BeakerIcon,
      title: 'AI-Powered',
      description: 'Intelligent summaries from peer-reviewed research'
    },
    {
      icon: ChartBarIcon,
      title: 'Citation-Backed',
      description: 'Every claim linked to original studies'
    }
  ];

  return (
    <div className="relative isolate overflow-hidden bg-gradient-to-br from-white via-primary-50/30 to-secondary-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Background Pattern */}
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary-400 to-secondary-600 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
      </div>
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl py-16 sm:py-24 lg:py-32">
          {/* Main Content */}
          <div className="text-center">
            {/* Badge */}
            <div className="mb-8 flex justify-center">
              <Badge variant="outline" className="px-4 py-2 text-sm">
                <BeakerIcon className="mr-2 h-4 w-4" />
                Evidence-Based Supplement Research
              </Badge>
            </div>

            {/* Headline */}
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl lg:text-7xl">
              Unlock the Science Behind{' '}
              <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                Every Supplement
              </span>
            </h1>

            {/* Subheading */}
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300 sm:text-xl">
              Access AI-powered research summaries for{' '}
              <span className="font-semibold text-primary-600 dark:text-primary-400">
                {stats?.total_compounds || 767} compounds
              </span>{' '}
              backed by{' '}
              <span className="font-semibold text-secondary-600 dark:text-secondary-400">
                {stats ? (stats.total_studies / 1000).toFixed(0) : 25}K+ studies
              </span>
              . Make informed decisions with citation-backed evidence.
            </p>

            {/* Search Bar */}
            <div className="mt-10 mx-auto max-w-2xl">
              <SearchBar 
                placeholder="Search compounds, nootropics, SARMs, peptides..."
                className="text-lg"
                autoFocus={false}
              />
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                Try searching for "creatine", "ashwagandha", or "omega-3"
              </p>
            </div>

            {/* Action Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => navigate('/browse')}
                className="text-base px-8 py-3"
              >
                Browse All Compounds
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => navigate('/stack-builder')}
                className="text-base px-8 py-3"
              >
                <SparklesIcon className="mr-2 h-5 w-5 text-blue-500" />
                AI Stack Builder
              </Button>
            </div>

            {/* Stats */}
            {stats && (
              <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
                    {stats.total_compounds}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Compounds</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
                    {(stats.total_studies / 1000).toFixed(0)}K+
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Studies</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
                    {stats.total_with_studies}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">With Research</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
                    A-D
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">GRADE Ratings</div>
                </div>
              </div>
            )}
          </div>

          {/* Trust Indicators */}
          <div className="mt-20">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Trusted by Researchers & Practitioners
              </h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Our rigorous methodology ensures accurate, evidence-based information
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
              {trustIndicators.map((indicator, index) => (
                <div key={index} className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900">
                    <indicator.icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                    {indicator.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {indicator.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Background Pattern */}
      <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]">
        <div className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-secondary-400 to-primary-600 opacity-20 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]" />
      </div>
    </div>
  );
}
