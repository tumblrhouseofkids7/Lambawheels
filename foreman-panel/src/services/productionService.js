import api from '../utils/axios';

export const getProductions = async (paramsOrDate) => {
  // Support both old string (date) and new object (params)
  if (typeof paramsOrDate === 'string') {
    const url = paramsOrDate ? `/production?date=${paramsOrDate}` : '/production';
    const { data } = await api.get(url);
    return data;
  } else {
    const { data } = await api.get('/production', { params: paramsOrDate });
    return data;
  }
};

export const addProduction = async (productionData) => {
  const { data } = await api.post('/production', productionData);
  return data;
};

export const updateProduction = async (id, productionData) => {
  const { data } = await api.put(`/production/${id}`, productionData);
  return data;
};
