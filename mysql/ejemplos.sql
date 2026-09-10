-- ============================================================
-- DATOS DE EJEMPLO PARA EL SISTEMA JBV2
-- ============================================================

USE inventario;

-- Insertar especies de ejemplo
INSERT IGNORE INTO Especies (NombreComun, NombreCientifico, Familia, Categoria, UsuarioID) VALUES
('Cedro', 'Cedrela odorata', 'Meliaceae', 'Parcela', 1),
('Caoba', 'Swietenia macrophylla', 'Meliaceae', 'Parcela', 1),
('Castaña', 'Bertholletia excelsa', 'Lecythidaceae', 'Sendero', 1),
('Guayacán', 'Tabebuia chrysantha', 'Bignoniaceae', 'Parcela', 1),
('Roble', 'Quercus humboldtii', 'Fagaceae', 'Sendero', 1),
('Palma de cera', 'Ceroxylon quindiuense', 'Arecaceae', 'Sendero', 1),
('Caracolí', 'Anacardium excelsum', 'Anacardiaceae', 'Parcela', 1),
('Sangre de drago', 'Croton lechleri', 'Euphorbiaceae', 'Sendero', 1);

-- Insertar árboles de ejemplo
INSERT IGNORE INTO Info_arboles (
    EspecieID, NumeroArbol, Factor, CAP_Cm, CAP_M, DAP_M, AlturaTotal_Mts, 
    AlturaComercial_Mts, PuntoGPS, Latitud, Longitud, EstadoSanitario,
    DensidadMadera, Transecto, Observaciones
) VALUES
(1, '101', 0.7, 157, 1.570, 0.500, 22.5, 15.0, 1, -12.123456, -77.123456, 'BUENO', 0.65, 1, 'Árbol de cedro en buen estado'),
(1, '102', 0.7, 141, 1.414, 0.450, 18.0, 12.0, 2, -12.234567, -77.234567, 'REGULAR', 0.65, 1, 'Cedro con algunas ramas secas'),
(2, '103', 0.7, 173, 1.728, 0.550, 20.0, 14.0, 3, -12.345678, -77.345678, 'BUENO', 0.52, 2, 'Caoba en buen estado'),
(3, '104', 0.7, 220, 2.199, 0.700, 28.0, 20.0, 4, -12.456789, -77.456789, 'MALO', 0.65, 2, 'Castaña con signos de enfermedad');