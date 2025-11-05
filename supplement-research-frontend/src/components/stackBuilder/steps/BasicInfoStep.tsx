import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';
import { useStackBuilder } from '../../../context/StackBuilderContext';
import { UserProfile } from '../../../types/stackBuilder';

export function BasicInfoStep() {
  const { userProfile, updateUserProfile, setCurrentStep, completeStep } = useStackBuilder();
  
  const [formData, setFormData] = useState({
    age: userProfile.age || '',
    gender: userProfile.gender || '',
    weight: userProfile.weight || '',
    height: userProfile.height || '',
    activity_level: userProfile.activity_level || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setFormData({
      age: userProfile.age || '',
      gender: userProfile.gender || '',
      weight: userProfile.weight || '',
      height: userProfile.height || '',
      activity_level: userProfile.activity_level || '',
    });
  }, [userProfile]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.age || Number(formData.age) < 18 || Number(formData.age) > 100) {
      newErrors.age = 'Please enter a valid age between 18 and 100';
    }
    if (!formData.gender) {
      newErrors.gender = 'Please select your gender';
    }
    if (!formData.weight || Number(formData.weight) < 30 || Number(formData.weight) > 300) {
      newErrors.weight = 'Please enter a valid weight';
    }
    if (!formData.height || Number(formData.height) < 120 || Number(formData.height) > 250) {
      newErrors.height = 'Please enter a valid height in cm';
    }
    if (!formData.activity_level) {
      newErrors.activity_level = 'Please select your activity level';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      const profileData = {
        age: Number(formData.age),
        gender: formData.gender as UserProfile['gender'],
        weight: Number(formData.weight),
        height: Number(formData.height),
        activity_level: formData.activity_level as UserProfile['activity_level'],
      };
      
      updateUserProfile(profileData);
      completeStep(1, profileData);
      setCurrentStep(2);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">Tell us about yourself</CardTitle>
        <p className="text-gray-600 dark:text-gray-400">
          This information helps us provide more accurate recommendations
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Age */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Age *
          </label>
          <input
            type="number"
            value={formData.age}
            onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            placeholder="Enter your age"
          />
          {errors.age && <p className="mt-1 text-sm text-red-600">{errors.age}</p>}
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Gender *
          </label>
          <div className="grid grid-cols-3 gap-3">
            {['male', 'female', 'other'].map((gender) => (
              <button
                key={gender}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, gender }))}
                className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  formData.gender === gender
                    ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-200'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800'
                }`}
              >
                {gender.charAt(0).toUpperCase() + gender.slice(1)}
              </button>
            ))}
          </div>
          {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender}</p>}
        </div>

        {/* Weight & Height */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Weight (kg) *
            </label>
            <input
              type="number"
              value={formData.weight}
              onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              placeholder="70"
            />
            {errors.weight && <p className="mt-1 text-sm text-red-600">{errors.weight}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Height (cm) *
            </label>
            <input
              type="number"
              value={formData.height}
              onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              placeholder="175"
            />
            {errors.height && <p className="mt-1 text-sm text-red-600">{errors.height}</p>}
          </div>
        </div>

        {/* Activity Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Activity Level *
          </label>
          <div className="space-y-2">
            {[
              { value: 'sedentary', label: 'Sedentary', desc: 'Little to no exercise' },
              { value: 'lightly_active', label: 'Lightly Active', desc: 'Light exercise 1-3 days/week' },
              { value: 'moderately_active', label: 'Moderately Active', desc: 'Moderate exercise 3-5 days/week' },
              { value: 'very_active', label: 'Very Active', desc: 'Hard exercise 6-7 days/week' },
              { value: 'extremely_active', label: 'Extremely Active', desc: 'Very hard exercise, physical job' },
            ].map((activity) => (
              <button
                key={activity.value}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, activity_level: activity.value }))}
                className={`w-full p-3 text-left rounded-lg border transition-colors ${
                  formData.activity_level === activity.value
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900'
                    : 'border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800'
                }`}
              >
                <div className="font-medium text-gray-900 dark:text-white">{activity.label}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{activity.desc}</div>
              </button>
            ))}
          </div>
          {errors.activity_level && <p className="mt-1 text-sm text-red-600">{errors.activity_level}</p>}
        </div>

        {/* Next Button */}
        <div className="flex justify-end pt-4">
          <Button onClick={handleNext} size="lg">
            Continue to Goals
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
