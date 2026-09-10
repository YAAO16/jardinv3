import React from 'react';
import { FiImage, FiFileText } from 'react-icons/fi';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';

const ExportButtons = ({ chartRef, title = 'grafico' }) => {
  const exportImage = async () => {
    if (!chartRef.current) return toast.error('No hay gráfico para exportar');
    
    try {
      toast.loading('Generando imagen...', { id: 'export' });
      const canvas = await html2canvas(chartRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.download = `${title}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Imagen exportada', { id: 'export' });
    } catch (error) {
      console.error(error);
      toast.error('Error al exportar imagen', { id: 'export' });
    }
  };

  const exportPDF = async () => {
    if (!chartRef.current) return toast.error('No hay gráfico para exportar');
    
    try {
      toast.loading('Generando PDF...', { id: 'export' });
      const canvas = await html2canvas(chartRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const imgWidth = 280;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save(`${title}.pdf`);
      toast.success('PDF exportado', { id: 'export' });
    } catch (error) {
      console.error(error);
      toast.error('Error al exportar PDF', { id: 'export' });
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={exportImage}
        className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition text-sm"
      >
        <FiImage /> Imagen
      </button>
      <button
        onClick={exportPDF}
        className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-sm"
      >
        <FiFileText /> PDF
      </button>
    </div>
  );
};

export default ExportButtons;