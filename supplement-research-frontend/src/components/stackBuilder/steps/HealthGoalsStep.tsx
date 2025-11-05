import React, { useState } from 'react';
import { 
  CpuChipIcon, 
  HeartIcon, 
  MoonIcon, 
  ShieldCheckIcon,
  BoltIcon,
  ScaleIcon,
  SparklesIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { useStackBuilder } from '../../../context/StackBuilderContext';
import { HealthGoal } from '../../../types/stackBuilder';
import { cn } from '../../../utils/cn';

const availableGoals: HealthGoal[] = [
  {
    id: 'cognitive_performance',
    category: 'cognitive',
    name: 'Cognitive Performance',
    description: 'Improve focus, memory, and mental clarity',
    priority: 'medium',
    timeline: '3_months',
  },
  {
    id: 'physical_performance',
    category: 'physical',
    name: 'Physical Performance',
    description: 'Enhance strength, endurance, and athletic performance',
    priority: 'medium',
    timeline: '3_months',
  },
  {
    id: 'sleep_quality',
    category: 'sleep',
    name: 'Sleep Quality',
    description: 'Better sleep duration and quality',
    priority: 'medium',
    timeline: '1_month',
  },
  {
    id: 'stress_management',
    category: 'stress',
    name: 'Stress Management',
    description: 'Reduce stress and improve mood',
    priority: 'medium',
    timeline: '1_month',
  },
  {
    id: 'immune_support',
    category: 'immunity',
    name: 'Immune Support',
    description: 'Strengthen immune system and overall health',
    priority: 'medium',
    timeline: '3_months',
  },
  {
    id: 'weight_management',
    category: 'weight',
    name: 'Weight Management',
    description: 'Support healthy weight goals',
    priority: 'medium',
    timeline: '6_months',
  },
  {
    id: 'recovery',
    category: 'recovery',
    name: 'Recovery & Healing',
    description: 'Faster recovery from exercise and daily stress',
    priority: 'medium',
    timeline: '1_month',
  },
  {
    id: 'longevity',
    category: 'longevity',
    name: 'Longevity & Anti-aging',
    description: 'Support healthy aging and cellular health',
    priority: 'medium',
    timeline: '1_year',
  },
];

const goalIcons = {
  cognitive: CpuChipIcon,
  physical: BoltIcon,
  sleep: MoonIcon,
  stress: HeartIcon,
  immunity: ShieldCheckIcon,
  weight: ScaleIcon,
  recovery: SparklesIcon,
  longevity: ClockIcon,
};

const priorityColors = {
  low: 'text-gray-500',
  medium: 'text-yellow-500',
  high: 'text-red-500',
};

export function HealthGoalsStep() {
  const { selectedGoals, updateSelectedGoals, setCurrentStep, completeStep } = useStackBuilder();
  const [tempGoals, setTempGoals] = useState<HealthGoal[]>(selectedGoals);

  const toggleGoal = (goal: HealthGoal) => {
    setTempGoals(prev => {
      const exists = prev.find(g => g.id === goal.id);
      if (exists) {
        return prev.filter(g => g.id !== goal.id);
      } else {
        return [...prev, goal];
      }
    });
  };

  const updateGoalPriority = (goalId: string, priority: HealthGoal['priority']) => {
    setTempGoals(prev => prev.map(goal => 
      goal.id === goalId ? { ...goal, priority } : goal
    ));
  };

  const updateGoalTimeline = (goalId: string, timeline: HealthGoal['timeline']) => {
    setTempGoals(prev => prev.map(goal => 
      goal.id === goalId ? { ...goal, timeline } : goal
    ));
  };

  const handleNext = () => {
    if (tempGoals.length > 0) {
      updateSelectedGoals(tempGoals);
      completeStep(2, tempGoals);
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">What are your health goals?</CardTitle>
          <p className="text-gray-600 dark:text-gray-400">
            Select the areas you'd like to improve. You can adjust priority and timeline for each goal.
          </p>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableGoals.map((goal) => {
              const isSelected = tempGoals.some(g => g.id === goal.id);
              const selectedGoal = tempGoals.find(g => g.id === goal.id);
              const IconComponent = goalIcons[goal.category];
              
              return (
                <div
                  key={goal.id}
                  className={cn(
                    'p-4 rounded-lg border-2 cursor-pointer transition-all',
                    isSelected
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                  )}
                  onClick={() => toggleGoal(goal)}
                >
                  <div className="flex items-start gap-3">
                    <IconComponent className={cn(
                      'h-6 w-6 mt-0.5',
                      isSelected ? 'text-primary-600' : 'text-gray-400'
                    )} />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {goal.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {goal.description}
                      </p>
                      
                      {isSelected && (
                        <div className="mt-3 space-y-3">
                          {/* Priority */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Priority
                            </label>
                            <div className="flex gap-2">
                              {(['low', 'medium', 'high'] as const).map((priority) => (
                                <button
                                  key={priority}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateGoalPriority(goal.id, priority);
                                  }}
                                  className={cn(
                                    'px-2 py-1 text-xs rounded border',
                                    selectedGoal?.priority === priority
                                      ? 'border-primary-500 bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-200'
                                      : 'border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800'
                                  )}
                                >
                                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          {/* Timeline */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Timeline
                            </label>
                            <div className="flex gap-2">
                              {([
                                { value: '1_month', label: '1 Month' },
                                { value: '3_months', label: '3 Months' },
                                { value: '6_months', label: '6 Months' },
                                { value: '1_year', label: '1 Year' },
                              ] as const).map((timelineOption) => (
                                <button
                                  key={timelineOption.value}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateGoalTimeline(goal.id, timelineOption.value);
                                  }}
                                  className={cn(
                                    'px-2 py-1 text-xs rounded border',
                                    selectedGoal?.timeline === timelineOption.value
                                      ? 'border-primary-500 bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-200'
                                      : 'border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800'
                                  )}
                                >
                                  {timelineOption.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {tempGoals.length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                Selected Goals ({tempGoals.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {tempGoals.map((goal) => (
                  <Badge key={goal.id} variant="default" className="flex items-center gap-1">
                    {goal.name}
                    <span className={cn('text-xs', priorityColors[goal.priority])}>
                      ({goal.priority})
                    </span>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={handleBack}>
          Back
        </Button>
        <Button 
          onClick={handleNext} 
          disabled={tempGoals.length === 0}
          size="lg"
        >
          Continue to Health & Safety
        </Button>
      </div>
    </div>
  );
}
