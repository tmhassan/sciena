import { CompoundMatch, SafetyReport, InteractionWarning, RiskLevel } from '../../types/scanner';

export class SafetyAnalyzer {
  private interactionDatabase: Map<string, string[]> = new Map();

  constructor() {
    this.initializeInteractionDatabase();
  }

  private initializeInteractionDatabase(): void {
    const commonInteractions = new Map<string, string[]>([
      ['warfarin', ['vitamin-k', 'ginkgo', 'garlic', 'ginseng']],
      ['blood-thinners', ['vitamin-e', 'omega-3', 'turmeric', 'ginkgo']],
      ['diabetes-medications', ['chromium', 'bitter-melon', 'cinnamon']],
      ['blood-pressure-medications', ['hawthorn', 'garlic', 'magnesium']],
      ['antidepressants', ['st-johns-wort', '5-htp', 'sam-e']],
      ['stimulants', ['caffeine', 'synephrine', 'yohimbine']]
    ]);

    this.interactionDatabase = commonInteractions;
  }

  async analyzeSafety(matches: CompoundMatch[]): Promise<SafetyReport> {
    const interactions = await this.checkInteractions(matches);
    const riskLevel = this.assessOverallRisk(matches, interactions);
    const warnings = this.generateWarnings(matches, interactions);
    const recommendations = this.generateSafetyRecommendations(matches, riskLevel);

    return {
      risk_level: riskLevel,
      interactions,
      warnings,
      recommendations,
      analyzed_at: new Date().toISOString(),
      total_compounds: matches.length,
      high_risk_compounds: matches.filter(m => this.isHighRisk(m)).length
    };
  }

  private async checkInteractions(matches: CompoundMatch[]): Promise<InteractionWarning[]> {
    const interactions: InteractionWarning[] = [];
    const matchedCompounds = matches.filter(m => m.compound_id);

    for (let i = 0; i < matchedCompounds.length; i++) {
      for (let j = i + 1; j < matchedCompounds.length; j++) {
        const compound1 = matchedCompounds[i];
        const compound2 = matchedCompounds[j];

        const interaction = await this.checkCompoundInteraction(compound1, compound2);
        if (interaction) {
          interactions.push(interaction);
        }
      }
    }

    return interactions;
  }

  private async checkCompoundInteraction(
    compound1: CompoundMatch,
    compound2: CompoundMatch
  ): Promise<InteractionWarning | null> {
    const name1 = compound1.compound_name?.toLowerCase() || '';
    const name2 = compound2.compound_name?.toLowerCase() || '';

    // Check against known interaction database
    for (const [drug, interactingSupplements] of Array.from(this.interactionDatabase.entries())) {
      if ((name1.includes(drug) && interactingSupplements.some((s: string) => name2.includes(s))) ||
          (name2.includes(drug) && interactingSupplements.some((s: string) => name1.includes(s)))) {
        
        return {
          id: `interaction_${compound1.compound_id}_${compound2.compound_id}`,
          compound1_name: compound1.compound_name || compound1.ingredient_name,
          compound2_name: compound2.compound_name || compound2.ingredient_name,
          severity: this.assessInteractionSeverity(name1, name2),
          description: this.getInteractionDescription(name1, name2),
          recommendation: 'Consult healthcare provider before combining these compounds'
        };
      }
    }

    if (this.isSameCategory(compound1, compound2)) {
      const category = compound1.compound_category;
      if (category === 'stimulant' || category === 'nootropic') {
        return {
          id: `category_interaction_${compound1.compound_id}_${compound2.compound_id}`,
          compound1_name: compound1.compound_name || compound1.ingredient_name,
          compound2_name: compound2.compound_name || compound2.ingredient_name,
          severity: 'moderate',
          description: `Multiple ${category}s may have additive effects`,
          recommendation: 'Monitor for side effects and consider spacing doses'
        };
      }
    }

    return null;
  }

  private assessInteractionSeverity(name1: string, name2: string): 'low' | 'moderate' | 'high' {
    const highRiskCombos = [
      ['warfarin', 'vitamin-k'],
      ['blood-thinners', 'ginkgo'],
      ['antidepressants', 'st-johns-wort']
    ];

    for (const [drug, supplement] of highRiskCombos) {
      if ((name1.includes(drug) && name2.includes(supplement)) ||
          (name2.includes(drug) && name1.includes(supplement))) {
        return 'high';
      }
    }

    return 'moderate';
  }

  private getInteractionDescription(name1: string, name2: string): string {
    const interactions: Record<string, string> = {
      'warfarin_vitamin-k': 'Vitamin K can reduce the effectiveness of warfarin',
      'blood-thinners_ginkgo': 'Ginkgo may increase bleeding risk when combined with blood thinners',
      'antidepressants_st-johns-wort': 'St. Johns Wort can interfere with antidepressant medications',
      'stimulants_caffeine': 'Multiple stimulants may cause overstimulation and side effects'
    };

    for (const [key, description] of Object.entries(interactions)) {
      const [drug, supplement] = key.split('_');
      if ((name1.includes(drug) && name2.includes(supplement)) ||
          (name2.includes(drug) && name1.includes(supplement))) {
        return description;
      }
    }

    return 'These compounds may interact. Please consult a healthcare provider.';
  }

  private isSameCategory(compound1: CompoundMatch, compound2: CompoundMatch): boolean {
    return compound1.compound_category === compound2.compound_category &&
           compound1.compound_category !== null;
  }

  private assessOverallRisk(matches: CompoundMatch[], interactions: InteractionWarning[]): RiskLevel {
    let riskScore = 0;

    const highRiskCount = matches.filter(m => this.isHighRisk(m)).length;
    riskScore += highRiskCount * 3;

    const highRiskInteractions = interactions.filter(i => i.severity === 'high').length;
    const moderateRiskInteractions = interactions.filter(i => i.severity === 'moderate').length;
    
    riskScore += highRiskInteractions * 2;
    riskScore += moderateRiskInteractions * 1;

    const excessiveDosages = matches.filter(m => 
      m.dosage_analysis?.status === 'excessive'
    ).length;
    riskScore += excessiveDosages * 2;

    if (riskScore >= 6) return 'high';
    if (riskScore >= 3) return 'moderate';
    return 'low';
  }

  private isHighRisk(match: CompoundMatch): boolean {
    const highRiskCompounds = [
      'yohimbine', 'dmaa', 'ephedrine', 'synephrine'
    ];

    const name = (match.compound_name || match.ingredient_name).toLowerCase();
    return highRiskCompounds.some(risk => name.includes(risk));
  }

  private generateWarnings(matches: CompoundMatch[], interactions: InteractionWarning[]): string[] {
    const warnings: string[] = [];

    const highRiskCompounds = matches.filter(m => this.isHighRisk(m));
    if (highRiskCompounds.length > 0) {
      warnings.push(`⚠️ ${highRiskCompounds.length} high-risk compound(s) detected`);
    }

    const highRiskInteractions = interactions.filter(i => i.severity === 'high');
    if (highRiskInteractions.length > 0) {
      warnings.push(`🔴 ${highRiskInteractions.length} serious interaction(s) found`);
    }

    const excessiveDosages = matches.filter(m => 
      m.dosage_analysis?.status === 'excessive'
    );
    if (excessiveDosages.length > 0) {
      warnings.push(`📊 ${excessiveDosages.length} compound(s) with potentially excessive dosages`);
    }

    const unmatchedCount = matches.filter(m => m.confidence === 0).length;
    if (unmatchedCount > 0) {
      warnings.push(`❓ ${unmatchedCount} ingredient(s) could not be verified in database`);
    }

    return warnings;
  }

  private generateSafetyRecommendations(matches: CompoundMatch[], riskLevel: RiskLevel): string[] {
    const recommendations: string[] = [];

    if (riskLevel === 'high') {
      recommendations.push('🩺 Consult a healthcare provider before using this supplement');
      recommendations.push('📋 Consider getting baseline lab work if using long-term');
    }

    if (riskLevel === 'moderate') {
      recommendations.push('⚠️ Start with lower doses to assess tolerance');
      recommendations.push('📝 Keep a supplement diary to track effects');
    }

    recommendations.push('🥛 Take with food unless specifically directed otherwise');
    recommendations.push('💧 Ensure adequate hydration');
    recommendations.push('🔍 Source supplements from reputable, third-party tested brands');
    
    if (matches.some(m => m.compound_category === 'nootropic')) {
      recommendations.push('🧠 Consider cycling nootropics to prevent tolerance');
    }

    return recommendations;
  }
}
