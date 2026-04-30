import { create } from 'zustand';
import * as shiftService from '../services/shiftService';

const useShiftStore = create((set) => ({
  activeShift: null,
  shiftHistory: [],
  isLoading: false,
  error: null,

  fetchActiveShift: async () => {
    try {
      set({ isLoading: true, error: null });
      const shift = await shiftService.getActiveShift();
      set({ activeShift: shift || null, isLoading: false });
    } catch (error) {
      set({ activeShift: null, error: error.response?.data?.message || 'Error fetching shift', isLoading: false });
    }
  },

  startShift: async (shiftType) => {
    try {
      set({ isLoading: true, error: null });
      const shift = await shiftService.startShift(shiftType);
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
          activeShift: null, 
          shiftHistory: updatedHistory,
          isLoading: false 
        };
      });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Error ending shift', isLoading: false });
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
