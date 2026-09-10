import React, { useState, useEffect } from 'react'
import { adminApi } from '../../api/adminApi'
import { Plus, Trash2, RefreshCw, Edit, Save, X } from 'lucide-react'
import toast from 'react-hot-toast'

const GestionColumnas = ({ tabla }) => {
  const [columnas, setColumnas] = useState([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando] = useState(null)
  const [nuevaColumna, setNuevaColumna] = useState({
    nombre: '',
    tipo: 'VARCHAR(255)',
    nullable: true,
    default: ''
  })
  const [edicionData, setEdicionData] = useState({
    nuevo_nombre: '',
    nuevo_tipo: '',
    nueva_nullable: true,
    nuevo_default: ''
  })

  const tiposPermitidos = [
    'VARCHAR(255)', 'INT', 'DECIMAL(10,2)', 'BOOLEAN', 'DATE', 'TEXT', 'FLOAT', 'DOUBLE'
  ]

  useEffect(() => {
    cargarColumnas()
  }, [tabla])

  const cargarColumnas = async () => {
    try {
      setLoading(true)
      const data = await adminApi.getEstructura(tabla)
      setColumnas(data)
    } catch (error) {
      toast.error('Error al cargar estructura')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await adminApi.agregarColumna(tabla, nuevaColumna)
      toast.success(`Columna ${nuevaColumna.nombre} agregada`)
      setMostrarForm(false)
      setNuevaColumna({ nombre: '', tipo: 'VARCHAR(255)', nullable: true, default: '' })
      cargarColumnas()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al agregar columna')
    }
  }

  const handleDelete = async (nombreColumna) => {
    if (!window.confirm(`¿Eliminar la columna "${nombreColumna}"?`)) return
    try {
      await adminApi.eliminarColumna(tabla, nombreColumna)
      toast.success(`Columna ${nombreColumna} eliminada`)
      cargarColumnas()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al eliminar')
    }
  }

  const iniciarEdicion = (col) => {
    setEditando(col.Field)
    setEdicionData({
      nuevo_nombre: col.Field,
      nuevo_tipo: col.Type,
      nueva_nullable: col.Null === 'YES',
      nuevo_default: col.Default || ''
    })
  }

  const cancelarEdicion = () => {
    setEditando(null)
    setEdicionData({ nuevo_nombre: '', nuevo_tipo: '', nueva_nullable: true, nuevo_default: '' })
  }

  const guardarEdicion = async (nombreOriginal) => {
    try {
      await adminApi.editarColumna(tabla, nombreOriginal, edicionData)
      toast.success(`Columna ${nombreOriginal} actualizada`)
      setEditando(null)
      cargarColumnas()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al actualizar')
    }
  }

  if (loading) return <div className="animate-pulse">Cargando estructura...</div>

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-lg font-semibold text-gray-700">Estructura de {tabla}</h4>
        <button onClick={() => setMostrarForm(!mostrarForm)} className="btn-primary text-sm flex items-center gap-1">
          <Plus size={16} /> Agregar Columna
        </button>
      </div>

      {mostrarForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="label">Nombre</label>
              <input type="text" value={nuevaColumna.nombre} onChange={(e) => setNuevaColumna({ ...nuevaColumna, nombre: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="label">Tipo</label>
              <select value={nuevaColumna.tipo} onChange={(e) => setNuevaColumna({ ...nuevaColumna, tipo: e.target.value })} className="input-field">
                {tiposPermitidos.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={nuevaColumna.nullable} onChange={(e) => setNuevaColumna({ ...nuevaColumna, nullable: e.target.checked })} />
              Permitir NULL
            </label>
            <div>
              <label className="label">Valor por defecto</label>
              <input type="text" value={nuevaColumna.default} onChange={(e) => setNuevaColumna({ ...nuevaColumna, default: e.target.value })} className="input-field" placeholder="NULL" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary">Agregar</button>
            <button type="button" onClick={() => setMostrarForm(false)} className="btn-secondary">Cancelar</button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr><th className="text-left py-2 px-3">Campo</th><th className="text-left py-2 px-3">Tipo</th><th className="text-left py-2 px-3">Nulo</th><th className="text-left py-2 px-3">Default</th><th className="text-left py-2 px-3">Extra</th><th className="text-left py-2 px-3">Acciones</th></tr>
          </thead>
          <tbody>
            {columnas.map((col) => {
              const esEdicion = editando === col.Field
              return (
                <tr key={col.Field} className="border-b border-gray-100 hover:bg-gray-50">
                  {esEdicion ? (
                    <>
                      <td className="py-2 px-3"><input type="text" value={edicionData.nuevo_nombre} onChange={(e) => setEdicionData({ ...edicionData, nuevo_nombre: e.target.value })} className="input-field text-sm" /></td>
                      <td className="py-2 px-3"><select value={edicionData.nuevo_tipo} onChange={(e) => setEdicionData({ ...edicionData, nuevo_tipo: e.target.value })} className="input-field text-sm">{tiposPermitidos.map(t => <option key={t} value={t}>{t}</option>)}</select></td>
                      <td className="py-2 px-3"><input type="checkbox" checked={edicionData.nueva_nullable} onChange={(e) => setEdicionData({ ...edicionData, nueva_nullable: e.target.checked })} /></td>
                      <td className="py-2 px-3"><input type="text" value={edicionData.nuevo_default} onChange={(e) => setEdicionData({ ...edicionData, nuevo_default: e.target.value })} className="input-field text-sm" placeholder="NULL" /></td>
                      <td className="py-2 px-3">{col.Extra || '-'}</td>
                      <td className="py-2 px-3">
                        <button onClick={() => guardarEdicion(col.Field)} className="text-green-600 hover:bg-green-50 p-1 rounded"><Save size={16} /></button>
                        <button onClick={cancelarEdicion} className="text-gray-500 hover:bg-gray-50 p-1 rounded ml-1"><X size={16} /></button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-2 px-3 font-mono">{col.Field}</td>
                      <td className="py-2 px-3">{col.Type}</td>
                      <td className="py-2 px-3">{col.Null === 'YES' ? '✅' : '❌'}</td>
                      <td className="py-2 px-3">{col.Default || '-'}</td>
                      <td className="py-2 px-3">{col.Extra || '-'}</td>
                      <td className="py-2 px-3">
                        {!['MedicionArbolID', 'EspecieID', 'UsuarioID', 'RolID'].includes(col.Field) && (
                          <>
                            <button onClick={() => iniciarEdicion(col)} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><Edit size={16} /></button>
                            <button onClick={() => handleDelete(col.Field)} className="text-red-600 hover:bg-red-50 p-1 rounded ml-1"><Trash2 size={16} /></button>
                          </>
                        )}
                      </td>
                    </>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default GestionColumnas