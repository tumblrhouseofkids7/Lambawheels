import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Truck, Sun, Moon, Plus, Trash2, Edit2, Check, X,
  Download, RefreshCw, Clock, Wifi, Users, ChevronDown, ChevronUp, Upload, FileText
} from 'lucide-react';
import useDispatchStore from '../store/useDispatchStore';
import ConfirmModal from '../components/ConfirmModal';
import toast from 'react-hot-toast';

const today = () => new Date().toISOString().slice(0, 10);
const emptyRow = () => ({ id: Date.now() + Math.random(), productName: '', targetQty: '' });
const COMPANIES_KEY = 'dispatch_companies_list';
const loadCompanies = () => { try { return JSON.parse(localStorage.getItem(COMPANIES_KEY) || '[]'); } catch { return []; } };

/* ── CSV Parser ── */
function parseCSV(text) {
  const lines = text.trim().split('\n').filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
    return obj;
  });
}

/* ── small helpers ── */
const ShiftBadge = ({ shift }) => (
  <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${shift === 'Day' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
    {shift === 'Day' ? <Sun size={10} /> : <Moon size={10} />} {shift}
  </span>
);

const ProgressBar = ({ produced, target }) => {
  const pct = target > 0 ? Math.min(100, Math.round((produced / target) * 100)) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-0.5">
        <span className="font-mono font-bold">{produced}</span>
        <span className={`font-bold ${pct >= 100 ? 'text-emerald-600' : pct >= 60 ? 'text-amber-600' : 'text-red-500'}`}>{pct}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-400'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

export default function Dispatch() {
  const {
    dispatches, foremanShifts, allForemen,
    isLoading, shiftsLoading,
    fetchDispatches, fetchForemanShifts, fetchAllForemen,
    createDispatch, updateDispatch, deleteDispatch, deleteEntry, exportPDF,
  } = useDispatchStore();

  const [date, setDate] = useState(today());
  const [shift, setShift] = useState('Day');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Which foreman's form is expanded
  const [activeForeman, setActiveForeman] = useState(null);
  const [rows, setRows] = useState([emptyRow()]);
  const [submitting, setSubmitting] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  // Track completed dispatch sessions as array
  const [completedSessions, setCompletedSessions] = useState([]);
  // After submit success, show banner
  const [lastSubmit, setLastSubmit] = useState(null);
  // Matrix company filter
  const [matrixFilter, setMatrixFilter] = useState('');

  // Company / Party state — persisted in localStorage
  const [companies, setCompanies] = useState(loadCompanies);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [newCompany, setNewCompany] = useState('');

  const productCsvRef = useRef(null);
  const companyCsvRef = useRef(null);

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {}, type: 'danger' });
  const closeConfirm = () => setConfirmModal(p => ({ ...p, isOpen: false }));

  const loadDispatches = useCallback(() => {
    fetchDispatches({ date, shift });
  }, [date, shift]);

  const loadDuty = useCallback(() => {
    fetchForemanShifts(date);
    fetchAllForemen();
    setLastRefresh(new Date());
  }, [date]);

  // Load on mount and when date/shift changes — NO auto-refresh interval
  useEffect(() => {
    loadDuty();
  }, [loadDuty]);

  useEffect(() => {
    loadDispatches();
  }, [loadDispatches]);

  // Reset form when date/shift changes
  useEffect(() => { setActiveForeman(null); setRows([emptyRow()]); setSelectedCompany(null); setNewCompany(''); setLastSubmit(null); }, [date, shift]);

  const toggleForeman = (fm) => {
    if (activeForeman?.foremanId === fm.foremanId) {
      setActiveForeman(null);
      setRows([emptyRow()]);
      setSelectedCompany(null);
      setNewCompany('');
      setLastSubmit(null);
    } else {
      setActiveForeman(fm);
      setRows([emptyRow()]);
      setSelectedCompany(null);
      setNewCompany('');
      setLastSubmit(null);
    }
  };

  // Product row helpers
  const addRow = () => setRows(r => [...r, emptyRow()]);
  const removeRow = (id) => setRows(r => r.filter(row => row.id !== id));
  const updateRowField = (id, field, val) =>
    setRows(r => r.map(row => row.id === id ? { ...row, [field]: val } : row));

  // CSV upload for products
  const handleProductCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const parsed = parseCSV(ev.target.result);
      if (!parsed.length) return toast.error('CSV is empty or invalid');
      const imported = parsed
        .filter(r => r.productname || r['product name'] || r.product)
        .map(r => ({
          id: Date.now() + Math.random(),
          productName: r.productname || r['product name'] || r.product || '',
          targetQty: r.targetqty || r['target qty'] || r.qty || r.quantity || '',
        }));
      if (!imported.length) return toast.error('No valid product rows found. Use columns: productname, targetqty');
      setRows(imported);
      toast.success(`${imported.length} products imported from CSV`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Company helpers — saved permanently to localStorage
  const saveCompanies = (list) => {
    setCompanies(list);
    localStorage.setItem(COMPANIES_KEY, JSON.stringify(list));
  };
  const removeCompany = (name) => {
    const updated = companies.filter(c => c !== name);
    saveCompanies(updated);
    if (selectedCompany === name) setSelectedCompany(null);
  };
  const addCompanyManually = () => {
    const name = newCompany.trim();
    if (!name) return toast.error('Enter a company name');
    if (companies.includes(name)) return toast.error('Company already exists');
    saveCompanies([...companies, name]);
    setNewCompany('');
    toast.success(`"${name}" added`);
  };

  // CSV upload for companies — replaces the existing list
  const handleCompanyCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const parsed = parseCSV(ev.target.result);
      if (!parsed.length) return toast.error('CSV is empty or invalid');
      const imported = parsed
        .filter(r => r.company || r.companyname || r['company name'] || r.partyname || r['party name'])
        .map(r => r.company || r.companyname || r['company name'] || r.partyname || r['party name'] || '');
      const unique = [...new Set(imported.filter(Boolean))];
      if (!unique.length) return toast.error('No valid companies found. Use column: company');
      saveCompanies(unique);
      setSelectedCompany(null);
      toast.success(`${unique.length} companies saved permanently`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSubmitOrder = async () => {
    const valid = rows.filter(r => r.productName.trim());
    if (!valid.length) return toast.error('Add at least one product');
    if (!activeForeman) return toast.error('Select a foreman first');
    if (!selectedCompany) return toast.error('Select a company/party first');

    setSubmitting(true);
    let successCount = 0;
    for (const row of valid) {
      const result = await createDispatch({
        productName: row.productName.trim(),
        targetQty: Number(row.targetQty) || 0,
        date,
        shift,
        foremanId: activeForeman.foremanId,
        foremanName: activeForeman.foremanName,
        partyName: selectedCompany,
      });
      if (result.ok) successCount++;
    }
    setSubmitting(false);
    if (successCount > 0) {
      const fId = activeForeman.foremanId;
      const sessionNum = completedSessions.filter(s => s.foremanId === fId).length + 1;
      const newSession = {
        foremanId: fId,
        foremanName: activeForeman.foremanName,
        company: selectedCompany,
        productCount: successCount,
        sessionNum,
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        status: 'Completed',
      };
      setCompletedSessions(prev => [...prev, newSession]);
      setLastSubmit({ foremanId: fId, foremanName: activeForeman.foremanName, company: selectedCompany, count: sessionNum });
      toast.success(`Dispatch #${sessionNum}: ${successCount} product(s) → ${activeForeman.foremanName} for ${selectedCompany}`);
      setRows([emptyRow()]);
      setSelectedCompany(null);
      loadDispatches();
    }
  };

  const handleNewDispatch = () => {
    setLastSubmit(null);
    setRows([emptyRow()]);
    setSelectedCompany(null);
    setNewCompany('');
  };

  const handleSaveEdit = async () => {
    if (!editRow) return;
    await updateDispatch(editRow.id, { productName: editRow.productName, targetQty: Number(editRow.targetQty) });
    setEditRow(null);
  };

  // Dispatches grouped by foreman + party
  const byGroup = dispatches.reduce((acc, d) => {
    const fId = d.foremanId?._id || d.foremanId || 'unassigned';
    const party = d.partyName || '';
    const key = `${fId}|||${party}`;
    if (!acc[key]) acc[key] = { foremanId: fId, foremanName: d.foremanName || d.foremanId?.name || 'Unassigned', partyName: party, rows: [] };
    acc[key].rows.push(d);
    return acc;
  }, {});

  // Unique companies from current dispatches (for filter)
  const dispatchCompanies = [...new Set(dispatches.map(d => d.partyName || '').filter(Boolean))];

  // Filtered groups
  const filteredGroups = Object.entries(byGroup).filter(([, g]) =>
    !matrixFilter || g.partyName === matrixFilter
  );

  // Active foreman's filtered shifts
  const filteredShifts = foremanShifts.filter(s => s.shiftType === shift);

  return (
    <div className="space-y-6 fade-in">
      <ConfirmModal isOpen={confirmModal.isOpen} title={confirmModal.title} message={confirmModal.message}
        confirmText={confirmModal.confirmText} type={confirmModal.type} onConfirm={confirmModal.onConfirm} onClose={closeConfirm} />

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-black font-black text-xl flex items-center gap-2">
            <Truck size={22} className="text-emerald-600" /> Dispatch (Contacter) Control
          </h1>
          <p className="text-gray-500 text-xs mt-0.5">Check foremen on duty → assign dispatch orders → track production</p>
        </div>
        <button onClick={() => exportPDF({ date, shift })}
          className="flex items-center gap-2 px-4 py-2 bg-black hover:bg-gray-800 text-white text-sm font-bold rounded-xl transition-all shadow">
          <Download size={15} /> Export PDF
        </button>
      </div>

      {/* ── STEP 1: Date + Shift + Check Duty ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
            <Wifi size={13} className="text-emerald-500" /> Live Duty Board
          </p>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">Last updated: {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            <button onClick={() => { loadDuty(); loadDispatches(); }}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-black border border-gray-200 px-3 py-1.5 rounded-xl transition-all">
              <RefreshCw size={11} className={shiftsLoading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-4 mb-5">
          {/* Date */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-500">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-800 outline-none focus:border-black transition-all" />
          </div>

        </div>

        {/* ── Contacter Cards ── */}
        <div className="mt-5">
            {shiftsLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-gray-800 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-gray-400">Loading live duty status...</p>
              </div>
            </div>
          ) : allForemen.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-gray-200 rounded-xl text-gray-400 text-sm">
              <Users size={32} className="mx-auto mb-2 text-gray-200" />
              No Contacters registered in the system yet.
            </div>
          ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {allForemen.map(fm => {
                  const shiftStatus = filteredShifts.find(s => s.foremanId === fm._id);
                  const isActive = activeForeman?.foremanId === fm._id;
                  const fmDispatches = dispatches.filter(d => (d.foremanId?._id || d.foremanId) === fm._id);
                  const isLive = shiftStatus?.status === 'Active';
                  return (
                    <div key={fm._id} className={`border rounded-2xl overflow-hidden transition-all shadow-sm ${isActive ? 'border-black ring-2 ring-black ring-offset-1' : isLive ? 'border-emerald-300 hover:border-emerald-500' : 'border-gray-200 hover:border-gray-400'}`}>
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-start gap-2">
                            {/* Live pulse indicator */}
                            <div className="mt-1.5 relative flex-shrink-0">
                              <span className={`flex h-2.5 w-2.5 rounded-full ${isLive ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                              {isLive && <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 opacity-75 top-0 left-0" />}
                            </div>
                            <div>
                              <p className="font-black text-gray-900">{fm.name}</p>
                              <p className="text-xs text-gray-400">{fm.email}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <ShiftBadge shift={shiftStatus?.shiftType || shift} />
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isLive ? 'bg-emerald-100 text-emerald-700' : shiftStatus?.status === 'Completed' ? 'bg-gray-100 text-gray-500' : 'bg-red-50 text-red-600'}`}>
                              {isLive ? '● On Duty' : shiftStatus?.status === 'Completed' ? '✓ Completed' : 'Not Started'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
                          <Clock size={11} />
                          {shiftStatus?.startTime 
                            ? new Date(shiftStatus.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + (shiftStatus.endTime ? ` → ${new Date(shiftStatus.endTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : '')
                            : 'No Shift Time'}
                        </div>
                        {fmDispatches.length > 0 && (
                          <p className="text-xs text-emerald-600 font-semibold mb-3">
                            ✓ {fmDispatches.length} product(s) dispatched
                          </p>
                        )}
                        <button onClick={() => toggleForeman({ foremanId: fm._id, foremanName: fm.name })}
                          className={`w-full flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-xl transition-all ${isActive ? 'bg-black text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                          <Plus size={14} />
                          {isActive ? 'Close Order Form' : 'Assign Dispatch'}
                          {isActive ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>
                      </div>

                      {/* ── Inline Dispatch Order Form ── */}
                      {isActive && (
                        <div className="border-t border-gray-200 bg-gray-50 p-4">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                              Dispatch Order for <span className="text-black">{fm.name}</span>
                              {completedSessions.filter(s => s.foremanId === fm._id).length > 0 && (
                                <span className="ml-2 bg-black text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                                  {completedSessions.filter(s => s.foremanId === fm._id).length} done
                                </span>
                              )}
                            </p>
                          </div>

                          {/* ── Success Banner after submit ── */}
                          {lastSubmit?.foremanId === fm._id ? (
                            <div className="mb-4 p-3 bg-black rounded-xl text-white">
                              <p className="text-xs font-black uppercase tracking-wider mb-1">✓ Dispatch #{lastSubmit.count} Complete</p>
                              <p className="text-xs text-gray-400 mb-3">Sent to <span className="text-white font-bold">{lastSubmit.company}</span></p>
                              <div className="flex gap-2">
                                <button onClick={handleNewDispatch}
                                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-black bg-white text-black rounded-lg hover:bg-gray-100 transition-all">
                                  <Plus size={12} /> New Dispatch (Same Foreman)
                                </button>
                                <button onClick={() => toggleForeman({ foremanId: fm._id, foremanName: fm.name })}
                                  className="px-3 py-2 text-xs font-bold border border-gray-600 text-gray-400 rounded-lg hover:border-white hover:text-white transition-all">
                                  Close
                                </button>
                              </div>
                            </div>
                          ) : (<>

                          {/* ── Company / Party Selector ── */}
                          <div className="mb-4 bg-white border border-gray-200 rounded-xl p-3">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-black uppercase tracking-wider text-black">Select Company / Party</p>
                              <div className="flex items-center gap-1.5">
                                <input ref={companyCsvRef} type="file" accept=".csv" onChange={handleCompanyCSV} className="hidden" />
                                <button onClick={() => companyCsvRef.current?.click()}
                                  className="flex items-center gap-1 text-[10px] font-bold border border-gray-300 text-gray-600 px-2 py-1 rounded-lg hover:bg-black hover:text-white hover:border-black transition-all">
                                  <Upload size={9} /> CSV
                                </button>
                              </div>
                            </div>

                            {/* Manual add input */}
                            <div className="flex gap-1.5 mb-3">
                              <input
                                type="text"
                                value={newCompany}
                                onChange={e => setNewCompany(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addCompanyManually()}
                                placeholder="Add company / party name..."
                                className="flex-1 border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-black transition-all"
                              />
                              <button onClick={addCompanyManually}
                                className="flex items-center gap-1 text-xs font-bold bg-black text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-all flex-shrink-0">
                                <Plus size={11} /> Add
                              </button>
                            </div>

                            {companies.length === 0 ? (
                              <p className="text-xs text-gray-400 italic text-center py-2">No companies yet. Add manually or upload a CSV.</p>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {companies.map(company => (
                                  <div key={company} className="flex items-center gap-0">
                                    <button
                                      onClick={() => setSelectedCompany(selectedCompany === company ? null : company)}
                                      className={`text-xs font-bold px-3 py-1.5 rounded-l-xl border transition-all ${
                                        selectedCompany === company
                                          ? 'bg-black text-white border-black'
                                          : 'bg-white text-gray-700 border-gray-300 hover:border-black hover:text-black'
                                      }`}>
                                      {selectedCompany === company && <Check size={10} className="inline mr-1" />}{company}
                                    </button>
                                    <button
                                      onClick={() => removeCompany(company)}
                                      className="text-xs px-1.5 py-1.5 rounded-r-xl border border-l-0 border-gray-300 text-gray-300 hover:text-red-500 hover:border-red-300 transition-all bg-white">
                                      <X size={10} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                            {selectedCompany && (
                              <p className="mt-2 text-xs font-semibold text-black">
                                ✓ Dispatching to: <span className="bg-black text-white px-2 py-0.5 rounded-lg">{selectedCompany}</span>
                              </p>
                            )}
                          </div>

                          {/* Divider */}
                          <div className="flex items-center gap-2 my-3">
                            <div className="flex-1 h-px bg-gray-200" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Product List</span>
                            <div className="flex-1 h-px bg-gray-200" />
                          </div>

                          {/* CSV Upload for Products */}
                          <div className="flex items-center gap-2 mb-3 p-2.5 bg-white border border-dashed border-gray-300 rounded-xl">
                            <FileText size={14} className="text-gray-400 flex-shrink-0" />
                            <span className="text-xs text-gray-500 flex-1">Upload product list CSV <span className="text-gray-400">(cols: productname, targetqty)</span></span>
                            <input ref={productCsvRef} type="file" accept=".csv" onChange={handleProductCSV} className="hidden" />
                            <button onClick={() => productCsvRef.current?.click()}
                              className="flex items-center gap-1 text-xs font-bold bg-black text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-all">
                              <Upload size={11} /> Upload CSV
                            </button>
                          </div>

                          <div className="space-y-2 mb-3">
                            {/* Column headers */}
                            <div className="grid grid-cols-[1fr_100px_32px] gap-2 text-xs font-bold text-gray-400 uppercase px-1">
                              <span>Product Name</span><span>Target Qty</span><span />
                            </div>
                            {rows.map((row, idx) => (
                              <div key={row.id} className="grid grid-cols-[1fr_100px_32px] gap-2 items-center">
                                <input type="text" value={row.productName} placeholder={`Product ${idx + 1}`}
                                  onChange={e => updateRowField(row.id, 'productName', e.target.value)}
                                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:border-black transition-all w-full" />
                                <input type="number" value={row.targetQty} placeholder="0" min="0"
                                  onChange={e => updateRowField(row.id, 'targetQty', e.target.value)}
                                  className="border border-gray-300 rounded-lg px-2 py-2 text-sm font-mono text-gray-800 outline-none focus:border-black transition-all w-full" />
                                {rows.length > 1 && (
                                  <button onClick={() => removeRow(row.id)} className="text-gray-300 hover:text-red-500 transition-colors flex items-center justify-center">
                                    <X size={16} />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center justify-between">
                            <button onClick={addRow}
                              className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-black border border-gray-300 hover:border-black px-3 py-1.5 rounded-lg transition-all">
                              <Plus size={12} /> Add Row
                            </button>
                            <button onClick={handleSubmitOrder} disabled={submitting}
                              className="flex items-center gap-2 px-5 py-2 bg-black hover:bg-gray-800 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-60">
                              {submitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Truck size={14} />}
                              Submit Order
                            </button>
                          </div>
                        </>) /* end of non-banner form */}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
      </div>

      {/* \u2500\u2500 STEP 2: Dispatch Matrix \u2500\u2500 */}
      <div>
        {/* Header + Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Dispatch Matrix &mdash; {new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} &nbsp;&middot;&nbsp; <ShiftBadge shift={shift} />
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Company filter chips */}
            <button onClick={() => setMatrixFilter('')}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${!matrixFilter ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-300 hover:border-black'}`}>
              All
            </button>
            {dispatchCompanies.map(c => (
              <button key={c} onClick={() => setMatrixFilter(matrixFilter === c ? '' : c)}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${matrixFilter === c ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-300 hover:border-black'}`}>
                {c}
              </button>
            ))}
            <button onClick={loadDispatches}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-black border border-gray-200 px-3 py-1.5 rounded-xl transition-all ml-1">
              <RefreshCw size={11} className={isLoading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><div className="w-7 h-7 border-2 border-gray-800 border-t-transparent rounded-full animate-spin" /></div>
        ) : filteredGroups.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-200 rounded-2xl py-12 text-center text-gray-400 text-sm">
            <Truck size={36} className="mx-auto mb-2 text-gray-200" />
            {matrixFilter ? `No dispatches for "${matrixFilter}" on this date & shift.` : 'No dispatches assigned for this date & shift.'}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredGroups.map(([key, { foremanId: fId, foremanName, partyName: party, rows: products }]) => {
              const workerMap = new Map();
              products.forEach(p => (p.entries || []).forEach(e => { 
                if (e.labourName) {
                  if (!workerMap.has(e.labourName)) {
                    workerMap.set(e.labourName, { name: e.labourName, gender: e.gender || '' });
                  } else if (e.gender && !workerMap.get(e.labourName).gender) {
                    workerMap.get(e.labourName).gender = e.gender;
                  }
                }
              }));
              const workers = Array.from(workerMap.values()).sort((a, b) => a.name.localeCompare(b.name));
              const grandTarget   = products.reduce((s, p) => s + (p.targetQty || 0), 0);
              const grandProduced = products.reduce((s, p) => s + (p.totalProduced || 0), 0);
              const shortage = Math.max(0, grandTarget - grandProduced);

              return (
                <div key={key} className="bg-white border-2 border-black rounded-2xl overflow-hidden shadow-sm">
                  {/* B&W header */}
                  <div className="bg-black px-5 py-3 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center text-xs font-black flex-shrink-0">
                        {foremanName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-black text-white text-sm">{foremanName}</p>
                        <p className="text-gray-400 text-xs">
                          {party && <><span className="text-white font-bold">{party}</span> &nbsp;&middot;&nbsp;</>}
                          {products.length} products &nbsp;&middot;&nbsp;
                          Target: <span className="text-white font-bold">{grandTarget.toLocaleString()}</span> &nbsp;&middot;&nbsp;
                          Produced: <span className="text-white font-bold">{grandProduced.toLocaleString()}</span>
                        </p>
                      </div>
                    </div>
                    <button onClick={() => exportPDF({ date, shift, foremanId: fId, foremanName, partyName: party })}
                      className="flex items-center gap-1.5 text-xs font-bold border border-white text-white px-3 py-1.5 rounded-lg hover:bg-white hover:text-black transition-all">
                      <Download size={12} /> Download PDF
                    </button>
                  </div>

                  {/* Matrix Table */}
                  <div className="overflow-x-auto border-t-2 border-black">
                    <table className="min-w-full text-sm border-collapse bg-white">
                      <thead>
                        {/* Product name row */}
                        <tr>
                          <th className="sticky left-0 bg-white z-10 text-left px-4 py-2.5 text-xs font-black text-black uppercase tracking-wider border-2 border-black min-w-[130px]">NAME</th>
                          {products.map(p => (
                            <th key={p._id} className="px-3 py-2 text-center border-2 border-black min-w-[90px]">
                              <p className="font-black text-black text-xs leading-tight">{p.productName}</p>
                              <div className="flex items-center justify-center gap-1 mt-1">
                                <button onClick={() => setEditRow({ id: p._id, productName: p.productName, targetQty: p.targetQty ?? 0 })}
                                  className="text-gray-400 hover:text-black transition-colors"><Edit2 size={10} /></button>
                                <button onClick={() => setConfirmModal({
                                  isOpen: true, title: 'Delete Product', confirmText: 'Delete', type: 'danger',
                                  message: `Delete "${p.productName}" and all its entries?`,
                                  onConfirm: () => deleteDispatch(p._id)
                                })} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={10} /></button>
                              </div>
                            </th>
                          ))}
                          <th className="px-3 py-2 text-center text-xs font-black text-black uppercase border-2 border-black min-w-[80px]">TOTAL</th>
                        </tr>
                        {/* Target row */}
                        <tr>
                          <td className="sticky left-0 bg-white z-10 px-4 py-2 text-xs font-black text-black uppercase border-2 border-black">Target</td>
                          {products.map(p => (
                            <td key={p._id} className="px-3 py-2 text-center border-2 border-black">
                              {editRow?.id === p._id ? (
                                <div className="flex items-center gap-1 justify-center">
                                  <input type="number" value={editRow.targetQty}
                                    onChange={e => setEditRow({ ...editRow, targetQty: e.target.value })}
                                    className="border border-black bg-white text-black rounded px-1.5 py-0.5 text-xs w-16 outline-none font-mono font-bold" />
                                  <button onClick={handleSaveEdit} className="text-black hover:text-gray-500"><Check size={12} /></button>
                                  <button onClick={() => setEditRow(null)} className="text-black hover:text-gray-500"><X size={12} /></button>
                                </div>
                              ) : (
                                <span className="font-black font-mono text-black text-sm">{(p.targetQty || 0).toLocaleString()}</span>
                              )}
                            </td>
                          ))}
                          <td className="px-3 py-2 text-center font-black font-mono text-black border-2 border-black">{grandTarget.toLocaleString()}</td>
                        </tr>
                      </thead>
                      <tbody>
                        {workers.length === 0 ? (
                          <tr>
                            <td colSpan={products.length + 2} className="px-4 py-6 text-center text-gray-500 text-xs italic border-2 border-black">
                              No entries yet — foreman will add worker quantities from the Contacter panel.
                            </td>
                          </tr>
                        ) : workers.map(worker => {
                          const workerName = worker.name;
                          let rowTotal = 0;
                          return (
                            <tr key={workerName}>
                              <td className="sticky left-0 bg-white z-10 px-4 py-2.5 font-bold text-black border-2 border-black text-sm">
                                {workerName}
                                {worker.gender && <span className="text-[10px] text-gray-500 uppercase ml-2 tracking-wider">• {worker.gender}</span>}
                              </td>
                              {products.map(p => {
                                const qty = (p.entries || []).filter(e => e.labourName === workerName).reduce((s, e) => s + (Number(e.quantity) || 0), 0);
                                rowTotal += qty;
                                return (
                                  <td key={p._id} className="px-3 py-2.5 text-center border-2 border-black font-mono">
                                    {qty > 0 ? <span className="font-bold text-black">{qty.toLocaleString()}</span> : <span className="text-gray-400">—</span>}
                                  </td>
                                );
                              })}
                              <td className="px-3 py-2.5 text-center font-black font-mono text-black border-2 border-black">{rowTotal > 0 ? rowTotal.toLocaleString() : '—'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        {/* Total produced */}
                        <tr>
                          <td className="sticky left-0 bg-white z-10 px-4 py-2.5 text-xs font-black text-black uppercase border-2 border-black">Total</td>
                          {products.map(p => (
                            <td key={p._id} className="px-3 py-2.5 text-center border-2 border-black">
                              <span className="font-black font-mono text-black">{(p.totalProduced || 0).toLocaleString()}</span>
                            </td>
                          ))}
                          <td className="px-3 py-2.5 text-center font-black font-mono text-black text-base border-2 border-black">{grandProduced.toLocaleString()}</td>
                        </tr>
                        {/* Shortage */}
                        <tr>
                          <td className="sticky left-0 bg-white z-10 px-4 py-2 text-xs font-black text-black uppercase border-2 border-black">Shortage</td>
                          {products.map(p => {
                            const s = Math.max(0, (p.targetQty || 0) - (p.totalProduced || 0));
                            return (
                              <td key={p._id} className="px-3 py-2 text-center border-2 border-black">
                                {s > 0 ? <span className="font-bold font-mono text-black text-xs">-{s.toLocaleString()}</span>
                                  : <span className="text-black font-bold text-xs">✓</span>}
                              </td>
                            );
                          })}
                          <td className="px-3 py-2 text-center border-2 border-black">
                            {shortage > 0
                              ? <span className="font-black font-mono text-black text-xs">-{shortage.toLocaleString()}</span>
                              : <span className="text-black font-bold text-xs">✓ Done</span>}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
