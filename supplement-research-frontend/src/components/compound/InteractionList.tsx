import React from 'react';
import { Badge } from '../ui/Badge';

interface SimpleInteraction {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'moderate' | 'high';
  type: string;
}

interface Props {
  interactions: SimpleInteraction[];
}

const getSeverityBadgeVariant = (severity: string) => {
  switch (severity) {
    case 'high':
      return 'destructive';
    case 'moderate':
      return 'warning';
    case 'low':
      return 'secondary';
    default:
      return 'outline';
  }
};

export function InteractionList({ interactions }: Props) {
  if (interactions.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">No documented interactions</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            This compound has no known interactions in our database.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Drug & Supplement Interactions
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {interactions.length} documented interaction{interactions.length !== 1 ? 's' : ''}
        </p>
      </div>
      
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {interactions.map((interaction) => (
          <div key={interaction.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  {interaction.name}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {interaction.description}
                </p>
                <div className="flex items-center mt-2 space-x-2">
                  <Badge variant={getSeverityBadgeVariant(interaction.severity)}>
                    {interaction.severity} severity
                  </Badge>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {interaction.type}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
