import { useState } from 'react'
import { WorktreeInfo, IdeOption } from '../types'
import './WorktreeCard.css'

interface WorktreeCardProps {
  worktree: WorktreeInfo
  selectedIde: IdeOption | null
  onLaunch: (path: string) => void
  onOpenTerminal: (path: string) => void
  onRemove: (path: string) => void
  index: number
  viewMode: 'grid' | 'list'
}

function getBranchType(branch: string): { tag: string; className: string; color: string } {
  const lower = branch.toLowerCase()
  if (lower === 'main' || lower === 'master') return { tag: 'default', className: 'tag-default', color: 'var(--green-mid)' }
  if (lower === 'develop' || lower === 'dev') return { tag: 'integration', className: 'tag-default', color: 'var(--green-mid)' }
  if (lower.startsWith('feature/') || lower.startsWith('feat/')) return { tag: 'feature', className: 'tag-feature', color: 'var(--amber)' }
  if (lower.startsWith('fix/') || lower.startsWith('bugfix/') || lower.startsWith('hotfix/')) return { tag: 'bugfix', className: 'tag-fix', color: '#d49a9a' }
  if (lower.startsWith('experiment/') || lower.startsWith('exp/')) return { tag: 'experiment', className: 'tag-feature', color: '#9a8fd4' }
  if (lower.startsWith('release/')) return { tag: 'release', className: 'tag-default', color: 'var(--green-bright)' }
  return { tag: 'branch', className: 'tag-default', color: 'var(--green-mid)' }
}

export default function WorktreeCard({
  worktree,
  selectedIde,
  onLaunch,
  onOpenTerminal,
  onRemove,
  index,
  viewMode,
}: WorktreeCardProps) {
  const [launching, setLaunching] = useState(false)
  const [showMore, setShowMore] = useState(false)
  const branchType = getBranchType(worktree.branch)
  const shortPath = worktree.path.replace(/^\/Users\/[^/]+/, '~')
  const isMain = worktree.branch === 'main' || worktree.branch === 'master'

  const handleLaunch = async () => {
    setLaunching(true)
    onLaunch(worktree.path)
    setTimeout(() => setLaunching(false), 2000)
  }

  if (viewMode === 'list') {
    return (
      <div
        className={`worktree-list-item ${isMain ? 'main-branch' : ''}`}
        style={{ animationDelay: `${0.15 + index * 0.04}s` }}
      >
        <div className="list-branch-indicator" style={{ background: branchType.color }}>
          {worktree.isMainWorktree && <span className="pulse-ring" />}
        </div>
        <div className="list-branch-name">{worktree.branch}</div>
        <div className="list-path">{shortPath}</div>
        <div className="list-commit">
          <span className="commit-hash">{worktree.commitHash}</span>
        </div>
        <div className="list-time">{worktree.commitDate}</div>
        <span className={`tag ${branchType.className}`}>{branchType.tag}</span>
        <button className="launch-btn compact" onClick={handleLaunch}>
          {launching ? 'Opening...' : `Open`}
        </button>
      </div>
    )
  }

  return (
    <div
      className={`worktree-card ${isMain ? 'main-branch' : ''}`}
      style={{ animationDelay: `${0.25 + index * 0.05}s` }}
      onDoubleClick={handleLaunch}
    >
      <div className="card-header">
        <div className="branch-info">
          <div className="branch-indicator" style={{ background: branchType.color }}>
            {worktree.isMainWorktree && <span className="pulse-ring" />}
          </div>
          <div className="branch-name">{worktree.branch}</div>
        </div>
        <div className="card-actions">
          <button className="card-action-btn" title="Open Terminal" onClick={() => onOpenTerminal(worktree.path)}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="1.5" y="2.5" width="13" height="11" rx="2"/>
              <polyline points="4.5,7 6.5,9 4.5,11"/>
              <line x1="8" y1="11" x2="11.5" y2="11"/>
            </svg>
          </button>
          <div className="more-wrapper">
            <button
              className="card-action-btn"
              title="More"
              onClick={() => setShowMore(!showMore)}
            >
              <svg viewBox="0 0 16 16" fill="currentColor">
                <circle cx="4" cy="8" r="1.2"/>
                <circle cx="8" cy="8" r="1.2"/>
                <circle cx="12" cy="8" r="1.2"/>
              </svg>
            </button>
            {showMore && (
              <div className="more-dropdown">
                <button onClick={() => { onRemove(worktree.path); setShowMore(false) }}>
                  Remove Worktree
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card-path">{shortPath}</div>

      <div className="card-details">
        <div className="detail-item">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="8" cy="8" r="6"/>
            <polyline points="8,4.5 8,8 11,10"/>
          </svg>
          {worktree.commitDate}
        </div>
        <div className="detail-item">
          <span className="commit-hash">{worktree.commitHash}</span>
        </div>
        <div className="detail-item">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="8" cy="5" r="3"/>
            <path d="M2,14 C2,10.7 4.7,8 8,8 C11.3,8 14,10.7 14,14"/>
          </svg>
          {worktree.commitAuthor}
        </div>
      </div>

      <div className="card-footer">
        <div className="card-tags">
          <span className={`tag ${branchType.className}`}>{branchType.tag}</span>
        </div>
        <button className="launch-btn" onClick={handleLaunch}>
          {launching ? (
            'Launched!'
          ) : (
            <>
              <svg viewBox="0 0 16 16" fill="currentColor">
                <polygon points="5,3 13,8 5,13"/>
              </svg>
              Open in {selectedIde?.name || 'IDE'}
            </>
          )}
        </button>
      </div>
    </div>
  )
}
