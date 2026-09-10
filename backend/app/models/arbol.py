from app.database import get_connection
from app.utils.coordenadas import dms_to_dd
from app.utils.validators import validate_numeric
from app.services.alometrico import (
    calcular_biomasa_y_carbono,
    calcular_area_basal,
    calcular_dap_redondeado,
    calcular_volumen_total,
    to_float
)

def clean_boolean(value):
    if value is None:
        return 0
    if isinstance(value, bool):
        return 1 if value else 0
    if isinstance(value, (int, float)):
        return 1 if value else 0
    val_str = str(value).strip().lower()
    true_values = ["si", "sí", "yes", "true", "1", "x", "✔", "✓", "ok", "presente", "activo"]
    false_values = ["no", "false", "0", "", "-", "no aplica", "n/a", "null", "nan", "ausente"]
    if val_str in true_values:
        return 1
    if val_str in false_values:
        return 0
    return 0

class ArbolModel:

    @staticmethod
    def get_connection():
        return get_connection()

    @staticmethod
    def get_all():
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM Info_arboles")
        arboles = cursor.fetchall()
        cursor.close()
        conn.close()
        return arboles

    @staticmethod
    def get_by_id(arbol_id):
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT 
                a.*,
                e.NombreComun,
                e.NombreCientifico,
                e.Familia,
                e.Categoria
            FROM Info_arboles a
            INNER JOIN Especies e ON a.EspecieID = e.EspecieID
            WHERE a.MedicionArbolID = %s
        """, (arbol_id,))
        arbol = cursor.fetchone()
        cursor.close()
        conn.close()
        return arbol

    @staticmethod
    def create(data):
        conn = get_connection()
        cursor = conn.cursor()

        # ===== PROCESAR COORDENADAS =====
        latitud_dd = None
        longitud_dd = None

        # Si se envía en formato DMS (Latitud_DMS_Input)
        if data.get('Latitud_DMS_Input'):
            latitud_dd = dms_to_dd(data['Latitud_DMS_Input'])
        # Si se envía como decimal (Latitud)
        elif data.get('Latitud') is not None:
            latitud_dd = validate_numeric(data['Latitud'])

        if data.get('Longitud_DMS_Input'):
            longitud_dd = dms_to_dd(data['Longitud_DMS_Input'])
        elif data.get('Longitud') is not None:
            longitud_dd = validate_numeric(data['Longitud'])

        # ===== OBTENER VALORES BASE =====
        dap_m = validate_numeric(data.get('DAP_M'))
        altura_total = validate_numeric(data.get('AlturaTotal_Mts'))
        densidad_madera = validate_numeric(data.get('DensidadMadera'))
        factor = validate_numeric(data.get('Factor')) or 0.7

        # ===== CÁLCULOS =====
        biomasa, carbono, co2e = calcular_biomasa_y_carbono(dap_m, altura_total, densidad_madera)
        area_basal = calcular_area_basal(dap_m)
        dap_redondeado = calcular_dap_redondeado(dap_m)
        volumen_total = calcular_volumen_total(area_basal, altura_total, factor)
        volumen_comercial = validate_numeric(data.get('VolumenComercial_M3'))

        # ===== INSERT =====
        sql = """
            INSERT INTO Info_arboles (
                EspecieID, NumeroArbol, Factor, CAP_Cm, CAP_M, DAP_M, AlturaTotal_Mts, 
                AlturaComercial_Mts, AreaBasal_M2, DAP_M_REDONDEO, VolumenTotal_M3, 
                VolumenComercial_M3, PuntoGPS, Latitud, Longitud, ProyeccionCopa_X, 
                ProyeccionCopa_Y, EstadoSanitario, PresenciaEpifitas, PresenciaNidos, 
                PresenciaOtraFauna, Observaciones, Transecto, ImagenURL,
                DensidadMadera, BiomasaAerea_kg, Carbono_kg, CO2e_kg
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        values = (
            data.get('EspecieID'),
            data.get('NumeroArbol'),
            factor,
            validate_numeric(data.get('CAP_Cm')),
            validate_numeric(data.get('CAP_M')),
            dap_m,
            altura_total,
            validate_numeric(data.get('AlturaComercial_Mts')),
            area_basal,
            dap_redondeado,
            volumen_total,
            volumen_comercial,  # <--- AHORA SE USA
            data.get('PuntoGPS'),
            latitud_dd,
            longitud_dd,
            clean_boolean(data.get('ProyeccionCopa_X')),
            clean_boolean(data.get('ProyeccionCopa_Y')),
            data.get('EstadoSanitario'),
            clean_boolean(data.get('PresenciaEpifitas')),
            clean_boolean(data.get('PresenciaNidos')),
            clean_boolean(data.get('PresenciaOtraFauna')),
            data.get('Observaciones'),
            data.get('Transecto'),
            data.get('ImagenURL'),
            densidad_madera,
            biomasa,
            carbono,
            co2e
        )
        cursor.execute(sql, values)
        conn.commit()
        last_id = cursor.lastrowid
        cursor.close()
        conn.close()
        return last_id

    @staticmethod
    def update(arbol_id, data):
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("DESCRIBE Info_arboles")
        columnas = [fila[0] for fila in cursor.fetchall()]
        campos_calculados = ['BiomasaAerea_kg', 'Carbono_kg', 'CO2e_kg']
        campos_ignorar = ['Latitud_DMS_Input', 'Longitud_DMS_Input', 'prueba']

        datos_filtrados = {}
        for key, value in data.items():
            if key in campos_calculados or key in campos_ignorar:
                continue
            if key in columnas:
                datos_filtrados[key] = value

        campos_update = []
        valores_update = []

        if 'Latitud_DMS_Input' in data:
            lat_dd = dms_to_dd(data['Latitud_DMS_Input'])
            campos_update.append("Latitud = %s")
            valores_update.append(lat_dd)
        elif 'Latitud' in datos_filtrados and datos_filtrados['Latitud'] is not None:
            campos_update.append("Latitud = %s")
            valores_update.append(datos_filtrados['Latitud'])

        if 'Longitud_DMS_Input' in data:
            lon_dd = dms_to_dd(data['Longitud_DMS_Input'])
            campos_update.append("Longitud = %s")
            valores_update.append(lon_dd)
        elif 'Longitud' in datos_filtrados and datos_filtrados['Longitud'] is not None:
            campos_update.append("Longitud = %s")
            valores_update.append(datos_filtrados['Longitud'])

        campos_simples = [
            ('EspecieID', 'int'), ('NumeroArbol', 'str'), ('Factor', 'float'),
            ('CAP_Cm', 'float'), ('CAP_M', 'float'), ('DAP_M', 'float'),
            ('AlturaTotal_Mts', 'float'), ('AlturaComercial_Mts', 'float'),
            ('AreaBasal_M2', 'float'), ('DAP_M_REDONDEO', 'float'),
            ('VolumenTotal_M3', 'float'), ('VolumenComercial_M3', 'float'),
            ('PuntoGPS', 'int'), ('ProyeccionCopa_X', 'bool'), ('ProyeccionCopa_Y', 'bool'),
            ('EstadoSanitario', 'str'), ('PresenciaEpifitas', 'bool'),
            ('PresenciaNidos', 'bool'), ('PresenciaOtraFauna', 'bool'),
            ('Observaciones', 'str'), ('Transecto', 'str'), ('ImagenURL', 'str'),
            ('DensidadMadera', 'float')
        ]

        dap_m = altura_total = densidad_madera = factor = None

        for campo, tipo in campos_simples:
            if campo not in datos_filtrados:
                continue
            valor = datos_filtrados[campo]
            if valor is None:
                continue
            try:
                if tipo == 'str':
                    valor = str(valor).strip()
                elif tipo == 'int':
                    valor = int(float(valor))
                elif tipo == 'float':
                    valor = float(valor)
                elif tipo == 'bool':
                    valor = clean_boolean(valor)
            except:
                continue

            campos_update.append(f"{campo} = %s")
            valores_update.append(valor)

            if campo == 'DAP_M': dap_m = valor
            elif campo == 'AlturaTotal_Mts': altura_total = valor
            elif campo == 'DensidadMadera': densidad_madera = valor
            elif campo == 'Factor': factor = valor

        if not campos_update:
            cursor.close()
            conn.close()
            return

        sql = f"UPDATE Info_arboles SET {', '.join(campos_update)} WHERE MedicionArbolID = %s"
        valores_update.append(arbol_id)

        try:
            cursor.execute(sql, valores_update)
            conn.commit()
        except Exception as e:
            cursor.close()
            conn.close()
            raise e

        cursor.execute("""
            SELECT DAP_M, AlturaTotal_Mts, DensidadMadera, Factor
            FROM Info_arboles WHERE MedicionArbolID = %s
        """, (arbol_id,))
        fila = cursor.fetchone()
        if fila:
            dap_actual = to_float(fila[0])
            altura_actual = to_float(fila[1])
            densidad_actual = to_float(fila[2])
            factor_actual = to_float(fila[3]) or 0.7

            biomasa, carbono, co2e = calcular_biomasa_y_carbono(dap_actual, altura_actual, densidad_actual)
            area_basal = calcular_area_basal(dap_actual)
            dap_redondeado = calcular_dap_redondeado(dap_actual)
            volumen_total = calcular_volumen_total(area_basal, altura_actual, factor_actual)

            cursor.execute("""
                UPDATE Info_arboles 
                SET BiomasaAerea_kg=%s, Carbono_kg=%s, CO2e_kg=%s,
                    AreaBasal_M2=%s, DAP_M_REDONDEO=%s, VolumenTotal_M3=%s
                WHERE MedicionArbolID=%s
            """, (biomasa, carbono, co2e, area_basal, dap_redondeado, volumen_total, arbol_id))
            conn.commit()

        cursor.close()
        conn.close()

    @staticmethod
    def delete(arbol_id):
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM Info_arboles WHERE MedicionArbolID = %s", (arbol_id,))
        conn.commit()
        cursor.close()
        conn.close()

    @staticmethod
    def update_imagen(arbol_id, imagen_url):
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE Info_arboles SET ImagenURL = %s WHERE MedicionArbolID = %s",
            (imagen_url, arbol_id)
        )
        conn.commit()
        cursor.close()
        conn.close()