# AGENTS.md

This file provides guidance to coding agents like OpenAI Codex, Claude Code or similar,  when working with code in this repository.

## Project Overview

TimeLedger is an Electron desktop application for time tracking, built for freelancers and side projects. It uses React + TypeScript for the frontend and better-sqlite3 for local data persistence.

## Common Commands

```bash
# Development (runs both renderer and main process)
npm run dev

# Build for production
npm run build

# Build only renderer (Vite)
npm run build:renderer

# Build only main process (TypeScript)
npm run build:main

# Create distribution package (macOS)
npm run dist
npm run dist:universal  # Universal binary

# Clean build artifacts
npm run clean           # Remove dist/
npm run clean:release   # Remove release/
npm run clean:all       # Remove both
```

## Architecture

### Process Structure (Electron)

- **Main Process** (`src/main/`): Node.js environment handling database, file system, and native operations
- **Renderer Process** (`src/renderer/`): React application running in Chromium
- **Preload Script** (`src/preload/`): Bridge between main and renderer via contextBridge

### IPC Communication

All renderer-to-main communication uses typed IPC channels defined in `src/shared/types.ts` (`IPC_CHANNELS`). The preload script (`src/preload/index.ts`) exposes a structured `window.api` object that groups methods by domain (project, timeEntry, invoice, report, backup, settings, search, dashboard).

### Database Layer

- SQLite database stored in `~/Library/Application Support/TimeLedger/db.sqlite`
- `DatabaseManager` class (`src/main/database.ts`) is a singleton providing all data operations
- Schema migrations in `src/main/migrations/` - each migration exports a `Migration` object with version number and `up()` function
- Migration runner auto-detects existing databases and bootstraps them to the migration system

### Adding Database Migrations

1. Create new file `src/main/migrations/NNN_description.ts`
2. Export a `Migration` object with `version`, `name`, and `up(db)` function
3. Register in `src/main/migrations/index.ts` migrations array

### Frontend Structure

- Single-page app with client-side routing via `currentPage` state in `App.tsx`
- Pages: Dashboard, Projects, Customers, TimeEntries, Invoices, Reports, Settings
- Context providers: ThemeContext, I18nContext, NotificationContext, KeyboardShortcutContext
- Localization files in `src/renderer/locales/` (en.ts, de.ts)

### Navigation and Keyboard Shortcuts

**IMPORTANT**: When modifying the sidebar navigation in `App.tsx` (adding, removing, or reordering menu items):

1. **Update keyboard shortcuts** in the `handleKeyDown` function (CMD/CTRL + number keys)
   - The number keys should match the visual order of menu items
   - Example: If Customers is moved to position 2, update its shortcut to CMD+2

2. **Update the keyboard shortcuts help** (`src/renderer/components/KeyboardShortcutsHelp.tsx`)
   - Navigation shortcuts section must reflect the new order/items
   - Ensure all labels and key combinations are correct

3. **Test all shortcuts** after navigation changes to verify correct routing

The navigation order directly affects user muscle memory - consistency between visual order and shortcuts is critical.

### Build Configuration

- **Renderer**: Vite (tsconfig.json) - outputs to `dist/renderer/`
- **Main Process**: tsc with tsconfig.main.json - outputs to `dist/main/`
- Path aliases: `@shared/*` -> `src/shared/*`, `@renderer/*` -> `src/renderer/*`
