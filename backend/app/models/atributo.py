from app.database import get_connection

class AtributoDinamicoModel:
    
    @staticmethod
    def get_by_arbol(arbol_id):
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT * FROM Info_arboles_AtributosDinamicos
            WHERE MedicionArbolID = %s
        """, (arbol_id,))
        atributos = cursor.fetchall()
        cursor.close()
        conn.close()
        return atributos

    @staticmethod
    def create(arbol_id, nombre_campo, valor_texto=None, valor_numero=None, valor_fecha=None, valor_booleano=None):
        conn = get_connection()
        cursor = conn.cursor()
        sql = """
            INSERT INTO Info_arboles_AtributosDinamicos
            (MedicionArbolID, NombreCampo, ValorTexto, ValorNumero, ValorFecha, ValorBooleano)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        values = (arbol_id, nombre_campo, valor_texto, valor_numero, valor_fecha, valor_booleano)
        cursor.execute(sql, values)
        conn.commit()
        last_id = cursor.lastrowid
        cursor.close()
        conn.close()
        return last_id

    @staticmethod
    def update(atributo_id, data):
        conn = get_connection()
        cursor = conn.cursor()
        # Construir SET dinámico
        campos = []
        valores = []
        for key in ['ValorTexto', 'ValorNumero', 'ValorFecha', 'ValorBooleano']:
            if key in data:
                campos.append(f"{key} = %s")
                valores.append(data[key])
        if not campos:
            return
        valores.append(atributo_id)
        sql = f"UPDATE Info_arboles_AtributosDinamicos SET {', '.join(campos)} WHERE ID = %s"
        cursor.execute(sql, valores)
        conn.commit()
        cursor.close()
        conn.close()

    @staticmethod
    def delete(atributo_id):
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM Info_arboles_AtributosDinamicos WHERE ID = %s", (atributo_id,))
        conn.commit()
        cursor.close()
        conn.close()