import { useState, useEffect, useCallback } from 'react'
import { WorktreeInfo, IdeOption } from './types'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import WorktreeGrid from './components/WorktreeGrid'
import StatusBar from './components/StatusBar'
import NewWorktreeModal from './components/NewWorktreeModal'
import './styles/App.css'

const api = window.groveAPI

function App() {
  const [repos, setRepos] = useState<string[]>([])
  const [activeRepo, setActiveRepo] = useState<string | null>(null)
  const [worktrees, setWorktrees] = useState<WorktreeInfo[]>([])
  const [ides, setIdes] = useState<IdeOption[]>([])
  const [selectedIde, setSelectedIde] = useState<IdeOption | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [showNewModal, setShowNewModal] = useState(false)

  // Load saved repos and IDEs on mount
  useEffect(() => {
    api.getSavedRepos().then((saved) => {
      if (saved.length > 0) {
        setRepos(saved)
        setActiveRepo(saved[0])
      }
    })
    api.getSavedIdes().then((saved) => {
      if (saved.length > 0) {
        setIdes(saved)
        setSelectedIde(saved[0])
      }
    })
  }, [])

  // Load worktrees when active repo changes
  const loadWorktrees = useCallback(async () => {
    if (!activeRepo) return
    setLoading(true)
    try {
      const wts = await api.getWorktrees(activeRepo)
      setWorktrees(wts)
    } catch (e) {
      console.error('Failed to load worktrees:', e)
    } finally {
      setLoading(false)
    }
  }, [activeRepo])

  useEffect(() => {
    loadWorktrees()
  }, [loadWorktrees])

  const handleAddRepo = async () => {
    const dir = await api.selectDirectory()
    if (dir && !repos.includes(dir)) {
      const newRepos = [...repos, dir]
      setRepos(newRepos)
      setActiveRepo(dir)
      await api.saveRepos(newRepos)
    }
  }

  const handleRemoveRepo = async (repoPath: string) => {
    const newRepos = repos.filter((r) => r !== repoPath)
    setRepos(newRepos)
    if (activeRepo === repoPath) {
      setActiveRepo(null)
      setWorktrees([])
    }
    await api.saveRepos(newRepos)
  }

  const handleAddIde = async (ide: IdeOption) => {
    const check = await api.checkIdeCommand(ide.cmd, ide.appName)
    if (!check.found) {
      return { success: false, error: `${ide.name} not found. Install it or ensure its CLI is in your PATH.` }
    }
    const newIdes = [...ides, ide]
    setIdes(newIdes)
    if (!selectedIde) setSelectedIde(ide)
    await api.saveIdes(newIdes)
    return { success: true }
  }

  const handleRemoveIde = async (ideId: string) => {
    const newIdes = ides.filter((i) => i.id !== ideId)
    setIdes(newIdes)
    if (selectedIde?.id === ideId) {
      setSelectedIde(newIdes[0] || null)
    }
    await api.saveIdes(newIdes)
  }

  const handleLaunch = async (worktreePath: string) => {
    if (!selectedIde) return
    await api.openInIde(selectedIde.cmd, worktreePath, selectedIde.appName)
  }

  const handleOpenTerminal = async (worktreePath: string) => {
    await api.openTerminal(worktreePath)
  }

  const handleRemoveWorktree = async (worktreePath: string) => {
    if (!activeRepo) return
    const result = await api.removeWorktree(activeRepo, worktreePath)
    if (result.success) {
      loadWorktrees()
    }
  }

  const handleCreateWorktree = async (branchName: string, baseBranch?: string) => {
    if (!activeRepo) return { success: false, error: 'No active repository' }
    const result = await api.createWorktree(activeRepo, branchName, baseBranch)
    if (result.success) {
      loadWorktrees()
    }
    return result
  }

  const filteredWorktrees = worktrees.filter((wt) =>
    wt.branch.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activeRepoName = activeRepo ? activeRepo.split('/').pop() || '' : ''

  return (
    <div className="app">
      <div className="app-bg" />
      <Sidebar
        repos={repos}
        activeRepo={activeRepo}
        worktreeCounts={repos.reduce((acc, r) => {
          acc[r] = r === activeRepo ? worktrees.length : 0
          return acc
        }, {} as Record<string, number>)}
        onSelectRepo={setActiveRepo}
        onAddRepo={handleAddRepo}
        onRemoveRepo={handleRemoveRepo}
      />
      <main className="main">
        <TopBar
          repoName={activeRepoName}
          repoPath={activeRepo || ''}
          worktreeCount={worktrees.length}
          ides={ides}
          selectedIde={selectedIde}
          onSelectIde={setSelectedIde}
          onAddIde={handleAddIde}
          onRemoveIde={handleRemoveIde}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        <WorktreeGrid
          worktrees={filteredWorktrees}
          loading={loading}
          selectedIde={selectedIde}
          onLaunch={handleLaunch}
          onOpenTerminal={handleOpenTerminal}
          onRemoveWorktree={handleRemoveWorktree}
          onNewWorktree={() => setShowNewModal(true)}
          onRefresh={loadWorktrees}
        />
        <StatusBar
          worktreeCount={worktrees.length}
          connected={!!activeRepo}
        />
      </main>
      {showNewModal && activeRepo && (
        <NewWorktreeModal
          repoPath={activeRepo}
          existingWorktrees={worktrees}
          selectedIde={selectedIde}
          onClose={() => setShowNewModal(false)}
          onCreate={handleCreateWorktree}
          onLaunch={handleLaunch}
        />
      )}
    </div>
  )
}

export default App
