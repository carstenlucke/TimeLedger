# TimeLedger User Guide

Welcome to TimeLedger! This guide will help you get started with tracking your time effectively.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Managing Projects](#managing-projects)
3. [Tracking Time](#tracking-time)
4. [Generating Reports](#generating-reports)
5. [Backups and Data Safety](#backups-and-data-safety)
6. [Tips and Best Practices](#tips-and-best-practices)

## Getting Started

### First Launch

When you first open TimeLedger, you'll be prompted to select a backup directory. This is important for data safety!

**Recommended locations:**
- iCloud Drive folder (macOS)
- Dropbox folder
- OneDrive folder
- Any folder that syncs to cloud storage

**Why this matters:**
- Your data is automatically backed up hourly
- You can restore data if something goes wrong
- Your backups are synced across devices via your cloud storage

### Understanding the Interface

TimeLedger has four main sections accessible from the sidebar:

1. **Projects**: Manage your projects and clients
2. **Time Entries**: Record your working hours
3. **Reports**: View and export time tracking reports
4. **Settings**: Configure backups, change theme, and view app information

### Customizing the Theme

TimeLedger supports both light and dark themes:

1. Go to **Settings**
2. Find the **Theme** section
3. Click the toggle button to switch between light and dark mode
4. Your preference is automatically saved and will persist across app restarts

## Managing Projects

### Creating a Project

1. Click **Projects** in the sidebar
2. Click the **Add Project** button
3. Fill in the project details:
   - **Name** (required): e.g., "Website Redesign", "Client Project"
   - **Client Name** (optional): e.g., "Acme Corp"
   - **Hourly Rate** (optional): e.g., "75.00" for $75/hour
4. Click **Create**

**Tips:**
- Set an hourly rate if you bill by the hour
- Use clear, descriptive project names
- Include the client name for better organization

### Editing a Project

1. Find the project in the list
2. Click **Edit**
3. Make your changes
4. Click **Update**

### Deleting a Project

1. Find the project in the list
2. Click **Delete**
3. Confirm the deletion

**⚠️ Warning:** Deleting a project also deletes all associated time entries!

## Tracking Time

TimeLedger uses **manual time entry** (no running timers). You record time after you've finished working.

### Adding a Time Entry

1. Click **Time Entries** in the sidebar
2. Click **Add Time Entry**
3. Select the **Project**
4. Set the **Date** (defaults to today)
5. Choose how to enter time:

#### Option 1: Duration (Recommended for most cases)

1. Select **Duration** radio button
2. Enter total minutes worked
3. Example: "90" for 1.5 hours

**Best for:**
- Tracking completed work sessions
- Simple, quick entries
- When exact times don't matter

#### Option 2: Start/End Times

1. Select **Start/End Times** radio button
2. Enter start time (e.g., "09:00")
3. Enter end time (e.g., "11:30")
4. Duration is calculated automatically

**Best for:**
- When you know exact working hours
- Billable work requiring precise times
- Client reporting

6. Add a **Description** (optional but recommended)
   - Example: "Implemented user authentication"
   - Example: "Client meeting and requirements gathering"

7. Click **Create**

### Editing a Time Entry

1. Find the entry in the list
2. Click **Edit**
3. Make your changes
4. Click **Update**

### Deleting a Time Entry

1. Find the entry in the list
2. Click **Delete**
3. Confirm the deletion

## Generating Reports

Reports help you understand how you've spent your time and calculate billable amounts.

### Creating a Report

1. Click **Reports** in the sidebar
2. Set the **Start Date** and **End Date**
   - Defaults to current month
   - Example: Last week, last month, last quarter
3. (Optional) Select specific projects to include
   - Leave empty to include all projects
4. Click **Generate Report**

### Understanding Report Results

The report shows:

**Summary Cards:**
- **Total Hours**: Sum of all tracked time
- **Total Value**: Revenue based on hourly rates (if set)

**Per-Project Breakdown:**
- Project name and client
- Total hours worked
- Total value (hours × hourly rate)
- Detailed list of all time entries

### Exporting Reports

After generating a report, you can export it in three formats:

1. Click **Export CSV** for spreadsheet-compatible format
   - Opens in Excel, Google Sheets, etc.
   - Includes detailed entries and summary
2. Click **Export JSON** for structured data
   - Useful for custom processing or integrations
   - Machine-readable format
3. Click **Export PDF** for professional reports
   - Ready-to-share format
   - Includes formatted summary and detailed breakdowns
   - Perfect for client deliverables

**CSV Format:**
- Individual time entries with all details
- Summary section at the bottom
- Easy to import into invoicing software

**JSON Format:**
- Complete structured data
- Includes all project and entry information
- Preserves data types and relationships

**PDF Format:**
- Professional, formatted report
- Includes summary cards and per-project breakdowns
- Print-ready for client presentations
- Automatically saved to your Downloads folder

## Backups and Data Safety

### Automatic Backups

TimeLedger automatically backs up your data:

- **Every hour** while the app is running
- **On app exit** when you close the application

Backups are copied to your selected cloud-synced folder.

### Manual Backups

To create a backup immediately:

1. Go to **Settings**
2. Click **Create Backup Now**
3. Wait for confirmation

**When to use manual backups:**
- Before making major changes
- After entering important data
- Before restoring an old backup

### Viewing Backups

1. Go to **Settings**
2. Scroll to **Available Backups** section
3. View list of all backups with:
   - Filename (includes date/time)
   - Creation date
   - File size

### Restoring from Backup

If you need to restore your data:

1. Go to **Settings**
2. Find the backup you want to restore
3. Click **Restore**
4. Confirm the action (reads the warning!)
5. **Restart the application** for changes to take effect

**⚠️ Important:**
- Restoring replaces ALL current data
- A backup of current data is created before restoring
- You must restart the app after restoring

### Changing Backup Directory

1. Go to **Settings**
2. Click **Select Directory**
3. Choose a new folder
4. Future backups will be saved there
5. Old backups remain in the previous location

## Tips and Best Practices

### Time Tracking

1. **Track time daily**: Don't wait until the end of the week
2. **Be consistent**: Use either duration or start/end times, not both
3. **Add descriptions**: Future you will thank you
4. **Round appropriately**: Most clients expect 15-minute increments
5. **Track non-billable time**: Meetings, admin work, etc.

### Project Organization

1. **One project per client**: Or per major deliverable
2. **Set hourly rates**: Even for estimates
3. **Use clear names**: "Website" vs "Acme Corp Website Redesign"
4. **Archive completed projects**: Delete only if absolutely certain

### Reporting

1. **Weekly reviews**: Generate weekly reports to stay on top of work
2. **Invoice preparation**: Run reports before creating invoices
3. **Export regularly**: Keep CSV/PDF backups of major milestones
4. **Date ranges**: Use consistent periods (weekly, monthly)
5. **PDF for clients**: Use PDF export for professional client-facing reports

### Data Safety

1. **Check backup directory**: Ensure it's actually syncing to cloud
2. **Test restores**: Occasionally verify backups work
3. **Multiple backup locations**: Consider copying important backups elsewhere
4. **Before major updates**: Create manual backup

### Keyboard Shortcuts

While TimeLedger doesn't have custom shortcuts yet, you can use:

- **Tab**: Navigate between form fields
- **Enter**: Submit forms
- **Esc**: Close modals (click outside)
- **Cmd/Ctrl + ,**: Open Settings (from menu)
- **Cmd/Ctrl + Q**: Quit application

## Common Workflows

### Freelancer Daily Routine

1. Open TimeLedger
2. For each work session completed:
   - Add Time Entry
   - Select project
   - Enter duration or times
   - Add description of work done
3. At end of day, review entries for accuracy

### Weekly Invoicing

1. Go to Reports
2. Set date range to last week
3. Select client's project(s)
4. Generate Report
5. Export as PDF or CSV
6. Send PDF to client or use data to create invoice

### Monthly Review

1. Go to Reports
2. Set date range to last month
3. Include all projects
4. Generate Report
5. Review total hours and distribution
6. Export for records

### Project Completion

1. Generate final report for project
2. Export as PDF for client and CSV/JSON for records
3. Create manual backup
4. Review all time entries for accuracy
5. Archive or delete project

## Troubleshooting

### "No projects available" in Time Entries

**Solution:** Create a project first before tracking time

### Cannot export report

**Solution:** Generate a report first, then export buttons will appear

### Backup directory showing as "Not configured"

**Solution:** Go to Settings and click "Select Directory"

### App feels slow

**Solution:**
- Check number of time entries (1000s may slow down)
- Create a new database and restore from backup
- Archive old data by exporting and deleting

### Lost data

**Solution:**
1. Don't panic - check backups
2. Go to Settings
3. Find most recent backup
4. Click Restore
5. Restart app

## Getting Help

If you encounter issues:

1. Check this user guide
2. Review the README.md for technical details
3. Check the GitHub issues page
4. Create a new issue with details

## Advanced Usage

### Database Location

Your data is stored in a SQLite database at:
- **macOS**: `~/Library/Application Support/TimeLedger/db.sqlite`
- **Windows**: `%APPDATA%/TimeLedger/db.sqlite`
- **Linux**: `~/.config/TimeLedger/db.sqlite`

### Direct Database Access

Advanced users can query the database directly using SQLite tools:

```bash
sqlite3 ~/Library/Application\ Support/TimeLedger/db.sqlite
```

**Tables:**
- `projects`: All projects
- `time_entries`: All time entries
- `settings`: Application settings

### Backup File Format

Backups are plain SQLite database files:
- Can be opened with any SQLite tool
- Can be queried directly
- Can be backed up to multiple locations

---

**Happy time tracking!** 🎉
