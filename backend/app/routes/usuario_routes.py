from flask import Blueprint, request, jsonify
from app.middleware.auth_middleware import require_auth, require_permission
from app.models.usuario import UsuarioModel
from app.database import get_connection

usuario_bp = Blueprint('usuarios', __name__, url_prefix='/usuarios')

@usuario_bp.route('', methods=['GET'])
#@require_auth
#@require_permission('usuarios_ver')
def get_usuarios():
    usuarios = UsuarioModel.get_all()
    return jsonify(usuarios)

@usuario_bp.route('', methods=['POST'])
#@require_auth
#@require_permission('usuarios_crear')
def create_usuario():
    data = request.json
    try:
        usuario_id = UsuarioModel.create(data)
        return jsonify({'ok': True, 'id': usuario_id}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@usuario_bp.route('/<int:usuario_id>', methods=['PUT'])
#@require_auth
#@require_permission('usuarios_editar')
def update_usuario(usuario_id):
    data = request.json
    try:
        UsuarioModel.update(usuario_id, data)
        return jsonify({'ok': True}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@usuario_bp.route('/<int:usuario_id>', methods=['DELETE'])
#@require_auth
#@require_permission('usuarios_eliminar')
def delete_usuario(usuario_id):
    try:
        UsuarioModel.delete(usuario_id)
        return jsonify({'ok': True}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@usuario_bp.route('/roles', methods=['GET'])
#@require_auth
#@require_permission('usuarios_ver')
def get_roles():
    """Obtiene todos los roles disponibles"""
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT RolID, NombreRol FROM Roles ORDER BY RolID")
    roles = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(roles)

# En app/routes/usuario_routes.py (o en un archivo nuevo)

@usuario_bp.route('/permisos', methods=['GET'])
#@require_auth
#@require_permission('administracion_ver')
def get_permisos():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT PermisoID, NombrePermiso, Categoria FROM Permisos ORDER BY Categoria, NombrePermiso")
    permisos = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(permisos)

@usuario_bp.route('/roles/<int:rol_id>/permisos', methods=['GET'])
#@require_auth
#@require_permission('administracion_ver')
def get_permisos_rol(rol_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT p.PermisoID FROM Roles_Permisos rp JOIN Permisos p ON rp.PermisoID = p.PermisoID WHERE rp.RolID = %s", (rol_id,))
    permisos = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(permisos)

@usuario_bp.route('/roles/<int:rol_id>/permisos', methods=['PUT'])
#@require_auth
#@require_permission('administracion_editar')
def update_permisos_rol(rol_id):
    data = request.json
    permisos_ids = data.get('permisos', [])
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM Roles_Permisos WHERE RolID = %s", (rol_id,))
    for pid in permisos_ids:
        cursor.execute("INSERT INTO Roles_Permisos (RolID, PermisoID) VALUES (%s, %s)", (rol_id, pid))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'message': 'Permisos actualizados'}), 200