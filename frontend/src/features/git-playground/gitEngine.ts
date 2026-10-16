import { GitRepoState, GitCommandResult, GitCommit } from './types';

// Deterministic short hash generator
let hashCounter = 100;
export const generateHash = (): string => {
  hashCounter += 7;
  return hashCounter.toString(16).padStart(7, '0').slice(-7);
};

export const createEmptyRepo = (): GitRepoState => ({
  isInitialized: false,
  branches: {},
  HEAD: { type: 'branch', name: 'main' },
  commits: {},
  workingDirectory: {},
  stagingArea: {},
  stashList: [],
  conflictFiles: [],
});

export const getCurrentCommitHash = (state: GitRepoState): string | null => {
  if (state.HEAD.type === 'branch') {
    return state.branches[state.HEAD.name] || null;
  }
  return state.HEAD.hash || null;
};

export const getCurrentBranchName = (state: GitRepoState): string | null => {
  return state.HEAD.type === 'branch' ? state.HEAD.name : null;
};

/**
 * Executes a simulated Git command safely against in-memory state.
 */
export const executeGitCommand = (
  rawInput: string,
  currentState: GitRepoState
): GitCommandResult => {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return { output: '', success: true, newState: currentState };
  }

  // Clone current state immutably
  const state: GitRepoState = {
    ...currentState,
    branches: { ...currentState.branches },
    commits: { ...currentState.commits },
    workingDirectory: { ...currentState.workingDirectory },
    stagingArea: { ...currentState.stagingArea },
    stashList: [...currentState.stashList],
    conflictFiles: [...currentState.conflictFiles],
    HEAD: { ...currentState.HEAD },
  };

  const tokens = trimmed.split(/\s+/);
  const mainCmd = tokens[0].toLowerCase();

  if (mainCmd === 'help') {
    return {
      output: [
        'Available Git Commands in Simulator:',
        '  git init                      Initialize a new local Git repository',
        '  git status                    Show working tree status and branch info',
        '  git add <file> | .            Add file contents to the staging area',
        '  git commit -m "<msg>"         Record changes to the repository',
        '  git log [--oneline]           Display commit history',
        '  git branch [<name>] [-d]      List, create, or delete branches',
        '  git checkout <branch|hash>    Switch branches or restore files',
        '  git checkout -b <name>        Create and switch to a new branch',
        '  git switch [-c] <name>        Switch to or create a branch',
        '  git merge <branch>            Join two or more development histories',
        '  git stash [pop|list]          Stash changes in a dirty working directory',
        '  git reset [--soft|--hard]     Reset current HEAD to the specified state',
        '  git rebase <branch>           Reapply commits on top of another base tip',
        '  clear                         Clear terminal output',
      ].join('\n'),
      success: true,
      newState: state,
    };
  }

  if (mainCmd === 'clear') {
    return { output: 'CLEAR_CONSOLE', success: true, newState: state };
  }

  if (mainCmd !== 'git') {
    return {
      output: `command not found: ${mainCmd}. Type 'help' for available Git commands.`,
      success: false,
      newState: state,
    };
  }

  const subCmd = tokens[1]?.toLowerCase();
  const args = tokens.slice(2);

  if (!subCmd) {
    return {
      output: "git: missing command. Type 'help' for available commands.",
      success: false,
      newState: state,
    };
  }

  // Check uninitialized repo (allow init only)
  if (!state.isInitialized && subCmd !== 'init') {
    return {
      output: 'fatal: not a git repository (or any of the parent directories): .git\nRun "git init" to initialize a repository.',
      success: false,
      newState: state,
    };
  }

  // 1. git init
  if (subCmd === 'init') {
    state.isInitialized = true;
    if (!state.branches['main']) {
      state.branches['main'] = '';
    }
    state.HEAD = { type: 'branch', name: 'main' };
    return {
      output: 'Initialized empty Git repository in /workspace/.git/',
      success: true,
      newState: state,
    };
  }

  // 2. git status
  if (subCmd === 'status') {
    const branchName = getCurrentBranchName(state);
    const headHash = getCurrentCommitHash(state);
    const lines: string[] = [];

    if (branchName) {
      lines.push(`On branch ${branchName}`);
    } else {
      lines.push(`HEAD detached at ${headHash}`);
    }

    if (!headHash) {
      lines.push('\nNo commits yet\n');
    }

    // Merge conflicts
    if (state.conflictFiles.length > 0) {
      lines.push('\nYou have unmerged paths. (fix conflicts and run "git commit")');
      lines.push('Unmerged paths:');
      state.conflictFiles.forEach((file) => lines.push(`\tboth modified:   ${file}`));
    }

    // Changes to be committed (staged)
    const stagedFiles = Object.keys(state.stagingArea);
    if (stagedFiles.length > 0) {
      lines.push('\nChanges to be committed:');
      lines.push('  (use "git reset <file>..." to unstage)');
      stagedFiles.forEach((file) => lines.push(`\tnew file:   ${file}`));
    }

    // Untracked / modified working directory files
    const untracked = Object.keys(state.workingDirectory).filter(
      (f) => !state.stagingArea[f] && !state.conflictFiles.includes(f)
    );
    if (untracked.length > 0) {
      lines.push('\nUntracked files:');
      lines.push('  (use "git add <file>..." to include in what will be committed)');
      untracked.forEach((file) => lines.push(`\t${file}`));
    }

    if (stagedFiles.length === 0 && untracked.length === 0 && state.conflictFiles.length === 0) {
      lines.push('\nnothing to commit, working tree clean');
    }

    return {
      output: lines.join('\n'),
      success: true,
      newState: state,
    };
  }

  // 3. git add
  if (subCmd === 'add') {
    if (args.length === 0) {
      return { output: 'Nothing specified, nothing added.', success: false, newState: state };
    }

    const target = args[0];
    if (target === '.' || target === '-A' || target === '--all') {
      // Stage all working directory files
      Object.entries(state.workingDirectory).forEach(([k, v]) => {
        state.stagingArea[k] = v;
      });
      // If resolving conflicts, remove resolved files
      state.conflictFiles = [];
      return { output: '', success: true, newState: state };
    }

    if (state.workingDirectory[target] !== undefined) {
      state.stagingArea[target] = state.workingDirectory[target];
      state.conflictFiles = state.conflictFiles.filter((f) => f !== target);
      return { output: '', success: true, newState: state };
    }

    return {
      output: `fatal: pathspec '${target}' did not match any files`,
      success: false,
      newState: state,
    };
  }

  // 4. git commit
  if (subCmd === 'commit') {
    let message = '';
    const mIndex = args.indexOf('-m');
    if (mIndex !== -1 && args[mIndex + 1]) {
      // Reassemble commit message if enclosed in quotes
      const msgTokens = args.slice(mIndex + 1).join(' ');
      message = msgTokens.replace(/^["']|["']$/g, '');
    } else {
      return {
        output: 'error: switch `m` requires a value. Use: git commit -m "Your commit message"',
        success: false,
        newState: state,
      };
    }

    if (Object.keys(state.stagingArea).length === 0 && state.conflictFiles.length === 0) {
      return {
        output: 'nothing to commit, working tree clean',
        success: false,
        newState: state,
      };
    }

    if (state.conflictFiles.length > 0) {
      return {
        output: `error: Committing is not possible because you have unmerged files: ${state.conflictFiles.join(', ')}\nFix conflicts and then run "git add <file>"`,
        success: false,
        newState: state,
      };
    }

    const newHash = generateHash();
    const parentHash = getCurrentCommitHash(state);
    const parents = parentHash ? [parentHash] : [];

    const newCommit: GitCommit = {
      hash: newHash,
      message,
      parents,
      author: 'Developer <dev@codearena.io>',
      timestamp: new Date().toISOString(),
      tree: { ...state.stagingArea },
    };

    state.commits[newHash] = newCommit;

    // Advance branch or detached HEAD
    if (state.HEAD.type === 'branch') {
      state.branches[state.HEAD.name] = newHash;
    } else {
      state.HEAD.hash = newHash;
    }

    // Clear staging area and sync committed files
    const committedFilesCount = Object.keys(state.stagingArea).length;
    state.stagingArea = {};

    const branchLabel = getCurrentBranchName(state) || `(detached HEAD ${newHash})`;
    return {
      output: `[${branchLabel} ${newHash}] ${message}\n ${committedFilesCount} file(s) changed`,
      success: true,
      newState: state,
    };
  }

  // 5. git log
  if (subCmd === 'log') {
    const isOneLine = args.includes('--oneline');
    const headHash = getCurrentCommitHash(state);

    if (!headHash || !state.commits[headHash]) {
      return {
        output: 'fatal: your current branch does not have any commits yet',
        success: false,
        newState: state,
      };
    }

    // Traverse commit history upwards
    const history: GitCommit[] = [];
    const visited = new Set<string>();
    const queue = [headHash];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (!visited.has(current) && state.commits[current]) {
        visited.add(current);
        history.push(state.commits[current]);
        queue.push(...state.commits[current].parents);
      }
    }

    if (isOneLine) {
      const lines = history.map((c) => {
        // Tag branches pointing to this commit
        const tags: string[] = [];
        Object.entries(state.branches).forEach(([bName, bHash]) => {
          if (bHash === c.hash) {
            tags.push(state.HEAD.type === 'branch' && state.HEAD.name === bName ? `HEAD -> ${bName}` : bName);
          }
        });
        const tagStr = tags.length > 0 ? ` (${tags.join(', ')})` : '';
        return `${c.hash}${tagStr} ${c.message}`;
      });
      return { output: lines.join('\n'), success: true, newState: state };
    }

    const lines = history.map((c) => {
      const tags: string[] = [];
      Object.entries(state.branches).forEach(([bName, bHash]) => {
        if (bHash === c.hash) {
          tags.push(state.HEAD.type === 'branch' && state.HEAD.name === bName ? `HEAD -> ${bName}` : bName);
        }
      });
      const tagStr = tags.length > 0 ? ` (${tags.join(', ')})` : '';

      return [
        `commit ${c.hash}${tagStr}`,
        `Author: ${c.author}`,
        `Date:   ${c.timestamp}`,
        '',
        `    ${c.message}`,
        '',
      ].join('\n');
    });

    return { output: lines.join('\n'), success: true, newState: state };
  }

  // 6. git branch
  if (subCmd === 'branch') {
    // List branches
    if (args.length === 0) {
      const activeBranch = getCurrentBranchName(state);
      const lines = Object.keys(state.branches).map((b) => {
        return b === activeBranch ? `* ${b}` : `  ${b}`;
      });
      return { output: lines.join('\n'), success: true, newState: state };
    }

    // Delete branch: git branch -d <name> or -D <name>
    if (args[0] === '-d' || args[0] === '-D') {
      const targetBranch = args[1];
      if (!targetBranch) {
        return { output: 'fatal: branch name required', success: false, newState: state };
      }
      if (getCurrentBranchName(state) === targetBranch) {
        return { output: `error: Cannot delete branch '${targetBranch}' checked out at '/workspace'`, success: false, newState: state };
      }
      if (!state.branches[targetBranch]) {
        return { output: `error: branch '${targetBranch}' not found.`, success: false, newState: state };
      }
      delete state.branches[targetBranch];
      return { output: `Deleted branch ${targetBranch}.`, success: true, newState: state };
    }

    // Create branch: git branch <name>
    const newBranch = args[0];
    if (state.branches[newBranch]) {
      return { output: `fatal: A branch named '${newBranch}' already exists.`, success: false, newState: state };
    }

    const currentHash = getCurrentCommitHash(state);
    state.branches[newBranch] = currentHash || '';
    return { output: '', success: true, newState: state };
  }

  // 7. git checkout / git switch
  if (subCmd === 'checkout' || subCmd === 'switch') {
    const isCreate = args.includes('-b') || args.includes('-c');
    let target = isCreate ? args[args.indexOf(args.includes('-b') ? '-b' : '-c') + 1] : args[0];

    if (!target) {
      return { output: 'fatal: missing branch name or commit hash', success: false, newState: state };
    }

    if (isCreate) {
      if (state.branches[target]) {
        return { output: `fatal: a branch named '${target}' already exists`, success: false, newState: state };
      }
      const curHash = getCurrentCommitHash(state);
      state.branches[target] = curHash || '';
      state.HEAD = { type: 'branch', name: target };
      return { output: `Switched to a new branch '${target}'`, success: true, newState: state };
    }

    // Checkout existing branch
    if (state.branches[target] !== undefined) {
      state.HEAD = { type: 'branch', name: target };
      return { output: `Switched to branch '${target}'`, success: true, newState: state };
    }

    // Checkout commit hash (detached HEAD)
    if (state.commits[target]) {
      state.HEAD = { type: 'commit', hash: target };
      return {
        output: `Note: switching to '${target}'.\nYou are in 'detached HEAD' state.`,
        success: true,
        newState: state,
      };
    }

    return {
      output: `error: pathspec '${target}' did not match any file(s) known to git`,
      success: false,
      newState: state,
    };
  }

  // 8. git merge <branch>
  if (subCmd === 'merge') {
    const targetBranch = args[0];
    if (!targetBranch || !state.branches[targetBranch]) {
      return { output: `merge: ${targetBranch} - not something we can merge`, success: false, newState: state };
    }

    const currentBranch = getCurrentBranchName(state);
    if (!currentBranch) {
      return { output: 'fatal: You are in detached HEAD state. Cannot merge.', success: false, newState: state };
    }

    if (currentBranch === targetBranch) {
      return { output: 'Already up to date.', success: true, newState: state };
    }

    const currentHash = state.branches[currentBranch];
    const targetHash = state.branches[targetBranch];

    if (currentHash === targetHash) {
      return { output: 'Already up to date.', success: true, newState: state };
    }

    // Fast-Forward check: if current commit is ancestor of target commit
    const targetCommit = state.commits[targetHash];
    if (targetCommit && targetCommit.parents.includes(currentHash)) {
      state.branches[currentBranch] = targetHash;
      // Bring files from target into working directory
      state.workingDirectory = { ...state.workingDirectory, ...targetCommit.tree };
      return {
        output: `Updating ${currentHash.slice(0, 7)}..${targetHash.slice(0, 7)}\nFast-forward`,
        success: true,
        newState: state,
      };
    }

    // Simulated Conflict Check: if conflict simulation is flagged or conflicting files present
    if (targetBranch.includes('conflict') || targetBranch.includes('diverged')) {
      state.conflictFiles = ['app.ts'];
      state.workingDirectory['app.ts'] =
        '<<<<<<< HEAD\nconsole.log("local changes");\n=======\nconsole.log("incoming changes");\n>>>>>>> ' +
        targetBranch;
      return {
        output: `Auto-merging app.ts\nCONFLICT (content): Merge conflict in app.ts\nAutomatic merge failed; fix conflicts and then commit the result.`,
        success: false,
        newState: state,
      };
    }

    // 3-way merge commit
    const mergeHash = generateHash();
    const mergeCommit: GitCommit = {
      hash: mergeHash,
      message: `Merge branch '${targetBranch}' into ${currentBranch}`,
      parents: [currentHash, targetHash],
      author: 'Developer <dev@codearena.io>',
      timestamp: new Date().toISOString(),
      tree: { ...state.commits[currentHash]?.tree, ...targetCommit?.tree },
    };

    state.commits[mergeHash] = mergeCommit;
    state.branches[currentBranch] = mergeHash;
    state.workingDirectory = { ...state.workingDirectory, ...mergeCommit.tree };

    return {
      output: `Merge made by the 'ort' strategy.\n ${mergeHash} Merge branch '${targetBranch}' into ${currentBranch}`,
      success: true,
      newState: state,
    };
  }

  // 9. git stash
  if (subCmd === 'stash') {
    const action = args[0] || 'push';

    if (action === 'list') {
      if (state.stashList.length === 0) {
        return { output: '', success: true, newState: state };
      }
      const lines = state.stashList.map(
        (s, idx) => `stash@{${idx}}: WIP on ${s.branch}: ${s.message}`
      );
      return { output: lines.join('\n'), success: true, newState: state };
    }

    if (action === 'pop') {
      if (state.stashList.length === 0) {
        return { output: 'error: No stash entries found.', success: false, newState: state };
      }
      const popped = state.stashList.shift()!;
      state.workingDirectory = { ...state.workingDirectory, ...popped.workingDirectory };
      state.stagingArea = { ...state.stagingArea, ...popped.stagingArea };
      return {
        output: `On branch ${getCurrentBranchName(state)}\nDropped refs/stash@{0}\nRestored changes to working directory.`,
        success: true,
        newState: state,
      };
    }

    // Stash current changes
    const curBranch = getCurrentBranchName(state) || 'detached';
    const curHash = getCurrentCommitHash(state) || '0000000';
    state.stashList.unshift({
      id: state.stashList.length,
      message: `${curHash.slice(0, 7)} work in progress`,
      branch: curBranch,
      workingDirectory: { ...state.workingDirectory },
      stagingArea: { ...state.stagingArea },
    });

    state.workingDirectory = {};
    state.stagingArea = {};
    return {
      output: `Saved working directory and index state WIP on ${curBranch}: ${curHash.slice(0, 7)}`,
      success: true,
      newState: state,
    };
  }

  // 10. git reset
  if (subCmd === 'reset') {
    const isHard = args.includes('--hard');
    const targetHash = args.find((a) => !a.startsWith('-'));

    if (targetHash && state.commits[targetHash]) {
      const curBranch = getCurrentBranchName(state);
      if (curBranch) {
        state.branches[curBranch] = targetHash;
      } else {
        state.HEAD = { type: 'commit', hash: targetHash };
      }

      if (isHard) {
        state.stagingArea = {};
        state.workingDirectory = { ...state.commits[targetHash].tree };
      }

      return {
        output: `HEAD is now at ${targetHash} ${state.commits[targetHash].message}`,
        success: true,
        newState: state,
      };
    }

    if (targetHash && state.stagingArea[targetHash]) {
      // Unstage single file
      delete state.stagingArea[targetHash];
      return { output: `Unstaged changes for '${targetHash}'`, success: true, newState: state };
    }

    // Default reset: unstage everything
    state.stagingArea = {};
    return { output: 'Unstaged all changes.', success: true, newState: state };
  }

  // 11. git rebase <branch>
  if (subCmd === 'rebase') {
    const upstreamBranch = args[0];
    if (!upstreamBranch || !state.branches[upstreamBranch]) {
      return { output: `fatal: invalid upstream '${upstreamBranch}'`, success: false, newState: state };
    }

    const curBranch = getCurrentBranchName(state);
    if (!curBranch) {
      return { output: 'fatal: You are in detached HEAD state. Cannot rebase.', success: false, newState: state };
    }

    const targetHash = state.branches[upstreamBranch];
    state.branches[curBranch] = targetHash;
    return {
      output: `Successfully rebased and updated refs/heads/${curBranch} on top of ${upstreamBranch}.`,
      success: true,
      newState: state,
    };
  }

  // Helpful explanations for remote commands
  if (['push', 'pull', 'clone', 'fetch', 'remote'].includes(subCmd)) {
    return {
      output: `Git Simulator Notice: 'git ${subCmd}' is a remote network command. This playground simulates your full local Git engine (working directory, index, commits, branches, merges, conflicts, and rebasing) in a local sandboxed environment.`,
      success: true,
      newState: state,
    };
  }

  return {
    output: `git: '${subCmd}' is not a recognized simulator command. Type 'help' for available commands.`,
    success: false,
    newState: state,
  };
};
