import { create } from 'zustand';
import api from '../utils/axios';

// Auth state is driven entirely by HTTP-only cookies (no localStorage).
// checkAuth() hits the backend /auth/profile to verify the session cookie.
const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  // Called on app mount to restore session from cookie
  checkAuth: async () => {
    try {
      set({ isLoading: true, error: null });
      const { data } = await api.get('/auth/profile');
      set({ user: data, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  // Calls backend to clear the cookie, then resets state
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // even if it fails, clear the local state
    } finally {
      set({ user: null, isAuthenticated: false, error: null });
      localStorage.removeItem('token');
      // Force a hard redirect so stale cookies / React state can't bounce back
      window.location.href = '/login';
    }
  },
}));

export default useAuthStore;
