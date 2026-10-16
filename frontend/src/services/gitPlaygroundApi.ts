import { api } from '@/lib/api';

export interface GitProgressResponse {
  completed_scenarios: string[];
  total_xp_earned: number;
  commands_executed: number;
}

export interface CompleteScenarioResponse {
  success: boolean;
  scenario_id: string;
  is_first_completion: boolean;
  xp_awarded: number;
  user_xp: number;
  user_level: number;
  commands_count: number;
}

export const gitPlaygroundApi = {
  /**
   * Fetch authenticated user's git playground progress.
   */
  async getProgress(): Promise<GitProgressResponse> {
    const response = await api.get('/git-playground/progress');
    return response.data.data;
  },

  /**
   * Mark a scenario as completed and award XP.
   */
  async completeScenario(
    scenarioId: string,
    commandsCount: number
  ): Promise<CompleteScenarioResponse> {
    const response = await api.post(
      `/git-playground/scenarios/${scenarioId}/complete`,
      { commands_count: commandsCount }
    );
    return response.data.data;
  },
};
