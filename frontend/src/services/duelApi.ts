import { api } from '@/lib/api';
import {
  CreateDuelPayload,
  DuelDetailResponse,
  DuelListItem,
  DuelSubmissionResponse,
} from '@/types/duel';

export interface DuelListResponse {
  data: DuelListItem[];
  meta: {
    current_page: number;
    last_page: number;
    total: number;
  };
}

export const duelApi = {
  listDuels: async (tab: 'active' | 'invites' | 'history' = 'active', page: number = 1): Promise<DuelListResponse> => {
    const res = await api.get<DuelListResponse>('/duels', {
      params: { tab, page },
    });
    return res.data;
  },

  getDuel: async (uuid: string): Promise<DuelDetailResponse> => {
    const res = await api.get<DuelDetailResponse>(`/duels/${uuid}`);
    return res.data;
  },

  createDuel: async (payload: CreateDuelPayload): Promise<{ message: string; duel: DuelListItem }> => {
    const res = await api.post<{ message: string; duel: DuelListItem }>('/duels', payload);
    return res.data;
  },

  acceptDuel: async (uuid: string): Promise<{ message: string; duel: DuelListItem }> => {
    const res = await api.post<{ message: string; duel: DuelListItem }>(`/duels/${uuid}/accept`);
    return res.data;
  },

  declineDuel: async (uuid: string): Promise<{ message: string; duel: DuelListItem }> => {
    const res = await api.post<{ message: string; duel: DuelListItem }>(`/duels/${uuid}/decline`);
    return res.data;
  },

  cancelDuel: async (uuid: string): Promise<{ message: string; duel: DuelListItem }> => {
    const res = await api.post<{ message: string; duel: DuelListItem }>(`/duels/${uuid}/cancel`);
    return res.data;
  },

  forfeitDuel: async (uuid: string): Promise<{ message: string; duel: DuelListItem }> => {
    const res = await api.post<{ message: string; duel: DuelListItem }>(`/duels/${uuid}/forfeit`);
    return res.data;
  },

  submitDuel: async (uuid: string, source_code: string): Promise<DuelSubmissionResponse> => {
    const res = await api.post<DuelSubmissionResponse>(`/duels/${uuid}/submit`, { source_code });
    return res.data;
  },
};
