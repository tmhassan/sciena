import React from 'react';
import { CheckIcon } from '@heroicons/react/24/solid';
import { useStackBuilder } from '../../context/StackBuilderContext';
import { cn } from '../../utils/cn';

export function StepIndicator() {
  const { currentStep, steps } = useStackBuilder();

  return (
    <div className="w-full py-8">
      {/* Desktop Step Indicator */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between relative">
          {/* Background Progress Line */}
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 dark:bg-gray-700 transform -translate-y-1/2 z-0"></div>
          
          {/* Active Progress Line */}
          <div 
            className="absolute top-1/2 left-0 h-0.5 bg-gradient-to-r from-primary-600 to-secondary-600 transform -translate-y-1/2 z-10 transition-all duration-500 ease-out"
            style={{ 
              width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` 
            }}
          ></div>

          {steps.map((step, index) => (
            <div key={step.step} className="flex flex-col items-center relative z-20">
              {/* Step Circle */}
              <div className={cn(
                "w-12 h-12 rounded-full border-4 flex items-center justify-center transition-all duration-300",
                step.isComplete 
                  ? "bg-gradient-to-r from-primary-600 to-secondary-600 border-primary-600 text-white shadow-lg" 
                  : currentStep === step.step
                  ? "bg-white dark:bg-gray-800 border-primary-600 text-primary-600 shadow-lg ring-4 ring-primary-100 dark:ring-primary-900"
                  : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400"
              )}>
                {step.isComplete ? (
                  <CheckIcon className="w-6 h-6" />
                ) : (
                  <span className="text-sm font-semibold">{step.step}</span>
                )}
              </div>

              {/* Step Label */}
              <div className="mt-4 text-center max-w-32">
                <div className={cn(
                  "text-sm font-medium transition-colors",
                  step.isComplete 
                    ? "text-primary-600 dark:text-primary-400" 
                    : currentStep === step.step
                    ? "text-gray-900 dark:text-white"
                    : "text-gray-500 dark:text-gray-400"
                )}>
                  {step.title}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 hidden lg:block">
                  {step.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Step Indicator */}
      <div className="md:hidden">
        <div className="flex items-center mb-6">
          <div className="flex-1">
            <div className="flex items-center">
              {/* Current Step Circle */}
              <div className={cn(
                "w-10 h-10 rounded-full border-4 flex items-center justify-center",
                steps[currentStep - 1]?.isComplete 
                  ? "bg-gradient-to-r from-primary-600 to-secondary-600 border-primary-600 text-white" 
                  : "bg-white dark:bg-gray-800 border-primary-600 text-primary-600"
              )}>
                {steps[currentStep - 1]?.isComplete ? (
                  <CheckIcon className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-semibold">{currentStep}</span>
                )}
              </div>
              
              {/* Step Info */}
              <div className="ml-4 flex-1">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  Step {currentStep} of {steps.length}
                </div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {steps[currentStep - 1]?.title}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {steps[currentStep - 1]?.description}
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-4 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-primary-600 to-secondary-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(currentStep / steps.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
