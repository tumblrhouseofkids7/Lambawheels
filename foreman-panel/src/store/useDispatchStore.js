import { create } from 'zustand';
import * as dispatchService from '../services/dispatchService';
import * as labourService from '../services/labourService';
import toast from 'react-hot-toast';

const useDispatchStore = create((set, get) => ({
  dispatches: [],
  labours: [],
  isLoading: false,
  labourLoading: false,
  error: null,

  // ── Fetch dispatch sheets for a date/shift ──────────────────────────────
  fetchDispatches: async ({ date, shift } = {}) => {
    set({ isLoading: true, error: null });
    try {
      const data = await dispatchService.getDispatches({ date, shift });
      set({ dispatches: data, isLoading: false });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Error fetching', isLoading: false });
      toast.error('Failed to load dispatch data');
    }
  },

  // ── Fetch labour list ───────────────────────────────────────────────────
  fetchLabours: async () => {
    set({ labourLoading: true });
    try {
      const data = await labourService.getLabours();
      set({ labours: data, labourLoading: false });
    } catch (err) {
      set({ labourLoading: false });
      // non-critical – foreman can still type names
    }
  },

  // ── Foreman: add entry to a dispatch ────────────────────────────────────
  addEntry: async (entryData) => {
    try {
      const updated = await dispatchService.addEntry(entryData);
      // Replace the dispatch in the list with the updated one
      set({
        dispatches: get().dispatches.map((d) =>
          d._id === updated._id ? updated : d
        ),
      });
      toast.success('Entry submitted!');
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit entry');
      return false;
    }
  },

  // ── Foreman: delete own entry ───────────────────────────────────────────
  deleteEntry: async (dispatchId, entryId) => {
    try {
      const updated = await dispatchService.deleteEntry(dispatchId, entryId);
      set({
        dispatches: get().dispatches.map((d) =>
          d._id === dispatchId ? updated : d
        ),
      });
      toast.success('Entry removed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove entry');
    }
  },

  // ── Foreman: rename worker ──────────────────────────────────────────────
  renameWorker: async (oldName, newName) => {
    try {
      const { dispatches } = get();
      const updatedDispatches = await Promise.all(
        dispatches.map(async (d) => {
          return await dispatchService.renameWorker(d._id, oldName, newName);
        })
      );
      set({ dispatches: updatedDispatches });
      toast.success('Worker renamed successfully');
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to rename worker');
      return false;
    }
  },

  // ── Foreman: delete worker ──────────────────────────────────────────────
  deleteWorker: async (workerName) => {
    try {
      const { dispatches } = get();
      const updatedDispatches = await Promise.all(
        dispatches.map(async (d) => {
          return await dispatchService.deleteWorker(d._id, workerName);
        })
      );
      set({ dispatches: updatedDispatches });
      toast.success('Worker deleted successfully');
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete worker');
      return false;
    }
  },

  // ── Foreman: submit shift ───────────────────────────────────────────────
  submitShift: async (date, shift) => {
    try {
      const updatedDispatches = await dispatchService.submitShift(date, shift);
      set({ dispatches: updatedDispatches });
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit shift');
      return false;
    }
  },
}));

export default useDispatchStore;
