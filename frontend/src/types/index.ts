export type Difficulty = 'Beginner' | 'Easy' | 'Medium' | 'Hard' | 'Expert';
export type ChallengeType = 'code' | 'sql' | 'web' | 'quiz';

export interface UserStreak {
  current_streak: number;
  longest_streak: number;
  last_activity_date?: string;
}

export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  xp: number;
  level: number;
  avatar_url?: string | null;
  tagline?: string | null;
  bio?: string | null;
  location?: string | null;
  website_url?: string | null;
  github_url?: string | null;
  linkedin_url?: string | null;
  favorite_languages?: string[];
  is_activity_public?: boolean;
  streak?: UserStreak;
  badges: Badge[];
  created_at?: string;
  joined_at?: string;
}

export interface UserProfileData {
  id: number;
  name: string;
  username: string;
  avatar_url?: string | null;
  tagline?: string | null;
  bio?: string | null;
  location?: string | null;
  website_url?: string | null;
  github_url?: string | null;
  linkedin_url?: string | null;
  favorite_languages: string[];
  is_activity_public: boolean;
  xp: number;
  level: number;
  role: string;
  joined_at: string;
  solved_count: number;
  accepted_count: number;
  total_submissions: number;
  success_rate: number;
  streak: UserStreak;
  badges: Badge[];
  solved_challenges?: Array<{
    id: number;
    title: string;
    slug: string;
    difficulty: Difficulty;
    tags: string[];
    best_score: number;
    solved_at: string;
  }>;
  recent_activity?: Array<{
    id: number;
    challenge_id: number;
    challenge_title: string;
    challenge_slug: string;
    challenge_difficulty: Difficulty;
    language: string;
    status: string;
    score: number;
    execution_time_ms: number;
    submitted_at: string;
  }>;
  is_owner: boolean;
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
  difficulty: Difficulty;
  category: string;
  challenge_type: ChallengeType;
  estimated_time_min?: number;
  starter_code?: Record<string, string>;
  hints?: string[];
  explanation?: string;
  sql_schema?: string;
  sql_seed?: string;
  web_template?: {
    html: string;
    css: string;
    js: string;
  };
  quiz_data?: {
    questions: Array<{
      id: string | number;
      question: string;
      options: string[];
    }>;
  };
  is_daily?: boolean;
  daily_date?: string;
  supported_languages?: string[];
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
    difficulty: Difficulty;
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
    streak?: {
      current_streak: number;
      longest_streak: number;
      last_activity_date?: string;
    };
  };
  is_demo_mode: boolean;
}

export interface SqlResult {
  success: boolean;
  passed: boolean;
  error: string | null;
  user_result?: {
    columns: string[];
    rows: any[];
    row_count: number;
  };
  expected_result?: {
    columns: string[];
    rows: any[];
    row_count: number;
  };
  execution_time_ms: number;
}

export interface QuizResult {
  passed: boolean;
  score: number;
  correct_count: number;
  total_questions: number;
  review: Array<{
    id: string | number;
    user_answer: number;
    correct_answer: number;
    is_correct: boolean;
    explanation?: string;
  }>;
  submission: Submission;
  gamification: any;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  category_counts?: Record<string, number>;
  difficulty_counts?: Record<string, number>;
  type_counts?: Record<string, number>;
}

export interface DashboardStats {
  user: User;
  stats: {
    solved_count: number;
    total_challenges: number;
    total_submissions: number;
    acceptance_rate: number;
    difficulty_breakdown: Record<Difficulty, {
      solved: number;
      total: number;
      percentage: number;
    }>;
  };
  recent_submissions: Submission[];
  streak?: {
    current_streak: number;
    longest_streak: number;
    last_activity_date?: string;
  };
}

export interface LeaderboardUser {
  rank: number;
  id: number;
  name: string;
  username: string;
  avatar_url?: string | null;
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

export interface LanguageCatalogItem {
  id?: number;
  name: string;
  slug: string;
  category: string;
  monaco_mode: string;
  judge0_id?: number | null;
  evaluator_type: 'judge0' | 'sqlite_sandbox' | 'client_sandbox' | 'quiz_engine' | 'none';
  version: string;
  is_executable: boolean;
  is_active: boolean;
}

export interface Roadmap {
  id: number;
  slug: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  difficulty: Difficulty;
  estimated_hours: number;
  modules_count: number;
  total_challenges: number;
  solved_challenges: number;
  progress_percentage: number;
}

export interface RoadmapDetailModule {
  id: number;
  title: string;
  description: string;
  position: number;
  challenges: Array<{
    id: number;
    slug: string;
    title: string;
    difficulty: Difficulty;
    challenge_type: ChallengeType;
    estimated_time_min: number;
    is_solved: boolean;
  }>;
}

export interface RoadmapDetail {
  id: number;
  slug: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  difficulty: Difficulty;
  estimated_hours: number;
  modules: RoadmapDetailModule[];
}

export interface CollectionItem {
  id: number;
  user_id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  is_public: boolean;
  challenges_count: number;
  challenges?: Challenge[];
}

export interface ContestItem {
  id: number;
  slug: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  status: 'active' | 'upcoming' | 'finished';
  banner_color: string;
  challenges_count: number;
  participants_count: number;
  is_registered: boolean;
  my_score?: number;
  challenges?: Array<{
    id: number;
    slug: string;
    title: string;
    difficulty: Difficulty;
    category: string;
    points: number;
    position: number;
  }>;
}

export interface NotificationItem {
  id: number;
  type: string;
  title: string;
  message: string;
  data?: any;
  is_read: boolean;
  created_at: string;
}

export interface DiscussionTopic {
  id: number;
  user_id: number;
  user: {
    id: number;
    name: string;
    username: string;
    xp: number;
  };
  title: string;
  content: string;
  category: string;
  upvotes_count: number;
  is_pinned: boolean;
  created_at: string;
  replies?: DiscussionReplyItem[];
}

export interface DiscussionReplyItem {
  id: number;
  discussion_id: number;
  user_id: number;
  user: {
    id: number;
    name: string;
    username: string;
    xp: number;
  };
  content: string;
  upvotes_count: number;
  is_solution: boolean;
  created_at: string;
}

export interface AdminAnalytics {
  overview: {
    total_users: number;
    total_challenges: number;
    published_challenges: number;
    total_submissions: number;
    acceptance_rate: number;
  };
  status_breakdown: Record<string, number>;
  category_breakdown: Record<string, number>;
  difficulty_breakdown: Record<string, number>;
  type_breakdown: Record<string, number>;
  activity_trend: Array<{ date: string; submissions: number }>;
  evaluator_health: {
    online: boolean;
    version?: string;
    supported_languages_count?: number;
    error?: string;
  };
}
