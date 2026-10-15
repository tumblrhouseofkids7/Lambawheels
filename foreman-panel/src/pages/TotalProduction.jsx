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
    const lType = p.jobType || p.labour?.labourType;
    if (filterType === 'Simple') return !p.jobType && (!p.labour?.labourType || p.labour?.labourType === 'Simple');
    if (filterType === 'Molding') return p.jobType === 'Molding' || (!p.jobType && p.labour?.labourType === 'Molding');
    if (filterType === '4 Die') return p.jobType === '4 Die' || (!p.jobType && p.labour?.labourType === '4 Die');
    if (filterType === '6 Die') return p.jobType === '6 Die' || (!p.jobType && p.labour?.labourType === '6 Die');
    return lType === filterType;
  });

  const handleDownloadProductions = () => {
    if (filteredProductions.length === 0) { toast.error('No production data to download'); return; }
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.text(`Total Production Report - ${startDate} to ${endDate} ${shift ? `(Shift: ${shift})` : ''} (${filterType})`, 14, 15);
    const tableColumn = ["Date", "Worker", "Type", "Foreman", "Shift", "Att.", "Time", "Target", "Total", "Net", "Extra", "T.Reject", "R2", "R3", "S.Type", "S.Total", "S.Rej", "Reason", "Bonus", "Overtime"];
    const tableRows = filteredProductions.map(p => {
        const isPresent = p.attendance === 'Present';
        const displayType = p.jobType 
          ? `${p.jobType}${p.labour?.labourType === 'Simple' ? ' (Simple)' : ''}` 
          : (p.labour?.labourType && p.labour.labourType !== 'Simple' ? p.labour.labourType : 'Simple');
        const rowTotal = isPresent ? (isMolding(p) ? (p.totalProduction ?? 0) : ((p.totalProduction ?? 0) + (p.totalReject ?? 0))) : '-';
        const rowSecTotal = (p.secondaryTotalProduction ?? 0) + ((p.secondaryDieType === '4 Die' || p.secondaryDieType === '6 Die') ? (p.secondaryTotalReject ?? 0) : 0);
        return [
        new Date(p.date).toLocaleDateString('en-GB'),
        p.labour?.name || 'Unknown',
        displayType,
        p.foreman?.name || '-',
        p.shiftType || '-',
        p.attendance,
        isPresent ? `${p.inTime || '-'} to ${p.outTime || '-'}` : '-',
        isPresent ? (p.targetProduction ?? 0) : '-',
        rowTotal,
        isPresent ? (p.netProduction ?? 0) : '-',
        isPresent ? (p.extraProduction ?? 0) : '-',
        isPresent ? (p.totalReject ?? 0) : '-',
        isPresent ? (p.reject2 ?? 0) : '-',
        isPresent ? (p.reject3 ?? 0) : '-',
        p.secondaryDieType || '-',
        rowSecTotal,
        p.secondaryTotalReject ?? 0,
        p.lowProductionReason || '-',
        isPresent ? (p.bonusAmount?.toFixed(2) ?? '0.00') : '-',
        isPresent ? (p.overtimeHours ?? 0) : '-'
        ]
    });
    tableRows.push([
      "Total", "", "", "", "", `${presentCount}P / ${absentCount}A`, "", "",
      totalProduction, totalNet, "", totalReject, "", "", "", "", "", "", "", totalOvertime
    ]);
    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 20, styles: { fontSize: 7, textColor: [0, 0, 0] } });
    doc.save(`Total_Production_Report.pdf`);
  };

  const isMolding = (p) => {
    if (p.jobType === 'Molding') return true;
    if (p.jobType && p.jobType !== 'Molding') return false;
    return p.labour?.labourType === 'Molding';
  };

  const tyreRejects = filteredProductions.reduce((sum, p) => {
    let curr = 0;
    if (!isMolding(p)) curr += (p.totalReject || 0);
    if (p.secondaryDieType === '4 Die' || p.secondaryDieType === '6 Die') curr += (p.secondaryTotalReject || 0);
    return sum + curr;
  }, 0);

  // Summaries (Includes tyre rejects in Total Production sum)
  const baseTotalProduction = filteredProductions.reduce((s, p) => s + (p.totalProduction || 0) + (p.secondaryTotalProduction || 0), 0);
  const totalProduction     = baseTotalProduction + tyreRejects;
  const totalNet            = filteredProductions.reduce((s, p) => s + (p.netProduction || 0) + ((p.secondaryTotalProduction || 0) - (p.secondaryTotalReject || 0)), 0);
  const totalReject         = filteredProductions.reduce((s, p) => s + (p.totalReject || 0) + (p.secondaryTotalReject || 0), 0);
  const totalOvertime       = filteredProductions.reduce((s, p) => s + (p.overtimeHours || 0), 0);
  const presentCount        = filteredProductions.filter(p => p.attendance === 'Present').length;
  const absentCount         = filteredProductions.filter(p => p.attendance === 'Absent').length;

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
                <option value="Molding">Molding</option>
              </select>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Total Prod',   value: totalProduction.toLocaleString(), note: tyreRejects > 0 ? `+${tyreRejects} Rej` : null },
            { label: 'Net Prod',     value: totalNet.toLocaleString() },
            { label: 'Total Reject', value: totalReject.toLocaleString() },
            { label: 'Tyre Reject',  value: tyreRejects.toLocaleString() },
            { label: 'Overtime',     value: totalOvertime.toLocaleString() },
            { label: 'Entries',      value: `${presentCount}P / ${absentCount}A` },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-3 border text-center bg-gray-50 border-gray-200">
              <div className="text-[10px] font-bold uppercase tracking-wider mb-1 text-gray-600 flex items-center justify-center gap-1">
                {s.label}
                {s.note && <span className="text-[9px] text-blue-600 font-bold bg-blue-50 px-1 rounded">({s.note})</span>}
              </div>
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
                     <th className="px-3 py-3 text-xs font-bold text-black whitespace-nowrap">S.Type</th>
                     <th className="px-3 py-3 text-xs font-bold text-black whitespace-nowrap">S.Total</th>
                     <th className="px-3 py-3 text-xs font-bold text-black whitespace-nowrap">S.Rej</th>
                     <th className="px-3 py-3 text-xs font-bold text-black whitespace-nowrap">Reason</th>
                     <th className="px-3 py-3 text-xs font-bold text-black whitespace-nowrap">Bonus</th>
                     <th className="px-3 py-3 text-xs font-bold text-black whitespace-nowrap">Overtime</th>
                   </tr>
                 </thead>
                 <tbody>
                   {filteredProductions.map((prod, index) => {
                     const isPresent = prod.attendance === 'Present';
                     const lType = prod.jobType 
                       ? `${prod.jobType}${prod.labour?.labourType === 'Simple' ? ' (Simple)' : ''}` 
                       : (prod.labour?.labourType && prod.labour.labourType !== 'Simple' ? prod.labour.labourType : 'Simple');
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
                         <td className="px-3 py-3 text-sm font-bold text-black whitespace-nowrap">{isPresent ? (isMolding(prod) ? (prod.totalProduction ?? 0) : ((prod.totalProduction ?? 0) + (prod.totalReject ?? 0))) : '-'}</td>
                         <td className="px-3 py-3 text-sm font-bold text-black whitespace-nowrap">{isPresent ? (prod.netProduction ?? 0) : '-'}</td>
                         <td className="px-3 py-3 text-sm font-bold text-black whitespace-nowrap">{isPresent ? (prod.extraProduction ?? 0) : '-'}</td>
                         <td className="px-3 py-3 text-sm font-bold text-black whitespace-nowrap">{isPresent ? (prod.totalReject ?? 0) : '-'}</td>
                         <td className="px-3 py-3 text-sm font-bold text-black whitespace-nowrap">{isPresent ? (prod.reject2 ?? 0) : '-'}</td>
                         <td className="px-3 py-3 text-sm font-bold text-black whitespace-nowrap">{isPresent ? (prod.reject3 ?? 0) : '-'}</td>
                         <td className="px-3 py-3 text-sm font-bold text-black whitespace-nowrap">{isPresent ? (prod.secondaryDieType || '-') : '-'}</td>
                         <td className="px-3 py-3 text-sm font-bold text-black whitespace-nowrap">{isPresent ? ((prod.secondaryTotalProduction ?? 0) + ((prod.secondaryDieType === '4 Die' || prod.secondaryDieType === '6 Die') ? (prod.secondaryTotalReject ?? 0) : 0)) : '-'}</td>
                         <td className="px-3 py-3 text-sm font-bold text-black whitespace-nowrap">{isPresent ? (prod.secondaryTotalReject ?? 0) : '-'}</td>
                         <td className="px-3 py-3 text-sm font-medium text-black whitespace-nowrap">{isPresent ? (prod.lowProductionReason || '-') : '-'}</td>
                         <td className="px-3 py-3 text-sm font-bold text-black whitespace-nowrap">{isPresent ? (prod.bonusAmount?.toFixed(2) ?? '0.00') : '-'}</td>
                         <td className="px-3 py-3 text-sm font-bold text-black whitespace-nowrap">{isPresent ? (prod.overtimeHours ?? 0) : '-'}</td>
                       </tr>
                     );
                   })}
                 </tbody>
                  <tfoot className="bg-gray-100 border-t-2 border-gray-300 font-black text-black text-sm">
                    <tr>
                      <td colSpan="8" className="px-3 py-3 text-right uppercase text-xs font-bold text-gray-700">Total</td>
                      <td className="px-3 py-3 text-sm font-black text-blue-600 whitespace-nowrap">{totalProduction.toLocaleString()}</td>
                      <td className="px-3 py-3 text-sm font-black text-green-600 whitespace-nowrap">{totalNet.toLocaleString()}</td>
                      <td className="px-3 py-3 whitespace-nowrap"></td>
                      <td className="px-3 py-3 text-sm font-black text-red-600 whitespace-nowrap">{totalReject.toLocaleString()}</td>
                      <td colSpan="7" className="px-3 py-3 whitespace-nowrap"></td>
                      <td className="px-3 py-3 text-sm font-black text-black whitespace-nowrap">{totalOvertime}</td>
                    </tr>
                  </tfoot>
               </table>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TotalProduction;
