export interface Compound {
  id: string;
  name: string;
  synonyms: string[];
  category: CompoundCategory;
  legal_status: LegalStatus;
  safety_rating: SafetyRating;
  molecular_weight?: number;
  formula?: string;
  cas_number?: string;
  created_at: string;
  updated_at: string;
}

export interface CompoundSummary {
  id: string;
  compound_id: string;
  overview?: string;
  mechanism_of_action: string[];
  benefits: Benefit[];
  side_effects: string[];
  interactions: string[];
  contraindications: string[];
  evidence_grade: string;
  last_updated: string;
  sources_count: number;
}

export interface Benefit {
  indication: string;
  evidence_strength: 'A' | 'B' | 'C' | 'D';
  effect_size: string;
  population: string;
  dose_range?: string;
  supporting_studies: string[];
}

export interface Study {
  id: string;
  compound_id: string;
  pmid?: string;
  doi?: string;
  title: string;
  abstract?: string;
  authors: string[];
  journal: string;
  publication_date: string;
  study_type: StudyType;
  sample_size?: number;
  duration?: string;
  findings: string;
  limitations?: string;
  quality_score?: number;
  evidence_level: EvidenceLevel;
}

export interface DosageInfo {
  id: string;
  compound_id: string;
  form: DosageForm;
  route: AdministrationRoute;
  dose_min: number;
  dose_max: number;
  dose_unit: DosageUnit;
  frequency: string;
  duration?: string;
  population: Population;
  condition?: string;
  evidence_level: EvidenceLevel;
  notes?: string;
}

export interface CompoundDetailed extends Compound {
  summary?: CompoundSummary;
  studies?: Study[];
  dosage_info?: DosageInfo[];
  interactions?: Interaction[];
}


// Enums
export type CompoundCategory = 
  | 'supplement'
  | 'nootropic'
  | 'sarm'
  | 'peptide'
  | 'vitamin'
  | 'mineral'
  | 'herb'
  | 'amino_acid'
  | 'hormone'
  | 'other';

export type SafetyRating = 'A' | 'B' | 'C' | 'D' | 'Unknown';

export type LegalStatus = 
  | 'legal'
  | 'prescription_only'
  | 'controlled_substance'
  | 'banned'
  | 'research_only'
  | 'varies_by_jurisdiction';

export type EvidenceGrade = 'A' | 'B' | 'C' | 'D' | 'I'; // GRADE system

export type EvidenceLevel = 
  | 'high'
  | 'moderate'
  | 'low'
  | 'very_low'
  | 'insufficient';

export type StudyType = 
  | 'randomized_controlled_trial'
  | 'cohort_study'
  | 'case_control_study'
  | 'cross_sectional_study'
  | 'case_series'
  | 'case_report'
  | 'systematic_review'
  | 'meta_analysis'
  | 'animal_study'
  | 'in_vitro_study'
  | 'review'
  | 'other';

export type DosageForm = 
  | 'tablet'
  | 'capsule'
  | 'powder'
  | 'liquid'
  | 'injection'
  | 'topical'
  | 'sublingual'
  | 'other';

export type AdministrationRoute = 
  | 'oral'
  | 'sublingual'
  | 'intravenous'
  | 'intramuscular'
  | 'subcutaneous'
  | 'topical'
  | 'inhalation'
  | 'rectal'
  | 'other';

export type DosageUnit = 
  | 'mg'
  | 'g'
  | 'mcg'
  | 'iu'
  | 'ml'
  | 'drops'
  | 'tablets'
  | 'capsules'
  | 'other';

export type Population = 
  | 'general_adult'
  | 'elderly'
  | 'pediatric'
  | 'pregnant'
  | 'lactating'
  | 'athletic'
  | 'specific_condition'
  | 'other';

// Search and filtering types
export interface SearchFilters {
  category?: CompoundCategory[];
  safety_rating?: SafetyRating[];
  evidence_grade?: EvidenceGrade[];
  legal_status?: LegalStatus[];
  has_studies?: boolean;
  has_dosage_info?: boolean;
}

export interface SearchResult {
  compounds: Compound[];
  total_count: number;
  page: number;
  per_page: number;
  has_next: boolean;
  has_prev: boolean;
}

// API response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: 'success' | 'error';
}

export interface CompoundDetailed extends Compound {
  summary?: CompoundSummary;
  studies?: Study[];
  dosage_info?: DosageInfo[];
  interactions?: Interaction[];
}

export interface Interaction {
  id: string;
  compound_a_id: string;
  compound_b_id: string;
  interaction_type: InteractionType;
  severity: InteractionSeverity;
  description: string;
  mechanism?: string;
  evidence_level: EvidenceLevel;
  sources?: string[];
}

export type InteractionType = 
  | 'synergistic'
  | 'antagonistic'
  | 'additive'
  | 'competitive'
  | 'metabolic'
  | 'unknown';

export type InteractionSeverity = 
  | 'major'
  | 'moderate'
  | 'minor'
  | 'theoretical'
  | 'unknown';
