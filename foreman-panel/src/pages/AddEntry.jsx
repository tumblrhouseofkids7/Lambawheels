import React, { useState, useEffect } from 'react';
import useLabourStore from '../store/useLabourStore';
import useProductionStore from '../store/useProductionStore';
import useShiftStore from '../store/useShiftStore';
import ConfirmModal from '../components/ConfirmModal';
import toast from 'react-hot-toast';

const AddEntry = () => {
  const { labours, fetchLabours, addLabour, updateLabour, deleteLabour, isLoading: isLabourLoading } = useLabourStore();
  const { productions, fetchProductions, addProduction, updateProduction, isLoading: isProductionLoading } = useProductionStore();
  const { activeShift, fetchActiveShift } = useShiftStore();
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [newLabourName, setNewLabourName] = useState('');
  const [newLabourGender, setNewLabourGender] = useState('Male');
  
  const [editingLabour, setEditingLabour] = useState(null);
  const [editLabourName, setEditLabourName] = useState('');
  const [editLabourGender, setEditLabourGender] = useState('Male');
  
  const [selectedLabour, setSelectedLabour] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [existingProductionId, setExistingProductionId] = useState(null);
  const [filterType, setFilterType] = useState('All');

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: 'Confirm',
    type: 'danger'
  });
  const closeConfirmModal = () => setConfirmModal(prev => ({ ...prev, isOpen: false }));

  // Form State
  const [formData, setFormData] = useState({
    shiftType: 'Day',
    attendance: 'Present',
    inTime: '',
    outTime: '',
    targetProduction: '',
    totalProduction: '',
    totalReject: '',
    reject2: '',
    reject3: '',
    bonusRate: 0.05,
    overtimeHours: '',
  });

  const [selectedRejects, setSelectedRejects] = useState([]);

  const toggleReject = (type) => {
    setSelectedRejects(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
    if (selectedRejects.includes(type)) {
      setFormData(prev => ({ ...prev, [`reject${type}`]: '' }));
    }
  };

  // Fetch data on mount
  useEffect(() => {
    fetchLabours();
    fetchActiveShift();
    
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    fetchProductions(dateString);
  }, [fetchLabours, fetchProductions, fetchActiveShift]);

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
    setSelectedLabour(labour);
    
    let defaultTarget = '';
    if (labour.labourType === '4 Die') defaultTarget = 120;
    if (labour.labourType === '6 Die') defaultTarget = 168;

    const defaultInTime = activeShift?.shiftType === 'Night' ? '20:00' : '08:00';
    const defaultOutTime = activeShift?.shiftType === 'Night' ? '08:00' : '20:00';

    const existing = productions.find(p => p.labour && p.labour._id === labour._id && p.shiftType === activeShift?.shiftType);
    
    if (existing) {
      setExistingProductionId(existing._id);
      setFormData({
        shiftType: existing.shiftType || activeShift?.shiftType || 'Day',
        attendance: existing.attendance || 'Present',
        inTime: existing.inTime || defaultInTime,
        outTime: existing.outTime || defaultOutTime,
        targetProduction: existing.targetProduction !== undefined && existing.targetProduction !== null && existing.targetProduction !== '' ? existing.targetProduction : defaultTarget,
        totalProduction: existing.totalProduction || '',
        totalReject: existing.totalReject || existing.reject1 || '',
        reject2: existing.reject2 || '',
        reject3: existing.reject3 || '',
        bonusRate: existing.bonusRate || 0.05,
        overtimeHours: existing.overtimeHours || '',
      });
      
      const activeRejects = [];
      if (existing.reject2) activeRejects.push('2');
      if (existing.reject3) activeRejects.push('3');
      setSelectedRejects(activeRejects);
    } else {
      setExistingProductionId(null);
      setFormData({
        shiftType: activeShift?.shiftType || 'Day',
        attendance: 'Present',
        inTime: defaultInTime,
        outTime: defaultOutTime,
        targetProduction: defaultTarget,
        totalProduction: '',
        totalReject: '',
        reject2: '',
        reject3: '',
        bonusRate: 0.05,
        overtimeHours: '',
      });
      setSelectedRejects([]);
    }
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        labour: selectedLabour._id,
        ...formData
      };

      if (existingProductionId) {
        await updateProduction(existingProductionId, payload);
      } else {
        await addProduction(payload);
      }
      setIsModalOpen(false);
      
      const today = new Date();
      const dateString = today.toISOString().split('T')[0];
      fetchProductions(dateString);
    } catch (error) {
      console.error('Failed to save production:', error);
    }
  };

  const calculateNetProduction = () => {
    // reject2 and reject3 are sub-categories of totalReject, not additional
    return (Number(formData.totalProduction) || 0) - (Number(formData.totalReject) || 0);
  };

  const calculateExtraProduction = () => {
    return Math.max(0, (Number(formData.totalProduction) || 0) - (Number(formData.targetProduction) || 0));
  };

  const calculateBonus = () => {
    const totalProd = Number(formData.totalProduction) || 0;
    const targetProd = Number(formData.targetProduction) || 0;
    const lType = selectedLabour?.labourType;

    if (lType === '4 Die') {
      if (totalProd >= targetProd && targetProd > 0) {
        const extra = Math.max(0, totalProd - targetProd);
        return 30 + Math.floor(extra / 8) * 10;
      }
      return 0;
    } else if (lType === '6 Die') {
      if (totalProd >= targetProd && targetProd > 0) {
        const extra = Math.max(0, totalProd - targetProd);
        return 40 + Math.floor(extra / 12) * 15;
      }
      return 0;
    }
    
    return totalProd * (Number(formData.bonusRate) || 0);
  };

  const getUpdateTimestamp = () => {
    if (!existingProductionId) return null;
    const existing = productions.find(p => p._id === existingProductionId);
    if (existing && existing.updatedAt) {
      return new Date(existing.updatedAt).toLocaleTimeString();
    }
    return null;
  };

  return (
    <div className="space-y-4 md:space-y-8 animate-fade-in pb-8 max-w-7xl mx-auto">
      {/* Dashboard Header: Live Date & Time & Active Shift */}
      <div className="bg-white p-5 md:p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center relative overflow-hidden">
        {activeShift && (
          <div className={`absolute top-0 left-0 w-full p-1.5 md:p-2 text-center text-[10px] md:text-sm font-bold text-white tracking-widest uppercase ${activeShift.shiftType === 'Day' ? 'bg-orange-500' : 'bg-indigo-600'}`}>
            Active {activeShift.shiftType} Shift
          </div>
        )}
        <div className="mt-4 md:mt-6 flex flex-col items-center">
          <span className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Current Time</span>
          <span className="text-3xl md:text-5xl font-black text-gray-800 tracking-tight">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <span className="text-sm md:text-base font-medium text-gray-500 mt-2">
            {currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-4">
          <h3 className="text-lg md:text-xl font-bold text-gray-800">Select Worker to Update Entry</h3>
          <div className="flex flex-wrap gap-2">
            {['All', 'Simple', '4 Die', '6 Die'].map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 text-sm font-bold rounded-lg transition-all ${filterType === type ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {labours.filter(l => {
            if (l.role && l.role.toLowerCase() !== 'labour') return false;
            if (filterType === 'All') return true;
            if (filterType === 'Simple') return !l.labourType || l.labourType === 'Simple' || l.labourType === null;
            return l.labourType === filterType;
          }).map(labour => {
            const hasEntry = productions.some(p => p.labour && p.labour._id === labour._id && p.shiftType === activeShift?.shiftType);
            const addedDate = labour.createdAt ? new Date(labour.createdAt) : null;

            return (
              <div 
                key={labour._id}
                className={`p-4 md:p-5 rounded-2xl border flex flex-col gap-4 transition-all cursor-pointer ${hasEntry ? 'bg-green-50/50 border-green-200 hover:bg-green-50' : 'bg-gray-50/50 border-gray-200 hover:bg-gray-50'}`}
                onClick={() => openFormForLabour(labour)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex flex-col pr-2 w-full">
                    <div className="flex items-start gap-2 flex-wrap">
                      <span className="font-bold text-gray-800 break-words whitespace-normal text-base md:text-lg leading-tight">
                        {labour.name}
                      </span>
                      {labour.labourType && (
                        <span className="text-[10px] md:text-xs px-2 py-0.5 rounded-full font-bold border bg-blue-50 text-blue-600 border-blue-200 mt-0.5">
                          {labour.labourType}
                        </span>
                      )}
                    </div>
                    <span className="text-xs md:text-sm text-gray-500 font-medium mt-1">{labour.gender}</span>
                    
                    {/* NEW: Date, Day, and Time Display */}
                    {addedDate && (
                      <div className="flex items-center gap-1.5 mt-2 text-[11px] md:text-xs text-gray-400 font-medium bg-white/60 w-fit px-2 py-1 rounded-md border border-gray-100">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        <span>
                          {addedDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} • {addedDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {hasEntry && (
                    <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded text-[11px] font-bold mt-1 ml-2 shrink-0">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                      Marked
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col gap-2 pt-3 border-t border-gray-200 mt-auto">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingLabour(labour);
                      setEditLabourName(labour.name);
                      setEditLabourGender(labour.gender || 'Male');
                    }} 
                    className="w-full py-2.5 text-sm font-bold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-600 hover:text-white hover:border-blue-600 active:scale-[0.97] rounded-lg transition-all duration-200 text-center shadow-sm flex items-center justify-center min-h-[40px]"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={(e) => handleDeleteLabour(labour._id, e)} 
                    className="w-full py-2.5 text-sm font-bold text-red-700 bg-red-50 border border-red-200 hover:bg-red-600 hover:text-white hover:border-red-600 active:scale-[0.97] rounded-lg transition-all duration-200 text-center shadow-sm flex items-center justify-center min-h-[40px]"
                  >
                    Delete
                  </button>
                </div>
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

      {/* Production Entry Modal */}
      {isModalOpen && selectedLabour && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full md:max-w-2xl rounded-t-[1.5rem] md:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85dvh] transform transition-transform">
            
            {/* Header */}
            <div className="p-4 md:p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-200 rounded-full md:hidden"></div>
              
              <div className="mt-2 md:mt-0">
                <h3 className="text-lg md:text-2xl font-black text-gray-800">{existingProductionId ? 'Update' : 'Add'} Daily Entry</h3>
                <p className="text-sm text-gray-500 mt-1">Worker: <span className="font-bold text-gray-700">{selectedLabour.name}</span></p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-red-600 w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-red-50 rounded-full transition-colors mt-2 md:mt-0 shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            {/* Form Content */}
            <div className="p-5 md:p-6 overflow-y-auto flex-1 custom-scrollbar">
              <form id="entry-form" onSubmit={handleFormSubmit} className="space-y-6 md:space-y-8">
                
                {/* Attendance & Shift */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Shift</label>
                    <select 
                      name="shiftType" 
                      value={formData.shiftType} 
                      onChange={handleInputChange} 
                      className="w-full px-4 py-3.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-700 font-medium outline-none text-base min-h-[48px] appearance-none cursor-not-allowed"
                      disabled={true} 
                    >
                      <option value="Day">Day Shift</option>
                      <option value="Night">Night Shift</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Attendance</label>
                    <select name="attendance" value={formData.attendance} onChange={handleInputChange} className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-base min-h-[48px] bg-white cursor-pointer">
                      <option value="Present">Present</option>
                      <option value="Absent">Absent</option>
                    </select>
                  </div>
                </div>

                {formData.attendance === 'Present' && (
                  <div className="space-y-6 md:space-y-8 animate-fade-in">
                    {/* Time In / Out */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">In Time</label>
                        <input type="time" name="inTime" value={formData.inTime} onChange={handleInputChange} className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-base min-h-[48px]" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Out Time</label>
                        <input type="time" name="outTime" value={formData.outTime} onChange={handleInputChange} className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-base min-h-[48px]" />
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-6">
                      <h4 className="text-base md:text-lg font-bold text-gray-800 mb-5">Production Details</h4>
                      
                      <div className={`grid grid-cols-1 ${(!selectedLabour?.labourType || selectedLabour.labourType === 'Simple') ? 'sm:grid-cols-2' : 'sm:grid-cols-3'} gap-4 md:gap-6 mb-5`}>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Target Prod</label>
                          <input type="number" name="targetProduction" value={formData.targetProduction} onChange={handleInputChange} min="0" className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-black text-lg md:text-xl transition-all" required />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Total Prod</label>
                          <input type="number" name="totalProduction" value={formData.totalProduction} onChange={handleInputChange} min="0" className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-black text-lg md:text-xl transition-all" required />
                        </div>
                        {(!selectedLabour?.labourType || selectedLabour.labourType === 'Simple') ? null : (
                          <div>
                            <label className="block text-xs font-bold text-red-500 uppercase tracking-wider mb-2">Total Reject</label>
                            <input type="number" name="totalReject" value={formData.totalReject} onChange={handleInputChange} min="0" className="w-full px-4 py-3.5 bg-red-50 border border-red-200 rounded-xl focus:ring-2 focus:ring-red-400 outline-none font-black text-lg md:text-xl text-red-600 transition-all" />
                          </div>
                        )}
                      </div>

                      {(!selectedLabour?.labourType || selectedLabour.labourType === 'Simple') ? null : (
                        <div className="mb-5">
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Select Reject Categories</label>
                          <div className="flex flex-wrap gap-4 mb-4">
                            {[2, 3].map(type => (
                              <label key={type} className="flex items-center gap-2 cursor-pointer bg-red-50 px-4 py-2 rounded-lg border border-red-100 hover:bg-red-100 transition-colors">
                                <input 
                                  type="checkbox" 
                                  checked={selectedRejects.includes(String(type))} 
                                  onChange={() => toggleReject(String(type))} 
                                  className="w-4.5 h-4.5 text-red-600 rounded border-red-300 focus:ring-red-500 cursor-pointer"
                                />
                                <span className="text-sm font-bold text-red-700">Type {type}</span>
                              </label>
                            ))}
                          </div>
                          
                          {selectedRejects.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-red-50/50 rounded-xl border border-red-100">
                              {selectedRejects.includes('2') && (
                                <div>
                                  <label className="block text-xs font-bold text-red-500 uppercase tracking-wider mb-2">Reject Type 2</label>
                                  <input type="number" name="reject2" value={formData.reject2} onChange={handleInputChange} min="0" className="w-full px-4 py-3.5 bg-white border border-red-200 rounded-xl focus:ring-2 focus:ring-red-400 outline-none font-bold text-red-600 text-base" />
                                </div>
                              )}
                              {selectedRejects.includes('3') && (
                                <div>
                                  <label className="block text-xs font-bold text-red-500 uppercase tracking-wider mb-2">Reject Type 3</label>
                                  <input type="number" name="reject3" value={formData.reject3} onChange={handleInputChange} min="0" className="w-full px-4 py-3.5 bg-white border border-red-200 rounded-xl focus:ring-2 focus:ring-red-400 outline-none font-bold text-red-600 text-base" />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Net Production Card */}
                      <div className="p-4 md:p-6 bg-gray-50 rounded-2xl border border-gray-200 mb-6 shadow-sm">
                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 sm:items-center">
                          <div className="flex flex-col flex-1">
                            <span className="font-bold text-gray-500 text-xs md:text-sm uppercase tracking-wider mb-1">Net Production</span>
                            <span className="text-2xl md:text-3xl font-black text-gray-800">{calculateNetProduction()}</span>
                          </div>
                          <div className="w-full h-px sm:w-px sm:h-12 bg-gray-200"></div>
                          <div className="flex flex-col flex-1">
                            <span className="font-bold text-green-600 text-xs md:text-sm uppercase tracking-wider mb-1">Extra Production</span>
                            <span className="text-2xl md:text-3xl font-black text-green-600">+{calculateExtraProduction()}</span>
                          </div>
                        </div>
                      </div>

                      <div className={`grid grid-cols-1 ${(!selectedLabour?.labourType || selectedLabour.labourType === 'Simple') ? 'sm:grid-cols-2' : 'sm:grid-cols-1'} gap-4 md:gap-6`}>
                        {(!selectedLabour?.labourType || selectedLabour.labourType === 'Simple') && (
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Bonus Rate</label>
                            <select name="bonusRate" value={formData.bonusRate} onChange={handleInputChange} className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-base min-h-[48px] bg-white cursor-pointer">
                              <option value={0.05}>5 Paise</option>
                              <option value={0.20}>20 Paise</option>
                              <option value={0.25}>25 Paise</option>
                            </select>
                          </div>
                        )}
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">O.T. Hours</label>
                          <input type="number" name="overtimeHours" value={formData.overtimeHours} onChange={handleInputChange} min="0" step="0.5" className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-base min-h-[48px]" />
                        </div>
                      </div>

                      {formData.totalProduction > 0 && (
                        <div className="mt-6 p-4 md:p-5 bg-green-50/50 rounded-xl border border-green-200 mb-6 flex justify-between items-center">
                          <div className="flex flex-col">
                             <span className="font-bold text-green-800 text-sm">Estimated Bonus</span>
                             {(!selectedLabour?.labourType || selectedLabour.labourType === 'Simple') ? (
                               <span className="text-xs text-green-600 mt-0.5">{formData.totalProduction} total × ₹{formData.bonusRate}</span>
                             ) : selectedLabour.labourType === '4 Die' ? (
                               <span className="text-xs text-green-600 mt-0.5">Base: ₹30 (at {formData.targetProduction || 120}) + ₹10 per 8 extra</span>
                             ) : selectedLabour.labourType === '6 Die' ? (
                               <span className="text-xs text-green-600 mt-0.5">Base: ₹40 (at {formData.targetProduction || 168}) + ₹15 per 12 extra</span>
                             ) : null}
                          </div>
                          <span className="text-2xl font-black text-green-600">₹{calculateBonus().toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </form>
            </div>
            
            {/* Footer Actions */}
            <div className="p-4 md:p-6 border-t border-gray-200 bg-gray-50 flex flex-col gap-3 md:gap-4 shrink-0 pb-safe pb-8 md:pb-6">
              {getUpdateTimestamp() && (
                <p className="text-xs text-center font-medium text-gray-500">Last updated today at {getUpdateTimestamp()}</p>
              )}
              <div className="flex gap-3 md:gap-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="flex-1 px-4 py-3.5 bg-white border-2 border-gray-200 text-gray-700 font-bold rounded-xl shadow-sm hover:bg-gray-50 hover:border-gray-300 active:bg-gray-100 active:scale-[0.98] transition-all text-base whitespace-nowrap flex items-center justify-center min-h-[52px]"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  form="entry-form"
                  disabled={isProductionLoading}
                  className="flex-1 px-4 py-3.5 bg-blue-600 border-2 border-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700 hover:border-blue-700 hover:shadow-lg active:bg-blue-800 active:scale-[0.98] transition-all disabled:opacity-50 text-base whitespace-nowrap flex items-center justify-center min-h-[52px]"
                >
                  {isProductionLoading ? 'Saving...' : existingProductionId ? 'Update Entry' : 'Save Entry'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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