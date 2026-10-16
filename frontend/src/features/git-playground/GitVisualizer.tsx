import React from 'react';
import {
  GitBranch,
  GitCommit as GitCommitIcon,
  Layers,
  FileCode,
  AlertTriangle,
  Archive,
  CheckCircle2,
  FolderTree,
} from 'lucide-react';
import { GitRepoState, getCurrentCommitHash, getCurrentBranchName } from './gitEngine';

interface GitVisualizerProps {
  state: GitRepoState;
}

export const GitVisualizer: React.FC<GitVisualizerProps> = ({ state }) => {
  const currentHeadHash = getCurrentCommitHash(state);
  const currentBranch = getCurrentBranchName(state);

  // Collect and sort commits chronologically
  const commitsList = Object.values(state.commits);
  const commitsCount = commitsList.length;

  // Staged and working files
  const stagedFiles = Object.keys(state.stagingArea);
  const workingFiles = Object.keys(state.workingDirectory).filter(
    (f) => !state.stagingArea[f]
  );

  return (
    <div className="flex flex-col h-full bg-zinc-900/60 rounded-2xl border border-zinc-800 p-4 sm:p-5 overflow-hidden">
      {/* Top Status Bar */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-zinc-300 font-medium">
            <GitBranch className="w-4 h-4 text-violet-400" />
            <span>Branch:</span>
            <span className="font-mono px-2 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/20 font-semibold">
              {currentBranch || 'HEAD (detached)'}
            </span>
          </div>

          {currentHeadHash && (
            <div className="hidden sm:flex items-center gap-1 text-zinc-400 font-mono">
              <span>HEAD:</span>
              <span className="text-zinc-200 font-bold">{currentHeadHash.slice(0, 7)}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 font-mono text-[11px]">
          {state.stashList.length > 0 && (
            <span className="flex items-center gap-1 text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              <Archive className="w-3 h-3" />
              {state.stashList.length} stashed
            </span>
          )}
          <span className="text-zinc-400">
            {commitsCount} commit{commitsCount === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {/* Conflict Warning Alert */}
      {state.conflictFiles.length > 0 && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>
            <strong>Merge Conflict Active:</strong> Conflicting changes detected in{' '}
            {state.conflictFiles.join(', ')}. Stage with <code>git add</code> and run{' '}
            <code>git commit</code>.
          </span>
        </div>
      )}

      {/* Middle: Visual Commit Graph */}
      <div className="flex-1 bg-zinc-950/80 rounded-xl border border-zinc-800/80 p-4 overflow-x-auto min-h-[160px] flex flex-col justify-center relative">
        <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-1.5">
          <GitCommitIcon className="w-3.5 h-3.5 text-violet-400" />
          <span>Commit History Graph</span>
        </div>

        {commitsCount === 0 ? (
          <div className="text-center py-8 text-zinc-500 text-xs italic">
            No commits in repository yet. Run <code>git commit</code> to start history graph.
          </div>
        ) : (
          <div className="flex items-center gap-6 sm:gap-8 py-2 min-w-max px-2">
            {commitsList.map((commit, idx) => {
              const isHead = commit.hash === currentHeadHash;
              const branchesOnThisCommit = Object.entries(state.branches)
                .filter(([_, hash]) => hash === commit.hash)
                .map(([name]) => name);

              return (
                <div key={commit.hash} className="flex items-center gap-4 group relative">
                  {/* Commit Node */}
                  <div className="flex flex-col items-center">
                    {/* Branch and HEAD labels */}
                    <div className="flex flex-col items-center gap-1 mb-2">
                      {isHead && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500 text-zinc-950 shadow-xs animate-bounce">
                          HEAD
                        </span>
                      )}
                      {branchesOnThisCommit.map((bName) => (
                        <span
                          key={bName}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                            bName === currentBranch
                              ? 'bg-violet-600 text-white border-violet-400 shadow-sm'
                              : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                          }`}
                        >
                          {bName}
                        </span>
                      ))}
                    </div>

                    {/* Circle Node */}
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-mono text-[10px] font-bold transition-all shadow-md ${
                        isHead
                          ? 'bg-violet-600 text-white ring-4 ring-violet-500/30 ring-offset-2 ring-offset-zinc-950 scale-105'
                          : 'bg-zinc-800 text-zinc-300 border border-zinc-700 hover:border-violet-500 hover:scale-105'
                      }`}
                      title={`${commit.hash}: ${commit.message}`}
                    >
                      {commit.hash.slice(0, 4)}
                    </div>

                    {/* Message Preview */}
                    <span className="text-[11px] text-zinc-400 mt-2 font-medium max-w-[100px] truncate text-center">
                      {commit.message}
                    </span>
                  </div>

                  {/* Connecting Arrow between nodes */}
                  {idx < commitsCount - 1 && (
                    <div className="w-8 sm:w-10 h-0.5 bg-zinc-700 relative">
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 border-t-2 border-r-2 border-zinc-500 rotate-45" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom: Staging Area & Working Directory Panels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
        {/* Staging Area Box */}
        <div className="bg-zinc-950/60 rounded-xl border border-emerald-900/40 p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-mono mb-2">
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Staging Area (Index)
              </span>
              <span className="text-[11px] text-zinc-400">{stagedFiles.length} file(s)</span>
            </div>

            <div className="space-y-1 max-h-[85px] overflow-y-auto">
              {stagedFiles.length > 0 ? (
                stagedFiles.map((f) => (
                  <div
                    key={f}
                    className="flex items-center justify-between px-2 py-1 rounded bg-emerald-950/30 border border-emerald-800/40 text-xs font-mono text-emerald-300"
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <FileCode className="w-3 h-3 text-emerald-400 shrink-0" />
                      {f}
                    </span>
                    <span className="text-[9px] px-1 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                      staged
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-[11px] text-zinc-500 italic py-2">No files staged for commit.</p>
              )}
            </div>
          </div>
          <div className="text-[10px] text-zinc-500 font-mono mt-1 pt-1 border-t border-zinc-800/60">
            <code>git add &lt;file&gt;</code> to stage
          </div>
        </div>

        {/* Working Directory Box */}
        <div className="bg-zinc-950/60 rounded-xl border border-zinc-800 p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-mono mb-2">
              <span className="text-zinc-300 font-semibold flex items-center gap-1.5">
                <FolderTree className="w-3.5 h-3.5 text-violet-400" />
                Working Directory
              </span>
              <span className="text-[11px] text-zinc-400">{workingFiles.length} file(s)</span>
            </div>

            <div className="space-y-1 max-h-[85px] overflow-y-auto">
              {workingFiles.length > 0 ? (
                workingFiles.map((f) => {
                  const isConflict = state.conflictFiles.includes(f);
                  return (
                    <div
                      key={f}
                      className={`flex items-center justify-between px-2 py-1 rounded border text-xs font-mono ${
                        isConflict
                          ? 'bg-rose-950/40 border-rose-800/50 text-rose-300'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-300'
                      }`}
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <FileCode className="w-3 h-3 text-zinc-400 shrink-0" />
                        {f}
                      </span>
                      <span
                        className={`text-[9px] px-1 rounded font-bold ${
                          isConflict
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-amber-500/10 text-amber-400'
                        }`}
                      >
                        {isConflict ? 'conflict' : 'untracked'}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="text-[11px] text-zinc-500 italic py-2">Working directory clean.</p>
              )}
            </div>
          </div>
          <div className="text-[10px] text-zinc-500 font-mono mt-1 pt-1 border-t border-zinc-800/60">
            Local modified / untracked files
          </div>
        </div>
      </div>
    </div>
  );
};
