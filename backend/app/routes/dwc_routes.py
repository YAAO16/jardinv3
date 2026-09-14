from flask import Blueprint, jsonify, request
from models.arbol import ArbolModel

dwc_bp = Blueprint('dwc', __name__, url_prefix='/api/v1/dwc')

@dwc_bp.route('/occurrences', methods=['GET'])
def get_darwin_core_occurrences():
    """
    Exporta el inventario forestal en formato compatible con Darwin Core (DwC-A JSON).
    """
    try:
        arboles = ArbolModel.obtener_todos_los_arboles()
        dwc_records = []

        for arbol in arboles:
            record = {
                "dwc:occurrenceID": f"urn:jarbotav3:arbol:{arbol.get('MedicionArbolID')}",
                "dwc:organismID": arbol.get("CodigoArbol"),
                "dwc:basisOfRecord": "HumanObservation",
                "dwc:eventDate": str(arbol.get("FechaRegistro")),
                "dwc:scientificName": arbol.get("NombreCientifico"),
                "dwc:family": arbol.get("Familia"),
                "dwc:decimalLatitude": float(arbol.get("Latitud")) if arbol.get("Latitud") else None,
                "dwc:decimalLongitude": float(arbol.get("Longitud")) if arbol.get("Longitud") else None,
                "dwc:geodeticDatum": "WGS84",
                "dwc:countryCode": "CO",
                "dwc:locality": "Jardín Botánico JARBOTA",
                "dwc:dynamicProperties": {
                    "dap_cm": float(arbol.get("DAP_M", 0)) * 100,
                    "altura_m": float(arbol.get("AlturaTotal_Mts", 0)),
                    "estado_fitosanitario": arbol.get("EstadoFitosanitario")
                }
            }
            dwc_records.append(record)

        return jsonify({
            "status": "success",
            "count": len(dwc_records),
            "data": dwc_records
        }), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500