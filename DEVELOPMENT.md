# Development Guide

This guide provides detailed information for developers working on TimeLedger.

## Prerequisites

- **Node.js**: Version 18 or higher
- **npm**: Version 9 or higher
- **Git**: For version control

## Initial Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd TimeLedger
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

   This installs all required packages including:
   - Electron
   - React and React DOM
   - TypeScript
   - Vite
   - better-sqlite3
   - electron-builder
   - PDFKit (for PDF export)

3. Verify installation:
   ```bash
   npm run build
   ```

**Note:** This project is optimized for development on **Apple Silicon Macs**. Local builds only target macOS. Windows and Linux builds are handled by GitHub Actions.

## Development Workflow

### Running the App in Development Mode

```bash
npm run dev
```

This command:
- Starts Vite dev server on http://localhost:5173
- Compiles the main process TypeScript
- Launches Electron with hot reload
- Opens DevTools automatically

### File Watching

When you make changes:
- **Renderer changes** (React/UI): Automatically hot-reloaded
- **Main process changes**: Requires manual restart of Electron

### Development Tools

- **React DevTools**: Available in the Electron window
- **Chrome DevTools**: Opens automatically in development mode
- **Electron Inspector**: Available on port 5858

## Project Architecture

### Electron Process Model

TimeLedger uses Electron's multi-process architecture:

1. **Main Process** (`src/main/`)
   - Manages the application lifecycle
   - Creates and manages browser windows
   - Handles native OS interactions
   - Manages SQLite database
   - Handles IPC communications

2. **Renderer Process** (`src/renderer/`)
   - React application
   - User interface
   - Communicates with main process via IPC

3. **Preload Script** (`src/preload/`)
   - Bridge between main and renderer
   - Exposes safe IPC API to renderer
   - Enforces context isolation

### Data Flow

```
User Action (Renderer)
  ↓
IPC Call via window.api
  ↓
Preload Script (contextBridge)
  ↓
IPC Handler (Main Process)
  ↓
Database Operation
  ↓
Return Result
  ↓
Renderer Updates UI
```

## Key Features Architecture

### Theme System

TimeLedger implements a light/dark theme system using React Context:

**Implementation:**
- `src/renderer/context/ThemeContext.tsx`: Context provider with theme state
- Theme preference stored in `localStorage`
- Default theme: dark
- CSS variables defined in `styles.css` using `[data-theme="light"]` and `[data-theme="dark"]` selectors
- Theme toggle available in Settings page

**Usage in components:**
```typescript
import { useTheme } from '../context/ThemeContext';

const MyComponent = () => {
  const { theme, toggleTheme } = useTheme();
  // Use theme or toggleTheme
};
```

### PDF Export

PDF export uses PDFKit to generate professional reports:

**Implementation:**
- `src/main/export.ts`: Contains `exportReportAsPDF()` function
- Generates formatted reports with summary and detailed breakdowns
- Saves to user's Downloads folder
- File naming: `timeledger-report-YYYY-MM-DD.pdf`

**Features:**
- Summary cards with total hours and value
- Per-project breakdowns with detailed entries
- Professional formatting with proper spacing
- Supports theme colors (but generates print-friendly PDFs)

**Dependencies:**
- `pdfkit`: PDF generation library
- `@types/pdfkit`: TypeScript definitions

### Database Schema

#### Projects Table
```sql
CREATE TABLE projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  hourly_rate REAL,
  client_name TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)
```

#### Time Entries Table
```sql
CREATE TABLE time_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  start_time TEXT,
  end_time TEXT,
  duration_minutes INTEGER NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
)
```

#### Settings Table
```sql
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
)
```

## Code Style and Conventions

### TypeScript

- **Strict mode enabled**: All strict TypeScript checks
- **No any types**: Use proper typing
- **Interfaces over types**: Use interfaces for object shapes
- **Shared types**: All shared types in `src/shared/types.ts`

### React

- **Functional components**: Use hooks, not class components
- **TypeScript**: All components are typed
- **Props interfaces**: Define interface for component props
- **Hooks**: useState, useEffect for state and side effects
- **Context API**: Used for theme, internationalization, and notifications

### File Organization

```
src/
├── main/              # Backend logic
│   ├── index.ts       # Entry point, window management
│   ├── database.ts    # Database operations
│   ├── backup.ts      # Backup/restore
│   ├── export.ts      # Export to CSV/JSON/PDF
│   └── ipc-handlers.ts # IPC communication
├── renderer/          # Frontend
│   ├── pages/         # Page components
│   ├── components/    # Reusable components
│   ├── context/       # React contexts (Theme, I18n, Notifications)
│   ├── App.tsx        # Main app component
│   ├── index.tsx      # React entry point
│   └── styles.css     # Global styles with theme variables
├── preload/           # IPC bridge
│   └── index.ts       # Context bridge setup
└── shared/            # Shared code
    └── types.ts       # Type definitions
```

### Naming Conventions

- **Files**: PascalCase for components, camelCase for utilities
- **Components**: PascalCase
- **Functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Interfaces**: PascalCase
- **Database**: snake_case

## Building and Packaging

### Development Build

```bash
npm run build
```

Creates production build in `dist/`:
- `dist/main/` - Compiled main process
- `dist/renderer/` - Bundled renderer

### Local Package (macOS ARM64)

```bash
npm run dist
```

Output in `release/`:
- `TimeLedger-[version]-arm64.dmg` - ARM64 DMG installer
- `TimeLedger-[version]-arm64-mac.zip` - ARM64 ZIP archive

**For Universal Binary (ARM64 + Intel):**
```bash
npm run dist:universal
```

**For Windows/Linux:** Use GitHub Actions (automatic on version tag push)

### Build Configuration

Configuration in `package.json` under `build`:
- App ID: `com.timeledger.app`
- Product name: `TimeLedger`
- Icons: `build/icon.icns` (macOS)

## Testing

### Manual Testing Checklist

Before each release, test:

- [ ] Create/edit/delete projects
- [ ] Create/edit/delete time entries
- [ ] Generate reports with various filters
- [ ] Export CSV and JSON
- [ ] Select backup directory
- [ ] Create manual backup
- [ ] Restore from backup
- [ ] App exit (triggers backup)
- [ ] First launch experience

### Database Testing

```bash
# Open the database
sqlite3 ~/Library/Application\ Support/TimeLedger/db.sqlite

# Check tables
.tables

# View projects
SELECT * FROM projects;

# View time entries
SELECT * FROM time_entries;
```

## Debugging

### Main Process

1. Run with inspector:
   ```bash
   npm run dev:main
   ```

2. Connect debugger to `localhost:5858`

### Renderer Process

1. Open DevTools in Electron window
2. Use React DevTools
3. Check Console for errors
4. Use Network tab for IPC calls

### Common Issues

**"Database is locked"**
- Close all app instances
- Delete WAL and SHM files
- Restart app

**"Module not found"**
- Clear node_modules: `rm -rf node_modules`
- Reinstall: `npm install`
- Clear dist: `npm run clean`

**TypeScript errors**
- Check tsconfig.json
- Verify all types are defined
- Run: `npx tsc --noEmit`

## Adding New Features

### Adding a New Page

1. Create component in `src/renderer/pages/`
2. Add route to `App.tsx`
3. Add navigation link to sidebar
4. Export component

### Adding New IPC Channels

1. Add channel name to `IPC_CHANNELS` in `types.ts`
2. Create handler in `src/main/ipc-handlers.ts`
3. Add method to API in `src/preload/index.ts`
4. Use in renderer via `window.api`

### Adding Database Fields

1. Update interface in `src/shared/types.ts`
2. Update SQL schema in `src/main/database.ts`
3. Update CRUD methods
4. Update UI components

### Adding Export Formats

1. Create method in `src/main/export.ts`
2. Add format to `ExportFormat` type
3. Update IPC handler
4. Add export button in UI

**Current formats:**
- CSV: Tabular format for spreadsheets
- JSON: Structured data format
- PDF: Professional reports using PDFKit

## Performance Optimization

### Electron

- Use context isolation
- Minimize IPC calls
- Batch database operations
- Use prepared statements

### React

- Use React.memo for expensive components
- Avoid inline functions in render
- Use keys properly in lists
- Lazy load components if needed

### Database

- Use indices on frequently queried columns
- Use transactions for bulk operations
- Close database connections properly
- Use WAL mode (already enabled)

## Security Best Practices

### IPC Security

- Always use context isolation
- Never expose Node.js APIs directly
- Validate all IPC inputs
- Use typed IPC channels

### Database

- Use parameterized queries (prevents SQL injection)
- No user input in SQL strings
- Validate data before insertion

### File System

- Validate file paths
- Check permissions
- Use absolute paths
- Handle errors gracefully

## Release Process

### Automated Release (Recommended)

TimeLedger uses GitHub Actions to automate the build and release process for macOS:

1. Update version in `package.json`:
   ```bash
   # Example: Update to version 1.2.0
   npm version 1.2.0
   ```

2. Test the build locally:
   ```bash
   npm run build
   npm run dist:mac
   ```

3. Commit your changes:
   ```bash
   git add package.json package-lock.json
   git commit -m "chore: bump version to 1.2.0"
   ```

4. Create and push a version tag:
   ```bash
   git tag v1.2.0
   git push origin main
   git push origin v1.2.0
   ```

5. GitHub Actions will automatically:
   - Build for all platforms in parallel (macOS, Windows, Linux)
   - Create a GitHub release
   - Upload all installers and archives as release assets:
     - macOS: DMG and ZIP (Intel x64 + Apple Silicon arm64)
     - Windows: NSIS installer and portable EXE (x64)
     - Linux: AppImage and DEB package (x64)

6. Monitor the build progress in the "Actions" tab on GitHub

7. Once complete, verify the release at `https://github.com/yourusername/TimeLedger/releases`

### Manual Release

If you need to release manually:

1. Update version in `package.json`
2. Update CHANGELOG (if exists)
3. Run full test suite
4. Build for all platforms
5. Test installers
6. Create git tag
7. Push to repository
8. Create GitHub release manually
9. Upload installers

### Code Signing (Optional)

To sign your macOS app, add these secrets to your GitHub repository:

1. Go to Settings > Secrets and variables > Actions
2. Add the following secrets:
   - `APPLE_ID`: Your Apple ID email
   - `APPLE_ID_PASSWORD`: App-specific password from Apple
   - `TEAM_ID`: Your Apple Developer Team ID

3. Uncomment the signing environment variables in `.github/workflows/release.yml`

## Contributing

### Pull Request Process

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Update documentation
6. Submit pull request

### Commit Messages

Use conventional commits:
- `feat: Add dark mode toggle`
- `fix: Resolve database locking issue`
- `docs: Update README with new features`
- `refactor: Simplify report generation logic`
- `test: Add unit tests for database layer`

## Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- [Vite Guide](https://vitejs.dev/guide)

## Support

For development questions:
1. Check this guide
2. Review the code comments
3. Check Electron/React docs
4. Open an issue on GitHub

---

Happy coding! 🚀
