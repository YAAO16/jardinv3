
def mapear_a_darwin_core(arboles_db: list) -> list:
    """
    Mapea la lista de árboles obtenida de MySQL al estándar Darwin Core (DwC).
    """
    dwc_records = []
    for arbol in arboles_db:
        record = {
            "occurrenceID": f"urn:catalog:JARBOTAV:TREE:{arbol.get('id')}",
            "basisOfRecord": "LivingSpecimen",
            "scientificName": arbol.get("nombre_cientifico", "Indet."),
            "decimalLatitude": arbol.get("latitud"),
            "decimalLongitude": arbol.get("longitud"),
            "coordinateUncertaintyInMeters": arbol.get("precision_gps", 5.0),
            "verbatimElevation": arbol.get("altitud"),
            "eventDate": arbol.get("fecha_registro"),
            "individualCount": 1
        }
        dwc_records.append(record)
    return dwc_records