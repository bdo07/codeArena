export interface DominantError {
  type: string;
  count: number;
  title: string;
  description: string;
}

export interface WeaknessTopic {
  name: string;
  slug: string;
  type: 'tag' | 'category';
  total_attempts: number;
  accepted_attempts: number;
  failed_attempts: number;
  unique_challenges_attempted: number;
  unique_challenges_solved: number;
  success_rate: number;
  error_breakdown: {
    wrong_answer: number;
    time_limit_exceeded: number;
    runtime_error: number;
    compilation_error: number;
    other: number;
  };
  dominant_error: DominantError;
  trend: 'improving' | 'declining' | 'steady';
  trend_message: string;
  status: 'weakness' | 'strength' | 'insufficient_data';
  severity?: 'high' | 'moderate';
  diagnosis?: string;
  note?: string;
  last_attempt_at?: string | null;
}

export interface WeaknessRecommendation {
  challenge: {
    id: number;
    title: string;
    slug: string;
    difficulty: string;
    category: string;
    challenge_type: string;
    xp_reward: number;
  };
  topic: string;
  severity: string;
  reason: string;
}

export interface ProgressTimelineItem {
  period: string;
  total: number;
  accepted: number;
  accuracy: number;
}

export interface WeaknessInsightsData {
  is_onboarding: boolean;
  onboarding?: {
    message: string;
    current_submissions: number;
    required_submissions: number;
    progress_percentage: number;
  };
  summary: {
    total_submissions: number;
    total_challenges_solved: number;
    overall_accuracy: number;
    weaknesses_count: number;
    strengths_count: number;
    insufficient_data_count: number;
  };
  weaknesses: WeaknessTopic[];
  strengths: WeaknessTopic[];
  insufficient_data: WeaknessTopic[];
  recommendations: WeaknessRecommendation[];
  progress_timeline: ProgressTimelineItem[];
}

export interface WeaknessInsightsResponse {
  status: 'success' | 'error';
  data: WeaknessInsightsData;
}
