-- ============================================================
-- SCRIPT COMPLETO PARA LA BASE DE DATOS INVENTARIO
-- PROYECTO JBV2 - SISTEMA DE INVENTARIO FORESTAL
-- BASADO EN EL REPOSITORIO: https://github.com/YAAO16/JBV2
-- VERSIÓN: 2.0 (CON MEJORAS DE SERVICIOS ECOSISTÉMICOS)
-- ============================================================

-- Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS inventario
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE inventario;

-- ============================================================
-- 1. TABLA DE ROLES
-- ============================================================
CREATE TABLE IF NOT EXISTS Roles (
    RolID INT PRIMARY KEY AUTO_INCREMENT,
    NombreRol VARCHAR(50) UNIQUE NOT NULL COMMENT 'Nombre del rol (ej. Administrador, Ingeniero)',
    Descripcion TEXT NULL COMMENT 'Descripción del rol',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación',
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Última actualización'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. TABLA DE USUARIOS
-- ============================================================
CREATE TABLE IF NOT EXISTS Usuarios (
    UsuarioID INT PRIMARY KEY AUTO_INCREMENT,
    Usuario VARCHAR(255) UNIQUE NOT NULL COMMENT 'Nombre de usuario',
    Contrasena VARCHAR(255) NOT NULL COMMENT 'Contraseña encriptada (bcrypt)',
    RolID INT DEFAULT NULL COMMENT 'Rol del usuario',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación',
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Última actualización',
    FOREIGN KEY (RolID) REFERENCES Roles(RolID) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. TABLA DE PERMISOS
-- ============================================================
CREATE TABLE IF NOT EXISTS Permisos (
    PermisoID INT PRIMARY KEY AUTO_INCREMENT,
    NombrePermiso VARCHAR(100) UNIQUE NOT NULL COMMENT 'Nombre del permiso (ej. arboles_crear)',
    Descripcion TEXT NULL COMMENT 'Descripción del permiso',
    Categoria VARCHAR(50) NULL COMMENT 'Categoría (ej. arboles, especies, usuarios)',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación',
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Última actualización'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. TABLA INTERMEDIA ROLES-PERMISOS
-- ============================================================
CREATE TABLE IF NOT EXISTS Roles_Permisos (
    RolID INT NOT NULL,
    PermisoID INT NOT NULL,
    PRIMARY KEY (RolID, PermisoID),
    FOREIGN KEY (RolID) REFERENCES Roles(RolID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (PermisoID) REFERENCES Permisos(PermisoID) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. TABLA DE ESPECIES
-- ============================================================
CREATE TABLE IF NOT EXISTS Especies (
    EspecieID INT PRIMARY KEY AUTO_INCREMENT,
    NombreComun VARCHAR(255) NOT NULL COMMENT 'Nombre común de la especie',
    NombreCientifico VARCHAR(255) UNIQUE NOT NULL COMMENT 'Nombre científico (ej. Cedrela odorata)',
    Familia VARCHAR(255) NULL COMMENT 'Familia botánica',
    Categoria ENUM('Parcela', 'Sendero') NOT NULL COMMENT 'Categoría de la especie',
    UsuarioID INT NOT NULL COMMENT 'Usuario que registró la especie',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación',
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Última actualización',
    FOREIGN KEY (UsuarioID) REFERENCES Usuarios(UsuarioID) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 6. TABLA PRINCIPAL DE ÁRBOLES (con servicios ecosistémicos)
-- ============================================================
CREATE TABLE IF NOT EXISTS Info_arboles (
    MedicionArbolID INT PRIMARY KEY AUTO_INCREMENT COMMENT 'ID único del árbol en el inventario',
    EspecieID INT NOT NULL COMMENT 'ID de la especie',
    NumeroArbol INT NOT NULL COMMENT 'Número de identificación del árbol',
    Factor DECIMAL(5,2) NULL COMMENT 'Factor de forma o factor morfológico',
    CAP_Cm INT NULL COMMENT 'Circunferencia a la altura del pecho (cm)',
    CAP_M DECIMAL(8,3) NULL COMMENT 'Circunferencia a la altura del pecho (m)',
    DAP_M DECIMAL(8,4) NULL COMMENT 'Diámetro a la altura del pecho (m)',
    AlturaTotal_Mts DECIMAL(6,2) NULL COMMENT 'Altura total del árbol (m)',
    AlturaComercial_Mts DECIMAL(6,2) NULL COMMENT 'Altura comercial (m)',
    
    -- Campos para servicios ecosistémicos (modelos alométricos)
    DensidadMadera DECIMAL(10,4) NULL COMMENT 'Densidad básica de la madera (g/cm³)',
    BiomasaAerea_kg DECIMAL(15,4) NULL COMMENT 'Biomasa aérea en kg (AGB) según Chave et al. (2014)',
    Carbono_kg DECIMAL(15,4) NULL COMMENT 'Carbono almacenado en kg (C = AGB × 0.47)',
    CO2e_kg DECIMAL(15,4) NULL COMMENT 'CO₂ equivalente en kg (CO2e = C × 3.67)',
    
    -- Campos adicionales
    AreaBasal_M2 DECIMAL(10,5) NULL COMMENT 'Área basal del árbol (m²)',
    DAP_M_REDONDEO DECIMAL(8,4) NULL COMMENT 'DAP redondeado a clase diamétrica (0.05 m)',
    VolumenTotal_M3 DECIMAL(12,6) NULL COMMENT 'Volumen total (m³)',
    VolumenComercial_M3 DECIMAL(12,6) NULL COMMENT 'Volumen comercial (m³)',
    
    -- Ubicación y observaciones
    PuntoGPS INT NULL COMMENT 'Número del punto GPS',
    Latitud DECIMAL(10,8) NULL COMMENT 'Latitud en grados decimales (EPSG:4326)',
    Longitud DECIMAL(11,8) NULL COMMENT 'Longitud en grados decimales (EPSG:4326)',
    ProyeccionCopa_X BOOLEAN NULL COMMENT 'Proyección de copa en eje X',
    ProyeccionCopa_Y BOOLEAN NULL COMMENT 'Proyección de copa en eje Y',
    EstadoSanitario ENUM('BUENO', 'REGULAR', 'MALO') NOT NULL COMMENT 'Estado sanitario del árbol',
    PresenciaEpifitas BOOLEAN NULL COMMENT 'Presencia de epífitas',
    PresenciaNidos BOOLEAN NULL COMMENT 'Presencia de nidos',
    PresenciaOtraFauna BOOLEAN NULL COMMENT 'Presencia de otra fauna',
    Observaciones TEXT NULL COMMENT 'Observaciones adicionales',
    Transecto INT NULL COMMENT 'Número de transecto',
    ImagenURL VARCHAR(500) NULL COMMENT 'URL de la imagen del árbol',
    
    -- Auditoría
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de registro del árbol',
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Última actualización',
    
    FOREIGN KEY (EspecieID) REFERENCES Especies(EspecieID) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 7. TABLA PARA ATRIBUTOS DINÁMICOS (extensibilidad)
-- ============================================================
CREATE TABLE IF NOT EXISTS Info_arboles_AtributosDinamicos (
    ID INT PRIMARY KEY AUTO_INCREMENT,
    MedicionArbolID INT NOT NULL COMMENT 'ID del árbol al que pertenece el atributo',
    NombreCampo VARCHAR(100) NOT NULL COMMENT 'Nombre del campo dinámico',
    ValorTexto TEXT NULL COMMENT 'Valor en texto',
    ValorNumero DECIMAL(15,5) NULL COMMENT 'Valor numérico',
    ValorFecha DATE NULL COMMENT 'Valor de fecha',
    ValorBooleano BOOLEAN NULL COMMENT 'Valor booleano',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación',
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Última actualización',
    FOREIGN KEY (MedicionArbolID) REFERENCES Info_arboles(MedicionArbolID) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY unique_atributo (MedicionArbolID, NombreCampo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 8. CREAR ÍNDICES PARA OPTIMIZAR CONSULTAS
-- ============================================================

-- Índices en Info_arboles
CREATE INDEX idx_arbol_especie ON Info_arboles(EspecieID);
CREATE INDEX idx_arbol_estado ON Info_arboles(EstadoSanitario);
CREATE INDEX idx_arbol_transecto ON Info_arboles(Transecto);
CREATE INDEX idx_arbol_coordenadas ON Info_arboles(Latitud, Longitud);
CREATE INDEX idx_arbol_dap ON Info_arboles(DAP_M);
CREATE INDEX idx_arbol_altura ON Info_arboles(AlturaTotal_Mts);
CREATE INDEX idx_arbol_numero ON Info_arboles(NumeroArbol);
CREATE INDEX idx_arbol_fecha_registro ON Info_arboles(fecha_registro);
CREATE INDEX idx_arbol_densidad ON Info_arboles(DensidadMadera);
CREATE INDEX idx_arbol_biomasa ON Info_arboles(BiomasaAerea_kg);
CREATE INDEX idx_arbol_carbono ON Info_arboles(Carbono_kg);
CREATE INDEX idx_arbol_co2 ON Info_arboles(CO2e_kg);

-- Índices en Especies
CREATE INDEX idx_especie_nombre_comun ON Especies(NombreComun);
CREATE INDEX idx_especie_cientifico ON Especies(NombreCientifico);
CREATE INDEX idx_especie_familia ON Especies(Familia);

-- Índices en Usuarios
CREATE INDEX idx_usuario_nombre ON Usuarios(Usuario);

-- ============================================================
-- 9. INSERCIÓN DE ROLES, PERMISOS Y USUARIO ADMINISTRADOR
-- ============================================================

-- Insertar roles (si no existen)
INSERT IGNORE INTO Roles (RolID, NombreRol, Descripcion) VALUES
(1, 'Administrador', 'Control total del sistema: puede gestionar usuarios, especies, árboles y permisos.'),
(2, 'Ingeniero', 'Puede gestionar especies, árboles y visualizar reportes, sin acceso a usuarios.'),
(3, 'Visitante', 'Solo puede visualizar el mapa y consultar información básica.');

-- Insertar permisos completos
INSERT IGNORE INTO Permisos (NombrePermiso, Descripcion, Categoria) VALUES
-- Módulo de árboles
('arboles_crear', 'Permite crear nuevos árboles', 'arboles'),
('arboles_editar', 'Permite editar árboles existentes', 'arboles'),
('arboles_eliminar', 'Permite eliminar árboles', 'arboles'),
('arboles_ver', 'Permite ver el listado de árboles', 'arboles'),
('arboles_mapa', 'Permite ver el mapa de árboles', 'arboles'),
-- Módulo de especies
('especies_crear', 'Permite crear nuevas especies', 'especies'),
('especies_editar', 'Permite editar especies existentes', 'especies'),
('especies_eliminar', 'Permite eliminar especies', 'especies'),
('especies_ver', 'Permite ver el listado de especies', 'especies'),
-- Módulo de usuarios
('usuarios_crear', 'Permite crear nuevos usuarios', 'usuarios'),
('usuarios_editar', 'Permite editar usuarios', 'usuarios'),
('usuarios_eliminar', 'Permite eliminar usuarios', 'usuarios'),
('usuarios_ver', 'Permite ver el listado de usuarios', 'usuarios'),
-- Módulo de reportes
('reportes_ver', 'Permite ver reportes y estadísticas', 'reportes'),
('reportes_exportar_excel', 'Permite exportar reportes a Excel', 'reportes'),
('reportes_exportar_pdf', 'Permite exportar reportes a PDF', 'reportes'),
-- Imágenes
('imagenes_subir', 'Permite subir imágenes de árboles', 'imagenes'),
('imagenes_eliminar', 'Permite eliminar imágenes de árboles', 'imagenes'),
('imagenes_ver', 'Permite ver imágenes de árboles', 'imagenes'),
-- Atributos dinámicos
('atributos_crear', 'Permite crear atributos dinámicos', 'atributos'),
('atributos_editar', 'Permite editar atributos dinámicos', 'atributos'),
('atributos_eliminar', 'Permite eliminar atributos dinámicos', 'atributos'),
('atributos_ver', 'Permite ver atributos dinámicos', 'atributos');

-- Asignar todos los permisos al Administrador (RolID = 1)
INSERT IGNORE INTO Roles_Permisos (RolID, PermisoID)
SELECT 1, PermisoID FROM Permisos;

-- Asignar permisos específicos al Ingeniero (RolID = 2)
INSERT IGNORE INTO Roles_Permisos (RolID, PermisoID)
SELECT 2, PermisoID FROM Permisos 
WHERE NombrePermiso IN (
    'especies_crear', 'especies_editar', 'especies_ver',
    'arboles_crear', 'arboles_editar', 'arboles_ver', 'arboles_mapa',
    'imagenes_subir', 'imagenes_ver',
    'reportes_ver', 'reportes_exportar_excel',
    'atributos_crear', 'atributos_editar', 'atributos_ver'
);

-- ============================================================
-- 10. USUARIO ADMINISTRADOR CON CONTRASEÑA "Admin@itp"
-- ============================================================
-- Hash generado con bcrypt para "Admin@itp"
INSERT IGNORE INTO Usuarios (Usuario, Contrasena, RolID) VALUES
('adminjbitp', '$2b$12$JEZdlcQjeZ/RXYcX0KWtp.7ic5Cxt.dovgd93xFHWfyG80eSHdQuS', 1);

-- ============================================================
-- 11. VERIFICACIÓN DE LA ESTRUCTURA
-- ============================================================
SELECT '=== ESTRUCTURA DE TABLAS ===' AS '';
SHOW TABLES;

SELECT '=== USUARIO ADMINISTRADOR ===' AS '';
SELECT UsuarioID, Usuario, RolID, fecha_creacion FROM Usuarios WHERE Usuario = 'adminjbitp';

SELECT '=== PERMISOS ASIGNADOS AL ADMIN ===' AS '';
SELECT p.NombrePermiso, p.Categoria
FROM Roles_Permisos rp
JOIN Permisos p ON rp.PermisoID = p.PermisoID
WHERE rp.RolID = 1
ORDER BY p.Categoria, p.NombrePermiso;

SELECT '=== BASE DE DATOS LISTA ===' AS '✅ El script se ejecutó correctamente.';