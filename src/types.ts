export interface WorktreeInfo {
  path: string
  branch: string
  commitHash: string
  commitMessage: string
  commitAuthor: string
  commitDate: string
  isMainWorktree: boolean
  isCurrent: boolean
}

export interface IdeOption {
  id: string
  name: string
  cmd: string
  color: string
  label: string
  appName?: string // macOS .app bundle name (e.g. "GoLand" for GoLand.app)
}

export const KNOWN_IDES: IdeOption[] = [
  { id: 'vscode', name: 'VS Code', cmd: 'code', color: '#007ACC', label: 'VS', appName: 'Visual Studio Code' },
  { id: 'cursor', name: 'Cursor', cmd: 'cursor', color: '#1EAEDB', label: 'Cu', appName: 'Cursor' },
  { id: 'intellij', name: 'IntelliJ IDEA', cmd: 'idea', color: '#087CFA', label: 'IJ', appName: 'IntelliJ IDEA' },
  { id: 'goland', name: 'GoLand', cmd: 'goland', color: '#21D789', label: 'GL', appName: 'GoLand' },
  { id: 'webstorm', name: 'WebStorm', cmd: 'webstorm', color: '#00CDD7', label: 'WS', appName: 'WebStorm' },
  { id: 'zed', name: 'Zed', cmd: 'zed', color: '#084CCF', label: 'Ze', appName: 'Zed' },
  { id: 'vim', name: 'Vim / Neovim', cmd: 'nvim', color: '#888', label: 'VI' },
]

export interface RepoConfig {
  copyFiles: string[]            // paths relative to repo root to copy into new worktree
  postCreateCommands: string[]   // shell commands to run in new worktree after creation
}

export const DEFAULT_REPO_CONFIG: RepoConfig = {
  copyFiles: [],
  postCreateCommands: [],
}

export interface CreateWorktreeProgress {
  step: 'git' | 'copy' | 'commands' | 'done'
  message: string
  error?: string
}

export interface GroveAPI {
  getWorktrees: (repoPath: string) => Promise<WorktreeInfo[]>
  openInIde: (ideCmd: string, worktreePath: string, appName?: string) => Promise<{ success: boolean; error?: string }>
  openTerminal: (worktreePath: string) => Promise<{ success: boolean; error?: string }>
  createWorktree: (repoPath: string, branchName: string, baseBranch?: string) => Promise<{ success: boolean; path?: string; error?: string }>
  removeWorktree: (repoPath: string, worktreePath: string) => Promise<{ success: boolean; error?: string }>
  getBranches: (repoPath: string) => Promise<string[]>
  selectDirectory: () => Promise<string | null>
  getSavedRepos: () => Promise<string[]>
  saveRepos: (repos: string[]) => Promise<void>
  checkIdeCommand: (cmd: string, appName?: string) => Promise<{ found: boolean; path?: string }>
  getSavedIdes: () => Promise<IdeOption[]>
  saveIdes: (ides: IdeOption[]) => Promise<void>
  getRepoConfig: (repoPath: string) => Promise<RepoConfig>
  saveRepoConfig: (repoPath: string, config: RepoConfig) => Promise<void>
  pickFileFromRepo: (repoPath: string) => Promise<string | null>
  listRepoFiles: (repoPath: string, pattern?: string) => Promise<string[]>
}

declare global {
  interface Window {
    groveAPI: GroveAPI
  }
}
