import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  CheckCircle2,
  Circle,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  X,
  Code2,
  Table,
  Layout,
  HelpCircle,
  Flame,
  Bookmark,
  Sparkles,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { Challenge, Tag, UserProgressItem, PaginationMeta, Difficulty, ChallengeType } from '@/types';
import { useAuth } from '@/features/auth/AuthContext';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  getTranslatedChallenge,
  getDifficultyLabel,
  getTranslatedTagName,
} from '@/locales/challengeTranslations';

interface ChallengesApiResponse {
  data: Challenge[];
  meta: PaginationMeta;
  tags: Tag[];
  user_progress: Record<number, UserProgressItem>;
  bookmarked_ids?: number[];
}

interface DailyChallengeResponse {
  challenge: Challenge | null;
  is_completed_today: boolean;
  streak: {
    current_streak: number;
    longest_streak: number;
  };
}

export const ChallengesPage: React.FC = () => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('search') || '';
  const difficulty = searchParams.get('difficulty') || '';
  const category = searchParams.get('category') || '';
  const challengeType = searchParams.get('challenge_type') || '';
  const tag = searchParams.get('tag') || '';
  const status = searchParams.get('status') || '';
  const sort = searchParams.get('sort') || 'newest';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const [searchInput, setSearchInput] = useState(search);

  // Fetch Daily Challenge
  const { data: dailyData } = useQuery<DailyChallengeResponse>({
    queryKey: ['daily-challenge'],
    queryFn: async () => {
      const res = await api.get('/daily-challenge');
      return res.data;
    },
  });

  // Fetch Challenges
  const { data, isLoading, isError, refetch } = useQuery<ChallengesApiResponse>({
    queryKey: ['challenges', { search, difficulty, category, challengeType, tag, status, sort, page }],
    queryFn: async () => {
      const res = await api.get('/challenges', {
        params: { search, difficulty, category, challenge_type: challengeType, tag, status, sort, page, per_page: 12 },
      });
      return res.data;
    },
  });

  const updateParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.set('page', '1');
    setSearchParams(next);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam('search', searchInput.trim() || null);
  };

  const clearAllFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
  };

  const hasActiveFilters = Boolean(search || difficulty || category || challengeType || tag || status);

  const getTypeIcon = (type: ChallengeType) => {
    switch (type) {
      case 'sql':
        return <Table className="w-3.5 h-3.5 text-emerald-400" title="SQL Lab" />;
      case 'web':
        return <Layout className="w-3.5 h-3.5 text-blue-400" title="Web Sandbox" />;
      case 'quiz':
        return <HelpCircle className="w-3.5 h-3.5 text-indigo-400" title="Concept Quiz" />;
      default:
        return <Code2 className="w-3.5 h-3.5 text-violet-400" title="Code Problem" />;
    }
  };

  const categories = [
    { label: 'All', value: '' },
    { label: 'Algorithms', value: 'algorithms' },
    { label: 'SQL Lab', value: 'SQL' },
    { label: 'Data Structures', value: 'data structures' },
    { label: 'Strings', value: 'strings' },
    { label: 'Mathematics', value: 'mathematics' },
    { label: 'Web Dev', value: 'web' },
    { label: 'DevOps & Git', value: 'Git' },
  ];

  const difficulties: Array<'All' | Difficulty> = ['All', 'Beginner', 'Easy', 'Medium', 'Hard', 'Expert'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-left space-y-6">
      {/* Daily Challenge Banner */}
      {dailyData?.challenge && (
        <div className="p-5 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/40 dark:via-zinc-900/40 dark:to-zinc-900/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Daily Challenge
                </span>
                {dailyData.streak && dailyData.streak.current_streak > 0 && (
                  <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 font-bold">
                    🔥 {dailyData.streak.current_streak} Day Streak
                  </span>
                )}
                {dailyData.is_completed_today && (
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Solved Today (+50 XP)
                  </span>
                )}
              </div>
              <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                {dailyData.challenge.title}
              </h3>
            </div>
          </div>

          <Link to={`/challenges/${dailyData.challenge.slug}`}>
            <Button
              size="sm"
              className="bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs whitespace-nowrap"
            >
              Solve Daily Challenge
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      )}

      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <Code2 className="w-6 h-6 text-violet-600 dark:text-violet-400" />
            {t('challenges.arenaTitle')}
            {data?.meta?.total !== undefined && (
              <span className="text-xs font-mono font-normal text-zinc-500">
                ({data.meta.total} challenges)
              </span>
            )}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {t('challenges.arenaSubtitle')}
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="w-full sm:w-72">
          <Input
            placeholder={t('challenges.searchPlaceholder')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />}
            rightIcon={
              searchInput ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('');
                    updateParam('search', null);
                  }}
                  className="hover:text-zinc-800 dark:hover:text-zinc-300 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : undefined
            }
          />
        </form>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {categories.map((cat) => {
          const isSelected = (!category && cat.value === '') || category === cat.value;
          const count = cat.value ? data?.meta?.category_counts?.[cat.value] : null;

          return (
            <button
              key={cat.label}
              onClick={() => updateParam('category', cat.value || null)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-violet-600 text-white font-semibold shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/80'
              }`}
            >
              <span>{cat.label}</span>
              {count !== undefined && count !== null && (
                <span className={`text-[10px] px-1.5 rounded-full ${isSelected ? 'bg-violet-700 text-violet-200' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Secondary Filters Bar */}
      <div className="py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Difficulty filter buttons */}
          <div className="inline-flex rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100/80 dark:bg-zinc-900/60 p-0.5">
            {difficulties.map((diff) => {
              const active = diff === 'All' ? !difficulty : difficulty === diff;
              const count = diff !== 'All' ? data?.meta?.difficulty_counts?.[diff] : null;

              return (
                <button
                  key={diff}
                  onClick={() => updateParam('difficulty', diff === 'All' ? null : diff)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                    active
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-2xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <span>{diff}</span>
                  {count !== undefined && count !== null && (
                    <span className="text-[10px] text-zinc-500 font-mono">({count})</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Challenge Type Dropdown */}
          <select
            value={challengeType}
            onChange={(e) => updateParam('challenge_type', e.target.value || null)}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1 text-zinc-700 dark:text-zinc-300 text-xs focus:outline-hidden focus:border-violet-500 cursor-pointer"
          >
            <option value="">All Challenge Types</option>
            <option value="code">Standard Code</option>
            <option value="sql">SQL Lab</option>
            <option value="web">Web Sandbox</option>
            <option value="quiz">Concept Quiz</option>
          </select>

          {/* Tags Dropdown */}
          <select
            value={tag}
            onChange={(e) => updateParam('tag', e.target.value || null)}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1 text-zinc-700 dark:text-zinc-300 text-xs focus:outline-hidden focus:border-violet-500 cursor-pointer"
          >
            <option value="">{t('challenges.allTopics')}</option>
            {data?.tags?.map((tItem) => (
              <option key={tItem.id} value={tItem.slug}>
                {getTranslatedTagName(tItem.slug, tItem.name, i18n.language)}
              </option>
            ))}
          </select>

          {/* Status filter (if logged in) */}
          {user && (
            <select
              value={status}
              onChange={(e) => updateParam('status', e.target.value || null)}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1 text-zinc-700 dark:text-zinc-300 text-xs focus:outline-hidden focus:border-violet-500 cursor-pointer"
            >
              <option value="">{t('challenges.allStatuses')}</option>
              <option value="solved">{t('common.solved')}</option>
              <option value="attempted">{t('common.attempted')}</option>
              <option value="unsolved">{t('common.unsolved')}</option>
              <option value="bookmarked">Bookmarked Favorites</option>
            </select>
          )}

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 text-xs flex items-center gap-1 px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-md transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              {t('challenges.resetFilters')}
            </button>
          )}
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 dark:text-zinc-500 text-xs flex items-center gap-1">
            <ArrowUpDown className="w-3 h-3" /> {t('challenges.sortBy')}
          </span>
          <select
            value={sort}
            onChange={(e) => updateParam('sort', e.target.value)}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1 text-zinc-700 dark:text-zinc-300 text-xs focus:outline-hidden focus:border-violet-500 cursor-pointer"
          >
            <option value="newest">{t('challenges.sortNewest')}</option>
            <option value="difficulty_asc">{t('challenges.sortDiffAsc')}</option>
            <option value="difficulty_desc">{t('challenges.sortDiffDesc')}</option>
            <option value="title">{t('challenges.sortTitle')}</option>
          </select>
        </div>
      </div>

      {/* Challenges Table */}
      <div className="border border-zinc-200/90 dark:border-zinc-800/80 rounded-xl overflow-hidden bg-white dark:bg-zinc-900/30 shadow-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-900/80 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              {user && <th className="py-3 px-4 w-12 text-center">{t('challenges.table.status')}</th>}
              <th className="py-3 px-4">{t('challenges.table.title')}</th>
              <th className="py-3 px-4 w-28">{t('challenges.table.difficulty')}</th>
              <th className="py-3 px-4 hidden md:table-cell">{t('challenges.table.topics')}</th>
              <th className="py-3 px-4 w-24 text-right">Estimate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800/60 text-sm">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {user && (
                    <td className="py-4 px-4 text-center">
                      <div className="w-4 h-4 bg-zinc-200 dark:bg-zinc-800 rounded-full mx-auto" />
                    </td>
                  )}
                  <td className="py-4 px-4">
                    <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3 mb-1" />
                    <div className="h-3 bg-zinc-100 dark:bg-zinc-800/50 rounded w-1/2" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded w-14" />
                  </td>
                  <td className="py-4 px-4 hidden md:table-cell">
                    <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-24" />
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-8 ml-auto" />
                  </td>
                </tr>
              ))
            ) : isError ? (
              <tr>
                <td colSpan={user ? 5 : 4} className="py-12 text-center text-zinc-500">
                  <p className="text-rose-500 dark:text-rose-400 font-medium">{t('challenges.failedToLoad')}</p>
                  <Button variant="secondary" size="sm" className="mt-3" onClick={() => refetch()}>
                    {t('common.retry')}
                  </Button>
                </td>
              </tr>
            ) : data?.data?.length === 0 ? (
              <tr>
                <td colSpan={user ? 5 : 4} className="py-16 text-center text-zinc-500">
                  <p className="text-zinc-800 dark:text-zinc-300 font-medium text-sm">{t('challenges.noChallengesFound')}</p>
                  <p className="text-xs text-zinc-500 mt-1">{t('challenges.adjustFilters')}</p>
                  <Button variant="secondary" size="sm" className="mt-4" onClick={clearAllFilters}>
                    {t('challenges.clearAllFilters')}
                  </Button>
                </td>
              </tr>
            ) : (
              data?.data?.map((rawItem) => {
                const item = getTranslatedChallenge(rawItem, i18n.language);
                const progress = data.user_progress?.[item.id];
                const isSolved = progress?.solved;
                const isAttempted = progress && !progress.solved && progress.attempts_count > 0;
                const isBookmarked = data.bookmarked_ids?.includes(item.id);

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/30 transition-colors group"
                  >
                    {user && (
                      <td className="py-3.5 px-4 text-center">
                        {isSolved ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 mx-auto" />
                        ) : isAttempted ? (
                          <div
                            className="w-2.5 h-2.5 rounded-full bg-amber-500 mx-auto"
                            title={t('common.attempted')}
                          />
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-700 mx-auto" />
                        )}
                      </td>
                    )}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(item.challenge_type)}
                        <Link
                          to={`/challenges/${item.slug}`}
                          className="font-semibold text-zinc-900 dark:text-zinc-100 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                        >
                          {item.title}
                        </Link>
                        {item.is_daily && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-500 font-bold">
                            DAILY
                          </span>
                        )}
                        {isBookmarked && (
                          <Bookmark className="w-3 h-3 text-amber-500 fill-current" />
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5 font-normal">
                        {item.description}
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={item.difficulty as any} size="sm">
                        {getDifficultyLabel(item.difficulty, t)}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 hidden md:table-cell">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {item.tags?.slice(0, 3).map((tagItem) => (
                          <span
                            key={tagItem.id}
                            className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono"
                          >
                            #{getTranslatedTagName(tagItem.slug, tagItem.name, i18n.language)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-xs text-zinc-500 dark:text-zinc-400">
                      ~{item.estimated_time_min || 20}m
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.meta.total > 0 && (
        <div className="flex items-center justify-between pt-4 text-xs text-zinc-500 dark:text-zinc-400">
          <div>
            Showing {(data.meta.current_page - 1) * data.meta.per_page + 1} to{' '}
            {Math.min(data.meta.current_page * data.meta.per_page, data.meta.total)} of {data.meta.total} challenges
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={data.meta.current_page <= 1}
              onClick={() => updateParam('page', (data.meta.current_page - 1).toString())}
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Previous
            </Button>
            <span className="font-mono px-2">
              Page {data.meta.current_page} of {data.meta.last_page}
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={data.meta.current_page >= data.meta.last_page}
              onClick={() => updateParam('page', (data.meta.current_page + 1).toString())}
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
