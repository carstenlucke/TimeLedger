# TimeLedger v1.2.5 Release Notes

We're excited to announce the **first official release** of **TimeLedger** - a simple yet powerful desktop time tracking application designed for freelancers and side projects!

## ✨ Core Features

### ⏱️ Time Tracking
- **Flexible time entry**: Record time using either duration or start/end times
- **Project-based tracking**: Organize your time entries by projects and clients
- **Detailed descriptions**: Add notes to each time entry for better record keeping
- **Billing status**: Track which entries are unbilled, in draft invoices, or already invoiced

### 📊 Dashboard & Analytics
- **Weekly statistics**: Visual bar chart showing hours worked or revenue generated per week
- **Recent entries**: Quick overview of your latest time entries with click-to-edit functionality
- **Project breakdown**: See time distribution across different projects
- **Revenue tracking**: Monitor your earnings with hourly rate calculations

### 💼 Project Management
- **Client organization**: Associate projects with clients for better structure
- **Hourly rates**: Set different rates per project for accurate revenue tracking
- **Project filtering**: Quickly filter time entries and reports by project
- **Project statistics**: View total hours and revenue per project

### 📈 Reporting
- **Flexible date ranges**: Generate reports for any time period or all-time
- **Project-specific reports**: Filter reports by one or multiple projects
- **Detailed entry listings**: See all time entries included in each report
- **Multiple export formats**:
  - **CSV export**: Import data into Excel or other tools
  - **JSON export**: Machine-readable format for further processing

### 🌍 Internationalization
- **English and German**: Full support for both languages
- **Localized numbers**: Proper thousands separators and decimal points
- **Currency formatting**: Automatic currency symbol placement based on locale
- **Switchable UI**: Change language anytime in Settings

### 🎨 Theming
- **Light and Dark modes**: Choose your preferred visual style
- **Pastel color scheme**: Easy on the eyes with carefully selected colors
- **Persistent preference**: Your theme choice is saved across sessions
- **System-wide styling**: Consistent look across all views

### 💾 Backup System
- **Automatic backups**: Regular backups on application quit
- **Manual backups**: Create backups anytime from Settings
- **Backup management**: View, paginate, and manage your backup files
- **Custom location**: Choose where to store your backups
- **Backup history**: See when backups were created and their file sizes

### 🔔 Notifications
- **In-app notifications**: Visual feedback for all actions
- **Success/Error/Warning**: Different notification types for different events
- **Confirmation dialogs**: Prevent accidental deletions with confirmation prompts
- **Auto-dismiss**: Notifications automatically disappear after a few seconds

### 🖥️ Desktop Integration
- **Native application**: Built with Electron for macOS, Windows, and Linux
- **Menu bar integration**: Standard application menus for each platform
- **Window management**: Proper window handling and navigation
- **Offline-first**: All data stored locally in SQLite database

## 🔧 Technical Highlights

- **TypeScript**: Full type safety throughout the codebase
- **React**: Modern component-based UI architecture
- **Vite**: Fast build tooling and development server
- **SQLite**: Reliable local database with better-sqlite3
- **Electron**: Cross-platform desktop framework

## 📦 Installation

### macOS
- **TimeLedger-1.2.5-arm64.dmg** - Apple Silicon (M1/M2/M3)
- **TimeLedger-1.2.5-arm64-mac.zip** - Apple Silicon portable version
- **TimeLedger-1.2.5.dmg** - Intel Macs
- **TimeLedger-1.2.5-mac.zip** - Intel Macs portable version

### Windows
- **TimeLedger.Setup.1.2.5.exe** - Standard installer
- **TimeLedger.1.2.5.exe** - Portable version (no installation required)

### Linux
- **TimeLedger.1.2.5.AppImage** - Universal Linux binary

## 🚀 Getting Started

1. Download the appropriate installer for your platform
2. Install and launch TimeLedger
3. Create your first project in the Projects view
4. Start tracking time in the Time Entries view
5. View your statistics on the Dashboard
6. Generate reports when needed

## 🔒 Privacy & Data

- **100% local**: All your data stays on your machine
- **No cloud sync**: No external servers or accounts required
- **No tracking**: We don't collect any usage data or analytics
- **Full control**: You own your data - backup and export anytime

## 🐛 Known Issues

This is the first stable release. If you encounter any bugs or have feature suggestions, please [open an issue on GitHub](https://github.com/carstenlucke/TimeLedger/issues).

## 🙏 Thank You

Thank you for trying TimeLedger! We hope it helps you track your time more efficiently and gain better insights into your work.

---

**Note**: Previous version tags (v1.0.0 - v1.2.4) were created during development and represent no releases. This is the first official production release.

**Full Changelog**: https://github.com/carstenlucke/TimeLedger/commits/v1.2.5
