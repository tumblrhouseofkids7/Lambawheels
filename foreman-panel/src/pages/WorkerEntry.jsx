import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useLabourStore from '../store/useLabourStore';
import useProductionStore from '../store/useProductionStore';
import useShiftStore from '../store/useShiftStore';
import toast from 'react-hot-toast';

const WorkerEntry = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { labours, fetchLabours } = useLabourStore();
  const { productions, fetchProductions, addProduction, updateProduction, isLoading: isProductionLoading } = useProductionStore();
  const { activeShift, fetchActiveShift } = useShiftStore();

  const [existingProductionId, setExistingProductionId] = useState(null);
  const [selectedRejects, setSelectedRejects] = useState([]);
  const [selectedSecondaryRejects, setSelectedSecondaryRejects] = useState([]);

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
    secondaryDieType: '',
    secondaryTargetProduction: '',
    secondaryTotalProduction: '',
    secondaryTotalReject: '',
    secondaryReject2: '',
    secondaryReject3: '',
    lowProductionReason: '',
  });

  // Find the labour from store
  const labour = labours.find(l => l._id === id);

  // Fetch data on mount
  useEffect(() => {
    fetchLabours();
    fetchActiveShift();
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    fetchProductions(dateString);
  }, [fetchLabours, fetchProductions, fetchActiveShift]);

  // Once labour and productions are loaded, populate form
  useEffect(() => {
    if (!labour || !activeShift) return;

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
        secondaryDieType: existing.secondaryDieType || '',
        secondaryTargetProduction: existing.secondaryTargetProduction || '',
        secondaryTotalProduction: existing.secondaryTotalProduction || '',
        secondaryTotalReject: existing.secondaryTotalReject || '',
        secondaryReject2: existing.secondaryReject2 || '',
        secondaryReject3: existing.secondaryReject3 || '',
        lowProductionReason: existing.lowProductionReason || '',
      });

      const activeRejects = [];
      if (existing.reject2) activeRejects.push('2');
      if (existing.reject3) activeRejects.push('3');
      setSelectedRejects(activeRejects);

      const activeSecondaryRejects = [];
      if (existing.secondaryReject2) activeSecondaryRejects.push('2');
      if (existing.secondaryReject3) activeSecondaryRejects.push('3');
      setSelectedSecondaryRejects(activeSecondaryRejects);
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
        secondaryDieType: '',
        secondaryTargetProduction: '',
        secondaryTotalProduction: '',
        secondaryTotalReject: '',
        secondaryReject2: '',
        secondaryReject3: '',
        lowProductionReason: '',
      });
      setSelectedRejects([]);
      setSelectedSecondaryRejects([]);
    }
  }, [labour, productions, activeShift]);

  const toggleReject = (type) => {
    setSelectedRejects(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
    if (selectedRejects.includes(type)) {
      setFormData(prev => ({ ...prev, [`reject${type}`]: '' }));
    }
  };

  const toggleSecondaryReject = (type) => {
    setSelectedSecondaryRejects(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
    if (selectedSecondaryRejects.includes(type)) {
      setFormData(prev => ({ ...prev, [`secondaryReject${type}`]: '' }));
    }
  };

  const handleToggleSecondaryDie = () => {
    if (formData.secondaryDieType) {
      setFormData(prev => ({
        ...prev,
        secondaryDieType: '',
        secondaryTargetProduction: '',
        secondaryTotalProduction: '',
        secondaryTotalReject: '',
        secondaryReject2: '',
        secondaryReject3: ''
      }));
      setSelectedSecondaryRejects([]);
    } else {
      const secType = labour?.labourType === '4 Die' ? '6 Die' : '4 Die';
      const secTarget = secType === '6 Die' ? 168 : 120;
      setFormData(prev => ({
        ...prev,
        secondaryDieType: secType,
        secondaryTargetProduction: secTarget
      }));
    }
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
        labour: labour._id,
        ...formData
      };

      if (existingProductionId) {
        await updateProduction(existingProductionId, payload);
      } else {
        await addProduction(payload);
      }
      toast.success(existingProductionId ? 'Entry updated!' : 'Entry saved!');
      navigate('/add-entry');
    } catch (error) {
      console.error('Failed to save production:', error);
    }
  };

  const calculateNetProduction = () => {
    return (Number(formData.totalProduction) || 0) - (Number(formData.totalReject) || 0);
  };

  const calculateExtraProduction = () => {
    return Math.max(0, (Number(formData.totalProduction) || 0) - (Number(formData.targetProduction) || 0));
  };

  const calculatePrimaryBonus = () => {
    const totalProd = Number(formData.totalProduction) || 0;
    const targetProd = Number(formData.targetProduction) || 0;
    const lType = labour?.labourType;

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

  const calculateSecondaryBonus = () => {
    const secTotalProd = Number(formData.secondaryTotalProduction) || 0;
    const secTargetProd = Number(formData.secondaryTargetProduction) || 0;
    const secType = formData.secondaryDieType;

    if (secType === '4 Die') {
      if (secTotalProd >= secTargetProd && secTargetProd > 0) {
        const extra = Math.max(0, secTotalProd - secTargetProd);
        return 30 + Math.floor(extra / 8) * 10;
      }
    } else if (secType === '6 Die') {
      if (secTotalProd >= secTargetProd && secTargetProd > 0) {
        const extra = Math.max(0, secTotalProd - secTargetProd);
        return 40 + Math.floor(extra / 12) * 15;
      }
    }
    return 0;
  };

  const calculateBonus = () => {
    return calculatePrimaryBonus() + calculateSecondaryBonus();
  };

  const getUpdateTimestamp = () => {
    if (!existingProductionId) return null;
    const existing = productions.find(p => p._id === existingProductionId);
    if (existing && existing.updatedAt) {
      return new Date(existing.updatedAt).toLocaleTimeString();
    }
    return null;
  };

  // Loading / not found states
  if (!labour) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium">Loading worker...</p>
      </div>
    );
  }

  if (!activeShift) {
    return (
      <div className="animate-fade-in pb-8">
        <button
          onClick={() => navigate('/add-entry')}
          className="flex items-center gap-2 text-blue-600 font-bold mb-6 active:scale-95 transition-transform"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
          Back
        </button>
        <div className="bg-yellow-50 border border-yellow-200 p-5 rounded-xl text-yellow-800 font-medium text-sm text-center">
          Please go to the Home tab and start a shift before adding entries.
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-8">
      {/* Back Button */}
      <button
        onClick={() => navigate('/add-entry')}
        className="flex items-center gap-2 text-blue-600 font-bold mb-4 active:scale-95 transition-transform"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
        Back to Workers
      </button>

      {/* Worker Info Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-gray-800">{labour.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-500 font-medium">{labour.gender}</span>
              {labour.labourType && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold border bg-blue-50 text-blue-600 border-blue-200">
                  {labour.labourType}
                </span>
              )}
            </div>
          </div>
          <div className={`px-3 py-1.5 rounded-lg text-xs font-bold ${activeShift.shiftType === 'Day' ? 'bg-orange-100 text-orange-700' : 'bg-indigo-100 text-indigo-700'}`}>
            {activeShift.shiftType} Shift
          </div>
        </div>
        {existingProductionId && (
          <div className="flex items-center gap-1.5 mt-3 text-green-600 text-xs font-bold">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            Entry already exists — editing
          </div>
        )}
      </div>

      {/* Entry Form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5">
          <form id="entry-form" onSubmit={handleFormSubmit} className="space-y-6">

            {/* Attendance & Shift */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Shift</label>
                <div className={`w-full px-4 py-3.5 border rounded-xl font-bold text-base min-h-[48px] flex items-center ${activeShift.shiftType === 'Day' ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-indigo-50 border-indigo-200 text-indigo-700'}`}>
                  {activeShift.shiftType === 'Day' ? '☀️ Day' : '🌙 Night'}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Attendance</label>
                <select name="attendance" value={formData.attendance} onChange={handleInputChange} className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-base min-h-[48px] bg-white cursor-pointer">
                  <option value="Present">✅ Present</option>
                  <option value="Absent">❌ Absent</option>
                </select>
              </div>
            </div>

            {formData.attendance === 'Present' && (
              <div className="space-y-6 animate-fade-in">
                {/* Time In / Out */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">In Time</label>
                    <input type="time" name="inTime" value={formData.inTime} onChange={handleInputChange} className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-base min-h-[48px]" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Out Time</label>
                    <input type="time" name="outTime" value={formData.outTime} onChange={handleInputChange} className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-base min-h-[48px]" />
                  </div>
                </div>

                {/* Production Section */}
                <div className="border-t border-gray-100 pt-5">
                  <h4 className="text-base font-bold text-gray-800 mb-4">Production Details</h4>

                  <div className={`grid grid-cols-1 ${(!labour?.labourType || labour.labourType === 'Simple') ? 'sm:grid-cols-2' : 'sm:grid-cols-3'} gap-4 mb-4`}>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Target</label>
                      <input type="number" name="targetProduction" value={formData.targetProduction} readOnly className="w-full px-4 py-3.5 bg-gray-200 border border-gray-300 rounded-xl focus:outline-none font-black text-xl text-gray-600 transition-all cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Total Prod</label>
                      <input type="number" name="totalProduction" value={formData.totalProduction} onChange={handleInputChange} min="0" className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-black text-xl transition-all" required />
                    </div>
                    {(!labour?.labourType || labour.labourType === 'Simple') ? null : (
                      <div>
                        <label className="block text-xs font-bold text-red-500 uppercase tracking-wider mb-2">Total Reject</label>
                        <input type="number" name="totalReject" value={formData.totalReject} onChange={handleInputChange} min="0" className="w-full px-4 py-3.5 bg-red-50 border border-red-200 rounded-xl focus:ring-2 focus:ring-red-400 outline-none font-black text-xl text-red-600 transition-all" />
                      </div>
                    )}
                  </div>

                  {(!labour?.labourType || labour.labourType === 'Simple') ? null : (
                    <div className="mb-4">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Reject Categories</label>
                      <div className="flex flex-wrap gap-3 mb-3">
                        {[2, 3].map(type => (
                          <label key={type} className="flex items-center gap-2 cursor-pointer bg-red-50 px-4 py-2.5 rounded-xl border border-red-100 hover:bg-red-100 transition-colors active:scale-95">
                            <input
                              type="checkbox"
                              checked={selectedRejects.includes(String(type))}
                              onChange={() => toggleReject(String(type))}
                              className="w-5 h-5 text-red-600 rounded border-red-300 focus:ring-red-500 cursor-pointer"
                            />
                            <span className="text-sm font-bold text-red-700">Type {type}</span>
                          </label>
                        ))}
                      </div>

                      {selectedRejects.length > 0 && (
                        <div className="grid grid-cols-2 gap-3 p-4 bg-red-50/50 rounded-xl border border-red-100">
                          {selectedRejects.includes('2') && (
                            <div>
                              <label className="block text-xs font-bold text-red-500 uppercase tracking-wider mb-2">Type 2</label>
                              <input type="number" name="reject2" value={formData.reject2} onChange={handleInputChange} min="0" className="w-full px-4 py-3.5 bg-white border border-red-200 rounded-xl focus:ring-2 focus:ring-red-400 outline-none font-bold text-red-600 text-base" />
                            </div>
                          )}
                          {selectedRejects.includes('3') && (
                            <div>
                              <label className="block text-xs font-bold text-red-500 uppercase tracking-wider mb-2">Type 3</label>
                              <input type="number" name="reject3" value={formData.reject3} onChange={handleInputChange} min="0" className="w-full px-4 py-3.5 bg-white border border-red-200 rounded-xl focus:ring-2 focus:ring-red-400 outline-none font-bold text-red-600 text-base" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Secondary Die Section */}
                  {labour?.labourType && (labour.labourType === '4 Die' || labour.labourType === '6 Die') && (
                    <div className="mb-5 border-t border-gray-100 pt-5">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-base font-bold text-gray-800">Additional Work</h4>
                        <button
                          type="button"
                          onClick={handleToggleSecondaryDie}
                          className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${formData.secondaryDieType ? 'bg-indigo-100 border-indigo-200 text-indigo-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                        >
                          {formData.secondaryDieType 
                            ? `Remove ${formData.secondaryDieType} Entry` 
                            : `+ Add ${labour.labourType === '4 Die' ? '6 Die' : '4 Die'} Work`}
                        </button>
                      </div>

                      {formData.secondaryDieType && (
                        <div className="p-4 border border-indigo-100 bg-indigo-50/30 rounded-xl space-y-4 mb-4">
                          <h5 className="font-bold text-indigo-800 text-sm">{formData.secondaryDieType} Details</h5>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-indigo-500 uppercase tracking-wider mb-2">Target</label>
                              <input type="number" name="secondaryTargetProduction" value={formData.secondaryTargetProduction} readOnly className="w-full px-4 py-3.5 bg-indigo-100/50 border border-indigo-200 rounded-xl focus:outline-none font-bold text-base text-indigo-600 transition-all cursor-not-allowed" />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-indigo-500 uppercase tracking-wider mb-2">Total Prod</label>
                              <input type="number" name="secondaryTotalProduction" value={formData.secondaryTotalProduction} onChange={handleInputChange} min="0" className="w-full px-4 py-3.5 bg-white border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-base transition-all" required={!!formData.secondaryDieType} />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-red-500 uppercase tracking-wider mb-2">Total Reject</label>
                              <input type="number" name="secondaryTotalReject" value={formData.secondaryTotalReject} onChange={handleInputChange} min="0" className="w-full px-4 py-3.5 bg-white border border-red-200 rounded-xl focus:ring-2 focus:ring-red-400 outline-none font-bold text-red-600 transition-all" />
                            </div>
                          </div>

                          <div className="mt-4">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Reject Categories</label>
                            <div className="flex flex-wrap gap-3 mb-3">
                              {[2, 3].map(type => (
                                <label key={type} className="flex items-center gap-2 cursor-pointer bg-red-50 px-4 py-2.5 rounded-xl border border-red-100 hover:bg-red-100 transition-colors active:scale-95">
                                  <input
                                    type="checkbox"
                                    checked={selectedSecondaryRejects.includes(String(type))}
                                    onChange={() => toggleSecondaryReject(String(type))}
                                    className="w-5 h-5 text-red-600 rounded border-red-300 focus:ring-red-500 cursor-pointer"
                                  />
                                  <span className="text-sm font-bold text-red-700">Type {type}</span>
                                </label>
                              ))}
                            </div>

                            {selectedSecondaryRejects.length > 0 && (
                              <div className="grid grid-cols-2 gap-3 p-4 bg-red-50/50 rounded-xl border border-red-100">
                                {selectedSecondaryRejects.includes('2') && (
                                  <div>
                                    <label className="block text-xs font-bold text-red-500 uppercase tracking-wider mb-2">Type 2</label>
                                    <input type="number" name="secondaryReject2" value={formData.secondaryReject2} onChange={handleInputChange} min="0" className="w-full px-4 py-3.5 bg-white border border-red-200 rounded-xl focus:ring-2 focus:ring-red-400 outline-none font-bold text-red-600 text-base" />
                                  </div>
                                )}
                                {selectedSecondaryRejects.includes('3') && (
                                  <div>
                                    <label className="block text-xs font-bold text-red-500 uppercase tracking-wider mb-2">Type 3</label>
                                    <input type="number" name="secondaryReject3" value={formData.secondaryReject3} onChange={handleInputChange} min="0" className="w-full px-4 py-3.5 bg-white border border-red-200 rounded-xl focus:ring-2 focus:ring-red-400 outline-none font-bold text-red-600 text-base" />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {formData.secondaryTotalProduction > 0 && (
                            <div className="mt-4 p-3 bg-indigo-100/50 rounded-xl border border-indigo-200 flex justify-between items-center">
                              <div className="flex flex-col">
                                <span className="font-bold text-indigo-800 text-sm">Addl. Bonus</span>
                              </div>
                              <span className="text-xl font-black text-indigo-600">₹{calculateSecondaryBonus().toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Net Production Card */}
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 mb-5">
                    <div className="flex gap-6 items-center">
                      <div className="flex flex-col flex-1">
                        <span className="font-bold text-gray-500 text-xs uppercase tracking-wider mb-1">Net Prod</span>
                        <span className="text-2xl font-black text-gray-800">{calculateNetProduction()}</span>
                      </div>
                      <div className="w-px h-10 bg-gray-200"></div>
                      <div className="flex flex-col flex-1">
                        <span className="font-bold text-green-600 text-xs uppercase tracking-wider mb-1">Extra</span>
                        <span className="text-2xl font-black text-green-600">+{calculateExtraProduction()}</span>
                      </div>
                    </div>
                  </div>

                  <div className={`grid grid-cols-1 ${(!labour?.labourType || labour.labourType === 'Simple') ? 'grid-cols-2' : ''} gap-4`}>
                    {(!labour?.labourType || labour.labourType === 'Simple') && (
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

                  {/* Low Production Reason */}
                  <div className="mt-5">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Low Production Reason (Optional)</label>
                    <textarea 
                      name="lowProductionReason" 
                      value={formData.lowProductionReason} 
                      onChange={handleInputChange} 
                      placeholder="Reason if production is slow today..." 
                      className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm transition-all resize-none h-20"
                    ></textarea>
                  </div>

                  {formData.totalProduction > 0 && (
                    <div className="mt-5 p-4 bg-green-50/50 rounded-xl border border-green-200">
                      <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="font-bold text-green-800 text-sm">Final Bonus</span>
                          {(!labour?.labourType || labour.labourType === 'Simple') ? (
                            <span className="text-xs text-green-600 mt-0.5">{formData.totalProduction} × ₹{formData.bonusRate}</span>
                          ) : (
                            <span className="text-xs text-green-600 mt-0.5">Primary{formData.secondaryDieType ? ' + Additional Work' : ' Bonus'}</span>
                          )}
                        </div>
                        <span className="text-2xl font-black text-green-600">₹{calculateBonus().toFixed(2)}</span>
                      </div>
                      {formData.secondaryDieType && calculateSecondaryBonus() > 0 && (
                        <div className="mt-2 pt-2 border-t border-green-200 flex justify-between items-center text-xs">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-gray-600 font-semibold">Primary Bonus: <span className="text-green-700 font-bold">₹{calculatePrimaryBonus().toFixed(2)}</span></span>
                            <span className="text-indigo-600 font-semibold">Additional Bonus ({formData.secondaryDieType}): <span className="text-indigo-700 font-bold">₹{calculateSecondaryBonus().toFixed(2)}</span></span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-gray-200 bg-gray-50 flex flex-col gap-3 pb-safe pb-8">
          {getUpdateTimestamp() && (
            <p className="text-xs text-center font-medium text-gray-500">Last updated today at {getUpdateTimestamp()}</p>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/add-entry')}
              className="flex-1 px-4 py-4 bg-white border-2 border-gray-200 text-gray-700 font-bold rounded-xl shadow-sm hover:bg-gray-50 active:bg-gray-100 active:scale-[0.98] transition-all text-base flex items-center justify-center min-h-[52px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="entry-form"
              disabled={isProductionLoading}
              className="flex-[2] px-4 py-4 bg-blue-600 border-2 border-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700 active:bg-blue-800 active:scale-[0.98] transition-all disabled:opacity-50 text-base flex items-center justify-center min-h-[52px]"
            >
              {isProductionLoading ? 'Saving...' : existingProductionId ? '✅ Update Entry' : '💾 Save Entry'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerEntry;
