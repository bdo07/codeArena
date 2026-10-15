import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, CheckCircle2, Circle, ArrowUpDown, ChevronLeft, ChevronRight, X, Code2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Challenge, Tag, UserProgressItem, PaginationMeta } from '@/types';
import { useAuth } from '@/features/auth/AuthContext';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface ChallengesApiResponse {
  data: Challenge[];
  meta: PaginationMeta;
  tags: Tag[];
  user_progress: Record<number, UserProgressItem>;
}

export const ChallengesPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('search') || '';
  const difficulty = searchParams.get('difficulty') || '';
  const tag = searchParams.get('tag') || '';
  const status = searchParams.get('status') || '';
  const sort = searchParams.get('sort') || 'newest';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const [searchInput, setSearchInput] = useState(search);

  const { data, isLoading, isError, refetch } = useQuery<ChallengesApiResponse>({
    queryKey: ['challenges', { search, difficulty, tag, status, sort, page }],
    queryFn: async () => {
      const res = await api.get('/challenges', {
        params: { search, difficulty, tag, status, sort, page, per_page: 10 },
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
    next.set('page', '1'); // Reset to page 1 on filter changes
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

  const hasActiveFilters = Boolean(search || difficulty || tag || status);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2.5">
            <Code2 className="w-6 h-6 text-violet-400" />
            Problem Arena
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Browse through algorithmic challenges, run tests in the editor, and submit verified solutions.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="w-full sm:w-72">
          <Input
            placeholder="Search problems..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-zinc-500" />}
            rightIcon={
              searchInput ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('');
                    updateParam('search', null);
                  }}
                  className="hover:text-zinc-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : undefined
            }
          />
        </form>
      </div>

      {/* Filters & Sorting Bar */}
      <div className="py-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Difficulty filter buttons */}
          <div className="inline-flex rounded-lg border border-zinc-800 bg-zinc-900/60 p-0.5">
            {['All', 'Easy', 'Medium', 'Hard'].map((diff) => {
              const active = diff === 'All' ? !difficulty : difficulty === diff;
              return (
                <button
                  key={diff}
                  onClick={() => updateParam('difficulty', diff === 'All' ? null : diff)}
                  className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    active
                      ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {diff}
                </button>
              );
            })}
          </div>

          {/* Tags Dropdown */}
          <select
            value={tag}
            onChange={(e) => updateParam('tag', e.target.value || null)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-zinc-300 text-xs focus:outline-none focus:border-violet-500/80 cursor-pointer"
          >
            <option value="">All Topics</option>
            {data?.tags?.map((t) => (
              <option key={t.id} value={t.slug}>
                {t.name}
              </option>
            ))}
          </select>

          {/* Status filter (if logged in) */}
          {user && (
            <select
              value={status}
              onChange={(e) => updateParam('status', e.target.value || null)}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-zinc-300 text-xs focus:outline-none focus:border-violet-500/80 cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="solved">Solved</option>
              <option value="attempted">Attempted</option>
              <option value="unsolved">Unsolved</option>
            </select>
          )}

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-zinc-400 hover:text-zinc-200 text-xs flex items-center gap-1 px-2 py-1 hover:bg-zinc-900 rounded-md transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Reset filters
            </button>
          )}
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 text-xs flex items-center gap-1">
            <ArrowUpDown className="w-3 h-3" /> Sort by:
          </span>
          <select
            value={sort}
            onChange={(e) => updateParam('sort', e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-zinc-300 text-xs focus:outline-none focus:border-violet-500/80 cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="difficulty_asc">Difficulty (Easy to Hard)</option>
            <option value="difficulty_desc">Difficulty (Hard to Easy)</option>
            <option value="title">Title (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Challenges Table */}
      <div className="mt-2 border border-zinc-800/80 rounded-xl overflow-hidden bg-zinc-900/30">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/80 text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
              {user && <th className="py-3 px-4 w-12 text-center">Status</th>}
              <th className="py-3 px-4">Title</th>
              <th className="py-3 px-4 w-28">Difficulty</th>
              <th className="py-3 px-4 hidden md:table-cell">Topics</th>
              <th className="py-3 px-4 w-24 text-right">Tests</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 text-sm">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {user && (
                    <td className="py-4 px-4 text-center">
                      <div className="w-4 h-4 bg-zinc-800 rounded-full mx-auto" />
                    </td>
                  )}
                  <td className="py-4 px-4">
                    <div className="h-4 bg-zinc-800 rounded w-1/3 mb-1" />
                    <div className="h-3 bg-zinc-800/50 rounded w-1/2" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-5 bg-zinc-800 rounded w-14" />
                  </td>
                  <td className="py-4 px-4 hidden md:table-cell">
                    <div className="h-4 bg-zinc-800 rounded w-24" />
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="h-4 bg-zinc-800 rounded w-8 ml-auto" />
                  </td>
                </tr>
              ))
            ) : isError ? (
              <tr>
                <td colSpan={user ? 5 : 4} className="py-12 text-center text-zinc-400">
                  <p className="text-rose-400 font-medium">Failed to load challenges.</p>
                  <Button variant="secondary" size="sm" className="mt-3" onClick={() => refetch()}>
                    Retry
                  </Button>
                </td>
              </tr>
            ) : data?.data?.length === 0 ? (
              <tr>
                <td colSpan={user ? 5 : 4} className="py-16 text-center text-zinc-500">
                  <p className="text-zinc-300 font-medium text-sm">No challenges found</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Try adjusting your filters or search keywords.
                  </p>
                  {hasActiveFilters && (
                    <Button variant="outline" size="sm" className="mt-4" onClick={clearAllFilters}>
                      Clear Filters
                    </Button>
                  )}
                </td>
              </tr>
            ) : (
              data?.data?.map((challenge) => {
                const userProg = data.user_progress?.[challenge.id];
                const isSolved = userProg?.solved;

                return (
                  <tr
                    key={challenge.id}
                    className="hover:bg-zinc-800/30 transition-colors group cursor-pointer"
                  >
                    {user && (
                      <td className="py-3.5 px-4 text-center">
                        {isSolved ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
                        ) : userProg ? (
                          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block mx-auto" title="Attempted" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-zinc-700 mx-auto" />
                        )}
                      </td>
                    )}

                    <td className="py-3.5 px-4">
                      <Link
                        to={`/challenges/${challenge.slug}`}
                        className="font-medium text-zinc-100 group-hover:text-violet-300 transition-colors block"
                      >
                        {challenge.title}
                      </Link>
                      <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5">
                        {challenge.description.slice(0, 100)}...
                      </p>
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge variant={challenge.difficulty} size="sm">
                        {challenge.difficulty}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 hidden md:table-cell">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {challenge.tags.map((t) => (
                          <span
                            key={t.id}
                            className="text-[11px] text-zinc-400 bg-zinc-900 border border-zinc-800/80 px-2 py-0.5 rounded"
                          >
                            {t.name}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-xs text-zinc-400">
                      {challenge.total_test_cases_count}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {data?.meta && data.meta.last_page > 1 && (
        <div className="mt-6 flex items-center justify-between text-xs text-zinc-400">
          <div>
            Showing <span className="font-medium text-zinc-200">{(page - 1) * 10 + 1}</span> to{' '}
            <span className="font-medium text-zinc-200">
              {Math.min(page * 10, data.meta.total)}
            </span>{' '}
            of <span className="font-medium text-zinc-200">{data.meta.total}</span> problems
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => updateParam('page', (page - 1).toString())}
              leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
            >
              Previous
            </Button>
            <span className="px-2 font-mono text-zinc-300">
              {page} / {data.meta.last_page}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.meta.last_page}
              onClick={() => updateParam('page', (page + 1).toString())}
              rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
