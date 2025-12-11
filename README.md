# TimeLedger

A simple desktop time tracking application for freelancers and side projects. Built with Electron, React, TypeScript, and SQLite.

![TimeLedger](https://img.shields.io/badge/version-1.2.5-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## Features

- **Project Management**: Create and manage projects with optional hourly rates and client names
- **Manual Time Entry**: Track time with either duration or start/end times
- **Invoice Management**: Create draft invoices from unbilled time entries with automatic numbering and status tracking
- **Billing Status Tracking**: Time entries automatically track billing status (unbilled, in draft, invoiced)
- **Dashboard**: Overview with weekly bar charts and key statistics
- **Reporting**: Generate detailed reports by date range and project
- **Export**: Export reports as CSV, JSON, or PDF
- **Multi-Language Support**: Available in English and German
- **Dark/Light Theme**: Toggle between dark and light themes for comfortable viewing
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
- `npm run dist` - Build and package for macOS (ARM64)
- `npm run dist:universal` - Build Universal macOS binary (ARM64 + Intel)
- `npm run postdist` - Clean up auto-update files (runs automatically after dist)
- `npm run clean` - Clean build artifacts (dist/)
- `npm run clean:release` - Clean release directory
- `npm run clean:all` - Clean both dist/ and release/

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

### Creating Invoices

1. Navigate to **Invoices**
2. Click **Create Invoice**
3. Automatic invoice number is generated (format: INV-YYYY-NNN)
4. Select unbilled time entries to include
5. Review total amount (calculated from hourly rates)
6. Save as draft or finalize the invoice
7. Finalized invoices update time entries to "invoiced" status

**Invoice Features:**
- Draft invoices can be edited and entries can be added/removed
- Finalized invoices lock time entries from further billing
- Invoices can be cancelled with a reason (entries return to unbilled status)
- Cross-navigation between invoices and related time entries

### Generating Reports

1. Navigate to **Reports**
2. Select date range
3. Optionally filter by specific projects
4. Click **Generate Report**
5. Export as CSV, JSON, or PDF if needed

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

### Automated Multi-Platform Builds (Recommended)

TimeLedger uses GitHub Actions for automated multi-platform releases:

1. Update version: `npm version <new-version>`
2. Commit and push changes
3. Create and push a version tag: `git tag v1.0.0 && git push origin v1.0.0`
4. GitHub Actions automatically builds for all platforms and creates a release

**What gets built automatically:**
- **macOS**: DMG and ZIP for Intel (x64) and Apple Silicon (arm64)
- **Windows**: NSIS installer and portable EXE (x64)
- **Linux**: AppImage and DEB package (x64)

### Local Manual Builds (macOS only)

#### macOS ARM64 (Apple Silicon)
```bash
npm run dist
```
Creates:
- DMG installer for ARM64
- ZIP archive for ARM64

**This is optimized for local development on Apple Silicon Macs.**

#### macOS Universal Binary (Optional)
```bash
npm run dist:universal
```
Creates a single Universal binary that runs on both Intel and Apple Silicon.

**Note:** For Windows and Linux builds, use GitHub Actions (automatic on tag push).

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
- Keyboard shortcuts and menu navigation improvements
- Timer mode (real-time tracking in addition to manual entry)
- Enhanced charts and visualizations
- Multi-currency support
- Tags and categories for better organization
- Custom invoice templates
- Recurring time entries
- Client portal for invoice sharing

## Support

For issues and questions, please open an issue on GitHub.

---

Built with ❤️ using Electron and React
