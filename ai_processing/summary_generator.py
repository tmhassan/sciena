import openai
import json
from typing import Dict, List, Optional
from database.models import Compound, Study, CompoundSummary
from database.database import get_session
import os
from dotenv import load_dotenv
from utils.logger import setup_logger

load_dotenv()
logger = setup_logger(__name__)

class SummaryGenerator:
    def __init__(self):
        openai.api_key = os.getenv('OPENAI_API_KEY')
        self.model = "gpt-3.5-turbo"  # Much cheaper and has higher limits
        
    def generate_compound_summary(self, compound_id: int) -> Optional[Dict]:
        """Generate comprehensive AI summary for a compound"""
        
        session = get_session()
        try:
            # Get compound and related studies
            compound = session.query(Compound).filter(Compound.id == compound_id).first()
            if not compound:
                logger.error(f"Compound with ID {compound_id} not found")
                return None
            
            studies = session.query(Study).filter(Study.compound_id == compound_id).all()
            
            if not studies:
                logger.warning(f"No studies found for compound {compound.name}")
                return None
            
            # Limit and prepare study data for prompt (reduce token usage)
            study_data = []
            for study in studies[:20]:  # Limit to 20 most relevant studies
                # Truncate abstracts to reduce token usage
                abstract = study.abstract[:300] + "..." if study.abstract and len(study.abstract) > 300 else study.abstract
                
                study_info = {
                    'pmid': study.pmid,
                    'title': study.title[:150] + "..." if study.title and len(study.title) > 150 else study.title,
                    'abstract': abstract,
                    'year': study.publication_year,
                    'study_type': study.study_type,
                    'sample_size': study.sample_size,
                    'evidence_level': study.evidence_level
                }
                study_data.append(study_info)
            
            # Generate summary using AI
            summary_data = self._call_openai_for_summary(compound.name, study_data)
            
            if summary_data:
                # Save to database
                existing_summary = session.query(CompoundSummary).filter(
                    CompoundSummary.compound_id == compound_id
                ).first()
                
                if existing_summary:
                    # Update existing summary
                    existing_summary.overview = summary_data['overview']
                    existing_summary.mechanism_of_action = summary_data['mechanism']
                    existing_summary.benefits = summary_data['benefits']
                    existing_summary.side_effects = summary_data['side_effects']
                    existing_summary.interactions = summary_data['interactions']
                    existing_summary.contraindications = summary_data['contraindications']
                    existing_summary.references = summary_data['references']
                    existing_summary.version += 1
                else:
                    # Create new summary
                    new_summary = CompoundSummary(
                        compound_id=compound_id,
                        overview=summary_data['overview'],
                        mechanism_of_action=summary_data['mechanism'],
                        benefits=summary_data['benefits'],
                        side_effects=summary_data['side_effects'],
                        interactions=summary_data['interactions'],
                        contraindications=summary_data['contraindications'],
                        references=summary_data['references']
                    )
                    session.add(new_summary)
                
                session.commit()
                logger.info(f"Generated summary for {compound.name}")
                return summary_data
            
        except Exception as e:
            logger.error(f"Error generating summary for compound {compound_id}: {str(e)}")
            session.rollback()
            return None
        finally:
            session.close()
    
    def _call_openai_for_summary(self, compound_name: str, studies: List[Dict]) -> Optional[Dict]:
        """Call OpenAI API to generate structured summary"""
        
        # Create a more concise prompt to reduce token usage
        prompt = f"""
Analyze research on {compound_name} and provide evidence-based summary.

STUDIES ({len(studies)} total):
{json.dumps(studies, indent=1)}

Return valid JSON only:
{{
    "overview": "Brief 2-sentence overview of {compound_name}",
    "mechanism": "How it works in the body (100 words max)",
    "benefits": [
        {{"claim": "Benefit", "evidence_level": "A/B/C/D", "population": "Who", "effect_size": "How much"}}
    ],
    "side_effects": ["List side effects"],
    "interactions": ["Drug/supplement interactions"],
    "contraindications": ["Who should avoid"],
    "references": ["PMID1", "PMID2"]
}}

Guidelines:
- Only use provided studies
- A=high-quality RCT, B=lower RCT, C=observational, D=case/vitro
- Be conservative with claims
- Include PMIDs for major claims
"""
        
        try:
            response = openai.ChatCompletion.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a medical research expert. Return only valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=1500  # Reduced from 2000
            )
            
            # Parse JSON response
            content = response.choices[0].message.content
            summary_data = json.loads(content)
            
            return summary_data
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"OpenAI API error: {str(e)}")
            return None
