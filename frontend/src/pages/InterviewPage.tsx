import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Editor from '@monaco-editor/react';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Award,
  ChevronRight,
  ChevronLeft,
  Send,
  Code2,
  Database,
  Terminal,
  Layers,
  Sparkles,
  BookOpen,
  ArrowRight,
  Printer,
} from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  interviewApi,
  ActiveInterviewSession,
  CompletedInterviewResult,
  InterviewHistoryItem,
} from '@/services/interviewApi';

type TopicType = 'algorithms' | 'frontend' | 'backend' | 'sql' | 'fullstack';
type DifficultyType = 'Beginner' | 'Easy' | 'Medium' | 'Hard' | 'Expert';
type DurationType = 15 | 30 | 60;

export const InterviewPage: React.FC = () => {
  const { token: urlToken } = useParams<{ token?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { t } = useTranslation();

  // Mode states: 'setup' | 'active' | 'result'
  const [mode, setMode] = useState<'setup' | 'active' | 'result'>('setup');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Setup form states
  const [selectedTopic, setSelectedTopic] = useState<TopicType>('algorithms');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyType>('Medium');
  const [selectedDuration, setSelectedDuration] = useState<DurationType>(30);
  const [pastSessions, setPastSessions] = useState<InterviewHistoryItem[]>([]);

  // Active session states
  const [activeSession, setActiveSession] = useState<ActiveInterviewSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Result state
  const [resultData, setResultData] = useState<CompletedInterviewResult | null>(null);

  // Autosave timer ref
  const autosaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleFinalSubmitRef = useRef<(expired?: boolean) => Promise<void>>(async () => {});

  // Topics catalog
  const topics: Array<{
    id: TopicType;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    accent: string;
  }> = [
    {
      id: 'algorithms',
      title: 'Algorithms & Data Structures',
      description: 'Arrays, hash maps, trees, sorting, two pointers, and algorithmic trade-offs.',
      icon: Terminal,
      accent: 'emerald',
    },
    {
      id: 'frontend',
      title: 'Frontend & React Architecture',
      description: 'Component lifecycles, virtual DOM, performance optimization, and CSS layout.',
      icon: Code2,
      accent: 'blue',
    },
    {
      id: 'backend',
      title: 'Backend & System Design',
      description: 'REST APIs, idempotency, distributed caching, security, and transactions.',
      icon: Layers,
      accent: 'purple',
    },
    {
      id: 'sql',
      title: 'SQL & Database Engineering',
      description: 'Complex joins, window functions, B-tree indexes, and ACID isolation levels.',
      icon: Database,
      accent: 'amber',
    },
    {
      id: 'fullstack',
      title: 'Fullstack Engineering',
      description: 'End-to-end architecture, API contracts, token security, and scalability.',
      icon: Sparkles,
      accent: 'indigo',
    },
  ];

  // Fetch past history on load
  const loadHistory = useCallback(async () => {
    if (!user) return;
    try {
      const data = await interviewApi.getHistory();
      setPastSessions(data.sessions || []);
    } catch {
      // Ignore guest or unauthenticated
    }
  }, [user]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Load session from token if provided in URL or route
  useEffect(() => {
    const token = urlToken || searchParams.get('token');
    if (!token) return;

    const checkToken = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await interviewApi.getResult(token);
        if (res.status === 'completed') {
          setResultData(res);
          setMode('result');
        } else {
          // It's still active
          setActiveSession(res as unknown as ActiveInterviewSession);
          // Initialize answers
          const ans: Record<number, string> = {};
          res.questions.forEach((q) => {
            ans[q.id] = q.user_answer || q.starter_code || '';
          });
          setUserAnswers(ans);
          // Compute remaining seconds
          const exp = new Date(res.started_at).getTime() + res.duration_minutes * 60 * 1000;
          const rem = Math.max(0, Math.floor((exp - Date.now()) / 1000));
          setSecondsRemaining(rem);
          setMode('active');
        }
      } catch (err: unknown) {
        console.error('Failed to load session:', err);
        setError('Interview session not found or expired.');
      } finally {
        setIsLoading(false);
      }
    };

    checkToken();
  }, [urlToken, searchParams]);

  // Handle countdown timer
  useEffect(() => {
    if (mode !== 'active' || secondsRemaining <= 0) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto submit when time expires
          handleFinalSubmitRef.current(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [mode, secondsRemaining]);

  // Format seconds into MM:SS
  const formatTimer = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Start new session
  const handleStartInterview = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const session = await interviewApi.start({
        topic: selectedTopic,
        difficulty: selectedDifficulty,
        duration_minutes: selectedDuration,
      });

      setActiveSession(session);
      // Pre-populate answers with starter code
      const initialAnswers: Record<number, string> = {};
      session.questions.forEach((q) => {
        initialAnswers[q.id] = q.user_answer || q.starter_code || '';
      });
      setUserAnswers(initialAnswers);
      setCurrentQuestionIndex(0);

      const exp = new Date(session.expires_at).getTime();
      const rem = Math.max(0, Math.floor((exp - Date.now()) / 1000));
      setSecondsRemaining(rem > 0 ? rem : selectedDuration * 60);

      setMode('active');
      navigate(`/interview?token=${session.session_token}`, { replace: true });
    } catch (err: unknown) {
      console.error(err);
      setError('Failed to start interview session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Update current question answer & schedule autosave
  const handleAnswerChange = (text: string) => {
    if (!activeSession) return;
    const currentQ = activeSession.questions[currentQuestionIndex];
    if (!currentQ) return;

    setUserAnswers((prev) => ({
      ...prev,
      [currentQ.id]: text,
    }));

    // Trigger debounced autosave to backend
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }
    autosaveTimeoutRef.current = setTimeout(async () => {
      try {
        setIsSaving(true);
        await interviewApi.saveAnswer(activeSession.session_token, currentQ.id, text);
        setLastSavedAt(new Date());
      } catch (e) {
        console.warn('Autosave failed:', e);
      } finally {
        setIsSaving(false);
      }
    }, 1200);
  };

  // Submit interview
  const handleFinalSubmit = async (expired: boolean = false) => {
    if (!activeSession) return;
    setIsSubmitting(true);
    setIsSubmitModalOpen(false);

    try {
      const result = await interviewApi.finish(activeSession.session_token, userAnswers);
      setResultData(result);
      setMode('result');
      loadHistory();
      if (expired) {
        alert(t('interview.timerExpiredNotice', 'Time is up! Your interview has been submitted.'));
      }
    } catch (err: unknown) {
      console.error(err);
      setError('Failed to submit interview. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    handleFinalSubmitRef.current = handleFinalSubmit;
  });

  // Current active question
  const currentQ = activeSession?.questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col">
      {/* Top Banner / Navigation breadcrumb */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md sticky top-16 z-30 px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-2">
            <Layers className="w-5 h-5" />
            <span className="text-sm font-bold tracking-wide uppercase">
              {t('interview.title', 'Mock Interview Mode')}
            </span>
          </div>

          {mode === 'active' && activeSession && (
            <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              <ChevronRight className="w-4 h-4" />
              <Badge variant="outline" className="capitalize">
                {activeSession.topic}
              </Badge>
              <Badge
                variant={
                  activeSession.difficulty === 'Expert' || activeSession.difficulty === 'Hard'
                    ? 'danger'
                    : 'primary'
                }
              >
                {activeSession.difficulty}
              </Badge>
            </div>
          )}
        </div>

        {/* Active Session Status & Actions */}
        {mode === 'active' && (
          <div className="flex items-center gap-4">
            {/* Autosave status indicator */}
            <div className="hidden md:flex items-center gap-1.5 text-xs text-zinc-400">
              <div
                className={`w-2 h-2 rounded-full ${
                  isSaving ? 'bg-amber-400 animate-ping' : 'bg-emerald-500'
                }`}
              />
              <span>
                {isSaving
                  ? t('interview.saving', 'Saving...')
                  : lastSavedAt
                  ? `${t('interview.saved', 'Saved')} ${lastSavedAt.toLocaleTimeString()}`
                  : t('interview.autosaveActive', 'Autosave active')}
              </span>
            </div>

            {/* Live Countdown Timer */}
            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg border font-mono text-sm font-semibold transition-all shadow-sm ${
                secondsRemaining < 60
                  ? 'bg-rose-500/15 border-rose-500 text-rose-600 dark:text-rose-400 animate-pulse'
                  : secondsRemaining < 300
                  ? 'bg-amber-500/15 border-amber-500 text-amber-600 dark:text-amber-400'
                  : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{formatTimer(secondsRemaining)}</span>
            </div>

            {/* Finish & Submit Button */}
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsSubmitModalOpen(true)}
              isLoading={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-sm flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              <span>{t('interview.finishButton', 'Submit Interview')}</span>
            </Button>
          </div>
        )}

        {/* Results Header Action */}
        {mode === 'result' && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 text-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t('interview.print', 'Print Report')}</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setMode('setup');
                navigate('/interview', { replace: true });
              }}
              className="flex items-center gap-1.5 text-xs"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{t('interview.newInterview', 'New Interview')}</span>
            </Button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-sm flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 1: SETUP & PRACTICE WIZARD */}
        {/* ========================================================= */}
        {mode === 'setup' && (
          <div className="space-y-10 animate-fade-in">
            {/* Hero Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900/20 via-zinc-900/10 to-zinc-950 border border-emerald-500/20 p-6 sm:p-10 shadow-lg">
              <div className="max-w-2xl space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider border border-emerald-500/20">
                  <Sparkles className="w-3.5 h-3.5" />
                  {t('interview.badge', 'Timed Technical Simulation')}
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
                  {t('interview.heroTitle', 'Practice Real Technical Interviews Under Pressure')}
                </h1>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base leading-relaxed">
                  {t(
                    'interview.heroDesc',
                    'Test your coding, SQL, and system design expertise with timed challenges, deterministic rubric scoring, and revealed reference solutions. Earn up to 150 XP upon passing.'
                  )}
                </p>
              </div>
            </div>

            {/* Configuration Form */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left 2 Cols: Setup Options */}
              <div className="lg:col-span-2 space-y-8">
                {/* 1. Topic Selection */}
                <div>
                  <label className="block text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-3">
                    {t('interview.step1Topic', '1. Select Interview Topic')}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {topics.map((tItem) => {
                      const Icon = tItem.icon;
                      const isSelected = selectedTopic === tItem.id;
                      return (
                        <button
                          key={tItem.id}
                          type="button"
                          onClick={() => setSelectedTopic(tItem.id)}
                          className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/10 shadow-sm ring-1 ring-emerald-500'
                              : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-400 dark:hover:border-zinc-700'
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div
                              className={`p-2 rounded-lg ${
                                isSelected
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                              }`}
                            >
                              <Icon className="w-5 h-5" />
                            </div>
                            <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                              {tItem.title}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                            {tItem.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Difficulty Selection */}
                <div>
                  <label className="block text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-3">
                    {t('interview.step2Difficulty', '2. Select Difficulty Level')}
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {(['Beginner', 'Easy', 'Medium', 'Hard', 'Expert'] as DifficultyType[]).map(
                      (diff) => {
                        const isSelected = selectedDifficulty === diff;
                        return (
                          <button
                            key={diff}
                            type="button"
                            onClick={() => setSelectedDifficulty(diff)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                              isSelected
                                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 shadow-sm'
                                : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700'
                            }`}
                          >
                            {diff}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                {/* 3. Duration Selection */}
                <div>
                  <label className="block text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-3">
                    {t('interview.step3Duration', '3. Select Duration')}
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {([15, 30, 60] as DurationType[]).map((dur) => {
                      const isSelected = selectedDuration === dur;
                      return (
                        <button
                          key={dur}
                          type="button"
                          onClick={() => setSelectedDuration(dur)}
                          className={`p-3.5 rounded-xl border text-center transition-all ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500 font-bold'
                              : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-700'
                          }`}
                        >
                          <div className="text-lg font-mono font-bold">{dur} min</div>
                          <div className="text-[11px] text-zinc-500">
                            {dur === 15 ? 'Rapid Fire' : dur === 30 ? 'Standard' : 'In-depth'}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Start Button */}
                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="lg"
                    isLoading={isLoading}
                    onClick={handleStartInterview}
                    className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md flex items-center justify-center gap-2"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    <span>{t('interview.startButton', 'Begin Mock Interview')}</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>

              {/* Right Col: Format Guidelines & Info Card */}
              <div className="space-y-6">
                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm space-y-4">
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 text-base">
                    <BookOpen className="w-4 h-4 text-emerald-500" />
                    {t('interview.rulesTitle', 'Interview Format & Rules')}
                  </h3>

                  <ul className="space-y-3 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    <li className="flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <span>
                        <strong>Multi-discipline:</strong> 2 practical coding/SQL challenges + 1
                        in-depth conceptual architecture question.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <span>
                        <strong>Strict Countdown:</strong> Automatic submission occurs immediately
                        when the timer reaches zero.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <span>
                        <strong>Autosave:</strong> All editor inputs and answers are automatically
                        synced every few seconds.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <span>
                        <strong>Protected Keys:</strong> Canonical solutions and hidden test cases
                        remain hidden until you finalize the session.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <span>
                        <strong>XP Rewards:</strong> Score ≥ 70% to pass and unlock XP (+50 to +150
                        XP based on chosen difficulty).
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Past Sessions History Widget */}
                {user && pastSessions.length > 0 && (
                  <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm space-y-4">
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm flex items-center justify-between">
                      <span>{t('interview.historyTitle', 'Recent Interview Sessions')}</span>
                      <span className="text-xs text-zinc-500">
                        {pastSessions.length} {t('interview.completed', 'completed')}
                      </span>
                    </h3>

                    <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                      {pastSessions.map((s) => (
                        <div
                          key={s.session_token}
                          className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold capitalize text-zinc-900 dark:text-zinc-200">
                                {s.topic}
                              </span>
                              <Badge
                                variant={s.passed ? 'success' : 'secondary'}
                                className="text-[10px] py-0 px-1.5"
                              >
                                {s.score}% {s.passed ? 'PASS' : 'PRACTICE'}
                              </Badge>
                            </div>
                            <div className="text-[11px] text-zinc-500">
                              {s.difficulty} • {s.duration_minutes}m •{' '}
                              {new Date(s.completed_at).toLocaleDateString()}
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              navigate(`/interview?token=${s.session_token}`);
                            }}
                            className="text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                          >
                            {t('interview.review', 'Review')}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: ACTIVE TIMED INTERVIEW SESSION */}
        {/* ========================================================= */}
        {mode === 'active' && activeSession && currentQ && (
          <div className="flex-1 flex flex-col space-y-4 animate-fade-in">
            {/* Question Navigation Tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
              {activeSession.questions.map((q, idx) => {
                const isCurrent = idx === currentQuestionIndex;
                const isAnswered =
                  (userAnswers[q.id] || '').trim().length > 15 &&
                  userAnswers[q.id] !== q.starter_code;

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      isCurrent
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500 shadow-sm'
                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-700'
                    }`}
                  >
                    <span>
                      Q{idx + 1}: {q.title.substring(0, 24)}...
                    </span>
                    <Badge variant="outline" className="text-[10px] uppercase py-0 px-1">
                      {q.question_type}
                    </Badge>
                    {isAnswered ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Split Screen Workspace */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-[550px]">
              {/* Left Pane: Question Description & Rubric */}
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6 overflow-y-auto max-h-[700px] flex flex-col justify-between shadow-sm">
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800/80 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                        Question {currentQuestionIndex + 1} of {activeSession.questions.length}
                      </span>
                      <Badge variant="primary" className="text-[10px] uppercase">
                        {currentQ.question_type}
                      </Badge>
                    </div>
                    <span className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      {currentQ.max_score} pts
                    </span>
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-3">
                      {currentQ.title}
                    </h2>
                    <div className="prose dark:prose-invert max-w-none text-sm text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                      {currentQ.description}
                    </div>
                  </div>

                  {/* Rubric evaluation guidelines (for conceptual questions) */}
                  {currentQ.rubric && currentQ.rubric.length > 0 && (
                    <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-2.5">
                      <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5" />
                        {t('interview.rubricHeading', 'Evaluation Rubric Criteria')}
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Address each point below thoroughly in your explanation:
                      </p>
                      <ul className="space-y-1.5 text-xs text-zinc-700 dark:text-zinc-300">
                        {currentQ.rubric.map((crit, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-emerald-500 font-mono text-[11px] font-bold">
                              #{idx + 1}
                            </span>
                            <span>{crit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Question Navigation Controls */}
                <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentQuestionIndex === 0}
                    onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                    className="flex items-center gap-1 text-xs"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>{t('interview.prev', 'Previous')}</span>
                  </Button>

                  <div className="text-xs text-zinc-500 font-mono">
                    {currentQuestionIndex + 1} / {activeSession.questions.length}
                  </div>

                  {currentQuestionIndex < activeSession.questions.length - 1 ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                      className="flex items-center gap-1 text-xs"
                    >
                      <span>{t('interview.next', 'Next Question')}</span>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setIsSubmitModalOpen(true)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1 text-xs"
                    >
                      <span>{t('interview.reviewSubmit', 'Review & Finish')}</span>
                      <Send className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Right Pane: Code Editor or Conceptual Input */}
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden flex flex-col shadow-sm">
                {/* Editor Header */}
                <div className="px-4 py-2.5 bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-mono text-zinc-600 dark:text-zinc-400">
                    {currentQ.question_type === 'conceptual' ? (
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {t('interview.conceptualEditor', 'Architectural Response & Analysis')}
                      </span>
                    ) : (
                      <>
                        <Code2 className="w-4 h-4 text-emerald-500" />
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                          {currentQ.language || 'python'}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {currentQ.starter_code && (
                      <button
                        type="button"
                        onClick={() => handleAnswerChange(currentQ.starter_code || '')}
                        className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 flex items-center gap-1 text-[11px]"
                        title="Reset to starter code"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>{t('interview.resetStarter', 'Reset')}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Input Area */}
                <div className="flex-1 min-h-[420px] relative">
                  {currentQ.question_type === 'conceptual' ? (
                    <div className="h-full p-4 flex flex-col">
                      <textarea
                        value={userAnswers[currentQ.id] || ''}
                        onChange={(e) => handleAnswerChange(e.target.value)}
                        placeholder="Type your explanation, trade-off analysis, and design reasoning here. Be structured and reference the rubric guidelines..."
                        className="w-full flex-1 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm font-sans text-zinc-900 dark:text-zinc-100 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <div className="mt-2 text-right text-[11px] text-zinc-400 font-mono">
                        {(userAnswers[currentQ.id] || '').length} characters •{' '}
                        {(userAnswers[currentQ.id] || '').split(/\s+/).filter(Boolean).length} words
                      </div>
                    </div>
                  ) : (
                    <Editor
                      height="100%"
                      theme={theme === 'dark' ? 'vs-dark' : 'light'}
                      language={currentQ.language === 'sql' ? 'sql' : 'python'}
                      value={userAnswers[currentQ.id] ?? currentQ.starter_code ?? ''}
                      onChange={(val) => handleAnswerChange(val || '')}
                      options={{
                        fontSize: 13,
                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        lineNumbers: 'on',
                        automaticLayout: true,
                        padding: { top: 12, bottom: 12 },
                        tabSize: 4,
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 3: RESULTS & DETAILED EVALUATION REPORT */}
        {/* ========================================================= */}
        {mode === 'result' && resultData && (
          <div className="space-y-8 animate-fade-in print:m-0 print:p-0">
            {/* Top Score Summary Banner */}
            <div
              className={`rounded-2xl border p-6 sm:p-8 shadow-md transition-all ${
                resultData.passed
                  ? 'bg-gradient-to-br from-emerald-900/20 via-zinc-900/10 to-zinc-950 border-emerald-500/30'
                  : 'bg-gradient-to-br from-amber-900/20 via-zinc-900/10 to-zinc-950 border-amber-500/30'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="space-y-2 text-center sm:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border">
                    {resultData.passed ? (
                      <span className="text-emerald-500 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> INTERVIEW PASSED
                      </span>
                    ) : (
                      <span className="text-amber-500 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" /> NEEDS MORE PRACTICE
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
                    {resultData.feedback_summary?.grade ||
                      (resultData.passed ? 'Hire Recommended' : 'Practice Recommended')}
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                    Topic: <strong className="capitalize">{resultData.topic}</strong> • Difficulty:{' '}
                    <strong>{resultData.difficulty}</strong> • Completed in{' '}
                    {Math.round(resultData.feedback_summary?.time_taken_seconds / 60 || 0)} minutes
                  </p>
                </div>

                {/* Score percentage circle badge */}
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-4xl sm:text-5xl font-extrabold font-mono text-emerald-500">
                      {resultData.score}%
                    </div>
                    <div className="text-xs uppercase font-semibold text-zinc-400 mt-1">
                      Final Score
                    </div>
                  </div>

                  {resultData.xp_awarded > 0 && (
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                      <div className="text-xl sm:text-2xl font-bold font-mono text-amber-500">
                        +{resultData.xp_awarded} XP
                      </div>
                      <div className="text-[11px] uppercase font-semibold text-zinc-400 mt-0.5">
                        Awarded
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Questions Detailed Breakdown */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-500" />
                <span>
                  {t('interview.reportReviewTitle', 'Question Breakdown & Canonical Solutions')}
                </span>
              </h3>

              <div className="space-y-6">
                {resultData.questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm space-y-5"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800/80 pb-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-zinc-400">
                            Q{idx + 1}
                          </span>
                          <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">
                            {q.title}
                          </h4>
                          <Badge variant="outline" className="text-[10px] uppercase">
                            {q.question_type}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge variant={q.is_correct ? 'success' : 'danger'}>
                          {q.is_correct ? 'Solved / Strong' : 'Partial / Incomplete'}
                        </Badge>
                        <span className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-200">
                          {q.score} / {q.max_score} pts
                        </span>
                      </div>
                    </div>

                    <div className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                      {q.description}
                    </div>

                    {/* Evaluation Notes */}
                    {q.evaluation_notes && (
                      <div className="p-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 text-xs">
                        <strong className="text-zinc-800 dark:text-zinc-200">
                          {t('interview.evalNotes', 'Evaluator Feedback:')}{' '}
                        </strong>
                        <span className="text-zinc-600 dark:text-zinc-400">
                          {q.evaluation_notes}
                        </span>
                      </div>
                    )}

                    {/* User's Answer */}
                    <div className="space-y-2">
                      <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                        {t('interview.yourAnswer', 'Your Submitted Response:')}
                      </div>
                      <pre className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-mono overflow-x-auto text-zinc-800 dark:text-zinc-200">
                        {q.user_answer || '(No response recorded)'}
                      </pre>
                    </div>

                    {/* Revealed Reference Solution & Editorial */}
                    {q.reference_solution && (
                      <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                        <div className="text-xs font-semibold uppercase tracking-wider text-emerald-500 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {t('interview.canonicalSolution', 'Canonical Reference Solution')}
                        </div>
                        <pre className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs font-mono overflow-x-auto text-emerald-700 dark:text-emerald-300">
                          {q.reference_solution}
                        </pre>
                      </div>
                    )}

                    {/* Conceptual Rubric Guidance */}
                    {q.rubric && q.rubric.length > 0 && (
                      <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 space-y-2">
                        <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                          {t('interview.rubricChecklist', 'Rubric Checklist Reference')}
                        </div>
                        <ul className="space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                          {q.rubric.map((r, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <span className="text-emerald-500">•</span>
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  setMode('setup');
                  navigate('/interview', { replace: true });
                }}
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{t('interview.practiceAgain', 'Practice Another Interview')}</span>
              </Button>

              <Button
                variant="primary"
                onClick={() => navigate('/challenges')}
                className="bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2"
              >
                <span>{t('interview.exploreChallenges', 'Back to Challenges')}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Submit Modal */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title={t('interview.submitModalTitle', 'Submit Interview Session?')}
      >
        <div className="space-y-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {t(
              'interview.submitModalDesc',
              'Are you ready to submit your answers? Once submitted, the timer will stop, your performance will be evaluated against the test suite and rubrics, and the reference answers will be unlocked.'
            )}
          </p>

          {activeSession && (
            <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 text-xs space-y-1 text-zinc-700 dark:text-zinc-300">
              <div>
                Answered:{' '}
                <strong>
                  {
                    activeSession.questions.filter(
                      (q) => (userAnswers[q.id] || '').trim().length > 15
                    ).length
                  }
                </strong>{' '}
                of <strong>{activeSession.questions.length}</strong> questions
              </div>
              <div>
                Time remaining: <strong>{formatTimer(secondsRemaining)}</strong>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSubmitModalOpen(false)}
              disabled={isSubmitting}
            >
              {t('common.cancel', 'Continue Working')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleFinalSubmit(false)}
              isLoading={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              {t('interview.confirmSubmit', 'Confirm & Finalize')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
