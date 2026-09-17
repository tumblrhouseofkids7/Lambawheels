import React, { useEffect, useState } from 'react';
import {
  Users, Activity, Clock,
  Play, Square, CalendarDays, CheckCircle2, XCircle, Timer,
  Sun, Moon, ChevronDown, AlertCircle, HardHat, UserCheck,
} from 'lucide-react';
import useReportStore from '../store/useReportStore';
import useLabourStore from '../store/useLabourStore';
import useShiftStore from '../store/useShiftStore';
import Loader from '../components/Loader';

/* ─── helpers ─────────────────────────────────────────────────────────── */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Morning 🌤️';
  if (h < 17) return 'Afternoon ☀️';
  return 'Evening 🌙';
}

function fmt(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function fmtDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function duration(start, end) {
  const s = new Date(start);
  const e = end ? new Date(end) : new Date();
  const diff = Math.floor((e - s) / 60000);
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/* ─── component ───────────────────────────────────────────────────────── */
const Dashboard = () => {
  const { summary, fetchSummary, isLoading } = useReportStore();
  const { labours, fetchLabours } = useLabourStore();
  const {
    activeShift, shiftHistory,
    isStarting, isEnding,
    fetchActiveShift, fetchShiftHistory,
    startShift, endShift,
    error: shiftError,
  } = useShiftStore();

  const [shiftType, setShiftType] = useState('Day');
  const [historyDate, setHistoryDate] = useState(todayISO());
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchSummary();
    fetchLabours();
    fetchActiveShift();
    fetchShiftHistory(historyDate);
  }, []);

  /* show toast helper */
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleStart = async () => {
    const res = await startShift(shiftType);
    if (res.success) showToast(`${shiftType} shift started!`);
    else showToast(res.error, 'error');
  };

  const handleEnd = async () => {
    const res = await endShift();
    if (res.success) {
      showToast('Shift ended successfully!');
      fetchShiftHistory(historyDate);
    } else showToast(res.error, 'error');
  };

  const handleDateChange = (e) => {
    setHistoryDate(e.target.value);
    fetchShiftHistory(e.target.value);
  };

  /* 3 main stat values (Updated to default to 0 instead of '—') */
  const totalLabourCount = labours.filter(l => !l.role || l.role.toLowerCase() === 'labour').length;
  const totalThakdarCount = labours.filter(l => l.role && l.role.toLowerCase() === 'thakdar').length;
  const totalForemanCount = summary?.totalForemen ?? 0;

  /* derive attendance status from history */
  const wasPresent = shiftHistory.length > 0;

  return (
    <div className="space-y-6 fade-in relative">

      {/* ── Toast ── */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 transition-all duration-300 ${toast.type === 'error'
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-green-50 text-green-700 border border-green-200'
            }`}
        >
          {toast.type === 'error'
            ? <AlertCircle size={16} />
            : <CheckCircle2 size={16} />}
          {toast.msg}
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-gray-900 text-xl font-bold">Good {getGreeting()}</h2>
          <p className="text-gray-500 text-sm mt-0.5">Here's what's happening at Lamba Wheels today.</p>
        </div>

        {/* ── Shift Controls ── */}
        <div className="flex items-center gap-2 flex-wrap">
          {!activeShift ? (
            <>
              {/* Shift type selector */}
              <div className="relative">
                <select
                  value={shiftType}
                  onChange={(e) => setShiftType(e.target.value)}
                  className="appearance-none pl-8 pr-8 py-2 text-sm border border-gray-200 rounded-xl bg-white text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-black/10 cursor-pointer"
                >
                  <option value="Day">Day Shift</option>
                  <option value="Night">Night Shift</option>
                </select>
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                  {shiftType === 'Day' ? <Sun size={14} /> : <Moon size={14} />}
                </span>
                <ChevronDown size={12} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>

              <button
                onClick={handleStart}
                disabled={isStarting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black text-white text-sm font-semibold hover:bg-zinc-800 active:scale-95 transition-all duration-150 disabled:opacity-50"
              >
                <Play size={14} className="fill-white" />
                {isStarting ? 'Starting…' : 'Start Shift'}
              </button>
            </>
          ) : (
            <>
              {/* Active shift pill */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-50 border border-green-200">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-green-700 text-xs font-semibold uppercase tracking-wide">
                  {activeShift.shiftType} Shift Active
                </span>
                <span className="text-green-600 text-xs ml-1">
                  · {fmt(activeShift.startTime)}
                </span>
              </div>

              <button
                onClick={handleEnd}
                disabled={isEnding}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 active:scale-95 transition-all duration-150 disabled:opacity-50"
              >
                <Square size={14} className="fill-white" />
                {isEnding ? 'Ending…' : 'End Shift'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Active Shift Banner ── */}
      {activeShift && (
        <div className="bg-gradient-to-r from-zinc-900 to-zinc-700 rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              {activeShift.shiftType === 'Day'
                ? <Sun size={20} className="text-yellow-300" />
                : <Moon size={20} className="text-blue-300" />}
            </div>
            <div>
              <p className="text-white font-bold text-sm">{activeShift.shiftType} Shift — In Progress</p>
              <p className="text-zinc-400 text-xs">Started at {fmt(activeShift.startTime)} · {fmtDate(activeShift.startTime)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl">
            <Timer size={14} className="text-white" />
            <span className="text-white text-sm font-mono font-semibold">
              {duration(activeShift.startTime, null)}
            </span>
          </div>
        </div>
      )}

      {/* ── 4 Main Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Production */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 lg:p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
            <Activity size={22} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-0.5">Total Production</p>
            <p className="text-gray-900 text-2xl lg:text-3xl font-extrabold leading-none truncate">
              {summary?.totalProduction ? summary.totalProduction.toLocaleString() : 0}
            </p>
            <div className="flex flex-col gap-1.5 mt-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-100">
                  Tyres: {summary?.tyreProduction ? summary.tyreProduction.toLocaleString() : 0}
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 bg-gray-50 text-gray-600 rounded border border-gray-200">
                  4-Die: {summary?.fourDieProduction ? summary.fourDieProduction.toLocaleString() : 0}
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 bg-gray-50 text-gray-600 rounded border border-gray-200">
                  6-Die: {summary?.sixDieProduction ? summary.sixDieProduction.toLocaleString() : 0}
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded border border-purple-100">
                  Molding: {summary?.moldingProduction ? summary.moldingProduction.toLocaleString() : 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Total Thakdar */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center flex-shrink-0">
            <HardHat size={22} className="text-white" />
          </div>
          <div>
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-0.5">Total Thakdar</p>
            <p className="text-gray-900 text-3xl font-extrabold leading-none">
              {totalThakdarCount}
            </p>
            <p className="text-gray-400 text-xs mt-1">Active labour contractors</p>
          </div>
        </div>

        {/* Total Foreman */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center flex-shrink-0">
            <UserCheck size={22} className="text-white" />
          </div>
          <div>
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-0.5">Total Foreman</p>
            <p className="text-gray-900 text-3xl font-extrabold leading-none">
              {totalForemanCount}
            </p>
            <p className="text-gray-400 text-xs mt-1">Registered foremen</p>
          </div>
        </div>

        {/* Total Labour */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center flex-shrink-0">
            <Users size={22} className="text-white" />
          </div>
          <div>
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-0.5">Total Labour</p>
            <p className="text-gray-900 text-3xl font-extrabold leading-none">
              {totalLabourCount}
            </p>
            <p className="text-gray-400 text-xs mt-1">Total workers enrolled</p>
          </div>
        </div>
      </div>

      {/* ── Bottom panels ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Recent Labours */}
        <div className="xl:col-span-2 bg-white border border-gray-200 shadow-sm rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900 font-semibold text-sm flex items-center gap-2">
              <Activity size={16} className="text-gray-500" />
              Recent Labours
            </h3>
            <span className="text-gray-600 text-xs">{labours.length} total</span>
          </div>
          {isLoading ? (
            <Loader />
          ) : labours.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-8">No labour records found</p>
          ) : (
            <div className="space-y-2">
              {labours.slice(0, 8).map((l, i) => (
                <div
                  key={l._id || i}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center text-xs font-bold border border-gray-200">
                    {l.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 text-sm font-medium truncate">
                      {l.name}
                      {l.labourType && l.labourType !== 'Simple' && (
                        <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">{l.labourType}</span>
                      )}
                    </p>
                    <p className="text-gray-500 text-xs truncate">
                      {l.role || 'Labour'} · {l.gender} · {l.assignedForeman?.name || l.assignedForeman || l.foreman?.name || l.foreman || 'Unassigned'}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">
                    Active
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-5">
          <h3 className="text-gray-900 font-semibold text-sm flex items-center gap-2 mb-4">
            <Clock size={16} className="text-gray-500" />
            Quick Stats
          </h3>
          <div className="space-y-4">
            {[
              { label: 'Male Labours', value: labours.filter((l) => l.gender === 'Male' && (!l.role || l.role.toLowerCase() === 'labour')).length },
              { label: 'Female Labours', value: labours.filter((l) => l.gender === 'Female' && (!l.role || l.role.toLowerCase() === 'labour')).length },
              { label: '4 Die Workers', value: labours.filter((l) => l.labourType === '4 Die').length },
              { label: '6 Die Workers', value: labours.filter((l) => l.labourType === '6 Die').length },
              { label: 'Molding Workers', value: labours.filter((l) => l.labourType === 'Molding').length },
              { label: 'Male Thakdars', value: labours.filter((l) => l.gender === 'Male' && l.role?.toLowerCase() === 'thakdar').length },
              { label: 'Female Thakdars', value: labours.filter((l) => l.gender === 'Female' && l.role?.toLowerCase() === 'thakdar').length },
              { label: 'Total Foremen', value: totalForemanCount },
              { label: 'Avg Production', value: summary?.avgProduction ? Math.round(summary.avgProduction).toLocaleString() : '—' },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                <span className="text-gray-500 text-sm">{stat.label}</span>
                <span className="text-gray-900 font-bold text-sm">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Shift History ── */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
          <div className="flex items-center gap-2">
            <CalendarDays size={16} className="text-gray-500" />
            <h3 className="text-gray-900 font-semibold text-sm">My Shift History</h3>
            {/* Presence badge */}
            {historyDate && (
              <span
                className={`ml-2 inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-semibold border ${wasPresent
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-red-50 text-red-600 border-red-200'
                  }`}
              >
                {wasPresent
                  ? <><CheckCircle2 size={11} /> Present</>
                  : <><XCircle size={11} /> Absent</>}
              </span>
            )}
          </div>

          {/* Date picker */}
          <div className="flex items-center gap-2">
            <label className="text-gray-500 text-xs font-medium">Select Date:</label>
            <input
              type="date"
              value={historyDate}
              max={todayISO()}
              onChange={handleDateChange}
              className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-black/10 bg-white cursor-pointer"
            />
          </div>
        </div>

        {/* Table */}
        {useShiftStore.getState().isLoading ? (
          <Loader />
        ) : shiftHistory.length === 0 ? (
          <div className="text-center py-10">
            <XCircle size={32} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm font-medium">No shifts recorded on this date</p>
            <p className="text-gray-400 text-xs mt-1">You were marked absent for {fmtDate(historyDate + 'T00:00:00')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-gray-500 font-semibold text-xs pb-3 pr-4">#</th>
                  <th className="text-left text-gray-500 font-semibold text-xs pb-3 pr-4">Shift Type</th>
                  <th className="text-left text-gray-500 font-semibold text-xs pb-3 pr-4">Date</th>
                  <th className="text-left text-gray-500 font-semibold text-xs pb-3 pr-4">Start Time</th>
                  <th className="text-left text-gray-500 font-semibold text-xs pb-3 pr-4">End Time</th>
                  <th className="text-left text-gray-500 font-semibold text-xs pb-3 pr-4">Duration</th>
                  <th className="text-left text-gray-500 font-semibold text-xs pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {shiftHistory.map((shift, idx) => (
                  <tr key={shift._id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 pr-4 text-gray-400 text-xs font-mono">{idx + 1}</td>
                    <td className="py-3 pr-4">
                      <span className="flex items-center gap-1.5 font-medium text-gray-800">
                        {shift.shiftType === 'Day'
                          ? <Sun size={13} className="text-yellow-500" />
                          : <Moon size={13} className="text-indigo-400" />}
                        {shift.shiftType}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-gray-600">{fmtDate(shift.date)}</td>
                    <td className="py-3 pr-4 text-gray-600 font-mono text-xs">{fmt(shift.startTime)}</td>
                    <td className="py-3 pr-4 text-gray-600 font-mono text-xs">{fmt(shift.endTime)}</td>
                    <td className="py-3 pr-4 text-gray-700 font-semibold text-xs">
                      {duration(shift.startTime, shift.endTime)}
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-semibold border ${shift.status === 'Active'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                          }`}
                      >
                        {shift.status === 'Active'
                          ? <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                          : <CheckCircle2 size={10} />}
                        {shift.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default Dashboard;