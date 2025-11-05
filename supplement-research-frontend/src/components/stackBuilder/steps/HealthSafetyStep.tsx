import React, { useState } from 'react';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '../../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { useStackBuilder } from '../../../context/StackBuilderContext';

const commonConditions = [
  'Diabetes', 'High Blood Pressure', 'Heart Disease', 'Asthma', 
  'Depression', 'Anxiety', 'Arthritis', 'Thyroid Issues',
  'Kidney Disease', 'Liver Disease', 'ADHD', 'Sleep Apnea'
];

const commonMedications = [
  'Blood Thinners', 'Blood Pressure Medications', 'Diabetes Medications',
  'Antidepressants', 'Anti-anxiety Medications', 'Thyroid Medications',
  'Birth Control', 'Pain Medications', 'Sleep Aids', 'Statins'
];

const commonAllergies = [
  'Shellfish', 'Nuts', 'Dairy', 'Gluten', 'Soy', 'Fish', 'Eggs', 'None'
];

export function HealthSafetyStep() {
  const { userProfile, updateUserProfile, setCurrentStep, completeStep } = useStackBuilder();
  
  const [healthConditions, setHealthConditions] = useState<string[]>(
    userProfile.health_conditions || []
  );
  const [medications, setMedications] = useState<string[]>(
    userProfile.medications || []
  );
  const [allergies, setAllergies] = useState<string[]>(
    userProfile.allergies || []
  );
  const [customCondition, setCustomCondition] = useState('');
  const [customMedication, setCustomMedication] = useState('');
  const [customAllergy, setCustomAllergy] = useState('');

  const addCustomItem = (
    value: string, 
    setter: React.Dispatch<React.SetStateAction<string[]>>, 
    currentItems: string[],
    clearInput: () => void
  ) => {
    if (value.trim() && !currentItems.includes(value.trim())) {
      setter([...currentItems, value.trim()]);
      clearInput();
    }
  };

  const removeItem = (
    item: string, 
    setter: React.Dispatch<React.SetStateAction<string[]>>, 
    currentItems: string[]
  ) => {
    setter(currentItems.filter(i => i !== item));
  };

  const handleNext = () => {
    const healthData = {
      health_conditions: healthConditions,
      medications: medications,
      allergies: allergies,
    };
    
    updateUserProfile(healthData);
    completeStep(3, healthData);
    setCurrentStep(4);
  };

  const handleBack = () => {
    setCurrentStep(2);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Health & Safety Information</CardTitle>
          <p className="text-gray-600 dark:text-gray-400">
            This helps us identify potential interactions and contraindications. 
            All information is kept confidential.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-8">
          {/* Health Conditions */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Current Health Conditions
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Select any conditions that apply to you:
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
              {commonConditions.map((condition) => (
                <button
                  key={condition}
                  onClick={() => {
                    if (healthConditions.includes(condition)) {
                      removeItem(condition, setHealthConditions, healthConditions);
                    } else {
                      setHealthConditions([...healthConditions, condition]);
                    }
                  }}
                  className={`p-2 text-sm rounded-lg border transition-colors ${
                    healthConditions.includes(condition)
                      ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-200'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800'
                  }`}
                >
                  {condition}
                </button>
              ))}
            </div>

            {/* Custom Condition Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={customCondition}
                onChange={(e) => setCustomCondition(e.target.value)}
                placeholder="Add custom condition..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    addCustomItem(
                      customCondition, 
                      setHealthConditions, 
                      healthConditions,
                      () => setCustomCondition('')
                    );
                  }
                }}
              />
              <Button
                size="sm"
                onClick={() => addCustomItem(
                  customCondition, 
                  setHealthConditions, 
                  healthConditions,
                  () => setCustomCondition('')
                )}
              >
                <PlusIcon className="h-4 w-4" />
              </Button>
            </div>

            {/* Selected Conditions */}
            {healthConditions.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {healthConditions.map((condition) => (
                  <Badge key={condition} variant="default" className="flex items-center gap-1">
                    {condition}
                    <button
                      onClick={() => removeItem(condition, setHealthConditions, healthConditions)}
                      className="hover:bg-primary-700 rounded-full p-0.5"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Medications */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Current Medications
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Include prescription medications, over-the-counter drugs, and other supplements:
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
              {commonMedications.map((medication) => (
                <button
                  key={medication}
                  onClick={() => {
                    if (medications.includes(medication)) {
                      removeItem(medication, setMedications, medications);
                    } else {
                      setMedications([...medications, medication]);
                    }
                  }}
                  className={`p-2 text-sm rounded-lg border transition-colors ${
                    medications.includes(medication)
                      ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-200'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800'
                  }`}
                >
                  {medication}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={customMedication}
                onChange={(e) => setCustomMedication(e.target.value)}
                placeholder="Add custom medication..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    addCustomItem(
                      customMedication, 
                      setMedications, 
                      medications,
                      () => setCustomMedication('')
                    );
                  }
                }}
              />
              <Button
                size="sm"
                onClick={() => addCustomItem(
                  customMedication, 
                  setMedications, 
                  medications,
                  () => setCustomMedication('')
                )}
              >
                <PlusIcon className="h-4 w-4" />
              </Button>
            </div>

            {medications.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {medications.map((medication) => (
                  <Badge key={medication} variant="default" className="flex items-center gap-1">
                    {medication}
                    <button
                      onClick={() => removeItem(medication, setMedications, medications)}
                      className="hover:bg-primary-700 rounded-full p-0.5"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Allergies */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Allergies & Sensitivities
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Select any known allergies or sensitivities:
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              {commonAllergies.map((allergy) => (
                <button
                  key={allergy}
                  onClick={() => {
                    if (allergy === 'None') {
                      setAllergies(['None']);
                    } else {
                      const filtered = allergies.filter(a => a !== 'None');
                      if (allergies.includes(allergy)) {
                        removeItem(allergy, setAllergies, allergies);
                      } else {
                        setAllergies([...filtered, allergy]);
                      }
                    }
                  }}
                  className={`p-2 text-sm rounded-lg border transition-colors ${
                    allergies.includes(allergy)
                      ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-200'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800'
                  }`}
                >
                  {allergy}
                </button>
              ))}
            </div>

            {!allergies.includes('None') && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customAllergy}
                  onChange={(e) => setCustomAllergy(e.target.value)}
                  placeholder="Add custom allergy..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addCustomItem(
                        customAllergy, 
                        setAllergies, 
                        allergies.filter(a => a !== 'None'),
                        () => setCustomAllergy('')
                      );
                    }
                  }}
                />
                <Button
                  size="sm"
                  onClick={() => addCustomItem(
                    customAllergy, 
                    setAllergies, 
                    allergies.filter(a => a !== 'None'),
                    () => setCustomAllergy('')
                  )}
                >
                  <PlusIcon className="h-4 w-4" />
                </Button>
              </div>
            )}

            {allergies.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {allergies.map((allergy) => (
                  <Badge key={allergy} variant="default" className="flex items-center gap-1">
                    {allergy}
                    <button
                      onClick={() => removeItem(allergy, setAllergies, allergies)}
                      className="hover:bg-primary-700 rounded-full p-0.5"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={handleBack}>
          Back
        </Button>
        <Button onClick={handleNext} size="lg">
          Continue to Preferences
        </Button>
      </div>
    </div>
  );
}
