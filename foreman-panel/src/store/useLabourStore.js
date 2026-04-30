import { create } from 'zustand';
import * as labourService from '../services/labourService';
import toast from 'react-hot-toast';

const useLabourStore = create((set, get) => ({
  labours: [],
  isLoading: false,
  error: null,

  fetchLabours: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await labourService.getLabours();
      set({ labours: data, isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
      toast.error('Failed to fetch team members');
    }
  },

  addLabour: async (labourData) => {
    try {
      const newLabour = await labourService.createLabour(labourData);
      set({ labours: [...get().labours, newLabour] });
      toast.success('Team member added successfully');
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add team member');
      return false;
    }
  },

  updateLabour: async (id, labourData) => {
    try {
      const updated = await labourService.updateLabour(id, labourData);
      set({
        labours: get().labours.map((l) => (l._id === id ? updated : l)),
      });
      toast.success('Team member updated successfully');
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update team member');
      return false;
    }
  },

  deleteLabour: async (id) => {
    try {
      await labourService.deleteLabour(id);
      set({ labours: get().labours.filter((l) => l._id !== id) });
      toast.success('Team member deleted successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete team member');
    }
  },
}));

export default useLabourStore;
