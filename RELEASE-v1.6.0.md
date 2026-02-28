# TimeLedger v1.6.0 Release Notes

**TimeLedger v1.6.0** is a feature-packed release that introduces customer management, external invoice support, tax handling, and a wide range of usability improvements across the entire app.

## 👥 Customer Management

- **New Customers section** in the sidebar for managing your customer base
- Create and edit customers with name, email, phone, address, and notes
- **Link customers to projects** using an autocomplete field — create new customers inline without leaving the project form
- Customers are fully integrated into **Global Search** and keyboard navigation

## 🧾 Invoice Enhancements

### External Invoices
- Mark invoices as **external** to track invoices issued outside of TimeLedger
- Enter external invoice number, net amount, and gross amount manually
- View the **unbilled difference** between the external net amount and linked time entries

### VAT & Tax Support
- Select a **tax rate** (19%, 7%, or 0%) per invoice
- **Small business mode** (`Kleinunternehmer`) automatically sets tax to 0% and displays a corresponding notice
- Invoice details now show tax rate, calculated tax amount, and gross amount

### Service Period
- Define a **service period** (start and end date) on each invoice
- **Auto-fill from entries**: automatically derives the period from linked time entry dates
- Start and end dates can be set independently — mix auto and manual as needed

### Entry Selection Filters
- When adding time entries to an invoice, filter by **project** and **date range**
- Quickly narrow down unbilled entries before selecting them

## 📊 Dashboard & Analytics

- **Weekly chart drill-down**: Click any bar to open a detail drawer showing entries grouped by project, with click-through to individual entries
- **Percentage labels** on project status and revenue donut charts
- **Project lifecycle KPIs**: New donut charts for project status distribution (Active, Completed, Paused) and revenue breakdown by status
- **Unbilled revenue card**: At-a-glance total of unbilled hours and revenue

## ⚡ Usability Improvements

- **Double-click to edit** in all tables — Customers, Projects, Time Entries, and Invoices
- **Duration picker**: Visual grid of hours and minutes for faster time entry, with optional manual input
- **Sortable columns** across all tables with clear visual indicators
- **Window position & size** are now remembered across app restarts
- **Smoother navigation**: Clicking an entry in Dashboard or Global Search now directly opens its edit modal

## ⚙️ Settings

- **Database location** displayed with copy-to-clipboard and open-in-folder actions
- **Schema version** shown in the About section
- **Backup interval** displayed dynamically instead of a static label

## 📦 Installation

### macOS
- **TimeLedger-1.6.0-universal.dmg** — Universal Binary for Intel and Apple Silicon Macs
- **TimeLedger-1.6.0-universal-mac.zip** — Portable version

### Windows
- **TimeLedger.Setup.1.6.0.exe** — Standard installer
- **TimeLedger.1.6.0.exe** — Portable version (no installation required)

### Linux
- **TimeLedger.1.6.0.AppImage** — Universal Linux binary

## 🙏 Thank You

Thank you for using TimeLedger! If you encounter any issues or have feature requests, please [open an issue on GitHub](https://github.com/carstenlucke/TimeLedger/issues).

---

**Full Changelog**: https://github.com/carstenlucke/TimeLedger/compare/v1.5.0...v1.6.0
