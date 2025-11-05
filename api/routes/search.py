from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_, desc, text
from typing import List, Optional, Dict, Any
import json
from datetime import datetime

from database.database import get_db
from database.models import Compound, Study, CompoundSummary

router = APIRouter()

# Pydantic response models
from pydantic import BaseModel

class SearchResult(BaseModel):
    id: str
    name: str
    category: str
    synonyms: List[str] = []
    safety_rating: Optional[str] = None
    legal_status: Optional[str] = None
    study_count: int = 0
    relevance_score: float = 0.0
    match_type: str  # 'name', 'synonym', 'category', 'content'

    class Config:
        from_attributes = True

class SearchSuggestion(BaseModel):
    query: str
    type: str  # 'compound', 'category', 'study'
    count: int

class SearchStats(BaseModel):
    total_results: int
    categories: Dict[str, int]
    safety_ratings: Dict[str, int]
    legal_statuses: Dict[str, int]

class ComprehensiveSearchResponse(BaseModel):
    results: List[SearchResult]
    suggestions: List[SearchSuggestion]
    stats: SearchStats
    query: str
    execution_time_ms: float

# Helper functions
def parse_json_field(field_value, default=None):
    """Safely parse JSON fields from database"""
    if field_value is None:
        return default or []
    if isinstance(field_value, str):
        try:
            return json.loads(field_value)
        except json.JSONDecodeError:
            return default or []
    return field_value

def calculate_relevance_score(compound, query: str) -> tuple[float, str]:
    """Calculate relevance score for search results"""
    query_lower = query.lower()
    name_lower = compound.name.lower()
    
    # Exact match gets highest score
    if query_lower == name_lower:
        return 100.0, 'name'
    
    # Starts with query gets high score
    if name_lower.startswith(query_lower):
        return 90.0, 'name'
    
    # Contains query in name
    if query_lower in name_lower:
        return 80.0, 'name'
    
    # Check synonyms
    synonyms = parse_json_field(compound.common_names, [])
    for synonym in synonyms:
        synonym_lower = synonym.lower()
        if query_lower == synonym_lower:
            return 85.0, 'synonym'
        if synonym_lower.startswith(query_lower):
            return 75.0, 'synonym'
        if query_lower in synonym_lower:
            return 65.0, 'synonym'
    
    # Check category
    if compound.category and query_lower in compound.category.lower():
        return 50.0, 'category'
    
    # Default content match
    return 40.0, 'content'

# API Endpoints
@router.get("/search", response_model=List[SearchResult])
async def search_compounds(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(20, ge=1, le=100, description="Maximum results"),
    category: Optional[str] = Query(None, description="Filter by category"),
    safety_rating: Optional[str] = Query(None, description="Filter by safety rating"),
    legal_status: Optional[str] = Query(None, description="Filter by legal status"),
    min_studies: Optional[int] = Query(None, description="Minimum number of studies"),
    db: Session = Depends(get_db)
):
    """
    Fast and intelligent compound search with relevance ranking.
    Optimized for frontend search functionality.
    """
    try:
        query_term = q.strip()
        if not query_term:
            return []
        
        # Build base query with study count
        base_query = db.query(
            Compound,
            func.count(Study.id).label('study_count')
        ).outerjoin(Study, Compound.id == Study.compound_id).group_by(Compound.id)
        
        # Apply text search filters
        search_term = f"%{query_term}%"
        text_filters = or_(
            Compound.name.ilike(search_term),
            Compound.common_names.ilike(search_term),
            Compound.category.ilike(search_term)
        )
        
        base_query = base_query.filter(text_filters)
        
        # Apply additional filters
        if category:
            categories = [c.strip() for c in category.split(',')]
            base_query = base_query.filter(Compound.category.in_(categories))
        
        if safety_rating:
            ratings = [r.strip() for r in safety_rating.split(',')]
            base_query = base_query.filter(Compound.safety_rating.in_(ratings))
        
        if legal_status:
            statuses = [s.strip() for s in legal_status.split(',')]
            base_query = base_query.filter(Compound.legal_status.in_(statuses))
        
        if min_studies is not None:
            base_query = base_query.having(func.count(Study.id) >= min_studies)
        
        # Execute query
        results = base_query.limit(limit * 2).all()  # Get extra results for relevance sorting
        
        # Calculate relevance scores and create response objects
        search_results = []
        for compound, study_count in results:
            relevance_score, match_type = calculate_relevance_score(compound, query_term)
            
            search_results.append(SearchResult(
                id=str(compound.id),
                name=compound.name,
                category=compound.category or 'supplement',
                synonyms=parse_json_field(compound.common_names, []),
                safety_rating=compound.safety_rating,
                legal_status=compound.legal_status,
                study_count=study_count or 0,
                relevance_score=relevance_score,
                match_type=match_type
            ))
        
        # Sort by relevance score and study count
        search_results.sort(key=lambda x: (x.relevance_score, x.study_count), reverse=True)
        
        return search_results[:limit]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search error: {str(e)}")

@router.get("/search/comprehensive", response_model=ComprehensiveSearchResponse)
async def comprehensive_search(
    q: str = Query(..., min_length=2, description="Search query"),
    limit: int = Query(20, ge=1, le=100, description="Maximum results per type"),
    db: Session = Depends(get_db)
):
    """
    Comprehensive search across compounds with analytics and suggestions.
    Perfect for advanced search interfaces.
    """
    start_time = datetime.now()
    
    try:
        query_term = q.strip()
        
        # Main search results
        search_term = f"%{query_term}%"
        compounds_query = db.query(
            Compound,
            func.count(Study.id).label('study_count')
        ).outerjoin(Study, Compound.id == Study.compound_id).group_by(Compound.id)
        
        compounds_query = compounds_query.filter(
            or_(
                Compound.name.ilike(search_term),
                Compound.common_names.ilike(search_term),
                Compound.category.ilike(search_term)
            )
        )
        
        results = compounds_query.limit(limit).all()
        
        # Build search results with relevance
        search_results = []
        categories = {}
        safety_ratings = {}
        legal_statuses = {}
        
        for compound, study_count in results:
            relevance_score, match_type = calculate_relevance_score(compound, query_term)
            
            search_results.append(SearchResult(
                id=str(compound.id),
                name=compound.name,
                category=compound.category or 'supplement',
                synonyms=parse_json_field(compound.common_names, []),
                safety_rating=compound.safety_rating,
                legal_status=compound.legal_status,
                study_count=study_count or 0,
                relevance_score=relevance_score,
                match_type=match_type
            ))
            
            # Collect stats
            category = compound.category or 'supplement'
            categories[category] = categories.get(category, 0) + 1
            
            if compound.safety_rating:
                safety_ratings[compound.safety_rating] = safety_ratings.get(compound.safety_rating, 0) + 1
            
            if compound.legal_status:
                legal_statuses[compound.legal_status] = legal_statuses.get(compound.legal_status, 0) + 1
        
        # Sort by relevance
        search_results.sort(key=lambda x: (x.relevance_score, x.study_count), reverse=True)
        
        # Generate suggestions
        suggestions = []
        
        # Category suggestions
        for category, count in categories.items():
            suggestions.append(SearchSuggestion(
                query=f"{query_term} {category}",
                type="category",
                count=count
            ))
        
        # Popular compound suggestions (similar names)
        similar_compounds = db.query(Compound).filter(
            and_(
                Compound.name.ilike(f"%{query_term[:-1]}%"),  # Partial match
                ~Compound.name.ilike(search_term)  # Exclude exact matches
            )
        ).limit(3).all()
        
        for compound in similar_compounds:
            suggestions.append(SearchSuggestion(
                query=compound.name,
                type="compound",
                count=1
            ))
        
        # Calculate execution time
        end_time = datetime.now()
        execution_time = (end_time - start_time).total_seconds() * 1000
        
        return ComprehensiveSearchResponse(
            results=search_results,
            suggestions=suggestions[:10],  # Limit suggestions
            stats=SearchStats(
                total_results=len(search_results),
                categories=categories,
                safety_ratings=safety_ratings,
                legal_statuses=legal_statuses
            ),
            query=query_term,
            execution_time_ms=round(execution_time, 2)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Comprehensive search error: {str(e)}")

@router.get("/search/suggestions", response_model=List[str])
async def get_search_suggestions(
    q: str = Query(..., min_length=1, description="Partial query for suggestions"),
    limit: int = Query(10, ge=1, le=20, description="Maximum suggestions"),
    db: Session = Depends(get_db)
):
    """
    Get search suggestions for autocomplete functionality.
    Ultra-fast endpoint optimized for typeahead.
    """
    try:
        query_term = q.strip().lower()
        if not query_term:
            return []
        
        # Get compound name suggestions
        compounds = db.query(Compound.name).filter(
            Compound.name.ilike(f"{query_term}%")
        ).order_by(
            func.length(Compound.name),  # Shorter names first
            Compound.name
        ).limit(limit).all()
        
        suggestions = [compound.name for compound in compounds]
        
        # Add category suggestions if not enough compound matches
        if len(suggestions) < limit:
            remaining_limit = limit - len(suggestions)
            categories = db.query(
                Compound.category
            ).filter(
                and_(
                    Compound.category.ilike(f"{query_term}%"),
                    Compound.category.isnot(None)
                )
            ).distinct().limit(remaining_limit).all()
            
            suggestions.extend([cat.category for cat in categories])
        
        return suggestions[:limit]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Suggestions error: {str(e)}")

@router.get("/search/categories", response_model=List[str])
async def get_search_categories(db: Session = Depends(get_db)):
    """Get all available categories for search filters"""
    
    categories = db.query(
        Compound.category
    ).filter(
        Compound.category.isnot(None)
    ).distinct().order_by(Compound.category).all()
    
    return [cat.category for cat in categories if cat.category]

@router.get("/search/popular", response_model=List[SearchResult])
async def get_popular_compounds(
    limit: int = Query(10, ge=1, le=50, description="Number of popular compounds"),
    db: Session = Depends(get_db)
):
    """
    Get popular compounds based on study count and safety rating.
    Perfect for homepage and trending sections.
    """
    try:
        compounds = db.query(
            Compound,
            func.count(Study.id).label('study_count')
        ).outerjoin(Study, Compound.id == Study.compound_id).group_by(Compound.id).filter(
            Compound.safety_rating.in_(['A', 'B'])
        ).order_by(
            desc(func.count(Study.id)),
            Compound.safety_rating,
            Compound.name
        ).limit(limit).all()
        
        results = []
        for compound, study_count in compounds:
            results.append(SearchResult(
                id=str(compound.id),
                name=compound.name,
                category=compound.category or 'supplement',
                synonyms=parse_json_field(compound.common_names, []),
                safety_rating=compound.safety_rating,
                legal_status=compound.legal_status,
                study_count=study_count or 0,
                relevance_score=100.0,  # All popular compounds get max relevance
                match_type='popular'
            ))
        
        return results
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Popular compounds error: {str(e)}")
