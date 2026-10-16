import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Trophy,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  ChevronRight,
  Flame,
  Award,
  Zap,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { ContestItem } from '@/types';
import { useAuth } from '@/features/auth/AuthContext';
import { Button } from '@/components/ui/Button';

export const ContestsPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'active' | 'upcoming' | 'finished'>('active');

  const { data, isLoading } = useQuery<{
    active: ContestItem[];
    upcoming: ContestItem[];
    finished: ContestItem[];
  }>({
    queryKey: ['contests'],
    queryFn: async () => {
      const res = await api.get('/contests');
      return res.data;
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (slug: string) => {
      const res = await api.post(`/contests/${slug}/register`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contests'] });
    },
  });

  const activeContests = data?.active || [];
  const upcomingContests = data?.upcoming || [];
  const finishedContests = data?.finished || [];

  const currentList =
    activeTab === 'active'
      ? activeContests
      : activeTab === 'upcoming'
      ? upcomingContests
      : finishedContests;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-amber-500 text-xs font-semibold uppercase tracking-wider mb-1">
          <Trophy className="w-4 h-4" />
          Competitive Programming
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Contests & Timed Tournaments
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1.5 max-w-2xl">
          Compete against programmers worldwide under strict time limits. Solve problems, gain rating points, and ascend the international leaderboard.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'active'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <Flame className="w-4 h-4" /> Live Now ({activeContests.length})
        </button>
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'upcoming'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <Calendar className="w-4 h-4" /> Upcoming ({upcomingContests.length})
        </button>
        <button
          onClick={() => setActiveTab('finished')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'finished'
              ? 'border-zinc-500 text-zinc-900 dark:text-zinc-100'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <Award className="w-4 h-4" /> Past Contests ({finishedContests.length})
        </button>
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {currentList.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 bg-zinc-50 dark:bg-zinc-900/30 rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <Trophy className="w-10 h-10 mx-auto mb-2 text-zinc-400" />
              <p className="text-sm">No contests found in this category right now.</p>
            </div>
          ) : (
            currentList.map((contest) => (
              <div
                key={contest.id}
                className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      contest.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : contest.status === 'upcoming'
                        ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30'
                        : 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/30'
                    }`}>
                      {contest.status === 'active' ? '● Live' : contest.status}
                    </span>
                    <span className="text-xs text-zinc-500 font-mono">
                      {new Date(contest.start_time).toLocaleString()}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    {contest.title}
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {contest.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-zinc-500 pt-1 font-mono">
                    <span className="flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      {contest.challenges_count} Challenges
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-zinc-400" />
                      {contest.participants_count} Competitors
                    </span>
                  </div>
                </div>

                <div className="flex flex-row md:flex-col items-end gap-3 shrink-0">
                  {contest.status === 'active' ? (
                    <Link to={`/contests/${contest.slug}`}>
                      <Button variant="primary" size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white">
                        Enter Contest Arena
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  ) : contest.status === 'upcoming' ? (
                    contest.is_registered ? (
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <CheckCircle2 className="w-4 h-4" /> Registered
                      </span>
                    ) : user ? (
                      <Button
                        size="sm"
                        onClick={() => registerMutation.mutate(contest.slug)}
                        isLoading={registerMutation.isPending}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white"
                      >
                        Register Now
                      </Button>
                    ) : (
                      <Link to="/login">
                        <Button variant="secondary" size="sm">
                          Log in to Register
                        </Button>
                      </Link>
                    )
                  ) : (
                    <Link to={`/contests/${contest.slug}/leaderboard`}>
                      <Button variant="secondary" size="sm">
                        View Standings
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  )}

                  <Link
                    to={`/contests/${contest.slug}/leaderboard`}
                    className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 underline font-mono"
                  >
                    Leaderboard
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
