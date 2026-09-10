from app.database import get_connection
import bcrypt

class UsuarioModel:
    
    @staticmethod
    def get_all():
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT UsuarioID, Usuario, RolID FROM Usuarios")
        usuarios = cursor.fetchall()
        cursor.close()
        conn.close()
        return usuarios

    @staticmethod
    def get_by_id(usuario_id):
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT UsuarioID, Usuario, RolID FROM Usuarios WHERE UsuarioID = %s", (usuario_id,))
        usuario = cursor.fetchone()
        cursor.close()
        conn.close()
        return usuario

    @staticmethod
    def create(data):
        conn = get_connection()
        cursor = conn.cursor()
        hashed = bcrypt.hashpw(data['Contrasena'].encode('utf-8'), bcrypt.gensalt())
        sql = "INSERT INTO Usuarios (Usuario, Contrasena, RolID) VALUES (%s, %s, %s)"
        values = (data['Usuario'], hashed.decode('utf-8'), data.get('RolID', 1))
        cursor.execute(sql, values)
        conn.commit()
        last_id = cursor.lastrowid
        cursor.close()
        conn.close()
        return last_id

    @staticmethod
    def update(usuario_id, data):
        conn = get_connection()
        cursor = conn.cursor()
        campos = []
        valores = []
        if 'Usuario' in data:
            campos.append("Usuario = %s")
            valores.append(data['Usuario'])
        if 'Contrasena' in data:
            hashed = bcrypt.hashpw(data['Contrasena'].encode('utf-8'), bcrypt.gensalt())
            campos.append("Contrasena = %s")
            valores.append(hashed.decode('utf-8'))
        if 'RolID' in data:
            campos.append("RolID = %s")
            valores.append(data['RolID'])
        if not campos:
            return
        valores.append(usuario_id)
        sql = f"UPDATE Usuarios SET {', '.join(campos)} WHERE UsuarioID = %s"
        cursor.execute(sql, valores)
        conn.commit()
        cursor.close()
        conn.close()

    @staticmethod
    def delete(usuario_id):
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM Usuarios WHERE UsuarioID = %s", (usuario_id,))
        conn.commit()
        cursor.close()
        conn.close()