import './StatusBar.css'

interface StatusBarProps {
  worktreeCount: number
  connected: boolean
}

export default function StatusBar({ worktreeCount, connected }: StatusBarProps) {
  return (
    <div className="statusbar">
      <div className="statusbar-left">
        <div className="status-item">
          <div className={`status-dot ${connected ? '' : 'disconnected'}`} />
          {connected ? 'git connected' : 'no repository'}
        </div>
        {worktreeCount > 0 && (
          <div className="status-item">{worktreeCount} worktrees active</div>
        )}
      </div>
      <div className="statusbar-right">
        <div className="status-item">v0.1.0</div>
      </div>
    </div>
  )
}
