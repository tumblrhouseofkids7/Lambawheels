import React, { useState, useEffect } from 'react';
import { Calendar, Filter, Loader2, Download, Box } from 'lucide-react';
import { getProductions } from '../services/productionService';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const TotalProduction = () => {
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [shift, setShift] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [productions, setProductions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [startDate, endDate, shift]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (shift) params.shift = shift;
      const data = await getProductions(params);
      setProductions(data || []);
    } catch (error) {
      toast.error('Failed to load production data');
    } finally {
      setLoading(false);
    }
  };

  const filteredProductions = productions.filter(p => {
    if (filterType === 'All') return true;
    const lType = p.labour?.labourType;
    if (filterType === 'Simple') return !lType || lType === 'Simple';
    return lType === filterType;
  });

  const handleDownloadProductions = () => {
    if (filteredProductions.length === 0) { toast.error('No production data to download'); return; }
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.text(`Total Production Report - ${startDate} to ${endDate} ${shift ? `(Shift: ${shift})` : ''} (${filterType})`, 14, 15);
    const tableColumn = ["Date", "Worker", "Type", "Foreman", "Shift", "Att.", "Time", "Target", "Total", "Net", "Extra", "T.Reject", "R2", "R3", "Bonus", "Overtime"];
    const tableRows = filteredProductions.map(p => {
        const isPresent = p.attendance === 'Present';
        return [
        new Date(p.date).toLocaleDateString('en-GB'),
        p.labour?.name || 'Unknown',
        p.labour?.labourType && p.labour.labourType !== 'Simple' ? p.labour.labourType : '-',
        p.foreman?.name || '-',
        p.shiftType || '-',
        p.attendance,
        isPresent ? `${p.inTime || '-'} to ${p.outTime || '-'}` : '-',
        isPresent ? (p.targetProduction ?? 0) : '-',
        isPresent ? (p.totalProduction ?? 0) : '-',
        isPresent ? (p.netProduction ?? 0) : '-',
        isPresent ? (p.extraProduction ?? 0) : '-',
        isPresent ? (p.totalReject ?? 0) : '-',
        isPresent ? (p.reject2 ?? 0) : '-',
        isPresent ? (p.reject3 ?? 0) : '-',
        isPresent ? (p.bonusAmount?.toFixed(2) ?? '0.00') : '-',
        isPresent ? (p.overtimeHours ?? 0) : '-'
        ]
    });
    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 20, styles: { fontSize: 7, textColor: [0, 0, 0] } });
    doc.save(`Total_Production_Report.pdf`);
  };

  // Summaries
  const totalProduction   = filteredProductions.reduce((s, p) => s + (p.totalProduction || 0), 0);
  const totalNet          = filteredProductions.reduce((s, p) => s + (p.netProduction || 0), 0);
  const totalReject       = filteredProductions.reduce((s, p) => s + (p.totalReject || 0), 0);
  const totalOvertime     = filteredProductions.reduce((s, p) => s + (p.overtimeHours || 0), 0);
  const presentCount      = filteredProductions.filter(p => p.attendance === 'Present').length;
  const absentCount       = filteredProductions.filter(p => p.attendance === 'Absent').length;

  return (
    <div className="space-y-6 pb-8 w-full max-w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-xl font-black text-gray-900">Total Production Report</h1>
          <p className="text-gray-400 text-sm mt-0.5">Complete entry-wise breakdown with all data fields.</p>
        </div>
        <button
          onClick={handleDownloadProductions}
          className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" /> Download PDF
        </button>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-6">

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
          {[{ label: 'From Date', type: 'date', val: startDate, set: setStartDate },
            { label: 'To Date',   type: 'date', val: endDate,   set: setEndDate }].map(f => (
            <div key={f.label} className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{f.label}</label>
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-300">
                <Calendar className="w-4 h-4 text-gray-500" />
                <input type="date" value={f.val} onChange={e => f.set(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm text-black font-medium" />
              </div>
            </div>
          ))}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Shift</label>
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-300">
              <Filter className="w-4 h-4 text-gray-500" />
              <select value={shift} onChange={e => setShift(e.target.value)}
                className="bg-transparent border-none outline-none text-sm text-black w-28 font-medium">
                <option value="">All Shifts</option>
                <option value="Day">Day</option>
                <option value="Night">Night</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Type</label>
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-300">
              <Filter className="w-4 h-4 text-gray-500" />
              <select value={filterType} onChange={e => setFilterType(e.target.value)}
                className="bg-transparent border-none outline-none text-sm text-black w-28 font-medium">
                <option value="All">All Types</option>
                <option value="Simple">Simple</option>
                <option value="4 Die">4 Die</option>
                <option value="6 Die">6 Die</option>
              </select>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: 'Total Prod',   value: totalProduction.toLocaleString() },
            { label: 'Net Prod',     value: totalNet.toLocaleString() },
            { label: 'Total Reject', value: totalReject.toLocaleString() },
            { label: 'Overtime',     value: totalOvertime.toLocaleString() },
            { label: 'Entries',      value: `${presentCount}P / ${absentCount}A` },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-3 border text-center bg-gray-50 border-gray-200">
              <div className="text-[10px] font-bold uppercase tracking-wider mb-1 text-gray-600">{s.label}</div>
              <div className="text-lg font-black text-black">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Entries Table */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Box className="text-blue-500" size={18} />
            <h3 className="text-base font-bold text-gray-800">
              Production Entries
              <span className="text-xs bg-gray-200 text-black px-2 py-0.5 rounded-full font-bold ml-2">{filteredProductions.length}</span>
            </h3>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20 text-purple-600">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : filteredProductions.length === 0 ? (
            <div className="text-center py-16 text-black flex flex-col items-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <Calendar className="w-10 h-10 text-gray-400 mb-2" />
              <p className="text-sm font-medium">No production entries found for the selected dates and shift.</p>
            </div>
          ) : (
             <div className="overflow-x-auto rounded-xl border border-gray-200">
               <table className="w-full text-left border-collapse text-black bg-white min-w-[1200px]">
                 <thead>
                   <tr className="bg-gray-100 border-b-2 border-gray-300">
                     <th className="px-3 py-3 text-xs font-bold text-black whitespace-nowrap">Date</th>
                     <th className="px-3 py-3 text-xs font-bold text-black whitespace-nowrap">Worker</th>
                     <th className="px-3 py-3 text-xs font-bold text-black whitespace-nowrap">Type</th>
                     <th className="px-3 py-3 text-xs font-bold text-black whitespace-nowrap">Foreman</th>
                     <th className="px-3 py-3 text-xs font-bold text-black whitespace-nowrap">Shift</th>
                     <th className="px-3 py-3 text-xs font-bold text-black whitespace-nowrap">Att.</th>
                     <th className="px-3 py-3 text-xs font-bold text-black whitespace-nowrap">Time (In-Out)</th>
                     <th className="px-3 py-3 text-xs font-bold text-black whitespace-nowrap">Target</th>
                     <th className="px-3 py-3 text-xs font-bold text-black whitespace-nowrap">Total</th>
                     <th className="px-3 py-3 text-xs font-bold text-black whitespace-nowrap">Net</th>
                     <th className="px-3 py-3 text-xs font-bold text-black whitespace-nowrap">Extra</th>
                     <th className="px-3 py-3 text-xs font-bold text-black whitespace-nowrap">T.Reject</th>
                     <th className="px-3 py-3 text-xs font-bold text-black whitespace-nowrap">R2</th>
                     <th className="px-3 py-3 text-xs font-bold text-black whitespace-nowrap">R3</th>
                     <th className="px-3 py-3 text-xs font-bold text-black whitespace-nowrap">Bonus</th>
                     <th className="px-3 py-3 text-xs font-bold text-black whitespace-nowrap">Overtime</th>
                   </tr>
                 </thead>
                 <tbody>
                   {filteredProductions.map((prod, index) => {
                     const isPresent = prod.attendance === 'Present';
                     const lType = prod.labour?.labourType && prod.labour.labourType !== 'Simple' ? prod.labour.labourType : '-';
                     return (
                       <tr key={prod._id} className={`border-b border-gray-200 hover:bg-gray-100 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                         <td className="px-3 py-3 text-sm font-bold text-black whitespace-nowrap">{new Date(prod.date).toLocaleDateString('en-GB')}</td>
                         <td className="px-3 py-3 text-sm font-bold text-black whitespace-nowrap">{prod.labour?.name || 'Unknown'}</td>
                         <td className="px-3 py-3 text-sm font-medium text-black whitespace-nowrap">{lType}</td>
                         <td className="px-3 py-3 text-sm font-bold text-black whitespace-nowrap">{prod.foreman?.name || '-'}</td>
                         <td className="px-3 py-3 text-sm font-medium text-black whitespace-nowrap">{prod.shiftType}</td>
                         <td className="px-3 py-3 text-sm font-medium text-black whitespace-nowrap">{prod.attendance}</td>
                         <td className="px-3 py-3 text-sm font-medium text-black whitespace-nowrap">
                           {isPresent ? `${prod.inTime || '-'} to ${prod.outTime || '-'}` : '-'}
                         </td>
                         <td className="px-3 py-3 text-sm font-bold text-black whitespace-nowrap">{isPresent ? (prod.targetProduction ?? 0) : '-'}</td>
                         <td className="px-3 py-3 text-sm font-bold text-black whitespace-nowrap">{isPresent ? (prod.totalProduction ?? 0) : '-'}</td>
                         <td className="px-3 py-3 text-sm font-bold text-black whitespace-nowrap">{isPresent ? (prod.netProduction ?? 0) : '-'}</td>
                         <td className="px-3 py-3 text-sm font-bold text-black whitespace-nowrap">{isPresent ? (prod.extraProduction ?? 0) : '-'}</td>
                         <td className="px-3 py-3 text-sm font-bold text-black whitespace-nowrap">{isPresent ? (prod.totalReject ?? 0) : '-'}</td>
                         <td className="px-3 py-3 text-sm font-bold text-black whitespace-nowrap">{isPresent ? (prod.reject2 ?? 0) : '-'}</td>
                         <td className="px-3 py-3 text-sm font-bold text-black whitespace-nowrap">{isPresent ? (prod.reject3 ?? 0) : '-'}</td>
                         <td className="px-3 py-3 text-sm font-bold text-black whitespace-nowrap">{isPresent ? (prod.bonusAmount?.toFixed(2) ?? '0.00') : '-'}</td>
                         <td className="px-3 py-3 text-sm font-bold text-black whitespace-nowrap">{isPresent ? (prod.overtimeHours ?? 0) : '-'}</td>
                       </tr>
                     );
                   })}
                 </tbody>
               </table>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TotalProduction;
