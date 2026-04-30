import React, { useState, useEffect } from 'react';
import useShiftStore from '../store/useShiftStore';

const StartShift = () => {
  const { startShift, activeShift, endShift, isLoading, fetchActiveShift, shiftHistory, fetchShiftHistory } = useShiftStore();
  const [shiftType, setShiftType] = useState('Day');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Fetch active shift on mount
  useEffect(() => {
    fetchActiveShift();
  }, [fetchActiveShift]);

  // Live clock timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch history for today
  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    fetchShiftHistory(dateString);
  }, [fetchShiftHistory, activeShift]); // Refetch when active shift changes

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

  const calculateDuration = (start, end) => {
    if (!start || !end) return 'N/A';
    const startTime = new Date(start);
    const endTime = new Date(end);
    const diffMs = endTime - startTime;
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHrs}h ${diffMins}m`;
  };

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Start/End Shift Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
        <h2 className="text-2xl font-black text-gray-800">Shift Management</h2>
        
        {activeShift ? (
          <div className="mt-6 space-y-4">
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-blue-800 font-bold">Currently on {activeShift.shiftType} Shift</p>
              <div className="flex justify-center items-center gap-2 mt-2">
                 <span className="text-xs font-semibold bg-white px-2 py-1 rounded text-blue-600 shadow-sm">
                   Start: {formatTime(activeShift.startTime || activeShift.date)}
                 </span>
              </div>
            </div>
            <button 
              onClick={handleEnd}
              disabled={isLoading}
              className="w-full bg-red-600 text-white font-bold py-3 px-4 rounded-xl shadow-md hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Ending...' : 'End Shift'}
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${shiftType === 'Day' ? 'bg-white shadow text-black' : 'text-gray-500'}`}
                onClick={() => setShiftType('Day')}
              >
                Day
              </button>
              <button
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${shiftType === 'Night' ? 'bg-black shadow text-white' : 'text-gray-500'}`}
                onClick={() => setShiftType('Night')}
              >
                Night
              </button>
            </div>
            
            <button 
              onClick={handleStart}
              disabled={isLoading}
              className="w-full bg-black text-white font-bold py-3 px-4 rounded-xl shadow-md hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Starting...' : 'Start Shift'}
            </button>
          </div>
        )}
      </div>

      {/* History and Live Time Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Today's Shifts</h3>
        
        {/* Live Date & Time Display */}
        <div className="mb-6 flex flex-col items-center justify-center p-6 bg-gray-50 rounded-2xl border border-gray-100 shadow-inner">
            <span className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Current Time</span>
            <span className="text-3xl font-black text-gray-800 tracking-tight">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <span className="text-sm font-medium text-gray-500 mt-2">
                {currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
        </div>

        <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
                <span className="font-semibold text-gray-700">Shift History</span>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded-full font-medium">{shiftHistory?.length || 0} Shifts Today</span>
            </div>

            {isLoading && !activeShift ? (
                <div className="text-center py-4 text-gray-500 text-sm">Loading history...</div>
            ) : shiftHistory && shiftHistory.length > 0 ? (
                <div className="space-y-3">
                    {shiftHistory.map((shift) => (
                        <div key={shift._id} className="p-4 border border-gray-100 rounded-xl bg-gray-50 flex flex-col gap-2 relative overflow-hidden">
                            <div className="flex justify-between items-center">
                                <span className={`font-bold text-sm ${shift.shiftType === 'Day' ? 'text-orange-500' : 'text-indigo-600'}`}>
                                    {shift.shiftType} Shift
                                </span>
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${shift.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>
                                    {shift.status}
                                </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 text-sm mt-1">
                                <div>
                                    <span className="text-xs text-gray-500 block">Start</span>
                                    <span className="font-medium">{formatTime(shift.startTime || shift.date)}</span>
                                </div>
                                <div>
                                    <span className="text-xs text-gray-500 block">End</span>
                                    <span className="font-medium">{shift.endTime ? formatTime(shift.endTime) : '--:--'}</span>
                                </div>
                            </div>
                            
                            {shift.status === 'Completed' && shift.endTime && (
                                <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-600 flex justify-between">
                                    <span>Duration:</span>
                                    <span className="font-semibold">{calculateDuration(shift.startTime || shift.date, shift.endTime)}</span>
                                </div>
                            )}
                            
                            {/* Accent line */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${shift.shiftType === 'Day' ? 'bg-orange-500' : 'bg-indigo-600'}`}></div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <p className="text-gray-500 text-sm">No shifts recorded for today.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default StartShift;