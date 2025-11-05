export interface ScanRequest {
  image: File | Blob;
  user_id?: string;
  scan_type: 'supplement' | 'food' | 'auto';
  options?: ScanOptions;
}

export interface ScanOptions {
  enhance_image?: boolean;
  use_ai_parsing?: boolean;
  include_safety_analysis?: boolean;
  match_threshold?: number;
}

export interface ScanResult {
  scan_id: string;
  extracted_text: string;
  ingredients: ParsedIngredient[];
  matches: CompoundMatch[];
  safety_analysis: SafetyReport;
  recommendations: string[];
  confidence_score: number;
  processed_at: string;
}

export interface ParsedIngredient {
  name: string;
  common_names: string[];
  dosage?: DosageInfo;
  type: IngredientType;
  confidence: number;
  raw_text: string;
  extracted_at: string;
}

export interface DosageInfo {
  amount: number;
  unit: string;
  daily_value_percentage?: number | null;
  per_serving: boolean;
}

export type IngredientType = 'active' | 'inactive' | 'carrier' | 'preservative' | 'flavoring';

export interface CompoundMatch {
  id: string;
  ingredient_name: string;
  compound_id: string | null;
  compound_name: string | null;
  compound_category: string | null;
  confidence: number;
  dosage_analysis?: DosageAnalysis;
  safety_rating: string | null;
  legal_status: string | null;
  matched_synonyms: string[];
  research_url: string | null;
}

export interface DosageAnalysis {
  status: 'low' | 'normal' | 'high' | 'excessive' | 'unknown';
  message: string;
  recommended_range?: string;
}

export interface SafetyReport {
  risk_level: RiskLevel;
  interactions: InteractionWarning[];
  warnings: string[];
  recommendations: string[];
  analyzed_at: string;
  total_compounds: number;
  high_risk_compounds: number;
}

export type RiskLevel = 'low' | 'moderate' | 'high';

export interface InteractionWarning {
  id: string;
  compound1_name: string;
  compound2_name: string;
  severity: 'low' | 'moderate' | 'high';
  description: string;
  recommendation: string;
}

export interface OCRResult {
  text: string;
  confidence: number;
  boundingBoxes?: BoundingBox[];
}

export interface BoundingBox {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}
