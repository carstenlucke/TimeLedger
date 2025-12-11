#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const releaseDir = path.join(__dirname, '..', 'release');

function cleanReleaseArtifacts() {
  if (!fs.existsSync(releaseDir)) {
    return;
  }

  for (const entry of fs.readdirSync(releaseDir)) {
    if (!/(\.blockmap|\.yml)$/i.test(entry)) {
      continue;
    }

    const absolutePath = path.join(releaseDir, entry);
    try {
      fs.rmSync(absolutePath, { force: true });
      console.log(`Removed ${path.relative(process.cwd(), absolutePath)}`);
    } catch (err) {
      console.warn(`Failed to remove ${absolutePath}:`, err.message);
    }
  }
}

function rebuildNativeModules() {
  const arch = process.arch;
  const env = {
    ...process.env,
    npm_config_arch: arch,
    npm_config_target_arch: arch,
  };

  const electronRebuildBin = path.resolve(
    __dirname,
    '..',
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'electron-rebuild.cmd' : 'electron-rebuild'
  );

  console.log(`Running electron-rebuild for local arch: ${arch}`);
  const result = spawnSync(
    electronRebuildBin,
    ['--arch', arch, '--force'],
    { stdio: 'inherit', env }
  );

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

cleanReleaseArtifacts();
rebuildNativeModules();
