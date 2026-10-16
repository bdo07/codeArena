import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Trophy,
  Clock,
  ChevronLeft,
  ChevronRight,
  Flame,
  Award,
  AlertTriangle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { ContestItem } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export const ContestDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data, isLoading, isError } = useQuery<{ contest: ContestItem }>({
    queryKey: ['contest', slug],
    queryFn: async () => {
      const res = await api.get(`/contests/${slug}`);
      return res.data;
    },
  });

  const contest = data?.contest;

  if (isLoading) {
    return (
      <div className="py-24 flex justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !contest) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Contest not found</h2>
        <Link to="/contests" className="inline-block mt-4">
          <Button variant="primary" size="sm">Back to Contests</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      <div>
        <Link
          to="/contests"
          className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center gap-1 font-medium transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Contests
        </Link>
      </div>

      <div className="p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
              contest.status === 'active'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30'
            }`}>
              {contest.status === 'active' ? '● Live' : contest.status}
            </span>
            <span className="text-xs font-mono text-zinc-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Closes: {new Date(contest.end_time).toLocaleString()}
            </span>
          </div>

          <Link to={`/contests/${contest.slug}/leaderboard`}>
            <Button size="sm" variant="outline">
              <Trophy className="w-3.5 h-3.5 mr-1 text-amber-500" />
              Live Leaderboard
            </Button>
          </Link>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
          {contest.title}
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-3xl leading-relaxed">
          {contest.description}
        </p>
      </div>

      {/* Challenges List */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider text-xs">
          Contest Problems
        </h2>

        {!contest.challenges || contest.challenges.length === 0 ? (
          <div className="p-8 rounded-xl bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-500">
            Problems will be revealed once the contest begins.
          </div>
        ) : (
          <div className="space-y-3">
            {contest.challenges.map((c, idx) => (
              <Link
                key={c.id}
                to={`/challenges/${c.slug}`}
                className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 hover:border-violet-500/60 dark:hover:border-violet-500/60 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 font-mono font-bold text-xs flex items-center justify-center text-zinc-700 dark:text-zinc-300">
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                      {c.title}
                    </h3>
                    <span className="text-[11px] text-zinc-500 font-mono">
                      Category: {c.category} · Score Value: {c.points} pts
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant={c.difficulty as any} size="sm">
                    {c.difficulty}
                  </Badge>
                  <Button size="sm" variant="secondary" className="text-xs">
                    Solve
                    <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
