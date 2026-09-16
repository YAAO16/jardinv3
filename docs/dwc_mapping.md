# Mapeo Darwin Core — JBV3 / JARBOTA

**Estándar:** Darwin Core (DwC) — https://dwc.tdwg.org/terms/
**Perfil de uso:** Occurrence core
**Versión del mapeo:** 1.0.0
**Fecha:** 2026-09-16
**Autor:** Adrián Ordoñez

Este documento especifica la homologación entre las entidades de la base de
datos MySQL del sistema **JBV3 (JARBOTA)** y los términos del estándar
internacional **Darwin Core**, con el fin de garantizar la interoperabilidad
con **SiB Colombia** y **GBIF**.

---

## 1. Tabla de homologación principal

| Campo MySQL (tabla)         | Término Darwin Core          | URI DwC                                       | Tipo     | Obligatorio | Notas |
|-----------------------------|------------------------------|-----------------------------------------------|----------|-------------|-------|
| `MedicionArbolID` (arboles) | `dwc:occurrenceID`           | http://rs.tdwg.org/dwc/terms/occurrenceID     | string   | Sí          | Formato: `urn:catalog:JARBOTA:TREE:{id}` |
| `CodigoArbol` (arboles)     | `dwc:organismID`             | http://rs.tdwg.org/dwc/terms/organismID       | string   | No          | Identificador físico del árbol en campo |
| —                           | `dwc:basisOfRecord`          | http://rs.tdwg.org/dwc/terms/basisOfRecord    | string   | Sí          | Valor fijo: `HumanObservation` |
| `FechaRegistro` (arboles)   | `dwc:eventDate`              | http://rs.tdwg.org/dwc/terms/eventDate        | date     | Sí          | ISO 8601 (YYYY-MM-DD) |
| `NombreCientifico` (especies) | `dwc:scientificName`       | http://rs.tdwg.org/dwc/terms/scientificName   | string   | Sí          | Nombre binomial completo |
| `Familia` (especies)        | `dwc:family`                 | http://rs.tdwg.org/dwc/terms/family           | string   | No          | |
| `Genero` (especies)         | `dwc:genus`                  | http://rs.tdwg.org/dwc/terms/genus            | string   | No          | |
| `Latitud` (arboles)         | `dwc:decimalLatitude`        | http://rs.tdwg.org/dwc/terms/decimalLatitude  | decimal  | Sí          | Rango [-90, 90], WGS84 |
| `Longitud` (arboles)        | `dwc:decimalLongitude`       | http://rs.tdwg.org/dwc/terms/decimalLongitude | decimal  | Sí          | Rango [-180, 180], WGS84 |
| `EPSG:4326`                 | `dwc:geodeticDatum`          | http://rs.tdwg.org/dwc/terms/geodeticDatum    | string   | Sí          | Valor fijo: `WGS84` |
| `Altitud` (arboles)         | `dwc:minimumElevationInMeters` | http://rs.tdwg.org/dwc/terms/minimumElevationInMeters | decimal | No | Metros sobre el nivel del mar |
| —                           | `dwc:countryCode`            | http://rs.tdwg.org/dwc/terms/countryCode      | string   | Sí          | Valor fijo: `CO` |
| `Sitio` (arboles)           | `dwc:locality`               | http://rs.tdwg.org/dwc/terms/locality         | string   | No          | Ej.: "Jardín Botánico JARBOTA" |
| `DAP_M` (arboles)           | `dwc:dynamicProperties`      | http://rs.tdwg.org/dwc/terms/dynamicProperties | JSON   | No          | `{"dap_m": ..., "altura_m": ..., "agb_kg": ...}` |
| `AlturaTotal_Mts` (arboles) | `dwc:dynamicProperties`      | (idem)                                        | JSON     | No          | Integrado en el bloque anterior |
| `BiomasaAerea_kg` (arboles) | `dwc:dynamicProperties`      | (idem)                                        | JSON     | No          | |
| `Carbono_kg` (arboles)      | `dwc:dynamicProperties`      | (idem)                                        | JSON     | No          | |
| `CO2e_kg` (arboles)         | `dwc:dynamicProperties`      | (idem)                                        | JSON     | No          | |
| `NDVI` (arboles)            | `dwc:dynamicProperties`      | (idem)                                        | JSON     | No          | |
| `EstadoSanitario` (arboles) | `dwc:dynamicProperties`      | (idem)                                        | JSON     | No          | Bueno / Regular / Malo |
| `DensidadMadera` (arboles)  | `dwc:dynamicProperties`      | (idem)                                        | JSON     | No          | g/cm³ |

---

## 2. Ejemplo de registro DwC generado

```json
{
  "dwc:occurrenceID": "urn:catalog:JARBOTA:TREE:1234",
  "dwc:organismID": "ARB-0421",
  "dwc:basisOfRecord": "HumanObservation",
  "dwc:eventDate": "2026-03-14",
  "dwc:scientificName": "Cedrela odorata L.",
  "dwc:family": "Meliaceae",
  "dwc:genus": "Cedrela",
  "dwc:decimalLatitude": 4.612345,
  "dwc:decimalLongitude": -74.083421,
  "dwc:geodeticDatum": "WGS84",
  "dwc:countryCode": "CO",
  "dwc:locality": "Jardín Botánico JARBOTA",
  "dwc:dynamicProperties": {
    "dap_m": 0.42,
    "altura_m": 18.5,
    "densidad_madera_g_cm3": 0.55,
    "agb_kg": 1245.78,
    "carbono_kg": 585.52,
    "co2e_kg": 2146.91,
    "ndvi": 0.72,
    "estado_sanitario": "Bueno"
  }
}
```

---

## 3. Endpoints de exportación

| Endpoint                                | Método | Formato | Descripción |
|-----------------------------------------|--------|---------|-------------|
| `/api/v1/dwc/occurrences`               | GET    | JSON    | Occurrences DwC |
| `/api/v1/exportar/darwin-core`          | GET    | JSON    | Alias v2 |
| `/api/v1/exportar/darwin-core/csv`      | GET    | CSV     | Para carga directa a GBIF |
| `/api/v1/exportar/darwin-core/archive`  | GET    | ZIP     | **(Pendiente)** DwC Archive (occurrence.txt + meta.xml + eml.xml) |

---

## 4. Convenciones

- **Fechas**: ISO 8601 → `YYYY-MM-DD`.
- **Coordenadas**: WGS84 (EPSG:4326), decimales con 6 cifras.
- **Codificación**: UTF-8 sin BOM.
- **Separador CSV**: coma (`,`) con escape por comillas dobles.
- **Nulos**: cadena vacía en CSV, `null` en JSON (nunca `"None"` ni `"NaN"`).

---

## 5. Referencias

- Darwin Core Quick Reference: https://dwc.tdwg.org/terms/
- SiB Colombia — Publicación de datos: https://sibcolombia.net/publica/
- GBIF — DwC Archive: https://www.gbif.org/darwin-core
- TDWG — Guía de implementación: https://www.tdwg.org/standards/dwc/