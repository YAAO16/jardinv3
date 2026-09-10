from flask import Blueprint, request, jsonify
import bcrypt
import jwt
from app.config import config
from app.database import get_connection

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    if not data:
        return jsonify({'error': 'No se recibieron datos'}), 400

    usuario = data.get('usuario')
    contrasena = data.get('contrasena') or data.get('password')

    if not usuario or not contrasena:
        return jsonify({'error': 'Faltan credenciales'}), 400

    contrasena = str(contrasena).strip()

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT u.*, r.NombreRol AS RolNombre 
        FROM Usuarios u
        JOIN Roles r ON u.RolID = r.RolID
        WHERE u.Usuario = %s
    """, (usuario,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()

    if not user or not bcrypt.checkpw(contrasena.encode('utf-8'), user['Contrasena'].encode('utf-8')):
        return jsonify({'error': 'Credenciales inválidas'}), 401

    # Generar token JWT
    token = jwt.encode(
        {'UsuarioID': user['UsuarioID']},
        config.SECRET_KEY,
        algorithm='HS256'
    )

    return jsonify({
        'token': token,
        'UsuarioID': user['UsuarioID'],
        'usuario': user['Usuario'],
        'Rol': user['RolNombre']
    })