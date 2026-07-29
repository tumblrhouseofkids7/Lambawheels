import { create } from 'zustand';
import * as shiftService from '../services/shiftService';

const useShiftStore = create((set, get) => ({
  selectedDate: localStorage.getItem('selectedDate') || new Date().toISOString().split('T')[0],
  activeShift: null,
  shiftHistory: [],
  isLoading: false,
  error: null,

  setSelectedDate: (dateString) => {
    localStorage.setItem('selectedDate', dateString);
    set({ selectedDate: dateString });
    get().fetchActiveShift();
  },

  fetchActiveShift: async () => {
    try {
      set({ isLoading: true, error: null });
      const date = get().selectedDate;
      const shift = await shiftService.getMyShiftForDate(date);
      set({ activeShift: shift || null, isLoading: false });
    } catch (error) {
      set({ activeShift: null, error: error.response?.data?.message || 'Error fetching shift', isLoading: false });
    }
  },

  startShift: async (shiftType) => {
    try {
      set({ isLoading: true, error: null });
      const date = get().selectedDate;
      const shift = await shiftService.startShiftWithDate(shiftType, date);
      set({ activeShift: shift, isLoading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Error starting shift', isLoading: false });
    }
  },

  endShift: async (id) => {
    try {
      set({ isLoading: true, error: null });
      const endedShift = await shiftService.endShift(id);
      set((state) => {
        // Update the shift in history if it exists, otherwise prepend
        const exists = state.shiftHistory.some(s => s._id === endedShift._id);
        const updatedHistory = exists 
          ? state.shiftHistory.map(s => s._id === endedShift._id ? endedShift : s)
          : [endedShift, ...state.shiftHistory];
          
        return {
          activeShift: endedShift, // Set it to endedShift so it stays in UI as completed
          shiftHistory: updatedHistory,
          isLoading: false 
        };
      });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Error ending shift', isLoading: false });
    }
  },

  resumeShift: async (id) => {
    try {
      set({ isLoading: true, error: null });
      const resumedShift = await shiftService.resumeShift(id);
      set({ activeShift: resumedShift, isLoading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Error resuming shift', isLoading: false });
      throw error;
    }
  },

  fetchShiftHistory: async (date) => {
    try {
      set({ isLoading: true, error: null });
      const history = await shiftService.getShiftHistory(date);
      set({ shiftHistory: history, isLoading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Error fetching shift history', isLoading: false });
    }
  }
}));

export default useShiftStore;
