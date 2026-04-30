import React from 'react';
import { Calendar } from 'lucide-react';

const Filters = ({ filters, onChange, showForeman = false }) => {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Start Date */}
      <div className="flex flex-col gap-1">
        <label className="text-gray-600 text-[10px] font-bold uppercase tracking-wider px-1">From</label>
        <div className="flex items-center gap-2 bg-[#1a1d2b] border border-white/10 rounded-xl px-3 py-2">
          <Calendar size={14} className="text-gray-500" />
          <input
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => onChange({ startDate: e.target.value })}
            className="bg-transparent text-gray-300 text-sm outline-none w-36"
          />
        </div>
      </div>

      <span className="text-gray-600 font-bold text-lg mt-4">→</span>

      {/* End Date */}
      <div className="flex flex-col gap-1">
        <label className="text-gray-600 text-[10px] font-bold uppercase tracking-wider px-1">To</label>
        <div className="flex items-center gap-2 bg-[#1a1d2b] border border-white/10 rounded-xl px-3 py-2">
          <Calendar size={14} className="text-gray-500" />
          <input
            type="date"
            value={filters.endDate || ''}
            onChange={(e) => onChange({ endDate: e.target.value })}
            className="bg-transparent text-gray-300 text-sm outline-none w-36"
          />
        </div>
      </div>

      {/* Clear */}
      {(filters.startDate || filters.endDate) && (
        <button
          onClick={() => onChange({ startDate: '', endDate: '', foreman: '' })}
          className="text-xs text-gray-500 hover:text-red-400 transition-colors px-2 py-1 mt-4"
        >
          Clear dates
        </button>
      )}
    </div>
  );
};

export default Filters;
