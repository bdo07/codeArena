export interface SearchCounts {
  challenges: number;
  languages: number;
  topics: number;
  users: number;
  total: number;
}

export interface SearchChallenge {
  id: number;
  title: string;
  slug: string;
  description: string;
  difficulty: string;
  category: string;
  challenge_type: string;
  xp_reward: number;
  tags: { id: number; name: string; slug: string }[];
  user_status?: 'solved' | 'attempted' | 'unsolved';
}

export interface SearchLanguage {
  id: number;
  name: string;
  slug: string;
  category: string;
  icon?: string;
  description?: string;
  is_executable?: boolean;
}

export interface SearchTopic {
  id: number;
  name: string;
  slug: string;
  challenges_count: number;
}

export interface SearchUser {
  id: number;
  name: string;
  username: string;
  avatar_url: string | null;
  tagline?: string;
  xp: number;
  level: number;
  joined_at?: string;
}

export interface SearchSuggestionsResponse {
  query: string;
  challenges: SearchChallenge[];
  languages: SearchLanguage[];
  topics: SearchTopic[];
  users: SearchUser[];
}

export interface SearchPaginatedResult<T> {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number | null;
  last_page: number;
  last_page_url: string;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number | null;
  total: number;
}

export interface SearchResults {
  challenges?: SearchChallenge[] | SearchPaginatedResult<SearchChallenge>;
  languages?: SearchLanguage[] | SearchPaginatedResult<SearchLanguage>;
  topics?: SearchTopic[] | SearchPaginatedResult<SearchTopic>;
  users?: SearchUser[] | SearchPaginatedResult<SearchUser>;
}

export interface SearchResponse {
  query: string;
  type: 'all' | 'challenges' | 'languages' | 'topics' | 'users';
  counts: SearchCounts;
  results: SearchResults;
}

export interface SearchParams {
  q?: string;
  type?: 'all' | 'challenges' | 'languages' | 'topics' | 'users';
  difficulty?: string;
  category?: string;
  language?: string;
  topic?: string;
  status?: 'all' | 'solved' | 'attempted' | 'unsolved';
  sort?: 'relevance' | 'newest' | 'difficulty_asc' | 'difficulty_desc' | 'xp';
  page?: number;
  per_page?: number;
}
