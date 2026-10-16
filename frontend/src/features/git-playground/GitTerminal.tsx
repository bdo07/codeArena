import React, { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, CornerDownLeft, Sparkles } from 'lucide-react';
import { getCurrentBranchName } from './gitEngine';
import { GitRepoState } from './types';

interface GitTerminalProps {
  onExecuteCommand: (cmd: string) => void;
  outputLog: Array<{ type: 'input' | 'output' | 'error' | 'system'; text: string }>;
  currentState: GitRepoState;
}

export const GitTerminal: React.FC<GitTerminalProps> = ({
  onExecuteCommand,
  outputLog,
  currentState,
}) => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentBranch = getCurrentBranchName(currentState) || 'main';

  // Auto-scroll on new log entry
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [outputLog]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    setHistory((prev) => [...prev, trimmed]);
    setHistoryIndex(-1);
    onExecuteCommand(trimmed);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      const nextIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setInput(history[nextIndex]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex >= history.length) {
        setHistoryIndex(-1);
        setInput('');
      } else {
        setHistoryIndex(nextIndex);
        setInput(history[nextIndex]);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Tab completion for common commands and branch names
      const commonCommands = [
        'git status',
        'git add .',
        'git commit -m ""',
        'git log --oneline',
        'git branch',
        'git switch main',
        'git checkout',
        'git merge',
        'git stash',
        'git reset',
      ];
      const match = commonCommands.find((c) => c.startsWith(input));
      if (match) {
        setInput(match);
      }
    }
  };

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      className="flex flex-col h-full bg-zinc-950 rounded-2xl border border-zinc-800 shadow-xl overflow-hidden font-mono text-xs cursor-text"
    >
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900 border-b border-zinc-800/80 select-none">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          <span className="text-[11px] text-zinc-400 font-semibold flex items-center gap-1.5 ml-2">
            <TerminalIcon className="w-3.5 h-3.5 text-violet-400" />
            bash — git simulator
          </span>
        </div>

        {/* Quick helper pills */}
        <div className="hidden sm:flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onExecuteCommand('git status');
            }}
            className="px-2 py-0.5 text-[10px] rounded bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
          >
            git status
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onExecuteCommand('git log --oneline');
            }}
            className="px-2 py-0.5 text-[10px] rounded bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
          >
            git log
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onExecuteCommand('help');
            }}
            className="px-2 py-0.5 text-[10px] rounded bg-violet-950/60 text-violet-300 border border-violet-800/40 hover:bg-violet-900/60 transition-colors flex items-center gap-1"
          >
            <Sparkles className="w-2.5 h-2.5" />
            help
          </button>
        </div>
      </div>

      {/* Terminal Output Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-2.5 leading-relaxed">
        {outputLog.map((log, index) => {
          if (log.type === 'input') {
            return (
              <div key={index} className="flex items-center gap-1.5 text-zinc-300">
                <span className="text-emerald-400 font-bold">$</span>
                <span className="text-zinc-100 font-semibold">{log.text}</span>
              </div>
            );
          }
          if (log.type === 'error') {
            return (
              <pre key={index} className="text-rose-400 font-mono whitespace-pre-wrap pl-3 border-l-2 border-rose-500/40">
                {log.text}
              </pre>
            );
          }
          if (log.type === 'system') {
            return (
              <pre key={index} className="text-violet-400 font-mono whitespace-pre-wrap pl-3 border-l-2 border-violet-500/40">
                {log.text}
              </pre>
            );
          }
          return (
            <pre key={index} className="text-zinc-300 font-mono whitespace-pre-wrap pl-3 border-l-2 border-zinc-700/50">
              {log.text}
            </pre>
          );
        })}
        <div ref={terminalEndRef} />
      </div>

      {/* Command Input Prompt Form */}
      <form onSubmit={handleSubmit} className="px-4 py-3 bg-zinc-900/80 border-t border-zinc-800 flex items-center gap-2">
        <span className="text-emerald-400 font-bold select-none shrink-0">$</span>
        <span className="text-[11px] text-zinc-500 select-none hidden sm:inline shrink-0">
          ({currentBranch})
        </span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type git command (e.g., git status, git add ., git commit -m 'msg')..."
          className="flex-1 bg-transparent text-zinc-100 outline-none border-none placeholder-zinc-600 font-mono text-xs"
          autoFocus
          spellCheck={false}
          autoComplete="off"
        />
        <button
          type="submit"
          className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
          title="Press Enter to execute"
        >
          <CornerDownLeft className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
