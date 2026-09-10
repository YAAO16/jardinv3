// Importar el componente
import AtributoManager from '../atributos/AtributoManager'

// Dentro del render, después de los campos del formulario:
{isEditing && (
  <div className="form-group full-width">
    <AtributoManager arbolId={formData.MedicionArbolID} />
  </div>
)}