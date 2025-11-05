import React from 'react';
import { 
  CogIcon, 
  BeakerIcon, 
  DocumentTextIcon, 
  ShieldCheckIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { cn } from '../../utils/cn';

interface ScannerProcessingProps {
  status: string;
  progress: number;
  previewUrl?: string | null;
}

const processingSteps = [
  { id: 1, label: 'OCR Engine', icon: DocumentTextIcon, threshold: 10 },
  { id: 2, label: 'Text Extraction', icon: CogIcon, threshold: 30 },
  { id: 3, label: 'AI Parsing', icon: BeakerIcon, threshold: 50 },
  { id: 4, label: 'Database Matching', icon: BeakerIcon, threshold: 70 },
  { id: 5, label: 'Safety Analysis', icon: ShieldCheckIcon, threshold: 90 },
  { id: 6, label: 'Complete', icon: CheckCircleIcon, threshold: 100 }
];

export function ScannerProcessing({ status, progress, previewUrl }: ScannerProcessingProps) {
  return (
    <>
      {/* CSS Animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes scan {
            0% { top: 0%; opacity: 0; }
            50% { opacity: 1; }
            100% { top: 90%; opacity: 0; }
          }
          
          @keyframes shimmer {
            0% { transform: translateX(-100%) skewX(12deg); }
            100% { transform: translateX(300%) skewX(12deg); }
          }
          
          .animate-shimmer {
            animation: shimmer 2s infinite;
          }
        `
      }} />

      <div className="p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-gradient-to-r from-primary-100 to-secondary-100 dark:from-primary-900/50 dark:to-secondary-900/50 rounded-2xl mb-4">
            <CogIcon className="w-8 h-8 text-primary-600 dark:text-primary-400 animate-spin" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Analyzing Your Supplement
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Our AI is processing the label and matching ingredients...
          </p>
        </div>

        {/* Preview Image */}
        {previewUrl && (
          <div className="mb-8">
            <div className="aspect-[16/9] bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 relative">
              <img
                src={previewUrl}
                alt="Processing supplement label"
                className="w-full h-full object-contain"
              />
              
              {/* Processing overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              
              {/* Scanning animation */}
              <div className="absolute inset-0 overflow-hidden">
                <div 
                  className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent animate-pulse" 
                  style={{ 
                    animation: 'scan 2s ease-in-out infinite',
                    top: `${Math.min(90, progress)}%`
                  }} 
                />
              </div>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {status}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {Math.round(progress)}%
            </span>
          </div>
          
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary-600 to-secondary-600 rounded-full transition-all duration-500 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              {/* Animated shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 animate-shimmer" />
            </div>
          </div>
        </div>

        {/* Processing Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {processingSteps.map((step) => {
            const Icon = step.icon;
            const isActive = progress >= step.threshold - 20 && progress < step.threshold + 10;
            const isComplete = progress >= step.threshold;
            
            return (
              <div
                key={step.id}
                className={cn(
                  "flex items-center space-x-3 p-4 rounded-xl border-2 transition-all duration-300",
                  isComplete 
                    ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" 
                    : isActive 
                      ? "bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800"
                      : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
                )}
              >
                <div className={cn(
                  "p-2 rounded-lg transition-all duration-300",
                  isComplete 
                    ? "bg-green-100 dark:bg-green-900/50" 
                    : isActive 
                      ? "bg-primary-100 dark:bg-primary-900/50"
                      : "bg-gray-100 dark:bg-gray-800"
                )}>
                  <Icon className={cn(
                    "w-5 h-5 transition-all duration-300",
                    isComplete 
                      ? "text-green-600 dark:text-green-400" 
                      : isActive 
                        ? "text-primary-600 dark:text-primary-400 animate-pulse"
                        : "text-gray-400 dark:text-gray-600"
                  )} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className={cn(
                    "font-medium text-sm transition-colors duration-300",
                    isComplete 
                      ? "text-green-800 dark:text-green-300" 
                      : isActive 
                        ? "text-primary-800 dark:text-primary-300"
                        : "text-gray-600 dark:text-gray-400"
                  )}>
                    {step.label}
                  </h4>
                  <div className={cn(
                    "text-xs mt-1 transition-colors duration-300",
                    isComplete 
                      ? "text-green-600 dark:text-green-400" 
                      : isActive 
                        ? "text-primary-600 dark:text-primary-400"
                        : "text-gray-400 dark:text-gray-500"
                  )}>
                    {isComplete ? 'Complete' : isActive ? 'Processing...' : 'Waiting'}
                  </div>
                </div>
                
                {isComplete && (
                  <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {/* Fun facts while processing */}
        <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <div className="text-center">
            <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
              💡 Did you know?
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-400">
              Our AI can recognize over 1,000 different supplement ingredients and cross-reference them with 
              your database of 767 researched compounds to provide instant safety and efficacy insights.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
