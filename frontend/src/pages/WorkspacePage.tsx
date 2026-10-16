import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Editor from '@monaco-editor/react';
import {
  Play,
  Send,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Cpu,
  History,
  FileCode,
  Info,
  ChevronRight,
  AlertTriangle,
  Award,
  Sparkles,
  Bookmark,
  Lightbulb,
  FileEdit,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { Challenge, RunResult, SubmitResult, Submission, LanguageCatalogItem } from '@/types';
import { useAuth } from '@/features/auth/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  getTranslatedChallenge,
  getDifficultyLabel,
  getTranslatedTagName,
  getTranslatedBadge,
} from '@/locales/challengeTranslations';

import { SqlLabView } from '@/features/workspace/SqlLabView';
import { WebLabView } from '@/features/workspace/WebLabView';
import { QuizLabView } from '@/features/workspace/QuizLabView';
import { WorkspaceNotesTab } from '@/features/workspace/WorkspaceNotesTab';
import { WorkspaceEditorialTab } from '@/features/workspace/WorkspaceEditorialTab';
import { WorkspaceDiscussionsTab } from '@/features/workspace/WorkspaceDiscussionsTab';

export const WorkspacePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user, refreshUser } = useAuth();
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();

  const [language, setLanguage] = useState<string>('python');
  const [code, setCode] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'description' | 'editorial' | 'notes' | 'discussions' | 'history'>('description');
  const [resultsTab, setResultsTab] = useState<'testcases' | 'result'>('testcases');
  const [selectedTestCaseIndex, setSelectedTestCaseIndex] = useState(0);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [achievementModal, setAchievementModal] = useState<SubmitResult['gamification'] | null>(null);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);

  // Fetch Languages Catalog
  const { data: languagesData } = useQuery<{ data: LanguageCatalogItem[] }>({
    queryKey: ['languages-catalog'],
    queryFn: async () => {
      const res = await api.get('/languages');
      return res.data;
    },
  });

  // Fetch Challenge Details
  const { data: challengeData, isLoading, isError } = useQuery<{
    challenge: Challenge;
    user_progress?: { solved: boolean; best_score: number };
    is_bookmarked?: boolean;
  }>({
    queryKey: ['challenge', slug],
    queryFn: async () => {
      const res = await api.get(`/challenges/${slug}`);
      return res.data;
    },
  });

  const rawChallenge = challengeData?.challenge;
  const challenge = rawChallenge ? getTranslatedChallenge(rawChallenge, i18n.language) : undefined;

  useEffect(() => {
    if (challengeData?.is_bookmarked !== undefined) {
      setIsBookmarked(challengeData.is_bookmarked);
    }
  }, [challengeData?.is_bookmarked]);

  // Available languages for this challenge
  const availableLanguages = languagesData?.data?.filter((l) => l.category === 'language') || [
    { name: 'Python 3', slug: 'python', monaco_mode: 'python', is_executable: true },
    { name: 'JavaScript (Node)', slug: 'javascript', monaco_mode: 'javascript', is_executable: true },
    { name: 'TypeScript', slug: 'typescript', monaco_mode: 'typescript', is_executable: true },
    { name: 'C++ (GCC)', slug: 'cpp', monaco_mode: 'cpp', is_executable: true },
    { name: 'Java', slug: 'java', monaco_mode: 'java', is_executable: true },
  ];

  const currentLangMeta = availableLanguages.find((l) => l.slug === language);
  const isCurrentLangExecutable = currentLangMeta?.is_executable ?? true;

  // Load starter code or local draft when challenge or language changes
  useEffect(() => {
    if (!challenge || challenge.challenge_type !== 'code') return;

    const draftKey = `codearena_draft_${challenge.slug}_${language}`;
    const savedDraft = localStorage.getItem(draftKey);

    if (savedDraft) {
      setCode(savedDraft);
    } else if (challenge.starter_code && challenge.starter_code[language]) {
      setCode(challenge.starter_code[language]);
    } else {
      setCode(`// Starter template for ${language}\n`);
    }
  }, [challenge?.slug, language, challenge?.challenge_type]);

  // Persist draft to localStorage on edit
  const handleEditorChange = (value: string | undefined) => {
    const newCode = value || '';
    setCode(newCode);
    if (challenge) {
      localStorage.setItem(`codearena_draft_${challenge.slug}_${language}`, newCode);
    }
  };

  const handleResetStarter = () => {
    if (!challenge) return;
    if (confirm(t('workspace.resetConfirm'))) {
      const starter = challenge.starter_code?.[language] || '';
      setCode(starter);
      localStorage.setItem(`codearena_draft_${challenge.slug}_${language}`, starter);
    }
  };

  const handleToggleBookmark = async () => {
    if (!user) {
      alert(t('workspace.signInToSubmit'));
      return;
    }
    try {
      const res = await api.post(`/challenges/${challenge!.id}/bookmark`);
      setIsBookmarked(res.data.bookmarked);
    } catch (e) {}
  };

  // Run Code Mutation (Sample cases only)
  const runMutation = useMutation<RunResult, Error, void>({
    mutationFn: async () => {
      const res = await api.post(`/challenges/${challenge!.id}/run`, {
        language,
        source_code: code,
      });
      return res.data;
    },
    onSuccess: () => {
      setResultsTab('testcases');
    },
  });

  // Submit Solution Mutation (Full test suite)
  const submitMutation = useMutation<SubmitResult, Error, void>({
    mutationFn: async () => {
      const res = await api.post(`/challenges/${challenge!.id}/submit`, {
        language,
        source_code: code,
      });
      return res.data;
    },
    onSuccess: (data) => {
      setResultsTab('result');
      queryClient.invalidateQueries({ queryKey: ['challenge', slug] });
      queryClient.invalidateQueries({ queryKey: ['challenge-submissions', challenge?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });

      if (data.gamification && data.gamification.xp_awarded > 0) {
        refreshUser();
        setAchievementModal(data.gamification);
      }
    },
  });

  // Fetch Submissions History for this challenge
  const { data: submissionsData } = useQuery<{ data: Submission[] }>({
    queryKey: ['challenge-submissions', challenge?.id],
    queryFn: async () => {
      const res = await api.get('/submissions', {
        params: { challenge_id: challenge!.id },
      });
      return res.data;
    },
    enabled: Boolean(user && challenge?.id && activeTab === 'history'),
  });

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-3.5rem)] flex items-center justify-center text-zinc-500 dark:text-zinc-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">{t('workspace.loading')}</span>
        </div>
      </div>
    );
  }

  if (isError || !challenge) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{t('workspace.notFoundTitle')}</h2>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 mb-6">
          {t('workspace.notFoundSubtitle')}
        </p>
        <Link to="/challenges">
          <Button variant="primary" size="sm">
            {t('workspace.backToChallenges')}
          </Button>
        </Link>
      </div>
    );
  }

  const runResult = runMutation.data;
  const submitResult = submitMutation.data;

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col bg-white dark:bg-zinc-950 overflow-hidden text-left transition-colors">
      {/* Top Workspace Header Bar */}
      <div className="h-11 border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/60 px-4 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            to="/challenges"
            className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 flex items-center gap-1 font-medium transition-colors"
          >
            {t('workspace.problems')} <ChevronRight className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-600" />
          </Link>
          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{challenge.title}</span>
          <Badge variant={challenge.difficulty as any} size="sm">
            {getDifficultyLabel(challenge.difficulty, t)}
          </Badge>

          {challenge.category && (
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
              {challenge.category}
            </span>
          )}

          {challenge.is_daily && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
              🔥 Daily Challenge
            </span>
          )}

          {challengeData?.user_progress?.solved && (
            <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> {t('workspace.solved')}
            </span>
          )}
        </div>

        {/* Right action controls */}
        <div className="flex items-center gap-2">
          {/* Bookmark Button */}
          <button
            onClick={handleToggleBookmark}
            title={isBookmarked ? 'Bookmarked in Favorites' : 'Add to Favorites'}
            className={`p-1.5 rounded-md border text-xs transition-colors ${
              isBookmarked
                ? 'border-amber-500/50 bg-amber-500/10 text-amber-500'
                : 'border-zinc-300 dark:border-zinc-700 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>

          {/* Standard Code controls (only if challenge_type === 'code') */}
          {challenge.challenge_type === 'code' && (
            <>
              {/* Language selector */}
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700/80 rounded-md px-2.5 py-1 text-xs text-zinc-800 dark:text-zinc-200 font-mono focus:outline-hidden focus:border-violet-500 cursor-pointer shadow-2xs"
              >
                {availableLanguages.map((l) => (
                  <option key={l.slug} value={l.slug}>
                    {l.name} {!l.is_executable ? '(View Only)' : ''}
                  </option>
                ))}
              </select>

              {/* Reset Code */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetStarter}
                title={t('workspace.resetTooltip')}
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </Button>

              {/* Run Code Button */}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => runMutation.mutate()}
                disabled={!isCurrentLangExecutable}
                isLoading={runMutation.isPending}
                leftIcon={<Play className="w-3.5 h-3.5 fill-current text-zinc-600 dark:text-zinc-300" />}
              >
                {t('workspace.runCode')}
              </Button>

              {/* Submit Solution Button */}
              {user ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => submitMutation.mutate()}
                  disabled={!isCurrentLangExecutable}
                  isLoading={submitMutation.isPending}
                  leftIcon={<Send className="w-3.5 h-3.5" />}
                >
                  {t('workspace.submit')}
                </Button>
              ) : (
                <Link to="/login">
                  <Button variant="primary" size="sm">
                    {t('workspace.signInToSubmit')}
                  </Button>
                </Link>
              )}
            </>
          )}
        </div>
      </div>

      {/* Main Grid: Left Tabs + Right Evaluator */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Panel: Description, Editorial, Notes, Discussions, History */}
        <div className="lg:col-span-5 border-r border-zinc-200 dark:border-zinc-800/80 flex flex-col bg-zinc-50/50 dark:bg-zinc-900/30 overflow-hidden">
          {/* Tabs navigation */}
          <div className="flex items-center gap-1 px-4 pt-2 border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-100/70 dark:bg-zinc-900/60 overflow-x-auto">
            <button
              onClick={() => setActiveTab('description')}
              className={`px-3 py-1.5 text-xs font-medium rounded-t-md border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'description'
                  ? 'border-violet-600 dark:border-violet-400 text-zinc-900 dark:text-white bg-white dark:bg-zinc-950 font-semibold shadow-2xs'
                  : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <Info className="w-3.5 h-3.5 text-violet-500" />
              {t('workspace.descriptionTab')}
            </button>

            <button
              onClick={() => setActiveTab('editorial')}
              className={`px-3 py-1.5 text-xs font-medium rounded-t-md border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'editorial'
                  ? 'border-violet-600 dark:border-violet-400 text-zinc-900 dark:text-white bg-white dark:bg-zinc-950 font-semibold shadow-2xs'
                  : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              Editorial & Hints
            </button>

            <button
              onClick={() => setActiveTab('notes')}
              className={`px-3 py-1.5 text-xs font-medium rounded-t-md border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'notes'
                  ? 'border-violet-600 dark:border-violet-400 text-zinc-900 dark:text-white bg-white dark:bg-zinc-950 font-semibold shadow-2xs'
                  : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <FileEdit className="w-3.5 h-3.5 text-blue-400" />
              Private Notes
            </button>

            <button
              onClick={() => setActiveTab('discussions')}
              className={`px-3 py-1.5 text-xs font-medium rounded-t-md border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'discussions'
                  ? 'border-violet-600 dark:border-violet-400 text-zinc-900 dark:text-white bg-white dark:bg-zinc-950 font-semibold shadow-2xs'
                  : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              Discussions
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 text-xs font-medium rounded-t-md border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'history'
                  ? 'border-violet-600 dark:border-violet-400 text-zinc-900 dark:text-white bg-white dark:bg-zinc-950 font-semibold shadow-2xs'
                  : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <History className="w-3.5 h-3.5 text-zinc-400" />
              {t('workspace.submissionsTab')}
            </button>
          </div>

          {/* Left Panel Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'description' && (
              <div className="p-5 space-y-6">
                <div>
                  <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{challenge.title}</h1>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge variant={challenge.difficulty as any} size="sm">
                      {getDifficultyLabel(challenge.difficulty, t)}
                    </Badge>
                    <span className="text-zinc-400 dark:text-zinc-500 text-xs font-mono flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> ~{challenge.estimated_time_min || 20} min
                    </span>
                    {challenge.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono"
                      >
                        #{getTranslatedTagName(tag.name, i18n.language)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Description Body */}
                <div className="prose prose-zinc dark:prose-invert max-w-none text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap font-sans">
                  {challenge.description}
                </div>

                {/* Sample Test Cases / Examples */}
                {challenge.sample_test_cases && challenge.sample_test_cases.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      {t('workspace.examples')}
                    </h3>
                    {challenge.sample_test_cases.map((tc, idx) => (
                      <div
                        key={tc.id}
                        className="bg-white dark:bg-zinc-900/40 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800/80 space-y-2 text-xs shadow-2xs"
                      >
                        <div className="font-semibold text-zinc-700 dark:text-zinc-300">
                          {t('workspace.example', { number: idx + 1 })}
                        </div>
                        <div className="space-y-1 font-mono">
                          <div className="text-zinc-500 text-[11px]">{t('workspace.input')}</div>
                          <pre className="bg-zinc-100 dark:bg-zinc-950 p-2 rounded text-zinc-900 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-900 overflow-x-auto">
                            {tc.input_data}
                          </pre>
                          <div className="text-zinc-500 text-[11px] pt-1">{t('workspace.expectedOutput')}</div>
                          <pre className="bg-zinc-100 dark:bg-zinc-950 p-2 rounded text-violet-700 dark:text-violet-300 border border-zinc-200/80 dark:border-zinc-900 overflow-x-auto">
                            {tc.expected_output}
                          </pre>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Constraints */}
                {challenge.constraints && (
                  <div className="space-y-1.5 pt-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      {t('workspace.constraints')}
                    </h3>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-900/30 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800/60 font-mono whitespace-pre-line leading-relaxed">
                      {challenge.constraints}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'editorial' && (
              <WorkspaceEditorialTab challenge={challenge} />
            )}

            {activeTab === 'notes' && (
              <WorkspaceNotesTab challenge={challenge} isAuthenticated={Boolean(user)} />
            )}

            {activeTab === 'discussions' && (
              <WorkspaceDiscussionsTab challenge={challenge} isAuthenticated={Boolean(user)} />
            )}

            {activeTab === 'history' && (
              <div className="p-4 space-y-3">
                <h3 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                  {t('workspace.yourSubmissions')}
                </h3>
                {!user ? (
                  <div className="text-center py-10 text-xs text-zinc-500">
                    <p>{t('workspace.signInToTrack')}</p>
                    <Link to="/login" className="inline-block mt-3">
                      <Button variant="primary" size="sm">
                        {t('common.signIn')}
                      </Button>
                    </Link>
                  </div>
                ) : submissionsData?.data?.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-6 text-center">
                    {t('workspace.noSubmissions')}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {submissionsData?.data?.map((sub) => (
                      <div
                        key={sub.id}
                        onClick={() => setSelectedSubmission(sub)}
                        className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer flex items-center justify-between text-xs shadow-2xs"
                      >
                        <div className="flex items-center gap-2">
                          {sub.status === 'Accepted' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                          )}
                          <div>
                            <span className="font-semibold text-zinc-800 dark:text-zinc-200">{sub.status}</span>
                            <div className="text-[11px] text-zinc-500 font-mono">
                              {sub.language} · {new Date(sub.submitted_at || '').toLocaleDateString(i18n.language)}
                            </div>
                          </div>
                        </div>

                        <div className="text-right font-mono text-[11px]">
                          <div className="text-zinc-700 dark:text-zinc-300">{sub.score}% {t('workspace.score')}</div>
                          {sub.execution_time_ms !== undefined && (
                            <div className="text-zinc-500">{sub.execution_time_ms} ms</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Specialized Evaluators or Monaco Code Editor */}
        <div className="lg:col-span-7 flex flex-col bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
          {challenge.challenge_type === 'sql' ? (
            <SqlLabView
              challenge={challenge}
              theme={theme}
              onSubmitted={(gamification) => {
                refreshUser();
                setAchievementModal(gamification);
                queryClient.invalidateQueries({ queryKey: ['challenge', slug] });
              }}
            />
          ) : challenge.challenge_type === 'web' ? (
            <WebLabView
              challenge={challenge}
              theme={theme}
              onSubmitted={(gamification) => {
                refreshUser();
                setAchievementModal(gamification);
                queryClient.invalidateQueries({ queryKey: ['challenge', slug] });
              }}
            />
          ) : challenge.challenge_type === 'quiz' ? (
            <QuizLabView
              challenge={challenge}
              onSubmitted={(gamification) => {
                refreshUser();
                setAchievementModal(gamification);
                queryClient.invalidateQueries({ queryKey: ['challenge', slug] });
              }}
            />
          ) : (
            /* Standard Code Challenge (Monaco Editor) */
            <>
              {!isCurrentLangExecutable && (
                <div className="bg-amber-950/40 border-b border-amber-800/60 px-4 py-2 text-xs text-amber-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>
                    Execution environment for <strong>{currentLangMeta?.name}</strong> is not configured. Run & Submit actions are disabled.
                  </span>
                </div>
              )}

              {/* Monaco Editor Container */}
              <div className="flex-1 min-h-[300px] border-b border-zinc-200 dark:border-zinc-800/80 relative">
                <Editor
                  height="100%"
                  theme={theme === 'dark' ? 'vs-dark' : 'light'}
                  language={currentLangMeta?.monaco_mode || language}
                  value={code}
                  onChange={handleEditorChange}
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
              </div>

              {/* Results / Testcase Output Pane */}
              <div className="h-64 flex flex-col bg-zinc-100/60 dark:bg-zinc-900/40 overflow-hidden">
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800/80 px-4 bg-zinc-100 dark:bg-zinc-900/60 h-9 shrink-0">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setResultsTab('testcases')}
                      className={`text-xs font-semibold px-2.5 py-1 rounded transition-colors ${
                        resultsTab === 'testcases'
                          ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-2xs'
                          : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                      }`}
                    >
                      {t('workspace.sampleTestCases')}
                    </button>
                    {(runResult || submitResult) && (
                      <button
                        onClick={() => setResultsTab('result')}
                        className={`text-xs font-semibold px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 ${
                          resultsTab === 'result'
                            ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-2xs'
                            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                        }`}
                      >
                        {t('workspace.executionOutput')}
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-auto p-4 text-xs font-mono">
                  {resultsTab === 'testcases' && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-1.5">
                        {challenge.sample_test_cases?.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedTestCaseIndex(idx)}
                            className={`px-2.5 py-1 rounded text-xs transition-colors ${
                              selectedTestCaseIndex === idx
                                ? 'bg-violet-600 text-white font-bold'
                                : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400 hover:bg-zinc-300'
                            }`}
                          >
                            Case {idx + 1}
                          </button>
                        ))}
                      </div>

                      {challenge.sample_test_cases?.[selectedTestCaseIndex] && (
                        <div className="space-y-2">
                          <div>
                            <span className="text-[11px] text-zinc-500 block mb-1">Input:</span>
                            <pre className="p-2 rounded bg-zinc-200 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-200">
                              {challenge.sample_test_cases[selectedTestCaseIndex].input_data}
                            </pre>
                          </div>
                          <div>
                            <span className="text-[11px] text-zinc-500 block mb-1">Expected:</span>
                            <pre className="p-2 rounded bg-zinc-200 dark:bg-zinc-950 text-emerald-600 dark:text-emerald-400">
                              {challenge.sample_test_cases[selectedTestCaseIndex].expected_output}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {resultsTab === 'result' && (
                    <div>
                      {submitResult ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            {submitResult.submission.status === 'Accepted' ? (
                              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                                <CheckCircle2 className="w-5 h-5" /> Accepted ({submitResult.submission.score}%)
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 text-rose-500 font-bold text-sm">
                                <XCircle className="w-5 h-5" /> {submitResult.submission.status}
                              </span>
                            )}
                            <span className="text-zinc-500 text-xs">
                              · {submitResult.submission.execution_time_ms} ms · {submitResult.submission.memory_kb} KB
                            </span>
                          </div>

                          {submitResult.submission.error_message && (
                            <pre className="p-3 rounded bg-red-950/60 border border-red-800 text-red-300 whitespace-pre-wrap">
                              {submitResult.submission.error_message}
                            </pre>
                          )}
                        </div>
                      ) : runResult ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            {runResult.passed ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                Sample Tests Passed
                              </span>
                            ) : (
                              <span className="text-rose-500 font-bold">Sample Tests Failed</span>
                            )}
                          </div>
                          <div className="space-y-2">
                            {runResult.test_results?.map((res, idx) => (
                              <div key={idx} className="p-2 rounded border border-zinc-200 dark:border-zinc-800">
                                <div className="flex items-center justify-between text-[11px] mb-1">
                                  <span>Sample Case {idx + 1}</span>
                                  <span className={res.passed ? 'text-emerald-500' : 'text-rose-500'}>
                                    {res.status}
                                  </span>
                                </div>
                                <div className="text-[11px] text-zinc-500">Output: {res.actual_output}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Achievement / Level Up Modal */}
      {achievementModal && (
        <Modal
          isOpen={Boolean(achievementModal)}
          onClose={() => setAchievementModal(null)}
          title="Challenge Conquered!"
        >
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 rounded-full bg-violet-600/20 text-violet-400 flex items-center justify-center mx-auto">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                +{achievementModal.xp_awarded} XP Awarded!
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                You are currently Level {achievementModal.level} ({achievementModal.total_xp} Total XP).
              </p>
            </div>
            {achievementModal.new_badges && achievementModal.new_badges.length > 0 && (
              <div className="p-3 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <span className="text-xs font-semibold text-zinc-400 block mb-2">New Badges Unlocked:</span>
                <div className="flex items-center justify-center gap-2">
                  {achievementModal.new_badges.map((b) => (
                    <span key={b.id} className="text-xs font-semibold px-2 py-1 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      🏆 {b.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <Button onClick={() => setAchievementModal(null)} className="w-full">
              Continue Practice
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};
