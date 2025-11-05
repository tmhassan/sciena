import React from 'react';
import { Study } from '../../types/compound';
import { formatPublicationDate, formatStudyType } from '../../utils/formatters';

interface Props { studies: Study[]; }

export function EvidenceTable({ studies }: Props) {
  if (studies.length === 0) {
    return <p className="text-gray-500 dark:text-gray-400">No studies recorded.</p>;
  }

  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <Th>Year</Th>
            <Th>Study</Th>
            <Th>Type</Th>
            <Th>Evidence</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {studies.map((s) => (
            <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
              <Td>{formatPublicationDate(s.publication_date)}</Td>
              <Td>
                <a
                  href={s.doi ? `https://doi.org/${s.doi}` : s.pmid ? `https://pubmed.ncbi.nlm.nih.gov/${s.pmid}` : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 dark:text-primary-400 underline-offset-2 hover:underline"
                >
                  {s.title}
                </a>
              </Td>
              <Td>{formatStudyType(s.study_type)}</Td>
              <Td className="text-center">{s.evidence_level}</Td>
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
