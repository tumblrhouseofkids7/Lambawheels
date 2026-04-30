import React, { useState, useEffect } from 'react';
import useAdvanceStore from '../store/useAdvanceStore';
import useLabourStore from '../store/useLabourStore';
import { IndianRupee, Calendar, Search, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AdvanceLedger() {
  const { advances, fetchAdvances, addAdvance, deleteAdvance, isLoading } = useAdvanceStore();
  const { labours, fetchLabours } = useLabourStore();

  const [formData, setFormData] = useState({
    labour: '',
    amount: '',
    advanceType: 'Current',
    dateGiven: new Date().toISOString().split('T')[0],
    note: ''
  });

  const [filter, setFilter] = useState({
    labourId: '',
    status: 'All'
  });

  useEffect(() => {
    fetchLabours();
  }, [fetchLabours]);

  useEffect(() => {
    const params = {};
    if (filter.labourId) params.labourId = filter.labourId;
    if (filter.status === 'Done') params.isDeducted = true;
    if (filter.status === 'Pending') params.isDeducted = false;
    
    fetchAdvances(params);
  }, [filter, fetchAdvances]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.labour || !formData.amount || !formData.dateGiven) return;
    
    const success = await addAdvance({
      ...formData,
      amount: Number(formData.amount)
    });

    if (success) {
      setFormData({
        labour: '',
        amount: '',
        advanceType: 'Current',
        dateGiven: new Date().toISOString().split('T')[0],
        note: ''
      });
    }
  };

  const activeLabours = labours.filter(l => l.role === 'Labour');

  return (
    <div className="space-y-8 fade-in pb-10 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-gray-900 font-black text-2xl tracking-tight flex items-center gap-2">
            <IndianRupee className="text-blue-600" size={28} />
            Advance Ledger
          </h2>
          <p className="text-gray-500 font-medium mt-1">Manage and track worker advances</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Advance Form */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Plus size={20} className="text-blue-600" /> Give Advance
          </h3>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Worker</label>
              <select
                value={formData.labour}
                onChange={(e) => setFormData({ ...formData, labour: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-gray-800"
                required
              >
                <option value="">Select Worker...</option>
                {activeLabours.map(labour => (
                  <option key={labour._id} value={labour._id}>
                    {labour.name} {labour.labourType && labour.labourType !== 'Simple' ? `(${labour.labourType})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Amount (₹)</label>
              <input
                type="number"
                min="1"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-black text-blue-700 text-lg placeholder-gray-400"
                placeholder="0"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Advance Type</label>
              <select
                value={formData.advanceType}
                onChange={(e) => setFormData({ ...formData, advanceType: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-gray-800"
                required
              >
                <option value="Current">Current Advance (CURR ADV)</option>
                <option value="Previous">Previous Advance (PREV ADV)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Date Given</label>
              <input
                type="date"
                value={formData.dateGiven}
                onChange={(e) => setFormData({ ...formData, dateGiven: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-gray-800"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Note (Optional)</label>
              <input
                type="text"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-gray-800"
                placeholder="e.g. Medical emergency"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Add Advance'}
            </button>
          </form>
        </div>

        {/* Advance History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="flex-1 w-full relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <select
                value={filter.labourId}
                onChange={(e) => setFilter({ ...filter, labourId: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 text-sm font-medium text-gray-700 appearance-none"
              >
                <option value="">Filter by Worker: All</option>
                {activeLabours.map(labour => (
                  <option key={labour._id} value={labour._id}>{labour.name}</option>
                ))}
              </select>
            </div>
            <div className="flex bg-gray-100 p-1 rounded-xl shrink-0">
              {['All', 'Pending', 'Done'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilter({ ...filter, status })}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter.status === status ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden relative">
            {isLoading && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex justify-center items-center z-10">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wider font-bold">
                    <th className="p-4">Date</th>
                    <th className="p-4">Worker</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Note</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {advances.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-gray-500 font-medium">
                        No advance records found.
                      </td>
                    </tr>
                  ) : (
                    advances.map(adv => (
                      <tr key={adv._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Calendar size={14} className="text-gray-400" />
                            {new Date(adv.dateGiven).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm font-bold text-gray-900">{adv.labour?.name || 'Unknown'}</div>
                        </td>
                        <td className="p-4">
                          <span className={`text-xs font-bold px-2 py-1 rounded-lg ${adv.advanceType === 'Previous' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            {adv.advanceType === 'Previous' ? 'PREV ADV' : 'CURR ADV'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm font-black text-red-600 bg-red-50 px-2.5 py-1 rounded-lg">
                            ₹{adv.amount.toLocaleString()}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-gray-500 max-w-[150px] truncate block" title={adv.note}>
                            {adv.note || '—'}
                          </span>
                        </td>
                        <td className="p-4">
                          {adv.isDeducted ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200 whitespace-nowrap">
                              <CheckCircle2 size={12} /> Done
                              {adv.deductedInSalaryId?.endDate && ` (${new Date(adv.deductedInSalaryId.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })})`}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                              <AlertCircle size={12} /> Pending
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this advance?')) {
                                deleteAdvance(adv._id);
                              }
                            }}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-flex"
                            title="Delete Advance"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
