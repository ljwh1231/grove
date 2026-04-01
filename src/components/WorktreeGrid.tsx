import { useState } from 'react'
import { WorktreeInfo, IdeOption } from '../types'
import WorktreeCard from './WorktreeCard'
import './WorktreeGrid.css'

interface WorktreeGridProps {
  worktrees: WorktreeInfo[]
  loading: boolean
  selectedIde: IdeOption | null
  onLaunch: (path: string) => void
  onOpenTerminal: (path: string) => void
  onRemoveWorktree: (path: string) => void
  onNewWorktree: () => void
  onRefresh: () => void
}

export default function WorktreeGrid({
  worktrees,
  loading,
  selectedIde,
  onLaunch,
  onOpenTerminal,
  onRemoveWorktree,
  onNewWorktree,
  onRefresh,
}: WorktreeGridProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  return (
    <div className="content-area">
      <div className="content-header">
        <div className="worktree-count">
          <span>{worktrees.length}</span> worktrees
          <button className="refresh-btn" onClick={onRefresh} title="Refresh">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className={loading ? 'spinning' : ''}>
              <path d="M2 8a6 6 0 0 1 10.5-4M14 8a6 6 0 0 1-10.5 4"/>
              <polyline points="2,3 2,7 6,7"/>
              <polyline points="14,13 14,9 10,9"/>
            </svg>
          </button>
        </div>
        <div className="view-toggle">
          <button
            className={viewMode === 'grid' ? 'active' : ''}
            onClick={() => setViewMode('grid')}
            title="Grid view"
          >
            <svg viewBox="0 0 16 16" fill="currentColor">
              <rect x="1" y="1" width="6" height="6" rx="1"/>
              <rect x="9" y="1" width="6" height="6" rx="1"/>
              <rect x="1" y="9" width="6" height="6" rx="1"/>
              <rect x="9" y="9" width="6" height="6" rx="1"/>
            </svg>
          </button>
          <button
            className={viewMode === 'list' ? 'active' : ''}
            onClick={() => setViewMode('list')}
            title="List view"
          >
            <svg viewBox="0 0 16 16" fill="currentColor">
              <rect x="1" y="2" width="14" height="2.5" rx="1"/>
              <rect x="1" y="6.75" width="14" height="2.5" rx="1"/>
              <rect x="1" y="11.5" width="14" height="2.5" rx="1"/>
            </svg>
          </button>
        </div>
      </div>

      {loading && worktrees.length === 0 ? (
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>Loading worktrees...</p>
        </div>
      ) : worktrees.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🌱</div>
          <h3>No worktrees found</h3>
          <p>Add a repository from the sidebar to get started.</p>
        </div>
      ) : (
        <div className={`worktree-${viewMode}`}>
          {worktrees.map((wt, i) => (
            <WorktreeCard
              key={wt.path}
              worktree={wt}
              selectedIde={selectedIde}
              onLaunch={onLaunch}
              onOpenTerminal={onOpenTerminal}
              onRemove={onRemoveWorktree}
              index={i}
              viewMode={viewMode}
            />
          ))}
          <button className="worktree-card new-card" onClick={onNewWorktree}>
            <div className="new-card-icon">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="10" y1="4" x2="10" y2="16"/>
                <line x1="4" y1="10" x2="16" y2="10"/>
              </svg>
            </div>
            <div className="new-card-text">New Worktree</div>
            <div className="new-card-sub">Create from branch or commit</div>
          </button>
        </div>
      )}
    </div>
  )
}
