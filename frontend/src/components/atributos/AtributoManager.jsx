import React, { useState, useEffect } from 'react'
import { atributosApi } from '../../api/atributosApi'
import { Plus, Trash2, Edit, Save, X } from 'lucide-react'
import toast from 'react-hot-toast'

const AtributoManager = ({ arbolId }) => {
  const [atributos, setAtributos] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState(null)
  const [formData, setFormData] = useState({
    NombreCampo: '',
    ValorTexto: '',
    ValorNumero: '',
    ValorFecha: '',
    ValorBooleano: false
  })

  useEffect(() => {
    if (arbolId) {
      cargarAtributos()
    }
  }, [arbolId])

  const cargarAtributos = async () => {
    try {
      setLoading(true)
      const data = await atributosApi.getByArbol(arbolId)
      setAtributos(data)
    } catch (error) {
      toast.error('Error al cargar atributos')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // Determinar qué valor enviar según el tipo de campo (por simplicidad, enviamos ValorTexto)
      const payload = {
        NombreCampo: formData.NombreCampo,
        ValorTexto: formData.ValorTexto || formData.ValorNumero || formData.ValorFecha || '',
        ValorNumero: parseFloat(formData.ValorNumero) || null,
        ValorFecha: formData.ValorFecha || null,
        ValorBooleano: formData.ValorBooleano
      }
      if (editando) {
        await atributosApi.update(editando.ID, payload)
        toast.success('Atributo actualizado')
      } else {
        await atributosApi.create(arbolId, payload)
        toast.success('Atributo agregado')
      }
      setShowForm(false)
      setEditando(null)
      setFormData({ NombreCampo: '', ValorTexto: '', ValorNumero: '', ValorFecha: '', ValorBooleano: false })
      cargarAtributos()
    } catch (error) {
      toast.error('Error al guardar atributo')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar este atributo?')) {
      try {
        await atributosApi.delete(id)
        toast.success('Atributo eliminado')
        cargarAtributos()
      } catch (error) {
        toast.error('Error al eliminar')
      }
    }
  }

  const handleEdit = (atributo) => {
    setEditando(atributo)
    setFormData({
      NombreCampo: atributo.NombreCampo,
      ValorTexto: atributo.ValorTexto || '',
      ValorNumero: atributo.ValorNumero || '',
      ValorFecha: atributo.ValorFecha || '',
      ValorBooleano: atributo.ValorBooleano || false
    })
    setShowForm(true)
  }

  if (!arbolId) {
    return (
      <div className="text-sm text-gray-400 italic">
        Guarda el árbol primero para agregar atributos dinámicos.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-semibold text-gray-700">Atributos dinámicos</h4>
        <button
          type="button"
          onClick={() => {
            setEditando(null)
            setFormData({ NombreCampo: '', ValorTexto: '', ValorNumero: '', ValorFecha: '', ValorBooleano: false })
            setShowForm(!showForm)
          }}
          className="text-sm text-forest-600 hover:text-forest-700 flex items-center gap-1"
        >
          <Plus size={16} /> Agregar campo
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="label text-xs">Nombre del campo</label>
              <input
                type="text"
                value={formData.NombreCampo}
                onChange={(e) => setFormData({ ...formData, NombreCampo: e.target.value })}
                className="input-field text-sm"
                required
              />
            </div>
            <div>
              <label className="label text-xs">Valor (texto)</label>
              <input
                type="text"
                value={formData.ValorTexto}
                onChange={(e) => setFormData({ ...formData, ValorTexto: e.target.value })}
                className="input-field text-sm"
                placeholder="Texto..."
              />
            </div>
            <div>
              <label className="label text-xs">Valor (número)</label>
              <input
                type="number"
                step="any"
                value={formData.ValorNumero}
                onChange={(e) => setFormData({ ...formData, ValorNumero: e.target.value })}
                className="input-field text-sm"
                placeholder="Número..."
              />
            </div>
            <div>
              <label className="label text-xs">Valor (fecha)</label>
              <input
                type="date"
                value={formData.ValorFecha}
                onChange={(e) => setFormData({ ...formData, ValorFecha: e.target.value })}
                className="input-field text-sm"
              />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <label className="label text-xs flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.ValorBooleano}
                  onChange={(e) => setFormData({ ...formData, ValorBooleano: e.target.checked })}
                />
                Booleano (Sí/No)
              </label>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="submit" className="btn-primary text-sm py-1 px-4 flex items-center gap-1">
              <Save size={16} /> {editando ? 'Actualizar' : 'Agregar'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setEditando(null) }}
              className="btn-secondary text-sm py-1 px-4"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">Cargando atributos...</p>
      ) : atributos.length === 0 ? (
        <p className="text-sm text-gray-400">No hay atributos adicionales.</p>
      ) : (
        <div className="space-y-2">
          {atributos.map((attr) => (
            <div key={attr.ID} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
              <div>
                <span className="font-medium text-sm text-gray-700">{attr.NombreCampo}:</span>
                <span className="ml-2 text-sm text-gray-600">
                  {attr.ValorTexto || attr.ValorNumero || attr.ValorFecha || (attr.ValorBooleano ? 'Sí' : 'No')}
                </span>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => handleEdit(attr)}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                >
                  <Edit size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(attr.ID)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AtributoManager