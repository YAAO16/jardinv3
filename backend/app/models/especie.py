from app.database import get_connection

class EspecieModel:

    @staticmethod
    def get_connection():
        return get_connection()

    @staticmethod
    def get_all():
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM Especies ORDER BY NombreComun")
        especies = cursor.fetchall()
        cursor.close()
        conn.close()
        return especies

    @staticmethod
    def get_by_id(especie_id):
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM Especies WHERE EspecieID = %s", (especie_id,))
        especie = cursor.fetchone()
        cursor.close()
        conn.close()
        return especie

    @staticmethod
    def create(data, usuario_id=None):
        conn = get_connection()
        cursor = conn.cursor()

        # Si no se envía UsuarioID, usamos el ID 1 (o el que quieras) como predeterminado
        if usuario_id is None:
            usuario_id = data.get('UsuarioID', 1)  # Valor por defecto: 1
            if usuario_id is None:
                usuario_id = 1

        nombre_comun = data.get('NombreComun') or None
        nombre_cientifico = data.get('NombreCientifico') or None
        familia = data.get('Familia') or None
        categoria = data.get('Categoria') or 'Parcela'

        sql = """
            INSERT INTO Especies (NombreComun, NombreCientifico, Familia, Categoria, UsuarioID)
            VALUES (%s, %s, %s, %s, %s)
        """
        values = (nombre_comun, nombre_cientifico, familia, categoria, usuario_id)
        cursor.execute(sql, values)
        conn.commit()
        last_id = cursor.lastrowid
        cursor.close()
        conn.close()
        return last_id

    @staticmethod
    def update(especie_id, data):
        conn = get_connection()
        cursor = conn.cursor()

        nombre_comun = data.get('NombreComun') or None
        nombre_cientifico = data.get('NombreCientifico') or None
        familia = data.get('Familia') or None
        categoria = data.get('Categoria') or 'Parcela'

        sql = """
            UPDATE Especies
            SET NombreComun = %s, NombreCientifico = %s, Familia = %s, Categoria = %s
            WHERE EspecieID = %s
        """
        values = (nombre_comun, nombre_cientifico, familia, categoria, especie_id)

        try:
            cursor.execute(sql, values)
            conn.commit()
        except Exception as e:
            conn.rollback()
            cursor.close()
            conn.close()
            raise e

        cursor.close()
        conn.close()

    @staticmethod
    def delete(especie_id):
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM Especies WHERE EspecieID = %s", (especie_id,))
        conn.commit()
        cursor.close()
        conn.close()