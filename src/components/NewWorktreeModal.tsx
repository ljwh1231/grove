import { useState, useEffect, useMemo } from 'react'
import { WorktreeInfo, IdeOption } from '../types'
import './NewWorktreeModal.css'

interface NewWorktreeModalProps {
  repoPath: string
  existingWorktrees: WorktreeInfo[]
  selectedIde: IdeOption | null
  onClose: () => void
  onCreate: (branchName: string, baseBranch?: string) => Promise<{ success: boolean; path?: string; error?: string }>
  onLaunch: (path: string) => void
}

export default function NewWorktreeModal({
  repoPath,
  existingWorktrees,
  selectedIde,
  onClose,
  onCreate,
  onLaunch,
}: NewWorktreeModalProps) {
  const [branchName, setBranchName] = useState('')
  const [baseBranch, setBaseBranch] = useState('')
  const [branches, setBranches] = useState<string[]>([])
  const [isNewBranch, setIsNewBranch] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdPath, setCreatedPath] = useState<string | null>(null)
  const [branchFilter, setBranchFilter] = useState('')

  const usedBranches = useMemo(
    () => new Set(existingWorktrees.map((wt) => wt.branch)),
    [existingWorktrees]
  )

  useEffect(() => {
    window.groveAPI.getBranches(repoPath).then(setBranches)
  }, [repoPath])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const availableBranches = useMemo(() => {
    return branches.filter((b) => {
      if (usedBranches.has(b)) return false
      if (branchFilter) return b.toLowerCase().includes(branchFilter.toLowerCase())
      return true
    })
  }, [branches, usedBranches, branchFilter])

  const allBranchesForBase = useMemo(() => {
    return branches.filter((b) => !b.startsWith('origin/'))
  }, [branches])

  const repoName = repoPath.split('/').pop() || ''
  const parentDir = repoPath.substring(0, repoPath.lastIndexOf('/'))

  const previewPath = useMemo(() => {
    if (!branchName) return null
    const safeBranch = branchName.replace(/\//g, '-')
    return `${parentDir}/${repoName}-${safeBranch}`
  }, [branchName, parentDir, repoName])

  const branchNameError = useMemo(() => {
    if (!branchName) return null
    if (isNewBranch && usedBranches.has(branchName)) return 'This branch already has a worktree'
    if (isNewBranch && branches.includes(branchName)) return 'This branch already exists — switch to "Existing Branch" tab'
    if (isNewBranch && /[~^:\\\s\[\]?*]/.test(branchName)) return 'Invalid characters in branch name'
    if (isNewBranch && branchName.startsWith('-')) return 'Branch name cannot start with -'
    if (isNewBranch && branchName.endsWith('.')) return 'Branch name cannot end with .'
    if (isNewBranch && branchName.includes('..')) return 'Branch name cannot contain ..'
    return null
  }, [branchName, isNewBranch, usedBranches, branches])

  const canSubmit = branchName && !branchNameError && !creating && !createdPath

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    setCreating(true)
    setError(null)

    const result = await onCreate(branchName, isNewBranch && baseBranch ? baseBranch : undefined)

    setCreating(false)

    if (result.success) {
      setCreatedPath(result.path || null)
    } else {
      setError(result.error || 'Failed to create worktree')
    }
  }

  const handleOpenAndClose = () => {
    if (createdPath) {
      onLaunch(createdPath)
    }
    onClose()
  }

  // Success state
  if (createdPath) {
    const shortPath = createdPath.replace(/^\/Users\/[^/]+/, '~')
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Worktree Created</h2>
            <button className="modal-close" onClick={onClose}>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="4" y1="4" x2="12" y2="12"/>
                <line x1="12" y1="4" x2="4" y2="12"/>
              </svg>
            </button>
          </div>
          <div className="modal-body">
            <div className="success-state">
              <div className="success-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="8,12 11,15 16,9"/>
                </svg>
              </div>
              <div className="success-text">
                <strong>{branchName}</strong> worktree is ready
              </div>
              <div className="success-path">{shortPath}</div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Close</button>
            <button type="button" className="btn-primary" onClick={handleOpenAndClose}>
              <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 12, height: 12 }}>
                <polygon points="5,3 13,8 5,13"/>
              </svg>
              Open in {selectedIde?.name || 'IDE'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>New Worktree</h2>
          <span className="modal-repo-badge">{repoName}</span>
          <button className="modal-close" onClick={onClose}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="4" y1="4" x2="12" y2="12"/>
              <line x1="12" y1="4" x2="4" y2="12"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="toggle-row">
              <button
                type="button"
                className={`toggle-btn ${!isNewBranch ? 'active' : ''}`}
                onClick={() => { setIsNewBranch(false); setBranchName(''); setError(null) }}
              >
                Existing Branch
              </button>
              <button
                type="button"
                className={`toggle-btn ${isNewBranch ? 'active' : ''}`}
                onClick={() => { setIsNewBranch(true); setBranchName(''); setError(null) }}
              >
                New Branch
              </button>
            </div>

            {isNewBranch ? (
              <>
                <div className="form-group">
                  <label>New Branch Name</label>
                  <input
                    type="text"
                    placeholder="feature/my-feature"
                    value={branchName}
                    onChange={(e) => { setBranchName(e.target.value); setError(null) }}
                    autoFocus
                    className={branchNameError ? 'input-error' : ''}
                  />
                  {branchNameError && <span className="field-error">{branchNameError}</span>}
                </div>
                <div className="form-group">
                  <label>Base Branch</label>
                  <select value={baseBranch} onChange={(e) => setBaseBranch(e.target.value)}>
                    <option value="">HEAD (current)</option>
                    {allBranchesForBase.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <div className="form-group">
                <label>Branch</label>
                <div className="branch-select-wrapper">
                  <input
                    type="text"
                    placeholder="Filter branches..."
                    value={branchFilter}
                    onChange={(e) => setBranchFilter(e.target.value)}
                    className="branch-filter-input"
                  />
                  <div className="branch-list">
                    {availableBranches.length === 0 ? (
                      <div className="branch-list-empty">
                        {branchFilter ? 'No matching branches' : 'All branches already have worktrees'}
                      </div>
                    ) : (
                      availableBranches.map((b) => (
                        <button
                          key={b}
                          type="button"
                          className={`branch-list-item ${branchName === b ? 'selected' : ''}`}
                          onClick={() => { setBranchName(b); setError(null) }}
                        >
                          <div className="branch-list-indicator" />
                          <span className="branch-list-name">{b}</span>
                          {b.startsWith('origin/') && <span className="branch-list-remote">remote</span>}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {previewPath && !branchNameError && (
              <div className="path-preview">
                <label>Worktree Path</label>
                <div className="path-preview-value">
                  {previewPath.replace(/^\/Users\/[^/]+/, '~')}
                </div>
              </div>
            )}

            {error && (
              <div className="error-banner">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="8" cy="8" r="6"/>
                  <line x1="8" y1="5" x2="8" y2="9"/>
                  <circle cx="8" cy="11.5" r="0.5" fill="currentColor"/>
                </svg>
                {error}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={creating}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={!canSubmit}>
              {creating ? (
                <>
                  <span className="btn-spinner" />
                  Creating...
                </>
              ) : (
                'Create Worktree'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
