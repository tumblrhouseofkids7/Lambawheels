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
      // ignore
    } finally {
      set({ user: null, isAuthenticated: false, error: null });
    }
  },

  updateProfile: async (userData) => {
    try {
      set({ isLoading: true, error: null });
      
      let finalData = { ...userData };

      // 1. If there's a profile picture, upload it first
      if (userData.profilePic instanceof File) {
        const formData = new FormData();
        formData.append('profilePic', userData.profilePic);
        
        const picRes = await api.post('/users/profile/pic', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        // update finalData with the returned url if needed, though backend saves it.
        finalData.profilePic = picRes.data.profilePic;
      }

      // 2. Update the rest of the profile
      const { data } = await api.put('/users/profile', {
        name: finalData.name,
        phone: finalData.phone,
      });

      set((state) => ({ 
        user: { 
          ...state.user, 
          ...data,
          profilePic: finalData.profilePic || state.user?.profilePic 
        }, 
        isLoading: false 
      }));
      return { success: true };
    } catch (err) {
      set({ isLoading: false, error: err.response?.data?.message || 'Failed to update profile' });
      return { success: false, error: err.response?.data?.message || 'Failed to update profile' };
    }
  },
}));

export default useAuthStore;
