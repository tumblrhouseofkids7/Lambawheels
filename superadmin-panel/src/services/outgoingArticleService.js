import api from '../utils/axios';

export const getArticles = async (startDate, endDate) => {
  const params = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  const { data } = await api.get('/outgoing-articles', { params });
  return data;
};
