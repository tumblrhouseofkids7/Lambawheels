import api from '../utils/axios';

export const advanceService = {
  getAdvances: async (params) => {
    const response = await api.get('/advances', { params });
    return response.data;
  },
  
  addAdvance: async (advanceData) => {
    const response = await api.post('/advances', advanceData);
    return response.data;
  },
  
  updateAdvance: async (id, advanceData) => {
    const response = await api.put(`/advances/${id}`, advanceData);
    return response.data;
  },
  
  deleteAdvance: async (id) => {
    const response = await api.delete(`/advances/${id}`);
    return response.data;
  }
};
