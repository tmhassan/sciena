import React, { createContext, useContext, useState, useCallback } from 'react';
import { UserProfile, HealthGoal, GeneratedStack, StackBuilderStep } from '../types/stackBuilder';

interface StackBuilderContextType {
  currentStep: number;
  steps: StackBuilderStep[];
  userProfile: Partial<UserProfile>;
  selectedGoals: HealthGoal[];
  generatedStack: GeneratedStack | null;
  isGenerating: boolean;
  
  setCurrentStep: (step: number) => void;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  updateSelectedGoals: (goals: HealthGoal[]) => void;
  generateStack: () => Promise<void>;
  resetBuilder: () => void;
  completeStep: (step: number, data: any) => void;
}

const StackBuilderContext = createContext<StackBuilderContextType | undefined>(undefined);

const initialSteps: StackBuilderStep[] = [
  {
    step: 1,
    title: 'Basic Information',
    description: 'Tell us about yourself',
    isComplete: false,
    data: null,
  },
  {
    step: 2,
    title: 'Health Goals',
    description: 'What do you want to achieve?',
    isComplete: false,
    data: null,
  },
  {
    step: 3,
    title: 'Health & Safety',
    description: 'Medical conditions and medications',
    isComplete: false,
    data: null,
  },
  {
    step: 4,
    title: 'Preferences',
    description: 'Dietary restrictions and preferences',
    isComplete: false,
    data: null,
  },
  {
    step: 5,
    title: 'Your Stack',
    description: 'AI-generated recommendations',
    isComplete: false,
    data: null,
  },
];

export function StackBuilderProvider({ children }: { children: React.ReactNode }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [steps, setSteps] = useState<StackBuilderStep[]>(initialSteps);
  const [userProfile, setUserProfile] = useState<Partial<UserProfile>>({});
  const [selectedGoals, setSelectedGoals] = useState<HealthGoal[]>([]);
  const [generatedStack, setGeneratedStack] = useState<GeneratedStack | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const updateUserProfile = useCallback((profile: Partial<UserProfile>) => {
    setUserProfile(prev => ({ ...prev, ...profile }));
  }, []);

  const updateSelectedGoals = useCallback((goals: HealthGoal[]) => {
    setSelectedGoals(goals);
  }, []);

  const completeStep = useCallback((step: number, data: any) => {
    setSteps(prev => prev.map(s => 
      s.step === step ? { ...s, isComplete: true, data } : s
    ));
  }, []);

  const generateStack = useCallback(async () => {
    setIsGenerating(true);
    
    try {
      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock AI-generated stack (in real app, this would call your FastAPI backend)
      const mockStack: GeneratedStack = {
        id: `stack-${Date.now()}`,
        name: 'Your Personalized Stack',
        description: 'AI-curated supplements based on your goals and profile',
        user_profile: userProfile as UserProfile,
        goals: selectedGoals,
        recommendations: [
          {
            id: '1',
            compound_id: '1',
            compound_name: 'Creatine Monohydrate',
            compound_category: 'supplement',
            dosage: {
              amount: 5,
              unit: 'g',
              frequency: 'daily',
              timing: 'post-workout',
            },
            confidence_score: 95,
            reasoning: 'Highly effective for strength and cognitive performance with excellent safety profile.',
            evidence_level: 'high',
            safety_considerations: ['Generally well-tolerated', 'Increase water intake'],
            interactions: [],
            cost_estimate: 25,
            priority: 'core',
          },
          {
            id: '2',
            compound_id: '2',
            compound_name: 'Ashwagandha',
            compound_category: 'herb',
            dosage: {
              amount: 300,
              unit: 'mg',
              frequency: 'twice daily',
              timing: 'with meals',
            },
            confidence_score: 88,
            reasoning: 'Excellent for stress management and sleep quality improvement.',
            evidence_level: 'moderate',
            safety_considerations: ['Take with food', 'May cause drowsiness'],
            interactions: ['May interact with sedatives'],
            cost_estimate: 35,
            priority: 'core',
          },
          {
            id: '3',
            compound_id: '3',
            compound_name: 'Omega-3 Fatty Acids',
            compound_category: 'supplement',
            dosage: {
              amount: 1000,
              unit: 'mg',
              frequency: 'daily',
              timing: 'with largest meal',
            },
            confidence_score: 92,
            reasoning: 'Essential for cardiovascular health and inflammation reduction.',
            evidence_level: 'high',
            safety_considerations: ['Take with fat-containing meal for absorption'],
            interactions: ['May enhance blood-thinning medications'],
            cost_estimate: 30,
            priority: 'core',
          },
        ],
        total_cost_estimate: 90,
        confidence_score: 91,
        safety_rating: 'excellent',
        generated_at: new Date().toISOString(),
        notes: [
          'Start with lower doses and gradually increase',
          'Monitor your response for the first 2 weeks',
          'Consult healthcare provider before starting',
        ],
        contraindications: [],
      };
      
      setGeneratedStack(mockStack);
      completeStep(5, mockStack);
      setCurrentStep(5);
    } catch (error) {
      console.error('Stack generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [userProfile, selectedGoals, completeStep]);

  const resetBuilder = useCallback(() => {
    setCurrentStep(1);
    setSteps(initialSteps);
    setUserProfile({});
    setSelectedGoals([]);
    setGeneratedStack(null);
    setIsGenerating(false);
  }, []);

  return (
    <StackBuilderContext.Provider value={{
      currentStep,
      steps,
      userProfile,
      selectedGoals,
      generatedStack,
      isGenerating,
      setCurrentStep,
      updateUserProfile,
      updateSelectedGoals,
      generateStack,
      resetBuilder,
      completeStep,
    }}>
      {children}
    </StackBuilderContext.Provider>
  );
}

export function useStackBuilder() {
  const context = useContext(StackBuilderContext);
  if (context === undefined) {
    throw new Error('useStackBuilder must be used within a StackBuilderProvider');
  }
  return context;
}
