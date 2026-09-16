# JARBOTAV3 - Sistema de Inventario Forestal con Servicios Ecosistémicos

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.12](https://img.shields.io/badge/python-3.12-blue.svg)](https://www.python.org/downloads/)
[![Flask](https://img.shields.io/badge/flask-2.3.3-green.svg)](https://flask.palletsprojects.com/)
[![OpenAPI 3.0](https://img.shields.io/badge/OpenAPI-3.0.0-6BA539.svg)](https://swagger.io/specification/)

## 📖 Descripción

**JARBOTAV3** es un sistema de gestión de inventario forestal diseñado para el **Jardín Botánico JARBOTA**, que integra:

- **Modelos alométricos** para estimación de biomasa, carbono y CO₂e (Chave et al., 2014).
- **Georreferenciación** y visualización en mapa (Leaflet).
- **Reportes** estadísticos y gráficos.
- **Exportación** a estándares internacionales (Darwin Core / GBIF / SiB Colombia).
- **Integración** con sensores remotos (Sentinel-2 / NDVI).
- **Atributos dinámicos** para campos personalizados por árbol.

## 🚀 Tecnologías

- **Backend**: Flask (Python) con MySQL.
- **Frontend**: React (Vite) con Leaflet y Chart.js.
- **Base de datos**: MySQL (Laragon / XAMPP).
- **Autenticación**: JWT (Bearer Token) + X-UsuarioID.

## 📋 Requisitos previos

- Python 3.12+
- Node.js 18+
- MySQL 5.7+ (o MariaDB 10.4+)
- Git

## 🔧 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/YAAO16/jardinv3.git
cd jardinv3
```

### 2. Configurar el backend

```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/macOS
source venv/bin/activate

pip install -r requirements.txt
```

### 3. Configurar la base de datos

- Crear la base de datos en MySQL (por ejemplo: `jarbotav3`).
- Importar el script SQL del proyecto.
- Configurar las credenciales en el archivo `.env`:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=jarbotav3
JWT_SECRET=tu_clave_secreta
```

### 4. Configurar el frontend

```bash
cd ../frontend
npm install
```

## ▶️ Ejecución

### Backend

```bash
cd backend
python app.py
```

Servidor disponible en:
- http://localhost:8001
- http://127.0.0.1:8001
- http://192.168.100.109:8001 (LAN)

### Frontend

```bash
cd frontend
npm run dev
```

## 📚 Documentación de la API

El proyecto incluye especificación **OpenAPI 3.0**. Endpoints principales:

- `POST /auth/login` — Autenticación con JWT
- `GET|POST|PUT|DELETE /usuarios` — Gestión de usuarios (solo admin)
- `GET|POST|PUT|DELETE /especies` — Gestión de especies
- `GET|POST|PUT|DELETE /arboles` — Gestión de árboles (con cálculos automáticos)
- `POST /arboles/{id}/imagen` — Subida de imágenes
- `GET|POST|PUT|DELETE /atributos` — Atributos dinámicos
- `GET /reportes/*` — 6 endpoints de estadísticas
- `GET /exportar/darwin-core` — Exportación Darwin Core (JSON / CSV)
- `GET /ndvi/{latitud}/{longitud}` — NDVI por coordenada (Sentinel-2)
- `POST /ndvi/arbol/{id}` — Calcular y guardar NDVI de un árbol
- `POST /ndvi/bulk` — Cálculo masivo de NDVI
- `GET /ndvi/estadisticas` — Estadísticas NDVI
- `GET /admin/estructura/{tabla}` — Estructura de tablas

## 🔐 Seguridad

La API soporta dos esquemas de autenticación:

- **`X-UsuarioID`** (header): ID del usuario autenticado.
- **`BearerAuth`**: Token JWT obtenido en `/auth/login`.

## 📦 Estructura del proyecto

```
jardinv3/
├── backend/           # API Flask + MySQL
├── frontend/          # React + Vite + Leaflet
├── docs/              # Documentación y OpenAPI
├── CITATION.cff       # Metadatos de citación
├── LICENSE            # Licencia MIT
└── README.md
```

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un *issue* o envía un *pull request* siguiendo las convenciones del proyecto.

## 📄 Licencia

Este proyecto está bajo la licencia **MIT**. Consulta el archivo [LICENSE](LICENSE) para más detalles.

## 📝 Citación

Si usas este software en tu investigación, por favor cítalo como se indica en el archivo [CITATION.cff](CITATION.cff).

**Autor:** Adrián Ordoñez — [ORCID: 0009-0005-6497-3885](https://orcid.org/0009-0005-6497-3885)

## 🔗 Enlaces

- **Repositorio**: https://github.com/YAAO16/jardinv3
