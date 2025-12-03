# TimeLedger

A simple desktop time tracking application for freelancers and side projects. Built with Electron, React, TypeScript, and SQLite.

![TimeLedger](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## Features

- **Project Management**: Create and manage projects with optional hourly rates and client names
- **Manual Time Entry**: Track time with either duration or start/end times
- **Reporting**: Generate detailed reports by date range and project
- **Export**: Export reports as CSV or JSON
- **Automatic Backups**: Hourly automatic backups and backup on app exit
- **Cloud Sync**: Store backups in iCloud, Dropbox, OneDrive, or any synced folder
- **Cross-Platform**: Works on macOS, Windows, and Linux

## Technology Stack

- **Desktop Shell**: Electron
- **Frontend**: React + TypeScript
- **Database**: SQLite (via better-sqlite3)
- **Build Tool**: Vite
- **Bundler**: electron-builder

## Installation

### Prerequisites

- Node.js 18+ and npm

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/TimeLedger.git
   cd TimeLedger
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Development

### Available Scripts

- `npm run dev` - Start the app in development mode
- `npm run build` - Build the app for production
- `npm run start` - Start the built app
- `npm run dist` - Build and package the app for distribution
- `npm run dist:mac` - Build for macOS
- `npm run clean` - Clean build artifacts

### Project Structure

```
TimeLedger/
├── src/
│   ├── main/          # Electron main process
│   │   ├── index.ts        # Main entry point
│   │   ├── database.ts     # SQLite database layer
│   │   ├── backup.ts       # Backup/restore logic
│   │   ├── export.ts       # CSV/JSON export
│   │   └── ipc-handlers.ts # IPC communication handlers
│   ├── renderer/      # React frontend
│   │   ├── pages/          # Page components
│   │   ├── components/     # Reusable components
│   │   ├── App.tsx         # Main app component
│   │   ├── index.tsx       # React entry point
│   │   ├── index.html      # HTML template
│   │   └── styles.css      # Global styles
│   ├── preload/       # Preload script for IPC
│   │   └── index.ts
│   └── shared/        # Shared types and constants
│       └── types.ts
├── package.json
├── tsconfig.json      # TypeScript config for renderer
├── tsconfig.main.json # TypeScript config for main
├── vite.config.ts     # Vite configuration
└── README.md
```

## Usage

### First Launch

On first launch, you'll be prompted to select a backup directory. Choose a folder in:
- iCloud Drive
- Dropbox
- OneDrive
- Any other cloud-synced location

This ensures your data is automatically backed up to the cloud.

### Managing Projects

1. Navigate to **Projects** in the sidebar
2. Click **Add Project** to create a new project
3. Enter project details:
   - Name (required)
   - Client name (optional)
   - Hourly rate (optional)

### Tracking Time

1. Navigate to **Time Entries**
2. Click **Add Time Entry**
3. Select a project
4. Choose input mode:
   - **Duration**: Enter total minutes worked
   - **Start/End Times**: Enter specific start and end times
5. Add an optional description
6. Click **Create**

### Generating Reports

1. Navigate to **Reports**
2. Select date range
3. Optionally filter by specific projects
4. Click **Generate Report**
5. Export as CSV or JSON if needed

### Managing Backups

1. Navigate to **Settings**
2. View backup configuration and last backup time
3. Click **Create Backup Now** for manual backups
4. View available backups in the table
5. Click **Restore** to restore from a backup (requires app restart)

## Data Storage

### Database Location

The SQLite database is stored at:
- **macOS**: `~/Library/Application Support/TimeLedger/db.sqlite`
- **Windows**: `%APPDATA%/TimeLedger/db.sqlite`
- **Linux**: `~/.config/TimeLedger/db.sqlite`

### Backup System

- Automatic backups occur every hour
- Backup created on app exit
- Backups are stored in your selected cloud-synced folder
- Backup filename format: `backup-YYYY-MM-DD_HH-mm-ss.sqlite`

## Building for Production

### macOS

```bash
npm run dist:mac
```

This creates:
- DMG installer in `release/`
- ZIP archive in `release/`

### Windows

```bash
npm run dist
```

This creates:
- NSIS installer
- Portable executable

### Linux

```bash
npm run dist
```

This creates:
- AppImage
- DEB package

## Security Considerations

- All data is stored locally on your machine
- No cloud backend or external services
- Backups are plain SQLite files (consider encrypting your cloud storage)
- No authentication required (single-user desktop app)

## Troubleshooting

### Database Locked Error

If you see a "database is locked" error:
1. Close all instances of the app
2. Delete the `-wal` and `-shm` files next to the database
3. Restart the app

### Backup Directory Not Found

If backups fail:
1. Go to Settings
2. Re-select the backup directory
3. Ensure the directory exists and is writable

### App Won't Start

1. Check the console for errors
2. Delete the database and restart (creates fresh database)
3. Restore from a backup if needed

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Roadmap

Future enhancements may include:
- Dark mode
- Keyboard shortcuts
- Invoice generation
- Timer mode (in addition to manual entry)
- Charts and visualizations
- Multi-currency support
- Tags and categories

## Support

For issues and questions, please open an issue on GitHub.

---

Built with ❤️ using Electron and React
