import api from '../utils/axios';

export const getArticles = async (startDate, endDate) => {
  const params = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  const { data } = await api.get('/outgoing-articles', { params });
  return data;
};

export const createArticle = async (articleData) => {
  const { data } = await api.post('/outgoing-articles', articleData);
  return data;
};

export const getSuggestions = async () => {
  const { data } = await api.get('/outgoing-articles/suggestions');
  return data;
};
