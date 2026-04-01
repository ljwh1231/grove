# Grove

Git worktree launcher — pick a branch, open it in your IDE.

![Electron](https://img.shields.io/badge/Electron-28-47848F?logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)

## What is Grove?

Grove is a desktop app that lets you manage git worktrees visually and launch them in your preferred IDE with a single click. No more `cd`-ing into worktree directories or remembering which branch lives where.

### Features

- **Worktree dashboard** — See all worktrees for a repo at a glance (branch, commit, path, time)
- **One-click IDE launch** — Open any worktree in VS Code, Cursor, GoLand, IntelliJ, WebStorm, Zed, Vim, or any custom editor
- **IDE auto-detection** — Finds installed IDEs via PATH, JetBrains Toolbox, and `/Applications`
- **Create & remove worktrees** — Branch picker with filtering, path preview, and validation
- **Multi-repo support** — Switch between repositories from the sidebar
- **Grid / List view** — Toggle between card grid and compact list
- **Search** — Filter branches with `Cmd+K`

## Install

### Homebrew (macOS)

```bash
brew tap ljwh1231/grove
brew install --cask grove
```

### From source

```bash
git clone https://github.com/ljwh1231/grove.git
cd grove
npm install
npm run package
npm run install:local
```

## Development

```bash
npm install
npm run electron:dev    # Dev mode with HMR
```

### Scripts

| Command | Description |
|---|---|
| `npm run electron:dev` | Dev mode (Vite HMR + Electron) |
| `npm run electron:prod` | Production build + run |
| `npm run build` | Build frontend + electron |
| `npm run package` | Package .app bundle (arm64) |
| `npm run package:x64` | Package .app bundle (x64) |
| `npm run install:local` | Copy .app to /Applications |

## Tech Stack

- **Electron** — Desktop shell
- **React** — UI framework
- **Vite** — Build tool with HMR
- **TypeScript** — Type safety

## Project Structure

```
grove/
├── electron/
│   ├── main.ts        # Main process, IPC handlers, git operations
│   └── preload.ts     # Context bridge (groveAPI)
├── src/
│   ├── App.tsx        # Root component, state management
│   ├── types.ts       # Types, IDE presets
│   └── components/
│       ├── Sidebar        # Repo list
│       ├── TopBar         # Search, IDE selector
│       ├── WorktreeGrid   # Grid/list view container
│       ├── WorktreeCard   # Individual worktree card
│       ├── StatusBar      # Connection status
│       └── NewWorktreeModal  # Create worktree dialog
├── build/             # App icon assets
├── scripts/           # Package & install scripts
└── homebrew-tap/      # Homebrew Cask formula
```

## License

ISC
