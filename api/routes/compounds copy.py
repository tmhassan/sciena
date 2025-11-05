from flask import Blueprint, jsonify, request
from database.database import get_session
from database.models import Compound, CompoundSummary
from sqlalchemy.orm import joinedload

compounds_bp = Blueprint('compounds', __name__)

@compounds_bp.route('/', methods=['GET'])
def get_compounds():
    """Get all compounds"""
    session = get_session()
    try:
        compounds = session.query(Compound).all()
        result = []
        for compound in compounds:
            result.append({
                'id': compound.id,
                'name': compound.name,
                'category': compound.category,
                'common_names': compound.common_names,
                'legal_status': compound.legal_status,
                'safety_rating': compound.safety_rating
            })
        return jsonify(result)
    finally:
        session.close()

@compounds_bp.route('/<int:compound_id>', methods=['GET'])
def get_compound(compound_id):
    """Get detailed compound information"""
    session = get_session()
    try:
        compound = session.query(Compound).options(
            joinedload(Compound.summaries),
            joinedload(Compound.studies)
        ).filter(Compound.id == compound_id).first()
        
        if not compound:
            return jsonify({'error': 'Compound not found'}), 404
        
        # Get latest summary
        latest_summary = None
        if compound.summaries:
            latest_summary = max(compound.summaries, key=lambda s: s.created_at)
        
        result = {
            'id': compound.id,
            'name': compound.name,
            'category': compound.category,
            'common_names': compound.common_names,
            'legal_status': compound.legal_status,
            'safety_rating': compound.safety_rating,
            'study_count': len(compound.studies),
            'summary': {
                'overview': latest_summary.overview if latest_summary else None,
                'mechanism': latest_summary.mechanism_of_action if latest_summary else None,
                'benefits': latest_summary.benefits if latest_summary else [],
                'side_effects': latest_summary.side_effects if latest_summary else [],
                'interactions': latest_summary.interactions if latest_summary else []
            } if latest_summary else None
        }
        
        return jsonify(result)
    finally:
        session.close()
