import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Code2,
  Binary,
  Hash,
  User as UserIcon,
  Filter,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  X,
  CheckCircle2,
  Clock,
  Circle,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { searchApi } from '@/services/searchApi';
import {
  SearchResponse,
  SearchChallenge,
  SearchLanguage,
  SearchTopic,
  SearchUser,
  SearchPaginatedResult,
} from '@/types/search';
import { useAuth } from '@/features/auth/AuthContext';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';

export const SearchPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const queryParam = searchParams.get('q') || '';
  const typeParam = (searchParams.get('type') as any) || 'all';
  const difficultyParam = searchParams.get('difficulty') || '';
  const categoryParam = searchParams.get('category') || '';
  const languageParam = searchParams.get('language') || '';
  const topicParam = searchParams.get('topic') || '';
  const statusParam = (searchParams.get('status') as any) || 'all';
  const sortParam = (searchParams.get('sort') as any) || 'relevance';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);

  const [inputVal, setInputVal] = useState(queryParam);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setInputVal(queryParam);
  }, [queryParam]);

  const updateParams = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, val]) => {
      if (val && val !== 'all' && val !== '') {
        next.set(key, val);
      } else {
        next.delete(key);
      }
    });
    // Reset to page 1 unless page itself was explicitly updated
    if (!('page' in updates)) {
      next.delete('page');
    }
    setSearchParams(next);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ q: inputVal.trim() });
  };

  const clearAllFilters = () => {
    const next = new URLSearchParams();
    if (queryParam) next.set('q', queryParam);
    if (typeParam !== 'all') next.set('type', typeParam);
    setSearchParams(next);
  };

  // Perform search query
  const { data, isLoading, isError, refetch } = useQuery<SearchResponse>({
    queryKey: [
      'search',
      queryParam,
      typeParam,
      difficultyParam,
      categoryParam,
      languageParam,
      topicParam,
      statusParam,
      sortParam,
      pageParam,
    ],
    queryFn: () =>
      searchApi.search({
        q: queryParam || undefined,
        type: typeParam,
        difficulty: difficultyParam || undefined,
        category: categoryParam || undefined,
        language: languageParam || undefined,
        topic: topicParam || undefined,
        status: statusParam !== 'all' ? statusParam : undefined,
        sort: sortParam,
        page: pageParam,
        per_page: 12,
      }),
  });

  const counts = data?.counts || { challenges: 0, languages: 0, topics: 0, users: 0, total: 0 };
  const hasActiveFilters = Boolean(
    difficultyParam ||
      categoryParam ||
      languageParam ||
      topicParam ||
      (statusParam && statusParam !== 'all') ||
      (sortParam && sortParam !== 'relevance')
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header & Search Bar */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
          <Search className="w-7 h-7 text-violet-600 dark:text-violet-400" />
          {t('search.title', 'Smart Search')}
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {t('search.subtitle', 'Search challenges, programming languages, topics, and developers across CodeArena.')}
        </p>

        {/* Search input form */}
        <form onSubmit={handleSearchSubmit} className="mt-6 flex gap-2 max-w-3xl">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 dark:text-zinc-500" />
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder={t('search.inputPlaceholder', 'Search by keyword, topic, language, difficulty...')}
              className="w-full pl-11 pr-10 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm shadow-2xs"
            />
            {inputVal && (
              <button
                type="button"
                onClick={() => {
                  setInputVal('');
                  updateParams({ q: null });
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button type="submit" variant="primary" className="px-5">
            {t('common.search', 'Search')}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 ${hasActiveFilters ? 'border-violet-500 text-violet-600 dark:text-violet-400' : ''}`}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">{t('search.filters', 'Filters')}</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-violet-600 dark:bg-violet-400" />
            )}
          </Button>
        </form>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-px">
          {[
            { id: 'all', label: t('common.all', 'All'), count: counts.total, icon: Sparkles },
            { id: 'challenges', label: t('search.challenges', 'Challenges'), count: counts.challenges, icon: Code2 },
            { id: 'languages', label: t('search.languages', 'Languages'), count: counts.languages, icon: Binary },
            { id: 'topics', label: t('search.topics', 'Topics & Skills'), count: counts.topics, icon: Hash },
            { id: 'users', label: t('search.users', 'Developers'), count: counts.users, icon: UserIcon },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = typeParam === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => updateParams({ type: tab.id === 'all' ? null : tab.id })}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                  isSelected
                    ? 'border-violet-600 text-violet-600 dark:text-violet-400 dark:border-violet-400'
                    : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                <span
                  className={`text-xs px-1.5 py-0.2 rounded-full ${
                    isSelected
                      ? 'bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Panel (collapsible) */}
      {showFilters && (
        <div className="p-4 mb-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-2xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-200 dark:border-zinc-800">
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Filter className="w-4 h-4 text-violet-500" />
              {t('search.filterResults', 'Filter Results')}
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
              >
                {t('search.resetFilters', 'Reset all filters')}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {/* Difficulty */}
            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
                {t('challenges.difficulty', 'Difficulty')}
              </label>
              <select
                value={difficultyParam}
                onChange={(e) => updateParams({ difficulty: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-xs focus:ring-1 focus:ring-violet-500 outline-none"
              >
                <option value="">{t('common.all', 'All')}</option>
                <option value="Beginner">Beginner</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
                <option value="Expert">Expert</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
                {t('challenges.category', 'Category')}
              </label>
              <select
                value={categoryParam}
                onChange={(e) => updateParams({ category: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-xs focus:ring-1 focus:ring-violet-500 outline-none"
              >
                <option value="">{t('common.all', 'All')}</option>
                <option value="Algorithms">Algorithms</option>
                <option value="Data Structures">Data Structures</option>
                <option value="Frontend">Frontend</option>
                <option value="Backend">Backend</option>
                <option value="Database">Database</option>
                <option value="DevOps">DevOps</option>
              </select>
            </div>

            {/* Status (when user is authenticated) */}
            {user && (
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
                  {t('challenges.status', 'Completion Status')}
                </label>
                <select
                  value={statusParam}
                  onChange={(e) => updateParams({ status: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-xs focus:ring-1 focus:ring-violet-500 outline-none"
                >
                  <option value="all">{t('common.all', 'All')}</option>
                  <option value="solved">{t('common.solved', 'Solved')}</option>
                  <option value="attempted">{t('common.attempted', 'Attempted')}</option>
                  <option value="unsolved">{t('common.unsolved', 'Unsolved')}</option>
                </select>
              </div>
            )}

            {/* Sort order */}
            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
                {t('challenges.sort', 'Sort By')}
              </label>
              <select
                value={sortParam}
                onChange={(e) => updateParams({ sort: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-xs focus:ring-1 focus:ring-violet-500 outline-none"
              >
                <option value="relevance">{t('search.sortRelevance', 'Relevance')}</option>
                <option value="newest">{t('search.sortNewest', 'Newest')}</option>
                <option value="difficulty_asc">{t('search.sortDiffAsc', 'Difficulty: Low to High')}</option>
                <option value="difficulty_desc">{t('search.sortDiffDesc', 'Difficulty: High to Low')}</option>
                <option value="xp">{t('search.sortXp', 'XP Reward')}</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-4 py-8 animate-pulse">
          <div className="h-6 w-48 bg-zinc-200 dark:bg-zinc-800 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-32 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 p-4"
              />
            ))}
          </div>
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="p-6 text-center rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 my-8">
          <p className="font-medium">{t('search.errorLoading', 'Failed to load search results.')}</p>
          <Button variant="outline" onClick={() => refetch()} className="mt-3 text-xs">
            {t('common.retry', 'Retry')}
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && counts.total === 0 && (
        <div className="text-center py-16 px-4 bg-white dark:bg-zinc-900/40 rounded-xl border border-zinc-200 dark:border-zinc-800 my-4">
          <Search className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-600 mb-3" />
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {t('search.noResultsTitle', 'No results found')}
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-md mx-auto">
            {queryParam
              ? t('search.noResultsQuery', 'No matches were found for your search term. Try adjusting keywords or filters.')
              : t('search.noResultsEmpty', 'No items matched your active filter selections.')}
          </p>
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearAllFilters} className="mt-4 text-xs">
              {t('search.clearFilters', 'Clear all filters')}
            </Button>
          )}
        </div>
      )}

      {/* Results Content */}
      {!isLoading && !isError && counts.total > 0 && (
        <div className="space-y-10">
          {/* CHALLENGES */}
          {(typeParam === 'all' || typeParam === 'challenges') && counts.challenges > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-violet-500" />
                  <span>{t('search.challenges', 'Challenges')}</span>
                  <span className="text-xs text-zinc-500 font-normal">({counts.challenges})</span>
                </h2>
                {typeParam === 'all' && counts.challenges > 6 && (
                  <button
                    type="button"
                    onClick={() => updateParams({ type: 'challenges' })}
                    className="text-xs text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                  >
                    {t('search.viewAllChallenges', 'View all challenges')}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Challenge Cards Grid */}
              {(() => {
                const chData =
                  typeParam === 'challenges'
                    ? (data?.results.challenges as SearchPaginatedResult<SearchChallenge>)?.data || []
                    : ((data?.results.challenges as SearchChallenge[]) || []);

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {chData.map((ch) => (
                      <Link
                        key={ch.id}
                        to={`/challenges/${ch.slug}`}
                        className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-violet-500/50 dark:hover:border-violet-500/50 hover:shadow-md transition-all flex flex-col justify-between group"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                              {ch.category}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {ch.user_status === 'solved' && (
                                <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  {t('common.solved', 'Solved')}
                                </span>
                              )}
                              <Badge
                                variant={
                                  ch.difficulty === 'Easy'
                                    ? 'success'
                                    : ch.difficulty === 'Medium'
                                    ? 'warning'
                                    : 'danger'
                                }
                                className="text-[10px] px-1.5 py-0.2"
                              >
                                {ch.difficulty}
                              </Badge>
                            </div>
                          </div>

                          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors line-clamp-1">
                            {ch.title}
                          </h3>

                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 line-clamp-2">
                            {ch.description}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                          <div className="flex flex-wrap gap-1">
                            {ch.tags?.slice(0, 2).map((tag) => (
                              <span
                                key={tag.id}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                              >
                                #{tag.name}
                              </span>
                            ))}
                          </div>
                          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            {ch.xp_reward} XP
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                );
              })()}

              {/* Challenges Pagination when type === 'challenges' */}
              {typeParam === 'challenges' && data?.results.challenges && (
                <div className="mt-6 flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800 pt-4 text-xs text-zinc-500">
                  <span>
                    {t('common.showing', 'Showing')}{' '}
                    {(data.results.challenges as SearchPaginatedResult<SearchChallenge>).from || 0} -{' '}
                    {(data.results.challenges as SearchPaginatedResult<SearchChallenge>).to || 0} of{' '}
                    {(data.results.challenges as SearchPaginatedResult<SearchChallenge>).total}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pageParam <= 1}
                      onClick={() => updateParams({ page: String(pageParam - 1) })}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      {t('common.previous', 'Previous')}
                    </Button>
                    <span className="px-2 font-medium">
                      {pageParam} / {(data.results.challenges as SearchPaginatedResult<SearchChallenge>).last_page || 1}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={
                        pageParam >=
                        ((data.results.challenges as SearchPaginatedResult<SearchChallenge>).last_page || 1)
                      }
                      onClick={() => updateParams({ page: String(pageParam + 1) })}
                    >
                      {t('common.next', 'Next')}
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* LANGUAGES */}
          {(typeParam === 'all' || typeParam === 'languages') && counts.languages > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Binary className="w-5 h-5 text-blue-500" />
                  <span>{t('search.languages', 'Languages')}</span>
                  <span className="text-xs text-zinc-500 font-normal">({counts.languages})</span>
                </h2>
              </div>

              {(() => {
                const langData =
                  typeParam === 'languages'
                    ? (data?.results.languages as SearchPaginatedResult<SearchLanguage>)?.data || []
                    : ((data?.results.languages as SearchLanguage[]) || []);

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {langData.map((l) => (
                      <Link
                        key={l.id}
                        to={`/challenges?category=${encodeURIComponent(l.name)}`}
                        className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-blue-500/50 hover:shadow-md transition-all flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/40 flex items-center justify-center font-bold text-sm">
                            <Binary className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {l.name}
                            </h4>
                            <span className="text-xs text-zinc-500">{l.category}</span>
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* TOPICS & SKILLS */}
          {(typeParam === 'all' || typeParam === 'topics') && counts.topics > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Hash className="w-5 h-5 text-emerald-500" />
                  <span>{t('search.topics', 'Topics & Skills')}</span>
                  <span className="text-xs text-zinc-500 font-normal">({counts.topics})</span>
                </h2>
              </div>

              {(() => {
                const topicData =
                  typeParam === 'topics'
                    ? (data?.results.topics as SearchPaginatedResult<SearchTopic>)?.data || []
                    : ((data?.results.topics as SearchTopic[]) || []);

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {topicData.map((top) => (
                      <Link
                        key={top.id}
                        to={`/challenges?tag=${encodeURIComponent(top.slug)}`}
                        className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-emerald-500/50 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 transition-all text-center group cursor-pointer"
                      >
                        <div className="font-medium text-xs text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                          #{top.name}
                        </div>
                        <div className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">
                          {top.challenges_count} {t('search.challengesCount', 'challenges')}
                        </div>
                      </Link>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* DEVELOPERS / USERS */}
          {(typeParam === 'all' || typeParam === 'users') && counts.users > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-purple-500" />
                  <span>{t('search.users', 'Developers')}</span>
                  <span className="text-xs text-zinc-500 font-normal">({counts.users})</span>
                </h2>
              </div>

              {(() => {
                const userData =
                  typeParam === 'users'
                    ? (data?.results.users as SearchPaginatedResult<SearchUser>)?.data || []
                    : ((data?.results.users as SearchUser[]) || []);

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {userData.map((u) => (
                      <Link
                        key={u.id}
                        to={`/profile/${u.username}`}
                        className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-purple-500/50 hover:shadow-md transition-all flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar name={u.name} src={u.avatar_url || undefined} size="md" />
                          <div className="truncate">
                            <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate">
                              {u.name}
                            </h4>
                            <div className="text-xs text-zinc-400 dark:text-zinc-500 truncate">
                              @{u.username}
                            </div>
                          </div>
                        </div>
                        <div className="text-right text-xs shrink-0">
                          <div className="font-mono text-violet-600 dark:text-violet-400 font-medium">
                            {t('common.lvl')} {u.level}
                          </div>
                          <div className="text-zinc-500">{u.xp.toLocaleString()} XP</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                );
              })()}

              {typeParam === 'users' && data?.results.users && (
                <div className="mt-6 flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800 pt-4 text-xs text-zinc-500">
                  <span>
                    {t('common.showing', 'Showing')}{' '}
                    {(data.results.users as SearchPaginatedResult<SearchUser>).from || 0} -{' '}
                    {(data.results.users as SearchPaginatedResult<SearchUser>).to || 0} of{' '}
                    {(data.results.users as SearchPaginatedResult<SearchUser>).total}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pageParam <= 1}
                      onClick={() => updateParams({ page: String(pageParam - 1) })}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      {t('common.previous', 'Previous')}
                    </Button>
                    <span className="px-2 font-medium">
                      {pageParam} / {(data.results.users as SearchPaginatedResult<SearchUser>).last_page || 1}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={
                        pageParam >=
                        ((data.results.users as SearchPaginatedResult<SearchUser>).last_page || 1)
                      }
                      onClick={() => updateParams({ page: String(pageParam + 1) })}
                    >
                      {t('common.next', 'Next')}
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
