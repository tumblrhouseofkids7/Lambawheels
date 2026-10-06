import { create } from 'zustand';
import * as outgoingArticleService from '../services/outgoingArticleService';
import toast from 'react-hot-toast';

const useOutgoingArticleStore = create((set) => ({
  articles: [],
  isLoading: false,
  error: null,

  fetchArticles: async (startDate, endDate) => {
    set({ isLoading: true, error: null });
    try {
      const data = await outgoingArticleService.getArticles(startDate, endDate);
      set({ articles: data, isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
      toast.error('Failed to fetch outgoing articles');
    }
  }
}));

export default useOutgoingArticleStore;
