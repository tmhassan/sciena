import React from 'react';
import { ArrowLeftIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useStackBuilder } from '../../context/StackBuilderContext';
import { StepIndicator } from './StepIndicator';
import { BasicInfoStep } from './steps/BasicInfoStep';
import { HealthGoalsStep } from './steps/HealthGoalsStep';
import { HealthSafetyStep } from './steps/HealthSafetyStep';
import { PreferencesStep } from './steps/PreferencesStep';
import { StackResultsStep } from './steps/StackResultsStep';

export function StackBuilderWizard() {
  const { currentStep, setCurrentStep, resetBuilder } = useStackBuilder();

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <BasicInfoStep />;
      case 2:
        return <HealthGoalsStep />;
      case 3:
        return <HealthSafetyStep />;
      case 4:
        return <PreferencesStep />;
      case 5:
        return <StackResultsStep />;
      default:
        return <BasicInfoStep />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <section className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : window.history.back()}
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </Button>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <SparklesIcon className="h-6 w-6 text-primary-600" />
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    AI Stack Builder
                  </h1>
                  <Badge variant="default" className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white">
                    Beta
                  </Badge>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  Get personalized supplement recommendations powered by AI
                </p>
              </div>
            </div>
            
            {currentStep < 5 && (
              <Button variant="outline" onClick={resetBuilder}>
                Start Over
              </Button>
            )}
          </div>

          {/* Step Indicator */}
          <StepIndicator />
        </div>
      </section>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {renderStep()}
      </div>
    </div>
  );
}
