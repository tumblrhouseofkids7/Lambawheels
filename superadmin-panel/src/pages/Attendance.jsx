import React, { useState, useEffect } from 'react';
import {
  Calendar, Loader2, Users, CheckCircle, XCircle,
  Download, UserCheck, Briefcase, Wrench
} from 'lucide-react';
import api from '../utils/axios';
import toast from 'react-hot-toast';

const getDefaultDates = () => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 14); // last 15 days
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
};

const roleColor = (role) => {
  if (role === 'accountant') return 'bg-blue-100 text-blue-700';
  return 'bg-amber-100 text-amber-700';
};

const roleIcon = (role) => {
  if (role === 'accountant') return <Briefcase size={11} />;
  return <Wrench size={11} />;
};

const AttBar = ({ present, total }) => {
  const pct = total > 0 ? Math.round((present / total) * 100) : 0;
  const color = pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden min-w-[60px]">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-bold ${pct >= 80 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
        {pct}%
      </span>
    </div>
  );
};

const Attendance = () => {
  const defaults = getDefaultDates();
  const [startDate, setStartDate] = useState(defaults.start);
  const [endDate, setEndDate] = useState(defaults.end);
  const [staffAttendance, setStaffAttendance] = useState([]);
  const [labourAttendance, setLabourAttendance] = useState([]);
  const [totalDays, setTotalDays] = useState(15);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('staff');

  useEffect(() => {
    if (startDate && endDate) fetchAttendance();
  }, [startDate, endDate]);

  const fetchAttendance = async () => {
    if (startDate > endDate) {
      toast.error('Start date cannot be after end date');
      return;
    }
    try {
      setLoading(true);
      const { data } = await api.get(`/attendance?startDate=${startDate}&endDate=${endDate}`);
      setStaffAttendance(data.staffAttendance || []);
      setLabourAttendance(data.labourAttendance || []);
      setTotalDays(data.totalDays || 1);
    } catch (err) {
      toast.error('Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRange = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));
    setStartDate(start.toISOString().slice(0, 10));
    setEndDate(end.toISOString().slice(0, 10));
  };

  const handlePrint = () => window.print();

  // Summary
  const staffPresent = staffAttendance.reduce((s, u) => s + u.presentDays, 0);
  const labourPresent = labourAttendance.reduce((s, l) => s + l.presentDays, 0);
  const labourAbsent  = labourAttendance.reduce((s, l) => s + l.absentDays, 0);

  const staffByRole = {
    foreman:    staffAttendance.filter(s => s.role === 'foreman'),
    accountant: staffAttendance.filter(s => s.role === 'accountant'),
  };

  const dateLabel = `${new Date(startDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${new Date(endDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UserCheck className="text-purple-600" size={24} /> Attendance Register
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">View attendance records for staff and labour</p>
        </div>
        <button
          onClick={handlePrint}
          className="no-print bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-medium transition-colors shadow-sm"
        >
          <Download size={16} /> Download PDF
        </button>
      </div>

      {/* Date Range Filter */}
      <div className="no-print bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-500 uppercase">From Date</label>
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
              <Calendar size={15} className="text-gray-400" />
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="bg-transparent outline-none text-sm text-gray-800"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-500 uppercase">To Date</label>
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
              <Calendar size={15} className="text-gray-400" />
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="bg-transparent outline-none text-sm text-gray-800"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 ml-auto text-xs text-gray-500 font-medium">
            <span className="bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg border border-purple-100 font-bold">
              {totalDays} days · {dateLabel}
            </span>
          </div>
        </div>
        {/* Quick range buttons */}
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-gray-400 font-semibold self-center">Quick:</span>
          {[7, 15, 30].map(d => (
            <button key={d} onClick={() => handleQuickRange(d)}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:border-purple-400 hover:text-purple-600 font-semibold transition-colors bg-white">
              Last {d} days
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Staff', value: staffAttendance.length, sub: `${staffByRole.foreman.length} foremen · ${staffByRole.accountant.length} accountants`, color: 'purple' },
          { label: 'Staff Shifts Worked', value: staffPresent, sub: `across all ${totalDays} days`, color: 'emerald' },
          { label: 'Labour Present Days', value: labourPresent, sub: `total across all workers`, color: 'blue' },
          { label: 'Labour Absent Days', value: labourAbsent, sub: `total across all workers`, color: 'red' },
        ].map(c => (
          <div key={c.label} className={`bg-${c.color}-50 border border-${c.color}-100 rounded-2xl p-4`}>
            <div className={`text-3xl font-black text-${c.color}-600`}>{c.value}</div>
            <div className="text-xs font-bold text-gray-600 mt-1">{c.label}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">{c.sub}</div>
          </div>
        ))}
      </div>

      <div className="print-area">
        <div className="hidden print:block mb-6 text-center">
          <h2 className="text-2xl font-bold uppercase">Attendance Register</h2>
          <p className="text-gray-600">{dateLabel} · {totalDays} days</p>
        </div>

        {/* Tabs */}
        <div className="no-print flex gap-2 border-b border-gray-200 mb-5">
          {[
            { id: 'staff', label: 'Staff Attendance', icon: <Briefcase size={15}/> },
            { id: 'labour', label: 'Labour Attendance', icon: <Users size={15}/> },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === tab.id ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20 text-purple-600">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <>
            {/* ── STAFF TAB ── */}
            {activeTab === 'staff' && (
              <div className="space-y-6">
                {[
                  { role: 'foreman', label: 'Foremen / Thakdars', icon: <Wrench size={16} className="text-amber-600"/> },
                  { role: 'accountant', label: 'Accountants', icon: <Briefcase size={16} className="text-blue-600"/> },
                ].map(({ role, label, icon }) => {
                  const group = staffByRole[role];
                  if (!group.length) return null;
                  return (
                    <div key={role} className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                      <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                        {icon}
                        <span className="font-bold text-gray-800 text-sm">{label}</span>
                        <span className="ml-auto text-xs text-gray-500">{group.length} members</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                              <th className="p-3 text-left font-bold">Name</th>
                              <th className="p-3 text-left font-bold">Role</th>
                              <th className="p-3 text-center font-bold">Present Days</th>
                              <th className="p-3 text-center font-bold">Absent Days</th>
                              <th className="p-3 text-center font-bold">Total Days</th>
                              <th className="p-3 font-bold min-w-[140px]">Attendance %</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {group.map(s => (
                              <tr key={s._id} className="hover:bg-gray-50 transition">
                                <td className="p-3 font-semibold text-gray-900">{s.name}</td>
                                <td className="p-3">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${roleColor(s.role)}`}>
                                    {roleIcon(s.role)} {s.role}
                                  </span>
                                </td>
                                <td className="p-3 text-center">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                    <CheckCircle size={11}/> {s.presentDays}
                                  </span>
                                </td>
                                <td className="p-3 text-center">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-600">
                                    <XCircle size={11}/> {s.absentDays}
                                  </span>
                                </td>
                                <td className="p-3 text-center font-semibold text-gray-700">{s.totalDays}</td>
                                <td className="p-3"><AttBar present={s.presentDays} total={s.totalDays} /></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── LABOUR TAB ── */}
            {activeTab === 'labour' && (
              <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                {labourAttendance.length === 0 ? (
                  <div className="text-center py-16 text-gray-400 flex flex-col items-center">
                    <Users size={40} className="text-gray-200 mb-3" />
                    <p>No labour entries found for this date range.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                          <th className="p-3 text-left font-bold">Worker</th>
                          <th className="p-3 text-left font-bold">Foreman</th>
                          <th className="p-3 text-center font-bold">Present</th>
                          <th className="p-3 text-center font-bold">Absent</th>
                          <th className="p-3 text-center font-bold">Total Days</th>
                          <th className="p-3 font-bold min-w-[140px]">Attendance %</th>
                          <th className="p-3 text-right font-bold">Net Prod</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {labourAttendance.map(l => (
                          <tr key={l._id} className="hover:bg-gray-50 transition">
                            <td className="p-3">
                              <div className="font-semibold text-gray-900">{l.name}</div>
                              <div className="text-[10px] text-gray-400">{l.gender} · {l.role}</div>
                            </td>
                            <td className="p-3 text-xs font-medium text-gray-600">{l.foreman}</td>
                            <td className="p-3 text-center">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                <CheckCircle size={11}/> {l.presentDays}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-600">
                                <XCircle size={11}/> {l.absentDays}
                              </span>
                            </td>
                            <td className="p-3 text-center font-semibold text-gray-700">{l.totalDays}</td>
                            <td className="p-3"><AttBar present={l.presentDays} total={l.totalDays} /></td>
                            <td className="p-3 text-right font-black text-green-600">{l.netProduction.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50 border-t border-gray-200">
                        <tr>
                          <td colSpan="6" className="p-3 text-right text-xs font-bold text-gray-500 uppercase">Grand Total Net Production</td>
                          <td className="p-3 text-right font-black text-green-700 text-base">
                            {labourAttendance.reduce((s, l) => s + (l.netProduction || 0), 0).toLocaleString()}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Attendance;
