import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Terminal as TerminalIcon,
  GitBranch,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  ChevronDown,
  ArrowRight,
  Info,
} from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { SCENARIOS } from '@/features/git-playground/scenarios';
import { GitScenario, GitRepoState } from '@/features/git-playground/types';
import { executeGitCommand } from '@/features/git-playground/gitEngine';
import { GitVisualizer } from '@/features/git-playground/GitVisualizer';
import { GitTerminal } from '@/features/git-playground/GitTerminal';
import { gitPlaygroundApi } from '@/services/gitPlaygroundApi';
import { Button } from '@/components/ui/Button';

export const GitPlaygroundPage: React.FC = () => {
  const { user, refreshUser } = useAuth();

  // Selected scenario
  const [currentScenario, setCurrentScenario] = useState<GitScenario>(SCENARIOS[0]);
  const [repoState, setRepoState] = useState<GitRepoState>(() => SCENARIOS[0].initialState());
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [outputLog, setOutputLog] = useState<
    Array<{ type: 'input' | 'output' | 'error' | 'system'; text: string }>
  >([
    {
      type: 'system',
      text: `CodeArena Git Simulator v2.0\nScenario: ${SCENARIOS[0].title}\nObjective: ${SCENARIOS[0].objective}\nType 'help' for supported commands or 'git status' to begin.`,
    },
  ]);

  const [completedScenarios, setCompletedScenarios] = useState<string[]>([]);
  const [showHints, setShowHints] = useState(false);
  const [isScenarioPickerOpen, setIsScenarioPickerOpen] = useState(false);
  const [completionModal, setCompletionModal] = useState<{
    scenarioId: string;
    xpAwarded: number;
  } | null>(null);

  // Fetch user completed scenarios from backend
  const loadProgress = useCallback(async () => {
    try {
      const res = await gitPlaygroundApi.getProgress();
      if (res.completed_scenarios) {
        setCompletedScenarios(res.completed_scenarios);
      }
    } catch (err) {
      console.error('Failed to load git progress:', err);
    }
  }, []);

  useEffect(() => {
    loadProgress();
  }, [user, loadProgress]);

  // Reset current scenario to its initial state
  const handleResetScenario = useCallback(() => {
    const freshState = currentScenario.initialState();
    setRepoState(freshState);
    setCommandHistory([]);
    setOutputLog([
      {
        type: 'system',
        text: `Scenario reset to baseline.\nObjective: ${currentScenario.objective}`,
      },
    ]);
  }, [currentScenario]);

  // Switch scenario
  const handleSelectScenario = (scenario: GitScenario) => {
    setCurrentScenario(scenario);
    setRepoState(scenario.initialState());
    setCommandHistory([]);
    setShowHints(false);
    setIsScenarioPickerOpen(false);
    setOutputLog([
      {
        type: 'system',
        text: `Switched to scenario: ${scenario.title}\n${scenario.description}\nObjective: ${scenario.objective}`,
      },
    ]);
  };

  // Handle command execution from the terminal
  const handleExecuteCommand = async (commandStr: string) => {
    if (!commandStr.trim()) return;

    const trimmed = commandStr.trim();
    const updatedHistory = [...commandHistory, trimmed];
    setCommandHistory(updatedHistory);

    // Run command in Git state machine
    const result = executeGitCommand(trimmed, repoState);

    if (result.output === 'CLEAR_CONSOLE') {
      setOutputLog([]);
      return;
    }

    const newLogs: Array<{ type: 'input' | 'output' | 'error' | 'system'; text: string }> = [
      ...outputLog,
      { type: 'input', text: trimmed },
    ];

    if (result.output) {
      newLogs.push({
        type: result.success ? 'output' : 'error',
        text: result.output,
      });
    }

    const nextState = result.newState || repoState;
    setRepoState(nextState);

    // Validate scenario objective
    if (
      currentScenario.tier !== 'sandbox' &&
      !completedScenarios.includes(currentScenario.id) &&
      currentScenario.validate(nextState, updatedHistory)
    ) {
      newLogs.push({
        type: 'system',
        text: `🎉 Objective Completed! You conquered scenario "${currentScenario.title}".`,
      });

      // Save to backend if authenticated
      let xpEarned = currentScenario.rewardXp;
      if (user) {
        try {
          const compRes = await gitPlaygroundApi.completeScenario(
            currentScenario.id,
            updatedHistory.length
          );
          xpEarned = compRes.xp_awarded;
          await refreshUser();
          await loadProgress();
        } catch (err) {
          console.error('Failed to save completion to backend:', err);
        }
      }

      setCompletedScenarios((prev) => [...prev, currentScenario.id]);
      setCompletionModal({
        scenarioId: currentScenario.id,
        xpAwarded: xpEarned,
      });
    }

    setOutputLog(newLogs);
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'beginner':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'intermediate':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'advanced':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default:
        return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
    }
  };

  // Find next scenario
  const currentIndex = SCENARIOS.findIndex((s) => s.id === currentScenario.id);
  const nextScenario = SCENARIOS[currentIndex + 1] || null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Top Banner / Navigation Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/60 px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <TerminalIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base tracking-tight text-white flex items-center gap-2">
                  Git Playground
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20">
                    Simulator
                  </span>
                </h1>
              </div>
              <p className="text-xs text-zinc-400">
                Interactive Git state simulator & visual repository tree.
              </p>
            </div>
          </div>

          {/* Scenario Selector & Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Scenario Picker Dropdown Button */}
            <div className="relative">
              <button
                onClick={() => setIsScenarioPickerOpen(!isScenarioPickerOpen)}
                className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700/80 hover:border-zinc-600 text-xs font-medium flex items-center gap-2 shadow-2xs transition-colors"
              >
                <GitBranch className="w-3.5 h-3.5 text-violet-400" />
                <span className="truncate max-w-[180px]">{currentScenario.title}</span>
                <span
                  className={`text-[9px] uppercase font-mono px-1.5 py-0.2 rounded border font-semibold ${getTierBadge(
                    currentScenario.tier
                  )}`}
                >
                  {currentScenario.tier}
                </span>
                <ChevronDown className="w-3 h-3 text-zinc-400 ml-1" />
              </button>

              {/* Scenario Picker Dropdown Menu */}
              {isScenarioPickerOpen && (
                <div className="absolute left-0 sm:right-0 sm:left-auto top-full mt-2 w-80 sm:w-96 rounded-2xl bg-zinc-900 border border-zinc-700/90 shadow-2xl p-2 z-50 max-h-[420px] overflow-y-auto">
                  <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold border-b border-zinc-800">
                    Choose Guided Scenario
                  </div>
                  <div className="space-y-1 mt-1">
                    {SCENARIOS.map((scenario) => {
                      const isDone = completedScenarios.includes(scenario.id);
                      const isCurrent = currentScenario.id === scenario.id;

                      return (
                        <button
                          key={scenario.id}
                          onClick={() => handleSelectScenario(scenario)}
                          className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-start justify-between gap-2 ${
                            isCurrent
                              ? 'bg-violet-950/40 border-violet-500/60 text-white'
                              : 'bg-zinc-950/40 border-zinc-800/80 hover:bg-zinc-800/60 text-zinc-300'
                          }`}
                        >
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-1.5">
                              {isDone ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              ) : (
                                <div className="w-3.5 h-3.5 rounded-full border border-zinc-600 shrink-0" />
                              )}
                              <span className="text-xs font-semibold truncate">
                                {scenario.title}
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-400 line-clamp-1 pl-5">
                              {scenario.objective}
                            </p>
                          </div>

                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span
                              className={`text-[9px] uppercase font-mono px-1.5 py-0.2 rounded border font-semibold ${getTierBadge(
                                scenario.tier
                              )}`}
                            >
                              {scenario.tier}
                            </span>
                            {scenario.rewardXp > 0 && (
                              <span className="text-[9px] font-mono text-amber-400">
                                +{scenario.rewardXp} XP
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Reset Button */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleResetScenario}
              className="text-xs h-8 px-2.5 flex items-center gap-1 text-zinc-300 hover:text-white"
              title="Reset scenario to initial state"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </Button>
          </div>
        </div>
      </div>

      {/* Guest Notice Banner */}
      {!user && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-center text-xs text-amber-300 flex items-center justify-center gap-2">
          <Info className="w-3.5 h-3.5 text-amber-400" />
          <span>
            You are exploring the Git Playground as a guest.{' '}
            <Link to="/login" className="underline font-semibold hover:text-white">
              Sign in
            </Link>{' '}
            to save your progress and earn XP.
          </span>
        </div>
      )}

      {/* Main Content Split Workspace */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col space-y-4">
        {/* Mission Objective & Hints Header Card */}
        <div className="bg-zinc-900/60 rounded-2xl border border-zinc-800 p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded border font-semibold ${getTierBadge(
                    currentScenario.tier
                  )}`}
                >
                  {currentScenario.tier} scenario
                </span>
                {completedScenarios.includes(currentScenario.id) && (
                  <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Completed
                  </span>
                )}
                {currentScenario.rewardXp > 0 && (
                  <span className="text-xs font-mono text-amber-400 font-semibold">
                    +{currentScenario.rewardXp} XP
                  </span>
                )}
              </div>

              <h2 className="text-base sm:text-lg font-bold text-white">
                {currentScenario.title}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-300 max-w-3xl">
                <strong>Objective:</strong> {currentScenario.objective}
              </p>
            </div>

            {/* Hints Toggle Button */}
            {currentScenario.hints.length > 0 && (
              <button
                onClick={() => setShowHints(!showHints)}
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700/80 text-xs font-medium text-zinc-300 flex items-center gap-1.5 self-start md:self-auto transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                {showHints ? 'Hide Hints' : 'Need a Hint?'}
              </button>
            )}
          </div>

          {/* Expandable Hints Box */}
          {showHints && currentScenario.hints.length > 0 && (
            <div className="mt-4 pt-3 border-t border-zinc-800/80 bg-zinc-950/60 rounded-xl p-3 text-xs text-zinc-300 space-y-1.5 animate-in fade-in duration-200">
              <span className="font-semibold text-amber-400 block font-mono text-[11px] uppercase">
                Step-by-Step Guidance:
              </span>
              <ul className="list-disc list-inside space-y-1 text-zinc-400">
                {currentScenario.hints.map((hint, i) => (
                  <li key={i}>{hint}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Workspace Split Panels: Top Visualizer & Bottom Terminal */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[500px]">
          {/* Visual Repository State (Left/Top) */}
          <div className="lg:col-span-7 h-[360px] lg:h-auto">
            <GitVisualizer state={repoState} />
          </div>

          {/* Terminal Command Input (Right/Bottom) */}
          <div className="lg:col-span-5 h-[360px] lg:h-auto">
            <GitTerminal
              onExecuteCommand={handleExecuteCommand}
              outputLog={outputLog}
              currentState={repoState}
            />
          </div>
        </div>
      </div>

      {/* Completion Modal Celebration */}
      {completionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-700 p-6 max-w-md w-full shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">Scenario Completed!</h3>
              <p className="text-xs text-zinc-400 mt-1">
                You successfully mastered <strong>{currentScenario.title}</strong>.
              </p>
              {completionModal.xpAwarded > 0 && (
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-mono font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  +{completionModal.xpAwarded} XP Earned
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setCompletionModal(null)}>
                Review Scenario
              </Button>
              {nextScenario && (
                <Button
                  size="sm"
                  onClick={() => {
                    setCompletionModal(null);
                    handleSelectScenario(nextScenario);
                  }}
                  className="bg-violet-600 hover:bg-violet-500 text-white font-semibold flex items-center gap-1.5"
                >
                  Next Scenario <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GitPlaygroundPage;
