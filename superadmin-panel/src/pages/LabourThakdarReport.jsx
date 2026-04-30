import React, { useEffect, useState } from 'react';
import { Search, Users } from 'lucide-react';
import useLabourStore from '../store/useLabourStore';

const LabourThakdarReport = () => {
  const { labours, isLoading, fetchLabours } = useLabourStore();
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLabours();
  }, []);

  const filtered = labours.filter((l) =>
    l.name?.toLowerCase().includes(search.toLowerCase()) ||
    (l.role || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.assignedForeman?.name || l.assignedForeman || l.foreman || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="text-purple-600" />
            Labour & Thakdar Report
          </h1>
          <p className="text-gray-500 mt-1">View all labour and thakdar entries created by foremen.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Search by name, role or foreman..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-500"
            />
          </div>
          <div className="text-sm text-gray-500 font-semibold">
            Total Records: {filtered.length}
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-100">
                <th className="p-4 font-semibold">Name</th>
                <th className="p-4 font-semibold">Gender</th>
                <th className="p-4 font-semibold">Role</th>
                <th className="p-4 font-semibold">Added By / Foreman</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-gray-500">Loading entries...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-gray-500">No labour or thakdar found.</td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 font-medium text-gray-900">{row.name}</td>
                    <td className="p-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                        row.gender === 'Male' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                        row.gender === 'Female' ? 'bg-pink-50 text-pink-700 border-pink-200' : 
                        'bg-gray-50 text-gray-700 border-gray-200'
                      }`}>
                        {row.gender || 'Unknown'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                          row.role === 'Thakdar' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-orange-50 text-orange-700 border-orange-200'
                        }`}>
                          {row.role || 'Labour'}
                        </span>
                        {row.role === 'Labour' && row.labourType && (
                          <span className="text-xs px-2.5 py-1 rounded-full font-bold border bg-emerald-50 text-emerald-700 border-emerald-200">
                            {row.labourType}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 font-medium text-gray-700">
                      {row.assignedForeman?.name || row.assignedForeman || row.foreman?.name || row.foreman || <span className="text-gray-400">—</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LabourThakdarReport;
