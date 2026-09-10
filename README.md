# JBV3 - Sistema de Inventario Forestal con Servicios Ecosistémicos

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.12](https://img.shields.io/badge/python-3.12-blue.svg)](https://www.python.org/downloads/)
[![Flask](https://img.shields.io/badge/flask-2.3.3-green.svg)](https://flask.palletsprojects.com/)

## 📖 Descripción

**JBV2** es un sistema de gestión de inventario forestal diseñado para el **Jardín Botánico JARBOTA**, que integra:

- **Modelos alométricos** para estimación de biomasa, carbono y CO₂e (Chave et al., 2014).
- **Georreferenciación** y visualización en mapa (Leaflet).
- **Reportes** estadísticos y gráficos.
- **Exportación** a estándares internacionales (Darwin Core / GBIF).
- **Integración** con sensores remotos (Sentinel-2 / NDVI).

## 🚀 Tecnologías

- **Backend**: Flask (Python) con MySQL.
- **Frontend**: React (Vite) con Leaflet y Chart.js.
- **Base de datos**: MySQL (Laragon / XAMPP).

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