# app/middleware/auth_middleware.py
import os
from functools import wraps
from flask import request, jsonify, g
import jwt
from app.database import get_connection
from app.config import config

# Variable de entorno para desactivar autenticación en desarrollo (NUNCA en producción)
AUTH_ENABLED = os.getenv('AUTH_ENABLED', 'true').lower() == 'true'

# Excepción personalizada para errores de autenticación (opcional, pero buena práctica)
class AuthenticationError(Exception):
    pass

def _get_user_from_token_or_header():
    """Obtiene el ID del usuario desde el token JWT o el header X-UsuarioID.
    
    Returns:
        int: ID del usuario autenticado.
    
    Raises:
        AuthenticationError: Si no se encuentra ninguna credencial válida.
    """
    # 1. Intentar obtener token JWT del header Authorization
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
        try:
            payload = jwt.decode(token, config.SECRET_KEY, algorithms=['HS256'])
            usuario_id = payload.get('UsuarioID')
            if usuario_id is not None:
                return int(usuario_id)
        except jwt.ExpiredSignatureError:
            raise AuthenticationError('Token expirado')
        except jwt.InvalidTokenError:
            raise AuthenticationError('Token inválido')
        except Exception as e:
            raise AuthenticationError(f'Error decodificando token: {str(e)}')
    
    # 2. Intentar obtener X-UsuarioID
    usuario_id_raw = request.headers.get('X-UsuarioID')
    if usuario_id_raw is not None:
        try:
            return int(usuario_id_raw)
        except ValueError:
            raise AuthenticationError('X-UsuarioID debe ser un número entero')
    
    raise AuthenticationError('Credenciales no proporcionadas (token o X-UsuarioID requerido)')

def _get_user_by_id(usuario_id):
    """Busca un usuario en la base de datos por su ID, incluyendo su rol.
    
    Args:
        usuario_id (int): ID del usuario.
    
    Returns:
        dict: Datos del usuario (incluyendo RolNombre) o None si no existe.
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT u.*, r.NombreRol AS RolNombre
        FROM Usuarios u
        JOIN Roles r ON u.RolID = r.RolID
        WHERE u.UsuarioID = %s
    """, (usuario_id,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()
    return user

def require_auth(f):
    """
    Decorador que autentica al usuario antes de ejecutar la función.
    Establece g.current_user con los datos del usuario autenticado.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        # Modo prueba: autenticación desactivada
        if not AUTH_ENABLED:
            g.current_user = {
                'UsuarioID': 1,
                'Usuario': 'adminjbitp',
                'RolNombre': 'Administrador'
            }
            return f(*args, **kwargs)
        
        try:
            usuario_id = _get_user_from_token_or_header()
        except AuthenticationError as e:
            return jsonify({'error': str(e)}), 401
        
        user = _get_user_by_id(usuario_id)
        if not user:
            return jsonify({'error': 'Usuario no encontrado'}), 401
        
        g.current_user = user
        return f(*args, **kwargs)
    
    return decorated

def require_permission(permiso_codigo):
    """
    Decorador que verifica si el usuario autenticado tiene el permiso requerido.
    El administrador tiene acceso total sin necesidad de permisos explícitos.
    """
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            # Si la autenticación está desactivada, permitir acceso
            if not AUTH_ENABLED:
                return f(*args, **kwargs)
            
            user = g.get('current_user')
            if not user:
                return jsonify({'error': 'Usuario no autenticado'}), 401
            
            # Administrador tiene acceso total
            if user.get('RolNombre') == 'Administrador':
                return f(*args, **kwargs)
            
            # Verificar permiso en la base de datos
            conn = get_connection()
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT 1
                FROM Roles_Permisos rp
                JOIN Permisos p ON rp.PermisoID = p.PermisoID
                WHERE rp.RolID = %s AND p.NombrePermiso = %s
            """, (user['RolID'], permiso_codigo))
            tiene_permiso = cursor.fetchone()
            cursor.close()
            conn.close()
            
            if not tiene_permiso:
                return jsonify({
                    'error': f'Permiso denegado: {permiso_codigo}',
                    'message': 'No tienes permisos para realizar esta acción'
                }), 403
            
            return f(*args, **kwargs)
        
        return decorated
    return decorator