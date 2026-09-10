def dms_to_dd(dms_str):
    """Convierte coordenadas DMS (ej. 12°34'56.78"N) a grados decimales."""
    if not dms_str:
        return None
    try:
        dms_str = dms_str.strip().replace(' ', '')
        direccion = dms_str[-1] if dms_str[-1] in 'NSWE' else ''
        if direccion:
            dms_str = dms_str[:-1]
        
        if '°' in dms_str:
            parts = dms_str.replace('°', ' ').replace("'", ' ').replace('"', ' ').split()
            if len(parts) >= 3:
                grados = float(parts[0])
                minutos = float(parts[1])
                segundos = float(parts[2])
            elif len(parts) == 2:
                grados = float(parts[0])
                minutos = float(parts[1])
                segundos = 0
            else:
                return float(parts[0])
        else:
            return float(dms_str)
        
        dd = grados + minutos/60 + segundos/3600
        if direccion in 'SW':
            dd = -dd
        return round(dd, 6)
    except:
        return None