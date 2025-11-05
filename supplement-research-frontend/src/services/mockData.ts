import { Compound, CompoundDetailed, Study, DosageInfo } from '../types/compound';

// Mock compounds data for development
export const mockCompounds: Compound[] = [
  {
    id: '1',
    name: 'Creatine Monohydrate',
    synonyms: ['Creatine', 'N-methylguanidino acetic acid'],
    category: 'supplement',
    legal_status: 'legal',
    safety_rating: 'A',
    molecular_weight: 169.07,
    formula: 'C4H9N3O2·H2O',
    cas_number: '6020-87-7',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Ashwagandha',
    synonyms: ['Withania somnifera', 'Indian Winter Cherry'],
    category: 'herb',
    legal_status: 'legal',
    safety_rating: 'B',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    name: 'Omega-3 Fatty Acids',
    synonyms: ['Fish Oil', 'EPA/DHA'],
    category: 'supplement',
    legal_status: 'legal',
    safety_rating: 'A',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '4',
    name: 'Lion\'s Mane',
    synonyms: ['Hericium erinaceus'],
    category: 'nootropic',
    legal_status: 'legal',
    safety_rating: 'B',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '5',
    name: 'Ostarine (MK-2866)',
    synonyms: ['MK-2866', 'Enobosarm'],
    category: 'sarm',
    legal_status: 'research_only',
    safety_rating: 'C',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '6',
    name: 'BPC-157',
    synonyms: ['Body Protective Compound'],
    category: 'peptide',
    legal_status: 'research_only',
    safety_rating: 'C',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

export const mockStats = {
  total_compounds: 767,
  total_studies: 25247,
  total_with_studies: 417,
  categories: {
    supplement: 245,
    nootropic: 156,
    sarm: 89,
    peptide: 127,
    herb: 95,
    vitamin: 45,
    mineral: 10,
  }
};

export const featuredCompounds = [
  mockCompounds[0], // Creatine
  mockCompounds[1], // Ashwagandha
  mockCompounds[2], // Omega-3
  mockCompounds[3], // Lion's Mane
];

// Mock search function
export function mockSearch(query: string): Compound[] {
  if (!query || query.length < 2) return [];
  
  return mockCompounds.filter(compound =>
    compound.name.toLowerCase().includes(query.toLowerCase()) ||
    compound.synonyms.some(synonym => 
      synonym.toLowerCase().includes(query.toLowerCase())
    )
  );
}
