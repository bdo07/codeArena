import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Trophy,
  Code2,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Award,
  Zap,
  ShieldCheck,
  Flame,
} from 'lucide-react';
import { api } from '@/lib/api';
import { DashboardStats } from '@/types';
import { useAuth } from '@/features/auth/AuthContext';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const { data, isLoading, isError, refetch } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await api.get('/dashboard/stats');
      return res.data;
    },
    enabled: Boolean(user),
  });

  const getBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case 'Award':
        return <Award className="w-5 h-5 text-violet-400" />;
      case 'Zap':
        return <Zap className="w-5 h-5 text-amber-400" />;
      case 'Trophy':
        return <Trophy className="w-5 h-5 text-yellow-400" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-5 h-5 text-emerald-400" />;
      default:
        return <Flame className="w-5 h-5 text-violet-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center text-zinc-400">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <span className="text-xs">Loading dashboard statistics...</span>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <p className="text-rose-400 text-sm">Failed to load dashboard metrics.</p>
        <Button variant="secondary" size="sm" className="mt-3" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const { stats, recent_submissions } = data;
  const breakdown = stats.difficulty_breakdown;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-left">
      {/* Welcome & CTA banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
              Welcome back, {data.user.name}
            </h1>
            <span className="text-xs font-mono text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
              @{data.user.username}
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Keep sharpening your algorithmic problem solving skills.
          </p>
        </div>

        <Link to="/challenges">
          <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
            Continue Solving
          </Button>
        </Link>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
            <span>Current Level</span>
            <Sparkles className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-2xl font-bold text-zinc-100 font-mono">
            Level {data.user.level}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1 font-mono">
            {data.user.xp.toLocaleString()} Total XP
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
            <span>Challenges Solved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-zinc-100 font-mono">
            {stats.solved_count}{' '}
            <span className="text-xs text-zinc-500 font-normal">/ {stats.total_challenges}</span>
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            {stats.total_challenges > 0
              ? `${Math.round((stats.solved_count / stats.total_challenges) * 100)}% Completed`
              : '0% Completed'}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
            <span>Total Submissions</span>
            <Code2 className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-bold text-zinc-100 font-mono">
            {stats.total_submissions}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">Evaluated on Judge0</div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
            <span>Acceptance Rate</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-zinc-100 font-mono">
            {stats.acceptance_rate}%
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">First-pass accuracy</div>
        </Card>
      </div>

      {/* Progress Breakdown & Badges */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Difficulty Breakdown (Left 7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-violet-400" />
            Solved Breakdown by Difficulty
          </h2>

          <Card className="p-5 space-y-5">
            {/* Easy */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-emerald-400">Easy</span>
                <span className="font-mono text-zinc-300">
                  {breakdown.Easy.solved} / {breakdown.Easy.total} ({breakdown.Easy.percentage}%)
                </span>
              </div>
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${breakdown.Easy.percentage}%` }}
                />
              </div>
            </div>

            {/* Medium */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-amber-400">Medium</span>
                <span className="font-mono text-zinc-300">
                  {breakdown.Medium.solved} / {breakdown.Medium.total} ({breakdown.Medium.percentage}%)
                </span>
              </div>
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${breakdown.Medium.percentage}%` }}
                />
              </div>
            </div>

            {/* Hard */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-rose-400">Hard</span>
                <span className="font-mono text-zinc-300">
                  {breakdown.Hard.solved} / {breakdown.Hard.total} ({breakdown.Hard.percentage}%)
                </span>
              </div>
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full transition-all duration-500"
                  style={{ width: `${breakdown.Hard.percentage}%` }}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Badges Collection (Right 5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <Award className="w-4 h-4 text-violet-400" />
            Earned Badges ({data.user.badges?.length || 0})
          </h2>

          <Card className="p-5">
            {data.user.badges && data.user.badges.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {data.user.badges.map((b) => (
                  <div
                    key={b.id}
                    className="p-3 rounded-lg border border-zinc-800 bg-zinc-950/60 flex flex-col items-center text-center"
                  >
                    <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-2">
                      {getBadgeIcon(b.icon)}
                    </div>
                    <span className="font-semibold text-xs text-zinc-200">{b.name}</span>
                    <span className="text-[10px] text-zinc-500 line-clamp-1 mt-0.5">
                      {b.description}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-zinc-500">
                <Award className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                <p>No badges earned yet.</p>
                <p className="text-[11px] text-zinc-600 mt-1">
                  Solve your first challenge to unlock the "First Solve" badge!
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Recent Activity List */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
          <Code2 className="w-4 h-4 text-violet-400" />
          Recent Activity
        </h2>

        <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/30">
          {recent_submissions.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-500">
              No recent submissions yet. Explore challenges to start practicing!
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {recent_submissions.map((sub) => (
                <div
                  key={sub.id}
                  className="p-4 flex items-center justify-between hover:bg-zinc-850/30 transition-colors text-xs"
                >
                  <div className="flex items-center gap-3">
                    {sub.status === 'Accepted' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400" />
                    )}
                    <div>
                      <Link
                        to={`/challenges/${sub.challenge.slug}`}
                        className="font-medium text-zinc-100 hover:text-violet-300"
                      >
                        {sub.challenge.title}
                      </Link>
                      <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                        {sub.language} · {new Date(sub.submitted_at || '').toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant={sub.challenge.difficulty} size="sm">
                      {sub.challenge.difficulty}
                    </Badge>
                    <span
                      className={`font-semibold font-mono ${
                        sub.status === 'Accepted' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {sub.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
