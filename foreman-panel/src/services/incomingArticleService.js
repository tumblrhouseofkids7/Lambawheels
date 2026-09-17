import api from '../utils/axios';

export const getArticles = async () => {
  const { data } = await api.get('/incoming-articles');
  return data;
};

export const createArticle = async (articleData) => {
  const { data } = await api.post('/incoming-articles', articleData);
  return data;
};

export const getSuggestions = async () => {
  const { data } = await api.get('/incoming-articles/suggestions');
  return data;
};
