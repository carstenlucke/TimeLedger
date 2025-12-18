# TimeLedger User Guide

Welcome to TimeLedger! This guide describes the features and functionality of the application.

## Table of Contents

1. [Overview](#overview)
2. [Dashboard](#dashboard)
3. [Project Management](#project-management)
4. [Time Tracking](#time-tracking)
5. [Invoice Management](#invoice-management)
6. [Reports](#reports)
7. [Backups and Data Safety](#backups-and-data-safety)
8. [Settings](#settings)
9. [Tips and Best Practices](#tips-and-best-practices)

## Overview

TimeLedger is a desktop time tracking application designed for freelancers and side projects. It provides manual time entry (no running timers), project-based tracking, invoice management, and comprehensive reporting capabilities.

### Application Structure

The application consists of six main sections accessible via the sidebar:

- **Dashboard**: Visual overview of time tracking activity
- **Projects**: Project and client management
- **Time Entries**: Manual time recording
- **Invoices**: Invoice creation and management
- **Reports**: Detailed time tracking reports with export options
- **Settings**: Application configuration and backup management

### Data Storage

All data is stored locally in a SQLite database located in your system's application data directory:
- **macOS**: `~/Library/Application Support/TimeLedger/db.sqlite`
- **Windows**: `%APPDATA%/TimeLedger/db.sqlite`
- **Linux**: `~/.config/TimeLedger/db.sqlite`

### First Launch Setup

On first launch, you'll be prompted to select a backup directory. Choose a cloud-synced folder (iCloud Drive, Dropbox, OneDrive) to ensure automatic backup synchronization across devices.

## Dashboard

The Dashboard provides a visual overview of your time tracking activity.

### Stacked Bar Chart

The chart displays weekly time tracking data for the last 10 calendar weeks:
- Each bar represents one calendar week (Monday to Sunday)
- Bars are stacked by project with color-coded segments
- Total hours are displayed above each bar
- ISO week numbers are shown below each bar
- A legend identifies which color represents each project
- Empty weeks appear as gaps in the chart

The chart helps identify work patterns, busy periods, and project distribution over time.

### Recent Time Entries

A table displays the 10 most recent time entries with complete details:
- Date, project name, start time, end time, duration, and description
- Entries are clickable for quick editing
- Hover effects provide visual feedback
- The table provides quick access to review and modify recent work

### Empty State

When no time has been tracked yet, the dashboard displays a message encouraging you to start tracking time.

## Project Management

Projects organize your time tracking by client or deliverable. Each project can have an optional hourly rate and client name.

### Project Properties

**Required:**
- **Name**: Descriptive identifier (e.g., "Website Redesign", "Client Project Alpha")

**Optional:**
- **Client Name**: Associated client or organization
- **Hourly Rate**: Rate for calculating billable amounts (stored as decimal, e.g., 75.00)

### Project Operations

**Creating Projects**: Add new projects by providing a name and optional client/rate information.

**Editing Projects**: Modify any project property at any time. Changes affect future calculations but not historical data.

**Deleting Projects**: Remove projects when no longer needed. All associated time entries are also deleted (cascade delete).

### Best Practices

- Use clear, descriptive project names for easy identification
- Set hourly rates even for fixed-price projects to track opportunity cost
- Include client names to organize multi-client workloads
- Archive completed projects by exporting data before deletion

## Time Tracking

TimeLedger uses manual time entry rather than running timers. Time is recorded after work sessions are completed.

### Time Entry Properties

Each time entry contains:
- **Project**: Associated project (required)
- **Date**: Date of work performed (required)
- **Duration**: Total time in minutes (required)
- **Start Time**: Optional start time
- **End Time**: Optional end time
- **Description**: Optional work description
- **Billing Status**: Automatically managed (unbilled, in_draft, invoiced)
- **Invoice ID**: Automatically set when added to an invoice

### Duration Input Methods

**Duration Entry (Recommended for most cases):**
- Enter total minutes worked directly
- Example: 90 minutes = 1.5 hours
- Best for completed work sessions and quick entries

**Start/End Times:**
- Enter specific start and end times
- Duration is calculated automatically
- Best for precise time tracking and billable work requiring exact times
- Example: Start 09:00, End 11:30 = 150 minutes

### Billing Status

Time entries have three billing statuses:
- **Unbilled**: Available to add to invoices (default)
- **In Draft**: Added to a draft invoice, can still be edited
- **Invoiced**: Part of a finalized invoice, locked from editing

### Time Entry Filtering

Time entries can be filtered by:
- Project
- Date range
- Billing status
- Search terms in descriptions

### Editing and Deletion

Time entries can be edited or deleted unless they are in "invoiced" status. Invoiced entries must first be released by cancelling the associated invoice.

## Invoice Management

TimeLedger helps create and manage invoices from tracked time entries. The invoice system tracks billing status and prevents double-billing.

### Invoice Properties

Each invoice contains:
- **Invoice Number**: Auto-generated sequential number (format: INV-YYYY-NNN)
- **Invoice Date**: Date the invoice was created
- **Status**: Draft, Invoiced, or Cancelled
- **Total Amount**: Automatically calculated from time entries and hourly rates
- **Notes**: Optional invoice notes or terms
- **Cancellation Reason**: Required if invoice is cancelled
- **Time Entries**: Associated time entries

### Invoice Numbering

Invoice numbers are automatically generated in the format INV-YYYY-NNN:
- Year resets the counter annually
- Numbers increment sequentially
- Cannot be manually changed to ensure consistency
- Example: INV-2025-001, INV-2025-002, etc.

### Invoice Status Workflow

**Draft Status:**
- Initial status when created
- Entries can be added or removed
- Invoice details can be edited
- Time entries are marked as "in_draft"
- Total amount updates automatically

**Invoiced Status:**
- Reached by finalizing a draft invoice
- Invoice is locked and cannot be edited
- Associated time entries are marked as "invoiced"
- Entries cannot be deleted or modified
- Entries cannot be added to other invoices

**Cancelled Status:**
- Reached by cancelling a finalized invoice
- Requires a cancellation reason
- Associated time entries return to "unbilled" status
- Entries become available for re-invoicing
- Invoice record is preserved for audit trail

### Creating Invoices

Invoices are created from unbilled time entries:
- Select unbilled entries to include
- System generates next invoice number automatically
- Total amount calculated from entry durations and project hourly rates
- Entries without hourly rates contribute zero value but are still tracked
- Save as draft for further editing or finalize immediately

### Managing Draft Invoices

Draft invoices support:
- Adding more unbilled entries
- Removing entries (returns them to unbilled status)
- Editing invoice date and notes
- Recalculation of totals when entries change

### Finalizing Invoices

Finalizing converts a draft to an invoiced status:
- Locks all associated time entries
- Prevents further modifications
- Marks entries as "invoiced" in billing status
- Cannot be undone (only cancelled)

### Cancelling Invoices

Cancelled invoices:
- Require a cancellation reason for record-keeping
- Release time entries back to unbilled status
- Preserve the invoice record
- Allow entries to be re-invoiced
- Common reasons: payment issues, project changes, corrections needed

### Cross-Navigation

The invoice system supports navigation between related items:
- Time entries display invoice numbers when billed
- Invoice numbers are clickable to view invoice details
- Invoices show all included entries
- Entries can be clicked to navigate to the time entries page with filtering

## Reports

Reports provide detailed analysis of time tracking data with flexible filtering and export options.

### Report Filtering

Reports can be filtered by:
- **Date Range**: Start and end dates (defaults to current month)
- **Projects**: Include all or select specific projects
- **Empty filter**: Includes all projects and data

### Report Contents

Generated reports include:

**Summary Information:**
- Total hours tracked
- Total billable value (based on hourly rates)

**Per-Project Breakdown:**
- Project name and client
- Total hours for each project
- Total value per project (hours × hourly rate)
- Detailed list of all time entries for each project

**Time Entry Details:**
- Date, start time, end time, duration
- Description
- Individual calculations

### Export Formats

Reports can be exported in three formats:

**CSV (Comma-Separated Values):**
- Spreadsheet-compatible format
- Opens in Excel, Google Sheets, Numbers
- Includes individual entries and summary data
- Best for further analysis or manipulation
- Can be imported into invoicing/accounting software

**JSON (JavaScript Object Notation):**
- Structured data format
- Machine-readable
- Preserves data types and relationships
- Useful for integrations, custom processing, or backups
- Contains complete project and entry information

**PDF (Portable Document Format):**
- Professional formatted reports
- Ready to share with clients
- Includes summary cards and project breakdowns
- Print-ready format
- Automatically saved to Downloads folder
- Filename format: `timeledger-report-YYYY-MM-DD.pdf`

## Backups and Data Safety

TimeLedger includes automatic and manual backup functionality to protect your data.

### Automatic Backups

The application creates backups automatically when data has changed since the last backup:
- **Hourly**: While the application is running
- **On Exit**: When closing the application

Backups are SQLite database copies stored in your selected backup directory with filename format: `backup-YYYY-MM-DD_HH-mm-ss.sqlite`

### Backup Directory

The backup directory should be:
- A cloud-synced folder (iCloud Drive, Dropbox, OneDrive)
- Accessible and writable
- Monitored by your cloud storage provider

Benefits of cloud-synced backups:
- Automatic off-site backup
- Access from multiple devices
- Protection against local drive failure
- Version history via cloud provider

### Manual Backups

Manual backups can be created at any time (even if no data changed), useful:
- Before making major changes
- After entering important data
- Before restoring from an old backup
- Before application updates

### Backup Management

The Settings page displays:
- Current backup directory path
- Last backup timestamp
- List of available backups with filename, date, and size

### Restoring from Backup

Restoring replaces the current database with a backup copy:
- Current data is automatically backed up before restore
- Application must be restarted after restore
- All current data is replaced with backup data
- Use with caution—restoration cannot be undone

### Backup File Format

Backups are plain SQLite database files:
- Can be opened with SQLite tools
- Can be queried directly if needed
- Compatible with database management tools
- Can be copied to multiple locations manually

## Settings

The Settings page provides configuration options and application information.

### Theme Preferences

Toggle between light and dark themes:
- Light mode: High contrast, suitable for bright environments
- Dark mode: Reduced eye strain, suitable for low light
- Preference is saved in localStorage
- Applies immediately without restart

### Language Preferences

Select your preferred language:
- **English**: Default language
- **German (Deutsch)**: Complete German translation

Language changes apply immediately to all interface elements.

### Backup Configuration

Configure backup settings:
- View current backup directory
- Change backup directory
- View last backup timestamp
- Create manual backups
- View available backup list
- Restore from backups

### Application Information

View application metadata:
- Version number
- License information
- Contact information

## Tips and Best Practices

### Time Tracking

- Record time daily rather than weekly for accuracy and completeness
- Choose either duration or start/end times and use consistently
- Add meaningful descriptions for future reference and client reporting
- Round to 15-minute increments when required by clients
- Track non-billable time (meetings, admin work) for productivity analysis

### Project Organization

- Create one project per client or major deliverable
- Set hourly rates even for fixed-price projects to track opportunity cost
- Use descriptive names that remain meaningful over time
- Export data before deleting completed projects

### Invoice Management

- Create invoices weekly or bi-weekly for steady cash flow
- Review all entries and totals before finalizing
- Add payment terms and project references in notes field
- Document clear cancellation reasons for audit trail

### Reporting

- Generate weekly reports to monitor productivity and billing
- Run reports before creating invoices to verify completeness
- Export important reports as PDF/CSV for permanent records
- Use consistent date ranges (weekly, monthly, quarterly) for trend analysis
- Use PDF export for professional client-facing reports

### Data Safety

- Verify backup directory is actively syncing to cloud storage
- Test backup restoration periodically by checking file sizes and dates
- Copy critical backups to additional locations manually
- Create manual backup before major application updates
- Review backup list regularly to ensure backups are being created

### Common Workflows

- **Daily Routine:** Check Dashboard → Record completed work → Review entries for accuracy
- **Weekly Invoicing:** Review unbilled entries → Create invoice → Verify totals → Finalize → Export report
- **Monthly Review:** Generate monthly report → Review project distribution → Identify trends → Export for records
- **Project Completion:** Generate final report → Export as PDF and CSV → Create manual backup → Archive or delete project

## Keyboard and Navigation

**Form Navigation:**
- Tab: Move between form fields
- Enter: Submit forms
- Escape: Close dialogs (by clicking outside)

**Application Controls:**
- Cmd/Ctrl + ,: Open Settings (from menu)
- Cmd/Ctrl + Q: Quit application

**Mouse Interaction:**
- Hover: Visual highlighting on interactive elements
- Click: Navigate, edit, or perform actions
- Click outside: Close modal dialogs

## Troubleshooting

### Common Issues

- **"No projects available" when adding time entries:** Create at least one project before tracking time
- **Cannot export report:** Generate a report first, then export buttons will appear
- **Backup directory not configured:** Select a backup directory in Settings to enable automatic backups
- **Application performance:** Large databases (thousands of entries) may slow down. Consider archiving old data by exporting and deleting
- **Lost data:** Restore from most recent backup in Settings. Application restart required after restore
- **Database locked error:** Close all instances of the app, delete .db-wal and .db-shm files next to database, restart app

### Advanced Usage

**Direct Database Access:**
Advanced users can query the database directly using SQLite tools:
```bash
sqlite3 ~/Library/Application\ Support/TimeLedger/db.sqlite
```

**Database Tables:**
- `projects`: All projects
- `time_entries`: All time entries (includes invoice_id and billing_status)
- `invoices`: All invoices (draft, invoiced, cancelled)
- `settings`: Application settings

**Backup Files:**
Backups are standard SQLite files that can be:
- Opened with any SQLite tool
- Queried directly for data extraction
- Backed up to multiple locations
- Versioned using your own system

## Getting Help

For issues or questions:
1. Check this user guide for feature explanations
2. Review README.md for technical information
3. Check GitHub repository for known issues
4. Create a new issue with detailed description

---

**Happy time tracking!** 🎉
