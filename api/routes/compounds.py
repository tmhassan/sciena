from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_, and_, desc, asc, distinct
from typing import List, Optional, Union, Dict, Any
import json
import math
from datetime import datetime

from database.database import get_db
from database.models import Compound, CompoundSummary, Study, DosageInfo

router = APIRouter()

# Pydantic response models
from pydantic import BaseModel, Field

class CompoundResponse(BaseModel):
    id: str
    name: str
    synonyms: List[str] = []
    category: str
    legal_status: Optional[str] = None
    safety_rating: Optional[str] = None
    molecular_weight: Optional[float] = None
    formula: Optional[str] = None
    cas_number: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class StudyResponse(BaseModel):
    id: str
    pmid: Optional[str] = None
    doi: Optional[str] = None
    title: str
    abstract: Optional[str] = None
    authors: List[str] = []
    journal: Optional[str] = None
    publication_date: Optional[str] = None
    study_type: Optional[str] = None
    sample_size: Optional[int] = None
    evidence_level: Optional[str] = None

    class Config:
        from_attributes = True

class DosageResponse(BaseModel):
    id: str
    form: Optional[str] = None
    route: Optional[str] = None
    dose_min: Optional[float] = None
    dose_max: Optional[float] = None
    dose_unit: Optional[str] = None
    frequency: Optional[str] = None
    population: Optional[str] = None
    evidence_level: Optional[str] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class BenefitResponse(BaseModel):
    indication: str
    evidence_strength: str
    effect_size: str
    population: str
    dose_range: Optional[str] = None
    supporting_studies: List[str] = []

    class Config:
        from_attributes = True

class DetailedCompoundSummaryResponse(BaseModel):
    id: str
    compound_id: str
    overview: Optional[str] = None
    mechanism_of_action: List[str] = []
    benefits: List[BenefitResponse] = []
    side_effects: List[str] = []
    interactions: List[str] = []
    contraindications: List[str] = []
    references: List[str] = []
    ai_generated: bool = False
    reviewed_by_expert: bool = False
    version: int = 1
    evidence_grade: str = "Unknown"
    total_references: int = 0
    last_updated: datetime
    created_at: datetime

    class Config:
        from_attributes = True

class InteractionResponse(BaseModel):
    id: str
    interaction_type: str
    compound_b_id: str
    description: str
    evidence_level: str

class CompoundDetailResponse(CompoundResponse):
    summary: Optional[DetailedCompoundSummaryResponse] = None
    studies: List[StudyResponse] = []
    dosage_info: List[DosageResponse] = []
    interactions: List[InteractionResponse] = []

class PaginationMetadata(BaseModel):
    total_count: int
    page: int
    per_page: int
    total_pages: int
    has_next: bool
    has_prev: bool

class PaginatedCompoundResponse(BaseModel):
    data: List[CompoundResponse]
    metadata: PaginationMetadata

class SummaryStatsResponse(BaseModel):
    total_summaries: int
    ai_generated_count: int
    expert_reviewed_count: int
    avg_references_per_summary: float
    latest_version: int
    coverage_percentage: float
    evidence_grade_breakdown: Dict[str, int]

class ApiResponse(BaseModel):
    data: Union[List[CompoundResponse], CompoundDetailResponse, dict]
    message: Optional[str] = None
    status: str = "success"

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

def parse_benefits(benefits_json: str) -> List[BenefitResponse]:
    """Parse benefits JSON into structured response"""
    try:
        benefits_data = json.loads(benefits_json) if benefits_json else []
        return [
            BenefitResponse(
                indication=benefit.get('indication', ''),
                evidence_strength=benefit.get('evidence_strength', 'Unknown'),
                effect_size=benefit.get('effect_size', 'Unknown'),
                population=benefit.get('population', ''),
                dose_range=benefit.get('dose_range'),
                supporting_studies=benefit.get('supporting_studies', [])
            ) for benefit in benefits_data
        ]
    except (json.JSONDecodeError, AttributeError, TypeError):
        return []

def derive_evidence_grade(summary) -> str:
    """Derive evidence grade from summary data"""
    try:
        ref_count = len(parse_json_field(summary.references, []))
        reviewed = summary.reviewed_by_expert
        ai_generated = summary.ai_generated
        
        if reviewed and ref_count >= 20:
            return "A"
        elif ai_generated and ref_count >= 15:
            return "A"
        elif ref_count >= 10:
            return "B"
        elif ref_count >= 5:
            return "C"
        else:
            return "D"
    except Exception:
        return "Unknown"

def compound_to_response(compound) -> CompoundResponse:
    """Convert database compound to API response"""
    return CompoundResponse(
        id=str(compound.id),
        name=compound.name,
        synonyms=parse_json_field(compound.common_names, []),
        category=compound.category or 'supplement',
        legal_status=compound.legal_status or 'legal',
        safety_rating=compound.safety_rating or 'Unknown',
        molecular_weight=None,  # Not in your current schema
        formula=compound.molecular_formula,
        cas_number=compound.cas_number,
        created_at=compound.created_at,
        updated_at=compound.updated_at
    )

def get_study_response(study) -> StudyResponse:
    """Convert database study to API response"""
    return StudyResponse(
        id=str(study.id),
        pmid=study.pmid,
        doi=study.doi,
        title=study.title,
        abstract=study.abstract,
        authors=parse_json_field(study.authors, []),
        journal=study.journal,
        publication_date=str(study.publication_year) if study.publication_year else None,
        study_type=study.study_type,
        sample_size=study.sample_size,
        evidence_level=study.evidence_level
    )

def get_dosage_response(dosage) -> DosageResponse:
    """Convert database dosage to API response"""
    return DosageResponse(
        id=str(dosage.id),
        form=dosage.form,
        route=dosage.route,
        dose_min=dosage.min_dose,
        dose_max=dosage.max_dose,
        dose_unit=dosage.unit,
        frequency=dosage.frequency,
        population=dosage.population,
        evidence_level=dosage.evidence_level,
        notes=dosage.context
    )

def summary_to_detailed_response(summary) -> DetailedCompoundSummaryResponse:
    """Convert database summary to detailed API response"""
    return DetailedCompoundSummaryResponse(
        id=str(summary.id),
        compound_id=str(summary.compound_id),
        overview=summary.overview,
        mechanism_of_action=parse_json_field(summary.mechanism_of_action, []),
        benefits=parse_benefits(summary.benefits),
        side_effects=parse_json_field(summary.side_effects, []),
        interactions=parse_json_field(summary.interactions, []),
        contraindications=parse_json_field(summary.contraindications, []),
        references=parse_json_field(summary.references, []),
        ai_generated=summary.ai_generated or False,
        reviewed_by_expert=summary.reviewed_by_expert or False,
        version=summary.version or 1,
        evidence_grade=derive_evidence_grade(summary),
        total_references=len(parse_json_field(summary.references, [])),
        last_updated=summary.updated_at,
        created_at=summary.created_at
    )

# Core Compound API endpoints
@router.get("/compounds", response_model=PaginatedCompoundResponse)
async def get_compounds(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    q: Optional[str] = Query(None, description="Search query"),
    category: Optional[str] = Query(None, description="Filter by category"),
    safety_rating: Optional[str] = Query(None, description="Filter by safety rating"),
    evidence_grade: Optional[str] = Query(None, description="Filter by evidence grade"),
    legal_status: Optional[str] = Query(None, description="Filter by legal status"),
    sort_by: Optional[str] = Query("name", description="Sort field"),
    sort_order: Optional[str] = Query("asc", description="Sort order (asc/desc)"),
    db: Session = Depends(get_db)
):
    """
    Get paginated list of compounds with optional filtering and sorting.
    
    Supports full-text search, category filtering, and multiple sorting options.
    Perfect for browse pages and compound discovery.
    """
    try:
        query = db.query(Compound)
        
        # Apply search filter
        if q:
            search_term = f"%{q}%"
            query = query.filter(
                or_(
                    Compound.name.ilike(search_term),
                    Compound.common_names.ilike(search_term),
                    Compound.category.ilike(search_term)
                )
            )
        
        # Apply category filter
        if category:
            categories = [cat.strip() for cat in category.split(',')]
            query = query.filter(Compound.category.in_(categories))
        
        # Apply safety rating filter
        if safety_rating:
            ratings = [rating.strip() for rating in safety_rating.split(',')]
            query = query.filter(Compound.safety_rating.in_(ratings))
        
        # Apply legal status filter
        if legal_status:
            statuses = [status.strip() for status in legal_status.split(',')]
            query = query.filter(Compound.legal_status.in_(statuses))
        
        # Apply sorting
        if sort_by == "name":
            query = query.order_by(
                asc(Compound.name) if sort_order == "asc" else desc(Compound.name)
            )
        elif sort_by == "safety":
            query = query.order_by(
                asc(Compound.safety_rating) if sort_order == "asc" else desc(Compound.safety_rating)
            )
        elif sort_by == "evidence":
            # Sort by number of studies
            subquery = db.query(
                Study.compound_id,
                func.count(Study.id).label('study_count')
            ).group_by(Study.compound_id).subquery()
            
            query = query.outerjoin(subquery, Compound.id == subquery.c.compound_id)
            query = query.order_by(
                asc(func.coalesce(subquery.c.study_count, 0)) if sort_order == "asc" 
                else desc(func.coalesce(subquery.c.study_count, 0))
            )
        else:
            # Default to name sorting
            query = query.order_by(asc(Compound.name))
        
        # Get total count for pagination
        total_count = query.count()
        
        # Apply pagination
        skip = (page - 1) * per_page
        compounds = query.offset(skip).limit(per_page).all()
        
        # Calculate pagination metadata
        total_pages = math.ceil(total_count / per_page) if total_count > 0 else 1
        
        return PaginatedCompoundResponse(
            data=[compound_to_response(c) for c in compounds],
            metadata=PaginationMetadata(
                total_count=total_count,
                page=page,
                per_page=per_page,
                total_pages=total_pages,
                has_next=page < total_pages,
                has_prev=page > 1
            )
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/compounds/{compound_id}", response_model=CompoundDetailResponse)
async def get_compound_by_id(compound_id: str, db: Session = Depends(get_db)):
    """
    Get detailed information about a specific compound including studies, 
    dosage information, and AI-generated summaries.
    
    This is the core endpoint for compound detail pages.
    """
    try:
        compound_id_int = int(compound_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid compound ID format")
    
    # Get compound with eager loading
    compound = db.query(Compound).filter(Compound.id == compound_id_int).first()
    
    if not compound:
        raise HTTPException(status_code=404, detail="Compound not found")
    
    # Get related data
    summary = db.query(CompoundSummary).filter(
        CompoundSummary.compound_id == compound_id_int
    ).order_by(desc(CompoundSummary.version), desc(CompoundSummary.updated_at)).first()
    
    studies = db.query(Study).filter(
        Study.compound_id == compound_id_int
    ).order_by(desc(Study.publication_year), desc(Study.created_at)).all()
    
    dosages = db.query(DosageInfo).filter(
        DosageInfo.compound_id == compound_id_int
    ).all()
    
    # Convert to response format
    base_response = compound_to_response(compound)
    
    return CompoundDetailResponse(
        **base_response.dict(),
        summary=summary_to_detailed_response(summary) if summary else None,
        studies=[get_study_response(s) for s in studies],
        dosage_info=[get_dosage_response(d) for d in dosages],
        interactions=[]  # Add interaction logic when you have that data
    )

@router.get("/compounds/search", response_model=List[CompoundResponse])
async def search_compounds_typeahead(
    q: str = Query(..., min_length=2, description="Search query (minimum 2 characters)"),
    limit: int = Query(10, ge=1, le=50, description="Maximum number of results"),
    db: Session = Depends(get_db)
):
    """
    Fast typeahead search for compounds. Optimized for frontend search bars.
    """
    search_term = f"%{q}%"
    compounds = db.query(Compound).filter(
        or_(
            Compound.name.ilike(search_term),
            Compound.common_names.ilike(search_term)
        )
    ).order_by(
        # Prioritize exact matches and shorter names
        func.length(Compound.name),
        Compound.name
    ).limit(limit).all()
    
    return [compound_to_response(c) for c in compounds]

@router.get("/compounds/featured", response_model=List[CompoundResponse])
async def get_featured_compounds(db: Session = Depends(get_db)):
    """
    Get featured compounds for homepage display.
    Returns compounds with high safety ratings and good research backing.
    """
    compounds = db.query(Compound).filter(
        and_(
            Compound.safety_rating.in_(['A', 'B']),
            or_(
                Compound.legal_status.in_(['OTC', 'Prescription', 'legal']),
                Compound.legal_status.is_(None)
            )
        )
    ).order_by(
        Compound.safety_rating,
        desc(Compound.updated_at)
    ).limit(4).all()
    
    return [compound_to_response(c) for c in compounds]

@router.get("/compounds/category/{category_name}", response_model=List[CompoundResponse])
async def get_compounds_by_category(
    category_name: str,
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get compounds filtered by category"""
    compounds = db.query(Compound).filter(
        Compound.category.ilike(f"%{category_name}%")
    ).order_by(Compound.name).limit(limit).all()
    
    return [compound_to_response(c) for c in compounds]

# AI Summary Endpoints
@router.get("/compounds/{compound_id}/summary", response_model=DetailedCompoundSummaryResponse)
async def get_compound_summary(
    compound_id: str = Path(..., description="Compound ID"),
    version: Optional[int] = Query(None, description="Specific version (latest if not specified)"),
    db: Session = Depends(get_db)
):
    """
    Get detailed AI-generated summary for a specific compound.
    This is the core endpoint for displaying rich compound information on detail pages.
    """
    try:
        compound_id_int = int(compound_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid compound ID format")
    
    # Verify compound exists
    compound = db.query(Compound).filter(Compound.id == compound_id_int).first()
    if not compound:
        raise HTTPException(status_code=404, detail="Compound not found")
    
    # Get summary (latest version or specific version)
    query = db.query(CompoundSummary).filter(CompoundSummary.compound_id == compound_id_int)
    
    if version:
        query = query.filter(CompoundSummary.version == version)
    else:
        query = query.order_by(desc(CompoundSummary.version), desc(CompoundSummary.updated_at))
    
    summary = query.first()
    
    if not summary:
        raise HTTPException(status_code=404, detail="No summary found for this compound")
    
    return summary_to_detailed_response(summary)

@router.get("/compounds/{compound_id}/summary/versions", response_model=List[dict])
async def get_compound_summary_versions(
    compound_id: str = Path(..., description="Compound ID"),
    db: Session = Depends(get_db)
):
    """Get all available versions of a compound summary for version control"""
    
    try:
        compound_id_int = int(compound_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid compound ID format")
    
    versions = db.query(
        CompoundSummary.version,
        CompoundSummary.created_at,
        CompoundSummary.updated_at,
        CompoundSummary.ai_generated,
        CompoundSummary.reviewed_by_expert
    ).filter(
        CompoundSummary.compound_id == compound_id_int
    ).order_by(desc(CompoundSummary.version)).all()
    
    if not versions:
        raise HTTPException(status_code=404, detail="No summaries found for this compound")
    
    return [
        {
            "version": v.version,
            "created_at": v.created_at.isoformat(),
            "updated_at": v.updated_at.isoformat(),
            "ai_generated": v.ai_generated,
            "reviewed_by_expert": v.reviewed_by_expert
        } for v in versions
    ]

@router.get("/compounds/{compound_id}/benefits", response_model=List[BenefitResponse])
async def get_compound_benefits(
    compound_id: str = Path(..., description="Compound ID"),
    evidence_strength: Optional[str] = Query(None, description="Filter by evidence strength (A, B, C)"),
    db: Session = Depends(get_db)
):
    """Get structured benefits information for a compound with evidence levels"""
    
    try:
        compound_id_int = int(compound_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid compound ID format")
    
    summary = db.query(CompoundSummary).filter(
        CompoundSummary.compound_id == compound_id_int
    ).order_by(desc(CompoundSummary.version)).first()
    
    if not summary:
        raise HTTPException(status_code=404, detail="No summary found for this compound")
    
    benefits = parse_benefits(summary.benefits)
    
    if evidence_strength:
        benefits = [b for b in benefits if b.evidence_strength == evidence_strength.upper()]
    
    return benefits

@router.get("/compounds/{compound_id}/interactions-detailed")
async def get_compound_interactions_detailed(
    compound_id: str = Path(..., description="Compound ID"),
    db: Session = Depends(get_db)
):
    """Get detailed drug/supplement interactions for a compound"""
    
    try:
        compound_id_int = int(compound_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid compound ID format")
    
    summary = db.query(CompoundSummary).filter(
        CompoundSummary.compound_id == compound_id_int
    ).order_by(desc(CompoundSummary.version)).first()
    
    if not summary:
        raise HTTPException(status_code=404, detail="No summary found for this compound")
    
    interactions = parse_json_field(summary.interactions, [])
    contraindications = parse_json_field(summary.contraindications, [])
    
    return {
        "interactions": interactions,
        "contraindications": contraindications,
        "compound_id": compound_id,
        "compound_name": summary.compound.name if hasattr(summary, 'compound') else None,
        "last_updated": summary.updated_at.isoformat(),
        "total_interactions": len(interactions),
        "total_contraindications": len(contraindications)
    }

# Summary Analytics and Management Endpoints
@router.get("/compounds/summaries/stats", response_model=SummaryStatsResponse)
async def get_summary_statistics(db: Session = Depends(get_db)):
    """Get comprehensive statistics about compound summaries for analytics dashboards"""
    
    try:
        # Total summaries
        total_summaries = db.query(func.count(CompoundSummary.id)).scalar() or 0
        
        # AI generated count
        ai_generated = db.query(func.count(CompoundSummary.id)).filter(
            CompoundSummary.ai_generated == True
        ).scalar() or 0
        
        # Expert reviewed count
        expert_reviewed = db.query(func.count(CompoundSummary.id)).filter(
            CompoundSummary.reviewed_by_expert == True
        ).scalar() or 0
        
        # Average references per summary
        avg_refs_query = db.query(CompoundSummary.references).filter(
            CompoundSummary.references.isnot(None)
        ).all()
        
        total_refs = 0
        summary_count = 0
        evidence_grades = {"A": 0, "B": 0, "C": 0, "D": 0, "Unknown": 0}
        
        for summary_obj in avg_refs_query:
            refs = parse_json_field(summary_obj.references, [])
            total_refs += len(refs)
            summary_count += 1
            
            # Count evidence grades
            grade = derive_evidence_grade(summary_obj)
            evidence_grades[grade] = evidence_grades.get(grade, 0) + 1
        
        avg_references = total_refs / summary_count if summary_count > 0 else 0
        
        # Latest version
        latest_version = db.query(func.max(CompoundSummary.version)).scalar() or 1
        
        # Coverage percentage (compounds with summaries vs total compounds)
        total_compounds = db.query(func.count(Compound.id)).scalar() or 1
        compounds_with_summaries = db.query(
            func.count(func.distinct(CompoundSummary.compound_id))
        ).scalar() or 0
        
        coverage_percentage = (compounds_with_summaries / total_compounds) * 100
        
        return SummaryStatsResponse(
            total_summaries=total_summaries,
            ai_generated_count=ai_generated,
            expert_reviewed_count=expert_reviewed,
            avg_references_per_summary=round(avg_references, 2),
            latest_version=latest_version,
            coverage_percentage=round(coverage_percentage, 2),
            evidence_grade_breakdown=evidence_grades
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching summary statistics: {str(e)}")

@router.get("/compounds/summaries/recent", response_model=List[DetailedCompoundSummaryResponse])
async def get_recent_summaries(
    limit: int = Query(10, ge=1, le=50, description="Number of recent summaries"),
    ai_generated_only: bool = Query(False, description="Only AI-generated summaries"),
    expert_reviewed_only: bool = Query(False, description="Only expert-reviewed summaries"),
    db: Session = Depends(get_db)
):
    """Get recently created or updated compound summaries for admin dashboards"""
    
    query = db.query(CompoundSummary)
    
    if ai_generated_only:
        query = query.filter(CompoundSummary.ai_generated == True)
    
    if expert_reviewed_only:
        query = query.filter(CompoundSummary.reviewed_by_expert == True)
    
    summaries = query.order_by(
        desc(CompoundSummary.updated_at)
    ).limit(limit).all()
    
    return [summary_to_detailed_response(s) for s in summaries]

@router.get("/compounds/summaries/by-evidence-grade/{grade}")
async def get_summaries_by_evidence_grade(
    grade: str = Path(..., description="Evidence grade (A, B, C, D)"),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get summaries filtered by evidence grade for quality analysis"""
    
    grade = grade.upper()
    if grade not in ['A', 'B', 'C', 'D']:
        raise HTTPException(status_code=400, detail="Invalid evidence grade. Use A, B, C, or D")
    
    # This is a computed field, so we need to fetch and filter
    summaries = db.query(CompoundSummary).limit(limit * 3).all()  # Get extra for filtering
    
    filtered_summaries = []
    for summary in summaries:
        if derive_evidence_grade(summary) == grade:
            filtered_summaries.append(summary_to_detailed_response(summary))
            if len(filtered_summaries) >= limit:
                break
    
    return filtered_summaries

# Platform Statistics
@router.get("/stats")
async def get_platform_stats(db: Session = Depends(get_db)):
    """
    Get comprehensive platform statistics for dashboard and homepage.
    Includes compound counts, study metrics, and summary analytics.
    """
    try:
        # Basic counts
        total_compounds = db.query(func.count(Compound.id)).scalar()
        total_studies = db.query(func.count(Study.id)).scalar()
        total_summaries = db.query(func.count(CompoundSummary.id)).scalar()
        
        # Compounds with studies
        compounds_with_studies = db.query(
            func.count(func.distinct(Study.compound_id))
        ).scalar()
        
        # Compounds with AI summaries
        compounds_with_summaries = db.query(
            func.count(func.distinct(CompoundSummary.compound_id))
        ).scalar()
        
        # Category breakdown
        categories = db.query(
            Compound.category, 
            func.count(Compound.id)
        ).group_by(Compound.category).all()
        
        category_dict = {cat: count for cat, count in categories if cat}
        
        # Safety rating breakdown
        safety_ratings = db.query(
            Compound.safety_rating,
            func.count(Compound.id)
        ).group_by(Compound.safety_rating).all()
        
        safety_dict = {rating: count for rating, count in safety_ratings if rating}
        
        # Legal status breakdown
        legal_statuses = db.query(
            Compound.legal_status,
            func.count(Compound.id)
        ).group_by(Compound.legal_status).all()
        
        legal_dict = {status: count for status, count in legal_statuses if status}
        
        return {
            "total_compounds": total_compounds or 0,
            "total_studies": total_studies or 0,
            "total_summaries": total_summaries or 0,
            "total_with_studies": compounds_with_studies or 0,
            "total_with_summaries": compounds_with_summaries or 0,
            "categories": category_dict,
            "safety_ratings": safety_dict,
            "legal_statuses": legal_dict,
            "coverage": {
                "studies": round((compounds_with_studies / (total_compounds or 1)) * 100, 2),
                "summaries": round((compounds_with_summaries / (total_compounds or 1)) * 100, 2)
            },
            "last_updated": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching stats: {str(e)}")

# Health check endpoint for this router
@router.get("/compounds/health")
async def health_check(db: Session = Depends(get_db)):
    """Health check endpoint for compounds service with database connectivity test"""
    try:
        # Test database connectivity
        db.execute("SELECT 1")
        
        # Get basic counts for health metrics
        compound_count = db.query(func.count(Compound.id)).scalar()
        summary_count = db.query(func.count(CompoundSummary.id)).scalar()
        
        return {
            "status": "healthy", 
            "service": "compounds", 
            "timestamp": datetime.utcnow(),
            "metrics": {
                "compounds": compound_count,
                "summaries": summary_count,
                "database": "connected"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Service unhealthy: {str(e)}")
