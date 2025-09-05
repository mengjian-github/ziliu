#!/usr/bin/env node
import { writeFileSync, chmodSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

try {
  const hookDir = join(process.cwd(), '.git', 'hooks');
  if (!existsSync(hookDir)) mkdirSync(hookDir, { recursive: true });
  const hookPath = join(hookDir, 'pre-commit');
  const script = `#!/bin/sh
set -e

# 只在 extension/ 有改动时才打包
CHANGED=$(git diff --cached --name-only | grep '^extension/' || true)
if [ -z "$CHANGED" ]; then
  echo "⏭  无 extension 变更，跳过插件打包"
  exit 0
fi

echo "🧩 检测到 extension 变更，开始打包并自动升级补丁版本..."
node scripts/build-extension.mjs --bump

# 将生成物加入提交
git add extension/manifest.json || true
git add public/extension-latest.json || true
git add public/ziliu-extension-v*.zip || true
`;
  writeFileSync(hookPath, script, { encoding: 'utf-8' });
  chmodSync(hookPath, 0o755);
  console.log('✅ Submodule git pre-commit hook installed');
} catch (e) {
  console.error('❌ Failed to install submodule git hook:', e.message);
}
