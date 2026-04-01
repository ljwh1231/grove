import { useState } from 'react'
import './Sidebar.css'

interface SidebarProps {
  repos: string[]
  activeRepo: string | null
  worktreeCounts: Record<string, number>
  onSelectRepo: (path: string) => void
  onAddRepo: () => void
  onRemoveRepo: (path: string) => void
}

function getRepoEmoji(name: string): string {
  const emojiMap: Record<string, string> = {
    api: '📦', server: '📦', backend: '📦',
    web: '🌐', frontend: '🎨', design: '🎨', ui: '🎨',
    infra: '⚡', ops: '⚡', deploy: '⚡',
    docs: '📚', lib: '📚',
    mobile: '📱', app: '📱',
  }
  const lower = name.toLowerCase()
  for (const [key, emoji] of Object.entries(emojiMap)) {
    if (lower.includes(key)) return emoji
  }
  return '🌿'
}

export default function Sidebar({ repos, activeRepo, worktreeCounts, onSelectRepo, onAddRepo, onRemoveRepo }: SidebarProps) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; repo: string } | null>(null)

  const handleContextMenu = (e: React.MouseEvent, repo: string) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, repo })
  }

  return (
    <aside className="sidebar" onClick={() => setContextMenu(null)}>
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon">
            <svg viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="8" r="6" fill="rgba(143, 184, 122, 0.3)" stroke="rgba(143, 184, 122, 0.6)" strokeWidth="1"/>
              <circle cx="9" cy="12" r="4.5" fill="rgba(107, 143, 94, 0.3)" stroke="rgba(107, 143, 94, 0.5)" strokeWidth="1"/>
              <circle cx="19" cy="12" r="4.5" fill="rgba(107, 143, 94, 0.3)" stroke="rgba(107, 143, 94, 0.5)" strokeWidth="1"/>
              <rect x="13" y="14" width="2" height="10" rx="1" fill="rgba(143, 184, 122, 0.5)"/>
              <line x1="14" y1="18" x2="10" y2="22" stroke="rgba(107, 143, 94, 0.4)" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="14" y1="16" x2="18" y2="20" stroke="rgba(107, 143, 94, 0.4)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="logo-text">Grove</span>
        </div>
        <div className="logo-subtitle">Worktree Launcher</div>
      </div>

      <div className="repo-section">
        <div className="section-label">Repositories</div>
        {repos.length === 0 && (
          <div className="empty-repos">
            <p>No repositories added yet.</p>
            <p>Click below to add one.</p>
          </div>
        )}
        {repos.map((repo) => {
          const name = repo.split('/').pop() || repo
          const shortPath = repo.replace(/^\/Users\/[^/]+/, '~')
          const isActive = repo === activeRepo
          return (
            <div
              key={repo}
              className={`repo-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelectRepo(repo)}
              onContextMenu={(e) => handleContextMenu(e, repo)}
            >
              <div className="repo-icon">{getRepoEmoji(name)}</div>
              <div className="repo-info">
                <div className="repo-name">{name}</div>
                <div className="repo-path">{shortPath}</div>
              </div>
              {worktreeCounts[repo] > 0 && (
                <div className="repo-badge">{worktreeCounts[repo]}</div>
              )}
            </div>
          )
        })}
      </div>

      <div className="sidebar-footer">
        <button className="add-repo-btn" onClick={onAddRepo}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="8" y1="3" x2="8" y2="13"/>
            <line x1="3" y1="8" x2="13" y2="8"/>
          </svg>
          Add Repository
        </button>
      </div>

      {contextMenu && (
        <div
          className="context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button onClick={() => { onRemoveRepo(contextMenu.repo); setContextMenu(null) }}>
            Remove Repository
          </button>
        </div>
      )}
    </aside>
  )
}
