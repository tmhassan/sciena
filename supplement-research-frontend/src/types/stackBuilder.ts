export interface UserProfile {
  age: number;
  gender: 'male' | 'female' | 'other';
  weight: number;
  height: number;
  activity_level: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
  health_conditions: string[];
  medications: string[];
  allergies: string[];
  dietary_restrictions: string[];
}

export interface HealthGoal {
  id: string;
  category: 'cognitive' | 'physical' | 'recovery' | 'longevity' | 'sleep' | 'stress' | 'immunity' | 'weight';
  name: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  timeline: '1_month' | '3_months' | '6_months' | '1_year';
}

export interface StackRecommendation {
  id: string;
  compound_id: string;
  compound_name: string;
  compound_category: string;
  dosage: {
    amount: number;
    unit: string;
    frequency: string;
    timing: string;
  };
  confidence_score: number;
  reasoning: string;
  evidence_level: string;
  safety_considerations: string[];
  interactions: string[];
  cost_estimate: number;
  priority: 'core' | 'beneficial' | 'optional';
}

export interface GeneratedStack {
  id: string;
  name: string;
  description: string;
  user_profile: UserProfile;
  goals: HealthGoal[];
  recommendations: StackRecommendation[];
  total_cost_estimate: number;
  confidence_score: number;
  safety_rating: 'excellent' | 'good' | 'moderate' | 'caution';
  generated_at: string;
  notes: string[];
  contraindications: string[];
}

export interface StackBuilderStep {
  step: number;
  title: string;
  description: string;
  isComplete: boolean;
  data: any;
}
