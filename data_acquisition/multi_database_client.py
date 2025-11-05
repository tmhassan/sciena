#!/usr/bin/env python3
"""
Ultimate Multi-Database Literature Search Client
Searches across 6+ scientific databases with intelligent fallback strategies
"""

import requests
import json
import time
import re
import hashlib
from typing import List, Dict, Optional, Set, Tuple
from datetime import datetime, timedelta
from urllib.parse import quote
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from concurrent.futures import ThreadPoolExecutor, as_completed
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class StudyResult:
    """Standardized study result across all databases"""
    title: str
    abstract: str
    authors: List[str]
    journal: str
    publication_year: Optional[int]
    pmid: Optional[str] = None
    doi: Optional[str] = None
    source_database: str = ""
    study_type: str = "Unknown"
    url: Optional[str] = None
    citations_count: Optional[int] = None
    
    def __post_init__(self):
        """Clean and validate data after initialization"""
        self.title = self._clean_text(self.title)
        self.abstract = self._clean_text(self.abstract)
        self.journal = self._clean_text(self.journal)
        
    def _clean_text(self, text: str) -> str:
        """Clean text by removing HTML tags and extra whitespace"""
        if not text:
            return ""
        # Remove HTML tags
        text = re.sub(r'<[^>]+>', '', str(text))
        # Normalize whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        return text
    
    def get_unique_id(self) -> str:
        """Generate unique identifier for deduplication"""
        if self.pmid:
            return f"pmid_{self.pmid}"
        elif self.doi:
            return f"doi_{self.doi}"
        else:
            # Use title hash as fallback
            title_hash = hashlib.md5(self.title.lower().encode()).hexdigest()[:12]
            return f"title_{title_hash}"

class CompoundSynonymManager:
    """Manages compound synonyms and search term variations"""
    
    def __init__(self):
        self.synonym_db = self._load_comprehensive_synonyms()
        
    def _load_comprehensive_synonyms(self) -> Dict[str, List[str]]:
        """Load comprehensive compound synonym database"""
        return {
            # SARMs
            'RAD-140': ['Testolone', 'RAD140', 'RAD 140', 'Vosilasarm'],
            'LGD-4033': ['Ligandrol', 'LGD4033', 'LGD 4033', 'VK5211'],
            'MK-2866': ['Ostarine', 'Enobosarm', 'GTx-024', 'MK2866'],
            'S-4': ['Andarine', 'S4', 'GTx-007'],
            'GW-501516': ['Cardarine', 'GW501516', 'GW 501516', 'Endurobol'],
            'MK-677': ['Ibutamoren', 'Nutrobal', 'MK677', 'L-163191'],
            'SR9009': ['Stenabolic', 'SR-9009', 'SR 9009'],
            'YK-11': ['YK11', 'YK 11'],
            'S-23': ['S23', 'S 23'],
            'LGD-3303': ['LGD3303', 'LGD 3303'],
            
            # Peptides
            'BPC-157': ['Body Protection Compound', 'Pentadecapeptide BPC 157', 'BPC157', 'BPC 157'],
            'TB-500': ['Thymosin Beta-4', 'Tβ4', 'TB500', 'Thymosin β4'],
            'CJC-1295': ['CJC1295', 'CJC 1295', 'Modified GRF 1-29'],
            'Ipamorelin': ['NNC 26-0161', 'Ipamorelin acetate'],
            'GHRP-6': ['Growth Hormone Releasing Peptide-6', 'GHRP6'],
            'GHRP-2': ['Growth Hormone Releasing Peptide-2', 'GHRP2'],
            'Sermorelin': ['GRF 1-29', 'GHRH 1-29', 'Growth Hormone Releasing Hormone'],
            'PT-141': ['Bremelanotide', 'PT141', 'PT 141'],
            'Melanotan II': ['MT-II', 'MT2', 'Melanotan 2'],
            'Hexarelin': ['Examorelin', 'L-692429'],
            'AOD-9604': ['AOD9604', 'hGH Fragment 176-191'],
            'MGF': ['Mechano Growth Factor', 'IGF-1Ec'],
            'PEG-MGF': ['Pegylated Mechano Growth Factor'],
            'Follistatin': ['FST', 'Activin-binding Protein'],
            'ACE-031': ['Myostatin Inhibitor', 'ACVR2B'],
            'Epitalon': ['Epithalon', 'Alanyl-glutamyl-aspartyl-glycine'],
            'GHK-Cu': ['Copper Peptide', 'Gly-His-Lys-Cu', 'GHK Copper'],
            
            # Nootropics - Chemical to Common Name
            '2-oxo-1-pyrrolidine acetamide': ['Piracetam', 'Nootropil'],
            '1-(4-methoxybenzoyl)-2-pyrrolidinone': ['Aniracetam', 'Draganon'],
            '4-hydroxy-2-oxopyrrolidine-N-acetamide': ['Oxiracetam', 'Neuractiv'],
            '2-[(diphenylmethyl)sulfinyl]acetamide': ['Modafinil', 'Provigil'],
            'N-[2-(diisopropylamino)ethyl]-2-oxo-1-pyrrolidineacetamide': ['Pramiracetam'],
            '4-phenyl-2-oxopyrrolidine-1-acetamide': ['Phenylpiracetam', 'Carphedon'],
            '2-benzhydrylsulfinyl-N-hydroxyacetamide': ['Adrafinil', 'Olmifon'],
            'bisfluoromodafinil': ['Flmodafinil', 'CRL-40,940'],
            '1-benzoyl-4-propanoylpiperazine': ['Sunifiram', 'DM-235'],
            'L-Alpha glycerylphosphorylcholine': ['Alpha-GPC', 'Choline Alfoscerate'],
            'Cytidine 5-diphosphocholine': ['CDP-Choline', 'Citicoline'],
            '2-(Dimethylamino)ethanol': ['DMAE', 'Dimethylaminoethanol'],
            '4-amino-3-phenylbutyric acid': ['Phenibut', 'β-phenyl-GABA'],
            'Nicotinoyl-GABA': ['Picamilon', 'Pikamilon'],
            
            # Common supplements
            'Creatine Monohydrate': ['Creatine', 'N-methylguanidino acetic acid'],
            'Beta-Alanine': ['β-Alanine', '3-aminopropanoic acid'],
            'L-Citrulline': ['Citrulline', '2-Amino-5-(carbamoylamino)pentanoic acid'],
            'Ashwagandha': ['Withania somnifera', 'Indian Winter Cherry'],
            'Rhodiola Rosea': ['Golden Root', 'Arctic Root', 'Rose Root'],
            'Bacopa Monnieri': ['Brahmi', 'Water Hyssop'],
            'Lion\'s Mane': ['Hericium erinaceus', 'Bearded Tooth Mushroom'],
        }
    
    def get_search_variations(self, compound_name: str) -> List[str]:
        """Generate comprehensive search term variations"""
        variations = [compound_name.strip()]
        
        # Add known synonyms
        if compound_name in self.synonym_db:
            variations.extend(self.synonym_db[compound_name])
        
        # Generate algorithmic variations
        variations.extend(self._generate_algorithmic_variations(compound_name))
        
        # Clean and deduplicate
        variations = list(set([v.strip() for v in variations if v.strip()]))
        
        # Sort by length (shorter terms often work better)
        variations.sort(key=len)
        
        return variations[:8]  # Limit to avoid too many API calls
    
    def _generate_algorithmic_variations(self, name: str) -> List[str]:
        """Generate variations using algorithmic transformations"""
        variations = []
        
        # Remove/add hyphens and spaces
        if '-' in name:
            variations.append(name.replace('-', ' '))
            variations.append(name.replace('-', ''))
        
        # Remove parentheses content
        no_parens = re.sub(r'\s*\([^)]*\)\s*', ' ', name).strip()
        if no_parens != name:
            variations.append(no_parens)
        
        # Extract numbers and letters separately (for codes like RAD-140)
        number_match = re.search(r'([A-Za-z]+)[- ]?(\d+)', name)
        if number_match:
            letters, numbers = number_match.groups()
            variations.extend([
                f"{letters}-{numbers}",
                f"{letters} {numbers}",
                f"{letters}{numbers}"
            ])
        
        # For chemical names, try first word only
        words = name.split()
        if len(words) > 2 and len(words[0]) > 4:
            variations.append(words[0])
        
        return variations

class DatabaseClient:
    """Base class for database-specific clients"""
    
    def __init__(self, name: str):
        self.name = name
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })
        self.rate_limit_delay = 0.5
        
    def search(self, query: str, max_results: int = 25) -> List[StudyResult]:
        """Search this database - to be implemented by subclasses"""
        raise NotImplementedError
        
    def _rate_limit(self):
        """Implement rate limiting"""
        time.sleep(self.rate_limit_delay)

class EnhancedPubMedClient(DatabaseClient):
    """Enhanced PubMed client with comprehensive search strategies"""
    
    def __init__(self, email: str):
        super().__init__("PubMed")
        self.email = email
        self.base_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
        self.rate_limit_delay = 0.34  # 3 requests per second limit
        
    def search(self, query: str, max_results: int = 25) -> List[StudyResult]:
        """Enhanced PubMed search with multiple strategies"""
        try:
            # Try different search strategies
            search_strategies = [
                self._search_title_abstract(query, max_results),
                self._search_mesh_terms(query, max_results // 2),
                self._search_broad_terms(query, max_results // 3)
            ]
            
            all_pmids = set()
            for pmids in search_strategies:
                all_pmids.update(pmids)
                if len(all_pmids) >= max_results:
                    break
            
            if not all_pmids:
                return []
            
            # Fetch details for found PMIDs
            return self._fetch_study_details(list(all_pmids)[:max_results])
            
        except Exception as e:
            logger.error(f"PubMed search failed for '{query}': {e}")
            return []
    
    def _search_title_abstract(self, query: str, max_results: int) -> List[str]:
        """Search in title and abstract fields"""
        search_query = f'"{query}"[Title/Abstract] AND (clinical trial[pt] OR randomized controlled trial[pt] OR systematic review[pt] OR meta analysis[pt] OR controlled clinical trial[pt] OR review[pt])'
        return self._execute_search(search_query, max_results)
    
    def _search_mesh_terms(self, query: str, max_results: int) -> List[str]:
        """Search using MeSH terms"""
        search_query = f'"{query}"[MeSH Terms] OR "{query}"[Substance Name]'
        return self._execute_search(search_query, max_results)
    
    def _search_broad_terms(self, query: str, max_results: int) -> List[str]:
        """Broad search across all fields"""
        search_query = f'"{query}"[All Fields]'
        return self._execute_search(search_query, max_results)
    
    def _execute_search(self, search_query: str, max_results: int) -> List[str]:
        """Execute a single search query"""
        params = {
            'db': 'pubmed',
            'term': search_query,
            'retmax': max_results,
            'retmode': 'xml',
            'tool': 'supplement_research_app',
            'email': self.email,
            'sort': 'relevance'
        }
        
        try:
            response = self.session.get(f"{self.base_url}/esearch.fcgi", params=params, timeout=10)
            response.raise_for_status()
            
            root = ET.fromstring(response.content)
            pmids = [id_elem.text for id_elem in root.findall('.//Id')]
            
            self._rate_limit()
            return pmids
            
        except Exception as e:
            logger.warning(f"PubMed search query failed: {e}")
            return []
    
    def _fetch_study_details(self, pmids: List[str]) -> List[StudyResult]:
        """Fetch detailed information for PMIDs"""
        if not pmids:
            return []
        
        # Process in batches to avoid URL length limits
        batch_size = 50
        all_studies = []
        
        for i in range(0, len(pmids), batch_size):
            batch_pmids = pmids[i:i + batch_size]
            batch_studies = self._fetch_batch_details(batch_pmids)
            all_studies.extend(batch_studies)
            self._rate_limit()
        
        return all_studies
    
    def _fetch_batch_details(self, pmids: List[str]) -> List[StudyResult]:
        """Fetch details for a batch of PMIDs"""
        pmid_string = ','.join(pmids)
        
        params = {
            'db': 'pubmed',
            'id': pmid_string,
            'retmode': 'xml',
            'rettype': 'abstract',
            'tool': 'supplement_research_app',
            'email': self.email
        }
        
        try:
            response = self.session.get(f"{self.base_url}/efetch.fcgi", params=params, timeout=15)
            response.raise_for_status()
            
            root = ET.fromstring(response.content)
            studies = []
            
            for article in root.findall('.//PubmedArticle'):
                study = self._parse_pubmed_article(article)
                if study:
                    studies.append(study)
            
            return studies
            
        except Exception as e:
            logger.error(f"Error fetching PubMed batch details: {e}")
            return []
    
    def _parse_pubmed_article(self, article_elem) -> Optional[StudyResult]:
        """Parse individual PubMed article"""
        try:
            medline_citation = article_elem.find('.//MedlineCitation')
            article = medline_citation.find('.//Article')
            
            # Extract PMID
            pmid = medline_citation.find('.//PMID').text
            
            # Extract title
            title_elem = article.find('.//ArticleTitle')
            title = title_elem.text if title_elem is not None else ""
            
            # Extract abstract
            abstract_parts = []
            for abstract_elem in article.findall('.//Abstract/AbstractText'):
                label = abstract_elem.get('Label', '')
                text = abstract_elem.text or ""
                if label:
                    abstract_parts.append(f"{label}: {text}")
                else:
                    abstract_parts.append(text)
            abstract = " ".join(abstract_parts)
            
            # Extract authors
            authors = []
            author_list = article.find('.//AuthorList')
            if author_list is not None:
                for author in author_list.findall('.//Author'):
                    last_name = author.find('.//LastName')
                    fore_name = author.find('.//ForeName')
                    if last_name is not None and fore_name is not None:
                        authors.append(f"{fore_name.text} {last_name.text}")
            
            # Extract journal
            journal_elem = article.find('.//Journal/Title')
            journal = journal_elem.text if journal_elem is not None else ""
            
            # Extract publication year
            pub_date = article.find('.//Journal/JournalIssue/PubDate/Year')
            if pub_date is None:
                pub_date = article.find('.//Journal/JournalIssue/PubDate/MedlineDate')
            
            pub_year = None
            if pub_date is not None:
                year_text = pub_date.text
                year_match = re.search(r'(\d{4})', year_text)
                if year_match:
                    pub_year = int(year_match.group(1))
            
            # Extract DOI
            doi = None
            for article_id in article_elem.findall('.//ArticleId'):
                if article_id.get('IdType') == 'doi':
                    doi = article_id.text
                    break
            
            # Determine study type
            study_type = self._determine_study_type(title, abstract)
            
            return StudyResult(
                title=title,
                abstract=abstract,
                authors=authors,
                journal=journal,
                publication_year=pub_year,
                pmid=pmid,
                doi=doi,
                source_database="PubMed",
                study_type=study_type,
                url=f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/"
            )
            
        except Exception as e:
            logger.error(f"Error parsing PubMed article: {e}")
            return None
    
    def _determine_study_type(self, title: str, abstract: str) -> str:
        """Determine study type from title and abstract"""
        text = f"{title} {abstract}".lower()
        
        if any(term in text for term in ['randomized controlled trial', 'rct', 'double-blind', 'placebo-controlled']):
            return 'Randomized Controlled Trial'
        elif any(term in text for term in ['meta-analysis', 'systematic review']):
            return 'Meta-Analysis'
        elif any(term in text for term in ['cohort study', 'longitudinal']):
            return 'Cohort Study'
        elif any(term in text for term in ['case-control', 'case control']):
            return 'Case-Control Study'
        elif any(term in text for term in ['review', 'overview']):
            return 'Review'
        elif any(term in text for term in ['in vitro', 'cell culture']):
            return 'In Vitro Study'
        elif any(term in text for term in ['animal', 'rat', 'mouse', 'rodent']):
            return 'Animal Study'
        else:
            return 'Observational Study'

class EuropePMCClient(DatabaseClient):
    """Europe PMC database client"""
    
    def __init__(self):
        super().__init__("Europe PMC")
        self.base_url = "https://www.ebi.ac.uk/europepmc/webservices/rest"
        
    def search(self, query: str, max_results: int = 25) -> List[StudyResult]:
        """Search Europe PMC database"""
        try:
            params = {
                'query': f'"{query}" AND (SRC:MED OR SRC:PMC)',
                'format': 'json',
                'pageSize': min(max_results, 100),
                'resultType': 'core',
                'synonym': 'true',
                'sort': 'CITED DESC'
            }
            
            response = self.session.get(f"{self.base_url}/search", params=params, timeout=15)
            response.raise_for_status()
            
            data = response.json()
            studies = []
            
            for result in data.get('resultList', {}).get('result', []):
                study = self._parse_europepmc_result(result)
                if study:
                    studies.append(study)
            
            self._rate_limit()
            return studies
            
        except Exception as e:
            logger.error(f"Europe PMC search failed for '{query}': {e}")
            return []
    
    def _parse_europepmc_result(self, result: dict) -> Optional[StudyResult]:
        """Parse Europe PMC search result"""
        try:
            return StudyResult(
                title=result.get('title', ''),
                abstract=result.get('abstractText', ''),
                authors=[result.get('authorString', '')],
                journal=result.get('journalTitle', ''),
                publication_year=result.get('pubYear'),
                pmid=result.get('pmid'),
                doi=result.get('doi'),
                source_database="Europe PMC",
                citations_count=result.get('citedByCount'),
                url=f"https://europepmc.org/article/MED/{result.get('pmid', '')}" if result.get('pmid') else None
            )
        except Exception as e:
            logger.error(f"Error parsing Europe PMC result: {e}")
            return None

class SemanticScholarClient(DatabaseClient):
    """Semantic Scholar API client"""
    
    def __init__(self, api_key: Optional[str] = None):
        super().__init__("Semantic Scholar")
        self.base_url = "https://api.semanticscholar.org/graph/v1"
        self.api_key = api_key
        if api_key:
            self.session.headers['x-api-key'] = api_key
        
    def search(self, query: str, max_results: int = 25) -> List[StudyResult]:
        """Search Semantic Scholar"""
        try:
            params = {
                'query': query,
                'limit': min(max_results, 100),
                'fields': 'title,abstract,authors,journal,year,citationCount,url,externalIds'
            }
            
            response = self.session.get(f"{self.base_url}/paper/search", params=params, timeout=15)
            response.raise_for_status()
            
            data = response.json()
            studies = []
            
            for paper in data.get('data', []):
                study = self._parse_semantic_scholar_result(paper)
                if study:
                    studies.append(study)
            
            self._rate_limit()
            return studies
            
        except Exception as e:
            logger.error(f"Semantic Scholar search failed for '{query}': {e}")
            return []
    
    def _parse_semantic_scholar_result(self, paper: dict) -> Optional[StudyResult]:
        """Parse Semantic Scholar search result"""
        try:
            authors = [author.get('name', '') for author in paper.get('authors', [])]
            
            # Extract PMID and DOI from external IDs
            external_ids = paper.get('externalIds', {})
            pmid = external_ids.get('PubMed')
            doi = external_ids.get('DOI')
            
            return StudyResult(
                title=paper.get('title', ''),
                abstract=paper.get('abstract', ''),
                authors=authors,
                journal=paper.get('journal', {}).get('name', ''),
                publication_year=paper.get('year'),
                pmid=pmid,
                doi=doi,
                source_database="Semantic Scholar",
                citations_count=paper.get('citationCount'),
                url=paper.get('url')
            )
        except Exception as e:
            logger.error(f"Error parsing Semantic Scholar result: {e}")
            return None

class CrossRefClient(DatabaseClient):
    """CrossRef database client"""
    
    def __init__(self):
        super().__init__("CrossRef")
        self.base_url = "https://api.crossref.org/works"
        
    def search(self, query: str, max_results: int = 25) -> List[StudyResult]:
        """Search CrossRef database"""
        try:
            params = {
                'query': query,
                'rows': min(max_results, 100),
                'select': 'DOI,title,author,published,container-title,abstract,subject'
            }
            
            response = self.session.get(self.base_url, params=params, timeout=15)
            response.raise_for_status()
            
            data = response.json()
            studies = []
            
            for item in data.get('message', {}).get('items', []):
                study = self._parse_crossref_result(item)
                if study:
                    studies.append(study)
            
            self._rate_limit()
            return studies
            
        except Exception as e:
            logger.error(f"CrossRef search failed for '{query}': {e}")
            return []
    
    def _parse_crossref_result(self, item: dict) -> Optional[StudyResult]:
        """Parse CrossRef search result"""
        try:
            # Extract authors
            authors = []
            for author in item.get('author', []):
                given = author.get('given', '')
                family = author.get('family', '')
                if given and family:
                    authors.append(f"{given} {family}")
            
            # Extract publication year
            pub_date = item.get('published', {}).get('date-parts', [[None]])[0]
            year = pub_date[0] if pub_date and len(pub_date) > 0 else None
            
            return StudyResult(
                title=' '.join(item.get('title', [])),
                abstract=item.get('abstract', ''),
                authors=authors,
                journal=' '.join(item.get('container-title', [])),
                publication_year=year,
                doi=item.get('DOI'),
                source_database="CrossRef",
                url=f"https://doi.org/{item.get('DOI')}" if item.get('DOI') else None
            )
        except Exception as e:
            logger.error(f"Error parsing CrossRef result: {e}")
            return None

class ClinicalTrialsClient(DatabaseClient):
    """ClinicalTrials.gov client"""
    
    def __init__(self):
        super().__init__("ClinicalTrials.gov")
        self.base_url = "https://clinicaltrials.gov/api/v2/studies"
        
    def search(self, query: str, max_results: int = 25) -> List[StudyResult]:
        """Search ClinicalTrials.gov"""
        try:
            params = {
                'query.term': query,
                'pageSize': min(max_results, 100),
                'format': 'json'
            }
            
            response = self.session.get(self.base_url, params=params, timeout=15)
            response.raise_for_status()
            
            data = response.json()
            studies = []
            
            for study in data.get('studies', []):
                parsed_study = self._parse_clinical_trial(study)
                if parsed_study:
                    studies.append(parsed_study)
            
            self._rate_limit()
            return studies
            
        except Exception as e:
            logger.error(f"ClinicalTrials.gov search failed for '{query}': {e}")
            return []
    
    def _parse_clinical_trial(self, study: dict) -> Optional[StudyResult]:
        """Parse clinical trial data"""
        try:
            protocol_section = study.get('protocolSection', {})
            identification_module = protocol_section.get('identificationModule', {})
            description_module = protocol_section.get('descriptionModule', {})
            
            nct_id = identification_module.get('nctId', '')
            title = identification_module.get('officialTitle', '') or identification_module.get('briefTitle', '')
            abstract = description_module.get('briefSummary', {}).get('textMd', '')
            
            return StudyResult(
                title=title,
                abstract=abstract,
                authors=[],
                journal='ClinicalTrials.gov',
                publication_year=None,
                source_database="ClinicalTrials.gov",
                study_type="Clinical Trial",
                url=f"https://clinicaltrials.gov/study/{nct_id}" if nct_id else None
            )
        except Exception as e:
            logger.error(f"Error parsing clinical trial: {e}")
            return None

class BioRxivClient(DatabaseClient):
    """bioRxiv and medRxiv preprint server client"""
    
    def __init__(self):
        super().__init__("bioRxiv/medRxiv")
        self.base_url = "https://api.biorxiv.org/details"
        
    def search(self, query: str, max_results: int = 25) -> List[StudyResult]:
        """Search bioRxiv and medRxiv"""
        try:
            # bioRxiv/medRxiv API is limited, so we'll search recent papers
            end_date = datetime.now().strftime('%Y-%m-%d')
            start_date = (datetime.now() - timedelta(days=365)).strftime('%Y-%m-%d')
            
            studies = []
            
            # Search both servers
            for server in ['biorxiv', 'medrxiv']:
                url = f"{self.base_url}/{server}/{start_date}/{end_date}"
                
                try:
                    response = self.session.get(url, timeout=15)
                    response.raise_for_status()
                    
                    data = response.json()
                    
                    for paper in data.get('collection', []):
                        if query.lower() in paper.get('title', '').lower() or query.lower() in paper.get('abstract', '').lower():
                            study = self._parse_biorxiv_result(paper, server)
                            if study:
                                studies.append(study)
                            
                            if len(studies) >= max_results:
                                break
                    
                    if len(studies) >= max_results:
                        break
                        
                except Exception as e:
                    logger.warning(f"Error searching {server}: {e}")
                    continue
                
                self._rate_limit()
            
            return studies[:max_results]
            
        except Exception as e:
            logger.error(f"bioRxiv/medRxiv search failed for '{query}': {e}")
            return []
    
    def _parse_biorxiv_result(self, paper: dict, server: str) -> Optional[StudyResult]:
        """Parse bioRxiv/medRxiv result"""
        try:
            return StudyResult(
                title=paper.get('title', ''),
                abstract=paper.get('abstract', ''),
                authors=paper.get('authors', '').split(';') if paper.get('authors') else [],
                journal=f"{server.capitalize()} Preprint",
                publication_year=int(paper.get('date', '').split('-')[0]) if paper.get('date') else None,
                doi=paper.get('doi'),
                source_database=f"{server.capitalize()}",
                study_type="Preprint",
                url=f"https://doi.org/{paper.get('doi')}" if paper.get('doi') else None
            )
        except Exception as e:
            logger.error(f"Error parsing {server} result: {e}")
            return None

class MultiDatabaseSearchEngine:
    """Main orchestrator for multi-database literature search"""
    
    def __init__(self, pubmed_email: str, semantic_scholar_api_key: Optional[str] = None):
        self.synonym_manager = CompoundSynonymManager()
        
        # Initialize all database clients
        self.clients = {
            'pubmed': EnhancedPubMedClient(pubmed_email),
            'europepmc': EuropePMCClient(),
            'semantic_scholar': SemanticScholarClient(semantic_scholar_api_key),
            'crossref': CrossRefClient(),
            'clinical_trials': ClinicalTrialsClient(),
            'biorxiv': BioRxivClient()
        }
        
        # Database priority (higher priority searched first)
        self.database_priority = [
            'pubmed',
            'europepmc', 
            'semantic_scholar',
            'crossref',
            'clinical_trials',
            'biorxiv'
        ]
        
    def search_comprehensive(self, compound_name: str, max_results: int = 50, 
                           min_per_database: int = 5) -> List[StudyResult]:
        """Comprehensive search across all databases"""
        logger.info(f"Starting comprehensive search for: {compound_name}")
        
        # Get search term variations
        search_terms = self.synonym_manager.get_search_variations(compound_name)
        logger.info(f"Search variations: {search_terms}")
        
        all_studies = []
        
        # Search each database with multiple terms
        for db_name in self.database_priority:
            db_client = self.clients[db_name]
            db_studies = []
            
            for term in search_terms:
                try:
                    logger.info(f"Searching {db_name} for: {term}")
                    term_studies = db_client.search(term, max_results=min_per_database)
                    db_studies.extend(term_studies)
                    
                    # Stop if we have enough results from this database
                    if len(db_studies) >= min_per_database * 2:
                        break
                        
                except Exception as e:
                    logger.error(f"Error searching {db_name} for {term}: {e}")
                    continue
            
            if db_studies:
                logger.info(f"Found {len(db_studies)} studies from {db_name}")
                all_studies.extend(db_studies)
            
            # Stop if we have enough total results
            if len(all_studies) >= max_results:
                break
        
        # Deduplicate and rank results
        deduplicated_studies = self._deduplicate_studies(all_studies)
        ranked_studies = self._rank_studies(deduplicated_studies, compound_name)
        
        logger.info(f"Final results: {len(ranked_studies)} unique studies from {len(all_studies)} total")
        
        return ranked_studies[:max_results]
    
    def search_parallel(self, compound_name: str, max_results: int = 50) -> List[StudyResult]:
        """Parallel search across multiple databases for speed"""
        search_terms = self.synonym_manager.get_search_variations(compound_name)
        
        all_studies = []
        
        # Create search tasks
        search_tasks = []
        for db_name, client in self.clients.items():
            for term in search_terms[:3]:  # Limit terms for parallel execution
                search_tasks.append((db_name, client, term))
        
        # Execute searches in parallel
        with ThreadPoolExecutor(max_workers=6) as executor:
            future_to_search = {
                executor.submit(self._search_single, client, term): (db_name, term)
                for db_name, client, term in search_tasks
            }
            
            for future in as_completed(future_to_search, timeout=60):
                db_name, term = future_to_search[future]
                try:
                    studies = future.result()
                    if studies:
                        logger.info(f"Found {len(studies)} studies from {db_name} for {term}")
                        all_studies.extend(studies)
                except Exception as e:
                    logger.error(f"Search failed for {db_name}/{term}: {e}")
        
        # Deduplicate and rank
        deduplicated_studies = self._deduplicate_studies(all_studies)
        ranked_studies = self._rank_studies(deduplicated_studies, compound_name)
        
        return ranked_studies[:max_results]
    
    def _search_single(self, client: DatabaseClient, term: str) -> List[StudyResult]:
        """Execute a single search task"""
        try:
            return client.search(term, max_results=10)
        except Exception as e:
            logger.error(f"Single search failed for {client.name}/{term}: {e}")
            return []
    
    def _deduplicate_studies(self, studies: List[StudyResult]) -> List[StudyResult]:
        """Remove duplicate studies based on PMID, DOI, or title similarity"""
        seen_ids = set()
        unique_studies = []
        title_hashes = set()
        
        for study in studies:
            unique_id = study.get_unique_id()
            
            # Skip if we've seen this exact ID
            if unique_id in seen_ids:
                continue
            
            # For title-based deduplication, check similarity
            if unique_id.startswith('title_'):
                title_hash = hashlib.md5(study.title.lower().encode()).hexdigest()
                if title_hash in title_hashes:
                    continue
                title_hashes.add(title_hash)
            
            seen_ids.add(unique_id)
            unique_studies.append(study)
        
        return unique_studies
    
    def _rank_studies(self, studies: List[StudyResult], compound_name: str) -> List[StudyResult]:
        """Rank studies by relevance and quality"""
        def calculate_relevance_score(study: StudyResult) -> float:
            score = 0.0
            
            # Title relevance (higher weight)
            if compound_name.lower() in study.title.lower():
                score += 10.0
            
            # Abstract relevance
            if compound_name.lower() in study.abstract.lower():
                score += 5.0
            
            # Study type preference
            study_type_scores = {
                'Randomized Controlled Trial': 8.0,
                'Meta-Analysis': 7.0,
                'Systematic Review': 6.0,
                'Cohort Study': 5.0,
                'Case-Control Study': 4.0,
                'Clinical Trial': 6.0,
                'Review': 3.0,
                'Observational Study': 2.0,
                'Animal Study': 1.0,
                'In Vitro Study': 0.5
            }
            score += study_type_scores.get(study.study_type, 1.0)
            
            # Database preference
            db_scores = {
                'PubMed': 5.0,
                'Europe PMC': 4.0,
                'Semantic Scholar': 3.0,
                'ClinicalTrials.gov': 4.0,
                'CrossRef': 2.0,
                'bioRxiv': 1.0,
                'medRxiv': 1.0
            }
            score += db_scores.get(study.source_database, 1.0)
            
            # Citation count (if available)
            if study.citations_count:
                score += min(study.citations_count * 0.1, 5.0)
            
            # Recent publication bonus
            if study.publication_year and study.publication_year >= 2020:
                score += 2.0
            elif study.publication_year and study.publication_year >= 2015:
                score += 1.0
            
            return score
        
        # Sort by relevance score (descending)
        studies.sort(key=calculate_relevance_score, reverse=True)
        return studies
    
    def get_search_statistics(self, compound_name: str) -> Dict[str, int]:
        """Get search statistics across all databases"""
        search_terms = self.synonym_manager.get_search_variations(compound_name)
        stats = {}
        
        for db_name, client in self.clients.items():
            try:
                results = client.search(search_terms[0], max_results=1)
                stats[db_name] = len(results)
            except:
                stats[db_name] = 0
        
        return stats
