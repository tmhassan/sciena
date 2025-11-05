import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon,
  ArrowTopRightOnSquareIcon,
  BeakerIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  ChartBarIcon,
  PlusIcon,
  ShareIcon,
  ArrowPathIcon,
  SparklesIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ScanResult } from '../../types/scanner';
import { cn } from '../../utils/cn';
import { formatSafetyRating } from '../../utils/formatters';
import { AIResearchModal } from './AIResearchModal';

interface ScannerResultsProps {
  result: ScanResult;
  onStartNewScan: () => void;
  previewUrl?: string | null;
}

export function ScannerResults({ result, onStartNewScan, previewUrl }: ScannerResultsProps) {
  const [showRawText, setShowRawText] = useState(false);
  const [activeTab, setActiveTab] = useState<'ingredients' | 'safety' | 'recommendations'>('ingredients');
  const [researchModalOpen, setResearchModalOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<any>(null);

  const getRiskLevelColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
      case 'moderate': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30';
      case 'high': return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30';
    }
  };

  const matchedIngredients = result.matches.filter(m => m.confidence > 0.5);
  const unmatchedIngredients = result.matches.filter(m => m.confidence <= 0.5);

  const handleLearnMore = (match: any) => {
    // Find the original ingredient from the parsed ingredients
    const originalIngredient = result.ingredients.find(ing => 
      ing.name.toLowerCase() === match.ingredient_name.toLowerCase()
    );
    
    if (originalIngredient) {
      setSelectedIngredient(originalIngredient);
      setResearchModalOpen(true);
    }
  };

  return (
    <div className="max-h-[80vh] overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-green-100 to-green-200 dark:from-green-900/50 dark:to-green-800/50 rounded-xl">
              <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Scan Complete
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {result.ingredients.length} ingredients found • {Math.round(result.confidence_score)}% confidence
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRawText(!showRawText)}
              className="flex items-center space-x-2"
            >
              <DocumentTextIcon className="w-4 h-4" />
              <span>{showRawText ? 'Hide' : 'Show'} Raw Text</span>
            </Button>
            
            <Button
              onClick={onStartNewScan}
              className="flex items-center space-x-2 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white"
            >
              <ArrowPathIcon className="w-4 h-4" />
              <span>New Scan</span>
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {result.ingredients.length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Ingredients</div>
          </div>
          
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {matchedIngredients.length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Matched</div>
          </div>
          
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className={cn("text-2xl font-bold", getRiskLevelColor(result.safety_analysis.risk_level))}>
              {result.safety_analysis.risk_level.toUpperCase()}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Risk Level</div>
          </div>
          
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {result.safety_analysis.interactions.length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Interactions</div>
          </div>
        </div>
      </div>

      {/* Raw Text Display */}
      {showRawText && (
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <Card className="border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Extracted Text (OCR)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg max-h-40 overflow-y-auto">
                {result.extracted_text}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Image Preview */}
      {previewUrl && (
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="aspect-[16/9] bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700">
            <img
              src={previewUrl}
              alt="Scanned supplement label"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}

      {/* Content Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex space-x-8 px-6">
          {[
            { id: 'ingredients', label: 'Ingredients', icon: BeakerIcon },
            { id: 'safety', label: 'Safety Analysis', icon: ShieldCheckIcon },
            { id: 'recommendations', label: 'Recommendations', icon: InformationCircleIcon }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center space-x-2 py-4 border-b-2 transition-colors duration-200",
                  activeTab === tab.id
                    ? "border-primary-500 text-primary-600 dark:text-primary-400"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'ingredients' && (
          <div className="space-y-6">
            {/* Matched Ingredients */}
            {matchedIngredients.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
                  Matched Ingredients ({matchedIngredients.length})
                </h4>
                
                <div className="grid gap-4">
                  {matchedIngredients.map((match) => (
                    <Card key={match.id} className="border border-gray-200 dark:border-gray-700">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h5 className="font-medium text-gray-900 dark:text-white">
                                {match.compound_name || match.ingredient_name}
                              </h5>
                              <Badge 
                                variant={`safety-${match.safety_rating?.toLowerCase()}` as any}
                                className="text-xs"
                              >
                                {match.safety_rating}
                              </Badge>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {Math.round(match.confidence * 100)}% match
                              </div>
                            </div>
                            
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              Category: {match.compound_category || 'Unknown'}
                              {match.matched_synonyms.length > 0 && (
                                <span className="ml-2">
                                  • Also known as: {match.matched_synonyms.join(', ')}
                                </span>
                              )}
                            </div>
                            
                            {match.dosage_analysis && (
                              <div className="text-sm">
                                <span className={cn(
                                  "px-2 py-1 rounded-full text-xs font-medium",
                                  match.dosage_analysis.status === 'normal' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                  match.dosage_analysis.status === 'excessive' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                                  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                )}>
                                  {match.dosage_analysis.message}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {match.research_url && (
                            <Link
                              to={match.research_url}
                              className="flex items-center space-x-1 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm"
                            >
                              <span>Research</span>
                              <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                            </Link>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Unmatched Ingredients - Enhanced with AI Research */}
            {unmatchedIngredients.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <SparklesIcon className="w-5 h-5 text-purple-500 mr-2" />
                  Unknown Ingredients ({unmatchedIngredients.length})
                </h4>
                
                <div className="grid gap-3">
                  {unmatchedIngredients.map((match) => (
                    <Card 
                      key={match.id}
                      className="border border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h5 className="font-medium text-gray-900 dark:text-white">
                                {match.ingredient_name}
                              </h5>
                              <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 text-xs">
                                Unknown
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Not found in our database, but our AI can research it for you!
                            </p>
                          </div>
                          
                          <Button
                            onClick={() => handleLearnMore(match)}
                            className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                          >
                            <SparklesIcon className="w-4 h-4" />
                            <span>Learn More</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="flex items-start space-x-3">
                    <SparklesIcon className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h5 className="font-medium text-purple-900 dark:text-purple-300 mb-1">
                        AI-Powered Research Available
                      </h5>
                      <p className="text-sm text-purple-800 dark:text-purple-400">
                        Click "Learn More" on any unknown ingredient to get instant AI-powered research including 
                        benefits, safety information, dosage recommendations, and potential interactions.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'safety' && (
          <div className="space-y-6">
            {/* Overall Risk Assessment */}
            <Card className={cn(
              "border-2",
              result.safety_analysis.risk_level === 'low' ? 'border-green-200 dark:border-green-800' :
              result.safety_analysis.risk_level === 'moderate' ? 'border-yellow-200 dark:border-yellow-800' :
              'border-red-200 dark:border-red-800'
            )}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ShieldCheckIcon className={cn(
                    "w-6 h-6",
                    result.safety_analysis.risk_level === 'low' ? 'text-green-600 dark:text-green-400' :
                    result.safety_analysis.risk_level === 'moderate' ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-red-600 dark:text-red-400'
                  )} />
                  <span>Overall Risk Assessment</span>
                  <Badge className={cn(
                    "ml-auto",
                    getRiskLevelColor(result.safety_analysis.risk_level)
                  )}>
                    {result.safety_analysis.risk_level.toUpperCase()} RISK
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {result.safety_analysis.warnings.length > 0 && (
                  <div className="space-y-2">
                    {result.safety_analysis.warnings.map((warning, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{warning}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Interactions */}
            {result.safety_analysis.interactions.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-2" />
                  Potential Interactions ({result.safety_analysis.interactions.length})
                </h4>
                
                <div className="space-y-3">
                  {result.safety_analysis.interactions.map((interaction) => (
                    <Card key={interaction.id} className="border-red-200 dark:border-red-800">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h5 className="font-medium text-gray-900 dark:text-white">
                            {interaction.compound1_name} + {interaction.compound2_name}
                          </h5>
                          <Badge 
                            className={cn(
                              interaction.severity === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                              interaction.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                            )}
                          >
                            {interaction.severity} severity
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {interaction.description}
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                          💡 {interaction.recommendation}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="space-y-4">
            {result.recommendations.map((recommendation, index) => (
              <div 
                key={index}
                className="flex items-start space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
              >
                <InformationCircleIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-blue-800 dark:text-blue-300">{recommendation}</span>
              </div>
            ))}
            
            {result.safety_analysis.recommendations.map((recommendation, index) => (
              <div 
                key={`safety-${index}`}
                className="flex items-start space-x-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
              >
                <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-green-800 dark:text-green-300">{recommendation}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            className="flex-1 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Add to Stack Builder
          </Button>
          
          <Button variant="outline" className="flex-1">
            <ShareIcon className="w-4 h-4 mr-2" />
            Share Results
          </Button>
          
          <Button variant="outline" onClick={onStartNewScan}>
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            Scan Another
          </Button>
        </div>
      </div>

      {/* AI Research Modal */}
      {selectedIngredient && (
        <AIResearchModal
          ingredient={selectedIngredient}
          isOpen={researchModalOpen}
          onClose={() => {
            setResearchModalOpen(false);
            setSelectedIngredient(null);
          }}
        />
      )}
    </div>
  );
}
