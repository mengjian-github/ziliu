#!/usr/bin/env node

/**
 * 字流插件构建脚本（无打包器版本）
 *
 * 目标：生成“可直接加载的本地构建产物”，通过构建期配置区分 dev/prod，
 * 避免线上运行时探测 localhost 带来的问题。
 *
 * 输出目录：
 * - development -> extension/dist-dev
 * - production  -> extension/dist
 */

const fs = require('fs');
const path = require('path');

function parseDotEnv(content) {
  const env = {};
  content.split('\n').forEach(rawLine => {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) return;
    const eq = line.indexOf('=');
    if (eq === -1) return;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    // 支持简单的引号包裹
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  });
  return env;
}

function loadEnvFromFile(envPath) {
  if (!envPath || !fs.existsSync(envPath)) return {};
  return parseDotEnv(fs.readFileSync(envPath, 'utf8'));
}

function normalizeBaseUrl(url) {
  if (!url) return url;
  const trimmed = String(url).trim();
  return trimmed.replace(/\/+$/, '');
}

function mergeEnv(fileEnv) {
  // 支持两套命名：ZILIU_*（本脚本）与 VITE_ZILIU_*（历史/兼容）
  const merged = { ...fileEnv, ...process.env };
  const apiBaseUrl = merged.ZILIU_API_BASE_URL || merged.VITE_ZILIU_API_BASE_URL;
  const siteUrl = merged.ZILIU_SITE_URL || merged.VITE_ZILIU_SITE_URL;

  return {
    ZILIU_API_BASE_URL: normalizeBaseUrl(apiBaseUrl),
    ZILIU_SITE_URL: normalizeBaseUrl(siteUrl)
  };
}

function cleanDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function copyExtensionSource(srcDir, outDir) {
  const excludeTopLevel = new Set([
    'dist',
    'dist-dev',
    'build',
    '.output',
    'node_modules'
  ]);

  // 注意：Node 的 fs.cpSync 不允许把目录拷贝到其子目录（会触发自拷贝检查）。
  // 因为我们的输出目录位于 extension/ 内部，所以这里按“顶层条目”逐个拷贝，避免自拷贝。
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    if (excludeTopLevel.has(entry.name)) continue;
    if (entry.name.startsWith('.env')) continue;
    if (entry.name === '.DS_Store') continue;

    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(outDir, entry.name);

    fs.cpSync(srcPath, destPath, {
      recursive: true,
      filter: (src) => {
        const base = path.basename(src);
        if (base.startsWith('.env')) return false;
        if (base === '.DS_Store') return false;
        return true;
      }
    });
  }
}

function replaceTokensInFile(filePath, replacements) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`构建失败：找不到文件 ${filePath}`);
  }

  let content = fs.readFileSync(filePath, 'utf8');
  for (const [token, value] of Object.entries(replacements)) {
    content = content.replaceAll(token, value);
  }
  fs.writeFileSync(filePath, content, 'utf8');
}

function patchManifest(outManifestPath, environment) {
  const manifest = JSON.parse(fs.readFileSync(outManifestPath, 'utf8'));

  if (environment === 'development') {
    if (typeof manifest.name === 'string' && !manifest.name.includes('(Dev)')) {
      manifest.name = `${manifest.name} (Dev)`;
    }
  }

  if (environment === 'production') {
    // 生产构建移除 localhost 权限与匹配，避免任何“线上误触发本地”相关风险
    if (Array.isArray(manifest.host_permissions)) {
      manifest.host_permissions = manifest.host_permissions.filter(p => !String(p).includes('localhost'));
    }
    if (Array.isArray(manifest.content_scripts)) {
      manifest.content_scripts = manifest.content_scripts.filter(cs => {
        const matches = Array.isArray(cs.matches) ? cs.matches : [];
        return !matches.some(m => String(m).includes('localhost'));
      });
    }
  }

  fs.writeFileSync(outManifestPath, JSON.stringify(manifest, null, 2), 'utf8');
}

function main() {
  const args = process.argv.slice(2);
  const environment = args[0] || 'development';
  
  console.log(`🔧 构建字流插件 - 环境: ${environment}`);

  // 加载环境配置
  const extDir = path.join(__dirname, '../extension');
  const envFile = environment === 'production'
    ? path.join(extDir, '.env.production')
    : path.join(extDir, '.env');

  const env = mergeEnv(loadEnvFromFile(envFile));
  
  if (!env.ZILIU_API_BASE_URL || !env.ZILIU_SITE_URL) {
    console.error('❌ 环境配置不完整，请检查 .env 文件');
    console.log('需要的变量: ZILIU_API_BASE_URL, ZILIU_SITE_URL');
    console.log(`建议：复制 ${path.join(extDir, '.env.example')} 到 ${envFile} 后修改`);
    process.exit(1);
  }

  console.log(`📍 API地址: ${env.ZILIU_API_BASE_URL}`);
  console.log(`🌐 站点地址: ${env.ZILIU_SITE_URL}`);

  const outDir = environment === 'production'
    ? path.join(extDir, 'dist')
    : path.join(extDir, 'dist-dev');

  cleanDir(outDir);
  copyExtensionSource(extDir, outDir);

  // 构建期注入常量（避免运行时探测 localhost）
  replaceTokensInFile(path.join(outDir, 'core/constants.js'), {
    '__ZILIU_BUILD_ENV__': environment,
    '__ZILIU_API_BASE_URL__': env.ZILIU_API_BASE_URL,
    '__ZILIU_SITE_URL__': env.ZILIU_SITE_URL
  });

  patchManifest(path.join(outDir, 'manifest.json'), environment);

  console.log('🎉 构建完成!');
  console.log(`📦 输出目录: ${outDir}`);
  console.log('➡️ 在 Chrome 打开 chrome://extensions/，开启开发者模式，选择“加载已解压的扩展程序”，指向上述输出目录。');
}

if (require.main === module) {
  main();
}

module.exports = {
  parseDotEnv,
  loadEnvFromFile,
  replaceTokensInFile,
  normalizeBaseUrl
};
