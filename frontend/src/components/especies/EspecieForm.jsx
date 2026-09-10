import React, { useState, useEffect } from 'react'
import { especiesApi } from '../../api/especiesApi'
import { FiSave, FiX } from 'react-icons/fi'
import toast from 'react-hot-toast'

const EspecieForm = ({ editEspecie, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    NombreComun: '',
    NombreCientifico: '',
    Familia: '',
    Categoria: 'Parcela' // Valor por defecto según tu SQL
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (editEspecie) {
      setFormData({
        ...editEspecie,
        // Aseguramos que solo se use un valor válido para el ENUM
        Categoria: (editEspecie.Categoria === 'Parcela' || editEspecie.Categoria === 'Sendero') 
                   ? editEspecie.Categoria 
                   : 'Parcela'
      })
    }
  }, [editEspecie])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.NombreComun || !formData.NombreComun.trim()) {
      newErrors.NombreComun = 'El nombre común es obligatorio'
    }
    if (!formData.NombreCientifico || !formData.NombreCientifico.trim()) {
      newErrors.NombreCientifico = 'El nombre científico es obligatorio'
    }
    setErrors(newErrors)
    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = validate()
    if (Object.keys(newErrors).length > 0) {
      toast.error(Object.values(newErrors)[0])
      return
    }

    // Aseguramos que el valor de Categoria sea exactamente 'Parcela' o 'Sendero'
    const datosEnvio = { ...formData }
    if (datosEnvio.Categoria !== 'Parcela' && datosEnvio.Categoria !== 'Sendero') {
      datosEnvio.Categoria = 'Parcela' // Fallback por seguridad
    }

    try {
      if (editEspecie) {
        await especiesApi.update(editEspecie.EspecieID, datosEnvio)
        toast.success('Especie actualizada')
      } else {
        await especiesApi.create(datosEnvio)
        toast.success('Especie registrada')
      }
      onSuccess()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al guardar la especie')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Nombre Común <span className="text-red-500">*</span></label>
        <input
          type="text"
          name="NombreComun"
          value={formData.NombreComun || ''}
          onChange={handleChange}
          className={`input-field ${errors.NombreComun ? 'border-red-500' : ''}`}
          placeholder="Ej: Roble"
        />
        {errors.NombreComun && <p className="text-red-500 text-xs mt-1">{errors.NombreComun}</p>}
      </div>

      <div>
        <label className="label">Nombre Científico <span className="text-red-500">*</span></label>
        <input
          type="text"
          name="NombreCientifico"
          value={formData.NombreCientifico || ''}
          onChange={handleChange}
          className={`input-field ${errors.NombreCientifico ? 'border-red-500' : ''}`}
          placeholder="Ej: Quercus robur"
        />
        {errors.NombreCientifico && <p className="text-red-500 text-xs mt-1">{errors.NombreCientifico}</p>}
      </div>

      <div>
        <label className="label">Familia</label>
        <input
          type="text"
          name="Familia"
          value={formData.Familia || ''}
          onChange={handleChange}
          className="input-field"
          placeholder="Ej: Fagaceae"
        />
      </div>

      {/* Select con SOLO las opciones de tu base de datos */}
      <div>
        <label className="label">Categoría</label>
        <select
          name="Categoria"
          value={formData.Categoria || 'Parcela'}
          onChange={handleChange}
          className="input-field"
        >
          <option value="Parcela">Parcela</option>
          <option value="Sendero">Sendero</option>
        </select>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t mt-4">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancelar</button>
        <button type="submit" className="btn-primary flex items-center gap-2">
          <FiSave /> {editEspecie ? 'Actualizar Especie' : 'Registrar Especie'}
        </button>
      </div>
    </form>
  )
}

export default EspecieForm