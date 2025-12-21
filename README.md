# Electron App Template

A modern, production-ready Electron application template with React, TypeScript, SQLite, and comprehensive features.

## Features

- ✨ **Modern Stack**: Electron + React + TypeScript + Vite
- 💾 **SQLite Database**: Built-in database with better-sqlite3
- 🔄 **Automatic Backups**: Hourly backups with restore functionality
- 🎨 **10 Themes**: Dark, Light, Ocean, Sunset, Forest, Neon, Candy, Lavender, Mint, Peach
- 🌍 **Internationalization**: English and German locales included
- ⌨️ **Keyboard Shortcuts**: Global shortcuts with help modal
- 🔍 **Global Search**: Template for implementing search functionality
- 📦 **Production Builds**: Configured for macOS, Windows, and Linux

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd electron-app-template

# Install dependencies
npm install

# Run in development mode
npm run dev
```

### Development

The app will start with hot-reload enabled:
- Main process: Changes require restart
- Renderer process: Hot-reload enabled

Press `CMD+Option+I` (macOS) or `CTRL+Shift+I` (Windows/Linux) to open DevTools.

## Project Structure

```
electron-app-template/
├── src/
│   ├── main/              # Main process (Node.js)
│   │   ├── index.ts       # App initialization
│   │   ├── database.ts    # SQLite database manager
│   │   ├── ipc-handlers.ts # IPC communication handlers
│   │   └── backup.ts      # Backup functionality
│   ├── renderer/          # Renderer process (React)
│   │   ├── App.tsx        # Main React component
│   │   ├── index.tsx      # React entry point
│   │   ├── styles.css     # Global styles and theme variables
│   │   ├── pages/         # Page components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── HelloWorld.tsx
│   │   │   └── Settings.tsx
│   │   ├── components/    # Reusable components
│   │   ├── context/       # React contexts (Theme, I18n, Notifications)
│   │   └── locales/       # Translation files (en.ts, de.ts)
│   ├── preload/           # Preload scripts
│   │   └── index.ts       # IPC bridge to renderer
│   └── shared/            # Shared types and constants
│       └── types.ts
├── assets/                # Static assets
│   └── icons/            # App icons
├── scripts/              # Build and utility scripts
└── dist/                 # Compiled output
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start the built app
- `npm run pack` - Package without creating installer
- `npm run dist` - Create production installer (macOS ARM64)
- `npm run dist:universal` - Create universal macOS build
- `npm run clean` - Clean dist folder
- `npm run clean:all` - Clean dist and release folders

## Keyboard Shortcuts

### Navigation
- `CMD/CTRL + 1` - Dashboard
- `CMD/CTRL + 2` - Hello World
- `CMD/CTRL + 3` - Settings

### General
- `CMD/CTRL + F` - Global search
- `?` - Show keyboard shortcuts help
- `ESC` - Close modal or dialog

## Database

The app uses SQLite with the following tables:

- `settings` - Application settings
- `meta` - Metadata for versioning
- `demo_items` - Example table (replace with your own)

### Adding Your Own Tables

1. Edit `src/main/database.ts`
2. Add your table schema in the `initialize()` method
3. Add CRUD methods for your table
4. Update `src/shared/types.ts` with type definitions

## Backup System

- Automatic backups every hour
- Backup on app close
- Smart backup (only when data changes)
- Restore functionality with pre-restore backup
- Supports cloud sync folders (iCloud, Dropbox, OneDrive)

## Themes

10 pre-configured themes using CSS variables. To add a new theme:

1. Open `src/renderer/styles.css`
2. Add a new `[data-theme="yourtheme"]` section
3. Define CSS variables for colors
4. Add theme name to `src/renderer/locales/*.ts`

## Internationalization

Add a new language:

1. Create `src/renderer/locales/xx.ts` (replace xx with language code)
2. Copy structure from `en.ts`
3. Translate all strings
4. Update `src/renderer/context/I18nContext.tsx`

## Production Builds

### macOS
```bash
npm run dist              # ARM64 only
npm run dist:universal    # Universal (Intel + ARM64)
```

### Windows & Linux
Update `scripts/run-dist.js` to include desired platforms:
```javascript
// Add to args array:
'--windows', '--linux'
```

## Customization

### Change App Name
1. Update `package.json` - name, description, author
2. Update `src/renderer/App.tsx` - sidebar title
3. Update icon files in `assets/icons/`

### Add New Pages
1. Create component in `src/renderer/pages/`
2. Add route in `src/renderer/App.tsx`
3. Add navigation item in sidebar
4. Add keyboard shortcut (optional)
5. Update translations

### Add New IPC Channels
1. Define channel in `src/shared/types.ts`
2. Add handler in `src/main/ipc-handlers.ts`
3. Expose in `src/preload/index.ts`
4. Use in renderer components

## Technologies

- **Electron** - Desktop app framework
- **React** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool and dev server
- **better-sqlite3** - Synchronous SQLite database
- **lucide-react** - Icon library
- **electron-builder** - App packaging

## License

MIT - feel free to use this template for your own projects!

## Support

For issues and questions, please open an issue on GitHub.

---

**Happy Coding!** 🚀
