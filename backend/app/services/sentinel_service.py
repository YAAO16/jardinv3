import os
import math
import logging
import numpy as np
from datetime import datetime, timedelta
from typing import Tuple, Optional, Dict, Any
from dotenv import load_dotenv

logger = logging.getLogger(__name__)
load_dotenv()

# Carga condicional de sentinelhub para evitar bloqueos en entornos de prueba
try:
    from sentinelhub import (
        SHConfig, BBox, CRS, MimeType, SentinelHubRequest, DataCollection, bbox_to_dimensions
    )
    HAS_SENTINELHUB = True
except ImportError:
    HAS_SENTINELHUB = False
    logger.warning("La librería 'sentinelhub' no está disponible en el entorno activo.")

# Configuración del cliente Copernicus Data Space Ecosystem (CDSE)
if HAS_SENTINELHUB:
    config = SHConfig()
    config.sh_client_id = os.getenv('SENTINEL_CLIENT_ID', '')
    config.sh_client_secret = os.getenv('SENTINEL_CLIENT_SECRET', '')
    config.sh_base_url = 'https://sh.dataspace.copernicus.eu'
    config.sh_token_url = 'https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token'
else:
    config = None

# EVALSCRIPT para procesamiento en la nube de Sentinel Hub (B04, B08 y SCL)
EVALSCRIPT_NDVI = """
//VERSION=3
function setup() {
    return {
        input: ["B04", "B08", "SCL", "dataMask"],
        output: { bands: 2, sampleType: "FLOAT32" }
    };
}

function evaluatePixel(sample) {
    let scl = sample.SCL;
    
    // Filtrar no vegetación, sombras, nubes y píxeles no válidos
    // SCL: 0=No Data, 1=Satura/Defect, 3=Sombra, 6=Agua, 8=Nube Med, 9=Nube Alta, 10=Cirrus, 11=Nieve
    if (scl === 0 || scl === 1 || scl === 3 || scl === 6 || 
        scl === 8 || scl === 9 || scl === 10 || scl === 11) {
        return [NaN, scl];
    }
    
    let ndvi = (sample.B08 - sample.B04) / (sample.B08 + sample.B04);
    return [ndvi, scl];
}
"""

class SentinelService:
    @staticmethod
    def clasificar_salud_dosel(ndvi: Optional[float]) -> str:
        """Categoriza el valor de NDVI según el estado de vitalidad del dosel."""
        if ndvi is None:
            return "Sin Datos"
        if ndvi >= 0.70:
            return "Excelente / Vigoroso"
        elif ndvi >= 0.50:
            return "Bueno"
        elif ndvi >= 0.30:
            return "Regular / Estrés Hídrico"
        else:
            return "Crítico / Malo"

    @classmethod
    def calcular_ndvi_promedio(
        cls, 
        lat: float, 
        lon: float, 
        radio_metros: float = 100.0, 
        fecha_desde: Optional[str] = None, 
        fecha_hasta: Optional[str] = None
    ) -> Tuple[Optional[float], Optional[str], Optional[str]]:
        """
        Calcula el NDVI medio del dosel alrededor de una coordenada puntual.
        Retorna: (ndvi_promedio, fecha_consulta, mensaje_error)
        """
        if not HAS_SENTINELHUB:
            return None, None, "Módulo sentinelhub no instalado en el entorno"

        try:
            if not lat or not lon or not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
                return None, None, "Coordenadas geográficas inválidas"

            # Ventana temporal por defecto: Últimos 365 días
            if not fecha_hasta:
                fecha_hasta = datetime.now().strftime('%Y-%m-%d')
            if not fecha_desde:
                fecha_desde = (datetime.now() - timedelta(days=365)).strftime('%Y-%m-%d')

            # Buffer en grados decimales (111,320 metros por grado aprox.)
            delta = radio_metros / 111320.0
            bbox = BBox(
                [lon - delta, lat - delta, lon + delta, lat + delta],
                crs=CRS.WGS84
            )
            
            # Resolución de 10m/píxel con dimensión mínima de 20x20 píxeles
            size = bbox_to_dimensions(bbox, resolution=10)
            size = (max(size[0], 20), max(size[1], 20))

            request = SentinelHubRequest(
                evalscript=EVALSCRIPT_NDVI,
                input_data=[
                    SentinelHubRequest.input_data(
                        data_collection=DataCollection.SENTINEL2_L2A.define_from(
                            's2l2a', service_url=config.sh_base_url
                        ),
                        time_interval=(fecha_desde, fecha_hasta),
                        mosaicking_order='leastCC',
                        maxcc=0.30  # Cobertura de nubes máxima del 30%
                    )
                ],
                responses=[SentinelHubRequest.output_response('default', MimeType.TIFF)],
                bbox=bbox,
                size=size,
                config=config
            )

            data = request.get_data()
            if not data or len(data) == 0:
                return None, None, "No se obtuvieron imágenes válidas de Sentinel-2 CDSE"

            imagen = data[0]
            ndvi_array = imagen[:, :, 0]
            scl_array = imagen[:, :, 1]

            # Filtrar valores no numéricos (NaN) y restringir al rango físico del NDVI [-1, 1]
            mascara_valida = np.isfinite(ndvi_array)
            valores = ndvi_array[mascara_valida]
            valores = valores[(valores >= -1.0) & (valores <= 1.0)]

            if len(valores) == 0:
                scl_unicos, counts = np.unique(
                    scl_array[~np.isnan(scl_array)].astype(int), 
                    return_counts=True
                )
                diag = dict(zip(scl_unicos.tolist(), counts.tolist()))
                return None, None, f"Píxeles filtrados por nubosidad o sombras. Distribución SCL: {diag}"

            ndvi_promedio = round(float(np.mean(valores)), 4)
            return ndvi_promedio, fecha_hasta, None

        except Exception as e:
            return None, None, f"Excepción en procesamiento Sentinel Hub: {str(e)}"

    @classmethod
    def obtener_evaluacion_completa(cls, lat: float, lon: float) -> Dict[str, Any]:
        """Proporciona la evaluación de teledetección estructurada para el API REST."""
        ndvi, fecha, error = cls.calcular_ndvi_promedio(lat, lon)
        clasificacion = cls.clasificar_salud_dosel(ndvi)
        
        return {
            "latitud": lat,
            "longitud": lon,
            "ndvi_promedio": ndvi,
            "estado_dosel": clasificacion,
            "fecha_analisis": fecha,
            "error": error
        }