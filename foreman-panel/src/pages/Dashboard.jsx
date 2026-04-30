import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, User, FileText, ChevronRight, Activity, Users } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import useShiftStore from '../store/useShiftStore';
import useLabourStore from '../store/useLabourStore';
import useDispatchStore from '../store/useDispatchStore';

const todayStr = () => new Date().toISOString().slice(0, 10);

const Dashboard = () => {
  const { user } = useAuthStore();
  const { activeShift, fetchActiveShift, isLoading } = useShiftStore();
  const { labours, fetchLabours } = useLabourStore();
  const { dispatches, fetchDispatches } = useDispatchStore();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchActiveShift();
    fetchLabours();
  }, [fetchActiveShift, fetchLabours]);

  useEffect(() => {
    const date = activeShift ? activeShift.date.split('T')[0] : todayStr();
    const shift = activeShift ? activeShift.shiftType : 'Day';
    fetchDispatches({ date, shift });
  }, [activeShift, fetchDispatches]);

  const totalLabours = labours.filter(l => !l.role || l.role.toLowerCase() === 'labour').length;
  const totalThakdars = labours.filter(l => l.role && l.role.toLowerCase() === 'thakdar').length;
  const totalCompletedWork = dispatches.reduce((s, d) => s + (d.dispatchedQty || 0), 0);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 md:p-8 rounded-3xl shadow-lg border border-blue-500/30 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Activity className="w-48 h-48" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-black mb-2">Welcome back, {user?.name}! 👋</h2>
            <p className="text-blue-100 text-sm md:text-base font-medium">Manage your team's attendance and track production effortlessly.</p>
          </div>
          <div className="flex flex-col items-start md:items-end bg-white/10 px-5 py-3 rounded-2xl backdrop-blur-sm border border-white/20">
             <span className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-1">Current Time</span>
             <span className="text-2xl md:text-3xl font-black tracking-tight">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
             <span className="text-xs font-medium text-blue-100">{currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Current Shift Status */}
        <div className="md:col-span-1 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black uppercase text-gray-500 tracking-wider">Current Shift</h3>
            </div>
            
            {isLoading ? (
              <div className="animate-pulse flex flex-col gap-2">
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-100 rounded w-3/4"></div>
              </div>
            ) : activeShift ? (
              <div className="mt-2">
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-black text-gray-800">{activeShift.shiftType}</p>
                  <span className="text-sm font-bold text-gray-500 uppercase">Shift</span>
                </div>
                <p className="text-xs font-semibold text-green-600 mt-2 flex items-center gap-1.5 bg-green-50 w-fit px-2.5 py-1 rounded-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  Started: {new Date(activeShift.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ) : (
              <div className="mt-2">
                <p className="text-lg font-bold text-gray-800">No active shift</p>
                <p className="text-sm text-gray-500 mt-1">Please start a shift to begin.</p>
              </div>
            )}
          </div>
          
          <Link to="/shift" className="mt-6 flex items-center justify-between w-full py-3 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-xl transition-colors text-sm border border-gray-200">
            Manage Shifts
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Team Stats */}
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <User className="w-4 h-4" />
              </div>
              <h3 className="text-[11px] font-black uppercase text-gray-500 tracking-wider">Total Labour</h3>
            </div>
            <p className="text-3xl font-black text-gray-800">{totalLabours}</p>
          </div>

          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                <User className="w-4 h-4" />
              </div>
              <h3 className="text-[11px] font-black uppercase text-gray-500 tracking-wider">Total Thakdar</h3>
            </div>
            <p className="text-3xl font-black text-gray-800">{totalThakdars}</p>
          </div>

          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-green-50 text-green-600 rounded-xl">
                <Users className="w-4 h-4" />
              </div>
              <h3 className="text-[11px] font-black uppercase text-gray-500 tracking-wider">Total Team</h3>
            </div>
            <p className="text-3xl font-black text-gray-800">{labours.length}</p>
          </div>

          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
                <Activity className="w-4 h-4" />
              </div>
              <h3 className="text-[11px] font-black uppercase text-gray-500 tracking-wider">Thakdar Work</h3>
            </div>
            <p className="text-3xl font-black text-gray-800">{totalCompletedWork}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Add Attendance Card */}
          <Link to="/add-entry" className="group relative bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden text-white flex flex-col justify-between min-h-[200px]">
             <div className="absolute top-0 right-0 p-6 opacity-20 transform group-hover:scale-110 transition-transform duration-500">
               <FileText className="w-32 h-32" />
             </div>
             <div className="relative z-10">
               <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm mb-4">
                 <FileText className="w-6 h-6 text-white" />
               </div>
               <h3 className="text-2xl font-black mb-1">Add Attendance</h3>
               <p className="text-emerald-50 text-sm font-medium">Mark attendance & add production entries</p>
             </div>
             <div className="relative z-10 flex items-center gap-2 text-sm font-bold mt-4">
               <span>Open Portal</span>
               <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
             </div>
          </Link>

          {/* Profile Card */}
          <Link to="/profile" className="group relative bg-gradient-to-br from-violet-500 to-purple-600 p-6 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden text-white flex flex-col justify-between min-h-[200px]">
             <div className="absolute top-0 right-0 p-6 opacity-20 transform group-hover:scale-110 transition-transform duration-500">
               <User className="w-32 h-32" />
             </div>
             <div className="relative z-10">
               <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm mb-4">
                 <User className="w-6 h-6 text-white" />
               </div>
               <h3 className="text-2xl font-black mb-1">My Profile</h3>
               <p className="text-violet-50 text-sm font-medium">View your account details & settings</p>
             </div>
             <div className="relative z-10 flex items-center gap-2 text-sm font-bold mt-4">
               <span>View Details</span>
               <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
             </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
