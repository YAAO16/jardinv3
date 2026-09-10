import React, { useState, useEffect, useRef } from 'react';
import { FiBarChart2, FiPieChart, FiTrendingUp, FiShare2, FiSave } from 'react-icons/fi';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement, RadialLinearScale } from 'chart.js';
import { Bar, Pie, Line, Scatter } from 'react-chartjs-2';
import { reportesApi } from '../../api/reportesApi';
import ExportButtons from './ExportButtons';
import toast from 'react-hot-toast';

// Registrar componentes de Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement, RadialLinearScale);

// Definir variables disponibles (y sus unidades)
const VARIABLES = [
  { id: 'EspecieID', label: 'Especie', type: 'category', field: 'NombreComun', icon: '🌳' },
  { id: 'NombreCientifico', label: 'Nombre Científico', type: 'category', icon: '🔬' },
  { id: 'EstadoSanitario', label: 'Estado Sanitario', type: 'category', icon: '🩺' },
  { id: 'Categoria', label: 'Categoría de Especie', type: 'category', icon: '🏷️' },
  { id: 'DAP_M', label: 'DAP (m)', type: 'numeric', icon: '📏' },
  { id: 'AlturaTotal_Mts', label: 'Altura Total (m)', type: 'numeric', icon: '📐' },
  { id: 'BiomasaAerea_kg', label: 'Biomasa Aérea (kg)', type: 'numeric', icon: '⚖️' },
  { id: 'CO2e_kg', label: 'CO2e (kg)', type: 'numeric', icon: '💨' },
];

const COLORS = ['#2d6a4f', '#40916c', '#52b788', '#74c69d', '#95d5b2', '#ffc107', '#fd7e14', '#dc3545'];

const ChartBuilder = () => {
  const [data, setData] = useState([]);
  const [selectedX, setSelectedX] = useState('EspecieID');
  const [selectedY, setSelectedY] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [chartType, setChartType] = useState('bar');
  const [chartTitle, setChartTitle] = useState('Distribución de Árboles');
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);
  const chartRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await reportesApi.getDatos();
      setData(response);
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const getValue = (item, variable) => {
    if (!variable) return null;
    // Para categorías, usamos el campo 'field' si existe, o el ID directamente
    if (variable.type === 'category') {
      return item[variable.field] || item[variable.id];
    }
    return parseFloat(item[variable.id]) || 0;
  };

  const processData = () => {
    if (!selectedX) return;
    
    setLoading(true);
    try {
      const xVar = VARIABLES.find(v => v.id === selectedX);
      const yVar = VARIABLES.find(v => v.id === selectedY) || null;
      const groupVar = VARIABLES.find(v => v.id === selectedGroup) || null;

      let processedData = [];

      if (chartType === 'scatter') {
        // Para dispersión solo necesitamos pares X, Y
        processedData = data.map(item => ({
          x: getValue(item, xVar),
          y: getValue(item, yVar),
        }));
      } else {
        // Agrupar por X
        const groups = {};
        data.forEach(item => {
          const key = String(getValue(item, xVar));
          if (!groups[key]) groups[key] = { sum: 0, count: 0, xKey: key };
          groups[key].sum += getValue(item, yVar);
          groups[key].count++;
        });

        processedData = Object.entries(groups).map(([key, value]) => ({
          x: key,
          y: yVar ? (value.sum / value.count).toFixed(2) : value.count,
        }));
      }

      // Configuración del gráfico según el tipo
      const config = {
        labels: processedData.map(p => p.x),
        datasets: [{
          label: yVar ? yVar.label : 'Cantidad',
          data: processedData.map(p => p.y),
          backgroundColor: chartType === 'pie' ? COLORS : COLORS[0],
          borderColor: '#fff',
          borderWidth: 2,
        }]
      };

      if (chartType === 'scatter') {
        config.datasets = [{
          label: `${xVar.label} vs ${yVar.label}`,
          data: processedData,
          backgroundColor: COLORS[0],
        }];
      }

      setChartData(config);
      toast.success('Gráfico generado');
    } catch (error) {
      console.error(error);
      toast.error('Error al procesar datos');
    } finally {
      setLoading(false);
    }
  };

  const getChartOptions = () => {
    const opts = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' },
        title: { display: true, text: chartTitle, font: { size: 16 } },
      },
    };
    
    if (chartType !== 'pie' && chartType !== 'scatter') {
      opts.scales = {
        y: { beginAtZero: true },
        x: { ticks: { autoSkip: false, maxRotation: 45 } }
      };
    }
    return opts;
  };

  const renderChart = () => {
    if (!chartData) return <div className="flex items-center justify-center h-full text-gray-400">Selecciona variables y haz clic en Generar</div>;
    
    switch (chartType) {
      case 'pie':
        return <Pie data={chartData} options={getChartOptions()} />;
      case 'line':
        return <Line data={chartData} options={getChartOptions()} />;
      case 'scatter':
        return <Scatter data={chartData} options={getChartOptions()} />;
      default:
        return <Bar data={chartData} options={getChartOptions()} />;
    }
  };

  // Guardar configuración en localStorage
  const saveChart = () => {
    const config = { title: chartTitle, type: chartType, x: selectedX, y: selectedY, group: selectedGroup };
    const savedCharts = JSON.parse(localStorage.getItem('savedCharts') || '[]');
    savedCharts.push({ ...config, id: Date.now() });
    localStorage.setItem('savedCharts', JSON.stringify(savedCharts));
    toast.success('Gráfico guardado');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 p-4">
      {/* Panel de Selección */}
      <div className="lg:col-span-1 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <h3 className="font-semibold text-gray-800 mb-3">1. Selecciona Variables</h3>
        
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1">Eje X (Horizontal)</label>
            <select 
              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500" 
              value={selectedX}
              onChange={(e) => setSelectedX(e.target.value)}
            >
              {VARIABLES.map(v => <option key={v.id} value={v.id}>{v.icon} {v.label}</option>)}
            </select>
          </div>
          
          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1">Eje Y (Vertical)</label>
            <select 
              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
              value={selectedY || ''}
              onChange={(e) => setSelectedY(e.target.value || null)}
            >
              <option value="">Cantidad (Conteo)</option>
              {VARIABLES.filter(v => v.type === 'numeric').map(v => <option key={v.id} value={v.id}>{v.icon} {v.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1">Agrupar por (Opcional)</label>
            <select 
              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
              value={selectedGroup || ''}
              onChange={(e) => setSelectedGroup(e.target.value || null)}
            >
              <option value="">Sin agrupar</option>
              {VARIABLES.filter(v => v.type === 'category').map(v => <option key={v.id} value={v.id}>{v.icon} {v.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1">Tipo de Gráfico</label>
            <div className="grid grid-cols-2 gap-2">
              <button className={`p-2 rounded-lg text-sm border ${chartType === 'bar' ? 'bg-forest-600 text-white border-forest-600' : 'border-gray-300 hover:bg-gray-50'}`} onClick={() => setChartType('bar')}>
                <FiBarChart2 className="mx-auto mb-1" /> Barras
              </button>
              <button className={`p-2 rounded-lg text-sm border ${chartType === 'line' ? 'bg-forest-600 text-white border-forest-600' : 'border-gray-300 hover:bg-gray-50'}`} onClick={() => setChartType('line')}>
                <FiTrendingUp className="mx-auto mb-1" /> Líneas
              </button>
              <button className={`p-2 rounded-lg text-sm border ${chartType === 'pie' ? 'bg-forest-600 text-white border-forest-600' : 'border-gray-300 hover:bg-gray-50'}`} onClick={() => setChartType('pie')}>
                <FiPieChart className="mx-auto mb-1" /> Pastel
              </button>
              <button className={`p-2 rounded-lg text-sm border ${chartType === 'scatter' ? 'bg-forest-600 text-white border-forest-600' : 'border-gray-300 hover:bg-gray-50'}`} onClick={() => setChartType('scatter')}>
                <FiShare2 className="mx-auto mb-1" /> Dispersión
              </button>
            </div>
          </div>

          <button onClick={processData} disabled={loading} className="w-full bg-forest-600 text-white py-2 rounded-lg font-medium hover:bg-forest-700 transition disabled:opacity-50">
            {loading ? 'Generando...' : 'Generar Gráfico'}
          </button>
        </div>
      </div>

      {/* Área del Gráfico */}
      <div className="lg:col-span-3 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <input 
            type="text" 
            value={chartTitle} 
            onChange={(e) => setChartTitle(e.target.value)}
            className="text-lg font-semibold text-gray-800 border-b border-transparent hover:border-gray-300 focus:outline-none focus:border-forest-500"
          />
          <div className="flex gap-2">
            <button onClick={saveChart} className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm">
              <FiSave /> Guardar
            </button>
            {/* Botón de Exportación */}
            {chartData && <ExportButtons chartRef={chartRef} title={chartTitle} />}
          </div>
        </div>

        <div className="h-[400px] relative" ref={chartRef}>
          {renderChart()}
        </div>
      </div>
    </div>
  );
};

export default ChartBuilder;