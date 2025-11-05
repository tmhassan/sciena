import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  BeakerIcon,
  ShieldCheckIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  StarIcon,
  DocumentTextIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Spinner } from '../ui/Spinner';
import { ParsedIngredient } from '../../types/scanner';
import { AIResearcher, AIResearchResult } from '../../services/scanner/aiResearcher';
import { cn } from '../../utils/cn';

interface AIResearchModalProps {
  ingredient: ParsedIngredient;
  isOpen: boolean;
  onClose: () => void;
}

export function AIResearchModal({ ingredient, isOpen, onClose }: AIResearchModalProps) {
  const [researchResult, setResearchResult] = useState<AIResearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'benefits' | 'safety' | 'dosage'>('overview');

  const aiResearcher = new AIResearcher();

  useEffect(() => {
    if (isOpen && !researchResult && !isLoading) {
      performResearch();
    }
  }, [isOpen, ingredient]);

  const performResearch = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await aiResearcher.researchIngredient(ingredient);
      setResearchResult(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const getSafetyColor = (rating: string) => {
    switch (rating) {
      case 'low': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
      case 'moderate': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30';
      case 'high': return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'vitamin': return '🔸';
      case 'mineral': return '⚡';
      case 'herb': return '🌿';
      case 'amino_acid': return '🧬';
      case 'nootropic': return '🧠';
      case 'probiotic': return '🦠';
      default: return '💊';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-4xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-primary-100 to-secondary-100 dark:from-primary-900/50 dark:to-secondary-900/50 rounded-xl">
                  <BeakerIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    AI Research: {ingredient.name}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Comprehensive ingredient analysis powered by AI
                  </p>
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="p-2"
              >
                <XMarkIcon className="w-5 h-5" />
              </Button>
            </div>

            {/* Tabs */}
            {researchResult && (
              <div className="flex space-x-6 mt-4">
                {[
                  { id: 'overview', label: 'Overview', icon: InformationCircleIcon },
                  { id: 'benefits', label: 'Benefits', icon: StarIcon },
                  { id: 'safety', label: 'Safety', icon: ShieldCheckIcon },
                  { id: 'dosage', label: 'Dosage', icon: ChartBarIcon }
                ].map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={cn(
                        "flex items-center space-x-2 pb-2 border-b-2 transition-colors duration-200",
                        activeTab === tab.id
                          ? "border-primary-500 text-primary-600 dark:text-primary-400"
                          : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="font-medium text-sm">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
            {isLoading && (
              <div className="p-12 text-center">
                <div className="inline-flex p-4 bg-gradient-to-r from-primary-100 to-secondary-100 dark:from-primary-900/50 dark:to-secondary-900/50 rounded-2xl mb-6">
                  <BeakerIcon className="w-8 h-8 text-primary-600 dark:text-primary-400 animate-pulse" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Researching {ingredient.name}...
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Our AI is analyzing scientific literature and supplement databases
                </p>
                <div className="flex items-center justify-center space-x-2">
                  <Spinner className="w-5 h-5" />
                  <span className="text-sm text-gray-500">This may take a few seconds</span>
                </div>
              </div>
            )}

            {error && (
              <div className="p-6">
                <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                  <CardContent className="p-6 text-center">
                    <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">
                      Research Failed
                    </h3>
                    <p className="text-red-700 dark:text-red-400 mb-4">{error}</p>
                    <Button
                      onClick={performResearch}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Try Again
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {researchResult && (
              <div className="p-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Basic Info */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <span className="text-2xl">{getCategoryIcon(researchResult.category)}</span>
                          <div>
                            <h3 className="text-lg font-semibold">{researchResult.ingredient_name}</h3>
                            <Badge className="mt-1 capitalize">{researchResult.category}</Badge>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                          {researchResult.description}
                        </p>
                        
                        {researchResult.common_names.length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                              Also known as:
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {researchResult.common_names.map((name, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Research Quality */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <DocumentTextIcon className="w-5 h-5" />
                          <span>Research Quality</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center space-x-4 mb-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Confidence:</span>
                            <div className="flex items-center space-x-1">
                              {[...Array(5)].map((_, i) => (
                                <StarIcon
                                  key={i}
                                  className={cn(
                                    "w-4 h-4",
                                    i < Math.round(researchResult.confidence_score * 5)
                                      ? "text-yellow-500 fill-current"
                                      : "text-gray-300 dark:text-gray-600"
                                  )}
                                />
                              ))}
                              <span className="text-sm ml-2">
                                {Math.round(researchResult.confidence_score * 100)}%
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {researchResult.research_notes}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Benefits Tab */}
                {activeTab === 'benefits' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                      <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
                      Potential Benefits
                    </h3>
                    
                    {researchResult.benefits.length > 0 ? (
                      <div className="space-y-3">
                        {researchResult.benefits.map((benefit, index) => (
                          <div 
                            key={index}
                            className="flex items-start space-x-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
                          >
                            <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-green-800 dark:text-green-300">{benefit}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                        No specific benefits documented in available research.
                      </p>
                    )}
                  </div>
                )}

                {/* Safety Tab */}
                {activeTab === 'safety' && (
                  <div className="space-y-6">
                    {/* Safety Rating */}
                    <Card className={cn(
                      "border-2",
                      researchResult.safety_profile.rating === 'low' ? 'border-green-200 dark:border-green-800' :
                      researchResult.safety_profile.rating === 'moderate' ? 'border-yellow-200 dark:border-yellow-800' :
                      'border-red-200 dark:border-red-800'
                    )}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <ShieldCheckIcon className="w-5 h-5" />
                            <span>Safety Profile</span>
                          </div>
                          <Badge className={getSafetyColor(researchResult.safety_profile.rating)}>
                            {researchResult.safety_profile.rating.toUpperCase()} RISK
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {/* Side Effects */}
                        {researchResult.side_effects.length > 0 && (
                          <div className="mb-4">
                            <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                              <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500 mr-2" />
                              Potential Side Effects
                            </h4>
                            <div className="space-y-2">
                              {researchResult.side_effects.map((effect, index) => (
                                <div key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start space-x-2">
                                  <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                                  <span>{effect}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Warnings */}
                        {researchResult.safety_profile.warnings.length > 0 && (
                          <div className="mb-4">
                            <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                              <ExclamationTriangleIcon className="w-4 h-4 text-red-500 mr-2" />
                              Important Warnings
                            </h4>
                            <div className="space-y-2">
                              {researchResult.safety_profile.warnings.map((warning, index) => (
                                <div key={index} className="text-sm text-red-700 dark:text-red-300 flex items-start space-x-2">
                                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                                  <span>{warning}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Contraindications */}
                        {researchResult.safety_profile.contraindications.length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                              Who Should Avoid:
                            </h4>
                            <div className="space-y-2">
                              {researchResult.safety_profile.contraindications.map((contra, index) => (
                                <div key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start space-x-2">
                                  <XMarkIcon className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                                  <span>{contra}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Interactions */}
                    {researchResult.interactions.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <ExclamationTriangleIcon className="w-5 h-5 text-orange-500" />
                            <span>Known Interactions</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {researchResult.interactions.map((interaction, index) => (
                              <div key={index} className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                                <span className="text-sm text-orange-800 dark:text-orange-300">{interaction}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {/* Dosage Tab */}
                {activeTab === 'dosage' && (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <ChartBarIcon className="w-5 h-5" />
                          <span>Dosage Information</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                              Typical Range
                            </h4>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                              {researchResult.dosage_info.typical_range}
                            </p>
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                              Recommended
                            </h4>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                              {researchResult.dosage_info.recommended_dose}
                            </p>
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                              Timing
                            </h4>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                              {researchResult.dosage_info.timing}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Current Dosage Comparison */}
                    {ingredient.dosage && ingredient.dosage.amount > 0 && (
                      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
                        <CardHeader>
                          <CardTitle className="text-blue-900 dark:text-blue-300">
                            Your Product Contains
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                            {ingredient.dosage.amount} {ingredient.dosage.unit}
                          </div>
                          <p className="text-sm text-blue-800 dark:text-blue-300">
                            Compare this with the recommended dosage above and consult a healthcare provider if needed.
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          {researchResult && (
            <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Research completed: {new Date(researchResult.last_updated).toLocaleString()}
                </div>
                <div className="flex space-x-3">
                  <Button variant="outline" onClick={onClose}>
                    Close
                  </Button>
                  <Button className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white">
                    Save Research
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
