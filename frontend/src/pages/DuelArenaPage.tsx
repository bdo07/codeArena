import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Editor from '@monaco-editor/react';
import {
  Swords,
  Clock,
  Trophy,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  RotateCcw,
  Send,
  Flag,
  ArrowLeft,
  Code2,
  Terminal,
  Users,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { duelApi } from '@/services/duelApi';
import { DuelDetailResponse, DuelSubmissionResponse } from '@/types/duel';
import { useAuth } from '@/features/auth/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import { MonacoLoadingSkeleton } from '@/components/ui/MonacoLoadingSkeleton';

export const DuelArenaPage: React.FC = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [code, setCode] = useState<string>('');
  const [activeLeftTab, setActiveLeftTab] = useState<'problem' | 'testcases' | 'results' | 'opponent_code'>('problem');
  const [latestSubmission, setLatestSubmission] = useState<DuelSubmissionResponse['submission'] | null>(null);
  const [isForfeitModalOpen, setIsForfeitModalOpen] = useState(false);
  const [isResultModalDismissed, setIsResultModalDismissed] = useState(false);
  const [localSecondsRemaining, setLocalSecondsRemaining] = useState<number | null>(null);

  // Poll match details every 2s while pending or active
  const {
    data: duelDetail,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['duel', uuid],
    queryFn: () => duelApi.getDuel(uuid!),
    enabled: !!uuid,
    refetchInterval: (query) => {
      const status = query.state.data?.duel.status;
      return status === 'active' || status === 'pending' ? 2000 : false;
    },
  });

  const duel = duelDetail?.duel;
  const challenge = duelDetail?.challenge;
  const creator = duelDetail?.creator;
  const opponent = duelDetail?.opponent;
  const myRole = duelDetail?.my_role;

  // Initialize editor code with starter code or user's previous code
  useEffect(() => {
    if (!challenge || code) return;

    if (myRole === 'creator' && creator?.code) {
      setCode(creator.code);
    } else if (myRole === 'opponent' && opponent?.code) {
      setCode(opponent.code);
    } else if (challenge.starter_code && duel?.language && challenge.starter_code[duel.language]) {
      setCode(challenge.starter_code[duel.language]);
    } else {
      setCode(duel?.language === 'python' ? '# Write your solution here\n' : '// Write your solution here\n');
    }
  }, [challenge, duel?.language, myRole, creator?.code, opponent?.code, code]);

  // Synchronized countdown ticker
  useEffect(() => {
    if (!duel || duel.status !== 'active') {
      setLocalSecondsRemaining(null);
      return;
    }

    setLocalSecondsRemaining(duel.time_remaining_seconds);

    const interval = setInterval(() => {
      setLocalSecondsRemaining((prev) => {
        if (prev === null || prev <= 1) {
          queryClient.invalidateQueries({ queryKey: ['duel', uuid] });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [duel?.status, duel?.time_remaining_seconds, uuid, queryClient]);

  // Mutations
  const submitMutation = useMutation({
    mutationFn: (src: string) => duelApi.submitDuel(uuid!, src),
    onSuccess: (data) => {
      setLatestSubmission(data.submission);
      setActiveLeftTab('results');
      queryClient.invalidateQueries({ queryKey: ['duel', uuid] });
    },
  });

  const forfeitMutation = useMutation({
    mutationFn: () => duelApi.forfeitDuel(uuid!),
    onSuccess: () => {
      setIsForfeitModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['duel', uuid] });
    },
  });

  const acceptMutation = useMutation({
    mutationFn: () => duelApi.acceptDuel(uuid!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['duel', uuid] });
    },
  });

  const handleSubmit = () => {
    if (!code.trim() || submitMutation.isPending) return;
    submitMutation.mutate(code);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isMatchFinished = duel?.status === 'completed' || duel?.status === 'timed_out';
  const showResultModal = isMatchFinished && !isResultModalDismissed;
  const isWinner = duel?.winner?.id === user?.id;
  const isDraw = isMatchFinished && !duel?.winner;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-zinc-500">{t('duel.loading_match', 'Loading duel arena...')}</p>
      </div>
    );
  }

  if (isError || !duel || !challenge || !creator) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <XCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          {t('duel.match_not_found', 'Duel match not found or access denied')}
        </h2>
        <Button onClick={() => navigate('/duels')} variant="secondary">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('duel.back_to_lobby', 'Back to Duels')}
        </Button>
      </div>
    );
  }

  const isUserParticipant = myRole === 'creator' || myRole === 'opponent';
  const opponentData = myRole === 'creator' ? opponent : creator;
  const myData = myRole === 'creator' ? creator : opponent;

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-zinc-50 dark:bg-zinc-950 text-left">
      {/* Top Match Bar */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 px-4 py-2.5 flex items-center justify-between gap-4 shrink-0 shadow-2xs">
        {/* Left: Nav & Match Status */}
        <div className="flex items-center gap-3">
          <Link
            to="/duels"
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400">
              <Swords className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-xs">
                  {challenge.title}
                </h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 uppercase font-mono">
                  {duel.language}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Live Timer or Status */}
        <div className="flex items-center gap-3">
          {duel.status === 'active' && localSecondsRemaining !== null && (
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-full font-mono font-bold text-sm border shadow-2xs transition-colors ${
                localSecondsRemaining < 180
                  ? 'bg-rose-50 border-rose-300 text-rose-600 dark:bg-rose-950/50 dark:border-rose-800 dark:text-rose-400 animate-pulse'
                  : 'bg-zinc-100 border-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{formatTimer(localSecondsRemaining)}</span>
            </div>
          )}

          {duel.status === 'pending' && (
            <div className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {t('duel.waiting_opponent_start', 'Waiting for opponent to accept...')}
            </div>
          )}

          {isMatchFinished && (
            <div className="px-3 py-1 rounded-full text-xs font-bold bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              {duel.status === 'timed_out' ? t('duel.status_timed_out', 'Time Expired') : t('duel.status_completed', 'Match Finished')}
            </div>
          )}
        </div>

        {/* Right: Opponents scoreboard & Action Controls */}
        <div className="flex items-center gap-4">
          {/* Competitors Live Status */}
          <div className="flex items-center gap-3 px-3 py-1 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 text-xs">
            {/* Player 1 */}
            <div className="flex items-center gap-1.5">
              <Avatar src={creator.avatar_url} name={creator.name} size="sm" />
              <div className="text-left">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[80px] block">
                  {creator.username}
                </span>
                <span className="text-[10px] font-mono text-zinc-500">{creator.score} pts</span>
              </div>
            </div>

            <span className="font-bold text-zinc-400 text-[10px]">VS</span>

            {/* Player 2 */}
            <div className="flex items-center gap-1.5">
              <Avatar src={opponent?.avatar_url} name={opponent?.name || 'Opponent'} size="sm" />
              <div className="text-left">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[80px] block">
                  {opponent ? opponent.username : t('duel.open', 'Open')}
                </span>
                <span className="text-[10px] font-mono text-zinc-500">
                  {opponent ? `${opponent.score} pts` : '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Pending Invite Accept Button for Opponent */}
          {duel.status === 'pending' && myRole === 'opponent' && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => acceptMutation.mutate()}
              disabled={acceptMutation.isPending}
            >
              <Check className="w-4 h-4 mr-1.5" />
              {t('duel.accept_match', 'Start Battle')}
            </Button>
          )}

          {/* Forfeit button if actively fighting */}
          {duel.status === 'active' && isUserParticipant && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setIsForfeitModalOpen(true)}
              className="text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs"
            >
              <Flag className="w-3.5 h-3.5 mr-1" />
              {t('duel.forfeit', 'Surrender')}
            </Button>
          )}
        </div>
      </div>

      {/* Main Split Work Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Pane: Challenge Info / Test Cases / Results */}
        <div className="w-full md:w-1/2 flex flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
          {/* Sub Navigation Tabs */}
          <div className="flex items-center border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 px-4 shrink-0">
            <button
              onClick={() => setActiveLeftTab('problem')}
              className={`px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                activeLeftTab === 'problem'
                  ? 'border-violet-600 text-violet-600 dark:border-violet-400 dark:text-violet-400'
                  : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              {t('duel.tab_problem', 'Problem')}
            </button>

            <button
              onClick={() => setActiveLeftTab('testcases')}
              className={`px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                activeLeftTab === 'testcases'
                  ? 'border-violet-600 text-violet-600 dark:border-violet-400 dark:text-violet-400'
                  : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              {t('duel.tab_testcases', 'Sample Cases')} ({challenge.sample_test_cases.length})
            </button>

            <button
              onClick={() => setActiveLeftTab('results')}
              className={`px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                activeLeftTab === 'results'
                  ? 'border-violet-600 text-violet-600 dark:border-violet-400 dark:text-violet-400'
                  : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              {t('duel.tab_results', 'Execution Output')}
            </button>

            {isMatchFinished && opponentData?.code && (
              <button
                onClick={() => setActiveLeftTab('opponent_code')}
                className={`px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                  activeLeftTab === 'opponent_code'
                    ? 'border-violet-600 text-violet-600 dark:border-violet-400 dark:text-violet-400'
                    : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                {t('duel.tab_opponent_code', "Opponent's Code")}
              </button>
            )}
          </div>

          {/* Left Tab Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {activeLeftTab === 'problem' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                    {challenge.category}
                  </span>
                  <span className="text-xs font-semibold text-zinc-500">
                    {challenge.difficulty}
                  </span>
                </div>

                <div className="prose dark:prose-invert max-w-none text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap">
                  {challenge.description}
                </div>
              </div>
            )}

            {activeLeftTab === 'testcases' && (
              <div className="space-y-3">
                {challenge.sample_test_cases.map((tc, idx) => (
                  <div
                    key={tc.id || idx}
                    className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 space-y-2 text-xs"
                  >
                    <div className="font-semibold text-zinc-700 dark:text-zinc-300">
                      {t('duel.case_num', 'Sample Case {{num}}', { num: idx + 1 })}
                    </div>
                    <div>
                      <span className="text-zinc-400 font-mono block mb-1">Input:</span>
                      <pre className="p-2 rounded bg-zinc-100 dark:bg-zinc-900 font-mono text-zinc-800 dark:text-zinc-200 overflow-x-auto">
                        {tc.input_data}
                      </pre>
                    </div>
                    <div>
                      <span className="text-zinc-400 font-mono block mb-1">Expected Output:</span>
                      <pre className="p-2 rounded bg-zinc-100 dark:bg-zinc-900 font-mono text-zinc-800 dark:text-zinc-200 overflow-x-auto">
                        {tc.expected_output}
                      </pre>
                    </div>
                    {tc.explanation && (
                      <p className="text-zinc-500 italic pt-1">{tc.explanation}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeLeftTab === 'results' && (
              <div className="space-y-4">
                {!latestSubmission ? (
                  <div className="p-8 text-center rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 text-zinc-400 text-xs">
                    <Terminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    {t('duel.no_submissions_yet', 'Submit your code to see live test execution output and score.')}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          {latestSubmission.status === 'Accepted' ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-rose-500" />
                          )}
                          <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                            {latestSubmission.status}
                          </span>
                        </div>
                        <span className="text-xs text-zinc-500 mt-1 block">
                          {latestSubmission.execution_time_ms}ms · {Math.round(latestSubmission.memory_kb / 1024)}MB
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-xl font-mono font-bold text-violet-600 dark:text-violet-400">
                          {latestSubmission.score} / 100
                        </span>
                        <span className="text-[11px] text-zinc-400 block">{t('duel.score', 'Score')}</span>
                      </div>
                    </div>

                    {latestSubmission.error_message && (
                      <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs font-mono text-rose-700 dark:text-rose-300 whitespace-pre-wrap">
                        {latestSubmission.error_message}
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                        {t('duel.test_cases_evaluated', 'Evaluated Test Cases')}
                      </div>
                      {latestSubmission.test_results?.map((res, i) => (
                        <div
                          key={res.id || i}
                          className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs font-mono"
                        >
                          <div className="flex items-center gap-2">
                            {res.status === 'Accepted' ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <X className="w-3.5 h-3.5 text-rose-500" />
                            )}
                            <span>Test Case #{i + 1}</span>
                          </div>
                          <div className="flex items-center gap-3 text-zinc-500">
                            <span>{res.execution_time_ms}ms</span>
                            <span className="font-bold text-zinc-800 dark:text-zinc-200">
                              +{res.points_awarded} pts
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeLeftTab === 'opponent_code' && opponentData?.code && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    {opponentData.username}'s Solution ({opponentData.score} pts)
                  </div>
                </div>
                <div className="h-96 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                  <Editor
                    height="100%"
                    language={duel.language === 'c_cpp' ? 'cpp' : duel.language}
                    value={opponentData.code}
                    theme={theme === 'dark' ? 'vs-dark' : 'light'}
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      fontSize: 13,
                      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Monaco Code Editor & Actions */}
        <div className="w-full md:w-1/2 flex flex-col bg-zinc-900 text-white overflow-hidden">
          {/* Editor Header Bar */}
          <div className="px-4 py-2 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-violet-400" />
              <span className="font-mono uppercase font-semibold">{duel.language} Editor</span>
            </div>

            {duel.status === 'active' && (
              <button
                onClick={() => {
                  if (challenge.starter_code && challenge.starter_code[duel.language]) {
                    setCode(challenge.starter_code[duel.language]);
                  }
                }}
                className="flex items-center gap-1 hover:text-zinc-200 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t('duel.reset_code', 'Reset')}</span>
              </button>
            )}
          </div>

          {/* Monaco Editor Container */}
          <div className="flex-1 relative">
            <Editor
              height="100%"
              language={duel.language === 'c_cpp' ? 'cpp' : duel.language}
              value={code}
              onChange={(val) => setCode(val || '')}
              theme={theme === 'dark' ? 'vs-dark' : 'light'}
              loading={<MonacoLoadingSkeleton height="100%" />}
              options={{
                readOnly: duel.status !== 'active' || !isUserParticipant,
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                lineNumbers: 'on',
                roundedSelection: true,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
                padding: { top: 12 },
              }}
            />
          </div>

          {/* Editor Action Footer */}
          <div className="p-3 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between gap-4">
            <div className="text-xs text-zinc-400">
              {duel.status === 'pending' ? (
                <span>{t('duel.waiting_opponent_to_begin', 'Match will start as soon as opponent accepts.')}</span>
              ) : duel.status !== 'active' ? (
                <span>{t('duel.match_closed', 'This duel is closed for new submissions.')}</span>
              ) : (
                <span>{t('duel.submission_hint', 'Submitting evaluates all test cases with server-side validation.')}</span>
              )}
            </div>

            {duel.status === 'active' && isUserParticipant && (
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={submitMutation.isPending || !code.trim()}
                className="flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {submitMutation.isPending
                  ? t('duel.evaluating', 'Evaluating Solution...')
                  : t('duel.submit_solution', 'Submit Solution')}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Forfeit Confirmation Modal */}
      <Modal
        isOpen={isForfeitModalOpen}
        onClose={() => setIsForfeitModalOpen(false)}
        title={t('duel.forfeit_modal_title', 'Surrender Match?')}
        description={t('duel.forfeit_modal_desc', 'Forfeiting will immediately award the win to your opponent.')}
      >
        <div className="space-y-4 pt-2">
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
            {t('duel.forfeit_warning', 'Are you sure you want to surrender? This match will be recorded as a forfeit defeat in your history.')}
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsForfeitModalOpen(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={() => forfeitMutation.mutate()}
              disabled={forfeitMutation.isPending}
            >
              {forfeitMutation.isPending ? t('duel.surrendering', 'Surrendering...') : t('duel.confirm_forfeit', 'Yes, Surrender')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Match Result Announcement Modal */}
      <Modal
        isOpen={showResultModal}
        onClose={() => setIsResultModalDismissed(true)}
        title={
          isWinner
            ? t('duel.modal_victory_title', '🎉 Victory!')
            : isDraw
            ? t('duel.modal_draw_title', '🤝 Match Draw')
            : t('duel.modal_defeat_title', 'Duel Concluded')
        }
        description={duel.result_reason || t('duel.modal_result_desc', 'Match has concluded.')}
      >
        <div className="space-y-5 pt-3 text-center">
          <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center bg-zinc-100 dark:bg-zinc-800">
            {isWinner ? (
              <Trophy className="w-8 h-8 text-amber-500" />
            ) : isDraw ? (
              <Clock className="w-8 h-8 text-violet-500" />
            ) : (
              <Swords className="w-8 h-8 text-zinc-400" />
            )}
          </div>

          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 flex items-center justify-around">
            <div>
              <Avatar src={creator.avatar_url} name={creator.name} size="md" className="mx-auto mb-1" />
              <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{creator.username}</div>
              <div className="text-sm font-mono font-bold text-violet-600 dark:text-violet-400">
                {creator.score} pts
              </div>
            </div>

            <div className="text-xs font-bold text-zinc-400">VS</div>

            <div>
              <Avatar src={opponent?.avatar_url} name={opponent?.name || 'Opponent'} size="md" className="mx-auto mb-1" />
              <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{opponent?.username || 'Opponent'}</div>
              <div className="text-sm font-mono font-bold text-violet-600 dark:text-violet-400">
                {opponent?.score || 0} pts
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <Button variant="secondary" onClick={() => setIsResultModalDismissed(true)}>
              {t('duel.review_code_btn', 'Review Solution')}
            </Button>
            <Button variant="primary" onClick={() => navigate('/duels')}>
              {t('duel.return_to_lobby_btn', 'Return to Lobby')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DuelArenaPage;
