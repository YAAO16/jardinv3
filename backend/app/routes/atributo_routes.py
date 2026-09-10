from flask import Blueprint, request, jsonify
from app.middleware.auth_middleware import require_auth, require_permission
from app.database import get_connection

atributo_bp = Blueprint('atributos', __name__, url_prefix='/atributos')

@atributo_bp.route('', methods=['GET'])
@require_auth
@require_permission('atributos_ver')
def get_atributos():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM Info_arboles_AtributosDinamicos")
    data = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(data)

@atributo_bp.route('', methods=['POST'])
@require_auth
@require_permission('atributos_crear')
def create_atributo(arbol_id):
    data = request.json
    data['MedicionArbolID'] = arbol_id
    conn = get_connection()
    cursor = conn.cursor()
    sql = """
        INSERT INTO Info_arboles_AtributosDinamicos 
        (MedicionArbolID, NombreCampo, ValorTexto, ValorNumero, ValorFecha, ValorBooleano)
        VALUES (%s, %s, %s, %s, %s, %s)
    """
    values = (
        data['MedicionArbolID'],
        data['NombreCampo'],
        data.get('ValorTexto'),
        data.get('ValorNumero'),
        data.get('ValorFecha'),
        data.get('ValorBooleano')
    )
    cursor.execute(sql, values)
    conn.commit()
    last_id = cursor.lastrowid
    cursor.close()
    conn.close()
    return jsonify({'id': last_id}), 201

@atributo_bp.route('/<int:atributo_id>', methods=['PUT'])
@require_auth
@require_permission('atributos_editar')
def update_atributo(arbol_id, atributo_id):
    data = request.json
    conn = get_connection()
    cursor = conn.cursor()
    sql = """
        UPDATE Info_arboles_AtributosDinamicos
        SET NombreCampo = %s, ValorTexto = %s, ValorNumero = %s, ValorFecha = %s, ValorBooleano = %s
        WHERE ID = %s AND MedicionArbolID = %s
    """
    values = (
        data['NombreCampo'],
        data.get('ValorTexto'),
        data.get('ValorNumero'),
        data.get('ValorFecha'),
        data.get('ValorBooleano'),
        atributo_id,
        arbol_id
    )
    cursor.execute(sql, values)
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'ok': True}), 200

@atributo_bp.route('/<int:atributo_id>', methods=['DELETE'])
@require_auth
@require_permission('atributos_eliminar')
def delete_atributo(arbol_id, atributo_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM Info_arboles_AtributosDinamicos WHERE ID = %s AND MedicionArbolID = %s", (atributo_id, arbol_id))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'ok': True}), 200