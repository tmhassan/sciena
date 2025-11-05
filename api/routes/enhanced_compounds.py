from flask import Blueprint, jsonify, request
from database.database import get_session
from database.models import Compound, Study
from database.enhanced_models import EnhancedCompoundSummary
from sqlalchemy.orm import joinedload
import json

enhanced_compounds_bp = Blueprint('enhanced_compounds', __name__)

@enhanced_compounds_bp.route('/<int:compound_id>/comprehensive', methods=['GET'])
def get_comprehensive_profile(compound_id):
    """Get comprehensive compound profile with full research analysis"""
    session = get_session()
    try:
        # Get compound with enhanced summary
        compound = session.query(Compound).options(
            joinedload(Compound.enhanced_summaries),
            joinedload(Compound.studies)
        ).filter(Compound.id == compound_id).first()
        
        if not compound:
            return jsonify({'error': 'Compound not found'}), 404
        
        # Get latest enhanced summary
        latest_summary = None
        if compound.enhanced_summaries:
            latest_summary = max(compound.enhanced_summaries, key=lambda s: s.created_at)
        
        if not latest_summary:
            return jsonify({'error': 'Comprehensive profile not available'}), 404
        
        # Build comprehensive response
        response = {
            'compound': {
                'id': compound.id,
                'name': compound.name,
                'category': compound.category,
                'common_names': compound.common_names,
                'legal_status': compound.legal_status,
                'safety_rating': compound.safety_rating
            },
            'profile': {
                'overview': latest_summary.overview,
                'mechanism_of_action': latest_summary.mechanism_of_action,
                'evidence_assessment': {
                    'grade': latest_summary.evidence_grade,
                    'confidence': latest_summary.evidence_confidence,
                    'total_studies': latest_summary.total_studies,
                    'rct_count': latest_summary.rct_count,
                    'meta_analysis_count': latest_summary.meta_analysis_count
                },
                'therapeutic_applications': latest_summary.therapeutic_applications,
                'dosage_protocols': latest_summary.dosage_protocols,
                'safety_profile': latest_summary.safety_profile,
                'research_timeline': latest_summary.research_timeline,
                'key_takeaways': latest_summary.key_takeaways,
                'regulatory_status': latest_summary.regulatory_status,
                'cost_effectiveness': latest_summary.cost_effectiveness
            },
            'references': latest_summary.references,
            'metadata': {
                'version': latest_summary.version,
                'expert_reviewed': latest_summary.expert_reviewed,
                'last_updated': latest_summary.updated_at.isoformat(),
                'study_count': len(compound.studies)
            }
        }
        
        return jsonify(response)
        
    finally:
        session.close()

@enhanced_compounds_bp.route('/evidence-grades', methods=['GET'])
def get_evidence_grades():
    """Get all compounds with their evidence grades"""
    session = get_session()
    try:
        summaries = session.query(EnhancedCompoundSummary).join(Compound).all()
        
        grade_distribution = {'A': [], 'B': [], 'C': [], 'D': []}
        
        for summary in summaries:
            grade = summary.evidence_grade or 'D'
            grade_distribution[grade].append({
                'id': summary.compound.id,
                'name': summary.compound.name,
                'category': summary.compound.category,
                'confidence': summary.evidence_confidence,
                'study_count': summary.total_studies
            })
        
        return jsonify({
            'grade_distribution': grade_distribution,
            'total_compounds': len(summaries),
            'high_evidence_count': len(grade_distribution['A']) + len(grade_distribution['B'])
        })
        
    finally:
        session.close()

@enhanced_compounds_bp.route('/search/therapeutic', methods=['GET'])
def search_by_therapeutic_application():
    """Search compounds by therapeutic application"""
    indication = request.args.get('indication', '').strip()
    min_evidence_grade = request.args.get('min_grade', 'D')
    
    if not indication:
        return jsonify({'error': 'Indication parameter required'}), 400
    
    session = get_session()
    try:
        # Search in therapeutic applications JSON
        summaries = session.query(EnhancedCompoundSummary).join(Compound).all()
        
        matching_compounds = []
        
        for summary in summaries:
            if not summary.therapeutic_applications:
                continue
                
            for app in summary.therapeutic_applications:
                if indication.lower() in app.get('indication', '').lower():
                    # Check evidence grade
                    app_grade = app.get('evidence_strength', 'D')
                    grade_values = {'A': 4, 'B': 3, 'C': 2, 'D': 1}
                    
                    if grade_values.get(app_grade, 1) >= grade_values.get(min_evidence_grade, 1):
                        matching_compounds.append({
                            'compound': {
                                'id': summary.compound.id,
                                'name': summary.compound.name,
                                'category': summary.compound.category
                            },
                            'application': app,
                            'overall_evidence_grade': summary.evidence_grade
                        })
                        break
        
        return jsonify({
            'indication': indication,
            'min_evidence_grade': min_evidence_grade,
            'matching_compounds': matching_compounds,
            'total_matches': len(matching_compounds)
        })
        
    finally:
        session.close()
