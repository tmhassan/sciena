from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc, asc, and_, or_
from typing import List, Optional
import json
from datetime import datetime

from database.database import get_db
from database.models import Study, Compound

router = APIRouter()

# Pydantic response models
from pydantic import BaseModel, Field

class StudyResponse(BaseModel):
    id: str
    compound_id: str
    compound_name: Optional[str] = None
    pmid: Optional[str] = None
    doi: Optional[str] = None
    title: str
    abstract: Optional[str] = None
    authors: List[str] = []
    journal: Optional[str] = None
    publication_year: Optional[int] = None
    study_type: Optional[str] = None
    sample_size: Optional[int] = None
    population: Optional[str] = None
    evidence_level: Optional[str] = None
    full_text_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class StudyStatistics(BaseModel):
    total_studies: int
    studies_by_year: dict
    studies_by_type: dict
    studies_by_evidence_level: dict
    average_sample_size: Optional[float] = None

class PaginatedStudyResponse(BaseModel):
    data: List[StudyResponse]
    metadata: dict

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

def study_to_response(study, include_compound_name=False) -> StudyResponse:
    """Convert database study to API response"""
    return StudyResponse(
        id=str(study.id),
        compound_id=str(study.compound_id),
        compound_name=study.compound.name if hasattr(study, 'compound') and study.compound else None,
        pmid=study.pmid,
        doi=study.doi,
        title=study.title,
        abstract=study.abstract,
        authors=parse_json_field(study.authors, []),
        journal=study.journal,
        publication_year=study.publication_year,
        study_type=study.study_type,
        sample_size=study.sample_size,
        population=study.population,
        evidence_level=study.evidence_level,
        full_text_url=study.full_text_url,
        created_at=study.created_at
    )

# API Endpoints
@router.get("/studies", response_model=PaginatedStudyResponse)
async def get_all_studies(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    q: Optional[str] = Query(None, description="Search query"),
    compound_id: Optional[int] = Query(None, description="Filter by compound ID"),
    study_type: Optional[str] = Query(None, description="Filter by study type"),
    evidence_level: Optional[str] = Query(None, description="Filter by evidence level"),
    year_from: Optional[int] = Query(None, description="Filter from publication year"),
    year_to: Optional[int] = Query(None, description="Filter to publication year"),
    sort_by: Optional[str] = Query("publication_year", description="Sort field"),
    sort_order: Optional[str] = Query("desc", description="Sort order (asc/desc)"),
    db: Session = Depends(get_db)
):
    """
    Get paginated list of studies with comprehensive filtering and search capabilities.
    """
    try:
        # Base query with compound join for compound name
        query = db.query(Study).join(Compound, Study.compound_id == Compound.id)
        
        # Apply search filter
        if q:
            search_term = f"%{q}%"
            query = query.filter(
                or_(
                    Study.title.ilike(search_term),
                    Study.abstract.ilike(search_term),
                    Study.journal.ilike(search_term),
                    Study.authors.ilike(search_term),
                    Compound.name.ilike(search_term)
                )
            )
        
        # Apply compound filter
        if compound_id:
            query = query.filter(Study.compound_id == compound_id)
        
        # Apply study type filter
        if study_type:
            study_types = [t.strip() for t in study_type.split(',')]
            query = query.filter(Study.study_type.in_(study_types))
        
        # Apply evidence level filter
        if evidence_level:
            levels = [l.strip() for l in evidence_level.split(',')]
            query = query.filter(Study.evidence_level.in_(levels))
        
        # Apply year range filters
        if year_from:
            query = query.filter(Study.publication_year >= year_from)
        if year_to:
            query = query.filter(Study.publication_year <= year_to)
        
        # Apply sorting
        if sort_by == "publication_year":
            query = query.order_by(
                desc(Study.publication_year) if sort_order == "desc" else asc(Study.publication_year)
            )
        elif sort_by == "title":
            query = query.order_by(
                asc(Study.title) if sort_order == "asc" else desc(Study.title)
            )
        elif sort_by == "journal":
            query = query.order_by(
                asc(Study.journal) if sort_order == "asc" else desc(Study.journal)
            )
        elif sort_by == "evidence_level":
            query = query.order_by(
                asc(Study.evidence_level) if sort_order == "asc" else desc(Study.evidence_level)
            )
        else:
            # Default to publication year desc
            query = query.order_by(desc(Study.publication_year))
        
        # Get total count
        total_count = query.count()
        
        # Apply pagination
        skip = (page - 1) * per_page
        studies = query.offset(skip).limit(per_page).all()
        
        # Calculate pagination metadata
        total_pages = (total_count + per_page - 1) // per_page
        
        return PaginatedStudyResponse(
            data=[study_to_response(s, include_compound_name=True) for s in studies],
            metadata={
                "total_count": total_count,
                "page": page,
                "per_page": per_page,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_prev": page > 1
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/studies/compound/{compound_id}", response_model=List[StudyResponse])
async def get_compound_studies(
    compound_id: int = Path(..., description="Compound ID"),
    limit: int = Query(50, ge=1, le=200, description="Maximum number of studies"),
    evidence_level: Optional[str] = Query(None, description="Filter by evidence level"),
    study_type: Optional[str] = Query(None, description="Filter by study type"),
    db: Session = Depends(get_db)
):
    """
    Get all studies for a specific compound with optional filtering.
    Optimized for compound detail pages.
    """
    try:
        # Verify compound exists
        compound = db.query(Compound).filter(Compound.id == compound_id).first()
        if not compound:
            raise HTTPException(status_code=404, detail="Compound not found")
        
        query = db.query(Study).filter(Study.compound_id == compound_id)
        
        # Apply filters
        if evidence_level:
            levels = [l.strip() for l in evidence_level.split(',')]
            query = query.filter(Study.evidence_level.in_(levels))
        
        if study_type:
            types = [t.strip() for t in study_type.split(',')]
            query = query.filter(Study.study_type.in_(types))
        
        # Order by publication year (newest first)
        studies = query.order_by(
            desc(Study.publication_year),
            desc(Study.created_at)
        ).limit(limit).all()
        
        return [study_to_response(s) for s in studies]
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/studies/{study_id}", response_model=StudyResponse)
async def get_study_by_id(
    study_id: int = Path(..., description="Study ID"),
    db: Session = Depends(get_db)
):
    """Get detailed information about a specific study"""
    
    study = db.query(Study).join(Compound).filter(Study.id == study_id).first()
    
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")
    
    return study_to_response(study, include_compound_name=True)

@router.get("/studies/stats", response_model=StudyStatistics)
async def get_study_statistics(db: Session = Depends(get_db)):
    """Get comprehensive study statistics for analytics and dashboards"""
    
    try:
        # Total studies
        total_studies = db.query(func.count(Study.id)).scalar()
        
        # Studies by year
        studies_by_year = db.query(
            Study.publication_year,
            func.count(Study.id)
        ).filter(
            Study.publication_year.isnot(None)
        ).group_by(Study.publication_year).order_by(Study.publication_year).all()
        
        # Studies by type
        studies_by_type = db.query(
            Study.study_type,
            func.count(Study.id)
        ).filter(
            Study.study_type.isnot(None)
        ).group_by(Study.study_type).all()
        
        # Studies by evidence level
        studies_by_evidence = db.query(
            Study.evidence_level,
            func.count(Study.id)
        ).filter(
            Study.evidence_level.isnot(None)
        ).group_by(Study.evidence_level).all()
        
        # Average sample size
        avg_sample_size = db.query(
            func.avg(Study.sample_size)
        ).filter(Study.sample_size.isnot(None)).scalar()
        
        return StudyStatistics(
            total_studies=total_studies or 0,
            studies_by_year={str(year): count for year, count in studies_by_year if year},
            studies_by_type={stype: count for stype, count in studies_by_type if stype},
            studies_by_evidence_level={level: count for level, count in studies_by_evidence if level},
            average_sample_size=float(avg_sample_size) if avg_sample_size else None
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching study statistics: {str(e)}")

@router.get("/studies/recent", response_model=List[StudyResponse])
async def get_recent_studies(
    limit: int = Query(10, ge=1, le=50, description="Number of recent studies"),
    db: Session = Depends(get_db)
):
    """Get most recently added studies across all compounds"""
    
    studies = db.query(Study).join(Compound).order_by(
        desc(Study.created_at)
    ).limit(limit).all()
    
    return [study_to_response(s, include_compound_name=True) for s in studies]

@router.get("/studies/by-evidence/{evidence_level}", response_model=List[StudyResponse])
async def get_studies_by_evidence_level(
    evidence_level: str = Path(..., description="Evidence level (A, B, C, etc.)"),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get studies filtered by evidence level"""
    
    studies = db.query(Study).join(Compound).filter(
        Study.evidence_level == evidence_level.upper()
    ).order_by(desc(Study.publication_year)).limit(limit).all()
    
    return [study_to_response(s, include_compound_name=True) for s in studies]
