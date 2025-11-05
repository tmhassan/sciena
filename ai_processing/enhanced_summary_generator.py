#!/usr/bin/env python3
"""
Ultimate AI Summary Generation System - GPT-4o-mini Optimized
Complete error-free version with all advanced features and robust JSON parsing
"""

import openai
import json
import re
import os
import time
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timezone
from dataclasses import dataclass, asdict
import logging
from pathlib import Path
import sys
import hashlib
from collections import defaultdict
import argparse

# Add project root to path
sys.path.append(str(Path(__file__).resolve().parents[1]))

from database.database import get_session
from database.models import Compound, DosageInfo, Study, CompoundSummary
from utils.logger import setup_logger
from sqlalchemy import text, func

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

_dose_re = re.compile(r'(?P<value>[\d\.]+)\s*(?P<unit>[^\d\s].*)?')

def _parse_dose(dose_raw):
    """
    Parse a raw dose (e.g. "500 mg" or 500) into (float_value, unit_str).
    Returns (None, None) if unparsable or empty.
    """
    if isinstance(dose_raw, (int, float)):
        return float(dose_raw), None
    if not dose_raw or not isinstance(dose_raw, str):
        return None, None
    m = _dose_re.match(dose_raw.strip())
    if not m:
        return None, None
    val = float(m.group("value"))
    unit = m.group("unit").strip() if m.group("unit") else None
    return val, unit

@dataclass
class EvidenceGrade:
    """Evidence quality grading system"""
    grade: str  # A, B, C, D
    confidence: float  # 0-1
    study_count: int
    rct_count: int
    meta_analysis_count: int
    review_count: int
    systematic_review_count: int
    cohort_study_count: int
    case_control_count: int
    animal_study_count: int
    in_vitro_count: int
    quality_score: float
    study_type_distribution: Dict[str, int]
    recent_studies_count: int
    high_impact_journals: int

@dataclass
class TherapeuticApplication:
    """Structured therapeutic application data"""
    indication: str
    evidence_strength: str
    effect_size: str
    effect_magnitude: str
    population: str
    dose_range: str
    duration: str
    timing: str
    supporting_studies: List[str]
    contradictory_studies: List[str]
    limitations: str
    confidence_interval: str
    p_value: Optional[float]
    number_needed_to_treat: Optional[int]
    clinical_significance: str

@dataclass
class SafetyProfile:
    """Comprehensive safety assessment"""
    overall_safety: str
    safety_grade: str
    common_adverse_events: List[Dict[str, str]]
    serious_adverse_events: List[Dict[str, str]]
    dose_dependent_effects: List[str]
    contraindications: List[str]
    absolute_contraindications: List[str]
    relative_contraindications: List[str]
    drug_interactions: List[Dict[str, str]]
    food_interactions: List[str]
    special_populations: Dict[str, str]
    monitoring_recommendations: List[str]
    withdrawal_effects: List[str]
    overdose_information: str
    long_term_safety: str

@dataclass
class DosageProtocols:
    """Comprehensive dosage information"""
    therapeutic_range: str
    minimum_effective_dose: str
    maximum_safe_dose: str
    loading_protocol: Optional[str]
    maintenance_dose: str
    timing_recommendations: str
    frequency: str
    duration_recommendations: str
    food_interactions: str
    cycle_protocols: Optional[str]
    washout_periods: Optional[str]
    dose_escalation: Optional[str]
    special_population_adjustments: Dict[str, str]
    bioavailability_enhancers: List[str]
    formulation_considerations: List[str]

@dataclass
class MechanismOfAction:
    """Detailed mechanism information"""
    primary_pathways: List[str]
    secondary_pathways: List[str]
    receptor_interactions: List[str]
    enzymatic_effects: List[str]
    cellular_processes: List[str]
    pharmacokinetics: Dict[str, str]
    pharmacodynamics: Dict[str, str]
    biomarkers: List[str]
    time_to_effect: Dict[str, str]
    dose_response_relationship: str
    metabolic_pathways: List[str]
    excretion_pathways: List[str]

@dataclass
class ResearchLandscape:
    """Research timeline and trends"""
    research_timeline: List[Dict[str, str]]
    research_trends: List[str]
    emerging_applications: List[str]
    ongoing_trials: List[str]
    research_gaps: List[str]
    future_directions: List[str]
    publication_volume_trend: str
    quality_trend: str
    geographic_distribution: Dict[str, int]
    funding_sources: List[str]

@dataclass
class ComprehensiveProfile:
    """Complete compound profile structure"""
    compound_name: str
    category: str
    synonyms: List[str]
    chemical_info: Dict[str, str]
    overview: str
    executive_summary: str
    mechanism_of_action: MechanismOfAction
    clinical_evidence: EvidenceGrade
    therapeutic_applications: List[TherapeuticApplication]
    dosage_protocols: DosageProtocols
    safety_profile: SafetyProfile
    research_landscape: ResearchLandscape
    regulatory_status: Dict[str, str]
    cost_effectiveness: Dict[str, str]
    quality_concerns: List[str]
    market_analysis: Dict[str, str]
    key_takeaways: List[str]
    clinical_bottom_line: str
    references: List[str]
    meta_information: Dict[str, str]
    last_updated: str

class AdvancedEvidenceGrader:
    """Advanced evidence quality assessment system"""
    
    def __init__(self):
        self.study_type_weights = {
            'Meta-Analysis': 15,
            'Systematic Review with Meta-Analysis': 14,
            'Systematic Review': 12,
            'Randomized Controlled Trial': 10,
            'Double-Blind RCT': 11,
            'Placebo-Controlled RCT': 11,
            'Clinical Trial': 8,
            'Prospective Cohort Study': 7,
            'Retrospective Cohort Study': 6,
            'Case-Control Study': 5,
            'Cross-Sectional Study': 4,
            'Case Series': 3,
            'Case Report': 2,
            'Review': 4,
            'Animal Study': 3,
            'In Vitro Study': 2,
            'Observational Study': 4
        }
        
        self.journal_impact_tiers = {
            'tier1': ['nature', 'science', 'cell', 'lancet', 'nejm', 'jama'],
            'tier2': ['plos', 'cochrane', 'bmj', 'american journal'],
            'tier3': ['journal', 'international', 'european']
        }
    
    def grade_evidence(self, studies: List[Study]) -> EvidenceGrade:
        """Comprehensive evidence grading using advanced GRADE approach"""
        if not studies:
            return self._empty_grade()
        
        study_classifications = self._classify_all_studies(studies)
        study_counts = self._count_study_types(study_classifications)
        quality_score = self._calculate_advanced_quality_score(studies, study_classifications)
        grade, confidence = self._determine_advanced_grade(study_counts, quality_score, len(studies))
        
        recent_studies = sum(1 for s in studies if s.publication_year and s.publication_year >= 2019)
        high_impact = self._count_high_impact_journals(studies)
        
        return EvidenceGrade(
            grade=grade,
            confidence=confidence,
            study_count=len(studies),
            rct_count=study_counts.get('Randomized Controlled Trial', 0) + 
                     study_counts.get('Double-Blind RCT', 0) + 
                     study_counts.get('Placebo-Controlled RCT', 0),
            meta_analysis_count=study_counts.get('Meta-Analysis', 0),
            review_count=study_counts.get('Review', 0),
            systematic_review_count=study_counts.get('Systematic Review', 0),
            cohort_study_count=study_counts.get('Prospective Cohort Study', 0) + 
                              study_counts.get('Retrospective Cohort Study', 0),
            case_control_count=study_counts.get('Case-Control Study', 0),
            animal_study_count=study_counts.get('Animal Study', 0),
            in_vitro_count=study_counts.get('In Vitro Study', 0),
            quality_score=quality_score,
            study_type_distribution=study_counts,
            recent_studies_count=recent_studies,
            high_impact_journals=high_impact
        )
    
    def _empty_grade(self) -> EvidenceGrade:
        """Return empty evidence grade"""
        return EvidenceGrade('D', 0.0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.0, {}, 0, 0)
    
    def _classify_all_studies(self, studies: List[Study]) -> List[Tuple[Study, str]]:
        """Classify all studies with detailed categorization"""
        classifications = []
        for study in studies:
            study_type = self._classify_study_type_advanced(study)
            classifications.append((study, study_type))
        return classifications
    
    def _classify_study_type_advanced(self, study: Study) -> str:
        """Advanced study type classification"""
        text = f"{study.title} {study.abstract}".lower()
        
        if any(term in text for term in ['meta-analysis', 'meta analysis', 'metanalysis']):
            if 'systematic' in text:
                return 'Systematic Review with Meta-Analysis'
            return 'Meta-Analysis'
        elif 'systematic review' in text:
            return 'Systematic Review'
        elif any(term in text for term in ['randomized controlled trial', 'randomised controlled trial']):
            if 'double-blind' in text or 'double blind' in text:
                return 'Double-Blind RCT'
            elif 'placebo' in text:
                return 'Placebo-Controlled RCT'
            return 'Randomized Controlled Trial'
        elif 'rct' in text and ('random' in text or 'trial' in text):
            return 'Randomized Controlled Trial'
        elif any(term in text for term in ['clinical trial', 'phase i', 'phase ii', 'phase iii']):
            return 'Clinical Trial'
        elif 'prospective' in text and 'cohort' in text:
            return 'Prospective Cohort Study'
        elif 'cohort' in text:
            return 'Retrospective Cohort Study'
        elif 'case-control' in text or 'case control' in text:
            return 'Case-Control Study'
        elif 'cross-sectional' in text or 'cross sectional' in text:
            return 'Cross-Sectional Study'
        elif 'case series' in text:
            return 'Case Series'
        elif 'case report' in text:
            return 'Case Report'
        elif any(term in text for term in ['animal', 'rat', 'mouse', 'rodent', 'mice']):
            return 'Animal Study'
        elif any(term in text for term in ['in vitro', 'cell culture', 'cell line']):
            return 'In Vitro Study'
        elif 'review' in text:
            return 'Review'
        else:
            return 'Observational Study'
    
    def _count_study_types(self, classifications: List[Tuple[Study, str]]) -> Dict[str, int]:
        """Count studies by type"""
        counts = defaultdict(int)
        for _, study_type in classifications:
            counts[study_type] += 1
        return dict(counts)
    
    def _calculate_advanced_quality_score(self, studies: List[Study], classifications: List[Tuple[Study, str]]) -> float:
        """Calculate advanced quality score with multiple factors"""
        total_weight = 0
        total_studies = len(studies)
        
        for _, study_type in classifications:
            weight = self.study_type_weights.get(study_type, 1)
            total_weight += weight
        
        max_possible = total_studies * 15
        base_score = (total_weight / max_possible) * 10
        
        bonuses = 0
        if total_studies >= 20:
            bonuses += 1.5
        elif total_studies >= 10:
            bonuses += 1.0
        elif total_studies >= 5:
            bonuses += 0.5
        
        recent_studies = sum(1 for s in studies if s.publication_year and s.publication_year >= 2019)
        recency_ratio = recent_studies / total_studies
        bonuses += recency_ratio * 0.5
        
        high_impact_count = self._count_high_impact_journals(studies)
        if high_impact_count > 0:
            bonuses += min(high_impact_count / total_studies * 2, 1.0)
        
        final_score = min(base_score + bonuses, 10.0)
        return final_score
    
    def _count_high_impact_journals(self, studies: List[Study]) -> int:
        """Count studies from high-impact journals"""
        count = 0
        for study in studies:
            if study.journal:
                journal_lower = study.journal.lower()
                for tier, journals in self.journal_impact_tiers.items():
                    if any(j in journal_lower for j in journals):
                        count += 1
                        break
        return count
    
    def _determine_advanced_grade(self, study_counts: Dict[str, int], quality_score: float, total_studies: int) -> Tuple[str, float]:
        """Advanced grade determination with confidence"""
        rcts = (study_counts.get('Randomized Controlled Trial', 0) + 
                study_counts.get('Double-Blind RCT', 0) + 
                study_counts.get('Placebo-Controlled RCT', 0))
        meta_analyses = study_counts.get('Meta-Analysis', 0) + study_counts.get('Systematic Review with Meta-Analysis', 0)
        systematic_reviews = study_counts.get('Systematic Review', 0)
        
        if meta_analyses >= 3 or (meta_analyses >= 2 and quality_score >= 8.5):
            return 'A', 0.95
        elif meta_analyses >= 2 or (rcts >= 8 and quality_score >= 8):
            return 'A', 0.90
        elif meta_analyses >= 1 and rcts >= 5 and quality_score >= 7.5:
            return 'A', 0.85
        elif meta_analyses >= 1 or (rcts >= 5 and quality_score >= 7):
            return 'B', 0.80
        elif rcts >= 3 and systematic_reviews >= 1 and quality_score >= 6.5:
            return 'B', 0.75
        elif rcts >= 3 and quality_score >= 6:
            return 'B', 0.70
        elif rcts >= 2 or (rcts >= 1 and total_studies >= 15 and quality_score >= 5):
            return 'C', 0.60
        elif rcts >= 1 and quality_score >= 4.5:
            return 'C', 0.55
        elif total_studies >= 20 and quality_score >= 4:
            return 'C', 0.50
        elif total_studies >= 10 and quality_score >= 3:
            return 'D', 0.40
        elif total_studies >= 5:
            return 'D', 0.35
        else:
            return 'D', 0.30

class UltimateAISummaryGenerator:
    """Ultimate comprehensive AI summary generator - GPT-4o-mini optimized"""
    
    def __init__(self):
        # Set API key on openai module
        openai.api_key = os.getenv("OPENAI_API_KEY")

        # Use functional interface
        self.client = openai
        self.model = "gpt-4o-mini"
        self.evidence_grader = AdvancedEvidenceGrader()

        # Cost tracking
        self.total_input_tokens = 0
        self.total_output_tokens = 0
        self.total_cost = 0.0
        self.compounds_processed = 0

        # Rate limiting
        self.last_api_call = 0
        self.min_delay = 0.1
    
    def generate_comprehensive_profile(self, compound_id: int) -> Optional[ComprehensiveProfile]:
        """Generate ultimate comprehensive compound profile"""
        session = get_session()
        
        try:
            compound = session.query(Compound).filter(Compound.id == compound_id).first()
            if not compound:
                logger.error(f"Compound {compound_id} not found")
                return None
            
            studies = session.query(Study).filter(Study.compound_id == compound_id).all()
            if len(studies) < 1:
                logger.warning(f"Insufficient studies for {compound.name}: {len(studies)}")
            
            logger.info(f"Generating comprehensive profile for {compound.name} with {len(studies)} studies")
            
            evidence_grade = self.evidence_grader.grade_evidence(studies)
            study_data = self._prepare_comprehensive_study_data(studies)
            
            # Generate sections with proper error handling
            overview_data = self._generate_overview_sections(compound.name, compound.category, study_data, evidence_grade)
            mechanism = self._generate_detailed_mechanism(compound.name, study_data)
            therapeutic_apps = self._generate_therapeutic_applications(compound.name, study_data, evidence_grade)
            dosage_protocols = self._generate_comprehensive_dosage(compound.name, study_data)
            safety_profile = self._generate_comprehensive_safety(compound.name, study_data)
            research_landscape = self._analyze_research_landscape(compound.name, studies, study_data)
            regulatory_info = self._analyze_regulatory_status(compound.name, compound.category)
            market_info = self._analyze_market_factors(compound.name, compound.category, therapeutic_apps)
            takeaways_data = self._generate_clinical_conclusions(compound.name, evidence_grade, therapeutic_apps, safety_profile)
            
            profile = ComprehensiveProfile(
                compound_name=compound.name,
                category=compound.category,
                synonyms=compound.common_names or [],
                chemical_info=self._extract_chemical_info(compound),
                overview=overview_data.get('overview', ''),
                executive_summary=overview_data.get('executive_summary', ''),
                mechanism_of_action=mechanism,
                clinical_evidence=evidence_grade,
                therapeutic_applications=therapeutic_apps,
                dosage_protocols=dosage_protocols,
                safety_profile=safety_profile,
                research_landscape=research_landscape,
                regulatory_status=regulatory_info,
                cost_effectiveness=market_info,
                quality_concerns=self._identify_quality_concerns(compound.name, compound.category),
                market_analysis=self._analyze_market_position(compound.name, therapeutic_apps),
                key_takeaways=takeaways_data.get('key_takeaways', []),
                clinical_bottom_line=takeaways_data.get('clinical_bottom_line', ''),
                references=[f"PMID:{study.pmid}" for study in studies if study.pmid],
                meta_information=self._generate_meta_info(evidence_grade, len(studies)),
                last_updated=datetime.now().isoformat()
            )
            
            self._save_comprehensive_summary(compound_id, profile, session)
            
            self.compounds_processed += 1
            logger.info(f"✅ Generated ultimate profile for {compound.name}")
            return profile
            
        except Exception as e:
            logger.error(f"Error generating profile for compound {compound_id}: {str(e)}")
            session.rollback()
            return None
        finally:
            session.close()
    
    def _prepare_comprehensive_study_data(self, studies: List[Study]) -> List[Dict]:
        """Prepare comprehensive study data with intelligent chunking"""
        study_data = []
        
        sorted_studies = sorted(studies, key=lambda s: (
            s.publication_year or 0,
            len(s.abstract or '') > 200,
            s.pmid is not None,
            len(s.title or '') > 20
        ), reverse=True)
        
        study_types_seen = set()
        selected_studies = []
        
        for study in sorted_studies:
            study_type = self.evidence_grader._classify_study_type_advanced(study)
            if study_type not in study_types_seen or len(selected_studies) < 15:
                selected_studies.append(study)
                study_types_seen.add(study_type)
                if len(selected_studies) >= 20:
                    break
        
        for study in selected_studies:
            title = (study.title or '')[:180]
            abstract = self._smart_abstract_truncation(study.abstract or '', 350)
            
            study_info = {
                'pmid': study.pmid,
                'title': title,
                'abstract': abstract,
                'year': study.publication_year,
                'journal': (study.journal or '')[:70],
                'study_type': self.evidence_grader._classify_study_type_advanced(study),
            }
            study_data.append(study_info)
        
        return study_data
    
    def _smart_abstract_truncation(self, abstract: str, max_length: int) -> str:
        """Intelligently truncate abstracts preserving key information"""
        if len(abstract) <= max_length:
            return abstract
        
        sentences = abstract.split('. ')
        truncated = ""
        
        for sentence in sentences:
            if len(truncated + sentence + '. ') <= max_length - 10:
                truncated += sentence + '. '
            else:
                break
        
        if len(truncated) < max_length // 2:
            return abstract[:max_length-3] + "..."
        
        return truncated.strip()
    
    def _robust_json_parse(self, content: str, call_type: str) -> Optional[Dict]:
        """Robust JSON parsing that handles GPT-4o-mini quirks"""
        if not content:
            logger.error(f"Empty content in {call_type}")
            return None
        
        content = content.strip()
        
        try:
            # Try direct parsing first
            return json.loads(content)
        except json.JSONDecodeError:
            pass
        
        # Handle markdown-wrapped JSON
        if '```json' in content:
            try:
                # Find the start of the JSON block
                start = content.find('```json') + len('```json')
                # Find the closing fence *after* the start index
                end = content.find('```', start)
                if end != -1:
                    json_content = content[start:end].strip()
                    return json.loads(json_content)
            except json.JSONDecodeError:
                # If the extracted block isn’t valid JSON, just fall through
                pass
        
        # Handle bare JSON with extra text
        try:
            # Find first { and last }
            start = content.find('{')
            end = content.rfind('}')
            
            if start != -1 and end != -1 and end > start:
                json_content = content[start:end+1]
                
                # Handle common issues with trailing commas or extra data
                try:
                    return json.loads(json_content)
                except json.JSONDecodeError:
                    # Try to fix trailing commas
                    fixed_content = re.sub(r',(\s*[}$$])', r'\1', json_content)
                    try:
                        return json.loads(fixed_content)
                    except json.JSONDecodeError:
                        pass
        except Exception:
            pass
        
        # Handle array responses
        try:
            start = content.find('[')
            end = content.rfind(']')
            
            if start != -1 and end != -1 and end > start:
                json_content = content[start:end+1]
                return json.loads(json_content)
        except json.JSONDecodeError:
            pass
        
        # Last resort: try to extract valid JSON from each line
        lines = content.split('\n')
        for line in lines:
            line = line.strip()
            if line.startswith('{') or line.startswith('['):
                try:
                    return json.loads(line)
                except json.JSONDecodeError:
                    continue
        
        logger.error(f"Failed to parse JSON in {call_type}: {content[:200]}...")
        return None
    
    def _make_optimized_api_call(self, prompt: str, call_type: str, max_tokens: int) -> Optional[Dict]:
        """GPT-4o-mini optimized API call with robust error handling"""
        time_since_last = time.time() - self.last_api_call
        if time_since_last < self.min_delay:
            time.sleep(self.min_delay - time_since_last)

        try:
            start_time = time.time()
            response = self.client.ChatCompletion.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert in biomedical research."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=max_tokens,
                temperature=0.7
            )
            self.last_api_call = time.time()
            prompt_tokens = response.usage.prompt_tokens
            completion_tokens = response.usage.completion_tokens
            call_cost = (prompt_tokens + completion_tokens) * 0.000002  # example cost calc
            processing_time = time.time() - start_time
            logger.debug(
                f"{call_type}: {prompt_tokens}+{completion_tokens} tokens, ${call_cost:.4f}, {processing_time:.1f}s"
            )

            content = response.choices[0].message.content
            return self._robust_json_parse(content, call_type)

        except Exception as e:
            logger.error(f"API call failed for {call_type}: {e}")
            return None
        
    def process_compound_by_id(self, compound_id: int, session, index: int, total: int):
        compound = session.get(Compound, compound_id)
        if not compound:
            print(f"[{index:3d}/{total}] ⚠️  Compound ID {compound_id} not found, skipping.")
            return
        studies = session.query(Study).filter(Study.compound_id == compound_id).all()
        name = compound.name
        print(f"[{index:3d}/{total}] 📚 {name} ({len(studies)} studies)")
        profile = self.generate_comprehensive_profile(compound_id)
        self._save_comprehensive_summary(compound_id, profile, session)
        print(f"    ✅ Done: {name}")

    def process_low_study_compounds(self, session, threshold: int):
        """
        For every compound with fewer than `threshold` studies,
        generate a full AI summary and save it.
        """
        results = (
            session.query(Compound, func.count(Study.id).label("cnt"))
            .outerjoin(Study, Study.compound_id == Compound.id)
            .group_by(Compound.id)
            .having(func.count(Study.id) < threshold)
            .all()
        )
        compounds = [r[0] for r in results]
        total = len(compounds)
        print(f"🛠️  Found {total} low‑study compounds (<{threshold} studies). Generating full AI summaries...")

        for idx, compound in enumerate(compounds, start=1):
            studies = session.query(Study).filter(Study.compound_id == compound.id).all()
            print(f"[{idx:3d}/{total}] 📚 {compound.name} ({len(studies)} studies)")
            profile = self.generate_comprehensive_profile(compound.id)
            self._save_comprehensive_summary(compound.id, profile, session)
            print(f"    ✅ Done: {compound.name}")

        print("🎉 Low‑study batch complete!")

    def generate_dosage_profile(self, compound_id: int, session=None) -> List[Dict]:
        """Extract structured dosages via LLM, given compound name."""
        # reuse session if provided, else open & close one
        own_session = False
        if session is None:
            session = get_session()
            own_session = True

        compound = session.get(Compound, compound_id)
        if not compound:
            logger.error(f"Compound {compound_id} not found for dosage extraction")
            if own_session:
                session.close()
            return []
        name = compound.name

        prompt = (
            f"Extract all evidence-backed dosage protocols for **{name}**. "
            "Return strict JSON list of objects with keys: form, route, min_dose, max_dose, frequency, "
            "population, evidence_level, and optionally unit or context. "
            "If none, return []."
        )
        raw = self._make_optimized_api_call(
            prompt,
            call_type="dosage_generator",
            max_tokens=400
        )
        if own_session:
            session.close()

        # raw should already be Python objects via robust JSON parse; ensure list
        if not isinstance(raw, list):
            return []
        return raw
    
    def process_dosages(self, session, threshold: int = 0):
        """
        Upsert dosage_info for all compounds with >= threshold studies,
        parsing numeric dose + unit correctly.
        """
        from sqlalchemy import func

        # fetch compounds including zero-study via outerjoin
        results = (
            session.query(Compound, func.count(Study.id).label("cnt"))
            .outerjoin(Study, Study.compound_id == Compound.id)
            .group_by(Compound.id)
            .having(func.count(Study.id) >= threshold)
            .order_by(func.count(Study.id).desc())
            .all()
        )
        compounds = [row[0] for row in results]
        print(f"💊 Generating dosage profiles for {len(compounds)} compounds (threshold={threshold})")

        for idx, comp in enumerate(compounds, start=1):
            print(f"[{idx:3d}/{len(compounds)}] 📝 {comp.name}")
            dosage_list = self.generate_dosage_profile(comp.id, session=session)

            saved = 0
            for d in dosage_list:
                # parse doses and units
                min_val, unit_min = _parse_dose(d.get("min_dose"))
                max_val, unit_max = _parse_dose(d.get("max_dose"))
                # prefer explicit 'unit' field, else parsed
                unit_val = d.get("unit") or unit_min or unit_max

                existing = session.query(DosageInfo).filter_by(
                    compound_id=comp.id,
                    form=d.get("form"),
                    route=d.get("route")
                ).first()

                if existing:
                    existing.min_dose       = min_val
                    existing.max_dose       = max_val
                    existing.unit           = unit_val
                    existing.frequency      = d.get("frequency")
                    existing.context        = d.get("context")
                    existing.population     = d.get("population")
                    existing.evidence_level = d.get("evidence_level")
                else:
                    new = DosageInfo(
                        compound_id    = comp.id,
                        form           = d.get("form"),
                        route          = d.get("route"),
                        min_dose       = min_val,
                        max_dose       = max_val,
                        unit           = unit_val,
                        frequency      = d.get("frequency"),
                        context        = d.get("context"),
                        population     = d.get("population"),
                        evidence_level = d.get("evidence_level"),
                    )
                    session.add(new)
                saved += 1

            session.commit()
            print(f"    ✅ Parsed & saved {saved} dosage protocols")

        print("🎉 Dosage pass complete!")

    def _generate_overview_sections(self, compound_name: str, category: str, studies: List[Dict], evidence_grade: EvidenceGrade) -> Dict[str, str]:
        """Generate overview and executive summary sections"""
        prompt = f"""Create comprehensive overview sections for {compound_name} ({category}).

EVIDENCE: Grade {evidence_grade.grade} ({evidence_grade.study_count} studies, {evidence_grade.rct_count} RCTs)

STUDIES: {json.dumps(studies[:12], separators=(',', ':'))}

Create 2 sections and return as JSON:

{{"overview": "Comprehensive 200-word introduction covering what {compound_name} is, its classification, source, primary mechanisms, main therapeutic applications, and current research status", "executive_summary": "Clinical 150-word summary covering evidence strength, primary supported uses, safety profile, and key clinical considerations"}}

Requirements:
- Base on provided studies only
- Include specific evidence grades
- Use clinical terminology
- Be precise about effect sizes"""
        
        return self._make_optimized_api_call(prompt, "overview_generator", 700) or {"overview": "Overview not available", "executive_summary": "Executive summary not available"}
    
    def _generate_detailed_mechanism(self, compound_name: str, studies: List[Dict]) -> MechanismOfAction:
        """Generate detailed mechanism of action"""
        prompt = f"""Analyze mechanism of action for {compound_name}.

STUDIES: {json.dumps(studies[:16], separators=(',', ':'))}

Return JSON with mechanism details:

{{"primary_pathways": ["main pathway 1"], "secondary_pathways": ["secondary pathway 1"], "receptor_interactions": ["receptor 1"], "enzymatic_effects": ["enzyme 1"], "cellular_processes": ["process 1"], "pharmacokinetics": {{"absorption": "details", "distribution": "details", "metabolism": "pathway", "elimination": "route"}}, "pharmacodynamics": {{"onset": "timing", "peak_effect": "timing", "duration": "duration", "half_life": "half-life"}}, "biomarkers": ["biomarker 1"], "time_to_effect": {{"acute": "timing", "chronic": "timing"}}, "dose_response_relationship": "relationship", "metabolic_pathways": ["pathway 1"], "excretion_pathways": ["route 1"]}}

Base on studies only. Use empty arrays/objects if not established."""
        
        mechanism_data = self._make_optimized_api_call(prompt, "mechanism_generator", 800)
        
        if mechanism_data:
            return MechanismOfAction(
                primary_pathways=mechanism_data.get('primary_pathways', []),
                secondary_pathways=mechanism_data.get('secondary_pathways', []),
                receptor_interactions=mechanism_data.get('receptor_interactions', []),
                enzymatic_effects=mechanism_data.get('enzymatic_effects', []),
                cellular_processes=mechanism_data.get('cellular_processes', []),
                pharmacokinetics=mechanism_data.get('pharmacokinetics', {}),
                pharmacodynamics=mechanism_data.get('pharmacodynamics', {}),
                biomarkers=mechanism_data.get('biomarkers', []),
                time_to_effect=mechanism_data.get('time_to_effect', {}),
                dose_response_relationship=mechanism_data.get('dose_response_relationship', ''),
                metabolic_pathways=mechanism_data.get('metabolic_pathways', []),
                excretion_pathways=mechanism_data.get('excretion_pathways', [])
            )
        else:
            return MechanismOfAction([], [], [], [], [], {}, {}, [], {}, '', [], [])
    
    def _generate_therapeutic_applications(self, compound_name: str, studies: List[Dict], evidence_grade: EvidenceGrade) -> List[TherapeuticApplication]:
        """Generate comprehensive therapeutic applications with robust parsing"""
        prompt = f"""Analyze therapeutic applications for {compound_name}.

EVIDENCE: {evidence_grade.grade} (Confidence: {evidence_grade.confidence:.2f})
STUDIES: {json.dumps(studies[:15], separators=(',', ':'))}

For each therapeutic application found, return JSON array (must be valid JSON array):

[{{"indication": "specific indication", "evidence_strength": "A/B/C/D", "effect_size": "Large/Moderate/Small", "effect_magnitude": "quantitative if available", "population": "population studied", "dose_range": "dose range", "duration": "duration", "timing": "timing", "supporting_studies": ["PMID:xxx"], "contradictory_studies": [], "limitations": "limitations", "confidence_interval": "CI if available", "p_value": null, "number_needed_to_treat": null, "clinical_significance": "significance"}}]

Return ONLY the JSON array. No explanations or extra text.

Requirements:
- Only evidence-supported applications
- Conservative evidence grading
- Include PMIDs
- Note limitations"""
        
        applications_data = self._make_optimized_api_call(prompt, "therapeutic_generator", 900)
        
        applications = []
        if applications_data:
            # Handle both array and object responses
            if isinstance(applications_data, list):
                data_list = applications_data
            elif isinstance(applications_data, dict) and 'applications' in applications_data:
                data_list = applications_data['applications']
            elif isinstance(applications_data, dict):
                # Single application as object
                data_list = [applications_data]
            else:
                data_list = []
            
            for app_data in data_list:
                if isinstance(app_data, dict):
                    app = TherapeuticApplication(
                        indication=app_data.get('indication', ''),
                        evidence_strength=app_data.get('evidence_strength', 'D'),
                        effect_size=app_data.get('effect_size', 'Unknown'),
                        effect_magnitude=app_data.get('effect_magnitude', ''),
                        population=app_data.get('population', ''),
                        dose_range=app_data.get('dose_range', ''),
                        duration=app_data.get('duration', ''),
                        timing=app_data.get('timing', ''),
                        supporting_studies=app_data.get('supporting_studies', []),
                        contradictory_studies=app_data.get('contradictory_studies', []),
                        limitations=app_data.get('limitations', ''),
                        confidence_interval=app_data.get('confidence_interval', ''),
                        p_value=app_data.get('p_value'),
                        number_needed_to_treat=app_data.get('number_needed_to_treat'),
                        clinical_significance=app_data.get('clinical_significance', '')
                    )
                    applications.append(app)
        
        return applications
    
    def _generate_comprehensive_dosage(self, compound_name: str, studies: List[Dict]) -> DosageProtocols:
        """Generate comprehensive dosage protocols"""
        prompt = f"""Extract dosage information for {compound_name}.

STUDIES: {json.dumps(studies[:18], separators=(',', ':'))}

Return JSON with dosing guidance:

{{"therapeutic_range": "dose range", "minimum_effective_dose": "min dose", "maximum_safe_dose": "max dose", "loading_protocol": null, "maintenance_dose": "maintenance", "timing_recommendations": "timing", "frequency": "frequency", "duration_recommendations": "duration", "food_interactions": "food", "cycle_protocols": null, "washout_periods": null, "dose_escalation": null, "special_population_adjustments": {{"elderly": "elderly", "pediatric": "pediatric", "hepatic_impairment": "liver", "renal_impairment": "kidney"}}, "bioavailability_enhancers": [], "formulation_considerations": []}}

Base on studies only. Use null or "Not established" if unavailable."""
        
        dosage_data = self._make_optimized_api_call(prompt, "dosage_generator", 700)
        
        if dosage_data:
            return DosageProtocols(
                therapeutic_range=dosage_data.get('therapeutic_range', ''),
                minimum_effective_dose=dosage_data.get('minimum_effective_dose', ''),
                maximum_safe_dose=dosage_data.get('maximum_safe_dose', ''),
                loading_protocol=dosage_data.get('loading_protocol'),
                maintenance_dose=dosage_data.get('maintenance_dose', ''),
                timing_recommendations=dosage_data.get('timing_recommendations', ''),
                frequency=dosage_data.get('frequency', ''),
                duration_recommendations=dosage_data.get('duration_recommendations', ''),
                food_interactions=dosage_data.get('food_interactions', ''),
                cycle_protocols=dosage_data.get('cycle_protocols'),
                washout_periods=dosage_data.get('washout_periods'),
                dose_escalation=dosage_data.get('dose_escalation'),
                special_population_adjustments=dosage_data.get('special_population_adjustments', {}),
                bioavailability_enhancers=dosage_data.get('bioavailability_enhancers', []),
                formulation_considerations=dosage_data.get('formulation_considerations', [])
            )
        else:
            return DosageProtocols('', '', '', None, '', '', '', '', '', None, None, None, {}, [], [])
    
    def _generate_comprehensive_safety(self, compound_name: str, studies: List[Dict]) -> SafetyProfile:
        """Generate comprehensive safety profile"""
        prompt = f"""Analyze safety profile for {compound_name}.

STUDIES: {json.dumps(studies[:18], separators=(',', ':'))}

Return JSON with safety analysis:

{{"overall_safety": "safety assessment", "safety_grade": "A-F", "common_adverse_events": [{{"event": "side effect", "frequency": "frequency"}}], "serious_adverse_events": [{{"event": "serious event", "frequency": "frequency", "severity": "severity"}}], "dose_dependent_effects": [], "contraindications": [], "absolute_contraindications": [], "relative_contraindications": [], "drug_interactions": [{{"drug": "drug", "mechanism": "mechanism", "clinical_significance": "significance"}}], "food_interactions": [], "special_populations": {{"pregnancy": "pregnancy", "breastfeeding": "breastfeeding", "pediatric": "pediatric", "elderly": "elderly", "hepatic_impairment": "liver", "renal_impairment": "kidney"}}, "monitoring_recommendations": [], "withdrawal_effects": [], "overdose_information": "overdose info", "long_term_safety": "long-term safety"}}

Base on studies only. Be conservative with safety assessments."""
        
        safety_data = self._make_optimized_api_call(prompt, "safety_generator", 800)
        
        if safety_data:
            return SafetyProfile(
                overall_safety=safety_data.get('overall_safety', ''),
                safety_grade=safety_data.get('safety_grade', 'C'),
                common_adverse_events=safety_data.get('common_adverse_events', []),
                serious_adverse_events=safety_data.get('serious_adverse_events', []),
                dose_dependent_effects=safety_data.get('dose_dependent_effects', []),
                contraindications=safety_data.get('contraindications', []),
                absolute_contraindications=safety_data.get('absolute_contraindications', []),
                relative_contraindications=safety_data.get('relative_contraindications', []),
                drug_interactions=safety_data.get('drug_interactions', []),
                food_interactions=safety_data.get('food_interactions', []),
                special_populations=safety_data.get('special_populations', {}),
                monitoring_recommendations=safety_data.get('monitoring_recommendations', []),
                withdrawal_effects=safety_data.get('withdrawal_effects', []),
                overdose_information=safety_data.get('overdose_information', ''),
                long_term_safety=safety_data.get('long_term_safety', '')
            )
        else:
            return SafetyProfile('', 'C', [], [], [], [], [], [], [], [], {}, [], [], '', '')
    
    def _analyze_research_landscape(self, compound_name: str, studies: List[Study], study_data: List[Dict]) -> ResearchLandscape:
        """Analyze research trends and landscape"""
        timeline = self._create_research_timeline(studies)
        
        prompt = f"""Analyze research landscape for {compound_name}.

STUDIES: {json.dumps(study_data[:12], separators=(',', ':'))}

Return JSON:

{{"research_trends": ["trend 1"], "emerging_applications": ["application 1"], "ongoing_trials": ["trial 1"], "research_gaps": ["gap 1"], "future_directions": ["direction 1"], "publication_volume_trend": "increasing/stable/decreasing", "quality_trend": "improving/stable/declining", "geographic_distribution": {{"USA": 5}}, "funding_sources": ["NIH"]}}

Focus on research evolution and future directions."""
        
        landscape_data = self._make_optimized_api_call(prompt, "research_landscape", 500)
        
        if landscape_data:
            return ResearchLandscape(
                research_timeline=timeline,
                research_trends=landscape_data.get('research_trends', []),
                emerging_applications=landscape_data.get('emerging_applications', []),
                ongoing_trials=landscape_data.get('ongoing_trials', []),
                research_gaps=landscape_data.get('research_gaps', []),
                future_directions=landscape_data.get('future_directions', []),
                publication_volume_trend=landscape_data.get('publication_volume_trend', ''),
                quality_trend=landscape_data.get('quality_trend', ''),
                geographic_distribution=landscape_data.get('geographic_distribution', {}),
                funding_sources=landscape_data.get('funding_sources', [])
            )
        else:
            return ResearchLandscape(timeline, [], [], [], [], [], '', '', {}, [])
    
    def _create_research_timeline(self, studies: List[Study]) -> List[Dict[str, str]]:
        """Create research timeline analysis"""
        timeline = []
        decade_groups = defaultdict(list)
        
        for study in studies:
            if study.publication_year:
                decade = (study.publication_year // 10) * 10
                decade_groups[decade].append(study)
        
        for decade in sorted(decade_groups.keys()):
            studies_in_decade = decade_groups[decade]
            timeline.append({
                "period": f"{decade}s",
                "study_count": str(len(studies_in_decade)),
                "key_findings": f"Research focus during {decade}s",
                "notable_studies": [s.pmid for s in studies_in_decade[:2] if s.pmid]
            })
        
        return timeline
    
    def _analyze_regulatory_status(self, compound_name: str, category: str) -> Dict[str, str]:
        """Analyze regulatory status"""
        status_mapping = {
            'supplement': {
                'FDA': 'Regulated as dietary supplement under DSHEA',
                'DEA': 'Not controlled',
                'International': 'Generally available as supplement',
                'Clinical_Use': 'Over-the-counter supplement'
            },
            'sarm': {
                'FDA': 'Not approved for human consumption',
                'DEA': 'Not scheduled but not approved',
                'International': 'Research chemical status varies',
                'Clinical_Use': 'Research purposes only'
            },
            'peptide': {
                'FDA': 'Varies by specific peptide',
                'DEA': 'Some peptides are controlled',
                'International': 'Research chemical or prescription',
                'Clinical_Use': 'Research or prescription only'
            },
            'nootropic': {
                'FDA': 'Varies by compound',
                'DEA': 'Some controlled, others unregulated',
                'International': 'Mixed regulatory status',
                'Clinical_Use': 'Varies by specific compound'
            }
        }
        
        return status_mapping.get(category.lower(), {
            'FDA': 'Status unclear',
            'DEA': 'Status unclear', 
            'International': 'Status unclear',
            'Clinical_Use': 'Status unclear'
        })
    
    def _analyze_market_factors(self, compound_name: str, category: str, therapeutic_apps: List[TherapeuticApplication]) -> Dict[str, str]:
        """Analyze market and cost-effectiveness factors"""
        high_grade_apps = [app for app in therapeutic_apps if app.evidence_strength in ['A', 'B']]
        
        base_analysis = {
            'cost_effectiveness': 'Unknown without pricing data',
            'market_availability': 'Varies by region',
            'quality_variability': 'May vary between manufacturers',
            'standardization': 'Limited standardization'
        }
        
        if len(high_grade_apps) >= 2:
            base_analysis['cost_effectiveness'] = 'Potentially cost-effective for established uses'
        elif len(high_grade_apps) >= 1:
            base_analysis['cost_effectiveness'] = 'fMay be cost-effective for specific applications'
        
        category_factors = {
            'supplement': {'market_availability': 'Widely available', 'standardization': 'USP standards available'},
            'sarm': {'market_availability': 'Research suppliers only', 'quality_variability': 'High variability'},
            'peptide': {'market_availability': 'Research suppliers only', 'quality_variability': 'Very high variability'},
            'nootropic': {'market_availability': 'Varies by compound', 'standardization': 'Limited standards'}
        }
        
        base_analysis.update(category_factors.get(category.lower(), {}))
        return base_analysis
    
    def _generate_clinical_conclusions(self, compound_name: str, evidence_grade: EvidenceGrade, 
                                     therapeutic_apps: List[TherapeuticApplication], 
                                     safety_profile: SafetyProfile) -> Dict[str, any]:
        """Generate key takeaways and clinical bottom line"""
        prompt = f"""Generate clinical conclusions for {compound_name}.

EVIDENCE: Grade {evidence_grade.grade}, {evidence_grade.study_count} studies
APPLICATIONS: {len(therapeutic_apps)} applications
SAFETY: Grade {safety_profile.safety_grade}

Return JSON:

{{"key_takeaways": ["Point 1", "Point 2", "Point 3", "Point 4", "Point 5"], "clinical_bottom_line": "Single paragraph clinical recommendation"}}

Focus on evidence strength, clinical utility, safety, and practical recommendations."""
        
        conclusions = self._make_optimized_api_call(prompt, "clinical_conclusions", 400)
        
        return conclusions or {'key_takeaways': [], 'clinical_bottom_line': ''}
    
    def _extract_chemical_info(self, compound: Compound) -> Dict[str, str]:
        """Extract chemical information"""
        return {
            'cas_number': compound.cas_number or 'Unknown',
            'molecular_formula': compound.molecular_formula or 'Unknown',
            'category': compound.category,
            'common_names': ', '.join(compound.common_names) if compound.common_names else 'None listed'
        }
    
    def _identify_quality_concerns(self, compound_name: str, category: str) -> List[str]:
        """Identify potential quality concerns"""
        category_concerns = {
            'supplement': ['Variability between manufacturers', 'Potential adulteration', 'Dosage accuracy'],
            'sarm': ['Purity concerns', 'Illegal status', 'Unknown long-term effects', 'Quality control issues'],
            'peptide': ['Storage requirements', 'Degradation issues', 'Purity verification needed'],
            'nootropic': ['Regulatory uncertainty', 'Quality variability', 'Limited safety data']
        }
        
        return category_concerns.get(category.lower(), ['Quality concerns not characterized'])
    
    def _analyze_market_position(self, compound_name: str, therapeutic_apps: List[TherapeuticApplication]) -> Dict[str, str]:
        """Analyze market position"""
        return {
            'market_maturity': 'Established' if len(therapeutic_apps) > 3 else 'Emerging',
            'competitive_landscape': 'Multiple alternatives available',
            'innovation_potential': 'Moderate' if therapeutic_apps else 'Unknown'
        }
    
    def _generate_meta_info(self, evidence_grade: EvidenceGrade, study_count: int) -> Dict[str, str]:
        """Generate meta information"""
        return {
            'evidence_quality': f"Grade {evidence_grade.grade} evidence",
            'data_completeness': 'High' if study_count > 20 else 'Moderate' if study_count > 10 else 'Limited',
            'confidence_level': f"{evidence_grade.confidence:.0%} confidence",
            'recommendation_strength': 'Strong' if evidence_grade.grade in ['A', 'B'] else 'Weak'
        }
    
    def _save_comprehensive_summary(self, compound_id: int, profile: ComprehensiveProfile, session):
        """Save comprehensive summary to database"""
        try:
            existing_summary = session.query(CompoundSummary).filter(
                CompoundSummary.compound_id == compound_id
            ).first()

            # Build JSON‑serializable lists
            benefits_data = []
            for app in profile.therapeutic_applications:
                benefits_data.append({
                    'indication': app.indication,
                    'evidence_strength': app.evidence_strength,
                    'effect_size': app.effect_size,
                    'population': app.population,
                    'dose_range': app.dose_range,
                    'supporting_studies': app.supporting_studies
                })

            side_effects_data = []
            for ae in profile.safety_profile.common_adverse_events:
                if isinstance(ae, dict):
                    side_effects_data.append(f"{ae.get('event', '')}: {ae.get('frequency', '')}")
                else:
                    side_effects_data.append(str(ae))

            interactions_data = []
            for interaction in profile.safety_profile.drug_interactions:
                if isinstance(interaction, dict):
                    interactions_data.append(f"{interaction.get('drug', '')}: {interaction.get('mechanism', '')}")
                else:
                    interactions_data.append(str(interaction))

            # Serialize and save
            if existing_summary:
                existing_summary.overview = profile.overview
                existing_summary.mechanism_of_action = json.dumps(
                    profile.mechanism_of_action.primary_pathways
                )
                existing_summary.benefits = json.dumps(benefits_data)
                existing_summary.side_effects = json.dumps(side_effects_data)
                existing_summary.interactions = json.dumps(interactions_data)
                existing_summary.contraindications = json.dumps(
                    profile.safety_profile.contraindications
                )
                existing_summary.references = json.dumps(profile.references)
                existing_summary.ai_generated = True
                existing_summary.reviewed_by_expert = False
                existing_summary.version = existing_summary.version + 1
                existing_summary.updated_at = datetime.utcnow()
            else:
                new_summary = CompoundSummary(
                    compound_id=compound_id,
                    overview=profile.overview,
                    mechanism_of_action=json.dumps(
                        profile.mechanism_of_action.primary_pathways
                    ),
                    benefits=json.dumps(benefits_data),
                    side_effects=json.dumps(side_effects_data),
                    interactions=json.dumps(interactions_data),
                    contraindications=json.dumps(
                        profile.safety_profile.contraindications
                    ),
                    references=json.dumps(profile.references),
                    ai_generated=True,
                    reviewed_by_expert=False,
                    version=1,
                    updated_at=datetime.utcnow()
                )
                session.add(new_summary)

            session.commit()
            logger.info(f"Saved comprehensive summary for compound {compound_id}")

        except Exception as e:
            logger.error(f"Error saving comprehensive summary: {e}")
            session.rollback()
    
    def print_comprehensive_cost_summary(self):
        """Print detailed cost tracking summary"""
        avg_cost_per_compound = self.total_cost / max(self.compounds_processed, 1)
        
        print(f"\n💰 COMPREHENSIVE COST ANALYSIS")
        print(f"{'='*60}")
        print(f"Compounds processed: {self.compounds_processed}")
        print(f"Input tokens: {self.total_input_tokens:,}")
        print(f"Output tokens: {self.total_output_tokens:,}")
        print(f"Total tokens: {self.total_input_tokens + self.total_output_tokens:,}")
        print(f"Total cost: ${self.total_cost:.4f}")
        print(f"Average cost per compound: ${avg_cost_per_compound:.4f}")
        print(f"Projected cost for 100 compounds: ${avg_cost_per_compound * 100:.2f}")
        print(f"{'='*60}")

def main():
    """Ultimate comprehensive main function"""
    os.makedirs('logs', exist_ok=True)
    
    print("🚀 ULTIMATE AI SUMMARY GENERATION SYSTEM")
    print("GPT-4o-mini Optimized | Full Feature Set | Error-Free Version")
    print("="*70)
    
    generator = UltimateAISummaryGenerator()
    session = get_session()
    
    try:
        compounds_query = text("""
        SELECT c.id, c.name, c.category, COUNT(s.id) as study_count
        FROM compounds c
        LEFT JOIN studies s ON c.id = s.compound_id
        WHERE c.name IS NOT NULL AND c.name != ''
        GROUP BY c.id, c.name, c.category
        HAVING COUNT(s.id) >= 5
        ORDER BY COUNT(s.id) DESC
        LIMIT 100
        """)
        
        result = session.execute(compounds_query)
        compounds = result.fetchall()
        
        print(f"📊 Found {len(compounds)} compounds with sufficient studies (≥5)")
        
        estimated_cost = len(compounds) * 0.008  # Updated for GPT-4o-mini
        print(f"💰 Estimated total cost: ${estimated_cost:.2f}")
        
        print(f"\n🔧 PROCESSING OPTIONS:")
        print(f"1. Process all {len(compounds)} compounds")
        print(f"2. Process top 25 compounds (testing)")
        print(f"3. Process top 50 compounds")
        print(f"4. Process specific category only")
        print(f"5. Exit")
        
        choice = input("Enter choice (1-5): ").strip()
        
        if choice == '2':
            compounds = compounds[:25]
            print(f"Limited to top {len(compounds)} compounds")
        elif choice == '3':
            compounds = compounds[:50]
            print(f"Limited to top {len(compounds)} compounds")
        elif choice == '4':
            categories = list(set(c for c in compounds))
            print(f"Available categories: {', '.join(categories)}")
            selected_category = input("Enter category: ").strip().lower()
            compounds = [c for c in compounds if c.lower() == selected_category]
            print(f"Filtered to {len(compounds)} {selected_category} compounds")
        elif choice == '5':
            print("Exiting...")
            return
        elif choice != '1':
            print("Invalid choice, processing all compounds...")
        
        if not compounds:
            print("❌ No compounds to process")
            return
        
        final_confirmation = input(f"\n🚀 Process {len(compounds)} compounds? (y/n): ")
        if final_confirmation.lower() != 'y':
            print("Cancelled by user")
            return
        
        print(f"\n🔄 Starting comprehensive profile generation...")
        print(f"⏱️  Estimated time: {len(compounds) * 0.4:.1f} minutes")
        start_time = time.time()
        
        successful = 0
        failed = 0
        
        for i, (compound_id, name, category, study_count) in enumerate(compounds, 1):
            print(f"\n[{i:3d}/{len(compounds)}] 📚 {name} ({category})")
            print(f"           📊 {study_count} studies available")
            
            try:
                profile = generator.generate_comprehensive_profile(compound_id)
                if profile:
                    print(f"           ✅ Success | Evidence: {profile.clinical_evidence.grade} | Apps: {len(profile.therapeutic_applications)}")
                    successful += 1
                else:
                    print(f"           ❌ Failed")
                    failed += 1
                
                if i % 5 == 0:
                    elapsed = time.time() - start_time
                    rate = i / elapsed * 60
                    remaining = (len(compounds) - i) / rate if rate > 0 else 0
                    
                    print(f"\n📈 PROGRESS REPORT [{i}/{len(compounds)}]")
                    print(f"   ✅ Successful: {successful}")
                    print(f"   ❌ Failed: {failed}")
                    print(f"   🎯 Success rate: {successful/i*100:.1f}%")
                    print(f"   ⏱️  Elapsed: {elapsed/60:.1f}m | Remaining: ~{remaining:.1f}m")
                    generator.print_comprehensive_cost_summary()
                    print()
                
                time.sleep(0.2)
                
            except KeyboardInterrupt:
                print(f"\n⚠️  Process interrupted by user at compound {i}")
                break
            except Exception as e:
                print(f"           ❌ Error: {str(e)}")
                failed += 1
                continue
        
        end_time = time.time()
        total_duration = end_time - start_time
        
        print(f"\n🎉 COMPREHENSIVE PROFILE GENERATION COMPLETE!")
        print(f"{'='*70}")
        print(f"⏱️  Total duration: {total_duration/60:.1f} minutes")
        print(f"📊 Compounds processed: {successful + failed}")
        print(f"✅ Successful profiles: {successful}")
        print(f"❌ Failed profiles: {failed}")
        print(f"🎯 Success rate: {successful/(successful + failed)*100:.1f}%")
        print(f"⚡ Processing rate: {(successful + failed)/(total_duration/60):.1f} compounds/min")
        
        generator.print_comprehensive_cost_summary()
        
        total_compounds = session.query(Compound).count()
        compounds_with_summaries = session.query(CompoundSummary).count()
        total_studies = session.query(Study).count()
        
        print(f"\n📈 DATABASE TOTALS:")
        print(f"   Total compounds: {total_compounds}")
        print(f"   Compounds with AI summaries: {compounds_with_summaries}")
        print(f"   Total studies: {total_studies}")
        print(f"   Coverage: {compounds_with_summaries/total_compounds*100:.1f}%")
        
        print(f"{'='*70}")
        print(f"🚀 READY FOR FRONTEND INTEGRATION!")
        print(f"✅ Your supplement research platform now has comprehensive,")
        print(f"   evidence-based profiles that rival Examine.com!")
        
    except Exception as e:
        logger.error(f"Fatal error in main process: {str(e)}")
        generator.print_comprehensive_cost_summary()
    finally:
        session.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="🚀 ULTIMATE AI SUMMARY GENERATION SYSTEM (non‑interactive mode)"
    )
    parser.add_argument(
        "--min-studies",
        type=int,
        help="Only process compounds with at least this many studies (skip menu)."
    )
    parser.add_argument(
        "--top",
        type=int,
        default=None,
        help="After filtering by --min‑studies, only keep the top N compounds by study count."
    )
    parser.add_argument(
        "--process-stubs",
        action="store_true",
        help="Generate AI summaries for compounds with fewer than --threshold studies"
    )
    parser.add_argument(
        "--threshold",
        type=int,
        default=5,
        help="The study‑count cutoff for --process‑stubs (default: 5)"
    )
    parser.add_argument(
        "--generate-dosages",
        action="store_true",
        help="Run AI dosage extractor for all compounds with ≥ --min-studies studies"
    )
    args = parser.parse_args()

    # initialize
    session = get_session()
    generator = UltimateAISummaryGenerator()

    if args.generate_dosages:
        thresh = args.min_studies if args.min_studies is not None else 0
        generator.process_dosages(session, threshold=thresh)
        exit(0)

    # Non‑interactive batch mode
    if args.min_studies is not None:
        # 1) Fetch (Compound, study_count)
        results = (
            session.query(Compound, func.count(Study.id).label("study_count"))
            .join(Study, Study.compound_id == Compound.id)
            .group_by(Compound.id)
            .having(func.count(Study.id) >= args.min_studies)
            .order_by(func.count(Study.id).desc())
            .all()
        )
        compounds = [r[0] for r in results]
        print(f"📊 Found {len(compounds)} compounds with ≥ {args.min_studies} studies")

        # 2) Optionally trim to top M
        if args.top:
            compounds = compounds[: args.top]
            print(f"🔧 Limited to top {len(compounds)} compounds by study count")

        # 3) Confirm & run
        confirm = input(f"🚀 Process these {len(compounds)} compounds now? (y/n): ")
        if confirm.strip().lower() != "y":
            print("Aborted.")
            exit(0)

        # 4) Batch‑process exactly those compounds
        for idx, compound in enumerate(compounds, start=1):
            generator.process_compound_by_id(compound.id, session, index=idx, total=len(compounds))
        print("🎉 Batch run complete!")
        exit(0)
    
    # NEW: process low‑study compounds
    if args.process_stubs:
        generator.process_low_study_compounds(session, threshold=args.threshold)
        exit(0)
    # Fallback to your existing interactive menu
    main()

