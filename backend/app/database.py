import mysql.connector
from app.config import config

def get_connection():
    return mysql.connector.connect(**config.DB_CONFIG)