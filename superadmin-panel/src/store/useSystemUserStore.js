import { create } from 'zustand';
import { systemUserService } from '../services/api';

const useSystemUserStore = create((set) => ({
  users: [],
  isLoading: false,
  error: null,

  fetchUsers: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await systemUserService.getUsers();
      set({ users: data, isLoading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to fetch users', isLoading: false });
    }
  },

  addUser: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await systemUserService.createUser(userData);
      set((state) => ({ 
        users: [...state.users, data], 
        isLoading: false 
      }));
      return data;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to add user', isLoading: false });
      throw error;
    }
  },

  removeUser: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await systemUserService.deleteUser(id);
      set((state) => ({
        users: state.users.filter((u) => u._id !== id),
        isLoading: false
      }));
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to delete user', isLoading: false });
      throw error;
    }
  },

  updateUser: async (id, userData) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await systemUserService.updateUser(id, userData);
      set((state) => ({
        users: state.users.map((u) => u._id === id ? data : u),
        isLoading: false
      }));
      return data;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to update user', isLoading: false });
      throw error;
    }
  }
}));

export default useSystemUserStore;
