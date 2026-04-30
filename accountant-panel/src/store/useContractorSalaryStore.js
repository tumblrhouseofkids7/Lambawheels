import { create } from 'zustand';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
axios.defaults.withCredentials = true;

const useContractorSalaryStore = create((set) => ({
  contractors: [],
  isLoading: false,

  fetchContractorSalaries: async (startDate, endDate) => {
    set({ isLoading: true });
    try {
      const res = await axios.get(`${API_URL}/api/salary/contractor?startDate=${startDate}&endDate=${endDate}`);
      set({ contractors: res.data, isLoading: false });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch contractor salaries');
      set({ isLoading: false });
    }
  },

  updateContractorRate: async (id, newRate) => {
    try {
      const res = await axios.put(`${API_URL}/api/salary/contractor/${id}/rate`, { dispatchRate: newRate });
      set((state) => ({
        contractors: state.contractors.map((c) => {
          if (c._id === id) {
            const updatedRate = res.data.dispatchRate;
            return {
              ...c,
              dispatchRate: updatedRate,
              totalSalary: c.totalDispatch * updatedRate,
            };
          }
          return c;
        }),
      }));
      toast.success('Dispatch rate updated successfully');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update dispatch rate');
      return false;
    }
  },
}));

export default useContractorSalaryStore;
