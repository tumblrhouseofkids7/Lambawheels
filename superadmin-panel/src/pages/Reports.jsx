import React, { useState, useEffect } from 'react';
import { Download, Calendar, Users, Filter, Truck, FileText, Loader2, DollarSign } from 'lucide-react';
import { dispatchService, salaryService, systemUserService } from '../services/api';
import toast from 'react-hot-toast';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('dispatch'); // 'dispatch' or 'salary'

  // Dispatch Filters
  const [dispatchDate, setDispatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [dispatchShift, setDispatchShift] = useState('');
  const [dispatchForemanId, setDispatchForemanId] = useState('');
  const [foremen, setForemen] = useState([]);
  
  // Salary Filters
  const [salaryMonth, setSalaryMonth] = useState(new Date().getMonth() + 1);
  const [salaryYear, setSalaryYear] = useState(new Date().getFullYear());

  // Data
  const [dispatches, setDispatches] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchForemen();
  }, []);

  useEffect(() => {
    if (activeTab === 'dispatch') {
      fetchDispatches();
    } else if (activeTab === 'salary') {
      fetchSalaries();
    }
  }, [activeTab, dispatchDate, dispatchShift, dispatchForemanId, salaryMonth, salaryYear]);

  const fetchForemen = async () => {
    try {
      const { data } = await systemUserService.getForemen();
      setForemen(data);
    } catch (err) {
      toast.error('Failed to load foremen list');
    }
  };

  const fetchDispatches = async () => {
    try {
      setLoading(true);
      const { data } = await dispatchService.getDispatches({
        date: dispatchDate || undefined,
        shift: dispatchShift || undefined,
        foremanId: dispatchForemanId || undefined,
      });
      setDispatches(data);
    } catch (err) {
      toast.error('Failed to load dispatch reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchSalaries = async () => {
    if (!salaryMonth || !salaryYear) return;
    try {
      setLoading(true);
      const { data } = await salaryService.getSalarySheet(salaryMonth, salaryYear);
      setSalaries(data);
    } catch (err) {
      toast.error('Failed to load salary reports');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    if (activeTab === 'dispatch') {
      if (!dispatchDate) {
        toast.error('Please select a date to export dispatch records');
        return;
      }
      const url = dispatchService.exportPDFUrl({ date: dispatchDate, shift: dispatchShift, foremanId: dispatchForemanId });
      window.open(url, '_blank');
    } else if (activeTab === 'salary') {
      // Browser print for salary report
      window.print();
    }
  };

  return (
    <div className="space-y-6">
      {/* Print-specific styles to hide everything except the table */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-container, .print-container * { visibility: visible; }
          .print-container { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-gray-500">View and download comprehensive system reports.</p>
        </div>
        <button 
          onClick={handleExportPDF}
          className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-medium transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" /> Export {activeTab === 'dispatch' ? 'Dispatch PDF' : 'Salary PDF'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 no-print">
        <button
          onClick={() => setActiveTab('dispatch')}
          className={`pb-3 px-2 font-semibold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'dispatch' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Truck className="w-4 h-4" /> Foreman / Dispatch Report
        </button>
        <button
          onClick={() => setActiveTab('salary')}
          className={`pb-3 px-2 font-semibold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'salary' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <DollarSign className="w-4 h-4" /> Accountant / Salary Report
        </button>
      </div>

      <div className="print-container bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[500px]">
        {/* DISPATCH REPORT */}
        {activeTab === 'dispatch' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4 no-print bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 flex-1 min-w-[200px]">
                <Calendar className="w-4 h-4 text-gray-400" />
                <input 
                  type="date" 
                  value={dispatchDate} 
                  onChange={e => setDispatchDate(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm w-full text-gray-700"
                />
              </div>
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 flex-1 min-w-[150px]">
                <Filter className="w-4 h-4 text-gray-400" />
                <select 
                  value={dispatchShift} 
                  onChange={e => setDispatchShift(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm w-full text-gray-700"
                >
                  <option value="">All Shifts</option>
                  <option value="Day">Day Shift</option>
                  <option value="Night">Night Shift</option>
                </select>
              </div>
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 flex-1 min-w-[200px]">
                <Users className="w-4 h-4 text-gray-400" />
                <select 
                  value={dispatchForemanId} 
                  onChange={e => setDispatchForemanId(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm w-full text-gray-700"
                >
                  <option value="">All Foremen</option>
                  {foremen.map(f => (
                    <option key={f._id} value={f._id}>{f.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dispatch Matrix */}
            {loading ? (
              <div className="flex justify-center items-center py-20 text-purple-600">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : dispatches.length === 0 ? (
              <div className="text-center py-20 text-gray-500 flex flex-col items-center">
                <FileText className="w-12 h-12 text-gray-300 mb-3" />
                <p>No dispatch records found for the selected filters.</p>
              </div>
            ) : (() => {
              const byForeman = dispatches.reduce((acc, d) => {
                const key = d.foremanId?._id || d.foremanId || 'unassigned';
                if (!acc[key]) acc[key] = { foremanName: d.foremanName || d.foremanId?.name || 'Unassigned', products: [] };
                acc[key].products.push(d);
                return acc;
              }, {});
              return (
                <div className="space-y-6">
                  {Object.entries(byForeman).map(([fId, { foremanName, products }]) => {
                    const workerSet = new Set();
                    products.forEach(p => (p.entries || []).forEach(e => { if (e.labourName) workerSet.add(e.labourName); }));
                    const workers = Array.from(workerSet).sort();
                    const grandTarget   = products.reduce((s, p) => s + (p.targetQty || 0), 0);
                    const grandProduced = products.reduce((s, p) => s + (p.totalProduced || 0), 0);
                    return (
                      <div key={fId} className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                        {/* Foreman header */}
                        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-black">
                              {foremanName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-black text-gray-900 text-sm">{foremanName}</p>
                              <p className="text-xs text-gray-400">
                                {products.length} product{products.length !== 1 ? 's' : ''}&nbsp;&middot;&nbsp;
                                Target: <strong className="text-amber-600">{grandTarget.toLocaleString()}</strong>&nbsp;&middot;&nbsp;
                                Produced: <strong className="text-emerald-600">{grandProduced.toLocaleString()}</strong>
                              </p>
                            </div>
                          </div>
                        </div>
                        {/* Matrix table */}
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm border-collapse">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="sticky left-0 bg-gray-100 z-10 text-left px-4 py-2.5 text-xs font-black text-gray-700 uppercase tracking-wider border-r border-gray-200 min-w-[140px]">WORKER NAME</th>
                                {products.map(p => (
                                  <th key={p._id} className="px-3 py-2 text-center border-r border-gray-200 min-w-[100px]">
                                    <p className="font-black text-gray-800 text-xs">{p.productName}</p>
                                  </th>
                                ))}
                                <th className="px-3 py-2 text-center text-xs font-black text-gray-700 uppercase min-w-[80px]">TOTAL</th>
                              </tr>
                              <tr className="bg-amber-50 border-b border-amber-200">
                                <td className="sticky left-0 bg-amber-100 z-10 px-4 py-2 text-xs font-black text-amber-700 uppercase border-r border-amber-200">TARGET</td>
                                {products.map(p => (
                                  <td key={p._id} className="px-3 py-2 text-center border-r border-amber-200">
                                    <span className="font-black font-mono text-amber-700 text-sm">{(p.targetQty || 0).toLocaleString()}</span>
                                  </td>
                                ))}
                                <td className="px-3 py-2 text-center font-black font-mono text-amber-700">{grandTarget.toLocaleString()}</td>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {workers.length === 0 ? (
                                <tr><td colSpan={products.length + 2} className="px-4 py-6 text-center text-gray-400 text-xs italic">No worker entries yet.</td></tr>
                              ) : workers.map(workerName => {
                                let rowTotal = 0;
                                return (
                                  <tr key={workerName} className="hover:bg-gray-50 transition-colors">
                                    <td className="sticky left-0 bg-white z-10 px-4 py-2.5 font-semibold text-gray-800 border-r border-gray-100 text-sm">{workerName}</td>
                                    {products.map(p => {
                                      const qty = (p.entries || []).filter(e => e.labourName === workerName).reduce((s, e) => s + (Number(e.quantity) || 0), 0);
                                      rowTotal += qty;
                                      return (
                                        <td key={p._id} className="px-3 py-2.5 text-center border-r border-gray-100 font-mono">
                                          {qty > 0 ? <span className="font-bold text-gray-800">{qty.toLocaleString()}</span> : <span className="text-gray-300">—</span>}
                                        </td>
                                      );
                                    })}
                                    <td className="px-3 py-2.5 text-center font-black font-mono text-blue-600">{rowTotal > 0 ? rowTotal.toLocaleString() : '—'}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot>
                              <tr className="bg-emerald-50 border-t-2 border-emerald-300">
                                <td className="sticky left-0 bg-emerald-100 z-10 px-4 py-2.5 text-xs font-black text-emerald-700 uppercase border-r border-emerald-200">TOTAL</td>
                                {products.map(p => (
                                  <td key={p._id} className="px-3 py-2.5 text-center border-r border-emerald-200">
                                    <span className="font-black font-mono text-emerald-700">{(p.totalProduced || 0).toLocaleString()}</span>
                                  </td>
                                ))}
                                <td className="px-3 py-2.5 text-center font-black font-mono text-emerald-700 text-base">{grandProduced.toLocaleString()}</td>
                              </tr>
                              <tr className="bg-red-50 border-t border-red-200">
                                <td className="sticky left-0 bg-red-100 z-10 px-4 py-2 text-xs font-black text-red-600 uppercase border-r border-red-200">SHORTAGE</td>
                                {products.map(p => {
                                  const short = Math.max(0, (p.targetQty || 0) - (p.totalProduced || 0));
                                  return (
                                    <td key={p._id} className="px-3 py-2 text-center border-r border-red-100">
                                      {short > 0
                                        ? <span className="font-bold font-mono text-red-600 text-xs">-{short.toLocaleString()}</span>
                                        : <span className="text-emerald-500 font-bold text-xs">✓</span>
                                      }
                                    </td>
                                  );
                                })}
                                <td className="px-3 py-2 text-center">
                                  {grandTarget > grandProduced
                                    ? <span className="font-black font-mono text-red-600 text-xs">-{(grandTarget - grandProduced).toLocaleString()}</span>
                                    : <span className="text-emerald-600 font-bold text-xs">✓ Done</span>
                                  }
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex justify-between items-center bg-teal-50 text-teal-800 p-4 rounded-xl border border-teal-100">
                    <div className="font-semibold text-sm">{dispatches.length} dispatch sheets</div>
                    <div className="text-xl font-extrabold text-teal-700">
                      Grand Total: {dispatches.reduce((sum, d) => sum + (d.totalProduced || 0), 0).toLocaleString()} pcs
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* SALARY REPORT */}
        {activeTab === 'salary' && (
          <div className="space-y-6">
            <div className="hidden print:block mb-6 text-center">
              <h2 className="text-2xl font-bold">Salary Report</h2>
              <p className="text-gray-600">Month: {salaryMonth} / Year: {salaryYear}</p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4 no-print bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 min-w-[150px]">
                <Calendar className="w-4 h-4 text-gray-400" />
                <select 
                  value={salaryMonth} 
                  onChange={e => setSalaryMonth(Number(e.target.value))}
                  className="bg-transparent border-none outline-none text-sm w-full text-gray-700"
                >
                  {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 min-w-[150px]">
                <Calendar className="w-4 h-4 text-gray-400" />
                <select 
                  value={salaryYear} 
                  onChange={e => setSalaryYear(Number(e.target.value))}
                  className="bg-transparent border-none outline-none text-sm w-full text-gray-700"
                >
                  {[new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex justify-center items-center py-20 text-purple-600">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : salaries.length === 0 ? (
                <div className="text-center py-20 text-gray-500 flex flex-col items-center">
                  <DollarSign className="w-12 h-12 text-gray-300 mb-3" />
                  <p>No salary records found for {new Date(0, salaryMonth - 1).toLocaleString('default', { month: 'long' })} {salaryYear}.</p>
                  <p className="text-xs mt-1 text-gray-400">Accountants need to generate the salary sheet first.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                      <th className="p-4 rounded-tl-xl font-semibold">Worker Name</th>
                      <th className="p-4 font-semibold text-center">Present / Total</th>
                      <th className="p-4 font-semibold text-right">Basic Pay</th>
                      <th className="p-4 font-semibold text-right">Bonus (Prod)</th>
                      <th className="p-4 font-semibold text-right text-red-500">Advances</th>
                      <th className="p-4 rounded-tr-xl font-semibold text-right text-green-600">Net Payable</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {salaries.map(s => {
                      const netPay = (s.basicSalary || 0) + (s.bonus || 0) - (s.advances || 0);
                      return (
                        <tr key={s._id} className="hover:bg-gray-50/50 transition">
                          <td className="p-4 font-semibold text-gray-900">
                            {s.labour?.name || 'Unknown'}
                          </td>
                          <td className="p-4 text-center">
                            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold text-xs">
                              {s.presentDays} / {s.monthDays}
                            </span>
                          </td>
                          <td className="p-4 text-right font-medium text-gray-700">₹{s.basicSalary?.toLocaleString() || 0}</td>
                          <td className="p-4 text-right font-medium text-purple-600">+ ₹{s.bonus?.toLocaleString() || 0}</td>
                          <td className="p-4 text-right font-medium text-red-500">- ₹{s.advances?.toLocaleString() || 0}</td>
                          <td className="p-4 text-right">
                            <span className="font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                              ₹{netPay.toLocaleString()}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan="2" className="p-4 font-bold text-gray-900 text-right uppercase text-xs">Grand Total</td>
                      <td className="p-4 text-right font-bold text-gray-900">
                        ₹{salaries.reduce((sum, s) => sum + (s.basicSalary || 0), 0).toLocaleString()}
                      </td>
                      <td className="p-4 text-right font-bold text-purple-600">
                        ₹{salaries.reduce((sum, s) => sum + (s.bonus || 0), 0).toLocaleString()}
                      </td>
                      <td className="p-4 text-right font-bold text-red-600">
                        ₹{salaries.reduce((sum, s) => sum + (s.advances || 0), 0).toLocaleString()}
                      </td>
                      <td className="p-4 text-right font-bold text-green-600 text-lg">
                        ₹{salaries.reduce((sum, s) => sum + ((s.basicSalary || 0) + (s.bonus || 0) - (s.advances || 0)), 0).toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
