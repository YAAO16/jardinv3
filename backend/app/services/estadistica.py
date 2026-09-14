import numpy as np
from scipy import stats

def calcular_puntaje_sus(respuestas_likert: list) -> dict:
    """
    Calcula el puntaje System Usability Scale (SUS) a partir de un arreglo
    de respuestas Likert (1 a 5) de 10 preguntas por usuario.
    """
    puntajes_individuales = []
    
    for encuesta in respuestas_likert:
        # encuesta es una lista de 10 enteros [1..5]
        if len(encuesta) != 10:
            continue
        
        suma_items = 0
        for i, val in enumerate(encuesta):
            if (i + 1) % 2 != 0:
                # Ítems impares: valor - 1
                suma_items += (val - 1)
            else:
                # Ítems pares: 5 - valor
                suma_items += (5 - val)
                
        puntaje_usuario = suma_items * 2.5
        puntajes_individuales.append(puntaje_usuario)
        
    promedio_sus = float(np.mean(puntajes_individuales)) if puntajes_individuales else 0.0
    
    # Estimación de percentil aproximada (Curva Sauro & Lewis)
    # SUS = 68 equivale al percentil 50.
    percentil = float(stats.norm.cdf((promedio_sus - 68.0) / 12.5) * 100)
    
    return {
        "sus_score_promedio": round(promedio_sus, 2),
        "percentil_estimado": round(percentil, 2),
        "total_encuestados": len(puntajes_individuales)
    }

def ejecutar_prueba_t_latencia(tiempos_tradicional: list, tiempos_websig: list) -> dict:
    """
    Ejecuta prueba t de Student pareada e integra grados de libertad, p-value, 
    intervalo de confianza al 95% y tamaño del efecto (d de Cohen).
    """
    trad = np.array(tiempos_tradicional)
    sig = np.array(tiempos_websig)
    
    # Prueba t para muestras pareadas
    t_stat, p_val = stats.ttest_rel(trad, sig)
    df = len(trad) - 1
    
    # Diferencias
    diferencias = trad - sig
    media_dif = np.mean(diferencias)
    std_dif = np.std(diferencias, ddof=1)
    
    # Intervalo de Confianza al 95%
    se = std_dif / np.sqrt(len(trad))
    ic_inferior = media_dif - (1.96 * se)
    ic_superior = media_dif + (1.96 * se)
    
    # d de Cohen
    d_cohen = media_dif / std_dif if std_dif != 0 else 0.0
    
    return {
        "estadistico_t": round(float(t_stat), 4),
        "grados_libertad_df": int(df),
        "p_value": float(p_val),
        "es_significativo_p_001": bool(p_val < 0.001),
        "ic_95_porcentaje": [round(float(ic_inferior), 4), round(float(ic_superior), 4)],
        "d_de_cohen": round(float(d_cohen), 4)
    }