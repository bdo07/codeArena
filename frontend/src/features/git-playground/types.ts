export interface GitCommit {
  hash: string;
  message: string;
  parents: string[];
  author: string;
  timestamp: string;
  tree: Record<string, string>; // filename -> content
}

export type GitHead =
  | { type: 'branch'; name: string }
  | { type: 'commit'; hash: string };

export interface GitStashEntry {
  id: number;
  message: string;
  branch: string;
  workingDirectory: Record<string, string>;
  stagingArea: Record<string, string>;
}

export interface GitRepoState {
  isInitialized: boolean;
  branches: Record<string, string>; // branchName -> commitHash
  HEAD: GitHead;
  commits: Record<string, GitCommit>; // commitHash -> GitCommit
  workingDirectory: Record<string, string>; // filename -> content
  stagingArea: Record<string, string>; // filename -> content
  stashList: GitStashEntry[];
  conflictFiles: string[]; // list of files with merge conflicts
}

export interface GitCommandResult {
  output: string;
  success: boolean;
  error?: string;
  newState?: GitRepoState;
}

export type ScenarioTier = 'beginner' | 'intermediate' | 'advanced' | 'sandbox';

export interface GitScenario {
  id: string;
  title: string;
  tier: ScenarioTier;
  description: string;
  objective: string;
  hints: string[];
  initialState: () => GitRepoState;
  validate: (state: GitRepoState, commandHistory: string[]) => boolean;
  rewardXp: number;
}
