export type DuelStatus = 'pending' | 'active' | 'completed' | 'timed_out' | 'declined' | 'canceled';

export interface DuelUserBrief {
  id: number;
  name: string;
  username: string;
  avatar_url?: string | null;
}

export interface DuelParticipant extends DuelUserBrief {
  score: number;
  submitted_at: string | null;
  has_submitted: boolean;
  code: string | null;
  submission_status?: string | null;
}

export interface DuelChallengeSampleTestCase {
  id: number;
  input_data: string;
  expected_output: string;
  explanation?: string | null;
}

export interface DuelChallenge {
  id: number;
  title: string;
  slug: string;
  description: string;
  difficulty: 'Beginner' | 'Easy' | 'Medium' | 'Hard' | 'Expert';
  category: string;
  starter_code?: Record<string, string> | null;
  sample_test_cases: DuelChallengeSampleTestCase[];
}

export interface DuelInfo {
  id: number;
  uuid: string;
  status: DuelStatus;
  language: string;
  duration_seconds: number;
  started_at: string | null;
  ends_at: string | null;
  time_remaining_seconds: number;
  result_reason?: string | null;
  winner: DuelUserBrief | null;
}

export interface DuelDetailResponse {
  duel: DuelInfo;
  challenge: DuelChallenge;
  creator: DuelParticipant;
  opponent: DuelParticipant | null;
  my_role: 'creator' | 'opponent' | 'spectator';
}

export interface DuelListItem {
  id: number;
  uuid: string;
  status: DuelStatus;
  language: string;
  duration_seconds: number;
  creator_score: number;
  opponent_score: number;
  creator: DuelUserBrief;
  opponent: DuelUserBrief | null;
  challenge: {
    id: number;
    title: string;
    slug: string;
    difficulty: string;
    category: string;
  };
  winner: DuelUserBrief | null;
  result_reason: string | null;
  created_at: string;
  started_at?: string | null;
  ends_at?: string | null;
}

export interface CreateDuelPayload {
  opponent_username?: string;
  challenge_id?: number;
  difficulty?: string;
  language?: string;
  duration_seconds?: number;
}

export interface DuelSubmissionResponse {
  message: string;
  submission: {
    id: number;
    status: string;
    score: number;
    execution_time_ms: number;
    memory_kb: number;
    error_message?: string | null;
    test_results: Array<{
      id: number;
      status: string;
      execution_time_ms: number;
      points_awarded: number;
    }>;
  };
  duel_status: DuelStatus;
  winner_id: number | null;
  result_reason?: string | null;
}
