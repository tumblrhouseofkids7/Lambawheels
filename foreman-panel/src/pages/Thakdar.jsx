import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  Truck, RefreshCw, Sun, Moon,
  Plus, Send, Clock, Edit2, Trash2, X, Save, Download, FileText,
  Users, Target, BarChart2, AlertTriangle, UserPlus, CheckCircle
} from 'lucide-react';
import api from '../utils/axios';
import useDispatchStore from '../store/useDispatchStore';
import useAuthStore from '../store/useAuthStore';
import useLabourStore from '../store/useLabourStore';
import toast from 'react-hot-toast';

const todayStr = () => new Date().toISOString().slice(0, 10);

import useShiftStore from '../store/useShiftStore';

const Thakdar = () => {
  const { user } = useAuthStore();
  const { dispatches, isLoading, fetchDispatches, addEntry, renameWorker, deleteWorker, submitShift } = useDispatchStore();
  const { labours, fetchLabours } = useLabourStore();
  const { activeShift, selectedDate } = useShiftStore();

  const shift = activeShift?.shiftType || 'Day';
  const date = selectedDate;


  // Cell inputs for quantities: key is `${dispatchId}-${workerName}`
  const [cellInputs, setCellInputs] = useState({});
  const [submittingCell, setSubmittingCell] = useState(null);

  const [editingWorker, setEditingWorker] = useState(null);
  const [editName, setEditName] = useState('');
  const [isDeleting, setIsDeleting] = useState(null);

  const [matrixFilter, setMatrixFilter] = useState('');

  const intervalRef = useRef(null);
  const load = () => {
    fetchDispatches({ date, shift });
    fetchLabours();
  };

  useEffect(() => {
    load();
    intervalRef.current = setInterval(load, 30000);
    return () => clearInterval(intervalRef.current);
  }, [date, shift]);





  const handleCellSubmit = async (dispatchId, workerName, workerGender) => {
    const key = `${dispatchId}-${workerName}`;
    const qty = Number(cellInputs[key]);
    if (!qty || qty <= 0) return toast.error('Enter a valid quantity');

    const d = dispatches.find(d => d._id === dispatchId);
    if (d && (d.totalProduced + qty) > d.targetQty) {
      return toast.error('Total produced cannot exceed target quantity!');
    }

    setSubmittingCell(key);
    const ok = await addEntry({
      dispatchId,
      labourName: workerName,
      gender: workerGender || '',
      quantity: qty
    });
    setSubmittingCell(null);

    if (ok) {
      setCellInputs(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleEditStart = (name) => {
    setEditingWorker(name);
    setEditName(name);
  };

  const handleEditSave = async () => {
    if (!editName.trim() || editName === editingWorker) {
      setEditingWorker(null);
      return;
    }
    setSubmittingCell('editing_worker');
    const ok = await renameWorker(editingWorker, editName.trim());
    setSubmittingCell(null);
    if (ok) setEditingWorker(null);
  };

  const handleDeleteWorker = async (name) => {
    if (!window.confirm(`Are you sure you want to delete worker "${name}" and ALL their entries for this shift?`)) return;
    setIsDeleting(name);
    await deleteWorker(name);
    setIsDeleting(null);
  };

  const handleDownloadPDF = async (partyName) => {
    if (!window.confirm('This will lock current products as final submission. You will not be able to add entries to them. Proceed?')) return;
    try {
      const ok = await submitShift(date, shift);
      if (!ok) return;

      const params = new URLSearchParams({ date, shift });
      if (partyName) params.append('partyName', partyName);

      const response = await api.get(`/dispatch/export/pdf?${params.toString()}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `Dispatch_${date}_${shift}${partyName ? `_${partyName}` : ''}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('PDF Downloaded Successfully');
    } catch (err) {
      toast.error('Could not download PDF');
    }
  };

  // Derive unique workers from all dispatch entries AND permanent labours
  const allWorkers = useMemo(() => {
    const workerMap = new Map();

    // 1. Add permanent labours first (only Thakdars)
    labours.filter(l => l.role && l.role.toLowerCase() === 'thakdar').forEach(l => {
      workerMap.set(l.name, { name: l.name, gender: l.gender || '', role: l.role || '' });
    });

    // 2. Add server workers (from dispatches) that might not be in the permanent list
    dispatches.forEach(d => {
      (d.entries || []).forEach(e => {
        if (e.labourName) {
          if (!workerMap.has(e.labourName)) {
            workerMap.set(e.labourName, { name: e.labourName, gender: e.gender || '' });
          }
        }
      });
    });

    return Array.from(workerMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [dispatches, labours]);

  // Overall stats
  const totalTarget = dispatches.reduce((s, d) => s + (d.targetQty || 0), 0);
  const totalProduced = dispatches.reduce((s, d) => s + (d.totalProduced || 0), 0);
  const overallPct = totalTarget > 0 ? Math.min(100, Math.round((totalProduced / totalTarget) * 100)) : 0;

  return (
    <div className="animate-fade-in min-h-screen bg-gray-50 pb-20">
      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <Truck size={20} className="text-emerald-500" /> Thakdar
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                {user?.name && `Logged in as ${user.name}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => handleDownloadPDF('')} className="p-2 rounded-xl border border-gray-200 hover:border-black transition-all bg-emerald-50 text-emerald-600 flex items-center gap-2">
                <FileText size={16} /> <span className="text-sm font-bold hidden sm:inline">Submit & Export All</span>
              </button>
              <button onClick={load} className="p-2 rounded-xl border border-gray-200 hover:border-black transition-all">
                <RefreshCw size={16} className={`text-gray-500 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="mb-3">
            <div className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm bg-gray-100 text-gray-600 font-bold flex items-center justify-between">
              <span>Date: {date}</span>
              <span>Shift: {shift}</span>
            </div>
            {!activeShift && (
              <p className="text-xs text-red-500 mt-2 font-bold">Please start a shift on the dashboard first.</p>
            )}
          </div>


          {/* Mini Stats */}
          {dispatches.length > 0 && (
            <div className="flex gap-2">
              <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-center">
                <p className="text-xs text-gray-400">Products</p>
                <p className="font-black text-gray-900">{dispatches.length}</p>
              </div>
              <div className="flex-1 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-center">
                <p className="text-xs text-amber-500">Target</p>
                <p className="font-black text-amber-700 font-mono">{totalTarget.toLocaleString()}</p>
              </div>
              <div className="flex-1 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-center">
                <p className="text-xs text-emerald-500">Produced</p>
                <p className="font-black text-emerald-700 font-mono">{totalProduced.toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Matrix Body ── */}
      <div className="px-2 pt-4">
        {isLoading && dispatches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 border-2 border-gray-800 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">Loading dispatch data...</p>
          </div>
        ) : dispatches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
              <Truck size={36} className="text-gray-300" />
            </div>
            <div className="text-center">
              <p className="font-bold text-gray-600">No Dispatch Assigned</p>
              <p className="text-sm text-gray-400 mt-1 px-6">
                Waiting for the accountant to create a dispatch sheet for this date & shift.
              </p>
            </div>
          </div>
        ) : (
          <div>
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <button onClick={() => setMatrixFilter('')}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${!matrixFilter ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-300 hover:border-black'}`}>
                All
              </button>
              {[...new Set(dispatches.map(d => d.partyName || '').filter(Boolean))].map(c => (
                <button key={c} onClick={() => setMatrixFilter(matrixFilter === c ? '' : c)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${matrixFilter === c ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-300 hover:border-black'}`}>
                  {c}
                </button>
              ))}
            </div>

            <div className="space-y-8">
              {Object.entries(
                dispatches.reduce((acc, d) => {
                  const party = d.partyName || '';
                  if (!acc[party]) acc[party] = { partyName: party, rows: [] };
                  acc[party].rows.push(d);
                  return acc;
                }, {})
              ).filter(([party]) => !matrixFilter || party === matrixFilter).map(([party, group]) => {
                const groupDispatches = group.rows;
                const groupTarget = groupDispatches.reduce((s, d) => s + (d.targetQty || 0), 0);
                const groupProduced = groupDispatches.reduce((s, d) => s + (d.totalProduced || 0), 0);

                return (
                  <div key={party} className="bg-white border-2 border-black rounded-2xl shadow-sm overflow-hidden mb-6">
                    {/* B&W header */}
                    <div className="bg-black px-5 py-3 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center text-xs font-black flex-shrink-0">
                          {party ? party.charAt(0).toUpperCase() : <Truck size={14} />}
                        </div>
                        <div>
                          <p className="font-black text-white text-sm">{party || 'Unassigned Party'}</p>
                          <p className="text-gray-400 text-xs">
                            {groupDispatches.length} products &nbsp;&middot;&nbsp;
                            Target: <span className="text-white font-bold">{groupTarget.toLocaleString()}</span> &nbsp;&middot;&nbsp;
                            Produced: <span className="text-white font-bold">{groupProduced.toLocaleString()}</span>
                          </p>
                        </div>
                      </div>
                      <button onClick={() => handleDownloadPDF(party)}
                        className="flex items-center gap-1.5 text-xs font-bold border border-white text-white px-3 py-1.5 rounded-lg hover:bg-white hover:text-black transition-all">
                        <Download size={12} /> Download PDF
                      </button>
                    </div>

                    <div className="overflow-x-auto border-t-2 border-black">
                      <table className="min-w-full text-sm border-collapse bg-white">
                        <thead>
                          {/* Row 1: Products */}
                          <tr>
                            <th className="sticky left-0 bg-white z-10 px-4 py-3 text-left text-xs font-black text-black uppercase tracking-wider border-2 border-black min-w-[140px]">
                              Worker Name
                            </th>
                            {groupDispatches.map(d => {
                              const isHighlighted = (d.totalProduced || 0) < d.targetQty;
                              return (
                                <th key={d._id} className={`px-3 py-2 text-center border-2 border-black min-w-[120px] transition-colors duration-500`}>
                                  <p className={`font-black text-xs leading-tight ${isHighlighted ? 'text-red-600' : 'text-emerald-600'}`}>
                                    {d.productName} {isHighlighted ? '(PENDING)' : '(COMPLETED)'}
                                  </p>
                                </th>
                              );
                            })}
                            <th className="px-3 py-2 text-center text-xs font-black text-black uppercase border-2 border-black min-w-[80px]">TOTAL</th>
                          </tr>

                          {/* Row 2: Target Qty */}
                          <tr>
                            <td className="sticky left-0 bg-white z-10 px-4 py-2 text-xs font-black text-black uppercase border-2 border-black">
                              Target
                            </td>
                            {groupDispatches.map(d => (
                              <td key={d._id} className="px-3 py-2 text-center border-2 border-black font-black font-mono text-black">
                                {d.targetQty}
                              </td>
                            ))}
                            <td className="px-3 py-2 text-center font-black font-mono text-black border-2 border-black">{groupTarget}</td>
                          </tr>
                        </thead>

                        <tbody>
                          {allWorkers.length === 0 ? (
                            <tr>
                              <td colSpan={groupDispatches.length + 2} className="px-4 py-8 text-center text-gray-500 text-xs italic border-2 border-black">
                                No workers added yet. Add a worker below to start entering production.
                              </td>
                            </tr>
                          ) : (
                            allWorkers.map(w => {
                              let rowTotal = 0;
                              return (
                                <tr key={w.name}>
                                  <td className="sticky left-0 bg-white z-10 px-4 py-3 border-2 border-black align-top group">
                                    {editingWorker === w.name ? (
                                      <div className="flex flex-col gap-1 mt-1">
                                        <input
                                          type="text"
                                          value={editName}
                                          onChange={e => setEditName(e.target.value)}
                                          className="border border-black rounded px-2 py-1 text-xs outline-none focus:border-gray-500 w-full font-bold"
                                          autoFocus
                                        />
                                        <div className="flex gap-1">
                                          <button onClick={handleEditSave} disabled={submittingCell === 'editing_worker'} className="p-1 border border-black bg-black text-white rounded hover:bg-gray-800 transition flex-1 flex justify-center">
                                            {submittingCell === 'editing_worker' ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={12} />}
                                          </button>
                                          <button onClick={() => setEditingWorker(null)} className="p-1 border border-black bg-white text-black rounded hover:bg-gray-100 transition flex-1 flex justify-center">
                                            <X size={12} />
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                        <p className="font-bold text-black break-words">{w.name}</p>
                                        {(w.gender || w.role) && (
                                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">
                                            {w.gender} {w.gender && w.role ? '•' : ''} {w.role}
                                          </p>
                                        )}
                                        {!groupDispatches.some(d => d.isSubmitted && (d.entries || []).some(e => e.labourName === w.name)) && (
                                          <div className="flex gap-2 mt-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEditStart(w.name)} className="text-black hover:text-gray-500 transition" title="Edit Name">
                                              <Edit2 size={14} />
                                            </button>
                                            <button onClick={() => handleDeleteWorker(w.name)} disabled={isDeleting === w.name} className="text-black hover:text-gray-500 transition disabled:opacity-50" title="Delete Worker">
                                              {isDeleting === w.name ? <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <Trash2 size={14} />}
                                            </button>
                                          </div>
                                        )}
                                      </>
                                    )}
                                  </td>
                                  {groupDispatches.map(d => {
                                    const entriesForWorker = (d.entries || []).filter(e => e.labourName === w.name);
                                    const totalDone = entriesForWorker.reduce((s, e) => s + (Number(e.quantity) || 0), 0);
                                    rowTotal += totalDone;

                                    const cellKey = `${d._id}-${w.name}`;
                                    const isSubmitting = submittingCell === cellKey;

                                    return (
                                      <td key={d._id} className="px-2 py-2 border-2 border-black text-center align-top">
                                        {totalDone > 0 && (
                                          <div className="mb-1 text-xs font-bold text-black font-mono">
                                            ✓ {totalDone}
                                          </div>
                                        )}
                                        {d.isSubmitted ? (
                                          <div className="text-[10px] text-black italic mt-2 font-bold uppercase tracking-wide">Locked</div>
                                        ) : (d.totalProduced || 0) >= d.targetQty ? (
                                          <div className="text-[10px] text-black italic mt-2 font-bold uppercase tracking-wide">Completed</div>
                                        ) : (
                                          <div className="flex items-center gap-1">
                                            <input
                                              type="number"
                                              min="1"
                                              placeholder="+ qty"
                                              value={cellInputs[cellKey] || ''}
                                              onChange={e => setCellInputs(p => ({ ...p, [cellKey]: e.target.value }))}
                                              className="w-full border border-black rounded-lg px-2 py-1.5 text-xs outline-none focus:border-gray-500 transition-all font-mono text-center"
                                            />
                                            <button
                                              onClick={() => handleCellSubmit(d._id, w.name, w.gender)}
                                              disabled={!cellInputs[cellKey] || isSubmitting}
                                              className="p-1.5 border border-black bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-30 transition-all flex-shrink-0"
                                            >
                                              {isSubmitting ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={14} />}
                                            </button>
                                          </div>
                                        )}
                                      </td>
                                    );
                                  })}
                                  <td className="px-3 py-3 text-center font-black font-mono text-black align-middle border-2 border-black">
                                    {rowTotal > 0 ? rowTotal : '—'}
                                  </td>
                                </tr>
                              );
                            })
                          )}

                          {/* Add New Worker Row removed as per request */}
                        </tbody>

                        <tfoot>
                          {/* Total Produced row */}
                          <tr>
                            <td className="sticky left-0 bg-white z-10 px-4 py-3 text-xs font-black text-black uppercase border-2 border-black">
                              Total Done
                            </td>
                            {groupDispatches.map(d => {
                              const isHighlighted = (d.totalProduced || 0) < d.targetQty;
                              return (
                                <td key={d._id} className={`px-3 py-3 text-center border-2 border-black ${isHighlighted ? 'bg-red-50' : 'bg-emerald-50'}`}>
                                  <span className={`font-black font-mono text-base ${isHighlighted ? 'text-red-600' : 'text-emerald-600'}`}>{d.totalProduced || 0}</span>
                                </td>
                              );
                            })}
                            <td className="px-3 py-3 text-center font-black font-mono text-black text-lg border-2 border-black">{groupProduced}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Thakdar;
