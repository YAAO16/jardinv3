from flask import Blueprint, jsonify
from app.database import get_connection

reportes_bp = Blueprint('reportes', __name__, url_prefix='/reportes')

# 1. Variables disponibles para los gráficos
@reportes_bp.route('/variables', methods=['GET'])
def get_variables():
    variables = [
        {'id': 'DAP_M', 'nombre': 'DAP (m)', 'tipo': 'numerica'},
        {'id': 'AlturaTotal_Mts', 'nombre': 'Altura Total (m)', 'tipo': 'numerica'},
        {'id': 'BiomasaAerea_kg', 'nombre': 'Biomasa Aérea (kg)', 'tipo': 'numerica'},
        {'id': 'CO2e_kg', 'nombre': 'CO₂e (kg)', 'tipo': 'numerica'},
        {'id': 'NombreComun', 'nombre': 'Especie', 'tipo': 'categorica'},
        {'id': 'EstadoSanitario', 'nombre': 'Estado Sanitario', 'tipo': 'categorica'},
        {'id': 'Categoria', 'nombre': 'Categoría de Especie', 'tipo': 'categorica'},
    ]
    return jsonify(variables)

# 2. Datos para los gráficos
@reportes_bp.route('/datos', methods=['GET'])
def get_datos_reporte():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT a.DAP_M, a.AlturaTotal_Mts, a.BiomasaAerea_kg, a.CO2e_kg,
               a.EstadoSanitario, e.NombreComun, e.Categoria
        FROM Info_arboles a
        INNER JOIN Especies e ON a.EspecieID = e.EspecieID
    """)
    datos = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(datos)

# 3. ⚠️ ESTA ES LA RUTA QUE FALTABA PARA EL DASHBOARD
@reportes_bp.route('/estadisticas-generales', methods=['GET'])
def estadisticas_generales():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # Total de árboles
    cursor.execute("SELECT COUNT(*) AS total FROM Info_arboles")
    total_arboles = cursor.fetchone()['total']

    # Total de especies
    cursor.execute("SELECT COUNT(*) AS total FROM Especies")
    total_especies = cursor.fetchone()['total']

    # Suma de biomasa y carbono
    cursor.execute("SELECT COALESCE(SUM(BiomasaAerea_kg), 0) AS biomasa, COALESCE(SUM(Carbono_kg), 0) AS carbono FROM Info_arboles")
    suma = cursor.fetchone()
    biomasa_total = suma['biomasa'] or 0
    carbono_total = suma['carbono'] or 0

    # Promedios (DAP y Altura)
    cursor.execute("SELECT AVG(DAP_M) AS dap, AVG(AlturaTotal_Mts) AS altura FROM Info_arboles")
    promedios = cursor.fetchone()
    dap_promedio = promedios['dap'] or 0
    altura_promedio = promedios['altura'] or 0

    # Volumen y área basal (si tienes esas columnas)
    cursor.execute("SELECT COALESCE(SUM(VolumenTotal_M3), 0) AS volumen FROM Info_arboles")
    volumen_total = cursor.fetchone()['volumen'] or 0
    cursor.execute("SELECT COALESCE(SUM(AreaBasal_M2), 0) AS area FROM Info_arboles")
    area_basal_total = cursor.fetchone()['area'] or 0

    cursor.close()
    conn.close()

    # Devuelve los campos que el Dashboard espera (sin "_m" al final)
    return jsonify({
        'total_arboles': total_arboles,
        'total_especies': total_especies,
        'biomasa_total': biomasa_total,
        'carbono_total': carbono_total,
        'dap_promedio': round(dap_promedio, 3),
        'altura_promedio': round(altura_promedio, 2),
        'volumen_total_m3': volumen_total,
        'area_basal_total_m2': area_basal_total
    })