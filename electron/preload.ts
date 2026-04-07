import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('groveAPI', {
  getWorktrees: (repoPath: string) => ipcRenderer.invoke('get-worktrees', repoPath),
  openInIde: (ideCmd: string, worktreePath: string, appName?: string) => ipcRenderer.invoke('open-in-ide', ideCmd, worktreePath, appName),
  openTerminal: (worktreePath: string) => ipcRenderer.invoke('open-terminal', worktreePath),
  createWorktree: (repoPath: string, branchName: string, baseBranch?: string) =>
    ipcRenderer.invoke('create-worktree', repoPath, branchName, baseBranch),
  removeWorktree: (repoPath: string, worktreePath: string) =>
    ipcRenderer.invoke('remove-worktree', repoPath, worktreePath),
  getBranches: (repoPath: string) => ipcRenderer.invoke('get-branches', repoPath),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  getSavedRepos: () => ipcRenderer.invoke('get-saved-repos'),
  saveRepos: (repos: string[]) => ipcRenderer.invoke('save-repos', repos),
  checkIdeCommand: (cmd: string, appName?: string) => ipcRenderer.invoke('check-ide-command', cmd, appName),
  getSavedIdes: () => ipcRenderer.invoke('get-saved-ides'),
  saveIdes: (ides: any[]) => ipcRenderer.invoke('save-ides', ides),
  getRepoConfig: (repoPath: string) => ipcRenderer.invoke('get-repo-config', repoPath),
  saveRepoConfig: (repoPath: string, config: any) => ipcRenderer.invoke('save-repo-config', repoPath, config),
  pickFileFromRepo: (repoPath: string) => ipcRenderer.invoke('pick-file-from-repo', repoPath),
  listRepoFiles: (repoPath: string, pattern?: string) => ipcRenderer.invoke('list-repo-files', repoPath, pattern),
})
