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
} from 'lucide-react';
import { api } from '@/lib/api';
import { Challenge, RunResult, SubmitResult, Submission } from '@/types';
import { useAuth } from '@/features/auth/AuthContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

export const WorkspacePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();

  const [language, setLanguage] = useState<'python' | 'javascript' | 'cpp'>('python');
  const [code, setCode] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'description' | 'history'>('description');
  const [resultsTab, setResultsTab] = useState<'testcases' | 'result'>('testcases');
  const [selectedTestCaseIndex, setSelectedTestCaseIndex] = useState(0);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [achievementModal, setAchievementModal] = useState<SubmitResult['gamification'] | null>(null);

  // Fetch Challenge Details
  const { data: challengeData, isLoading, isError } = useQuery<{
    challenge: Challenge;
    user_progress?: { solved: boolean; best_score: number };
  }>({
    queryKey: ['challenge', slug],
    queryFn: async () => {
      const res = await api.get(`/challenges/${slug}`);
      return res.data;
    },
  });

  const challenge = challengeData?.challenge;

  // Load starter code or local draft when challenge or language changes
  useEffect(() => {
    if (!challenge) return;

    const draftKey = `codearena_draft_${challenge.slug}_${language}`;
    const savedDraft = localStorage.getItem(draftKey);

    if (savedDraft) {
      setCode(savedDraft);
    } else if (challenge.starter_code && challenge.starter_code[language]) {
      setCode(challenge.starter_code[language]);
    } else {
      setCode('// Write your code here\n');
    }
  }, [challenge, language]);

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
    if (confirm('Reset editor to original starter code? Unsaved draft changes will be lost.')) {
      const starter = challenge.starter_code?.[language] || '';
      setCode(starter);
      localStorage.setItem(`codearena_draft_${challenge.slug}_${language}`, starter);
    }
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

      // If XP or badges were awarded, refresh user state and trigger achievement modal
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
      <div className="h-[calc(100vh-3.5rem)] flex items-center justify-center text-zinc-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Loading coding workspace...</span>
        </div>
      </div>
    );
  }

  if (isError || !challenge) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-zinc-100">Challenge Not Found</h2>
        <p className="text-xs text-zinc-400 mt-1 mb-6">
          The problem you requested does not exist or has been removed.
        </p>
        <Link to="/challenges">
          <Button variant="primary" size="sm">
            Back to Challenges
          </Button>
        </Link>
      </div>
    );
  }

  const runResult = runMutation.data;
  const submitResult = submitMutation.data;

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col bg-zinc-950 overflow-hidden text-left">
      {/* Top Workspace Header Bar */}
      <div className="h-11 border-b border-zinc-800/80 bg-zinc-900/60 px-4 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            to="/challenges"
            className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 font-medium transition-colors"
          >
            Problems <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
          </Link>
          <span className="text-xs font-semibold text-zinc-100">{challenge.title}</span>
          <Badge variant={challenge.difficulty} size="sm">
            {challenge.difficulty}
          </Badge>
          {challengeData?.user_progress?.solved && (
            <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Solved
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Language selector */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as any)}
            className="bg-zinc-800 border border-zinc-700/80 rounded-md px-2.5 py-1 text-xs text-zinc-200 font-mono focus:outline-none focus:border-violet-500/80 cursor-pointer"
          >
            <option value="python">Python 3</option>
            <option value="javascript">JavaScript (Node)</option>
            <option value="cpp">C++ (GCC)</option>
          </select>

          {/* Reset Code */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetStarter}
            title="Reset code to starter template"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>

          {/* Run Code Button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => runMutation.mutate()}
            isLoading={runMutation.isPending}
            leftIcon={<Play className="w-3.5 h-3.5 fill-current text-zinc-300" />}
          >
            Run Code
          </Button>

          {/* Submit Solution Button */}
          {user ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => submitMutation.mutate()}
              isLoading={submitMutation.isPending}
              leftIcon={<Send className="w-3.5 h-3.5" />}
            >
              Submit
            </Button>
          ) : (
            <Link to="/login">
              <Button variant="primary" size="sm">
                Sign In to Submit
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Main Two-Panel Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Panel: Problem Statement / Submission History */}
        <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-zinc-800/80 flex flex-col bg-zinc-950/60 overflow-hidden">
          {/* Panel Tabs */}
          <div className="h-9 border-b border-zinc-800/80 bg-zinc-900/40 px-3 flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('description')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'description'
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              Description
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Submissions
            </button>
          </div>

          {/* Panel Content (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-5 text-sm space-y-6">
            {activeTab === 'description' ? (
              <>
                {/* Title & metadata */}
                <div>
                  <h2 className="text-xl font-bold text-zinc-100">{challenge.title}</h2>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge variant={challenge.difficulty} size="sm">
                      {challenge.difficulty}
                    </Badge>
                    {challenge.tags.map((t) => (
                      <span
                        key={t.id}
                        className="text-[11px] text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded"
                      >
                        #{t.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Problem Description */}
                <div className="prose prose-invert max-w-none text-zinc-300 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                  {challenge.description}
                </div>

                {/* Input & Output Format */}
                {challenge.input_description && (
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Input Format
                    </h3>
                    <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/80 font-mono">
                      {challenge.input_description}
                    </p>
                  </div>
                )}

                {challenge.output_description && (
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Output Format
                    </h3>
                    <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/80 font-mono">
                      {challenge.output_description}
                    </p>
                  </div>
                )}

                {/* Sample Test Cases (Public) */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Sample Examples
                  </h3>
                  {challenge.sample_test_cases?.map((tc, index) => (
                    <div
                      key={tc.id}
                      className="border border-zinc-800 rounded-lg p-3.5 bg-zinc-900/40 space-y-2 text-xs"
                    >
                      <div className="text-[11px] font-medium text-zinc-400">
                        Example {index + 1}:
                      </div>
                      <div className="space-y-1 font-mono">
                        <div className="text-zinc-500 text-[11px]">Input:</div>
                        <pre className="bg-zinc-950 p-2 rounded text-zinc-200 overflow-x-auto">
                          {tc.input_data}
                        </pre>
                        <div className="text-zinc-500 text-[11px] pt-1">Expected Output:</div>
                        <pre className="bg-zinc-950 p-2 rounded text-violet-300 overflow-x-auto">
                          {tc.expected_output}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Constraints */}
                {challenge.constraints && (
                  <div className="space-y-1.5 pt-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Constraints
                    </h3>
                    <div className="text-xs text-zinc-400 bg-zinc-900/30 p-3 rounded-lg border border-zinc-800/60 font-mono whitespace-pre-line leading-relaxed">
                      {challenge.constraints}
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Submissions History Tab */
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                  Your Submissions
                </h3>
                {!user ? (
                  <div className="text-center py-10 text-xs text-zinc-500">
                    <p>Please log in to track your submission history.</p>
                    <Link to="/login" className="inline-block mt-3">
                      <Button variant="primary" size="sm">
                        Sign In
                      </Button>
                    </Link>
                  </div>
                ) : submissionsData?.data?.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-6 text-center">
                    No submissions recorded yet for this challenge.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {submissionsData?.data?.map((sub) => (
                      <div
                        key={sub.id}
                        onClick={() => setSelectedSubmission(sub)}
                        className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-700 transition-all cursor-pointer flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          {sub.status === 'Accepted' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-400" />
                          )}
                          <div>
                            <span className="font-semibold text-zinc-200">{sub.status}</span>
                            <div className="text-[11px] text-zinc-500 font-mono">
                              {sub.language} · {new Date(sub.submitted_at || '').toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        <div className="text-right font-mono text-[11px]">
                          <div className="text-zinc-300">{sub.score}% Score</div>
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

        {/* Right Panel: Monaco Editor & Execution Results */}
        <div className="lg:col-span-7 flex flex-col bg-zinc-950 overflow-hidden">
          {/* Monaco Editor Container */}
          <div className="flex-1 min-h-[300px] border-b border-zinc-800/80 relative">
            <Editor
              height="100%"
              theme="vs-dark"
              language={language === 'cpp' ? 'cpp' : language}
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

          {/* Bottom Execution Results Panel */}
          <div className="h-64 flex flex-col bg-zinc-900/50 overflow-hidden shrink-0">
            {/* Results Panel Tab Bar */}
            <div className="h-9 border-b border-zinc-800/80 bg-zinc-900 px-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setResultsTab('testcases')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    resultsTab === 'testcases'
                      ? 'bg-zinc-800 text-zinc-100'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Test Results
                </button>
                {submitResult && (
                  <button
                    onClick={() => setResultsTab('result')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1 cursor-pointer ${
                      resultsTab === 'result'
                        ? 'bg-zinc-800 text-zinc-100'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Submission Verdict
                  </button>
                )}
              </div>

              {/* Status Indicator */}
              <div className="flex items-center gap-3 text-xs">
                {(runResult?.is_demo_mode || submitResult?.is_demo_mode) && (
                  <span className="text-[11px] text-amber-400/90 font-medium flex items-center gap-1">
                    <Info className="w-3 h-3" /> Local Safe Fallback Active
                  </span>
                )}
              </div>
            </div>

            {/* Results Body */}
            <div className="flex-1 overflow-y-auto p-4 text-xs font-mono">
              {runMutation.isPending || submitMutation.isPending ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-400 gap-2">
                  <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                  <span>Evaluating code against test cases...</span>
                </div>
              ) : resultsTab === 'result' && submitResult ? (
                /* Full Submit Verdict Display */
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                    <div className="flex items-center gap-3">
                      {submitResult.submission.status === 'Accepted' ? (
                        <div className="w-8 h-8 rounded-full bg-emerald-950/60 border border-emerald-700/60 flex items-center justify-center text-emerald-400">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-rose-950/60 border border-rose-700/60 flex items-center justify-center text-rose-400">
                          <XCircle className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <div
                          className={`text-base font-bold ${
                            submitResult.submission.status === 'Accepted'
                              ? 'text-emerald-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {submitResult.submission.status}
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          Score: {submitResult.submission.score}%
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-zinc-400">
                      {submitResult.submission.execution_time_ms !== undefined && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-zinc-500" />
                          {submitResult.submission.execution_time_ms} ms
                        </span>
                      )}
                      {submitResult.submission.memory_kb !== undefined && (
                        <span className="flex items-center gap-1">
                          <Cpu className="w-3.5 h-3.5 text-zinc-500" />
                          {(submitResult.submission.memory_kb / 1024).toFixed(1)} MB
                        </span>
                      )}
                    </div>
                  </div>

                  {submitResult.submission.error_message && (
                    <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-900/50 text-rose-300">
                      <div className="font-semibold mb-1">Runtime / Execution Output:</div>
                      <pre className="whitespace-pre-wrap">{submitResult.submission.error_message}</pre>
                    </div>
                  )}

                  {/* Summary of test cases passed */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    {submitResult.submission.test_results?.map((res, i) => (
                      <div
                        key={res.id || i}
                        className={`p-2 rounded border text-center ${
                          res.status === 'Accepted'
                            ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-400'
                            : 'bg-rose-950/20 border-rose-800/40 text-rose-400'
                        }`}
                      >
                        <span className="font-bold">Test #{res.position}</span>
                        <div className="text-[10px] text-zinc-400">{res.status}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : runResult ? (
                /* Run Code (Sample cases) Results */
                <div className="space-y-3">
                  {/* Test case tabs */}
                  <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-2">
                    {runResult.test_results.map((tc, index) => (
                      <button
                        key={tc.test_case_id}
                        onClick={() => setSelectedTestCaseIndex(index)}
                        className={`px-3 py-1 rounded text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                          selectedTestCaseIndex === index
                            ? 'bg-zinc-800 text-zinc-100 font-semibold'
                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
                        }`}
                      >
                        {tc.passed ? (
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-rose-400" />
                        )}
                        Case {index + 1}
                      </button>
                    ))}
                  </div>

                  {/* Selected test case details */}
                  {runResult.test_results[selectedTestCaseIndex] && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <span className="text-zinc-500 text-[11px]">Input:</span>
                          <pre className="p-2.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-200 overflow-x-auto">
                            {runResult.test_results[selectedTestCaseIndex].input_data}
                          </pre>
                        </div>
                        <div className="space-y-1">
                          <span className="text-zinc-500 text-[11px]">Expected:</span>
                          <pre className="p-2.5 rounded bg-zinc-950 border border-zinc-800 text-emerald-400 overflow-x-auto">
                            {runResult.test_results[selectedTestCaseIndex].expected_output}
                          </pre>
                        </div>
                      </div>

                      <div className="space-y-1 pt-1">
                        <span className="text-zinc-500 text-[11px]">Your Output:</span>
                        <pre
                          className={`p-2.5 rounded bg-zinc-950 border overflow-x-auto ${
                            runResult.test_results[selectedTestCaseIndex].passed
                              ? 'border-emerald-800/60 text-emerald-300'
                              : 'border-rose-800/60 text-rose-300'
                          }`}
                        >
                          {runResult.test_results[selectedTestCaseIndex].actual_output ||
                            (runResult.test_results[selectedTestCaseIndex].stderr ? (
                              <span className="text-rose-400">
                                {runResult.test_results[selectedTestCaseIndex].stderr}
                              </span>
                            ) : (
                              <span className="text-zinc-600">(No output produced)</span>
                            ))}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-1">
                  <Play className="w-6 h-6 text-zinc-700" />
                  <span>Click "Run Code" to test against public sample cases</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Submission Detail Modal */}
      {selectedSubmission && (
        <Modal
          isOpen={Boolean(selectedSubmission)}
          onClose={() => setSelectedSubmission(null)}
          title={`Submission #${selectedSubmission.id} Details`}
          description={`Submitted for ${challenge.title} · ${selectedSubmission.language}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-950 border border-zinc-800">
              <span
                className={`font-bold text-sm ${
                  selectedSubmission.status === 'Accepted' ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {selectedSubmission.status}
              </span>
              <div className="text-zinc-400 font-mono">Score: {selectedSubmission.score}%</div>
            </div>

            <div className="space-y-1.5">
              <span className="text-zinc-400 font-medium">Source Code:</span>
              <pre className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 font-mono text-[11px] overflow-x-auto max-h-48">
                {selectedSubmission.source_code}
              </pre>
            </div>

            <div className="space-y-1.5">
              <span className="text-zinc-400 font-medium">Test Case Breakdown:</span>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {selectedSubmission.test_results?.map((res) => (
                  <div
                    key={res.id}
                    className="p-2 bg-zinc-950 border border-zinc-800 rounded flex items-center justify-between"
                  >
                    <span className="text-zinc-300">Test #{res.position}</span>
                    <Badge
                      variant={res.status === 'Accepted' ? 'Easy' : 'Hard'}
                      size="sm"
                    >
                      {res.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Gamification Milestone Achievement Modal */}
      {achievementModal && (
        <Modal
          isOpen={Boolean(achievementModal)}
          onClose={() => setAchievementModal(null)}
          title="Challenge Conquered!"
          maxWidth="sm"
        >
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 rounded-full bg-violet-950/60 border border-violet-500/40 flex items-center justify-center text-violet-400 mx-auto animate-bounce">
              <Award className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-zinc-100">+{achievementModal.xp_awarded} XP Earned</h3>
              <p className="text-xs text-zinc-400 mt-1">
                You solved {challenge.title} for the first time!
              </p>
            </div>

            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400">Current Level</span>
              <span className="text-violet-400 font-bold">Level {achievementModal.level}</span>
            </div>

            {achievementModal.new_badges?.length > 0 && (
              <div className="p-3 rounded-lg bg-violet-950/30 border border-violet-800/40 text-xs">
                <span className="font-semibold text-violet-300 flex items-center justify-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Badge Unlocked:
                </span>
                <p className="text-zinc-300 font-medium mt-1">
                  {achievementModal.new_badges[0].name}
                </p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {achievementModal.new_badges[0].description}
                </p>
              </div>
            )}

            <Button
              variant="primary"
              size="md"
              className="w-full mt-2"
              onClick={() => setAchievementModal(null)}
            >
              Continue Coding
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};
