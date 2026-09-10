import os
from dotenv import load_dotenv
from sentinelhub import (
    SHConfig, BBox, CRS, MimeType, SentinelHubRequest, DataCollection, bbox_to_dimensions,
)
import numpy as np
from datetime import datetime, timedelta

load_dotenv()

config = SHConfig()
config.sh_client_id = os.getenv('SENTINEL_CLIENT_ID')
config.sh_client_secret = os.getenv('SENTINEL_CLIENT_SECRET')
config.sh_base_url = 'https://sh.dataspace.copernicus.eu'
config.sh_token_url = 'https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token'


# ============ EVALSCRIPT ============
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
    
    // Excluir nubes, sombras, agua, nieve y píxeles sin datos
    if (scl === 0 || scl === 1 || scl === 3 || scl === 6 || 
        scl === 8 || scl === 9 || scl === 10 || scl === 11) {
        return [NaN, scl];
    }
    
    let ndvi = (sample.B08 - sample.B04) / (sample.B08 + sample.B04);
    return [ndvi, scl];
}
"""


def calcular_ndvi_promedio(lat, lon, radio_metros=100, fecha_desde=None, fecha_hasta=None):
    """
    Calcula el NDVI promedio en un radio alrededor de (lat, lon).
    Usa un radio más grande (100m por defecto) para asegurar vegetación representativa.
    """
    try:
        # Rango de 1 año para tener más imágenes limpias
        if not fecha_hasta:
            fecha_hasta = datetime.now().strftime('%Y-%m-%d')
        if not fecha_desde:
            fecha_desde = (datetime.now() - timedelta(days=365)).strftime('%Y-%m-%d')

        # ⚠️ Radio de 100m por defecto (antes 20-30m) para evitar bordes
        delta = radio_metros / 111320
        bbox = BBox(
            [lon - delta, lat - delta, lon + delta, lat + delta],
            crs=CRS.WGS84
        )
        size = bbox_to_dimensions(bbox, resolution=10)  # 10m/píxel
        # Forzar mínimo de 20x20 píxeles
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
                    maxcc=0.3  # 30% de nubes como máximo
                )
            ],
            responses=[SentinelHubRequest.output_response('default', MimeType.TIFF)],
            bbox=bbox,
            size=size,
            config=config
        )

        data = request.get_data()
        if not data or len(data) == 0:
            return None, None, 'No se obtuvieron datos del satélite'

        imagen = data[0]
        
        # ⚠️ La imagen viene con shape (height, width, bands)
        # bands = 2 → [NDVI, SCL]
        ndvi_array = imagen[:, :, 0]
        scl_array = imagen[:, :, 1]
        
        # Filtrar solo píxeles válidos (no NaN y con NDVI en rango)
        mascara_valida = np.isfinite(ndvi_array)
        valores = ndvi_array[mascara_valida]
        
        # Filtrar rango NDVI válido
        valores = valores[(valores >= -1) & (valores <= 1)]
        
        if len(valores) == 0:
            # Diagnóstico adicional
            scl_unicos, counts = np.unique(scl_array[~np.isnan(scl_array)].astype(int), return_counts=True)
            return None, None, f'Sin píxeles válidos. SCL presente: {dict(zip(scl_unicos.tolist(), counts.tolist()))}'

        ndvi_promedio = float(np.mean(valores))
        return round(ndvi_promedio, 4), fecha_hasta, None

    except Exception as e:
        return None, None, f'Error al calcular NDVI: {str(e)}'