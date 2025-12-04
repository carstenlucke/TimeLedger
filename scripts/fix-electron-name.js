#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const plistPath = path.join(
  __dirname,
  '../node_modules/electron/dist/Electron.app/Contents/Info.plist'
);

if (fs.existsSync(plistPath)) {
  let plist = fs.readFileSync(plistPath, 'utf8');

  // Replace CFBundleDisplayName
  plist = plist.replace(
    /<key>CFBundleDisplayName<\/key>\s*<string>Electron<\/string>/,
    '<key>CFBundleDisplayName</key>\n\t<string>TimeLedger</string>'
  );

  // Replace CFBundleName
  plist = plist.replace(
    /<key>CFBundleName<\/key>\s*<string>Electron<\/string>/,
    '<key>CFBundleName</key>\n\t<string>TimeLedger</string>'
  );

  // Replace CFBundleIdentifier
  plist = plist.replace(
    /<key>CFBundleIdentifier<\/key>\s*<string>com\.github\.Electron<\/string>/,
    '<key>CFBundleIdentifier</key>\n\t<string>com.timeledger.app</string>'
  );

  fs.writeFileSync(plistPath, plist, 'utf8');
  console.log('✓ Updated Electron app name to TimeLedger');
} else {
  console.log('✗ Electron Info.plist not found');
}
