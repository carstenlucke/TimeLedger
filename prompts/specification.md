# Time Tracking Desktop App – Specification

## Goal

Build a simple **desktop time tracking application** for macOS (and ideally cross-platform) using **Electron** and **web technologies** (TypeScript/JavaScript, HTML, CSS). The primary use case is tracking working hours for **side projects and freelancing** with **manual time entry**.

The application stores all data **locally** in **SQLite**. A robust backup mechanism copies the SQLite file to a **user‑selected cloud‑synced folder**.

---

## Technology Stack

- **Desktop Shell:** Electron
- **Frontend:** React + TypeScript (preferred)
- **Persistence:** Local SQLite database (e.g., via `better-sqlite3`)
- **Build:** electron-builder or equivalent

---

## Data Model

### Project
- `id`
- `name` (required)
- `hourly_rate` (optional)
- `client_name` (optional)
- `created_at`
- `updated_at`

### TimeEntry
- `id`
- `project_id` (FK)
- `date`
- `start_time` (optional)
- `end_time` (optional)
- `duration_minutes` (required or derived)
- `description` (optional)
- `created_at`
- `updated_at`

---

## Core Features

### Project Management
- Create/edit/delete projects
- List all projects with name, client, and optional rate

### Manual Time Entry
- Manual entry only (no running timers)
- Datepicker for `date`
- Input for:
  - Start/end time **or** duration
- Project selection
- Description/notes (optional)
- Edit/delete entries

### Reporting
- Hours per project in a chosen date range
- Show:
  - Total duration
  - Total value (optional)
- Display results in a table

### Export
- Export as **CSV**
- Export as **JSON** (manual export)

---

## Persistence

- Local SQLite file in:
  - `~/Library/Application Support/<AppName>/db.sqlite` on macOS
- Setup routines create tables if missing

---

## Backup System

### Backup Directory
- On first launch, ask user to choose a **backup folder**
- This folder should ideally be inside:
  - iCloud Drive  
  - Dropbox  
  - OneDrive  
  - NAS or other user-chosen location
- Store the selected path in application settings

### Backup Format
- Copy of the SQLite file, optionally compressed
- Filename format:
  - `backup-YYYY-MM-DD_HH-mm.sqlite`

### Backup Triggers
- **On app exit**
- **Automatically every hour**

### Backup UI
- Screen to show all backups in chosen directory
- Allow user to **select a backup file and restore** it
- Restoration replaces the main SQLite file
- Confirmation dialog required

---

## Application Structure

- `main/`:
  - Electron main process
  - IPC handlers
  - Database access layer
  - Backup logic
- `renderer/`:
  - React components
  - Views for:
    - Projects
    - Time Entries
    - Reporting
    - Settings (including backup directory selection and restore UI)
- `shared/`:
  - Shared type definitions

---

## UX Notes

- Minimalist interface
- Keyboard-friendly forms
- Clear navigation:
  - Projects
  - Time Entries
  - Reports
  - Settings

---

## Out of Scope for v1
- No auth
- No automatic timers
- No cloud backend
- No invoicing
- No multi-device sync (backups only)

---

## Deliverables for the Coding Agent
- Generate full project scaffold
- Implement Electron + React app
- Implement SQLite persistence
- Implement backup/restore system
- Implement CSV/JSON export
- Provide build scripts for macOS
