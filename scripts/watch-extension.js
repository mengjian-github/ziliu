#!/usr/bin/env node

/**
 * Chrome 插件开发 Watch 模式：
 * - 监听 extension/ 源码变化
 * - 自动重建到 extension/dist-dev（或指定环境）
 *
 * 说明：只负责“自动编译/复制产物”；Chrome 扩展仍需在 chrome://extensions/ 中手动点“重新加载”。
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const root = path.join(__dirname, '..');
const extDir = path.join(root, 'extension');

const args = process.argv.slice(2);
const environment = (args[0] && !args[0].startsWith('-')) ? args[0] : 'development';

const ignoreDirNames = new Set([
  'dist',
  'dist-dev',
  'build',
  '.output',
  'node_modules',
  '.git'
]);

const buildArgs = ['scripts/build-extension.js', environment];

const watchers = new Map();
let buildTimer = null;
let scanTimer = null;
let building = false;
let buildQueued = false;

function listDirs(rootDir) {
  const result = [];
  const queue = [rootDir];

  while (queue.length > 0) {
    const dir = queue.pop();
    result.push(dir);

    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (_) {
      continue;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (ignoreDirNames.has(entry.name)) continue;

      queue.push(path.join(dir, entry.name));
    }
  }

  return result;
}

function shouldIgnoreEvent(watchedDir, filename) {
  if (!filename) return false;
  const name = String(filename);
  if (name === '.DS_Store') return true;

  // 重要：构建时会删除/重建 dist-dev/dist，extension 根目录会收到 rename 事件；需要忽略否则会无限触发重建
  if (watchedDir === extDir && ignoreDirNames.has(name)) return true;

  return false;
}

function runBuild() {
  if (building) {
    buildQueued = true;
    return;
  }

  building = true;
  const startedAt = Date.now();
  console.log(`[ext:watch] build start (${environment})`);

  const child = spawn(process.execPath, buildArgs, { cwd: root, stdio: 'inherit' });
  child.on('exit', (code) => {
    const ms = Date.now() - startedAt;
    building = false;

    if (code === 0) {
      console.log(`[ext:watch] build done in ${ms}ms`);
    } else {
      console.error(`[ext:watch] build failed (exit ${code}) in ${ms}ms`);
    }

    if (buildQueued) {
      buildQueued = false;
      scheduleBuild();
    }
  });
}

function scheduleBuild() {
  clearTimeout(buildTimer);
  buildTimer = setTimeout(runBuild, 250);
}

function scanAndWatch() {
  const dirs = listDirs(extDir);
  const dirSet = new Set(dirs);

  // add watchers
  for (const dir of dirs) {
    if (watchers.has(dir)) continue;
    try {
      const watcher = fs.watch(dir, { persistent: true }, (eventType, filename) => {
        if (shouldIgnoreEvent(dir, filename)) return;
        if (eventType === 'rename') scheduleScan();
        scheduleBuild();
      });
      watchers.set(dir, watcher);
    } catch (e) {
      console.warn('[ext:watch] watch failed:', dir, e?.message || e);
    }
  }

  // cleanup removed dirs
  for (const [dir, watcher] of watchers.entries()) {
    if (dirSet.has(dir)) continue;
    try { watcher.close(); } catch (_) {}
    watchers.delete(dir);
  }
}

function scheduleScan() {
  clearTimeout(scanTimer);
  scanTimer = setTimeout(scanAndWatch, 500);
}

function shutdown() {
  for (const watcher of watchers.values()) {
    try { watcher.close(); } catch (_) {}
  }
  watchers.clear();
}

process.on('SIGINT', () => {
  console.log('\n[ext:watch] stopped');
  shutdown();
  process.exit(0);
});
process.on('SIGTERM', () => {
  shutdown();
  process.exit(0);
});

console.log(`[ext:watch] watching: ${extDir}`);
console.log(`[ext:watch] environment: ${environment}`);
console.log(`[ext:watch] output: ${environment === 'production' ? 'extension/dist' : 'extension/dist-dev'}`);

scanAndWatch();
runBuild();

