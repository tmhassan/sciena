import { ParsedIngredient, CompoundMatch, DosageAnalysis } from '../../types/scanner';
import { compoundService } from '../api';
import { Compound } from '../../types/compound';

export class CompoundMatcher {
  private compoundCache: Map<string, Compound> = new Map();
  private synonymCache: Map<string, string[]> = new Map();

  constructor() {
    this.initializeCache();
  }

  private async initializeCache(): Promise<void> {
    try {
      const compounds = await compoundService.getAll({ per_page: 1000 });
      
      for (const compound of compounds.data) {
        this.compoundCache.set(compound.id, compound);
        
        const synonyms = [
          compound.name.toLowerCase(),
          ...(compound.synonyms || []).map((s: string) => s.toLowerCase())
        ];
        
        for (const synonym of synonyms) {
          if (!this.synonymCache.has(synonym)) {
            this.synonymCache.set(synonym, []);
          }
          this.synonymCache.get(synonym)!.push(compound.id);
        }
      }

      console.log(`Loaded ${compounds.data.length} compounds into cache`);
    } catch (error) {
      console.error('Failed to initialize compound cache:', error);
    }
  }

  async findMatches(ingredients: ParsedIngredient[]): Promise<CompoundMatch[]> {
    const matches: CompoundMatch[] = [];

    for (const ingredient of ingredients) {
      const match = await this.findBestMatch(ingredient);
      if (match) {
        matches.push(match);
      }
    }

    return matches.sort((a, b) => b.confidence - a.confidence);
  }

  private async findBestMatch(ingredient: ParsedIngredient): Promise<CompoundMatch | null> {
    const candidates = this.findCandidates(ingredient.name);
    
    if (candidates.length === 0) {
      return this.createUnmatchedEntry(ingredient);
    }

    const scoredCandidates = candidates.map(compound => ({
      compound,
      score: this.calculateMatchScore(ingredient, compound)
    }));

    const bestMatch = scoredCandidates.reduce((best, current) => 
      current.score > best.score ? current : best
    );

    if (bestMatch.score < 0.4) {
      return this.createUnmatchedEntry(ingredient);
    }

    return this.createCompoundMatch(ingredient, bestMatch.compound, bestMatch.score);
  }

  private findCandidates(ingredientName: string): Compound[] {
    const searchTerms = this.generateSearchTerms(ingredientName);
    const candidateIds = new Set<string>();

    for (const term of searchTerms) {
      const matches = this.synonymCache.get(term.toLowerCase()) || [];
      matches.forEach(id => candidateIds.add(id));
    }

    return Array.from(candidateIds)
      .map(id => this.compoundCache.get(id))
      .filter((compound): compound is Compound => compound !== undefined);
  }

  private generateSearchTerms(name: string): string[] {
    const terms = [name];
    
    const cleaned = name
      .replace(/\b(extract|powder|capsule|tablet|complex|blend)\b/gi, '')
      .replace(/\b(dl-|l-|d-)\b/gi, '')
      .trim();

    if (cleaned !== name) {
      terms.push(cleaned);
    }

    const words = cleaned.split(/\s+/);
    if (words.length > 1) {
      terms.push(...words.filter(word => word.length > 3));
    }

    return terms;
  }

  private calculateMatchScore(ingredient: ParsedIngredient, compound: Compound): number {
    let score = 0;

    if (ingredient.name.toLowerCase() === compound.name.toLowerCase()) {
      score += 1.0;
    } else {
      score += this.calculateStringSimilarity(ingredient.name, compound.name);
    }

    if (compound.synonyms) {
      const synonymMatches = compound.synonyms.some((synonym: string) => 
        this.calculateStringSimilarity(ingredient.name, synonym) > 0.8
      );
      if (synonymMatches) score += 0.3;
    }

    if (this.isLikelyMatch(ingredient, compound)) {
      score += 0.2;
    }

    return Math.min(1, score);
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    if (s1 === s2) return 1;
    if (s1.includes(s2) || s2.includes(s1)) return 0.8;

    const distance = this.levenshteinDistance(s1, s2);
    const maxLength = Math.max(s1.length, s2.length);
    return maxLength === 0 ? 1 : 1 - distance / maxLength;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  private isLikelyMatch(ingredient: ParsedIngredient, compound: Compound): boolean {
    if (ingredient.dosage && this.isDosageReasonable(ingredient.dosage.amount, compound)) {
      return true;
    }

    if (ingredient.type === 'active' && compound.category === 'supplement') {
      return true;
    }

    return false;
  }

  private isDosageReasonable(amount: number, compound: Compound): boolean {
    const dosageRanges: Record<string, { min: number; max: number }> = {
      'supplement': { min: 1, max: 5000 },
      'nootropic': { min: 1, max: 2000 },
      'vitamin': { min: 0.1, max: 1000 },
      'mineral': { min: 1, max: 2000 }
    };

    const range = dosageRanges[compound.category] || dosageRanges['supplement'];
    return amount >= range.min && amount <= range.max;
  }

  private createCompoundMatch(
    ingredient: ParsedIngredient,
    compound: Compound,
    confidence: number
  ): CompoundMatch {
    return {
      id: `match_${compound.id}_${Date.now()}`,
      ingredient_name: ingredient.name,
      compound_id: compound.id,
      compound_name: compound.name,
      compound_category: compound.category,
      confidence,
      dosage_analysis: this.analyzeDosage(ingredient),
      safety_rating: compound.safety_rating,
      legal_status: compound.legal_status,
      matched_synonyms: this.findMatchedSynonyms(ingredient.name, compound),
      research_url: `/compound/${compound.id}`
    };
  }

  private analyzeDosage(ingredient: ParsedIngredient): DosageAnalysis {
    if (!ingredient.dosage) {
      return {
        status: 'unknown',
        message: 'No dosage information available'
      };
    }

    const amount = ingredient.dosage.amount;
    
    if (amount > 5000) {
      return {
        status: 'excessive',
        message: 'Dosage appears high compared to typical recommendations',
        recommended_range: '10-2000mg daily'
      };
    }

    if (amount < 1) {
      return {
        status: 'low',
        message: 'Dosage appears low for therapeutic effect',
        recommended_range: '10-2000mg daily'
      };
    }

    return {
      status: 'normal',
      message: 'Dosage within typical range',
      recommended_range: '10-2000mg daily'
    };
  }

  private findMatchedSynonyms(ingredientName: string, compound: Compound): string[] {
    const matched: string[] = [];
    
    if (compound.synonyms) {
      for (const synonym of compound.synonyms) {
        if (this.calculateStringSimilarity(ingredientName, synonym) > 0.7) {
          matched.push(synonym);
        }
      }
    }

    return matched;
  }

  private createUnmatchedEntry(ingredient: ParsedIngredient): CompoundMatch {
    return {
      id: `unmatched_${Date.now()}`,
      ingredient_name: ingredient.name,
      compound_id: null,
      compound_name: null,
      compound_category: null,
      confidence: 0,
      dosage_analysis: {
        status: 'unknown',
        message: 'Ingredient not found in database'
      },
      safety_rating: null,
      legal_status: null,
      matched_synonyms: [],
      research_url: null
    };
  }
}
