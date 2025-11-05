export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const COMPOUND_CATEGORIES = [
  { value: 'supplement', label: 'Supplement' },
  { value: 'nootropic', label: 'Nootropic' },
  { value: 'sarm', label: 'SARM' },
  { value: 'peptide', label: 'Peptide' },
  { value: 'herb', label: 'Herb' },
  { value: 'vitamin', label: 'Vitamin' },
  { value: 'mineral', label: 'Mineral' },
];

export const SAFETY_RATINGS = [
  { value: 'A', label: 'Excellent (A)', color: 'green' },
  { value: 'B', label: 'Good (B)', color: 'lime' },
  { value: 'C', label: 'Moderate (C)', color: 'yellow' },
  { value: 'D', label: 'Poor (D)', color: 'red' },
  { value: 'Unknown', label: 'Unknown', color: 'gray' },
] as const;

export const EVIDENCE_GRADES = [
  { value: 'A', label: 'High Quality (A)', color: 'green' },
  { value: 'B', label: 'Moderate Quality (B)', color: 'blue' },
  { value: 'C', label: 'Low Quality (C)', color: 'yellow' },
  { value: 'D', label: 'Very Low Quality (D)', color: 'red' },
  { value: 'I', label: 'Insufficient (I)', color: 'gray' },
] as const;

export const STUDY_TYPES = [
  { value: 'randomized_controlled_trial', label: 'Randomized Controlled Trial', level: 1 },
  { value: 'systematic_review', label: 'Systematic Review', level: 1 },
  { value: 'meta_analysis', label: 'Meta-Analysis', level: 1 },
  { value: 'cohort_study', label: 'Cohort Study', level: 2 },
  { value: 'case_control_study', label: 'Case-Control Study', level: 3 },
  { value: 'cross_sectional_study', label: 'Cross-Sectional Study', level: 4 },
  { value: 'case_series', label: 'Case Series', level: 5 },
  { value: 'case_report', label: 'Case Report', level: 6 },
  { value: 'animal_study', label: 'Animal Study', level: 7 },
  { value: 'in_vitro_study', label: 'In Vitro Study', level: 8 },
] as const;

export const DOSAGE_FORMS = [
  'tablet',
  'capsule',
  'powder',
  'liquid',
  'injection',
  'topical',
  'sublingual',
  'other',
] as const;

export const ADMINISTRATION_ROUTES = [
  'oral',
  'sublingual',
  'intravenous',
  'intramuscular',
  'subcutaneous',
  'topical',
  'inhalation',
  'rectal',
  'other',
] as const;

export const POPULATIONS = [
  { value: 'general_adult', label: 'General Adult' },
  { value: 'elderly', label: 'Elderly' },
  { value: 'pediatric', label: 'Pediatric' },
  { value: 'pregnant', label: 'Pregnant' },
  { value: 'lactating', label: 'Lactating' },
  { value: 'athletic', label: 'Athletic' },
  { value: 'specific_condition', label: 'Specific Condition' },
  { value: 'other', label: 'Other' },
] as const;

export const SEARCH_DEBOUNCE_MS = 300;
export const DEFAULT_PAGE_SIZE = 18;
export const MAX_SEARCH_RESULTS = 1000;

// Color mappings for consistent theming
export const CATEGORY_COLORS = {
  supplement: 'blue',
  nootropic: 'purple',
  sarm: 'orange',
  peptide: 'green',
  vitamin: 'yellow',
  mineral: 'gray',
  herb: 'emerald',
  amino_acid: 'teal',
  hormone: 'red',
  other: 'slate',
} as const;

export const INTERACTION_SEVERITY_COLORS = {
  major: 'red',
  moderate: 'yellow',
  minor: 'green',
  theoretical: 'blue',
  unknown: 'gray',
} as const;

export const API_ENDPOINTS = {
  COMPOUNDS: '/api/compounds',
  STUDIES: '/api/studies',
  SEARCH: '/api/search',
  STATS: '/api/stats',
} as const;