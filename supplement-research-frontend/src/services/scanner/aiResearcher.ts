import { ParsedIngredient } from '../../types/scanner';

export interface AIResearchResult {
  ingredient_name: string;
  common_names: string[];
  category: string;
  description: string;
  benefits: string[];
  side_effects: string[];
  dosage_info: {
    typical_range: string;
    recommended_dose: string;
    timing: string;
  };
  interactions: string[];
  safety_profile: {
    rating: 'low' | 'moderate' | 'high';
    warnings: string[];
    contraindications: string[];
  };
  research_notes: string;
  confidence_score: number;
  sources: string[];
  last_updated: string;
}

export class AIResearcher {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.REACT_APP_OPENAI_API_KEY || '';
  }

  async researchIngredient(ingredient: ParsedIngredient): Promise<AIResearchResult> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key required for AI research. Please add REACT_APP_OPENAI_API_KEY to your environment variables.');
    }

    try {
      console.log(`🔬 Starting AI research for: ${ingredient.name}`);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini', // Updated to use GPT-4o mini
          messages: [
            {
              role: 'system',
              content: `You are an expert nutritionist, pharmacologist, and supplement researcher with access to extensive scientific literature. When given an ingredient name, provide a comprehensive, evidence-based analysis including benefits, risks, dosing, and interactions. Always be accurate and cite scientific understanding. Your responses should be detailed yet concise, focusing on practical, actionable information. Format your response as valid JSON only.`
            },
            {
              role: 'user',
              content: this.buildResearchPrompt(ingredient)
            }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1, // Low temperature for consistency
          max_tokens: 3000, // Increased token limit for comprehensive research
          top_p: 0.1, // Focus on most likely completions
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API error (${response.status}): ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response format from OpenAI API');
      }

      const researchData = JSON.parse(data.choices[0].message.content || '{}');
      const result = this.validateAndStructureResult(ingredient, researchData);
      
      console.log(`✅ AI research completed for ${ingredient.name} with ${Math.round(result.confidence_score * 100)}% confidence`);
      
      return result;
    } catch (error) {
      console.error('❌ AI research failed:', error);
      
      // Fixed: Proper error type assertion
      const errorMessage = (error as Error).message;
      
      // Provide helpful error messages
      if (errorMessage.includes('API key')) {
        throw new Error('Invalid OpenAI API key. Please check your REACT_APP_OPENAI_API_KEY environment variable.');
      } else if (errorMessage.includes('429')) {
        throw new Error('OpenAI API rate limit exceeded. Please try again in a moment.');
      } else if (errorMessage.includes('insufficient_quota')) {
        throw new Error('OpenAI API quota exceeded. Please check your account billing.');
      } else {
        throw new Error(`Failed to research ingredient: ${errorMessage}`);
      }
    }
  }

  private buildResearchPrompt(ingredient: ParsedIngredient): string {
    return `
Research this supplement ingredient and provide comprehensive information in JSON format:

**Ingredient Details:**
- Name: "${ingredient.name}"
- Extracted dosage: ${ingredient.dosage?.amount || 'unknown'} ${ingredient.dosage?.unit || ''}
- Context from label: "${ingredient.raw_text}"
- Ingredient type: ${ingredient.type}

**Required JSON Response Structure:**
{
  "ingredient_name": "standardized ingredient name (correct any misspellings)",
  "common_names": ["alternative names", "synonyms", "brand names", "scientific name"],
  "category": "vitamin|mineral|herb|amino_acid|nootropic|probiotic|enzyme|fatty_acid|other",
  "description": "detailed description of what this ingredient is, its primary functions, and mechanism of action",
  "benefits": [
    "evidence-based benefit 1 (mention study types if available)",
    "evidence-based benefit 2 (mention study types if available)",
    "evidence-based benefit 3 (mention study types if available)"
  ],
  "side_effects": [
    "potential side effect 1 (mention frequency/severity)",
    "potential side effect 2 (mention frequency/severity)"
  ],
  "dosage_info": {
    "typical_range": "typical dosage range found in supplements (e.g., 100-500mg daily)",
    "recommended_dose": "evidence-based recommended dose for adults",
    "timing": "optimal timing (with food, empty stomach, morning, evening, etc.)"
  },
  "interactions": [
    "drug or supplement interaction 1 (explain mechanism)",
    "drug or supplement interaction 2 (explain mechanism)"
  ],
  "safety_profile": {
    "rating": "low|moderate|high",
    "warnings": ["important warning 1", "important warning 2"],
    "contraindications": ["who should avoid this", "medical conditions that contraindicate use"]
  },
  "research_notes": "summary of current research status, study quality, evidence strength, and any limitations",
  "confidence_score": 0.95,
  "sources": ["general reference to research areas", "types of studies available", "regulatory status"]
}

**Research Focus Areas:**
1. Accurate scientific information based on peer-reviewed research
2. Evidence-based benefits with strength of evidence
3. Practical dosing guidance for consumers
4. Important safety considerations and warnings
5. Drug/supplement interactions with mechanisms
6. Population-specific considerations (pregnancy, age, conditions)
7. Quality of available research and evidence gaps

**Guidelines:**
- Prioritize human clinical trials over animal studies
- Mention when evidence is limited or conflicting
- Be specific about dosages and timing
- Include both therapeutic and supplement contexts
- Consider bioavailability and absorption factors
- Note any regulatory status (FDA approved, GRAS, etc.)

Provide comprehensive yet practical information that helps users make informed decisions.
    `;
  }

  private validateAndStructureResult(ingredient: ParsedIngredient, data: any): AIResearchResult {
    // Validate required fields and provide sensible defaults
    const result: AIResearchResult = {
      ingredient_name: this.sanitizeString(data.ingredient_name) || ingredient.name,
      common_names: Array.isArray(data.common_names) 
        ? data.common_names.filter((name: any) => typeof name === 'string' && name.trim())
        : [],
      category: this.validateCategory(data.category),
      description: this.sanitizeString(data.description) || 'No description available from current research.',
      benefits: Array.isArray(data.benefits) 
        ? data.benefits.filter((benefit: any) => typeof benefit === 'string' && benefit.trim())
        : [],
      side_effects: Array.isArray(data.side_effects) 
        ? data.side_effects.filter((effect: any) => typeof effect === 'string' && effect.trim())
        : [],
      dosage_info: {
        typical_range: this.sanitizeString(data.dosage_info?.typical_range) || 'Varies by product and intended use',
        recommended_dose: this.sanitizeString(data.dosage_info?.recommended_dose) || 'Consult healthcare provider for personalized dosing',
        timing: this.sanitizeString(data.dosage_info?.timing) || 'Follow product instructions'
      },
      interactions: Array.isArray(data.interactions) 
        ? data.interactions.filter((interaction: any) => typeof interaction === 'string' && interaction.trim())
        : [],
      safety_profile: {
        rating: this.validateSafetyRating(data.safety_profile?.rating),
        warnings: Array.isArray(data.safety_profile?.warnings) 
          ? data.safety_profile.warnings.filter((warning: any) => typeof warning === 'string' && warning.trim())
          : [],
        contraindications: Array.isArray(data.safety_profile?.contraindications) 
          ? data.safety_profile.contraindications.filter((contra: any) => typeof contra === 'string' && contra.trim())
          : []
      },
      research_notes: this.sanitizeString(data.research_notes) || 'Limited research available. More studies needed to establish definitive benefits and safety profile.',
      confidence_score: this.validateConfidenceScore(data.confidence_score),
      sources: Array.isArray(data.sources) 
        ? data.sources.filter((source: any) => typeof source === 'string' && source.trim())
        : ['General nutritional databases', 'Scientific literature review'],
      last_updated: new Date().toISOString()
    };

    // Log research quality
    console.log(`📊 Research quality for ${ingredient.name}:`, {
      benefits: result.benefits.length,
      side_effects: result.side_effects.length,
      interactions: result.interactions.length,
      confidence: Math.round(result.confidence_score * 100) + '%'
    });

    return result;
  }

  private sanitizeString(value: any): string {
    if (typeof value !== 'string') return '';
    return value.trim().substring(0, 1000); // Limit length to prevent overflow
  }

  private validateCategory(category: any): string {
    const validCategories = ['vitamin', 'mineral', 'herb', 'amino_acid', 'nootropic', 'probiotic', 'enzyme', 'fatty_acid', 'other'];
    if (typeof category === 'string' && validCategories.includes(category.toLowerCase())) {
      return category.toLowerCase();
    }
    return 'other';
  }

  private validateSafetyRating(rating: any): 'low' | 'moderate' | 'high' {
    if (typeof rating === 'string') {
      const lowerRating = rating.toLowerCase();
      if (['low', 'moderate', 'high'].includes(lowerRating)) {
        return lowerRating as 'low' | 'moderate' | 'high';
      }
    }
    return 'moderate'; // Default to moderate risk
  }

  private validateConfidenceScore(score: any): number {
    if (typeof score === 'number' && score >= 0 && score <= 1) {
      return score;
    }
    return 0.75; // Default confidence score
  }

  // Method to test API connectivity
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // Method to get estimated cost for research
  getEstimatedCost(): string {
    return 'Approximately $0.001-0.003 per ingredient research with GPT-4o mini';
  }
}
