import scipy.stats as stats
import numpy as np

class StatsInferencialService:
    @staticmethod
    def ejecutar_prueba_latencia(tiempos_tradicional: list, tiempos_websig: list) -> dict:
        """
        Ejecuta la prueba t de Student para muestras pareadas y la prueba de rangos de Wilcoxon 
        sobre las mediciones de latencia (Método tradicional vs. Web-SIG).
        Calcula el tamaño del efecto (d de Cohen).
        """
        arr_trad = np.array(tiempos_tradicional)
        arr_sig = np.array(tiempos_websig)

        # 1. Prueba t de Student pareada
        t_stat, p_val_t = stats.ttest_rel(arr_trad, arr_sig)
        df = len(arr_trad) - 1

        # 2. Tamaño del efecto (d de Cohen para muestras pareadas)
        diferencias = arr_trad - arr_sig
        d_cohen = np.mean(diferencias) / np.std(diferencias, ddof=1)

        # 3. Intervalo de Confianza al 95% para la diferencia de medias
        mean_diff = np.mean(diferencias)
        sem = stats.sem(diferencias)
        ci_95 = stats.t.interval(0.95, df, loc=mean_diff, scale=sem)

        # 4. Prueba de Rangos con Signo de Wilcoxon (No paramétrica de respaldo)
        w_stat, p_val_w = stats.wilcoxon(arr_trad, arr_sig)

        return {
            "prueba_t": {
                "estadistico_t": round(float(t_stat), 4),
                "grados_libertad": int(df),
                "p_value": float(p_val_t),
                "es_significativo": bool(p_val_t < 0.001),
                "intervalo_confianza_95": [round(ci_95[0], 4), round(ci_95[1], 4)],
                "d_de_cohen": round(float(d_cohen), 4)
            },
            "prueba_wilcoxon": {
                "estadistico_w": round(float(w_stat), 4),
                "p_value": float(p_val_w)
            }
        }