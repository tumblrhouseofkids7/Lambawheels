import { create } from 'zustand';
import * as productionService from '../services/productionService';

const useProductionStore = create((set) => ({
  productions: [],
  isLoading: false,
  error: null,

  fetchProductions: async (date) => {
    try {
      set({ isLoading: true, error: null });
      const data = await productionService.getProductions(date);
      set({ productions: data, isLoading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Error', isLoading: false });
    }
  },

  addProduction: async (productionData) => {
    try {
      set({ isLoading: true, error: null });
      const data = await productionService.addProduction(productionData);
      set((state) => ({ productions: [data, ...state.productions], isLoading: false }));
      return data;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Error', isLoading: false });
      throw error;
    }
  },

  updateProduction: async (id, productionData) => {
    try {
      set({ isLoading: true, error: null });
      const data = await productionService.updateProduction(id, productionData);
      set((state) => ({
        productions: state.productions.map(p => p._id === id ? data : p),
        isLoading: false
      }));
      return data;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Error', isLoading: false });
      throw error;
    }
  }
}));

export default useProductionStore;
