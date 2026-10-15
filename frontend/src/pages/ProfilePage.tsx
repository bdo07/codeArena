import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  User as UserIcon,
  Calendar,
  Sparkles,
  Trophy,
  CheckCircle2,
  Award,
  Zap,
  ShieldCheck,
  Flame,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Badge as BadgeType } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface ProfileData {
  id: number;
  name: string;
  username: string;
  xp: number;
  level: number;
  role: string;
  joined_at: string;
  solved_count: number;
  accepted_count: number;
  total_submissions: number;
  badges: BadgeType[];
  solved_challenges: Array<{
    id: number;
    title: string;
    slug: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    tags: string[];
    best_score: number;
    solved_at: string;
  }>;
}

export const ProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();

  const { data, isLoading, isError } = useQuery<{ profile: ProfileData }>({
    queryKey: ['profile', username],
    queryFn: async () => {
      const res = await api.get(`/users/${username}`);
      return res.data;
    },
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
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-zinc-400">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <span className="text-xs">Loading profile...</span>
      </div>
    );
  }

  if (isError || !data?.profile) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <p className="text-rose-400 text-sm">User "@{username}" does not exist.</p>
        <Link to="/leaderboard">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Leaderboard
          </Button>
        </Link>
      </div>
    );
  }

  const { profile } = data;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-left">
      {/* Profile Overview Card */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-violet-950/60 border border-violet-700/50 flex items-center justify-center text-xl font-bold text-violet-300">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-zinc-100">{profile.name}</h1>
                {profile.role === 'admin' && (
                  <Badge variant="violet" size="sm">
                    Admin
                  </Badge>
                )}
              </div>
              <p className="text-xs text-zinc-400 font-mono">@{profile.username}</p>
              <div className="flex items-center gap-3 text-xs text-zinc-500 mt-2">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Joined {new Date(profile.joined_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* XP & Level Pill */}
          <div className="flex items-center gap-3 sm:text-right">
            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
              <div className="flex items-center gap-1.5 text-xs text-violet-400 font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                Level {profile.level}
              </div>
              <div className="text-lg font-bold text-zinc-100 font-mono mt-0.5">
                {profile.xp.toLocaleString()} XP
              </div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 mt-6 pt-6 border-t border-zinc-800 text-center">
          <div>
            <div className="text-lg font-bold text-zinc-100 font-mono">
              {profile.solved_count}
            </div>
            <div className="text-[11px] text-zinc-500">Challenges Solved</div>
          </div>
          <div>
            <div className="text-lg font-bold text-zinc-100 font-mono">
              {profile.accepted_count}
            </div>
            <div className="text-[11px] text-zinc-500">Accepted Solves</div>
          </div>
          <div>
            <div className="text-lg font-bold text-zinc-100 font-mono">
              {profile.total_submissions}
            </div>
            <div className="text-[11px] text-zinc-500">Total Submissions</div>
          </div>
        </div>
      </Card>

      {/* Badges Section */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
          <Award className="w-4 h-4 text-violet-400" />
          Badges & Achievements ({profile.badges.length})
        </h2>

        {profile.badges.length === 0 ? (
          <p className="text-xs text-zinc-500">No badges earned yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {profile.badges.map((b) => (
              <div
                key={b.id}
                className="p-3.5 rounded-lg border border-zinc-800 bg-zinc-900/40 text-center flex flex-col items-center"
              >
                <div className="w-10 h-10 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center mb-2">
                  {getBadgeIcon(b.icon)}
                </div>
                <span className="font-semibold text-xs text-zinc-200">{b.name}</span>
                <span className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5">
                  {b.description}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Solved Challenges List */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          Solved Challenges ({profile.solved_challenges.length})
        </h2>

        {profile.solved_challenges.length === 0 ? (
          <p className="text-xs text-zinc-500">No challenges solved yet.</p>
        ) : (
          <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/30 divide-y divide-zinc-800">
            {profile.solved_challenges.map((item) => (
              <div
                key={item.id}
                className="p-4 flex items-center justify-between hover:bg-zinc-850/30 transition-colors text-xs"
              >
                <div className="flex items-center gap-3">
                  <Badge variant={item.difficulty} size="sm">
                    {item.difficulty}
                  </Badge>
                  <div>
                    <Link
                      to={`/challenges/${item.slug}`}
                      className="font-medium text-zinc-100 hover:text-violet-300 transition-colors"
                    >
                      {item.title}
                    </Link>
                    <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                      Solved on {new Date(item.solved_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <Link
                  to={`/challenges/${item.slug}`}
                  className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 font-medium"
                >
                  Solve Again <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
