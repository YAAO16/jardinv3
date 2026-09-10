import React, { useState, useEffect } from 'react'
import { arbolesApi } from '../../api/arbolesApi'
import { FiSave, FiX, FiUpload } from 'react-icons/fi'
import toast from 'react-hot-toast'

// Función de cálculo alométrico
const calcularBiomasa = (dap, altura, densidad) => {
  if (!dap || !altura || !densidad || dap <= 0 || altura <= 0 || densidad <= 0) {
    return { biomasa: null, carbono: null, co2e: null }
  }
  const agb = 0.0673 * Math.pow((densidad * Math.pow(dap, 2) * altura), 0.976)
  const carbono = agb * 0.47
  const co2e = carbono * 3.67
  return { biomasa: agb.toFixed(4), carbono: carbono.toFixed(4), co2e: co2e.toFixed(4) }
}

const ArbolForm = ({ especies, editArbol, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    EspecieID: '', NumeroArbol: '', Factor: '', CAP_Cm: '', CAP_M: '', DAP_M: '', 
    AlturaTotal_Mts: '', AlturaComercial_Mts: '', DensidadMadera: '', PuntoGPS: '', 
    Latitud: '', Longitud: '', ProyeccionCopa_X: false, ProyeccionCopa_Y: false,
    EstadoSanitario: 'BUENO', PresenciaEpifitas: false, PresenciaNidos: false,
    PresenciaOtraFauna: false, Observaciones: '', Transecto: '', ImagenURL: ''
  })
  const [preview, setPreview] = useState({ biomasa: null, carbono: null, co2e: null })
  const [errors, setErrors] = useState({})
  const [imagenFile, setImagenFile] = useState(null)
  const [imagenPreview, setImagenPreview] = useState(null)

  useEffect(() => {
    if (editArbol) {
      setFormData({
        ...editArbol,
        NumeroArbol: String(editArbol.NumeroArbol || ''),
        DensidadMadera: editArbol.DensidadMadera || '',
      })
      if (editArbol.ImagenURL) {
        const url = editArbol.ImagenURL.startsWith('http') ? editArbol.ImagenURL : `http://localhost:8001${editArbol.ImagenURL}`
        setImagenPreview(url)
      }
    }
  }, [editArbol])

  // Vista previa en tiempo real
  useEffect(() => {
    const dap = parseFloat(formData.DAP_M)
    const altura = parseFloat(formData.AlturaTotal_Mts)
    const densidad = parseFloat(formData.DensidadMadera)
    setPreview(calcularBiomasa(dap, altura, densidad))
  }, [formData.DAP_M, formData.AlturaTotal_Mts, formData.DensidadMadera])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleImagenChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Solo se permiten imágenes'); return }
    if (file.size > 5 * 1024 * 1024) { toast.error('La imagen no puede superar 5MB'); return }
    setImagenFile(file)
    const reader = new FileReader()
    reader.onload = () => setImagenPreview(reader.result)
    reader.readAsDataURL(file)
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.NumeroArbol || String(formData.NumeroArbol).trim() === '') newErrors.NumeroArbol = 'El número de árbol es obligatorio'
    if (!formData.EspecieID) newErrors.EspecieID = 'Debes seleccionar una especie'
    if (formData.DAP_M && isNaN(parseFloat(formData.DAP_M))) newErrors.DAP_M = 'El DAP debe ser un número válido'
    if (formData.AlturaTotal_Mts && isNaN(parseFloat(formData.AlturaTotal_Mts))) newErrors.AlturaTotal_Mts = 'La altura debe ser un número válido'
    if (formData.DensidadMadera && isNaN(parseFloat(formData.DensidadMadera))) newErrors.DensidadMadera = 'La densidad debe ser un número válido'
    setErrors(newErrors)
    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = validate()
    if (Object.keys(newErrors).length > 0) { toast.error(Object.values(newErrors)[0]); return }

    // 1. Crear una copia de los datos a enviar
    const datosEnvio = { ...formData }

    // 2. Eliminar campos calculados o relaciones que causan conflicto en el backend
    const camposIgnorar = [
      'BiomasaAerea_kg', 'Carbono_kg', 'CO2e_kg', 'AreaBasal_M2', 
      'VolumenTotal_M3', 'DAP_M_REDONDEO', 'MedicionArbolID', 
      'Especie', 'createdAt', 'updatedAt'
    ]
    camposIgnorar.forEach(c => delete datosEnvio[c])

    // 3. Sanitizar valores numéricos y vacíos
    Object.keys(datosEnvio).forEach(key => { 
      if (datosEnvio[key] === '') datosEnvio[key] = null 
    })

    if (datosEnvio.NumeroArbol) datosEnvio.NumeroArbol = String(datosEnvio.NumeroArbol)
    if (datosEnvio.EspecieID) datosEnvio.EspecieID = Number(datosEnvio.EspecieID)
    if (datosEnvio.DAP_M) datosEnvio.DAP_M = Number(datosEnvio.DAP_M)
    if (datosEnvio.AlturaTotal_Mts) datosEnvio.AlturaTotal_Mts = Number(datosEnvio.AlturaTotal_Mts)
    if (datosEnvio.DensidadMadera) datosEnvio.DensidadMadera = Number(datosEnvio.DensidadMadera)

    try {
      if (editArbol) {
        // Petición PUT
        await arbolesApi.update(editArbol.MedicionArbolID, datosEnvio)
        if (imagenFile) {
          await arbolesApi.uploadImage(editArbol.MedicionArbolID, imagenFile)
        }
        toast.success('Árbol actualizado')
      } else {
        // Petición POST
        const response = await arbolesApi.create(datosEnvio)
        const newId = response?.data?.id || response?.MedicionArbolID || response?.id || response
        if (imagenFile && newId) {
          await arbolesApi.uploadImage(newId, imagenFile)
        }
        toast.success('Árbol registrado')
      }
      
      // Llama a la función del padre para recargar la lista y cerrar modal/formulario
      onSuccess()
    } catch (error) { 
      console.error('Error al guardar:', error)
      toast.error(error.response?.data?.error || 'Error al guardar') 
    }
  }

  const isEditing = !!editArbol

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">Número de Árbol <span className="text-red-500">*</span></label>
          <input
            type="text"
            name="NumeroArbol"
            value={formData.NumeroArbol}
            onChange={handleChange}
            className={`input-field ${errors.NumeroArbol ? 'border-red-500' : ''}`}
            placeholder="Ej: 001"
          />
          {errors.NumeroArbol && <p className="text-red-500 text-xs mt-1">{errors.NumeroArbol}</p>}
        </div>
        <div>
          <label className="label">Especie <span className="text-red-500">*</span></label>
          <select
            name="EspecieID"
            value={formData.EspecieID}
            onChange={handleChange}
            className={`input-field ${errors.EspecieID ? 'border-red-500' : ''}`}
          >
            <option value="">Seleccionar...</option>
            {especies.map(esp => (
              <option key={esp.EspecieID} value={esp.EspecieID}>
                {esp.NombreCientifico} ({esp.NombreComun})
              </option>
            ))}
          </select>
          {errors.EspecieID && <p className="text-red-500 text-xs mt-1">{errors.EspecieID}</p>}
        </div>
        <div>
          <label className="label">Factor</label>
          <input type="number" step="0.01" name="Factor" value={formData.Factor} onChange={handleChange} className="input-field" />
        </div>
        <div>
          <label className="label">CAP (cm)</label>
          <input type="number" step="0.1" name="CAP_Cm" value={formData.CAP_Cm} onChange={handleChange} className="input-field" />
        </div>
        <div>
          <label className="label">CAP (m)</label>
          <input type="number" step="0.001" name="CAP_M" value={formData.CAP_M} onChange={handleChange} className="input-field" />
        </div>
        <div>
          <label className="label">DAP (m)</label>
          <input type="number" step="0.001" name="DAP_M" value={formData.DAP_M} onChange={handleChange} className={`input-field ${errors.DAP_M ? 'border-red-500' : ''}`} />
          {errors.DAP_M && <p className="text-red-500 text-xs mt-1">{errors.DAP_M}</p>}
        </div>
        <div>
          <label className="label">Altura Total (m)</label>
          <input type="number" step="0.01" name="AlturaTotal_Mts" value={formData.AlturaTotal_Mts} onChange={handleChange} className={`input-field ${errors.AlturaTotal_Mts ? 'border-red-500' : ''}`} />
          {errors.AlturaTotal_Mts && <p className="text-red-500 text-xs mt-1">{errors.AlturaTotal_Mts}</p>}
        </div>
        <div>
          <label className="label">Altura Comercial (m)</label>
          <input type="number" step="0.01" name="AlturaComercial_Mts" value={formData.AlturaComercial_Mts} onChange={handleChange} className="input-field" />
        </div>
        <div className="col-span-2 border-t pt-4">
          <label className="label font-semibold">🌳 Densidad de la madera (g/cm³) <span className="text-gray-400 font-normal">(ej. 0.65)</span></label>
          <input
            type="number"
            step="0.0001"
            name="DensidadMadera"
            value={formData.DensidadMadera}
            onChange={handleChange}
            className={`input-field ${errors.DensidadMadera ? 'border-red-500' : ''}`}
            placeholder="0.65"
          />
          {errors.DensidadMadera && <p className="text-red-500 text-xs mt-1">{errors.DensidadMadera}</p>}
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <h4 className="font-semibold text-forest-700 flex items-center gap-2">
          <span>🌿</span> Estimación de Servicios Ecosistémicos
          <span className="text-xs text-gray-500 font-normal">(vista previa)</span>
        </h4>
        <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
          <div><span className="text-gray-600">Biomasa Aérea:</span> <strong>{preview.biomasa !== null ? `${preview.biomasa} kg` : '⚠️ Datos incompletos'}</strong></div>
          <div><span className="text-gray-600">Carbono:</span> <strong>{preview.carbono !== null ? `${preview.carbono} kg` : '⚠️ Datos incompletos'}</strong></div>
          <div><span className="text-gray-600">CO₂ equivalente:</span> <strong className="text-forest-700">{preview.co2e !== null ? `${preview.co2e} kg` : '⚠️ Datos incompletos'}</strong></div>
        </div>
        <p className="text-xs text-gray-400 mt-2">* Estimado con modelo de Chave et al. (2014). Se guardará automáticamente.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">Punto GPS</label>
          <input type="text" name="PuntoGPS" value={formData.PuntoGPS} onChange={handleChange} className="input-field" />
        </div>
        <div>
          <label className="label">Transecto</label>
          <input type="text" name="Transecto" value={formData.Transecto} onChange={handleChange} className="input-field" />
        </div>
        <div>
          <label className="label">Latitud</label>
          <input type="number" step="any" name="Latitud" value={formData.Latitud} onChange={handleChange} className="input-field" />
        </div>
        <div>
          <label className="label">Longitud</label>
          <input type="number" step="any" name="Longitud" value={formData.Longitud} onChange={handleChange} className="input-field" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">Estado Sanitario</label>
          <select name="EstadoSanitario" value={formData.EstadoSanitario} onChange={handleChange} className="input-field">
            <option value="BUENO">🟢 Bueno</option>
            <option value="REGULAR">🟡 Regular</option>
            <option value="MALO">🔴 Malo</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="ProyeccionCopa_X" checked={formData.ProyeccionCopa_X} onChange={handleChange} />
            Proyección Copa X
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="ProyeccionCopa_Y" checked={formData.ProyeccionCopa_Y} onChange={handleChange} />
            Proyección Copa Y
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="PresenciaEpifitas" checked={formData.PresenciaEpifitas} onChange={handleChange} />
            Epífitas
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="PresenciaNidos" checked={formData.PresenciaNidos} onChange={handleChange} />
            Nidos
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="PresenciaOtraFauna" checked={formData.PresenciaOtraFauna} onChange={handleChange} />
            Fauna
          </label>
        </div>
      </div>

      <div>
        <label className="label">Observaciones</label>
        <textarea name="Observaciones" value={formData.Observaciones} onChange={handleChange} rows="3" className="input-field" />
      </div>

      <div>
        <label className="label">Imagen del árbol</label>
        <div className="flex items-center gap-4">
          {imagenPreview ? (
            <div className="relative">
              <img src={imagenPreview} alt="Previsualización" className="h-24 w-24 object-cover rounded-lg border" />
              <button
                type="button"
                onClick={() => { setImagenPreview(null); setImagenFile(null) }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
              >
                <FiX size={14} />
              </button>
            </div>
          ) : (
            <label className="cursor-pointer flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
              <FiUpload /> Seleccionar imagen
              <input type="file" accept="image/*" onChange={handleImagenChange} className="hidden" />
            </label>
          )}
          <span className="text-xs text-gray-400">JPG, PNG, GIF (máx. 5MB)</span>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancelar</button>
        <button type="submit" className="btn-primary flex items-center gap-2">
          <FiSave /> {isEditing ? 'Actualizar Árbol' : 'Registrar Árbol'}
        </button>
      </div>
    </form>
  )
}

export default ArbolForm