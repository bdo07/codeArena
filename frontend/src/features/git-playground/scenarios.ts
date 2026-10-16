import { GitScenario } from './types';
import { createEmptyRepo, getCurrentCommitHash, getCurrentBranchName } from './gitEngine';

export const SCENARIOS: GitScenario[] = [
  // --- Beginner Tier ---
  {
    id: 'git-init-first-commit',
    title: 'Initializing & Your First Commit',
    tier: 'beginner',
    description: 'Learn how to start a new project with Git, track changes to files, and record your very first commit.',
    objective: 'Run "git init", add all files to staging ("git add ."), and commit them with "git commit -m "Initial commit"".',
    hints: [
      'Step 1: Type `git init` to set up the repository.',
      'Step 2: Type `git add .` to stage the README.md and index.html files.',
      'Step 3: Type `git commit -m "Initial commit"` to seal your first commit.',
    ],
    initialState: () => {
      const s = createEmptyRepo();
      s.workingDirectory = {
        'README.md': '# My Awesome Project\nWelcome to CodeArena Git Playground.',
        'index.html': '<!DOCTYPE html><html><body><h1>Hello World</h1></body></html>',
      };
      return s;
    },
    validate: (state) => {
      return (
        state.isInitialized &&
        Object.keys(state.commits).length >= 1 &&
        Object.keys(state.stagingArea).length === 0
      );
    },
    rewardXp: 25,
  },
  {
    id: 'git-inspect-status',
    title: 'Inspecting Status & Working Tree',
    tier: 'beginner',
    description: 'Master checking the health of your repository with "git status" and examining history with "git log".',
    objective: 'Inspect the repo with "git status", stage "styles.css", commit it, and view the log with "git log --oneline".',
    hints: [
      'Run `git status` to see what files changed.',
      'Stage only `styles.css` using `git add styles.css`.',
      'Commit your staged changes: `git commit -m "Add styles"`.',
      'Check your commit log: `git log --oneline`.',
    ],
    initialState: () => {
      const s = createEmptyRepo();
      s.isInitialized = true;
      s.branches['main'] = 'a1b2c3d';
      s.HEAD = { type: 'branch', name: 'main' };
      s.commits['a1b2c3d'] = {
        hash: 'a1b2c3d',
        message: 'Initial commit',
        parents: [],
        author: 'Developer <dev@codearena.io>',
        timestamp: new Date().toISOString(),
        tree: { 'index.html': '<h1>App</h1>' },
      };
      s.workingDirectory = {
        'styles.css': 'body { background: #09090b; color: #fff; }',
      };
      return s;
    },
    validate: (state) => {
      const head = getCurrentCommitHash(state);
      return (
        Object.keys(state.commits).length >= 2 &&
        head !== 'a1b2c3d' &&
        Object.keys(state.stagingArea).length === 0
      );
    },
    rewardXp: 25,
  },
  {
    id: 'git-branching-basics',
    title: 'Creating & Exploring Branches',
    tier: 'beginner',
    description: 'Branches allow you to build new features safely without disrupting production code.',
    objective: 'Create a new branch called "feature/navbar", switch to it, make a commit, and inspect branches.',
    hints: [
      'Create and switch to branch: `git checkout -b feature/navbar` (or `git switch -c feature/navbar`).',
      'Stage the new navigation file: `git add .`',
      'Commit the changes: `git commit -m "Add navigation bar"`',
      'Verify active branch: `git branch`',
    ],
    initialState: () => {
      const s = createEmptyRepo();
      s.isInitialized = true;
      s.branches['main'] = '1000000';
      s.HEAD = { type: 'branch', name: 'main' };
      s.commits['1000000'] = {
        hash: '1000000',
        message: 'Set up app foundation',
        parents: [],
        author: 'Developer <dev@codearena.io>',
        timestamp: new Date().toISOString(),
        tree: { 'app.ts': 'console.log("App ready");' },
      };
      s.workingDirectory = {
        'navbar.ts': 'export const Navbar = () => "<nav>Menu</nav>";',
      };
      return s;
    },
    validate: (state) => {
      return (
        getCurrentBranchName(state) === 'feature/navbar' &&
        state.branches['feature/navbar'] !== state.branches['main'] &&
        Object.keys(state.commits).length >= 2
      );
    },
    rewardXp: 25,
  },
  {
    id: 'git-switching-branches',
    title: 'Context Switching Between Branches',
    tier: 'beginner',
    description: 'Effortlessly switch between main production and active feature branches with git switch/checkout.',
    objective: 'Switch from feature/login back to "main", and check git status to verify your branch pointer.',
    hints: [
      'Run `git switch main` or `git checkout main`.',
      'Confirm you are on main with `git status` or `git branch`.',
    ],
    initialState: () => {
      const s = createEmptyRepo();
      s.isInitialized = true;
      s.branches['main'] = 'c100000';
      s.branches['feature/login'] = 'c200000';
      s.HEAD = { type: 'branch', name: 'feature/login' };
      s.commits['c100000'] = {
        hash: 'c100000',
        message: 'Base system',
        parents: [],
        author: 'Developer <dev@codearena.io>',
        timestamp: new Date().toISOString(),
        tree: { 'auth.ts': '// auth' },
      };
      s.commits['c200000'] = {
        hash: 'c200000',
        message: 'Add OAuth login logic',
        parents: ['c100000'],
        author: 'Developer <dev@codearena.io>',
        timestamp: new Date().toISOString(),
        tree: { 'auth.ts': '// auth with oauth' },
      };
      return s;
    },
    validate: (state) => {
      return getCurrentBranchName(state) === 'main';
    },
    rewardXp: 25,
  },

  // --- Intermediate Tier ---
  {
    id: 'git-fast-forward-merge',
    title: 'Fast-Forward Branch Merging',
    tier: 'intermediate',
    description: 'When target branch history has not diverged, Git moves the branch tip forward in a clean linear merge.',
    objective: 'Ensure you are on "main" and merge "feature/search" with "git merge feature/search".',
    hints: [
      'Verify you are on main: `git switch main`',
      'Merge the feature: `git merge feature/search`',
      'Check history: `git log --oneline`',
    ],
    initialState: () => {
      const s = createEmptyRepo();
      s.isInitialized = true;
      s.branches['main'] = 'b100000';
      s.branches['feature/search'] = 'b200000';
      s.HEAD = { type: 'branch', name: 'main' };
      s.commits['b100000'] = {
        hash: 'b100000',
        message: 'Core setup',
        parents: [],
        author: 'Developer <dev@codearena.io>',
        timestamp: new Date().toISOString(),
        tree: { 'search.ts': '// empty' },
      };
      s.commits['b200000'] = {
        hash: 'b200000',
        message: 'Implement fuzzy search algorithm',
        parents: ['b100000'],
        author: 'Developer <dev@codearena.io>',
        timestamp: new Date().toISOString(),
        tree: { 'search.ts': 'export function search() {}' },
      };
      return s;
    },
    validate: (state) => {
      return (
        getCurrentBranchName(state) === 'main' &&
        state.branches['main'] === state.branches['feature/search']
      );
    },
    rewardXp: 25,
  },
  {
    id: 'git-merge-conflict',
    title: 'Resolving Merge Conflicts',
    tier: 'intermediate',
    description: 'Learn how to detect, analyze, and resolve real merge conflicts when two branches edit the same lines.',
    objective: 'Merge "feature/diverged", observe the conflict, resolve it by staging with "git add .", and commit with "git commit -m "Resolve merge conflict"".',
    hints: [
      'Trigger merge: `git merge feature/diverged` (it will report a conflict on app.ts).',
      'Check conflict status: `git status`.',
      'Stage the resolved file: `git add .` (simulates saving resolved content).',
      'Finish the merge: `git commit -m "Resolve merge conflict"`.',
    ],
    initialState: () => {
      const s = createEmptyRepo();
      s.isInitialized = true;
      s.branches['main'] = 'm100000';
      s.branches['feature/diverged'] = 'f100000';
      s.HEAD = { type: 'branch', name: 'main' };
      s.commits['m100000'] = {
        hash: 'm100000',
        message: 'Main branch updates to app.ts',
        parents: [],
        author: 'Developer <dev@codearena.io>',
        timestamp: new Date().toISOString(),
        tree: { 'app.ts': 'console.log("local changes");' },
      };
      s.commits['f100000'] = {
        hash: 'f100000',
        message: 'Diverged updates to app.ts',
        parents: [],
        author: 'Colleague <peer@codearena.io>',
        timestamp: new Date().toISOString(),
        tree: { 'app.ts': 'console.log("incoming changes");' },
      };
      return s;
    },
    validate: (state, history) => {
      return (
        state.conflictFiles.length === 0 &&
        history.some((cmd) => cmd.includes('commit')) &&
        Object.keys(state.commits).length >= 3
      );
    },
    rewardXp: 25,
  },
  {
    id: 'git-stash-workflow',
    title: 'Shelving Work with Git Stash',
    tier: 'intermediate',
    description: 'Safely stash uncommitted changes when you need to switch branches quickly without losing your work.',
    objective: 'Save your modified files with "git stash", inspect the stash list with "git stash list", and restore with "git stash pop".',
    hints: [
      'Save your dirty work tree: `git stash`',
      'View your stash stack: `git stash list`',
      'Restore your work: `git stash pop`',
    ],
    initialState: () => {
      const s = createEmptyRepo();
      s.isInitialized = true;
      s.branches['main'] = 's100000';
      s.HEAD = { type: 'branch', name: 'main' };
      s.commits['s100000'] = {
        hash: 's100000',
        message: 'Stable baseline',
        parents: [],
        author: 'Developer <dev@codearena.io>',
        timestamp: new Date().toISOString(),
        tree: { 'worker.ts': '// stable' },
      };
      s.workingDirectory = {
        'worker.ts': '// work in progress refactor that is not ready to commit',
      };
      return s;
    },
    validate: (_state, history) => {
      const hasStashed = history.some((c) => c.trim() === 'git stash');
      const hasPopped = history.some((c) => c.includes('git stash pop'));
      return hasStashed && hasPopped;
    },
    rewardXp: 25,
  },
  {
    id: 'git-undo-reset',
    title: 'Undoing Changes with Git Reset',
    tier: 'intermediate',
    description: 'Learn the differences between soft, mixed, and hard resets to safely undo bad commits.',
    objective: 'Undo the faulty commit "bad-commit" and roll HEAD back to "good-commit" using "git reset --hard <hash>".',
    hints: [
      'Inspect the log: `git log --oneline` to find the good commit hash.',
      'Reset hard: `git reset --hard g100000`',
      'Check status: `git status`',
    ],
    initialState: () => {
      const s = createEmptyRepo();
      s.isInitialized = true;
      s.branches['main'] = 'bad0000';
      s.HEAD = { type: 'branch', name: 'main' };
      s.commits['g100000'] = {
        hash: 'g100000',
        message: 'Verified good commit',
        parents: [],
        author: 'Developer <dev@codearena.io>',
        timestamp: new Date().toISOString(),
        tree: { 'config.json': '{"safe": true}' },
      };
      s.commits['bad0000'] = {
        hash: 'bad0000',
        message: 'Accidental broken experiment commit',
        parents: ['g100000'],
        author: 'Developer <dev@codearena.io>',
        timestamp: new Date().toISOString(),
        tree: { 'config.json': '{"broken": true}' },
      };
      return s;
    },
    validate: (state) => {
      return getCurrentCommitHash(state) === 'g100000';
    },
    rewardXp: 25,
  },

  // --- Advanced Tier ---
  {
    id: 'git-rebase-branch',
    title: 'Interactive Branch Rebasing',
    tier: 'advanced',
    description: 'Rebasing rewrites commit history to maintain a beautiful, linear project log without cluttering merge commits.',
    objective: 'Rebase your feature branch on top of main using "git rebase main".',
    hints: [
      'Ensure you are on the feature branch: `git branch`',
      'Rebase onto main: `git rebase main`',
      'Check your new linear log: `git log --oneline`',
    ],
    initialState: () => {
      const s = createEmptyRepo();
      s.isInitialized = true;
      s.branches['main'] = 'm200000';
      s.branches['feature/auth'] = 'f200000';
      s.HEAD = { type: 'branch', name: 'feature/auth' };
      s.commits['base000'] = {
        hash: 'base000',
        message: 'Shared ancestor',
        parents: [],
        author: 'Developer <dev@codearena.io>',
        timestamp: new Date().toISOString(),
        tree: {},
      };
      s.commits['m200000'] = {
        hash: 'm200000',
        message: 'Upstream updates on main',
        parents: ['base000'],
        author: 'Team <team@codearena.io>',
        timestamp: new Date().toISOString(),
        tree: {},
      };
      s.commits['f200000'] = {
        hash: 'f200000',
        message: 'OAuth provider implementation',
        parents: ['base000'],
        author: 'Developer <dev@codearena.io>',
        timestamp: new Date().toISOString(),
        tree: {},
      };
      return s;
    },
    validate: (state, history) => {
      const rebased = history.some((c) => c.includes('git rebase main'));
      return rebased && state.branches['feature/auth'] === state.branches['main'];
    },
    rewardXp: 25,
  },
  {
    id: 'git-detached-head',
    title: 'Detached HEAD & Time Traveling',
    tier: 'advanced',
    description: 'Inspect past commits directly without altering existing branch pointers, and return safely to main.',
    objective: 'Checkout the previous commit "c100000" into detached HEAD, view the log, then switch back to "main".',
    hints: [
      'Checkout commit directly: `git checkout c100000`',
      'Observe detached state with `git status`',
      'Return to safety: `git switch main`',
    ],
    initialState: () => {
      const s = createEmptyRepo();
      s.isInitialized = true;
      s.branches['main'] = 'c200000';
      s.HEAD = { type: 'branch', name: 'main' };
      s.commits['c100000'] = {
        hash: 'c100000',
        message: 'Version 1.0 Milestone',
        parents: [],
        author: 'Developer <dev@codearena.io>',
        timestamp: new Date().toISOString(),
        tree: {},
      };
      s.commits['c200000'] = {
        hash: 'c200000',
        message: 'Version 2.0 In Progress',
        parents: ['c100000'],
        author: 'Developer <dev@codearena.io>',
        timestamp: new Date().toISOString(),
        tree: {},
      };
      return s;
    },
    validate: (state, history) => {
      const wasDetached = history.some((c) => c.includes('c100000'));
      const isBackOnMain = getCurrentBranchName(state) === 'main';
      return wasDetached && isBackOnMain;
    },
    rewardXp: 25,
  },

  // --- Sandbox Free Play Mode ---
  {
    id: 'git-sandbox-freeplay',
    title: 'Git Sandbox & Free Play',
    tier: 'sandbox',
    description: 'An open playground to experiment with any Git commands. Create branches, merge, rebase, and watch the repository graph evolve live.',
    objective: 'Experiment freely with git commands: init, branch, commit, merge, stash, and reset.',
    hints: [
      'Type `help` anytime to view all available commands.',
      'Create files and commits to build complex branching graphs.',
      'Test out `git branch <name>`, `git checkout -b <name>`, and `git merge <name>`.',
    ],
    initialState: () => {
      const s = createEmptyRepo();
      s.isInitialized = true;
      s.branches['main'] = '0010000';
      s.HEAD = { type: 'branch', name: 'main' };
      s.commits['0010000'] = {
        hash: '0010000',
        message: 'Sandbox initial commit',
        parents: [],
        author: 'Developer <dev@codearena.io>',
        timestamp: new Date().toISOString(),
        tree: { 'sandbox.ts': 'console.log("Ready");' },
      };
      s.workingDirectory = {
        'notes.txt': 'Try running: git checkout -b feature/sandbox',
      };
      return s;
    },
    validate: () => false, // Sandbox is exploratory
    rewardXp: 0,
  },
];
