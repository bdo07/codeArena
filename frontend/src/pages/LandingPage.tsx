import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Trophy, Code2, Cpu, ShieldCheck, Flame, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { Challenge as ChallengeType, LeaderboardUser } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { SnakeGame } from '@/components/snake/SnakeGame';
import { getTranslatedChallenge, getDifficultyLabel, getTranslatedTagName } from '@/locales/challengeTranslations';

export const LandingPage: React.FC = () => {
  const { t, i18n } = useTranslation();

  const { data: challengesData, isLoading } = useQuery<{ data: ChallengeType[] }>({
    queryKey: ['featured-challenges'],
    queryFn: async () => {
      const res = await api.get('/challenges', { params: { per_page: 4 } });
      return res.data;
    },
  });

  const { data: leaderboardData } = useQuery<{ data: LeaderboardUser[] }>({
    queryKey: ['leaderboard-preview'],
    queryFn: async () => {
      const res = await api.get('/leaderboard', { params: { per_page: 3 } });
      return res.data;
    },
  });

  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full max-w-5xl mx-auto px-4 pt-16 sm:pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs text-xs text-zinc-700 dark:text-zinc-300 mb-8">
          <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
          <span>{t('landing.badge')}</span>
          <span className="text-zinc-300 dark:text-zinc-600">·</span>
          <span className="text-violet-600 dark:text-violet-400 font-medium">{t('landing.sandbox')}</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 max-w-3xl mx-auto leading-tight sm:leading-none">
          {t('landing.heroTitle')} <span className="text-violet-600 dark:text-violet-400">{t('landing.heroConquer')}</span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          {t('landing.heroDesc')}
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link to="/challenges">
            <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
              {t('landing.exploreChallenges')}
            </Button>
          </Link>
          <Link to="/leaderboard">
            <Button variant="outline" size="lg" leftIcon={<Trophy className="w-4 h-4 text-violet-500 dark:text-violet-400" />}>
              {t('landing.viewLeaderboard')}
            </Button>
          </Link>
        </div>

        {/* Compact stats bar */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-px bg-zinc-200/80 dark:bg-zinc-800/60 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="bg-white/90 dark:bg-zinc-950/80 p-5 text-center">
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-mono">100%</div>
            <div className="text-xs text-zinc-500 mt-1">{t('landing.statSandbox')}</div>
          </div>
          <div className="bg-white/90 dark:bg-zinc-950/80 p-5 text-center">
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-mono">40+</div>
            <div className="text-xs text-zinc-500 mt-1">{t('landing.statLanguages')}</div>
          </div>
          <div className="bg-white/90 dark:bg-zinc-950/80 p-5 text-center">
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-mono">{t('landing.statRealtimeVal')}</div>
            <div className="text-xs text-zinc-500 mt-1">{t('landing.statRealtime')}</div>
          </div>
          <div className="bg-white/90 dark:bg-zinc-950/80 p-5 text-center">
            <div className="text-2xl font-bold text-violet-600 dark:text-violet-400 font-mono">{t('landing.statScoringVal')}</div>
            <div className="text-xs text-zinc-500 mt-1">{t('landing.statScoring')}</div>
          </div>
        </div>
      </section>

      {/* Featured Challenges Preview */}
      <section className="w-full max-w-5xl mx-auto px-4 py-12 text-left">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Code2 className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              {t('landing.featuredTitle')}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {t('landing.featuredSubtitle')}
            </p>
          </div>
          <Link
            to="/challenges"
            className="text-xs font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 flex items-center gap-1"
          >
            {t('landing.allChallenges')} <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 rounded-xl bg-zinc-100 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 animate-pulse" />
            ))
          ) : (
            challengesData?.data?.map((challengeRaw) => {
              const challenge = getTranslatedChallenge(challengeRaw, i18n.language);
              return (
                <Link key={challenge.id} to={`/challenges/${challenge.slug}`}>
                  <Card hoverable className="h-full flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors">
                          {challenge.title}
                        </h3>
                        <Badge variant={challenge.difficulty} size="sm">
                          {getDifficultyLabel(challenge.difficulty, t)}
                        </Badge>
                      </div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                        {challenge.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {challenge.tags.slice(0, 2).map((tag) => (
                          <span key={tag.id} className="text-zinc-600 dark:text-zinc-400">
                            #{getTranslatedTagName(tag.slug, tag.name, i18n.language)}
                          </span>
                        ))}
                      </div>
                      <span className="font-mono text-zinc-600 dark:text-zinc-400">
                        {t('landing.testsCount', { count: challenge.total_test_cases_count })}
                      </span>
                    </div>
                  </Card>
                </Link>
              );
            })
          )}
        </div>
      </section>

      {/* Top Programmers Leaderboard Preview */}
      {leaderboardData?.data && leaderboardData.data.length > 0 && (
        <section className="w-full max-w-5xl mx-auto px-4 py-8 text-left">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                {t('landing.topTitle')}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {t('landing.topSubtitle')}
              </p>
            </div>
            <Link
              to="/leaderboard"
              className="text-xs font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 flex items-center gap-1"
            >
              {t('landing.fullLeaderboard')} <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {leaderboardData.data.slice(0, 3).map((item) => (
              <Link key={item.id} to={`/profile/${item.username}`}>
                <Card hoverable className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 font-bold text-xs text-zinc-800 dark:text-zinc-200 flex items-center justify-center font-mono">
                      #{item.rank}
                    </span>
                    <div>
                      <div className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">{item.name}</div>
                      <div className="text-[11px] text-zinc-500 font-mono">@{item.username}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-violet-600 dark:text-violet-400 font-mono">
                      {item.xp.toLocaleString()} XP
                    </span>
                    <div className="text-[10px] text-zinc-500">{t('common.lvl')} {item.level}</div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Interactive Arcade Snake Arena */}
      <section id="snake-arena" className="w-full max-w-5xl mx-auto px-4 py-8">
        <SnakeGame />
      </section>

      {/* Feature Highlights Grid */}
      <section className="w-full max-w-5xl mx-auto px-4 py-12 text-left">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-center text-violet-600 dark:text-violet-400 mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">{t('landing.features.workspaceTitle')}</h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {t('landing.features.workspaceDesc')}
            </p>
          </Card>

          <Card className="p-6">
            <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">{t('landing.features.sandboxTitle')}</h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {t('landing.features.sandboxDesc')}
            </p>
          </Card>

          <Card className="p-6">
            <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-center text-amber-500 dark:text-amber-400 mb-4">
              <Flame className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">{t('landing.features.progressionTitle')}</h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {t('landing.features.progressionDesc')}
            </p>
          </Card>
        </div>
      </section>
    </div>
  );
};
