# Datenbank-Migrationen

TimeLedger verwendet ein eigenes, leichtgewichtiges Migrations-System für SQLite, das Schema-Änderungen versioniert und automatisch beim App-Start ausführt.

## Übersicht

Das Migrations-System stellt sicher, dass:
- Neue Nutzer eine vollständig initialisierte Datenbank erhalten
- Bestehende Nutzer bei App-Updates automatisch Schema-Änderungen erhalten
- Bestehende Daten bei Migrationen erhalten bleiben
- Fehlgeschlagene Migrationen sauber zurückgerollt werden

## Architektur

```
src/main/migrations/
├── index.ts              # MigrationRunner Klasse + Migration-Registry
├── 001_initial_schema.ts # Basis-Schema
├── 002_add_invoices.ts   # Invoices-Feature
├── 003_add_billing_status.ts
└── 004_add_project_status.ts
```

### Komponenten

**MigrationRunner** (`index.ts`)
- Verwaltet die `schema_migrations`-Tabelle
- Erkennt ausstehende Migrationen
- Führt Migrationen in Transaktionen aus
- Bootstrap-Logik für bestehende Datenbanken

**Migration Interface**
```typescript
interface Migration {
  version: number;    // Eindeutige, aufsteigende Versionsnummer
  name: string;       // Beschreibender Name (snake_case)
  up: (db: Database.Database) => void;  // Migrations-Logik
}
```

## Schema-Versionierung

Die `schema_migrations`-Tabelle trackt alle angewendeten Migrationen:

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| version | INTEGER | Primärschlüssel, Versionsnummer |
| name | TEXT | Name der Migration |
| applied_at | TEXT | Zeitstempel der Anwendung |

## Ablauf beim App-Start

```
┌─────────────────────────────────────┐
│         App startet                 │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Datenbank öffnen/erstellen         │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Bestehende DB erkennen?            │
│  (Hat Tabellen aber keine           │
│   schema_migrations)                │
└──────────────┬──────────────────────┘
               │
        Ja     │     Nein
    ┌──────────┴──────────┐
    ▼                     ▼
┌────────────┐    ┌──────────────────┐
│ Bootstrap: │    │                  │
│ Versions-  │    │                  │
│ erkennung  │    │                  │
└─────┬──────┘    │                  │
      │           │                  │
      ▼           │                  │
┌────────────┐    │                  │
│ Migrations │    │                  │
│ als applied│    │                  │
│ markieren  │    │                  │
└─────┬──────┘    │                  │
      │           │                  │
      └─────┬─────┘                  │
            │                        │
            ▼                        │
┌─────────────────────────────────────┐
│  Ausstehende Migrationen ermitteln  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Für jede ausstehende Migration:    │
│  1. Transaktion starten             │
│  2. up() ausführen                  │
│  3. In schema_migrations eintragen  │
│  4. Transaktion committen           │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│         App bereit                  │
└─────────────────────────────────────┘
```

## Neue Migration erstellen

### 1. Migrations-Datei anlegen

```typescript
// src/main/migrations/005_add_feature_x.ts
import type { Migration } from './index';
import type Database from 'better-sqlite3';

export const migration005: Migration = {
  version: 5,
  name: 'add_feature_x',
  up: (db: Database.Database) => {
    // Neue Tabelle erstellen
    db.exec(`
      CREATE TABLE IF NOT EXISTS feature_x (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Oder: Spalte hinzufügen (mit Existenz-Check)
    const columns = db.pragma('table_info(existing_table)') as { name: string }[];
    if (!columns.some(col => col.name === 'new_column')) {
      db.exec(`ALTER TABLE existing_table ADD COLUMN new_column TEXT`);
    }

    // Index erstellen
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_feature_x_name ON feature_x(name)
    `);
  },
};
```

### 2. Migration registrieren

In `src/main/migrations/index.ts`:

```typescript
// Import hinzufügen
import { migration005 } from './005_add_feature_x';

// Zum Array hinzufügen
export const migrations: Migration[] = [
  migration001,
  migration002,
  migration003,
  migration004,
  migration005,  // Neu
];
```

### 3. TypeScript-Typen aktualisieren

Falls neue Felder zu bestehenden Interfaces hinzukommen, `src/shared/types.ts` anpassen.

## Best Practices

### Idempotenz

Migrationen sollten idempotent sein - mehrfache Ausführung sollte sicher sein:

```typescript
// Gut: Mit IF NOT EXISTS
db.exec(`CREATE TABLE IF NOT EXISTS ...`);
db.exec(`CREATE INDEX IF NOT EXISTS ...`);

// Gut: Mit Existenz-Check für Spalten
const columns = db.pragma('table_info(table_name)') as { name: string }[];
if (!columns.some(col => col.name === 'column_name')) {
  db.exec(`ALTER TABLE table_name ADD COLUMN column_name ...`);
}

// Schlecht: Ohne Check
db.exec(`ALTER TABLE table_name ADD COLUMN column_name ...`);
// -> Fehler wenn Spalte bereits existiert
```

### Transaktionssicherheit

- Jede Migration läuft automatisch in einer Transaktion
- Bei Fehler wird die gesamte Migration zurückgerollt
- Komplexe Datenmigrationen in mehrere Schritte aufteilen

### Abwärtskompatibilität

- Spalten mit `DEFAULT`-Wert hinzufügen
- Alte Spalten nicht löschen, nur neue hinzufügen
- Bei breaking Changes: Daten transformieren

```typescript
// Beispiel: Daten transformieren
up: (db: Database.Database) => {
  // 1. Neue Spalte hinzufügen
  db.exec(`ALTER TABLE users ADD COLUMN full_name TEXT`);

  // 2. Daten migrieren
  db.exec(`
    UPDATE users
    SET full_name = first_name || ' ' || last_name
    WHERE full_name IS NULL
  `);
}
```

### Versionsnummern

- Immer aufsteigend und eindeutig
- Keine Lücken in der Nummerierung
- Bei paralleler Entwicklung: Abstimmen vor Merge

## API-Referenz

### DatabaseManager

```typescript
// Aktuelle Schema-Version abrufen
db.getSchemaVersion(): number

// Prüfen ob Migrationen ausstehen
db.hasPendingMigrations(): boolean

// Migrations-Info abrufen
db.getMigrationInfo(): {
  currentVersion: number;
  latestVersion: number;
  appliedMigrations: { version: number; name: string; applied_at: string }[];
}
```

### MigrationRunner

```typescript
// Migrationen ausführen (automatisch beim Start)
runner.runMigrations(): { applied: number; currentVersion: number }

// Aktuelle Version abrufen
runner.getCurrentVersion(): number

// Neueste verfügbare Version
runner.getLatestVersion(): number

// Liste angewendeter Migrationen
runner.getAppliedMigrations(): { version: number; name: string; applied_at: string }[]

// Prüfen ob Migrationen nötig
runner.needsMigration(): boolean
```

## Fehlerbehebung

### Migration schlägt fehl

1. Fehler in der Konsole prüfen
2. Migrations-Code korrigieren
3. App neu starten (Migration wird erneut versucht)

### Datenbank zurücksetzen (Entwicklung)

```bash
# Datenbank-Datei löschen
rm ~/Library/Application\ Support/TimeLedger/db.sqlite
rm ~/Library/Application\ Support/TimeLedger/db.sqlite-wal
rm ~/Library/Application\ Support/TimeLedger/db.sqlite-shm
```

### Schema manuell prüfen

```bash
sqlite3 ~/Library/Application\ Support/TimeLedger/db.sqlite

# Tabellen anzeigen
.tables

# Schema einer Tabelle
.schema projects

# Migrationen anzeigen
SELECT * FROM schema_migrations ORDER BY version;
```

## Aktuelle Migrationen

| Version | Name | Beschreibung |
|---------|------|--------------|
| 1 | initial_schema | Basis-Tabellen (projects, time_entries, settings, meta) |
| 2 | add_invoices | Invoices-Tabelle, invoice_id in time_entries |
| 3 | add_billing_status | billing_status Spalte in time_entries |
| 4 | add_project_status | status Spalte in projects (active/completed/paused) |
