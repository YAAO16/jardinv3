from flask import Blueprint, request, jsonify
from app.services.alometrico import calcular_servicios_ecosistemicos
from app.services.estadistica import calcular_puntaje_sus, ejecutar_prueba_t_latencia
# Asegúrate de importar mapear_a_darwin_core o generar_darwin_core_archive según corresponda:
from app.services.darwin_core import mapear_a_darwin_core

api_v2 = Blueprint('api_v2', __name__)

@api_v2.route('/arboles/sincronizar-lote', methods=['POST'])
def sincronizar_lote():
    """
    Endpoint para PWA / Offline Sync (IndexedDB -> Backend).
    Recibe un arreglo de árboles censados en campo sin conexión.
    """
    datos = request.get_json()
    registros = datos.get("arboles", [])
    
    procesados = []
    for reg in registros:
        dap = float(reg.get("DAP_M", 0))
        altura = float(reg.get("AlturaTotal_Mts", 0))
        densidad = float(reg.get("DensidadMadera", 0.6))
        
        # Cálculo automático de biomasa y CO2e
        alometria = calcular_servicios_ecosistemicos(dap, altura, densidad)
        reg.update(alometria)
        
        # AQUÍ: Guardar 'reg' en MySQL (db.session.add(...) / SQL query)
        procesados.append(reg)
        
    return jsonify({
        "status": "success",
        "registros_sincronizados": len(procesados),
        "data": procesados
    }), 201

@api_v2.route('/exportar/darwin-core', methods=['GET'])
def exportar_darwin_core():
    """
    Exportación de biodiversidad compatible con SiB Colombia / GBIF.
    """
    # AQUÍ: Obtener registros reales de MySQL
    registros_ejemplo = [
        {
            "MedicionArbolID": 101,
            "NombreCientifico": "Cedrela odorata",
            "NombreComun": "Cedro amargo",
            "Latitud": 1.1523,
            "Longitud": -76.6521,
            "EstadoSanitario": "Bueno",
            "DAP_M": 35.5,
            "AlturaTotal_Mts": 18.2,
            "agb_kg": 450.2,
            "co2e_kg": 775.8
        }
    ]
    resultado_dwc = mapear_a_darwin_core(registros_ejemplo)
    return jsonify(resultado_dwc), 200

@api_v2.route('/reportes/usabilidad-sus', methods=['POST'])
def obtener_reporte_sus():
    """
    Calcula la métrica psicométrica SUS.
    Matriz esperada: {"encuestas": [[5,1,5,2,4,1,5,2,4,1], ...]}
    """
    datos = request.get_json()
    encuestas = datos.get("encuestas", [])
    resultado = calcular_puntaje_sus(encuestas)
    return jsonify(resultado), 200

@api_v2.route('/reportes/estadistica-latencia', methods=['POST'])
def obtener_estadistica_latencia():
    """
    Calcula t-Student pareada, IC 95% y d de Cohen sobre tiempos de latencia (segundos).
    Payload: {"tradicional": [120, 150, 140], "websig": [35, 40, 30]}
    """
    datos = request.get_json()
    tradicional = datos.get("tradicional", [])
    websig = datos.get("websig", [])
    
    if len(tradicional) != len(websig) or len(tradicional) < 2:
        return jsonify({"error": "Se requieren listas del mismo tamaño (>1 elementos)"}), 400
        
    resultado = ejecutar_prueba_t_latencia(tradicional, websig)
    return jsonify(resultado), 200