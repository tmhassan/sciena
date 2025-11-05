import React from 'react';
import { Link } from 'react-router-dom';
import { 
  SparklesIcon, 
  ShieldCheckIcon, 
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ShareIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { useStackBuilder } from '../../../context/StackBuilderContext';
import { cn } from '../../../utils/cn';

export function StackResultsStep() {
  const { generatedStack, resetBuilder, isGenerating } = useStackBuilder();

  if (isGenerating) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="animate-spin h-16 w-16 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Analyzing Your Profile...
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Our AI is creating your personalized supplement stack based on your goals, 
          health profile, and preferences. This may take a few moments.
        </p>
      </div>
    );
  }

  if (!generatedStack) {
    return (
      <Card className="max-w-2xl mx-auto text-center">
        <CardContent className="py-16">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Stack Generation Failed
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            We encountered an issue generating your stack. Please try again.
          </p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const priorityOrder = { core: 0, beneficial: 1, optional: 2 };
  const sortedRecommendations = [...generatedStack.recommendations].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  // Map safety rating to valid badge variants
  const getSafetyBadgeVariant = (rating: string) => {
    switch (rating) {
      case 'excellent':
        return 'safety-excellent';
      case 'good':
        return 'safety-good';
      case 'moderate':
        return 'safety-moderate';
      case 'caution':
        return 'safety-poor'; // Map caution to poor since caution variant doesn't exist
      default:
        return 'safety-unknown';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20">
        <CardContent className="p-8">
          <div className="flex items-center gap-3 mb-4">
            <SparklesIcon className="h-8 w-8 text-primary-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Your Personalized Stack
            </h1>
          </div>
          
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
            Based on your goals and health profile, here's your AI-curated supplement stack.
          </p>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">
                {generatedStack.recommendations.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Supplements</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                ${generatedStack.total_cost_estimate}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Monthly Cost</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {generatedStack.confidence_score}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Confidence</div>
            </div>
            <div className="text-center">
              <Badge variant={getSafetyBadgeVariant(generatedStack.safety_rating)} className="text-sm">
                {generatedStack.safety_rating}
              </Badge>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Safety Rating</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Recommended Supplements
        </h2>
        
        {sortedRecommendations.map((rec, index) => (
          <Card key={rec.id} className="hover-lift">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {index + 1}. {rec.compound_name}
                    </h3>
                    <Badge variant={
                      rec.priority === 'core' ? 'default' :
                      rec.priority === 'beneficial' ? 'secondary' : 'outline'
                    }>
                      {rec.priority}
                    </Badge>
                    <Badge variant="outline">
                      {rec.evidence_level} evidence
                    </Badge>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-300 mb-3">
                    {rec.reasoning}
                  </p>

                  {/* Dosage */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Dosage:</span>
                        <span className="ml-2 text-gray-600 dark:text-gray-400">
                          {rec.dosage.amount} {rec.dosage.unit}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Frequency:</span>
                        <span className="ml-2 text-gray-600 dark:text-gray-400">
                          {rec.dosage.frequency}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Timing:</span>
                        <span className="ml-2 text-gray-600 dark:text-gray-400">
                          {rec.dosage.timing}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Safety Considerations */}
                  {rec.safety_considerations.length > 0 && (
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Safety Notes:
                      </h4>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        {rec.safety_considerations.map((note, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-yellow-500 mt-0.5">•</span>
                            {note}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Interactions */}
                  {rec.interactions.length > 0 && (
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">
                        Potential Interactions:
                      </h4>
                      <ul className="text-sm text-red-600 dark:text-red-400 space-y-1">
                        {rec.interactions.map((interaction, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <ExclamationTriangleIcon className="h-4 w-4 mt-0.5" />
                            {interaction}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="ml-6 text-right">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    ${rec.cost_estimate}
                  </div>
                  <div className="text-sm text-gray-500">per month</div>
                  <div className="mt-2">
                    <Link to={`/compound/${rec.compound_id}`}>
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Important Notes */}
      {(generatedStack.notes.length > 0 || generatedStack.contraindications.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheckIcon className="h-5 w-5" />
              Important Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            {generatedStack.notes.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  General Notes:
                </h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  {generatedStack.notes.map((note, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">•</span>
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {generatedStack.contraindications.length > 0 && (
              <div>
                <h4 className="font-medium text-red-700 dark:text-red-300 mb-2">
                  Contraindications:
                </h4>
                <ul className="text-sm text-red-600 dark:text-red-400 space-y-1">
                  {generatedStack.contraindications.map((contra, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <ExclamationTriangleIcon className="h-4 w-4 mt-0.5" />
                      {contra}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-4 justify-center pt-8">
        <Button size="lg" className="bg-gradient-to-r from-primary-600 to-secondary-600">
          <ArrowDownTrayIcon className="mr-2 h-5 w-5" />
          Download Stack
        </Button>
        <Button variant="outline" size="lg">
          <ShareIcon className="mr-2 h-5 w-5" />
          Share Stack
        </Button>
        <Button variant="outline" size="lg" onClick={resetBuilder}>
          <ArrowPathIcon className="mr-2 h-5 w-5" />
          Create New Stack
        </Button>
      </div>

      {/* Disclaimer */}
      <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Medical Disclaimer:</strong> This AI-generated stack is for informational purposes only 
              and should not replace professional medical advice. Always consult with a healthcare provider 
              before starting any new supplement regimen, especially if you have health conditions or take medications.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
