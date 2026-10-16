import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  Award,
  CheckCircle2,
  Calendar,
  Flame,
  Printer,
  Sparkles,
  Layers,
  ArrowRight,
  Info,
  Compass,
  AlertCircle,
  Code2,
} from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { reportApi, LearningReportData } from '@/services/reportApi';

export const LearningReportsPage: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [range, setRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [report, setReport] = useState<LearningReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async (selectedRange: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await reportApi.getLearningReport({ range: selectedRange });
      setReport(data);
    } catch (err: unknown) {
      console.error('Failed to load learning report:', err);
      setError('Unable to load learning analytics report. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchReport(range);
    } else {
      setIsLoading(false);
    }
  }, [user, range, fetchReport]);

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
            <TrendingUp className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {t('reports.authRequired', 'Sign in to View Learning Reports')}
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {t(
              'reports.authRequiredDesc',
              'Access personalized performance analytics, skill mastery trends, interview results, and tailored practice recommendations.'
            )}
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Button variant="primary" onClick={() => navigate('/login')}>
              {t('nav.signIn', 'Sign In')}
            </Button>
            <Button variant="outline" onClick={() => navigate('/register')}>
              {t('nav.getStarted', 'Create Account')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isDark = theme === 'dark';
  const gridColor = isDark ? '#27272a' : '#e4e4e7';
  const textColor = isDark ? '#a1a1aa' : '#71717a';

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 print:bg-white print:text-black">
      {/* Top Header / Action Toolbar */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md sticky top-16 z-30 px-4 sm:px-8 py-3.5 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm font-bold tracking-wide uppercase">
                {t('reports.title', 'Personal Learning Analytics')}
              </span>
            </div>
            <span className="text-xs text-zinc-400 hidden md:inline">|</span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 hidden md:inline">
              {report?.start_date} to {report?.end_date}
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Range Toggle Chips */}
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700/60 text-xs">
              {(['7d', '30d', '90d', 'all'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRange(r)}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    range === r
                      ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-xs font-semibold'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  {r === '7d'
                    ? '7 Days'
                    : r === '30d'
                    ? '30 Days'
                    : r === '90d'
                    ? '90 Days'
                    : 'All Time'}
                </button>
              ))}
            </div>

            {/* Print / Export Report Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 text-xs shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t('reports.exportPdf', 'Export / Print')}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Report Container */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 print:p-0 print:space-y-6">
        {/* Printable Official Header */}
        <div className="hidden print:flex items-center justify-between border-b pb-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">CodeArena Learning Report</h1>
            <p className="text-xs text-zinc-500">
              Student: {report?.user.name} (@{report?.user.username}) • Range: {report?.start_date}{' '}
              to {report?.end_date}
            </p>
          </div>
          <div className="text-right text-xs">
            <p className="font-bold">Level {report?.user.level} Developer</p>
            <p className="text-zinc-500">{report?.user.xp} Total XP</p>
          </div>
        </div>

        {/* User Profile Summary Card */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 print:border-none print:shadow-none print:p-0">
          <div className="flex items-center gap-4">
            <Avatar src={user.avatar_url} name={user.name} size="lg" />
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
                  {user.name}
                </h1>
                <Badge variant="violet" className="text-xs">
                  Level {user.level || report?.user.level || 1}
                </Badge>
              </div>
              <p className="text-xs text-zinc-500 font-mono">
                @{user.username} • {t('reports.joined', 'Joined')}{' '}
                {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Recently'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 text-center min-w-[90px]">
              <div className="text-xl font-bold font-mono text-violet-600 dark:text-violet-400">
                {user.xp}
              </div>
              <div className="text-[11px] text-zinc-500 uppercase mt-0.5">Total XP</div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 text-center min-w-[90px]">
              <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {report?.overview.all_time_solved ?? 0}
              </div>
              <div className="text-[11px] text-zinc-500 uppercase mt-0.5">Solved</div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 text-center min-w-[90px]">
              <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1">
                <Flame className="w-4 h-4 fill-current text-amber-500" />
                <span>{report?.overview.current_streak ?? 0}d</span>
              </div>
              <div className="text-[11px] text-zinc-500 uppercase mt-0.5">Streak</div>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="p-12 text-center text-sm text-zinc-500 animate-pulse">
            {t('reports.loading', 'Compiling learning analytics and performance history...')}
          </div>
        ) : report ? (
          <>
            {/* ========================================================= */}
            {/* 1. KEY PERFORMANCE INDICATORS (4-CARD GRID) */}
            {/* ========================================================= */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Challenges Solved & Completion Rate */}
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between text-xs text-zinc-500 font-semibold uppercase">
                  <span>Challenges</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <div className="text-3xl font-extrabold font-mono text-zinc-900 dark:text-zinc-50">
                    {report.overview.challenges_solved}
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">
                    of {report.overview.challenges_attempted} attempted
                  </div>
                </div>
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
                  <span className="text-zinc-500">Completion Rate</span>
                  <Badge variant="success" className="font-mono">
                    {report.overview.completion_rate}%
                  </Badge>
                </div>
              </div>

              {/* Card 2: Submission Accuracy */}
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between text-xs text-zinc-500 font-semibold uppercase">
                  <span>Accuracy Rate</span>
                  <Code2 className="w-4 h-4 text-violet-500" />
                </div>
                <div>
                  <div className="text-3xl font-extrabold font-mono text-zinc-900 dark:text-zinc-50">
                    {report.overview.accuracy_rate}%
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">
                    {report.overview.accepted_submissions} accepted /{' '}
                    {report.overview.total_submissions} total
                  </div>
                </div>
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
                  <span className="text-zinc-500">First-pass success</span>
                  <span className="font-mono font-semibold text-zinc-700 dark:text-zinc-300">
                    {report.overview.accepted_submissions > 0 ? 'High' : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Card 3: Active Days & Best Streak */}
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between text-xs text-zinc-500 font-semibold uppercase">
                  <span>Active Days</span>
                  <Calendar className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <div className="text-3xl font-extrabold font-mono text-zinc-900 dark:text-zinc-50">
                    {report.overview.active_days_count}
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">active days in timeframe</div>
                </div>
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
                  <span className="text-zinc-500">Best Streak</span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 fill-current" />
                    {report.overview.best_streak} days
                  </span>
                </div>
              </div>

              {/* Card 4: Mock Interview & Git Performance */}
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between text-xs text-zinc-500 font-semibold uppercase">
                  <span>Interviews & Git</span>
                  <Layers className="w-4 h-4 text-teal-500" />
                </div>
                <div>
                  <div className="text-3xl font-extrabold font-mono text-zinc-900 dark:text-zinc-50">
                    {report.interview.sessions_completed}
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">
                    interviews ({report.interview.pass_rate}% pass rate)
                  </div>
                </div>
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
                  <span className="text-zinc-500">Git Missions</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {report.git_playground.scenarios_completed} /{' '}
                    {report.git_playground.total_scenarios}
                  </span>
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* 2. ACTIVITY & SKILL CHARTS (RECHARTS) */}
            {/* ========================================================= */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Activity Trend Line Chart */}
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-50 text-sm">
                      {t('reports.activityOverTime', 'Activity & Submissions Trend')}
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Submissions and solutions recorded per day
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    Daily
                  </Badge>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={report.activity_timeline}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorSubmissions" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                      <XAxis
                        dataKey="date"
                        stroke={textColor}
                        fontSize={11}
                        tickLine={false}
                        tickFormatter={(val) => val.slice(5)}
                      />
                      <YAxis stroke={textColor} fontSize={11} tickLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? '#18181b' : '#ffffff',
                          borderColor: isDark ? '#27272a' : '#e4e4e7',
                          borderRadius: '0.75rem',
                          fontSize: '12px',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="submissions"
                        stroke="#10b981"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorSubmissions)"
                        name="Submissions"
                      />
                      <Area
                        type="monotone"
                        dataKey="accepted"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        fill="none"
                        name="Accepted"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Topic / Skill Mastery Bar Chart */}
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-50 text-sm">
                      {t('reports.skillMastery', 'Topic & Skill Mastery')}
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Percentage of challenges solved by category
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    Mastery %
                  </Badge>
                </div>

                <div className="h-64 w-full">
                  {report.skill_breakdown.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={report.skill_breakdown}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                        <XAxis
                          dataKey="category"
                          stroke={textColor}
                          fontSize={11}
                          tickLine={false}
                        />
                        <YAxis
                          stroke={textColor}
                          fontSize={11}
                          tickLine={false}
                          domain={[0, 100]}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: isDark ? '#18181b' : '#ffffff',
                            borderColor: isDark ? '#27272a' : '#e4e4e7',
                            borderRadius: '0.75rem',
                            fontSize: '12px',
                          }}
                        />
                        <Bar
                          dataKey="mastery_percentage"
                          fill="#8b5cf6"
                          radius={[6, 6, 0, 0]}
                          name="Mastery %"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-zinc-500">
                      No category activity recorded yet. Start solving challenges!
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* 3. STRONGEST TOPICS & TOPICS NEEDING PRACTICE */}
            {/* ========================================================= */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Strongest Topics */}
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xs space-y-4">
                <h3 className="font-bold text-zinc-900 dark:text-zinc-50 text-sm flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-500" />
                  <span>{t('reports.strongestTopics', 'Strongest Technical Domains')}</span>
                </h3>

                {report.strongest_topics.length > 0 ? (
                  <div className="space-y-3">
                    {report.strongest_topics.map((tItem) => (
                      <div
                        key={tItem.category}
                        className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-800/40 flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <span className="font-bold text-zinc-900 dark:text-zinc-100">
                            {tItem.category}
                          </span>
                          <div className="text-[11px] text-zinc-500">
                            {tItem.solved} solved of {tItem.attempted} attempts
                          </div>
                        </div>
                        <Badge variant="success" className="font-mono">
                          {tItem.mastery_percentage}% Mastery
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500">
                    Solve more challenges to establish your strongest topics.
                  </p>
                )}
              </div>

              {/* Topics Needing Practice */}
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xs space-y-4">
                <h3 className="font-bold text-zinc-900 dark:text-zinc-50 text-sm flex items-center gap-2">
                  <Compass className="w-4 h-4 text-amber-500" />
                  <span>{t('reports.needingPractice', 'Recommended Practice Focus')}</span>
                </h3>

                {report.topics_needing_practice.length > 0 ? (
                  <div className="space-y-3">
                    {report.topics_needing_practice.map((tItem) => (
                      <div
                        key={tItem.category}
                        className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-800/40 flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <span className="font-bold text-zinc-900 dark:text-zinc-100">
                            {tItem.category}
                          </span>
                          <div className="text-[11px] text-zinc-500">
                            Target: increase test-pass consistency
                          </div>
                        </div>
                        <Badge variant="warning" className="font-mono">
                          {tItem.mastery_percentage}% Mastery
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500">
                    Great job! All attempted categories maintain over 75% solve efficiency.
                  </p>
                )}
              </div>
            </div>

            {/* ========================================================= */}
            {/* 4. DETERMINISTIC CHALLENGE RECOMMENDATIONS */}
            {/* ========================================================= */}
            {report.recommended_challenges.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-50 text-sm flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-violet-500" />
                      <span>
                        {t('reports.recommendedNext', 'Targeted Challenges for Improvement')}
                      </span>
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Unsolved challenges selected to strengthen your growth areas
                    </p>
                  </div>
                  <Link
                    to="/challenges"
                    className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    <span>View all challenges</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {report.recommended_challenges.map((ch) => (
                    <div
                      key={ch.id}
                      className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-zinc-400 dark:hover:border-zinc-700 transition-all"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {ch.category}
                          </Badge>
                          <Badge
                            variant={
                              ch.difficulty === 'Hard' || ch.difficulty === 'Expert'
                                ? 'danger'
                                : ch.difficulty === 'Medium'
                                ? 'warning'
                                : 'success'
                            }
                            className="text-[10px]"
                          >
                            {ch.difficulty}
                          </Badge>
                        </div>
                        <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                          {ch.title}
                        </h4>
                        <p className="text-xs text-zinc-500 line-clamp-2">{ch.description}</p>
                      </div>

                      <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                          +{ch.xp_reward} XP
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/challenges/${ch.slug}`)}
                          className="text-xs"
                        >
                          Solve Challenge
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* 5. METHODOLOGY & DATA TRANSPARENCY */}
            {/* ========================================================= */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xs space-y-3 print:border-none print:shadow-none">
              <h3 className="font-bold text-zinc-900 dark:text-zinc-50 text-xs uppercase tracking-wider flex items-center gap-2">
                <Info className="w-4 h-4 text-zinc-400" />
                <span>{t('reports.methodologyTitle', 'Metrics Calculation & Data Governance')}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                {Object.entries(report.methodology).map(([key, desc]) => (
                  <div
                    key={key}
                    className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800/60 space-y-1"
                  >
                    <div className="font-semibold capitalize text-zinc-800 dark:text-zinc-200">
                      {key.replace(/_/g, ' ')}
                    </div>
                    <div className="text-[11px] leading-relaxed">{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};
