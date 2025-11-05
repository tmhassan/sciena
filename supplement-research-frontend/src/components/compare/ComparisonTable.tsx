import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowTopRightOnSquareIcon, 
  BeakerIcon, 
  ChartBarIcon,
  ShieldCheckIcon,
  AcademicCapIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Compound } from '../../types/compound';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { compoundService } from '../../services/api';
import { formatCompoundCategory, formatSafetyRating } from '../../utils/formatters';
import { cn } from '../../utils/cn';

interface ComparisonTableProps {
  compounds: Compound[];
}

// Enhanced interface for summary data
interface CompoundSummary {
  overview?: string;
  mechanism_of_action?: string[];
  benefits?: any[];
  side_effects?: string[];
  interactions?: string[];
  contraindications?: string[];
  evidence_grade?: string;
  total_references?: number;
}

interface EnhancedCompoundData extends Compound {
  summary?: CompoundSummary;
  studies?: any[];
  dosage_info?: any[];
}

const comparisonCategories = [
  {
    id: 'basic',
    title: 'Basic Information',
    icon: BeakerIcon,
    rows: [
      { label: 'Name', key: 'name', type: 'text' },
      { label: 'Category', key: 'category', type: 'category' },
      { label: 'Safety Rating', key: 'safety_rating', type: 'safety' },
      { label: 'Legal Status', key: 'legal_status', type: 'legal' },
      { label: 'Common Names', key: 'synonyms', type: 'synonyms' },
    ]
  },
  {
    id: 'chemical',
    title: 'Chemical Properties',
    icon: ChartBarIcon,
    rows: [
      { label: 'Molecular Formula', key: 'formula', type: 'text' },
      { label: 'CAS Number', key: 'cas_number', type: 'text' },
      { label: 'Last Updated', key: 'updated_at', type: 'date' },
    ]
  },
  {
    id: 'research',
    title: 'Research & Evidence',
    icon: AcademicCapIcon,
    rows: [
      { label: 'Evidence Grade', key: 'evidence_grade', type: 'evidence' },
      { label: 'Total Studies', key: 'studies_count', type: 'number' },
      { label: 'Total References', key: 'references_count', type: 'number' },
      { label: 'AI Generated Summary', key: 'has_ai_summary', type: 'boolean' },
      { label: 'Expert Reviewed', key: 'expert_reviewed', type: 'boolean' },
    ]
  },
  {
    id: 'benefits',
    title: 'Key Benefits',
    icon: ShieldCheckIcon,
    rows: [
      { label: 'Primary Benefits', key: 'primary_benefits', type: 'benefits' },
      { label: 'Evidence Strength', key: 'benefit_evidence', type: 'evidence_list' },
      { label: 'Mechanism of Action', key: 'mechanism', type: 'mechanism' },
    ]
  },
  {
    id: 'safety',
    title: 'Safety Profile',
    icon: ExclamationTriangleIcon,
    rows: [
      { label: 'Known Side Effects', key: 'side_effects', type: 'side_effects' },
      { label: 'Drug Interactions', key: 'interactions', type: 'interactions' },
      { label: 'Contraindications', key: 'contraindications', type: 'contraindications' },
      { label: 'Dosage Range', key: 'dosage_range', type: 'dosage' },
    ]
  },
  {
    id: 'dosage',
    title: 'Dosage Information',
    icon: ClockIcon,
    rows: [
      { label: 'Standard Dose', key: 'standard_dose', type: 'dosage_info' },
      { label: 'Frequency', key: 'frequency', type: 'text' },
      { label: 'Best Form', key: 'best_form', type: 'text' },
      { label: 'Timing', key: 'timing', type: 'text' },
    ]
  }
];

export function ComparisonTable({ compounds }: ComparisonTableProps) {
  const [activeCategory, setActiveCategory] = useState(0);
  const [enhancedData, setEnhancedData] = useState<EnhancedCompoundData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch enhanced data for each compound
  useEffect(() => {
    const fetchEnhancedData = async () => {
      setIsLoading(true);
      try {
        const enhanced = await Promise.all(
          compounds.map(async (compound) => {
            try {
              // Fetch detailed compound data
              const detailed = await compoundService.getById(compound.id);
              const summary = await compoundService.getSummary(compound.id);
              const studies = await compoundService.getStudies(compound.id);
              
              return {
                ...compound,
                ...detailed,
                summary,
                studies: studies || [],
              } as EnhancedCompoundData;
            } catch (error) {
              console.error(`Failed to fetch data for ${compound.name}:`, error);
              return compound as EnhancedCompoundData;
            }
          })
        );
        setEnhancedData(enhanced);
      } catch (error) {
        console.error('Failed to fetch enhanced compound data:', error);
        setEnhancedData(compounds as EnhancedCompoundData[]);
      } finally {
        setIsLoading(false);
      }
    };

    if (compounds.length > 0) {
      fetchEnhancedData();
    }
  }, [compounds]);

  const renderCellValue = (compound: EnhancedCompoundData, key: string, type: string): React.ReactNode => {
    if (isLoading) {
      return (
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        </div>
      );
    }

    switch (type) {
      case 'text':
        const textValue = compound[key as keyof EnhancedCompoundData];
        return textValue ? String(textValue) : 'N/A';

      case 'category':
        return (
          <Badge variant={`category-${compound.category}` as any}>
            {formatCompoundCategory(compound.category)}
          </Badge>
        );

      case 'safety':
        return (
          <Badge variant={`safety-${compound.safety_rating?.toLowerCase()}` as any}>
            {compound.safety_rating} - {formatSafetyRating(compound.safety_rating || 'Unknown')}
          </Badge>
        );

      case 'legal':
        const legalStatus = compound.legal_status || 'Unknown';
        // Fixed type-safe legal status checking
        const isLegal = legalStatus.toLowerCase().includes('legal') || 
                       legalStatus.toLowerCase().includes('otc')
        return (
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full mr-2 ${isLegal ? 'bg-green-500' : 'bg-yellow-500'}`} />
            <span className="text-sm">{legalStatus}</span>
          </div>
        );

      case 'synonyms':
        const synonyms = compound.synonyms || [];
        return synonyms.length > 0 ? (
          <div className="text-sm">
            {synonyms.slice(0, 2).map((synonym, idx) => (
              <div key={idx} className="text-gray-600 dark:text-gray-400">{synonym}</div>
            ))}
            {synonyms.length > 2 && (
              <div className="text-xs text-gray-500">+{synonyms.length - 2} more</div>
            )}
          </div>
        ) : 'None listed';

      case 'date':
        const dateValue = compound[key as keyof EnhancedCompoundData] as string;
        return dateValue ? new Date(dateValue).toLocaleDateString() : 'N/A';

      case 'evidence':
        const grade = compound.summary?.evidence_grade || 'Unknown';
        return (
          <Badge variant={`evidence-${grade.toLowerCase()}` as any}>
            Grade {grade}
          </Badge>
        );

      case 'number':
        if (key === 'studies_count') {
          const count = compound.studies?.length || 0;
          return (
            <div className="flex items-center">
              <AcademicCapIcon className="w-4 h-4 mr-1 text-blue-500" />
              <span className="font-medium">{count}</span>
            </div>
          );
        }
        if (key === 'references_count') {
          const count = compound.summary?.total_references || 0;
          return (
            <div className="flex items-center">
              <ChartBarIcon className="w-4 h-4 mr-1 text-green-500" />
              <span className="font-medium">{count}</span>
            </div>
          );
        }
        const numberValue = compound[key as keyof EnhancedCompoundData];
        return numberValue ? String(numberValue) : '0';

      case 'boolean':
        const value = key === 'has_ai_summary' 
          ? !!compound.summary?.overview 
          : key === 'expert_reviewed' 
          ? !!compound.summary 
          : false;
        return (
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full mr-2 ${value ? 'bg-green-500' : 'bg-gray-300'}`} />
            <span className="text-sm">{value ? 'Yes' : 'No'}</span>
          </div>
        );

      case 'benefits':
        const benefits = compound.summary?.benefits || [];
        return benefits.length > 0 ? (
          <div className="space-y-1">
            {benefits.slice(0, 3).map((benefit: any, idx: number) => (
              <div key={idx} className="text-xs bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                {benefit.indication || String(benefit)}
              </div>
            ))}
            {benefits.length > 3 && (
              <div className="text-xs text-gray-500">+{benefits.length - 3} more</div>
            )}
          </div>
        ) : (
          <span className="text-gray-500 text-sm">No benefits documented</span>
        );

      case 'evidence_list':
        const evidenceBenefits = compound.summary?.benefits || [];
        return evidenceBenefits.length > 0 ? (
          <div className="space-y-1">
            {evidenceBenefits.slice(0, 3).map((benefit: any, idx: number) => (
              <Badge key={idx} variant={`evidence-${benefit.evidence_strength?.toLowerCase()}` as any} className="text-xs">
                {benefit.evidence_strength || 'Unknown'}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-gray-500 text-sm">No evidence grades</span>
        );

      case 'mechanism':
        const mechanisms = compound.summary?.mechanism_of_action || [];
        return mechanisms.length > 0 ? (
          <div className="text-sm space-y-1">
            {mechanisms.slice(0, 2).map((mech: string, idx: number) => (
              <div key={idx} className="text-gray-700 dark:text-gray-300">{mech}</div>
            ))}
            {mechanisms.length > 2 && (
              <div className="text-xs text-gray-500">+{mechanisms.length - 2} more</div>
            )}
          </div>
        ) : (
          <span className="text-gray-500 text-sm">Not documented</span>
        );

      case 'side_effects':
        const sideEffects = compound.summary?.side_effects || [];
        return sideEffects.length > 0 ? (
          <div className="space-y-1">
            {sideEffects.slice(0, 3).map((effect: string, idx: number) => (
              <div key={idx} className="text-xs bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded text-yellow-800 dark:text-yellow-200">
                {effect}
              </div>
            ))}
            {sideEffects.length > 3 && (
              <div className="text-xs text-gray-500">+{sideEffects.length - 3} more</div>
            )}
          </div>
        ) : (
          <span className="text-green-600 dark:text-green-400 text-sm">None reported</span>
        );

      case 'interactions':
        const interactions = compound.summary?.interactions || [];
        return interactions.length > 0 ? (
          <div className="space-y-1">
            {interactions.slice(0, 2).map((interaction: string, idx: number) => (
              <div key={idx} className="text-xs bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded text-red-800 dark:text-red-200">
                {interaction}
              </div>
            ))}
            {interactions.length > 2 && (
              <div className="text-xs text-gray-500">+{interactions.length - 2} more</div>
            )}
          </div>
        ) : (
          <span className="text-green-600 dark:text-green-400 text-sm">None known</span>
        );

      case 'contraindications':
        const contraindications = compound.summary?.contraindications || [];
        return contraindications.length > 0 ? (
          <div className="space-y-1">
            {contraindications.slice(0, 2).map((contra: string, idx: number) => (
              <div key={idx} className="text-xs bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded text-red-800 dark:text-red-200">
                {contra}
              </div>
            ))}
            {contraindications.length > 2 && (
              <div className="text-xs text-gray-500">+{contraindications.length - 2} more</div>
            )}
          </div>
        ) : (
          <span className="text-green-600 dark:text-green-400 text-sm">None listed</span>
        );

      case 'dosage':
        const dosageInfo = compound.dosage_info || [];
        if (dosageInfo.length > 0) {
          const firstDosage = dosageInfo[0];
          return (
            <div className="text-sm">
              <div className="font-medium">
                {firstDosage.dose_min && firstDosage.dose_max 
                  ? `${firstDosage.dose_min}-${firstDosage.dose_max} ${firstDosage.dose_unit || 'mg'}`
                  : firstDosage.dose_min 
                  ? `${firstDosage.dose_min} ${firstDosage.dose_unit || 'mg'}`
                  : 'Variable'
                }
              </div>
              {firstDosage.frequency && (
                <div className="text-xs text-gray-500">{firstDosage.frequency}</div>
              )}
            </div>
          );
        }
        return <span className="text-gray-500 text-sm">Not specified</span>;

      case 'dosage_info':
        const dosages = compound.dosage_info || [];
        const standardDosage = dosages.find((d: any) => d.population === 'general' || d.population === 'adults') || dosages[0];
        if (standardDosage) {
          return (
            <div className="text-sm">
              <div className="font-medium">
                {standardDosage.dose_min && standardDosage.dose_max 
                  ? `${standardDosage.dose_min}-${standardDosage.dose_max} ${standardDosage.dose_unit || 'mg'}`
                  : standardDosage.dose_min 
                  ? `${standardDosage.dose_min} ${standardDosage.dose_unit || 'mg'}`
                  : 'See studies'
                }
              </div>
              {standardDosage.route && (
                <div className="text-xs text-gray-500">{standardDosage.route}</div>
              )}
            </div>
          );
        }
        return <span className="text-gray-500 text-sm">Not available</span>;

      default:
        const defaultValue = compound[key as keyof EnhancedCompoundData];
        return defaultValue ? String(defaultValue) : 'N/A';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Detailed Comparison
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Compare {compounds.length} compounds across multiple categories
        </p>
      </div>

      {/* Category Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {comparisonCategories.map((category, index) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(index)}
                className={cn(
                  "py-4 px-1 border-b-2 font-medium text-sm flex items-center",
                  activeCategory === index
                    ? "border-primary-500 text-primary-600 dark:text-primary-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-200 dark:hover:border-gray-600"
                )}
              >
                <Icon className="w-4 h-4 mr-2" />
                {category.title}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Property
              </th>
              {enhancedData.map((compound) => (
                <th key={compound.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <div className="flex items-center justify-between">
                    <Link 
                      to={`/compound/${compound.id}`}
                      className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      <div className="font-semibold text-gray-900 dark:text-white text-sm">
                        {compound.name}
                      </div>
                    </Link>
                    <Link 
                      to={`/compound/${compound.id}`}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                    </Link>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {comparisonCategories[activeCategory].rows.map((row, index) => (
              <tr key={row.key} className={index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800/50' : 'bg-white dark:bg-gray-900'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {row.label}
                </td>
                {enhancedData.map((compound) => (
                  <td key={compound.id} className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {renderCellValue(compound, row.key, row.type)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer with actions */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {isLoading ? 'Loading detailed comparison data...' : 'Comparison data loaded from research database'}
          </p>
          <div className="flex space-x-3">
            <Button variant="outline" size="sm">
              Export Comparison
            </Button>
            <Button variant="outline" size="sm">
              Share Results
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
