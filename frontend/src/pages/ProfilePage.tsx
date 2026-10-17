import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  Sparkles,
  Trophy,
  CheckCircle2,
  XCircle,
  Award,
  Zap,
  ShieldCheck,
  Flame,
  ArrowLeft,
  ChevronRight,
  MapPin,
  Globe,
  Share2,
  Edit3,
  Check,
  Clock,
  Code2,
  EyeOff,
  Gamepad2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { UserProfileData } from '@/types';
import { useAuth } from '@/features/auth/AuthContext';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { EditProfileModal } from '@/components/profile/EditProfileModal';
import { ShareCardModal } from '@/components/share-card/ShareCardModal';
import {
  getDifficultyLabel,
  getTranslatedBadge,
  getTranslatedTagName,
} from '@/locales/challengeTranslations';

export const ProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isShareCardModalOpen, setIsShareCardModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'solved' | 'badges' | 'activity'>('solved');

  // Support opening edit modal via ?edit=true if user is viewing their own profile
  useEffect(() => {
    if (searchParams.get('edit') === 'true') {
      setIsEditModalOpen(true);
      // Clean query parameter
      const next = new URLSearchParams(searchParams);
      next.delete('edit');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const { data, isLoading, isError, refetch } = useQuery<{ profile: UserProfileData }>({
    queryKey: ['profile', username],
    queryFn: async () => {
      const res = await api.get(`/users/${username}`);
      return res.data;
    },
    enabled: Boolean(username),
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

  const handleCopyLink = async () => {
    try {
      const profileUrl = window.location.origin + `/profile/${username}`;
      await navigator.clipboard.writeText(profileUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Fallback
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-zinc-500 dark:text-zinc-400">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <span className="text-xs">{t('profile.loading', 'Loading profile...')}</span>
      </div>
    );
  }

  if (isError || !data?.profile) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4 px-4">
        <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-500 flex items-center justify-center mx-auto mb-2">
          <XCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
          {t('profile.userNotFoundTitle', 'User Not Found')}
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {t('profile.userNotFound', { username })}
        </p>
        <div className="pt-2">
          <Link to="/leaderboard">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              {t('profile.backToLeaderboard', 'Back to Leaderboard')}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { profile } = data;
  const isOwner = Boolean(user && user.id === profile.id);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-left">
      {/* 1. Profile Overview Card */}
      <Card className="p-6 sm:p-8 relative overflow-hidden">
        {/* Subtle decorative gradient backdrop */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-violet-500/10 dark:bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 relative">
          {/* Avatar and Primary Details */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5">
            <Avatar
              src={profile.avatar_url}
              name={profile.name}
              size="2xl"
              className="ring-4 ring-violet-500/20"
            />

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                  {profile.name}
                </h1>
                {profile.role === 'admin' && (
                  <Badge variant="violet" size="sm">
                    {t('profile.admin', 'Admin')}
                  </Badge>
                )}
              </div>

              <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                @{profile.username}
              </p>

              {profile.tagline && (
                <p className="text-sm font-medium text-violet-600 dark:text-violet-300 pt-0.5">
                  {profile.tagline}
                </p>
              )}

              {profile.bio && (
                <p className="text-xs text-zinc-600 dark:text-zinc-300 max-w-xl pt-1 leading-relaxed">
                  {profile.bio}
                </p>
              )}

              {/* Social and Metadata Chips */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-zinc-500 dark:text-zinc-400 pt-2">
                {profile.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                    {profile.location}
                  </span>
                )}

                {profile.website_url && (
                  <a
                    href={profile.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>{t('profile.website', 'Website')}</span>
                  </a>
                )}

                {profile.github_url && (
                  <a
                    href={profile.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                  >
                    <span>GitHub</span>
                  </a>
                )}

                {profile.linkedin_url && (
                  <a
                    href={profile.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                  >
                    <span>LinkedIn</span>
                  </a>
                )}

                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {t('profile.joined', {
                    date: new Date(profile.joined_at).toLocaleDateString(i18n.language, {
                      year: 'numeric',
                      month: 'short',
                    }),
                  })}
                </span>
              </div>

              {/* Favorite Languages Tags */}
              {profile.favorite_languages && profile.favorite_languages.length > 0 && (
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-2">
                  <span className="text-[11px] text-zinc-500 font-medium mr-1">
                    {t('profile.techStack', 'Favorite Tech:')}
                  </span>
                  {profile.favorite_languages.map((lang) => (
                    <span
                      key={lang}
                      className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons: Edit & Share */}
          <div className="flex flex-row sm:flex-col items-center justify-center sm:items-end gap-2 shrink-0">
            {isOwner && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsEditModalOpen(true)}
                leftIcon={<Edit3 className="w-3.5 h-3.5" />}
              >
                {t('profile.editProfile', 'Edit Profile')}
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              leftIcon={copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
            >
              {copiedLink ? t('profile.linkCopied', 'Copied Link!') : t('profile.share', 'Share Profile')}
            </Button>
          </div>
        </div>

        {/* 2. Key Performance Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800 text-center">
          <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-center gap-1 text-[11px] text-violet-600 dark:text-violet-400 font-medium mb-1">
              <Sparkles className="w-3 h-3" />
              {t('common.lvl', 'Lvl')} {profile.level}
            </div>
            <div className="text-base font-bold text-zinc-900 dark:text-zinc-100 font-mono">
              {profile.xp.toLocaleString()} XP
            </div>
          </div>

          <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800">
            <div className="text-[11px] text-zinc-500 mb-1">
              {t('profile.challengesSolved', 'Challenges Solved')}
            </div>
            <div className="text-base font-bold text-zinc-900 dark:text-zinc-100 font-mono">
              {profile.solved_count}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800">
            <div className="text-[11px] text-zinc-500 mb-1">
              {t('profile.acceptedSolves', 'Accepted Solves')}
            </div>
            <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {profile.accepted_count}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800">
            <div className="text-[11px] text-zinc-500 mb-1">
              {t('profile.totalSubmissions', 'Submissions')}
            </div>
            <div className="text-base font-bold text-zinc-900 dark:text-zinc-100 font-mono">
              {profile.total_submissions}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800">
            <div className="text-[11px] text-zinc-500 mb-1">
              {t('profile.successRate', 'Success Rate')}
            </div>
            <div className="text-base font-bold text-zinc-900 dark:text-zinc-100 font-mono">
              {profile.success_rate}%
            </div>
          </div>

          <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-center gap-1 text-[11px] text-amber-500 mb-1">
              <Flame className="w-3 h-3 fill-current" />
              {t('profile.streak', 'Streak')}
            </div>
            <div className="text-base font-bold text-zinc-900 dark:text-zinc-100 font-mono">
              {profile.streak?.current_streak || 0} {t('common.days', 'days')}
            </div>
          </div>
        </div>

        {/* Arcade Highlights (if played) */}
        {profile.snake_stats && profile.snake_stats.total_games > 0 && (
          <div className="mt-6 p-4 rounded-xl bg-violet-50/50 dark:bg-zinc-950/40 border border-violet-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-950/70 text-violet-600 dark:text-violet-400">
                <Gamepad2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  {t('profile.arcadeTitle', 'Terminal Reflexes: Snake Arena')}
                </h4>
                <p className="text-[11px] text-zinc-500">
                  {t('profile.arcadeSubtitle', 'Arcade personal records and reflex performance')}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-6 text-center text-xs">
              <div>
                <span className="text-[10px] text-zinc-500 block">{t('snake.personalBest', 'Best Score')}</span>
                <span className="text-sm font-bold font-mono text-violet-600 dark:text-violet-400">
                  {profile.snake_stats.high_score} pts
                </span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block">{t('snake.gamesPlayed', 'Games')}</span>
                <span className="text-sm font-bold font-mono text-zinc-900 dark:text-zinc-100">
                  {profile.snake_stats.total_games}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block">{t('snake.averageScore', 'Average')}</span>
                <span className="text-sm font-bold font-mono text-zinc-900 dark:text-zinc-100">
                  {profile.snake_stats.average_score}
                </span>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* 3. Section Tabs */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('solved')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'solved'
                ? 'bg-violet-100 dark:bg-violet-950/70 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/60'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>
              {t('profile.solvedChallenges', 'Solved Challenges')} ({profile.solved_challenges?.length || 0})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('badges')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'badges'
                ? 'bg-violet-100 dark:bg-violet-950/70 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/60'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>
              {t('profile.badgesEarned', 'Badges & Achievements')} ({profile.badges?.length || 0})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('activity')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'activity'
                ? 'bg-violet-100 dark:bg-violet-950/70 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/60'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>
              {t('profile.recentActivity', 'Recent Activity')} ({profile.recent_activity?.length || 0})
            </span>
          </button>
        </div>

        {/* Tab 1: Solved Challenges */}
        {activeTab === 'solved' && (
          <div className="space-y-3">
            {!profile.is_activity_public && !profile.is_owner ? (
              <Card className="p-8 text-center text-xs text-zinc-500 dark:text-zinc-400 space-y-2">
                <EyeOff className="w-6 h-6 mx-auto text-zinc-400 mb-1" />
                <p className="font-semibold text-zinc-700 dark:text-zinc-300">
                  {t('profile.privateActivityTitle', 'Activity is Private')}
                </p>
                <p>
                  {t('profile.privateActivityDescription', 'This user chose to keep their solved challenges and recent activity private.')}
                </p>
              </Card>
            ) : !profile.solved_challenges || profile.solved_challenges.length === 0 ? (
              <Card className="p-8 text-center text-xs text-zinc-500">
                {t('profile.noSolvedChallenges', 'No solved challenges yet.')}
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-2.5">
                {profile.solved_challenges.map((ch) => (
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
                            <span>
                              {t('profile.solvedOn', {
                                date: new Date(ch.solved_at).toLocaleDateString(i18n.language),
                              })}
                            </span>
                            {ch.tags && ch.tags.length > 0 && <span>·</span>}
                            <div className="flex items-center gap-1">
                              {ch.tags?.slice(0, 3).map((tg, i) => (
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
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Badges & Achievements */}
        {activeTab === 'badges' && (
          <Card className="p-6">
            {!profile.badges || profile.badges.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-6">
                {t('profile.noBadges', 'No badges unlocked yet.')}
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {profile.badges.map((bRaw) => {
                  const b = getTranslatedBadge(bRaw, i18n.language);
                  return (
                    <div
                      key={b.id}
                      className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 flex flex-col items-center text-center shadow-2xs hover:border-violet-500/30 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mb-2.5 shadow-2xs">
                        {getBadgeIcon(b.icon)}
                      </div>
                      <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-200">
                        {b.name}
                      </span>
                      <span className="text-[10px] text-zinc-500 line-clamp-2 mt-1">
                        {b.description}
                      </span>
                      {b.earned_at && (
                        <span className="text-[9px] font-mono text-zinc-400 mt-2">
                          {new Date(b.earned_at).toLocaleDateString(i18n.language)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}

        {/* Tab 3: Recent Activity / Submissions */}
        {activeTab === 'activity' && (
          <div className="space-y-3">
            {!profile.is_activity_public && !profile.is_owner ? (
              <Card className="p-8 text-center text-xs text-zinc-500 dark:text-zinc-400 space-y-2">
                <EyeOff className="w-6 h-6 mx-auto text-zinc-400 mb-1" />
                <p className="font-semibold text-zinc-700 dark:text-zinc-300">
                  {t('profile.privateActivityTitle', 'Activity is Private')}
                </p>
                <p>
                  {t('profile.privateActivityDescription', 'This user chose to keep their solved challenges and recent activity private.')}
                </p>
              </Card>
            ) : !profile.recent_activity || profile.recent_activity.length === 0 ? (
              <Card className="p-8 text-center text-xs text-zinc-500">
                {t('profile.noRecentActivity', 'No recent submissions or activity recorded.')}
              </Card>
            ) : (
              <div className="space-y-2">
                {profile.recent_activity.map((act) => {
                  const isAccepted = act.status === 'Accepted';
                  return (
                    <Card
                      key={act.id}
                      className="p-3.5 flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                            isAccepted
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                              : 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {isAccepted ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            {act.challenge_slug ? (
                              <Link
                                to={`/challenges/${act.challenge_slug}`}
                                className="text-xs font-semibold text-zinc-900 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400"
                              >
                                {act.challenge_title || 'Challenge'}
                              </Link>
                            ) : (
                              <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-200">
                                {act.challenge_title || 'Challenge'}
                              </span>
                            )}
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                              {act.language}
                            </span>
                          </div>

                          <div className="text-[11px] text-zinc-500 mt-0.5 flex items-center gap-2">
                            <span>
                              {new Date(act.submitted_at).toLocaleDateString(i18n.language, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {act.execution_time_ms !== undefined && (
                              <span>· {act.execution_time_ms} ms</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                            isAccepted
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/60'
                              : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800/60'
                          }`}
                        >
                          {act.status}
                        </span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {isOwner && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSaved={() => {
            refetch();
          }}
        />
      )}
    </div>
  );
};
