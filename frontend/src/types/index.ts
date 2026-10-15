export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  xp: number;
  level: number;
  badges: Badge[];
  created_at?: string;
  joined_at?: string;
}

export interface Badge {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  earned_at?: string;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
}

export interface TestCase {
  id: number;
  position: number;
  input_data: string;
  expected_output: string;
  is_sample?: boolean;
  points: number;
}

export interface Challenge {
  id: number;
  slug: string;
  title: string;
  description: string;
  input_description?: string;
  output_description?: string;
  constraints?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  starter_code?: Record<string, string>;
  time_limit_ms: number;
  memory_limit_mb: number;
  is_published: boolean;
  tags: Tag[];
  sample_test_cases?: TestCase[];
  test_cases?: TestCase[];
  total_test_cases_count?: number;
  created_at?: string;
}

export interface UserProgressItem {
  solved: boolean;
  best_score: number;
  attempts_count: number;
  solved_at?: string;
}

export interface SubmissionTestResult {
  id: number;
  position: number;
  status: string;
  execution_time_ms?: number;
  memory_kb?: number;
  points_awarded: number;
  is_sample: boolean;
  input_data?: string;
  expected_output?: string;
}

export interface Submission {
  id: number;
  challenge_id: number;
  challenge: {
    id: number;
    slug: string;
    title: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
  };
  user?: {
    id: number;
    username: string;
    name: string;
  };
  language: string;
  source_code: string;
  status: 'Pending' | 'Running' | 'Accepted' | 'Wrong Answer' | 'Compilation Error' | 'Runtime Error' | 'Time Limit Exceeded' | 'Internal Error';
  score: number;
  execution_time_ms?: number;
  memory_kb?: number;
  error_message?: string;
  submitted_at?: string;
  finished_at?: string;
  test_results: SubmissionTestResult[];
}

export interface SampleTestResult {
  test_case_id: number;
  position: number;
  input_data: string;
  expected_output: string;
  actual_output: string;
  stderr?: string;
  status: string;
  execution_time_ms: number;
  passed: boolean;
}

export interface RunResult {
  status: 'Accepted' | 'Failed';
  passed: boolean;
  test_results: SampleTestResult[];
  total_execution_time_ms: number;
  max_memory_kb: number;
  is_demo_mode: boolean;
}

export interface SubmitResult {
  submission: Submission;
  gamification: {
    is_first_solve: boolean;
    xp_awarded: number;
    total_xp: number;
    level: number;
    new_badges: Badge[];
  };
  is_demo_mode: boolean;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface DashboardStats {
  user: User;
  stats: {
    solved_count: number;
    total_challenges: number;
    total_submissions: number;
    acceptance_rate: number;
    difficulty_breakdown: Record<'Easy' | 'Medium' | 'Hard', {
      solved: number;
      total: number;
      percentage: number;
    }>;
  };
  recent_submissions: Submission[];
}

export interface LeaderboardUser {
  rank: number;
  id: number;
  name: string;
  username: string;
  xp: number;
  level: number;
  solved_count: number;
  badges: Array<{
    id: number;
    name: string;
    slug: string;
    icon: string;
  }>;
}
