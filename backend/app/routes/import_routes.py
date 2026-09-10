from flask import Blueprint, jsonify, request, Response
from app.database import get_connection
from app.services.alometrico import (
    calcular_biomasa_y_carbono,
    calcular_area_basal,
    calcular_dap_redondeado,
    calcular_volumen_total,
    to_float
)
import pandas as pd
import io
from datetime import datetime

import_bp = Blueprint('import', __name__, url_prefix='/import')


# ============ UTILIDADES ============
def leer_archivo(file):
    filename = file.filename.lower()
    content = file.read()

    if filename.endswith('.csv'):
        df = None
        for encoding in ['utf-8-sig', 'utf-8', 'latin-1']:
            try:
                df = pd.read_csv(io.BytesIO(content), encoding=encoding, sep=None, engine='python')
                break
            except (UnicodeDecodeError, pd.errors.ParserError):
                continue
        if df is None:
            raise ValueError('No se pudo leer el archivo CSV. Verifica el formato.')
    elif filename.endswith(('.xlsx', '.xls')):
        df = pd.read_excel(io.BytesIO(content))
    else:
        raise ValueError('Formato no soportado. Usa CSV o XLSX.')

    df.columns = [
        str(c).replace('\ufeff', '').strip().replace(' ', '_')
        for c in df.columns
    ]
    return df


def validar_columnas(df, columnas_requeridas):
    faltantes = [c for c in columnas_requeridas if c not in df.columns]
    if faltantes:
        raise ValueError(f'Faltan columnas obligatorias: {", ".join(faltantes)}')
    return True


def limpiar_valor(valor):
    """Convierte NaN de pandas a None"""
    if pd.isna(valor):
        return None
    return valor


def parsear_punto_gps(valor):
    """Convierte PuntoGPS a entero. Si no es numérico, devuelve None."""
    valor = limpiar_valor(valor)
    if valor is None:
        return None
    try:
        return int(float(valor))
    except (ValueError, TypeError):
        return None  # Si es "P1", "P2" etc, se guarda como NULL


def buscar_especie(nombre, especies_list):
    """
    Busca una especie por NombreComun o NombreCientifico.
    Primero intenta coincidencia exacta, luego coincidencia parcial.
    """
    if not nombre:
        return None
    nombre_lower = str(nombre).strip().lower()

    # 1. Coincidencia EXACTA por NombreComun
    for e in especies_list:
        if e['NombreComun'] and e['NombreComun'].strip().lower() == nombre_lower:
            return e['EspecieID']

    # 2. Coincidencia EXACTA por NombreCientifico
    for e in especies_list:
        if e['NombreCientifico'] and e['NombreCientifico'].strip().lower() == nombre_lower:
            return e['EspecieID']

    # 3. Coincidencia PARCIAL (el nombre está contenido en el NombreComun)
    for e in especies_list:
        if e['NombreComun'] and nombre_lower in e['NombreComun'].strip().lower():
            return e['EspecieID']

    # 4. Coincidencia PARCIAL inversa (el NombreComun está contenido en el buscado)
    for e in especies_list:
        if e['NombreComun'] and e['NombreComun'].strip().lower() in nombre_lower:
            return e['EspecieID']

    return None


# ============ PLANTILLAS ============
@import_bp.route('/plantilla/arboles', methods=['GET'])
def plantilla_arboles():
    columnas = [
        'Numero_Arbol', 'Especie_Comun', 'DAP_m', 'Altura_Total_m',
        'Altura_Comercial_m', 'Densidad_Madera', 'Factor',
        'Estado_Sanitario', 'Latitud', 'Longitud', 'Punto_GPS',
        'Transecto', 'Observaciones'
    ]
    ejemplo = [
        '001', 'Roble', '0.25', '12.5', '8.0', '0.65', '0.7',
        'BUENO', '-12.123456', '-77.123456', '1', 'T1', 'Sin observaciones'
    ]
    output = io.StringIO()
    output.write('\ufeff')
    output.write(','.join(columnas) + '\n')
    output.write(','.join(ejemplo) + '\n')

    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={'Content-Disposition': 'attachment; filename=plantilla_arboles.csv'}
    )


@import_bp.route('/plantilla/especies', methods=['GET'])
def plantilla_especies():
    columnas = ['NombreComun', 'NombreCientifico', 'Familia', 'Categoria']
    ejemplo = ['Roble', 'Quercus robur', 'Fagaceae', 'Parcela']
    output = io.StringIO()
    output.write('\ufeff')
    output.write(','.join(columnas) + '\n')
    output.write(','.join(ejemplo) + '\n')

    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={'Content-Disposition': 'attachment; filename=plantilla_especies.csv'}
    )


# ============ IMPORTAR ÁRBOLES ============
@import_bp.route('/arboles', methods=['POST'])
def importar_arboles():
    if 'archivo' not in request.files:
        return jsonify({'error': 'No se envió ningún archivo'}), 400

    file = request.files['archivo']
    if file.filename == '':
        return jsonify({'error': 'Nombre de archivo vacío'}), 400

    try:
        df = leer_archivo(file)

        # Validación inteligente: detectar si subieron un archivo de especies
        if 'NombreComun' in df.columns and 'Numero_Arbol' not in df.columns:
            return jsonify({
                'error': '⚠️ Estás subiendo un archivo de ESPECIES al módulo de ÁRBOLES. '
                         'Cambia al módulo "🌿 Catálogo de Especies".'
            }), 400

        validar_columnas(df, ['Numero_Arbol', 'Especie_Comun', 'DAP_m', 'Altura_Total_m'])

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        # Cargar catálogo completo de especies
        cursor.execute("SELECT EspecieID, NombreComun, NombreCientifico FROM Especies")
        especies_list = cursor.fetchall()

        insertados = 0
        errores = []
        usuario_id = request.form.get('UsuarioID', 1)

        for idx, row in df.iterrows():
            fila_num = idx + 2
            try:
                # Buscar especie con lógica flexible
                nombre_especie = limpiar_valor(row.get('Especie_Comun', ''))
                if not nombre_especie:
                    errores.append(f'Fila {fila_num}: Falta el nombre de la especie')
                    continue

                especie_id = buscar_especie(nombre_especie, especies_list)
                if not especie_id:
                    errores.append(
                        f'Fila {fila_num}: Especie "{nombre_especie}" no encontrada. '
                        f'Verifica que esté registrada en el catálogo de especies.'
                    )
                    continue

                # Parsear valores numéricos
                dap_m = to_float(limpiar_valor(row.get('DAP_m')))
                altura_total = to_float(limpiar_valor(row.get('Altura_Total_m')))
                densidad = to_float(limpiar_valor(row.get('Densidad_Madera'))) or 0.65
                factor = to_float(limpiar_valor(row.get('Factor'))) or 0.7
                cap_cm = to_float(limpiar_valor(row.get('CAP_Cm')))
                cap_m = to_float(limpiar_valor(row.get('CAP_M')))
                altura_comercial = to_float(limpiar_valor(row.get('Altura_Comercial_m')))
                latitud = to_float(limpiar_valor(row.get('Latitud')))
                longitud = to_float(limpiar_valor(row.get('Longitud')))
                punto_gps = parsear_punto_gps(row.get('Punto_GPS'))

                if dap_m is None or altura_total is None:
                    errores.append(f'Fila {fila_num}: DAP y Altura Total son obligatorios')
                    continue

                # Cálculos alométricos
                biomasa, carbono, co2e = calcular_biomasa_y_carbono(dap_m, altura_total, densidad)
                area_basal = calcular_area_basal(dap_m)
                dap_redondeado = calcular_dap_redondeado(dap_m)
                volumen_total = calcular_volumen_total(area_basal, altura_total, factor)

                # Insertar
                sql = """
                    INSERT INTO Info_arboles (
                        EspecieID, NumeroArbol, Factor, CAP_Cm, CAP_M, DAP_M, 
                        AlturaTotal_Mts, AlturaComercial_Mts, AreaBasal_M2, 
                        DAP_M_REDONDEO, VolumenTotal_M3, DensidadMadera,
                        BiomasaAerea_kg, Carbono_kg, CO2e_kg,
                        Latitud, Longitud, PuntoGPS, Transecto, 
                        EstadoSanitario, Observaciones
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """
                values = (
                    especie_id,
                    str(limpiar_valor(row.get('Numero_Arbol')) or ''),
                    factor, cap_cm, cap_m, dap_m,
                    altura_total, altura_comercial, area_basal,
                    dap_redondeado, volumen_total, densidad,
                    biomasa, carbono, co2e,
                    latitud, longitud,
                    punto_gps,  # Ahora se guarda como NULL si no es numérico
                    limpiar_valor(row.get('Transecto')),
                    limpiar_valor(row.get('Estado_Sanitario')) or 'BUENO',
                    limpiar_valor(row.get('Observaciones'))
                )
                cursor.execute(sql, values)
                insertados += 1

            except Exception as e:
                errores.append(f'Fila {fila_num}: {str(e)}')

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({
            'ok': True,
            'insertados': insertados,
            'errores': errores,
            'total_filas': len(df)
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 400


# ============ IMPORTAR ESPECIES ============
@import_bp.route('/especies', methods=['POST'])
def importar_especies():
    if 'archivo' not in request.files:
        return jsonify({'error': 'No se envió ningún archivo'}), 400

    file = request.files['archivo']
    if file.filename == '':
        return jsonify({'error': 'Nombre de archivo vacío'}), 400

    try:
        df = leer_archivo(file)

        if ('Numero_Arbol' in df.columns or 'DAP_m' in df.columns) and 'NombreComun' not in df.columns:
            return jsonify({
                'error': '⚠️ Estás subiendo un archivo de ÁRBOLES al módulo de ESPECIES. '
                         'Cambia al módulo "🌳 Inventario de Árboles".'
            }), 400

        validar_columnas(df, ['NombreComun', 'NombreCientifico'])

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        insertados = 0
        errores = []
        usuario_id = request.form.get('UsuarioID', 1)

        for idx, row in df.iterrows():
            fila_num = idx + 2
            try:
                nombre_comun = str(limpiar_valor(row.get('NombreComun', ''))).strip()
                nombre_cientifico = str(limpiar_valor(row.get('NombreCientifico', ''))).strip()

                if not nombre_comun or not nombre_cientifico:
                    errores.append(f'Fila {fila_num}: Nombre común y científico son obligatorios')
                    continue

                cursor.execute(
                    "SELECT EspecieID FROM Especies WHERE NombreCientifico = %s",
                    (nombre_cientifico,)
                )
                if cursor.fetchone():
                    errores.append(f'Fila {fila_num}: "{nombre_cientifico}" ya existe')
                    continue

                categoria = str(limpiar_valor(row.get('Categoria', 'Parcela')) or 'Parcela').strip()
                if categoria not in ['Parcela', 'Sendero']:
                    categoria = 'Parcela'

                cursor.execute("""
                    INSERT INTO Especies (NombreComun, NombreCientifico, Familia, Categoria, UsuarioID)
                    VALUES (%s, %s, %s, %s, %s)
                """, (
                    nombre_comun,
                    nombre_cientifico,
                    limpiar_valor(row.get('Familia')),
                    categoria,
                    usuario_id
                ))
                insertados += 1

            except Exception as e:
                errores.append(f'Fila {fila_num}: {str(e)}')

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({
            'ok': True,
            'insertados': insertados,
            'errores': errores,
            'total_filas': len(df)
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 400