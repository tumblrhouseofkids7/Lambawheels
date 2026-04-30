import React, { useEffect, useState, useCallback } from 'react';
import {
  Users, Briefcase, HardHat, UserCheck, Package, ChevronRight,
  X, Phone, Mail, Calendar, Award, BarChart2, Loader2,
  AlertTriangle, ClipboardList, User as UserIcon, Download,
  TrendingUp, Filter,
} from 'lucide-react';
import { systemUserService, dispatchService } from '../services/api';

/* ── helpers ── */
const norm = (r) => (r || 'Labour').trim().toLowerCase();

const Avatar = ({ user, size = 'md' }) => {
  const sz = size === 'lg' ? 'w-20 h-20 text-3xl' : size === 'sm' ? 'w-8 h-8 text-xs' : 'w-11 h-11 text-base';
  return user?.profilePic
    ? <img src={user.profilePic} alt={user.name} className={`${sz} rounded-full object-cover ring-2 ring-white`} />
    : <div className={`${sz} rounded-full bg-gradient-to-br from-purple-400 to-indigo-600 flex items-center justify-center text-white font-bold ring-2 ring-white`}>{(user?.name||'?')[0].toUpperCase()}</div>;
};

const RoleBadge = ({ role }) => {
  const map = { accountant:'bg-blue-100 text-blue-700', foreman:'bg-orange-100 text-orange-700', Labour:'bg-green-100 text-green-700', Thakadar:'bg-purple-100 text-purple-700', thakadar:'bg-purple-100 text-purple-700' };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${map[role]||'bg-gray-100 text-gray-600'}`}>{role}</span>;
};

const StatCard = ({ icon: Icon, label, value, color, onClick }) => (
  <button onClick={onClick} className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all group text-left w-full ${onClick?'cursor-pointer hover:-translate-y-0.5':'cursor-default'}`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</p>
        <p className="text-3xl font-extrabold text-gray-900 mt-1">{value??'—'}</p>
      </div>
      <div className={`p-3 rounded-xl ${color}`}><Icon className="w-5 h-5 text-white"/></div>
    </div>
    {onClick && <p className="text-xs text-purple-500 mt-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">Click to view <ChevronRight className="w-3 h-3"/></p>}
  </button>
);

const ProfileModal = ({ user, onClose }) => !user ? null : (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
      <div className="h-24 bg-gradient-to-r from-purple-500 to-indigo-600 relative">
        <button onClick={onClose} className="absolute top-3 right-3 bg-white/20 hover:bg-white/40 text-white rounded-full p-1.5"><X className="w-4 h-4"/></button>
      </div>
      <div className="px-6 pb-6 -mt-10 text-center">
        <div className="inline-block p-1 bg-white rounded-full shadow-lg mb-3"><Avatar user={user} size="lg"/></div>
        <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
        <div className="mt-1"><RoleBadge role={user.role}/></div>
        <div className="mt-5 space-y-3 text-left border-t border-gray-100 pt-5">
          {[{icon:Mail,label:'Email',val:user.email},{icon:Phone,label:'Phone',val:user.phone||'Not provided'},{icon:Calendar,label:'Joined',val:user.createdAt?new Date(user.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}):'—'},{icon:UserIcon,label:'Auth',val:user.googleId?'Google Linked':'Pending Login'}].map(({icon:I,label,val})=>(
            <div key={label} className="flex items-start gap-3">
              <div className="p-2 bg-purple-50 rounded-lg mt-0.5"><I className="w-3.5 h-3.5 text-purple-600"/></div>
              <div><p className="text-[10px] font-semibold text-gray-400 uppercase">{label}</p><p className="text-sm text-gray-800 font-medium">{val}</p></div>
            </div>
          ))}
        </div>
        <button onClick={onClose} className="mt-6 w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition text-sm">Close</button>
      </div>
    </div>
  </div>
);

const ForemanDetailModal = ({ foreman, onClose }) => {
  if (!foreman) return null;
  const labours   = (foreman.labours||[]).filter(l=>norm(l.role)==='labour');
  const thakadars = (foreman.labours||[]).filter(l=>norm(l.role)==='thakadar' || norm(l.role)==='thakdar');
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="bg-gradient-to-r from-orange-400 to-amber-500 p-5 flex items-center gap-4 relative">
          <button onClick={onClose} className="absolute top-3 right-3 bg-white/20 hover:bg-white/40 text-white rounded-full p-1.5"><X className="w-4 h-4"/></button>
          <Avatar user={foreman} size="md"/>
          <div>
            <h2 className="text-lg font-bold text-white">{foreman.name}</h2>
            <p className="text-white/80 text-xs">{foreman.email}</p>
            <div className="flex flex-wrap gap-2 mt-1">
              <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-semibold">{foreman.totalLabours} Labours</span>
              <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-semibold">{foreman.totalThakadars} Thakadars</span>
              <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-semibold">{(foreman.totalProduction||0).toLocaleString()} pcs</span>
            </div>
          </div>
        </div>
        <div className="overflow-y-auto p-5 space-y-5">
          {thakadars.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Thakadars ({thakadars.length})</p>
              <div className="grid grid-cols-2 gap-2">
                {thakadars.map(l=>(
                  <div key={l._id} className="flex items-center gap-2 bg-purple-50 rounded-xl p-2.5">
                    <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center text-purple-800 font-bold text-xs shrink-0">{l.name[0]?.toUpperCase()}</div>
                    <div className="min-w-0"><p className="text-xs font-semibold text-gray-900 truncate">{l.name}</p><p className="text-[10px] text-gray-500">{l.gender}</p></div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {labours.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Labours ({labours.length})</p>
              <div className="grid grid-cols-2 gap-2">
                {labours.map(l=>(
                  <div key={l._id} className="flex items-center gap-2 bg-green-50 rounded-xl p-2.5">
                    <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center text-green-800 font-bold text-xs shrink-0">{l.name[0]?.toUpperCase()}</div>
                    <div className="min-w-0"><p className="text-xs font-semibold text-gray-900 truncate">{l.name}</p><p className="text-[10px] text-gray-500">{l.gender}</p></div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {labours.length===0 && thakadars.length===0 && <p className="text-sm text-gray-400 text-center py-4">No workers assigned yet.</p>}
        </div>
        <div className="p-4 border-t border-gray-100">
          <button onClick={onClose} className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm">Close</button>
        </div>
      </div>
    </div>
  );
};

const ThakadarsModal = ({ thakadars, onClose }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
      <div className="p-5 border-b border-gray-100 flex justify-between items-center">
        <div><h2 className="font-bold text-gray-900 text-lg">All Thakadars</h2><p className="text-xs text-gray-400">{thakadars.length} total</p></div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5"/></button>
      </div>
      <div className="overflow-y-auto p-4 space-y-2">
        {thakadars.map(t=>(
          <div key={t._id} className="flex items-center gap-3 bg-purple-50 rounded-xl p-3">
            <div className="w-9 h-9 rounded-full bg-purple-200 flex items-center justify-center text-purple-800 font-bold text-sm shrink-0">{t.name[0]?.toUpperCase()}</div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">{t.name}</p>
              <p className="text-xs text-gray-500">{t.assignedForeman?.name?`Foreman: ${t.assignedForeman.name}`:'No foreman'} · {t.gender}</p>
            </div>
            <RoleBadge role="Thakadar"/>
          </div>
        ))}
        {thakadars.length===0 && <p className="text-center text-sm text-gray-400 py-6">No Thakadars found.</p>}
      </div>
      <div className="p-4 border-t border-gray-100">
        <button onClick={onClose} className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm">Close</button>
      </div>
    </div>
  </div>
);

/* ═══ MAIN ═══ */
const Dashboard = () => {
  const [stats, setStats]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [dispatchDate, setDispatchDate] = useState('');
  const [profileModal, setProfileModal] = useState(null);
  const [foremanModal, setForemanModal] = useState(null);
  const [showThakadars, setShowThakadars] = useState(false);

  const loadStats = useCallback(async (date) => {
    try {
      setLoading(true);
      const { data } = await systemUserService.getDashboardStats(date || undefined);
      setStats(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  const handleDateFilter = (e) => {
    const d = e.target.value;
    setDispatchDate(d);
    loadStats(d);
  };

  const handleClearDate = () => {
    setDispatchDate('');
    loadStats();
  };

  const handleDownload = () => {
    if (!dispatchDate) { alert('Please select a date first to download the dispatch report.'); return; }
    const url = dispatchService.exportPDFUrl({ date: dispatchDate });
    window.open(url, '_blank');
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-gray-500">
      <Loader2 className="w-10 h-10 animate-spin text-purple-500"/>
      <p className="text-sm font-medium">Loading dashboard…</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-red-500">
      <AlertTriangle className="w-10 h-10"/>
      <p className="text-sm font-semibold">{error}</p>
    </div>
  );

  const { counts, accountants, foremenStats, recentDispatches, thakadars, dispatchDates, dateCounts } = stats;

  // When a date is selected dateCounts is populated — show filtered values in the cards
  const dc = dateCounts; // shorthand
  const statCards = [
    {
      icon: Users,
      label: dc ? `Active Labours` : 'Total Labours',
      value: dc ? dc.activeLabours : counts.totalLabours,
      color: 'bg-green-500', onClick: null,
    },
    {
      icon: HardHat,
      label: dc ? 'Active Foremen' : 'Total Foremen',
      value: dc ? dc.activeForemen : counts.totalForemen,
      color: 'bg-orange-500', onClick: null,
    },
    {
      icon: Award,
      label: 'Total Thakadars',
      value: counts.totalThakadars,
      color: 'bg-purple-500', onClick: () => setShowThakadars(true),
    },
    {
      icon: Briefcase,
      label: 'Total Accountants',
      value: counts.totalAccountants,
      color: 'bg-blue-500', onClick: null,
    },
    {
      icon: Package,
      label: dc ? 'Day Production' : 'Total Production',
      value: dc ? dc.dispatchProduction.toLocaleString() : counts.totalDispatchProduction.toLocaleString(),
      color: 'bg-teal-500', onClick: null,
    },
    {
      icon: UserCheck,
      label: dc ? 'Dispatch Sheets' : 'Pending Approvals',
      value: dc ? dc.dispatchSheets : counts.totalPending,
      color: dc ? 'bg-indigo-500' : 'bg-yellow-500', onClick: null,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-500 text-sm mt-1">
            {dc
              ? <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse inline-block"/><span>Showing data for <strong>{dispatchDate}</strong></span></span>
              : 'Real-time snapshot of your operations.'}
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map(c=><StatCard key={c.label} {...c}/>)}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Accountants */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-blue-500"/>
            <h3 className="font-bold text-gray-900 text-sm">Accountants ({accountants.length})</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {accountants.length===0 && <p className="text-sm text-gray-400 text-center py-6">No accountants yet.</p>}
            {accountants.map(acc=>(
              <div key={acc._id} onClick={()=>setProfileModal(acc)} className="flex items-center gap-3 p-4 hover:bg-blue-50/50 transition cursor-pointer group">
                <Avatar user={acc} size="sm"/>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{acc.name}</p>
                  <p className="text-xs text-gray-400 truncate">{acc.email}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition shrink-0"/>
              </div>
            ))}
          </div>
        </div>

        {/* Foremen */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center gap-2">
            <HardHat className="w-4 h-4 text-orange-500"/>
            <h3 className="font-bold text-gray-900 text-sm">Foremen ({foremenStats.length})</h3>
          </div>
          <div className="p-3 space-y-2">
            {foremenStats.length===0 && <p className="text-sm text-gray-400 text-center py-4">No foremen yet.</p>}
            {foremenStats.map(f=>(
              <div key={f._id} onClick={()=>setForemanModal(f)} className="bg-white border border-gray-100 rounded-xl p-3 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer flex items-start gap-3 group">
                <Avatar user={f} size="sm"/>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate text-sm">{f.name}</p>
                  <p className="text-xs text-gray-500 truncate">{f.email}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <span className="text-[10px] font-semibold bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{f.totalLabours} Labour{f.totalLabours!==1?'s':''}</span>
                    {f.totalThakadars>0 && <span className="text-[10px] font-semibold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">{f.totalThakadars} Thakadar{f.totalThakadars!==1?'s':''}</span>}
                    <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{(f.totalProduction||0).toLocaleString()} pcs</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-orange-500 transition shrink-0 mt-1"/>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Dispatches */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          {/* Header + Controls */}
          <div className="p-4 border-b border-gray-100 space-y-3">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-teal-500"/>
              <h3 className="font-bold text-gray-900 text-sm">Recent Dispatches</h3>
            </div>
            {/* Date filter + Download */}
            <div className="flex gap-2">
              <div className="flex items-center gap-1.5 flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5">
                <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0"/>
                <input
                  type="date"
                  value={dispatchDate}
                  onChange={handleDateFilter}
                  className="text-xs text-gray-700 outline-none bg-transparent w-full"
                />
                {dispatchDate && (
                  <button onClick={handleClearDate} className="text-gray-400 hover:text-red-500 transition shrink-0">
                    <X className="w-3 h-3"/>
                  </button>
                )}
              </div>
              <button
                onClick={handleDownload}
                title={dispatchDate ? `Download report for ${dispatchDate}` : 'Select a date to download'}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${dispatchDate ? 'bg-teal-600 hover:bg-teal-700 text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
              >
                <Download className="w-3.5 h-3.5"/>
                PDF
              </button>
            </div>
          </div>

          <div className="divide-y divide-gray-50 flex-1 overflow-y-auto max-h-72">
            {recentDispatches.length===0 && (
              <p className="text-sm text-gray-400 text-center py-6">
                {dispatchDate ? `No dispatches on ${dispatchDate}` : 'No dispatch records yet.'}
              </p>
            )}
            {recentDispatches.map(d=>(
              <div key={d._id} className="p-3 space-y-0.5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900 truncate">{d.productName}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-1 ${d.isSubmitted?'bg-green-100 text-green-700':'bg-yellow-100 text-yellow-700'}`}>
                    {d.isSubmitted?'Done':'Pending'}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{d.foremanName||'Unassigned'} · {d.shift} · {d.date}</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-teal-600">{(d.totalProduced||0).toLocaleString()} pcs</p>
                  {d.targetQty > 0 && <p className="text-[10px] text-gray-400">Target: {d.targetQty.toLocaleString()}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Assignment Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-indigo-500"/>
          <h3 className="font-bold text-gray-900 text-sm">Foreman → Worker Assignment Overview</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                <th className="px-5 py-3 font-semibold">Foreman</th>
                <th className="px-5 py-3 font-semibold">Thakadars</th>
                <th className="px-5 py-3 font-semibold">Labours</th>
                <th className="px-5 py-3 font-semibold">Total</th>
                <th className="px-5 py-3 font-semibold">Production</th>
              </tr>
            </thead>
            <tbody>
              {foremenStats.length===0 && (
                <tr><td colSpan="5" className="text-center py-8 text-gray-400 text-sm">No foremen found.</td></tr>
              )}
              {foremenStats.map((f,idx)=>(
                <tr key={f._id} onClick={()=>setForemanModal(f)} className={`border-b border-gray-50 hover:bg-indigo-50/40 cursor-pointer transition ${idx%2===0?'bg-white':'bg-gray-50/30'}`}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar user={f} size="sm"/>
                      <div><p className="font-semibold text-gray-900">{f.name}</p><p className="text-xs text-gray-400">{f.email}</p></div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    {f.totalThakadars>0?(
                      <div>
                        <span className="text-purple-600 font-bold">{f.totalThakadars}</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(f.labours||[]).filter(l=>norm(l.role)==='thakadar' || norm(l.role)==='thakdar').map(l=>(
                            <span key={l._id} className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-medium">{l.name}</span>
                          ))}
                        </div>
                      </div>
                    ):<span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="px-5 py-3"><span className="text-green-600 font-bold">{f.totalLabours}</span></td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">
                      <Users className="w-3 h-3"/>{f.totalLabours+f.totalThakadars}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1 bg-teal-50 text-teal-700 text-xs font-bold px-2 py-0.5 rounded-full">
                      <TrendingUp className="w-3 h-3"/>{(f.totalProduction||0).toLocaleString()} pcs
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            {foremenStats.length>0 && (
              <tfoot>
                <tr className="bg-gray-50 font-bold text-gray-700 border-t border-gray-200">
                  <td className="px-5 py-3 text-xs uppercase">Grand Total</td>
                  <td className="px-5 py-3 text-purple-600">{counts.totalThakadars}</td>
                  <td className="px-5 py-3 text-green-600">{counts.totalLabours}</td>
                  <td className="px-5 py-3 text-indigo-600">{counts.totalLabours+counts.totalThakadars}</td>
                  <td className="px-5 py-3 text-teal-600">{counts.totalDispatchProduction.toLocaleString()} pcs</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Modals */}
      {profileModal  && <ProfileModal user={profileModal} onClose={()=>setProfileModal(null)}/>}
      {foremanModal  && <ForemanDetailModal foreman={foremanModal} onClose={()=>setForemanModal(null)}/>}
      {showThakadars && <ThakadarsModal thakadars={thakadars} onClose={()=>setShowThakadars(false)}/>}
    </div>
  );
};

export default Dashboard;
