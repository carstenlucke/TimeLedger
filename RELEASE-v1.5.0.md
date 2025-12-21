# TimeLedger v1.5.0 Release Notes

We're excited to announce **TimeLedger v1.5.0**, our biggest update yet! This release includes major improvements to usability, internationalization, and productivity features.

## 🌍 Internationalization

### Localized Date Formatting
- **Date displays** now automatically format according to your language settings
  - German: DD.MM.YYYY (e.g., 20.12.2025)
  - English: DD/MM/YYYY (e.g., 20/12/2025)
- **Date pickers** show localized format while maintaining native browser functionality
- Affects all views: Time Entries, Invoices, Reports, Projects, Dashboard, and Settings

## ⌨️ Keyboard Shortcuts

Boost your productivity with new keyboard shortcuts:
- **Cmd/Ctrl + N**: Create new time entry
- **Cmd/Ctrl + F**: Focus search field
- **Cmd/Ctrl + Enter**: Submit forms in modals
- **Escape**: Close modals and overlays
- **F**: Quick focus search (when not typing)

## 🔍 Global Search

- **Unified search** across Projects, Time Entries, and Invoices
- **Quick access** to any record from anywhere in the app
- **Inline search filters** in project, entry, and invoice lists
- Navigate directly to entries and invoices from search results

## 🧾 Invoice Management

- **Full invoice workflow** with draft, invoiced, and cancelled states
- **Time entry integration** - easily add unbilled entries to invoices
- **Cross-navigation** between invoices and time entries
- **Invoice details view** with entry breakdowns and totals
- Automatic invoice numbering

## 📋 Copy to Clipboard

- **Single entry copy**: Click the copy icon on any time entry
- **Bulk copy**: Select multiple entries and copy them at once
- **Copy all visible**: Export filtered results to clipboard
- Formatted output with project grouping and duration summaries

## 🎨 Theme System

- **Multiple color themes**: Default, Neon, and Pastel
- **Theme switcher** in Settings
- Consistent styling across all views
- Icons updated to use lucide-react set for better consistency

## 📊 Reports & Dashboard

- **Hours/Revenue toggle** on weekly chart - switch between viewing hours worked or revenue generated
- **No date restriction by default** - reports now show all-time data unless filtered
- **CSV export improvements** - adjusted separator for better compatibility
- Removed PDF export (was rarely used)

## 💾 Backup Optimizations

- **Smart backups** - only create backups when data has changed
- **Backup counter** displayed in Settings header
- Better performance on app quit

## 🐛 Bug Fixes

- Fixed version number display in Settings
- Fixed better-sqlite3 rebuild for local architecture after dist
- Various TypeScript warnings resolved
- UI/UX consistency improvements across multiple views

## 📦 Installation

### macOS
- **TimeLedger-1.5.0-universal.dmg** - Universal Binary for Intel and Apple Silicon Macs
- **TimeLedger-1.5.0-universal-mac.zip** - Portable version

### Windows
- **TimeLedger.Setup.1.5.0.exe** - Standard installer
- **TimeLedger.1.5.0.exe** - Portable version (no installation required)

### Linux
- **TimeLedger.1.5.0.AppImage** - Universal Linux binary

## 🙏 Thank You

Thank you for using TimeLedger! If you encounter any issues or have feature requests, please [open an issue on GitHub](https://github.com/carstenlucke/TimeLedger/issues).

---

**Full Changelog**: https://github.com/carstenlucke/TimeLedger/compare/v1.2.5...v1.5.0
