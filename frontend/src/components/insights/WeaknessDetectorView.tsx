import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  ArrowRight,
  RefreshCw,
  ShieldAlert,
  Clock,
  Bug,
  Cpu,
  FileCode,
  Flame,
  Award,
  Layers,
  ChevronRight,
  Lock,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { weaknessApi } from '@/services/weaknessApi';
import { WeaknessInsightsData, WeaknessTopic } from '@/types/weakness';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface WeaknessDetectorViewProps {
  onChallengeSelect?: (slug: string) => void;
}

export const WeaknessDetectorView: React.FC<WeaknessDetectorViewProps> = () => {
  const { t } = useTranslation();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery<WeaknessInsightsData>({
    queryKey: ['weakness-insights'],
    queryFn: () => weaknessApi.getInsights(false),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const freshData = await weaknessApi.getInsights(true);
      // Refetch query
      await refetch();
    } catch (err) {
      console.error('Failed to recalculate weakness insights', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 py-6 animate-pulse">
        <div className="h-20 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-8 text-center rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 my-6">
        <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-red-500" />
        <p className="font-semibold">{t('weakness.errorLoading', 'Failed to load skill weakness insights.')}</p>
        <Button variant="outline" onClick={() => refetch()} className="mt-3 text-xs">
          {t('common.retry', 'Retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/40 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span>{t('weakness.title', 'Smart Weakness Detector')}</span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-800/40 font-semibold">
                  Deterministic
                </span>
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {t(
                  'weakness.subtitle',
                  'Statistical diagnosis based on actual submission outcomes and execution errors. Distinguishes verified struggle areas from insufficient data.'
                )}
              </p>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="self-start sm:self-auto flex items-center gap-1.5 text-xs shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-violet-500' : ''}`} />
          <span>{isRefreshing ? t('common.loading', 'Recalculating...') : t('weakness.refresh', 'Recalculate Diagnosis')}</span>
        </Button>
      </div>

      {/* Onboarding State for New Users */}
      {data.is_onboarding && data.onboarding && (
        <div className="p-6 rounded-2xl border border-amber-200/80 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/20 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                {t('weakness.onboardingTitle', 'Calibration Phase: In Progress')}
              </h3>
              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                {data.onboarding.message}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-amber-800 dark:text-amber-300 font-medium">
              <span>{t('weakness.calibrationProgress', 'Calibration Progress')}</span>
              <span>
                {data.onboarding.current_submissions} / {data.onboarding.required_submissions} attempts
              </span>
            </div>
            <div className="w-full h-2 bg-amber-200/60 dark:bg-amber-900/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-500 rounded-full"
                style={{ width: `${Math.min(100, data.onboarding.progress_percentage)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60">
          <div className="text-zinc-500 dark:text-zinc-400 font-medium">{t('weakness.overallAccuracy', 'Overall Accuracy')}</div>
          <div className="mt-1 text-2xl font-extrabold font-mono text-zinc-900 dark:text-zinc-100">
            {data.summary.overallAccuracy ?? data.summary.overall_accuracy}%
          </div>
          <div className="mt-1 text-[11px] text-zinc-400">
            {data.summary.total_submissions} {t('weakness.totalSubmissions', 'total attempts')}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60">
          <div className="text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            {t('weakness.weaknessesIdentified', 'Weaknesses')}
          </div>
          <div className="mt-1 text-2xl font-extrabold font-mono text-rose-600 dark:text-rose-400">
            {data.summary.weaknesses_count}
          </div>
          <div className="mt-1 text-[11px] text-zinc-400">{t('weakness.needFocus', 'Requires targeted practice')}</div>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60">
          <div className="text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {t('weakness.strengthsIdentified', 'Mastered Strengths')}
          </div>
          <div className="mt-1 text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
            {data.summary.strengths_count}
          </div>
          <div className="mt-1 text-[11px] text-zinc-400">≥75% {t('weakness.consistentSolveRate', 'success rate')}</div>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60">
          <div className="text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-zinc-400" />
            {t('weakness.underEvaluation', 'Under Evaluation')}
          </div>
          <div className="mt-1 text-2xl font-extrabold font-mono text-zinc-700 dark:text-zinc-300">
            {data.summary.insufficient_data_count}
          </div>
          <div className="mt-1 text-[11px] text-zinc-400">&lt;3 {t('weakness.attemptsRecorded', 'attempts (insufficient data)')}</div>
        </div>
      </div>

      {/* 1. VERIFIED WEAKNESSES SECTION */}
      {data.weaknesses && data.weaknesses.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <span>{t('weakness.verifiedWeaknessesTitle', 'Priority Growth Areas')}</span>
              <span className="text-xs font-normal text-zinc-400">({data.weaknesses.length})</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.weaknesses.map((w) => {
              const domError = w.dominant_error;
              const isHigh = w.severity === 'high';

              return (
                <div
                  key={`${w.type}-${w.slug}`}
                  className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                          {w.name}
                        </span>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                          {w.type}
                        </span>
                      </div>

                      <Badge variant={isHigh ? 'danger' : 'warning'} className="text-[10px]">
                        {isHigh ? t('weakness.highPriority', 'High Priority') : t('weakness.moderatePriority', 'Moderate Priority')}
                      </Badge>
                    </div>

                    {/* Pass rate progress bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-zinc-500">
                        <span>{t('weakness.passRate', 'Pass Rate')}: {w.success_rate}%</span>
                        <span>
                          {w.accepted_attempts} solved / {w.total_attempts} attempts
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            w.success_rate < 30 ? 'bg-rose-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.max(5, w.success_rate)}%` }}
                        />
                      </div>
                    </div>

                    {/* Dominant Obstacle Diagnostic */}
                    {domError && domError.count > 0 && (
                      <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-800/60 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 font-semibold text-zinc-800 dark:text-zinc-200">
                          <Bug className="w-3.5 h-3.5 text-rose-500" />
                          <span>{t('weakness.dominantPitfall', 'Primary Pitfall')}: {domError.title} ({domError.count}x)</span>
                        </div>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                          {domError.description}
                        </p>
                      </div>
                    )}

                    {/* Trend indicator */}
                    <div className="flex items-center gap-2 text-xs">
                      {w.trend === 'improving' ? (
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                          <TrendingUp className="w-3.5 h-3.5" />
                          {t('weakness.trendImproving', 'Improving trend')}
                        </span>
                      ) : w.trend === 'declining' ? (
                        <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium">
                          <TrendingDown className="w-3.5 h-3.5" />
                          {t('weakness.trendDeclining', 'Declining trend')}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-zinc-500 font-medium">
                          <Minus className="w-3.5 h-3.5" />
                          {t('weakness.trendSteady', 'Steady')}
                        </span>
                      )}
                      <span className="text-[11px] text-zinc-400">· {w.trend_message}</span>
                    </div>

                    {/* Error breakdown tags */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {w.error_breakdown.wrong_answer > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200/40 dark:border-rose-900/40">
                          WA: {w.error_breakdown.wrong_answer}
                        </span>
                      )}
                      {w.error_breakdown.time_limit_exceeded > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200/40 dark:border-amber-900/40">
                          TLE: {w.error_breakdown.time_limit_exceeded}
                        </span>
                      )}
                      {w.error_breakdown.runtime_error > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border border-purple-200/40 dark:border-purple-900/40">
                          RE: {w.error_breakdown.runtime_error}
                        </span>
                      )}
                      {w.error_breakdown.compilation_error > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                          CE: {w.error_breakdown.compilation_error}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                    <Link
                      to={`/challenges?${w.type === 'tag' ? `tag=${w.slug}` : `category=${encodeURIComponent(w.name)}`}`}
                      className="text-xs text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1 font-medium"
                    >
                      <span>{t('weakness.viewPracticeProblems', 'Browse unsolved problems in')} {w.name}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. TARGETED NEXT CHALLENGES (Explainable Recommendations) */}
      {data.recommendations && data.recommendations.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-500" />
                <span>{t('weakness.targetedRecommendations', 'Recommended Next Challenges')}</span>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {t(
                  'weakness.targetedRecommendationsDesc',
                  'Tailored problems selected to systematically reinforce your weak areas and eliminate recurring mistakes.'
                )}
              </p>
            </div>
            <Link
              to="/challenges"
              className="text-xs text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1 font-medium"
            >
              <span>{t('search.viewAllChallenges', 'All challenges')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.recommendations.map((rec) => (
              <div
                key={rec.challenge.id}
                className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-violet-500/50 dark:hover:border-violet-500/50 transition-all group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {rec.challenge.category}
                    </Badge>
                    <Badge
                      variant={
                        rec.challenge.difficulty === 'Hard' || rec.challenge.difficulty === 'Expert'
                          ? 'danger'
                          : rec.challenge.difficulty === 'Medium'
                          ? 'warning'
                          : 'success'
                      }
                      className="text-[10px]"
                    >
                      {rec.challenge.difficulty}
                    </Badge>
                  </div>

                  <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                    {rec.challenge.title}
                  </h4>

                  {/* Explainable recommendation reason banner */}
                  <div className="p-2.5 rounded-xl bg-violet-50/70 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900/40 text-[11px] text-violet-900 dark:text-violet-200 leading-relaxed">
                    <span className="font-semibold">{t('weakness.whyRecommended', 'Why recommended')}: </span>
                    {rec.reason}
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    +{rec.challenge.xp_reward} XP
                  </span>
                  <Link to={`/challenges/${rec.challenge.slug}`}>
                    <Button variant="primary" size="sm" className="text-xs">
                      {t('weakness.practiceNow', 'Practice Now')}
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. STRENGTHS SECTION */}
      {data.strengths && data.strengths.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>{t('weakness.strengthsTitle', 'Demonstrated Strengths')}</span>
            <span className="text-xs font-normal text-zinc-400">({data.strengths.length})</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {data.strengths.map((s) => (
              <div
                key={`${s.type}-${s.slug}`}
                className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 flex items-center justify-between"
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                    {s.name}
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    {s.unique_challenges_solved} challenges solved • {s.total_attempts} attempts
                  </div>
                </div>
                <Badge variant="success" className="font-mono text-xs">
                  {s.success_rate}%
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. UNDER EVALUATION / INSUFFICIENT DATA SECTION */}
      {data.insufficient_data && data.insufficient_data.length > 0 && (
        <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-zinc-500 tracking-wider">
            <HelpCircle className="w-4 h-4 text-zinc-400" />
            <span>{t('weakness.insufficientDataTitle', 'Topics Under Calibration (<3 Attempts)')}</span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {t(
              'weakness.insufficientDataDesc',
              'These topics do not have enough attempts yet for statistical confidence. CodeArena will evaluate them once at least 3 attempts are recorded.'
            )}
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            {data.insufficient_data.map((item) => (
              <Link
                key={`${item.type}-${item.slug}`}
                to={`/challenges?${item.type === 'tag' ? `tag=${item.slug}` : `category=${encodeURIComponent(item.name)}`}`}
                className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs flex items-center gap-2 hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors cursor-pointer group"
              >
                <span className="font-medium text-zinc-800 dark:text-zinc-200 group-hover:text-violet-600 dark:group-hover:text-violet-400">
                  {item.name}
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {item.total_attempts}/3 attempts
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
