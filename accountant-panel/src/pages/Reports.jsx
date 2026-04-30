import React from 'react';
import { BarChart3, Search, Download, FileSpreadsheet } from 'lucide-react';
import Table from '../components/Table';
import Filters from '../components/Filters';
import useReportStore from '../store/useReportStore';
import * as XLSX from 'xlsx';

const labourColumns = [
  {
    key: 'labourName', label: 'Name', render: (v, row) => (
      <div>
        <p className="font-semibold text-gray-900">{v || '—'}</p>
        <p className="text-[10px] text-gray-500">{row.role || 'Labour'} · {row.gender || ''}</p>
      </div>
    )
  },
  { key: 'presentDays', label: 'Present Days', render: (v) => <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">{v || 0}</span> },
  { key: 'absentDays', label: 'Absent Days', render: (v) => <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">{v || 0}</span> },
  { key: 'totalDays', label: 'Total Days', render: (v) => <span className="font-semibold text-gray-800">{v || 0}</span> },
  { key: 'totalProduction', label: 'Production', render: (v) => <span className="font-mono font-bold text-gray-900">{v || 0}</span> },
  { key: 'totalBonus', label: 'Bonus (₹)', render: (v) => <span className="font-mono font-semibold text-amber-700">₹{Number(v || 0).toLocaleString('en-IN')}</span> },
  { key: 'totalOvertime', label: 'Overtime (₹)', render: (v) => <span className="font-mono font-semibold text-blue-700">₹{Number(v || 0).toLocaleString('en-IN')}</span> },
];

const thakdarColumns = [
  {
    key: 'workerName', label: 'Worker Name', render: (v, row) => (
      <div>
        <p className="font-bold text-gray-900">{v || '—'}</p>
        <p className="text-[10px] text-gray-500">{row.gender || 'Unknown'}</p>
      </div>
    )
  },
  {
    key: 'foremanName', label: 'Assigned Foreman', render: (v) => (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">{v || '—'}</span>
    )
  },
  { key: 'productName', label: 'Product Name', render: (v) => <span className="font-medium text-purple-700">{v || '—'}</span> },
  { key: 'totalEntries', label: 'Entries', render: (v) => <span className="font-semibold text-gray-700">{v || 0}</span> },
  { key: 'totalDispatchWork', label: 'Total Qty Dispatched', render: (v) => <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">{v || 0}</span> },
];

const Reports = () => {
  const { reports, isLoading, filters, setFilters, fetchReports, clearReports } = useReportStore();

  const handleFilterChange = (changed) => {
    setFilters(changed);
  };

  const handleTabChange = (type) => {
    setFilters({ type });
    clearReports();
  };

  const handleSearch = () => {
    fetchReports({ ...filters });
  };

  const exportData = filters.type === 'labour'
    ? reports.map((r) => ({
      'Name': r.labourName || '',
      'Role': r.role || 'Labour',
      'Gender': r.gender || '',
      'Present Days': r.presentDays || 0,
      'Absent Days': r.absentDays || 0,
      'Total Days': r.totalDays || 0,
      'Production': r.totalProduction || 0,
      'Bonus (₹)': r.totalBonus || 0,
      'Overtime (₹)': r.totalOvertime || 0,
    }))
    : reports.map((r) => ({
      'Worker Name': r.workerName || '',
      'Gender': r.gender || '',
      'Assigned Foreman': r.foremanName || '',
      'Product Name': r.productName || '',
      'Total Entries': r.totalEntries || 0,
      'Total Qty Dispatched': r.totalDispatchWork || 0,
    }));

  const handleDownload = () => {
    if (!exportData.length) return;
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `lamba-wheels-${filters.type}-report.xlsx`);
  };

  return (
    <div className="space-y-5 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-black font-bold text-lg flex items-center gap-2">
            <BarChart3 size={20} className="text-amber-400" />
            Reports &amp; Analytics
          </h2>
          <p className="text-gray-500 text-xs mt-0.5">Filter, analyze and export production &amp; salary data</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => handleTabChange('labour')}
          className={`px-5 py-2.5 text-sm font-bold rounded-t-xl transition-all ${
            filters.type === 'labour'
              ? 'bg-[#13151f] text-white border-t border-l border-r border-white/10'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          Labour Report
        </button>
        <button
          onClick={() => handleTabChange('thakdar')}
          className={`px-5 py-2.5 text-sm font-bold rounded-t-xl transition-all ${
            filters.type === 'thakdar'
              ? 'bg-[#13151f] text-white border-t border-l border-r border-white/10'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          Thakdar Report
        </button>
      </div>

      {/* Filters */}
      <div className="bg-[#13151f] border border-white/5 rounded-2xl p-5">
        <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Filters</p>
        <div className="flex flex-wrap items-center gap-3">
          <Filters filters={filters} onChange={handleFilterChange} showForeman />
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-600/20 border border-amber-500/30 text-amber-400 text-sm font-semibold rounded-xl hover:bg-amber-600/30 transition-all disabled:opacity-60"
          >
            <Search size={15} />
            {isLoading ? 'Searching...' : 'Search'}
          </button>
          {reports.length > 0 && (
            <button
              onClick={clearReports}
              className="text-xs text-gray-500 hover:text-red-400 transition-colors px-2 py-1"
            >
              Clear results
            </button>
          )}
        </div>
      </div>

      {/* Summary Row */}
      {reports.length > 0 && filters.type === 'labour' && (
        <div className="flex flex-wrap gap-4 text-sm bg-[#13151f] border border-white/5 rounded-2xl p-4">
          <span className="text-gray-500">
            <span className="text-white font-bold">{reports.length}</span> workers found
          </span>
          <span className="text-gray-500">
            Total Production:{' '}
            <span className="text-emerald-400 font-bold">
              {reports.reduce((s, r) => s + (r.totalProduction || 0), 0).toLocaleString()}
            </span>
          </span>
          <span className="text-gray-500">
            Total Bonus:{' '}
            <span className="text-amber-400 font-bold">
              ₹{reports.reduce((s, r) => s + (r.totalBonus || 0), 0).toLocaleString('en-IN')}
            </span>
          </span>
          <span className="text-gray-500">
            Total Overtime:{' '}
            <span className="text-blue-400 font-bold">
              ₹{reports.reduce((s, r) => s + (r.totalOvertime || 0), 0).toLocaleString('en-IN')}
            </span>
          </span>
        </div>
      )}

      {reports.length > 0 && filters.type === 'thakdar' && (
        <div className="flex flex-wrap gap-4 text-sm bg-[#13151f] border border-white/5 rounded-2xl p-4">
          <span className="text-gray-500">
            <span className="text-white font-bold">{reports.length}</span> entries found
          </span>
          <span className="text-gray-500">
            Total Qty Dispatched:{' '}
            <span className="text-emerald-400 font-bold">
              {reports.reduce((s, r) => s + (r.totalDispatchWork || 0), 0).toLocaleString()}
            </span>
          </span>
        </div>
      )}

      {/* Download Report Button — above table */}
      {reports.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-gray-400 text-sm font-semibold">
            {filters.type === 'labour' ? '👷 Labour Report' : '📋 Thakdar Report'} &nbsp;
            <span className="text-gray-500 font-normal">({reports.length} records)</span>
          </p>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-900/30 transition-all duration-200"
          >
            <FileSpreadsheet size={16} />
            Download Report
            <Download size={14} />
          </button>
        </div>
      )}

      {/* Table */}
      <Table
        columns={filters.type === 'labour' ? labourColumns : thakdarColumns}
        data={reports}
        isLoading={isLoading}
        emptyMessage="Select a date range and click Search to load reports."
      />
    </div>
  );
};

export default Reports;
