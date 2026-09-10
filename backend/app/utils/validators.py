def validate_numeric(value):
    """Convierte a float o devuelve None."""
    if value is None or value == '':
        return None
    try:
        if isinstance(value, str):
            value = value.strip().replace(',', '.')
        return float(value)
    except (ValueError, TypeError):
        return None