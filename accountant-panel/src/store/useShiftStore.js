import { create } from 'zustand';
import api from '../utils/axios';

const useShiftStore = create((set, get) => ({
  activeShift: null,
  shiftHistory: [],
  isLoading: false,
  isStarting: false,
  isEnding: false,
  error: null,

  fetchActiveShift: async () => {
    try {
      const { data } = await api.get('/shifts/active');
      set({ activeShift: data });
    } catch {
      set({ activeShift: null });
    }
  },

  fetchShiftHistory: async (date) => {
    try {
      set({ isLoading: true });
      const params = date ? { date } : {};
      const { data } = await api.get('/shifts/history', { params });
      set({ shiftHistory: data, isLoading: false });
    } catch {
      set({ shiftHistory: [], isLoading: false });
    }
  },

  startShift: async (shiftType) => {
    try {
      set({ isStarting: true, error: null });
      const { data } = await api.post('/shifts', { shiftType });
      set({ activeShift: data, isStarting: false });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to start shift';
      set({ isStarting: false, error: msg });
      return { success: false, error: msg };
    }
  },

  endShift: async () => {
    try {
      const { activeShift } = get();
      if (!activeShift) return { success: false, error: 'No active shift' };
      set({ isEnding: true, error: null });
      const { data } = await api.put(`/shifts/${activeShift._id}/end`);
      set({ activeShift: null, isEnding: false });
      // refresh history for today
      await get().fetchShiftHistory();
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to end shift';
      set({ isEnding: false, error: msg });
      return { success: false, error: msg };
    }
  },
}));

export default useShiftStore;
