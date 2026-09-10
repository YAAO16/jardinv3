from flask import Blueprint, request, jsonify
from app.middleware.auth_middleware import require_auth, require_permission
from app.database import get_connection

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')

@admin_bp.route('/estructura/<tabla>', methods=['GET'])
@require_auth
@require_permission('administracion_ver')
def get_estructura(tabla):
    tablas_permitidas = ['Info_arboles', 'Especies', 'Usuarios', 'Roles']
    if tabla not in tablas_permitidas:
        return jsonify({'error': 'Tabla no permitida'}), 403
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(f"SHOW COLUMNS FROM {tabla}")
    columnas = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(columnas)

@admin_bp.route('/estructura/<tabla>/columna', methods=['POST'])
@require_auth
@require_permission('administracion_editar')
def agregar_columna(tabla):
    tablas_permitidas = ['Info_arboles', 'Especies', 'Usuarios']
    if tabla not in tablas_permitidas:
        return jsonify({'error': 'Tabla no permitida'}), 403

    data = request.json
    nombre = data.get('nombre')
    tipo = data.get('tipo')
    nullable = data.get('nullable', True)
    default = data.get('default', None)

    if not nombre or not tipo:
        return jsonify({'error': 'Faltan nombre o tipo de columna'}), 400

    # Validar que no exista
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(f"SHOW COLUMNS FROM {tabla} LIKE %s", (nombre,))
    existe = cursor.fetchone()
    if existe:
        cursor.close()
        conn.close()
        return jsonify({'error': f'La columna {nombre} ya existe'}), 400

    # Construir SQL
    sql = f"ALTER TABLE {tabla} ADD COLUMN {nombre} {tipo}"
    if not nullable:
        sql += " NOT NULL"
    if default is not None and str(default).strip() != '':
        sql += f" DEFAULT {default}"

    try:
        cursor.execute(sql)
        conn.commit()
        return jsonify({'message': f'Columna {nombre} agregada exitosamente'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@admin_bp.route('/estructura/<tabla>/columna/<columna>', methods=['PUT'])
@require_auth
@require_permission('administracion_editar')
def editar_columna(tabla, columna):
    tablas_permitidas = ['Info_arboles', 'Especies', 'Usuarios']
    if tabla not in tablas_permitidas:
        return jsonify({'error': 'Tabla no permitida'}), 403

    data = request.json
    nuevo_nombre = data.get('nuevo_nombre')
    nuevo_tipo = data.get('nuevo_tipo')
    nueva_nullable = data.get('nueva_nullable', True)
    nuevo_default = data.get('nuevo_default', None)

    if not nuevo_nombre and not nuevo_tipo:
        return jsonify({'error': 'Debe proporcionar al menos un cambio'}), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # Si se cambia el nombre
    if nuevo_nombre and nuevo_nombre != columna:
        # Verificar que el nuevo nombre no exista
        cursor.execute(f"SHOW COLUMNS FROM {tabla} LIKE %s", (nuevo_nombre,))
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({'error': f'La columna {nuevo_nombre} ya existe'}), 400
        try:
            cursor.execute(f"ALTER TABLE {tabla} CHANGE COLUMN {columna} {nuevo_nombre} {nuevo_tipo or 'VARCHAR(255)'}")
            columna = nuevo_nombre  # actualizar el nombre para los siguientes cambios
        except Exception as e:
            cursor.close()
            conn.close()
            return jsonify({'error': str(e)}), 500

    # Si se cambia el tipo o default
    if nuevo_tipo:
        # Obtener el tipo actual si no se cambió el nombre
        if not nuevo_nombre or nuevo_nombre == columna:
            sql = f"ALTER TABLE {tabla} MODIFY COLUMN {columna} {nuevo_tipo}"
            if not nueva_nullable:
                sql += " NOT NULL"
            if nuevo_default is not None and str(nuevo_default).strip() != '':
                sql += f" DEFAULT {nuevo_default}"
            try:
                cursor.execute(sql)
                conn.commit()
            except Exception as e:
                cursor.close()
                conn.close()
                return jsonify({'error': str(e)}), 500

    cursor.close()
    conn.close()
    return jsonify({'message': f'Columna {columna} actualizada correctamente'}), 200

@admin_bp.route('/estructura/<tabla>/columna/<columna>', methods=['DELETE'])
@require_auth
@require_permission('administracion_editar')
def eliminar_columna(tabla, columna):
    tablas_permitidas = ['Info_arboles', 'Especies', 'Usuarios']
    if tabla not in tablas_permitidas:
        return jsonify({'error': 'Tabla no permitida'}), 403

    # Validar que la columna existe
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(f"SHOW COLUMNS FROM {tabla} LIKE %s", (columna,))
    existe = cursor.fetchone()
    if not existe:
        cursor.close()
        conn.close()
        return jsonify({'error': f'La columna {columna} no existe'}), 404

    # No permitir eliminar columnas clave o esenciales
    if columna in ['MedicionArbolID', 'EspecieID', 'UsuarioID', 'RolID']:
        cursor.close()
        conn.close()
        return jsonify({'error': 'No se puede eliminar esta columna'}), 403

    try:
        cursor.execute(f"ALTER TABLE {tabla} DROP COLUMN {columna}")
        conn.commit()
        return jsonify({'message': f'Columna {columna} eliminada exitosamente'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()