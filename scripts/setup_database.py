#!/usr/bin/env python3
"""
Database setup script - Run this first to initialize your database
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.database import init_database, get_session
from database.models import Compound
import json

def setup_database():
    """Initialize database and populate with initial data"""
    
    print("Initializing database...")
    init_database()
    
    print("Loading initial compound data...")
    session = get_session()
    
    # Sample compounds to get started
    initial_compounds = [
        {
            'name': 'Creatine Monohydrate',
            'common_names': ['Creatine', 'N-methylguanidino acetic acid'],
            'category': 'supplement',
            'cas_number': '6020-87-7',
            'molecular_formula': 'C4H9N3O2',
            'legal_status': 'OTC',
            'safety_rating': 'A'
        },
        {
            'name': 'RAD-140',
            'common_names': ['Testolone', 'RAD140'],
            'category': 'sarm',
            'legal_status': 'Research Chemical',
            'safety_rating': 'C'
        },
        {
            'name': 'BPC-157',
            'common_names': ['Pentadecapeptide BPC 157', 'Body Protection Compound'],
            'category': 'peptide',
            'legal_status': 'Research Chemical',
            'safety_rating': 'B'
        },
        {
            'name': 'Modafinil',
            'common_names': ['Provigil', '2-[(diphenylmethyl)sulfinyl]acetamide'],
            'category': 'nootropic',
            'legal_status': 'Prescription',
            'safety_rating': 'B'
        }
    ]
    
    for compound_data in initial_compounds:
        existing = session.query(Compound).filter(Compound.name == compound_data['name']).first()
        if not existing:
            compound = Compound(**compound_data)
            session.add(compound)
    
    session.commit()
    session.close()
    
    print("Database setup complete!")
    print("\nNext steps:")
    print("1. Run: python scripts/populate_compounds.py")
    print("2. Run: python scripts/fetch_research.py")
    print("3. Run: python scripts/generate_summaries.py")
    print("4. Start the app: python app.py")

if __name__ == '__main__':
    setup_database()
