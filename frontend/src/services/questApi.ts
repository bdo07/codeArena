import { api } from '@/lib/api';
import {
  QuestPathItem,
  QuestPathDetail,
  DailyMissionItem,
  ProgressionDashboardData,
} from '@/types';

export interface QuestsIndexResponse {
  paths: QuestPathItem[];
  daily_missions: DailyMissionItem[];
  progression: ProgressionDashboardData | null;
}

export interface ClaimStageRewardResponse {
  success: boolean;
  message: string;
  stage_xp_awarded: number;
  path_xp_awarded: number;
  total_xp_awarded: number;
  user_xp: number;
  user_level: number;
  path_completed: boolean;
  new_badges: Array<{
    id: number;
    name: string;
    slug: string;
    icon: string;
  }>;
}

export interface ClaimDailyMissionResponse {
  success: boolean;
  message: string;
  xp_awarded: number;
  user_xp: number;
  user_level: number;
}

export const questApi = {
  /**
   * Fetch all quest paths with summary progress and daily missions.
   */
  async getQuestsIndex(): Promise<QuestsIndexResponse> {
    const response = await api.get('/quests');
    return response.data.data;
  },

  /**
   * Fetch single quest path detail with stage node tree and challenge records.
   */
  async getPathDetail(slug: string): Promise<QuestPathDetail> {
    const response = await api.get(`/quests/${slug}`);
    return response.data.data;
  },

  /**
   * Fetch user's personal progression dashboard.
   */
  async getProgression(): Promise<ProgressionDashboardData | null> {
    const response = await api.get('/quests/progression');
    return response.data.data;
  },

  /**
   * Claim XP and badge rewards for a completed stage.
   */
  async claimStageReward(stageId: number): Promise<ClaimStageRewardResponse> {
    const response = await api.post(`/quests/stages/${stageId}/claim`);
    return response.data.data;
  },

  /**
   * Claim reward for an accomplished daily mission.
   */
  async claimDailyMission(missionId: number): Promise<ClaimDailyMissionResponse> {
    const response = await api.post(`/quests/daily-missions/${missionId}/claim`);
    return response.data.data;
  },
};
