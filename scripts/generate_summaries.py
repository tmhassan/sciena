#!/usr/bin/env python3
"""
Generate AI summaries for all compounds
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.database import get_session
from database.models import Compound
from ai_processing.summary_generator import SummaryGenerator
from utils.logger import setup_logger

logger = setup_logger(__name__)

def generate_all_summaries():
    """Generate AI summaries for all compounds"""
    
    session = get_session()
    generator = SummaryGenerator()
    
    try:
        compounds = session.query(Compound).all()
        
        for compound in compounds:
            print(f"Generating summary for {compound.name}...")
            
            try:
                summary = generator.generate_compound_summary(compound.id)
                if summary:
                    print(f"✅ Summary generated for {compound.name}")
                else:
                    print(f"❌ Failed to generate summary for {compound.name}")
            except Exception as e:
                print(f"❌ Error generating summary for {compound.name}: {str(e)}")
        
        print("Summary generation complete!")
        
    except Exception as e:
        logger.error(f"Error in summary generation: {str(e)}")
    finally:
        session.close()

if __name__ == '__main__':
    generate_all_summaries()
