import { api } from '@/lib/api';

export interface LearningReportOverview {
  challenges_attempted: number;
  challenges_solved: number;
  completion_rate: number;
  all_time_solved: number;
  total_submissions: number;
  accepted_submissions: number;
  accuracy_rate: number;
  active_days_count: number;
  current_streak: number;
  best_streak: number;
}

export interface GitPlaygroundStats {
  scenarios_completed: number;
  total_scenarios: number;
  commands_executed: number;
  xp_earned: number;
}

export interface InterviewStats {
  sessions_completed: number;
  sessions_passed: number;
  pass_rate: number;
  average_score: number;
}

export interface ActivityTimelinePoint {
  date: string;
  submissions: number;
  accepted: number;
  interviews: number;
  git_completed: number;
}

export interface SkillMasteryItem {
  category: string;
  attempted: number;
  solved: number;
  mastery_percentage: number;
}

export interface RecommendedChallenge {
  id: number;
  title: string;
  slug: string;
  difficulty: string;
  category: string;
  xp_reward: number;
  description: string;
}

export interface UserBadgeItem {
  id: number;
  name: string;
  description: string;
  icon: string;
  earned_at: string;
}

export interface LearningReportData {
  user: {
    id: number;
    name: string;
    username: string;
    avatar_url: string | null;
    xp: number;
    level: number;
    created_at?: string;
  };
  range: string;
  start_date: string;
  end_date: string;
  overview: LearningReportOverview;
  git_playground: GitPlaygroundStats;
  interview: InterviewStats;
  activity_timeline: ActivityTimelinePoint[];
  skill_breakdown: SkillMasteryItem[];
  strongest_topics: SkillMasteryItem[];
  topics_needing_practice: SkillMasteryItem[];
  recommended_challenges: RecommendedChallenge[];
  recent_badges: UserBadgeItem[];
  methodology: Record<string, string>;
}

export const reportApi = {
  /**
   * Fetch personal learning analytics report.
   */
  async getLearningReport(
    params: { range?: string; start_date?: string; end_date?: string } = {},
    userId?: number
  ): Promise<LearningReportData> {
    const endpoint = userId ? `/reports/learning/${userId}` : '/reports/learning';
    const response = await api.get(endpoint, { params });
    return response.data.data;
  },
};
