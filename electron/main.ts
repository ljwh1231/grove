import { app, BrowserWindow, ipcMain, shell } from 'electron'
import path from 'path'
import { execSync, exec } from 'child_process'
import fs from 'fs'

let mainWindow: BrowserWindow | null = null

const isDev = !app.isPackaged

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 800,
    minHeight: 500,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0d1208',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// ===== IPC Handlers =====

interface WorktreeInfo {
  path: string
  branch: string
  commitHash: string
  commitMessage: string
  commitAuthor: string
  commitDate: string
  isMainWorktree: boolean
  isCurrent: boolean
}

function parseRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return '방금 전'
  if (diffMin < 60) return `${diffMin}분 전`
  if (diffHour < 24) return `${diffHour}시간 전`
  if (diffDay < 7) return `${diffDay}일 전`
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}주 전`
  return `${Math.floor(diffDay / 30)}개월 전`
}

function getWorktrees(repoPath: string): WorktreeInfo[] {
  try {
    const output = execSync('git worktree list --porcelain', {
      cwd: repoPath,
      encoding: 'utf-8',
    })

    const worktrees: WorktreeInfo[] = []
    const blocks = output.trim().split('\n\n')

    for (const block of blocks) {
      const lines = block.trim().split('\n')
      let wtPath = ''
      let branch = ''
      let commitHash = ''
      let isBareBranch = false

      for (const line of lines) {
        if (line.startsWith('worktree ')) {
          wtPath = line.substring(9)
        } else if (line.startsWith('HEAD ')) {
          commitHash = line.substring(5, 12)
        } else if (line.startsWith('branch ')) {
          branch = line.substring(7).replace('refs/heads/', '')
        } else if (line === 'bare') {
          isBareBranch = true
        } else if (line === 'detached') {
          branch = `(detached HEAD ${commitHash})`
        }
      }

      if (isBareBranch || !wtPath) continue

      let commitMessage = ''
      let commitAuthor = ''
      let commitDate = ''

      try {
        commitMessage = execSync('git log -1 --format=%s', {
          cwd: wtPath,
          encoding: 'utf-8',
        }).trim()
        commitAuthor = execSync('git log -1 --format=%an', {
          cwd: wtPath,
          encoding: 'utf-8',
        }).trim()
        const rawDate = execSync('git log -1 --format=%ci', {
          cwd: wtPath,
          encoding: 'utf-8',
        }).trim()
        commitDate = parseRelativeTime(rawDate)
      } catch {
        // ignore
      }

      const isMain = lines.some((l: string) => l === 'worktree ' + wtPath) && blocks.indexOf(block) === 0

      worktrees.push({
        path: wtPath,
        branch: branch || '(unknown)',
        commitHash,
        commitMessage,
        commitAuthor,
        commitDate,
        isMainWorktree: isMain,
        isCurrent: false,
      })
    }

    return worktrees
  } catch (e) {
    console.error('Failed to get worktrees:', e)
    return []
  }
}

ipcMain.handle('get-worktrees', async (_event, repoPath: string) => {
  return getWorktrees(repoPath)
})

function findApp(appName: string): string | null {
  const searchDirs = [
    '/Applications',
    path.join(process.env.HOME || '', 'Applications'),
    '/Applications/JetBrains Toolbox',
  ]
  for (const dir of searchDirs) {
    const appPath = path.join(dir, `${appName}.app`)
    if (fs.existsSync(appPath)) return appPath
  }
  // Fallback: mdfind (Spotlight)
  try {
    const result = execSync(`mdfind "kMDItemFSName == '${appName}.app'" 2>/dev/null`, {
      encoding: 'utf-8',
    }).trim()
    const first = result.split('\n')[0]
    if (first && fs.existsSync(first)) return first
  } catch { /* ignore */ }
  return null
}

function findIdeCommand(cmd: string): string | null {
  // 1. Check PATH
  try {
    return execSync(`which ${cmd}`, { encoding: 'utf-8' }).trim()
  } catch { /* not in PATH */ }

  // 2. Check JetBrains Toolbox scripts
  const toolboxPath = path.join(process.env.HOME || '', 'Library/Application Support/JetBrains/Toolbox/scripts', cmd)
  if (fs.existsSync(toolboxPath)) return toolboxPath

  return null
}

ipcMain.handle('open-in-ide', async (_event, ideCmd: string, worktreePath: string, appName?: string) => {
  try {
    // 1. Try CLI command
    const cmdPath = findIdeCommand(ideCmd)
    if (cmdPath) {
      exec(`"${cmdPath}" "${worktreePath}"`)
      return { success: true }
    }
    // 2. Try macOS open -a with app name
    if (appName) {
      const appPath = findApp(appName)
      if (appPath) {
        exec(`open -a "${appPath}" "${worktreePath}"`)
        return { success: true }
      }
    }
    // 3. Try open -a with command name directly (works for some apps)
    exec(`open -a "${ideCmd}" "${worktreePath}"`)
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
})

ipcMain.handle('open-terminal', async (_event, worktreePath: string) => {
  try {
    if (process.platform === 'darwin') {
      exec(`open -a Terminal "${worktreePath}"`)
    } else if (process.platform === 'win32') {
      exec(`start cmd /K "cd /d ${worktreePath}"`)
    } else {
      exec(`x-terminal-emulator --working-directory="${worktreePath}"`)
    }
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
})

ipcMain.handle('create-worktree', async (_event, repoPath: string, branchName: string, baseBranch?: string) => {
  try {
    const parentDir = path.dirname(repoPath)
    const repoName = path.basename(repoPath)
    const safeBranch = branchName.replace(/\//g, '-')
    const worktreePath = path.join(parentDir, `${repoName}-${safeBranch}`)

    if (baseBranch) {
      execSync(`git worktree add "${worktreePath}" -b "${branchName}" "${baseBranch}"`, {
        cwd: repoPath,
        encoding: 'utf-8',
      })
    } else {
      execSync(`git worktree add "${worktreePath}" "${branchName}"`, {
        cwd: repoPath,
        encoding: 'utf-8',
      })
    }
    return { success: true, path: worktreePath }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
})

ipcMain.handle('remove-worktree', async (_event, repoPath: string, worktreePath: string) => {
  try {
    execSync(`git worktree remove "${worktreePath}"`, {
      cwd: repoPath,
      encoding: 'utf-8',
    })
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
})

ipcMain.handle('get-branches', async (_event, repoPath: string) => {
  try {
    const output = execSync('git branch -a --format="%(refname:short)"', {
      cwd: repoPath,
      encoding: 'utf-8',
    })
    return output.trim().split('\n').filter(Boolean)
  } catch {
    return []
  }
})

ipcMain.handle('select-directory', async () => {
  const { dialog } = await import('electron')
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory'],
  })
  if (result.canceled) return null
  const dir = result.filePaths[0]
  // Check if it's a git repo
  try {
    execSync('git rev-parse --git-dir', { cwd: dir, encoding: 'utf-8' })
    return dir
  } catch {
    return null
  }
})

ipcMain.handle('get-saved-repos', async () => {
  const configPath = path.join(app.getPath('userData'), 'repos.json')
  try {
    const data = fs.readFileSync(configPath, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
})

ipcMain.handle('save-repos', async (_event, repos: string[]) => {
  const configPath = path.join(app.getPath('userData'), 'repos.json')
  fs.writeFileSync(configPath, JSON.stringify(repos, null, 2))
})

ipcMain.handle('check-ide-command', async (_event, cmd: string, appName?: string) => {
  // 1. Check CLI in PATH
  const cmdPath = findIdeCommand(cmd)
  if (cmdPath) return { found: true, path: cmdPath }

  // 2. Check macOS .app bundle
  if (appName) {
    const appPath = findApp(appName)
    if (appPath) return { found: true, path: appPath }
  }

  // 3. Try finding .app by command name (capitalize first letter)
  const guessName = cmd.charAt(0).toUpperCase() + cmd.slice(1)
  const guessPath = findApp(guessName)
  if (guessPath) return { found: true, path: guessPath }

  return { found: false }
})

ipcMain.handle('get-saved-ides', async () => {
  const configPath = path.join(app.getPath('userData'), 'ides.json')
  try {
    const data = fs.readFileSync(configPath, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
})

ipcMain.handle('save-ides', async (_event, ides: any[]) => {
  const configPath = path.join(app.getPath('userData'), 'ides.json')
  fs.writeFileSync(configPath, JSON.stringify(ides, null, 2))
})
