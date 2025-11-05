#!/usr/bin/env python3
"""
Fetch research papers for all compounds in the database
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.database import get_session
from database.models import Compound, Study
from data_acquisition.pubmed_client import PubMedClient
from utils.logger import setup_logger
import time

logger = setup_logger(__name__)

def fetch_all_research():
    """Fetch research papers for all compounds"""
    
    session = get_session()
    pubmed = PubMedClient(email=os.getenv('PUBMED_EMAIL'))
    
    try:
        compounds = session.query(Compound).all()
        
        for compound in compounds:
            print(f"Fetching research for {compound.name}...")
            
            # Search for studies
            pmids = pubmed.search_studies(compound.name, max_results=50)
            
            if pmids:
                # Fetch study details
                studies_data = pubmed.fetch_study_details(pmids)
                
                # Save to database
                for study_data in studies_data:
                    existing_study = session.query(Study).filter(
                        Study.pmid == study_data['pmid']
                    ).first()
                    
                    if not existing_study:
                        study = Study(
                            compound_id=compound.id,
                            pmid=study_data['pmid'],
                            doi=study_data.get('doi'),
                            title=study_data['title'],
                            abstract=study_data['abstract'],
                            authors=study_data['authors'],
                            journal=study_data['journal'],
                            publication_year=study_data['publication_year'],
                            study_type='Unknown',  # Will be classified later
                            evidence_level='C'     # Default, will be graded later
                        )
                        session.add(study)
                
                session.commit()
                print(f"Saved {len(studies_data)} studies for {compound.name}")
            
            # Rate limiting
            time.sleep(2)
        
        print("Research data fetching complete!")
        
    except Exception as e:
        logger.error(f"Error fetching research: {str(e)}")
        session.rollback()
    finally:
        session.close()

if __name__ == '__main__':
    fetch_all_research()
