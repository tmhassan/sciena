import { ScanRequest, ScanResult, ParsedIngredient, CompoundMatch, SafetyReport } from '../../types/scanner';
import { OCREngine } from './ocrEngine';
import { IngredientParser } from './ingredientParser';
import { CompoundMatcher } from './compoundMatcher';
import { SafetyAnalyzer } from './safetyAnalyzer';

export class ScannerService {
  private ocrEngine: OCREngine;
  private ingredientParser: IngredientParser;
  private compoundMatcher: CompoundMatcher;
  private safetyAnalyzer: SafetyAnalyzer;

  constructor() {
    this.ocrEngine = new OCREngine();
    this.ingredientParser = new IngredientParser();
    this.compoundMatcher = new CompoundMatcher();
    this.safetyAnalyzer = new SafetyAnalyzer();
  }

  async processScan(request: ScanRequest): Promise<ScanResult> {
    try {
      const scanId = this.generateScanId();
      
      console.log('Starting scan processing...');
      
      // Step 1: Extract text using OCR
      console.log('Step 1: Extracting text with OCR...');
      const extractedText = await this.ocrEngine.extractText(request.image);
      console.log('OCR Result:', extractedText.substring(0, 200) + '...');
      
      // Step 2: Parse ingredients using AI/rules
      console.log('Step 2: Parsing ingredients...');
      const ingredients = await this.ingredientParser.parseIngredients(
        extractedText,
        request.scan_type
      );
      console.log('Parsed ingredients:', ingredients.length);
      
      // Step 3: Match ingredients against compound database
      console.log('Step 3: Matching compounds...');
      const matches = await this.compoundMatcher.findMatches(ingredients);
      console.log('Found matches:', matches.length);
      
      // Step 4: Perform safety analysis
      console.log('Step 4: Analyzing safety...');
      const safetyAnalysis = await this.safetyAnalyzer.analyzeSafety(matches);
      
      // Step 5: Generate recommendations
      console.log('Step 5: Generating recommendations...');
      const recommendations = await this.generateRecommendations(matches, safetyAnalysis);
      
      // Step 6: Calculate confidence score
      const confidenceScore = this.calculateConfidenceScore(ingredients, matches);

      const result: ScanResult = {
        scan_id: scanId,
        extracted_text: extractedText,
        ingredients,
        matches,
        safety_analysis: safetyAnalysis,
        recommendations,
        confidence_score: confidenceScore,
        processed_at: new Date().toISOString()
      };

      console.log('Scan processing completed successfully');
      return result;
    } catch (error) {
      console.error('Scan processing failed:', error);
      throw new Error(`Scan processing failed: ${(error as Error).message}`);
    }
  }

  private generateScanId(): string {
    return `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateConfidenceScore(ingredients: ParsedIngredient[], matches: CompoundMatch[]): number {
    if (ingredients.length === 0) return 0;
    
    const matchedIngredients = matches.filter(m => m.confidence > 0.7).length;
    const baseScore = (matchedIngredients / ingredients.length) * 100;
    
    const avgParsingConfidence = ingredients.reduce((sum, ing) => sum + ing.confidence, 0) / ingredients.length;
    
    return Math.min(100, baseScore * avgParsingConfidence);
  }

  private async generateRecommendations(
    matches: CompoundMatch[], 
    safetyAnalysis: SafetyReport
  ): Promise<string[]> {
    const recommendations: string[] = [];

    if (safetyAnalysis.risk_level === 'high') {
      recommendations.push('⚠️ High-risk ingredients detected. Consult healthcare provider before use.');
    }

    if (safetyAnalysis.interactions.length > 0) {
      recommendations.push(`🔄 ${safetyAnalysis.interactions.length} potential interactions found. Review carefully.`);
    }

    const overdosedIngredients = matches.filter(m => m.dosage_analysis?.status === 'excessive');
    if (overdosedIngredients.length > 0) {
      recommendations.push('📊 Some ingredients exceed recommended dosages. Consider alternatives.');
    }

    const lowQualityMatches = matches.filter(m => m.confidence < 0.5);
    if (lowQualityMatches.length > 0) {
      recommendations.push('🔍 Some ingredients could not be verified. Research independently.');
    }

    if (safetyAnalysis.risk_level === 'low' && matches.length > 0) {
      recommendations.push('✅ Most ingredients appear safe based on current research.');
    }

    return recommendations;
  }

  async cleanup(): Promise<void> {
    await this.ocrEngine.cleanup();
  }
}
