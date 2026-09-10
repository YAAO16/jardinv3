from flask import Blueprint, request, jsonify, current_app
import os
from werkzeug.utils import secure_filename
#from app.middleware.auth_middleware import require_auth, require_permission
from app.models.arbol import ArbolModel
from app.database import get_connection

arbol_bp = Blueprint('arboles', __name__, url_prefix='/arboles')

@arbol_bp.route('', methods=['GET'])
# @require_auth
def get_arboles():
    arboles = ArbolModel.get_all()
    return jsonify(arboles)

@arbol_bp.route('/mapa', methods=['GET'])
# @require_auth
def get_arboles_mapa():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT a.*, e.NombreComun, e.NombreCientifico
        FROM Info_arboles a
        JOIN Especies e ON a.EspecieID = e.EspecieID
        WHERE a.Latitud IS NOT NULL AND a.Longitud IS NOT NULL
    """)
    arboles = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(arboles)

@arbol_bp.route('/<int:arbol_id>', methods=['GET'])
# @require_auth
def get_arbol(arbol_id):
    arbol = ArbolModel.get_by_id(arbol_id)
    if not arbol:
        return jsonify({'error': 'Árbol no encontrado'}), 404
    return jsonify(arbol)

@arbol_bp.route('', methods=['POST'])
# @require_permission('arboles_crear')
def create_arbol():
    data = request.json
    try:
        arbol_id = ArbolModel.create(data)
        return jsonify({'ok': True, 'id': arbol_id}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@arbol_bp.route('/<int:arbol_id>', methods=['PUT'])
# @require_auth
# @require_permission('arboles_editar')
def update_arbol(arbol_id):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No se recibieron datos'}), 400
    try:
        ArbolModel.update(arbol_id, data)
        return jsonify({'message': 'Árbol actualizado correctamente'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@arbol_bp.route('/<int:arbol_id>', methods=['DELETE'])
# @require_permission('arboles_eliminar')
def delete_arbol(arbol_id):
    try:
        ArbolModel.delete(arbol_id)
        return jsonify({'ok': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

# ===== Carga de imagen =====
@arbol_bp.route('/<int:arbol_id>/imagen', methods=['OPTIONS'])
def handle_options_imagen(arbol_id):
    return '', 200

@arbol_bp.route('/<int:arbol_id>/imagen', methods=['POST'])
# @require_auth
# @require_permission('arboles_editar')
def upload_imagen(arbol_id):
    arbol = ArbolModel.get_by_id(arbol_id)
    if not arbol:
        return jsonify({'error': 'Árbol no encontrado'}), 404

    if 'imagen' not in request.files:
        return jsonify({'error': 'No se envió ninguna imagen'}), 400

    file = request.files['imagen']
    if file.filename == '':
        return jsonify({'error': 'Nombre de archivo vacío'}), 400

    ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
    if ext not in current_app.config['ALLOWED_EXTENSIONS']:
        return jsonify({'error': 'Formato no permitido'}), 400

    filename = secure_filename(f"arbol_{arbol_id}_{os.urandom(4).hex()}.{ext}")
    upload_folder = current_app.config['UPLOAD_FOLDER']
    os.makedirs(upload_folder, exist_ok=True)
    file.save(os.path.join(upload_folder, filename))

    imagen_url = f"/uploads/{filename}"
    ArbolModel.update_imagen(arbol_id, imagen_url)

    return jsonify({'message': 'Imagen subida correctamente', 'url': imagen_url}), 200

