import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, FileText, Truck, ChevronRight, Activity, Users } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import useShiftStore from '../store/useShiftStore';

const Dashboard = () => {
  const { user } = useAuthStore();
  const { activeShift, fetchActiveShift, startShift, endShift, isLoading } = useShiftStore();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [shiftType, setShiftType] = useState('Day');

  useEffect(() => {
    fetchActiveShift();
  }, [fetchActiveShift]);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleStart = async () => {
    await startShift(shiftType);
  };

  const handleEnd = async () => {
    if (activeShift) {
      await endShift(activeShift._id);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6 pb-6 animate-fade-in max-w-md mx-auto">
      {/* Time and Shift Header */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
        <h2 className="text-gray-500 font-bold mb-1">Welcome, {user?.name || 'Foreman'}!</h2>
        <div className="text-5xl font-black text-gray-900 mb-2 tracking-tight">
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className="text-sm text-gray-500 font-medium mb-6">
          {currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>

        {/* Shift Management Section inline */}
        <div className="w-full">
          {isLoading && !activeShift ? (
            <div className="h-24 w-full bg-gray-100 animate-pulse rounded-2xl"></div>
          ) : activeShift ? (
            <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Active Shift</p>
                    <p className="text-lg font-black text-gray-900 leading-tight mt-0.5">{activeShift.shiftType}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                   <div className="flex items-center gap-1.5 px-2 py-1 bg-green-100 text-green-700 rounded-lg text-[10px] font-bold">
                     <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                     Live
                   </div>
                   <p className="text-xs text-gray-500 font-semibold mt-1">Started: {formatTime(activeShift.startTime || activeShift.date)}</p>
                </div>
              </div>
              <button 
                onClick={handleEnd}
                disabled={isLoading}
                className="w-full bg-red-500 hover:bg-red-600 active:scale-95 text-white font-black py-3 rounded-xl shadow-md shadow-red-500/20 transition-all disabled:opacity-50"
              >
                {isLoading ? 'Ending...' : 'End Shift'}
              </button>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <p className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">Start a New Shift</p>
              <div className="flex bg-gray-200 p-1 rounded-xl mb-3">
                <button
                  className={`flex-1 py-2.5 text-sm font-black rounded-lg transition-all ${shiftType === 'Day' ? 'bg-white shadow text-orange-500' : 'text-gray-500'}`}
                  onClick={() => setShiftType('Day')}
                >
                  ☀️ Day
                </button>
                <button
                  className={`flex-1 py-2.5 text-sm font-black rounded-lg transition-all ${shiftType === 'Night' ? 'bg-gray-900 shadow text-indigo-300' : 'text-gray-500'}`}
                  onClick={() => setShiftType('Night')}
                >
                  🌙 Night
                </button>
              </div>
              
              <button 
                onClick={handleStart}
                disabled={isLoading}
                className={`w-full font-black py-3.5 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 text-white ${shiftType === 'Day' ? 'bg-orange-500 shadow-orange-500/30' : 'bg-indigo-600 shadow-indigo-600/30'}`}
              >
                {isLoading ? 'Starting...' : `Start ${shiftType} Shift`}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Action Buttons */}
      <div className="grid grid-cols-1 gap-4">
        <Link to="/add-entry" className="active:scale-95 transition-transform bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-3xl p-6 flex items-center gap-4 shadow-lg shadow-emerald-500/30 border border-emerald-400/50">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 backdrop-blur-sm">
             <FileText className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1 text-left">
             <h3 className="text-2xl font-black mb-1">Add Entry</h3>
             <p className="text-emerald-100 text-sm font-medium">Mark team attendance</p>
          </div>
          <ChevronRight className="w-8 h-8 text-emerald-100" />
        </Link>

        <Link to="/thakdar" className="active:scale-95 transition-transform bg-gradient-to-br from-orange-400 to-red-500 text-white rounded-3xl p-6 flex items-center gap-4 shadow-lg shadow-orange-500/30 border border-orange-400/50">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 backdrop-blur-sm">
             <Truck className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1 text-left">
             <h3 className="text-2xl font-black mb-1">Dispatch</h3>
             <p className="text-orange-100 text-sm font-medium">Contractor work entry</p>
          </div>
          <ChevronRight className="w-8 h-8 text-orange-100" />
        </Link>

        <Link to="/team" className="active:scale-95 transition-transform bg-gradient-to-br from-violet-500 to-purple-600 text-white rounded-3xl p-6 flex items-center gap-4 shadow-lg shadow-violet-500/30 border border-violet-400/50">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 backdrop-blur-sm">
             <Users className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1 text-left">
             <h3 className="text-2xl font-black mb-1">My Team</h3>
             <p className="text-violet-100 text-sm font-medium">Add labour & thekedars</p>
          </div>
          <ChevronRight className="w-8 h-8 text-violet-100" />
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
