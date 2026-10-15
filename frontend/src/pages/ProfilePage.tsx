import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  Sparkles,
  Trophy,
  CheckCircle2,
  Award,
  Zap,
  ShieldCheck,
  Flame,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { Badge as BadgeType } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  getDifficultyLabel,
  getTranslatedBadge,
  getTranslatedTagName,
} from '@/locales/challengeTranslations';

interface ProfileData {
  id: number;
  name: string;
  username: string;
  xp: number;
  level: number;
  role: string;
  joined_at: string;
  solved_count: number;
  accepted_count: number;
  total_submissions: number;
  badges: BadgeType[];
  solved_challenges: Array<{
    id: number;
    title: string;
    slug: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    tags: string[];
    best_score: number;
    solved_at: string;
  }>;
}

export const ProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { t, i18n } = useTranslation();

  const { data, isLoading, isError } = useQuery<{ profile: ProfileData }>({
    queryKey: ['profile', username],
    queryFn: async () => {
      const res = await api.get(`/users/${username}`);
      return res.data;
    },
  });

  const getBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case 'Award':
        return <Award className="w-5 h-5 text-violet-500 dark:text-violet-400" />;
      case 'Zap':
        return <Zap className="w-5 h-5 text-amber-500 dark:text-amber-400" />;
      case 'Trophy':
        return <Trophy className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />;
      default:
        return <Flame className="w-5 h-5 text-violet-500 dark:text-violet-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-zinc-500 dark:text-zinc-400">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <span className="text-xs">{t('profile.loading')}</span>
      </div>
    );
  }

  if (isError || !data?.profile) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <p className="text-rose-500 dark:text-rose-400 text-sm">{t('profile.userNotFound', { username })}</p>
        <Link to="/leaderboard">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            {t('profile.backToLeaderboard')}
          </Button>
        </Link>
      </div>
    );
  }

  const { profile } = data;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-left">
      {/* Profile Overview Card */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-violet-100 dark:bg-violet-950/60 border border-violet-300 dark:border-violet-700/50 flex items-center justify-center text-xl font-bold text-violet-700 dark:text-violet-300">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{profile.name}</h1>
                {profile.role === 'admin' && (
                  <Badge variant="violet" size="sm">
                    {t('profile.admin')}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">@{profile.username}</p>
              <div className="flex items-center gap-3 text-xs text-zinc-500 mt-2">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {t('profile.joined', { date: new Date(profile.joined_at).toLocaleDateString(i18n.language) })}
                </span>
              </div>
            </div>
          </div>

          {/* XP & Level Pill */}
          <div className="flex items-center gap-3 sm:text-right">
            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
              <div className="flex items-center gap-1.5 text-xs text-violet-600 dark:text-violet-400 font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                {t('common.lvl')} {profile.level}
              </div>
              <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100 font-mono mt-0.5">
                {profile.xp.toLocaleString()} XP
              </div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800 text-center">
          <div>
            <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100 font-mono">
              {profile.solved_count}
            </div>
            <div className="text-[11px] text-zinc-500">{t('profile.challengesSolved')}</div>
          </div>
          <div>
            <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100 font-mono">
              {profile.accepted_count}
            </div>
            <div className="text-[11px] text-zinc-500">{t('profile.acceptedSolves')}</div>
          </div>
          <div>
            <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100 font-mono">
              {profile.total_submissions}
            </div>
            <div className="text-[11px] text-zinc-500">{t('profile.totalSubmissions')}</div>
          </div>
        </div>
      </Card>

      {/* Badges Earned Section */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <Award className="w-4 h-4 text-violet-600 dark:text-violet-400" />
          {t('profile.badgesEarned')} ({profile.badges.length})
        </h2>

        <Card className="p-5">
          {profile.badges.length === 0 ? (
            <p className="text-xs text-zinc-500 text-center py-4">
              {t('profile.noBadges')}
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {profile.badges.map((bRaw) => {
                const b = getTranslatedBadge(bRaw, i18n.language);
                return (
                  <div
                    key={b.id}
                    className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 flex flex-col items-center text-center shadow-2xs"
                  >
                    <div className="w-10 h-10 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mb-2 shadow-2xs">
                      {getBadgeIcon(b.icon)}
                    </div>
                    <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-200">{b.name}</span>
                    <span className="text-[10px] text-zinc-500 line-clamp-1 mt-0.5">
                      {b.description}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Solved Challenges History */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          {t('profile.solvedChallenges')} ({profile.solved_challenges?.length || 0})
        </h2>

        <div className="space-y-2">
          {!profile.solved_challenges || profile.solved_challenges.length === 0 ? (
            <Card className="p-8 text-center text-xs text-zinc-500">
              {t('profile.noSolvedChallenges')}
            </Card>
          ) : (
            profile.solved_challenges.map((ch) => (
              <Link key={ch.id} to={`/challenges/${ch.slug}`} className="block">
                <Card
                  hoverable
                  className="p-4 flex items-center justify-between transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div>
                      <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-200 group-hover:text-violet-600 dark:group-hover:text-violet-300">
                        {ch.title}
                      </h3>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-0.5">
                        <span>{t('profile.solvedOn', { date: new Date(ch.solved_at).toLocaleDateString(i18n.language) })}</span>
                        <span>·</span>
                        <div className="flex items-center gap-1">
                          {ch.tags?.slice(0, 2).map((tg, i) => (
                            <span key={i} className="text-zinc-500">
                              #{getTranslatedTagName(tg.toLowerCase().replace(/\s+/g, '-'), tg, i18n.language)}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant={ch.difficulty} size="sm">
                      {getDifficultyLabel(ch.difficulty, t)}
                    </Badge>
                    <ChevronRight className="w-4 h-4 text-zinc-400 dark:text-zinc-600 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors" />
                  </div>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
