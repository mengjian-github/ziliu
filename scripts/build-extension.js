#!/usr/bin/env node

/**
 * 字流插件构建脚本
 * 根据环境变量替换配置文件中的URL
 */

const fs = require('fs');
const path = require('path');

// 读取环境变量
function loadEnv(envPath) {
  if (!fs.existsSync(envPath)) {
    console.warn(`⚠️ 环境文件不存在: ${envPath}`);
    return {};
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  
  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#') && line.includes('=')) {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=').trim();
      env[key.trim()] = value;
    }
  });

  return env;
}

// 替换文件中的占位符
function replaceInFile(filePath, replacements) {
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️ 文件不存在: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;

  Object.entries(replacements).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    if (content.includes(placeholder)) {
      content = content.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
      hasChanges = true;
    }
  });

  if (hasChanges) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ 已更新: ${filePath}`);
  }
}

function main() {
  const args = process.argv.slice(2);
  const environment = args[0] || 'development';
  
  console.log(`🔧 构建字流插件 - 环境: ${environment}`);

  // 加载环境配置
  const envFile = environment === 'production' 
    ? path.join(__dirname, '../extension/.env.production')
    : path.join(__dirname, '../extension/.env');

  const env = loadEnv(envFile);
  
  if (!env.ZILIU_API_BASE_URL || !env.ZILIU_SITE_URL) {
    console.error('❌ 环境配置不完整，请检查 .env 文件');
    console.log('需要的变量: ZILIU_API_BASE_URL, ZILIU_SITE_URL');
    process.exit(1);
  }

  console.log(`📍 API地址: ${env.ZILIU_API_BASE_URL}`);
  console.log(`🌐 站点地址: ${env.ZILIU_SITE_URL}`);

  // 需要替换的文件和占位符
  const replacements = {
    ZILIU_API_BASE_URL: env.ZILIU_API_BASE_URL,
    ZILIU_SITE_URL: env.ZILIU_SITE_URL
  };

  const extensionDir = path.join(__dirname, '../extension');
  
  // 替换配置文件
  const filesToProcess = [
    path.join(extensionDir, 'core/constants.js'),
    path.join(extensionDir, 'background.js'),
    path.join(extensionDir, 'core/api-service.js'),
    path.join(extensionDir, 'core/config-service.js'),
    path.join(extensionDir, 'ui/features.js'),
    path.join(extensionDir, 'ui/subscription-status.js')
  ];

  filesToProcess.forEach(filePath => {
    replaceInFile(filePath, replacements);
  });

  console.log('🎉 构建完成!');
}

if (require.main === module) {
  main();
}

module.exports = { loadEnv, replaceInFile };