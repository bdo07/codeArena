import { api } from '@/lib/api';
import { WeaknessInsightsData, WeaknessInsightsResponse } from '@/types/weakness';

export const weaknessApi = {
  getInsights: async (fresh: boolean = false): Promise<WeaknessInsightsData> => {
    const res = await api.get<WeaknessInsightsResponse>('/insights/weaknesses', {
      params: fresh ? { fresh: true } : {},
    });
    return res.data.data;
  },
};
