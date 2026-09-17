import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useLabourStore from '../store/useLabourStore';
import useProductionStore from '../store/useProductionStore';
import useShiftStore from '../store/useShiftStore';
import ConfirmModal from '../components/ConfirmModal';
import toast from 'react-hot-toast';

const AddEntry = () => {
  const navigate = useNavigate();
  const { labours, fetchLabours, addLabour, updateLabour, deleteLabour, isLoading: isLabourLoading } = useLabourStore();
  const { productions, fetchProductions } = useProductionStore();
  const { activeShift, fetchActiveShift, selectedDate } = useShiftStore();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [newLabourName, setNewLabourName] = useState('');
  const [newLabourGender, setNewLabourGender] = useState('Male');

  const [editingLabour, setEditingLabour] = useState(null);
  const [editLabourName, setEditLabourName] = useState('');
  const [editLabourGender, setEditLabourGender] = useState('Male');

  const [filterType, setFilterType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
    confirmText: 'Confirm',
    type: 'danger'
  });
  const closeConfirmModal = () => setConfirmModal(prev => ({ ...prev, isOpen: false }));

  // Fetch data on mount and when selectedDate changes
  useEffect(() => {
    fetchLabours();
    fetchActiveShift();
    fetchProductions(selectedDate);
  }, [fetchLabours, fetchProductions, fetchActiveShift, selectedDate]);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAddLabour = async (e) => {
    e.preventDefault();
    if (!newLabourName.trim()) return;
    try {
      await addLabour({ name: newLabourName, gender: newLabourGender, role: 'Labour' });
      setNewLabourName('');
      setNewLabourGender('Male');
    } catch (error) {
      console.error('Failed to add labour:', error);
    }
  };

  const handleEditLabourSubmit = async (e) => {
    e.preventDefault();
    if (!editLabourName.trim()) return;
    try {
      await updateLabour(editingLabour._id, { name: editLabourName, gender: editLabourGender });
      setEditingLabour(null);
    } catch (error) {
      console.error('Failed to update labour:', error);
    }
  };

  const handleDeleteLabour = async (id, e) => {
    e.stopPropagation();
    setConfirmModal({
      isOpen: true,
      title: 'Delete Worker',
      message: 'Are you sure you want to delete this worker?',
      confirmText: 'Delete',
      type: 'danger',
      onConfirm: async () => {
        try {
          await deleteLabour(id);
        } catch (error) {
          console.error('Failed to delete labour:', error);
        }
      }
    });
  };

  const openFormForLabour = (labour) => {
    if (!activeShift) {
      toast.error('Please start a shift before adding entries.');
      return;
    }
    // Navigate to the full-page worker entry form
    navigate(`/add-entry/${labour._id}`);
  };

  return (
    <div className="space-y-4 md:space-y-8 animate-fade-in pb-8 max-w-7xl mx-auto">
      {/* Dashboard Header: Live Date & Time & Active Shift */}
      <div className="bg-white p-5 md:p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center relative overflow-hidden mb-6">
        {activeShift && (
          <div className={`absolute top-0 left-0 w-full p-1.5 md:p-2 text-center text-[10px] md:text-sm font-bold text-white tracking-widest uppercase ${activeShift.status === 'Completed' ? 'bg-gray-600' : activeShift.shiftType === 'Day' ? 'bg-orange-500' : 'bg-indigo-600'}`}>
            {activeShift.status === 'Completed' ? 'Completed' : 'Active'} {activeShift.shiftType} Shift
          </div>
        )}
        <div className="mt-4 md:mt-6 flex flex-col items-center">
          <span className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Working Date</span>
          <span className="text-2xl md:text-4xl font-black text-gray-800 tracking-tight">
            {selectedDate}
          </span>
          <span className="text-sm md:text-base font-medium text-gray-500 mt-2">
            Select workers below to view/edit their data for this date
          </span>
        </div>
      </div>

      {!activeShift && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 md:p-5 rounded-xl text-yellow-800 font-medium text-sm md:text-base text-center">
          Please go to the Shift tab and start a shift before adding entries.
        </div>
      )}



      {/* Workers Grid */}
      <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-4 md:mb-6 gap-4">
          <h3 className="text-lg md:text-xl font-bold text-gray-800 shrink-0">Tap Worker to Add Entry</h3>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
            {/* Search Bar */}
            <div className="relative w-full sm:w-48 md:w-56">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
              <input
                type="text"
                placeholder="Search worker..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 sm:py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-gray-50/50 transition-all"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {['All', 'Simple', '4 Die', '6 Die', 'Molding'].map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-2 sm:py-1.5 text-sm font-bold rounded-lg transition-all ${filterType === type ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {labours.filter(l => {
            if (l.role && l.role.toLowerCase() !== 'labour') return false;
            
            // Search filter
            if (searchQuery && !l.name.toLowerCase().includes(searchQuery.toLowerCase())) {
              return false;
            }

            if (filterType === 'All') return true;
            if (filterType === 'Simple') return !l.labourType || l.labourType === 'Simple' || l.labourType === null;
            return l.labourType === filterType;
          }).map(labour => {
            const hasEntry = productions.some(p => p.labour && p.labour._id === labour._id && p.shiftType === activeShift?.shiftType);

            return (
              <div
                key={labour._id}
                className={`p-4 md:p-5 rounded-2xl border flex items-center gap-4 transition-all cursor-pointer active:scale-[0.97] ${hasEntry ? 'bg-green-50/50 border-green-200 hover:bg-green-50' : 'bg-gray-50/50 border-gray-200 hover:bg-gray-50'}`}
                onClick={() => openFormForLabour(labour)}
              >
                {/* Worker Avatar */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-black shrink-0 ${hasEntry ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                  {labour.name.charAt(0).toUpperCase()}
                </div>

                {/* Worker Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-gray-800 text-base leading-tight truncate">
                      {labour.name}
                    </span>
                    {labour.labourType && labour.labourType !== 'Simple' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold border bg-blue-50 text-blue-600 border-blue-200 shrink-0">
                        {labour.labourType}
                      </span>
                    )}
                  </div>
                  {hasEntry && (
                    <div className="flex items-center justify-between mt-1.5 pr-1">
                      <div className="flex items-center gap-1 text-green-600 text-xs font-bold">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        Entry Done
                      </div>
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        Edit
                      </span>
                    </div>
                  )}
                </div>

                {/* Arrow */}
                <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
              </div>
            )
          })}
          {labours.length === 0 && !isLabourLoading && (
            <div className="col-span-full text-center py-12 text-gray-500 text-sm md:text-base bg-gray-50 rounded-xl border border-dashed border-gray-200">
              No workers found. Add your first worker above.
            </div>
          )}
        </div>
      </div>

      {/* Edit Labour Modal */}
      {editingLabour && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full md:max-w-md rounded-t-[1.5rem] md:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85dvh] transform transition-transform">
            <div className="p-5 md:p-6 border-b border-gray-100 flex justify-between items-center bg-white relative">
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-200 rounded-full md:hidden"></div>
              <h3 className="text-lg md:text-xl font-black text-gray-800 mt-2 md:mt-0">Edit Worker</h3>
              <button onClick={() => setEditingLabour(null)} className="text-gray-500 hover:text-red-600 w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-red-50 rounded-full transition-colors mt-2 md:mt-0 shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="p-5 md:p-6">
              <form id="edit-labour-form" onSubmit={handleEditLabourSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Worker Name</label>
                  <input
                    type="text"
                    value={editLabourName}
                    onChange={(e) => setEditLabourName(e.target.value)}
                    className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-base min-h-[48px]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Gender</label>
                  <select
                    value={editLabourGender}
                    onChange={(e) => setEditLabourGender(e.target.value)}
                    className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-base min-h-[48px] cursor-pointer"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </form>
            </div>

            <div className="p-4 md:p-6 border-t border-gray-200 bg-gray-50 flex gap-3 md:gap-4 shrink-0 pb-safe pb-8 md:pb-6">
              <button
                type="button"
                onClick={() => setEditingLabour(null)}
                className="flex-1 px-4 py-3.5 bg-white border-2 border-gray-200 text-gray-700 font-bold rounded-xl shadow-sm hover:bg-gray-50 hover:border-gray-300 active:bg-gray-100 active:scale-[0.98] transition-all text-base whitespace-nowrap flex items-center justify-center min-h-[52px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="edit-labour-form"
                disabled={isLabourLoading}
                className="flex-1 px-4 py-3.5 bg-blue-600 border-2 border-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700 hover:border-blue-700 hover:shadow-lg active:bg-blue-800 active:scale-[0.98] transition-all disabled:opacity-50 text-base whitespace-nowrap flex items-center justify-center min-h-[52px]"
              >
                {isLabourLoading ? 'Saving...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Confirm Modal ── */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirmModal}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        type={confirmModal.type}
      />
    </div>
  );
};

export default AddEntry;