#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, rmSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const extDir = join(root, 'extension');
const extBuildDir = join(extDir, 'dist');
const publicDir = join(root, 'public');

function getVersion() {
  const manifestPath = join(extDir, 'manifest.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  if (!manifest.version) throw new Error('manifest.json 没有 version 字段');
  return manifest.version;
}

function setVersion(newVersion) {
  const manifestPath = join(extDir, 'manifest.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  manifest.version = newVersion;
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
}

function bumpPatch(version) {
  const m = version.match(/^(\d+)\.(\d+)\.(\d+)(.*)?$/);
  if (!m) return version;
  const major = parseInt(m[1], 10);
  const minor = parseInt(m[2], 10);
  const patch = parseInt(m[3], 10) + 1;
  return `${major}.${minor}.${patch}`;
}

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function cleanOldZips() {
  ensureDir(publicDir);
  const files = readdirSync(publicDir);
  for (const f of files) {
    if (f.startsWith('ziliu-extension-v') && f.endsWith('.zip')) {
      rmSync(join(publicDir, f));
    }
  }
}

function zipExtension(version) {
  const out = join(publicDir, `ziliu-extension-v${version}.zip`);
  const cwd = extBuildDir;

  try {
    // 尝试使用 zip 命令 (Linux/Mac)
    const zipCmd = `zip -r -q ${JSON.stringify(out)} . -x "*.DS_Store" -x "node_modules/*" -x "*.map" -x "*.log"`;
    execSync(zipCmd, { stdio: 'inherit', cwd });
  } catch (e) {
    console.log('zip 命令不可用，尝试使用 PowerShell...');
    try {
      // Windows PowerShell Fallback
      // Compress-Archive requires full paths usually or careful relative paths
      const sourcePath = join(cwd, '*');
      const psCmd = `powershell -Command "Compress-Archive -Path '${sourcePath}' -DestinationPath '${out}' -Force"`;
      execSync(psCmd, { stdio: 'inherit' });
    } catch (pe) {
      console.error('打包失败：系统未提供 zip 命令，且 PowerShell 打包也失败');
      throw pe;
    }
  }
  return out;
}

function writeLatest(version) {
  const latestJson = {
    version,
    filename: `ziliu-extension-v${version}.zip`,
    url: `/ziliu-extension-v${version}.zip`,
    buildAt: new Date().toISOString()
  };
  writeFileSync(join(publicDir, 'extension-latest.json'), JSON.stringify(latestJson, null, 2), 'utf-8');
}

function main() {
  const args = process.argv.slice(2);
  const shouldBump = args.includes('--bump') || args.includes('-b');

  let version = getVersion();
  if (shouldBump) {
    const newVersion = bumpPatch(version);
    if (newVersion !== version) {
      setVersion(newVersion);
      version = newVersion;
      console.log(`🔢 已自动升级版本: v${version}`);
    }
  }
  console.log(`🧩 打包插件版本 v${version}`);

  // 先构建 production 产物（extension/dist），再打包，确保生产包不包含 localhost 权限与调试配置
  try {
    execSync('node ./scripts/build-extension.js production', { stdio: 'inherit', cwd: root });
  } catch (e) {
    console.error('❌ 生产构建失败，无法继续打包');
    throw e;
  }

  cleanOldZips();
  const out = zipExtension(version);
  writeLatest(version);
  console.log(`✅ 生成: ${out}`);
}

main();
