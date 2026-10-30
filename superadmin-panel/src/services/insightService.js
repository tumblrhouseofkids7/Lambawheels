import api from '../utils/axios';

export const insightService = {
  getExecutiveInsights: (params) => api.get('/insights/executive', { params }),
};

export default insightService;
