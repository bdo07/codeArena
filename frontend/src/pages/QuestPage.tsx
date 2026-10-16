import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  Compass,
  Trophy,
  CheckCircle2,
  Lock,
  Play,
  Sparkles,
  Flame,
  ArrowRight,
  Clock,
  Target,
  Award,
  Layers,
  List,
  Network,
  X,
  ExternalLink,
  ChevronRight,
  Code2,
  Server,
  Database,
  Cpu,
  Terminal,
  Zap,
  HelpCircle,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { questApi } from '@/services/questApi';
import {
  QuestPathItem,
  QuestPathDetail,
  QuestStageDetail,
  DailyMissionItem,
  ProgressionDashboardData,
  Difficulty,
} from '@/types';
import { Button } from '@/components/ui/Button';

// Category / Path Icon Mapper
const getPathIcon = (iconName: string, className = 'w-5 h-5') => {
  switch (iconName.toLowerCase()) {
    case 'layout':
    case 'code':
      return <Code2 className={className} />;
    case 'server':
      return <Server className={className} />;
    case 'database':
      return <Database className={className} />;
    case 'cpu':
      return <Cpu className={className} />;
    case 'terminal':
      return <Terminal className={className} />;
    default:
      return <Compass className={className} />;
  }
};

const getDifficultyBadge = (difficulty: Difficulty) => {
  switch (difficulty) {
    case 'Beginner':
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    case 'Easy':
      return 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20';
    case 'Medium':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    case 'Hard':
      return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
    case 'Expert':
      return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
    default:
      return 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20';
  }
};

export const QuestPage: React.FC = () => {
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { slug: routeSlug } = useParams<{ slug?: string }>();

  // State
  const [paths, setPaths] = useState<QuestPathItem[]>([]);
  const [selectedPathSlug, setSelectedPathSlug] = useState<string>(routeSlug || 'frontend-developer');
  const [activePathDetail, setActivePathDetail] = useState<QuestPathDetail | null>(null);
  const [dailyMissions, setDailyMissions] = useState<DailyMissionItem[]>([]);
  const [progression, setProgression] = useState<ProgressionDashboardData | null>(null);

  const [isLoadingPaths, setIsLoadingPaths] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [viewMode, setViewMode] = useState<'tree' | 'list'>('tree');
  const [selectedStage, setSelectedStage] = useState<QuestStageDetail | null>(null);
  const [isClaimingStage, setIsClaimingStage] = useState(false);
  const [isClaimingMission, setIsClaimingMission] = useState<number | null>(null);
  const [claimToast, setClaimToast] = useState<{ title: string; message: string } | null>(null);

  // Load paths index, daily missions, progression
  const loadIndexData = async () => {
    try {
      setIsLoadingPaths(true);
      const data = await questApi.getQuestsIndex();
      setPaths(data.paths);
      setDailyMissions(data.daily_missions);
      setProgression(data.progression);

      // If no route slug specified, pick the first path slug
      if (!routeSlug && data.paths.length > 0 && !selectedPathSlug) {
        setSelectedPathSlug(data.paths[0].slug);
      }
    } catch (err) {
      console.error('Failed to load quest paths:', err);
    } finally {
      setIsLoadingPaths(false);
    }
  };

  useEffect(() => {
    loadIndexData();
  }, [user]);

  // Load active path detail
  const loadActivePath = async (slug: string) => {
    try {
      setIsLoadingDetail(true);
      const detail = await questApi.getPathDetail(slug);
      setActivePathDetail(detail);

      // If a stage was previously selected, update its record
      if (selectedStage) {
        const updated = detail.stages.find((s) => s.id === selectedStage.id);
        if (updated) setSelectedStage(updated);
      }
    } catch (err) {
      console.error('Failed to load quest path details:', err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  useEffect(() => {
    if (selectedPathSlug) {
      loadActivePath(selectedPathSlug);
    }
  }, [selectedPathSlug, user]);

  useEffect(() => {
    if (routeSlug && routeSlug !== selectedPathSlug) {
      setSelectedPathSlug(routeSlug);
    }
  }, [routeSlug]);

  // Handle stage reward claim
  const handleClaimStage = async (stageId: number) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      setIsClaimingStage(true);
      const res = await questApi.claimStageReward(stageId);
      if (res.success) {
        setClaimToast({
          title: '🎉 Stage Reward Claimed!',
          message: res.message,
        });
        setTimeout(() => setClaimToast(null), 5000);
        await refreshUser();
        await loadIndexData();
        await loadActivePath(selectedPathSlug);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to claim stage reward.');
    } finally {
      setIsClaimingStage(false);
    }
  };

  // Handle daily mission claim
  const handleClaimMission = async (missionId: number) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      setIsClaimingMission(missionId);
      const res = await questApi.claimDailyMission(missionId);
      if (res.success) {
        setClaimToast({
          title: '🎯 Daily Mission Claimed!',
          message: res.message,
        });
        setTimeout(() => setClaimToast(null), 5000);
        await refreshUser();
        await loadIndexData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to claim daily mission.');
    } finally {
      setIsClaimingMission(null);
    }
  };

  // Find the next unsolved challenge in a stage to navigate directly
  const handleContinueStage = (stage: QuestStageDetail) => {
    const nextChallenge = stage.challenges.find((c) => !c.is_solved) || stage.challenges[0];
    if (nextChallenge) {
      navigate(`/challenges/${nextChallenge.slug}`);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 pb-16">
      {/* Toast Notification */}
      {claimToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-start gap-3 p-4 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xl border border-zinc-700 dark:border-zinc-300 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Sparkles className="w-5 h-5 text-amber-400 dark:text-amber-600 mt-0.5 shrink-0" />
          <div>
            <h4 className="font-semibold text-sm">{claimToast.title}</h4>
            <p className="text-xs text-zinc-300 dark:text-zinc-700 mt-0.5">{claimToast.message}</p>
          </div>
          <button
            onClick={() => setClaimToast(null)}
            className="text-zinc-400 hover:text-white dark:text-zinc-600 dark:hover:text-zinc-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Hero Banner */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Interactive Learning Adventure</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {t('quest.title')}
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
              {t('quest.subtitle')}
            </p>
          </div>

          {/* User Quick Stats or Guest CTA */}
          {user ? (
            <div className="flex items-center gap-4 bg-zinc-100/80 dark:bg-zinc-800/60 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700/60 shadow-2xs">
              <div className="text-center px-3 border-r border-zinc-200 dark:border-zinc-700">
                <div className="text-xs text-zinc-500 dark:text-zinc-400 uppercase font-mono">Level</div>
                <div className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center justify-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-violet-500" />
                  {user.level}
                </div>
              </div>
              <div className="text-center px-3 border-r border-zinc-200 dark:border-zinc-700">
                <div className="text-xs text-zinc-500 dark:text-zinc-400 uppercase font-mono">Total XP</div>
                <div className="text-base font-bold text-violet-600 dark:text-violet-400">
                  {user.xp}
                </div>
              </div>
              <div className="text-center px-3">
                <div className="text-xs text-zinc-500 dark:text-zinc-400 uppercase font-mono">Completed</div>
                <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {progression?.completed_stages ?? 0}/{progression?.total_stages ?? 20}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 max-w-sm flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-amber-800 dark:text-amber-200 leading-snug">
                  {t('quest.guestNotice')}
                </p>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline mt-1.5"
                >
                  {t('quest.signInToSave')} <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-8">
        {/* Daily Missions Section */}
        {dailyMissions.length > 0 && (
          <div className="bg-white dark:bg-zinc-900/60 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-violet-500" />
                <h2 className="text-sm font-semibold tracking-wide uppercase text-zinc-900 dark:text-zinc-100 font-mono">
                  {t('quest.dailyMissions')}
                </h2>
              </div>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {t('quest.missionsDesc')}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {dailyMissions.map((mission, idx) => {
                const isClaimed = mission.reward_claimed;
                const canClaim = mission.can_claim && !isClaimed;
                const progressPercent = Math.min(
                  100,
                  Math.round((mission.current_count / Math.max(1, mission.target_count)) * 100)
                );

                return (
                  <div
                    key={mission.id || idx}
                    className={`p-3.5 rounded-lg border transition-all ${
                      isClaimed
                        ? 'bg-zinc-50 dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-800/80 opacity-75'
                        : canClaim
                        ? 'bg-violet-50/50 dark:bg-violet-950/20 border-violet-300 dark:border-violet-700/60 shadow-2xs'
                        : 'bg-zinc-50/70 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-medium text-xs text-zinc-900 dark:text-zinc-100">
                        {mission.title}
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-semibold font-mono rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        +{mission.reward_xp} XP
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-1 leading-normal">
                      {mission.description}
                    </p>

                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                        <span>Progress</span>
                        <span>
                          {mission.current_count}/{mission.target_count}
                        </span>
                      </div>
                      <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            isClaimed
                              ? 'bg-emerald-500'
                              : canClaim
                              ? 'bg-violet-500 animate-pulse'
                              : 'bg-zinc-400 dark:bg-zinc-600'
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-end">
                      {isClaimed ? (
                        <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {t('quest.missionClaimed')}
                        </span>
                      ) : canClaim ? (
                        <button
                          onClick={() => mission.id && handleClaimMission(mission.id)}
                          disabled={isClaimingMission === mission.id}
                          className="px-2.5 py-1 text-xs font-semibold rounded bg-violet-600 hover:bg-violet-500 text-white shadow-2xs transition-colors flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3" />
                          {t('quest.claimMission', { xp: mission.reward_xp })}
                        </button>
                      ) : (
                        <span className="text-[11px] text-zinc-500 font-mono">In Progress</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Personal Progression & Deterministic Next Recommendation Row */}
        {progression && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Skills Practiced */}
            <div className="bg-white dark:bg-zinc-900/60 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2 text-zinc-500 dark:text-zinc-400">
                  <Layers className="w-4 h-4 text-violet-500" />
                  <span className="text-xs font-mono uppercase tracking-wide">
                    {t('quest.skillsPracticed')}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {progression.skills_practiced && progression.skills_practiced.length > 0 ? (
                    progression.skills_practiced.map((skill) => (
                      <span
                        key={skill.skill}
                        className="px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60 flex items-center gap-1"
                      >
                        {skill.skill}
                        <span className="text-[10px] text-violet-600 dark:text-violet-400 font-mono font-bold">
                          ×{skill.count}
                        </span>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-zinc-500 italic">
                      Solve challenges to unlock skill analytics.
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500 font-mono">
                <span>Paths Mastered:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">
                  {progression.completed_paths} / {progression.total_paths}
                </span>
              </div>
            </div>

            {/* Next Recommended Challenge Box */}
            <div className="lg:col-span-2 bg-gradient-to-r from-violet-500/5 via-violet-500/10 to-indigo-500/5 dark:from-violet-950/20 dark:via-zinc-900/80 dark:to-indigo-950/20 rounded-xl border border-violet-500/20 p-4 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-xs font-mono uppercase tracking-wide font-semibold">
                      {t('quest.nextRecommendation')}
                    </span>
                  </div>
                  {progression.next_recommended_challenge && (
                    <span
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded border ${getDifficultyBadge(
                        progression.next_recommended_challenge.difficulty
                      )}`}
                    >
                      {progression.next_recommended_challenge.difficulty}
                    </span>
                  )}
                </div>

                {progression.next_recommended_challenge ? (
                  <div className="mt-1 space-y-1">
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      {progression.next_recommended_challenge.title}
                      <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
                        ({progression.next_recommended_challenge.category})
                      </span>
                    </h3>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      💡 {progression.next_recommended_challenge.reason}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 italic mt-1">
                    All currently available quest challenges solved! Great work!
                  </p>
                )}
              </div>

              {progression.next_recommended_challenge && (
                <div className="mt-4 flex items-center justify-end">
                  <Button
                    size="sm"
                    onClick={() =>
                      navigate(`/challenges/${progression.next_recommended_challenge?.slug}`)
                    }
                    className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    {t('quest.startChallenge')}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Learning Paths Navigation Tabs */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Compass className="w-4 h-4 text-violet-500" />
              {t('quest.learningPaths')}
            </h2>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 bg-zinc-200/80 dark:bg-zinc-800/80 p-0.5 rounded-lg border border-zinc-300 dark:border-zinc-700/60">
              <button
                onClick={() => setViewMode('tree')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                  viewMode === 'tree'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
                title="Skill Tree Node Map"
              >
                <Network className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('quest.treeView')}</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
                title="Accessible Stage List"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('quest.listView')}</span>
              </button>
            </div>
          </div>

          {/* Path Tabs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {paths.map((path) => {
              const isSelected = selectedPathSlug === path.slug;

              return (
                <button
                  key={path.id}
                  onClick={() => {
                    setSelectedPathSlug(path.slug);
                    navigate(`/quest/${path.slug}`, { replace: true });
                  }}
                  className={`text-left p-3.5 rounded-xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? 'bg-white dark:bg-zinc-900 border-violet-500 shadow-sm ring-1 ring-violet-500/30'
                      : 'bg-white/60 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-white dark:hover:bg-zinc-900/70'
                  }`}
                >
                  {/* Subtle top indicator bar */}
                  {isSelected && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-violet-600 dark:bg-violet-400" />
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isSelected
                            ? 'bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                        }`}
                      >
                        {getPathIcon(path.icon)}
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${getDifficultyBadge(
                          path.difficulty
                        )}`}
                      >
                        {path.difficulty}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 line-clamp-1">
                        {path.title}
                      </h3>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-3 h-3" />
                          {path.estimated_hours}h
                        </span>
                        <span>•</span>
                        <span>{path.total_stages} stages</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
                      <span>Progress</span>
                      <span className="font-bold text-zinc-700 dark:text-zinc-300">
                        {path.progress_percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-1 overflow-hidden">
                      <div
                        className={`h-full ${
                          path.is_completed ? 'bg-emerald-500' : 'bg-violet-600 dark:bg-violet-400'
                        }`}
                        style={{ width: `${path.progress_percentage}%` }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Path Details & Skill Tree Section */}
        {isLoadingDetail ? (
          <div className="bg-white dark:bg-zinc-900/60 rounded-xl border border-zinc-200 dark:border-zinc-800 p-12 text-center text-zinc-500">
            <div className="inline-block animate-spin w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full mb-2" />
            <p className="text-xs">Loading quest tree...</p>
          </div>
        ) : activePathDetail ? (
          <div className="space-y-6">
            {/* Path Header Info */}
            <div className="bg-white dark:bg-zinc-900/60 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono uppercase text-violet-600 dark:text-violet-400 font-semibold">
                    {activePathDetail.category} Path
                  </span>
                  <span className="text-xs text-zinc-400">•</span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    Reward: +{activePathDetail.reward_xp} XP
                  </span>
                  {activePathDetail.reward_badge && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      <Award className="w-3 h-3" />
                      {activePathDetail.reward_badge.name}
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                  {activePathDetail.title}
                </h2>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-3xl">
                  {activePathDetail.description}
                </p>
              </div>

              {activePathDetail.is_all_completed && (
                <div className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  {t('quest.pathCompleted')}
                </div>
              )}
            </div>

            {/* Tree View vs List View Rendering */}
            {viewMode === 'tree' ? (
              /* Interactive Visual Node Map */
              <div className="bg-white dark:bg-zinc-900/40 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-10 shadow-2xs relative overflow-hidden">
                <div className="max-w-3xl mx-auto flex flex-col items-center space-y-6 sm:space-y-8 relative">
                  {activePathDetail.stages.map((stage, idx) => {
                    const isLast = idx === activePathDetail.stages.length - 1;
                    const isCompleted = stage.status === 'completed';
                    const isAvailable = stage.status === 'available';
                    const isInProgress = stage.status === 'in_progress';
                    const isLocked = stage.status === 'locked';

                    return (
                      <React.Fragment key={stage.id}>
                        {/* Interactive Node Card */}
                        <div
                          onClick={() => setSelectedStage(stage)}
                          className={`w-full max-w-lg p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer relative z-10 group ${
                            isCompleted
                              ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60 hover:border-emerald-400 shadow-2xs'
                              : isInProgress
                              ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700/60 hover:border-amber-400 shadow-2xs'
                              : isAvailable
                              ? 'bg-white dark:bg-zinc-900 border-violet-400/80 dark:border-violet-500/60 hover:border-violet-500 shadow-md ring-2 ring-violet-500/20'
                              : 'bg-zinc-50 dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-800 opacity-65 hover:opacity-90'
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            {/* Status Node Icon */}
                            <div
                              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                                isCompleted
                                  ? 'bg-emerald-500 text-white shadow-emerald-500/20 shadow-md'
                                  : isInProgress
                                  ? 'bg-amber-500 text-white shadow-amber-500/20 shadow-md'
                                  : isAvailable
                                  ? 'bg-violet-600 text-white shadow-violet-500/30 shadow-md animate-pulse'
                                  : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400'
                              }`}
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="w-6 h-6" />
                              ) : isInProgress ? (
                                <Clock className="w-6 h-6" />
                              ) : isAvailable ? (
                                <Play className="w-5 h-5 fill-current ml-0.5" />
                              ) : (
                                <Lock className="w-5 h-5" />
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-semibold">
                                    Stage {stage.position}
                                  </span>
                                  <span
                                    className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                                      isCompleted
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                        : isInProgress
                                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                        : isAvailable
                                        ? 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300'
                                        : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
                                    }`}
                                  >
                                    {t(`quest.${stage.status}`)}
                                  </span>
                                </div>
                                <span className="text-xs font-mono font-bold text-violet-600 dark:text-violet-400">
                                  +{stage.reward_xp} XP
                                </span>
                              </div>

                              <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 mt-1.5 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                                {stage.title}
                              </h3>
                              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5 line-clamp-2">
                                {stage.description}
                              </p>

                              {/* Challenge counters and quick CTA */}
                              <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                                <span className="text-zinc-500 font-mono text-[11px]">
                                  {stage.solved_challenges}/{stage.total_challenges} Challenges
                                  Solved
                                </span>

                                <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                                  {isLocked
                                    ? 'Inspect Stage'
                                    : stage.can_claim_reward
                                    ? 'Claim XP'
                                    : 'Continue'}
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Connecting Line Between Stages */}
                        {!isLast && (
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-0.5 h-8 sm:h-10 transition-colors duration-300 ${
                                isCompleted
                                  ? 'bg-emerald-500'
                                  : 'bg-zinc-300 dark:bg-zinc-700'
                              }`}
                            />
                            <div
                              className={`w-2 h-2 rounded-full -mt-1 ${
                                isCompleted
                                  ? 'bg-emerald-500 ring-2 ring-emerald-500/20'
                                  : 'bg-zinc-300 dark:bg-zinc-700'
                              }`}
                            />
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Accessible List View */
              <div className="space-y-4">
                {activePathDetail.stages.map((stage) => {
                  const isCompleted = stage.status === 'completed';
                  const isAvailable = stage.status === 'available';
                  const isInProgress = stage.status === 'in_progress';
                  const isLocked = stage.status === 'locked';

                  return (
                    <div
                      key={stage.id}
                      className="bg-white dark:bg-zinc-900/60 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-2xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                              isCompleted
                                ? 'bg-emerald-500 text-white'
                                : isInProgress
                                ? 'bg-amber-500 text-white'
                                : isAvailable
                                ? 'bg-violet-600 text-white'
                                : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : isInProgress ? (
                              <Clock className="w-5 h-5" />
                            ) : isAvailable ? (
                              <Play className="w-4 h-4 fill-current ml-0.5" />
                            ) : (
                              <Lock className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-semibold">
                                Stage {stage.position}
                              </span>
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                                  isCompleted
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : isInProgress
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                    : isAvailable
                                    ? 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300'
                                    : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
                                }`}
                              >
                                {t(`quest.${stage.status}`)}
                              </span>
                            </div>
                            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mt-1">
                              {stage.title}
                            </h3>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono font-bold text-violet-600 dark:text-violet-400">
                            +{stage.reward_xp} XP
                          </span>
                          <Button
                            size="sm"
                            variant={isAvailable || isInProgress ? 'default' : 'outline'}
                            onClick={() => setSelectedStage(stage)}
                            className="text-xs font-semibold"
                          >
                            {stage.can_claim_reward ? 'Claim XP' : 'View Stage Details'}
                          </Button>
                        </div>
                      </div>

                      {/* Prerequisites Notice */}
                      {stage.prerequisite && (
                        <div className="mt-3 text-xs flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/40 px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700/50">
                          {stage.prerequisite.is_met ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          ) : (
                            <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          )}
                          <span>
                            {stage.prerequisite.is_met
                              ? t('quest.prereqMet')
                              : t('quest.prereqRequired', { title: stage.prerequisite.title })}
                          </span>
                        </div>
                      )}

                      {/* Challenges Accordion/List */}
                      <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
                        <div className="text-[11px] font-mono uppercase text-zinc-500 font-semibold">
                          {t('quest.challenges')} ({stage.solved_challenges}/{stage.total_challenges})
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {stage.challenges.map((ch) => (
                            <div
                              key={ch.id}
                              className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {ch.is_solved ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                ) : (
                                  <div className="w-4 h-4 rounded-full border border-zinc-300 dark:border-zinc-700 shrink-0" />
                                )}
                                <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
                                  {ch.title}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span
                                  className={`text-[9px] px-1.5 py-0.2 rounded border font-semibold ${getDifficultyBadge(
                                    ch.difficulty
                                  )}`}
                                >
                                  {ch.difficulty}
                                </span>
                                <Link
                                  to={`/challenges/${ch.slug}`}
                                  className="text-xs text-violet-600 dark:text-violet-400 hover:underline flex items-center"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Stage Detail Drawer / Modal */}
      {selectedStage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-semibold">
                    Stage {selectedStage.position}
                  </span>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded ${
                      selectedStage.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : selectedStage.status === 'in_progress'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : selectedStage.status === 'available'
                        ? 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300'
                        : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
                    }`}
                  >
                    {t(`quest.${selectedStage.status}`)}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {selectedStage.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedStage(null)}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 overflow-y-auto space-y-5">
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {selectedStage.description}
              </p>

              {/* Reward info */}
              <div className="bg-violet-50/50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800/40 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-violet-700 dark:text-violet-300 text-xs font-semibold">
                  <Sparkles className="w-4 h-4 text-violet-500" />
                  Stage Reward
                </div>
                <div className="text-sm font-mono font-bold text-violet-600 dark:text-violet-400">
                  +{selectedStage.reward_xp} XP
                </div>
              </div>

              {/* Prerequisites evaluation */}
              {selectedStage.prerequisite && (
                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase text-zinc-500 font-semibold">
                    {t('quest.prerequisites')}
                  </label>
                  <div
                    className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                      selectedStage.prerequisite.is_met
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
                    }`}
                  >
                    {selectedStage.prerequisite.is_met ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <Lock className="w-4 h-4 text-amber-500 shrink-0" />
                    )}
                    <span>
                      {selectedStage.prerequisite.is_met
                        ? t('quest.prereqMet')
                        : t('quest.prereqRequired', { title: selectedStage.prerequisite.title })}
                    </span>
                  </div>
                </div>
              )}

              {/* Challenges list */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono uppercase text-zinc-500 font-semibold">
                  <span>{t('quest.challenges')}</span>
                  <span>
                    {selectedStage.solved_challenges}/{selectedStage.total_challenges} solved
                  </span>
                </div>

                <div className="space-y-2">
                  {selectedStage.challenges.map((ch) => (
                    <div
                      key={ch.id}
                      className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 flex items-center justify-between gap-3 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {ch.is_solved ? (
                          <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full border-2 border-zinc-300 dark:border-zinc-700 flex items-center justify-center shrink-0" />
                        )}
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                            {ch.title}
                          </h4>
                          <span className="text-[11px] text-zinc-500 capitalize">{ch.category}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${getDifficultyBadge(
                            ch.difficulty
                          )}`}
                        >
                          {ch.difficulty}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedStage(null);
                            navigate(`/challenges/${ch.slug}`);
                          }}
                          className="text-xs h-7 px-2.5"
                        >
                          {ch.is_solved ? 'Review' : 'Solve'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-900/80 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-3">
              <Button variant="ghost" onClick={() => setSelectedStage(null)}>
                {t('common.close')}
              </Button>

              {selectedStage.can_claim_reward ? (
                <Button
                  onClick={() => handleClaimStage(selectedStage.id)}
                  disabled={isClaimingStage}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  {isClaimingStage
                    ? t('quest.claiming')
                    : t('quest.claimReward', { xp: selectedStage.reward_xp })}
                </Button>
              ) : selectedStage.reward_claimed ? (
                <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  {t('quest.rewardClaimed')}
                </div>
              ) : selectedStage.status !== 'locked' ? (
                <Button
                  onClick={() => {
                    handleContinueStage(selectedStage);
                    setSelectedStage(null);
                  }}
                  className="bg-violet-600 hover:bg-violet-500 text-white font-semibold flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  {t('quest.continue')}
                </Button>
              ) : (
                <Button disabled variant="outline" className="text-zinc-400 text-xs">
                  <Lock className="w-3.5 h-3.5 mr-1" />
                  Locked Stage
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestPage;
