import React from 'react';
import { CompoundDetailed } from '../../types/compound';
import { Badge } from '../ui/Badge';
import { formatSafetyRating } from '../../utils/formatters';

interface Props { compound: CompoundDetailed; }

export function SafetyProfile({ compound }: Props) {
  return (
    <>
      <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
        Safety & Contraindications
      </h3>

      <div className="space-y-6">
        <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Overall Rating</h4>
          <Badge variant={`safety-${compound.safety_rating.toLowerCase()}` as any}>
            {compound.safety_rating} – {formatSafetyRating(compound.safety_rating)}
          </Badge>
        </div>

        <Section title="Side Effects">
          {compound.summary?.side_effects ?? 'No data.'}
        </Section>

        <Section title="Contra-indications">
          {compound.summary?.contraindications ?? 'No data.'}
        </Section>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">{title}</h4>
      <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">{children}</p>
    </div>
  );
}
