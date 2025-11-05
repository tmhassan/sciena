import React, { Fragment } from 'react';
import { Tab } from '@headlessui/react';
import { CompoundDetailed } from '../../types/compound';
import { EvidenceTable } from './EvidenceTable';
import { DosageTable } from './DosageTable';
import { SafetyProfile } from './SafetyProfile';
import { InteractionList } from './InteractionList';
import { cn } from '../../utils/cn';

interface Props { 
  compound: CompoundDetailed; 
}

// Define a simplified interaction interface that matches what InteractionList expects
interface SimpleInteraction {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'moderate' | 'high';
  type: string;
}

export function CompoundTabs({ compound }: Props) {
  // Transform string interactions to SimpleInteraction objects for the InteractionList component
  const transformedInteractions: SimpleInteraction[] = React.useMemo(() => {
    const interactions = compound.summary?.interactions || [];
    
    return interactions.map((interaction: any, index: number) => {
      if (typeof interaction === 'string') {
        return {
          id: `interaction-${index}`,
          name: interaction,
          description: interaction,
          severity: 'moderate' as const,
          type: 'drug-supplement'
        };
      } else if (typeof interaction === 'object' && interaction !== null) {
        return {
          id: interaction.id || `interaction-${index}`,
          name: interaction.name || interaction.description || String(interaction),
          description: interaction.description || interaction.name || String(interaction),
          severity: (interaction.severity as 'low' | 'moderate' | 'high') || 'moderate',
          type: interaction.type || 'drug-supplement'
        };
      } else {
        return {
          id: `interaction-${index}`,
          name: String(interaction),
          description: String(interaction),
          severity: 'moderate' as const,
          type: 'drug-supplement'
        };
      }
    });
  }, [compound.summary?.interactions]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <Tab.Group as={Fragment}>
        <Tab.List className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700">
          {['Overview', 'Evidence', 'Dosage', 'Safety', 'Interactions'].map((category) => (
            <Tab
              key={category}
              className={({ selected }) =>
                cn(
                  'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm',
                  selected
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-200 dark:hover:border-gray-600'
                )
              }
            >
              {category}
            </Tab>
          ))}
        </Tab.List>
        
        <Tab.Panels className="mt-8">
          <Tab.Panel>
            <OverviewPanel 
              summary={compound.summary?.overview || 'No summary available.'} 
              compound={compound}
            />
          </Tab.Panel>
          
          <Tab.Panel>
            <EvidenceTable studies={compound.studies || []} />
          </Tab.Panel>
          
          <Tab.Panel>
            <DosageTable dosage={compound.dosage_info || []} />
          </Tab.Panel>
          
          <Tab.Panel>
            <SafetyProfile compound={compound} />
          </Tab.Panel>
          
          <Tab.Panel>
            <InteractionList interactions={transformedInteractions} />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}

// Enhanced Overview Panel Component
interface OverviewPanelProps {
  summary: string;
  compound: CompoundDetailed;
}

function OverviewPanel({ summary, compound }: OverviewPanelProps) {
  const benefits = compound.summary?.benefits || [];
  const mechanismOfAction = compound.summary?.mechanism_of_action || [];

  return (
    <div className="space-y-6">
      {/* Main Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Compound Overview
        </h3>
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {summary.split('\n').map((paragraph, index) => {
              const trimmedParagraph = paragraph.trim();
              if (!trimmedParagraph) return null;
              
              return (
                <p key={index} className="mb-4 last:mb-0">
                  {trimmedParagraph}
                </p>
              );
            }).filter(Boolean)}
          </div>
        </div>
      </div>

      {/* Mechanism of Action */}
      {mechanismOfAction.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Mechanism of Action
          </h3>
          <div className="space-y-2">
            {mechanismOfAction.map((mechanism, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0"></div>
                <span className="text-gray-700 dark:text-gray-300">{mechanism}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Benefits */}
      {benefits.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Key Benefits
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {benefits.slice(0, 4).map((benefit: any, index: number) => (
              <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                  {benefit.indication || 'Benefit'}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  {benefit.population || 'General population'}
                </p>
                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-1 rounded ${
                    benefit.evidence_strength === 'A' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    benefit.evidence_strength === 'B' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
                  }`}>
                    Grade {benefit.evidence_strength || 'Unknown'}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {benefit.effect_size || 'Unknown'} effect
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
