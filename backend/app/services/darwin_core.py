"""
darwin_core.py — Mapeo a Darwin Core (DwC) para JARBOTAV3 / JARBOTA
Estándar: https://dwc.tdwg.org/terms/
Perfil: Occurrence core
Autor: Adrián Ordoñez
"""

from typing import Any, Dict, List, Optional


# --- Constantes institucionales ---------------------------------------------
INSTITUTION_CODE = "JARBOTA"
COLLECTION_CODE = "TREE"
COUNTRY_CODE = "CO"
GEODETIC_DATUM = "WGS84"
LOCALITY_DEFAULT = "Jardín Botánico JARBOTA"
BASIS_OF_RECORD = "HumanObservation"


def _to_float(value: Any) -> Optional[float]:
    """Convierte a float de forma segura. Devuelve None si no es numérico."""
    if value is None or value == "":
        return None
    try:
        return round(float(value), 6)
    except (TypeError, ValueError):
        return None


def _to_iso_date(value: Any) -> Optional[str]:
    """Devuelve la fecha en formato ISO 8601 (YYYY-MM-DD) si es posible."""
    if value is None:
        return None
    s = str(value)
    return s[:10] if len(s) >= 10 else s


def mapear_a_darwin_core(arboles_db: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Mapea una lista de árboles (dicts provenientes de MySQL) al estándar
    Darwin Core (Occurrence core).

    Las claves esperadas del diccionario de entrada son las columnas reales
    de la tabla `arboles` y su JOIN con `especies`:
        MedicionArbolID, CodigoArbol, FechaRegistro,
        NombreCientifico, Familia, Genero,
        Latitud, Longitud, Altitud, Sitio,
        DAP_M, AlturaTotal_Mts, DensidadMadera,
        BiomasaAerea_kg, Carbono_kg, CO2e_kg,
        NDVI, EstadoSanitario
    """
    dwc_records: List[Dict[str, Any]] = []

    for arbol in arboles_db:
        arbol_id = arbol.get("MedicionArbolID")
        if arbol_id is None:
            # Sin ID no es un occurrence válido
            continue

        record: Dict[str, Any] = {
            # --- Identificadores ---
            "dwc:occurrenceID": f"urn:catalog:{INSTITUTION_CODE}:{COLLECTION_CODE}:{arbol_id}",
            "dwc:organismID": arbol.get("CodigoArbol"),
            "dwc:basisOfRecord": BASIS_OF_RECORD,

            # --- Evento ---
            "dwc:eventDate": _to_iso_date(arbol.get("FechaRegistro")),

            # --- Taxonomía ---
            "dwc:scientificName": arbol.get("NombreCientifico") or "Indet.",
            "dwc:family": arbol.get("Familia"),
            "dwc:genus": arbol.get("Genero"),

            # --- Georreferenciación ---
            "dwc:decimalLatitude": _to_float(arbol.get("Latitud")),
            "dwc:decimalLongitude": _to_float(arbol.get("Longitud")),
            "dwc:geodeticDatum": GEODETIC_DATUM,
            "dwc:minimumElevationInMeters": _to_float(arbol.get("Altitud")),
            "dwc:countryCode": COUNTRY_CODE,
            "dwc:locality": arbol.get("Sitio") or LOCALITY_DEFAULT,

            # --- Mediciones extendidas (dasometría + servicios ecosistémicos) ---
            "dwc:dynamicProperties": {
                "dap_m": _to_float(arbol.get("DAP_M")),
                "altura_m": _to_float(arbol.get("AlturaTotal_Mts")),
                "densidad_madera_g_cm3": _to_float(arbol.get("DensidadMadera")),
                "agb_kg": _to_float(arbol.get("BiomasaAerea_kg")),
                "carbono_kg": _to_float(arbol.get("Carbono_kg")),
                "co2e_kg": _to_float(arbol.get("CO2e_kg")),
                "ndvi": _to_float(arbol.get("NDVI")),
                "estado_sanitario": arbol.get("EstadoSanitario"),
            },
        }

        # Eliminar claves con valor None (opcional, recomendado para DwC-A)
        record = {k: v for k, v in record.items() if v is not None}

        dwc_records.append(record)

    return dwc_records


def mapear_a_darwin_core_csv(arboles_db: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Igual que `mapear_a_darwin_core` pero aplana `dynamicProperties`
    para exportación directa a CSV / DwC-A (`occurrence.txt`).
    """
    planos = mapear_a_darwin_core(arboles_db)
    filas = []
    for rec in planos:
        props = rec.pop("dwc:dynamicProperties", {}) or {}
        fila = {**rec, **props}
        filas.append(fila)
    return filas