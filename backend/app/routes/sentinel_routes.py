from flask import Blueprint, jsonify, request
from app.database import get_connection
from app.services.sentinel_service import calcular_ndvi_promedio
from datetime import datetime

sentinel_bp = Blueprint('sentinel', __name__, url_prefix='/sentinel')


@sentinel_bp.route('/ndvi/<int:arbol_id>', methods=['POST'])
def calcular_ndvi_arbol(arbol_id):
    """Calcula el NDVI de un árbol específico usando Sentinel-2 y lo guarda."""
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        "SELECT Latitud, Longitud, NumeroArbol FROM Info_arboles WHERE MedicionArbolID = %s",
        (arbol_id,)
    )
    arbol = cursor.fetchone()

    if not arbol:
        cursor.close()
        conn.close()
        return jsonify({'error': 'Árbol no encontrado'}), 404

    lat = arbol.get('Latitud')
    lon = arbol.get('Longitud')

    if lat is None or lon is None:
        cursor.close()
        conn.close()
        return jsonify({'error': 'El árbol no tiene coordenadas registradas'}), 400

    ndvi, fecha_img, error = calcular_ndvi_promedio(float(lat), float(lon))

    if error:
        cursor.close()
        conn.close()
        return jsonify({'error': error}), 500

    cursor.execute("""
        UPDATE Info_arboles
        SET NDVI = %s, NDVI_fecha = %s
        WHERE MedicionArbolID = %s
    """, (ndvi, fecha_img, arbol_id))
    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({
        'ok': True,
        'arbol_id': arbol_id,
        'numero_arbol': arbol['NumeroArbol'],
        'ndvi': ndvi,
        'fecha_imagen': fecha_img
    }), 200


@sentinel_bp.route('/ndvi/bulk', methods=['POST'])
def calcular_ndvi_bulk():
    """Calcula el NDVI para todos los árboles sin NDVI registrado."""
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT MedicionArbolID, NumeroArbol, Latitud, Longitud
        FROM Info_arboles
        WHERE Latitud IS NOT NULL AND Longitud IS NOT NULL
          AND (NDVI IS NULL OR NDVI_fecha IS NULL)
    """)
    arboles = cursor.fetchall()

    if not arboles:
        cursor.close()
        conn.close()
        return jsonify({
            'ok': True,
            'mensaje': 'No hay árboles pendientes',
            'procesados': 0,
            'total': 0,
            'errores': []
        }), 200

    procesados = 0
    errores = []
    resultados = []

    for arbol in arboles:
        try:
            ndvi, fecha_img, error = calcular_ndvi_promedio(
                float(arbol['Latitud']),
                float(arbol['Longitud'])
            )
            if error:
                errores.append({
                    'arbol_id': arbol['MedicionArbolID'],
                    'numero': arbol['NumeroArbol'],
                    'error': error
                })
                continue

            cursor.execute("""
                UPDATE Info_arboles
                SET NDVI = %s, NDVI_fecha = %s
                WHERE MedicionArbolID = %s
            """, (ndvi, fecha_img, arbol['MedicionArbolID']))
            procesados += 1
            resultados.append({
                'arbol_id': arbol['MedicionArbolID'],
                'numero': arbol['NumeroArbol'],
                'ndvi': ndvi
            })

        except Exception as e:
            errores.append({
                'arbol_id': arbol['MedicionArbolID'],
                'numero': arbol['NumeroArbol'],
                'error': str(e)
            })

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({
        'ok': True,
        'procesados': procesados,
        'total': len(arboles),
        'resultados': resultados,
        'errores': errores
    }), 200


@sentinel_bp.route('/estadisticas', methods=['GET'])
def estadisticas_ndvi():
    """Devuelve estadísticas del NDVI agrupadas por estado sanitario."""
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT 
            EstadoSanitario,
            COUNT(*) AS total_arboles,
            AVG(NDVI) AS ndvi_promedio,
            MIN(NDVI) AS ndvi_min,
            MAX(NDVI) AS ndvi_max
        FROM Info_arboles
        WHERE NDVI IS NOT NULL
        GROUP BY EstadoSanitario
    """)
    datos = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(datos), 200