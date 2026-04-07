import { useState, useEffect, useRef } from 'react'
import { RepoConfig, DEFAULT_REPO_CONFIG } from '../types'
import './RepoSettingsModal.css'

interface RepoSettingsModalProps {
  repoPath: string
  onClose: () => void
}

export default function RepoSettingsModal({ repoPath, onClose }: RepoSettingsModalProps) {
  const [config, setConfig] = useState<RepoConfig>(DEFAULT_REPO_CONFIG)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newFile, setNewFile] = useState('')
  const [fileSuggestions, setFileSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [newCommand, setNewCommand] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const repoName = repoPath.split('/').pop() || ''

  useEffect(() => {
    window.groveAPI.getRepoConfig(repoPath).then((c) => {
      setConfig(c)
      setLoaded(true)
    })
  }, [repoPath])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  // Fetch suggestions when typing
  useEffect(() => {
    if (!newFile) {
      setFileSuggestions([])
      return
    }
    let cancelled = false
    window.groveAPI.listRepoFiles(repoPath, newFile).then((files) => {
      if (!cancelled) setFileSuggestions(files.slice(0, 8))
    })
    return () => { cancelled = true }
  }, [newFile, repoPath])

  const handleSave = async () => {
    setSaving(true)
    await window.groveAPI.saveRepoConfig(repoPath, config)
    setSaving(false)
    onClose()
  }

  const handleAddFile = (filePath?: string) => {
    const value = (filePath ?? newFile).trim()
    if (!value) return
    if (config.copyFiles.includes(value)) return
    setConfig({ ...config, copyFiles: [...config.copyFiles, value] })
    setNewFile('')
    setShowSuggestions(false)
    fileInputRef.current?.focus()
  }

  const handlePickFile = async () => {
    const picked = await window.groveAPI.pickFileFromRepo(repoPath)
    if (picked) handleAddFile(picked)
  }

  const handleRemoveFile = (idx: number) => {
    setConfig({ ...config, copyFiles: config.copyFiles.filter((_, i) => i !== idx) })
  }

  const handleAddCommand = () => {
    const value = newCommand.trim()
    if (!value) return
    setConfig({ ...config, postCreateCommands: [...config.postCreateCommands, value] })
    setNewCommand('')
  }

  const handleRemoveCommand = (idx: number) => {
    setConfig({ ...config, postCreateCommands: config.postCreateCommands.filter((_, i) => i !== idx) })
  }

  const moveCommand = (idx: number, dir: -1 | 1) => {
    const next = [...config.postCreateCommands]
    const target = idx + dir
    if (target < 0 || target >= next.length) return
    ;[next[idx], next[target]] = [next[target], next[idx]]
    setConfig({ ...config, postCreateCommands: next })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal repo-settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Repository Settings</h2>
          <span className="modal-repo-badge">{repoName}</span>
          <button className="modal-close" onClick={onClose}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="4" y1="4" x2="12" y2="12"/>
              <line x1="12" y1="4" x2="4" y2="12"/>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {!loaded ? (
            <div className="settings-loading">Loading...</div>
          ) : (
            <>
              {/* Files to copy section */}
              <section className="settings-section">
                <div className="section-title">
                  <h3>Files to copy</h3>
                  <p>These files will be copied from the main repo into every new worktree.</p>
                </div>

                <div className="file-input-row">
                  <div className="file-input-wrapper">
                    <input
                      ref={fileInputRef}
                      type="text"
                      placeholder=".env, config/local.json, ..."
                      value={newFile}
                      onChange={(e) => { setNewFile(e.target.value); setShowSuggestions(true) }}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); handleAddFile() }
                      }}
                    />
                    {showSuggestions && fileSuggestions.length > 0 && (
                      <div className="suggestions-dropdown">
                        {fileSuggestions.map((f) => (
                          <button
                            key={f}
                            type="button"
                            className="suggestion-item"
                            onMouseDown={(e) => { e.preventDefault(); handleAddFile(f) }}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button type="button" className="btn-icon" title="Browse..." onClick={handlePickFile}>
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M2 4 a1 1 0 0 1 1 -1 h3 l2 2 h5 a1 1 0 0 1 1 1 v6 a1 1 0 0 1 -1 1 h-11 a1 1 0 0 1 -1 -1 z"/>
                    </svg>
                  </button>
                  <button type="button" className="btn-icon btn-add" title="Add" onClick={() => handleAddFile()}>
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <line x1="8" y1="3" x2="8" y2="13"/>
                      <line x1="3" y1="8" x2="13" y2="8"/>
                    </svg>
                  </button>
                </div>

                {config.copyFiles.length > 0 ? (
                  <ul className="item-list">
                    {config.copyFiles.map((f, i) => (
                      <li key={i} className="item-row">
                        <svg className="item-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M3 2 h7 l3 3 v9 a0.5 0.5 0 0 1 -0.5 0.5 h-9.5 a0.5 0.5 0 0 1 -0.5 -0.5 v-11.5 a0.5 0.5 0 0 1 0.5 -0.5 z"/>
                          <polyline points="10,2 10,5 13,5"/>
                        </svg>
                        <span className="item-text">{f}</span>
                        <button type="button" className="item-remove" onClick={() => handleRemoveFile(i)}>
                          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <line x1="5" y1="5" x2="11" y2="11"/>
                            <line x1="11" y1="5" x2="5" y2="11"/>
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="empty-hint">No files configured. Common examples: <code>.env</code>, <code>.env.local</code></div>
                )}
              </section>

              {/* Post-create commands section */}
              <section className="settings-section">
                <div className="section-title">
                  <h3>Post-create commands</h3>
                  <p>Commands to run inside the new worktree after creation. Run sequentially.</p>
                </div>

                <div className="file-input-row">
                  <input
                    type="text"
                    className="cmd-input"
                    placeholder="npm install"
                    value={newCommand}
                    onChange={(e) => setNewCommand(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); handleAddCommand() }
                    }}
                  />
                  <button type="button" className="btn-icon btn-add" title="Add" onClick={handleAddCommand}>
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <line x1="8" y1="3" x2="8" y2="13"/>
                      <line x1="3" y1="8" x2="13" y2="8"/>
                    </svg>
                  </button>
                </div>

                {config.postCreateCommands.length > 0 ? (
                  <ul className="item-list">
                    {config.postCreateCommands.map((c, i) => (
                      <li key={i} className="item-row">
                        <span className="item-step">{i + 1}</span>
                        <code className="item-text item-cmd">{c}</code>
                        <div className="item-actions">
                          <button
                            type="button"
                            className="item-arrow"
                            disabled={i === 0}
                            onClick={() => moveCommand(i, -1)}
                            title="Move up"
                          >
                            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <polyline points="4,10 8,6 12,10"/>
                            </svg>
                          </button>
                          <button
                            type="button"
                            className="item-arrow"
                            disabled={i === config.postCreateCommands.length - 1}
                            onClick={() => moveCommand(i, 1)}
                            title="Move down"
                          >
                            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <polyline points="4,6 8,10 12,6"/>
                            </svg>
                          </button>
                          <button type="button" className="item-remove" onClick={() => handleRemoveCommand(i)}>
                            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <line x1="5" y1="5" x2="11" y2="11"/>
                              <line x1="11" y1="5" x2="5" y2="11"/>
                            </svg>
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="empty-hint">No commands configured. Examples: <code>npm install</code>, <code>pnpm install &amp;&amp; pnpm build</code></div>
                )}
              </section>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="button" className="btn-primary" onClick={handleSave} disabled={saving || !loaded}>
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}
