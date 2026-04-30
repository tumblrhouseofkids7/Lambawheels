import { create } from 'zustand';
import { advanceService } from '../services/advanceService';
import toast from 'react-hot-toast';

const useAdvanceStore = create((set, get) => ({
  advances: [],
  isLoading: false,
  error: null,

  fetchAdvances: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const data = await advanceService.getAdvances(params);
      set({ advances: data, isLoading: false });
    } catch (error) {
      console.error('Error fetching advances:', error);
      set({ error: error.response?.data?.message || 'Failed to fetch advances', isLoading: false });
    }
  },

  addAdvance: async (advanceData) => {
    set({ isLoading: true, error: null });
    try {
      const newAdvance = await advanceService.addAdvance(advanceData);
      set((state) => ({ 
        advances: [newAdvance, ...state.advances],
        isLoading: false 
      }));
      toast.success('Advance added successfully');
      return true;
    } catch (error) {
      console.error('Error adding advance:', error);
      toast.error(error.response?.data?.message || 'Failed to add advance');
      set({ error: error.response?.data?.message || 'Failed to add advance', isLoading: false });
      return false;
    }
  },

  updateAdvance: async (id, advanceData) => {
    set({ isLoading: true, error: null });
    try {
      const updatedAdvance = await advanceService.updateAdvance(id, advanceData);
      set((state) => ({
        advances: state.advances.map(adv => adv._id === id ? updatedAdvance : adv),
        isLoading: false
      }));
      toast.success('Advance updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating advance:', error);
      toast.error(error.response?.data?.message || 'Failed to update advance');
      set({ error: error.response?.data?.message || 'Failed to update advance', isLoading: false });
      return false;
    }
  },

  deleteAdvance: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await advanceService.deleteAdvance(id);
      set((state) => ({
        advances: state.advances.filter(adv => adv._id !== id),
        isLoading: false
      }));
      toast.success('Advance deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting advance:', error);
      toast.error(error.response?.data?.message || 'Failed to delete advance');
      set({ error: error.response?.data?.message || 'Failed to delete advance', isLoading: false });
      return false;
    }
  }
}));

export default useAdvanceStore;
