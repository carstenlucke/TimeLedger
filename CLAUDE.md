# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run Commands

```bash
npm run dev              # Start dev mode (concurrent renderer + main)
npm run build            # Production build (renderer via Vite + main via tsc)
npm run start            # Launch the built Electron app
npm run dist:mac         # Package macOS ARM64 DMG (local dev)
npm run dist:universal   # Package macOS Universal binary
npm run clean:all        # Remove dist/ and release/
```

There is no test framework configured.

## Architecture

TimeLedger is an Electron + React desktop app with three process layers:

```
Main Process (src/main/)        ← Node.js, SQLite, file system
    ↕ IPC (typed channels)
Preload (src/preload/)          ← contextBridge, exposes window.api
    ↕
Renderer (src/renderer/)       ← React UI, Vite-bundled
```

### Main Process (`src/main/`)

- **database.ts** — `DatabaseManager` singleton. All CRUD, reports, dashboard stats, settings. Uses better-sqlite3 with WAL mode and parameterized queries.
- **ipc-handlers.ts** — Maps `IPC_CHANNELS` constants to `DatabaseManager` methods via `ipcMain.handle()`.
- **backup.ts** — `BackupManager`: hourly auto-backup (only if data changed), restore, cloud folder support.
- **export.ts** — `ExportManager`: CSV (semicolon-delimited) and JSON export.
- **migrations/** — Versioned schema migrations (v1–v8), auto-run on startup via `MigrationRunner`.

### Renderer (`src/renderer/`)

- **App.tsx** — Root component. Page routing via `currentPage` state, keyboard shortcuts (CMD/CTRL+1-7), sidebar nav.
- **pages/** — 7 pages: Dashboard, Customers, Projects, TimeEntries, Invoices, Reports, Settings.
- **components/** — Reusable UI: WeeklyBarChart, DurationPicker, GlobalSearch, SortableTable, etc.
- **context/** — ThemeContext (10 themes via CSS variables), I18nContext (en/de with locale-aware formatting), NotificationContext.
- **styles.css** — All styling; theme variants defined as CSS variable sets on `[data-theme]`.

### Shared (`src/shared/types.ts`)

All TypeScript interfaces and the `IPC_CHANNELS` constant mapping. This is the single source of truth for IPC channel names and data shapes used across all three layers.

## IPC Communication Pattern

The renderer calls the main process through a typed API:

1. `window.api.[domain].[method]()` in renderer (e.g., `window.api.project.getAll()`)
2. Preload (`src/preload/index.ts`) maps these to `ipcRenderer.invoke(IPC_CHANNELS.*)` calls
3. Main process handles via `ipcMain.handle(IPC_CHANNELS.*, ...)` in `ipc-handlers.ts`

When adding a new IPC endpoint: define the channel in `IPC_CHANNELS` (shared/types.ts), expose it in preload, handle it in ipc-handlers.ts, and declare types in `global.d.ts`.

## Database Migrations

Migrations live in `src/main/migrations/`. Each exports `{version, name, up(db)}`. The `MigrationRunner` auto-detects and bootstraps existing databases. See `docs/database-migrations.md` for details.

## Build Configuration

- **Vite** (`vite.config.ts`): Renderer root is `src/renderer`, output to `dist/renderer/`. Path aliases: `@shared`, `@renderer`.
- **TypeScript**: Two configs — `tsconfig.json` (renderer, ES2020/JSX) and `tsconfig.main.json` (main process, CommonJS).
- **electron-builder** (package.json `"build"` field): Targets macOS DMG, Windows NSIS/portable, Linux AppImage. Output in `release/`.

## Navigation and Keyboard Shortcuts

When modifying the sidebar navigation in `App.tsx` (adding, removing, or reordering menu items):

1. **Update keyboard shortcuts** in the `handleKeyDown` function (CMD/CTRL + number keys) — number keys must match the visual order of menu items.
2. **Update the keyboard shortcuts help** (`src/renderer/components/KeyboardShortcutsHelp.tsx`) — navigation shortcuts section must reflect the new order/items.
3. **Test all shortcuts** after navigation changes to verify correct routing.

The navigation order directly affects user muscle memory — consistency between visual order and shortcuts is critical.

## Localization

Two locales in `src/renderer/locales/` (en.ts, de.ts). The `I18nContext` provides `t()` for translations and locale-aware `formatCurrency`, `formatNumber`, `formatDate`. Always add keys to both locale files.
