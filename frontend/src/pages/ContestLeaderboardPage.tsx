import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Trophy, ChevronLeft, Medal, Clock, Award } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';

export const ContestLeaderboardPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['contest-leaderboard', slug],
    queryFn: async () => {
      const res = await api.get(`/contests/${slug}/leaderboard`);
      return res.data;
    },
  });

  const participants = data?.data || [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-left">
      <div>
        <Link
          to={`/contests/${slug}`}
          className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center gap-1 font-medium transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Contest Details
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" />
            Contest Standings
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Live ranking based on problem point values and finish times.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 text-zinc-500 font-mono">
                <th className="py-3 px-4 w-16">Rank</th>
                <th className="py-3 px-4">Competitor</th>
                <th className="py-3 px-4 text-right">Score</th>
                <th className="py-3 px-4 text-right">Penalty Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-sans">
              {participants.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-zinc-500 italic">
                    No participants recorded yet.
                  </td>
                </tr>
              ) : (
                participants.map((p: any, idx: number) => {
                  const rank = idx + 1;
                  return (
                    <tr key={p.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/60 transition-colors">
                      <td className="py-3 px-4 font-bold font-mono">
                        {rank === 1 ? (
                          <span className="text-amber-500 flex items-center gap-1 font-extrabold text-sm">
                            🥇 1
                          </span>
                        ) : rank === 2 ? (
                          <span className="text-zinc-400 flex items-center gap-1 font-bold text-sm">
                            🥈 2
                          </span>
                        ) : rank === 3 ? (
                          <span className="text-amber-700 flex items-center gap-1 font-bold text-sm">
                            🥉 3
                          </span>
                        ) : (
                          <span className="text-zinc-500">#{rank}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          to={`/profile/${p.user?.username}`}
                          className="font-semibold text-zinc-900 dark:text-zinc-100 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                        >
                          {p.user?.name || p.user?.username}
                        </Link>
                        <span className="text-zinc-400 text-[10px] ml-2 font-mono">
                          @{p.user?.username}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {p.score} pts
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-zinc-500">
                        {Math.floor((p.finish_time_ms || 0) / 60000)}m {(Math.floor((p.finish_time_ms || 0) / 1000) % 60)}s
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
