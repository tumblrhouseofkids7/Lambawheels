import { create } from 'zustand';
import * as incomingArticleService from '../services/incomingArticleService';
import toast from 'react-hot-toast';

const useIncomingArticleStore = create((set) => ({
  articles: [],
  isLoading: false,
  error: null,

  fetchArticles: async (startDate, endDate) => {
    set({ isLoading: true, error: null });
    try {
      const data = await incomingArticleService.getArticles(startDate, endDate);
      set({ articles: data, isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
      toast.error('Failed to fetch incoming articles');
    }
  }
}));

export default useIncomingArticleStore;
