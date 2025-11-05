import React from 'react';
import { DosageInfo } from '../../types/compound';
import { formatDosage } from '../../utils/formatters';

interface Props { dosage: DosageInfo[]; }

export function DosageTable({ dosage }: Props) {
  if (dosage.length === 0) {
    return <p className="text-gray-500 dark:text-gray-400">No dosage guidance available.</p>;
  }

  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <Th>Form</Th>
            <Th>Route</Th>
            <Th>Dosage (range)</Th>
            <Th>Frequency</Th>
            <Th>Population</Th>
            <Th>Evidence</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {dosage.map((d) => (
            <tr key={d.id}>
              <Td>{d.form}</Td>
              <Td>{d.route}</Td>
              <Td>{formatDosage(d.dose_min, d.dose_max, d.dose_unit)}</Td>
              <Td>{d.frequency ?? '—'}</Td>
              <Td>{d.population.replace('_', ' ')}</Td>
              <Td>{d.evidence_level}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const Th: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = (p) => (
  <th {...p} className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200" />
);
const Td: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = (p) => (
  <td {...p} className="px-4 py-3 text-gray-600 dark:text-gray-300" />
);
