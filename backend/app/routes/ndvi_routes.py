from flask import Blueprint, jsonify, request
from datetime import datetime
from app.database import get_connection
from app.services.sentinel_service import calcular_ndvi_promedio

ndvi_bp = Blueprint('ndvi', __name__)


# ============ 1. NDVI POR COORDENADAS (ya funciona) ============
@ndvi_bp.route('/ndvi/<string:latitud>/<string:longitud>', methods=['GET'])
def obtener_ndvi(latitud, longitud):
    """Obtiene el NDVI para una coordenada (lat, lon) usando Sentinel-2."""
    try:
        lat = float(latitud)
        lon = float(longitud)
    except (ValueError, TypeError):
        return jsonify({'error': 'Coordenadas inválidas'}), 400

    if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
        return jsonify({'error': 'Coordenadas fuera de rango'}), 400

    try:
        ndvi, fecha_img, error = calcular_ndvi_promedio(lat, lon)
        if error:
            return jsonify({'error': error, 'latitud': lat, 'longitud': lon}), 500

        return jsonify({
            'latitud': lat,
            'longitud': lon,
            'ndvi': ndvi,
            'fecha': str(fecha_img) if fecha_img else datetime.now().isoformat(),
            'fuente': 'Sentinel-2 L2A'
        }), 200
    except Exception as e:
        return jsonify({'error': f'Error al calcular NDVI: {str(e)}'}), 500


# ============ 2. CALCULAR Y GUARDAR NDVI DE UN ÁRBOL ============
@ndvi_bp.route('/ndvi/arbol/<int:arbol_id>', methods=['POST'])
def calcular_ndvi_arbol(arbol_id):
    """
    Calcula el NDVI de un árbol específico (usando sus coordenadas en la BD)
    y lo guarda en la columna NDVI.
    """
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
        'latitud': float(lat),
        'longitud': float(lon),
        'ndvi': ndvi,
        'fecha_imagen': str(fecha_img)
    }), 200


# ============ 3. CALCULAR NDVI MASIVO ============
@ndvi_bp.route('/ndvi/bulk', methods=['POST'])
def calcular_ndvi_bulk():
    """Calcula el NDVI para todos los árboles sin NDVI registrado."""
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT MedicionArbolID, NumeroArbol, Latitud, Longitud
        FROM Info_arboles
        WHERE Latitud IS NOT NULL AND Longitud IS NOT NULL
          AND (NDVI IS NULL OR NDVI_fecha IS NULL)
        ORDER BY MedicionArbolID
    """)
    arboles = cursor.fetchall()

    if not arboles:
        cursor.close()
        conn.close()
        return jsonify({
            'ok': True,
            'mensaje': 'No hay árboles pendientes por procesar',
            'procesados': 0,
            'total': 0,
            'resultados': [],
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
            conn.commit()  # Commit por cada árbol para no perder datos
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

    cursor.close()
    conn.close()

    return jsonify({
        'ok': True,
        'procesados': procesados,
        'total': len(arboles),
        'resultados': resultados,
        'errores': errores
    }), 200


# ============ 4. ESTADÍSTICAS NDVI vs ESTADO SANITARIO ============
@ndvi_bp.route('/ndvi/estadisticas', methods=['GET'])
def estadisticas_ndvi():
    """
    Devuelve estadísticas del NDVI agrupadas por estado sanitario.
    Útil para el análisis académico de correlación.
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT 
            EstadoSanitario,
            COUNT(*) AS total_arboles,
            ROUND(AVG(NDVI), 4) AS ndvi_promedio,
            ROUND(MIN(NDVI), 4) AS ndvi_min,
            ROUND(MAX(NDVI), 4) AS ndvi_max,
            ROUND(STDDEV(NDVI), 4) AS ndvi_desviacion
        FROM Info_arboles
        WHERE NDVI IS NOT NULL
        GROUP BY EstadoSanitario
        ORDER BY ndvi_promedio DESC
    """)
    datos = cursor.fetchall()

    cursor.execute("""
        SELECT 
            MedicionArbolID, NumeroArbol, EstadoSanitario, NDVI, NDVI_fecha
        FROM Info_arboles
        WHERE NDVI IS NOT NULL
        ORDER BY EstadoSanitario, NDVI DESC
    """)
    detalle = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify({
        'resumen': datos,
        'detalle': detalle,
        'total_con_ndvi': len(detalle)
    }), 200