import React from 'react';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';

const ExportButton = ({ data = [], filename = 'export', label = 'Export Excel', className = '' }) => {
  const handleExport = () => {
    if (!data.length) return;
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  return (
    <button
      onClick={handleExport}
      disabled={!data.length}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 text-sm font-semibold hover:bg-emerald-600/30 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
    >
      <Download size={16} />
      {label}
    </button>
  );
};

export default ExportButton;
