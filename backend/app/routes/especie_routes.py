from flask import Blueprint, request, jsonify
# from app.middleware.auth_middleware import require_auth, require_permission
from app.models.especie import EspecieModel

especie_bp = Blueprint('especies', __name__, url_prefix='/especies')

@especie_bp.route('', methods=['GET'])
# @require_auth
def get_especies():
    """Obtiene todas las especies"""
    especies = EspecieModel.get_all()
    return jsonify(especies)

@especie_bp.route('/<int:especie_id>', methods=['GET'])
# @require_auth
def get_especie(especie_id):
    especie = EspecieModel.get_by_id(especie_id)
    if not especie:
        return jsonify({'error': 'Especie no encontrada'}), 404
    return jsonify(especie)

@especie_bp.route('', methods=['POST'])
# @require_permission('especies_crear')
def create_especie():
    data = request.json
    try:
        especie_id = EspecieModel.create(data)
        return jsonify({'ok': True, 'id': especie_id}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@especie_bp.route('/<int:especie_id>', methods=['PUT'])
# @require_permission('especies_editar')
def update_especie(especie_id):
    data = request.json
    try:
        EspecieModel.update(especie_id, data)
        return jsonify({'ok': True}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@especie_bp.route('/<int:especie_id>', methods=['DELETE'])
# @require_permission('especies_eliminar')
def delete_especie(especie_id):
    try:
        EspecieModel.delete(especie_id)
        return jsonify({'ok': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 400