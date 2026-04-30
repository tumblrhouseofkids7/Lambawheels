import { create } from 'zustand';
import * as reportService from '../services/reportService';
import toast from 'react-hot-toast';

const useReportStore = create((set) => ({
  reports: [],
  summary: null,
  isLoading: false,
  error: null,
  filters: {
    type: 'labour',
    startDate: '',
    endDate: '',
    foreman: '',
  },

  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),

  fetchReports: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const data = await reportService.getReports(filters);
      set({ reports: data.records || data, summary: data.summary || null, isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
      toast.error('Failed to fetch reports');
    }
  },

  fetchSummary: async () => {
    try {
      const data = await reportService.getDashboardSummary();
      set({ summary: data });
    } catch (err) {
      console.error('Summary fetch failed:', err);
    }
  },

  clearReports: () => set({ reports: [], summary: null }),
}));

export default useReportStore;
