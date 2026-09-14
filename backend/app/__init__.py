
from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_swagger_ui import get_swaggerui_blueprint
import os
from app.config import config

# Blueprints existentes
from app.routes.auth_routes import auth_bp
from app.routes.usuario_routes import usuario_bp
from app.routes.especie_routes import especie_bp
from app.routes.arbol_routes import arbol_bp
from app.routes.reporte_routes import reportes_bp
from app.routes.export_routes import export_bp
from app.routes.atributo_routes import atributo_bp
from app.routes.admin_routes import admin_bp
from app.routes.import_routes import import_bp
from app.routes.sentinel_routes import sentinel_bp
from app.routes.ndvi_routes import ndvi_bp

# Blueprint API v2 (Alometría, Darwin Core, PWA Sync, SUS y T-Student)
from app.routes.api_v2 import api_v2 as api_v2_bp

def create_app():
    app = Flask(__name__)
    
    app.config['SECRET_KEY'] = config.SECRET_KEY
    app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'uploads')
    app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    # Swagger UI
    SWAGGER_URL = '/docs'
    API_URL = '/swagger.yaml'
    swaggerui_blueprint = get_swaggerui_blueprint(
        SWAGGER_URL,
        API_URL,
        config={'app_name': "Inventario Forestal JARBOTAV3 / EcoAtlas"}
    )
    app.register_blueprint(swaggerui_blueprint, url_prefix=SWAGGER_URL)

    @app.route('/swagger.yaml')
    def swagger_yaml():
        return send_from_directory(app.root_path, 'swagger.yaml')

    # Configuración CORS global
    CORS(app, 
         origins='*', 
         supports_credentials=True,
         allow_headers=['Content-Type', 'Authorization', 'X-UsuarioID'],
         methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])

    # Registro de Blueprints
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(usuario_bp, url_prefix='/usuarios')
    app.register_blueprint(especie_bp, url_prefix='/especies')
    app.register_blueprint(arbol_bp, url_prefix='/arboles')
    app.register_blueprint(reportes_bp, url_prefix='/reportes')
    app.register_blueprint(export_bp, url_prefix='/export')
    app.register_blueprint(atributo_bp)
    app.register_blueprint(admin_bp, url_prefix='/admin')
    app.register_blueprint(import_bp, url_prefix='/import')
    app.register_blueprint(sentinel_bp, url_prefix='/api')
    app.register_blueprint(ndvi_bp)
    
    # Registro de endpoints v2 (Servicios Ecosistémicos, Estadísticas y DwC)
    app.register_blueprint(api_v2_bp, url_prefix='/api/v2')

    @app.route('/uploads/<path:filename>')
    def uploaded_file(filename):
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

    return app