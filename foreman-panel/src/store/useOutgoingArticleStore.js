import { create } from 'zustand';
import * as outgoingArticleService from '../services/outgoingArticleService';
import toast from 'react-hot-toast';

const useOutgoingArticleStore = create((set, get) => ({
  articles: [],
  suggestions: { 
    goods: [], 
    hsn: [], 
    vehicles: [], 
    buyerNames: [], 
    consigneeNames: [], 
    addresses: [], 
    cities: [], 
    states: [], 
    stateCodes: [], 
    gstins: [],
    buyers: [],
    consignees: []
  },
  isLoading: false,
  error: null,

  fetchSuggestions: async () => {
    try {
      const data = await outgoingArticleService.getSuggestions();
      const currentArticles = get().articles || [];
      
      let buyers = data.buyers || [];
      let consignees = data.consignees || [];

      // Fallback/enrich from loaded articles if server did not provide buyers
      if (!buyers.length && currentArticles.length > 0) {
        const buyerMap = new Map();
        currentArticles.forEach(art => {
          if (art.buyerDetails?.name) {
            const key = art.buyerDetails.name.trim().toLowerCase();
            if (!buyerMap.has(key)) {
              buyerMap.set(key, { ...art.buyerDetails });
            }
          }
        });
        buyers = Array.from(buyerMap.values());
      }

      if (!consignees.length && currentArticles.length > 0) {
        const consigneeMap = new Map();
        currentArticles.forEach(art => {
          if (art.consigneeDetails?.name) {
            const key = art.consigneeDetails.name.trim().toLowerCase();
            if (!consigneeMap.has(key)) {
              consigneeMap.set(key, { ...art.consigneeDetails });
            }
          }
        });
        consignees = Array.from(consigneeMap.values());
      }

      set({ 
        suggestions: {
          ...data,
          buyers,
          consignees
        } 
      });
    } catch (err) {
      console.error('Failed to fetch suggestions:', err);
    }
  },

  fetchArticles: async (startDate, endDate) => {
    set({ isLoading: true, error: null });
    try {
      const data = await outgoingArticleService.getArticles(startDate, endDate);
      const currentSuggestions = get().suggestions || {};

      let buyers = currentSuggestions.buyers || [];
      let consignees = currentSuggestions.consignees || [];

      if (!buyers.length && data.length > 0) {
        const buyerMap = new Map();
        data.forEach(art => {
          if (art.buyerDetails?.name) {
            const key = art.buyerDetails.name.trim().toLowerCase();
            if (!buyerMap.has(key)) {
              buyerMap.set(key, { ...art.buyerDetails });
            }
          }
        });
        buyers = Array.from(buyerMap.values());
      }

      if (!consignees.length && data.length > 0) {
        const consigneeMap = new Map();
        data.forEach(art => {
          if (art.consigneeDetails?.name) {
            const key = art.consigneeDetails.name.trim().toLowerCase();
            if (!consigneeMap.has(key)) {
              consigneeMap.set(key, { ...art.consigneeDetails });
            }
          }
        });
        consignees = Array.from(consigneeMap.values());
      }

      set({ 
        articles: data, 
        suggestions: {
          ...currentSuggestions,
          buyers,
          consignees
        },
        isLoading: false 
      });
    } catch (err) {
      set({ error: err.message, isLoading: false });
      toast.error('Failed to fetch outgoing articles');
    }
  },

  addArticle: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const result = await outgoingArticleService.createArticle(payload);
      
      const currentSuggestions = get().suggestions || {};
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

      const existingBuyers = [...(currentSuggestions?.buyers || [])];
      if (payload.buyerDetails?.name) {
        const bKey = payload.buyerDetails.name.trim().toLowerCase();
        const bIdx = existingBuyers.findIndex(b => b.name?.trim().toLowerCase() === bKey);
        const newBuyerEntry = { ...payload.buyerDetails };
        if (bIdx >= 0) {
          existingBuyers[bIdx] = newBuyerEntry;
        } else {
          existingBuyers.unshift(newBuyerEntry);
        }
      }

      const existingConsignees = [...(currentSuggestions?.consignees || [])];
      if (payload.consigneeDetails?.name) {
        const cKey = payload.consigneeDetails.name.trim().toLowerCase();
        const cIdx = existingConsignees.findIndex(c => c.name?.trim().toLowerCase() === cKey);
        const newConsigneeEntry = { ...payload.consigneeDetails };
        if (cIdx >= 0) {
          existingConsignees[cIdx] = newConsigneeEntry;
        } else {
          existingConsignees.unshift(newConsigneeEntry);
        }
      }

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
        buyers: existingBuyers,
        consignees: existingConsignees
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
