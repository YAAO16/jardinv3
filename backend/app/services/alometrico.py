import math
from decimal import Decimal
from typing import Optional, Dict, Any, Union

class AlometriaService:
    FACTOR_CARBONO: float = 0.47
    RELACION_CO2_C: float = 44.0 / 12.0  # 3.66666...
    FACTOR_FORMA_DEFECTO: float = 0.7

    @staticmethod
    def _to_float(val: Any) -> Optional[float]:
        """Convierte tipos Decimal, int, str o float a float de forma segura."""
        if val is None:
            return None
        if isinstance(val, Decimal):
            return float(val)
        try:
            v = float(val)
            return v if not math.isnan(v) else None
        except (TypeError, ValueError):
            return None

    @classmethod
    def calcular_area_basal(cls, dap_m: Any) -> Optional[float]:
        """
        Calcula el Área Basal (g) en metros cuadrados (m²).
        Fórmula: g = (pi / 4) * DAP_m²
        """
        dap = cls._to_float(dap_m)
        if dap is None or dap <= 0:
            return None
        area_basal = math.pi * (dap / 2.0) ** 2
        return round(area_basal, 6)

    @classmethod
    def calcular_volumen_total(
        cls, 
        dap_m: Any, 
        altura_total_m: Any, 
        factor_forma: float = 0.7
    ) -> Optional[float]:
        """
        Calcula el Volumen Total Comercial/Boleto en m³.
        Fórmula: V = AreaBasal_m² * Altura_m * FactorForma
        """
        ab = cls.calcular_area_basal(dap_m)
        altura = cls._to_float(altura_total_m)
        if ab is None or altura is None or altura <= 0:
            return None
        return round(ab * altura * factor_forma, 6)

    @classmethod
    def calcular_dap_redondeado(cls, dap_m: Any, intervalo: float = 0.05) -> Optional[float]:
        """Agrupa el DAP en clases diamétricas fijas (por defecto cada 5 cm / 0.05 m)."""
        dap = cls._to_float(dap_m)
        if dap is None or dap <= 0:
            return None
        return round(math.floor(dap / intervalo) * intervalo, 2)

    @classmethod
    def calcular_biomasa_y_carbono(
        cls,
        dap_cm: Any, 
        altura_m: Any, 
        densidad_madera: Any = 0.6
    ) -> Dict[str, Optional[float]]:
        """
        Calcula la Biomasa Aérea Total (AGB) y el Carbono Almacenado
        utilizando ecuaciones alométricas para bosques tropicales (Chave et al., 2014).

        AGB = 0.0673 * (ρ * DAP^2 * H)^0.976
        Carbono = AGB * FACTOR_CARBONO
        """
        try:
            dap = cls._to_float(dap_cm)
            alt = cls._to_float(altura_m)
            rho = cls._to_float(densidad_madera) or 0.6

            if dap is None or alt is None or dap <= 0 or alt <= 0:
                return {
                    "biomasa_kg": None,
                    "carbono_kg": None,
                    "co2_equivalente_kg": None
                }

            agb_kg = 0.0673 * math.pow((rho * (dap ** 2) * alt), 0.976)
            carbono_kg = agb_kg * cls.FACTOR_CARBONO
            co2_eq_kg = carbono_kg * cls.RELACION_CO2_C

            return {
                "biomasa_kg": round(agb_kg, 2),
                "carbono_kg": round(carbono_kg, 2),
                "co2_equivalente_kg": round(co2_eq_kg, 2)
            }

        except Exception as e:
            return {
                "biomasa_kg": None,
                "carbono_kg": None,
                "co2_equivalente_kg": None,
                "error": str(e)
            }

    @classmethod
    def procesar_arbol_completo(
        cls, 
        dap_m: Any, 
        altura_total_m: Any, 
        densidad_madera: Any = 0.60,
        factor_forma: float = 0.7
    ) -> Dict[str, Optional[float]]:
        """Ejecuta el pipeline dasométrico y de servicios ecosistémicos."""
        dap_float = cls._to_float(dap_m)
        area_basal = cls.calcular_area_basal(dap_m)
        volumen = cls.calcular_volumen_total(dap_m, altura_total_m, factor_forma)
        
        dap_cm = (dap_float * 100.0) if dap_float else None
        
        res_biomasa = cls.calcular_biomasa_y_carbono(
            dap_cm=dap_cm, 
            altura_m=altura_total_m, 
            densidad_madera=densidad_madera
        )

        return {
            "area_basal_m2": area_basal,
            "volumen_total_m3": volumen,
            "biomasa_aerea_kg": res_biomasa.get("biomasa_kg"),
            "carbono_kg": res_biomasa.get("carbono_kg"),
            "co2_equivalente_kg": res_biomasa.get("co2_equivalente_kg"),
            "clase_diametrica_m": cls.calcular_dap_redondeado(dap_m)
        }


# Wrappers globales a nivel de módulo para compatibilidad con imports directos
def to_float(val: Any) -> Optional[float]:
    return AlometriaService._to_float(val)

def calcular_area_basal(dap_m: Any) -> Optional[float]:
    return AlometriaService.calcular_area_basal(dap_m)

def calcular_volumen_total(dap_m: Any, altura_total_m: Any, factor_forma: float = 0.7) -> Optional[float]:
    return AlometriaService.calcular_volumen_total(dap_m, altura_total_m, factor_forma)

def calcular_dap_redondeado(dap_m: Any, intervalo: float = 0.05) -> Optional[float]:
    return AlometriaService.calcular_dap_redondeado(dap_m, intervalo)

def calcular_biomasa_y_carbono(
    dap_cm: Any, 
    altura_m: Any, 
    densidad_madera: Any = 0.6
) -> Dict[str, Optional[float]]:
    return AlometriaService.calcular_biomasa_y_carbono(
        dap_cm=dap_cm, 
        altura_m=altura_m, 
        densidad_madera=densidad_madera
    )

def procesar_arbol_completo(
    dap_m: Any, 
    altura_total_m: Any, 
    densidad_madera: Any = 0.60,
    factor_forma: float = 0.7
) -> Dict[str, Optional[float]]:
    return AlometriaService.procesar_arbol_completo(
        dap_m=dap_m,
        altura_total_m=altura_total_m,
        densidad_madera=densidad_madera,
        factor_forma=factor_forma
    )

def calcular_servicios_ecosistemicos(dap_cm: float, altura_m: float, densidad_madera: float = 0.6) -> dict:
    """
    Calcula AGB, Carbono y CO2e usando el modelo alométrico de Chave et al. (2014)
    para bosques húmedos tropicales.
    
    :param dap_cm: Diámetro a la Altura del Pecho en cm (DAP)
    :param altura_m: Altura total en metros (H)
    :param densidad_madera: Densidad básica de la madera en g/cm3 (rho) - Defecto: 0.6
    :return: Diccionario con AGB_kg, Carbono_kg y CO2e_kg
    """
    if dap_cm <= 0 or altura_m <= 0 or densidad_madera <= 0:
        return {"agb_kg": 0.0, "carbono_kg": 0.0, "co2e_kg": 0.0}

    # AGB = 0.0673 * (rho * DAP^2 * H)^0.976
    parametro_interno = densidad_madera * (dap_cm ** 2) * altura_m
    agb_kg = 0.0673 * math.pow(parametro_interno, 0.976)
    
    # C = AGB * 0.47
    carbono_kg = agb_kg * 0.47
    
    # CO2e = C * (44 / 12)
    co2e_kg = carbono_kg * (44.0 / 12.0)

    return {
        "agb_kg": round(agb_kg, 4),
        "carbono_kg": round(carbono_kg, 4),
        "co2e_kg": round(co2e_kg, 4)
    }