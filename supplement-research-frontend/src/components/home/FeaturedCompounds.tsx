import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRightIcon, 
  BeakerIcon, 
  AcademicCapIcon,
  ShieldCheckIcon,
  CheckBadgeIcon,
  SparklesIcon,
  ArrowTopRightOnSquareIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { CompareButton } from '../ui/CompareButton';
import { compoundService } from '../../services/api';
import { Compound } from '../../types/compound';
import { formatSafetyRating, formatCompoundCategory } from '../../utils/formatters';
import { cn } from '../../utils/cn';

export function FeaturedCompounds() {
  const [compounds, setCompounds] = useState<Compound[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        setError(null);
        const data = await compoundService.getFeatured();
        setCompounds(data);
        console.log('Featured compounds loaded:', data);
      } catch (error) {
        console.error('Failed to fetch featured compounds:', error);
        setError('Failed to load featured compounds');
        setCompounds([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeatured();
  }, []);

  // Helper function to determine legal status display
  const getLegalStatusDisplay = (legalStatus: string | undefined) => {
    const status = legalStatus?.toLowerCase() || 'unknown';
    
    if (status === 'legal' || status === 'otc' || status.includes('otc')) {
      return {
        color: 'green',
        icon: <CheckBadgeIcon className="w-4 h-4" />,
        text: 'Legal',
        description: 'Over-the-counter availability',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        textColor: 'text-green-700 dark:text-green-300'
      };
    } else if (status === 'prescription' || status === 'prescription_only' || status.includes('prescription')) {
      return {
        color: 'blue',
        icon: <ShieldCheckIcon className="w-4 h-4" />,
        text: 'Prescription',
        description: 'Requires medical prescription',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        textColor: 'text-blue-700 dark:text-blue-300'
      };
    } else if (status === 'research_only' || status === 'research chemical' || status.includes('research')) {
      return {
        color: 'yellow',
        icon: <AcademicCapIcon className="w-4 h-4" />,
        text: 'Research Only',
        description: 'For research purposes only',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
        textColor: 'text-yellow-700 dark:text-yellow-300'
      };
    } else {
      return {
        color: 'gray',
        icon: <ShieldCheckIcon className="w-4 h-4" />,
        text: status.charAt(0).toUpperCase() + status.slice(1),
        description: 'Status varies',
        bgColor: 'bg-gray-100 dark:bg-gray-900/30',
        textColor: 'text-gray-700 dark:text-gray-300'
      };
    }
  };

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <Card className="h-full animate-pulse border-2 border-gray-200 dark:border-gray-700">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-2 flex-1">
            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
          <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
        </div>
        <div className="space-y-3">
          <div className="flex space-x-2">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
          </div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <section className="py-16 bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-primary-100 to-secondary-100 dark:from-primary-900/50 dark:to-secondary-900/50 rounded-2xl mb-6">
              <SparklesIcon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="flex items-center justify-center space-x-2 mb-4">
              <AcademicCapIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              <span className="text-sm font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wider">Most Researched</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Featured Compounds
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Discover the most well-researched supplements with comprehensive evidence
            </p>
            <div className="mt-6 w-24 h-1 bg-gradient-to-r from-primary-600 to-secondary-600 mx-auto rounded-full"></div>
          </div>

          {/* Loading Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <LoadingSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-2xl inline-block mb-6">
              <BeakerIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Unable to Load Featured Compounds
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error}. Please try refreshing the page.
            </p>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-primary-100 to-secondary-100 dark:from-primary-900/50 dark:to-secondary-900/50 rounded-2xl mb-6">
            <SparklesIcon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          </div>
          <div className="flex items-center justify-center space-x-2 mb-4">
            <AcademicCapIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            <span className="text-sm font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wider">Most Researched</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Featured Compounds
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Discover the most well-researched supplements with comprehensive evidence
          </p>
          <div className="mt-6 w-24 h-1 bg-gradient-to-r from-primary-600 to-secondary-600 mx-auto rounded-full"></div>
        </div>

        {/* Compounds Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {compounds.map((compound, index) => {
            const legalStatusDisplay = getLegalStatusDisplay(compound.legal_status);
            
            return (
              <div key={compound.id} className="group relative">
                {/* Featured badge for first compound */}
                {index === 0 && (
                  <div className="absolute -top-3 -right-3 z-20">
                    <div className="flex items-center space-x-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                      <StarIcon className="w-3 h-3" />
                      <span>Top Pick</span>
                    </div>
                  </div>
                )}
                
                <Card className={cn(
                  "h-full transition-all duration-300 transform group-hover:scale-105 group-hover:shadow-2xl cursor-pointer border-2 border-gray-200 dark:border-gray-700",
                  "bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900",
                  "hover:border-primary-300 dark:hover:border-primary-600",
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
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-secondary-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <CardContent className="p-6 relative z-10">
                    <Link to={`/compound/${compound.id}`} className="block">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2">
                            {compound.name}
                          </h3>
                          {compound.synonyms && compound.synonyms.length > 0 && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 italic mb-3">
                              aka {compound.synonyms[0]}
                            </p>
                          )}
                        </div>
                        
                        <ArrowTopRightOnSquareIcon className="w-5 h-5 text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 flex-shrink-0" />
                      </div>

                      <div className="space-y-3 mb-6">
                        <div className="flex flex-wrap gap-2">
                          <Badge 
                            variant={`safety-${compound.safety_rating?.toLowerCase()}` as any}
                            className="text-xs font-semibold"
                          >
                            {compound.safety_rating}
                          </Badge>
                          <Badge 
                            variant={`category-${compound.category}` as any}
                            className="text-xs"
                          >
                            {formatCompoundCategory(compound.category)}
                          </Badge>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Safety:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {formatSafetyRating(compound.safety_rating || 'Unknown')}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Status:</span>
                            <div className={cn(
                              "flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium",
                              legalStatusDisplay.bgColor,
                              legalStatusDisplay.textColor
                            )}>
                              {legalStatusDisplay.icon}
                              <span>{legalStatusDisplay.text}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>

                    {/* Compare Button - Fixed: Removed onClick prop and moved outside Link */}
                    <div className="flex items-center justify-between">
                      <CompareButton 
                        compound={compound} 
                        variant="text"
                        size="sm"
                        className="flex-1 mr-3"
                      />
                      
                      <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                        <BeakerIcon className="w-3 h-3" />
                        <span>Research</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-2xl p-8 text-center border border-primary-200 dark:border-primary-800">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Explore Our Complete Database
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
            Access detailed research, safety profiles, and evidence-based information for hundreds of compounds.
          </p>
          <Link to="/browse">
            <Button className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white px-8 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg">
              Browse All Compounds
              <ArrowRightIcon className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          
          <div className="mt-6 flex items-center justify-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>500+ Compounds</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Evidence-Based</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Expert Reviewed</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
