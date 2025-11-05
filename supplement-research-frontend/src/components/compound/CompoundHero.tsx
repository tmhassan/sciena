import React, { useEffect, useState } from 'react';
import { CompoundDetailed, CompoundSummary } from '../../types/compound';
import { Badge } from '../ui/Badge';
import { CompareButton } from '../ui/CompareButton';
import { compoundService } from '../../services/api';
import { formatCompoundCategory, formatSafetyRating } from '../../utils/formatters';

interface Props { 
  compound: CompoundDetailed; 
}

export function CompoundHero({ compound }: Props) {
  const [summary, setSummary] = useState<CompoundSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const summaryData = await compoundService.getSummary(compound.id);
        setSummary(summaryData);
      } catch (error) {
        console.error('Failed to fetch summary:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [compound.id]);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          {/* Name + meta */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl flex-1">
                {compound.name}
              </h1>
              <CompareButton compound={compound} variant="text" className="ml-4" />
            </div>
            
            {compound.synonyms?.length > 0 && (
              <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
                aka {compound.synonyms.join(', ')}
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-2">
              <Badge variant={`category-${compound.category}` as any}>
                {formatCompoundCategory(compound.category)}
              </Badge>
              <Badge variant={`safety-${compound.safety_rating?.toLowerCase()}` as any}>
                Safety {compound.safety_rating} – {formatSafetyRating(compound.safety_rating || 'Unknown')}
              </Badge>
              {summary?.evidence_grade && (
                <Badge variant={`evidence-${summary.evidence_grade.toLowerCase()}` as any}>
                  Evidence Grade {summary.evidence_grade}
                </Badge>
              )}
              {compound.legal_status && compound.legal_status !== 'legal' && (
                <Badge variant="warning" >
                  {compound.legal_status.replace('_', ' ')}
                </Badge>
              )}
            </div>

            {/* AI Summary Overview */}
            {summary?.overview && (
              <div className="mt-6 p-4 bg-white/60 dark:bg-gray-800/60 rounded-lg backdrop-blur-sm">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">AI Summary</h3>
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                  {summary.overview.length > 300 
                    ? `${summary.overview.substring(0, 300)}...` 
                    : summary.overview
                  }
                </p>
              </div>
            )}
          </div>

          {/* Quick stats */}
          <div className="flex gap-6 text-center">
            <HeroStat
              label="Studies"
              value={compound.studies?.length ?? 0}
            />
            <HeroStat
              label="Evidence"
              value={summary?.evidence_grade ?? 'N/A'}
            />
            <HeroStat
              label="References"
              value={summary?.sources_count ?? 0}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <div className="text-3xl font-bold text-gray-900 dark:text-white">{value}</div>
      <div className="text-sm text-gray-600 dark:text-gray-400">{label}</div>
    </div>
  );
}
