import React, { useState, useEffect } from 'react';
import { Calendar, Filter, Loader2, Download, CheckCircle, Users, Box, AlertCircle, IndianRupee, Search } from 'lucide-react';
import { productionService } from '../services/api';
import toast from 'react-hot-toast';

const TotalProduction = () => {
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [shift, setShift] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
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
      
      const { data } = await productionService.getProductions(params);
      setProductions(data || []);
    } catch (error) {
      toast.error('Failed to load production data');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter productions
  const filteredProductions = productions.filter(p => 
    (p.labour?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.foreman?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Process active foremen
  const liveForemen = new Set();
  filteredProductions.forEach(p => {
    if (p.foreman?.name) {
      liveForemen.add(p.foreman.name);
    }
  });
  const activeForemenList = Array.from(liveForemen).sort();

  // Grand total and splits
  const totalOverallProduction = filteredProductions.reduce((sum, p) => sum + (p.totalProduction || 0), 0);
  const moldingProd = filteredProductions.filter(p => p.labour?.labourType === 'Molding').reduce((sum, p) => sum + (p.totalProduction || 0), 0);
  const fourDieProd = filteredProductions.filter(p => p.labour?.labourType === '4 Die').reduce((sum, p) => sum + (p.totalProduction || 0), 0);
  const sixDieProd = filteredProductions.filter(p => p.labour?.labourType === '6 Die').reduce((sum, p) => sum + (p.totalProduction || 0), 0);
  const tyreProd = totalOverallProduction - moldingProd;

  return (
    <div className="space-y-6">
      {/* Print Styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-section, .print-section * { visibility: visible; }
          .print-section { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
          .no-print { display: none !important; }
          .print-bg { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Total Production Report</h1>
          <p className="text-gray-500">View daily production entries by labour and foreman.</p>
        </div>
        <button 
          onClick={handlePrint}
          className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-medium transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" /> Download PDF
        </button>
      </div>

      <div className="print-section bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[500px]">
        <div className="hidden print:block mb-6 text-center">
          <h2 className="text-2xl font-bold uppercase tracking-wider text-gray-900">Total Production Report</h2>
          <p className="text-gray-600 mt-1">Date: {startDate} to {endDate} {shift ? `| Shift: ${shift}` : ''}</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 no-print bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 uppercase">From Date</label>
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input 
                type="date" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)}
                className="bg-transparent border-none outline-none text-sm text-gray-700"
              />
            </div>
          </div>
          
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 uppercase">To Date</label>
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input 
                type="date" 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)}
                className="bg-transparent border-none outline-none text-sm text-gray-700"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 uppercase">Shift</label>
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200">
              <Filter className="w-4 h-4 text-gray-400" />
              <select 
                value={shift} 
                onChange={e => setShift(e.target.value)}
                className="bg-transparent border-none outline-none text-sm text-gray-700 w-32"
              >
                <option value="">All Shifts</option>
                <option value="Day">Day</option>
                <option value="Night">Night</option>
              </select>
            </div>
          </div>
        </div>

        {/* Active Foremen & Summary Box */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl print-bg">
            <div className="flex items-center gap-2 mb-2 text-blue-800">
              <Users className="w-5 h-5" />
              <h3 className="font-bold text-sm uppercase">Active Foremen on Selected Dates</h3>
            </div>
            {activeForemenList.length > 0 ? (
              <div className="flex flex-wrap gap-2 mt-3">
                {activeForemenList.map(name => (
                  <span key={name} className="inline-flex items-center gap-1.5 bg-white text-blue-700 border border-blue-200 px-3 py-1 rounded-full text-sm font-medium shadow-sm">
                    <CheckCircle className="w-3.5 h-3.5 text-blue-500" /> {name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-blue-600 mt-2">No foremen active for the selected criteria.</p>
            )}
          </div>
          
          <div className="bg-teal-50 border border-teal-100 p-4 rounded-xl flex items-center justify-between print-bg">
            <div className="flex flex-col justify-center">
              <h3 className="font-bold text-sm uppercase text-teal-800 mb-1">Grand Total</h3>
              <div className="text-4xl font-black text-teal-600">
                {totalOverallProduction.toLocaleString()} <span className="text-lg font-medium text-teal-700">pcs</span>
              </div>
            </div>
            <div className="flex flex-col gap-2 min-w-[140px]">
              <div className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-100 flex flex-col gap-1">
                 <div className="flex items-center justify-between gap-3">
                   <span className="text-[11px] font-bold uppercase">Tyres</span>
                   <span className="text-sm font-black">{tyreProd.toLocaleString()}</span>
                 </div>
                 <div className="flex items-center justify-between gap-2 text-[10px] font-semibold text-blue-600/80 pt-0.5 border-t border-blue-200/50">
                    <span>4-Die: {fourDieProd.toLocaleString()}</span>
                    <span>6-Die: {sixDieProd.toLocaleString()}</span>
                 </div>
              </div>
              <div className="bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg border border-purple-100 flex items-center justify-between gap-3">
                 <span className="text-[11px] font-bold uppercase">Molding</span>
                 <span className="text-sm font-black">{moldingProd.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Production Data Entries (Card UI) */}
        <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 print-bg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Box className="text-blue-500" size={20} />
              <h3 className="text-lg font-bold text-gray-800">
                Production Entries
                <span className="text-xs bg-white px-2 py-1 rounded-full font-medium ml-2 border border-gray-200">
                  {filteredProductions.length} Entries
                </span>
              </h3>
            </div>
            <div className="no-print flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-100 transition-all w-full md:w-64 shadow-sm">
              <Search size={16} className="text-gray-400" />
              <input 
                type="text"
                placeholder="Search worker or foreman..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent outline-none text-sm text-gray-800 w-full"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20 text-purple-600">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : filteredProductions.length === 0 ? (
            <div className="text-center py-20 text-gray-500 flex flex-col items-center">
              <Calendar className="w-12 h-12 text-gray-300 mb-3" />
              <p>No production entries found for the selected dates and shift.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 text-xs uppercase tracking-wider border-b border-gray-200">
                    <th className="p-3 font-bold">Date & Shift</th>
                    <th className="p-3 font-bold">Worker</th>
                    <th className="p-3 font-bold">Foreman</th>
                    <th className="p-3 font-bold text-center">Status</th>
                    <th className="p-3 font-bold text-right">Target</th>
                    <th className="p-3 font-bold text-right">Total</th>
                    <th className="p-3 font-bold text-right">Net</th>
                    <th className="p-3 font-bold text-right text-red-500">Rejects</th>
                    <th className="p-3 font-bold text-right">Add. Work</th>
                    <th className="p-3 font-bold text-left">Reason</th>
                    <th className="p-3 font-bold text-right text-emerald-600">Salary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {filteredProductions.map((prod) => (
                    <tr key={prod._id} className="hover:bg-gray-50 transition">
                      <td className="p-3">
                        <div className="font-semibold text-sm text-gray-900">
                          {new Date(prod.date).toLocaleDateString('en-GB')}
                        </div>
                        <div className={`text-[10px] mt-0.5 inline-block px-1.5 py-0.5 rounded font-bold print-bg ${prod.shiftType === 'Day' ? 'bg-orange-100 text-orange-700' : 'bg-indigo-100 text-indigo-700'}`}>
                          {prod.shiftType}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-sm text-gray-800 flex items-center gap-2">
                          {prod.labour?.image ? (
                            <img src={prod.labour.image} alt={prod.labour.name} className="w-6 h-6 rounded-full object-cover border border-gray-200" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                              {prod.labour?.name?.charAt(0) || 'U'}
                            </div>
                          )}
                          {prod.labour?.name || 'Unknown Worker'}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="text-xs font-medium text-gray-600 bg-gray-100 border border-gray-200 px-2 py-1 rounded-md print-bg">
                          {prod.foreman?.name || 'Unknown'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold print-bg ${prod.attendance === 'Present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {prod.attendance === 'Present' ? <CheckCircle size={12}/> : <AlertCircle size={12}/>}
                          {prod.attendance}
                        </span>
                        {prod.attendance === 'Present' && (
                          <div className="text-[10px] text-gray-500 mt-1">
                            {prod.inTime || '--'} to {prod.outTime || '--'}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-right font-medium text-sm text-gray-700">
                        {prod.attendance === 'Present' ? prod.targetProduction || 0 : '-'}
                      </td>
                      <td className="p-3 text-right font-black text-sm text-blue-600">
                        {prod.attendance === 'Present' ? prod.totalProduction || 0 : '-'}
                      </td>
                      <td className="p-3 text-right font-black text-sm text-green-600">
                        {prod.attendance === 'Present' ? prod.netProduction || 0 : '-'}
                      </td>
                      <td className="p-3 text-right">
                        {prod.attendance === 'Present' ? (
                          <>
                            <div className="font-bold text-sm text-red-500">{prod.totalReject || 0}</div>
                            {prod.totalReject > 0 && (
                              <div className="text-[10px] text-gray-500">
                                T2:{prod.reject2 || 0} T3:{prod.reject3 || 0}
                              </div>
                            )}
                          </>
                        ) : '-'}
                      </td>
                      <td className="p-3 text-right">
                        {prod.attendance === 'Present' && prod.secondaryDieType ? (
                          <>
                            <div className="font-bold text-sm text-indigo-600">{prod.secondaryDieType}</div>
                            <div className="text-[10px] text-gray-500">
                              Tot:{prod.secondaryTotalProduction || 0} Rej:{prod.secondaryTotalReject || 0}
                            </div>
                          </>
                        ) : '-'}
                      </td>
                      <td className="p-3 text-left">
                        {prod.attendance === 'Present' && prod.lowProductionReason ? (
                          <div className="text-xs text-gray-600 truncate max-w-[150px]" title={prod.lowProductionReason}>
                            {prod.lowProductionReason}
                          </div>
                        ) : '-'}
                      </td>
                      <td className="p-3 text-right">
                        {prod.attendance === 'Present' ? (
                          <div className="font-black text-sm text-emerald-600 flex items-center justify-end gap-0.5">
                            <IndianRupee size={12} strokeWidth={3}/>
                            {prod.finalSalary?.toFixed(2) || '0.00'}
                          </div>
                        ) : '-'}
                      </td>
                    </tr>
                  ))}
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
