import { create } from 'zustand';
import * as salaryService from '../services/salaryService';
import toast from 'react-hot-toast';

const useSalaryStore = create((set, get) => ({
  salarySheet: [],
  isLoading: false,
  isGenerating: false,
  error: null,
  selectedStartDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
  selectedEndDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],

  setStartDate: (date) => set({ selectedStartDate: date }),
  setEndDate: (date) => set({ selectedEndDate: date }),

  generateSalary: async (startDate, endDate) => {
    set({ isGenerating: true, error: null });
    try {
      const data = await salaryService.generateSalary(startDate, endDate);
      set({ salarySheet: data, isGenerating: false });
      toast.success('Salary sheet generated');
    } catch (err) {
      set({ error: err.message, isGenerating: false });
      toast.error('Failed to generate salary sheet');
    }
  },

  fetchSalarySheet: async (startDate, endDate) => {
    set({ isLoading: true, error: null });
    try {
      const data = await salaryService.getSalarySheet(startDate, endDate);
      set({ salarySheet: data, isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false, salarySheet: [] });
    }
  },

  updateField: (rowId, field, value) => {
    set((state) => ({
      salarySheet: state.salarySheet.map((row) => {
        if (row._id === rowId) {
          const updatedRow = { ...row, [field]: value };
          
          // Auto-calculate overtime amount if hours or basic salary changes
          if (field === 'overtimeHours' || field === 'basicSalary') {
             const basic = updatedRow.basicSalary || 0;
             const perDay = basic / 30; // 30 days fixed divisor
             const perHour = perDay / 12; // Changed to 12 hours standard day
             updatedRow.overtimeAmount = Math.round(perHour * (updatedRow.overtimeHours || 0));
          }
          
          return updatedRow;
        }
        return row;
      })
    }));
  },

  saveSalaryRow: async (rowId, updateData) => {
    try {
      // Strip populated 'labour' object and 'attendance' map — sending these
      // to $set corrupts the MongoDB labour reference (ObjectId → embedded obj)
      const { labour, attendance, ...cleanData } = updateData;
      const updatedRow = await salaryService.updateSalary(rowId, cleanData);
      set((state) => ({
        salarySheet: state.salarySheet.map((row) => 
          row._id === rowId ? { ...updatedRow, labour: row.labour, attendance: row.attendance } : row
        )
      }));
    } catch (err) {
      toast.error('Failed to save row');
    }
  },

  saveAllRows: async () => {
    const state = get();
    set({ isLoading: true });
    try {
      await Promise.all(
        state.salarySheet.map((row) => {
          // Strip populated 'labour' object and 'attendance' map before sending
          const { labour, attendance, ...cleanData } = row;
          return salaryService.updateSalary(row._id, cleanData);
        })
      );
      toast.success('All salary data updated successfully');
      set({ isLoading: false });
    } catch (err) {
      toast.error('Failed to update all rows');
      set({ isLoading: false });
    }
  },

  clearSheet: () => set({ salarySheet: [] }),
}));

export default useSalaryStore;
