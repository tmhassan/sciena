import React, { useState } from 'react';
import { Button } from '../../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';
import { useStackBuilder } from '../../../context/StackBuilderContext';

const dietaryRestrictions = [
  'Vegetarian', 'Vegan', 'Keto', 'Paleo', 'Gluten-Free', 
  'Dairy-Free', 'Halal', 'Kosher', 'None'
];

export function PreferencesStep() {
  const { userProfile, updateUserProfile, setCurrentStep, completeStep, generateStack, isGenerating } = useStackBuilder();
  
  const [restrictions, setRestrictions] = useState<string[]>(
    userProfile.dietary_restrictions || []
  );
  const [budget, setBudget] = useState<string>('');
  const [experience, setExperience] = useState<string>('');

  const toggleRestriction = (restriction: string) => {
    if (restriction === 'None') {
      setRestrictions(['None']);
    } else {
      const filtered = restrictions.filter(r => r !== 'None');
      if (restrictions.includes(restriction)) {
        setRestrictions(filtered.filter(r => r !== restriction));
      } else {
        setRestrictions([...filtered, restriction]);
      }
    }
  };

  const handleGenerate = async () => {
    const preferencesData = {
      dietary_restrictions: restrictions,
    };
    
    updateUserProfile(preferencesData);
    completeStep(4, preferencesData);
    await generateStack();
  };

  const handleBack = () => {
    setCurrentStep(3);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Final Preferences</CardTitle>
          <p className="text-gray-600 dark:text-gray-400">
            Help us fine-tune your recommendations with your preferences and constraints.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-8">
          {/* Dietary Restrictions */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Dietary Restrictions
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Select any dietary restrictions that apply:
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {dietaryRestrictions.map((restriction) => (
                <button
                  key={restriction}
                  onClick={() => toggleRestriction(restriction)}
                  className={`p-3 text-sm rounded-lg border transition-colors ${
                    restrictions.includes(restriction)
                      ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-200'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800'
                  }`}
                >
                  {restriction}
                </button>
              ))}
            </div>
          </div>

          {/* Budget Range */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Monthly Budget (Optional)
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              What's your preferred monthly budget for supplements?
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { value: 'under_50', label: 'Under $50' },
                { value: '50_100', label: '$50 - $100' },
                { value: '100_200', label: '$100 - $200' },
                { value: 'over_200', label: 'Over $200' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setBudget(option.value)}
                  className={`p-3 text-sm rounded-lg border transition-colors ${
                    budget === option.value
                      ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-200'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Experience Level */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Supplement Experience
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              How familiar are you with supplements?
            </p>
            
            <div className="space-y-2">
              {[
                { value: 'beginner', label: 'Beginner', desc: 'New to supplements, prefer simple options' },
                { value: 'intermediate', label: 'Intermediate', desc: 'Some experience, open to moderate complexity' },
                { value: 'advanced', label: 'Advanced', desc: 'Experienced user, comfortable with complex stacks' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setExperience(option.value)}
                  className={`w-full p-4 text-left rounded-lg border transition-colors ${
                    experience === option.value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="font-medium text-gray-900 dark:text-white">{option.label}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{option.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={handleBack}>
          Back
        </Button>
        <Button 
          onClick={handleGenerate} 
          size="lg"
          loading={isGenerating}
          className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700"
        >
          {isGenerating ? 'Generating Your Stack...' : 'Generate My Stack'}
        </Button>
      </div>
    </div>
  );
}
