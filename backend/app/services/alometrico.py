import math
from decimal import Decimal

def to_float(val):
    if val is None:
        return None
    if isinstance(val, Decimal):
        return float(val)
    try:
        return float(val)
    except (TypeError, ValueError):
        return None

def calcular_biomasa_y_carbono(dap_m, altura_total_m, densidad_madera):
    """Calcula biomasa, carbono y CO2e según Chave et al. (2014)"""
    dap = to_float(dap_m)
    altura = to_float(altura_total_m)
    densidad = to_float(densidad_madera)
    if dap is None or altura is None or densidad is None or dap <= 0 or altura <= 0 or densidad <= 0:
        return None, None, None
    agb = 0.0673 * ((densidad * (dap ** 2) * altura) ** 0.976)
    carbono = agb * 0.47
    co2e = carbono * 3.67
    return round(agb, 4), round(carbono, 4), round(co2e, 4)

def calcular_area_basal(dap_m):
    dap = to_float(dap_m)
    if dap is None or dap <= 0:
        return None
    return round(math.pi * (dap / 2) ** 2, 6)

def calcular_dap_redondeado(dap_m, clase=0.05):
    dap = to_float(dap_m)
    if dap is None or dap <= 0:
        return None
    return round(round(dap / clase) * clase, 3)

def calcular_volumen_total(area_basal_m2, altura_total_m, factor_forma=0.7):
    ab = to_float(area_basal_m2)
    altura = to_float(altura_total_m)
    if ab is None or altura is None or ab <= 0 or altura <= 0:
        return None
    return round(ab * altura * factor_forma, 6)