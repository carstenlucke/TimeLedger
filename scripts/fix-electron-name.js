#!/usr/bin/env node

/**
 * fix-electron-name.js
 *
 * Purpose:
 * This script fixes an issue in the development environment of Electron apps on macOS.
 * By default, Electron shows "Electron" as the app name in the Dock, menu bar, and system
 * dialogs during development, instead of the actual app name.
 *
 * What this script does:
 * - Opens the Info.plist file of the installed Electron binary
 * - Replaces "Electron" with "TimeLedger" in the following fields:
 *   * CFBundleDisplayName: The name shown in the Dock and menu bar
 *   * CFBundleName: The internal bundle name of the application
 *   * CFBundleIdentifier: The unique bundle ID (from com.github.Electron to com.timeledger.app)
 *
 * When it runs:
 * - After installing npm dependencies (postinstall hook)
 * - Can be run manually: node scripts/fix-electron-name.js
 *
 * Note:
 * This only affects the development environment. The final app bundle is correctly built
 * by electron-builder using the settings from package.json.
 */

const fs = require('fs');
const path = require('path');

// Path to the Info.plist of the Electron development binary
const plistPath = path.join(
  __dirname,
  '../node_modules/electron/dist/Electron.app/Contents/Info.plist'
);

// Check if the Info.plist exists (only present on macOS)
if (fs.existsSync(plistPath)) {
  // Load the current plist file
  let plist = fs.readFileSync(plistPath, 'utf8');

  // Replace CFBundleDisplayName: Name shown in Dock and menu bar
  plist = plist.replace(
    /<key>CFBundleDisplayName<\/key>\s*<string>Electron<\/string>/,
    '<key>CFBundleDisplayName</key>\n\t<string>TimeLedger</string>'
  );

  // Replace CFBundleName: Internal bundle name
  plist = plist.replace(
    /<key>CFBundleName<\/key>\s*<string>Electron<\/string>/,
    '<key>CFBundleName</key>\n\t<string>TimeLedger</string>'
  );

  // Replace CFBundleIdentifier: Unique app ID for macOS
  plist = plist.replace(
    /<key>CFBundleIdentifier<\/key>\s*<string>com\.github\.Electron<\/string>/,
    '<key>CFBundleIdentifier</key>\n\t<string>com.timeledger.app</string>'
  );

  // Save the modified plist back
  fs.writeFileSync(plistPath, plist, 'utf8');
  console.log('✓ Updated Electron app name to TimeLedger');
} else {
  console.log('✗ Electron Info.plist not found');
}
