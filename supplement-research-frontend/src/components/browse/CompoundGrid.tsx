import React from 'react';
import { Link } from 'react-router-dom';
import { Compound } from '../../types/compound';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { CompareButton } from '../ui/CompareButton';
import { formatCompoundCategory, formatSafetyRating } from '../../utils/formatters';

export function CompoundGrid({ compounds }: { compounds: Compound[] }) {
  if (!compounds || compounds.length === 0) {
    return (
      <p className="text-gray-500 dark:text-gray-400 mt-20 text-center">
        No compounds match your filters.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
      {compounds.map((c) => (
        <Card key={c.id} className="hover-lift group">
          <Link to={`/compound/${c.id}`}>
            <CardHeader className="pb-3">
              <CardTitle className="group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {c.name}
              </CardTitle>
              {c.synonyms?.length > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  aka {c.synonyms[0]}
                </p>
              )}
            </CardHeader>

            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <Badge variant={`category-${c.category}` as any}>
                  {formatCompoundCategory(c.category)}
                </Badge>
                <Badge variant={`safety-${c.safety_rating.toLowerCase()}` as any}>
                  {c.safety_rating}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-600 dark:text-gray-300 flex-1">
                  {formatSafetyRating(c.safety_rating)} safety&nbsp;&middot;&nbsp;
                  {c.legal_status.replace('_', ' ')}
                </p>
                <div className="ml-2" onClick={(e) => e.preventDefault()}>
                  <CompareButton compound={c} />
                </div>
              </div>
            </CardContent>
          </Link>
        </Card>
      ))}
    </div>
  );
}
