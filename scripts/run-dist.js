#!/usr/bin/env node

const path = require('path');
const { spawn } = require('child_process');

const args = process.argv.slice(2);
const builderBin = path.resolve(
  __dirname,
  '..',
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'electron-builder.cmd' : 'electron-builder'
);
const postDistScript = path.resolve(__dirname, 'postdist.js');

function spawnProcess(command, commandArgs) {
  return spawn(command, commandArgs, { stdio: 'inherit' });
}

function runPostDist(initialExitCode) {
  const child = spawnProcess(process.execPath, [postDistScript]);
  child.on('close', (postCode) => {
    if (initialExitCode !== 0) {
      process.exit(initialExitCode);
    }
    process.exit(postCode ?? 0);
  });
}

const builder = spawnProcess(builderBin, args);

builder.on('close', (code, signal) => {
  if (signal) {
    console.error(`electron-builder terminated with signal ${signal}`);
  }
  runPostDist(code ?? 0);
});

builder.on('error', (err) => {
  console.error('Failed to start electron-builder:', err);
  runPostDist(1);
});
