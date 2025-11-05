import { ParsedIngredient, IngredientType } from '../../types/scanner';

export class IngredientParser {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.REACT_APP_OPENAI_API_KEY || '';
  }

  async parseIngredients(extractedText: string, scanType: string = 'supplement'): Promise<ParsedIngredient[]> {
    // If we have OpenAI API key, use AI parsing
    if (this.apiKey) {
      try {
        return await this.parseWithAI(extractedText, scanType);
      } catch (error) {
        console.warn('AI parsing failed, falling back to rule-based parsing:', error);
      }
    }

    // Fallback to rule-based parsing
    return this.parseWithRules(extractedText);
  }

  private async parseWithAI(text: string, scanType: string): Promise<ParsedIngredient[]> {
    const prompt = this.buildParsingPrompt(text, scanType);
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are an expert nutritionist and supplement analyst. Parse supplement labels with extreme precision.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const parsedData = JSON.parse(data.choices[0].message.content || '{}');
      return this.validateAndStructureIngredients(parsedData.ingredients || []);
    } catch (error) {
      console.error('AI parsing failed:', error);
      throw error;
    }
  }

  private buildParsingPrompt(text: string, scanType: string): string {
    return `
Parse this ${scanType} label text and extract ALL ingredients with their details. Return JSON in this exact format:

{
  "ingredients": [
    {
      "name": "exact ingredient name",
      "common_names": ["alternative names", "synonyms"],
      "amount": number,
      "unit": "mg|g|mcg|iu|%dv",
      "daily_value_percentage": number or null,
      "type": "active|inactive|carrier|preservative|flavoring",
      "confidence": number between 0 and 1,
      "raw_text": "original text this was extracted from"
    }
  ]
}

Text to parse:
${text}
    `;
  }

  private parseWithRules(text: string): ParsedIngredient[] {
    const lines = text.split('\n').filter(line => line.trim());
    const ingredients: ParsedIngredient[] = [];

    for (const line of lines) {
      const parsed = this.parseLineWithRegex(line);
      if (parsed) {
        ingredients.push(parsed);
      }
    }

    return ingredients;
  }

  private parseLineWithRegex(line: string): ParsedIngredient | null {
    const patterns = [
      /([A-Za-z\s\-()]+)\s+(\d+(?:\.\d+)?)\s*(mg|mcg|g|iu|%)/i,
      /([A-Za-z\s\-()]+?)\s*\([^)]+\)\s*(\d+(?:\.\d+)?)\s*(mg|mcg|g|iu|%)/i,
      /([A-Za-z\s\-()]+)\s+(\d+(?:\.\d+)?)\s*%/i,
      /([A-Za-z\s\-()]+?)\s+(\d+(?:\.\d+)?)\s*(mg|mcg|g|iu)/i
    ];

    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match && match[1] && match[2]) {
        const name = this.cleanIngredientName(match[1]);
        if (name.length > 2) {
          return {
            name,
            common_names: [],
            dosage: {
              amount: parseFloat(match[2]),
              unit: this.standardizeUnit(match[3] || 'mg'),
              daily_value_percentage: match[3] === '%' ? parseFloat(match[2]) : null,
              per_serving: true
            },
            type: this.categorizeIngredientType(name),
            confidence: 0.7,
            raw_text: line.trim(),
            extracted_at: new Date().toISOString()
          };
        }
      }
    }

    return null;
  }

  private cleanIngredientName(name: string): string {
    return name
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[()[\]]/g, '')
      .replace(/\b(as|from|extract|powder|capsule|tablet)\b/gi, '')
      .replace(/^\W+|\W+$/g, '')
      .trim();
  }

  private standardizeUnit(unit: string): string {
    if (!unit) return 'mg';
    
    const unitMap: Record<string, string> = {
      'milligram': 'mg',
      'milligrams': 'mg',
      'mg.': 'mg',
      'microgram': 'mcg',
      'micrograms': 'mcg',
      'μg': 'mcg',
      'gram': 'g',
      'grams': 'g',
      'g.': 'g',
      'international unit': 'iu',
      'international units': 'iu',
      'i.u.': 'iu',
      'iu.': 'iu',
      'percent': '%',
      '%dv': '%'
    };

    const normalized = unit.toLowerCase().trim();
    return unitMap[normalized] || normalized;
  }

  private categorizeIngredientType(name: string): IngredientType {
    const nameL = name.toLowerCase();
    
    const inactiveKeywords = [
      'cellulose', 'stearate', 'dioxide', 'gelatin', 'hypromellose', 
      'dicalcium phosphate', 'silicon', 'talc', 'croscarmellose',
      'microcrystalline', 'povidone', 'lactose', 'maltodextrin'
    ];
    if (inactiveKeywords.some(keyword => nameL.includes(keyword))) {
      return 'inactive';
    }

    const preservativeKeywords = [
      'sodium benzoate', 'potassium sorbate', 'citric acid', 'ascorbic acid',
      'tocopherol', 'bht', 'bha'
    ];
    if (preservativeKeywords.some(keyword => nameL.includes(keyword))) {
      return 'preservative';
    }

    const flavoringKeywords = [
      'natural flavor', 'artificial flavor', 'stevia', 'sucralose', 
      'vanilla', 'chocolate', 'berry', 'citrus', 'mint'
    ];
    if (flavoringKeywords.some(keyword => nameL.includes(keyword))) {
      return 'flavoring';
    }

    const carrierKeywords = [
      'rice flour', 'corn starch', 'tapioca', 'coconut oil'
    ];
    if (carrierKeywords.some(keyword => nameL.includes(keyword))) {
      return 'carrier';
    }

    return 'active';
  }

  private validateAndStructureIngredients(rawIngredients: any[]): ParsedIngredient[] {
    return rawIngredients
      .filter(ing => ing.name && ing.name.trim())
      .map(ing => this.structureIngredient(ing))
      .filter(ing => ing.confidence > 0.3);
  }

  private structureIngredient(raw: any): ParsedIngredient {
    const standardizedUnit = this.standardizeUnit(raw.unit);
    const normalizedAmount = parseFloat(raw.amount) || 0;

    return {
      name: this.cleanIngredientName(raw.name),
      common_names: Array.isArray(raw.common_names) ? raw.common_names : [],
      dosage: {
        amount: normalizedAmount,
        unit: standardizedUnit,
        daily_value_percentage: raw.daily_value_percentage,
        per_serving: true
      },
      type: this.categorizeIngredientType(raw.name),
      confidence: Math.min(1, Math.max(0, raw.confidence || 0.5)),
      raw_text: raw.raw_text || raw.name,
      extracted_at: new Date().toISOString()
    };
  }
}
