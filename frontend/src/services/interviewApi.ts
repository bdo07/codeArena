import { api } from '@/lib/api';

export interface StartInterviewParams {
  topic?: 'algorithms' | 'frontend' | 'backend' | 'sql' | 'fullstack';
  difficulty?: 'Beginner' | 'Easy' | 'Medium' | 'Hard' | 'Expert';
  duration_minutes?: 15 | 30 | 60;
}

export interface InterviewQuestion {
  id: number;
  position: number;
  title: string;
  description: string;
  question_type: 'code' | 'sql' | 'quiz' | 'conceptual';
  language?: string;
  starter_code?: string;
  user_answer?: string;
  max_score: number;
  rubric?: string[] | null;
  // Available after submission:
  score?: number;
  is_correct?: boolean;
  evaluation_notes?: string;
  reference_solution?: string | null;
  editorial?: string | null;
  hints?: string[] | null;
}

export interface ActiveInterviewSession {
  id: number;
  session_token: string;
  topic: string;
  difficulty: string;
  duration_minutes: number;
  started_at: string;
  expires_at: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  questions: InterviewQuestion[];
}

export interface InterviewFeedbackSummary {
  grade: string;
  time_taken_seconds: number;
  passed: boolean;
  score_percentage: number;
}

export interface CompletedInterviewResult {
  id: number;
  session_token: string;
  topic: string;
  difficulty: string;
  duration_minutes: number;
  started_at: string;
  completed_at?: string;
  status: string;
  score: number;
  passed: boolean;
  xp_awarded: number;
  feedback_summary: InterviewFeedbackSummary;
  questions: InterviewQuestion[];
}

export interface InterviewHistoryItem {
  session_token: string;
  topic: string;
  difficulty: string;
  duration_minutes: number;
  score: number;
  passed: boolean;
  xp_awarded: number;
  completed_at: string;
}

export interface InterviewHistoryResponse {
  total_completed: number;
  average_score: number;
  passed_count: number;
  sessions: InterviewHistoryItem[];
}

export const interviewApi = {
  /**
   * Start a new mock interview session.
   */
  async start(params: StartInterviewParams): Promise<ActiveInterviewSession> {
    const response = await api.post('/interviews/start', params);
    return response.data.data;
  },

  /**
   * Autosave an answer for a specific question.
   */
  async saveAnswer(token: string, questionId: number, answer: string): Promise<boolean> {
    const response = await api.post(`/interviews/${token}/save-answer`, {
      question_id: questionId,
      answer,
    });
    return response.data.saved;
  },

  /**
   * Finish the interview session and compute score report.
   */
  async finish(token: string, answers: Record<number, string>): Promise<CompletedInterviewResult> {
    const response = await api.post(`/interviews/${token}/finish`, { answers });
    return response.data.data;
  },

  /**
   * Get past interview history for authenticated user.
   */
  async getHistory(): Promise<InterviewHistoryResponse> {
    const response = await api.get('/interviews/history');
    return response.data.data;
  },

  /**
   * Get interview result report by session token.
   */
  async getResult(token: string): Promise<CompletedInterviewResult> {
    const response = await api.get(`/interviews/${token}/result`);
    return response.data.data;
  },
};
