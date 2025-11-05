import requests
import time
import xml.etree.ElementTree as ET
from typing import List, Dict, Optional
import logging
from utils.logger import setup_logger

logger = setup_logger(__name__)

class PubMedClient:
    def __init__(self, email: str, tool: str = "supplement_research_app"):
        self.base_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
        self.email = email
        self.tool = tool
        self.rate_limit = 3  # requests per second for registered tools
        
    def search_studies(self, compound_name: str, max_results: int = 100) -> List[str]:
        """Search for studies related to a compound and return PMIDs"""
        
        # Build search query
        search_terms = [
            f'"{compound_name}"[Title/Abstract]',
            'clinical trial[Publication Type]',
            'randomized controlled trial[Publication Type]',
            'meta-analysis[Publication Type]',
            'systematic review[Publication Type]'
        ]
        
        query = f"({compound_name}[Title/Abstract]) AND ({' OR '.join(search_terms[1:])})"
        
        # Search parameters
        params = {
            'db': 'pubmed',
            'term': query,
            'retmax': max_results,
            'retmode': 'xml',
            'tool': self.tool,
            'email': self.email,
            'sort': 'relevance'
        }
        
        try:
            response = requests.get(f"{self.base_url}/esearch.fcgi", params=params)
            response.raise_for_status()
            
            # Parse XML response
            root = ET.fromstring(response.content)
            pmids = [id_elem.text for id_elem in root.findall('.//Id')]
            
            logger.info(f"Found {len(pmids)} studies for {compound_name}")
            return pmids
            
        except Exception as e:
            logger.error(f"Error searching PubMed for {compound_name}: {str(e)}")
            return []
    
    def fetch_study_details(self, pmids: List[str]) -> List[Dict]:
        """Fetch detailed information for a list of PMIDs"""
        
        if not pmids:
            return []
        
        # Join PMIDs for batch request
        pmid_string = ','.join(pmids)
        
        params = {
            'db': 'pubmed',
            'id': pmid_string,
            'retmode': 'xml',
            'rettype': 'abstract',
            'tool': self.tool,
            'email': self.email
        }
        
        try:
            response = requests.get(f"{self.base_url}/efetch.fcgi", params=params)
            response.raise_for_status()
            
            # Parse XML response
            root = ET.fromstring(response.content)
            studies = []
            
            for article in root.findall('.//PubmedArticle'):
                study_data = self._parse_article(article)
                if study_data:
                    studies.append(study_data)
            
            # Rate limiting
            time.sleep(1 / self.rate_limit)
            
            logger.info(f"Fetched details for {len(studies)} studies")
            return studies
            
        except Exception as e:
            logger.error(f"Error fetching study details: {str(e)}")
            return []
    
    def _parse_article(self, article_elem) -> Optional[Dict]:
        """Parse individual article XML into structured data"""
        
        try:
            medline_citation = article_elem.find('.//MedlineCitation')
            article_elem_inner = medline_citation.find('.//Article')
            
            # Extract PMID
            pmid = medline_citation.find('.//PMID').text
            
            # Extract title
            title_elem = article_elem_inner.find('.//ArticleTitle')
            title = title_elem.text if title_elem is not None else ""
            
            # Extract abstract
            abstract_elem = article_elem_inner.find('.//Abstract/AbstractText')
            abstract = abstract_elem.text if abstract_elem is not None else ""
            
            # Extract authors
            authors = []
            author_list = article_elem_inner.find('.//AuthorList')
            if author_list is not None:
                for author in author_list.findall('.//Author'):
                    last_name = author.find('.//LastName')
                    first_name = author.find('.//ForeName')
                    if last_name is not None and first_name is not None:
                        authors.append(f"{first_name.text} {last_name.text}")
            
            # Extract journal info
            journal_elem = article_elem_inner.find('.//Journal/Title')
            journal = journal_elem.text if journal_elem is not None else ""
            
            # Extract publication year
            pub_date = article_elem_inner.find('.//Journal/JournalIssue/PubDate/Year')
            pub_year = int(pub_date.text) if pub_date is not None else None
            
            # Extract DOI
            doi = None
            article_ids = article_elem.findall('.//ArticleId')
            for article_id in article_ids:
                if article_id.get('IdType') == 'doi':
                    doi = article_id.text
                    break
            
            return {
                'pmid': pmid,
                'title': title,
                'abstract': abstract,
                'authors': authors,
                'journal': journal,
                'publication_year': pub_year,
                'doi': doi
            }
            
        except Exception as e:
            logger.error(f"Error parsing article: {str(e)}")
            return None
