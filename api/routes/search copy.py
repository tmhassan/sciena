from flask import Blueprint, jsonify, request
from database.database import get_session
from database.models import Compound
from sqlalchemy import or_, text

search_bp = Blueprint('search', __name__)

@search_bp.route('/', methods=['GET'])
def search_compounds():
    """Search compounds by name"""
    query = request.args.get('q', '').strip()
    
    if not query:
        return jsonify({'error': 'Query parameter required'}), 400
    
    session = get_session()
    try:
        # SQLite-compatible JSON search
        compounds = session.query(Compound).filter(
            or_(
                Compound.name.ilike(f'%{query}%'),
                # Use JSON_EXTRACT for SQLite instead of .astext
                text("JSON_EXTRACT(common_names, '$') LIKE :search_term")
            )
        ).params(search_term=f'%{query}%').limit(20).all()
        
        result = []
        for compound in compounds:
            result.append({
                'id': compound.id,
                'name': compound.name,
                'category': compound.category,
                'common_names': compound.common_names
            })
        
        return jsonify(result)
    finally:
        session.close()
