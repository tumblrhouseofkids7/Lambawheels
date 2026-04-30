import { create } from 'zustand';
import { userService } from '../services/api';

const useUserStore = create((set) => ({
  labours: [],
  isLoading: false,
  error: null,

  fetchLabours: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await userService.getLabours();
      set({ labours: data.data || data, isLoading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to fetch users', isLoading: false });
    }
  },

  addLabour: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await userService.createLabour(userData);
      set((state) => ({ 
        labours: [...state.labours, data.data || data], 
        isLoading: false 
      }));
      return data;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to add user', isLoading: false });
      throw error;
    }
  },

  removeLabour: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await userService.deleteLabour(id);
      set((state) => ({
        labours: state.labours.filter((l) => l._id !== id),
        isLoading: false
      }));
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to delete user', isLoading: false });
      throw error;
    }
  }
}));

export default useUserStore;
