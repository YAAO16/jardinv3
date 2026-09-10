import os
from dotenv import load_dotenv
from sentinelhub import (
    SHConfig, BBox, CRS, MimeType, SentinelHubRequest, DataCollection, bbox_to_dimensions
)
import numpy as np

load_dotenv()

config = SHConfig()
config.sh_client_id = os.getenv('SENTINEL_CLIENT_ID')
config.sh_client_secret = os.getenv('SENTINEL_CLIENT_SECRET')
config.sh_base_url = 'https://sh.dataspace.copernicus.eu'
config.sh_token_url = 'https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token'

# Coordenadas de Manaus (selva amazónica densa)
lat, lon = -3.10, -60.00
delta = 30 / 111320
bbox = BBox([lon - delta, lat - delta, lon + delta, lat + delta], crs=CRS.WGS84)
size = bbox_to_dimensions(bbox, resolution=10)

# EvalScript de diagnóstico: devuelve B04, B08, NDVI y SCL
EVALSCRIPT_DIAG = """
//VERSION=3
function setup() {
    return {
        input: ["B04", "B08", "SCL", "dataMask"],
        output: { bands: 4, sampleType: "FLOAT32" }
    };
}
function evaluatePixel(sample) {
    let ndvi = (sample.B08 - sample.B04) / (sample.B08 + sample.B04);
    return [sample.B04, sample.B08, ndvi, sample.SCL];
}
"""

request = SentinelHubRequest(
    evalscript=EVALSCRIPT_DIAG,
    input_data=[
        SentinelHubRequest.input_data(
            data_collection=DataCollection.SENTINEL2_L2A.define_from(
                's2l2a', service_url=config.sh_base_url
            ),
            time_interval=('2024-06-01', '2024-09-30'),
            mosaicking_order='leastCC',
            maxcc=0.3
        )
    ],
    responses=[SentinelHubRequest.output_response('default', MimeType.TIFF)],
    bbox=bbox, size=size, config=config
)

data = request.get_data()[0]

# data tiene shape (4, height, width): [B04, B08, NDVI, SCL]
b04 = data[0]
b08 = data[1]
ndvi = data[2]
scl = data[3]

print("=" * 60)
print("DIAGNÓSTICO SENTINEL-2 (Manaus - Selva amazónica)")
print("=" * 60)
print(f"\nForma del array: {data.shape}")
print(f"\n--- Banda B04 (Rojo) ---")
print(f"  Min: {np.nanmin(b04):.4f}")
print(f"  Max: {np.nanmax(b04):.4f}")
print(f"  Media: {np.nanmean(b04):.4f}")
print(f"\n--- Banda B08 (NIR) ---")
print(f"  Min: {np.nanmin(b08):.4f}")
print(f"  Max: {np.nanmax(b08):.4f}")
print(f"  Media: {np.nanmean(b08):.4f}")
print(f"\n--- NDVI ---")
print(f"  Min: {np.nanmin(ndvi):.4f}")
print(f"  Max: {np.nanmax(ndvi):.4f}")
print(f"  Media: {np.nanmean(ndvi):.4f}")
print(f"\n--- SCL (clasificación de escena) ---")
unique, counts = np.unique(scl[~np.isnan(scl)].astype(int), return_counts=True)
nombres = {
    0: "NO_DATA", 1: "SATURATED", 2: "DARK_AREA", 3: "CLOUD_SHADOW",
    4: "VEGETATION", 5: "NOT_VEGETATED", 6: "WATER", 7: "UNCLASSIFIED",
    8: "CLOUD_MEDIUM", 9: "CLOUD_HIGH", 10: "THIN_CIRRUS", 11: "SNOW"
}
for u, c in zip(unique, counts):
    print(f"  SCL={u} ({nombres.get(u, '?')}): {c} píxeles")
print("=" * 60)