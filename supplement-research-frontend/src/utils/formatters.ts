import { 
  SafetyRating, 
  EvidenceGrade, 
  EvidenceLevel, 
  CompoundCategory,
  StudyType,
  InteractionSeverity
} from '../types/compound';

export const formatSafetyRating = (rating: SafetyRating): string => {
  const ratings = {
    'A': 'Excellent',
    'B': 'Good',
    'C': 'Moderate',
    'D': 'Poor',
    'Unknown': 'Unknown'
  };
  return ratings[rating] || 'Unknown';
};

export const formatEvidenceGrade = (grade: EvidenceGrade): string => {
  const grades = {
    'A': 'High Quality',
    'B': 'Moderate Quality',
    'C': 'Low Quality',
    'D': 'Very Low Quality',
    'I': 'Insufficient'
  };
  return grades[grade] || 'Unknown';
};

export const formatEvidenceLevel = (level: EvidenceLevel): string => {
  const levels = {
    'high': 'High',
    'moderate': 'Moderate',
    'low': 'Low',
    'very_low': 'Very Low',
    'insufficient': 'Insufficient'
  };
  return levels[level] || 'Unknown';
};

export const formatCompoundCategory = (category: CompoundCategory): string => {
  const categories = {
    'supplement': 'Supplement',
    'nootropic': 'Nootropic',
    'sarm': 'SARM',
    'peptide': 'Peptide',
    'vitamin': 'Vitamin',
    'mineral': 'Mineral',
    'herb': 'Herb',
    'amino_acid': 'Amino Acid',
    'hormone': 'Hormone',
    'other': 'Other'
  };
  return categories[category] || 'Other';
};

export const formatStudyType = (type: StudyType): string => {
  const types = {
    'randomized_controlled_trial': 'RCT',
    'cohort_study': 'Cohort Study',
    'case_control_study': 'Case-Control',
    'cross_sectional_study': 'Cross-Sectional',
    'case_series': 'Case Series',
    'case_report': 'Case Report',
    'systematic_review': 'Systematic Review',
    'meta_analysis': 'Meta-Analysis',
    'animal_study': 'Animal Study',
    'in_vitro_study': 'In Vitro',
    'review': 'Review',
    'other': 'Other'
  };
  return types[type] || 'Other';
};

export const formatInteractionSeverity = (severity: InteractionSeverity): string => {
  const severities = {
    'major': 'Major',
    'moderate': 'Moderate',
    'minor': 'Minor',
    'theoretical': 'Theoretical',
    'unknown': 'Unknown'
  };
  return severities[severity] || 'Unknown';
};

export const formatDosage = (
  min: number, 
  max: number, 
  unit: string, 
  frequency?: string
): string => {
  const range = min === max ? `${min}` : `${min}-${max}`;
  const freq = frequency ? ` ${frequency}` : '';
  return `${range} ${unit}${freq}`;
};

export const formatPublicationDate = (date: string): string => {
  try {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return date;
  }
};

export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
};
