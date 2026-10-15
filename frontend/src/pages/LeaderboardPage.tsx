import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { LeaderboardUser, PaginationMeta } from '@/types';
import { Button } from '@/components/ui/Button';

interface LeaderboardApiResponse {
  data: LeaderboardUser[];
  meta: PaginationMeta;
}

export const LeaderboardPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1', 10);

  const { data, isLoading, isError, refetch } = useQuery<LeaderboardApiResponse>({
    queryKey: ['leaderboard', page],
    queryFn: async () => {
      const res = await api.get('/leaderboard', { params: { page, per_page: 20 } });
      return res.data;
    },
  });

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold text-xs mx-auto">
            1
          </span>
        );
      case 2:
        return (
          <span className="w-6 h-6 rounded-full bg-zinc-300/20 text-zinc-300 border border-zinc-400/40 flex items-center justify-center font-bold text-xs mx-auto">
            2
          </span>
        );
      case 3:
        return (
          <span className="w-6 h-6 rounded-full bg-amber-700/20 text-amber-600 border border-amber-700/40 flex items-center justify-center font-bold text-xs mx-auto">
            3
          </span>
        );
      default:
        return <span className="font-mono text-zinc-500 text-xs">{rank}</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2.5">
            <Trophy className="w-6 h-6 text-violet-400" />
            Global Hall of Fame
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Ranked by server-computed total XP earned through verified problem solves.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          Live Server Ranking
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/30">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/80 text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
              <th className="py-3 px-4 w-16 text-center">Rank</th>
              <th className="py-3 px-4">Programmer</th>
              <th className="py-3 px-4 w-24 text-center">Level</th>
              <th className="py-3 px-4 w-32 text-center hidden sm:table-cell">Problems</th>
              <th className="py-3 px-4 w-32 text-right">Total XP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 text-sm">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-3.5 px-4 text-center">
                    <div className="w-5 h-5 bg-zinc-800 rounded-full mx-auto" />
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="h-4 bg-zinc-800 rounded w-1/3 mb-1" />
                    <div className="h-3 bg-zinc-800/50 rounded w-1/4" />
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="h-4 bg-zinc-800 rounded w-10 mx-auto" />
                  </td>
                  <td className="py-3.5 px-4 text-center hidden sm:table-cell">
                    <div className="h-4 bg-zinc-800 rounded w-12 mx-auto" />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="h-4 bg-zinc-800 rounded w-16 ml-auto" />
                  </td>
                </tr>
              ))
            ) : isError ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-zinc-400">
                  <p className="text-rose-400 text-xs">Failed to load leaderboard rankings.</p>
                  <Button variant="secondary" size="sm" className="mt-3" onClick={() => refetch()}>
                    Retry
                  </Button>
                </td>
              </tr>
            ) : (
              data?.data?.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-zinc-850/30 transition-colors group"
                >
                  <td className="py-3.5 px-4 text-center">
                    {getRankBadge(user.rank)}
                  </td>

                  <td className="py-3.5 px-4">
                    <Link
                      to={`/profile/${user.username}`}
                      className="font-medium text-zinc-100 group-hover:text-violet-300 transition-colors flex items-center gap-2"
                    >
                      <span>{user.name}</span>
                      <span className="text-xs text-zinc-500 font-mono font-normal">
                        @{user.username}
                      </span>
                    </Link>
                  </td>

                  <td className="py-3.5 px-4 text-center font-mono text-xs text-violet-400 font-semibold">
                    Lvl {user.level}
                  </td>

                  <td className="py-3.5 px-4 text-center font-mono text-xs text-zinc-300 hidden sm:table-cell">
                    {user.solved_count} Solved
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono text-xs font-bold text-zinc-100">
                    {user.xp.toLocaleString()} XP
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {data?.meta && data.meta.last_page > 1 && (
        <div className="flex items-center justify-between text-xs text-zinc-400 pt-2">
          <span>
            Total Competitors: <span className="font-semibold text-zinc-200">{data.meta.total}</span>
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => {
                const next = new URLSearchParams(searchParams);
                next.set('page', (page - 1).toString());
                setSearchParams(next);
              }}
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
              onClick={() => {
                const next = new URLSearchParams(searchParams);
                next.set('page', (page + 1).toString());
                setSearchParams(next);
              }}
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
