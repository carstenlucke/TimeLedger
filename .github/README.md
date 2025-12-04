# GitHub Actions Workflows

Diese Datei beschreibt die automatisierten Workflows für TimeLedger.

## Release Workflow

**Datei:** `workflows/release.yml`

### Zweck

Dieser Workflow automatisiert den Build- und Release-Prozess für **alle Plattformen** (macOS, Windows, Linux). Er wird ausgelöst, wenn ein neuer Version-Tag ins Repository gepusht wird.

### Trigger

Der Workflow startet bei:
- Tags im Format `v*.*.*` (z.B. `v1.0.0`, `v1.2.3`, `v2.0.0-beta.1`)

### Was der Workflow macht

Der Workflow läuft in zwei Phasen:

#### Phase 1: Build (parallel auf 3 Runnern)

1. **macOS Runner** (macos-latest):
   - Baut für Intel (x64) und Apple Silicon (arm64)
   - Erstellt DMG und ZIP-Dateien

2. **Windows Runner** (windows-latest):
   - Baut für x64
   - Erstellt NSIS Installer und portable EXE

3. **Linux Runner** (ubuntu-latest):
   - Baut für x64
   - Erstellt AppImage und DEB-Paket

#### Phase 2: Release

1. Sammelt alle Build-Artefakte von allen Runnern
2. Erstellt ein GitHub Release
3. Lädt alle Installer/Packages als Release Assets hoch

### Verwendung

```bash
# 1. Version in package.json aktualisieren
npm version 1.2.0

# 2. Änderungen committen
git add package.json package-lock.json
git commit -m "chore: bump version to 1.2.0"

# 3. Tag erstellen und pushen
git tag v1.2.0
git push origin main
git push origin v1.2.0

# 4. GitHub Actions übernimmt den Rest automatisch
```

### Resultat

Nach erfolgreichem Build (ca. 10-15 Minuten):
- Ein neues Release erscheint unter `https://github.com/[username]/TimeLedger/releases`
- Folgende Assets sind verfügbar:

**macOS:**
  - `TimeLedger-[version]-x64.dmg` - Intel Mac Installer
  - `TimeLedger-[version]-arm64.dmg` - Apple Silicon Installer
  - `TimeLedger-[version]-x64-mac.zip` - Intel Mac ZIP
  - `TimeLedger-[version]-arm64-mac.zip` - Apple Silicon ZIP

**Windows:**
  - `TimeLedger Setup [version].exe` - NSIS Installer
  - `TimeLedger [version].exe` - Portable Version

**Linux:**
  - `TimeLedger-[version].AppImage` - Universal Linux Package
  - `timeledger_[version]_amd64.deb` - Debian/Ubuntu Package

### Optional: Code Signing

Um die macOS-App zu signieren:

1. GitHub Repository-Secrets hinzufügen:
   - `APPLE_ID` - Ihre Apple ID E-Mail
   - `APPLE_ID_PASSWORD` - App-spezifisches Passwort von Apple
   - `TEAM_ID` - Ihre Apple Developer Team ID

2. Kommentieren Sie die Signing-Variablen in `release.yml` aus:
   ```yaml
   env:
     APPLE_ID: ${{ secrets.APPLE_ID }}
     APPLE_ID_PASSWORD: ${{ secrets.APPLE_ID_PASSWORD }}
     TEAM_ID: ${{ secrets.TEAM_ID }}
   ```

### Troubleshooting

**Build schlägt fehl:**
- Prüfen Sie die Logs im "Actions" Tab
- Stellen Sie sicher, dass `npm run build` und `npm run dist:mac` lokal funktionieren
- Überprüfen Sie, dass alle Dependencies in `package.json` korrekt sind

**Release wird nicht erstellt:**
- Überprüfen Sie, dass der Tag das Format `v*.*.*` hat
- Stellen Sie sicher, dass Sie Zugriff auf das Repository haben
- Prüfen Sie die GitHub Actions Permissions in den Repository-Einstellungen

**Assets fehlen:**
- Überprüfen Sie, dass der Build erfolgreich war
- Prüfen Sie die Pfade in `release/` Verzeichnis
- Stellen Sie sicher, dass `electron-builder` korrekt konfiguriert ist

## Zukünftige Workflows

Mögliche Erweiterungen:
- **CI Workflow**: Automatische Tests bei jedem Push
- **Multi-Platform Build**: Builds für Windows und Linux
- **Nightly Builds**: Automatische Entwickler-Builds
- **Dependency Updates**: Automatische Dependency-Updates mit Dependabot
