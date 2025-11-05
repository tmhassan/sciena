#!/usr/bin/env python3
"""
Enhanced Literature Fetching Script with Multi-Database Support
"""

import csv
import time
import json
import os
import sys
from pathlib import Path
from typing import List, Dict, Optional
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import asdict
import traceback

# Add the parent directory to Python path
sys.path.append(str(Path(__file__).resolve().parents[1]))

# Import from existing structure
from database.database import get_session, init_database
from database.models import Compound, Study
from data_acquisition.multi_database_client import MultiDatabaseSearchEngine, StudyResult
from utils.logger import setup_logger

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/literature_fetch.log'),
        logging.StreamHandler()
    ]
)
logger = setup_logger(__name__)

# Configuration
PUBMED_EMAIL = os.getenv("PUBMED_EMAIL")
SEMANTIC_SCHOLAR_API_KEY = os.getenv("SEMANTIC_SCHOLAR_API_KEY")  # Optional
DATA_DIR = Path(__file__).resolve().parents[1] / "data"
RESULTS_DIR = DATA_DIR / "results"
RESULTS_DIR.mkdir(exist_ok=True)

class EnhancedLiteratureFetcher:
    """Enhanced literature fetcher with multi-database support"""
    
    def __init__(self):
        self.search_engine = MultiDatabaseSearchEngine(
            pubmed_email=PUBMED_EMAIL,
            semantic_scholar_api_key=SEMANTIC_SCHOLAR_API_KEY
        )
        self.session = get_session()
        self.stats = {
            'compounds_processed': 0,
            'compounds_with_studies': 0,
            'total_studies_found': 0,
            'total_studies_saved': 0,
            'database_stats': {},
            'errors': []
        }
        
    def process_compound(self, compound_name: str, category: str) -> Dict:
        """Process a single compound with comprehensive search"""
        try:
            logger.info(f"Processing: {compound_name} ({category})")
            
            # Create or get compound in database
            compound_id = self._upsert_compound(compound_name, category)
            if not compound_id:
                return {'success': False, 'error': 'Failed to create compound'}
            
            # Check existing studies
            existing_count = self.session.query(Study).filter(
                Study.compound_id == compound_id
            ).count()
            
            if existing_count >= 25:
                logger.info(f"Skipping {compound_name} - already has {existing_count} studies")
                return {
                    'success': True, 
                    'new_studies': 0,
                    'existing_studies': existing_count,
                    'skipped': True
                }
            
            # Perform comprehensive search
            max_new_studies = 30 - existing_count
            studies = self.search_engine.search_comprehensive(
                compound_name, 
                max_results=max_new_studies
            )
            
            if not studies:
                # Try alternative search if no results
                studies = self._try_alternative_search(compound_name)
            
            # Save studies to database
            saved_count = self._save_studies(compound_id, studies)
            
            result = {
                'success': True,
                'compound_name': compound_name,
                'category': category,
                'new_studies': saved_count,
                'existing_studies': existing_count,
                'total_studies': existing_count + saved_count,
                'databases_searched': list(self.search_engine.clients.keys()),
                'skipped': False
            }
            
            logger.info(f"✅ {compound_name}: {saved_count} new studies (total: {existing_count + saved_count})")
            
            return result
            
        except Exception as e:
            error_msg = f"Error processing {compound_name}: {str(e)}"
            logger.error(error_msg)
            logger.error(traceback.format_exc())
            
            return {
                'success': False,
                'compound_name': compound_name,
                'error': error_msg
            }
    
    def _upsert_compound(self, name: str, category: str) -> Optional[int]:
        """Create or update compound in database"""
        try:
            compound = self.session.query(Compound).filter(Compound.name == name).first()
            
            if not compound:
                compound = Compound(
                    name=name,
                    category=category,
                    common_names=[name],
                    legal_status="Unknown",
                    safety_rating="C"
                )
                self.session.add(compound)
                self.session.commit()
                logger.debug(f"Created new compound: {name}")
            
            return compound.id
            
        except Exception as e:
            logger.error(f"Error upserting compound {name}: {str(e)}")
            self.session.rollback()
            return None
    
    def _try_alternative_search(self, compound_name: str) -> List[StudyResult]:
        """Try alternative search strategies for compounds with no results"""
        logger.info(f"Trying alternative search for: {compound_name}")
        
        alternative_terms = []
        
        # Extract first word if compound name is long
        words = compound_name.split()
        if len(words) > 1:
            alternative_terms.append(words[0])
        
        # Remove parentheses and try again
        clean_name = compound_name.replace('(', '').replace(')', '').strip()
        if clean_name != compound_name:
            alternative_terms.append(clean_name)
        
        # Try broader search
        for term in alternative_terms:
            if len(term) > 3:
                try:
                    studies = self.search_engine.search_comprehensive(term, max_results=10)
                    if studies:
                        logger.info(f"Alternative search successful for: {term}")
                        return studies
                except Exception as e:
                    logger.warning(f"Alternative search failed for {term}: {e}")
                    continue
        
        return []
    
    def _save_studies(self, compound_id: int, studies: List[StudyResult]) -> int:
        """Save studies to database with enhanced error handling"""
        saved_count = 0
        
        for study_result in studies:
            try:
                # Check for existing study by PMID or DOI
                existing_study = None
                if study_result.pmid:
                    existing_study = self.session.query(Study).filter(
                        Study.pmid == study_result.pmid
                    ).first()
                elif study_result.doi:
                    existing_study = self.session.query(Study).filter(
                        Study.doi == study_result.doi
                    ).first()
                
                if existing_study:
                    continue
                
                # Create new study record
                study = Study(
                    compound_id=compound_id,
                    pmid=study_result.pmid,
                    doi=study_result.doi,
                    title=study_result.title[:500] if study_result.title else "",
                    abstract=study_result.abstract[:2000] if study_result.abstract else "",
                    authors=study_result.authors,
                    journal=study_result.journal[:255] if study_result.journal else "",
                    publication_year=study_result.publication_year,
                    study_type=study_result.study_type,
                    evidence_level='C',  # Default, will be updated by AI
                    full_text_url=study_result.url
                )
                
                self.session.add(study)
                saved_count += 1
                
            except Exception as e:
                logger.error(f"Error saving individual study: {str(e)}")
                continue
        
        try:
            self.session.commit()
            logger.debug(f"Committed {saved_count} studies to database")
        except Exception as e:
            logger.error(f"Error committing studies: {str(e)}")
            self.session.rollback()
            saved_count = 0
        
        return saved_count
    
    def process_compounds_batch(self, compounds: List[Dict], batch_size: int = 10) -> List[Dict]:
        """Process compounds in batches with parallel execution"""
        results = []
        
        for i in range(0, len(compounds), batch_size):
            batch = compounds[i:i + batch_size]
            logger.info(f"Processing batch {i//batch_size + 1}/{(len(compounds) + batch_size - 1)//batch_size}")
            
            with ThreadPoolExecutor(max_workers=3) as executor:
                future_to_compound = {
                    executor.submit(self.process_compound, comp['name'], comp['category']): comp
                    for comp in batch
                }
                
                for future in as_completed(future_to_compound, timeout=300):
                    compound = future_to_compound[future]
                    try:
                        result = future.result()
                        results.append(result)
                        
                        # Update statistics
                        self.stats['compounds_processed'] += 1
                        if result.get('success') and result.get('new_studies', 0) > 0:
                            self.stats['compounds_with_studies'] += 1
                            self.stats['total_studies_found'] += result.get('new_studies', 0)
                        
                    except Exception as e:
                        error_msg = f"Batch processing error for {compound['name']}: {str(e)}"
                        logger.error(error_msg)
                        self.stats['errors'].append(error_msg)
                        results.append({
                            'success': False,
                            'compound_name': compound['name'],
                            'error': error_msg
                        })
            
            # Progress report
            if (i + batch_size) % 50 == 0:
                self._print_progress_report()
            
            # Rate limiting between batches
            time.sleep(2)
        
        return results
    
    def _print_progress_report(self):
        """Print progress statistics"""
        stats = self.stats
        success_rate = (stats['compounds_with_studies'] / max(stats['compounds_processed'], 1)) * 100
        
        print(f"\n📊 PROGRESS REPORT")
        print(f"{'='*50}")
        print(f"Compounds processed: {stats['compounds_processed']}")
        print(f"Compounds with studies: {stats['compounds_with_studies']}")
        print(f"Success rate: {success_rate:.1f}%")
        print(f"Total studies found: {stats['total_studies_found']}")
        print(f"Errors: {len(stats['errors'])}")
        print(f"{'='*50}\n")
    
    def save_detailed_results(self, results: List[Dict], filename: str):
        """Save detailed results to JSON file"""
        output_file = RESULTS_DIR / f"{filename}_{int(time.time())}.json"
        
        summary = {
            'timestamp': time.time(),
            'total_compounds': len(results),
            'successful_compounds': len([r for r in results if r.get('success')]),
            'compounds_with_studies': len([r for r in results if r.get('success') and r.get('new_studies', 0) > 0]),
            'total_studies_found': sum(r.get('new_studies', 0) for r in results if r.get('success')),
            'statistics': self.stats,
            'results': results
        }
        
        with open(output_file, 'w') as f:
            json.dump(summary, f, indent=2, default=str)
        
        logger.info(f"Detailed results saved to: {output_file}")
        return output_file

def main():
    """Enhanced main function"""
    print("🚀 ENHANCED LITERATURE FETCHING ENGINE")
    print("=" * 60)
    
    # Validate configuration
    if not PUBMED_EMAIL:
        print("❌ ERROR: PUBMED_EMAIL not set in .env file")
        print("Please add: PUBMED_EMAIL=your_email@example.com")
        return
    
    # Initialize database
    init_database()
    
    # Initialize fetcher
    fetcher = EnhancedLiteratureFetcher()
    
    try:
        # Load compound list
        master_file = DATA_DIR / "master_list.csv"
        if not master_file.exists():
            print(f"❌ ERROR: Master list not found at {master_file}")
            print("Please run: python tasks/01_build_master_list.py first")
            return
        
        # Read compounds
        compounds = []
        with open(master_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                name = row['name'].strip()
                category = row['category'].strip()
                if name and len(name) >= 3:
                    compounds.append({'name': name, 'category': category})
        
        print(f"📚 Loaded {len(compounds)} compounds for processing")
        
        # Ask user for processing options
        print("\n🔧 PROCESSING OPTIONS:")
        print("1. Process all compounds (recommended)")
        print("2. Process only compounds without studies")
        print("3. Process first 100 compounds (testing)")
        print("4. Process specific category only")
        
        choice = input("Enter choice (1-4): ").strip()
        
        if choice == "2":
            # Filter compounds that already have studies
            session = get_session()
            filtered_compounds = []
            for comp in compounds:
                existing_compound = session.query(Compound).filter(
                    Compound.name == comp['name']
                ).first()
                if not existing_compound:
                    filtered_compounds.append(comp)
                else:
                    study_count = session.query(Study).filter(
                        Study.compound_id == existing_compound.id
                    ).count()
                    if study_count < 5:  # Less than 5 studies
                        filtered_compounds.append(comp)
            session.close()
            compounds = filtered_compounds
            print(f"Filtered to {len(compounds)} compounds without sufficient studies")
            
        elif choice == "3":
            compounds = compounds[:100]
            print(f"Limited to first {len(compounds)} compounds for testing")
            
        elif choice == "4":
            categories = list(set(c['category'] for c in compounds))
            print(f"Available categories: {', '.join(categories)}")
            selected_category = input("Enter category: ").strip().lower()
            compounds = [c for c in compounds if c['category'].lower() == selected_category]
            print(f"Filtered to {len(compounds)} {selected_category} compounds")
        
        if not compounds:
            print("❌ No compounds to process")
            return
        
        print(f"\n🚀 Starting processing of {len(compounds)} compounds...")
        start_time = time.time()
        
        # Process compounds
        results = fetcher.process_compounds_batch(compounds, batch_size=5)
        
        # Final statistics
        end_time = time.time()
        duration = end_time - start_time
        
        print(f"\n🎉 PROCESSING COMPLETE!")
        print("=" * 60)
        print(f"⏱️  Duration: {duration/60:.1f} minutes")
        print(f"📊 Compounds processed: {len(results)}")
        
        successful_results = [r for r in results if r.get('success')]
        compounds_with_studies = [r for r in successful_results if r.get('new_studies', 0) > 0]
        
        print(f"✅ Successful: {len(successful_results)}")
        print(f"📚 With new studies: {len(compounds_with_studies)}")
        print(f"📈 Success rate: {len(compounds_with_studies)/len(results)*100:.1f}%")
        print(f"📖 Total studies found: {sum(r.get('new_studies', 0) for r in successful_results)}")
        
        # Show database totals
        session = get_session()
        total_compounds = session.query(Compound).count()
        total_studies = session.query(Study).count()
        session.close()
        
        print(f"\n📈 DATABASE TOTALS:")
        print(f"   Total compounds: {total_compounds}")
        print(f"   Total studies: {total_studies}")
        print(f"   Avg studies/compound: {total_studies/total_compounds:.1f}")
        
        # Save detailed results
        results_file = fetcher.save_detailed_results(results, "literature_fetch_results")
        
        print("=" * 60)
        print("✅ READY FOR AI SUMMARY GENERATION!")
        
    except KeyboardInterrupt:
        print("\n⚠️  Process interrupted by user")
    except Exception as e:
        logger.error(f"Fatal error in main process: {str(e)}")
        logger.error(traceback.format_exc())
    finally:
        fetcher.session.close()

if __name__ == "__main__":
    main()
