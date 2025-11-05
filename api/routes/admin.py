from flask import Blueprint, jsonify

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/health', methods=['GET'])
def admin_health():
    """Admin health check"""
    return jsonify({'status': 'healthy', 'service': 'admin'})
