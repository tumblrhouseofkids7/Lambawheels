import { create } from 'zustand';
import api from '../utils/axios';

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  checkAuth: async () => {
    try {
      set({ isLoading: true, error: null });
      const { data } = await api.get('/auth/profile');
      set({ user: data, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
    } finally {
      set({ user: null, isAuthenticated: false, error: null });
      localStorage.removeItem('token');
      // Force a hard redirect so stale cookies / React state can't bounce back
      window.location.href = '/login';
    }
  },
}));

export default useAuthStore;
