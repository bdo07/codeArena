import { api } from '@/lib/api';

export type CardTemplate = 'modern' | 'terminal' | 'minimal' | 'badge_spotlight';
export type CardTheme = 'dark' | 'light' | 'obsidian' | 'violet';
export type CardLayout = 'horizontal' | 'square';

export type CardField =
  | 'avatar'
  | 'tagline'
  | 'solved'
  | 'xp_level'
  | 'streak'
  | 'badges'
  | 'skills'
  | 'git'
  | 'interviews';

export interface ShareableCardSettings {
  id: number;
  user_id: number;
  share_token: string;
  is_public: boolean;
  template: CardTemplate;
  card_theme: CardTheme;
  layout: CardLayout;
  selected_fields: CardField[];
  custom_tagline?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ShareCardBadge {
  id: number;
  name: string;
  icon: string;
  description: string;
  earned_at?: string;
}

export interface ShareableCardStats {
  solved_challenges: number;
  total_submissions: number;
  success_rate: number;
  current_streak: number;
  best_streak: number;
  badges: ShareCardBadge[];
  skills: string[];
  quest_paths_completed: number;
  git_scenarios_completed: number;
  interviews_passed: number;
}

export interface ShareCardData {
  card: ShareableCardSettings;
  stats: ShareableCardStats;
}

export interface PublicShareCardData {
  user: {
    name: string;
    username: string;
    avatar_url: string | null;
    xp: number;
    level: number;
    created_at?: string;
  };
  card: ShareableCardSettings;
  stats: ShareableCardStats;
}

export interface UpdateCardSettingsParams {
  is_public?: boolean;
  template?: CardTemplate;
  card_theme?: CardTheme;
  layout?: CardLayout;
  selected_fields?: CardField[];
  custom_tagline?: string;
}

export const shareCardApi = {
  /**
   * Get authenticated user's card settings and calculated statistics.
   */
  async getSettings(): Promise<ShareCardData> {
    const response = await api.get('/share-card/settings');
    return response.data.data;
  },

  /**
   * Update card customization settings.
   */
  async updateSettings(params: UpdateCardSettingsParams): Promise<ShareCardData> {
    const response = await api.put('/share-card/settings', params);
    return response.data.data;
  },

  /**
   * Regenerate share token (revokes previous public URL).
   */
  async regenerateToken(): Promise<{ share_token: string }> {
    const response = await api.post('/share-card/regenerate-token');
    return response.data.data;
  },

  /**
   * Fetch public card data by token.
   */
  async getPublicCard(token: string): Promise<PublicShareCardData> {
    const response = await api.get(`/share-card/public/${token}`);
    return response.data.data;
  },
};
