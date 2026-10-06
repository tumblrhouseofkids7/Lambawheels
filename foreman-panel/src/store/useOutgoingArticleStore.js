import { create } from 'zustand';
import * as outgoingArticleService from '../services/outgoingArticleService';
import toast from 'react-hot-toast';

const useOutgoingArticleStore = create((set, get) => ({
  articles: [],
  suggestions: { goods: [], hsn: [], vehicles: [], buyerNames: [], consigneeNames: [], addresses: [], cities: [], states: [], stateCodes: [], gstins: [] },
  isLoading: false,
  error: null,

  fetchSuggestions: async () => {
    try {
      const data = await outgoingArticleService.getSuggestions();
      set({ suggestions: data });
    } catch (err) {
      console.error('Failed to fetch suggestions:', err);
    }
  },

  fetchArticles: async (startDate, endDate) => {
    set({ isLoading: true, error: null });
    try {
      const data = await outgoingArticleService.getArticles(startDate, endDate);
      set({ articles: data, isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
      toast.error('Failed to fetch outgoing articles');
    }
  },

  addArticle: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const result = await outgoingArticleService.createArticle(payload);
      
      const currentSuggestions = get().suggestions;
      const newGoods = new Set(currentSuggestions?.goods || []);
      const newHsn = new Set(currentSuggestions?.hsn || []);
      const newVehicles = new Set(currentSuggestions?.vehicles || []);
      const newBuyerNames = new Set(currentSuggestions?.buyerNames || []);
      const newConsigneeNames = new Set(currentSuggestions?.consigneeNames || []);
      const newAddresses = new Set(currentSuggestions?.addresses || []);
      const newCities = new Set(currentSuggestions?.cities || []);
      const newStates = new Set(currentSuggestions?.states || []);
      const newStateCodes = new Set(currentSuggestions?.stateCodes || []);
      const newGstins = new Set(currentSuggestions?.gstins || []);

      let articlesToAdd = [];

      if (Array.isArray(result)) {
        articlesToAdd = result;
      } else {
        articlesToAdd = [result];
      }

      if (payload.invoiceDetails?.vehicleNumber) newVehicles.add(payload.invoiceDetails.vehicleNumber);
      if (payload.buyerDetails?.name) newBuyerNames.add(payload.buyerDetails.name);
      if (payload.buyerDetails?.address) newAddresses.add(payload.buyerDetails.address);
      if (payload.buyerDetails?.city) newCities.add(payload.buyerDetails.city);
      if (payload.buyerDetails?.state) newStates.add(payload.buyerDetails.state);
      if (payload.buyerDetails?.stateCode) newStateCodes.add(payload.buyerDetails.stateCode);
      if (payload.buyerDetails?.gstin) newGstins.add(payload.buyerDetails.gstin);
      
      if (payload.consigneeDetails?.name) newConsigneeNames.add(payload.consigneeDetails.name);

      if (payload.goodsDetails) {
        payload.goodsDetails.forEach(art => {
          if (art.description) newGoods.add(art.description);
          if (art.hsnCode) newHsn.add(art.hsnCode);
        });
      }

      const newSuggestions = {
        goods: Array.from(newGoods),
        hsn: Array.from(newHsn),
        vehicles: Array.from(newVehicles),
        buyerNames: Array.from(newBuyerNames),
        consigneeNames: Array.from(newConsigneeNames),
        addresses: Array.from(newAddresses),
        cities: Array.from(newCities),
        states: Array.from(newStates),
        stateCodes: Array.from(newStateCodes),
        gstins: Array.from(newGstins),
      };

      set({ 
        articles: [...articlesToAdd, ...get().articles], 
        suggestions: newSuggestions,
        isLoading: false 
      });
      toast.success('Outgoing invoice generated successfully');
      return true;
    } catch (err) {
      set({ isLoading: false });
      toast.error(err.response?.data?.message || 'Failed to generate outgoing invoice');
      return false;
    }
  }
}));

export default useOutgoingArticleStore;
