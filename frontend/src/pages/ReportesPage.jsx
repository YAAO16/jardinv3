import React from 'react';
import ChartBuilder from '../components/reportes/ChartBuilder';

const ReportesPage = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">📊 Reportes y Gráficos</h1>
      <ChartBuilder />
    </div>
  );
};

export default ReportesPage;