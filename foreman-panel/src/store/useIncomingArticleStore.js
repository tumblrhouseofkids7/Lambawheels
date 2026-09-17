import { create } from 'zustand';
import * as incomingArticleService from '../services/incomingArticleService';
import toast from 'react-hot-toast';

const useIncomingArticleStore = create((set, get) => ({
  articles: [],
  suggestions: { particulars: [], purchasedFrom: [] },
  isLoading: false,
  error: null,

  fetchSuggestions: async () => {
    try {
      const data = await incomingArticleService.getSuggestions();
      set({ suggestions: data });
    } catch (err) {
      console.error('Failed to fetch suggestions:', err);
    }
  },

  fetchArticles: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await incomingArticleService.getArticles();
      set({ articles: data, isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
      toast.error('Failed to fetch articles');
    }
  },

  addArticle: async (articleData) => {
    set({ isLoading: true, error: null });
    try {
      const newArticle = await incomingArticleService.createArticle(articleData);
      
      // Update suggestions if a new unique value is added
      const currentSuggestions = get().suggestions;
      const newSuggestions = {
        particulars: currentSuggestions.particulars.includes(articleData.particulars) 
          ? currentSuggestions.particulars 
          : [...currentSuggestions.particulars, articleData.particulars],
        purchasedFrom: currentSuggestions.purchasedFrom.includes(articleData.purchasedFrom) 
          ? currentSuggestions.purchasedFrom 
          : [...currentSuggestions.purchasedFrom, articleData.purchasedFrom],
      };

      set({ 
        articles: [newArticle, ...get().articles], 
        suggestions: newSuggestions,
        isLoading: false 
      });
      toast.success('Incoming article added successfully');
      return true;
    } catch (err) {
      set({ isLoading: false });
      toast.error(err.response?.data?.message || 'Failed to add article');
      return false;
    }
  }
}));

export default useIncomingArticleStore;
