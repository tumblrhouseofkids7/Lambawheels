import React, { useState, useEffect } from 'react';
import { getShiftHistory } from '../services/shiftService';
import { getProductions } from '../services/productionService';
import { Calendar, Clock, Box, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const History = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [shifts, setShifts] = useState([]);
  const [productions, setProductions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterType, setFilterType] = useState('All');

  const filteredProductions = productions.filter(p => {
    if (filterType === 'All') return true;
    const lType = p.labour?.labourType;
    if (filterType === 'Simple') return !lType || lType === 'Simple';
    return lType === filterType;
  });

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    if (!selectedDate) return;
    setIsLoading(true);
    try {
      const [shiftData, prodData] = await Promise.all([
        getShiftHistory(selectedDate),
        getProductions(selectedDate)
      ]);
      setShifts(shiftData || []);
      setProductions(prodData || []);
    } catch (error) {
      console.error('Error fetching history:', error);
      toast.error('Failed to load history data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '--:--';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const calculateDuration = (start, end) => {
    if (!start || !end) return 'N/A';
    const diffMs = new Date(end) - new Date(start);
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHrs}h ${diffMins}m`;
  };

  const handleDownloadShifts = () => {
    if (shifts.length === 0) { toast.error('No shift data to download'); return; }
    const doc = new jsPDF();
    doc.text(`Shift Records - ${selectedDate}`, 14, 15);
    const tableRows = shifts.map(s => [
      s.shiftType, s.status,
      formatTime(s.startTime || s.date),
      s.endTime ? formatTime(s.endTime) : 'N/A',
      s.endTime ? calculateDuration(s.startTime || s.date, s.endTime) : 'N/A'
    ]);
    autoTable(doc, { head: [["Shift Type", "Status", "Start", "End", "Duration"]], body: tableRows, startY: 20 });
    doc.save(`Shift_Records_${selectedDate}.pdf`);
  };

  const handleDownloadProductions = () => {
    if (filteredProductions.length === 0) { toast.error('No production data to download'); return; }
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.text(`Production Report - ${selectedDate} (${filterType})`, 14, 15);
    const tableColumn = ["Worker", "Type", "Shift", "Att.", "In", "Out", "Target", "Total", "Net", "Extra", "Reject", "R2", "R3", "Bonus", "Overtime"];
    const tableRows = filteredProductions.map(p => [
      p.labour?.name || 'Unknown',
      p.labour?.labourType && p.labour.labourType !== 'Simple' ? p.labour.labourType : '-',
      p.shiftType || '-',
      p.attendance,
      p.inTime || '-',
      p.outTime || '-',
      p.targetProduction ?? 0,
      p.totalProduction ?? 0,
      p.netProduction ?? 0,
      p.extraProduction ?? 0,
      p.totalReject ?? 0,
      p.reject2 ?? 0,
      p.reject3 ?? 0,
      p.bonusAmount?.toFixed(2) ?? '0.00',
      p.overtimeHours ?? 0
    ]);
    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 20, styles: { fontSize: 7, textColor: [0, 0, 0] } });
    doc.save(`Production_Entries_${selectedDate}.pdf`);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-8 w-full max-w-full">
      {/* Header & Date Picker */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
          <Calendar className="text-blue-600" size={24} />
          Daily History
        </h2>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-black outline-none text-sm font-bold bg-gray-50 text-black"
          max={new Date().toISOString().split('T')[0]}
        />
      </div>

      {isLoading ? (
        <div className="text-center py-10 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black mx-auto"></div>
          <p className="mt-3 text-gray-500 font-medium">Loading records...</p>
        </div>
      ) : (
        <div className="space-y-6">

          {/* Shifts Section */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3 border-b pb-3">
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <Clock className="text-orange-500" size={18} />
                Shift Records
                <span className="text-xs bg-gray-100 px-2 py-1 rounded-full font-medium ml-1 text-black">{shifts.length}</span>
              </h3>
              <button
                onClick={handleDownloadShifts}
                disabled={shifts.length === 0}
                className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 font-bold rounded-lg hover:bg-red-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm border border-red-200"
              >
                <Download size={14} /> Download PDF
              </button>
            </div>
            {shifts.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-left border-collapse text-black bg-white min-w-[600px]">
                  <thead>
                    <tr className="bg-gray-100 border-b-2 border-gray-300">
                      <th className="px-4 py-3 text-sm font-bold text-black">Shift Type</th>
                      <th className="px-4 py-3 text-sm font-bold text-black">Status</th>
                      <th className="px-4 py-3 text-sm font-bold text-black">Start</th>
                      <th className="px-4 py-3 text-sm font-bold text-black">End</th>
                      <th className="px-4 py-3 text-sm font-bold text-black">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shifts.map((shift, index) => (
                       <tr key={shift._id} className={`border-b border-gray-200 hover:bg-gray-100 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          <td className="px-4 py-3 text-sm font-bold text-black">{shift.shiftType}</td>
                          <td className="px-4 py-3 text-sm font-bold text-black">{shift.status}</td>
                          <td className="px-4 py-3 text-sm font-medium text-black">{formatTime(shift.startTime || shift.date)}</td>
                          <td className="px-4 py-3 text-sm font-medium text-black">{shift.endTime ? formatTime(shift.endTime) : '--:--'}</td>
                          <td className="px-4 py-3 text-sm font-medium text-black">{shift.endTime ? calculateDuration(shift.startTime || shift.date, shift.endTime) : '--'}</td>
                       </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <p className="text-black font-medium text-sm">No shifts found for this date.</p>
              </div>
            )}
          </div>

          {/* Production Entries Section */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3 border-b pb-3">
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <Box className="text-blue-500" size={18} />
                Production Entries
                <span className="text-xs bg-gray-100 px-2 py-1 rounded-full font-bold ml-1 text-black">{filteredProductions.length}</span>
              </h3>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-black font-bold outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="All">All Types</option>
                  <option value="Simple">Simple</option>
                  <option value="4 Die">4 Die</option>
                  <option value="6 Die">6 Die</option>
                </select>
                <button
                  onClick={handleDownloadProductions}
                  disabled={filteredProductions.length === 0}
                  className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 font-bold rounded-lg hover:bg-red-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm border border-red-200"
                >
                  <Download size={14} /> Download PDF
                </button>
              </div>
            </div>

            {filteredProductions.length > 0 ? (
               <div className="overflow-x-auto rounded-xl border border-gray-200">
               <table className="w-full text-left border-collapse text-black bg-white min-w-[1200px]">
                 <thead>
                   <tr className="bg-gray-100 border-b-2 border-gray-300">
                     <th className="px-3 py-3 text-xs font-bold text-black whitespace-nowrap">Worker</th>
                     <th className="px-3 py-3 text-xs font-bold text-black whitespace-nowrap">Type</th>
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
                         <td className="px-3 py-3 text-sm font-bold text-black whitespace-nowrap">{prod.labour?.name || 'Unknown'}</td>
                         <td className="px-3 py-3 text-sm font-medium text-black whitespace-nowrap">{lType}</td>
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
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <Box className="mx-auto text-gray-300 mb-2" size={32} />
                <p className="text-black font-medium text-sm">No production entries found for this date.</p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};

export default History;
