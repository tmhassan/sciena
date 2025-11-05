#!/usr/bin/env python3
"""
Fetch literature for all compounds in the master list
"""

import csv, time, json, os, sys
from pathlib import Path

# Add the parent directory to Python path
sys.path.append(str(Path(__file__).resolve().parents[1]))

# Import from your existing structure
from database.database import get_session, init_database
from database.models import Compound, Study
from data_acquisition.pubmed_client import PubMedClient
from utils.logger import setup_logger

logger = setup_logger(__name__)

PUBMED_EMAIL = os.getenv("PUBMED_EMAIL")
DATA_DIR = Path(__file__).resolve().parents[1] / "data"

def upsert_compound(session, name, category):
    """Insert or update compound in database"""
    try:
        # Check if compound already exists
        compound = session.query(Compound).filter(Compound.name == name).first()
        
        if not compound:
            # Create new compound
            compound = Compound(
                name=name,
                category=category,
                common_names=[name],  # Start with just the main name
                legal_status="Unknown",
                safety_rating="C"  # Default rating
            )
            session.add(compound)
            session.commit()
            logger.info(f"Created new compound: {name}")
        
        return compound.id
        
    except Exception as e:
        logger.error(f"Error upserting compound {name}: {str(e)}")
        session.rollback()
        return None

def fetch_literature_for_compound(client, session, compound_id, compound_name):
    """Fetch literature for a single compound"""
    try:
        # Check how many studies we already have
        existing_count = session.query(Study).filter(Study.compound_id == compound_id).count()
        
        if existing_count >= 20:
            logger.info(f"Skipping {compound_name} - already has {existing_count} studies")
            return 0
        
        # Search for studies with the compound name
        logger.info(f"Searching literature for: {compound_name}")
        pmids = client.search_studies(compound_name, max_results=25)
        
        if not pmids:
            logger.warning(f"No studies found for {compound_name}")
            return 0
        
        # Fetch detailed study information
        studies_data = client.fetch_study_details(pmids)
        
        if not studies_data:
            logger.warning(f"No study details retrieved for {compound_name}")
            return 0
        
        # Save studies to database
        new_studies = 0
        for study_data in studies_data:
            try:
                # Check if study already exists
                existing_study = session.query(Study).filter(Study.pmid == study_data['pmid']).first()
                
                if not existing_study:
                    # Create new study
                    study = Study(
                        compound_id=compound_id,
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
                    new_studies += 1
                
            except Exception as e:
                logger.error(f"Error saving study {study_data.get('pmid', 'unknown')}: {str(e)}")
                continue
        
        # Commit all studies for this compound
        session.commit()
        logger.info(f"Saved {new_studies} new studies for {compound_name}")
        return new_studies
        
    except Exception as e:
        logger.error(f"Error fetching literature for {compound_name}: {str(e)}")
        session.rollback()
        return 0

def main():
    """Main literature fetching function"""
    print("🚀 Starting literature fetching process...")
    print("=" * 60)
    
    # Initialize database
    init_database()
    
    # Initialize PubMed client
    if not PUBMED_EMAIL:
        print("❌ ERROR: PUBMED_EMAIL not set in .env file")
        print("Please add: PUBMED_EMAIL=your_email@example.com")
        return
    
    client = PubMedClient(email=PUBMED_EMAIL)
    session = get_session()
    
    try:
        # Read the master compound list
        master_file = DATA_DIR / "master_list.csv"
        if not master_file.exists():
            print(f"❌ ERROR: Master list not found at {master_file}")
            print("Please run: python tasks/01_build_master_list.py first")
            return
        
        # Load compounds from CSV
        compounds_processed = 0
        total_studies = 0
        
        with open(master_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            
            for row in reader:
                compound_name = row['name'].strip()
                category = row['category'].strip()
                
                if not compound_name or len(compound_name) < 3:
                    continue
                
                print(f"\n📚 Processing: {compound_name} ({category})")
                
                # Create/update compound in database
                compound_id = upsert_compound(session, compound_name, category)
                
                if compound_id:
                    # Fetch literature for this compound
                    new_studies = fetch_literature_for_compound(
                        client, session, compound_id, compound_name
                    )
                    total_studies += new_studies
                    compounds_processed += 1
                    
                    # Be polite to PubMed servers
                    time.sleep(0.5)
                    
                    # Progress update every 10 compounds
                    if compounds_processed % 10 == 0:
                        print(f"\n📊 Progress: {compounds_processed} compounds processed, {total_studies} studies collected")
                
                # Optional: Limit for testing (remove in production)
                # if compounds_processed >= 50:  # Process only first 50 for testing
                #     print("\n🧪 Testing mode: Stopping after 50 compounds")
                #     break
        
        print(f"\n🎉 LITERATURE FETCHING COMPLETE!")
        print("=" * 60)
        print(f"📊 FINAL STATS:")
        print(f"   Compounds processed: {compounds_processed}")
        print(f"   Total studies collected: {total_studies}")
        print(f"   Average studies per compound: {total_studies/compounds_processed:.1f}" if compounds_processed > 0 else "")
        
        # Show database stats
        total_compounds = session.query(Compound).count()
        total_studies_db = session.query(Study).count()
        
        print(f"\n📈 DATABASE TOTALS:")
        print(f"   Total compounds in DB: {total_compounds}")
        print(f"   Total studies in DB: {total_studies_db}")
        print("=" * 60)
        print("✅ Ready for AI summary generation!")
        
    except KeyboardInterrupt:
        print("\n⚠️  Process interrupted by user")
    except Exception as e:
        logger.error(f"Fatal error in main process: {str(e)}")
    finally:
        session.close()

if __name__ == "__main__":
    main()
