import { useState, useRef, useEffect } from 'react'
import { IdeOption, KNOWN_IDES } from '../types'
import './TopBar.css'

interface TopBarProps {
  repoName: string
  repoPath: string
  worktreeCount: number
  ides: IdeOption[]
  selectedIde: IdeOption | null
  onSelectIde: (ide: IdeOption) => void
  onAddIde: (ide: IdeOption) => Promise<{ success: boolean; error?: string }>
  onRemoveIde: (ideId: string) => void
  searchQuery: string
  onSearchChange: (q: string) => void
}

export default function TopBar({
  repoName,
  repoPath,
  worktreeCount,
  ides,
  selectedIde,
  onSelectIde,
  onAddIde,
  onRemoveIde,
  searchQuery,
  onSearchChange,
}: TopBarProps) {
  const [showIdeDropdown, setShowIdeDropdown] = useState(false)
  const [showAddIde, setShowAddIde] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [customCmd, setCustomCmd] = useState('')
  const [customName, setCustomName] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowIdeDropdown(false)
        setShowAddIde(false)
        setAddError(null)
        setShowCustom(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  const shortPath = repoPath.replace(/^\/Users\/[^/]+/, '~')

  const addedIds = new Set(ides.map((i) => i.id))
  const availableToAdd = KNOWN_IDES.filter((i) => !addedIds.has(i.id))

  const handleAddKnownIde = async (ide: IdeOption) => {
    setAdding(true)
    setAddError(null)
    const result = await onAddIde(ide)
    setAdding(false)
    if (result.success) {
      setShowAddIde(false)
      setAddError(null)
    } else {
      setAddError(result.error || 'Failed to add IDE')
    }
  }

  const handleAddCustomIde = async () => {
    if (!customCmd || !customName) return
    setAdding(true)
    setAddError(null)
    const ide: IdeOption = {
      id: `custom-${customCmd}`,
      name: customName,
      cmd: customCmd,
      color: '#6b7d62',
      label: customName.slice(0, 2).toUpperCase(),
    }
    const result = await onAddIde(ide)
    setAdding(false)
    if (result.success) {
      setShowAddIde(false)
      setShowCustom(false)
      setCustomCmd('')
      setCustomName('')
      setAddError(null)
    } else {
      setAddError(result.error || 'Failed to add IDE')
    }
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1 className="repo-title">{repoName || 'Grove'}</h1>
        {repoName && (
          <div className="repo-meta">
            <span>{shortPath}</span>
            <span className="meta-dot" />
            <span>{worktreeCount} worktrees</span>
          </div>
        )}
      </div>
      <div className="topbar-right">
        <div className="search-bar">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="6.5" cy="6.5" r="4.5"/>
            <line x1="10" y1="10" x2="14" y2="14"/>
          </svg>
          <input
            ref={searchRef}
            type="text"
            placeholder="Search branches..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <span className="search-shortcut">⌘K</span>
        </div>

        <div className="ide-selector-wrapper" ref={dropdownRef}>
          {selectedIde ? (
            <button
              className="ide-selector"
              onClick={() => { setShowIdeDropdown(!showIdeDropdown); setShowAddIde(false); setAddError(null) }}
            >
              <div className="ide-icon" style={{ background: selectedIde.color }}>
                {selectedIde.label}
              </div>
              <span className="ide-label">{selectedIde.name}</span>
              <svg className="ide-chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polyline points="4,6 8,10 12,6"/>
              </svg>
            </button>
          ) : (
            <button
              className="ide-selector ide-selector-empty"
              onClick={() => { setShowAddIde(true); setShowIdeDropdown(false) }}
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 14, height: 14 }}>
                <line x1="8" y1="3" x2="8" y2="13"/>
                <line x1="3" y1="8" x2="13" y2="8"/>
              </svg>
              <span className="ide-label">Add IDE</span>
            </button>
          )}

          {/* Main IDE dropdown */}
          {showIdeDropdown && ides.length > 0 && (
            <div className="ide-dropdown">
              {ides.map((ide) => (
                <div key={ide.id} className="ide-option-row">
                  <button
                    className={`ide-option ${selectedIde?.id === ide.id ? 'selected' : ''}`}
                    onClick={() => { onSelectIde(ide); setShowIdeDropdown(false) }}
                  >
                    <div className="ide-option-icon" style={{ background: ide.color }}>
                      {ide.label}
                    </div>
                    {ide.name}
                    {selectedIde?.id === ide.id && (
                      <svg className="check" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3,8 6,11 13,4"/>
                      </svg>
                    )}
                  </button>
                  <button
                    className="ide-remove-btn"
                    title={`Remove ${ide.name}`}
                    onClick={(e) => { e.stopPropagation(); onRemoveIde(ide.id) }}
                  >
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <line x1="5" y1="5" x2="11" y2="11"/>
                      <line x1="11" y1="5" x2="5" y2="11"/>
                    </svg>
                  </button>
                </div>
              ))}
              <div className="ide-dropdown-divider" />
              <button
                className="ide-option ide-add-option"
                onClick={() => { setShowAddIde(true); setShowIdeDropdown(false) }}
              >
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 16, height: 16 }}>
                  <line x1="8" y1="3" x2="8" y2="13"/>
                  <line x1="3" y1="8" x2="13" y2="8"/>
                </svg>
                Add IDE
              </button>
            </div>
          )}

          {/* Add IDE panel */}
          {showAddIde && (
            <div className="ide-dropdown ide-add-panel">
              <div className="ide-add-header">Add IDE</div>

              {!showCustom ? (
                <>
                  {availableToAdd.length > 0 && (
                    <>
                      {availableToAdd.map((ide) => (
                        <button
                          key={ide.id}
                          className="ide-option"
                          onClick={() => handleAddKnownIde(ide)}
                          disabled={adding}
                        >
                          <div className="ide-option-icon" style={{ background: ide.color }}>
                            {ide.label}
                          </div>
                          {ide.name}
                          <span className="ide-cmd-hint">{ide.cmd}</span>
                        </button>
                      ))}
                      <div className="ide-dropdown-divider" />
                    </>
                  )}
                  <button
                    className="ide-option ide-add-option"
                    onClick={() => { setShowCustom(true); setAddError(null) }}
                  >
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 16, height: 16 }}>
                      <rect x="1.5" y="2.5" width="13" height="11" rx="2"/>
                      <polyline points="4.5,7 6.5,9 4.5,11"/>
                      <line x1="8" y1="11" x2="11.5" y2="11"/>
                    </svg>
                    Custom command...
                  </button>
                </>
              ) : (
                <div className="ide-custom-form">
                  <input
                    type="text"
                    placeholder="Display name (e.g. Sublime Text)"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    autoFocus
                  />
                  <input
                    type="text"
                    placeholder="Command (e.g. subl)"
                    value={customCmd}
                    onChange={(e) => setCustomCmd(e.target.value)}
                  />
                  <div className="ide-custom-actions">
                    <button className="btn-secondary-sm" onClick={() => { setShowCustom(false); setAddError(null) }}>
                      Back
                    </button>
                    <button
                      className="btn-primary-sm"
                      onClick={handleAddCustomIde}
                      disabled={!customCmd || !customName || adding}
                    >
                      {adding ? 'Checking...' : 'Add'}
                    </button>
                  </div>
                </div>
              )}

              {addError && (
                <div className="ide-add-error">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="8" cy="8" r="6"/>
                    <line x1="8" y1="5" x2="8" y2="9"/>
                    <circle cx="8" cy="11.5" r="0.5" fill="currentColor"/>
                  </svg>
                  {addError}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
