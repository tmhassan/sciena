import React from 'react';
import { SAFETY_RATINGS, EVIDENCE_GRADES, COMPOUND_CATEGORIES } from '../../utils/constants';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';

interface Props {
  activeFilters: Record<string, any>;
  onChange: (f: Record<string, any>) => void;
  sortBy: 'az' | 'evidence' | 'safety';
  onSortChange: (s: 'az' | 'evidence' | 'safety') => void;
}

export function FilterPanel({ activeFilters, onChange, sortBy, onSortChange }: Props) {
  /* helper to toggle array filters */
  const toggle = (key: string, value: string) => {
    const prev = activeFilters[key] ?? [];
    const next = prev.includes(value) ? prev.filter((v: string) => v !== value) : [...prev, value];
    onChange({ ...activeFilters, [key]: next });
  };

  return (
    <aside className="w-64 hidden lg:block">
      <div className="sticky top-24 space-y-8">
        <FilterSection title="Category">
          {COMPOUND_CATEGORIES.map((c) => (
            <FilterChip
              key={c.value}
              label={c.label}
              active={(activeFilters.category ?? []).includes(c.value)}
              onClick={() => toggle('category', c.value)}
            />
          ))}
        </FilterSection>

        <FilterSection title="Safety">
          {SAFETY_RATINGS.map((s) => (
            <FilterChip
              key={s.value}
              label={s.value}
              active={(activeFilters.safety_rating ?? []).includes(s.value)}
              onClick={() => toggle('safety_rating', s.value)}
            />
          ))}
        </FilterSection>

        <FilterSection title="Evidence">
          {EVIDENCE_GRADES.map((g) => (
            <FilterChip
              key={g.value}
              label={g.value}
              active={(activeFilters.evidence_grade ?? []).includes(g.value)}
              onClick={() => toggle('evidence_grade', g.value)}
            />
          ))}
        </FilterSection>

        <FilterSection title="Sort By">
          {(['az', 'evidence', 'safety'] as const).map((opt) => (
            <FilterChip
              key={opt}
              label={opt === 'az' ? 'A-Z' : opt.charAt(0).toUpperCase() + opt.slice(1)}
              active={sortBy === opt}
              onClick={() => onSortChange(opt)}
            />
          ))}
        </FilterSection>
      </div>
    </aside>
  );
}

/* ------------ sub-components ------------ */
function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-3 font-semibold text-gray-900 dark:text-white">{title}</h4>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Badge
      variant={active ? 'default' : 'outline'}
      className={cn(
        'cursor-pointer select-none transition-all duration-200',
        active && 'bg-primary-600 text-white hover:bg-primary-700',
        !active && 'hover:bg-gray-100 dark:hover:bg-gray-700'
      )}
      onClick={onClick}
    >
      {label}
    </Badge>
  );
}
