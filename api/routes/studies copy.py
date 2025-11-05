from flask import Blueprint, jsonify
from database.database import get_session
from database.models import Study

studies_bp = Blueprint('studies', __name__)

@studies_bp.route('/compound/<int:compound_id>', methods=['GET'])
def get_compound_studies(compound_id):
    """Get all studies for a compound"""
    session = get_session()
    try:
        studies = session.query(Study).filter(
            Study.compound_id == compound_id
        ).order_by(Study.publication_year.desc()).all()
        
        result = []
        for study in studies:
            result.append({
                'id': study.id,
                'pmid': study.pmid,
                'title': study.title,
                'abstract': study.abstract[:300] + '...' if study.abstract and len(study.abstract) > 300 else study.abstract,
                'journal': study.journal,
                'publication_year': study.publication_year,
                'study_type': study.study_type,
                'evidence_level': study.evidence_level
            })
        
        return jsonify(result)
    finally:
        session.close()
