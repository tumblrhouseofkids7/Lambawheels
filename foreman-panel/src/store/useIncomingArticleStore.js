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

  fetchArticles: async (startDate, endDate) => {
    set({ isLoading: true, error: null });
    try {
      const data = await incomingArticleService.getArticles(startDate, endDate);
      set({ articles: data, isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
      toast.error('Failed to fetch articles');
    }
  },

  addArticle: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const result = await incomingArticleService.createArticle(payload);
      
      const currentSuggestions = get().suggestions;
      const newParticulars = new Set(currentSuggestions.particulars);
      const newPurchasedFrom = new Set(currentSuggestions.purchasedFrom);

      let articlesToAdd = [];

      if (Array.isArray(result)) {
        articlesToAdd = result;
        if (payload.billDetails) {
          newPurchasedFrom.add(payload.billDetails.purchasedFrom);
        }
        if (payload.articles) {
          payload.articles.forEach(art => {
            if (art.particulars) newParticulars.add(art.particulars);
          });
        }
      } else {
        articlesToAdd = [result];
        newParticulars.add(payload.particulars);
        newPurchasedFrom.add(payload.purchasedFrom);
      }

      const newSuggestions = {
        particulars: Array.from(newParticulars),
        purchasedFrom: Array.from(newPurchasedFrom),
      };

      set({ 
        articles: [...articlesToAdd, ...get().articles], 
        suggestions: newSuggestions,
        isLoading: false 
      });
      toast.success('Incoming article(s) added successfully');
      return true;
    } catch (err) {
      set({ isLoading: false });
      toast.error(err.response?.data?.message || 'Failed to add article(s)');
      return false;
    }
  }
}));

export default useIncomingArticleStore;
