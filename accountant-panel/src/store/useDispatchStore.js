import { create } from 'zustand';
import * as dispatchService from '../services/dispatchService';
import toast from 'react-hot-toast';

const useDispatchStore = create((set, get) => ({
  dispatches: [],
  foremanShifts: [],
  allForemen: [],
  isLoading: false,
  shiftsLoading: false,
  error: null,

  // ── Fetch all registered foremen ────────────────────────────────────────
  fetchAllForemen: async () => {
    try {
      const data = await dispatchService.getAllForemen();
      set({ allForemen: data });
    } catch (err) {
      console.error(err);
    }
  },

  // ── Fetch dispatch sheets (optionally by date/shift/foremanId) ──────────
  fetchDispatches: async ({ date, shift, foremanId } = {}) => {
    set({ isLoading: true, error: null });
    try {
      const data = await dispatchService.getDispatches({ date, shift, foremanId });
      set({ dispatches: data, isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
      toast.error('Failed to load dispatch data');
    }
  },

  // ── Fetch foremen on duty for a date ────────────────────────────────────
  fetchForemanShifts: async (date) => {
    set({ shiftsLoading: true, foremanShifts: [] });
    try {
      const data = await dispatchService.getForemanShiftsForDate(date);
      set({ foremanShifts: data, shiftsLoading: false });
    } catch (err) {
      set({ shiftsLoading: false });
      toast.error(err.response?.data?.message || 'No shift data found');
    }
  },

  // ── Accountant: create a dispatch row for a foreman ─────────────────────
  createDispatch: async (dispatchData) => {
    try {
      const created = await dispatchService.createDispatch(dispatchData);
      set({ dispatches: [created, ...get().dispatches] });
      return { ok: true, data: created };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create dispatch';
      toast.error(msg);
      return { ok: false, message: msg };
    }
  },

  // ── Accountant: edit a dispatch row ─────────────────────────────────────
  updateDispatch: async (id, dispatchData) => {
    try {
      const updated = await dispatchService.updateDispatch(id, dispatchData);
      set({ dispatches: get().dispatches.map(d => d._id === id ? updated : d) });
      toast.success('Dispatch updated');
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update dispatch');
      return false;
    }
  },

  // ── Accountant: delete a dispatch row ───────────────────────────────────
  deleteDispatch: async (id) => {
    try {
      await dispatchService.deleteDispatch(id);
      set({ dispatches: get().dispatches.filter(d => d._id !== id) });
      toast.success('Dispatch deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete dispatch');
    }
  },

  // ── Remove a single entry ───────────────────────────────────────────────
  deleteEntry: async (dispatchId, entryId) => {
    try {
      const updated = await dispatchService.deleteEntry(dispatchId, entryId);
      set({ dispatches: get().dispatches.map(d => d._id === dispatchId ? updated : d) });
      toast.success('Entry removed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove entry');
    }
  },

  // ── PDF Export ──────────────────────────────────────────────────────────
  exportPDF: async ({ date, shift, foremanId, foremanName, partyName } = {}) => {
    try {
      const blob = await dispatchService.exportPDF({ date, shift, foremanId, partyName });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Dispatch_${date || 'All'}${partyName ? `_${partyName}` : ''}${foremanName ? `_${foremanName}` : ''}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('Failed to export PDF');
    }
  },
}));

export default useDispatchStore;
