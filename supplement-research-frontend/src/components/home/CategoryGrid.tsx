import React from 'react';
import { Link } from 'react-router-dom';
import {
  BeakerIcon,
  CubeIcon,
  SparklesIcon,
  BoltIcon,
  HeartIcon,
  ShieldCheckIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';
import { Card, CardContent } from '../ui/Card';
import { cn } from '../../utils/cn';

const categories = [
  {
    id: 'supplement',
    name: 'Supplements',
    description: 'General health and wellness supplements',
    icon: BeakerIcon,
    count: 245,
    color: 'blue',
    gradient: 'from-blue-500 to-blue-600',
    bgGradient: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20',
    borderColor: 'border-blue-200 dark:border-blue-700',
    iconBg: 'bg-blue-100 dark:bg-blue-900/50',
    iconColor: 'text-blue-600 dark:text-blue-400',
    hoverGradient: 'hover:from-blue-100 hover:to-blue-150 dark:hover:from-blue-900/30 dark:hover:to-blue-800/30'
  },
  {
    id: 'nootropic',
    name: 'Nootropics',
    description: 'Cognitive enhancement compounds',
    icon: SparklesIcon,
    count: 156,
    color: 'purple',
    gradient: 'from-purple-500 to-purple-600',
    bgGradient: 'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20',
    borderColor: 'border-purple-200 dark:border-purple-700',
    iconBg: 'bg-purple-100 dark:bg-purple-900/50',
    iconColor: 'text-purple-600 dark:text-purple-400',
    hoverGradient: 'hover:from-purple-100 hover:to-purple-150 dark:hover:from-purple-900/30 dark:hover:to-purple-800/30'
  },
  {
    id: 'sarm',
    name: 'SARMs',
    description: 'Selective Androgen Receptor Modulators',
    icon: BoltIcon,
    count: 89,
    color: 'orange',
    gradient: 'from-orange-500 to-orange-600',
    bgGradient: 'from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20',
    borderColor: 'border-orange-200 dark:border-orange-700',
    iconBg: 'bg-orange-100 dark:bg-orange-900/50',
    iconColor: 'text-orange-600 dark:text-orange-400',
    hoverGradient: 'hover:from-orange-100 hover:to-orange-150 dark:hover:from-orange-900/30 dark:hover:to-orange-800/30'
  },
  {
    id: 'peptide',
    name: 'Peptides',
    description: 'Bioactive peptide compounds',
    icon: CubeIcon,
    count: 127,
    color: 'green',
    gradient: 'from-green-500 to-green-600',
    bgGradient: 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20',
    borderColor: 'border-green-200 dark:border-green-700',
    iconBg: 'bg-green-100 dark:bg-green-900/50',
    iconColor: 'text-green-600 dark:text-green-400',
    hoverGradient: 'hover:from-green-100 hover:to-green-150 dark:hover:from-green-900/30 dark:hover:to-green-800/30'
  },
  {
    id: 'herb',
    name: 'Herbs',
    description: 'Traditional herbal supplements',
    icon: HeartIcon,
    count: 95,
    color: 'emerald',
    gradient: 'from-emerald-500 to-emerald-600',
    bgGradient: 'from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20',
    borderColor: 'border-emerald-200 dark:border-emerald-700',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    hoverGradient: 'hover:from-emerald-100 hover:to-emerald-150 dark:hover:from-emerald-900/30 dark:hover:to-emerald-800/30'
  },
  {
    id: 'vitamin',
    name: 'Vitamins & Minerals',
    description: 'Essential vitamins and minerals',
    icon: ShieldCheckIcon,
    count: 55,
    color: 'yellow',
    gradient: 'from-yellow-500 to-yellow-600',
    bgGradient: 'from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20',
    borderColor: 'border-yellow-200 dark:border-yellow-700',
    iconBg: 'bg-yellow-100 dark:bg-yellow-900/50',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    hoverGradient: 'hover:from-yellow-100 hover:to-yellow-150 dark:hover:from-yellow-900/30 dark:hover:to-yellow-800/30'
  },
];

export function CategoryGrid() {
  return (
    <section className="py-16 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-primary-100 to-secondary-100 dark:from-primary-900/50 dark:to-secondary-900/50 rounded-2xl mb-6">
            <BeakerIcon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Explore by Category
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Browse compounds organized by their primary use and classification
          </p>
          <div className="mt-6 w-24 h-1 bg-gradient-to-r from-primary-600 to-secondary-600 mx-auto rounded-full"></div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Link 
                key={category.id} 
                to={`/browse?category=${category.id}`}
                className="group block h-full"
              >
                <Card className={cn(
                  "h-full transition-all duration-300 transform group-hover:scale-105 group-hover:shadow-2xl cursor-pointer border-2",
                  `bg-gradient-to-br ${category.bgGradient}`,
                  category.borderColor,
                  category.hoverGradient,
                  "relative overflow-hidden"
                )}>
                  {/* Background pattern */}
                  <div className="absolute inset-0 opacity-5">
                    <div className="absolute inset-0" style={{
                      backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
                      backgroundSize: '20px 20px'
                    }}></div>
                  </div>
                  
                  {/* Hover glow effect */}
                  <div className={cn(
                    "absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300",
                    `bg-gradient-to-br ${category.gradient}`
                  )}></div>
                  
                  <CardContent className="p-8 relative z-10">
                    <div className="flex items-start justify-between mb-6">
                      <div className={cn(
                        "p-4 rounded-2xl transition-all duration-300 group-hover:scale-110",
                        category.iconBg
                      )}>
                        <Icon className={cn("w-8 h-8", category.iconColor)} />
                      </div>
                      
                      <div className="text-right">
                        <div className={cn(
                          "text-3xl font-bold transition-colors duration-300",
                          category.iconColor
                        )}>
                          {category.count}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                          compounds
                        </div>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-gray-800 dark:group-hover:text-gray-100 transition-colors">
                      {category.name}
                    </h3>
                    
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-6">
                      {category.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className={cn(
                        "px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300",
                        `bg-gradient-to-r ${category.gradient} text-white opacity-90 group-hover:opacity-100`
                      )}>
                        Explore Collection
                      </div>
                      
                      <ArrowTopRightOnSquareIcon className={cn(
                        "w-5 h-5 transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1",
                        category.iconColor
                      )} />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Database updated in real-time</span>
            <span>•</span>
            <span>Evidence-based research</span>
            <span>•</span>
            <span>Expert curated</span>
          </div>
        </div>
      </div>
    </section>
  );
}
