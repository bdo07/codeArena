import { api } from '@/lib/api';
import { SearchParams, SearchResponse, SearchSuggestionsResponse } from '@/types/search';

export const searchApi = {
  search: async (params: SearchParams): Promise<SearchResponse> => {
    const res = await api.get<SearchResponse>('/search', { params });
    return res.data;
  },

  getSuggestions: async (query: string): Promise<SearchSuggestionsResponse> => {
    const res = await api.get<SearchSuggestionsResponse>('/search/suggestions', {
      params: { q: query },
    });
    return res.data;
  },
};
